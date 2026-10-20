import React from 'react';
import { X, Calculator, ShieldCheck, AlertCircle, Info, Scale } from 'lucide-react';
import type { ScoreBreakdown } from '../types';

interface ScoreModalProps {
  score: ScoreBreakdown;
  isOpen: boolean;
  onClose: () => void;
}

export const ScoreModal: React.FC<ScoreModalProps> = ({ score, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog score-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <Calculator size={20} className="text-accent" />
            </div>
            <div>
              <h3 className="modal-title">Transparent Heuristic Scoring Model</h3>
              <p className="modal-subtitle">
                Deterministic calculation formula and handoff rubric
              </p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" title="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Formula Callout */}
          <div className="formula-box">
            <div className="formula-equation font-mono">
              Adjusted Score = 100 - Σ(Unresolved Deductions)
            </div>
            <p className="formula-caption">
              Base score starts at 100 points distributed across 6 critical handoff dimensions.
              Every unresolved issue applies a deterministic deduction based on its documented severity level.
            </p>
          </div>

          {/* Rubric Table */}
          <div className="modal-section">
            <h4 className="modal-section-title">
              <Scale size={16} />
              <span>Category Weighting Matrix (Total: 100 Pts)</span>
            </h4>
            <div className="table-responsive">
              <table className="rubric-table">
                <thead>
                  <tr>
                    <th>Dimension</th>
                    <th>Max Weight</th>
                    <th>Current Earned</th>
                    <th>What We Check</th>
                  </tr>
                </thead>
                <tbody>
                  {score.categories.map((cat) => (
                    <tr key={cat.category}>
                      <td className="font-medium">{cat.categoryLabel}</td>
                      <td className="text-center font-mono">{cat.pointsMax} pts</td>
                      <td className="text-center font-mono">
                        <span
                          className={`points-tag ${
                            cat.pointsEarned === cat.pointsMax
                              ? 'points-tag-full'
                              : cat.pointsEarned > 0
                              ? 'points-tag-partial'
                              : 'points-tag-zero'
                          }`}
                        >
                          {cat.pointsEarned} pts
                        </span>
                      </td>
                      <td className="text-muted text-sm">
                        {cat.category === 'installation' && 'Install & start commands, package manager scripts'}
                        {cat.category === 'dependencies' && 'package.json / requirements.txt declarations, pinned versions, valid JSON syntax'}
                        {cat.category === 'runtime_prerequisites' && 'Node.js/Python version constraints, virtualenvs'}
                        {cat.category === 'environment' && '.env.example templates, undocumented keys, plaintext secret leaks'}
                        {cat.category === 'testing' && 'Automated test commands, real test runner configs'}
                        {cat.category === 'maintenance' && 'Expected ports, architecture overview, handoff contacts'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Documented 4-Tier Severity Deductions */}
          <div className="modal-section">
            <h4 className="modal-section-title">
              <AlertCircle size={16} />
              <span>Documented Severity Deduction Matrix</span>
            </h4>
            <div className="penalty-grid">
              <div className="penalty-card penalty-critical">
                <span className="penalty-badge">🔴 Critical (-12 pts)</span>
                <p className="penalty-desc">
                  Hard blockers preventing onboarding: missing install/run commands, exposed production secrets, absent manifests, malformed syntax.
                </p>
              </div>
              <div className="penalty-card penalty-high">
                <span className="penalty-badge">🟠 High (-8 pts)</span>
                <p className="penalty-desc">
                  Major setup friction: undocumented required environment variables, placeholder exit 1 test scripts, missing .env.example templates.
                </p>
              </div>
              <div className="penalty-card penalty-medium">
                <span className="penalty-badge">🟡 Medium (-5 pts)</span>
                <p className="penalty-desc">
                  Ambiguity & test gaps: unpinned runtime versions (Node/Python), missing virtualenv activation instructions, missing automated test steps.
                </p>
              </div>
              <div className="penalty-card penalty-low">
                <span className="penalty-badge">🔵 Low (-2 pts)</span>
                <p className="penalty-desc">
                  Best practice enhancements: unpinned dependencies in requirements.txt, missing localhost URL, absent maintainer contact.
                </p>
              </div>
            </div>
          </div>

          {/* Resolution Mechanism */}
          <div className="modal-section">
            <div className="info-banner">
              <ShieldCheck size={18} className="text-success" />
              <div>
                <strong>Session Remediation Credit:</strong> Marking an issue as "Resolved" restores its deducted points in the User-Reported Adjusted Score. Re-running automated analysis verifies whether the documentation changes were technically committed.
              </div>
            </div>
          </div>

          {/* Integrity Disclaimer */}
          <div className="integrity-box">
            <Info size={16} className="text-muted" />
            <p className="integrity-text">
              <strong>Evaluation Integrity:</strong> RepoReady does not pretend to execute binary code, verify compiler builds, or validate database credentials. The readiness score strictly reflects the clarity, completeness, and consistency of project handoff documentation.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
