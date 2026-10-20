import React from 'react';
import type { CategoryScore, FindingCategory } from '../types';
import {
  Terminal,
  Package,
  Cpu,
  KeyRound,
  CheckCircle2,
  Users
} from 'lucide-react';

interface CategoryScoresProps {
  categories: CategoryScore[];
  selectedCategory: FindingCategory | 'all';
  onSelectCategory: (category: FindingCategory | 'all') => void;
}

const CATEGORY_ICONS: Record<FindingCategory, React.ReactNode> = {
  installation: <Terminal size={15} />,
  dependencies: <Package size={15} />,
  runtime_prerequisites: <Cpu size={15} />,
  environment: <KeyRound size={15} />,
  testing: <CheckCircle2 size={15} />,
  maintenance: <Users size={15} />
};

export const CategoryScores: React.FC<CategoryScoresProps> = ({
  categories,
  selectedCategory,
  onSelectCategory
}) => {
  return (
    <div className="category-scores-card">
      <div className="category-scores-header">
        <h3 className="section-title">Evaluation Dimensions</h3>
        <span className="section-subtitle">
          Click any dimension to filter findings below
        </span>
      </div>

      <div className="categories-grid">
        {categories.map((cat) => {
          const percent = Math.round((cat.pointsEarned / cat.pointsMax) * 100);
          const isSelected = selectedCategory === cat.category;

          let barColor = '#10b981'; // green
          if (percent < 60) barColor = '#ef4444'; // red
          else if (percent < 85) barColor = '#f59e0b'; // amber

          return (
            <div
              key={cat.category}
              onClick={() => onSelectCategory(isSelected ? 'all' : cat.category)}
              className={`category-item-card ${isSelected ? 'category-item-selected' : ''}`}
            >
              <div className="cat-item-top">
                <div className="cat-title-group">
                  <span className="cat-icon">{CATEGORY_ICONS[cat.category]}</span>
                  <span className="cat-name">{cat.categoryLabel}</span>
                </div>
                <div className="cat-points">
                  <span className="points-earned">{cat.pointsEarned}</span>
                  <span className="points-max">/{cat.pointsMax}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="cat-progress-track">
                <div
                  className="cat-progress-fill"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: barColor
                  }}
                />
              </div>

              <div className="cat-item-bottom">
                <span className="cat-percentage">{percent}% readiness</span>
                <div className="cat-gap-tags">
                  {cat.criticalCount > 0 && (
                    <span className="cat-tag tag-critical">{cat.criticalCount} crit</span>
                  )}
                  {cat.highCount > 0 && (
                    <span className="cat-tag tag-high">{cat.highCount} high</span>
                  )}
                  {cat.mediumCount > 0 && (
                    <span className="cat-tag tag-medium">{cat.mediumCount} med</span>
                  )}
                  {cat.lowCount > 0 && (
                    <span className="cat-tag tag-low">{cat.lowCount} low</span>
                  )}
                  {cat.criticalCount === 0 &&
                    cat.highCount === 0 &&
                    cat.mediumCount === 0 &&
                    cat.lowCount === 0 && (
                      <span className="cat-tag tag-clean">Passed</span>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
