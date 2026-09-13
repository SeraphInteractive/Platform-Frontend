import React from 'react';
import { HeroSection } from '../../components/HeroSection.tsx';
import { MetricsRow } from './MetricsRow.tsx';
import { GraphsRow } from './GraphsRow.tsx';
import { SubmittersRow, SubmitterProfile } from './SubmittersRow.tsx';
import {
  useActiveRound,
  useRoundEntries,
  useLiveLeaderboard,
  useLiveTelemetry,
} from '../../hooks/useVotingApi.ts';

interface OverviewDashboardProps {
  onNavigateTab?: (tab: 'overview' | 'ballot' | 'pitches' | 'leaderboard' | 'diagnostics') => void;
  onSelectSubmitter?: (submitter: SubmitterProfile) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  onNavigateTab,
  onSelectSubmitter,
}) => {
  // TanStack Query hooks fetching live rounds and standings
  const { activeRound } = useActiveRound();
  const roundId = activeRound?.id || 'round-scene-pitch-42';

  const { data: entries = [] } = useRoundEntries(roundId);
  const { data: boardData } = useLiveLeaderboard(roundId, entries);
  const { data: telemetryData } = useLiveTelemetry(roundId, boardData?.leaderboard || []);

  const totalBallots = boardData?.totalBallots || 0;
  const totalPointsAwarded = boardData?.totalPointsAwarded || 0;
  const expectedPoints = boardData?.expectedPoints || 0;
  const isConserved = boardData?.isConserved ?? true;
  const leaderboard = boardData?.leaderboard || [];

  // Compute anomaly score from live telemetry
  const anomalyScore = Array.isArray(telemetryData) && telemetryData.length > 0
    ? telemetryData.reduce((acc: number, t: any) => Math.max(acc, t?.p_value ? 1 - t.p_value : 0.1), 0.1)
    : 0.1012;

  return (
    <div className="tab-content-area">
      {/* Top Hero Section with Green Glowing Insight Card */}
      <HeroSection activeRound={activeRound} totalBallots={totalBallots} />

      {/* Main Dashboard Layout Flow */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Top 3 Metric Cards matching screenshot */}
        <MetricsRow
          totalBallots={totalBallots}
          totalPointsAwarded={totalPointsAwarded}
          expectedPoints={expectedPoints}
          isConserved={isConserved}
          leaderboard={leaderboard}
          anomalyScore={anomalyScore}
        />

        {/* Middle 2 Graphs Cards */}
        <GraphsRow
          expectedMean={1.94}
          zScore={2.45}
        />

        {/* Bottom 3 Submitters Cards */}
        <SubmittersRow onSelectSubmitter={onSelectSubmitter} />

        {/* Quick Standings and Action Footer Card */}
        <div className="white-card" style={{ marginTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                Active Round Standings ({entries.length} Pitches Registered)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Live 3-2-1 ranked consensus rankings updated automatically every 3 seconds.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-dark"
                onClick={() => onNavigateTab && onNavigateTab('ballot')}
              >
                Cast 3-2-1 Ballot
              </button>
              <button
                className="btn-subtle"
                onClick={() => onNavigateTab && onNavigateTab('leaderboard')}
              >
                Full Leaderboard
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Pitch Title</th>
                  <th style={{ textAlign: 'center' }}>1st Place (3pts)</th>
                  <th style={{ textAlign: 'center' }}>2nd Place (2pts)</th>
                  <th style={{ textAlign: 'center' }}>3rd Place (1pt)</th>
                  <th style={{ textAlign: 'right' }}>Total Points</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.slice(0, 5).map((item, idx) => {
                  const entry = entries.find((e) => e.id === item.entryId);
                  return (
                    <tr key={item.entryId}>
                      <td style={{ fontWeight: 800, width: 60 }} className="mono">
                        #{idx + 1}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {entry?.title || item.entryId}
                      </td>
                      <td style={{ textAlign: 'center' }} className="mono">
                        {item.rank1Count}
                      </td>
                      <td style={{ textAlign: 'center' }} className="mono">
                        {item.rank2Count}
                      </td>
                      <td style={{ textAlign: 'center' }} className="mono">
                        {item.rank3Count}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--accent-green)' }} className="mono">
                        {item.rawScore} pts
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
