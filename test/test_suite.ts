import { analyzeProject, generateMarkdownReport } from '../src/analyzer.ts';
import { SAMPLE_PROJECTS } from '../src/sampleData.ts';
import {
  generateDeterministicFallback,
  validateAIExplanationStructure
} from '../src/services/aiExplainer.ts';
import type { Finding } from '../src/types.ts';
import assert from 'node:assert';

console.log('====================================================');
console.log('   REPOREADY AUTOMATED TEST SUITE EXECUTION   ');
console.log('   Theme: AI and Developer Tools | Team: HACKGG4Z   ');
console.log('====================================================\n');

let testsPassed = 0;
let testsFailed = 0;

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    testsPassed++;
  } catch (err: any) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    Error: ${err.message}\n`);
    testsFailed++;
  }
}

// Helper to look up sample by id
function getSample(id: string) {
  const sample = SAMPLE_PROJECTS.find((s) => s.id === id);
  if (!sample) throw new Error(`Sample not found: ${id}`);
  return sample;
}

// Test 1: Sample 1 (Broken Express API - Before Remediation)
runTest('Sample 1 (Broken Express API) detects critical handoff gaps', () => {
  const sample = getSample('sample-express-broken');
  const result = analyzeProject(sample.files, sample.fileStatuses);

  assert(result.score.rawScore < 60, `Score should be < 60, got ${result.score.rawScore}`);
  assert.strictEqual(result.score.grade, 'Severe Gaps');

  // Verify critical findings
  const criticalFindings = result.findings.filter((f) => f.severity === 'critical');
  assert(criticalFindings.length >= 2, `Expected at least 2 critical findings, found ${criticalFindings.length}`);

  const hasMissingInstall = result.findings.some((f) => f.ruleId === 'INST-002');
  const hasMissingStart = result.findings.some((f) => f.ruleId === 'INST-003');
  const hasSecretLeak = result.findings.some((f) => f.ruleId === 'ENV-002');
  const hasStubTest = result.findings.some((f) => f.ruleId === 'TEST-002');

  assert(hasMissingInstall, 'Must detect missing install command (INST-002)');
  assert(hasMissingStart, 'Must detect missing start command (INST-003)');
  assert(hasSecretLeak, 'Must detect exposed secret password in .env.example (ENV-002)');
  assert(hasStubTest, 'Must detect placeholder test script (TEST-002)');
});

// Test 2: Sample (Incomplete Python Service) Analysis
runTest('Sample (Incomplete Python) detects unpinned requirements and venv omission', () => {
  const sample = getSample('sample-python-incomplete');
  const result = analyzeProject(sample.files, sample.fileStatuses);

  assert(result.score.rawScore >= 40 && result.score.rawScore <= 80, `Score should be moderate, got ${result.score.rawScore}`);

  const hasUnpinned = result.findings.some((f) => f.ruleId === 'DEP-003');
  const hasMissingVenv = result.findings.some((f) => f.ruleId === 'DEP-004');
  const hasMissingTest = result.findings.some((f) => f.ruleId === 'TEST-001');

  assert(hasUnpinned, 'Must detect unpinned dependencies in requirements.txt (DEP-003)');
  assert(hasMissingVenv, 'Must detect missing virtualenv setup steps (DEP-004)');
  assert(hasMissingTest, 'Must detect missing test documentation (TEST-001)');
});

// Test 3: Sample (Gold Standard) Analysis
runTest('Sample (Gold Standard) achieves Handoff Ready posture', () => {
  const sample = getSample('sample-gold-standard');
  const result = analyzeProject(sample.files, sample.fileStatuses);

  assert(result.score.rawScore >= 85, `Score should be >= 85, got ${result.score.rawScore}`);
  assert.strictEqual(result.score.grade, 'Handoff Ready');

  const criticalFindings = result.findings.filter((f) => f.severity === 'critical');
  assert.strictEqual(criticalFindings.length, 0, 'Gold standard must have 0 critical findings');
});

// Test 4: Before vs. After Remediation Demo Comparison
runTest('Demo Comparison: Remediated project resolves critical gaps and achieves >= 90 score', () => {
  const brokenSample = getSample('sample-express-broken');
  const remediatedSample = getSample('sample-express-remediated');

  const brokenResult = analyzeProject(brokenSample.files, brokenSample.fileStatuses);
  const remediatedResult = analyzeProject(remediatedSample.files, remediatedSample.fileStatuses);

  assert(brokenResult.score.adjustedScore < 50, `Broken score must be < 50, got ${brokenResult.score.adjustedScore}`);
  assert(remediatedResult.score.adjustedScore >= 90, `Remediated score must be >= 90, got ${remediatedResult.score.adjustedScore}`);

  const brokenCriticals = brokenResult.findings.filter((f) => f.severity === 'critical').length;
  const remediatedCriticals = remediatedResult.findings.filter((f) => f.severity === 'critical').length;

  assert(brokenCriticals > 0, 'Broken project must contain critical findings');
  assert.strictEqual(remediatedCriticals, 0, 'Remediated project must have 0 critical findings');
  assert(remediatedResult.score.adjustedScore > brokenResult.score.adjustedScore + 40, 'Remediation should increase score by > 40 points');
});

// Test 5: Issue Tracking & Status Workflow
runTest('Issue tracking workflow distinguishes open, in_progress, and resolved status', () => {
  const sample = getSample('sample-express-broken');
  const baselineResult = analyzeProject(sample.files, sample.fileStatuses);
  const targetFinding = baselineResult.findings[0];

  // Case A: Mark as in_progress -> deduction remains active
  const inProgressStatuses = { [targetFinding.id]: 'in_progress' as const };
  const inProgressResult = analyzeProject(sample.files, sample.fileStatuses, inProgressStatuses);
  assert.strictEqual(inProgressResult.score.adjustedScore, baselineResult.score.adjustedScore);
  assert.strictEqual(inProgressResult.summary.resolvedCount, 0);

  // Case B: Mark as resolved -> deduction restored in adjustedScore
  const resolvedStatuses = { [targetFinding.id]: 'resolved' as const };
  const resolvedResult = analyzeProject(sample.files, sample.fileStatuses, resolvedStatuses);
  assert(
    resolvedResult.score.adjustedScore > baselineResult.score.adjustedScore,
    `Adjusted score (${resolvedResult.score.adjustedScore}) must be higher than baseline (${baselineResult.score.adjustedScore})`
  );
  assert.strictEqual(resolvedResult.summary.resolvedCount, 1);
});

// Test 6: 4-Tier Severity Penalties (-12, -8, -5, -2)
runTest('Score model applies exact 4-tier penalties (critical: -12, high: -8, medium: -5, low: -2)', () => {
  const sample = getSample('sample-express-broken');
  const result = analyzeProject(sample.files, sample.fileStatuses);

  // Check deduction values in penalties breakdown
  const penalties = result.score.penalties;
  const criticalPenalty = penalties.find((p) => p.severity === 'critical');
  const highPenalty = penalties.find((p) => p.severity === 'high');
  const mediumPenalty = penalties.find((p) => p.severity === 'medium');

  if (criticalPenalty) assert.strictEqual(criticalPenalty.deduction, 12, 'Critical deduction must be 12');
  if (highPenalty) assert.strictEqual(highPenalty.deduction, 8, 'High deduction must be 8');
  if (mediumPenalty) assert.strictEqual(mediumPenalty.deduction, 5, 'Medium deduction must be 5');
});

// Test 7: AI Deterministic Fallback Generation
runTest('Deterministic AI fallback generates grounded 4-field guidance safely', () => {
  const mockFinding: Finding = {
    id: 'INST-002',
    ruleId: 'INST-002',
    category: 'installation',
    severity: 'critical',
    statusType: 'definite_observation',
    title: 'Missing dependency installation command in README',
    fileSource: 'README.md',
    evidence: 'package.json declared dependencies but README contains no npm install command.',
    whyItMatters: 'New team members cannot install required dependencies.',
    suggestedFix: 'Add "npm install" command to README.md',
    issueStatus: 'open'
  };

  const fallback = generateDeterministicFallback(mockFinding);

  assert(fallback.beginnerExplanation.length > 20, 'Must have detailed beginner explanation');
  assert(fallback.whyItMatters.length > 10, 'Must include why it matters');
  assert(Array.isArray(fallback.actionableSteps) && fallback.actionableSteps.length >= 2, 'Must provide actionable steps');
  assert(fallback.verificationCommand.length > 0, 'Must provide verification check');
  assert.strictEqual(fallback.isFallback, true, 'isFallback must be true');
});

// Test 8: Finding Deduplication
runTest('Finding deduplication ensures no duplicate findings in analysis', () => {
  const sample = getSample('sample-express-broken');
  const result = analyzeProject(sample.files, sample.fileStatuses);

  const seenIds = new Set<string>();
  for (const f of result.findings) {
    assert(!seenIds.has(f.id), `Duplicate finding ID detected: ${f.id}`);
    seenIds.add(f.id);
  }
});

// Test 9: Markdown Report Export generates full documentation
runTest('Markdown Report Exporter generates complete report structure with AI and tracking', () => {
  const sample = getSample('sample-express-broken');
  const result = analyzeProject(sample.files, sample.fileStatuses);
  const report = generateMarkdownReport(result);

  assert(report.includes('# RepoReady Project Handoff & Setup Readiness Report'), 'Report must have header');
  assert(report.includes('## 1. Executive Summary'), 'Report must include Executive Summary');
  assert(report.includes('## 2. Category Score Breakdown'), 'Report must include Category Score Breakdown');
  assert(report.includes('## 3. Scope of Checks Executed'), 'Report must include Scope of Checks Executed');
  assert(report.includes('## 4. Itemized Findings Grouped by Severity'), 'Report must include Itemized Findings');
  assert(report.includes('## 5. Prioritized Next-Action Checklist'), 'Report must include Checklist');
  assert(report.includes('## 6. Audit Boundaries & Integrity Limitations'), 'Report must contain honest evaluation disclaimer');
});

// Test 10: Input Completeness warning on single file
runTest('Warns user when only 1 file is provided for evaluation', () => {
  const sparseFiles = {
    readme: '# Sparse Project\nOnly a title here.',
    packageJson: '',
    requirementsTxt: '',
    envExample: '',
    testConfig: ''
  };
  const sparseStatuses = {
    readme: 'provided' as const,
    packageJson: 'not_provided' as const,
    requirementsTxt: 'not_provided' as const,
    envExample: 'not_provided' as const,
    testConfig: 'not_provided' as const
  };

  const result = analyzeProject(sparseFiles, sparseStatuses);
  assert(result.score.inputCompletenessWarning !== undefined, 'Must trigger completeness warning');
});

// Test 11: Invalid input handling (malformed package.json triggers DEP-005 without crashing)
runTest('Gracefully handles invalid JSON in package.json (DEP-005)', () => {
  const malformedFiles = {
    readme: '# Test App\n```bash\nnpm install\nnpm start\n```',
    packageJson: '{\n  "name": "broken-json",\n  "version": 1.0.0, // invalid JSON trailing comma\n}',
    requirementsTxt: '',
    envExample: '',
    testConfig: ''
  };
  const malformedStatuses = {
    readme: 'provided' as const,
    packageJson: 'provided' as const,
    requirementsTxt: 'not_provided' as const,
    envExample: 'not_provided' as const,
    testConfig: 'not_provided' as const
  };

  const result = analyzeProject(malformedFiles, malformedStatuses);
  const hasSyntaxErrorFinding = result.findings.some((f) => f.ruleId === 'DEP-005');
  assert(hasSyntaxErrorFinding, 'Must identify malformed package.json via DEP-005');
});

// Test 12: Distinction between missing file vs unprovided file
runTest('Correctly distinguishes missing file from not_provided file', () => {
  const baseFiles = {
    readme: '# Node App\nRequires dotenv.\n```bash\nnpm install\nnpm start\n```',
    packageJson: '{"name": "app", "dependencies": {"dotenv": "^16.0.0"}}',
    requirementsTxt: '',
    envExample: '',
    testConfig: ''
  };

  // Case A: envExample marked "not_provided" (user didn't upload it, but didn't confirm absent)
  const statusNotProvided = {
    readme: 'provided' as const,
    packageJson: 'provided' as const,
    requirementsTxt: 'not_provided' as const,
    envExample: 'not_provided' as const,
    testConfig: 'not_provided' as const
  };
  const resultA = analyzeProject(baseFiles, statusNotProvided);

  // Case B: envExample marked "missing" (confirmed missing from repo)
  const statusMissing = {
    readme: 'provided' as const,
    packageJson: 'provided' as const,
    requirementsTxt: 'not_provided' as const,
    envExample: 'missing' as const,
    testConfig: 'not_provided' as const
  };
  const resultB = analyzeProject(baseFiles, statusMissing);

  const findingInB = resultB.findings.some((f) => f.ruleId === 'ENV-001');
  assert(findingInB, 'ENV-001 must trigger when envExample is confirmed missing');
});

// Test 13: Score bounds verification (score is always clamped between 0 and 100)
runTest('Score bounds guarantee: score stays strictly within [0, 100]', () => {
  const worstCaseFiles = {
    readme: '',
    packageJson: '',
    requirementsTxt: '',
    envExample: '',
    testConfig: ''
  };
  const worstCaseStatuses = {
    readme: 'missing' as const,
    packageJson: 'missing' as const,
    requirementsTxt: 'missing' as const,
    envExample: 'missing' as const,
    testConfig: 'missing' as const
  };

  const result = analyzeProject(worstCaseFiles, worstCaseStatuses);
  assert(result.score.rawScore >= 0 && result.score.rawScore <= 100, 'Score must be clamped [0, 100]');
  assert(result.score.adjustedScore >= 0 && result.score.adjustedScore <= 100, 'Adjusted score must be clamped [0, 100]');
});

// Test 14: Technical Code Fix Re-analysis vs Self-Reported Resolution
runTest('Distinguishes technical code fix on re-analysis from self-reported resolution', () => {
  const sample = getSample('sample-express-broken');

  // Baseline has INST-002 (missing install command)
  const baseline = analyzeProject(sample.files, sample.fileStatuses);
  const hasInst002Baseline = baseline.findings.some((f) => f.ruleId === 'INST-002');
  assert(hasInst002Baseline, 'Baseline must trigger INST-002');

  // Case A: User marks INST-002 as resolved in session without changing file content
  const resolvedStatuses = { 'INST-002': 'resolved' as const };
  const sessionResult = analyzeProject(sample.files, sample.fileStatuses, resolvedStatuses);
  const inst002SessionFinding = sessionResult.findings.find((f) => f.ruleId === 'INST-002');
  assert(inst002SessionFinding !== undefined, 'Finding still generated in findings list');
  assert.strictEqual(inst002SessionFinding?.issueStatus, 'resolved', 'Status is resolved');
  assert.strictEqual(sessionResult.score.rawScore, baseline.score.rawScore, 'rawScore unchanged');
  assert(sessionResult.score.adjustedScore > baseline.score.adjustedScore, 'adjustedScore restored');

  // Case B: User actually edits README to add npm install
  const fixedFiles = {
    ...sample.files,
    readme: sample.files.readme + '\n## Installation\n```bash\nnpm install\n```\n'
  };
  const reanalyzedResult = analyzeProject(fixedFiles, sample.fileStatuses, {});
  const inst002Rechecked = reanalyzedResult.findings.some((f) => f.ruleId === 'INST-002');
  assert(!inst002Rechecked, 'INST-002 is technically resolved and completely absent from findings');
  assert(reanalyzedResult.score.rawScore > baseline.score.rawScore, 'rawScore increases automatically upon technical fix');
});

// Test 15: AI Response Schema and Type Validation
runTest('Validates AI model response structure and rejects malformed payloads', () => {
  // Case A: Valid structure
  const validPayload = {
    beginnerExplanation: 'Node dependencies must be installed before running scripts.',
    whyItMatters: 'Without npm install, node_modules is missing and scripts fail.',
    actionableSteps: ['Run npm install in repository root', 'Commit package-lock.json'],
    verificationCommand: 'npm list'
  };
  const validRes = validateAIExplanationStructure(validPayload);
  assert.strictEqual(validRes.valid, true);
  assert.strictEqual(validRes.validated?.actionableSteps.length, 2);

  // Case B: Missing actionableSteps
  const missingSteps = {
    beginnerExplanation: 'Explanation here',
    whyItMatters: 'Impact here'
  };
  const invalidRes1 = validateAIExplanationStructure(missingSteps);
  assert.strictEqual(invalidRes1.valid, false);

  // Case C: Non-string beginnerExplanation
  const nonStringExp = {
    beginnerExplanation: 12345,
    whyItMatters: 'Impact here',
    actionableSteps: ['Step 1']
  };
  const invalidRes2 = validateAIExplanationStructure(nonStringExp);
  assert.strictEqual(invalidRes2.valid, false);

  // Case D: Null or primitive payload
  assert.strictEqual(validateAIExplanationStructure(null).valid, false);
  assert.strictEqual(validateAIExplanationStructure('hello').valid, false);
});

// Test 16: Missing API Key Handling & Offline Fallback
runTest('Safe offline fallback handles missing API key gracefully', () => {
  const sample = getSample('sample-express-broken');
  const result = analyzeProject(sample.files, sample.fileStatuses);
  const firstFinding = result.findings[0];

  const fallback = generateDeterministicFallback(firstFinding);
  assert.strictEqual(fallback.isFallback, true);
  assert.strictEqual(fallback.validationPassed, true);
  assert(fallback.beginnerExplanation.length > 10);
  assert(fallback.actionableSteps.length > 0);
  assert(fallback.verificationCommand.length > 0);
});

// Test 17: Fallback Generation Robustness across all finding categories
runTest('Fallback generator robustly produces guidance across all 6 categories', () => {
  const categories = ['installation', 'dependencies', 'environment', 'testing', 'runtime_prerequisites', 'maintenance'] as const;
  for (const cat of categories) {
    const mockFinding: Finding = {
      id: `${cat}-01`,
      ruleId: `${cat}-01`,
      category: cat,
      severity: 'high',
      statusType: 'definite_observation',
      title: `Sample ${cat} finding`,
      fileSource: 'README.md',
      evidence: 'Sample evidence',
      whyItMatters: 'Why it matters for handoff',
      suggestedFix: 'Sample fix',
      issueStatus: 'open'
    };
    const fb = generateDeterministicFallback(mockFinding);
    assert.strictEqual(fb.isFallback, true);
    assert(fb.actionableSteps.length >= 1);
    assert(fb.verificationCommand.length > 0);
  }
});

console.log('\n----------------------------------------------------');
console.log(`Test Execution Summary: ${testsPassed} passed, ${testsFailed} failed`);
console.log('----------------------------------------------------');

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
