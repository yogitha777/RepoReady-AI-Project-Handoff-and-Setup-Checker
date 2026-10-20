import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  ShieldAlert,
  Copy,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  Check,
  Sparkles,
  Loader2,
  Terminal,
  ListOrdered
} from 'lucide-react';
import type { Finding, IssueStatus } from '../types';

interface FindingCardProps {
  finding: Finding;
  onStatusChange: (id: string, status: IssueStatus) => void;
  onRequestAIExplanation: (finding: Finding) => Promise<void>;
  isLoadingAI: boolean;
}

export const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  onStatusChange,
  onRequestAIExplanation,
  isLoadingAI
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedVerifyCmd, setCopiedVerifyCmd] = useState(false);

  const handleCopy = (e: React.MouseEvent, text: string, isVerify = false) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    if (isVerify) {
      setCopiedVerifyCmd(true);
      setTimeout(() => setCopiedVerifyCmd(false), 2000);
    } else {
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    }
  };

  const getSeverityIcon = () => {
    switch (finding.severity) {
      case 'critical':
        return <ShieldAlert size={18} className="severity-icon-critical" />;
      case 'high':
        return <AlertCircle size={18} className="severity-icon-high" />;
      case 'medium':
        return <AlertTriangle size={18} className="severity-icon-medium" />;
      case 'low':
        return <Info size={18} className="severity-icon-low" />;
    }
  };

  return (
    <div
      className={`finding-card finding-${finding.severity} finding-status-${finding.issueStatus}`}
    >
      <div className="finding-header-row">
        <div className="finding-title-group">
          <div className="severity-indicator-wrapper" title={`Severity: ${finding.severity.toUpperCase()}`}>
            {getSeverityIcon()}
          </div>

          <div className="finding-meta-headings">
            <div className="finding-badges-row">
              {/* Accessible text + icon severity badge */}
              <span className={`badge-severity badge-${finding.severity}`}>
                {finding.severity === 'critical' && '🔴 CRITICAL'}
                {finding.severity === 'high' && '🟠 HIGH'}
                {finding.severity === 'medium' && '🟡 MEDIUM'}
                {finding.severity === 'low' && '🔵 LOW'}
              </span>

              <span className="badge-rule-id font-mono">[{finding.ruleId}]</span>

              <span className="badge-category">{finding.category.replace('_', ' ')}</span>

              <span
                className={`badge-status-type ${
                  finding.statusType === 'definite_observation'
                    ? 'status-definite'
                    : 'status-potential'
                }`}
                title={
                  finding.statusType === 'definite_observation'
                    ? 'Directly proven by scanning the provided files'
                    : 'Probable issue based on common onboarding patterns'
                }
              >
                {finding.statusType === 'definite_observation'
                  ? 'Definite Observation'
                  : 'Potential Issue'}
              </span>

              <span className="badge-file-source font-mono">
                <FileText size={12} />
                {finding.fileSource}
              </span>
            </div>

            <h4 className="finding-title-text">{finding.title}</h4>
          </div>
        </div>

        {/* Issue Status Workflow Controls */}
        <div className="finding-action-group">
          <div className="issue-status-dropdown-wrap">
            <label className="issue-status-label">Status:</label>
            <select
              value={finding.issueStatus}
              onChange={(e) => onStatusChange(finding.id, e.target.value as IssueStatus)}
              className={`issue-status-select select-status-${finding.issueStatus}`}
              title="Update user-reported issue status (distinguished from automated rechecks)"
            >
              <option value="open">🔴 Open</option>
              <option value="in_progress">⏳ In Progress</option>
              <option value="resolved">✅ Resolved (Self-Reported)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Primary Evidence Strip */}
      <div className="finding-evidence-strip">
        <div className="evidence-label">
          <span>Observed Evidence:</span>
        </div>
        <div className="evidence-content font-mono">{finding.evidence}</div>
      </div>

      {/* Action Strip: AI Explainer Trigger & Details Toggle */}
      <div className="finding-actions-strip">
        <div className="action-buttons-left">
          <button
            onClick={() => onRequestAIExplanation(finding)}
            disabled={isLoadingAI}
            className={`btn btn-ai-action ${finding.aiExplanation ? 'btn-ai-active' : ''}`}
            title="Generate beginner-friendly explanation and prioritized remediation steps using AI"
          >
            {isLoadingAI ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Generating AI Analysis...</span>
              </>
            ) : finding.aiExplanation ? (
              <>
                <Sparkles size={14} className="text-ai" />
                <span>AI Guidance Attached</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Explain with AI</span>
              </>
            )}
          </button>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="btn-expand-details"
        >
          <span>{isExpanded ? 'Hide Details & Fix' : 'View Fix & Reasoning'}</span>
          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* AI Explanation Card (when generated or attached) */}
      {finding.aiExplanation && (
        <div className="ai-explanation-container">
          <div className="ai-explanation-header">
            <div className="ai-title-row">
              <Sparkles size={16} className="text-ai" />
              <span className="ai-box-title">AI Issue Explainer</span>
              <span className="ai-model-tag">{finding.aiExplanation.modelUsed}</span>
            </div>
            <span className="ai-timestamp text-muted">
              {new Date(finding.aiExplanation.generatedAt).toLocaleTimeString()}
            </span>
          </div>

          <div className="ai-explanation-body">
            {/* 1. Beginner Explanation */}
            <div className="ai-field">
              <h5 className="ai-field-label">1. Beginner-Friendly Explanation</h5>
              <p className="ai-field-content">{finding.aiExplanation.beginnerExplanation}</p>
            </div>

            {/* 2. Why it matters to receiving developer */}
            <div className="ai-field">
              <h5 className="ai-field-label">2. Why It Matters for Handoff</h5>
              <p className="ai-field-content">{finding.aiExplanation.whyItMatters}</p>
            </div>

            {/* 3. Prioritized actionable steps */}
            <div className="ai-field">
              <h5 className="ai-field-label">
                <ListOrdered size={14} />
                <span>3. Prioritized Actionable Steps</span>
              </h5>
              <ol className="ai-steps-list">
                {finding.aiExplanation.actionableSteps.map((step, idx) => (
                  <li key={idx} className="ai-step-item">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* 4. Verification Command */}
            <div className="ai-field">
              <h5 className="ai-field-label">
                <Terminal size={14} />
                <span>4. Suggested Verification Check</span>
              </h5>
              <div className="verification-code-box font-mono">
                <code>{finding.aiExplanation.verificationCommand}</code>
                <button
                  onClick={(e) => handleCopy(e, finding.aiExplanation!.verificationCommand, true)}
                  className="btn btn-ghost btn-xs copy-code-btn"
                  title="Copy verification command"
                >
                  {copiedVerifyCmd ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                  <span>{copiedVerifyCmd ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accordion / Expandable Context */}
      {isExpanded && (
        <div className="finding-expanded-body">
          {/* Why It Matters */}
          <div className="detail-section">
            <div className="detail-heading">
              <HelpCircle size={15} className="text-accent" />
              <span>Why This Gap Hurts Onboarding:</span>
            </div>
            <p className="detail-explanation">{finding.whyItMatters}</p>
          </div>

          {/* Suggested Fix */}
          <div className="detail-section">
            <div className="detail-heading">
              <Check size={15} className="text-success" />
              <span>Recommended Remediation:</span>
            </div>
            <p className="detail-explanation">{finding.suggestedFix}</p>

            {finding.suggestedSnippet && (
              <div className="code-fix-block">
                <div className="code-fix-header">
                  <span>Recommended Snippet</span>
                  <button
                    onClick={(e) => handleCopy(e, finding.suggestedSnippet!)}
                    className="btn btn-ghost btn-xs copy-code-btn"
                  >
                    {copiedSnippet ? (
                      <>
                        <Check size={12} className="text-success" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy Snippet</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="code-fix-pre font-mono">
                  <code>{finding.suggestedSnippet}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
