import type { Finding, AIExplanation, AIProviderStatus } from '../types';

// Client-side structure and type validator for AI explanations
export function validateAIExplanationStructure(data: any): {
  valid: boolean;
  validated?: AIExplanation;
  error?: string;
} {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Response is not a valid JSON object' };
  }

  const beginnerExplanation =
    typeof data.beginnerExplanation === 'string' ? data.beginnerExplanation.trim() : '';
  const whyItMatters =
    typeof data.whyItMatters === 'string' ? data.whyItMatters.trim() : '';

  let actionableSteps: string[] = [];
  if (Array.isArray(data.actionableSteps)) {
    actionableSteps = data.actionableSteps
      .filter((s: any) => typeof s === 'string' && s.trim().length > 0)
      .map((s: string) => s.trim());
  } else if (typeof data.actionableSteps === 'string' && data.actionableSteps.trim().length > 0) {
    actionableSteps = [data.actionableSteps.trim()];
  }

  const verificationCommand =
    typeof data.verificationCommand === 'string' && data.verificationCommand.trim().length > 0
      ? data.verificationCommand.trim()
      : 'git status';

  if (!beginnerExplanation) {
    return { valid: false, error: 'Missing or empty beginnerExplanation field' };
  }
  if (!whyItMatters) {
    return { valid: false, error: 'Missing or empty whyItMatters field' };
  }
  if (actionableSteps.length === 0) {
    return { valid: false, error: 'Missing or empty actionableSteps array' };
  }

  return {
    valid: true,
    validated: {
      beginnerExplanation,
      whyItMatters,
      actionableSteps,
      verificationCommand,
      modelUsed: typeof data.modelUsed === 'string' ? data.modelUsed : 'AI Model',
      generatedAt: typeof data.generatedAt === 'string' ? data.generatedAt : new Date().toISOString(),
      isFallback: Boolean(data.isFallback),
      validationPassed: true
    }
  };
}

export async function checkAIProviderStatus(): Promise<AIProviderStatus> {
  try {
    const res = await fetch('/api/ai-status', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) {
      return {
        configured: false,
        keyConfigured: false,
        liveAvailable: false,
        provider: 'none',
        model: 'none',
        deploymentMode: 'static-production',
        productionNotice:
          'Static production hosting detected without active server middleware. AI requests will automatically use client-side deterministic guidance.',
        message: `AI service endpoint returned HTTP ${res.status}. Operating in local deterministic mode.`
      };
    }
    const data = await res.json();
    return {
      configured: Boolean(data.configured),
      keyConfigured: Boolean(data.keyConfigured ?? data.configured),
      liveAvailable: Boolean(data.liveAvailable),
      provider: data.provider || 'none',
      model: data.model || 'none',
      deploymentMode: data.deploymentMode || 'vite-middleware',
      productionNotice: data.productionNotice,
      message: data.message || 'AI Provider Status checked.'
    };
  } catch (err: any) {
    return {
      configured: false,
      keyConfigured: false,
      liveAvailable: false,
      provider: 'none',
      model: 'none',
      deploymentMode: 'static-production',
      productionNotice:
        'AI backend endpoint unreachable. Running in local deterministic fallback mode without external network calls.',
      message: 'AI backend endpoint unreachable. Running in local deterministic fallback mode.'
    };
  }
}

export async function requestAIExplanation(
  finding: Finding,
  projectName: string = 'Project'
): Promise<{ explanation: AIExplanation; fromLiveAI: boolean; error?: string }> {
  try {
    const res = await fetch('/api/ai-explain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        finding: {
          id: finding.id,
          title: finding.title,
          category: finding.category,
          severity: finding.severity,
          evidence: finding.evidence,
          fileSource: finding.fileSource
        },
        projectName
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.configured && data.explanation) {
        // Validate payload structure and types before display
        const validation = validateAIExplanationStructure(data.explanation);
        if (validation.valid && validation.validated) {
          return {
            explanation: {
              ...validation.validated,
              modelUsed: data.model === 'gemini-1.5-flash'
                ? 'Google Gemini 1.5 Flash (Live Server Integration)'
                : data.model === 'gpt-4o-mini'
                ? 'OpenAI GPT-4o-mini (Live Server Integration)'
                : (data.model || 'Live LLM Provider'),
              generatedAt: new Date().toISOString(),
              isFallback: false,
              validationPassed: true
            },
            fromLiveAI: true
          };
        } else {
          // Model response failed validation - fallback gracefully
          const fallback = generateDeterministicFallback(finding);
          return {
            explanation: {
              ...fallback,
              validationPassed: false,
              error: validation.error
            },
            fromLiveAI: false,
            error: `Model returned invalid format: ${validation.error}. Deterministic guidance displayed.`
          };
        }
      } else if (data.fallback) {
        return {
          explanation: {
            ...data.fallback,
            modelUsed: 'Deterministic Fallback Heuristic (AI Provider Not Configured)',
            generatedAt: new Date().toISOString(),
            isFallback: true,
            validationPassed: true
          },
          fromLiveAI: false,
          error: data.error || data.message || 'AI provider not configured in environment.'
        };
      }
    }
  } catch (err: any) {
    // Fallback if request fails, aborts, or times out
  }

  // Graceful deterministic fallback
  const fallback = generateDeterministicFallback(finding);
  return {
    explanation: fallback,
    fromLiveAI: false,
    error: 'AI service unavailable or unconfigured. Displaying grounded deterministic guidance.'
  };
}

// Transparent, grounded deterministic fallback explanation
export function generateDeterministicFallback(finding: Finding): AIExplanation {
  const steps: string[] = [];
  let verification = 'npm test';

  if (finding.category === 'installation') {
    steps.push('Open README.md in your repository root.');
    steps.push('Add an explicit "Getting Started" or "Installation" section.');
    steps.push(finding.suggestedFix);
    verification = 'git diff README.md && npm install --dry-run';
  } else if (finding.category === 'environment') {
    steps.push('Review required environment variables declared in .env.example.');
    steps.push('Ensure README documents the purpose and default format for each variable.');
    steps.push('Replace any real credentials with safe dummy placeholders (e.g., your_password_here).');
    verification = 'grep -E "SECRET|KEY|PASSWORD" .env.example';
  } else if (finding.category === 'dependencies') {
    steps.push(`Inspect ${finding.fileSource} for missing or malformed declarations.`);
    steps.push(finding.suggestedFix);
    steps.push('Verify that package manager commands parse without syntax errors.');
    verification = finding.fileSource.includes('package.json') ? 'npm pkg get name' : 'pip check';
  } else if (finding.category === 'testing') {
    steps.push('Add a dedicated "Running Tests" section to README.md.');
    steps.push('Configure a standard test runner script in your configuration.');
    verification = 'npm test';
  } else {
    steps.push('Update the repository documentation to include onboarding prerequisites.');
    steps.push(finding.suggestedFix);
    verification = 'git status';
  }

  return {
    beginnerExplanation: `This finding indicates that ${finding.title.toLowerCase()}. Onboarding engineers rely on this information to initialize and run the repository without guesswork.`,
    whyItMatters: finding.whyItMatters,
    actionableSteps: steps,
    verificationCommand: verification,
    modelUsed: 'Deterministic Fallback Rule Engine (AI Offline)',
    generatedAt: new Date().toISOString(),
    isFallback: true,
    validationPassed: true
  };
}
