import React, { useState, useRef } from 'react';
import { VotingEntry, VotingRound, StoredBallotRecord, getSubmitterAvatar } from '../../hooks/useVotingApi.ts';
import { validate_ballot, Ballot } from '@platform/internal-logic';
import { useAuth } from '../../context/AuthContext.tsx';
import { sounds } from '../../utils/soundEffects.ts';

interface VotePageProps {
  activeRound?: VotingRound;
  entries: VotingEntry[];
  rank1: string;
  rank2: string;
  rank3: string;
  myBallot?: StoredBallotRecord | null;
  isSubmitting: boolean;
  onSelectRank: (rank: 1 | 2 | 3, entryId: string) => void;
  onClearSlot: (rank: 1 | 2 | 3) => void;
  onSubmitBallot: () => void;
  onOpenCreatePitch: () => void;
  voterId: string;
}

export const VotePage: React.FC<VotePageProps> = ({
  activeRound,
  entries,
  rank1,
  rank2,
  rank3,
  myBallot,
  isSubmitting,
  onSelectRank,
  onClearSlot,
  onSubmitBallot,
  onOpenCreatePitch,
  voterId,
}) => {
  const { isBarred, isAuthenticated, loginWithDiscord } = useAuth();
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

  const [isDragOverPool, setIsDragOverPool] = useState(false);

  const rollerRef = useRef<HTMLDivElement>(null);

  // Deterministic seeded Fisher-Yates shuffle per voter & round to eliminate candidate presentation primacy bias
  const randomizedEntries = React.useMemo(() => {
    if (!entries || entries.length <= 1) return entries;
    const seed = `${voterId || 'community_voter'}-${activeRound?.id || 'round-seed'}-pool-perm`;
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
    }
    const prng = () => {
      h += 0x6d2b79f5;
      let t = Math.imul(h ^ (h >>> 15), 1 | h);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const arr = [...entries];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(prng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [entries, voterId, activeRound?.id]);

  const getEntry = (id: string) => entries.find((e) => e.id === id);
  const selectedEntry = selectedEntryId ? getEntry(selectedEntryId) : null;

  const currentBallot: Ballot = {
    voterId: voterId || 'anonymous_voter',
    rank1,
    rank2,
    rank3,
  };

  const activeEntrySet = new Set(entries.map((e) => e.id));
  const validation = validate_ballot(currentBallot, activeEntrySet);
  const isComplete = Boolean(rank1 && rank2 && rank3);

  // Scroll through roller with mouse wheel
  const handleRollerWheel = (e: React.WheelEvent) => {
    if (randomizedEntries.length === 0) return;
    if (e.deltaY > 20) {
      setFocusedIndex((prev) => (prev + 1) % randomizedEntries.length);
    } else if (e.deltaY < -20) {
      setFocusedIndex((prev) => (prev - 1 + randomizedEntries.length) % randomizedEntries.length);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, entryId: string) => {
    setDraggedId(entryId);
    e.dataTransfer.setData('text/plain', entryId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, slotNum: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSlot !== slotNum) {
      setDragOverSlot(slotNum);
    }
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = (e: React.DragEvent, slotNum: 1 | 2 | 3) => {
    e.preventDefault();
    setDragOverSlot(null);
    const entryId = e.dataTransfer.getData('text/plain') || draggedId;
    if (entryId) {
      sounds.playPop();
      onSelectRank(slotNum, entryId);
      setDraggedId(null);
    }
  };

  // Drag over pool to return an entry back into the pool
  const handlePoolDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOverPool) {
      setIsDragOverPool(true);
    }
  };

  const handlePoolDragLeave = () => {
    setIsDragOverPool(false);
  };

  const handlePoolDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverPool(false);
    const entryId = e.dataTransfer.getData('text/plain') || draggedId;
    if (!entryId) return;

    sounds.playReset();
    if (rank1 === entryId) {
      onClearSlot(1);
    } else if (rank2 === entryId) {
      onClearSlot(2);
    } else if (rank3 === entryId) {
      onClearSlot(3);
    }
    setDraggedId(null);
  };

  const handleSlotClick = (slotNum: 1 | 2 | 3, entryId: string) => {
    sounds.playPop();
    onSelectRank(slotNum, entryId);
  };

  const handleClear = (slotNum: 1 | 2 | 3) => {
    sounds.playReset();
    onClearSlot(slotNum);
  };

  const handleReorderRank = (sourceRank: 1 | 2 | 3, targetRank: 1 | 2 | 3) => {
    sounds.playPop();
    const srcId = sourceRank === 1 ? rank1 : sourceRank === 2 ? rank2 : rank3;
    const tgtId = targetRank === 1 ? rank1 : targetRank === 2 ? rank2 : rank3;
    if (!srcId) return;
    onSelectRank(targetRank, srcId);
    if (tgtId) {
      onSelectRank(sourceRank, tgtId);
    }
  };

  const handleCast = () => {
    if (!isAuthenticated) {
      loginWithDiscord();
      return;
    }
    if (validation.isValid) {
      sounds.playLevelUp();
    }
    onSubmitBallot();
  };

  return (
    <div
      className="card vote-page-card"
      style={{
        padding: 'clamp(14px, 2vh, 22px) clamp(16px, 2.5vw, 32px)',
        background: 'var(--bg-card)',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Header: Round Box, Creative Brief Thought Bubble & Exclusive Proposal Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 'clamp(8px, 1.4vh, 16px)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Current Round Box */}
          <div
            className="white-card"
            style={{
              padding: '6px 14px',
              borderRadius: '12px',
              background: 'var(--bg-card-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div>
              <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase' }}>
                Current Round
              </div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-main)' }}>
                {activeRound?.title || 'No Active Round'}
              </div>
            </div>
          </div>

          {/* Thought Bubble Tooltip (Creative Brief & Guidelines) */}
          <div className="thought-bubble-wrapper">
            <button
              className="thought-bubble-trigger"
              aria-label="View Round Brief"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <line x1="9" y1="9" x2="15" y2="9" />
                <line x1="9" y1="13" x2="13" y2="13" />
              </svg>
            </button>

            <div className="thought-bubble-popover" style={{ width: 280 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className="badge badge-engine">Round Focus</span>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 800 }}>
                  {activeRound?.category || (activeRound ? 'General' : 'None')}
                </span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginBottom: 6 }}>
                {activeRound?.title || 'No Active Round'}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                {activeRound?.description || (activeRound ? 'No description provided.' : 'No active rounds in database.')}
              </p>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10, marginTop: 10 }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Point Distribution
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>1st Choice</span>
                    <span className="mono" style={{ fontWeight: 800, color: 'var(--text-main)' }}>3 Points</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--accent-silver)', fontWeight: 700 }}>2nd Choice</span>
                    <span className="mono" style={{ fontWeight: 800, color: 'var(--text-main)' }}>2 Points</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--accent-bronze)', fontWeight: 700 }}>3rd Choice</span>
                    <span className="mono" style={{ fontWeight: 800, color: 'var(--text-main)' }}>1 Point</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-subtle)', paddingTop: 6, marginTop: 4 }}>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 800 }}>Total</span>
                    <span className="mono" style={{ fontWeight: 900, color: 'var(--accent-green)' }}>6 Points</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Proposal Button */}
        <div>
          <button
            className="btn btn-primary"
            onClick={onOpenCreatePitch}
            style={{ padding: '8px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Submit Proposal</span>
          </button>
        </div>
      </div>

      {isBarred && (
        <div className="callout callout-danger" style={{ marginBottom: 12, flexShrink: 0 }}>
          <strong>Barred:</strong> Account has 3 warnings. Voting is restricted.
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="vote-layout-grid">
        {/* Left Column: Slot Machine Roller OR Detail View */}
        <div
          className={`pool-drop-zone ${isDragOverPool ? 'pool-drag-over' : ''}`}
          onDragOver={handlePoolDragOver}
          onDragLeave={handlePoolDragLeave}
          onDrop={handlePoolDrop}
        >
          {selectedEntry ? (
            /* Detailed Inspection View */
            <div className="vote-detail-view" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedEntryId(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  <span>Back to Roller</span>
                </button>

                <span className="badge badge-engine">
                  {selectedEntry.category || 'Proposal'}
                </span>
              </div>

              {/* Media Preview Box */}
              <div className="media-preview-box">
                {selectedEntry.mediaUrl ? (
                  selectedEntry.mediaUrl.endsWith('.mp4') || selectedEntry.mediaUrl.endsWith('.webm') ? (
                    <video src={selectedEntry.mediaUrl} controls />
                  ) : (
                    <img src={selectedEntry.mediaUrl} alt={selectedEntry.title} />
                  )
                ) : (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-light)', fontSize: '13px' }}>
                    No media attached (Text Pitch)
                  </div>
                )}
              </div>

              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 900, color: 'var(--text-main)', marginBottom: 8 }}>
                  {selectedEntry.title}
                </h3>
                <div className="submitter-avatar-chip" style={{ marginBottom: 12 }}>
                  <img
                    src={getSubmitterAvatar(selectedEntry.submitterUsername, selectedEntry.submitterAvatar)}
                    alt={selectedEntry.submitterUsername || 'Creator'}
                    className="submitter-avatar-img-lg"
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                      {selectedEntry.submitterUsername || 'Community Creator'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                      Proposal Author
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                  {selectedEntry.description || 'No detailed description provided.'}
                </p>
              </div>

              {/* Quick Slot Action Buttons inside Detail View */}
              <div className="tap-chips-group" style={{ display: 'flex', gap: 10, borderTop: '1px solid var(--border-subtle)', paddingTop: 14, marginTop: 'auto' }}>
                <button
                  type="button"
                  className={`btn btn-secondary btn-sm tap-rank-chip rank-chip-1 ${rank1 === selectedEntry.id ? 'active-rank-1' : ''}`}
                  style={{ flex: 1, borderColor: rank1 === selectedEntry.id ? 'var(--accent-gold)' : undefined }}
                  aria-label={`Rank 1st ${selectedEntry.title}`}
                  onClick={() => {
                    sounds.playPop();
                    handleSlotClick(1, selectedEntry.id);
                  }}
                >
                  Slot 1st (3p)
                </button>
                <button
                  type="button"
                  className={`btn btn-secondary btn-sm tap-rank-chip rank-chip-2 ${rank2 === selectedEntry.id ? 'active-rank-2' : ''}`}
                  style={{ flex: 1, borderColor: rank2 === selectedEntry.id ? 'var(--accent-silver)' : undefined }}
                  aria-label={`Rank 2nd ${selectedEntry.title}`}
                  onClick={() => {
                    sounds.playPop();
                    handleSlotClick(2, selectedEntry.id);
                  }}
                >
                  Slot 2nd (2p)
                </button>
                <button
                  type="button"
                  className={`btn btn-secondary btn-sm tap-rank-chip rank-chip-3 ${rank3 === selectedEntry.id ? 'active-rank-3' : ''}`}
                  style={{ flex: 1, borderColor: rank3 === selectedEntry.id ? 'var(--accent-bronze)' : undefined }}
                  aria-label={`Rank 3rd ${selectedEntry.title}`}
                  onClick={() => {
                    sounds.playPop();
                    handleSlotClick(3, selectedEntry.id);
                  }}
                >
                  Slot 3rd (1p)
                </button>
              </div>
            </div>
          ) : (
            /* Slot Machine Vertical Roller */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase' }}>
                    Proposal Pool ({randomizedEntries.length} Available)
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={onOpenCreatePitch}
                    style={{ padding: '2px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Submit Pitch</span>
                  </button>
                </div>
                {isDragOverPool && (
                  <span className="badge badge-engine" style={{ fontSize: '10px' }}>
                    Drop to return to pool
                  </span>
                )}
              </div>

              <div
                ref={rollerRef}
                className="slot-roller-container"
                onWheel={handleRollerWheel}
              >
                {randomizedEntries.length === 0 ? (
                  <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    <p style={{ margin: '0 0 12px 0' }}>No proposals in the active pool yet.</p>
                    <button className="btn btn-primary btn-sm" onClick={onOpenCreatePitch}>
                      Submit First Pitch
                    </button>
                  </div>
                ) : (
                  randomizedEntries.map((entry, idx) => {
                    const isFocus = idx === focusedIndex;
                    const isRank1 = rank1 === entry.id;
                    const isRank2 = rank2 === entry.id;
                    const isRank3 = rank3 === entry.id;
                    const isRanked = isRank1 || isRank2 || isRank3;

                    const isVideoMedia = (url?: string | null) => {
                      if (!url) return false;
                      return url.endsWith('.mp4') || url.endsWith('.webm') || url.startsWith('data:video');
                    };

                    return (
                      <div
                        key={entry.id}
                        draggable={!isBarred}
                        onDragStart={(e) => handleDragStart(e, entry.id)}
                        onClick={() => setSelectedEntryId(entry.id)}
                        className={`slot-roller-card ${isFocus ? 'center-focus' : ''} ${isRanked ? 'is-ranked' : ''}`}
                      >
                        <div style={{ display: 'flex', gap: 14, alignItems: 'stretch', width: '100%' }}>
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <span className="badge badge-engine" style={{ fontSize: '10px' }}>
                                {entry.category || 'Pitch'}
                              </span>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                {isRank1 && <span className="slot-badge slot-rank-1">1st (3p)</span>}
                                {isRank2 && <span className="slot-badge slot-rank-2">2nd (2p)</span>}
                                {isRank3 && <span className="slot-badge slot-rank-3">3rd (1p)</span>}
                                <span className="mono" style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                                  {entry.id}
                                </span>
                              </div>
                            </div>

                            <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-main)' }}>
                              {entry.title}
                            </div>

                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {entry.description}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 6, flexWrap: 'wrap', gap: 8 }}>
                              <div className="tap-chips-group">
                                <button
                                  type="button"
                                  className={`tap-rank-chip rank-chip-1 ${isRank1 ? 'active-rank-1' : ''}`}
                                  aria-label={`Rank 1st ${entry.title}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    sounds.playPop();
                                    onSelectRank(1, entry.id);
                                  }}
                                >
                                  1st
                                </button>
                                <button
                                  type="button"
                                  className={`tap-rank-chip rank-chip-2 ${isRank2 ? 'active-rank-2' : ''}`}
                                  aria-label={`Rank 2nd ${entry.title}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    sounds.playPop();
                                    onSelectRank(2, entry.id);
                                  }}
                                >
                                  2nd
                                </button>
                                <button
                                  type="button"
                                  className={`tap-rank-chip rank-chip-3 ${isRank3 ? 'active-rank-3' : ''}`}
                                  aria-label={`Rank 3rd ${entry.title}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    sounds.playPop();
                                    onSelectRank(3, entry.id);
                                  }}
                                >
                                  3rd
                                </button>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div className="submitter-avatar-chip">
                                  <img
                                    src={getSubmitterAvatar(entry.submitterUsername, entry.submitterAvatar)}
                                    alt={entry.submitterUsername || 'Creator'}
                                    className="submitter-avatar-img"
                                  />
                                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                                    By {entry.submitterUsername || 'Creator'}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  className="thought-bubble-trigger"
                                  aria-label={`Inspect ${entry.title}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEntryId(entry.id);
                                  }}
                                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--accent-blue)', fontWeight: 700, fontSize: '11px' }}
                                >
                                  Inspect
                                </button>
                              </div>
                            </div>
                          </div>

                          {entry.mediaUrl && (
                            <div className="slot-card-media-preview">
                              {isVideoMedia(entry.mediaUrl) ? (
                                <div className="slot-video-thumbnail-wrapper">
                                  <video
                                    src={entry.mediaUrl}
                                    muted
                                    playsInline
                                    preload="metadata"
                                    className="slot-card-thumbnail-media"
                                  />
                                  <div className="slot-video-play-indicator">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                      <polygon points="5 3 19 12 5 21 5 3" />
                                    </svg>
                                  </div>
                                </div>
                              ) : (
                                <img
                                  src={entry.mediaUrl}
                                  alt={entry.title}
                                  className="slot-card-thumbnail-media"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: 3 Empty Ranked Target Drop Slots */}
        <div className="drop-slots-column">
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: 2, flexShrink: 0 }}>
            Ballot Slots (Drag to Rearrange)
          </div>

          {/* Slot 1: 3 Points (Gold) */}
          <div
            draggable={Boolean(rank1) && !isBarred}
            onDragStart={(e) => rank1 && handleDragStart(e, rank1)}
            onDragOver={(e) => handleDragOver(e, 1)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 1)}
            className={`slot-drop-target slot-1 ${dragOverSlot === 1 ? 'drag-over' : ''} ${rank1 ? 'filled is-draggable' : 'cue-pulse'}`}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="slot-badge slot-rank-1">1ST CHOICE (3 PTS)</span>
              {rank1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    className="slot-reorder-btn"
                    aria-label="Move rank 1 down to rank 2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReorderRank(1, 2);
                    }}
                    title="Move down"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm slot-clear-btn"
                    style={{ padding: '2px 8px', fontSize: '11px' }}
                    onClick={() => handleClear(1)}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {rank1 && getEntry(rank1) ? (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="slot-card-title" style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-main)' }}>
                    {getEntry(rank1)?.title || rank1}
                  </div>
                  <div className="submitter-avatar-chip" style={{ marginTop: 4 }}>
                    <img
                      src={getSubmitterAvatar(getEntry(rank1)?.submitterUsername, getEntry(rank1)?.submitterAvatar)}
                      alt={getEntry(rank1)?.submitterUsername || 'Creator'}
                      className="submitter-avatar-img"
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      By {getEntry(rank1)?.submitterUsername || 'Creator'}
                    </span>
                  </div>
                </div>
                {getEntry(rank1)?.mediaUrl && (
                  <div style={{ width: 54, height: 42, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                    <img
                      src={getEntry(rank1)!.mediaUrl!}
                      alt={getEntry(rank1)?.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: 'var(--text-light)', fontSize: '12px', fontStyle: 'italic', margin: 'auto 0', textAlign: 'center' }}>
                Drag &amp; drop an entry box here for 3 points
              </div>
            )}
          </div>

          {/* Slot 2: 2 Points (Silver) */}
          <div
            draggable={Boolean(rank2) && !isBarred}
            onDragStart={(e) => rank2 && handleDragStart(e, rank2)}
            onDragOver={(e) => handleDragOver(e, 2)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 2)}
            className={`slot-drop-target slot-2 ${dragOverSlot === 2 ? 'drag-over' : ''} ${rank2 ? 'filled is-draggable' : 'cue-pulse'}`}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="slot-badge slot-rank-2">2ND CHOICE (2 PTS)</span>
              {rank2 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    type="button"
                    className="slot-reorder-btn"
                    aria-label="Move rank 2 up to rank 1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReorderRank(2, 1);
                    }}
                    title="Move up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="slot-reorder-btn"
                    aria-label="Move rank 2 down to rank 3"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReorderRank(2, 3);
                    }}
                    title="Move down"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm slot-clear-btn"
                    style={{ padding: '2px 8px', fontSize: '11px' }}
                    onClick={() => handleClear(2)}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {rank2 && getEntry(rank2) ? (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="slot-card-title" style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-main)' }}>
                    {getEntry(rank2)?.title || rank2}
                  </div>
                  <div className="submitter-avatar-chip" style={{ marginTop: 4 }}>
                    <img
                      src={getSubmitterAvatar(getEntry(rank2)?.submitterUsername, getEntry(rank2)?.submitterAvatar)}
                      alt={getEntry(rank2)?.submitterUsername || 'Creator'}
                      className="submitter-avatar-img"
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      By {getEntry(rank2)?.submitterUsername || 'Creator'}
                    </span>
                  </div>
                </div>
                {getEntry(rank2)?.mediaUrl && (
                  <div style={{ width: 54, height: 42, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                    <img
                      src={getEntry(rank2)!.mediaUrl!}
                      alt={getEntry(rank2)?.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: 'var(--text-light)', fontSize: '12px', fontStyle: 'italic', margin: 'auto 0', textAlign: 'center' }}>
                Drag &amp; drop an entry box here for 2 points
              </div>
            )}
          </div>

          {/* Slot 3: 1 Point (Bronze) */}
          <div
            draggable={Boolean(rank3) && !isBarred}
            onDragStart={(e) => rank3 && handleDragStart(e, rank3)}
            onDragOver={(e) => handleDragOver(e, 3)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 3)}
            className={`slot-drop-target slot-3 ${dragOverSlot === 3 ? 'drag-over' : ''} ${rank3 ? 'filled is-draggable' : 'cue-pulse'}`}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="slot-badge slot-rank-3">3RD CHOICE (1 PT)</span>
              {rank3 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    className="slot-reorder-btn"
                    aria-label="Move rank 3 up to rank 2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReorderRank(3, 2);
                    }}
                    title="Move up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm slot-clear-btn"
                    style={{ padding: '2px 8px', fontSize: '11px' }}
                    onClick={() => handleClear(3)}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {rank3 && getEntry(rank3) ? (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="slot-card-title" style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-main)' }}>
                    {getEntry(rank3)?.title || rank3}
                  </div>
                  <div className="submitter-avatar-chip" style={{ marginTop: 4 }}>
                    <img
                      src={getSubmitterAvatar(getEntry(rank3)?.submitterUsername, getEntry(rank3)?.submitterAvatar)}
                      alt={getEntry(rank3)?.submitterUsername || 'Creator'}
                      className="submitter-avatar-img"
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      By {getEntry(rank3)?.submitterUsername || 'Creator'}
                    </span>
                  </div>
                </div>
                {getEntry(rank3)?.mediaUrl && (
                  <div style={{ width: 54, height: 42, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                    <img
                      src={getEntry(rank3)!.mediaUrl!}
                      alt={getEntry(rank3)?.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: 'var(--text-light)', fontSize: '12px', fontStyle: 'italic', margin: 'auto 0', textAlign: 'center' }}>
                Drag &amp; drop an entry box here for 1 point
              </div>
            )}
          </div>

          {/* Validation & Submit Action */}
          {isComplete && !validation.isValid && (
            <div className="callout callout-danger" style={{ marginTop: 6, flexShrink: 0 }}>
              {validation.errors.join(', ')}
            </div>
          )}

          {!isAuthenticated && isComplete && (
            <div className="callout callout-warning" style={{ marginTop: 6, flexShrink: 0, fontSize: '12px' }}>
              Authentication required: Please log in with Discord to submit your vote.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, flexShrink: 0 }}>
            <div className="mono" style={{ fontSize: '12px', color: 'var(--text-light)' }}>
              {isComplete ? '3 of 3 Slots Selected' : 'Incomplete Ballot'}
            </div>

            {!isAuthenticated ? (
              <button
                type="button"
                className="btn btn-primary cast-ballot-btn"
                onClick={loginWithDiscord}
                style={{ padding: '10px 22px', fontSize: '13px', background: '#5865F2', borderColor: '#5865F2' }}
              >
                Log In to Vote
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary cast-ballot-btn"
                disabled={!validation.isValid || isSubmitting || isBarred}
                onClick={handleCast}
                style={{ padding: '10px 28px', fontSize: '13px' }}
              >
                {isBarred ? 'Restricted' : isSubmitting ? 'Recording...' : myBallot ? 'Update Ballot' : 'Cast Ballot'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
