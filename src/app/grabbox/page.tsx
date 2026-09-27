"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchShots, claimShot, releaseShot } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface LiveShot {
  id: string;
  shotCode?: string;
  sceneNumber?: number;
  title: string;
  description?: string;
  difficultyTier?: string;
  tierDays?: number;
  status: "available" | "claimed" | "submitted" | "approved";
  claimer?: {
    id: string;
    username: string;
    avatarUrl?: string;
  } | null;
  claimedAt?: string;
  deadlineAt?: string;
  createdAt: string;
}

interface UploadResponse {
  data: {
    key: string;
    method: string;
    url: string;
    headers: Record<string, string>;
    expiresAt: string;
  };
}

function GrabBoxContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user, login } = useAuth();
  const targetShotId = searchParams.get("shotId");

  const [filter, setFilter] = useState<string>("all");
  const [activeModalShot, setActiveModalShot] = useState<LiveShot | null>(null);

  // claim modal state
  const [claimingShot, setClaimingShot] = useState<LiveShot | null>(null);
  const [hasAcknowledgedCommitment, setHasAcknowledgedCommitment] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccessMessage, setClaimSuccessMessage] = useState<string | null>(null);

  // upload form state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [blendFile, setBlendFile] = useState<File | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: shotsData, isLoading } = useQuery({
    queryKey: ["shots"],
    queryFn: fetchShots
  });

  const shots = (shotsData?.data || []) as unknown as LiveShot[];

  // auto-open submission modal if navigated via discord link ?shotId=...
  useEffect(() => {
    if (targetShotId && shots.length > 0) {
      const match = shots.find((s) => s.id === targetShotId);
      if (match && (match.status === "claimed" || match.status === "submitted")) {
        setActiveModalShot(match);
      }
    }
  }, [targetShotId, shots]);

  const availableCount = shots.filter((s) => s.status === "available").length;
  const claimedCount = shots.filter((s) => s.status === "claimed").length;
  const submittedCount = shots.filter((s) => s.status === "submitted").length;
  const approvedCount = shots.filter((s) => s.status === "approved").length;

  const filteredShots = shots.filter((s) => {
    if (filter === "all") return true;
    return s.status === filter;
  });

  const formatDate = (iso?: string) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return iso;
    }
  };

  const handleOpenClaimModal = (shot: LiveShot) => {
    if (!user) {
      login();
      return;
    }
    setClaimingShot(shot);
    setHasAcknowledgedCommitment(false);
    setClaimError(null);
  };

  const handleCloseClaimModal = () => {
    if (isClaiming) return;
    setClaimingShot(null);
    setHasAcknowledgedCommitment(false);
    setClaimError(null);
  };

  const handleConfirmClaim = async () => {
    if (!claimingShot) return;
    if (!hasAcknowledgedCommitment) {
      setClaimError("Please check the confirmation box acknowledging your professional commitment.");
      return;
    }

    setIsClaiming(true);
    setClaimError(null);

    try {
      await claimShot(claimingShot.id);
      setClaimSuccessMessage(`Successfully claimed [${claimingShot.shotCode || claimingShot.title}]! It has been assigned to you.`);
      queryClient.invalidateQueries({ queryKey: ["shots"] });
      setClaimingShot(null);
      setTimeout(() => setClaimSuccessMessage(null), 4000);
    } catch (err: unknown) {
      setClaimError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsClaiming(false);
    }
  };

  const handleReleaseShot = async (shot: LiveShot) => {
    const reason = window.prompt("Optional reason for releasing this task back to the Grab-Box:");
    try {
      await releaseShot(shot.id, reason || null);
      queryClient.invalidateQueries({ queryKey: ["shots"] });
      alert("Task released back to the Grab-Box pool.");
    } catch (err: unknown) {
      alert(`Error releasing task: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleOpenModal = (shot: LiveShot) => {
    setActiveModalShot(shot);
    setVideoFile(null);
    setBlendFile(null);
    setNotes("");
    setUploadStatus(null);
    setUploadError(null);
  };

  const handleCloseModal = () => {
    if (isUploading) return;
    setActiveModalShot(null);
  };

  const handleDirectUploadAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalShot) return;
    if (!videoFile) {
      setUploadError("Please select a rendered video file (.mp4, .webm, or .mov).");
      return;
    }

    const token = localStorage.getItem("stairway_token");
    if (!token) {
      setUploadError("You must be logged in with Discord to submit deliverables.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // step 1: request presigned upload url for video deliverable
      setUploadStatus("1/3 Requesting video upload credentials...");
      const videoRes = await fetch(`/api/v1/shots/${activeModalShot.id}/uploads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          kind: "video",
          fileName: videoFile.name,
          contentType: videoFile.type || "video/mp4",
          sizeBytes: videoFile.size
        })
      });

      if (!videoRes.ok) {
        const err = await videoRes.json().catch(() => null);
        throw new Error(err?.detail || `Video upload authorization failed (${videoRes.status})`);
      }

      const videoData = (await videoRes.json()) as UploadResponse;
      const videoKey = videoData.data.key;
      const videoUploadUrl = videoData.data.url;

      // step 2: direct s3 upload for video
      setUploadStatus("2/3 Uploading video render directly to storage...");
      const s3VideoRes = await fetch(videoUploadUrl, {
        method: videoData.data.method || "PUT",
        headers: videoData.data.headers || {},
        body: videoFile
      });

      if (!s3VideoRes.ok) {
        throw new Error(`Direct storage upload for video failed (${s3VideoRes.status}).`);
      }

      // step 3: optional blend upload
      let blendKey: string | null = null;
      if (blendFile) {
        setUploadStatus("Uploading Blender project file directly to storage...");
        const blendRes = await fetch(`/api/v1/shots/${activeModalShot.id}/uploads`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            kind: "blend",
            fileName: blendFile.name,
            contentType: "application/octet-stream",
            sizeBytes: blendFile.size
          })
        });

        if (!blendRes.ok) {
          const err = await blendRes.json().catch(() => null);
          throw new Error(err?.detail || `Project file authorization failed (${blendRes.status})`);
        }

        const blendData = (await blendRes.json()) as UploadResponse;
        blendKey = blendData.data.key;

        const s3BlendRes = await fetch(blendData.data.url, {
          method: blendData.data.method || "PUT",
          headers: blendData.data.headers || {},
          body: blendFile
        });

        if (!s3BlendRes.ok) {
          throw new Error(`Direct storage upload for project file failed (${s3BlendRes.status}).`);
        }
      }

      // step 4: register submission in platform ledger
      setUploadStatus("3/3 Finalizing submission in production ledger...");
      const submitRes = await fetch(`/api/v1/shots/${activeModalShot.id}/submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          videoKey,
          blendKey,
          notes: notes.trim() || null
        })
      });

      if (!submitRes.ok) {
        const err = await submitRes.json().catch(() => null);
        throw new Error(err?.detail || `Failed to register submission (${submitRes.status})`);
      }

      setUploadStatus("Submission successfully registered! A supervisor will review it.");
      queryClient.invalidateQueries({ queryKey: ["shots"] });
      setTimeout(() => {
        setIsUploading(false);
        setActiveModalShot(null);
      }, 1500);
    } catch (err: unknown) {
      setIsUploading(false);
      setUploadError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div>
      <h1>Grab-Box</h1>

      {claimSuccessMessage && (
        <div style={{ padding: "8px 12px", marginBottom: "12px", backgroundColor: "#e2f0d9", border: "1px solid #276a3c", color: "#276a3c", fontSize: "13px", fontWeight: "bold" }}>
          &check; {claimSuccessMessage}
        </div>
      )}

      {/* filter status box */}
      <fieldset className="grab-box">
        <legend>Filter</legend>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", fontSize: "12px" }}>
          <label htmlFor="status-filter"><strong>Filter:</strong></label>
          <select
            id="status-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: "2px 6px", fontSize: "12px" }}
          >
            <option value="all">All Tasks ({shots.length})</option>
            <option value="available">Available ({availableCount})</option>
            <option value="claimed">Claimed ({claimedCount})</option>
            <option value="submitted">In Review ({submittedCount})</option>
            <option value="approved">Approved ({approvedCount})</option>
          </select>

          <span style={{ marginLeft: "auto", fontSize: "11px", color: "#555" }}>
            Available: <strong>{availableCount}</strong> &bull; Claimed: <strong>{claimedCount}</strong> &bull; Review: <strong>{submittedCount}</strong> &bull; Approved: <strong>{approvedCount}</strong>
          </span>
        </div>
      </fieldset>

      <h2>Tasks</h2>

      {isLoading ? (
        <p>Loading Grab-Box tasks from database...</p>
      ) : filteredShots.length === 0 ? (
        <fieldset className="grab-box" style={{ backgroundColor: "#ffffff" }}>
          <p style={{ margin: 0 }}>No tasks found for the selected filter.</p>
        </fieldset>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredShots.map((shot) => {
            const isTarget = targetShotId === shot.id;
            const isClaimedByMe = user && shot.claimer?.id === user.id;

            return (
              <fieldset
                key={shot.id}
                className="grab-box"
                style={{
                  backgroundColor: isTarget ? "#fffde8" : "#ffffff",
                  borderColor: isTarget ? "#b8860b" : "#808080",
                  padding: "12px 16px"
                }}
              >
                <legend style={{ fontWeight: "bold", fontSize: "13px" }}>
                  [{shot.shotCode || shot.id.slice(0, 8)}] &bull; Scene {shot.sceneNumber || 1} &bull; {shot.difficultyTier?.toUpperCase()} ({shot.tierDays ? `${shot.tierDays}d` : "Standard"})
                </legend>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 300px" }}>
                    <h3 style={{ margin: "0 0 6px 0", fontSize: "16px" }}>{shot.title}</h3>
                    {shot.description && (
                      <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#444", whiteSpace: "pre-wrap" }}>
                        {shot.description}
                      </p>
                    )}
                    <div style={{ fontSize: "11px", color: "#666", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                      <span><strong>Created:</strong> {formatDate(shot.createdAt)}</span>
                      {shot.claimedAt && <span><strong>Claimed:</strong> {formatDate(shot.claimedAt)}</span>}
                      {shot.deadlineAt && <span><strong>Due:</strong> {formatDate(shot.deadlineAt)}</span>}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", minWidth: "180px" }}>
                    <span
                      className={`badge ${
                        shot.status === "available"
                          ? "badge-active"
                          : shot.status === "claimed"
                          ? "badge-closed"
                          : "badge-admin"
                      }`}
                      style={{ fontSize: "11px", padding: "2px 8px" }}
                    >
                      {shot.status.toUpperCase()}
                    </span>

                    {shot.claimer ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                        {shot.claimer.avatarUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={shot.claimer.avatarUrl}
                            alt={shot.claimer.username}
                            style={{ width: "18px", height: "18px", border: "1px solid #808080" }}
                          />
                        )}
                        <span><strong>Claimant:</strong> @{shot.claimer.username}</span>
                      </div>
                    ) : (
                      <em style={{ color: "#777", fontSize: "11px" }}>Open in Grab-Box</em>
                    )}

                    {/* claim button for available shots */}
                    {shot.status === "available" && (
                      <button
                        type="button"
                        className="action-btn"
                        onClick={() => handleOpenClaimModal(shot)}
                        style={{ marginTop: "6px", fontWeight: "bold", backgroundColor: "#e2f0d9", color: "#276a3c" }}
                      >
                        &plus; Claim Task
                      </button>
                    )}

                    {/* submit deliverables button */}
                    {(shot.status === "claimed" || shot.status === "submitted") && (
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {isClaimedByMe && shot.status === "claimed" && (
                          <button
                            type="button"
                            className="action-btn"
                            onClick={() => handleReleaseShot(shot)}
                            style={{ marginTop: "6px", fontSize: "11px", color: "#c00" }}
                          >
                            Release
                          </button>
                        )}
                        <button
                          type="button"
                          className="action-btn"
                          onClick={() => handleOpenModal(shot)}
                          style={{ marginTop: "6px", fontWeight: "bold" }}
                        >
                          Submit Work
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </fieldset>
            );
          })}
        </div>
      )}

      {/* serious & professional claim reconsideration modal */}
      {claimingShot && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            zIndex: 1000
          }}
        >
          <div
            className="container"
            style={{
              maxWidth: "540px",
              width: "100%",
              boxShadow: "4px 4px 0px rgba(0,0,0,0.5)",
              position: "relative",
              backgroundColor: "#f5f3eb"
            }}
          >
            <h2 style={{ color: "#800000", margin: "0 0 4px 0" }}>
              Claim Task
            </h2>
            <div style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "10px" }}>
              [{claimingShot.shotCode || claimingShot.id.slice(0, 8)}] {claimingShot.title}
            </div>

            <fieldset className="grab-box" style={{ backgroundColor: "#ffffff", borderColor: "#b8860b", marginBottom: "12px" }}>
              <legend style={{ fontWeight: "bold", color: "#8b6508" }}>Advisory</legend>
              <p style={{ fontSize: "12px", margin: "0 0 8px 0", color: "#222", lineHeight: "1.4" }}>
                Please reconsider this claim with the utmost <strong>seriousness and professionality</strong>:
              </p>
              <ul style={{ fontSize: "12px", margin: "0 0 8px 0", paddingLeft: "20px", color: "#333", display: "flex", flexDirection: "column", gap: "5px" }}>
                <li>
                  <strong>Exclusive Pipeline Lock:</strong> Claiming this task reserves it exclusively for you and prevents other studio artists from contributing to it.
                </li>
                <li>
                  <strong>Strict Deadline Commitment:</strong> You are committing to deliver high-quality work within the allotted timeframe (<strong>{claimingShot.tierDays || 3} days</strong>).
                </li>
                <li>
                  <strong>Single Claim Limit:</strong> You may only hold <strong>one active claim</strong> across the studio pipeline at a time.
                </li>
                <li>
                  <strong>Production Standards:</strong> Deliverables must adhere strictly to technical naming conventions, geometry topology, and clean render formats (.mp4 / .blend).
                </li>
                <li>
                  <strong>Duty to Release:</strong> If blockers or scheduling conflicts prevent timely completion, you have a professional duty to release the task immediately back to the grab-box.
                </li>
              </ul>
            </fieldset>

            <div style={{ marginBottom: "12px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <input
                id="claim-acknowledge"
                type="checkbox"
                checked={hasAcknowledgedCommitment}
                onChange={(e) => setHasAcknowledgedCommitment(e.target.checked)}
                style={{ marginTop: "3px", cursor: "pointer" }}
              />
              <label htmlFor="claim-acknowledge" style={{ fontSize: "12px", cursor: "pointer", fontWeight: "bold", color: "#1a1a1a" }}>
                I understand the production timeline and solemnly commit to delivering professional work within the deadline.
              </label>
            </div>

            {claimError && (
              <div style={{ padding: "6px 10px", marginBottom: "10px", backgroundColor: "#fde8e8", border: "1px solid #c00", color: "#c00", fontSize: "12px", fontWeight: "bold" }}>
                &cross; {claimError}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="action-btn"
                disabled={isClaiming}
                onClick={handleCloseClaimModal}
              >
                Reconsider & Cancel
              </button>
              <button
                type="button"
                className="action-btn"
                disabled={isClaiming || !hasAcknowledgedCommitment}
                onClick={handleConfirmClaim}
                style={{
                  fontWeight: "bold",
                  backgroundColor: hasAcknowledgedCommitment ? "#e2f0d9" : "#dfdbd1",
                  color: hasAcknowledgedCommitment ? "#276a3c" : "#888"
                }}
              >
                {isClaiming ? "Assigning Task..." : "Confirm & Claim Task"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* submission modal */}
      {activeModalShot && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            zIndex: 1000
          }}
        >
          <div
            className="container"
            style={{
              maxWidth: "520px",
              width: "100%",
              boxShadow: "4px 4px 0px rgba(0,0,0,0.4)",
              position: "relative"
            }}
          >
            <h2>Submit Deliverable</h2>
            <p style={{ fontSize: "12px", color: "#555", marginTop: "2px" }}>
              Task: <strong>{activeModalShot.title}</strong>
            </p>

            {!user ? (
              <fieldset className="grab-box" style={{ backgroundColor: "#fffbe6" }}>
                <legend>Authentication</legend>
                <p style={{ margin: "0 0 8px 0", fontSize: "12px" }}>
                  You must be authenticated with Discord as the task claimant or supervisor to upload deliverables.
                </p>
                <button type="button" className="action-btn" onClick={login}>
                  Log in with Discord
                </button>
                <button
                  type="button"
                  className="action-btn"
                  onClick={handleCloseModal}
                  style={{ marginLeft: "8px" }}
                >
                  Cancel
                </button>
              </fieldset>
            ) : (
              <form onSubmit={handleDirectUploadAndSubmit}>
                <fieldset className="grab-box" style={{ backgroundColor: "#ffffff" }}>
                  <legend>Deliverable Files</legend>

                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>
                      Rendered Video (.mp4, .webm, .mov) *
                    </label>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      disabled={isUploading}
                      required
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      style={{ fontSize: "12px", width: "100%" }}
                    />
                    <small style={{ color: "#666", fontSize: "10px" }}>
                      Uploaded directly to secure storage. No Discord file size limits.
                    </small>
                  </div>

                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>
                      Project File (.blend) (Optional)
                    </label>
                    <input
                      type="file"
                      accept=".blend,application/octet-stream"
                      disabled={isUploading}
                      onChange={(e) => setBlendFile(e.target.files?.[0] || null)}
                      style={{ fontSize: "12px", width: "100%" }}
                    />
                  </div>

                  <div style={{ marginBottom: "8px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>
                      Notes for Supervisor / Reviewer (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      disabled={isUploading}
                      maxLength={2000}
                      placeholder="Mention any variations, sound adjustments, or feedback..."
                      onChange={(e) => setNotes(e.target.value)}
                      style={{ width: "100%", fontSize: "12px", padding: "4px" }}
                    />
                  </div>
                </fieldset>

                {uploadStatus && (
                  <p style={{ fontSize: "12px", color: "#006600", fontWeight: "bold", margin: "8px 0" }}>
                    {uploadStatus}
                  </p>
                )}

                {uploadError && (
                  <p style={{ fontSize: "12px", color: "#cc0000", fontWeight: "bold", margin: "8px 0" }}>
                    Error: {uploadError}
                  </p>
                )}

                <div style={{ display: "flex", gap: "8px", marginTop: "12px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="action-btn"
                    disabled={isUploading}
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="action-btn"
                    disabled={isUploading || !videoFile}
                    style={{ fontWeight: "bold", backgroundColor: "#e2f0d9" }}
                  >
                    {isUploading ? "Uploading..." : "Start Upload & Submit"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GrabBoxPage() {
  return (
    <Suspense fallback={<p>Loading Grab-Box...</p>}>
      <GrabBoxContent />
    </Suspense>
  );
}
