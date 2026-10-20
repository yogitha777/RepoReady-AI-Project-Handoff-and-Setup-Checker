import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Strict schema and type validator for model responses
function validateExplanationPayload(obj: any): {
  valid: boolean;
  explanation?: {
    beginnerExplanation: string;
    whyItMatters: string;
    actionableSteps: string[];
    verificationCommand: string;
  };
  error?: string;
} {
  if (!obj || typeof obj !== 'object') {
    return { valid: false, error: 'Model response is not a valid JSON object' };
  }

  const beginnerExplanation =
    typeof obj.beginnerExplanation === 'string' ? obj.beginnerExplanation.trim() : '';
  const whyItMatters =
    typeof obj.whyItMatters === 'string' ? obj.whyItMatters.trim() : '';

  let actionableSteps: string[] = [];
  if (Array.isArray(obj.actionableSteps)) {
    actionableSteps = obj.actionableSteps
      .filter((s: any) => typeof s === 'string' && s.trim().length > 0)
      .map((s: string) => s.trim());
  } else if (typeof obj.actionableSteps === 'string' && obj.actionableSteps.trim().length > 0) {
    actionableSteps = [obj.actionableSteps.trim()];
  }

  const verificationCommand =
    typeof obj.verificationCommand === 'string' && obj.verificationCommand.trim().length > 0
      ? obj.verificationCommand.trim()
      : 'git status';

  if (!beginnerExplanation || !whyItMatters || actionableSteps.length === 0) {
    return {
      valid: false,
      error: 'Model response is missing required fields (beginnerExplanation, whyItMatters, or actionableSteps)'
    };
  }

  return {
    valid: true,
    explanation: {
      beginnerExplanation,
      whyItMatters,
      actionableSteps,
      verificationCommand
    }
  };
}

function createAiMiddleware() {
  return async (req: any, res: any, next: any) => {
    if (!req.url) return next();

    // 1. GET /api/ai-status
    if (req.method === 'GET' && req.url.startsWith('/api/ai-status')) {
      const geminiKey = process.env.GEMINI_API_KEY;
      const openaiKey = process.env.OPENAI_API_KEY;

      let provider: 'gemini' | 'openai' | 'none' = 'none';
      let model = 'none';

      if (geminiKey) {
        provider = 'gemini';
        model = 'gemini-1.5-flash';
      } else if (openaiKey) {
        provider = 'openai';
        model = 'gpt-4o-mini';
      }

      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          configured: provider !== 'none',
          keyConfigured: provider !== 'none',
          provider,
          model,
          deploymentMode: 'vite-middleware',
          productionNotice:
            'Vite server middleware active. In static hosting environments (e.g. GitHub Pages or S3), server middleware is unavailable and RepoReady operates in deterministic fallback mode without sending code externally.',
          message:
            provider !== 'none'
              ? `API Key Configured: ${provider.toUpperCase()} (${model}). Live model availability will be tested on request.`
              : 'AI Provider Not Configured. Set GEMINI_API_KEY or OPENAI_API_KEY in environment to enable live AI Issue Explanations.'
        })
      );
      return;
    }

    // 2. POST /api/ai-explain
    if (req.method === 'POST' && req.url.startsWith('/api/ai-explain')) {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });

      req.on('end', async () => {
        res.setHeader('Content-Type', 'application/json');

        let parsed: any;
        try {
          parsed = JSON.parse(body);
        } catch (err) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Invalid JSON request body' }));
          return;
        }

        const finding = parsed.finding;
        if (!finding || !finding.title || !finding.category) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing required finding fields' }));
          return;
        }

        const geminiKey = process.env.GEMINI_API_KEY;
        const openaiKey = process.env.OPENAI_API_KEY;

        // Structured, grounded deterministic fallback object
        const fallback = {
          beginnerExplanation: `This finding warns that ${finding.title.toLowerCase()}. New developers receiving this repository need explicit documentation to set up dependencies and verify functionality.`,
          whyItMatters:
            finding.whyItMatters ||
            'Incomplete documentation causes onboarding friction and setup failures on clean checkouts.',
          actionableSteps: [
            `Review ${finding.fileSource || 'the relevant configuration file'}.`,
            'Follow the recommended corrective action to update documentation or configuration.',
            'Verify with git diff that changes are properly committed.'
          ],
          verificationCommand: finding.category === 'testing' ? 'npm test' : 'git status',
          modelUsed: 'Deterministic Fallback Rule Engine (AI Offline)',
          generatedAt: new Date().toISOString(),
          isFallback: true
        };

        // If no API key configured, return unconfigured status with fallback
        if (!geminiKey && !openaiKey) {
          res.end(
            JSON.stringify({
              configured: false,
              keyConfigured: false,
              provider: 'none',
              model: 'none',
              message:
                'AI Provider Not Configured. Set GEMINI_API_KEY or OPENAI_API_KEY in your environment to enable live AI Issue Explanations.',
              fallback
            })
          );
          return;
        }

        // Sanitize evidence: strip out potential secrets before transmitting to external LLM
        const sanitizedEvidence = String(finding.evidence || '')
          .replace(/([a-zA-Z0-9_]{16,})/g, '[REDACTED_TOKEN]')
          .replace(/(postgres|mysql|mongodb)(\+srv)?:\/\/[^\s]+/gi, '[REDACTED_CONNECTION_STRING]');

        try {
          if (geminiKey) {
            // Real Gemini API Call with 8-second timeout guard
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);

            const prompt = `You are a developer tooling assistant for RepoReady. Given this repository finding:
Category: ${finding.category}
Severity: ${finding.severity}
Title: ${finding.title}
File: ${finding.fileSource}
Evidence: ${sanitizedEvidence}
Rule: ${finding.ruleId}

Explain ONLY this specific finding. Do NOT invent files, commit history, or test results not in the evidence.
Return a valid JSON object ONLY with these exact 4 keys:
{
  "beginnerExplanation": "Clear, beginner-friendly explanation of what is missing or broken",
  "whyItMatters": "Why this specific gap blocks or frustrates an incoming developer",
  "actionableSteps": ["Step 1", "Step 2", "Step 3"],
  "verificationCommand": "A single shell command or git check to verify the fix"
}`;

            const apiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                  generationConfig: {
                    temperature: 0.2,
                    responseMimeType: 'application/json'
                  }
                }),
                signal: controller.signal
              }
            );
            clearTimeout(timeout);

            if (!apiRes.ok) {
              throw new Error(`Gemini API returned HTTP ${apiRes.status}`);
            }

            const geminiData = (await apiRes.json()) as any;
            const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) {
              throw new Error('Empty text response from Gemini');
            }

            let structured: any;
            try {
              structured = JSON.parse(text);
            } catch (err: any) {
              throw new Error(`Gemini response is not valid JSON: ${err.message}`);
            }

            const validation = validateExplanationPayload(structured);
            if (!validation.valid || !validation.explanation) {
              throw new Error(`Gemini response validation failed: ${validation.error}`);
            }

            res.end(
              JSON.stringify({
                configured: true,
                liveAvailable: true,
                provider: 'gemini',
                model: 'gemini-1.5-flash',
                explanation: {
                  ...validation.explanation,
                  modelUsed: 'Google Gemini 1.5 Flash (Live Server Integration)',
                  generatedAt: new Date().toISOString(),
                  isFallback: false
                }
              })
            );
            return;
          } else if (openaiKey) {
            // Real OpenAI API Call with 8-second timeout guard
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);

            const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiKey}`
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                temperature: 0.2,
                response_format: { type: 'json_object' },
                messages: [
                  {
                    role: 'system',
                    content:
                      'You are a developer tooling assistant for RepoReady. Respond with valid JSON containing beginnerExplanation, whyItMatters, actionableSteps (array), verificationCommand.'
                  },
                  {
                    role: 'user',
                    content: `Title: ${finding.title}\nCategory: ${finding.category}\nEvidence: ${sanitizedEvidence}`
                  }
                ]
              }),
              signal: controller.signal
            });
            clearTimeout(timeout);

            if (!apiRes.ok) {
              throw new Error(`OpenAI API returned HTTP ${apiRes.status}`);
            }

            const openAiData = (await apiRes.json()) as any;
            const text = openAiData.choices?.[0]?.message?.content;
            if (!text) {
              throw new Error('Empty response content from OpenAI');
            }

            let structured: any;
            try {
              structured = JSON.parse(text);
            } catch (err: any) {
              throw new Error(`OpenAI response is not valid JSON: ${err.message}`);
            }

            const validation = validateExplanationPayload(structured);
            if (!validation.valid || !validation.explanation) {
              throw new Error(`OpenAI response validation failed: ${validation.error}`);
            }

            res.end(
              JSON.stringify({
                configured: true,
                liveAvailable: true,
                provider: 'openai',
                model: 'gpt-4o-mini',
                explanation: {
                  ...validation.explanation,
                  modelUsed: 'OpenAI GPT-4o-mini (Live Server Integration)',
                  generatedAt: new Date().toISOString(),
                  isFallback: false
                }
              })
            );
            return;
          }
        } catch (apiErr: any) {
          // Return graceful fallback with explicit error note (never expose API keys or stack traces)
          res.end(
            JSON.stringify({
              configured: true,
              liveAvailable: false,
              error: `Live AI generation unavailable: ${apiErr.message}`,
              fallback
            })
          );
        }
      });
      return;
    }

    next();
  };
}

function aiExplainerPlugin(): Plugin {
  return {
    name: 'ai-explainer-server-middleware',
    configureServer(server) {
      server.middlewares.use(createAiMiddleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(createAiMiddleware());
    }
  };
}

export default defineConfig({
  plugins: [react(), aiExplainerPlugin()]
});
