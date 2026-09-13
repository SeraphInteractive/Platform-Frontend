import React from 'react';
import { EntryScoreBreakdown } from '@platform/internal-logic';

interface GraphsRowProps {
  leaderboard?: EntryScoreBreakdown[];
  totalBallots?: number;
}

export const GraphsRow: React.FC<GraphsRowProps> = ({
  leaderboard = [],
  totalBallots = 40,
}) => {
  const top1 = leaderboard[0];
  const top2 = leaderboard[1];

  const leadGap = (top1?.rawScore || 0) - (top2?.rawScore || 0);

  // Compute total points across all 3 ranks
  const r1Total = leaderboard.reduce((acc, curr) => acc + curr.rank1Count * 3, 0);
  const r2Total = leaderboard.reduce((acc, curr) => acc + curr.rank2Count * 2, 0);
  const r3Total = leaderboard.reduce((acc, curr) => acc + curr.rank3Count * 1, 0);
  const poolSum = r1Total + r2Total + r3Total || 1;

  const r1Pct = ((r1Total / poolSum) * 100).toFixed(0);
  const r2Pct = ((r2Total / poolSum) * 100).toFixed(0);
  const r3Pct = ((r3Total / poolSum) * 100).toFixed(0);

  return (
    <div className="graphs-row">
      {/* Card 1: 3-2-1 Credit Distribution */}
      <div className="white-card">
        <div className="chart-header">
          <div className="card-top-label" style={{ marginBottom: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <span>Rank Weight Distribution</span>
          </div>

          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-light)' }}>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>

        <div className="chart-big-metric-row">
          <div style={{ textAlign: 'left' }}>
            <div className="sub-metric-val">{r1Pct}%</div>
            <div className="sub-metric-lbl">Rank 1 (3p)</div>
            <div className="sub-metric-val" style={{ marginTop: 8 }}>{r2Pct}%</div>
            <div className="sub-metric-lbl">Rank 2 (2p)</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div className="sub-metric-lbl" style={{ textTransform: 'uppercase', fontSize: '9px', marginBottom: 2 }}>Average Points per Ballot</div>
            <div className="card-big-metric" style={{ marginBottom: 0, fontSize: '30px' }}>
              6,0
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: 4 }}>pts</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div className="sub-metric-val">{r3Pct}%</div>
            <div className="sub-metric-lbl">Rank 3 (1p)</div>
            <div className="sub-metric-val" style={{ marginTop: 8 }}>100%</div>
            <div className="sub-metric-lbl">Completeness</div>
          </div>
        </div>

        {/* Real Score Spread Histogram */}
        <div style={{ position: 'relative', marginTop: 10 }}>
          <div className="histogram-sparkline" style={{ height: '70px', alignItems: 'flex-end' }}>
            {leaderboard.map((item, i) => {
              const maxScore = top1?.rawScore || 1;
              const heightPct = Math.max(15, Math.round((item.rawScore / maxScore) * 100));
              return (
                <div
                  key={item.entryId}
                  className={`hist-bar ${i === 0 ? 'highlight' : ''}`}
                  style={{ height: `${heightPct}%`, width: `${Math.floor(100 / (leaderboard.length || 1)) - 2}%` }}
                  title={`${item.entryId}: ${item.rawScore} pts`}
                />
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-light)', marginTop: 4 }}>
            <span>Top Seed</span>
            <span>Lower Seeds</span>
          </div>
        </div>
      </div>

      {/* Card 2: Lead Gap and Race Status */}
      <div className="white-card">
        <div className="chart-header">
          <div className="card-top-label" style={{ marginBottom: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>First Place Lead Margin</span>
          </div>

          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-light)' }}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 14 14" />
          </svg>
        </div>

        <div className="chart-big-metric-row">
          <div style={{ textAlign: 'left' }}>
            <div className="sub-metric-val">{top1?.rawScore || 0} pts</div>
            <div className="sub-metric-lbl">Leader (#1)</div>
            <div className="sub-metric-val" style={{ marginTop: 8 }}>{top2?.rawScore || 0} pts</div>
            <div className="sub-metric-lbl">Challenger (#2)</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div className="sub-metric-lbl" style={{ textTransform: 'uppercase', fontSize: '9px', marginBottom: 2 }}>Point Lead Margin</div>
            <div className="card-big-metric" style={{ marginBottom: 0, fontSize: '30px', color: leadGap > 0 ? 'var(--accent-green)' : 'var(--text-main)' }}>
              +{leadGap}
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: 4 }}>pts</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div className="sub-metric-val">{totalBallots}</div>
            <div className="sub-metric-lbl">Voters</div>
            <div className="sub-metric-val" style={{ marginTop: 8 }}>{leadGap >= 8 ? 'Strong' : 'Contested'}</div>
            <div className="sub-metric-lbl">Lead Status</div>
          </div>
        </div>

        {/* Lead margin progression bars */}
        <div style={{ position: 'relative', marginTop: 10 }}>
          <div className="histogram-sparkline" style={{ height: '70px', alignItems: 'flex-end' }}>
            {[20, 30, 45, 55, 60, 72, 80, 85, 90, 100].map((h, i) => (
              <div
                key={i}
                className={`hist-bar ${i >= 8 ? 'highlight' : ''}`}
                style={{ height: `${h}%`, width: '8%' }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-light)', marginTop: 4 }}>
            <span>Early Rounds</span>
            <span>Current Standing</span>
          </div>
        </div>
      </div>
    </div>
  );
};
