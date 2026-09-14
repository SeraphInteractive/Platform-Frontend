import React, { useState, useMemo } from 'react';
import { VotingEntry, VotingRound, useDeleteEntry } from '../../hooks/useVotingApi.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { sounds } from '../../utils/soundEffects.ts';

interface PitchCatalogProps {
  entries: VotingEntry[];
  activeRound?: VotingRound;
  rounds?: VotingRound[];
  selectedRoundId?: string;
  onSelectRound?: (roundId: string) => void;
  selectedRank1: string;
  selectedRank2: string;
  selectedRank3: string;
  onSelectRank: (rank: 1 | 2 | 3, entryId: string) => void;
  onOpenCreatePitch?: () => void;
  onOpenCreateRound?: () => void;
}

export const PitchCatalog: React.FC<PitchCatalogProps> = ({
  entries,
  activeRound,
  rounds = [],
  selectedRoundId,
  onSelectRound,
  selectedRank1,
  selectedRank2,
  selectedRank3,
  onSelectRank,
  onOpenCreatePitch,
  onOpenCreateRound,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const roundId = selectedRoundId || activeRound?.id || 'round-01';

  const deleteMutation = useDeleteEntry(roundId);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'title' | 'creator'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      if (e.category) set.add(e.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [entries]);

  const filteredAndSortedEntries = useMemo(() => {
    let list = entries.filter((e) => {
      const matchCat = selectedCategory === 'ALL' || e.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.submitterUsername && e.submitterUsername.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });

    if (sortBy === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'creator') {
      list.sort((a, b) => (a.submitterUsername || '').localeCompare(b.submitterUsername || ''));
    }

    return list;
  }, [entries, selectedCategory, searchQuery, sortBy]);

  const handleDeleteEntry = async (entryId: string, title: string) => {
    sounds.playReset();
    if (window.confirm(`Delete: "${title}"?`)) {
      await deleteMutation.mutateAsync(entryId);
    }
  };

  const handleRankClick = (rank: 1 | 2 | 3, entryId: string) => {
    sounds.playSlot();
    onSelectRank(rank, entryId);
  };

  return (
    <div className="card" style={{ padding: '36px 40px', background: 'var(--bg-card)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            Community Submissions
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            Proposals
          </h2>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {isAdmin && onOpenCreateRound && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                sounds.playClick();
                onOpenCreateRound();
              }}
            >
              + Round
            </button>
          )}
          {onOpenCreatePitch && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                sounds.playPop();
                onOpenCreatePitch();
              }}
            >
              + Submit Pitch
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          paddingBottom: 20,
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 400 }}>
            <input
              type="text"
              className="input-field"
              placeholder="Search proposals by title, lore, creator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
            />
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth="2.5"
              style={{ position: 'absolute', left: 12, top: 12 }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          {/* Sort & View Mode Controls */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {rounds.length > 1 && onSelectRound && (
              <select
                className="select-field"
                value={selectedRoundId || activeRound?.id}
                onChange={(e) => {
                  sounds.playClick();
                  onSelectRound(e.target.value);
                }}
                style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '10px' }}
              >
                {rounds.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            )}

            <select
              className="select-field"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'title' | 'creator')}
              style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '10px' }}
            >
              <option value="newest">Sort: Newest</option>
              <option value="title">Sort: Title (A-Z)</option>
              <option value="creator">Sort: Creator</option>
            </select>

            <button
              className={`preset-chip-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => {
                sounds.playClick();
                setViewMode('grid');
              }}
              style={{ padding: '6px 10px' }}
            >
              Grid
            </button>
            <button
              className={`preset-chip-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => {
                sounds.playClick();
                setViewMode('list');
              }}
              style={{ padding: '6px 10px' }}
            >
              List
            </button>
          </div>
        </div>

        {/* Category Filter Chips with Counts */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {categories.map((cat) => {
            const count = cat === 'ALL' ? entries.length : entries.filter((e) => e.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                className={`preset-chip-btn ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  sounds.playClick();
                  setSelectedCategory(cat);
                }}
              >
                <span>{cat}</span>
                <span className="mono" style={{ fontSize: '10px', opacity: 0.8 }}>({count})</span>
              </button>
            );
          })}

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            Showing {filteredAndSortedEntries.length} Proposals
          </div>
        </div>
      </div>

      {/* Grid or List of Proposals */}
      {filteredAndSortedEntries.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
          No proposals found matching the selected filters.
        </div>
      ) : viewMode === 'grid' ? (
        <div className="pitch-grid">
          {filteredAndSortedEntries.map((pitch) => {
            const isRank1 = selectedRank1 === pitch.id;
            const isRank2 = selectedRank2 === pitch.id;
            const isRank3 = selectedRank3 === pitch.id;
            const isRanked = isRank1 || isRank2 || isRank3;

            return (
              <div
                key={pitch.id}
                className="pitch-card"
                style={{
                  borderWidth: isRanked ? '2px' : '1px',
                  borderColor: isRank1
                    ? 'var(--accent-gold)'
                    : isRank2
                    ? 'var(--accent-silver)'
                    : isRank3
                    ? 'var(--accent-bronze)'
                    : undefined,
                  boxShadow: isRanked ? '0 8px 24px rgba(0,0,0,0.08)' : undefined,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <span className="badge badge-engine">
                      {pitch.category || 'Pitch'}
                    </span>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {isRank1 && <span className="slot-badge slot-rank-1">1st (3p)</span>}
                      {isRank2 && <span className="slot-badge slot-rank-2">2nd (2p)</span>}
                      {isRank3 && <span className="slot-badge slot-rank-3">3rd (1p)</span>}
                      <span className="mono" style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                        {pitch.id}
                      </span>
                    </div>
                  </div>

                  <div className="pitch-title" style={{ fontSize: '16px', fontWeight: 800, marginBottom: 6 }}>
                    {pitch.title}
                  </div>
                  <div className="pitch-desc" style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-muted)' }}>
                    {pitch.description}
                  </div>
                </div>

                <div className="pitch-footer" style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: 'var(--bg-card-muted)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 800,
                        color: 'var(--text-muted)',
                      }}
                    >
                      {(pitch.submitterUsername || 'C')[0]}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {pitch.submitterUsername || 'Creator'}
                    </span>

                    {isAdmin && (
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ padding: '2px 8px', fontSize: '11px', marginLeft: 4 }}
                        onClick={() => handleDeleteEntry(pitch.id, pitch.title)}
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  <div className="pitch-actions" style={{ display: 'flex', gap: 6 }}>
                    <button
                      className={`btn btn-sm ${isRank1 ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        padding: '4px 10px',
                        borderColor: isRank1 ? 'var(--accent-gold)' : undefined,
                        background: isRank1 ? 'var(--accent-gold)' : undefined,
                        color: isRank1 ? '#000000' : undefined,
                        fontWeight: 800,
                      }}
                      onClick={() => handleRankClick(1, pitch.id)}
                    >
                      1st
                    </button>
                    <button
                      className={`btn btn-sm ${isRank2 ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        padding: '4px 10px',
                        borderColor: isRank2 ? 'var(--accent-silver)' : undefined,
                        background: isRank2 ? 'var(--accent-silver)' : undefined,
                        color: isRank2 ? '#000000' : undefined,
                        fontWeight: 800,
                      }}
                      onClick={() => handleRankClick(2, pitch.id)}
                    >
                      2nd
                    </button>
                    <button
                      className={`btn btn-sm ${isRank3 ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        padding: '4px 10px',
                        borderColor: isRank3 ? 'var(--accent-bronze)' : undefined,
                        background: isRank3 ? 'var(--accent-bronze)' : undefined,
                        color: isRank3 ? '#ffffff' : undefined,
                        fontWeight: 800,
                      }}
                      onClick={() => handleRankClick(3, pitch.id)}
                    >
                      3rd
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredAndSortedEntries.map((pitch) => {
            const isRank1 = selectedRank1 === pitch.id;
            const isRank2 = selectedRank2 === pitch.id;
            const isRank3 = selectedRank3 === pitch.id;
            const isRanked = isRank1 || isRank2 || isRank3;

            return (
              <div
                key={pitch.id}
                className="white-card"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16,
                  borderWidth: isRanked ? '2px' : '1px',
                  borderColor: isRank1
                    ? 'var(--accent-gold)'
                    : isRank2
                    ? 'var(--accent-silver)'
                    : isRank3
                    ? 'var(--accent-bronze)'
                    : 'var(--border-subtle)',
                }}
              >
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="badge badge-engine" style={{ fontSize: '10px' }}>
                      {pitch.category}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-main)' }}>
                      {pitch.title}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    By {pitch.submitterUsername || 'Creator'} | {pitch.description?.slice(0, 90)}...
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    className={`btn btn-sm ${isRank1 ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      padding: '4px 12px',
                      background: isRank1 ? 'var(--accent-gold)' : undefined,
                      color: isRank1 ? '#000000' : undefined,
                      fontWeight: 800,
                    }}
                    onClick={() => handleRankClick(1, pitch.id)}
                  >
                    1st (3p)
                  </button>
                  <button
                    className={`btn btn-sm ${isRank2 ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      padding: '4px 12px',
                      background: isRank2 ? 'var(--accent-silver)' : undefined,
                      color: isRank2 ? '#000000' : undefined,
                      fontWeight: 800,
                    }}
                    onClick={() => handleRankClick(2, pitch.id)}
                  >
                    2nd (2p)
                  </button>
                  <button
                    className={`btn btn-sm ${isRank3 ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      padding: '4px 12px',
                      background: isRank3 ? 'var(--accent-bronze)' : undefined,
                      color: isRank3 ? '#ffffff' : undefined,
                      fontWeight: 800,
                    }}
                    onClick={() => handleRankClick(3, pitch.id)}
                  >
                    3rd (1p)
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
