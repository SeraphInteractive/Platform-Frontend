import React from 'react';
import { VotingEntry, StoredBallotRecord } from '../../hooks/useVotingApi.ts';
import { validate_ballot, Ballot } from '@platform/internal-logic';

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
  const getEntryTitle = (id: string) => entries.find((e) => e.id === id)?.title || id;

  // Build ballot object to test validation rules in real time
  const currentBallot: Ballot = {
    voterId: voterId || 'anonymous_voter',
    rank1,
    rank2,
    rank3,
  };

  const activeEntrySet = new Set(entries.map((e) => e.id));
  const validation = validate_ballot(currentBallot, activeEntrySet);

  const isComplete = Boolean(rank1 && rank2 && rank3);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Your 3-2-1 Ballot Box</div>
          <div className="card-desc">
            Allocate your 6 credits: Rank 1 awards 3 points, Rank 2 awards 2 points, Rank 3 awards 1 point.
          </div>
        </div>
        {myBallot && (
          <span className="badge badge-success">
            Ballot Cast
          </span>
        )}
      </div>

      {/* 3 Ranked Slots */}
      <div className="ballot-slots">
        {/* Rank 1 */}
        <div className={`ballot-slot rank-1 ${rank1 ? 'filled' : ''}`}>
          <span className="slot-badge slot-rank-1">RANK 1 (3 POINTS)</span>
          {rank1 ? (
            <div style={{ width: '100%' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: 6 }}>
                {getEntryTitle(rank1)}
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onClearSlot(1)}
              >
                Remove
              </button>
            </div>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              Select your 1st place favorite (3 pts)
            </span>
          )}
        </div>

        {/* Rank 2 */}
        <div className={`ballot-slot rank-2 ${rank2 ? 'filled' : ''}`}>
          <span className="slot-badge slot-rank-2">RANK 2 (2 POINTS)</span>
          {rank2 ? (
            <div style={{ width: '100%' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: 6 }}>
                {getEntryTitle(rank2)}
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onClearSlot(2)}
              >
                Remove
              </button>
            </div>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              Select your 2nd pick (2 pts)
            </span>
          )}
        </div>

        {/* Rank 3 */}
        <div className={`ballot-slot rank-3 ${rank3 ? 'filled' : ''}`}>
          <span className="slot-badge slot-rank-3">RANK 3 (1 POINT)</span>
          {rank3 ? (
            <div style={{ width: '100%' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: 6 }}>
                {getEntryTitle(rank3)}
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onClearSlot(3)}
              >
                Remove
              </button>
            </div>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              Select your 3rd pick (1 pt)
            </span>
          )}
        </div>
      </div>

      {/* Anti-stacking error alert */}
      {isComplete && !validation.isValid && (
        <div className="callout callout-danger" style={{ marginBottom: 14 }}>
          <strong>Anti-Stacking Violation:</strong>
          {validation.errors.map((err, i) => (
            <div key={i}>* {err}</div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {isComplete && validation.isValid ? (
            <span className="text-success font-bold">All 6 credits allocated (Anti-stacking verified)</span>
          ) : (
            <span>Must select 3 unique pitches to cast your ballot.</span>
          )}
        </div>

        <button
          className="btn btn-primary"
          disabled={!validation.isValid || isSubmitting}
          onClick={onSubmitBallot}
          style={{ padding: '10px 24px', fontSize: '14px' }}
        >
          {isSubmitting ? 'Casting Ballot...' : myBallot ? 'Update My Ballot' : 'Cast 3-2-1 Ballot'}
        </button>
      </div>
    </div>
  );
};
