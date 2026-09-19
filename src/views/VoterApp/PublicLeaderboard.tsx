import React from 'react';
import { VotingEntry, getSubmitterAvatar } from '../../hooks/useVotingApi.ts';
import { EntryScoreBreakdown } from '@platform/internal-logic';
import { useScrollDirection } from '../../hooks/useScrollDirection.ts';

interface PublicLeaderboardProps {
  entries: VotingEntry[];
  leaderboard?: EntryScoreBreakdown[];
  totalBallots?: number;
  expectedPoints?: number;
  onSelectEntryForVote?: (entryId: string) => void;
  onNavigateBallot?: () => void;
}

export const PublicLeaderboard: React.FC<PublicLeaderboardProps> = ({
  entries,
  leaderboard = [],
  totalBallots = 0,
  expectedPoints = 0,
  onSelectEntryForVote,
  onNavigateBallot,
}) => {
  const isHeaderVisible = useScrollDirection();
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [pageSize, setPageSize] = React.useState<number>(25);
  const getEntry = (id: string) => entries.find((e) => e.id === id);

  // Full entries list sorted by score
  const sortedItems = React.useMemo(() => {
    if (leaderboard.length > 0) {
      return leaderboard.map((item) => ({
        ...item,
        entry: getEntry(item.entryId),
      }));
    }
    // Fallback if leaderboard not yet populated
    return entries.map((e) => ({
      entryId: e.id,
      rawScore: 0,
      rank1Count: 0,
      rank2Count: 0,
      rank3Count: 0,
      entry: e,
    }));
  }, [leaderboard, entries]);

  const top1 = sortedItems[0];
  const top2 = sortedItems[1];
  const top3 = sortedItems[2];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
      {/* Header Banner with dynamic scroll appearance */}
      <div
        className={`card scroll-header-banner ${isHeaderVisible ? 'banner-visible' : 'banner-hidden'}`}
        style={{ padding: '28px 36px', background: 'var(--bg-card)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
              Leaderboard
            </h1>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="badge badge-engine">
              {totalBallots} Ballots
            </span>
            <span className="badge badge-success">
              {expectedPoints} Points
            </span>
            {onNavigateBallot && (
              <button className="btn btn-primary btn-sm" onClick={onNavigateBallot}>
                Cast Ballot
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Top 3 Visual Podium */}
      {sortedItems.length >= 2 && (
        <div className="podium-container">
          {/* 2nd Place Silver */}
          {top2 && (
            <div className="podium-card podium-place-2">
              <div style={{ marginBottom: 12 }}>
                <span className="slot-badge slot-rank-2">2ND PLACE</span>
                <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-main)', marginTop: 8 }}>
                  {top2.entry?.title || top2.entryId}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  By {top2.entry?.submitterUsername || 'Creator'}
                </div>
              </div>

              {top2.entry?.mediaUrl && (
                <div style={{ width: '100%', height: 100, borderRadius: 8, overflow: 'hidden', marginBottom: 10 }}>
                  <img
                    src={top2.entry.mediaUrl}
                    alt={top2.entry.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}

              <div className="podium-pillar podium-pillar-silver">
                <span className="mono text-silver" style={{ fontSize: '28px', fontWeight: 900 }}>#2</span>
                <span className="mono" style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-main)', marginTop: 4 }}>
                  {top2.rawScore} pts
                </span>
              </div>
            </div>
          )}

          {/* 1st Place Gold */}
          {top1 && (
            <div className="podium-card podium-place-1">
              <div style={{ marginBottom: 12 }}>
                <span className="slot-badge slot-rank-1">1ST PLACE LEADER</span>
                <div style={{ fontWeight: 900, fontSize: '17px', color: 'var(--text-main)', marginTop: 8 }}>
                  {top1.entry?.title || top1.entryId}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  By {top1.entry?.submitterUsername || 'Creator'}
                </div>
              </div>

              {top1.entry?.mediaUrl && (
                <div style={{ width: '100%', height: 110, borderRadius: 8, overflow: 'hidden', marginBottom: 10 }}>
                  <img
                    src={top1.entry.mediaUrl}
                    alt={top1.entry.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}

              <div className="podium-pillar podium-pillar-gold">
                <span className="mono text-gold" style={{ fontSize: '36px', fontWeight: 900 }}>#1</span>
                <span className="mono" style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-main)', marginTop: 4 }}>
                  {top1.rawScore} pts
                </span>
              </div>
            </div>
          )}

          {/* 3rd Place Bronze */}
          {top3 && (
            <div className="podium-card podium-place-3">
              <div style={{ marginBottom: 12 }}>
                <span className="slot-badge slot-rank-3">3RD PLACE</span>
                <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-main)', marginTop: 8 }}>
                  {top3.entry?.title || top3.entryId}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  By {top3.entry?.submitterUsername || 'Creator'}
                </div>
              </div>

              {top3.entry?.mediaUrl && (
                <div style={{ width: '100%', height: 90, borderRadius: 8, overflow: 'hidden', marginBottom: 10 }}>
                  <img
                    src={top3.entry.mediaUrl}
                    alt={top3.entry.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}

              <div className="podium-pillar podium-pillar-bronze">
                <span className="mono text-bronze" style={{ fontSize: '24px', fontWeight: 900 }}>#3</span>
                <span className="mono" style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-main)', marginTop: 4 }}>
                  {top3.rawScore} pts
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Standings Table with Entry Details and Total Score */}
      <div className="card" style={{ padding: '24px 28px', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
            Rankings
          </div>
          <div className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {sortedItems.length} Proposals
          </div>
        </div>

        <div className="table-wrap">
          <table className="clean-table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>Rank</th>
                <th>Proposal</th>
                <th>Creator</th>
                <th style={{ textAlign: 'right', width: 140 }}>Total Score</th>
                {onSelectEntryForVote && <th style={{ width: 120, textAlign: 'center' }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>
                    No proposals in this round.
                  </td>
                </tr>
              ) : (
                sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((item, localIdx) => {
                  const index = (currentPage - 1) * pageSize + localIdx;
                  const entry = item.entry;
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          {entry?.mediaUrl && (
                            <img
                              src={entry.mediaUrl}
                              alt={entry.title}
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 6,
                                objectFit: 'cover',
                                flexShrink: 0,
                              }}
                            />
                          )}
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-main)' }}>
                              {entry?.title || item.entryId}
                            </div>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                              <span className="badge badge-engine" style={{ fontSize: '9px', padding: '1px 6px' }}>
                                {entry?.category || 'General'}
                              </span>
                              <span className="mono" style={{ fontSize: '10px', color: 'var(--text-light)' }}>
                                {item.entryId}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <img
                            src={getSubmitterAvatar(entry?.submitterUsername, entry?.submitterAvatar)}
                            alt={entry?.submitterUsername || 'Creator'}
                            style={{ width: 22, height: 22, borderRadius: '50%' }}
                          />
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {entry?.submitterUsername || 'Community Creator'}
                          </span>
                        </div>
                      </td>
                      <td
                        className="mono"
                        style={{
                          textAlign: 'right',
                          fontWeight: 900,
                          fontSize: '16px',
                          color: index === 0 ? 'var(--accent-green)' : 'var(--accent-blue)',
                        }}
                      >
                        {item.rawScore} pts
                      </td>
                      {onSelectEntryForVote && (
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => onSelectEntryForVote(item.entryId)}
                          >
                            Vote
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {sortedItems.length > 10 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sortedItems.length)} of {sortedItems.length}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Per page:</span>
                <select
                  className="select-field"
                  style={{ fontSize: '11px', padding: '2px 6px' }}
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11px', padding: '4px 10px' }}
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--text-main)', padding: '0 4px' }}>
                Page {currentPage} of {Math.max(1, Math.ceil(sortedItems.length / pageSize))}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11px', padding: '4px 10px' }}
                disabled={currentPage >= Math.ceil(sortedItems.length / pageSize)}
                onClick={() => setCurrentPage((p) => Math.min(Math.ceil(sortedItems.length / pageSize), p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
