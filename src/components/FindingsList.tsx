import React, { useState } from 'react';
import type { Finding, FindingCategory, FindingSeverity, IssueStatus } from '../types';
import { FindingCard } from './FindingCard';
import { Search, SlidersHorizontal, CheckCheck } from 'lucide-react';

interface FindingsListProps {
  findings: Finding[];
  selectedCategory: FindingCategory | 'all';
  onSelectCategory: (category: FindingCategory | 'all') => void;
  onStatusChange: (id: string, status: IssueStatus) => void;
  onRequestAIExplanation: (finding: Finding) => Promise<void>;
  loadingAIId: string | null;
  onBatchResolveVisible: () => void;
}

export const FindingsList: React.FC<FindingsListProps> = ({
  findings,
  selectedCategory,
  onSelectCategory,
  onStatusChange,
  onRequestAIExplanation,
  loadingAIId,
  onBatchResolveVisible
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<FindingSeverity | 'all'>('all');
  const [issueStatusFilter, setIssueStatusFilter] = useState<IssueStatus | 'all'>('all');
  const [statusTypeFilter, setStatusTypeFilter] = useState<'all' | 'definite_observation' | 'potential_issue'>('all');

  // Filter calculations
  const filteredFindings = findings.filter((finding) => {
    // Search match
    const matchesSearch =
      searchQuery === '' ||
      finding.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      finding.evidence.toLowerCase().includes(searchQuery.toLowerCase()) ||
      finding.fileSource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      finding.ruleId.toLowerCase().includes(searchQuery.toLowerCase());

    // Category match
    const matchesCategory =
      selectedCategory === 'all' || finding.category === selectedCategory;

    // Severity match
    const matchesSeverity =
      severityFilter === 'all' || finding.severity === severityFilter;

    // Issue status match
    const matchesIssueStatus =
      issueStatusFilter === 'all' || finding.issueStatus === issueStatusFilter;

    // Status type match
    const matchesStatusType =
      statusTypeFilter === 'all' || finding.statusType === statusTypeFilter;

    return matchesSearch && matchesCategory && matchesSeverity && matchesIssueStatus && matchesStatusType;
  });

  const totalCount = findings.length;
  const criticalCount = findings.filter((f) => f.severity === 'critical' && f.issueStatus !== 'resolved').length;
  const highCount = findings.filter((f) => f.severity === 'high' && f.issueStatus !== 'resolved').length;
  const mediumCount = findings.filter((f) => f.severity === 'medium' && f.issueStatus !== 'resolved').length;
  const lowCount = findings.filter((f) => f.severity === 'low' && f.issueStatus !== 'resolved').length;
  const resolvedCount = findings.filter((f) => f.issueStatus === 'resolved').length;

  return (
    <div className="findings-section-container">
      {/* Search and Severity Filter Bar */}
      <div className="findings-controls-bar">
        <div className="search-input-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search findings by rule, keyword, file, or evidence..."
            className="search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="btn btn-ghost btn-xs text-muted"
            >
              Clear
            </button>
          )}
        </div>

        {/* Severity Filter Pills */}
        <div className="severity-filter-group">
          <button
            onClick={() => setSeverityFilter('all')}
            className={`filter-pill ${severityFilter === 'all' ? 'filter-pill-active' : ''}`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setSeverityFilter('critical')}
            className={`filter-pill filter-pill-critical ${severityFilter === 'critical' ? 'filter-pill-active' : ''}`}
          >
            🔴 Critical ({criticalCount})
          </button>
          <button
            onClick={() => setSeverityFilter('high')}
            className={`filter-pill filter-pill-high ${severityFilter === 'high' ? 'filter-pill-active' : ''}`}
          >
            🟠 High ({highCount})
          </button>
          <button
            onClick={() => setSeverityFilter('medium')}
            className={`filter-pill filter-pill-medium ${severityFilter === 'medium' ? 'filter-pill-active' : ''}`}
          >
            🟡 Medium ({mediumCount})
          </button>
          <button
            onClick={() => setSeverityFilter('low')}
            className={`filter-pill filter-pill-low ${severityFilter === 'low' ? 'filter-pill-active' : ''}`}
          >
            🔵 Low ({lowCount})
          </button>
        </div>
      </div>

      {/* Secondary filter & action strip */}
      <div className="findings-sub-bar">
        <div className="sub-bar-left">
          <span className="showing-count">
            Showing <strong>{filteredFindings.length}</strong> of {totalCount} findings
          </span>
          {selectedCategory !== 'all' && (
            <span className="active-category-pill">
              Category: {selectedCategory.replace('_', ' ')}
              <button
                onClick={() => onSelectCategory('all')}
                className="remove-cat-btn"
              >
                ×
              </button>
            </span>
          )}
        </div>

        <div className="sub-bar-right">
          {/* Issue Status Filter */}
          <div className="status-type-select-wrap">
            <span className="filter-label-text">Status:</span>
            <select
              value={issueStatusFilter}
              onChange={(e) => setIssueStatusFilter(e.target.value as any)}
              className="status-type-select"
            >
              <option value="all">All Issue Statuses ({totalCount})</option>
              <option value="open">Open Only</option>
              <option value="in_progress">In Progress Only</option>
              <option value="resolved">Resolved Only ({resolvedCount})</option>
            </select>
          </div>

          {/* Status type toggle */}
          <div className="status-type-select-wrap">
            <SlidersHorizontal size={13} className="text-muted" />
            <select
              value={statusTypeFilter}
              onChange={(e) => setStatusTypeFilter(e.target.value as any)}
              className="status-type-select"
            >
              <option value="all">All Finding Types</option>
              <option value="definite_observation">Definite Observations Only</option>
              <option value="potential_issue">Potential Issues Only</option>
            </select>
          </div>

          {filteredFindings.some((f) => f.issueStatus !== 'resolved') && (
            <button
              onClick={onBatchResolveVisible}
              className="btn btn-outline btn-xs"
              title="Mark all currently filtered findings as resolved"
            >
              <CheckCheck size={13} />
              <span>Mark Visible as Resolved</span>
            </button>
          )}
        </div>
      </div>

      {/* Findings Cards List */}
      <div className="findings-cards-list">
        {filteredFindings.length === 0 ? (
          <div className="findings-empty-state">
            <h4 className="empty-title">No Findings Match Active Filters</h4>
            <p className="empty-desc">
              All items in this view satisfy your filter criteria or have been addressed.
            </p>
            {(searchQuery || severityFilter !== 'all' || selectedCategory !== 'all' || issueStatusFilter !== 'all' || statusTypeFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSeverityFilter('all');
                  setIssueStatusFilter('all');
                  onSelectCategory('all');
                  setStatusTypeFilter('all');
                }}
                className="btn btn-secondary btn-sm"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          filteredFindings.map((finding) => (
            <FindingCard
              key={finding.id}
              finding={finding}
              onStatusChange={onStatusChange}
              onRequestAIExplanation={onRequestAIExplanation}
              isLoadingAI={loadingAIId === finding.id}
            />
          ))
        )}
      </div>
    </div>
  );
};
