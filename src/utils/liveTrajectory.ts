import { Ballot } from '@platform/internal-logic';
import { VotingEntry } from '../hooks/useVotingApi.ts';
import { TrajectorySeries, TrajectoryPoint, CohortBand } from '../components/TrajectoryCoordinateGraph.tsx';

export interface LiveTrajectoryResult {
  series: TrajectorySeries[];
  cohortBand?: CohortBand;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  xStep: number;
  yStep: number;
  totalBallots: number;
  totalSubmissions: number;
  leaderTitle: string;
  leadMargin: number;
  fieldMedianScore: number;
  focusedScore?: number;
}

const SERIES_COLORS = [
  { name: 'Lead', color: '#10b981', accent: '#059669' },
  { name: 'Challenger', color: '#3b82f6', accent: '#2563eb' },
  { name: 'Third', color: '#a855f7', accent: '#7c3aed' },
  { name: 'Fourth', color: '#f59e0b', accent: '#d97706' },
  { name: 'Fifth', color: '#94a3b8', accent: '#64748b' },
];

export function computeLiveTrajectories(
  entries: VotingEntry[],
  ballots: Ballot[],
  maxDisplayEntries = 3,
  timeSpan: 'all' | '10' | '25' | '50' | '100' | '500' = 'all',
  focusedEntryId?: string
): LiveTrajectoryResult {
  const totalBallots = ballots.length;
  const totalSubmissions = entries.length;

  // Fallback for 0 ballots
  if (ballots.length === 0) {
    const emptySeries: TrajectorySeries[] = entries.slice(0, maxDisplayEntries).map((entry, idx) => {
      const col = SERIES_COLORS[idx % SERIES_COLORS.length]!;
      return {
        id: entry.id,
        name: entry.title,
        color: col.color,
        strokeWidth: 2.2,
        points: [
          { x: 0, y: 0 },
          { x: 12, y: 0 },
        ],
        annotations: [{ x: 6, y: 3, text: 'Awaiting ballots', color: col.accent }],
        description: 'Standby awaiting incoming community ballots.',
      };
    });

    return {
      series: emptySeries,
      xMin: 0,
      xMax: 12,
      yMin: 0,
      yMax: 40,
      xStep: 2,
      yStep: 10,
      totalBallots: 0,
      totalSubmissions,
      leaderTitle: entries[0]?.title || 'None',
      leadMargin: 0,
      fieldMedianScore: 0,
    };
  }

  // 1. Calculate running scores for all entries across all ballots
  const runningScores = new Map<string, number>();
  entries.forEach((e) => runningScores.set(e.id, 0));

  // Determine sampling rate (LOD) for high ballot counts
  const targetCheckpoints = 60;
  const sampleStep = Math.max(1, Math.floor(totalBallots / targetCheckpoints));

  const sampledCheckpoints: number[] = [0];
  for (let i = sampleStep; i <= totalBallots; i += sampleStep) {
    sampledCheckpoints.push(i);
  }
  if (sampledCheckpoints[sampledCheckpoints.length - 1] !== totalBallots) {
    sampledCheckpoints.push(totalBallots);
  }

  // Store scores at each sampled checkpoint: checkpointIndex -> Map(entryId -> score)
  const checkpointScores: Map<string, number>[] = [];
  checkpointScores.push(new Map(runningScores)); // checkpoint 0

  let currentSampleTargetIdx = 1;

  ballots.forEach((ballot, bIdx) => {
    const ballotNum = bIdx + 1;

    // Slot 1 (+3 pts)
    if (ballot.rank1 && runningScores.has(ballot.rank1)) {
      runningScores.set(ballot.rank1, (runningScores.get(ballot.rank1) || 0) + 3);
    }
    // Slot 2 (+2 pts)
    if (ballot.rank2 && runningScores.has(ballot.rank2)) {
      runningScores.set(ballot.rank2, (runningScores.get(ballot.rank2) || 0) + 2);
    }
    // Slot 3 (+1 pt)
    if (ballot.rank3 && runningScores.has(ballot.rank3)) {
      runningScores.set(ballot.rank3, (runningScores.get(ballot.rank3) || 0) + 1);
    }

    if (currentSampleTargetIdx < sampledCheckpoints.length && ballotNum === sampledCheckpoints[currentSampleTargetIdx]) {
      checkpointScores.push(new Map(runningScores));
      currentSampleTargetIdx++;
    }
  });

  // Ensure final checkpoint is recorded
  if (checkpointScores.length < sampledCheckpoints.length) {
    checkpointScores.push(new Map(runningScores));
  }

  // 2. Rank entries by final score descending
  const sortedEntries = [...entries].sort((a, b) => {
    const scoreA = runningScores.get(a.id) || 0;
    const scoreB = runningScores.get(b.id) || 0;
    return scoreB - scoreA;
  });

  const topEntries = sortedEntries.slice(0, maxDisplayEntries);
  const scoreLeader = runningScores.get(topEntries[0]?.id || '') || 0;
  const scoreChallenger = runningScores.get(topEntries[1]?.id || '') || 0;
  const leadMargin = scoreLeader - scoreChallenger;

  // Calculate field median score
  const allFinalScores = sortedEntries.map((e) => runningScores.get(e.id) || 0);
  const fieldMedianScore = allFinalScores[Math.floor(allFinalScores.length / 2)] || 0;

  // Window bounds calculation based on timeSpan
  let windowMin = 0;
  let windowMax = totalBallots;

  if (timeSpan !== 'all') {
    const spanCount = Number(timeSpan);
    if (!isNaN(spanCount) && spanCount > 0 && totalBallots > spanCount) {
      windowMin = totalBallots - spanCount;
      windowMax = totalBallots;
    }
  }

  // 3. Compute Field Percentile Envelope (25th to 75th percentile) and Field Median
  const upperCohortPoints: TrajectoryPoint[] = [];
  const lowerCohortPoints: TrajectoryPoint[] = [];
  const medianPoints: TrajectoryPoint[] = [];

  sampledCheckpoints.forEach((cpX, idx) => {
    if (cpX >= windowMin && cpX <= windowMax) {
      const scoresMap = checkpointScores[idx] || checkpointScores[checkpointScores.length - 1];
      if (scoresMap) {
        const scoresArr = Array.from(scoresMap.values()).sort((a, b) => a - b);
        const p25 = scoresArr[Math.floor(scoresArr.length * 0.25)] || 0;
        const p50 = scoresArr[Math.floor(scoresArr.length * 0.5)] || 0;
        const p75 = scoresArr[Math.floor(scoresArr.length * 0.75)] || 0;

        lowerCohortPoints.push({ x: cpX, y: p25 });
        medianPoints.push({ x: cpX, y: p50 });
        upperCohortPoints.push({ x: cpX, y: p75 });
      }
    }
  });

  // 4. Build Series for Top Leaders
  const series: TrajectorySeries[] = [];

  topEntries.forEach((entry, idx) => {
    const col = SERIES_COLORS[idx % SERIES_COLORS.length]!;
    const finalScore = runningScores.get(entry.id) || 0;

    const visiblePoints: TrajectoryPoint[] = [];
    sampledCheckpoints.forEach((cpX, cpIdx) => {
      if (cpX >= windowMin && cpX <= windowMax) {
        const score = checkpointScores[cpIdx]?.get(entry.id) || 0;
        visiblePoints.push({ x: cpX, y: score });
      }
    });

    const annotations: { x: number; y: number; text: string; color?: string; align?: 'start' | 'middle' | 'end' }[] = [];
    if (visiblePoints.length > 0) {
      const lastPt = visiblePoints[visiblePoints.length - 1]!;
      annotations.push({
        x: lastPt.x,
        y: lastPt.y + 2,
        text: `${lastPt.y}p`,
        color: col.accent,
        align: 'end',
      });
    }

    let desc = '';
    if (idx === 0) {
      desc = `Rank 1 Leader (${finalScore} pts, +${leadMargin} margin).`;
    } else if (idx === 1) {
      desc = `Rank 2 Contender (${finalScore} pts).`;
    } else {
      desc = `Rank ${idx + 1} (${finalScore} pts).`;
    }

    series.push({
      id: entry.id,
      name: entry.title,
      color: col.color,
      strokeWidth: idx === 0 ? 2.5 : 2,
      points: visiblePoints,
      annotations,
      description: desc,
    });
  });

  // 5. Add Focused/Pinned Candidate if selected and not already in top 3
  let focusedScore: number | undefined;
  if (focusedEntryId && !topEntries.some((e) => e.id === focusedEntryId)) {
    const focusedEntry = entries.find((e) => e.id === focusedEntryId);
    if (focusedEntry) {
      focusedScore = runningScores.get(focusedEntry.id) || 0;
      const focusedRank = sortedEntries.findIndex((e) => e.id === focusedEntryId) + 1;

      const visiblePoints: TrajectoryPoint[] = [];
      sampledCheckpoints.forEach((cpX, cpIdx) => {
        if (cpX >= windowMin && cpX <= windowMax) {
          const score = checkpointScores[cpIdx]?.get(focusedEntry.id) || 0;
          visiblePoints.push({ x: cpX, y: score });
        }
      });

      series.push({
        id: focusedEntry.id,
        name: `Focused: ${focusedEntry.title} (#${focusedRank})`,
        color: '#f43f5e', // distinct rose accent
        strokeWidth: 2.2,
        dashArray: '3,2',
        points: visiblePoints,
        annotations: [
          {
            x: visiblePoints[visiblePoints.length - 1]?.x || windowMax,
            y: (visiblePoints[visiblePoints.length - 1]?.y || 0) + 2,
            text: `#${focusedRank} (${focusedScore}p)`,
            color: '#f43f5e',
            align: 'end',
          },
        ],
        description: `Rank #${focusedRank} across all ${totalSubmissions} submissions (${focusedScore} pts).`,
      });
    }
  }

  // 6. Add Field Median dashed line
  if (medianPoints.length > 0) {
    series.push({
      id: 'field_median',
      name: 'Field Median (50th %ile)',
      color: 'var(--text-muted)',
      strokeWidth: 1.5,
      dashArray: '4,4',
      points: medianPoints,
      annotations: [],
      description: `Midpoint trajectory across all ${totalSubmissions} submissions (${fieldMedianScore} pts).`,
    });
  }

  // 7. Calculate dynamic Y bounds
  let maxScoreInWindow = 10;
  series.forEach((s) => {
    s.points.forEach((pt) => {
      if (pt.y > maxScoreInWindow) maxScoreInWindow = pt.y;
    });
  });

  const xSpan = Math.max(4, windowMax - windowMin);
  const xMax = Math.max(windowMax, windowMin + Math.ceil(xSpan / 4) * 4);
  const xMin = windowMin;
  const xStep = Math.max(1, Math.round(xSpan / 5));

  const yMin = 0;
  const yMax = Math.max(20, Math.ceil((maxScoreInWindow * 1.15) / 10) * 10);
  const yStep = Math.max(5, Math.round(yMax / 5));

  const cohortBand: CohortBand | undefined =
    upperCohortPoints.length > 0 && lowerCohortPoints.length > 0
      ? {
          upper: upperCohortPoints,
          lower: lowerCohortPoints,
          label: `25th-75th %ile of ${totalSubmissions} Submissions`,
          color: 'rgba(148, 163, 184, 0.12)',
        }
      : undefined;

  return {
    series,
    cohortBand,
    xMin,
    xMax,
    yMin,
    yMax,
    xStep,
    yStep,
    totalBallots,
    totalSubmissions,
    leaderTitle: topEntries[0]?.title || 'None',
    leadMargin,
    fieldMedianScore,
    focusedScore,
  };
}
