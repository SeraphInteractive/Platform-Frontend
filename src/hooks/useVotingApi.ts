import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../api/client.ts';
import { useAuth, getDiscordAvatar } from '../context/AuthContext.tsx';
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
  mediaUrl?: string | null;
  status?: string;
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
    title: 'Round 1: Art Direction & Style',
    category: 'Art Style',
    description: 'Vote on the visual look and aesthetic for the movie. Pick your 3 favorite art style proposals.',
    status: 'ACTIVE',
    createdBy: 'SystemAdmin',
    createdAt: '2026-09-14',
  },
  {
    id: 'round-02',
    title: 'Round 2: Story Arcs',
    category: 'Story',
    description: 'Community voting round for character interactions and dialogue arcs.',
    status: 'DRAFT',
    createdBy: 'SystemAdmin',
    createdAt: '2026-09-14',
  },
];

// Exactly 6 test entries for the Art Style round
const SEED_ENTRIES: VotingEntry[] = [
  {
    id: 'entry-001',
    roundId: 'round-01',
    title: 'Test Entry 1: Cel Shaded Anime',
    category: 'Art Style',
    description: 'Clean bold ink outlines with vibrant flat cell shading inspired by classic anime aesthetic.',
    mediaUrl: '/images/stock_01.jpg',
    status: 'approved',
    submitterUsername: 'AlexCraft',
    submitterAvatar: 'https://cdn.discordapp.com/embed/avatars/1.png',
    submitterId: 'creator-001',
    createdAt: '2026-09-14',
  },
  {
    id: 'entry-002',
    roundId: 'round-01',
    title: 'Test Entry 2: Hyper-Realistic Raytraced',
    category: 'Art Style',
    description: 'Full path-traced lighting with soft ambient occlusion and volumetric atmospheric fog in Blender Cycles.',
    mediaUrl: '/images/stock_02.jpg',
    status: 'approved',
    submitterUsername: 'SteveBuilder',
    submitterAvatar: 'https://cdn.discordapp.com/embed/avatars/2.png',
    submitterId: 'creator-002',
    createdAt: '2026-09-14',
  },
  {
    id: 'entry-003',
    roundId: 'round-01',
    title: 'Test Entry 3: Stylized Painterly Clay',
    category: 'Art Style',
    description: 'Hand-painted clay textures with subtle stop-motion jitter and warm storybook lighting.',
    mediaUrl: '/images/stock_03.jpg',
    status: 'approved',
    submitterUsername: 'ClaySculptor',
    submitterAvatar: 'https://cdn.discordapp.com/embed/avatars/3.png',
    submitterId: 'creator-003',
    createdAt: '2026-09-14',
  },
  {
    id: 'entry-004',
    roundId: 'round-01',
    title: 'Test Entry 4: Classic Vanilla Pixel-Art',
    category: 'Art Style',
    description: 'Strict 16x16 pixel textures preserved on 3D geometry with enhanced depth and subtle bloom shaders.',
    mediaUrl: '/textures/crying_obsidian.png',
    status: 'approved',
    submitterUsername: 'RetroGamer',
    submitterAvatar: 'https://cdn.discordapp.com/embed/avatars/4.png',
    submitterId: 'creator-004',
    createdAt: '2026-09-14',
  },
  {
    id: 'entry-005',
    roundId: 'round-01',
    title: 'Test Entry 5: Dark Moody Cinematic PBR',
    category: 'Art Style',
    description: 'Physically based rough stone, wet obsidian reflections, and high-contrast cinematic rim lighting.',
    mediaUrl: '/images/stock_02.jpg',
    status: 'approved',
    submitterUsername: 'ShadowArtist',
    submitterAvatar: 'https://cdn.discordapp.com/embed/avatars/5.png',
    submitterId: 'creator-005',
    createdAt: '2026-09-14',
  },
  {
    id: 'entry-006',
    roundId: 'round-01',
    title: 'Test Entry 6: Vibrant Low-Poly Pastel',
    category: 'Art Style',
    description: 'Soft pastel color palettes with low-poly block bevels and warm golden-hour glowstone illumination.',
    mediaUrl: '/images/stock_01.jpg',
    status: 'approved',
    submitterUsername: 'PastelDreamer',
    submitterAvatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
    submitterId: 'creator-006',
    createdAt: '2026-09-14',
  },
];

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

const LOCAL_ROUNDS_STORAGE_KEY = 'mcs_local_rounds_v3';
const LOCAL_BALLOTS_STORAGE_KEY = 'mcs_local_ballots_v3';
const LOCAL_ENTRIES_STORAGE_KEY = 'mcs_local_entries_v6';

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

function updateLocalEntryStatus(roundId: string, entryId: string, status: string): void {
  const current = getLocalStoredEntries(roundId);
  const found = current.find((e) => e.id === entryId);
  if (found) {
    found.status = status;
    localStorage.setItem(`${LOCAL_ENTRIES_STORAGE_KEY}_${roundId}`, JSON.stringify(current));
  }
}

const SEED_BALLOTS_ROUND_01: Ballot[] = [
  // 18 ballots ranking entry-001 as 1st
  ...Array.from({ length: 10 }, (_, i) => ({ voterId: `voter-seed-1-${i}`, rank1: 'entry-001', rank2: 'entry-002', rank3: 'entry-003', timestamp: 1726300000000 + i * 1000 })),
  ...Array.from({ length: 5 }, (_, i) => ({ voterId: `voter-seed-2-${i}`, rank1: 'entry-001', rank2: 'entry-005', rank3: 'entry-002', timestamp: 1726305000000 + i * 1000 })),
  ...Array.from({ length: 3 }, (_, i) => ({ voterId: `voter-seed-3-${i}`, rank1: 'entry-001', rank2: 'entry-003', rank3: 'entry-004', timestamp: 1726310000000 + i * 1000 })),
  // 10 ballots ranking entry-002 as 1st
  ...Array.from({ length: 6 }, (_, i) => ({ voterId: `voter-seed-4-${i}`, rank1: 'entry-002', rank2: 'entry-001', rank3: 'entry-005', timestamp: 1726315000000 + i * 1000 })),
  ...Array.from({ length: 4 }, (_, i) => ({ voterId: `voter-seed-5-${i}`, rank1: 'entry-002', rank2: 'entry-003', rank3: 'entry-001', timestamp: 1726320000000 + i * 1000 })),
  // 6 ballots ranking entry-003 as 1st
  ...Array.from({ length: 4 }, (_, i) => ({ voterId: `voter-seed-6-${i}`, rank1: 'entry-003', rank2: 'entry-002', rank3: 'entry-004', timestamp: 1726325000000 + i * 1000 })),
  ...Array.from({ length: 2 }, (_, i) => ({ voterId: `voter-seed-7-${i}`, rank1: 'entry-003', rank2: 'entry-005', rank3: 'entry-006', timestamp: 1726330000000 + i * 1000 })),
  // 5 ballots ranking entry-005 as 1st
  ...Array.from({ length: 3 }, (_, i) => ({ voterId: `voter-seed-8-${i}`, rank1: 'entry-005', rank2: 'entry-001', rank3: 'entry-002', timestamp: 1726335000000 + i * 1000 })),
  ...Array.from({ length: 2 }, (_, i) => ({ voterId: `voter-seed-9-${i}`, rank1: 'entry-005', rank2: 'entry-002', rank3: 'entry-003', timestamp: 1726340000000 + i * 1000 })),
  // 2 ballots ranking entry-004 as 1st
  ...Array.from({ length: 2 }, (_, i) => ({ voterId: `voter-seed-10-${i}`, rank1: 'entry-004', rank2: 'entry-003', rank3: 'entry-006', timestamp: 1726345000000 + i * 1000 })),
  // 1 ballot ranking entry-006 as 1st
  { voterId: 'voter-seed-11-0', rank1: 'entry-006', rank2: 'entry-004', rank3: 'entry-003', timestamp: 1726350000000 },
];

function getLocalStoredBallots(roundId: string): Ballot[] {
  if (typeof window === 'undefined') return roundId === 'round-01' ? SEED_BALLOTS_ROUND_01 : [];
  const raw = localStorage.getItem(`${LOCAL_BALLOTS_STORAGE_KEY}_${roundId}`);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // fallback
    }
  }
  const initial = roundId === 'round-01' ? SEED_BALLOTS_ROUND_01 : [];
  if (initial.length > 0) {
    localStorage.setItem(`${LOCAL_BALLOTS_STORAGE_KEY}_${roundId}`, JSON.stringify(initial));
  }
  return initial;
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

// Fetch all ballots for live trajectory rendering
export function useLiveBallots(roundId: string) {
  return useQuery<Ballot[]>({
    queryKey: ['rounds', roundId, 'ballots', 'all'],
    queryFn: async () => {
      try {
        return await apiRequest<Ballot[]>(`/rounds/${roundId}/ballots`);
      } catch {
        return getLocalStoredBallots(roundId);
      }
    },
    enabled: !!roundId,
    refetchInterval: 3000,
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
    mutationFn: async (payload: { title: string; description: string; mediaUrl?: string }) => {
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
          mediaUrl: payload.mediaUrl,
          status: 'pending_review',
          submitterId: user?.id || 'community_creator',
          submitterUsername: user?.discordUsername || 'Community Creator',
          submitterAvatar: getDiscordAvatar(user),
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

// Supervisor / Admin Mutation: Update pitch / entry moderation status
export function useUpdateEntryStatus(roundId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entryId, status }: { entryId: string; status: 'approved' | 'rejected' | 'flagged' | 'pending_review' }) => {
      try {
        return await apiRequest(`/rounds/${roundId}/entries/${entryId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        });
      } catch {
        updateLocalEntryStatus(roundId, entryId, status);
        return { success: true, status };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rounds', roundId, 'entries'] });
      queryClient.invalidateQueries({ queryKey: ['rounds', roundId, 'leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['rounds', roundId, 'telemetry'] });
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
