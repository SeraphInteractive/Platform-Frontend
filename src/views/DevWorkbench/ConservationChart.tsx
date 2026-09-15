import React, { useState } from 'react';
import { EntryScoreBreakdown, Ballot } from '@platform/internal-logic';
import { TrajectoryCoordinateGraph, TrajectorySeries, TimeSpanOption } from '../../components/TrajectoryCoordinateGraph.tsx';

interface ConservationChartProps {
  totalBallots: number;
  expectedPoints: number;
  totalPointsAwarded: number;
  isConserved: boolean;
  leaderboard: EntryScoreBreakdown[];
  ballots?: Ballot[];
}

export const ConservationChart: React.FC<ConservationChartProps> = ({
  totalBallots,
  expectedPoints,
  totalPointsAwarded,
  isConserved,
  leaderboard,
  ballots = [],
}) => {
  const [timeSpan, setTimeSpan] = useState<'all' | '10' | '25' | '50'>('all');
  const delta = totalPointsAwarded - expectedPoints;

  // Breakdown across rank tiers
  const totalR1Points = leaderboard.reduce((acc, curr) => acc + curr.rank1Count * 3, 0);
  const totalR2Points = leaderboard.reduce((acc, curr) => acc + curr.rank2Count * 2, 0);
  const totalR3Points = leaderboard.reduce((acc, curr) => acc + curr.rank3Count * 1, 0);

  const safeExpected = expectedPoints || 1;
  const r1Pct = Math.min(100, Math.round((totalR1Points / safeExpected) * 100));
  const r2Pct = Math.min(100, Math.round((totalR2Points / safeExpected) * 100));
  const r3Pct = Math.min(100, Math.round((totalR3Points / safeExpected) * 100));

  const maxEntryScore = leaderboard.reduce((max, curr) => Math.max(max, curr.rawScore), 0) || 1;

  // 1. Calculate Live 6N Trajectory from real API ballots
  const ballotCount = ballots.length;
  let runningAwarded = 0;
  const liveAwardedPoints: { x: number; y: number }[] = [{ x: 0, y: 0 }];
  const theoretical6NPoints: { x: number; y: number }[] = [{ x: 0, y: 0 }];
  const deltaPoints: { x: number; y: number }[] = [{ x: 0, y: 0 }];

  ballots.forEach((b, idx) => {
    const ballotNum = idx + 1;
    let ptsInBallot = 0;
    if (b.rank1) ptsInBallot += 3;
    if (b.rank2) ptsInBallot += 2;
    if (b.rank3) ptsInBallot += 1;

    runningAwarded += ptsInBallot;
    const expAtStep = ballotNum * 6;
    const diff = runningAwarded - expAtStep;

    liveAwardedPoints.push({ x: ballotNum, y: runningAwarded });
    theoretical6NPoints.push({ x: ballotNum, y: expAtStep });
    deltaPoints.push({ x: ballotNum, y: diff });
  });

  // If no ballots, do not inject fake points. Keep at origin.
  if (ballotCount === 0) {
    theoretical6NPoints.push({ x: 10, y: 60 });
  }

  // Window bounds calculation based on timeSpan
  let windowMin = 0;
  let windowMax = Math.max(10, ballotCount);

  if (timeSpan !== 'all') {
    const spanNum = Number(timeSpan);
    if (!isNaN(spanNum) && spanNum > 0 && ballotCount > spanNum) {
      windowMin = ballotCount - spanNum;
      windowMax = ballotCount;
    }
  }

  const filteredLive = liveAwardedPoints.filter((p) => p.x >= windowMin && p.x <= windowMax);
  const filteredTheory = theoretical6NPoints.filter((p) => p.x >= windowMin && p.x <= windowMax);
  const filteredDelta = deltaPoints.filter((p) => p.x >= windowMin && p.x <= windowMax);

  const maxLiveScore = Math.max(...filteredTheory.map((p) => p.y), ...filteredLive.map((p) => p.y), 60);

  const liveConservationSeries: TrajectorySeries[] = [
    {
      id: 'live_awarded',
      name: 'Actual Awarded',
      color: '#10b981',
      strokeWidth: 2.5,
      points: filteredLive,
      annotations: [
        {
          x: filteredLive[filteredLive.length - 1]?.x || windowMax,
          y: filteredLive[filteredLive.length - 1]?.y || 0,
          text: `${filteredLive[filteredLive.length - 1]?.y || 0} pts`,
          color: '#10b981',
          align: 'end',
        },
      ],
      description: 'Sum of awarded scores across processed ballots.',
    },
    {
      id: 'theoretical_6n',
      name: 'Invariant (y = 6x)',
      color: 'var(--text-muted)',
      strokeWidth: 2,
      dashArray: '4,4',
      points: filteredTheory,
      annotations: [
        {
          x: Math.round((windowMin + windowMax) / 2),
          y: Math.round(((windowMin + windowMax) / 2) * 6),
          text: 'y = 6x',
          color: 'var(--text-muted)',
          align: 'middle',
        },
      ],
      description: 'Theoretical 6N boundary where w = [3, 2, 1]^T.',
    },
    {
      id: 'leak_delta',
      name: 'Delta (Leak)',
      color: isConserved ? 'var(--border-strong)' : '#ef4444',
      strokeWidth: 2,
      points: filteredDelta,
      annotations: [
        {
          x: filteredDelta[filteredDelta.length - 1]?.x || windowMax,
          y: filteredDelta[filteredDelta.length - 1]?.y || 0,
          text: `Delta = ${delta}`,
          color: isConserved ? 'var(--text-muted)' : '#ef4444',
          align: 'end',
        },
      ],
      description: isConserved
        ? 'Zero point leakage detected (Delta = 0).'
        : `Point leak variance: Delta = ${delta}.`,
    },
  ];

  const timeSpanOptions: TimeSpanOption[] = [
    { id: 'all', label: 'All Time' },
    { id: '10', label: 'Last 10' },
    { id: '25', label: 'Last 25' },
    { id: '50', label: 'Last 50' },
  ];

  const xSpan = Math.max(4, windowMax - windowMin);
  const xStep = Math.max(1, Math.round(xSpan / 5));
  const yMax = Math.max(60, Math.ceil((maxLiveScore * 1.15) / 20) * 20);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Mathematical Invariants Formula Strip */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span className="badge badge-engine mono" style={{ fontSize: '11px', padding: '4px 8px' }}>
          Invariant: sum(S_j) = 6N
        </span>
        <span className="badge badge-engine mono" style={{ fontSize: '11px', padding: '4px 8px' }}>
          Delta = sum(S_j) - 6N
        </span>
        <span className="badge badge-engine mono" style={{ fontSize: '11px', padding: '4px 8px' }}>
          w = [3, 2, 1]^T
        </span>
        <span
          className="mono"
          style={{
            fontSize: '11px',
            padding: '3px 8px',
            borderRadius: 4,
            fontWeight: 800,
            background: isConserved ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            color: isConserved ? '#10b981' : '#ef4444',
            border: `1px solid ${isConserved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          }}
        >
          {isConserved ? 'System Conserved (Delta = 0)' : `Leak Variance (Delta = ${delta})`}
        </span>
      </div>

      {/* 1. Live 6N Conservation Trajectory Graph */}
      <TrajectoryCoordinateGraph
        xLabel="Ballot Index (N)"
        yLabel="Cumulative Points (pts)"
        xMin={windowMin}
        xMax={windowMax}
        yMin={0}
        yMax={yMax}
        xStep={xStep}
        yStep={Math.max(10, Math.round(yMax / 5))}
        series={liveConservationSeries}
        height={320}
        xUnit=" ballots"
        yUnit=" pts"
        timeSpans={timeSpanOptions}
        activeTimeSpan={timeSpan}
        onTimeSpanChange={(span) => setTimeSpan(span as 'all' | '10' | '25' | '50')}
        showHelpGuide={false}
      />

      {/* 2. Visual Conservation Waterfall Breakdown */}
      <div style={{ background: 'var(--bg-card-muted)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span className="mono" style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}>
            Tier Allocation (R1: {totalR1Points}p | R2: {totalR2Points}p | R3: {totalR3Points}p)
          </span>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            N={totalBallots} | Total={totalPointsAwarded} / Expected={expectedPoints}
          </span>
        </div>

        {/* Segmented Waterfall Bar */}
        <div style={{ height: 20, width: '100%', display: 'flex', borderRadius: '4px', overflow: 'hidden', background: 'var(--border-subtle)' }}>
          <div
            style={{ width: `${r1Pct}%`, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '10px', fontWeight: 800, transition: 'width 0.4s ease' }}
            title={`Rank 1 (3p): ${totalR1Points} pts (${r1Pct}%)`}
          >
            {r1Pct > 10 ? `R1: ${r1Pct}%` : ''}
          </div>
          <div
            style={{ width: `${r2Pct}%`, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '10px', fontWeight: 800, transition: 'width 0.4s ease' }}
            title={`Rank 2 (2p): ${totalR2Points} pts (${r2Pct}%)`}
          >
            {r2Pct > 10 ? `R2: ${r2Pct}%` : ''}
          </div>
          <div
            style={{ width: `${r3Pct}%`, background: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '10px', fontWeight: 800, transition: 'width 0.4s ease' }}
            title={`Rank 3 (1p): ${totalR3Points} pts (${r3Pct}%)`}
          >
            {r3Pct > 10 ? `R3: ${r3Pct}%` : ''}
          </div>
        </div>

        {/* Technical Legend */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: '11px', color: 'var(--text-muted)', flexWrap: 'wrap', gap: 8 }}>
          <span className="mono"><strong style={{ color: '#10b981' }}>R1 (3p):</strong> {totalR1Points} pts ({r1Pct}%)</span>
          <span className="mono"><strong style={{ color: '#3b82f6' }}>R2 (2p):</strong> {totalR2Points} pts ({r2Pct}%)</span>
          <span className="mono"><strong style={{ color: '#a855f7' }}>R3 (1p):</strong> {totalR3Points} pts ({r3Pct}%)</span>
        </div>
      </div>

      {/* 3. Per-Entry Point Share Distribution */}
      <div style={{ background: 'var(--bg-card-muted)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span className="mono" style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}>
            Candidate Score Partition S_j
          </span>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            M={leaderboard.length} Candidates
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {leaderboard.map((item, idx) => {
            const entrySharePct = totalPointsAwarded > 0 ? ((item.rawScore / totalPointsAwarded) * 100).toFixed(1) : '0.0';
            const barWidth = Math.round((item.rawScore / maxEntryScore) * 100);

            return (
              <div key={item.entryId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="mono" style={{ width: 110, fontSize: '11px', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  #{idx + 1} {item.entryId}
                </div>

                <div style={{ flex: 1, height: 10, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                  <div
                    style={{
                      width: `${barWidth}%`,
                      background: idx === 0 ? '#10b981' : '#3b82f6',
                      borderRadius: 3,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>

                <div className="mono" style={{ width: 85, textAlign: 'right', fontSize: '11px', color: 'var(--text-main)' }}>
                  {item.rawScore} pts ({entrySharePct}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Technical Summary Line */}
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
        Sum of candidate raw scores strictly conserves 6N points. Delta indicates leakage or orphaned rank references.
      </div>
    </div>
  );
};
