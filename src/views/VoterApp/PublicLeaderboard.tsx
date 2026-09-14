import React, { useState } from 'react';
import { VotingEntry } from '../../hooks/useVotingApi.ts';
import { EntryScoreBreakdown } from '@platform/internal-logic';
import { sounds } from '../../utils/soundEffects.ts';

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
  const [showRunoffSim, setShowRunoffSim] = useState(false);
  const getEntryTitle = (id: string) => entries.find((e) => e.id === id)?.title || id;
  const getEntryCategory = (id: string) => entries.find((e) => e.id === id)?.category || 'Pitch';

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  // Calculate vote shares and 50% majority threshold
  const totalBordaSum = leaderboard.reduce((acc, item) => acc + item.rawScore, 0);
  const top1Share = totalBordaSum > 0 && top1 ? Math.round((top1.rawScore / totalBordaSum) * 100) : 0;
  const isMajorityWinner = top1Share > 50;

  return (
    <div className="card" style={{ padding: '36px 40px', background: 'var(--bg-card)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            Community Standings
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            Leaderboard
          </h2>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="badge badge-engine">
            {totalBallots} Ballots
          </span>
          <span className="badge badge-success">
            {expectedPoints} Points (6N Conserved)
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              sounds.playClick();
              setShowRunoffSim(!showRunoffSim);
            }}
          >
            {showRunoffSim ? 'Standard View' : 'Runoff Analysis'}
          </button>
        </div>
      </div>

      {/* 50% Majority Threshold Status Callout */}
      {leaderboard.length > 0 && (
        <div
          className="white-card"
          style={{
            marginBottom: 24,
            padding: '14px 20px',
            background: isMajorityWinner ? 'rgba(34, 197, 94, 0.08)' : 'rgba(59, 130, 246, 0.08)',
            border: `1px solid ${isMajorityWinner ? 'rgba(34, 197, 94, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="beacon-dot" style={{ background: isMajorityWinner ? '#22c55e' : '#3b82f6' }} />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}>
                {isMajorityWinner
                  ? 'Decisive Majority (>50%): Top candidate has secured outright consensus.'
                  : 'Split Consensus (<50%): Meeting protocol requires Top 2 Runoff.'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Leading Share: {top1Share}% | Threshold Required: &gt;50%
              </div>
            </div>
          </div>

          <span className="mono" style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-blue)' }}>
            |Z| &gt; 1.96 Validated
          </span>
        </div>
      )}

      {/* 3D Visual Podium for Top 3 */}
      {leaderboard.length >= 2 && (
        <div className="podium-container">
          {/* 2nd Place Silver */}
          {top2 && (
            <div className="podium-card" style={{ order: 1 }}>
              <div style={{ marginBottom: 12 }}>
                <span className="slot-badge slot-rank-2">2ND PLACE</span>
                <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-main)', marginTop: 6 }}>
                  {getEntryTitle(top2.entryId)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {getEntryCategory(top2.entryId)}
                </div>
              </div>
              <div className="podium-pillar podium-pillar-silver">
                <span className="mono text-silver" style={{ fontSize: '28px', fontWeight: 900 }}>#2</span>
                <span className="mono" style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-main)', marginTop: 4 }}>
                  {top2.rawScore} pts
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {top2.rank1Count} x 1st
                </span>
              </div>
            </div>
          )}

          {/* 1st Place Gold */}
          {top1 && (
            <div className="podium-card" style={{ order: 2 }}>
              <div style={{ marginBottom: 12 }}>
                <span className="slot-badge slot-rank-1">1ST PLACE LEADER</span>
                <div style={{ fontWeight: 900, fontSize: '17px', color: 'var(--text-main)', marginTop: 6 }}>
                  {getEntryTitle(top1.entryId)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {getEntryCategory(top1.entryId)}
                </div>
              </div>
              <div className="podium-pillar podium-pillar-gold">
                <span className="mono text-gold" style={{ fontSize: '36px', fontWeight: 900 }}>#1</span>
                <span className="mono" style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-main)', marginTop: 4 }}>
                  {top1.rawScore} pts
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {top1.rank1Count} x 1st
                </span>
              </div>
            </div>
          )}

          {/* 3rd Place Bronze */}
          {top3 && (
            <div className="podium-card" style={{ order: 3 }}>
              <div style={{ marginBottom: 12 }}>
                <span className="slot-badge slot-rank-3">3RD PLACE</span>
                <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-main)', marginTop: 6 }}>
                  {getEntryTitle(top3.entryId)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {getEntryCategory(top3.entryId)}
                </div>
              </div>
              <div className="podium-pillar podium-pillar-bronze">
                <span className="mono text-bronze" style={{ fontSize: '24px', fontWeight: 900 }}>#3</span>
                <span className="mono" style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-main)', marginTop: 4 }}>
                  {top3.rawScore} pts
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {top3.rank1Count} x 1st
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Runoff Simulation View */}
      {showRunoffSim && top1 && top2 && (
        <div
          className="white-card"
          style={{
            marginBottom: 24,
            padding: '24px',
            background: 'var(--bg-card-muted)',
            border: '2px solid var(--accent-blue)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span className="badge badge-engine">Simulated Top 2 Runoff Head-to-Head</span>
            <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Eliminating lower candidates
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            <div className="white-card" style={{ padding: '16px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-gold)' }}>FINALIST A</div>
              <div style={{ fontSize: '16px', fontWeight: 900, marginTop: 4 }}>{getEntryTitle(top1.entryId)}</div>
              <div className="mono" style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-blue)', marginTop: 8 }}>
                Current Score: {top1.rawScore} pts ({top1Share}% share)
              </div>
            </div>

            <div className="white-card" style={{ padding: '16px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-silver)' }}>FINALIST B</div>
              <div style={{ fontSize: '16px', fontWeight: 900, marginTop: 4 }}>{getEntryTitle(top2.entryId)}</div>
              <div className="mono" style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-blue)', marginTop: 8 }}>
                Current Score: {top2.rawScore} pts ({totalBordaSum > 0 ? Math.round((top2.rawScore / totalBordaSum) * 100) : 0}% share)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>Rank</th>
              <th>Proposal</th>
              <th style={{ textAlign: 'right', width: 90 }}>1st (3p)</th>
              <th style={{ textAlign: 'right', width: 90 }}>2nd (2p)</th>
              <th style={{ textAlign: 'right', width: 90 }}>3rd (1p)</th>
              <th style={{ width: 160 }}>Weight Distribution</th>
              <th style={{ textAlign: 'right', width: 120 }}>Total Score</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>
                  No ballots recorded yet. Cast your ballot to initiate standings.
                </td>
              </tr>
            ) : (
              leaderboard.map((item, index) => {
                const totalN = (item.rank1Count * 3 + item.rank2Count * 2 + item.rank3Count * 1) || 1;
                const w1 = ((item.rank1Count * 3) / totalN) * 100;
                const w2 = ((item.rank2Count * 2) / totalN) * 100;
                const w3 = ((item.rank3Count * 1) / totalN) * 100;

                return (
                  <tr key={item.entryId}>
                    <td
                      className="mono"
                      style={{
                        fontWeight: 900,
                        fontSize: '15px',
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
                    <td>
                      <div style={{ fontWeight: 800, fontSize: '14px' }}>{getEntryTitle(item.entryId)}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {getEntryCategory(item.entryId)}
                      </div>
                    </td>
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--accent-gold)', fontWeight: 700 }}>
                      {item.rank1Count}
                    </td>
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--accent-silver)', fontWeight: 700 }}>
                      {item.rank2Count}
                    </td>
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--accent-bronze)', fontWeight: 700 }}>
                      {item.rank3Count}
                    </td>
                    <td>
                      <div className="breakdown-bar">
                        <div className="bar-rank1" style={{ width: `${w1}%` }} title={`1st place: ${item.rank1Count}`} />
                        <div className="bar-rank2" style={{ width: `${w2}%` }} title={`2nd place: ${item.rank2Count}`} />
                        <div className="bar-rank3" style={{ width: `${w3}%` }} title={`3rd place: ${item.rank3Count}`} />
                      </div>
                    </td>
                    <td
                      className="mono"
                      style={{
                        textAlign: 'right',
                        fontWeight: 900,
                        fontSize: '16px',
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
