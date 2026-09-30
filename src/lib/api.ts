// lightweight api client for platform backend

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface Round {
  id: string;
  title: string;
  description?: string | null;
  scheme?: "ranked" | "binary" | string;
  pollType?: "ranked_choice" | "binary" | string;
  status: "draft" | "open" | "voting" | "finalized" | string;
  opensAt?: string | null;
  closesAt?: string | null;
  windowOpenAt?: string | null;
  windowCloseAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Entry {
  id: string;
  roundId: string;
  title: string;
  description?: string | null;
  authorId?: string;
  authorName?: string;
  submittedBy?: string | null;
  mediaUrl?: string | null;
  aiFlags?: string[];
  status: string;
  isQuarantined?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Shot {
  id: string;
  roundId?: string | null;
  sceneNumber?: number;
  shotCode?: string;
  title: string;
  description?: string | null;
  difficultyTier?: "tier_1" | "tier_2" | "tier_3" | "tier_4" | string;
  tierDays?: number;
  status: "available" | "claimed" | "submitted" | "approved" | string;
  claimedAt?: string | null;
  deadlineAt?: string | null;
  seniorPriorityUntil?: string | null;
  claimer?: {
    id: string;
    username: string;
    avatarUrl?: string | null;
  } | null;
  createdAt: string;
  updatedAt?: string;
}

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    // browser requests proxy through next.js rewrites to avoid cors mismatches
    return "";
  }
  return process.env.NEXT_PUBLIC_API_URL || "https://dev-api.seraphinteractive.com";
};

const getHeaders = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("stairway_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
};

export async function fetchRounds(): Promise<PaginatedResponse<Round>> {
  const res = await fetch(`${getBaseUrl()}/api/v1/rounds`, {
    headers: getHeaders(),
    cache: "no-store"
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch rounds: ${res.status}`);
  }
  return res.json();
}

export async function fetchRound(id: string): Promise<Round> {
  const res = await fetch(`${getBaseUrl()}/api/v1/rounds/${id}`, {
    headers: getHeaders(),
    cache: "no-store"
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch round ${id}: ${res.status}`);
  }
  return res.json();
}

export async function createRound(data: {
  title: string;
  pollType?: "ranked_choice" | "binary" | string;
  opensAt?: string | null;
  closesAt?: string | null;
}): Promise<Round> {
  const res = await fetch(`${getBaseUrl()}/api/v1/rounds`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      title: data.title.trim(),
      pollType: data.pollType === "ranked" ? "ranked_choice" : (data.pollType || "ranked_choice"),
      opensAt: data.opensAt || null,
      closesAt: data.closesAt || null
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Failed to create round (${res.status})`);
  }
  const json = await res.json();
  return json.data;
}

export async function updateRound(
  roundId: string,
  data: {
    title?: string;
    pollType?: "ranked_choice" | "binary" | string;
    status?: "draft" | "open" | "voting" | string;
    opensAt?: string | null;
    closesAt?: string | null;
  }
): Promise<Round> {
  const payload: Record<string, unknown> = {};
  if (data.title !== undefined) payload.title = data.title.trim();
  if (data.pollType !== undefined) payload.pollType = data.pollType === "ranked" ? "ranked_choice" : data.pollType;
  if (data.status !== undefined) payload.status = data.status;
  if (data.opensAt !== undefined) payload.opensAt = data.opensAt;
  if (data.closesAt !== undefined) payload.closesAt = data.closesAt;

  const res = await fetch(`${getBaseUrl()}/api/v1/rounds/${roundId}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Failed to update round (${res.status})`);
  }
  const json = await res.json();
  return json.data;
}

export async function deleteRound(roundId: string): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/api/v1/rounds/${roundId}`, {
    method: "DELETE",
    headers: getHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Failed to delete round (${res.status})`);
  }
}

export async function finalizeRound(roundId: string): Promise<unknown> {
  const res = await fetch(`${getBaseUrl()}/api/v1/rounds/${roundId}/finalize`, {
    method: "POST",
    headers: getHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Failed to finalize round (${res.status})`);
  }
  const json = await res.json();
  return json.data;
}

export interface ReviewQueueItem {
  id: string;
  shotId: string;
  version: number;
  status: string;
  notes?: string | null;
  supervisorNotes?: string | null;
  contributor?: {
    id: string;
    discordUsername?: string;
    username?: string;
    avatarUrl?: string | null;
  } | null;
  videoUrl?: string | null;
  blendUrl?: string | null;
  aiFlags?: string[];
  createdAt: string;
  shot?: {
    id: string;
    shotCode?: string;
    title: string;
    sceneNumber?: number;
    difficultyTier?: string;
    status: string;
  };
}

export async function fetchRoundEntries(roundId: string, status?: string): Promise<PaginatedResponse<Entry>> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await fetch(`${getBaseUrl()}/api/v1/rounds/${roundId}/entries${query}`, {
    headers: getHeaders(),
    cache: "no-store"
  });
  if (!res.ok) {
    return { data: [], meta: { page: 1, perPage: 25, total: 0, totalPages: 1 } };
  }
  return res.json();
}

export async function createRoundEntry(
  roundId: string,
  data: { title: string; description?: string | null; mediaKey?: string | null }
): Promise<Entry> {
  const res = await fetch(`${getBaseUrl()}/api/v1/rounds/${roundId}/entries`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      title: data.title.trim(),
      description: data.description ? data.description.trim() : null,
      mediaKey: data.mediaKey || null
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Failed to submit entry (${res.status})`);
  }
  const json = await res.json();
  return json.data;
}

export async function updateEntryStatus(
  roundId: string,
  entryId: string,
  status: "approved" | "rejected" | "pending_review"
): Promise<Entry> {
  const res = await fetch(`${getBaseUrl()}/api/v1/rounds/${roundId}/entries/${entryId}/status`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ status })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Failed to update entry status (${res.status})`);
  }
  const json = await res.json();
  return json.data;
}

export async function uploadEntryMedia(file: File): Promise<string> {
  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error("File size exceeds 5MB maximum limit.");
  }
  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/quicktime"
  ];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Unsupported media format. Supported formats: PNG, JPG, GIF, WEBP, MP4, WEBM, MOV.");
  }

  const res = await fetch(`${getBaseUrl()}/api/v1/uploads/media`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      contentType: file.type,
      sizeBytes: file.size
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Failed to request upload signature (${res.status})`);
  }
  const json = await res.json();
  const upload = json.data;
  const putRes = await fetch(upload.url, {
    method: upload.method || "PUT",
    headers: upload.headers || { "Content-Type": file.type },
    body: file
  });
  if (!putRes.ok) {
    throw new Error(`Failed to upload media attachment (${putRes.status})`);
  }
  return upload.key;
}

export async function deleteEntry(roundId: string, entryId: string): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/api/v1/rounds/${roundId}/entries/${entryId}`, {
    method: "DELETE",
    headers: getHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Failed to delete entry (${res.status})`);
  }
}

export async function reinstateEntry(roundId: string, entryId: string): Promise<Entry> {
  const res = await fetch(`${getBaseUrl()}/api/v1/rounds/${roundId}/entries/${entryId}/reinstate`, {
    method: "POST",
    headers: getHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Failed to reinstate entry (${res.status})`);
  }
  const json = await res.json();
  return json.data;
}

export interface CreateShotPayload {
  roundId?: string | null;
  sceneNumber: number;
  shotCode: string;
  title: string;
  description?: string | null;
  difficultyTier: "tier_1" | "tier_2" | "tier_3" | "tier_4";
  seniorPriorityHours?: number;
}

export async function createShot(payload: CreateShotPayload): Promise<Shot> {
  const res = await fetch(`${getBaseUrl()}/api/v1/shots`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      roundId: payload.roundId || null,
      sceneNumber: payload.sceneNumber,
      shotCode: payload.shotCode.trim(),
      title: payload.title.trim(),
      description: payload.description ? payload.description.trim() : null,
      difficultyTier: payload.difficultyTier,
      seniorPriorityHours: payload.seniorPriorityHours ?? 0
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Failed to create task (${res.status})`);
  }
  const json = await res.json();
  return json.data;
}

export async function updateShot(
  shotId: string,
  payload: Partial<CreateShotPayload>
): Promise<Shot> {
  const res = await fetch(`${getBaseUrl()}/api/v1/shots/${shotId}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Failed to update task (${res.status})`);
  }
  const json = await res.json();
  return json.data;
}

export async function deleteShot(shotId: string): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/api/v1/shots/${shotId}`, {
    method: "DELETE",
    headers: getHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Failed to delete task (${res.status})`);
  }
}

export async function claimShot(shotId: string): Promise<Shot> {
  const res = await fetch(`${getBaseUrl()}/api/v1/shots/${shotId}/claim`, {
    method: "POST",
    headers: getHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Failed to claim shot (${res.status})`);
  }
  const json = await res.json();
  return json.data;
}

export async function releaseShot(shotId: string, reason?: string | null): Promise<Shot> {
  const res = await fetch(`${getBaseUrl()}/api/v1/shots/${shotId}/release`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ reason: reason || null })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Failed to release shot (${res.status})`);
  }
  const json = await res.json();
  return json.data;
}

export async function fetchReviewQueue(): Promise<PaginatedResponse<ReviewQueueItem>> {
  const res = await fetch(`${getBaseUrl()}/api/v1/reviews`, {
    headers: getHeaders(),
    cache: "no-store"
  });
  if (!res.ok) {
    return { data: [], meta: { page: 1, perPage: 25, total: 0, totalPages: 1 } };
  }
  return res.json();
}

export async function reviewSubmission(
  submissionId: string,
  decision: "approved" | "changes_requested" | "rejected",
  notes?: string | null
): Promise<unknown> {
  const res = await fetch(`${getBaseUrl()}/api/v1/submissions/${submissionId}/review`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ decision, notes: notes || null })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Failed to review submission (${res.status})`);
  }
  const json = await res.json();
  return json.data;
}

export interface LeaderboardItem {
  position: number;
  entryId: string;
  title: string;
  rankCounts: number[];
  appearanceCount: number;
  rawScore: number;
  voteSharePercentage: number;
  regularizedMeanScore?: number | null;
  regularizedTotalScore?: number | null;
}

export interface LeaderboardData {
  roundId: string;
  pollType: string;
  totalBallots: number;
  totalPoints: number;
  isConserved: boolean;
  items: LeaderboardItem[];
  computedAt?: string;
}

export interface CertifiedRoundResult {
  id: string;
  roundId: string;
  totalBallots: number;
  totalPoints: number;
  certifiedAt: string;
  entries: Array<{
    entryId: string;
    position: number;
    title: string;
    rawScore: number;
    voteSharePercentage: number;
  }>;
}

export async function fetchRoundLeaderboard(roundId: string): Promise<LeaderboardData | null> {
  const res = await fetch(`${getBaseUrl()}/api/v1/rounds/${roundId}/leaderboard`, {
    headers: getHeaders(),
    cache: "no-store"
  });
  if (!res.ok) {
    return null;
  }
  const result = await res.json();
  return result?.data ?? result;
}

export async function fetchRoundResults(roundId: string): Promise<CertifiedRoundResult | null> {
  const res = await fetch(`${getBaseUrl()}/api/v1/rounds/${roundId}/results`, {
    headers: getHeaders(),
    cache: "no-store"
  });
  if (!res.ok) {
    return null;
  }
  const result = await res.json();
  return result?.data ?? result;
}

export interface LedgerBallot {
  discordId: string;
  discordUsername: string;
  picks: string[];
  castAt: string;
  updatedAt: string;
}

export async function fetchRoundLedger(roundId: string, page = 1, perPage = 50): Promise<PaginatedResponse<LedgerBallot> | null> {
  const res = await fetch(`${getBaseUrl()}/api/v1/rounds/${roundId}/ballots?page=${page}&perPage=${perPage}`, {
    headers: getHeaders(),
    cache: "no-store"
  });
  if (!res.ok) {
    return null;
  }
  return res.json();
}

export async function castBallot(roundId: string, picks: string[]): Promise<unknown> {
  const res = await fetch(`${getBaseUrl()}/api/v1/rounds/${roundId}/ballots/me`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ picks })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Failed to cast ballot (${res.status})`);
  }
  const result = await res.json();
  return result?.data ?? result;
}

export async function fetchShots(): Promise<PaginatedResponse<Shot>> {
  const res = await fetch(`${getBaseUrl()}/api/v1/shots`, {
    headers: getHeaders(),
    cache: "no-store"
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch shots: ${res.status}`);
  }
  return res.json();
}

export async function fetchCurrentUser(): Promise<unknown> {
  const res = await fetch(`${getBaseUrl()}/api/v1/auth/me`, {
    headers: getHeaders(),
    cache: "no-store"
  });
  if (!res.ok) {
    return null;
  }
  const json = await res.json();
  return json?.data ?? json;
}

export interface ModeratedUser {
  id: string;
  discordId: string;
  username?: string;
  discordUsername?: string;
  avatarUrl?: string | null;
  discordAvatar?: string | null;
  role: string;
  specialties: string[];
  isBlacklisted: boolean;
  blacklistReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function getDiscordAvatarUrl(discordId?: string, avatarUrl?: string | null): string {
  if (avatarUrl) return avatarUrl;
  try {
    if (!discordId) return "https://cdn.discordapp.com/embed/avatars/0.png";
    const index = (BigInt(discordId) >> 22n) % 6n;
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
  } catch {
    return "https://cdn.discordapp.com/embed/avatars/0.png";
  }
}

export async function fetchUsers(role?: string, page = 1): Promise<PaginatedResponse<ModeratedUser>> {
  const params = new URLSearchParams({ page: String(page), perPage: "50" });
  if (role && role !== "all") {
    params.set("role", role);
  }
  const res = await fetch(`${getBaseUrl()}/api/v1/users?${params.toString()}`, {
    headers: getHeaders(),
    cache: "no-store"
  });
  if (!res.ok) {
    return { data: [], meta: { page: 1, perPage: 50, total: 0, totalPages: 1 } };
  }
  return res.json();
}

export async function changeUserRole(userId: string, role: string, specialties?: string[]): Promise<unknown> {
  const res = await fetch(`${getBaseUrl()}/api/v1/users/${userId}/role`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ role, specialties: specialties || [] })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Failed to change user role (${res.status})`);
  }
  return res.json();
}

export async function setUserRoleByDiscord(
  discordId: string,
  role: string,
  specialties?: string[],
  discordUsername?: string
): Promise<unknown> {
  const res = await fetch(`${getBaseUrl()}/api/v1/users/by-discord/${discordId}/role`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({
      role,
      specialties: specialties || [],
      ...(discordUsername ? { discordUsername } : {})
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Failed to assign Discord role (${res.status})`);
  }
  return res.json();
}

export async function blacklistUser(userId: string, reason?: string | null): Promise<unknown> {
  const res = await fetch(`${getBaseUrl()}/api/v1/users/${userId}/blacklist`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ reason: reason || null })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Failed to blacklist user (${res.status})`);
  }
  return res.json();
}

export async function reinstateUser(userId: string): Promise<unknown> {
  const res = await fetch(`${getBaseUrl()}/api/v1/users/${userId}/blacklist`, {
    method: "DELETE",
    headers: getHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Failed to reinstate user (${res.status})`);
  }
  return res.json();
}

export interface RaidTelemetry {
  id: string;
  entryId: string;
  roundId: string;
  compositeScore: number;
  severity: "normal" | "elevated" | "high" | "critical";
  skewRatio: number;
  rankEntropy: number;
  velocityZScore: number;
  flags: string[];
  breakdown: {
    entryId: string;
    rankCounts: number[];
    appearanceCount: number;
    rawScore: number;
    voteSharePercentage: number;
  };
  createdAt: string;
}

export async function fetchRoundTelemetry(roundId: string): Promise<RaidTelemetry[]> {
  const res = await fetch(`${getBaseUrl()}/api/v1/rounds/${roundId}/telemetry`, {
    headers: getHeaders(),
    cache: "no-store"
  });
  if (!res.ok) {
    return [];
  }
  const json = await res.json();
  return json?.data || [];
}

export interface ShotThreadMap {
  shotId: string;
  discordThreadId: string;
  updatedAt: string;
}

export async function fetchShotThreadMaps(): Promise<ShotThreadMap[]> {
  const res = await fetch(`${getBaseUrl()}/api/v1/shot-thread-maps`, {
    headers: getHeaders(),
    cache: "no-store"
  });
  if (!res.ok) {
    return [];
  }
  const json = await res.json();
  return json?.data || [];
}

export interface PipelineProgress {
  stepIndex: number;
  stepId: string;
  stepTitle: string;
  phaseNumber: number;
  phaseTitle: string;
  progressPercent: number;
  isPhaseTransition: boolean;
  updatedAt: string | null;
}

export async function fetchPipelineProgress(): Promise<PipelineProgress> {
  const res = await fetch(`${getBaseUrl()}/api/v1/pipeline`, {
    headers: getHeaders(),
    cache: "no-store"
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch pipeline progress: ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export async function updatePipelineProgress(data: {
  stepIndex: number;
  stepId: string;
  stepTitle: string;
  phaseNumber: number;
  phaseTitle: string;
  progressPercent: number;
  isPhaseTransition: boolean;
}): Promise<PipelineProgress> {
  const res = await fetch(`${getBaseUrl()}/api/v1/pipeline/progress`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Failed to update pipeline (${res.status})`);
  }
  const json = await res.json();
  return json.data;
}

export interface DocumentSection {
  id: string;
  title: string;
  html: string;
}

export interface DocumentData {
  slug: string;
  title: string;
  sections: DocumentSection[];
  revision: number;
  updatedAt: string;
  updatedBy: {
    id: string;
    username: string;
    avatarUrl: string | null;
  } | null;
}

export interface DocumentRevisionSummary {
  revision: number;
  title: string;
  note: string | null;
  requiresReacceptance: boolean;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  } | null;
  createdAt: string;
}

export interface DocumentUpdateInput {
  title: string;
  sections: DocumentSection[];
  requireReacceptance?: boolean;
  note?: string | null;
}

export async function fetchDocument(slug: string): Promise<DocumentData | null> {
  const res = await fetch(`${getBaseUrl()}/api/v1/documents/${slug}`, {
    headers: getHeaders(),
    cache: "no-store"
  });
  if (!res.ok) {
    return null;
  }
  const json = await res.json();
  return json?.data || null;
}

export async function publishDocument(slug: string, update: DocumentUpdateInput): Promise<DocumentData> {
  const res = await fetch(`${getBaseUrl()}/api/v1/documents/${slug}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(update)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Failed to publish document (${res.status})`);
  }
  const json = await res.json();
  return json.data;
}

export async function fetchDocumentRevisions(slug: string): Promise<DocumentRevisionSummary[]> {
  const res = await fetch(`${getBaseUrl()}/api/v1/documents/${slug}/revisions`, {
    headers: getHeaders(),
    cache: "no-store"
  });
  if (!res.ok) {
    return [];
  }
  const json = await res.json();
  return json?.data || [];
}
