import React, { useState, useRef } from 'react';
import {
  FileText,
  Package,
  FileCode,
  KeyRound,
  CheckCircle2,
  UploadCloud,
  Trash2,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import type { FileKey, FileStatus, ProjectFiles } from '../types';

interface ProjectInputPanelProps {
  files: ProjectFiles;
  fileStatuses: Record<FileKey, FileStatus>;
  onFileChange: (key: FileKey, value: string) => void;
  onStatusChange: (key: FileKey, status: FileStatus) => void;
  onMultipleFilesLoaded: (loaded: Partial<Record<FileKey, string>>) => void;
}

interface TabConfig {
  key: FileKey;
  label: string;
  filename: string;
  icon: React.ReactNode;
  placeholder: string;
  hint: string;
}

const TABS: TabConfig[] = [
  {
    key: 'readme',
    label: 'README.md',
    filename: 'README.md',
    icon: <FileText size={16} />,
    placeholder: '# Project Title\n\n## Getting Started\nInstall dependencies...\n\n```bash\nnpm install\nnpm run dev\n```',
    hint: 'Primary onboarding doc. Scanned for setup commands, prerequisites, test steps, and local URLs.'
  },
  {
    key: 'packageJson',
    label: 'package.json',
    filename: 'package.json',
    icon: <Package size={16} />,
    placeholder: '{\n  "name": "my-project",\n  "scripts": {\n    "dev": "vite",\n    "test": "vitest"\n  },\n  "dependencies": {}\n}',
    hint: 'Node.js manifest. Scanned for scripts, engine version constraints, and dependency declarations.'
  },
  {
    key: 'requirementsTxt',
    label: 'requirements.txt',
    filename: 'requirements.txt',
    icon: <FileCode size={16} />,
    placeholder: 'fastapi==0.110.0\nuvicorn==0.28.0\npydantic==2.6.4\npython-dotenv==1.0.1',
    hint: 'Python manifest. Scanned for pinned version declarations and virtualenv requirements.'
  },
  {
    key: 'envExample',
    label: '.env.example',
    filename: '.env.example',
    icon: <KeyRound size={16} />,
    placeholder: 'PORT=3000\nDATABASE_URL=postgresql://user:password@localhost:5432/dbname\nAPI_KEY=your_key_here',
    hint: 'Environment template. Scanned for undocumented keys and accidental real credentials or tokens.'
  },
  {
    key: 'testConfig',
    label: 'Test Config / Guide',
    filename: 'test.config.js',
    icon: <CheckCircle2 size={16} />,
    placeholder: '// vitest.config.ts or test instructions\nexport default {\n  test: { globals: true }\n}',
    hint: 'Test runner configuration or manual testing verification guide.'
  }
];

export const ProjectInputPanel: React.FC<ProjectInputPanelProps> = ({
  files,
  fileStatuses,
  onFileChange,
  onStatusChange,
  onMultipleFilesLoaded
}) => {
  const [activeTab, setActiveTab] = useState<FileKey>('readme');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeConfig = TABS.find((t) => t.key === activeTab)!;
  const currentContent = files[activeTab] || '';
  const currentStatus = fileStatuses[activeTab];

  // Helper to match uploaded file to slot
  const routeFileToKey = (filename: string): FileKey | null => {
    const lower = filename.toLowerCase();
    if (lower.includes('readme')) return 'readme';
    if (lower === 'package.json') return 'packageJson';
    if (lower.includes('requirements') || lower.endsWith('pipfile') || lower === 'pyproject.toml')
      return 'requirementsTxt';
    if (lower.includes('.env') || lower.includes('env.example') || lower.includes('env.sample'))
      return 'envExample';
    if (lower.includes('test') || lower.includes('jest') || lower.includes('vitest') || lower.includes('pytest'))
      return 'testConfig';
    return null;
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const loadedMap: Partial<Record<FileKey, string>> = {};
    const readers: Promise<void>[] = [];

    Array.from(fileList).forEach((file) => {
      const matchedKey = routeFileToKey(file.name) || activeTab;
      const promise = new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          loadedMap[matchedKey] = text;
          resolve();
        };
        reader.readAsText(file);
      });
      readers.push(promise);
    });

    Promise.all(readers).then(() => {
      onMultipleFilesLoaded(loadedMap);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const linesCount = currentContent ? currentContent.split('\n').length : 0;
  const charCount = currentContent.length;

  return (
    <div className="input-panel-container">
      {/* Tab Navigation */}
      <div className="tab-bar-container">
        <div className="tabs-list">
          {TABS.map((tab) => {
            const status = fileStatuses[tab.key];
            const hasContent = !!files[tab.key]?.trim();
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`tab-btn ${isActive ? 'tab-btn-active' : ''}`}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>

                {/* Status Dot */}
                <span
                  className={`status-pill status-${status}`}
                  title={`Status: ${status} (${hasContent ? `${files[tab.key].length} chars` : 'empty'})`}
                >
                  {status === 'provided' ? (hasContent ? 'Provided' : 'Empty') : status === 'missing' ? 'Missing' : 'Not Given'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Multi-file Upload Trigger */}
        <div className="upload-quick-action">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-outline btn-sm"
            title="Upload multiple project files at once"
          >
            <UploadCloud size={14} />
            <span>Upload Files</span>
          </button>
        </div>
      </div>

      {/* Tab Header Controls */}
      <div className="tab-meta-bar">
        <div className="tab-info">
          <span className="tab-filename font-mono">{activeConfig.filename}</span>
          <span className="tab-hint text-muted">{activeConfig.hint}</span>
        </div>

        <div className="file-status-controls">
          <span className="control-label">File Status:</span>
          <div className="status-toggle-group">
            <button
              onClick={() => onStatusChange(activeTab, 'provided')}
              className={`toggle-option ${currentStatus === 'provided' ? 'toggle-active-provided' : ''}`}
            >
              Provided
            </button>
            <button
              onClick={() => onStatusChange(activeTab, 'not_provided')}
              className={`toggle-option ${currentStatus === 'not_provided' ? 'toggle-active-not-provided' : ''}`}
              title="File was not uploaded by user for this scan"
            >
              Not Provided
            </button>
            <button
              onClick={() => onStatusChange(activeTab, 'missing')}
              className={`toggle-option ${currentStatus === 'missing' ? 'toggle-active-missing' : ''}`}
              title="Explicitly confirm this file does NOT exist in the target project"
            >
              Missing from Repo
            </button>
          </div>

          {currentContent && (
            <button
              onClick={() => onFileChange(activeTab, '')}
              className="btn btn-ghost btn-xs text-danger"
              title="Clear file contents"
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Privacy Notice Strip */}
      <div className="input-privacy-notice-strip">
        <span className="privacy-badge">🔒 Privacy Notice:</span>
        <span className="privacy-text">
          Deterministic checks run locally in your browser. Live AI explanations send sanitized finding summaries to your configured LLM provider; do not paste production secrets, real API keys, or confidential source code.
        </span>
      </div>

      {/* Editor & Dropzone Area */}
      <div
        className={`editor-dropzone-wrapper ${isDragging ? 'dropzone-active' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isDragging && (
          <div className="dropzone-overlay">
            <UploadCloud size={48} className="dropzone-icon" />
            <p className="dropzone-text">Drop README, package.json, .env.example, or requirements.txt here</p>
          </div>
        )}

        {currentStatus === 'missing' ? (
          <div className="missing-state-banner">
            <AlertCircle size={24} className="text-danger" />
            <div>
              <p className="missing-title">Confirmed Missing from Repository</p>
              <p className="missing-desc">
                This file is marked as absent from the target codebase. The analysis engine will flag missing dependencies or instructions that depend on it.
              </p>
            </div>
            <button
              onClick={() => onStatusChange(activeTab, 'provided')}
              className="btn btn-outline btn-sm"
            >
              Provide Content
            </button>
          </div>
        ) : currentStatus === 'not_provided' ? (
          <div className="not-provided-state-banner">
            <HelpCircle size={24} className="text-muted" />
            <div>
              <p className="not-provided-title">File Not Provided for Analysis</p>
              <p className="not-provided-desc">
                This file was not supplied in the current session. RepoReady distinguishes unprovided files from confirmed missing files so your score reflects actual knowledge.
              </p>
            </div>
            <button
              onClick={() => onStatusChange(activeTab, 'provided')}
              className="btn btn-secondary btn-sm"
            >
              Switch to Provided
            </button>
          </div>
        ) : (
          <textarea
            className="code-editor-textarea font-mono"
            value={currentContent}
            onChange={(e) => onFileChange(activeTab, e.target.value)}
            placeholder={activeConfig.placeholder}
            spellCheck={false}
          />
        )}

        {/* Editor Footer */}
        <div className="editor-footer">
          <div className="editor-stats">
            <span>{linesCount} lines</span>
            <span className="dot-divider">•</span>
            <span>{charCount} characters</span>
            <span className="dot-divider">•</span>
            <span className="editor-mode">Mode: {activeConfig.label}</span>
          </div>
          <div className="drag-hint text-muted">
            Drag & drop files anytime to automatically route and inspect
          </div>
        </div>
      </div>
    </div>
  );
};
