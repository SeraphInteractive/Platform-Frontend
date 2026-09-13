import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  aggregate_scores,
  analyze_raid_risk,
  type EntryId,
  type Ballot,
  type EntryScoreBreakdown,
} from '@platform/internal-logic';

export interface VotingRound {
  id: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'ACTIVE' | 'FINALIZED';
  startTime?: string;
  endTime?: string;
}

export interface VotingEntry {
  id: string;
  roundId: string;
  title: string;
  description: string;
  submitterId?: string;
  submitterUsername?: string;
}

export interface CastBallotDto {
  rank1: EntryId;
  rank2: EntryId;
  rank3: EntryId;
}

export interface StoredBallotRecord {
  id?: string;
  voterId: string;
  rank1: EntryId;
  rank2: EntryId;
  rank3: EntryId;
  timestamp?: number;
}

// Fallback seed data if the Adonis API server is not running yet
const SEED_ROUNDS: VotingRound[] = [
  {
    id: 'round-scene-pitch-42',
    title: 'Minecraft Movie: Act 1 Scene Pitches',
    description: 'Rank your top 3 favorite community script scenes (3pts for 1st, 2pts for 2nd, 1pt for 3rd).',
    status: 'ACTIVE',
  },
  {
    id: 'round-mob-redesign-12',
    title: 'Nether Mob Overhaul Submissions',
    description: 'Community ideas for Nether fortress boss mechanics.',
    status: 'FINALIZED',
  },
];

const SEED_ENTRIES: VotingEntry[] = [
  {
    id: 'pitch-nether-heist',
    roundId: 'round-scene-pitch-42',
    title: 'The Bastion Remnant Heist',
    description: 'Steve, Alex, and a rogue Piglin orchestrate an infiltration to recover a Netherite lodestone.',
  },
  {
    id: 'pitch-ender-dragon-origin',
    roundId: 'round-scene-pitch-42',
    title: 'The Dragon of the End: Prologue',
    description: 'A cinematic opening recounting the ancient builders sealing the End dimension and the dragon nest.',
  },
  {
    id: 'pitch-creeper-sanctuary',
    roundId: 'round-scene-pitch-42',
    title: 'The Creeper Sanctuary Encounter',
    description: 'A comedic travel montage where Alex befriends an anxious charged creeper using cat bells.',
  },
  {
    id: 'pitch-redstone-revolution',
    roundId: 'round-scene-pitch-42',
    title: 'The Redstone Automaton Uprising',
    description: 'A rogue villager weaponizes flying machines and piston contraptions against an invading raid.',
  },
  {
    id: 'pitch-villager-trading-post',
    roundId: 'round-scene-pitch-42',
    title: 'The Emerald Monopoly Negotiation',
    description: 'A tavern negotiation with an armorer villager over 64 mending books.',
  },
];

// Local ballot pool saved to localStorage so development testing works immediately
const LOCAL_BALLOTS_STORAGE_KEY = 'mcs_local_ballots_pool';

function getLocalStoredBallots(roundId: string): Ballot[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(`${LOCAL_BALLOTS_STORAGE_KEY}_${roundId}`);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // ignore parse errors and fallback to fresh generator
    }
  }

  // Pre-fill with a few ballots so graphs and calculations are not empty
  const initial: Ballot[] = [];
  const entries = SEED_ENTRIES.map((e) => e.id);
  for (let i = 0; i < 40; i++) {
    const shuffled = [...entries].sort(() => Math.random() - 0.5);
    initial.push({
      voterId: `discord-voter-${1000 + i}`,
      rank1: shuffled[0]!,
      rank2: shuffled[1]!,
      rank3: shuffled[2]!,
    });
  }
  localStorage.setItem(`${LOCAL_BALLOTS_STORAGE_KEY}_${roundId}`, JSON.stringify(initial));
  return initial;
}

function saveLocalBallot(roundId: string, ballot: Ballot): void {
  const current = getLocalStoredBallots(roundId);
  // Replace ballot if voter already submitted one
  const filtered = current.filter((b) => b.voterId !== ballot.voterId);
  filtered.push(ballot);
  localStorage.setItem(`${LOCAL_BALLOTS_STORAGE_KEY}_${roundId}`, JSON.stringify(filtered));
}

// Fetch available voting rounds
export function useRounds() {
  return useQuery({
    queryKey: ['rounds'],
    queryFn: async () => {
      try {
        return await apiRequest<VotingRound[]>('/rounds');
      } catch {
        // Fall back to seed rounds if backend is booting up
        return SEED_ROUNDS;
      }
    },
    staleTime: 1000 * 60 * 2,
  });
}

// Get the currently active round
export function useActiveRound() {
  const { data: rounds = [], isLoading } = useRounds();
  const activeRound = rounds.find((r) => r.status === 'ACTIVE') || rounds[0] || SEED_ROUNDS[0];
  return { activeRound, isLoading };
}

// Fetch all entry submissions for a round
export function useRoundEntries(roundId: string) {
  return useQuery({
    queryKey: ['rounds', roundId, 'entries'],
    queryFn: async () => {
      try {
        return await apiRequest<VotingEntry[]>(`/rounds/${roundId}/entries`);
      } catch {
        return SEED_ENTRIES.filter((e) => e.roundId === roundId || roundId.includes('scene-pitch'));
      }
    },
    enabled: !!roundId,
    staleTime: 1000 * 60 * 5,
  });
}

// Fetch the ballot cast by the currently logged-in user
export function useMyBallot(roundId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['rounds', roundId, 'ballots', 'mine', user?.id],
    queryFn: async () => {
      try {
        return await apiRequest<StoredBallotRecord>(`/rounds/${roundId}/ballots/mine`);
      } catch {
        if (!user) return null;
        const localBallots = getLocalStoredBallots(roundId);
        return localBallots.find((b) => b.voterId === user.id || b.voterId === user.discordId) || null;
      }
    },
    enabled: !!roundId && !!user,
  });
}

// Poll live leaderboard calculations
export function useLiveLeaderboard(roundId: string, entries: VotingEntry[]) {
  return useQuery({
    queryKey: ['rounds', roundId, 'leaderboard'],
    queryFn: async () => {
      try {
        return await apiRequest<{
          leaderboard: EntryScoreBreakdown[];
          totalBallots: number;
          totalPointsAwarded: number;
          expectedPoints: number;
          isConserved: boolean;
        }>(`/rounds/${roundId}/leaderboard`);
      } catch {
        // Run internal logic calculation engine directly on local state
        const localBallots = getLocalStoredBallots(roundId);
        const entryIds = entries.map((e) => e.id);
        const agg = aggregate_scores(entryIds, localBallots);
        return {
          leaderboard: agg.leaderboard as EntryScoreBreakdown[],
          totalBallots: agg.totalBallots,
          totalPointsAwarded: agg.totalPointsAwarded,
          expectedPoints: agg.expectedPoints,
          isConserved: agg.isConserved,
          rawBallots: localBallots,
        };
      }
    },
    enabled: !!roundId && entries.length > 0,
    refetchInterval: 3000,
  });
}

// Poll live Batman raid telemetry
export function useLiveTelemetry(roundId: string, leaderboard: EntryScoreBreakdown[]) {
  return useQuery({
    queryKey: ['rounds', roundId, 'telemetry', leaderboard],
    queryFn: async () => {
      try {
        return await apiRequest<any>(`/rounds/${roundId}/telemetry`);
      } catch {
        return leaderboard.map((item) => analyze_raid_risk(item, 0.1));
      }
    },
    enabled: !!roundId && leaderboard.length > 0,
    refetchInterval: 5000,
  });
}

// Mutation to cast a ballot and invalidate stale queries
export function useCastBallot(roundId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (ballotDto: CastBallotDto) => {
      try {
        return await apiRequest<{ success: boolean }>(`/rounds/${roundId}/ballots`, {
          method: 'POST',
          body: JSON.stringify(ballotDto),
        });
      } catch (err) {
        // Fallback save to local storage pool for testing
        if (user) {
          saveLocalBallot(roundId, {
            voterId: user.id || user.discordId,
            rank1: ballotDto.rank1,
            rank2: ballotDto.rank2,
            rank3: ballotDto.rank3,
            timestamp: Date.now(),
          });
        }
        return { success: true };
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries so everything refreshes immediately
      queryClient.invalidateQueries({ queryKey: ['rounds', roundId, 'leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['rounds', roundId, 'ballots', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['rounds', roundId, 'telemetry'] });
    },
  });
}

// Mutation to submit a new pitch
export function useSubmitEntry(roundId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { title: string; description: string }) => {
      return await apiRequest<VotingEntry>(`/rounds/${roundId}/entries`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rounds', roundId, 'entries'] });
      queryClient.invalidateQueries({ queryKey: ['rounds', roundId, 'leaderboard'] });
    },
  });
}
