export type FileKey = 'readme' | 'packageJson' | 'requirementsTxt' | 'envExample' | 'testConfig';

export type FileStatus = 'provided' | 'not_provided' | 'missing';

export interface ProjectFiles {
  readme: string;
  packageJson: string;
  requirementsTxt: string;
  envExample: string;
  testConfig: string;
}

export interface FileMetadata {
  key: FileKey;
  label: string;
  fileName: string;
  description: string;
  language: 'markdown' | 'json' | 'text' | 'shell';
}

export type FindingCategory =
  | 'installation'
  | 'dependencies'
  | 'environment'
  | 'testing'
  | 'runtime_prerequisites'
  | 'maintenance';

export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low';

export type FindingStatusType = 'definite_observation' | 'potential_issue';

export type IssueStatus = 'open' | 'in_progress' | 'resolved';

export interface AIExplanation {
  beginnerExplanation: string;
  whyItMatters: string;
  actionableSteps: string[];
  verificationCommand: string;
  modelUsed: string;
  generatedAt: string;
  isFallback?: boolean;
  validationPassed?: boolean;
  error?: string;
}

export interface Finding {
  id: string;
  category: FindingCategory;
  severity: FindingSeverity;
  statusType: FindingStatusType;
  title: string;
  fileSource: string;
  evidence: string;
  whyItMatters: string;
  suggestedFix: string;
  suggestedSnippet?: string;
  ruleId: string;
  issueStatus: IssueStatus;
  isAutomaticallyRechecked?: boolean;
  aiExplanation?: AIExplanation;
}

export interface CategoryScore {
  category: FindingCategory;
  categoryLabel: string;
  pointsEarned: number;
  pointsMax: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export interface ScoreBreakdown {
  rawScore: number;
  adjustedScore: number;
  maxScore: number;
  grade: 'Handoff Ready' | 'Needs Review' | 'Severe Gaps';
  gradeColor: string;
  categories: CategoryScore[];
  penalties: {
    ruleId: string;
    description: string;
    category: FindingCategory;
    severity: FindingSeverity;
    deduction: number;
  }[];
  inputCompletenessWarning?: string;
  checksPerformed: string[];
  checksNotPerformed: string[];
}

export interface AnalysisResult {
  timestamp: string;
  projectName: string;
  filesProvidedCount: number;
  filesTotalCount: number;
  findings: Finding[];
  score: ScoreBreakdown;
  summary: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    openCount: number;
    inProgressCount: number;
    resolvedCount: number;
    totalFindings: number;
  };
  checksPerformed: string[];
  checksNotPerformed: string[];
}

export interface SampleProject {
  id: string;
  name: string;
  tagline: string;
  difficulty: 'High Gaps' | 'Moderate Gaps' | 'Clean / Gold Standard';
  description: string;
  isDemo?: boolean;
  files: ProjectFiles;
  fileStatuses: Record<FileKey, FileStatus>;
}

export interface AIProviderStatus {
  configured: boolean;
  keyConfigured?: boolean;
  liveAvailable?: boolean;
  provider: 'gemini' | 'openai' | 'none';
  model: string;
  deploymentMode?: string;
  productionNotice?: string;
  message?: string;
}
