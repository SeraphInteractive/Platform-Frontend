import React from 'react';
import { VotingEntry } from '../../hooks/useVotingApi.ts';
import { analyzeSyntheticContent } from '../../utils/aiDetector.ts';

interface SupervisorModerationChartProps {
  entries: VotingEntry[];
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

export const SupervisorModerationChart: React.FC<SupervisorModerationChartProps> = ({
  entries,
  selectedCategory,
  onSelectCategory,
}) => {
  const total = entries.length || 1;

  // Category counts
  const categoryMap: Record<string, number> = {};
  entries.forEach((e) => {
    const cat = e.category || 'General';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });

  const categories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

  const approvedCount = entries.filter((e) => (e.status || 'approved') === 'approved').length;
  const pendingCount = entries.filter((e) => e.status === 'pending' || e.status === 'pending_review').length;
  const flaggedCount = entries.filter((e) => e.status === 'flagged' || e.status === 'rejected').length;

  // AI Content Evaluation across current pool
  let syntheticCount = 0;
  let humanCount = 0;
  entries.forEach((entry) => {
    const res = analyzeSyntheticContent(entry.title, entry.description || '', entry.mediaUrl);
    if (res.isFlagged || res.verdict === 'SYNTHETIC_AI') {
      syntheticCount++;
    } else {
      humanCount++;
    }
  });

  const syntheticPct = Math.round((syntheticCount / total) * 100);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 20 }}>
      {/* 1. Category Distribution Breakdown */}
      <div style={{ background: 'var(--bg-card-muted)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
            Category Distribution
          </div>
          {selectedCategory && (
            <button
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '10px', padding: '2px 8px' }}
              onClick={() => onSelectCategory && onSelectCategory('all')}
            >
              Clear Filter
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {categories.map(([cat, count]) => {
            const pct = Math.round((count / total) * 100);
            const isSelected = selectedCategory === cat;
            return (
              <div
                key={cat}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: onSelectCategory ? 'pointer' : 'default',
                  opacity: selectedCategory && !isSelected ? 0.6 : 1,
                  padding: '2px 4px',
                  borderRadius: '4px',
                  background: isSelected ? 'var(--bg-card)' : 'transparent',
                }}
                onClick={() => onSelectCategory && onSelectCategory(isSelected ? 'all' : cat)}
              >
                <span
                  style={{
                    width: 100,
                    fontSize: '11px',
                    fontWeight: isSelected ? 800 : 600,
                    color: isSelected ? 'var(--accent-blue)' : 'var(--text-main)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {cat}
                </span>
                <div style={{ flex: 1, height: 8, background: 'var(--border-subtle)', borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: isSelected ? 'var(--accent-blue)' : '#10b981',
                      borderRadius: 4,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                <span className="mono" style={{ width: 55, textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)' }}>
                  {count} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Moderation Queue Metrics */}
      <div style={{ background: 'var(--bg-card-muted)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginBottom: 14 }}>
          Queue Status
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>Approved</div>
            <div className="mono" style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-main)', marginTop: 4 }}>
              {approvedCount}
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending</div>
            <div className="mono" style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-main)', marginTop: 4 }}>
              {pendingCount}
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase' }}>Flagged</div>
            <div className="mono" style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-main)', marginTop: 4 }}>
              {flaggedCount}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          Audit active proposals for safety and visual compliance.
        </div>
      </div>

      {/* 3. AI Detection & Synthetic Content Radar */}
      <div style={{ background: 'var(--bg-card-muted)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
            AI Content Scanner
          </div>
          <span
            className="mono"
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: syntheticCount > 0 ? '#ef4444' : '#10b981',
            }}
          >
            {syntheticCount} Flagged ({syntheticPct}%)
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>Human Baseline: {humanCount}</span>
            <span>Synthetic AI: {syntheticCount}</span>
          </div>

          <div style={{ height: 10, background: 'var(--border-subtle)', borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
            <div
              style={{
                width: `${100 - syntheticPct}%`,
                height: '100%',
                background: '#10b981',
                transition: 'width 0.4s ease',
              }}
              title={`Human Verified: ${humanCount}`}
            />
            <div
              style={{
                width: `${syntheticPct}%`,
                height: '100%',
                background: '#ef4444',
                transition: 'width 0.4s ease',
              }}
              title={`AI Flagged: ${syntheticCount}`}
            />
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
            Statistical lexical entropy and diffusion artifact scanner active across all uploads.
          </div>
        </div>
      </div>
    </div>
  );
};
