import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  type EntryId,
  type Ballot,
  type EntryScoreBreakdown,
  type RaidTelemetry,
} from '@platform/internal-logic';

// Purge any stale client mock storage from previous sessions
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('mcs_local_rounds_v3');
    localStorage.removeItem('mcs_local_ballots_v3');
    localStorage.removeItem('mcs_local_entries_v6');
    localStorage.removeItem('mcs_organic_progress_updates_v1');
    Object.keys(localStorage).forEach((key) => {
      if (
        key.startsWith('mcs_local_entries_') ||
        key.startsWith('mcs_local_ballots_') ||
        key.startsWith('mcs_local_rounds_') ||
        key.startsWith('mcs_organic_progress_updates_v1')
      ) {
        localStorage.removeItem(key);
      }
    });
  } catch {}
}

export interface VotingRound {
  id: string;
  title: string;
  category?: string;
  description?: string;
  status: 'open' | 'draft' | 'closed' | 'finalized' | 'ACTIVE' | 'DRAFT' | 'FINALIZED';
  opensAt?: string | null;
  closesAt?: string | null;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VotingEntry {
  id: string;
  roundId: string;
  title: string;
  description?: string | null;
  category?: string;
  mediaUrl?: string | null;
  status?: string;
  submittedBy?: string | null;
  submitterId?: string;
  submitterUsername?: string;
  submitterAvatar?: string;
  isQuarantined?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CastBallotDto {
  rank1: EntryId;
  rank2: EntryId;
  rank3: EntryId;
}

export interface StoredBallotRecord {
  id?: string;
  roundId?: string;
  voterId: string;
  rank1: EntryId;
  rank2: EntryId;
  rank3: EntryId;
  createdAt?: string;
  timestamp?: number;
}

export function getSubmitterAvatar(username?: string, avatarUrl?: string | null): string {
  if (avatarUrl && (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:'))) {
    return avatarUrl;
  }
  if (username) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = (hash + username.charCodeAt(i)) % 6;
    }
    return `https://cdn.discordapp.com/embed/avatars/${hash}.png`;
  }
  return 'https://cdn.discordapp.com/embed/avatars/0.png';
}

// Fetch available voting rounds directly from hosted database
export function useRounds() {
  return useQuery<VotingRound[]>({
    queryKey: ['rounds'],
    queryFn: async () => {
      const response = await apiRequest<VotingRound[] | { data: VotingRound[] }>('/rounds');
      if (Array.isArray(response)) return response;
      if (response && Array.isArray((response as any).data)) return (response as any).data;
      return [];
    },
    staleTime: 1000 * 10,
    retry: 1,
  });
}

export { useRounds as useVotingRounds };

// Get active round directly from real rounds data
export function useActiveRound(selectedRoundId?: string) {
  const { data: rounds = [], isLoading } = useRounds();
  const activeRound = selectedRoundId
    ? rounds.find((r) => r.id === selectedRoundId) || rounds.find((r) => r.status === 'open' || r.status === 'ACTIVE') || rounds[0] || null
    : rounds.find((r) => r.status === 'open' || r.status === 'ACTIVE') || rounds[0] || null;
  return { activeRound, rounds, isLoading };
}

// Fetch all entry submissions for a round directly from hosted database
export function useRoundEntries(roundId: string) {
  return useQuery<VotingEntry[]>({
    queryKey: ['rounds', roundId, 'entries'],
    queryFn: async () => {
      if (!roundId) return [];
      const response = await apiRequest<VotingEntry[] | { data: VotingEntry[] }>(`/rounds/${roundId}/entries`);
      if (Array.isArray(response)) return response;
      if (response && Array.isArray((response as any).data)) return (response as any).data;
      return [];
    },
    enabled: !!roundId,
    staleTime: 1000 * 10,
    retry: 1,
  });
}

// Fetch the ballot cast by currently logged-in user from hosted database
export function useMyBallot(roundId: string) {
  const { user } = useAuth();
  return useQuery<StoredBallotRecord | null>({
    queryKey: ['rounds', roundId, 'ballots', 'mine', user?.id],
    queryFn: async () => {
      if (!roundId || !user) return null;
      try {
        const response = await apiRequest<StoredBallotRecord | { data: StoredBallotRecord }>(`/rounds/${roundId}/ballots/mine`);
        if (response && (response as any).data) return (response as any).data;
        return (response as StoredBallotRecord) || null;
      } catch {
        return null;
      }
    },
    enabled: !!roundId && !!user,
    retry: false,
  });
}

// Poll live leaderboard calculations from hosted database
export function useLiveLeaderboard(roundId: string, _entries: VotingEntry[]) {
  return useQuery<{
    leaderboard: EntryScoreBreakdown[];
    totalBallots: number;
    totalPointsAwarded: number;
    expectedPoints: number;
    isConserved: boolean;
  }>({
    queryKey: ['rounds', roundId, 'leaderboard'],
    queryFn: async () => {
      if (!roundId) {
        return {
          leaderboard: [],
          totalBallots: 0,
          totalPointsAwarded: 0,
          expectedPoints: 0,
          isConserved: true,
        };
      }
      const response = await apiRequest<any>(`/rounds/${roundId}/leaderboard`);
      const data = response?.data || response;
      return {
        leaderboard: data?.leaderboard || [],
        totalBallots: data?.totalBallots || 0,
        totalPointsAwarded: data?.totalPointsAwarded || (data?.totalBallots ? data.totalBallots * 6 : 0),
        expectedPoints: data?.expectedPoints || (data?.totalBallots ? data.totalBallots * 6 : 0),
        isConserved: data?.isConserved ?? true,
      };
    },
    enabled: !!roundId,
    refetchInterval: 3000,
    retry: 1,
  });
}

// Poll live telemetry from hosted database
export function useLiveTelemetry(roundId: string, leaderboard: EntryScoreBreakdown[]) {
  return useQuery<RaidTelemetry[]>({
    queryKey: ['rounds', roundId, 'telemetry', leaderboard],
    queryFn: async () => {
      if (!roundId) return [];
      const response = await apiRequest<RaidTelemetry[] | { data: RaidTelemetry[] }>(`/rounds/${roundId}/telemetry`);
      if (Array.isArray(response)) return response;
      if (response && Array.isArray((response as any).data)) return (response as any).data;
      return [];
    },
    enabled: !!roundId && leaderboard.length > 0,
    refetchInterval: 5000,
    retry: 1,
  });
}

// Fetch all ballots from hosted database
export function useLiveBallots(roundId: string) {
  return useQuery<Ballot[]>({
    queryKey: ['rounds', roundId, 'ballots', 'all'],
    queryFn: async () => {
      if (!roundId) return [];
      const response = await apiRequest<Ballot[] | { data: Ballot[] }>(`/rounds/${roundId}/ballots`);
      if (Array.isArray(response)) return response;
      if (response && Array.isArray((response as any).data)) return (response as any).data;
      return [];
    },
    enabled: !!roundId,
    refetchInterval: 5000,
    retry: 1,
  });
}

// Mutation to cast a ballot to hosted database
export function useCastBallot(roundId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ballotDto: CastBallotDto) => {
      return await apiRequest<{ success: boolean; data?: any }>(`/rounds/${roundId}/ballots`, {
        method: 'POST',
        body: JSON.stringify({
          rank1_entry_id: ballotDto.rank1,
          rank2_entry_id: ballotDto.rank2,
          rank3_entry_id: ballotDto.rank3,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rounds', roundId, 'leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['rounds', roundId, 'ballots', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['rounds', roundId, 'telemetry'] });
    },
  });
}

// Mutation to submit a proposal to hosted database
export function useSubmitEntry(roundId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { title: string; description: string; mediaUrl?: string }) => {
      return await apiRequest<VotingEntry>(`/rounds/${roundId}/entries`, {
        method: 'POST',
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          media_url: payload.mediaUrl,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rounds', roundId, 'entries'] });
      queryClient.invalidateQueries({ queryKey: ['rounds', roundId, 'leaderboard'] });
    },
  });
}

// Admin Mutation: Create a new categorized round on hosted database
export function useCreateRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { title: string; category?: string; description?: string; status?: string }) => {
      return await apiRequest<VotingRound>('/rounds', {
        method: 'POST',
        body: JSON.stringify({
          title: payload.title,
          status: payload.status?.toLowerCase() || 'open',
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rounds'] });
    },
  });
}

// Supervisor / Admin Mutation: Update entry moderation status
export function useUpdateEntryStatus(roundId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entryId, status }: { entryId: string; status: string }) => {
      return await apiRequest(`/rounds/${roundId}/entries/${entryId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rounds', roundId, 'entries'] });
      queryClient.invalidateQueries({ queryKey: ['rounds', roundId, 'leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['rounds', roundId, 'telemetry'] });
    },
  });
}

// Admin Mutation: Delete an entry from a round on hosted database
export function useDeleteEntry(roundId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      return await apiRequest(`/rounds/${roundId}/entries/${entryId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rounds', roundId, 'entries'] });
      queryClient.invalidateQueries({ queryKey: ['rounds', roundId, 'leaderboard'] });
    },
  });
}

// Admin Mutation: Update round status on hosted database
export function useUpdateRoundStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roundId, status }: { roundId: string; status: string }) => {
      return await apiRequest(`/rounds/${roundId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: status.toLowerCase() }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rounds'] });
    },
  });
}

// Admin Mutation: Delete a round on hosted database
export function useDeleteRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roundId: string) => {
      return await apiRequest(`/rounds/${roundId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rounds'] });
    },
  });
}
