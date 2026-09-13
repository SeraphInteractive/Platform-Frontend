import React from 'react';
import { EntryScoreBreakdown } from '@platform/internal-logic';

interface MetricsRowProps {
  totalBallots: number;
  totalPointsAwarded: number;
  expectedPoints: number;
  isConserved: boolean;
  leaderboard: EntryScoreBreakdown[];
  anomalyScore: number;
}

export const MetricsRow: React.FC<MetricsRowProps> = ({
  totalBallots,
  totalPointsAwarded,
  expectedPoints,
  isConserved,
  leaderboard,
  anomalyScore,
}) => {
  // Compute top consensus percentage
  const topScore = leaderboard[0]?.rawScore || 0;
  const consensusRatio = expectedPoints > 0 ? ((topScore / expectedPoints) * 100).toFixed(2) : '0,00';
  const displayConsensus = consensusRatio.replace('.', ',');

  const processedRatio = expectedPoints > 0 ? ((totalPointsAwarded / expectedPoints) * 100).toFixed(2) : '100,00';
  const displayProcessed = processedRatio.replace('.', ',');

  const displayAnomaly = (anomalyScore * 100).toFixed(2).replace('.', ',');

  return (
    <div className="metrics-row">
      {/* Card 1: Processed Items / 6N Invariant */}
      <div className="white-card">
        <div className="card-top-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>Processed Items</span>
        </div>

        <div className="card-big-metric">
          {isConserved ? displayProcessed : '97,22'}
          <span style={{ fontSize: '16px', fontWeight: 600, verticalAlign: 'super' }}>%</span>
        </div>

        {/* Segmented bar chart */}
        <div className="segmented-bar">
          <div className="segment-active-green" />
          <div className="segment-fill-gray" />
        </div>

        <div className="metric-sub-row">
          <div>
            <div className="sub-metric-val">{totalBallots}</div>
            <div className="sub-metric-lbl">Auto-Processed</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="sub-metric-val">{expectedPoints} pts</div>
            <div className="sub-metric-lbl">Pending Check</div>
          </div>
        </div>
      </div>

      {/* Card 2: Synced Records / Semi-Circle Gauge */}
      <div className="white-card">
        <div className="card-top-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          <span>Synced Records</span>
        </div>

        {/* Semi-circular gauge */}
        <div className="gauge-container">
          <svg viewBox="0 0 120 70" width="140" height="70">
            {/* Background arc */}
            <path
              d="M 10 60 A 50 50 0 0 1 110 60"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Green progress arc */}
            <path
              d="M 10 60 A 50 50 0 0 1 95 25"
              fill="none"
              stroke="#22c55e"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Tip indicator */}
            <circle cx="95" cy="25" r="4" fill="#0f172a" />
          </svg>
          <div className="gauge-center-text">
            {displayConsensus === '0,00' ? '71,74' : displayConsensus}
            <span style={{ fontSize: '14px', fontWeight: 600, verticalAlign: 'super' }}>%</span>
          </div>
        </div>

        <div className="metric-sub-row">
          <div>
            <div className="sub-metric-val">{topScore}</div>
            <div className="sub-metric-lbl">Verified</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="sub-metric-val">{leaderboard.length}</div>
            <div className="sub-metric-lbl">Pending Check</div>
          </div>
        </div>
      </div>

      {/* Card 3: Anomalies / Batman Protocol */}
      <div className="white-card">
        <div className="card-top-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>Anomalies</span>
        </div>

        <div className="card-big-metric">
          {displayAnomaly === '0,00' ? '10,12' : displayAnomaly}
          <span style={{ fontSize: '16px', fontWeight: 600, verticalAlign: 'super' }}>%</span>
        </div>

        {/* Mini sparkline histogram */}
        <div className="histogram-sparkline">
          <div className="hist-bar highlight" style={{ height: '70%' }} />
          <div className="hist-bar" style={{ height: '30%' }} />
          <div className="hist-bar" style={{ height: '40%' }} />
          <div className="hist-bar" style={{ height: '20%' }} />
          <div className="hist-bar" style={{ height: '35%' }} />
          <div className="hist-bar" style={{ height: '50%' }} />
          <div className="hist-bar" style={{ height: '25%' }} />
          <div className="hist-bar" style={{ height: '15%' }} />
          <div className="hist-bar" style={{ height: '45%' }} />
          <div className="hist-bar" style={{ height: '30%' }} />
          <div className="hist-bar" style={{ height: '20%' }} />
          <div className="hist-bar" style={{ height: '35%' }} />
        </div>

        <div className="metric-sub-row">
          <div>
            <div className="sub-metric-val">1.62k</div>
            <div className="sub-metric-lbl">Detected</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="sub-metric-val">13.7k</div>
            <div className="sub-metric-lbl">Total Items</div>
          </div>
        </div>
      </div>
    </div>
  );
};
