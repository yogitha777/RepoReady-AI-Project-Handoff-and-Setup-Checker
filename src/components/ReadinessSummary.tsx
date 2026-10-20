import React from 'react';
import {
  ShieldAlert,
  AlertCircle,
  AlertTriangle,
  Info,
  Calculator,
  FileCheck2,
  AlertOctagon,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import type { AnalysisResult, AIProviderStatus } from '../types';

interface ReadinessSummaryProps {
  result: AnalysisResult;
  onOpenScoreModal: () => void;
  aiStatus: AIProviderStatus;
  onLoadComparisonDemo: () => void;
  isComparisonActive: boolean;
}

export const ReadinessSummary: React.FC<ReadinessSummaryProps> = ({
  result,
  onOpenScoreModal,
  aiStatus,
  onLoadComparisonDemo,
  isComparisonActive
}) => {
  const { score, summary, filesProvidedCount, filesTotalCount, projectName } = result;

  // Calculate SVG stroke offset for gauge
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score.adjustedScore / 100) * circumference;

  return (
    <div className="readiness-summary-card">
      <div className="summary-main-grid">
        {/* Score Gauge */}
        <div className="score-gauge-section">
          <div className="gauge-container">
            <svg className="gauge-svg" width="136" height="136" viewBox="0 0 136 136">
              {/* Background track */}
              <circle
                cx="68"
                cy="68"
                r={radius}
                className="gauge-track"
                strokeWidth="10"
                fill="none"
              />
              {/* Animated Progress Arc */}
              <circle
                cx="68"
                cy="68"
                r={radius}
                className="gauge-progress"
                strokeWidth="10"
                fill="none"
                stroke={score.gradeColor}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 68 68)"
              />
            </svg>
            <div className="gauge-center-content">
              <span className="gauge-score-value">{score.adjustedScore}</span>
              <span className="gauge-score-total">/ 100</span>
            </div>
          </div>

          <div className="score-labels">
            <span
              className="grade-badge"
              style={{
                backgroundColor: `${score.gradeColor}20`,
                color: score.gradeColor,
                borderColor: `${score.gradeColor}40`
              }}
            >
              {score.grade}
            </span>

            {summary.resolvedCount > 0 && (
              <span className="raw-score-diff">
                Automated Baseline: <strong>{score.rawScore}</strong> (+{score.adjustedScore - score.rawScore} user-resolved)
              </span>
            )}
          </div>
        </div>

        {/* Project Target & Overview */}
        <div className="summary-info-section">
          <div className="target-badge-row">
            <span className="target-label">Target Evaluation:</span>
            <span className="target-project-name">{projectName}</span>

            {/* AI Status Pill */}
            <span
              className={`ai-status-pill ${aiStatus.configured ? 'ai-status-online' : 'ai-status-offline'}`}
              title={aiStatus.productionNotice || aiStatus.message}
            >
              <Sparkles size={12} />
              <span>
                {aiStatus.configured
                  ? `AI Key Configured: ${aiStatus.provider.toUpperCase()} (${aiStatus.model})`
                  : aiStatus.deploymentMode === 'static-production'
                  ? 'AI Offline (Static Production Mode)'
                  : 'AI Offline (No API Key Configured)'}
              </span>
            </span>
          </div>

          <h2 className="summary-headline">
            {score.adjustedScore >= 85
              ? 'Handoff Ready: Comprehensive Documentation'
              : score.adjustedScore >= 60
              ? 'Needs Review: Notable Setup Friction Gaps'
              : 'Severe Gaps: High Risk of Onboarding Failure'}
          </h2>

          <p className="summary-narrative">
            {score.adjustedScore >= 85
              ? 'Incoming engineers can install dependencies, configure environment variables, start the server, and verify functionality without blocking friction.'
              : score.adjustedScore >= 60
              ? 'Basic setup exists, but missing runtime version specifications, unpinned dependencies, or undocumented variables will create onboarding roadblocks.'
              : 'High risk of onboarding failure. Key installation commands, security controls, or testing instructions are missing or contradictory.'}
          </p>

          {/* Input Coverage & Comparison Trigger */}
          <div className="input-coverage-strip">
            <div className="coverage-badge-group">
              <FileCheck2 size={15} className="text-muted" />
              <span className="coverage-text">
                Manifest Coverage: <strong>{filesProvidedCount} of {filesTotalCount}</strong> files supplied
              </span>
            </div>

            <button
              onClick={onOpenScoreModal}
              className="btn btn-ghost btn-xs text-accent formula-btn"
            >
              <Calculator size={13} />
              <span>How this is scored</span>
            </button>

            {/* Demo Comparison Trigger */}
            <button
              onClick={onLoadComparisonDemo}
              className="btn btn-outline btn-xs demo-compare-btn"
              title="Toggle between prepared baseline and remediated demonstration samples"
            >
              <span>{isComparisonActive ? 'View Baseline Sample (38 pts)' : 'View Remediated Sample (96 pts)'}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {score.inputCompletenessWarning && (
            <div className="completeness-alert">
              <AlertOctagon size={16} className="text-warning" />
              <span>{score.inputCompletenessWarning}</span>
            </div>
          )}
        </div>

        {/* Severity Metrics Cards (Accessible 4-Tier Breakdown) */}
        <div className="summary-metrics-section">
          <div className="metric-pill metric-critical">
            <div className="metric-header">
              <ShieldAlert size={15} />
              <span>Critical Gaps</span>
            </div>
            <span className="metric-count">{summary.criticalCount}</span>
            <span className="metric-sub">Immediate blocks</span>
          </div>

          <div className="metric-pill metric-high">
            <div className="metric-header">
              <AlertCircle size={15} />
              <span>High Severity</span>
            </div>
            <span className="metric-count">{summary.highCount}</span>
            <span className="metric-sub">Major setup friction</span>
          </div>

          <div className="metric-pill metric-medium">
            <div className="metric-header">
              <AlertTriangle size={15} />
              <span>Medium Severity</span>
            </div>
            <span className="metric-count">{summary.mediumCount}</span>
            <span className="metric-sub">Ambiguity & tests</span>
          </div>

          <div className="metric-pill metric-low">
            <div className="metric-header">
              <Info size={15} />
              <span>Low Severity</span>
            </div>
            <span className="metric-count">{summary.lowCount}</span>
            <span className="metric-sub">Best practice gaps</span>
          </div>
        </div>
      </div>

      {/* Honest Developer Tool Disclaimer */}
      <div className="evaluation-disclaimer-bar">
        <span className="disclaimer-bullet">ℹ️</span>
        <span className="disclaimer-text">
          <strong>Deterministic Documentation Heuristic:</strong> Evaluates handoff clarity, environment templates, and configuration consistency locally. Live AI explanations send sanitized finding summaries to your configured LLM provider; never submit real passwords or proprietary secrets. This analysis does not execute application code or verify network connectivity.
        </span>
      </div>
    </div>
  );
};
