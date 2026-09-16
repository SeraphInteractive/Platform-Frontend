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
  totalBallots?: number;
  expectedPoints?: number;
  totalPointsAwarded?: number;
  isConserved?: boolean;
}

const DiagnosticHoverTag: React.FC<{ label: string; tooltip: string; statusColor?: string }> = ({ label, tooltip, statusColor }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <span
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={tooltip}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 8px',
        borderRadius: '6px',
        background: statusColor ? `${statusColor}18` : 'rgba(15, 23, 42, 0.6)',
        color: statusColor || 'var(--text-muted)',
        fontSize: '10.5px',
        fontWeight: 700,
        cursor: 'help',
      }}
    >
      {label}
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            color: '#f8fafc',
            padding: '6px 10px',
            borderRadius: '6px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
            zIndex: 100,
            pointerEvents: 'none',
            width: 'max-content',
            maxWidth: '240px',
            fontSize: '11px',
            lineHeight: 1.4,
            textAlign: 'left',
          }}
        >
          <div style={{ fontWeight: 800, color: statusColor || '#38bdf8', marginBottom: 2 }}>
            {label}
          </div>
          <div style={{ color: '#cbd5e1' }}>
            {tooltip}
          </div>
        </div>
      )}
    </span>
  );
};

export const RaidTelemetryChart: React.FC<RaidTelemetryChartProps> = ({
  telemetry,
  velocityZScore,
  ballots = [],
  entries = [],
  leaderboard = [],
  telemetryList = [],
  onSelectEntry,
  totalBallots = 0,
  expectedPoints = 0,
  totalPointsAwarded = 0,
  isConserved = true,
}) => {
  const [timeSpan, setTimeSpan] = useState<'all' | '10' | '25' | '50'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectedTelemetryEntry, setInspectedTelemetryEntry] = useState<VotingEntry | null>(null);

  const delta = totalPointsAwarded - expectedPoints;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 1. Integrated Invariants & Conservation Strip */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          background: 'var(--bg-card-muted)',
          padding: '12px 16px',
          borderRadius: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span
            className={`badge ${isConserved ? 'badge-success' : 'badge-danger'}`}
            style={{ fontSize: '11px', padding: '3px 8px' }}
          >
            {isConserved ? '6N Invariant Conserved' : `Leak Detected (Delta = ${delta})`}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '11px' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              Ballots (N): <strong style={{ color: '#38bdf8' }}>{totalBallots || ballots.length}</strong>
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              Expected: <strong style={{ color: '#f8fafc' }}>{expectedPoints} pts</strong>
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              Awarded: <strong style={{ color: isConserved ? '#10b981' : '#ef4444' }}>{totalPointsAwarded} pts</strong>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <DiagnosticHoverTag
            label="sum(S_j) = 6N"
            tooltip="Conservation rule: total points distributed must equal exactly 6 times the ballot count."
          />
          <DiagnosticHoverTag
            label="w = [3, 2, 1]^T"
            tooltip="Borda rank weights vector for 1st, 2nd, and 3rd choices."
          />
        </div>
      </div>

      {/* 2. Live Trajectory Graph */}
      <div style={{ background: 'var(--bg-card-muted)', padding: '16px', borderRadius: '12px' }}>
        <TrajectoryCoordinateGraph
          title="Live Trajectory"
          xLabel="Ballots (N)"
          yLabel="Cumulative Points"
          xMin={liveResult.xMin}
          xMax={liveResult.xMax}
          yMin={liveResult.yMin}
          yMax={liveResult.yMax}
          xStep={liveResult.xStep}
          yStep={liveResult.yStep}
          series={liveResult.series}
          height={300}
          xUnit="ballots"
          yUnit="pts"
          timeSpans={timeSpanOptions}
          activeTimeSpan={timeSpan}
          onTimeSpanChange={(span) => setTimeSpan(span as 'all' | '10' | '25' | '50')}
        />
      </div>

      {/* 2. Visual Telemetry Gauges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        {/* Shannon Rank Entropy Meter */}
        <div style={{ padding: '14px 16px', background: 'var(--bg-card-muted)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>
              Entropy
            </div>
            <span className={`badge ${isAnomalous ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '10px' }}>
              {severity}
            </span>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#94a3b8', marginBottom: 5 }}>
              <span className="mono">Observed: {rankEntropy.toFixed(3)} bits</span>
              <span className="mono">Max: {maxEntropy.toFixed(3)} bits</span>
            </div>
            <div style={{ height: 6, background: 'rgba(15, 23, 42, 0.8)', borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${entropyRatio}%`,
                  height: '100%',
                  background: rankEntropy > 1.1 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #ef4444, #dc2626)',
                  borderRadius: 3,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>

          <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#f8fafc', marginBottom: 5 }}>
            Rank 1 Concentration
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 6, background: 'rgba(15, 23, 42, 0.8)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '33.3%',
                  top: 0,
                  bottom: 0,
                  width: 2,
                  background: '#94a3b8',
                  zIndex: 2,
                }}
                title="Baseline: 33.3%"
              />
              <div
                style={{
                  width: `${Math.min(100, Math.round(breakdown.rank1ToTotalRatio * 100))}%`,
                  height: '100%',
                  background: breakdown.rank1ToTotalRatio > 0.5 ? 'linear-gradient(90deg, #ef4444, #dc2626)' : 'linear-gradient(90deg, #10b981, #059669)',
                  borderRadius: 3,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            <span className="mono" style={{ fontSize: '10.5px', fontWeight: 800, width: 42, textAlign: 'right', color: '#f8fafc' }}>
              {topHeavyPct}%
            </span>
          </div>
        </div>

        {/* Velocity Z-Score Gauge */}
        <div style={{ padding: '14px 16px', background: 'var(--bg-card-muted)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>
              Velocity
            </div>
            <span
              className="mono"
              style={{
                fontSize: '10.5px',
                fontWeight: 800,
                color: Math.abs(velocityZScore) > 2 ? '#ef4444' : '#10b981',
              }}
            >
              Z = {velocityZScore > 0 ? `+${velocityZScore.toFixed(2)}` : velocityZScore.toFixed(2)}
            </span>
          </div>

          <div style={{ position: 'relative', marginTop: 14, marginBottom: 14 }}>
            <div
              style={{
                height: 6,
                borderRadius: 3,
                background: 'rgba(15, 23, 42, 0.8)',
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
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#94a3b8' }}>
            <span>-3.0 (Slow)</span>
            <span>0.0 (Nominal)</span>
            <span>+3.0 (Spike)</span>
          </div>
        </div>
      </div>

      {/* 3. Searchable Outlier Radar Table */}
      <div style={{ padding: '16px', background: 'var(--bg-card-muted)', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
            Radar
          </div>

          {/* Search Input Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 200px', maxWidth: 260 }}>
            <input
              type="text"
              className="input"
              placeholder="Search proposals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: '11px', padding: '5px 10px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '6px' }}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Proposal</th>
                <th>Severity</th>
                <th>Entropy</th>
                <th>Rank 1 Skew</th>
                <th>Velocity</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontStyle: 'italic' }}>
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
                        <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '11.5px' }}>
                          {entry.title}
                        </div>
                        <div className="mono" style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                          {entry.id}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${isEntryAnomalous ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '10px' }}>
                          {tel.severity || 'NORMAL'}
                        </span>
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: '10.5px', fontWeight: 700, color: tel.rankEntropy < 1.1 ? '#ef4444' : '#10b981' }}>
                          {tel.rankEntropy.toFixed(3)}
                        </span>
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: '10.5px', fontWeight: 700, color: r1Ratio > 50 ? '#ef4444' : '#f8fafc' }}>
                          {r1Ratio.toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: '10.5px', fontWeight: 700, color: Math.abs(tel.velocityZScore) > 2 ? '#ef4444' : '#94a3b8' }}>
                          Z = {tel.velocityZScore > 0 ? `+${tel.velocityZScore.toFixed(1)}` : tel.velocityZScore.toFixed(1)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '10.5px', padding: '3px 8px', borderRadius: '5px' }}
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460, padding: '20px', borderRadius: '14px', background: 'var(--bg-card)' }}>
            <div className="card-header" style={{ marginBottom: 14 }}>
              <div className="card-title" style={{ fontSize: '15px', color: '#f8fafc' }}>
                 {inspectedTelemetryEntry.title}
              </div>
              <button className="btn btn-secondary btn-sm" style={{ fontSize: '10.5px', padding: '3px 8px' }} onClick={() => setInspectedTelemetryEntry(null)}>
                Close
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
              <div style={{ padding: '10px', background: 'var(--bg-card-muted)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>1st Ranks</div>
                <div className="mono text-green" style={{ fontSize: '16px', fontWeight: 900, marginTop: 2 }}>
                  {inspectedBreakdown.rank1Count}
                </div>
              </div>
              <div style={{ padding: '10px', background: 'var(--bg-card-muted)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>2nd Ranks</div>
                <div className="mono text-blue" style={{ fontSize: '16px', fontWeight: 900, marginTop: 2 }}>
                  {inspectedBreakdown.rank2Count}
                </div>
              </div>
              <div style={{ padding: '10px', background: 'var(--bg-card-muted)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>3rd Ranks</div>
                <div className="mono" style={{ fontSize: '16px', fontWeight: 900, marginTop: 2, color: '#c084fc' }}>
                  {inspectedBreakdown.rank3Count}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--bg-card-muted)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: '#94a3b8' }}>Raw Score (3-2-1):</span>
                <span className="mono" style={{ fontWeight: 800, color: '#f8fafc' }}>{inspectedBreakdown.rawScore} pts</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: '#94a3b8' }}>Shannon Entropy:</span>
                <span className="mono" style={{ fontWeight: 800, color: inspectedTel.rankEntropy < 1.1 ? '#ef4444' : '#10b981' }}>
                  {inspectedTel.rankEntropy.toFixed(3)} bits
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: '#94a3b8' }}>Velocity Sigma:</span>
                <span className="mono" style={{ fontWeight: 800, color: '#f8fafc' }}>Z = {inspectedTel.velocityZScore.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: '#94a3b8' }}>Anomaly Severity:</span>
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
