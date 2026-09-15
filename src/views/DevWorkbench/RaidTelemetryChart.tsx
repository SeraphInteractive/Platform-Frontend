import React, { useState, useMemo } from 'react';
import { RaidTelemetry, Ballot, EntryScoreBreakdown } from '@platform/internal-logic';
import { TrajectoryCoordinateGraph, TimeSpanOption } from '../../components/TrajectoryCoordinateGraph.tsx';
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectedTelemetryEntry, setInspectedTelemetryEntry] = useState<VotingEntry | null>(null);

  const { severity, rankEntropy, breakdown } = telemetry;
  const topHeavyPct = (breakdown.rank1ToTotalRatio * 100).toFixed(1);

  // Maximum theoretical Shannon entropy for 3 ranks = log2(3) ≈ 1.585
  const maxEntropy = 1.585;
  const entropyRatio = Math.min(100, Math.round((rankEntropy / maxEntropy) * 100));

  const isAnomalous = severity === 'CRITICAL_RAID' || severity === 'SUSPICIOUS';

  // Z-Score gauge position
  const clampedZ = Math.max(-3, Math.min(3, velocityZScore));
  const zGaugePct = Math.round(((clampedZ + 3) / 6) * 100);

  // Live Trajectory computed from actual API ballots
  const liveResult = computeLiveTrajectories(entries, ballots, 3, timeSpan);

  // Filtered entries for search
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        (e.submitterUsername && e.submitterUsername.toLowerCase().includes(q))
    );
  }, [entries, searchQuery]);

  const handleInspect = (entry: VotingEntry) => {
    setInspectedTelemetryEntry(entry);
    if (onSelectEntry) {
      onSelectEntry(entry.id);
    }
  };

  const inspectedBreakdown = useMemo(() => {
    if (!inspectedTelemetryEntry) return null;
    return (
      leaderboard.find((item) => item.entryId === inspectedTelemetryEntry.id) || {
        entryId: inspectedTelemetryEntry.id,
        rank1Count: 0,
        rank2Count: 0,
        rank3Count: 0,
        appearanceCount: 0,
        rawScore: 0,
      }
    );
  }, [inspectedTelemetryEntry, leaderboard]);

  const inspectedTel = useMemo(() => {
    if (!inspectedTelemetryEntry) return null;
    return telemetryList.find((t) => t.entryId === inspectedTelemetryEntry.id) || telemetry;
  }, [inspectedTelemetryEntry, telemetryList, telemetry]);

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
        title="Live Trajectory"
        xLabel="Ballots Sequence (N)"
        yLabel="Cumulative Points (pts)"
        xMin={liveResult.xMin}
        xMax={liveResult.xMax}
        yMin={liveResult.yMin}
        yMax={liveResult.yMax}
        xStep={liveResult.xStep}
        yStep={liveResult.yStep}
        series={liveResult.series}
        height={340}
        xUnit=" ballots"
        yUnit=" pts"
        timeSpans={timeSpanOptions}
        activeTimeSpan={timeSpan}
        onTimeSpanChange={(span) => setTimeSpan(span as 'all' | '10' | '25' | '50')}
      />

      {/* 2. Visual Telemetry Gauges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Shannon Rank Entropy Meter */}
        <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-card-muted)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                Entropy H(X)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Uniform rank distribution measure.
              </div>
            </div>
            <span className={`badge ${isAnomalous ? 'badge-danger' : 'badge-success'}`}>
              {severity}
            </span>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: 4 }}>
              <span className="mono">Observed: {rankEntropy.toFixed(3)} bits</span>
              <span className="mono">Max: {maxEntropy.toFixed(3)} bits</span>
            </div>
            <div style={{ height: 8, background: 'var(--border-subtle)', borderRadius: 4, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${entropyRatio}%`,
                  height: '100%',
                  background: rankEntropy > 1.1 ? '#10b981' : '#ef4444',
                  borderRadius: 4,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>

          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>
            Rank 1 Concentration
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 8, background: 'var(--border-subtle)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
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
                title="Baseline: 33.3%"
              />
              <div
                style={{
                  width: `${Math.min(100, Math.round(breakdown.rank1ToTotalRatio * 100))}%`,
                  height: '100%',
                  background: breakdown.rank1ToTotalRatio > 0.5 ? '#ef4444' : '#10b981',
                  borderRadius: 4,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            <span className="mono" style={{ fontSize: '11px', fontWeight: 800, width: 45, textAlign: 'right' }}>
              {topHeavyPct}%
            </span>
          </div>
        </div>

        {/* Velocity Z-Score Gauge */}
        <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-card-muted)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                Velocity Sigma
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Rate of accumulation deviation.
              </div>
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

          <div style={{ position: 'relative', marginTop: 14, marginBottom: 16 }}>
            <div
              style={{
                height: 8,
                borderRadius: 4,
                background: 'var(--border-subtle)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
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

            <div
              style={{
                position: 'absolute',
                top: -3,
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
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: Math.abs(velocityZScore) > 2 ? '#ef4444' : '#10b981',
                  border: '2px solid var(--bg-card)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
            <span>-3.0 (Slow)</span>
            <span>0.0 (Nominal)</span>
            <span>+3.0 (Spike)</span>
          </div>
        </div>
      </div>

      {/* 3. Searchable Outlier Radar Table */}
      <div className="card" style={{ padding: '20px', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-main)' }}>
              Outlier Radar
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 2 }}>
              Individual proposal entropy and velocity telemetry.
            </div>
          </div>

          {/* Search Input Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 240px', maxWidth: 320 }}>
            <input
              type="text"
              className="input"
              placeholder="Search proposals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: '12px', padding: '6px 10px' }}
            />
          </div>
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
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No proposals matched your search.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry: VotingEntry) => {
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
                        <span className={`badge ${isEntryAnomalous ? 'badge-danger' : 'badge-success'}`}>
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
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '10px', padding: '3px 8px' }}
                          onClick={() => handleInspect(entry)}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Inspection Modal for Outlier / Entry Stats */}
      {inspectedTelemetryEntry && inspectedBreakdown && inspectedTel && (
        <div className="modal-overlay" onClick={() => setInspectedTelemetryEntry(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, padding: '28px' }}>
            <div className="card-header" style={{ marginBottom: 14 }}>
              <div>
                <div className="card-title" style={{ fontSize: '16px' }}>
                  {inspectedTelemetryEntry.title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Statistical breakdown for entry {inspectedTelemetryEntry.id}.
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setInspectedTelemetryEntry(null)}>
                Close
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
              <div className="landing-metric-card" style={{ padding: '12px' }}>
                <div className="landing-metric-label">1st Ranks</div>
                <div className="landing-metric-value mono text-green" style={{ fontSize: '16px' }}>
                  {inspectedBreakdown.rank1Count}
                </div>
              </div>
              <div className="landing-metric-card" style={{ padding: '12px' }}>
                <div className="landing-metric-label">2nd Ranks</div>
                <div className="landing-metric-value mono text-blue" style={{ fontSize: '16px' }}>
                  {inspectedBreakdown.rank2Count}
                </div>
              </div>
              <div className="landing-metric-card" style={{ padding: '12px' }}>
                <div className="landing-metric-label">3rd Ranks</div>
                <div className="landing-metric-value mono" style={{ fontSize: '16px' }}>
                  {inspectedBreakdown.rank3Count}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--bg-card-muted)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Raw Score (3-2-1):</span>
                <span className="mono" style={{ fontWeight: 800, color: 'var(--text-main)' }}>{inspectedBreakdown.rawScore} pts</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Shannon Entropy:</span>
                <span className="mono" style={{ fontWeight: 800, color: inspectedTel.rankEntropy < 1.1 ? '#ef4444' : '#10b981' }}>
                  {inspectedTel.rankEntropy.toFixed(3)} bits
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Velocity Sigma:</span>
                <span className="mono" style={{ fontWeight: 800 }}>Z = {inspectedTel.velocityZScore.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Anomaly Severity:</span>
                <span className={`badge ${inspectedTel.severity === 'CRITICAL_RAID' || inspectedTel.severity === 'SUSPICIOUS' ? 'badge-danger' : 'badge-success'}`}>
                  {inspectedTel.severity}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
