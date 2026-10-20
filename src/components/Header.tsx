import React from 'react';
import { Play, Download, RotateCcw, ShieldCheck, FolderGit2 } from 'lucide-react';
import { SAMPLE_PROJECTS } from '../sampleData';

interface HeaderProps {
  currentSampleId: string;
  onSelectSample: (sampleId: string) => void;
  onAnalyze: () => void;
  onExport: () => void;
  onReset: () => void;
  isAnalyzing: boolean;
  hasResults: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentSampleId,
  onSelectSample,
  onAnalyze,
  onExport,
  onReset,
  isAnalyzing,
  hasResults
}) => {
  return (
    <header className="app-header">
      <div className="header-container">
        {/* Logo and Branding */}
        <div className="brand-group">
          <div className="logo-icon-box">
            <ShieldCheck className="brand-icon" size={24} />
          </div>
          <div>
            <div className="brand-title-row">
              <span className="brand-name">RepoReady</span>
              <span className="brand-badge">Developer Handoff Checker</span>
            </div>
            <p className="brand-subtitle">
              Inspect project documentation, uncover setup gaps, and score onboarding readiness
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="header-actions">
          {/* Sample Selector */}
          <div className="sample-select-wrapper">
            <FolderGit2 size={16} className="select-icon" />
            <select
              value={currentSampleId}
              onChange={(e) => onSelectSample(e.target.value)}
              className="sample-select"
              title="Load a predefined project scenario"
            >
              <option value="custom">✏️ Custom Input / Uploaded Files</option>
              <optgroup label="Sample Demonstrations">
                {SAMPLE_PROJECTS.map((sample) => (
                  <option key={sample.id} value={sample.id}>
                    {sample.name} ({sample.difficulty})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Reset Button */}
          <button
            onClick={onReset}
            className="btn btn-secondary btn-icon"
            title="Reset to blank inputs"
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>

          {/* Analyze Button */}
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className={`btn btn-primary ${isAnalyzing ? 'btn-loading' : ''}`}
            title="Run deterministic handoff rules"
          >
            <Play size={16} />
            <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Project'}</span>
          </button>

          {/* Export Report Button */}
          {hasResults && (
            <button
              onClick={onExport}
              className="btn btn-accent btn-icon"
              title="Export Markdown Handoff Report"
            >
              <Download size={16} />
              <span>Export Report</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
