import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  aggregate_scores,
  analyze_raid_risk,
  type EntryId,
  type Ballot,
  type EntryScoreBreakdown,
  type RaidTelemetry,
} from '@platform/internal-logic';

export interface VotingRound {
  id: string;
  title: string;
  category: string;
  description: string;
  status: 'ACTIVE' | 'DRAFT' | 'FINALIZED';
  createdBy?: string;
  createdAt?: string;
}

export interface VotingEntry {
  id: string;
  roundId: string;
  title: string;
  description: string;
  category?: string;
  submitterId?: string;
  submitterUsername?: string;
  submitterAvatar?: string;
  createdAt?: string;
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

// Initial seed rounds managed by admins
const SEED_ROUNDS: VotingRound[] = [
  {
    id: 'round-01',
    title: 'Round 1: Narrative & Scene Concepts',
    category: 'Narrative',
    description: 'Active community voting round for scene proposals and concept narratives.',
    status: 'ACTIVE',
    createdBy: 'SystemAdmin',
    createdAt: '2026-09-13',
  },
  {
    id: 'round-02',
    title: 'Round 2: Character Dynamics',
    category: 'Characters',
    description: 'Community voting round for character interactions and dialogue arcs.',
    status: 'DRAFT',
    createdBy: 'SystemAdmin',
    createdAt: '2026-09-13',
  },
];

// Exactly 1 initial test entry throughout the system
const SEED_ENTRIES: VotingEntry[] = [
  {
    id: 'entry-001',
    roundId: 'round-01',
    title: 'Initial Concept Proposal',
    description: 'Reference proposal entry for the active community voting round.',
    submitterUsername: 'SystemAdmin',
    submitterId: 'admin-001',
    createdAt: '2026-09-13',
  },
];

const LOCAL_ROUNDS_STORAGE_KEY = 'mcs_local_rounds_v2';
const LOCAL_BALLOTS_STORAGE_KEY = 'mcs_local_ballots_v2';
const LOCAL_ENTRIES_STORAGE_KEY = 'mcs_local_entries_v2';

function getLocalStoredRounds(): VotingRound[] {
  if (typeof window === 'undefined') return SEED_ROUNDS;
  const raw = localStorage.getItem(LOCAL_ROUNDS_STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // fallback
    }
  }
  localStorage.setItem(LOCAL_ROUNDS_STORAGE_KEY, JSON.stringify(SEED_ROUNDS));
  return SEED_ROUNDS;
}

function saveLocalRound(round: VotingRound): void {
  const current = getLocalStoredRounds();
  const filtered = current.filter((r) => r.id !== round.id);
  filtered.push(round);
  localStorage.setItem(LOCAL_ROUNDS_STORAGE_KEY, JSON.stringify(filtered));
}

function getLocalStoredEntries(roundId: string): VotingEntry[] {
  if (typeof window === 'undefined') return SEED_ENTRIES.filter((e) => e.roundId === roundId);
  const raw = localStorage.getItem(`${LOCAL_ENTRIES_STORAGE_KEY}_${roundId}`);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fallback
    }
  }
  const initial = SEED_ENTRIES.filter((e) => e.roundId === roundId);
  localStorage.setItem(`${LOCAL_ENTRIES_STORAGE_KEY}_${roundId}`, JSON.stringify(initial));
  return initial;
}

function saveLocalEntry(roundId: string, entry: VotingEntry): void {
  const current = getLocalStoredEntries(roundId);
  current.push(entry);
  localStorage.setItem(`${LOCAL_ENTRIES_STORAGE_KEY}_${roundId}`, JSON.stringify(current));
}

function deleteLocalEntry(roundId: string, entryId: string): void {
  const current = getLocalStoredEntries(roundId);
  const filtered = current.filter((e) => e.id !== entryId);
  localStorage.setItem(`${LOCAL_ENTRIES_STORAGE_KEY}_${roundId}`, JSON.stringify(filtered));
}

function getLocalStoredBallots(roundId: string): Ballot[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(`${LOCAL_BALLOTS_STORAGE_KEY}_${roundId}`);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return [];
}

function saveLocalBallot(roundId: string, ballot: Ballot): void {
  const current = getLocalStoredBallots(roundId);
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
        return getLocalStoredRounds();
      }
    },
    staleTime: 1000 * 60 * 2,
  });
}

export { useRounds as useVotingRounds };

// Get active round
export function useActiveRound(selectedRoundId?: string) {
  const { data: rounds = [], isLoading } = useRounds();
  const activeRound = selectedRoundId
    ? rounds.find((r) => r.id === selectedRoundId) || rounds.find((r) => r.status === 'ACTIVE') || rounds[0]
    : rounds.find((r) => r.status === 'ACTIVE') || rounds[0] || SEED_ROUNDS[0];
  return { activeRound, rounds, isLoading };
}

// Fetch all entry submissions for a round
export function useRoundEntries(roundId: string) {
  return useQuery({
    queryKey: ['rounds', roundId, 'entries'],
    queryFn: async () => {
      try {
        return await apiRequest<VotingEntry[]>(`/rounds/${roundId}/entries`);
      } catch {
        return getLocalStoredEntries(roundId);
      }
    },
    enabled: !!roundId,
    staleTime: 1000 * 60 * 5,
  });
}

// Fetch the ballot cast by currently logged-in user
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

// Poll live telemetry
export function useLiveTelemetry(roundId: string, leaderboard: EntryScoreBreakdown[]) {
  return useQuery<RaidTelemetry[]>({
    queryKey: ['rounds', roundId, 'telemetry', leaderboard],
    queryFn: async () => {
      try {
        return await apiRequest<RaidTelemetry[]>(`/rounds/${roundId}/telemetry`);
      } catch {
        return leaderboard.map((item) => analyze_raid_risk(item, 0.1));
      }
    },
    enabled: !!roundId && leaderboard.length > 0,
    refetchInterval: 5000,
  });
}

// Mutation to cast a ballot
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
      } catch {
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
      queryClient.invalidateQueries({ queryKey: ['rounds', roundId, 'leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['rounds', roundId, 'ballots', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['rounds', roundId, 'telemetry'] });
    },
  });
}

// Mutation to submit a proposal
export function useSubmitEntry(roundId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: { title: string; description: string }) => {
      try {
        return await apiRequest<VotingEntry>(`/rounds/${roundId}/entries`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } catch {
        const cleanSlug = payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24);
        const newEntry: VotingEntry = {
          id: `pitch-${cleanSlug}-${Date.now().toString().slice(-4)}`,
          roundId,
          title: payload.title,
          description: payload.description,
          submitterId: user?.id || 'community_creator',
          submitterUsername: user?.discordUsername || 'Community Creator',
          createdAt: new Date().toISOString().split('T')[0],
        };
        saveLocalEntry(roundId, newEntry);
        return newEntry;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rounds', roundId, 'entries'] });
      queryClient.invalidateQueries({ queryKey: ['rounds', roundId, 'leaderboard'] });
    },
  });
}

// Admin Mutation: Create a new categorized round
export function useCreateRound() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: { title: string; category: string; description: string; status: 'ACTIVE' | 'DRAFT' | 'FINALIZED' }) => {
      try {
        return await apiRequest<VotingRound>('/rounds', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } catch {
        const cleanId = `round-${payload.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;
        const newRound: VotingRound = {
          id: cleanId,
          title: payload.title,
          category: payload.category,
          description: payload.description,
          status: payload.status,
          createdBy: user?.discordUsername || 'Administrator',
          createdAt: new Date().toISOString().split('T')[0],
        };
        saveLocalRound(newRound);
        return newRound;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rounds'] });
    },
  });
}

// Admin Mutation: Moderate / Delete an entry from a round
export function useDeleteEntry(roundId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      try {
        return await apiRequest(`/rounds/${roundId}/entries/${entryId}`, {
          method: 'DELETE',
        });
      } catch {
        deleteLocalEntry(roundId, entryId);
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rounds', roundId, 'entries'] });
      queryClient.invalidateQueries({ queryKey: ['rounds', roundId, 'leaderboard'] });
    },
  });
}

// Admin Mutation: Update round status
export function useUpdateRoundStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roundId, status }: { roundId: string; status: 'ACTIVE' | 'DRAFT' | 'FINALIZED' }) => {
      try {
        return await apiRequest(`/rounds/${roundId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        });
      } catch {
        const rounds = getLocalStoredRounds();
        const found = rounds.find((r) => r.id === roundId);
        if (found) {
          found.status = status;
          localStorage.setItem(LOCAL_ROUNDS_STORAGE_KEY, JSON.stringify(rounds));
        }
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rounds'] });
    },
  });
}
