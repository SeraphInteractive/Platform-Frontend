import React from 'react';
import { VotingEntry } from '../../hooks/useVotingApi.ts';
import { EntryScoreBreakdown } from '@platform/internal-logic';

interface PublicLeaderboardProps {
  entries: VotingEntry[];
  leaderboard?: EntryScoreBreakdown[];
  totalBallots?: number;
  expectedPoints?: number;
}

export const PublicLeaderboard: React.FC<PublicLeaderboardProps> = ({
  entries,
  leaderboard = [],
  totalBallots = 0,
  expectedPoints = 0,
}) => {
  const getEntryTitle = (id: string) => entries.find((e) => e.id === id)?.title || id;

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Live Community Leaderboard</div>
          <div className="card-desc">
            Standings updated in real time as community votes are submitted.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="badge badge-engine">
            {totalBallots} Ballots Cast
          </span>
          <span className="badge badge-success">
            {expectedPoints} Points in Pool
          </span>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>Rank</th>
              <th>Pitch Idea</th>
              <th style={{ textAlign: 'right' }}>1st (3p)</th>
              <th style={{ textAlign: 'right' }}>2nd (2p)</th>
              <th style={{ textAlign: 'right' }}>3rd (1p)</th>
              <th>Point Share</th>
              <th style={{ textAlign: 'right' }}>Total Points</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                  No ballots recorded yet. Be the first to cast a vote.
                </td>
              </tr>
            ) : (
              leaderboard.map((item, index) => {
                const totalN = item.appearanceCount || 1;
                const w1 = (item.rank1Count / totalN) * 100;
                const w2 = (item.rank2Count / totalN) * 100;
                const w3 = (item.rank3Count / totalN) * 100;

                return (
                  <tr key={item.entryId}>
                    <td
                      className="mono"
                      style={{
                        fontWeight: 800,
                        color:
                          index === 0
                            ? 'var(--accent-gold)'
                            : index === 1
                            ? 'var(--accent-silver)'
                            : index === 2
                            ? 'var(--accent-bronze)'
                            : 'var(--text-muted)',
                      }}
                    >
                      #{index + 1}
                    </td>
                    <td style={{ fontWeight: 600 }}>{getEntryTitle(item.entryId)}</td>
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--accent-gold)' }}>
                      {item.rank1Count}
                    </td>
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--accent-silver)' }}>
                      {item.rank2Count}
                    </td>
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--accent-bronze)' }}>
                      {item.rank3Count}
                    </td>
                    <td>
                      <div className="breakdown-bar">
                        <div className="bar-rank1" style={{ width: `${w1}%` }} />
                        <div className="bar-rank2" style={{ width: `${w2}%` }} />
                        <div className="bar-rank3" style={{ width: `${w3}%` }} />
                      </div>
                    </td>
                    <td
                      className="mono"
                      style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        fontSize: '15px',
                        color: 'var(--accent-blue)',
                      }}
                    >
                      {item.rawScore} pts
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
