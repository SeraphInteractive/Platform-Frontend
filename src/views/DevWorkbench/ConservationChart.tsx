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

  // If no ballots, populate baseline up to 10
  if (ballotCount === 0) {
    for (let i = 1; i <= 10; i++) {
      theoretical6NPoints.push({ x: i, y: i * 6 });
      liveAwardedPoints.push({ x: i, y: i * 6 });
      deltaPoints.push({ x: i, y: 0 });
    }
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
      description: `Live accumulated score (${totalPointsAwarded} pts) across processed ballots.`,
    },
    {
      id: 'theoretical_6n',
      name: 'Theoretical 6N Bound',
      color: 'var(--text-muted)',
      strokeWidth: 2,
      dashArray: '4,4',
      points: filteredTheory,
      annotations: [
        {
          x: Math.round((windowMin + windowMax) / 2),
          y: Math.round(((windowMin + windowMax) / 2) * 6),
          text: 'Invariant: y = 6x',
          color: 'var(--text-muted)',
          align: 'middle',
        },
      ],
      description: `Mathematical baseline (6 points generated per ballot = ${expectedPoints} pts).`,
    },
    {
      id: 'leak_delta',
      name: 'Point Leak (Delta)',
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
        : `Point leak anomaly detected (${delta} pts variance).`,
    },
  ];

  // 2. Tutorial Reference Series (Underneath)
  const tutorialSeries: TrajectorySeries[] = [
    {
      id: 'tut_6n_invariant',
      name: '6N Law (y = 6x)',
      color: '#10b981',
      strokeWidth: 2.5,
      points: [
        { x: 0, y: 0 },
        { x: 2, y: 12 },
        { x: 4, y: 24 },
        { x: 6, y: 36 },
        { x: 8, y: 48 },
        { x: 10, y: 60 },
        { x: 12, y: 72 },
      ],
      annotations: [
        { x: 6, y: 40, text: 'Strict Conservation (y = 6x)', color: '#10b981' },
      ],
      description: 'Ideal closed-system conservation where each voter awards 3+2+1=6 points.',
    },
    {
      id: 'tut_leak_scenario',
      name: 'Leak Drift Example',
      color: '#ef4444',
      strokeWidth: 2,
      dashArray: '3,3',
      points: [
        { x: 0, y: 0 },
        { x: 2, y: 12 },
        { x: 4, y: 20 },
        { x: 6, y: 28 },
        { x: 8, y: 36 },
        { x: 10, y: 42 },
        { x: 12, y: 50 },
      ],
      annotations: [
        { x: 8, y: 32, text: 'Point Leak Drift (Violation)', color: '#ef4444' },
      ],
      description: 'Defective round with missing points or partial slot dropping.',
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Live 6N Conservation Trajectory Graph (On Top) */}
      <TrajectoryCoordinateGraph
        title="Live 6N Conservation Trajectory"
        xLabel="Ballots Sequence (N)"
        yLabel="Cumulative Points Awarded (pts)"
        xMin={windowMin}
        xMax={windowMax}
        yMin={0}
        yMax={yMax}
        xStep={xStep}
        yStep={Math.max(10, Math.round(yMax / 5))}
        series={liveConservationSeries}
        height={360}
        xUnit=" ballots"
        yUnit=" pts"
        timeSpans={timeSpanOptions}
        activeTimeSpan={timeSpan}
        onTimeSpanChange={(span) => setTimeSpan(span as 'all' | '10' | '25' | '50')}
      />

      {/* 2. Visual Conservation Stacked Bar */}
      <div style={{ background: 'var(--bg-card-muted)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
            Point Allocation Breakdown ({totalBallots} Ballots cast | Total: {totalPointsAwarded} / Expected: {expectedPoints})
          </div>
          <span className={`badge ${isConserved ? 'badge-success' : 'badge-danger'}`}>
            {isConserved ? 'Exact Balance (0.000 Leak)' : `Delta: ${delta} pts`}
          </span>
        </div>

        {/* Segmented Waterfall Bar */}
        <div style={{ height: 24, width: '100%', display: 'flex', borderRadius: '6px', overflow: 'hidden', background: 'var(--border-subtle)' }}>
          <div
            style={{ width: `${r1Pct}%`, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '11px', fontWeight: 800, transition: 'width 0.4s ease' }}
            title={`Rank 1 (3p): ${totalR1Points} pts (${r1Pct}%)`}
          >
            {r1Pct > 12 ? `R1: ${totalR1Points}p` : ''}
          </div>
          <div
            style={{ width: `${r2Pct}%`, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '11px', fontWeight: 800, transition: 'width 0.4s ease' }}
            title={`Rank 2 (2p): ${totalR2Points} pts (${r2Pct}%)`}
          >
            {r2Pct > 12 ? `R2: ${totalR2Points}p` : ''}
          </div>
          <div
            style={{ width: `${r3Pct}%`, background: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '11px', fontWeight: 800, transition: 'width 0.4s ease' }}
            title={`Rank 3 (1p): ${totalR3Points} pts (${r3Pct}%)`}
          >
            {r3Pct > 12 ? `R3: ${totalR3Points}p` : ''}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: '11px', color: 'var(--text-muted)', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
            <span>Rank 1 (3 pts): <strong>{totalR1Points} pts</strong> ({r1Pct}%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />
            <span>Rank 2 (2 pts): <strong>{totalR2Points} pts</strong> ({r2Pct}%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#a855f7' }} />
            <span>Rank 3 (1 pt): <strong>{totalR3Points} pts</strong> ({r3Pct}%)</span>
          </div>
        </div>
      </div>

      {/* 3. Per-Entry Point Share Horizontal Distribution */}
      <div style={{ background: 'var(--bg-card-muted)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginBottom: 14 }}>
          Proposal Point Share Across Total Pool
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {leaderboard.map((item, idx) => {
            const entrySharePct = totalPointsAwarded > 0 ? ((item.rawScore / totalPointsAwarded) * 100).toFixed(1) : '0.0';
            const barWidth = Math.round((item.rawScore / maxEntryScore) * 100);

            return (
              <div key={item.entryId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 90, fontSize: '11px', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  #{idx + 1} {item.entryId}
                </div>

                <div style={{ flex: 1, height: 12, background: 'var(--border-subtle)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                  <div
                    style={{
                      width: `${barWidth}%`,
                      background: idx === 0 ? '#10b981' : '#3b82f6',
                      borderRadius: 4,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>

                <div className="mono" style={{ width: 80, textAlign: 'right', fontSize: '11px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {item.rawScore} pts ({entrySharePct}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Tutorial Reference Graph (Underneath) */}
      <div className="card" style={{ padding: '20px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
            Tutorial Reference
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Mathematical baseline demonstrating exact 6N slope invariance and leak detection.
          </div>
        </div>

        <TrajectoryCoordinateGraph
          xLabel="Ballots (N)"
          yLabel="Points (pts)"
          xMin={0}
          xMax={12}
          yMin={0}
          yMax={80}
          xStep={2}
          yStep={20}
          series={tutorialSeries}
          height={300}
        />
      </div>
    </div>
  );
};
