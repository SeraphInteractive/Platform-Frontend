import React from 'react';
import { EntryScoreBreakdown } from '@platform/internal-logic';
import { VotingEntry } from '../../hooks/useVotingApi.ts';

interface MetricsRowProps {
  totalBallots: number;
  totalPointsAwarded: number;
  expectedPoints: number;
  isConserved: boolean;
  leaderboard: EntryScoreBreakdown[];
  entries: VotingEntry[];
}

export const MetricsRow: React.FC<MetricsRowProps> = ({
  totalBallots,
  totalPointsAwarded,
  expectedPoints,
  isConserved,
  leaderboard,
  entries,
}) => {
  // Top pitch details
  const topEntryId = leaderboard[0]?.entryId;
  const topEntry = entries.find((e) => e.id === topEntryId);
  const topScore = leaderboard[0]?.rawScore || 0;

  // Percentage of total pool won by top candidate
  const topPointShare = expectedPoints > 0 ? ((topScore / expectedPoints) * 100).toFixed(1) : '0,0';
  const displayTopShare = topPointShare.replace('.', ',');

  // Conservation ratio
  const conservationRatio = expectedPoints > 0 ? ((totalPointsAwarded / expectedPoints) * 100).toFixed(2) : '100,00';
  const displayConservation = conservationRatio.replace('.', ',');

  return (
    <div className="metrics-row">
      {/* Card 1: Total Ballots & 6N Allocation */}
      <div className="white-card">
        <div className="card-top-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>Community Participation</span>
        </div>

        <div className="card-big-metric">
          {totalBallots}
          <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: 6 }}>
            ballots
          </span>
        </div>

        {/* Segmented bar chart */}
        <div className="segmented-bar">
          <div className="segment-active-green" />
          <div className="segment-fill-gray" />
        </div>

        <div className="metric-sub-row">
          <div>
            <div className="sub-metric-val">{totalPointsAwarded} pts</div>
            <div className="sub-metric-lbl">Awarded in Pool</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="sub-metric-val">{expectedPoints} pts</div>
            <div className="sub-metric-lbl">Expected (6N)</div>
          </div>
        </div>
      </div>

      {/* Card 2: Leading Pitch & Share Gauge */}
      <div className="white-card">
        <div className="card-top-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span>Current #1 Leader</span>
        </div>

        {/* Semi-circular gauge */}
        <div className="gauge-container">
          <svg viewBox="0 0 120 70" width="140" height="70">
            <path
              d="M 10 60 A 50 50 0 0 1 110 60"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M 10 60 A 50 50 0 0 1 95 25"
              fill="none"
              stroke="#22c55e"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <circle cx="95" cy="25" r="4" fill="#0f172a" />
          </svg>
          <div className="gauge-center-text">
            {displayTopShare}
            <span style={{ fontSize: '13px', fontWeight: 600, verticalAlign: 'super' }}>%</span>
          </div>
        </div>

        <div className="metric-sub-row">
          <div style={{ maxWidth: '65%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <div className="sub-metric-val">{topEntry?.title || 'No votes yet'}</div>
            <div className="sub-metric-lbl">Leading Pitch</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="sub-metric-val">{topScore} pts</div>
            <div className="sub-metric-lbl">Leader Score</div>
          </div>
        </div>
      </div>

      {/* Card 3: 6N Mathematical Conservation Invariant */}
      <div className="white-card">
        <div className="card-top-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>Mathematical Invariant</span>
        </div>

        <div className="card-big-metric">
          {displayConservation}
          <span style={{ fontSize: '16px', fontWeight: 600, verticalAlign: 'super' }}>%</span>
        </div>

        {/* Mini sparkline histogram */}
        <div className="histogram-sparkline">
          <div className="hist-bar highlight" style={{ height: '80%' }} />
          <div className="hist-bar highlight" style={{ height: '70%' }} />
          <div className="hist-bar" style={{ height: '40%' }} />
          <div className="hist-bar" style={{ height: '50%' }} />
          <div className="hist-bar" style={{ height: '35%' }} />
          <div className="hist-bar" style={{ height: '60%' }} />
          <div className="hist-bar" style={{ height: '45%' }} />
          <div className="hist-bar" style={{ height: '30%' }} />
          <div className="hist-bar" style={{ height: '55%' }} />
          <div className="hist-bar" style={{ height: '25%' }} />
          <div className="hist-bar" style={{ height: '35%' }} />
          <div className="hist-bar" style={{ height: '40%' }} />
        </div>

        <div className="metric-sub-row">
          <div>
            <div className="sub-metric-val" style={{ color: isConserved ? 'var(--accent-green)' : 'var(--color-danger)' }}>
              {isConserved ? '0.00% Drift' : 'Drift Alert'}
            </div>
            <div className="sub-metric-lbl">Conservation Check</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="sub-metric-val">{entries.length} Pitches</div>
            <div className="sub-metric-lbl">Registered Entries</div>
          </div>
        </div>
      </div>
    </div>
  );
};
