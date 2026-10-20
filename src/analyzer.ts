import type {
  FileKey,
  FileStatus,
  Finding,
  FindingCategory,
  FindingSeverity,
  IssueStatus,
  AIExplanation,
  ProjectFiles,
  ScoreBreakdown,
  AnalysisResult,
  CategoryScore
} from './types';

// Helper to extract env var names from .env.example
function extractEnvVariables(envContent: string): string[] {
  const vars: string[] = [];
  const lines = envContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Z0-9_]+)\s*=/i);
    if (match) {
      vars.push(match[1]);
    }
  }
  return vars;
}

// Heuristic check for sensitive secrets in .env.example
function detectSecretLeaks(envContent: string): { key: string; value: string; line: string }[] {
  const leaks: { key: string; value: string; line: string }[] = [];
  const lines = envContent.split('\n');

  const placeholderPatterns = [
    /placeholder/i,
    /your_/i,
    /changeme/i,
    /replace_with/i,
    /example/i,
    /dummy/i,
    /<.*>/,
    /xxx/i,
    /todo/i
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Z0-9_]+)\s*=\s*(.+)$/i);
    if (match) {
      const key = match[1];
      const val = match[2].trim();

      const isPlaceholder = placeholderPatterns.some((pattern) => pattern.test(val));
      const isSensitiveKey = /(SECRET|PASSWORD|PASS|TOKEN|KEY|CREDENTIAL)/i.test(key);
      const isConnectionStringWithPass = /postgres:\/\/.*:.*@|mongodb(\+srv)?:\/\/.*:.*@|mysql:\/\/.*:.*@/i.test(val);
      const isActualSecretVal =
        (val.length > 12 && !isPlaceholder && !/localhost|127\.0\.0\.1/.test(val) && (isSensitiveKey || isConnectionStringWithPass));

      if (isActualSecretVal || (isSensitiveKey && val.length > 8 && !isPlaceholder)) {
        leaks.push({ key, value: val, line: trimmed });
      }
    }
  }
  return leaks;
}

// Parse package.json safely
function parsePackageJson(content: string): { parsed: any; error: string | null } {
  if (!content.trim()) return { parsed: null, error: 'Empty file' };
  try {
    const parsed = JSON.parse(content);
    return { parsed, error: null };
  } catch (err: any) {
    return { parsed: null, error: err.message || 'Invalid JSON syntax' };
  }
}

export function analyzeProject(
  files: ProjectFiles,
  fileStatuses: Record<FileKey, FileStatus>,
  userIssueStatuses: Record<string, IssueStatus> = {},
  aiExplanations: Record<string, AIExplanation> = {}
): AnalysisResult {
  const findings: Finding[] = [];
  const seenFindingIds = new Set<string>();

  const checksPerformed: string[] = [];
  const checksNotPerformed: string[] = [];

  const readme = files.readme || '';
  const packageContent = files.packageJson || '';
  const requirementsContent = files.requirementsTxt || '';
  const envContent = files.envExample || '';
  const testContent = files.testConfig || '';

  const { parsed: pkgJson, error: pkgJsonError } = parsePackageJson(packageContent);

  // Helper to deduplicate findings
  function addFinding(finding: Omit<Finding, 'issueStatus' | 'aiExplanation'>) {
    if (seenFindingIds.has(finding.id)) return;
    seenFindingIds.add(finding.id);

    const issueStatus = userIssueStatuses[finding.id] || 'open';
    const aiExplanation = aiExplanations[finding.id];

    findings.push({
      ...finding,
      issueStatus,
      aiExplanation
    });
  }

  // -------------------------------------------------------------
  // 1. INSTALLATION & GETTING STARTED
  // -------------------------------------------------------------
  if (fileStatuses.readme === 'provided') {
    checksPerformed.push('INST-001: README.md presence and length check');
    checksPerformed.push('INST-002: Package installation instructions check');
    checksPerformed.push('INST-003: Project run/start commands check');
  } else {
    checksNotPerformed.push('INST-002/003: Skipped detailed README command scan because README.md was not provided.');
  }

  // INST-001: Missing or empty README
  if (fileStatuses.readme === 'missing' || !readme.trim()) {
    addFinding({
      id: 'INST-001',
      ruleId: 'INST-001',
      category: 'installation',
      severity: 'critical',
      statusType: 'definite_observation',
      title: 'README.md is missing or completely empty',
      fileSource: 'README.md',
      evidence: 'File is absent or contains 0 characters of documentation.',
      whyItMatters:
        'A project without a README leaves incoming developers with zero context on purpose, architecture, or how to begin.',
      suggestedFix:
        'Create a standardized README.md with project overview, prerequisites, installation steps, and start commands.',
      suggestedSnippet: `# Project Name\n\nBrief 1-line description.\n\n## Prerequisites\n- Node.js >= 18 / Python >= 3.10\n\n## Getting Started\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\``
    });
  } else {
    // INST-002: Missing dependency installation command in README
    const hasPkg = fileStatuses.packageJson === 'provided' && packageContent.trim();
    const hasReqs = fileStatuses.requirementsTxt === 'provided' && requirementsContent.trim();

    const installCommands = [
      /npm\s+(install|i\b|ci\b)/i,
      /yarn(\s+install)?/i,
      /pnpm\s+(install|i\b)/i,
      /pip\s+install/i,
      /poetry\s+install/i,
      /pipenv\s+install/i,
      /cargo\s+build/i,
      /go\s+(get|mod\s+download)/i
    ];
    const hasInstallCommand = installCommands.some((rx) => rx.test(readme));

    if ((hasPkg || hasReqs) && !hasInstallCommand) {
      addFinding({
        id: 'INST-002',
        ruleId: 'INST-002',
        category: 'installation',
        severity: 'critical',
        statusType: 'definite_observation',
        title: 'Missing package installation instructions in README.md',
        fileSource: 'README.md',
        evidence: 'No installation commands (e.g., "npm install" or "pip install -r requirements.txt") found in README.',
        whyItMatters:
          'New developers cannot determine the official package manager or installation workflow without explicit commands.',
        suggestedFix:
          `Add an installation code block to README.md specifying ` +
          (hasPkg ? '`npm install` (or yarn/pnpm)' : '`pip install -r requirements.txt`') +
          '.',
        suggestedSnippet: hasPkg
          ? '### Installation\n```bash\nnpm install\n```'
          : '### Installation\n```bash\npip install -r requirements.txt\n```'
      });
    }

    // INST-003: Missing run / dev start command
    const startCommands = [
      /npm\s+(run\s+dev|start|run\s+start)/i,
      /yarn\s+(dev|start)/i,
      /pnpm\s+(dev|start)/i,
      /python\s+[\w.-]+\.py/i,
      /uvicorn\s+[\w.:]+/i,
      /flask\s+run/i,
      /docker\s+compose\s+up/i,
      /cargo\s+run/i
    ];
    const hasStartCommand = startCommands.some((rx) => rx.test(readme));

    if (!hasStartCommand) {
      addFinding({
        id: 'INST-003',
        ruleId: 'INST-003',
        category: 'installation',
        severity: 'critical',
        statusType: 'definite_observation',
        title: 'No project run or start command specified in README',
        fileSource: 'README.md',
        evidence: 'Scanned README text does not contain development server start command (e.g. "npm run dev" or "uvicorn").',
        whyItMatters:
          'Even if dependencies install cleanly, a developer cannot know which entrypoint or script launches the application.',
        suggestedFix:
          'Document the primary command used to start the development server under a "Running the App" or "Development" section.',
        suggestedSnippet: '### Running the Application\n```bash\nnpm run dev\n```'
      });
    }

    // INST-004: Referenced npm script mismatch
    if (pkgJson && pkgJson.scripts) {
      checksPerformed.push('INST-004: Consistency check between README npm commands and package.json.scripts');
      const readmeScriptMatches = Array.from(readme.matchAll(/npm\s+run\s+([a-zA-Z0-9_:-]+)/g));
      const declaredScripts = Object.keys(pkgJson.scripts);

      for (const match of readmeScriptMatches) {
        const scriptName = match[1];
        if (!declaredScripts.includes(scriptName)) {
          addFinding({
            id: `INST-004-${scriptName}`,
            ruleId: 'INST-004',
            category: 'installation',
            severity: 'high',
            statusType: 'definite_observation',
            title: `Referenced script "npm run ${scriptName}" missing from package.json`,
            fileSource: 'README.md & package.json',
            evidence: `README references "npm run ${scriptName}", but package.json only defines: [${declaredScripts.join(', ')}].`,
            whyItMatters:
              'A developer following the README will encounter "npm ERR! missing script" errors during setup.',
            suggestedFix: `Either add the "${scriptName}" script to package.json scripts or update the README to use an existing script.`,
            suggestedSnippet: `"scripts": {\n  "${scriptName}": "node index.js"\n}`
          });
        }
      }
    } else {
      checksNotPerformed.push('INST-004: Script consistency check skipped because package.json was not provided or lacks scripts.');
    }
  }

  // -------------------------------------------------------------
  // 2. DEPENDENCIES & RUNTIME PREREQUISITES
  // -------------------------------------------------------------
  if (fileStatuses.packageJson === 'provided' || fileStatuses.requirementsTxt === 'provided') {
    checksPerformed.push('DEP-001/002: Dependency manifest and engine prerequisites check');
  }

  // DEP-001: No dependency declaration file provided
  if (
    fileStatuses.packageJson !== 'provided' &&
    fileStatuses.requirementsTxt !== 'provided'
  ) {
    addFinding({
      id: 'DEP-001',
      ruleId: 'DEP-001',
      category: 'dependencies',
      severity: 'critical',
      statusType: 'potential_issue',
      title: 'Neither package.json nor requirements.txt was supplied for analysis',
      fileSource: 'Dependency Configuration',
      evidence: 'Neither Node nor Python dependency manifests were provided in this scan session.',
      whyItMatters:
        'Dependency compatibility and security cannot be assessed when configuration manifests are absent. Note: This indicates incomplete inputs for automated handoff evaluation, not proof that the repository lacks dependencies.',
      suggestedFix: 'Provide package.json or requirements.txt to allow full manifest cross-referencing.'
    });
  }

  // DEP-002: Missing runtime/engine requirements (Node / Python versions)
  const hasNodePrereq = /node(?:\.js)?\s*(?:v(?:ersion)?|>=|>\s*|[0-9]{2})/i.test(readme) ||
    (pkgJson && pkgJson.engines && pkgJson.engines.node);
  const hasPythonPrereq = /python\s*(?:v(?:ersion)?|>=|3\.[0-9]+)/i.test(readme);

  if (!hasNodePrereq && !hasPythonPrereq) {
    addFinding({
      id: 'DEP-002',
      ruleId: 'DEP-002',
      category: 'runtime_prerequisites',
      severity: 'medium',
      statusType: 'potential_issue',
      title: 'No runtime version prerequisite documented (Node.js / Python)',
      fileSource: 'README.md & package.json',
      evidence: 'No "engines" field in package.json and no explicit runtime version constraints detected in README.',
      whyItMatters:
        'Mismatched major runtime versions (e.g. Node 16 vs 20, Python 3.8 vs 3.12) cause silent syntax or dependency build breaks.',
      suggestedFix: 'Specify required runtime versions in README prerequisites and declare "engines" in package.json.',
      suggestedSnippet: `## Prerequisites\n- Node.js >= 20.0.0\n- npm >= 10.0.0\n\n// In package.json:\n"engines": {\n  "node": ">=20.0.0"\n}`
    });
  }

  // DEP-003: Unpinned dependencies in requirements.txt
  if (fileStatuses.requirementsTxt === 'provided' && requirementsContent.trim()) {
    checksPerformed.push('DEP-003: Python requirements pinning check');
    const lines = requirementsContent.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
    const unpinned = lines.filter((l) => !l.includes('==') && !l.includes('>=') && !l.includes('~='));

    if (unpinned.length > 2) {
      addFinding({
        id: 'DEP-003',
        ruleId: 'DEP-003',
        category: 'dependencies',
        severity: 'low',
        statusType: 'potential_issue',
        title: `${unpinned.length} unpinned dependencies detected in requirements.txt`,
        fileSource: 'requirements.txt',
        evidence: `Unpinned packages without specific version constraints: ${unpinned.slice(0, 4).join(', ')}${unpinned.length > 4 ? '...' : ''}`,
        whyItMatters:
          'Unpinned Python requirements cause builds to pull newer breaking versions unexpectedly over time.',
        suggestedFix: 'Pin packages to tested major/minor versions using pip freeze or poetry.lock.',
        suggestedSnippet: lines.slice(0, 3).map((pkg) => `${pkg}==1.0.0`).join('\n')
      });
    }
  } else {
    checksNotPerformed.push('DEP-003: Python package pinning check skipped because requirements.txt was not provided.');
  }

  // DEP-004: Missing Python Virtual Environment instructions
  if (fileStatuses.requirementsTxt === 'provided' && requirementsContent.trim()) {
    checksPerformed.push('DEP-004: Python virtual environment documentation check');
    const hasVenvDoc = /(venv|virtualenv|conda\s+create|\.venv)/i.test(readme);
    if (!hasVenvDoc) {
      addFinding({
        id: 'DEP-004',
        ruleId: 'DEP-004',
        category: 'runtime_prerequisites',
        severity: 'medium',
        statusType: 'potential_issue',
        title: 'Python project lacks virtual environment creation steps in README',
        fileSource: 'README.md',
        evidence: 'README mentions Python requirements but does not instruct user to activate a virtualenv (e.g. "python -m venv .venv").',
        whyItMatters:
          'Installing requirements into the global system Python environment risks namespace pollution and permission errors.',
        suggestedFix: 'Add standard virtual environment setup steps before the pip install command in README.',
        suggestedSnippet: '### 1. Setup Virtual Environment\n```bash\npython -m venv .venv\nsource .venv/bin/activate  # On Windows: .venv\\Scripts\\activate\npip install -r requirements.txt\n```'
      });
    }
  }

  // DEP-005: Malformed package.json syntax
  if (fileStatuses.packageJson === 'provided' && packageContent.trim() && pkgJsonError) {
    checksPerformed.push('DEP-005: Manifest syntax validity check');
    addFinding({
      id: 'DEP-005',
      ruleId: 'DEP-005',
      category: 'dependencies',
      severity: 'critical',
      statusType: 'definite_observation',
      title: 'package.json contains invalid JSON syntax',
      fileSource: 'package.json',
      evidence: `Parser error: ${pkgJsonError}`,
      whyItMatters:
        'Package managers like npm or yarn cannot parse the manifest, causing setup commands to abort immediately.',
      suggestedFix:
        'Correct syntax errors such as trailing commas, unquoted keys, or unclosed braces in package.json.',
      suggestedSnippet: '{\n  "name": "my-project",\n  "version": "1.0.0"\n}'
    });
  }

  // -------------------------------------------------------------
  // 3. ENVIRONMENT & CONFIGURATION
  // -------------------------------------------------------------
  const usesEnv =
    (packageContent && /dotenv|cross-env/i.test(packageContent)) ||
    (requirementsContent && /python-dotenv|pydantic-settings/i.test(requirementsContent)) ||
    /process\.env|os\.environ|\.env/i.test(readme);

  // ENV-001: Missing .env.example when env is clearly needed
  if (usesEnv && (fileStatuses.envExample === 'missing' || !envContent.trim())) {
    checksPerformed.push('ENV-001: Environment template availability check');
    addFinding({
      id: 'ENV-001',
      ruleId: 'ENV-001',
      category: 'environment',
      severity: 'high',
      statusType: 'definite_observation',
      title: 'Project uses environment configuration but .env.example is missing',
      fileSource: '.env.example',
      evidence: 'Environment library detected in dependencies/README, but no .env.example file was provided.',
      whyItMatters:
        'Developers have to reverse-engineer required configuration keys and connection strings from source code.',
      suggestedFix: 'Create a .env.example file listing all required keys with safe dummy placeholder values.',
      suggestedSnippet: `# .env.example template\nPORT=3000\nDATABASE_URL=postgresql://user:password@localhost:5432/mydb\nJWT_SECRET=replace_with_local_dev_secret\n`
    });
  }

  // ENV-002: Hardcoded secrets in .env.example
  if (fileStatuses.envExample === 'provided' && envContent.trim()) {
    checksPerformed.push('ENV-002: Plaintext credential leak scan in .env.example');
    checksPerformed.push('ENV-003: Environment variable documentation cross-check');
    const leaks = detectSecretLeaks(envContent);
    for (const leak of leaks) {
      addFinding({
        id: `ENV-002-${leak.key}`,
        ruleId: 'ENV-002',
        category: 'environment',
        severity: 'critical',
        statusType: 'definite_observation',
        title: `Possible real secret or sensitive credential exposed in .env.example (${leak.key})`,
        fileSource: '.env.example',
        evidence: `Line: "${leak.line}" contains an unmasked non-placeholder credential.`,
        whyItMatters:
          'Committing actual secrets or production connection strings to version control leads to critical security breaches.',
        suggestedFix: `Replace "${leak.key}" value with an explicit placeholder like "your_${leak.key.toLowerCase()}_here" or "changeme".`,
        suggestedSnippet: `${leak.key}=your_${leak.key.toLowerCase()}_placeholder_here`
      });
    }

    // ENV-003: Undocumented environment variables
    const envVars = extractEnvVariables(envContent);
    const undocumentedVars = envVars.filter((v) => !readme.includes(v));

    if (undocumentedVars.length > 0) {
      addFinding({
        id: 'ENV-003',
        ruleId: 'ENV-003',
        category: 'environment',
        severity: 'high',
        statusType: 'definite_observation',
        title: `${undocumentedVars.length} environment variable(s) not documented in README.md`,
        fileSource: 'README.md & .env.example',
        evidence: `Variables in .env.example missing documentation in README: ${undocumentedVars.slice(0, 4).join(', ')}${undocumentedVars.length > 4 ? '...' : ''}`,
        whyItMatters:
          'Developers will not know whether these keys are optional, where to procure credentials, or expected syntax.',
        suggestedFix: 'Add an Environment Variables table to README.md explaining the purpose and default of each key.',
        suggestedSnippet: `## Environment Configuration\nCopy \`.env.example\` to \`.env\` and configure:\n\n| Variable | Description | Example |\n|---|---|---|\n${undocumentedVars.slice(0, 3).map((v) => `| \`${v}\` | Purpose of ${v} | \`example_value\` |`).join('\n')}`
      });
    }
  } else {
    checksNotPerformed.push('ENV-002/003: Environment variable checks skipped because .env.example was not provided.');
  }

  // -------------------------------------------------------------
  // 4. TESTING & QUALITY ASSURANCE
  // -------------------------------------------------------------
  const hasTestScriptInPkg =
    pkgJson && pkgJson.scripts && (pkgJson.scripts.test || pkgJson.scripts['test:unit']);
  const isStubTest =
    hasTestScriptInPkg &&
    pkgJson.scripts.test &&
    pkgJson.scripts.test.includes('no test specified');

  checksPerformed.push('TEST-001/002: Automated testing instructions and script verification');

  // TEST-001: Missing test execution instructions in README
  const testDocKeywords = [
    /npm\s+(run\s+)?test/i,
    /yarn\s+test/i,
    /pnpm\s+test/i,
    /pytest/i,
    /vitest/i,
    /jest/i,
    /cargo\s+test/i,
    /go\s+test/i
  ];
  const hasTestInstructions =
    testDocKeywords.some((rx) => rx.test(readme)) ||
    (fileStatuses.testConfig === 'provided' && testDocKeywords.some((rx) => rx.test(testContent)));

  if (!hasTestInstructions) {
    addFinding({
      id: 'TEST-001',
      ruleId: 'TEST-001',
      category: 'testing',
      severity: 'medium',
      statusType: 'definite_observation',
      title: 'No test execution instructions provided in README.md',
      fileSource: 'README.md',
      evidence: 'README has no mention of running test suites (e.g. "npm test", "pytest", "vitest").',
      whyItMatters:
        'Incoming engineers cannot easily verify that their local setup is functioning correctly or validate PRs without test steps.',
      suggestedFix: 'Include a "Testing" or "Running Tests" section in README detailing automated test commands.',
      suggestedSnippet: '## Running Tests\nExecute the automated test suite:\n```bash\nnpm test\n```'
    });
  }

  // TEST-002: Default placeholder test script in package.json
  if (isStubTest) {
    addFinding({
      id: 'TEST-002',
      ruleId: 'TEST-002',
      category: 'testing',
      severity: 'high',
      statusType: 'definite_observation',
      title: 'Default placeholder test script detected in package.json',
      fileSource: 'package.json',
      evidence: `"test": "${pkgJson.scripts.test}"`,
      whyItMatters:
        'Running "npm test" immediately exits with failure code 1, breaking CI pipelines and local verification.',
      suggestedFix: 'Configure a real test runner such as Vitest or Jest, or supply working test commands.',
      suggestedSnippet: '"scripts": {\n  "test": "vitest run"\n}'
    });
  }

  // TEST-003: Test configuration explicitly marked missing
  if (fileStatuses.testConfig === 'missing') {
    addFinding({
      id: 'TEST-003',
      ruleId: 'TEST-003',
      category: 'testing',
      severity: 'low',
      statusType: 'potential_issue',
      title: 'Test framework configuration file confirmed missing from repository',
      fileSource: 'Test Configuration',
      evidence: 'No jest.config, vitest.config, or pytest.ini configuration found.',
      whyItMatters:
        'Lack of test setup files indicates testing is either unconfigured or non-standard.',
      suggestedFix: 'Initialize a standard test runner configuration for automated testing.'
    });
  }

  // -------------------------------------------------------------
  // 5. MAINTENANCE, ARCHITECTURE & HANDOFF
  // -------------------------------------------------------------
  checksPerformed.push('MAINT-001/002/003: Localhost port, maintainer contact, and descriptive depth');

  // MAINT-001: Missing expected port or local URL
  const portPatterns = [/localhost:\d{2,5}/i, /127\.0\.0\.1:\d{2,5}/i, /PORT\s*=\s*\d{2,5}/i, /port\s+\d{2,5}/i];
  const hasPortOrUrl = portPatterns.some((rx) => rx.test(readme));

  if (!hasPortOrUrl) {
    addFinding({
      id: 'MAINT-001',
      ruleId: 'MAINT-001',
      category: 'maintenance',
      severity: 'low',
      statusType: 'potential_issue',
      title: 'Expected port / localhost URL not specified in README',
      fileSource: 'README.md',
      evidence: 'No mention of standard local web addresses (e.g. http://localhost:3000) found in README.',
      whyItMatters:
        'Developers cannot immediately verify if the server started properly or which web address to visit.',
      suggestedFix: 'Document the default development port or landing URL in the setup instructions.',
      suggestedSnippet: 'Once running, the application is available at: **http://localhost:3000**'
    });
  }

  // MAINT-002: Missing Point of Contact / Handoff Owner
  const contactPatterns = [
    /maintainer/i,
    /contact/i,
    /author/i,
    /team/i,
    /slack/i,
    /discord/i,
    /email/i,
    /@[\w.-]+/
  ];
  const hasContactInfo = contactPatterns.some((rx) => rx.test(readme));

  if (!hasContactInfo) {
    addFinding({
      id: 'MAINT-002',
      ruleId: 'MAINT-002',
      category: 'maintenance',
      severity: 'low',
      statusType: 'potential_issue',
      title: 'No maintainer contact or onboarding handoff channel documented',
      fileSource: 'README.md',
      evidence: 'README contains no owner, author, or communication channel for onboarding escalation.',
      whyItMatters:
        'New team members lack an escalation contact when encountering undocumented setup hurdles or blocking issues.',
      suggestedFix: 'Add a Maintainers or Support section with team email, Slack channel, or issue tracker.',
      suggestedSnippet: '## Support & Maintainers\n- Primary Handoff Contact: dev-team@company.internal\n- Channel: #project-onboarding'
    });
  }

  // MAINT-003: Insufficient project description
  const words = readme.trim().split(/\s+/).length;
  if (words < 20) {
    addFinding({
      id: 'MAINT-003',
      ruleId: 'MAINT-003',
      category: 'maintenance',
      severity: 'medium',
      statusType: 'definite_observation',
      title: 'README contains minimal or insufficient descriptive context',
      fileSource: 'README.md',
      evidence: `README has only approximately ${words} words.`,
      whyItMatters:
        'A sparse README fails to explain project purpose, architecture, or business context to the incoming engineer.',
      suggestedFix: 'Expand README with at least 2-3 paragraphs covering architecture, goals, and workflow.'
    });
  }

  // Calculate Heuristic Score
  const scoreBreakdown = calculateHeuristicScore(findings, fileStatuses, checksPerformed, checksNotPerformed);

  // Summary counts
  const summary = {
    criticalCount: findings.filter((f) => f.severity === 'critical' && f.issueStatus !== 'resolved').length,
    highCount: findings.filter((f) => f.severity === 'high' && f.issueStatus !== 'resolved').length,
    mediumCount: findings.filter((f) => f.severity === 'medium' && f.issueStatus !== 'resolved').length,
    lowCount: findings.filter((f) => f.severity === 'low' && f.issueStatus !== 'resolved').length,
    openCount: findings.filter((f) => f.issueStatus === 'open').length,
    inProgressCount: findings.filter((f) => f.issueStatus === 'in_progress').length,
    resolvedCount: findings.filter((f) => f.issueStatus === 'resolved').length,
    totalFindings: findings.length
  };

  const filesProvidedCount = Object.values(fileStatuses).filter((s) => s === 'provided').length;

  return {
    timestamp: new Date().toISOString(),
    projectName: pkgJson?.name || (readme.match(/^#\s+(.+)$/m)?.[1] || 'Project Repository'),
    filesProvidedCount,
    filesTotalCount: 5,
    findings,
    score: scoreBreakdown,
    summary,
    checksPerformed,
    checksNotPerformed
  };
}

// Transparent Heuristic Scoring Model
function calculateHeuristicScore(
  findings: Finding[],
  fileStatuses: Record<FileKey, FileStatus>,
  checksPerformed: string[],
  checksNotPerformed: string[]
): ScoreBreakdown {
  const CATEGORY_WEIGHTS: Record<FindingCategory, { max: number; label: string }> = {
    installation: { max: 25, label: 'Installation & Setup' },
    dependencies: { max: 20, label: 'Dependencies & Manifests' },
    runtime_prerequisites: { max: 15, label: 'Runtime & Prerequisites' },
    environment: { max: 20, label: 'Environment & Configuration' },
    testing: { max: 10, label: 'Testing & Verification' },
    maintenance: { max: 10, label: 'Maintenance & Handoff' }
  };

  // 4-Tier Documented Severity Deductions
  const PENALTY_TABLE: Record<FindingSeverity, number> = {
    critical: 12,
    high: 8,
    medium: 5,
    low: 2
  };

  const penalties: {
    ruleId: string;
    description: string;
    category: FindingCategory;
    severity: FindingSeverity;
    deduction: number;
  }[] = [];

  const categoryMap: Record<FindingCategory, CategoryScore> = {
    installation: { category: 'installation', categoryLabel: CATEGORY_WEIGHTS.installation.label, pointsEarned: 25, pointsMax: 25, criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0 },
    dependencies: { category: 'dependencies', categoryLabel: CATEGORY_WEIGHTS.dependencies.label, pointsEarned: 20, pointsMax: 20, criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0 },
    runtime_prerequisites: { category: 'runtime_prerequisites', categoryLabel: CATEGORY_WEIGHTS.runtime_prerequisites.label, pointsEarned: 15, pointsMax: 15, criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0 },
    environment: { category: 'environment', categoryLabel: CATEGORY_WEIGHTS.environment.label, pointsEarned: 20, pointsMax: 20, criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0 },
    testing: { category: 'testing', categoryLabel: CATEGORY_WEIGHTS.testing.label, pointsEarned: 10, pointsMax: 10, criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0 },
    maintenance: { category: 'maintenance', categoryLabel: CATEGORY_WEIGHTS.maintenance.label, pointsEarned: 10, pointsMax: 10, criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0 }
  };

  let rawDeductions = 0;
  let adjustedDeductions = 0;

  for (const f of findings) {
    const penalty = PENALTY_TABLE[f.severity];
    penalties.push({
      ruleId: f.ruleId,
      description: f.title,
      category: f.category,
      severity: f.severity,
      deduction: penalty
    });

    const cat = categoryMap[f.category];
    if (f.severity === 'critical') cat.criticalCount++;
    if (f.severity === 'high') cat.highCount++;
    if (f.severity === 'medium') cat.mediumCount++;
    if (f.severity === 'low') cat.lowCount++;

    rawDeductions += penalty;

    // Only apply deduction to user-adjusted score if NOT user-resolved
    if (f.issueStatus !== 'resolved') {
      adjustedDeductions += penalty;
      cat.pointsEarned = Math.max(0, cat.pointsEarned - penalty);
    }
  }

  const rawScore = Math.max(0, Math.min(100, 100 - rawDeductions));
  const adjustedScore = Math.max(0, Math.min(100, 100 - adjustedDeductions));

  let grade: 'Handoff Ready' | 'Needs Review' | 'Severe Gaps' = 'Needs Review';
  let gradeColor = '#f59e0b'; // amber

  if (adjustedScore >= 85) {
    grade = 'Handoff Ready';
    gradeColor = '#10b981'; // green
  } else if (adjustedScore < 60) {
    grade = 'Severe Gaps';
    gradeColor = '#ef4444'; // red
  }

  // Completeness warning if too few files provided
  const providedCount = Object.values(fileStatuses).filter((s) => s === 'provided').length;
  let inputCompletenessWarning: string | undefined;
  if (providedCount < 2) {
    inputCompletenessWarning =
      'Only 1 file provided for analysis. The score reflects limited visibility into repository structure rather than true project readiness.';
  }

  return {
    rawScore,
    adjustedScore,
    maxScore: 100,
    grade,
    gradeColor,
    categories: Object.values(categoryMap),
    penalties,
    inputCompletenessWarning,
    checksPerformed,
    checksNotPerformed
  };
}

// Generate complete Markdown Handoff Report
export function generateMarkdownReport(result: AnalysisResult): string {
  const { projectName, timestamp, score, summary, findings, checksPerformed, checksNotPerformed } = result;

  const dateFormatted = new Date(timestamp).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  let md = `# RepoReady Project Handoff & Setup Readiness Report\n\n`;
  md += `> **Evaluation Target:** ${projectName}  \n`;
  md += `> **Generated On:** ${dateFormatted}  \n`;
  md += `> **Analysis Engine:** RepoReady Deterministic Rule Heuristic v1.2  \n`;
  md += `> **Readiness Posture:** **${score.grade.toUpperCase()}** (${score.adjustedScore}/100 pts)\n\n`;

  if (score.inputCompletenessWarning) {
    md += `> ⚠️ **Notice:** ${score.inputCompletenessWarning}\n\n`;
  }

  md += `## 1. Executive Summary\n\n`;
  md += `RepoReady inspected documentation and configuration manifests for **${projectName}** across 6 core onboarding categories: Installation, Dependencies, Runtime Prerequisites, Environment Configuration, Testing, and Maintenance Handoff.\n\n`;
  md += `- **Automated Baseline Score:** ${score.rawScore} / 100\n`;
  md += `- **User-Reported Adjusted Score:** ${score.adjustedScore} / 100 (accounting for user-reported remediations)\n`;
  md += `- **Critical Gaps:** ${summary.criticalCount} (Immediate blockers preventing onboarding)\n`;
  md += `- **High Severity Gaps:** ${summary.highCount} (Major friction likely to cause setup failures)\n`;
  md += `- **Medium Severity Gaps:** ${summary.mediumCount} (Significant ambiguity or missing runtime requirements)\n`;
  md += `- **Low Severity Gaps:** ${summary.lowCount} (Best-practice enhancements)\n`;
  md += `- **Issue Tracking Status:** ${summary.openCount} Open, ${summary.inProgressCount} In Progress, ${summary.resolvedCount} User-Reported Resolved\n\n`;

  md += `> **Audit Transparency Note on Issue Status:**  
> - **Automated Baseline:** Evaluates the supplied repository manifests using deterministic rules without human overrides.
> - **User-Reported Resolved:** Reflects developer self-reporting in this session. A finding marked resolved remains suppressed only in the user-adjusted score calculation. Re-running analysis does NOT technically verify a fix while the finding is manually suppressed.
> - **Technical Verification:** A fix is technically verified only when the underlying file content is modified and re-analyzed so that the rule no longer triggers on the codebase.\n\n`;

  md += `## 2. Category Score Breakdown\n\n`;
  md += `| Category | Earned / Max | Critical | High | Medium | Low |\n`;
  md += `|---|---|---|---|---|---|\n`;
  for (const cat of score.categories) {
    md += `| ${cat.categoryLabel} | ${cat.pointsEarned} / ${cat.pointsMax} | ${cat.criticalCount} | ${cat.highCount} | ${cat.mediumCount} | ${cat.lowCount} |\n`;
  }
  md += `\n`;

  md += `## 3. Scope of Checks Executed\n\n`;
  md += `### Checks Performed (${checksPerformed.length})\n`;
  for (const c of checksPerformed) {
    md += `- ✅ ${c}\n`;
  }
  md += `\n`;

  if (checksNotPerformed.length > 0) {
    md += `### Checks Not Performed (${checksNotPerformed.length})\n`;
    md += `*The following checks were skipped because corresponding files were not supplied for analysis (unprovided input does not count as a failure):*\n`;
    for (const c of checksNotPerformed) {
      md += `- ⏭️ ${c}\n`;
    }
    md += `\n`;
  }

  md += `## 4. Itemized Findings Grouped by Severity\n\n`;

  const severities: FindingSeverity[] = ['critical', 'high', 'medium', 'low'];
  const severityHeaders: Record<FindingSeverity, string> = {
    critical: '🔴 Critical Severity Findings (Immediate Blockers)',
    high: '🟠 High Severity Findings (Major Setup Friction)',
    medium: '🟡 Medium Severity Findings (Runtime & Test Ambiguity)',
    low: '🔵 Low Severity Findings (Best Practice Improvements)'
  };

  let findingCounter = 1;

  for (const sev of severities) {
    const sevFindings = findings.filter((f) => f.severity === sev);
    if (sevFindings.length === 0) continue;

    md += `### ${severityHeaders[sev]}\n\n`;

    for (const finding of sevFindings) {
      const statusLabel =
        finding.issueStatus === 'resolved'
          ? '✅ [USER REPORTED: RESOLVED]'
          : finding.issueStatus === 'in_progress'
          ? '⏳ [IN PROGRESS]'
          : '🔴 [OPEN ISSUE]';

      const observationBadge =
        finding.statusType === 'definite_observation' ? 'Definite Observation' : 'Potential Issue';

      md += `#### ${findingCounter++}. [${finding.ruleId}] ${finding.title}\n\n`;
      md += `- **Issue Status:** ${statusLabel} | ${observationBadge}\n`;
      md += `- **Source File:** \`${finding.fileSource}\`\n`;
      md += `- **Observed Evidence:**\n  > ${finding.evidence.replace(/\n/g, '\n  > ')}\n\n`;
      md += `- **Why It Matters:** ${finding.whyItMatters}\n`;
      md += `- **Recommended Fix:** ${finding.suggestedFix}\n`;

      if (finding.suggestedSnippet) {
        md += `\n\`\`\`markdown\n${finding.suggestedSnippet}\n\`\`\`\n`;
      }

      if (finding.aiExplanation) {
        md += `\n> **🤖 AI Issue Explainer Guidance**  \n`;
        md += `> *Model: ${finding.aiExplanation.modelUsed} • Generated: ${new Date(finding.aiExplanation.generatedAt).toLocaleTimeString()}*  \n`;
        md += `> - **Plain English Explanation:** ${finding.aiExplanation.beginnerExplanation}  \n`;
        md += `> - **Why Onboarding Receivers Care:** ${finding.aiExplanation.whyItMatters}  \n`;
        md += `> - **Actionable Steps:**\n`;
        for (const step of finding.aiExplanation.actionableSteps) {
          md += `>   1. ${step}\n`;
        }
        md += `> - **Verification Command:** \`${finding.aiExplanation.verificationCommand}\`\n\n`;
      }

      md += `---\n\n`;
    }
  }

  md += `## 5. Prioritized Next-Action Checklist\n\n`;
  md += `Follow this prioritized sequence before transferring repository ownership:\n\n`;
  md += `- [ ] **P0:** Resolve all Critical issues (missing install/start commands, exposed plaintext secrets, syntax errors).\n`;
  md += `- [ ] **P1:** Document all required environment variables with a clean \`.env.example\` template.\n`;
  md += `- [ ] **P2:** Explicitly pin runtime version engines (Node.js/Python) in README prerequisites and package manifests.\n`;
  md += `- [ ] **P3:** Provide a working test execution command (\`npm test\` or \`pytest\`) verified to pass cleanly.\n`;
  md += `- [ ] **P4:** State the expected localhost URL and development port for local verification.\n`;
  md += `- [ ] **P5:** Designate a point of contact or communication channel for handoff support.\n\n`;

  md += `## 6. Audit Boundaries & Integrity Limitations\n\n`;
  md += `> **Audit Boundary & Privacy Notice:** RepoReady scores are generated by a Deterministic Documentation Heuristic representing setup transparency and handoff completeness evaluated locally. Live AI explanations send sanitized finding summaries to your configured LLM provider; never submit real passwords or proprietary secrets. RepoReady does not execute binary code, test compiler outputs, validate credentials against live backends, or guarantee that application business logic is bug-free.\n`;

  return md;
}
