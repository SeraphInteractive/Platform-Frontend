import React, { useState, useEffect } from 'react';
import {
  useActiveRound,
  useRoundEntries,
  useMyBallot,
  useLiveLeaderboard,
  useCastBallot,
} from '../../hooks/useVotingApi.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { PitchCatalog } from './PitchCatalog.tsx';
import { BallotBox } from './BallotBox.tsx';
import { PublicLeaderboard } from './PublicLeaderboard.tsx';

export const VoterPortal: React.FC = () => {
  const { user } = useAuth();
  const { activeRound, isLoading: isRoundLoading } = useActiveRound();
  const roundId = activeRound?.id || '';

  const { data: entries = [], isLoading: isEntriesLoading } = useRoundEntries(roundId);
  const { data: myBallot } = useMyBallot(roundId);
  const { data: leaderboardData } = useLiveLeaderboard(roundId, entries);

  const [rank1, setRank1] = useState<string>('');
  const [rank2, setRank2] = useState<string>('');
  const [rank3, setRank3] = useState<string>('');
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  // Auto-populate ballot if user already voted in this round
  useEffect(() => {
    if (myBallot) {
      setRank1(myBallot.rank1);
      setRank2(myBallot.rank2);
      setRank3(myBallot.rank3);
    }
  }, [myBallot]);

  const castBallotMutation = useCastBallot(roundId);

  const handleSelectRank = (rank: 1 | 2 | 3, entryId: string) => {
    // If user picks an entry that is already in another slot, swap it
    if (rank === 1) {
      if (rank2 === entryId) setRank2('');
      if (rank3 === entryId) setRank3('');
      setRank1(entryId);
    } else if (rank === 2) {
      if (rank1 === entryId) setRank1('');
      if (rank3 === entryId) setRank3('');
      setRank2(entryId);
    } else if (rank === 3) {
      if (rank1 === entryId) setRank1('');
      if (rank2 === entryId) setRank2('');
      setRank3(entryId);
    }
  };

  const handleClearSlot = (rank: 1 | 2 | 3) => {
    if (rank === 1) setRank1('');
    if (rank === 2) setRank2('');
    if (rank === 3) setRank3('');
  };

  const handleSubmitBallot = async () => {
    if (!rank1 || !rank2 || !rank3) return;

    try {
      await castBallotMutation.mutateAsync({
        rank1,
        rank2,
        rank3,
      });
      setSubmitMessage('Your 3-2-1 ballot was successfully recorded in the live pool.');
      setTimeout(() => setSubmitMessage(null), 5000);
    } catch (err: unknown) {
      alert(`Failed to cast ballot: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  if (isRoundLoading || isEntriesLoading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: 80 }}>
        <div className="mono" style={{ fontSize: '16px', color: 'var(--accent-blue)' }}>
          Loading live voting session...
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Active round details */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {activeRound?.title}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
              {activeRound?.description}
            </p>
          </div>
          <span className="badge badge-success">
            Active Voting Round
          </span>
        </div>
      </div>

      {submitMessage && (
        <div className="callout callout-success" style={{ marginBottom: 20 }}>
          {submitMessage}
        </div>
      )}

      {/* 3-2-1 Ballot builder */}
      <BallotBox
        entries={entries}
        rank1={rank1}
        rank2={rank2}
        rank3={rank3}
        myBallot={myBallot}
        isSubmitting={castBallotMutation.isPending}
        onClearSlot={handleClearSlot}
        onSubmitBallot={handleSubmitBallot}
        voterId={user?.id || user?.discordId || 'dev_voter'}
      />

      {/* Catalog of pitches */}
      <PitchCatalog
        entries={entries}
        selectedRank1={rank1}
        selectedRank2={rank2}
        selectedRank3={rank3}
        onSelectRank={handleSelectRank}
      />

      {/* Public leaderboard */}
      <PublicLeaderboard
        entries={entries}
        leaderboard={leaderboardData?.leaderboard}
        totalBallots={leaderboardData?.totalBallots}
        expectedPoints={leaderboardData?.expectedPoints}
      />
    </div>
  );
};
