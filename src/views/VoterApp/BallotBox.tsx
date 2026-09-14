import React from 'react';
import { VotingEntry, StoredBallotRecord } from '../../hooks/useVotingApi.ts';
import { validate_ballot, Ballot } from '@platform/internal-logic';
import { useAuth } from '../../context/AuthContext.tsx';
import { sounds } from '../../utils/soundEffects.ts';

interface BallotBoxProps {
  entries: VotingEntry[];
  rank1: string;
  rank2: string;
  rank3: string;
  myBallot?: StoredBallotRecord | null;
  isSubmitting: boolean;
  onClearSlot: (rank: 1 | 2 | 3) => void;
  onSubmitBallot: () => void;
  voterId: string;
}

export const BallotBox: React.FC<BallotBoxProps> = ({
  entries,
  rank1,
  rank2,
  rank3,
  myBallot,
  isSubmitting,
  onClearSlot,
  onSubmitBallot,
  voterId,
}) => {
  const { isBarred } = useAuth();
  const getEntry = (id: string) => entries.find((e) => e.id === id);

  const currentBallot: Ballot = {
    voterId: voterId || 'anonymous_voter',
    rank1,
    rank2,
    rank3,
  };

  const activeEntrySet = new Set(entries.map((e) => e.id));
  const validation = validate_ballot(currentBallot, activeEntrySet);
  const isComplete = Boolean(rank1 && rank2 && rank3);

  const allocatedPoints = (rank1 ? 3 : 0) + (rank2 ? 2 : 0) + (rank3 ? 1 : 0);
  const conservationPercent = Math.round((allocatedPoints / 6) * 100);

  const handleClear = (rank: 1 | 2 | 3) => {
    sounds.playReset();
    onClearSlot(rank);
  };

  const handleSubmit = () => {
    sounds.playLevelUp();
    onSubmitBallot();
  };

  return (
    <div className="card" style={{ padding: '36px 40px', background: 'var(--bg-card)' }}>
      {/* Card Header & 6N Gauge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            Community Consensus
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            Ballot
          </h2>
        </div>

        {/* 6N Conservation Energy Gauge */}
        <div className="energy-gauge-container">
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>6N Conservation</div>
            <div className="mono" style={{ fontSize: '14px', fontWeight: 900, color: conservationPercent === 100 ? 'var(--accent-green)' : 'var(--accent-gold)' }}>
              {allocatedPoints} / 6 Points ({conservationPercent}%)
            </div>
          </div>

          <div className="energy-cylinder-track">
            <div
              className={`energy-cylinder-fill ${conservationPercent === 100 ? 'full' : ''}`}
              style={{ width: `${conservationPercent}%` }}
            />
          </div>

          {myBallot && (
            <span className="badge badge-success">
              Recorded
            </span>
          )}
        </div>
      </div>

      {isBarred && (
        <div className="callout callout-danger" style={{ marginBottom: 18 }}>
          <strong>Barred:</strong> 3 warnings reached. Voting privileges restricted.
        </div>
      )}

      {/* 3 Illuminated Rank Pedestals */}
      <div className="ballot-pedestals-grid">
        {/* Rank 1 (3 Points) */}
        <div className={`ballot-pedestal rank-1-pedestal ${rank1 ? 'filled' : ''}`}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="slot-badge slot-rank-1">1ST CHOICE (3 PTS)</span>
              {rank1 && (
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '2px 8px', fontSize: '11px' }}
                  onClick={() => handleClear(1)}
                  disabled={isBarred}
                >
                  Clear
                </button>
              )}
            </div>

            {rank1 ? (
              <div>
                <div style={{ fontWeight: 900, fontSize: '16px', color: 'var(--text-main)', marginBottom: 4 }}>
                  {getEntry(rank1)?.title || rank1}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {getEntry(rank1)?.category} | By {getEntry(rank1)?.submitterUsername || 'Creator'}
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-light)', fontSize: '13px', fontStyle: 'italic', padding: '16px 0' }}>
                Select 1st choice from proposals below (3 points)
              </div>
            )}
          </div>

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
            <span className="mono text-gold" style={{ fontSize: '12px', fontWeight: 800 }}>Weight: 3x</span>
            <span className="mono" style={{ fontSize: '11px', color: 'var(--text-light)' }}>Slot 01</span>
          </div>
        </div>

        {/* Rank 2 (2 Points) */}
        <div className={`ballot-pedestal rank-2-pedestal ${rank2 ? 'filled' : ''}`}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="slot-badge slot-rank-2">2ND CHOICE (2 PTS)</span>
              {rank2 && (
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '2px 8px', fontSize: '11px' }}
                  onClick={() => handleClear(2)}
                  disabled={isBarred}
                >
                  Clear
                </button>
              )}
            </div>

            {rank2 ? (
              <div>
                <div style={{ fontWeight: 900, fontSize: '16px', color: 'var(--text-main)', marginBottom: 4 }}>
                  {getEntry(rank2)?.title || rank2}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {getEntry(rank2)?.category} | By {getEntry(rank2)?.submitterUsername || 'Creator'}
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-light)', fontSize: '13px', fontStyle: 'italic', padding: '16px 0' }}>
                Select 2nd choice from proposals below (2 points)
              </div>
            )}
          </div>

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
            <span className="mono text-silver" style={{ fontSize: '12px', fontWeight: 800 }}>Weight: 2x</span>
            <span className="mono" style={{ fontSize: '11px', color: 'var(--text-light)' }}>Slot 02</span>
          </div>
        </div>

        {/* Rank 3 (1 Point) */}
        <div className={`ballot-pedestal rank-3-pedestal ${rank3 ? 'filled' : ''}`}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="slot-badge slot-rank-3">3RD CHOICE (1 PT)</span>
              {rank3 && (
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '2px 8px', fontSize: '11px' }}
                  onClick={() => handleClear(3)}
                  disabled={isBarred}
                >
                  Clear
                </button>
              )}
            </div>

            {rank3 ? (
              <div>
                <div style={{ fontWeight: 900, fontSize: '16px', color: 'var(--text-main)', marginBottom: 4 }}>
                  {getEntry(rank3)?.title || rank3}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {getEntry(rank3)?.category} | By {getEntry(rank3)?.submitterUsername || 'Creator'}
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-light)', fontSize: '13px', fontStyle: 'italic', padding: '16px 0' }}>
                Select 3rd choice from proposals below (1 point)
              </div>
            )}
          </div>

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
            <span className="mono text-bronze" style={{ fontSize: '12px', fontWeight: 800 }}>Weight: 1x</span>
            <span className="mono" style={{ fontSize: '11px', color: 'var(--text-light)' }}>Slot 03</span>
          </div>
        </div>
      </div>

      {isComplete && !validation.isValid && (
        <div className="callout callout-danger" style={{ marginBottom: 18 }}>
          {validation.errors.join(', ')}
        </div>
      )}

      {/* Invariant Footer & Cast Button */}
      <div
        className="white-card"
        style={{
          background: 'var(--bg-card-muted)',
          border: '1px solid var(--border-subtle)',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 700 }}>Security Invariant</div>
            <div className="mono" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-green)' }}>
              1 Vote Per Discord ID
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 700 }}>Anti-Raid Entropy</div>
            <div className="mono" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-blue)' }}>
              Verified (H &gt; 0.85)
            </div>
          </div>
        </div>

        <button
          className="btn btn-primary"
          disabled={!validation.isValid || isSubmitting || isBarred}
          onClick={handleSubmit}
          style={{ padding: '12px 32px', fontSize: '14px' }}
        >
          {isBarred ? 'Restricted' : isSubmitting ? 'Recording...' : myBallot ? 'Update Ballot' : 'Cast Ballot'}
        </button>
      </div>
    </div>
  );
};
