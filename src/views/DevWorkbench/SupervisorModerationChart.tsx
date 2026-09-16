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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
      {/* 1. Executive Stat Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 12,
        }}
      >
        <div style={{ padding: '14px 18px', background: 'var(--bg-card-muted)', borderRadius: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            Total Pitches
          </div>
          <div className="mono" style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-main)', marginTop: 2 }}>
            {entries.length}
          </div>
        </div>

        <div style={{ padding: '14px 18px', background: 'var(--bg-card-muted)', borderRadius: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            Approved
          </div>
          <div className="mono" style={{ fontSize: '20px', fontWeight: 900, color: '#10b981', marginTop: 2 }}>
            {approvedCount}
          </div>
        </div>

        <div style={{ padding: '14px 18px', background: 'var(--bg-card-muted)', borderRadius: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            Pending
          </div>
          <div className="mono" style={{ fontSize: '20px', fontWeight: 900, color: pendingCount > 0 ? '#f59e0b' : 'var(--text-muted)', marginTop: 2 }}>
            {pendingCount}
          </div>
        </div>

        <div style={{ padding: '14px 18px', background: 'var(--bg-card-muted)', borderRadius: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            Flagged
          </div>
          <div className="mono" style={{ fontSize: '20px', fontWeight: 900, color: flaggedCount > 0 ? '#ef4444' : 'var(--text-muted)', marginTop: 2 }}>
            {flaggedCount}
          </div>
        </div>

        <div style={{ padding: '14px 18px', background: 'var(--bg-card-muted)', borderRadius: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            AI Risk
          </div>
          <div className="mono" style={{ fontSize: '20px', fontWeight: 900, color: syntheticCount > 0 ? '#ef4444' : '#10b981', marginTop: 2 }}>
            {syntheticPct}% ({syntheticCount})
          </div>
        </div>
      </div>

      {/* 2. Three-Column Detailed Analysis Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {/* Category Distribution Breakdown */}
        <div style={{ background: 'var(--bg-card)', padding: '18px 20px', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
              Categories
            </div>
            {selectedCategory && selectedCategory !== 'all' && (
              <button
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px' }}
                onClick={() => onSelectCategory && onSelectCategory('all')}
              >
                Reset Filter
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {categories.length === 0 ? (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
                No categorized proposals in this round.
              </div>
            ) : (
              categories.map(([cat, count]) => {
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
                      opacity: selectedCategory && selectedCategory !== 'all' && !isSelected ? 0.5 : 1,
                      padding: '6px 10px',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-card-muted)',
                      transition: 'all 0.15s ease',
                    }}
                    onClick={() => onSelectCategory && onSelectCategory(isSelected ? 'all' : cat)}
                  >
                    <span
                      style={{
                        width: 100,
                        fontSize: '11px',
                        fontWeight: isSelected ? 800 : 600,
                        color: isSelected ? '#38bdf8' : 'var(--text-main)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {cat}
                    </span>
                    <div style={{ flex: 1, height: 8, background: 'rgba(0,0,0,0.3)', borderRadius: 4, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: isSelected ? 'linear-gradient(90deg, #38bdf8, #0284c7)' : 'linear-gradient(90deg, #10b981, #059669)',
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
              })
            )}
          </div>
        </div>

        {/* Queue Health & Verification State */}
        <div style={{ background: 'var(--bg-card)', padding: '18px 20px', borderRadius: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginBottom: 14 }}>
            Queue Status
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <div style={{ background: 'var(--bg-card-muted)', padding: '12px 8px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>Approved</div>
              <div className="mono" style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-main)', marginTop: 2 }}>
                {approvedCount}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card-muted)', padding: '12px 8px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>Pending</div>
              <div className="mono" style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-main)', marginTop: 2 }}>
                {pendingCount}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card-muted)', padding: '12px 8px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase' }}>Flagged</div>
              <div className="mono" style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-main)', marginTop: 2 }}>
                {flaggedCount}
              </div>
            </div>
          </div>
        </div>

        {/* AI Detection & Synthetic Content Radar */}
        <div style={{ background: 'var(--bg-card)', padding: '18px 20px', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
              AI Scanner
            </div>
            <span
              className="mono"
              style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: '6px',
                background: syntheticCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.12)',
                color: syntheticCount > 0 ? '#ef4444' : '#10b981',
              }}
            >
              {syntheticCount > 0 ? `${syntheticPct}% Risk` : 'Clean Pool'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span className="mono">Human Verified: {humanCount}</span>
              <span className="mono">Synthetic AI: {syntheticCount}</span>
            </div>

            <div style={{ height: 8, background: 'rgba(0,0,0,0.3)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
              <div
                style={{
                  width: `${100 - syntheticPct}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #10b981, #059669)',
                  transition: 'width 0.4s ease',
                }}
              />
              <div
                style={{
                  width: `${syntheticPct}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #ef4444, #dc2626)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

