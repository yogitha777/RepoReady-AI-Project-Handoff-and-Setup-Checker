import React, { useState } from 'react';
import { X, Download, Copy, Check, FileText } from 'lucide-react';
import type { AnalysisResult } from '../types';
import { generateMarkdownReport } from '../analyzer';

interface ExportReportModalProps {
  result: AnalysisResult;
  isOpen: boolean;
  onClose: () => void;
  onNotify: (msg: string) => void;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  result,
  isOpen,
  onClose,
  onNotify
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const markdownContent = generateMarkdownReport(result);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    onNotify('Markdown handoff report copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = result.projectName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    link.href = url;
    link.setAttribute('download', `RepoReady-Report-${safeName}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onNotify('Report downloaded successfully!');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog export-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <FileText size={20} className="text-accent" />
            </div>
            <div>
              <h3 className="modal-title">Export Project Handoff Report</h3>
              <p className="modal-subtitle">
                Comprehensive, actionable Markdown ready to share with teams or commit to repo
              </p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" title="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Markdown Preview */}
        <div className="modal-body">
          <div className="report-preview-container font-mono">
            <pre className="report-pre">{markdownContent}</pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <div className="modal-footer-stats text-muted text-sm">
            <span>{markdownContent.length} characters</span>
            <span className="dot-divider">•</span>
            <span>{result.findings.length} findings itemized</span>
          </div>

          <div className="modal-footer-actions">
            <button onClick={handleCopy} className="btn btn-secondary">
              {copied ? (
                <>
                  <Check size={16} className="text-success" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>

            <button onClick={handleDownload} className="btn btn-primary">
              <Download size={16} />
              <span>Download .md File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
