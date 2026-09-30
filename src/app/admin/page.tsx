"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchRounds,
  createRound,
  updateRound,
  deleteRound,
  finalizeRound,
  fetchRoundEntries,
  updateEntryStatus,
  deleteEntry,
  fetchReviewQueue,
  reviewSubmission,
  fetchUsers,
  changeUserRole,
  setUserRoleByDiscord,
  blacklistUser,
  reinstateUser,
  fetchRoundTelemetry,
  fetchRoundLeaderboard,
  fetchRoundLedger,
  fetchShotThreadMaps,
  fetchShots,
  createShot,
  deleteShot,
  fetchPipelineProgress,
  updatePipelineProgress,
  getDiscordAvatarUrl,
  Round,
  Entry,
  ReviewQueueItem,
  ModeratedUser,
  RaidTelemetry,
  ShotThreadMap,
  LeaderboardData,
  Shot
} from "@/lib/api";
import { FLAT_PIPELINE_STEPS, getSavedPipelineStepIndex, savePipelineStepIndex } from "@/lib/pipeline";

type AdminTab = "Reviews" | "Tasks" | "Telemetry" | "Users" | "Rounds" | "Pipeline";

const ROLE_TIERS = [
  { value: "admin", label: "Executive Tier (Admin 0)" },
  { value: "supervisor", label: "Department Tier (Supervisors 1)" },
  { value: "contributor", label: "Contributor Tier (Contributors 2)" },
  { value: "voter", label: "Community Tier (Voters 3)" }
];

const CONTRIBUTOR_SPECIALTIES = [
  { value: "", label: "None" },
  { value: "animator", label: "Animators" },
  { value: "layout_artist", label: "Layout Artists" },
  { value: "3d_modeler", label: "3D Modelers" },
  { value: "rigger", label: "Riggers" },
  { value: "surface_texture_artist", label: "Surface / Texture Artists" },
  { value: "lighting_artist", label: "Lighting Artists" },
  { value: "vfx_artist", label: "VFX Artists" },
  { value: "concept_artist", label: "Concept Artists" },
  { value: "voice_actor", label: "Voice Actors (VAs)" },
  { value: "sound_designer", label: "Sound Designers" },
  { value: "video_editor", label: "Video Editors" },
  { value: "screenwriter", label: "Screenwriters" },
  { value: "general_contributor", label: "General Contributors" }
];

function getUserSpecialty(specs?: string[]): string {
  if (!specs || specs.length === 0) return "";
  const raw = specs[0].toLowerCase().trim();
  const match = CONTRIBUTOR_SPECIALTIES.find(
    (s) => s.value === raw || s.label.toLowerCase() === raw
  );
  return match ? match.value : (raw === "none" ? "" : raw);
}

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const { isAdmin, isSupervisor, isLoading } = useAuth();
  // block all data fetching until auth confirms staff access
  const isAuthorized = !isLoading && (isAdmin || isSupervisor);

  const [activeTab, setActiveTab] = useState<AdminTab>("Reviews");
  const [selectedRoundId, setSelectedRoundId] = useState<string>("");

  // reviews state
  const [entryStatus, setEntryStatus] = useState<string | null>(null);
  const [entryStatusFilter, setEntryStatusFilter] = useState<string>("pending_review");
  const [reviewNotes, setReviewNotes] = useState<{ [subId: string]: string }>({});
  const [deliverableStatus, setDeliverableStatus] = useState<string | null>(null);

  // tasks management state
  const [taskSceneNumber, setTaskSceneNumber] = useState<number>(1);
  const [taskShotCode, setTaskShotCode] = useState<string>("");
  const [taskTitle, setTaskTitle] = useState<string>("");
  const [taskDescription, setTaskDescription] = useState<string>("");
  const [taskDifficultyTier, setTaskDifficultyTier] = useState<"tier_1" | "tier_2" | "tier_3" | "tier_4">("tier_2");
  const [taskSeniorPriorityHours, setTaskSeniorPriorityHours] = useState<number>(0);
  const [isCreatingTask, setIsCreatingTask] = useState<boolean>(false);
  const [taskStatus, setTaskStatus] = useState<string | null>(null);

  // users state
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [userPage, setUserPage] = useState<number>(1);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [discordId, setDiscordId] = useState<string>("");
  const [discordRole, setDiscordRole] = useState<string>("contributor");
  const [discordUsername, setDiscordUsername] = useState<string>("");
  const [discordSpec, setDiscordSpec] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  // rounds state (create & edit)
  const [newTitle, setNewTitle] = useState("");
  const [newPollType, setNewPollType] = useState("ranked_choice");
  const [newRoundStatus, setNewRoundStatus] = useState("open");
  const [isCreatingRound, setIsCreatingRound] = useState(false);
  const [roundStatus, setRoundStatus] = useState<string | null>(null);
  const [editingRound, setEditingRound] = useState<Round | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPollType, setEditPollType] = useState("ranked_choice");
  const [editRoundStatus, setEditRoundStatus] = useState("draft");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [finalizingRound, setFinalizingRound] = useState<Round | null>(null);
  const [finalizeConfirmed, setFinalizeConfirmed] = useState<boolean>(false);
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);
  const [viewingLedgerRound, setViewingLedgerRound] = useState<Round | null>(null);

  // pipeline state
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [isUpdatingPipeline, setIsUpdatingPipeline] = useState<boolean>(false);

  const { data: pipelineData } = useQuery({
    queryKey: ["pipeline-progress"],
    queryFn: fetchPipelineProgress,
    staleTime: 10_000,
    enabled: isAuthorized
  });

  useEffect(() => {
    if (pipelineData?.stepIndex !== undefined) {
      setStepIndex(pipelineData.stepIndex);
      savePipelineStepIndex(pipelineData.stepIndex);
    } else {
      setStepIndex(getSavedPipelineStepIndex());
    }
  }, [pipelineData]);

  const { data: roundsData, isLoading: roundsLoading } = useQuery({
    queryKey: ["rounds"],
    queryFn: fetchRounds,
    enabled: isAuthorized
  });

  const rounds = roundsData?.data || [];
  const activeRoundId = selectedRoundId || rounds[0]?.id || "";

  const { data: adminLedgerData, isLoading: adminLedgerLoading } = useQuery({
    queryKey: ["admin-ledger", viewingLedgerRound?.id],
    queryFn: () => viewingLedgerRound ? fetchRoundLedger(viewingLedgerRound.id) : null,
    enabled: isAuthorized && Boolean(viewingLedgerRound?.id)
  });

  const { data: pendingEntriesData, isLoading: pendingLoading } = useQuery({
    queryKey: ["admin-entries", activeRoundId, entryStatusFilter],
    queryFn: () => fetchRoundEntries(activeRoundId, entryStatusFilter === "all" ? undefined : entryStatusFilter),
    enabled: isAuthorized && Boolean(activeRoundId)
  });

  const pendingEntries = pendingEntriesData?.data || [];

  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ["review-queue"],
    queryFn: fetchReviewQueue,
    enabled: isAuthorized
  });

  const reviewQueue = (queueData?.data || []) as ReviewQueueItem[];

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["users", roleFilter, userPage],
    queryFn: () => fetchUsers(roleFilter === "all" ? undefined : roleFilter, userPage),
    enabled: isAuthorized
  });

  const usersList = (usersData?.data || []) as ModeratedUser[];

  const { data: telemetryData, isLoading: telemetryLoading } = useQuery({
    queryKey: ["telemetry", activeRoundId],
    queryFn: () => fetchRoundTelemetry(activeRoundId),
    enabled: isAuthorized && Boolean(activeRoundId)
  });

  const telemetryList = (telemetryData || []) as RaidTelemetry[];

  const { data: leaderboardData } = useQuery({
    queryKey: ["leaderboard", activeRoundId],
    queryFn: () => fetchRoundLeaderboard(activeRoundId),
    enabled: isAuthorized && Boolean(activeRoundId)
  });

  const { data: threadMapsData } = useQuery({
    queryKey: ["shot-thread-maps"],
    queryFn: fetchShotThreadMaps,
    enabled: isAuthorized
  });

  const shotThreadMaps = threadMapsData || [];

  const { data: shotsData, isLoading: shotsLoading } = useQuery({
    queryKey: ["shots"],
    queryFn: fetchShots,
    enabled: isAuthorized
  });

  const shotsList = (shotsData?.data || []) as Shot[];

  if (isLoading) {
    return <div style={{ padding: "20px" }}>Authenticating access...</div>;
  }

  if (!isAdmin && !isSupervisor) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <h1>404 - Page Not Found</h1>
        <p>The requested document was not found on this server.</p>
        <hr className="divider-hr" />
        <Link href="/">&laquo; Return to Home</Link>
      </div>
    );
  }

  const handleApproveEntry = async (id: string) => {
    if (!activeRoundId) return;
    try {
      await updateEntryStatus(activeRoundId, id, "approved");
      setEntryStatus("Entry approved.");
      queryClient.invalidateQueries({ queryKey: ["admin-entries"] });
      queryClient.invalidateQueries({ queryKey: ["entries", activeRoundId] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard", activeRoundId] });
    } catch (err: unknown) {
      setEntryStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleRejectEntry = async (id: string) => {
    if (!activeRoundId) return;
    try {
      await updateEntryStatus(activeRoundId, id, "rejected");
      setEntryStatus("Entry rejected.");
      queryClient.invalidateQueries({ queryKey: ["admin-entries"] });
      queryClient.invalidateQueries({ queryKey: ["entries", activeRoundId] });
    } catch (err: unknown) {
      setEntryStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleFlagEntry = async (id: string) => {
    if (!activeRoundId) return;
    try {
      await updateEntryStatus(activeRoundId, id, "pending_review");
      setEntryStatus("Entry returned to review.");
      queryClient.invalidateQueries({ queryKey: ["admin-entries"] });
      queryClient.invalidateQueries({ queryKey: ["entries", activeRoundId] });
    } catch (err: unknown) {
      setEntryStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDeleteEntry = async (id: string, title: string) => {
    if (!activeRoundId) return;
    if (!confirm(`Delete proposal "${title}"?`)) return;
    try {
      await deleteEntry(activeRoundId, id);
      setEntryStatus("Entry deleted.");
      queryClient.invalidateQueries({ queryKey: ["admin-entries"] });
      queryClient.invalidateQueries({ queryKey: ["entries", activeRoundId] });
    } catch (err: unknown) {
      setEntryStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleReviewSubmission = async (subId: string, decision: "approved" | "changes_requested") => {
    try {
      await reviewSubmission(subId, decision, reviewNotes[subId] || null);
      setDeliverableStatus(decision === "approved" ? "Deliverable approved." : "Changes requested.");
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["shots"] });
    } catch (err: unknown) {
      setDeliverableStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskShotCode.trim()) return;

    setIsCreatingTask(true);
    setTaskStatus(null);
    try {
      await createShot({
        sceneNumber: Number(taskSceneNumber),
        shotCode: taskShotCode.trim(),
        title: taskTitle.trim(),
        description: taskDescription.trim() || null,
        difficultyTier: taskDifficultyTier,
        seniorPriorityHours: Number(taskSeniorPriorityHours)
      });
      setTaskStatus(`Task [${taskShotCode}] created successfully.`);
      setTaskShotCode("");
      setTaskTitle("");
      setTaskDescription("");
      queryClient.invalidateQueries({ queryKey: ["shots"] });
    } catch (err: unknown) {
      setTaskStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleDeleteTask = async (shotId: string, shotCode: string) => {
    if (!confirm(`Permanently delete task [${shotCode}]?`)) return;
    try {
      await deleteShot(shotId);
      setTaskStatus(`Task [${shotCode}] deleted.`);
      queryClient.invalidateQueries({ queryKey: ["shots"] });
    } catch (err: unknown) {
      setTaskStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleSavePipeline = async () => {
    setIsUpdatingPipeline(true);
    const target = FLAT_PIPELINE_STEPS[stepIndex] || FLAT_PIPELINE_STEPS[0];
    const prevSavedIdx = getSavedPipelineStepIndex();
    const prevStep = FLAT_PIPELINE_STEPS[prevSavedIdx] || FLAT_PIPELINE_STEPS[0];
    const isPhaseTransition = target.phaseNumber !== prevStep.phaseNumber;
    const progressPercent = Math.round(((stepIndex + 1) / FLAT_PIPELINE_STEPS.length) * 100);

    try {
      await updatePipelineProgress({
        stepIndex,
        stepId: target.id,
        stepTitle: target.title,
        phaseNumber: target.phaseNumber,
        phaseTitle: target.phaseTitle,
        progressPercent,
        isPhaseTransition
      });
      savePipelineStepIndex(stepIndex);
      queryClient.invalidateQueries({ queryKey: ["pipeline-progress"] });
      setSavedNotice(
        isPhaseTransition
          ? `Phase ${target.phaseNumber} unlocked!`
          : `Step ${target.id} updated!`
      );
      setTimeout(() => setSavedNotice(null), 4000);
    } catch (err: unknown) {
      savePipelineStepIndex(stepIndex);
      const message = err instanceof Error ? err.message : String(err);
      setSavedNotice(`API Error: ${message} (Saved locally)`);
      setTimeout(() => setSavedNotice(null), 5000);
    } finally {
      setIsUpdatingPipeline(false);
    }
  };

  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsCreatingRound(true);
    try {
      const created = await createRound({ title: newTitle.trim(), pollType: newPollType });
      // update status if open was chosen during creation
      if (newRoundStatus !== "draft") {
        await updateRound(created.id, { status: newRoundStatus });
      }
      setRoundStatus(`Round "${newTitle.trim()}" created (${newRoundStatus.toUpperCase()}).`);
      setNewTitle("");
      setNewRoundStatus("open");
      queryClient.invalidateQueries({ queryKey: ["rounds"] });
    } catch (err: unknown) {
      setRoundStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsCreatingRound(false);
    }
  };

  const handleQuickUpdateRoundStatus = async (roundId: string, newStatus: string) => {
    try {
      await updateRound(roundId, { status: newStatus });
      setRoundStatus(`Round status updated to ${newStatus.toUpperCase()}.`);
      queryClient.invalidateQueries({ queryKey: ["rounds"] });
      queryClient.invalidateQueries({ queryKey: ["active-round"] });
    } catch (err: unknown) {
      setRoundStatus(`Status update failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleStartEditRound = (r: Round) => {
    setEditingRound(r);
    setEditTitle(r.title);
    setEditPollType(r.pollType || (r.scheme === "binary" ? "binary" : "ranked_choice"));
    setEditRoundStatus(r.status);
    setRoundStatus(null);
  };

  const handleSaveEditRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRound) return;
    setIsSavingEdit(true);
    try {
      await updateRound(editingRound.id, {
        title: editTitle.trim(),
        pollType: editPollType,
        status: editRoundStatus
      });
      setRoundStatus("Round updated.");
      setEditingRound(null);
      queryClient.invalidateQueries({ queryKey: ["rounds"] });
    } catch (err: unknown) {
      setRoundStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteRound = async (roundId: string, title: string) => {
    if (!confirm(`Permanently delete round "${title}"?`)) return;
    try {
      await deleteRound(roundId);
      setRoundStatus("Round deleted.");
      if (selectedRoundId === roundId) setSelectedRoundId("");
      queryClient.invalidateQueries({ queryKey: ["rounds"] });
    } catch (err: unknown) {
      setRoundStatus(`Delete failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleOpenFinalizeModal = (round: Round) => {
    setFinalizingRound(round);
    setFinalizeConfirmed(false);
  };

  const handleExecuteFinalizeRound = async () => {
    if (!finalizingRound || !finalizeConfirmed) return;
    setIsFinalizing(true);
    try {
      await finalizeRound(finalizingRound.id);
      setRoundStatus(`Round "${finalizingRound.title}" certified and finalized.`);
      setFinalizingRound(null);
      setFinalizeConfirmed(false);
      queryClient.invalidateQueries({ queryKey: ["rounds"] });
      queryClient.invalidateQueries({ queryKey: ["active-round"] });
    } catch (err: unknown) {
      setRoundStatus(`Finalize failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleUpdateUserRole = async (uid: string, role: string, specs: string[]) => {
    try {
      await changeUserRole(uid, role, specs);
      setUserStatus(`Role updated: ${role}. Discord sync dispatched.`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err: unknown) {
      setUserStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleUpdateUserSpecialty = async (u: ModeratedUser, newSpec: string) => {
    const nextSpecs = newSpec.trim() ? [newSpec.trim()] : [];
    try {
      await changeUserRole(u.id, u.role, nextSpecs);
      setUserStatus(`Specialty updated for @${u.username || u.discordUsername || u.discordId}.`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err: unknown) {
      setUserStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleToggleBlacklist = async (u: ModeratedUser) => {
    const name = u.username || u.discordUsername || u.discordId;
    try {
      if (u.isBlacklisted) {
        await reinstateUser(u.id);
        setUserStatus(`User @${name} reinstated.`);
      } else {
        const reason = prompt("Blacklist reason:");
        if (reason === null) return;
        await blacklistUser(u.id, reason.trim() || null);
        setUserStatus(`User @${name} blacklisted.`);
      }
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err: unknown) {
      setUserStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleAssignByDiscord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discordId.trim()) return;
    setIsAssigning(true);
    try {
      const specs = discordSpec.trim() ? [discordSpec.trim()] : [];
      await setUserRoleByDiscord(discordId.trim(), discordRole, specs, discordUsername.trim() || undefined);
      setUserStatus(`Assigned ${discordRole} to snowflake ${discordId}.`);
      setDiscordId("");
      setDiscordUsername("");
      setDiscordSpec("");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err: unknown) {
      setUserStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsAssigning(false);
    }
  };

  const currentStep = FLAT_PIPELINE_STEPS[stepIndex] || FLAT_PIPELINE_STEPS[0];
  const progressPercent = Math.round(((stepIndex + 1) / FLAT_PIPELINE_STEPS.length) * 100);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <h1 style={{ margin: 0, borderBottom: "none" }}>Admin</h1>
        <span className="badge badge-admin">SUPERVISOR</span>
      </div>

      <div style={{ display: "flex", gap: "4px", borderBottom: "2px solid var(--border-dark)", marginBottom: "14px" }}>
        {(["Reviews", "Tasks", "Telemetry", "Users", "Rounds", "Pipeline"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab);
              setEntryStatus(null);
              setDeliverableStatus(null);
              setUserStatus(null);
              setRoundStatus(null);
              setTaskStatus(null);
            }}
            style={{
              padding: "5px 14px",
              fontFamily: "inherit",
              fontSize: "12px",
              fontWeight: activeTab === tab ? "bold" : "normal",
              backgroundColor: activeTab === tab ? "#ffffff" : "#e0ded8",
              border: "1px solid var(--border-dark)",
              borderBottom: activeTab === tab ? "1px solid #ffffff" : "1px solid var(--border-dark)",
              marginBottom: activeTab === tab ? "-2px" : "0",
              cursor: "pointer"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Reviews" && (
        <div>
          <fieldset className="grab-box" style={{ borderColor: "#b8860b", backgroundColor: "#fffef7", marginBottom: "14px" }}>
            <legend style={{ fontWeight: "bold", color: "#8b6508" }}>Proposals</legend>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <label htmlFor="round-sel"><strong>Round:</strong></label>
                <select
                  id="round-sel"
                  value={activeRoundId}
                  onChange={(e) => { setSelectedRoundId(e.target.value); setEntryStatus(null); }}
                  style={{ padding: "2px 4px", fontSize: "12px" }}
                >
                  {rounds.map((r) => (
                    <option key={r.id} value={r.id}>{r.title} ({r.scheme || r.pollType})</option>
                  ))}
                </select>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Total: {pendingEntries.length}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "4px", marginBottom: "10px", flexWrap: "wrap" }}>
              {[
                { value: "pending_review", label: "Pending Review" },
                { value: "all", label: "All" },
                { value: "approved", label: "Approved" },
                { value: "rejected", label: "Rejected" }
              ].map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setEntryStatusFilter(f.value)}
                  style={{
                    fontSize: "11px",
                    padding: "2px 8px",
                    backgroundColor: entryStatusFilter === f.value ? "#3a75c4" : "#eee",
                    color: entryStatusFilter === f.value ? "#fff" : "#333",
                    border: "1px solid #999",
                    cursor: "pointer"
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {entryStatus && (
              <div style={{ padding: "4px 8px", marginBottom: "8px", backgroundColor: "#e2f0d9", color: "#276a3c", fontSize: "12px" }}>
                {entryStatus}
              </div>
            )}

            {pendingLoading ? (
              <p>Loading...</p>
            ) : pendingEntries.length === 0 ? (
              <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>No candidate proposals in this view.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Status</th>
                    <th>Title & Pitch</th>
                    <th>Description</th>
                    <th>Attachment</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingEntries.map((e) => (
                    <tr key={e.id}>
                      <td><code>{e.id.slice(0, 8)}</code></td>
                      <td>
                        <span
                          style={{
                            fontSize: "10px",
                            padding: "1px 4px",
                            borderRadius: "2px",
                            backgroundColor:
                              e.status === "approved"
                                ? "#e2f0d9"
                                : e.status === "rejected"
                                ? "#fde8e8"
                                : "#fff3cd",
                            color:
                              e.status === "approved"
                                ? "#276a3c"
                                : e.status === "rejected"
                                ? "#c00"
                                : "#856404",
                            fontWeight: "bold",
                            textTransform: "uppercase"
                          }}
                        >
                          {e.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <strong>{e.title}</strong>
                          {e.aiFlags && e.aiFlags.length > 0 && (
                            <span
                              title={`AI signatures detected:\n${e.aiFlags.join("\n")}`}
                              style={{
                                fontSize: "9px",
                                padding: "1px 4px",
                                borderRadius: "2px",
                                backgroundColor: "#ffebee",
                                color: "#c62828",
                                border: "1px solid #ffcdd2",
                                fontWeight: "bold"
                              }}
                            >
                              AI FLAG ({e.aiFlags.length})
                            </span>
                          )}
                        </div>
                        {e.authorName && <div style={{ fontSize: "11px", color: "#666" }}>@{e.authorName}</div>}
                      </td>
                      <td style={{ maxWidth: "240px", fontSize: "11px" }}>
                        {e.description || "-"}
                      </td>
                      <td>
                        {e.mediaUrl ? (
                          <a href={e.mediaUrl} target="_blank" rel="noreferrer" style={{ fontSize: "11px" }}>
                            Media &raquo;
                          </a>
                        ) : "-"}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
                          {e.status !== "approved" && (
                            <button
                              type="button"
                              className="action-btn"
                              onClick={() => handleApproveEntry(e.id)}
                              style={{ backgroundColor: "#e2f0d9", color: "#276a3c", fontSize: "10px", padding: "2px 5px" }}
                            >
                              Approve
                            </button>
                          )}
                          {e.status !== "rejected" && (
                            <button
                              type="button"
                              className="action-btn"
                              onClick={() => handleRejectEntry(e.id)}
                              style={{ backgroundColor: "#fde8e8", color: "#c00", fontSize: "10px", padding: "2px 5px" }}
                            >
                              Reject
                            </button>
                          )}
                          {e.status !== "pending_review" && (
                            <button
                              type="button"
                              className="action-btn"
                              onClick={() => handleFlagEntry(e.id)}
                              style={{ backgroundColor: "#fff3cd", color: "#856404", fontSize: "10px", padding: "2px 5px" }}
                            >
                              Review
                            </button>
                          )}
                          <button
                            type="button"
                            className="action-btn"
                            onClick={() => handleDeleteEntry(e.id, e.title)}
                            style={{ backgroundColor: "#eee", color: "#555", fontSize: "10px", padding: "2px 5px" }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </fieldset>

          <fieldset className="grab-box" style={{ backgroundColor: "#ffffff" }}>
            <legend style={{ fontWeight: "bold" }}>Deliverables</legend>
            {deliverableStatus && (
              <div style={{ padding: "4px 8px", marginBottom: "8px", backgroundColor: "#e2f0d9", color: "#276a3c", fontSize: "12px" }}>
                {deliverableStatus}
              </div>
            )}

            {queueLoading ? (
              <p>Loading...</p>
            ) : reviewQueue.length === 0 ? (
              <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>No deliverables awaiting review.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {reviewQueue.map((item) => (
                  <fieldset key={item.id} className="grab-box" style={{ backgroundColor: "#fafafa" }}>
                    <legend style={{ fontSize: "11px", fontWeight: "bold" }}>
                      [{item.shot?.shotCode || item.shotId.slice(0, 8)}] Scene {item.shot?.sceneNumber || 1} (v{item.version})
                    </legend>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <strong>{item.shot?.title || "Shot"}</strong>
                          {item.aiFlags && item.aiFlags.length > 0 && (
                            <span
                              title={`AI signatures detected:\n${item.aiFlags.join("\n")}`}
                              style={{
                                fontSize: "9px",
                                padding: "1px 4px",
                                borderRadius: "2px",
                                backgroundColor: "#ffebee",
                                color: "#c62828",
                                border: "1px solid #ffcdd2",
                                fontWeight: "bold"
                              }}
                            >
                              AI FLAG ({item.aiFlags.length})
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "11px", color: "#555" }}>
                          Contributor: @{item.contributor?.discordUsername || item.contributor?.username || "Unknown"}
                        </div>
                        {item.notes && <div style={{ fontSize: "11px", color: "#333", margin: "4px 0" }}>{item.notes}</div>}
                        <div style={{ display: "flex", gap: "8px", fontSize: "11px", marginTop: "4px" }}>
                          {item.videoUrl && <a href={item.videoUrl} target="_blank" rel="noreferrer">Preview Video</a>}
                          {item.blendUrl && <a href={item.blendUrl} target="_blank" rel="noreferrer">Download .blend</a>}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "220px" }}>
                        <input
                          type="text"
                          placeholder="Feedback notes (optional)..."
                          value={reviewNotes[item.id] || ""}
                          onChange={(e) => setReviewNotes({ ...reviewNotes, [item.id]: e.target.value })}
                          style={{ fontSize: "11px", padding: "2px 4px" }}
                        />
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            type="button"
                            className="action-btn"
                            onClick={() => handleReviewSubmission(item.id, "approved")}
                            style={{ flex: 1, backgroundColor: "#e2f0d9", color: "#276a3c", fontSize: "11px" }}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="action-btn"
                            onClick={() => handleReviewSubmission(item.id, "changes_requested")}
                            style={{ flex: 1, backgroundColor: "#fff3cd", color: "#856404", fontSize: "11px" }}
                          >
                            Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  </fieldset>
                ))}
              </div>
            )}
          </fieldset>
        </div>
      )}

      {activeTab === "Tasks" && (
        <div>
          {taskStatus && (
            <div style={{ padding: "4px 8px", marginBottom: "10px", backgroundColor: "#e2f0d9", color: "#276a3c", fontSize: "12px" }}>
              {taskStatus}
            </div>
          )}

          <fieldset className="grab-box" style={{ backgroundColor: "#ffffff", marginBottom: "14px" }}>
            <legend style={{ fontWeight: "bold" }}>Create Task</legend>
            <form onSubmit={handleCreateTask}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "560px" }}>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 120px" }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "bold" }}>Scene # *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={taskSceneNumber}
                      onChange={(e) => setTaskSceneNumber(parseInt(e.target.value, 10) || 1)}
                      style={{ width: "100%", padding: "3px", fontSize: "12px" }}
                    />
                  </div>
                  <div style={{ flex: "2 1 180px" }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "bold" }}>Shot Code *</label>
                    <input
                      type="text"
                      required
                      maxLength={50}
                      placeholder="e.g. SC01_SH010"
                      value={taskShotCode}
                      onChange={(e) => setTaskShotCode(e.target.value)}
                      style={{ width: "100%", padding: "3px", fontSize: "12px" }}
                    />
                  </div>
                  <div style={{ flex: "2 1 180px" }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "bold" }}>Difficulty Tier *</label>
                    <select
                      value={taskDifficultyTier}
                      onChange={(e) => setTaskDifficultyTier(e.target.value as any)}
                      style={{ width: "100%", padding: "3px", fontSize: "12px" }}
                    >
                      <option value="tier_1">Tier 1 (1 day)</option>
                      <option value="tier_2">Tier 2 (3 days)</option>
                      <option value="tier_3">Tier 3 (7 days)</option>
                      <option value="tier_4">Tier 4 (14 days)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "bold" }}>Task Title *</label>
                  <input
                    type="text"
                    required
                    maxLength={255}
                    placeholder="e.g. LookDev & Geometry Topology Rig"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    style={{ width: "100%", padding: "3px", fontSize: "12px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "bold" }}>Description & Technical Specs</label>
                  <textarea
                    rows={2}
                    maxLength={2000}
                    placeholder="Detailed requirements, polygon budget, texture resolution..."
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    style={{ width: "100%", padding: "3px", fontSize: "12px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "bold" }}>Senior Priority (Hours, 0 = public)</label>
                  <input
                    type="number"
                    min={0}
                    max={168}
                    value={taskSeniorPriorityHours}
                    onChange={(e) => setTaskSeniorPriorityHours(parseInt(e.target.value, 10) || 0)}
                    style={{ width: "120px", padding: "3px", fontSize: "12px" }}
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    className="action-btn"
                    disabled={isCreatingTask || !taskTitle.trim() || !taskShotCode.trim()}
                    style={{ fontSize: "11px", fontWeight: "bold", backgroundColor: "#e2f0d9", color: "#276a3c" }}
                  >
                    {isCreatingTask ? "Creating..." : "Create Task"}
                  </button>
                </div>
              </div>
            </form>
          </fieldset>

          <fieldset className="grab-box" style={{ backgroundColor: "#ffffff" }}>
            <legend style={{ fontWeight: "bold" }}>Tasks</legend>
            {shotsLoading ? (
              <p>Loading tasks...</p>
            ) : shotsList.length === 0 ? (
              <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>No grab-box tasks created yet.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: "15%" }}>Code</th>
                    <th style={{ width: "10%" }}>Scene</th>
                    <th style={{ width: "30%" }}>Title</th>
                    <th style={{ width: "12%" }}>Tier</th>
                    <th style={{ width: "13%" }}>Status</th>
                    <th style={{ width: "20%" }}>Claimant / Action</th>
                  </tr>
                </thead>
                <tbody>
                  {shotsList.map((s) => (
                    <tr key={s.id}>
                      <td><code>{s.shotCode || s.id.slice(0, 8)}</code></td>
                      <td>Scene {s.sceneNumber || 1}</td>
                      <td><strong>{s.title}</strong></td>
                      <td>{s.difficultyTier?.toUpperCase()}</td>
                      <td>
                        <span className={`badge ${s.status === "available" ? "badge-active" : s.status === "claimed" ? "badge-closed" : "badge-admin"}`}>
                          {s.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "11px" }}>
                            {s.claimer ? `@${s.claimer.username}` : "Unclaimed"}
                          </span>
                          <button
                            type="button"
                            className="action-btn"
                            onClick={() => handleDeleteTask(s.id, s.shotCode || s.title)}
                            style={{ fontSize: "10px", padding: "1px 4px", backgroundColor: "#fde8e8", color: "#c00" }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </fieldset>
        </div>
      )}

      {activeTab === "Telemetry" && (
        <TelemetrySection
          rounds={rounds}
          activeRoundId={activeRoundId}
          onSelectRound={setSelectedRoundId}
          telemetryList={telemetryList}
          telemetryLoading={telemetryLoading}
          leaderboardData={leaderboardData ?? null}
          shotThreadMaps={shotThreadMaps}
          shotsList={shotsList}
        />
      )}

      {activeTab === "Users" && (
        <div>
          <fieldset className="grab-box" style={{ backgroundColor: "#ffffff", marginBottom: "14px" }}>
            <legend style={{ fontWeight: "bold" }}>Users</legend>
            {userStatus && (
              <div style={{ padding: "4px 8px", marginBottom: "8px", backgroundColor: "#e2f0d9", color: "#276a3c", fontSize: "12px" }}>
                {userStatus}
              </div>
            )}

            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
              <label htmlFor="usr-role"><strong>Role Tier:</strong></label>
              <select
                id="usr-role"
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setUserPage(1); }}
                style={{ padding: "2px 4px", fontSize: "12px" }}
              >
                <option value="all">All Tiers</option>
                {ROLE_TIERS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            {usersLoading ? (
              <p>Loading...</p>
            ) : usersList.length === 0 ? (
              <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>No users found.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Snowflake</th>
                    <th>Role Tier (Primary)</th>
                    <th>Specialty (Contributor)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => {
                    const currentSpec = getUserSpecialty(u.specialties);
                    return (
                      <tr key={u.id} style={{ backgroundColor: u.isBlacklisted ? "#fff0f0" : "inherit" }}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <img
                              src={getDiscordAvatarUrl(u.discordId, u.avatarUrl || u.discordAvatar)}
                              alt=""
                              style={{
                                width: "18px",
                                height: "18px",
                                borderRadius: "50%",
                                backgroundColor: "#ccc",
                                flexShrink: 0
                              }}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = "https://cdn.discordapp.com/embed/avatars/0.png";
                              }}
                            />
                            <strong>@{u.username || u.discordUsername || u.discordId}</strong>
                            {u.isBlacklisted && <span style={{ color: "#c00", fontSize: "10px", marginLeft: "4px" }}>[BLOCKED]</span>}
                          </div>
                        </td>
                        <td><code>{u.discordId}</code></td>
                        <td>
                          <select
                            value={u.role.toLowerCase()}
                            onChange={(e) => handleUpdateUserRole(u.id, e.target.value, u.specialties)}
                            style={{ fontSize: "11px", padding: "1px 2px" }}
                          >
                            {ROLE_TIERS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                          </select>
                        </td>
                        <td>
                          <select
                            value={currentSpec}
                            onChange={(e) => handleUpdateUserSpecialty(u, e.target.value)}
                            style={{ fontSize: "11px", padding: "1px 2px" }}
                          >
                            {CONTRIBUTOR_SPECIALTIES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="action-btn"
                            onClick={() => handleToggleBlacklist(u)}
                            style={{
                              fontSize: "10px",
                              padding: "2px 6px",
                              backgroundColor: u.isBlacklisted ? "#e2f0d9" : "#fde8e8",
                              color: u.isBlacklisted ? "#276a3c" : "#c00"
                            }}
                          >
                            {u.isBlacklisted ? "Reinstate" : "Blacklist"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </fieldset>

          <fieldset className="grab-box" style={{ backgroundColor: "#ffffff" }}>
            <legend style={{ fontWeight: "bold" }}>Provision</legend>
            <form onSubmit={handleAssignByDiscord} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-end" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px" }}>Snowflake ID:</label>
                  <input
                    type="text"
                    required
                    placeholder="112233445566778899"
                    value={discordId}
                    onChange={(e) => setDiscordId(e.target.value)}
                    style={{ padding: "3px", fontSize: "12px", width: "180px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px" }}>Username (Opt):</label>
                  <input
                    type="text"
                    placeholder="username"
                    value={discordUsername}
                    onChange={(e) => setDiscordUsername(e.target.value)}
                    style={{ padding: "3px", fontSize: "12px", width: "120px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px" }}>Role Tier (Primary):</label>
                  <select
                    value={discordRole}
                    onChange={(e) => setDiscordRole(e.target.value)}
                    style={{ padding: "3px", fontSize: "12px" }}
                  >
                    {ROLE_TIERS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px" }}>Specialty (Contributor):</label>
                  <select
                    value={discordSpec}
                    onChange={(e) => setDiscordSpec(e.target.value)}
                    style={{ padding: "3px", fontSize: "12px" }}
                  >
                    {CONTRIBUTOR_SPECIALTIES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="action-btn" disabled={isAssigning} style={{ fontSize: "11px" }}>
                  {isAssigning ? "Saving..." : "Assign Role"}
                </button>
              </div>
            </form>
          </fieldset>
        </div>
      )}

      {activeTab === "Rounds" && (
        <div>
          {roundStatus && (
            <div style={{ padding: "4px 8px", marginBottom: "10px", backgroundColor: "#e2f0d9", color: "#276a3c", fontSize: "12px" }}>
              {roundStatus}
            </div>
          )}

          {editingRound ? (
            <fieldset className="grab-box" style={{ backgroundColor: "#fffef7", borderColor: "#b8860b", marginBottom: "14px" }}>
              <legend style={{ fontWeight: "bold", color: "#8b6508" }}>
                Edit Round
              </legend>
              <form onSubmit={handleSaveEditRound}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "480px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px" }}><strong>Title:</strong></label>
                    <input
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      style={{ padding: "3px", width: "100%", fontSize: "12px" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px" }}><strong>Scheme:</strong></label>
                      <select
                        value={editPollType}
                        onChange={(e) => setEditPollType(e.target.value)}
                        style={{ padding: "3px", fontSize: "12px" }}
                      >
                        <option value="ranked_choice">Ranked Choice (3-2-1)</option>
                        <option value="binary">Binary (1-0)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11px" }}><strong>Status:</strong></label>
                      <select
                        value={editRoundStatus}
                        onChange={(e) => setEditRoundStatus(e.target.value)}
                        style={{ padding: "3px", fontSize: "12px" }}
                      >
                        {editingRound.status === "draft" && (
                          <>
                            <option value="draft">DRAFT (Setup)</option>
                            <option value="open">OPEN (Submissions)</option>
                          </>
                        )}
                        {editingRound.status === "open" && (
                          <>
                            <option value="open">OPEN (Submissions)</option>
                            <option value="voting">VOTING (Active)</option>
                          </>
                        )}
                        {editingRound.status === "voting" && (
                          <option value="voting">VOTING (Active)</option>
                        )}
                        {editingRound.status === "finalized" && (
                          <option value="finalized">FINALIZED</option>
                        )}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                    <button type="submit" className="action-btn" disabled={isSavingEdit} style={{ backgroundColor: "#e2f0d9", color: "#276a3c" }}>
                      {isSavingEdit ? "Saving..." : "Save Changes"}
                    </button>
                    <button type="button" className="action-btn" onClick={() => setEditingRound(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </fieldset>
          ) : (
            <fieldset className="grab-box" style={{ backgroundColor: "#ffffff", marginBottom: "14px" }}>
              <legend style={{ fontWeight: "bold" }}>Create Round</legend>
              <form onSubmit={handleCreateRound} style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: "1 1 200px" }}>
                  <label style={{ display: "block", fontSize: "11px" }}>Title:</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Round Title"
                    style={{ padding: "3px", width: "100%", fontSize: "12px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px" }}>Scheme:</label>
                  <select
                    value={newPollType}
                    onChange={(e) => setNewPollType(e.target.value)}
                    style={{ padding: "3px", fontSize: "12px" }}
                  >
                    <option value="ranked_choice">Ranked Choice (3-2-1)</option>
                    <option value="binary">Binary (1-0)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px" }}>Status:</label>
                  <select
                    value={newRoundStatus}
                    onChange={(e) => setNewRoundStatus(e.target.value)}
                    style={{ padding: "3px", fontSize: "12px" }}
                  >
                    <option value="open">Open (Submissions)</option>
                    <option value="draft">Draft (Setup First)</option>
                  </select>
                </div>
                <button type="submit" className="action-btn" disabled={isCreatingRound} style={{ fontSize: "11px" }}>
                  {isCreatingRound ? "Creating..." : "Create Round"}
                </button>
              </form>
            </fieldset>
          )}

          <div style={{ marginBottom: "10px", padding: "6px 8px", backgroundColor: "#f4f2eb", border: "1px solid #ccc", fontSize: "11px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <strong>Statuses:</strong>
            <span><strong>DRAFT:</strong> Staging / hidden</span>
            <span><strong>OPEN:</strong> Submissions open</span>
            <span><strong>VOTING:</strong> Active voting (5 finalists)</span>
            <span><strong>FINALIZED:</strong> Certified</span>
          </div>

          <fieldset className="grab-box" style={{ backgroundColor: "#ffffff" }}>
            <legend style={{ fontWeight: "bold" }}>Rounds</legend>
            {roundsLoading ? (
              <p>Loading rounds...</p>
            ) : rounds.length === 0 ? (
              <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>No rounds created yet.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: "10%" }}>ID</th>
                    <th style={{ width: "32%" }}>Title</th>
                    <th style={{ width: "16%" }}>Scheme</th>
                    <th style={{ width: "18%" }}>Status</th>
                    <th style={{ width: "24%" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rounds.map((r) => (
                    <tr key={r.id}>
                      <td><code>{r.id.slice(0, 8)}</code></td>
                      <td><strong>{r.title}</strong></td>
                      <td>{r.pollType === "binary" || r.scheme === "binary" ? "Binary (1-0)" : "Ranked (3-2-1)"}</td>
                      <td>
                        {r.status === "finalized" ? (
                          <span className="badge badge-admin">FINALIZED</span>
                        ) : (
                          <select
                            value={r.status}
                            onChange={(e) => handleQuickUpdateRoundStatus(r.id, e.target.value)}
                            style={{
                              padding: "2px 4px",
                              fontSize: "11px",
                              fontWeight: "bold",
                              backgroundColor: r.status === "voting" ? "#e2f0d9" : r.status === "open" ? "#dbeafe" : r.status === "draft" ? "#fff3cd" : "#f0f0f0",
                              color: r.status === "voting" ? "#276a3c" : r.status === "open" ? "#1d4ed8" : r.status === "draft" ? "#856404" : "#333",
                              border: "1px solid #999",
                              cursor: "pointer"
                            }}
                          >
                            {r.status === "draft" && (
                              <>
                                <option value="draft">DRAFT</option>
                                <option value="open">OPEN (Submissions)</option>
                              </>
                            )}
                            {r.status === "open" && (
                              <>
                                <option value="open">OPEN (Submissions)</option>
                                <option value="voting">VOTING (Active)</option>
                              </>
                            )}
                            {r.status === "voting" && (
                              <option value="voting">VOTING (Active)</option>
                            )}
                          </select>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center" }}>
                          {r.status === "draft" && (
                            <button
                              type="button"
                              className="action-btn"
                              onClick={() => handleQuickUpdateRoundStatus(r.id, "open")}
                              style={{ fontSize: "10px", padding: "1px 5px", backgroundColor: "#e2f0d9", color: "#276a3c", fontWeight: "bold" }}
                              title="Open round for submissions"
                            >
                              Open Submissions
                            </button>
                          )}
                          {r.status === "open" && (
                            <button
                              type="button"
                              className="action-btn"
                              onClick={() => handleQuickUpdateRoundStatus(r.id, "voting")}
                              style={{ fontSize: "10px", padding: "1px 5px", backgroundColor: "#e2f0d9", color: "#276a3c", fontWeight: "bold" }}
                              title="Publish approved finalists & open ballot voting"
                            >
                              Start Voting
                            </button>
                          )}
                          {r.status === "voting" && (
                            <button
                              type="button"
                              className="action-btn"
                              onClick={() => handleOpenFinalizeModal(r)}
                              style={{ fontSize: "10px", padding: "1px 5px", backgroundColor: "#e2f0d9", color: "#276a3c", fontWeight: "bold" }}
                              title="Finalize and certify results"
                            >
                              Finalize
                            </button>
                          )}
                          {r.status !== "finalized" && (
                            <button
                              type="button"
                              className="action-btn"
                              onClick={() => handleStartEditRound(r)}
                              style={{ fontSize: "10px", padding: "1px 5px" }}
                            >
                              Edit
                            </button>
                          )}
                          <button
                            type="button"
                            className="action-btn"
                            onClick={() => setViewingLedgerRound(r)}
                            style={{ fontSize: "10px", padding: "1px 5px", backgroundColor: "#f0f0f0" }}
                            title="View supervisor ballot ledger"
                          >
                            Ledger
                          </button>
                          {r.status !== "finalized" && (
                            <button
                              type="button"
                              className="action-btn"
                              onClick={() => handleDeleteRound(r.id, r.title)}
                              style={{ fontSize: "10px", padding: "1px 5px", backgroundColor: "#fde8e8", color: "#c00" }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </fieldset>

          {viewingLedgerRound && (
            <div style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000
            }}>
              <fieldset className="grab-box" style={{ backgroundColor: "#ffffff", maxWidth: "640px", width: "90%", maxHeight: "80vh", overflowY: "auto", borderColor: "#333", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                <legend style={{ fontWeight: "bold", color: "#276a3c" }}>Supervisor Ballot Ledger</legend>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div><strong>Round:</strong> {viewingLedgerRound.title} ({viewingLedgerRound.pollType === "binary" || viewingLedgerRound.scheme === "binary" ? "Binary 1-0" : "Ranked Choice 3-2-1"})</div>
                  <button
                    type="button"
                    className="action-btn"
                    onClick={() => setViewingLedgerRound(null)}
                    style={{ fontSize: "11px" }}
                  >
                    Close
                  </button>
                </div>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>
                  Live auditor records showing voter Discord IDs and recorded picks.
                </p>
                {adminLedgerLoading ? (
                  <div style={{ fontSize: "12px", color: "#666" }}>Loading ballots...</div>
                ) : !adminLedgerData || adminLedgerData.data.length === 0 ? (
                  <div style={{ fontSize: "12px", color: "#666" }}>No ballots recorded for this round.</div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="ledger-table" style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
                          <th style={{ padding: "4px 6px" }}>Discord User</th>
                          <th style={{ padding: "4px 6px" }}>Discord ID</th>
                          <th style={{ padding: "4px 6px" }}>Picks</th>
                          <th style={{ padding: "4px 6px", textAlign: "right" }}>Cast At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminLedgerData.data.map((row) => (
                          <tr key={`${row.discordId}-${row.castAt}`} style={{ borderBottom: "1px solid #eee" }}>
                            <td style={{ padding: "4px 6px", fontWeight: "bold" }}>@{row.discordUsername}</td>
                            <td style={{ padding: "4px 6px", fontFamily: "monospace", fontSize: "11px", color: "#555" }}>{row.discordId}</td>
                            <td style={{ padding: "4px 6px" }}>
                              {row.picks.map((pickId, idx) => (
                                <div key={pickId} style={{ fontSize: "11px" }}>
                                  {viewingLedgerRound.pollType === "binary" || viewingLedgerRound.scheme === "binary" ? "" : `${idx + 1}. `}{pickId}
                                </div>
                              ))}
                            </td>
                            <td style={{ padding: "4px 6px", textAlign: "right", whiteSpace: "nowrap", color: "#777", fontSize: "11px" }}>
                              {new Date(row.castAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </fieldset>
            </div>
          )}

          {finalizingRound && (
            <div style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000
            }}>
              <fieldset className="grab-box" style={{ backgroundColor: "#ffffff", maxWidth: "480px", width: "90%", borderColor: "#333", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                <legend style={{ fontWeight: "bold", color: "#856404" }}>Finalize & Certify Round</legend>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <strong>Round:</strong> {finalizingRound.title} ({finalizingRound.pollType === "binary" || finalizingRound.scheme === "binary" ? "Binary 1-0" : "Ranked Choice 3-2-1"})
                  </div>
                  <div style={{ fontSize: "12px", color: "#444", lineHeight: "1.4" }}>
                    Finalizing will permanently close ballot voting, calculate certified standings and leading separations, and record the winner into the permanent ledger.
                  </div>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", cursor: "pointer", fontWeight: "bold", marginTop: "4px" }}>
                    <input
                      type="checkbox"
                      checked={finalizeConfirmed}
                      onChange={(e) => setFinalizeConfirmed(e.target.checked)}
                      style={{ marginTop: "2px" }}
                    />
                    <span>I confirm that I want to finalize and certify this round. This action cannot be undone.</span>
                  </label>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "6px" }}>
                    <button
                      type="button"
                      className="action-btn"
                      onClick={() => { setFinalizingRound(null); setFinalizeConfirmed(false); }}
                      disabled={isFinalizing}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="action-btn"
                      disabled={!finalizeConfirmed || isFinalizing}
                      onClick={handleExecuteFinalizeRound}
                      style={{
                        backgroundColor: finalizeConfirmed ? "#e2f0d9" : "#f0f0f0",
                        color: finalizeConfirmed ? "#276a3c" : "#888",
                        fontWeight: "bold"
                      }}
                    >
                      {isFinalizing ? "Finalizing..." : "Certify & Finalize"}
                    </button>
                  </div>
                </div>
              </fieldset>
            </div>
          )}
        </div>
      )}

      {activeTab === "Pipeline" && (
        <fieldset className="grab-box" style={{ backgroundColor: "#ffffff" }}>
          <legend style={{ fontWeight: "bold" }}>Pipeline</legend>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span><strong>Step {currentStep.id}:</strong> {currentStep.title} ({currentStep.phaseTitle})</span>
            <span className="badge badge-active">{progressPercent}%</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <span style={{ fontSize: "11px" }}>0.1</span>
            <input
              type="range"
              min={0}
              max={FLAT_PIPELINE_STEPS.length - 1}
              value={stepIndex}
              onChange={(e) => setStepIndex(parseInt(e.target.value, 10))}
              style={{ flex: 1, cursor: "pointer" }}
            />
            <span style={{ fontSize: "11px" }}>6.4</span>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <label htmlFor="jump-sel" style={{ fontSize: "12px" }}><strong>Jump:</strong></label>
            <select
              id="jump-sel"
              value={stepIndex}
              onChange={(e) => setStepIndex(parseInt(e.target.value, 10))}
              style={{ padding: "2px 4px", fontSize: "12px", maxWidth: "340px" }}
            >
              {FLAT_PIPELINE_STEPS.map((s) => (
                <option key={s.globalIndex} value={s.globalIndex}>[{s.id}] {s.title}</option>
              ))}
            </select>
            <button
              type="button"
              className="action-btn"
              disabled={isUpdatingPipeline}
              onClick={handleSavePipeline}
              style={{ fontSize: "11px", backgroundColor: "#e2f0d9", color: "#276a3c", fontWeight: "bold" }}
            >
              {isUpdatingPipeline ? "Broadcasting..." : "Update Stage"}
            </button>
            {savedNotice && (
              <span style={{ color: "#276a3c", fontSize: "11px", fontWeight: "bold", marginLeft: "4px" }}>
                {savedNotice}
              </span>
            )}
          </div>
        </fieldset>
      )}
    </div>
  );
}

function TelemetrySection({
  rounds,
  activeRoundId,
  onSelectRound,
  telemetryList,
  telemetryLoading,
  leaderboardData,
  shotThreadMaps,
  shotsList
}: {
  rounds: Array<{ id: string; title: string; scheme?: string; pollType?: string; status: string }>;
  activeRoundId: string;
  onSelectRound: (id: string) => void;
  telemetryList: RaidTelemetry[];
  telemetryLoading: boolean;
  leaderboardData: LeaderboardData | null;
  shotThreadMaps: ShotThreadMap[];
  shotsList: Shot[];
}) {
  const [hovered, setHovered] = useState<RaidTelemetry | null>(null);

  const leaderboardItems = leaderboardData?.items || [];
  const totalBallots = leaderboardData?.totalBallots ?? 0;
  const totalPoints = leaderboardData?.totalPoints ?? 0;
  const isConserved = leaderboardData?.isConserved ?? true;
  const alertsCount = telemetryList.filter((t) => t.severity === "critical" || t.severity === "high").length;

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
        <label htmlFor="t-round"><strong>Round:</strong></label>
        <select
          id="t-round"
          value={activeRoundId}
          onChange={(e) => onSelectRound(e.target.value)}
          style={{ padding: "2px 4px", fontSize: "12px" }}
        >
          {rounds.map((r) => (
            <option key={r.id} value={r.id}>{r.title} ({r.scheme || r.pollType})</option>
          ))}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "12px" }}>
        <div style={{ padding: "8px", border: "1px solid var(--border-dark)", backgroundColor: "#ffffff" }}>
          <div style={{ fontSize: "10px", color: "#555" }}>ANOMALIES</div>
          <div style={{ fontSize: "16px", fontWeight: "bold", color: alertsCount > 0 ? "#c00" : "#276a3c" }}>
            {alertsCount > 0 ? `${alertsCount} Alerts` : "Normal"}
          </div>
        </div>
        <div style={{ padding: "8px", border: "1px solid var(--border-dark)", backgroundColor: "#ffffff" }}>
          <div style={{ fontSize: "10px", color: "#555" }}>CONSERVATION</div>
          <div style={{ fontSize: "16px", fontWeight: "bold", color: isConserved ? "#276a3c" : "#b8860b" }}>
            {isConserved ? "CONSERVED" : "VARIANCE"}
          </div>
          <div style={{ fontSize: "10px", color: "#777" }}>{totalPoints} pts / {totalBallots} ballots</div>
        </div>
        <div style={{ padding: "8px", border: "1px solid var(--border-dark)", backgroundColor: "#ffffff" }}>
          <div style={{ fontSize: "10px", color: "#555" }}>DISCORD THREADS</div>
          <div style={{ fontSize: "16px", fontWeight: "bold", color: "#3a75c4" }}>
            {shotThreadMaps.length} Synced
          </div>
        </div>
      </div>

      <fieldset className="grab-box" style={{ backgroundColor: "#ffffff", marginBottom: "12px" }}>
        <legend style={{ fontWeight: "bold" }}>Raid Defense</legend>
        {telemetryLoading ? (
          <p>Loading...</p>
        ) : (
          <div>
            <ScatterChart
              telemetryList={telemetryList}
              leaderboardItems={leaderboardItems}
              onHover={setHovered}
              hovered={hovered}
            />
            {hovered && (
              <div style={{ marginTop: "4px", fontSize: "11px" }}>
                <code>{hovered.entryId.slice(0, 8)}</code> &bull; Z: {hovered.velocityZScore.toFixed(2)} &bull; H: {hovered.rankEntropy.toFixed(3)} &bull; Skew: {hovered.skewRatio.toFixed(2)} &bull; <span className="badge">{hovered.severity}</span>
              </div>
            )}
          </div>
        )}
      </fieldset>

      <fieldset className="grab-box" style={{ backgroundColor: "#ffffff", marginBottom: "12px" }}>
        <legend style={{ fontWeight: "bold" }}>Standings</legend>
        {leaderboardItems.length === 0 ? (
          <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>No score entries.</p>
        ) : (
          <ShrinkageChart items={leaderboardItems} />
        )}
      </fieldset>

        <fieldset className="grab-box" style={{ backgroundColor: "#ffffff", marginBottom: "12px" }}>
          <legend style={{ fontWeight: "bold" }}>Discord Threads</legend>
          {shotThreadMaps.length === 0 ? (
            <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>No thread mappings.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Shot</th>
                  <th>Title</th>
                  <th>Snowflake</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {shotThreadMaps.map((m) => {
                  const s = shotsList.find((x) => x.id === m.shotId);
                  return (
                    <tr key={m.shotId}>
                      <td><code>{m.shotId.slice(0, 8)}</code></td>
                      <td><strong>{s?.title || "Shot"}</strong></td>
                      <td><code>{m.discordThreadId}</code></td>
                      <td><span className="badge badge-active">SYNCED</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </fieldset>

        <NetworkEndpointMonitor />
      </div>
    );
  }

  function NetworkEndpointMonitor() {
    const [isStreaming, setIsStreaming] = useState(true);
    const [isPinging, setIsPinging] = useState(false);
    const [latencyData, setLatencyData] = useState<Record<string, { current: number | null; history: number[]; status: string; http: number | null }>>({
      "api-live": { current: null, history: [], status: "probing", http: null },
      "postgres-db": { current: null, history: [], status: "probing", http: null },
      "redis-cache": { current: null, history: [], status: "probing", http: null },
      "cluster-ready": { current: null, history: [], status: "probing", http: null },
      "voting-rounds": { current: null, history: [], status: "probing", http: null },
      "grabbox-tasks": { current: null, history: [], status: "probing", http: null },
      "auth-session": { current: null, history: [], status: "probing", http: null },
      "legal-docs": { current: null, history: [], status: "probing", http: null }
    });

    const runPings = async () => {
      setIsPinging(true);
      const targets = [
        { id: "api-live", path: "/api/v1/health/live" },
        { id: "postgres-db", path: "/api/v1/health/detailed" },
        { id: "redis-cache", path: "/api/v1/health/detailed" },
        { id: "cluster-ready", path: "/api/v1/health/ready" },
        { id: "voting-rounds", path: "/api/v1/rounds?page=1&perPage=1" },
        { id: "grabbox-tasks", path: "/api/v1/shots?status=available&page=1&perPage=1" },
        { id: "auth-session", path: "/api/v1/users/me" },
        { id: "legal-docs", path: "/api/v1/documents/terms" }
      ];

      await Promise.allSettled(
        targets.map(async (t) => {
          const start = performance.now();
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 3000);
            const res = await fetch(t.path, { cache: "no-store", signal: controller.signal });
            clearTimeout(timer);
            const elapsed = Math.round(performance.now() - start);

            let measured = elapsed;
            if ((t.id === "postgres-db" || t.id === "redis-cache") && res.ok) {
              try {
                const json = await res.clone().json();
                if (t.id === "postgres-db" && json?.database?.latencyMs) measured = Number(json.database.latencyMs);
                if (t.id === "redis-cache" && json?.redis?.latencyMs) measured = Number(json.redis.latencyMs);
              } catch {}
            }

            const status = !res.ok ? "down" : measured > 350 ? "degraded" : "operational";
            setLatencyData((prev) => {
              const currentHist = prev[t.id]?.history || [];
              return {
                ...prev,
                [t.id]: {
                  current: measured,
                  history: [...currentHist, measured].slice(-16),
                  status,
                  http: res.status
                }
              };
            });
          } catch {
            const elapsed = Math.round(performance.now() - start);
            setLatencyData((prev) => {
              const currentHist = prev[t.id]?.history || [];
              return {
                ...prev,
                [t.id]: {
                  current: elapsed,
                  history: [...currentHist, elapsed].slice(-16),
                  status: "down",
                  http: null
                }
              };
            });
          }
        })
      );
      setIsPinging(false);
    };

    useEffect(() => {
      void runPings();
    }, []);

    useEffect(() => {
      if (!isStreaming) return;
      const interval = setInterval(() => {
        void runPings();
      }, 2500);
      return () => clearInterval(interval);
    }, [isStreaming]);

    const targetMeta = [
      { id: "api-live", name: "API Core Gateway", tag: "CORE CONTAINER", group: "Infrastructure", desc: "HTTP event loop & process liveness" },
      { id: "postgres-db", name: "PostgreSQL Database", tag: "PRIMARY DATASTORE", group: "Infrastructure", desc: "Connection pool & query latency" },
      { id: "redis-cache", name: "Redis Store", tag: "KEY-VALUE CACHE", group: "Infrastructure", desc: "In-memory cache & session store" },
      { id: "cluster-ready", name: "Cluster Readiness", tag: "BACKEND READINESS", group: "Infrastructure", desc: "Service mesh & backend status" },
      { id: "voting-rounds", name: "Voting Rounds Feed", tag: "PUBLIC VOTING", group: "Public Outlets", desc: "Active election queries" },
      { id: "grabbox-tasks", name: "Grab-Box Tasks Feed", tag: "PUBLIC WORK", group: "Public Outlets", desc: "Open grabbox work queue" },
      { id: "auth-session", name: "Session Gateway", tag: "AUTH & IDENTITY", group: "Public Outlets", desc: "Auth token validation" },
      { id: "legal-docs", name: "Legal Documents", tag: "STATIC CACHE", group: "Public Outlets", desc: "Terms & guidelines publication" }
    ];

    return (
      <fieldset className="grab-box" style={{ backgroundColor: "#ffffff" }}>
        <legend style={{ fontWeight: "bold" }}>API Endpoints & Infrastructure Responsiveness</legend>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Streaming live diagnostic (2.5s cadence) across infrastructure and public HTTP outlets.
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              className="action-btn"
              onClick={() => setIsStreaming((prev) => !prev)}
              style={{ fontSize: "11px", padding: "2px 8px" }}
            >
              {isStreaming ? "⏸ Pause Stream" : "▶ Resume Stream"}
            </button>
            <button
              type="button"
              className="action-btn"
              disabled={isPinging}
              onClick={runPings}
              style={{ fontSize: "11px", padding: "2px 8px" }}
            >
              {isPinging ? "Pinging..." : "🔄 Ping Now"}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "8px" }}>
          {targetMeta.map((t) => {
            const data = latencyData[t.id];
            const hist = data?.history || [];
            const isOperational = data?.status === "operational";
            const isDegraded = data?.status === "degraded";
            const isDown = data?.status === "down";

            const badgeBg = isDown ? "#fde8e8" : isDegraded ? "#fff3cd" : "#e2f0d9";
            const badgeColor = isDown ? "#c00" : isDegraded ? "#856404" : "#276a3c";
            const strokeColor = isDown ? "#c00" : isDegraded ? "#b8860b" : "#276a3c";

            const maxH = Math.max(80, ...hist) * 1.2;
            const pts = hist.map((val, idx) => {
              const x = 5 + (idx / Math.max(1, hist.length - 1)) * 190;
              const y = 35 - (Math.min(val, maxH) / maxH) * 28;
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            }).join(" ");

            return (
              <div
                key={t.id}
                style={{
                  border: "1px solid var(--border-dark)",
                  padding: "8px",
                  backgroundColor: "#faf9f6",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "12px" }}>{t.name}</strong>
                  <span
                    style={{
                      fontSize: "9px",
                      padding: "1px 4px",
                      borderRadius: "2px",
                      backgroundColor: badgeBg,
                      color: badgeColor,
                      fontWeight: "bold",
                      textTransform: "uppercase"
                    }}
                  >
                    {data?.status || "probing"}
                  </span>
                </div>
                <div style={{ fontSize: "10px", color: "#666" }}>{t.desc}</div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "4px 0" }}>
                  <div>
                    <span style={{ fontSize: "10px", color: "#777" }}>LATENCY: </span>
                    <strong style={{ fontSize: "14px", fontFamily: "monospace", color: badgeColor }}>
                      {data?.current !== null ? `${data.current} ms` : "–"}
                    </strong>
                  </div>
                  <div style={{ fontSize: "10px", color: "#555", fontFamily: "monospace" }}>
                    HTTP: {data?.http !== null ? data.http : "–"}
                  </div>
                </div>

                {hist.length >= 2 ? (
                  <svg viewBox="0 0 200 40" style={{ width: "100%", height: "36px", backgroundColor: "#ffffff", border: "1px solid #ddd" }}>
                    <polyline fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" points={pts} />
                  </svg>
                ) : (
                  <div style={{ height: "36px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#999", border: "1px dashed #ddd" }}>
                    Gathering latency…
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#888", fontFamily: "monospace", marginTop: "2px" }}>
                  <span>{t.tag}</span>
                  <span>{t.group}</span>
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>
    );
  }

function ScatterChart({
  telemetryList,
  leaderboardItems,
  onHover,
  hovered
}: {
  telemetryList: RaidTelemetry[];
  leaderboardItems: Array<{ entryId: string; title: string; rawScore: number }>;
  onHover: (item: RaidTelemetry | null) => void;
  hovered: RaidTelemetry | null;
}) {
  const width = 600;
  const height = 220;
  const padding = 35;
  const minX = -2, maxX = 8;
  const minY = 0.0, maxY = 1.0;

  const scaleX = (val: number) => padding + ((val - minX) / (maxX - minX)) * (width - 2 * padding);
  const scaleY = (val: number) => height - padding - ((val - minY) / (maxY - minY)) * (height - 2 * padding);

  const points: RaidTelemetry[] = telemetryList.length > 0
    ? telemetryList
    : leaderboardItems.map((item, idx) => ({
        id: `syn-${idx}`,
        entryId: item.entryId,
        roundId: "active",
        compositeScore: 0.1,
        severity: "normal",
        skewRatio: 1.0,
        rankEntropy: 0.75 - idx * 0.05,
        velocityZScore: 0.5 + idx * 0.3,
        flags: [],
        breakdown: {
          entryId: item.entryId,
          rankCounts: [1, 1, 0],
          appearanceCount: 2,
          rawScore: item.rawScore,
          voteSharePercentage: 20
        },
        createdAt: new Date().toISOString()
      }));

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", maxHeight: "240px", backgroundColor: "#faf9f6", border: "1px solid var(--border-dark)" }}>
        <rect
          x={scaleX(2.5)}
          y={scaleY(0.35)}
          width={scaleX(maxX) - scaleX(2.5)}
          height={scaleY(0.0) - scaleY(0.35)}
          fill="#fde8e8"
          opacity={0.6}
        />
        <text x={scaleX(maxX) - 4} y={scaleY(0.0) - 6} textAnchor="end" fontSize="9" fill="#c00" fontWeight="bold">
          THREAT ZONE (Z &gt; 2.5, H &lt; 0.35)
        </text>

        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#666" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#666" />

        {[-2, 0, 2, 4, 6, 8].map((t) => (
          <g key={t}>
            <line x1={scaleX(t)} y1={height - padding} x2={scaleX(t)} y2={height - padding + 3} stroke="#666" />
            <text x={scaleX(t)} y={height - padding + 12} fontSize="9" textAnchor="middle" fill="#555">{t}</text>
          </g>
        ))}

        {[0.0, 0.5, 1.0].map((t) => (
          <g key={t}>
            <line x1={padding - 3} y1={scaleY(t)} x2={padding} y2={scaleY(t)} stroke="#666" />
            <text x={padding - 6} y={scaleY(t) + 3} fontSize="9" textAnchor="end" fill="#555">{t.toFixed(1)}</text>
          </g>
        ))}

        <text x={width / 2} y={height - 4} fontSize="10" textAnchor="middle" fill="#333">Velocity Z-Score &rarr;</text>
        <text x={-height / 2} y={12} transform="rotate(-90)" fontSize="10" textAnchor="middle" fill="#333">Entropy &rarr;</text>

        {points.map((p) => {
          const cx = scaleX(p.velocityZScore);
          const cy = scaleY(p.rankEntropy);
          const isSel = hovered?.entryId === p.entryId;
          const color = p.severity === "critical" ? "#c00" : p.severity === "high" ? "#d97706" : p.severity === "elevated" ? "#3a75c4" : "#276a3c";

          return (
            <g key={p.entryId} onMouseEnter={() => onHover(p)} onMouseLeave={() => onHover(null)} style={{ cursor: "pointer" }}>
              <circle cx={cx} cy={cy} r={isSel ? 6 : 4} fill={color} stroke="#111" strokeWidth={isSel ? 2 : 1} />
              <text x={cx + 6} y={cy + 3} fontSize="9" fill="#222">{p.entryId.slice(0, 6)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ShrinkageChart({
  items
}: {
  items: Array<{ entryId: string; title: string; rawScore: number; regularizedMeanScore?: number | null }>;
}) {
  const width = 600;
  const height = 200;
  const padding = 35;
  const maxRaw = Math.max(...items.map((i) => i.rawScore), 10);
  const maxReg = Math.max(...items.map((i) => i.regularizedMeanScore ?? i.rawScore), 10);
  const maxVal = Math.max(maxRaw, maxReg) * 1.15;

  const scaleX = (val: number) => padding + (val / maxVal) * (width - 2 * padding);
  const scaleY = (val: number) => height - padding - (val / maxVal) * (height - 2 * padding);

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", maxHeight: "220px", backgroundColor: "#faf9f6", border: "1px solid var(--border-dark)" }}>
        <line x1={scaleX(0)} y1={scaleY(0)} x2={scaleX(maxVal)} y2={scaleY(maxVal)} stroke="#bbb" strokeDasharray="3 3" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#666" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#666" />

        <text x={width / 2} y={height - 4} fontSize="10" textAnchor="middle" fill="#333">Raw Points &rarr;</text>
        <text x={-height / 2} y={12} transform="rotate(-90)" fontSize="10" textAnchor="middle" fill="#333">Regularized Mean &rarr;</text>

        {items.map((item) => {
          const x = scaleX(item.rawScore);
          const y = scaleY(item.regularizedMeanScore ?? item.rawScore);
          return (
            <g key={item.entryId}>
              <line x1={x} y1={scaleY(item.rawScore)} x2={x} y2={y} stroke="#3a75c4" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx={x} cy={y} r={4} fill="#276a3c" stroke="#111" />
              <text x={x + 5} y={y + 3} fontSize="9" fill="#222">
                {item.title.length > 12 ? item.title.slice(0, 12) + ".." : item.title}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
