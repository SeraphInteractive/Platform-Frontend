import React, { useState } from 'react';
import { RaidTelemetry, Ballot, EntryScoreBreakdown } from '@platform/internal-logic';
import { TrajectoryCoordinateGraph, TrajectorySeries, TimeSpanOption } from '../../components/TrajectoryCoordinateGraph.tsx';
import { computeLiveTrajectories } from '../../utils/liveTrajectory.ts';
import { VotingEntry } from '../../hooks/useVotingApi.ts';

interface RaidTelemetryChartProps {
  telemetry: RaidTelemetry;
  velocityZScore: number;
  ballots?: Ballot[];
  entries?: VotingEntry[];
  leaderboard?: EntryScoreBreakdown[];
  telemetryList?: RaidTelemetry[];
  onSelectEntry?: (entryId: string) => void;
}

export const RaidTelemetryChart: React.FC<RaidTelemetryChartProps> = ({
  telemetry,
  velocityZScore,
  ballots = [],
  entries = [],
  leaderboard = [],
  telemetryList = [],
  onSelectEntry,
}) => {
  const [timeSpan, setTimeSpan] = useState<'all' | '10' | '25' | '50'>('all');
  const { severity, rankEntropy, breakdown } = telemetry;
  const topHeavyPct = (breakdown.rank1ToTotalRatio * 100).toFixed(1);

  // Maximum theoretical Shannon entropy for 3 ranks = log2(3) ≈ 1.585
  const maxEntropy = 1.585;
  const entropyRatio = Math.min(100, Math.round((rankEntropy / maxEntropy) * 100));

  // Risk badge color: green for normal baseline, red for warning/critical
  const isAnomalous = severity === 'CRITICAL_RAID' || severity === 'SUSPICIOUS';
  const riskColor = isAnomalous ? 'var(--color-danger)' : 'var(--accent-green)';

  // Z-Score gauge position: clamp between -3 and +3 standard deviations
  const clampedZ = Math.max(-3, Math.min(3, velocityZScore));
  const zGaugePct = Math.round(((clampedZ + 3) / 6) * 100);

  // 1. Live Trajectory computed from actual API ballots
  const liveResult = computeLiveTrajectories(entries, ballots, 3, timeSpan);

  // 2. Tutorial Reference Series (canonical patterns: steady speed, plateau, delayed surge spike)
  const tutorialSeries: TrajectorySeries[] = [
    {
      id: 'tut_baseline',
      name: 'Baseline',
      color: '#10b981',
      strokeWidth: 2,
      points: [
        { x: 0, y: 0 },
        { x: 2, y: 20 },
        { x: 4, y: 40 },
        { x: 6, y: 60 },
        { x: 8, y: 80 },
        { x: 10, y: 100 },
      ],
      annotations: [
        { x: 5, y: 55, text: 'Linear Baseline', color: '#10b981' },
      ],
      description: 'Organic intake maintaining steady Shannon entropy across all ranks.',
    },
    {
      id: 'tut_organic',
      name: 'Organic',
      color: 'var(--text-muted)',
      strokeWidth: 2,
      dashArray: '4,3',
      points: [
        { x: 0, y: 0 },
        { x: 2, y: 16 },
        { x: 5, y: 40 },
        { x: 7, y: 40 },
        { x: 9, y: 40 },
        { x: 11, y: 15 },
        { x: 12, y: 0 },
      ],
      annotations: [
        { x: 2.5, y: 22, text: 'Steady Flow', color: 'var(--text-muted)' },
        { x: 7, y: 45, text: 'Plateau', color: 'var(--text-muted)' },
      ],
      description: 'Normal distributed voting progression with standard candidate variance.',
    },
    {
      id: 'tut_surge',
      name: 'Surge Anomaly',
      color: '#ef4444',
      strokeWidth: 2.5,
      points: [
        { x: 2, y: 2 },
        { x: 4, y: 8 },
        { x: 5, y: 22 },
        { x: 6, y: 55 },
        { x: 7, y: 78 },
        { x: 8, y: 88 },
        { x: 10, y: 92 },
        { x: 12, y: 92 },
      ],
      annotations: [
        { x: 5.8, y: 48, text: 'Surge Inflection', color: '#ef4444' },
      ],
      description: 'Abrupt volume acceleration with high rank 1 skew.',
    },
  ];

  const timeSpanOptions: TimeSpanOption[] = [
    { id: 'all', label: 'All Time' },
    { id: '10', label: 'Last 10' },
    { id: '25', label: 'Last 25' },
    { id: '50', label: 'Last 50' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 16 }}>
      {/* 1. Live Trajectory Graph (On Top) */}
      <TrajectoryCoordinateGraph
        title="Live Candidate Trajectory"
        xLabel="Ballots Sequence (N)"
        yLabel="Cumulative Points (pts)"
        xMin={liveResult.xMin}
        xMax={liveResult.xMax}
        yMin={liveResult.yMin}
        yMax={liveResult.yMax}
        xStep={liveResult.xStep}
        yStep={liveResult.yStep}
        series={liveResult.series}
        height={360}
        xUnit=" ballots"
        yUnit=" pts"
        timeSpans={timeSpanOptions}
        activeTimeSpan={timeSpan}
        onTimeSpanChange={(span) => setTimeSpan(span as 'all' | '10' | '25' | '50')}
      />

      {/* 2. Telemetry Gauge & Concentration Meters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {/* Shannon Rank Entropy Meter */}
        <div style={{ background: 'var(--bg-card-muted)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
              Entropy H(X)
            </div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: riskColor, textTransform: 'uppercase' }}>
              {severity}
            </span>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: 6 }}>
              <span>Observed: {rankEntropy.toFixed(3)} bits</span>
              <span>Max: {maxEntropy.toFixed(3)} bits</span>
            </div>
            <div style={{ height: 10, background: 'var(--border-subtle)', borderRadius: 5, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${entropyRatio}%`,
                  height: '100%',
                  background: rankEntropy > 1.1 ? '#10b981' : '#ef4444',
                  borderRadius: 5,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>

          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>
            Rank 1 Concentration (Baseline: 33.3%)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 10, background: 'var(--border-subtle)', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '33.3%',
                  top: 0,
                  bottom: 0,
                  width: 2,
                  background: 'var(--text-main)',
                  zIndex: 2,
                }}
                title="Safe Baseline: 33.3%"
              />
              <div
                style={{
                  width: `${Math.min(100, Math.round(breakdown.rank1ToTotalRatio * 100))}%`,
                  height: '100%',
                  background: breakdown.rank1ToTotalRatio > 0.5 ? '#ef4444' : '#10b981',
                  borderRadius: 5,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            <span className="mono" style={{ fontSize: '11px', fontWeight: 700, width: 45, textAlign: 'right' }}>
              {topHeavyPct}%
            </span>
          </div>
        </div>

        {/* Velocity Z-Score Gauge */}
        <div style={{ background: 'var(--bg-card-muted)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
              Velocity Sigma
            </div>
            <span
              className="mono"
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: Math.abs(velocityZScore) > 2 ? '#ef4444' : '#10b981',
              }}
            >
              Z = {velocityZScore > 0 ? `+${velocityZScore.toFixed(2)}` : velocityZScore.toFixed(2)}
            </span>
          </div>

          {/* Minimalist Dark Track */}
          <div style={{ position: 'relative', marginTop: 16, marginBottom: 20 }}>
            <div
              style={{
                height: 10,
                borderRadius: 5,
                background: 'var(--border-subtle)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Baseline Safe Zone in Green */}
              <div
                style={{
                  position: 'absolute',
                  left: '33.3%',
                  width: '33.3%',
                  top: 0,
                  bottom: 0,
                  background: 'rgba(16, 185, 129, 0.35)',
                }}
              />
              {/* High Anomaly Threshold Zone in Red */}
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  width: '16.7%',
                  top: 0,
                  bottom: 0,
                  background: 'rgba(239, 68, 68, 0.45)',
                }}
              />
            </div>

            {/* Needle Indicator */}
            <div
              style={{
                position: 'absolute',
                top: -4,
                left: `${zGaugePct}%`,
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'left 0.4s ease',
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: Math.abs(velocityZScore) > 2 ? '#ef4444' : '#10b981',
                  border: '2px solid var(--bg-card)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                }}
              />
              <span className="mono" style={{ fontSize: '9px', fontWeight: 800, marginTop: 12, color: 'var(--text-main)' }}>
                {velocityZScore.toFixed(1)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
            <span>-3.0 (Low)</span>
            <span>0.0 (Baseline)</span>
            <span>+3.0 (Critical)</span>
          </div>
        </div>
      </div>

      {/* 3. Outlier Anomaly Radar Table */}
      {entries.length > 0 && (
        <div className="card" style={{ padding: '20px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                Outlier Radar
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Top anomaly candidates ranked by Shannon entropy reduction and velocity Z-score skew.
              </div>
            </div>

            <span className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-card-muted)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
              Total Scanned: {entries.length}
            </span>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Proposal</th>
                  <th>Severity</th>
                  <th>Entropy H(X)</th>
                  <th>Rank 1 Skew</th>
                  <th>Velocity</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {entries.slice(0, 5).map((entry) => {
                  const bd = leaderboard.find((item) => item.entryId === entry.id) || {
                    entryId: entry.id,
                    rank1Count: 0,
                    rank2Count: 0,
                    rank3Count: 0,
                    appearanceCount: 0,
                    rawScore: 0,
                  };
                  const tel = telemetryList.find((t) => t.entryId === entry.id) || telemetry;
                  const isEntryAnomalous = tel.severity === 'CRITICAL_RAID' || tel.severity === 'SUSPICIOUS';
                  const r1Ratio = bd.appearanceCount > 0 ? (bd.rank1Count / bd.appearanceCount) * 100 : (tel.breakdown?.rank1ToTotalRatio || 0.33) * 100;

                  return (
                    <tr key={entry.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '12px' }}>
                          {entry.title}
                        </div>
                        <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {entry.id}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${isEntryAnomalous ? 'badge-danger' : 'badge-success'}`}
                        >
                          {tel.severity || 'NORMAL'}
                        </span>
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: tel.rankEntropy < 1.1 ? '#ef4444' : '#10b981' }}>
                          {tel.rankEntropy.toFixed(3)}
                        </span>
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: r1Ratio > 50 ? '#ef4444' : 'var(--text-main)' }}>
                          {r1Ratio.toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: Math.abs(tel.velocityZScore) > 2 ? '#ef4444' : 'var(--text-muted)' }}>
                          Z = {tel.velocityZScore > 0 ? `+${tel.velocityZScore.toFixed(1)}` : tel.velocityZScore.toFixed(1)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {onSelectEntry && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '10px', padding: '3px 8px' }}
                            onClick={() => onSelectEntry(entry.id)}
                          >
                            Inspect
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Tutorial Reference Graph (Underneath) */}
      <div className="card" style={{ padding: '20px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
            Tutorial Reference
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Cartesian velocity blueprint showing baseline speed, plateau equilibrium, and delayed surge acceleration.
          </div>
        </div>

        <TrajectoryCoordinateGraph
          xLabel="Time (hours into round)"
          yLabel="Cumulative Points (pts)"
          xMin={0}
          xMax={12}
          yMin={0}
          yMax={100}
          xStep={2}
          yStep={20}
          series={tutorialSeries}
          height={300}
        />
      </div>
    </div>
  );
};
