import React from 'react';
import { HeroSection } from '../../components/HeroSection.tsx';
import { MetricsRow } from './MetricsRow.tsx';
import { GraphsRow } from './GraphsRow.tsx';
import { SubmittersRow } from './SubmittersRow.tsx';
import {
  useActiveRound,
  useRoundEntries,
  useLiveLeaderboard,
} from '../../hooks/useVotingApi.ts';

interface OverviewDashboardProps {
  onNavigateTab: (tab: 'overview' | 'ballot' | 'pitches' | 'leaderboard' | 'diagnostics') => void;
  onOpenCreatePitch: () => void;
  onSelectEntryForVote?: (entryId: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  onNavigateTab,
  onOpenCreatePitch,
  onSelectEntryForVote,
}) => {
  const { activeRound } = useActiveRound();
  const roundId = activeRound?.id || 'round-scene-pitch-42';

  const { data: entries = [] } = useRoundEntries(roundId);
  const { data: boardData } = useLiveLeaderboard(roundId, entries);

  const totalBallots = boardData?.totalBallots || 0;
  const totalPointsAwarded = boardData?.totalPointsAwarded || 0;
  const expectedPoints = boardData?.expectedPoints || 0;
  const isConserved = boardData?.isConserved ?? true;
  const leaderboard = boardData?.leaderboard || [];

  return (
    <div className="tab-content-area">
      {/* Top Hero Section with Green Glowing Insight Card and real actions */}
      <HeroSection
        activeRound={activeRound}
        totalBallots={totalBallots}
        onOpenCreatePitch={onOpenCreatePitch}
        onNavigateBallot={() => onNavigateTab('ballot')}
      />

      {/* Main Dashboard Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Top 3 Metric Cards with Real Participation & Leader telemetry */}
        <MetricsRow
          totalBallots={totalBallots}
          totalPointsAwarded={totalPointsAwarded}
          expectedPoints={expectedPoints}
          isConserved={isConserved}
          leaderboard={leaderboard}
          entries={entries}
        />

        {/* Middle 2 Graphs: 3-2-1 Distribution & Lead Margin */}
        <GraphsRow
          leaderboard={leaderboard}
          totalBallots={totalBallots}
        />

        {/* Bottom 3 Submitters Ribbon */}
        <SubmittersRow
          entries={entries}
          onSelectEntry={(id) => {
            if (onSelectEntryForVote) {
              onSelectEntryForVote(id);
            } else {
              onNavigateTab('pitches');
            }
          }}
        />

        {/* Active Standings Table with Working Actions */}
        <div className="white-card" style={{ marginTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                Standings
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Live consensus from verified ballots.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={onOpenCreatePitch}
              >
                + Submit Proposal
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onNavigateTab('ballot')}
              >
                Cast Ballot
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onNavigateTab('leaderboard')}
              >
                Leaderboard
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table className="clean-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Rank</th>
                  <th>Proposal Title</th>
                  <th>Creator</th>
                  <th style={{ textAlign: 'center' }}>1st (3p)</th>
                  <th style={{ textAlign: 'center' }}>2nd (2p)</th>
                  <th style={{ textAlign: 'center' }}>3rd (1p)</th>
                  <th style={{ textAlign: 'right' }}>Total Points</th>
                  <th style={{ width: 130, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                      No verified ballots or rankings recorded yet for this round.
                    </td>
                  </tr>
                ) : (
                  leaderboard.slice(0, 5).map((item, idx) => {
                    const entry = entries.find((e) => e.id === item.entryId);
                    return (
                      <tr key={item.entryId}>
                        <td style={{ fontWeight: 800 }} className="mono">
                          #{idx + 1}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {entry?.title || item.entryId}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                          {entry?.submitterUsername || 'Community Creator'}
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
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              if (onSelectEntryForVote) onSelectEntryForVote(item.entryId);
                              onNavigateTab('ballot');
                            }}
                          >
                            Select for Ballot
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
      </div>
    </div>
  );
};
