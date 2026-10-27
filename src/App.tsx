import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ProjectInputPanel } from './components/ProjectInputPanel';
import { ReadinessSummary } from './components/ReadinessSummary';
import { CategoryScores } from './components/CategoryScores';
import { FindingsList } from './components/FindingsList';
import { ScoreModal } from './components/ScoreModal';
import { ExportReportModal } from './components/ExportReportModal';
import { NotificationToast } from './components/NotificationToast';
import { SAMPLE_PROJECTS } from './sampleData';
import { analyzeProject } from './analyzer';
import { checkAIProviderStatus, requestAIExplanation } from './services/aiExplainer';
import type {
  FileKey,
  FileStatus,
  Finding,
  FindingCategory,
  ProjectFiles,
  AnalysisResult,
  IssueStatus,
  AIExplanation,
  AIProviderStatus
} from './types';
import { Code2, ChevronUp, ChevronDown } from 'lucide-react';

export const App: React.FC = () => {
  // Default to sample 1 so judges and testers immediately see a live, working demo
  const initialSample = SAMPLE_PROJECTS[0];

  const [currentSampleId, setCurrentSampleId] = useState<string>(initialSample.id);
  const [files, setFiles] = useState<ProjectFiles>(initialSample.files);
  const [fileStatuses, setFileStatuses] = useState<Record<FileKey, FileStatus>>(
    initialSample.fileStatuses
  );
  const [userIssueStatuses, setUserIssueStatuses] = useState<Record<string, IssueStatus>>({});
  const [aiExplanations, setAiExplanations] = useState<Record<string, AIExplanation>>({});
  const [aiStatus, setAiStatus] = useState<AIProviderStatus>({
    configured: false,
    provider: 'none',
    model: 'none',
    message: 'Checking AI provider status...'
  });
  const [loadingAIId, setLoadingAIId] = useState<string | null>(null);
  const [isComparisonActive, setIsComparisonActive] = useState<boolean>(false);

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FindingCategory | 'all'>('all');
  const [isInputExpanded, setIsInputExpanded] = useState<boolean>(true);

  // Modals & Feedback
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Check AI Provider on mount
  useEffect(() => {
    async function initAI() {
      const status = await checkAIProviderStatus();
      setAiStatus(status);
    }
    initAI();
  }, []);

  // Synchronize analysis result whenever inputs, statuses, tracking, or AI explanations update
  useEffect(() => {
    const result = analyzeProject(files, fileStatuses, userIssueStatuses, aiExplanations);
    setAnalysisResult(result);
  }, [files, fileStatuses, userIssueStatuses, aiExplanations]);

  const handleSelectSample = (sampleId: string) => {
    setCurrentSampleId(sampleId);
    setIsComparisonActive(sampleId === 'sample-express-remediated');
    if (sampleId === 'custom') {
      showToast('Switched to custom input mode. Paste or upload your project files.');
      return;
    }
    const sample = SAMPLE_PROJECTS.find((s) => s.id === sampleId);
    if (sample) {
      setFiles(sample.files);
      setFileStatuses(sample.fileStatuses);
      setUserIssueStatuses({});
      setAiExplanations({});
      setSelectedCategory('all');
      showToast(`Loaded sample: "${sample.name}"`);
    }
  };

  const handleToggleComparisonDemo = () => {
    if (currentSampleId === 'sample-express-broken') {
      handleSelectSample('sample-express-remediated');
      setIsComparisonActive(true);
      showToast(
        'Loaded Remediated Demo Sample (100/100): Prepared sample demonstrating remediated documentation.'
      );
    } else {
      handleSelectSample('sample-express-broken');
      setIsComparisonActive(false);
      showToast(
        'Loaded Baseline Demo Sample (24/100): Prepared sample demonstrating common setup roadblocks.'
      );
    }
  };

  const handleReset = () => {
    setCurrentSampleId('custom');
    setIsComparisonActive(false);
    const emptyFiles: ProjectFiles = {
      readme: '',
      packageJson: '',
      requirementsTxt: '',
      envExample: '',
      testConfig: ''
    };
    const emptyStatuses: Record<FileKey, FileStatus> = {
      readme: 'provided',
      packageJson: 'not_provided',
      requirementsTxt: 'not_provided',
      envExample: 'not_provided',
      testConfig: 'not_provided'
    };
    setFiles(emptyFiles);
    setFileStatuses(emptyStatuses);
    setUserIssueStatuses({});
    setAiExplanations({});
    setSelectedCategory('all');
    showToast('Reset all files to blank state.');
  };

  const handleFileChange = (key: FileKey, value: string) => {
    setFiles((prev) => ({ ...prev, [key]: value }));
    if (fileStatuses[key] !== 'provided') {
      setFileStatuses((prev) => ({ ...prev, [key]: 'provided' }));
    }
    if (currentSampleId !== 'custom') {
      setCurrentSampleId('custom');
      setIsComparisonActive(false);
    }
  };

  const handleFileStatusChange = (key: FileKey, status: FileStatus) => {
    setFileStatuses((prev) => ({ ...prev, [key]: status }));
  };

  const handleMultipleFilesLoaded = (loaded: Partial<Record<FileKey, string>>) => {
    setFiles((prev) => ({ ...prev, ...loaded }));
    setFileStatuses((prev) => {
      const updated = { ...prev };
      Object.keys(loaded).forEach((k) => {
        updated[k as FileKey] = 'provided';
      });
      return updated;
    });
    setCurrentSampleId('custom');
    setIsComparisonActive(false);
    showToast(`Loaded ${Object.keys(loaded).length} file(s) into editor!`);
  };

  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const result = analyzeProject(files, fileStatuses, userIssueStatuses, aiExplanations);
      setAnalysisResult(result);
      setIsAnalyzing(false);
      showToast('Project analysis completed successfully.');
    }, 250);
  };

  const handleIssueStatusChange = (id: string, status: IssueStatus) => {
    setUserIssueStatuses((prev) => ({
      ...prev,
      [id]: status
    }));
    const label =
      status === 'resolved'
        ? 'Resolved (Self-Reported)'
        : status === 'in_progress'
        ? 'In Progress'
        : 'Open';
    showToast(`Finding ${id} marked as "${label}". Manual score adjustment updated.`);
  };

  const handleBatchResolveVisible = () => {
    if (!analysisResult) return;
    const nextStatuses: Record<string, IssueStatus> = { ...userIssueStatuses };
    analysisResult.findings.forEach((f) => {
      nextStatuses[f.id] = 'resolved';
    });
    setUserIssueStatuses(nextStatuses);
    showToast('Marked visible findings as Resolved (Self-Reported). Note: edit files for technical verification.');
  };

  const handleRequestAIExplanation = async (finding: Finding) => {
    setLoadingAIId(finding.id);
    try {
      const res = await requestAIExplanation(finding, analysisResult?.projectName || 'Project');
      setAiExplanations((prev) => ({
        ...prev,
        [finding.id]: res.explanation
      }));
      if (res.fromLiveAI) {
        showToast(`AI explanation generated for ${finding.id} via ${res.explanation.modelUsed}.`);
      } else {
        showToast(`Deterministic guidance loaded for ${finding.id} (AI offline or unconfigured).`);
      }
    } catch (err: any) {
      showToast(`Error requesting explanation for ${finding.id}.`);
    } finally {
      setLoadingAIId(null);
    }
  };

  return (
    <div className="app-layout">
      {/* Top Header */}
      <Header
        currentSampleId={currentSampleId}
        onSelectSample={handleSelectSample}
        onAnalyze={handleRunAnalysis}
        onExport={() => setIsExportModalOpen(true)}
        onReset={handleReset}
        isAnalyzing={isAnalyzing}
        hasResults={!!analysisResult}
      />

      {/* Main Container */}
      <main className="main-content">
        {/* Collapsible Input Panel Section */}
        <section className="input-collapsible-section">
          <div className="section-toggle-header">
            <div className="header-left">
              <Code2 size={18} className="text-accent" />
              <h2 className="panel-title">Target Project Manifests & Documentation</h2>
              <span className="panel-tag">
                {currentSampleId !== 'custom'
                  ? 'Sample Project Active'
                  : 'Custom Input'}
              </span>
            </div>
            <button
              onClick={() => setIsInputExpanded(!isInputExpanded)}
              className="btn btn-ghost btn-xs btn-toggle-panel"
            >
              <span>{isInputExpanded ? 'Collapse Input Editor' : 'Expand Input Editor'}</span>
              {isInputExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>

          {isInputExpanded && (
            <div className="panel-body-wrapper">
              <ProjectInputPanel
                files={files}
                fileStatuses={fileStatuses}
                onFileChange={handleFileChange}
                onStatusChange={handleFileStatusChange}
                onMultipleFilesLoaded={handleMultipleFilesLoaded}
              />
            </div>
          )}
        </section>

        {/* Results Section */}
        {analysisResult && (
          <section className="results-section">
            {/* 1. Readiness Summary Card */}
            <ReadinessSummary
              result={analysisResult}
              onOpenScoreModal={() => setIsScoreModalOpen(true)}
              aiStatus={aiStatus}
              onLoadComparisonDemo={handleToggleComparisonDemo}
              isComparisonActive={isComparisonActive}
            />

            {/* 2. Category Dimension Progress Bars */}
            <CategoryScores
              categories={analysisResult.score.categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {/* 3. Itemized Findings List */}
            <FindingsList
              findings={analysisResult.findings}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onStatusChange={handleIssueStatusChange}
              onRequestAIExplanation={handleRequestAIExplanation}
              loadingAIId={loadingAIId}
              onBatchResolveVisible={handleBatchResolveVisible}
            />
          </section>
        )}
      </main>

      {/* Modals */}
      {analysisResult && (
        <>
          <ScoreModal
            score={analysisResult.score}
            isOpen={isScoreModalOpen}
            onClose={() => setIsScoreModalOpen(false)}
          />
          <ExportReportModal
            result={analysisResult}
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            onNotify={showToast}
          />
        </>
      )}

      {/* Notification Toast */}
      <NotificationToast
        message={toastMessage}
        onDismiss={() => setToastMessage(null)}
      />

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <span>RepoReady v1.0 • AI & Developer Tools Innovation Showcase</span>
          <span className="dot-divider">•</span>
          <span>Deterministic Handoff Heuristic Engine & AI Explainer</span>
          <span className="dot-divider">•</span>
          <span>Client-Side Local Sandbox</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
