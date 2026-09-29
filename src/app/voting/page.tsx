"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchRounds, fetchRoundEntries, createRoundEntry, castBallot, uploadEntryMedia, Entry } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function VotingPage() {
  const queryClient = useQueryClient();
  const { user, login } = useAuth();
  const [selectedRoundId, setSelectedRoundId] = useState<string>("");

  // ballot ranking state
  const [picks, setPicks] = useState<{ [entryId: string]: number }>({});
  const [ballotStatus, setBallotStatus] = useState<string | null>(null);
  const [isSubmittingBallot, setIsSubmittingBallot] = useState<boolean>(false);

  // entry submission form state
  const [entryTitle, setEntryTitle] = useState<string>("");
  const [entryDescription, setEntryDescription] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmittingEntry, setIsSubmittingEntry] = useState<boolean>(false);
  const [entrySubmitSuccess, setEntrySubmitSuccess] = useState<string | null>(null);
  const [entrySubmitError, setEntrySubmitError] = useState<string | null>(null);

  const { data: roundsData, isLoading: roundsLoading } = useQuery({
    queryKey: ["rounds"],
    queryFn: fetchRounds
  });

  const rounds = roundsData?.data || [];
  const activeRounds = rounds.filter((r) => r.status === "active" || r.status === "open" || r.status === "draft");
  const activeRoundId = selectedRoundId || activeRounds[0]?.id || rounds[0]?.id || "";
  const activeRound = rounds.find((r) => r.id === activeRoundId);

  const { data: entriesData, isLoading: entriesLoading } = useQuery({
    queryKey: ["entries", activeRoundId],
    queryFn: () => fetchRoundEntries(activeRoundId),
    enabled: Boolean(activeRoundId)
  });

  const entries = (entriesData?.data || []) as Entry[];

  const isTitleValid = entryTitle.trim().length > 0 && entryTitle.trim().length <= 75;
  const isDescriptionValid = entryDescription.length <= 250;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFileError(null);
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFileError(`File is ${(file.size / (1024 * 1024)).toFixed(2)} MB. Maximum upload size is 5 MB.`);
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const setRank = (entryId: string, rank: number) => {
    setPicks((prev) => {
      const next = { ...prev };
      if (next[entryId] === rank) {
        delete next[entryId];
        return next;
      }
      for (const [k, v] of Object.entries(next)) {
        if (v === rank && k !== entryId) {
          delete next[k];
        }
      }
      next[entryId] = rank;
      return next;
    });
  };

  const handleCastBallot = async () => {
    if (!activeRoundId) return;
    const sortedPicks = Object.entries(picks)
      .sort((a, b) => a[1] - b[1])
      .map(([entryId]) => entryId);

    if (sortedPicks.length === 0) {
      alert("Please rank at least one candidate before casting your ballot.");
      return;
    }

    setIsSubmittingBallot(true);
    setBallotStatus(null);
    try {
      await castBallot(activeRoundId, sortedPicks);
      setBallotStatus("Ballot successfully certified and cast in live studio ledger!");
      setPicks({});
      queryClient.invalidateQueries({ queryKey: ["leaderboard", activeRoundId] });
    } catch (err: unknown) {
      setBallotStatus(`Error casting ballot: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmittingBallot(false);
    }
  };

  const handleProposeEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoundId || !isTitleValid || !isDescriptionValid) return;

    setIsSubmittingEntry(true);
    setEntrySubmitSuccess(null);
    setEntrySubmitError(null);

    try {
      let mediaKey: string | null = null;
      if (selectedFile) {
        try {
          mediaKey = await uploadEntryMedia(selectedFile);
        } catch (uploadErr) {
          // continue if direct media bucket is in mock/disabled mode on local
          console.warn("Upload service info:", uploadErr);
        }
      }

      await createRoundEntry(activeRoundId, {
        title: entryTitle.trim(),
        description: entryDescription.trim() || null,
        mediaKey
      });

      setEntrySubmitSuccess(
        "Proposal submitted successfully! It has been routed to supervisor review and will appear in the candidate pool once approved."
      );
      setEntryTitle("");
      setEntryDescription("");
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["entries", activeRoundId] });
      queryClient.invalidateQueries({ queryKey: ["pending-entries", activeRoundId] });
    } catch (err: unknown) {
      setEntrySubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmittingEntry(false);
    }
  };

  const isBinary = activeRound?.pollType === "binary" || activeRound?.scheme === "binary";
  const ranks = isBinary ? [1] : [1, 2, 3];
  const isVotingActive = activeRound?.status === "voting";
  const isSubmissionActive = activeRound?.status === "open";
  const isFinalized = activeRound?.status === "finalized";

  return (
    <div>
      <h1>Voting</h1>

      {/* round selector */}
      <fieldset className="grab-box">
        <legend>Active Round</legend>
        {roundsLoading ? (
          <div>Loading rounds...</div>
        ) : rounds.length === 0 ? (
          <div>No voting rounds available.</div>
        ) : (
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            {activeRounds.length > 1 ? (
              activeRounds.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setSelectedRoundId(r.id);
                    setPicks({});
                    setBallotStatus(null);
                  }}
                  style={{
                    padding: "3px 8px",
                    fontSize: "12px",
                    fontWeight: activeRoundId === r.id ? "bold" : "normal",
                    backgroundColor: activeRoundId === r.id ? "#ffffff" : "#e0ded8",
                    border: "1px solid var(--border-dark)",
                    cursor: "pointer"
                  }}
                >
                  {r.title} ({r.scheme || r.pollType})
                </button>
              ))
            ) : (
              <div>
                <strong>{activeRound?.title || "Active Round"}</strong> ({activeRound?.scheme || activeRound?.pollType || "ranked"})
              </div>
            )}
            {activeRound && (
              <span className={`badge ${activeRound.status === "voting" ? "badge-active" : activeRound.status === "open" ? "badge-contributor" : "badge-closed"}`}>
                {activeRound.status === "open" ? "OPEN FOR SUBMISSIONS" : activeRound.status === "voting" ? "VOTING ACTIVE" : activeRound.status.toUpperCase()}
              </span>
            )}
          </div>
        )}
      </fieldset>

      <h2>Candidate Pool</h2>
      {isSubmissionActive ? (
        <fieldset className="grab-box" style={{ backgroundColor: "#f4f8fb", borderColor: "#3a75c4", marginBottom: "14px" }}>
          <legend style={{ fontWeight: "bold", color: "#1d4ed8" }}>Submissions Stage Active</legend>
          <p style={{ margin: 0, fontSize: "12px", color: "#1e3a8a" }}>
            This round is currently open for proposals. Submit your concepts below. Once submissions conclude, supervisors will publish the finalist candidates to open ballot voting.
          </p>
        </fieldset>
      ) : isFinalized ? (
        <fieldset className="grab-box" style={{ backgroundColor: "#f9fafb", borderColor: "#999", marginBottom: "14px" }}>
          <legend style={{ fontWeight: "bold" }}>Voting Finalized</legend>
          <p style={{ margin: 0, fontSize: "12px", color: "#555" }}>
            Voting has concluded and certified results have been recorded for this round.
          </p>
        </fieldset>
      ) : entriesLoading ? (
        <p>Loading candidate entries...</p>
      ) : entries.length === 0 ? (
        <fieldset className="grab-box" style={{ backgroundColor: "#ffffff" }}>
          <p style={{ margin: 0 }}>
            No approved candidate entries in this round yet.
          </p>
        </fieldset>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: "15%" }}>Entry ID</th>
              <th style={{ width: "45%" }}>Title / Concept</th>
              <th style={{ width: "40%" }}>Your Ballot Rank</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td><code>{entry.id.slice(0, 8)}</code></td>
                <td>
                  <strong>{entry.title}</strong>
                  {entry.description && (
                    <div style={{ fontSize: "11px", color: "#444", marginTop: "2px" }}>{entry.description}</div>
                  )}
                  {entry.authorName && (
                    <span style={{ color: "#666", fontSize: "11px" }}> &bull; by @{entry.authorName}</span>
                  )}
                  {entry.mediaUrl && (
                    <div style={{ fontSize: "11px", marginTop: "4px" }}>
                      <a href={entry.mediaUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
                        View Media Pitch &raquo;
                      </a>
                    </div>
                  )}
                </td>
                <td>
                  {isVotingActive ? (
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center" }}>
                      {ranks.map((r) => {
                        const isSelected = picks[entry.id] === r;
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRank(entry.id, r)}
                            style={{
                              fontSize: "11px",
                              padding: "2px 6px",
                              fontWeight: isSelected ? "bold" : "normal",
                              backgroundColor: isSelected ? "#3a75c4" : "#eee",
                              color: isSelected ? "#ffffff" : "#333333",
                              border: "1px solid #999",
                              cursor: "pointer"
                            }}
                          >
                            {isBinary ? "Vote" : r === 1 ? "1st (3 pts)" : r === 2 ? "2nd (2 pts)" : "3rd (1 pt)"}
                          </button>
                        );
                      })}
                      {picks[entry.id] && (
                        <button
                          type="button"
                          onClick={() => setRank(entry.id, picks[entry.id])}
                          style={{
                            fontSize: "10px",
                            padding: "2px 5px",
                            backgroundColor: "#fde8e8",
                            color: "#c00",
                            border: "1px solid #c00",
                            cursor: "pointer"
                          }}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  ) : (
                    <span style={{ fontSize: "11px", color: "#888" }}>Voting not active</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* cast ballot controls */}
      <fieldset className="grab-box" style={{ marginTop: "16px" }}>
        <legend>Ballot</legend>
        {!isVotingActive ? (
          <div style={{ fontSize: "12px", color: "#666" }}>
            Ballots can only be cast when the round is in the voting stage.
          </div>
        ) : !user ? (
          <div>
            Please <button type="button" className="action-btn" onClick={login}>Log in with Discord</button> to vote.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <span>Voter: <strong>{user.globalName || user.username}</strong></span>
              <button
                type="button"
                className="action-btn"
                disabled={entries.length === 0 || isSubmittingBallot}
                onClick={handleCastBallot}
                style={{ fontWeight: "bold", backgroundColor: "#e2f0d9" }}
              >
                {isSubmittingBallot ? "Recording..." : "Cast Ballot"}
              </button>
            </div>
            {ballotStatus && (
              <div style={{ fontSize: "12px", color: ballotStatus.startsWith("Error") ? "#cc0000" : "#276a3c", fontWeight: "bold" }}>
                {ballotStatus}
              </div>
            )}
          </div>
        )}
      </fieldset>

      {/* propose entry section */}
      <h2 style={{ marginTop: "24px" }}>Submit Proposal</h2>
      <fieldset className="grab-box" style={{ backgroundColor: "#ffffff" }}>
        <legend>Submit Proposal</legend>
        {!isSubmissionActive ? (
          <div style={{ fontSize: "12px", color: "#666" }}>
            {isVotingActive
              ? "Proposal submissions are closed for this round. Finalist candidates have been published and voting is currently underway."
              : isFinalized
                ? "This round has been finalized and certified."
                : "Submissions will open once this round is in the open stage."}
          </div>
        ) : !user ? (
          <div>
            Please <button type="button" className="action-btn" onClick={login}>Log in with Discord</button> to submit an entry for this round.
          </div>
        ) : (
          <form onSubmit={handleProposeEntry}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "560px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <label htmlFor="entry-title" style={{ fontSize: "12px", fontWeight: "bold" }}>
                    Pitch / Concept Title * (Max 75 chars)
                  </label>
                  <span style={{ fontSize: "11px", color: entryTitle.length > 75 ? "#c00" : "#666", fontWeight: entryTitle.length > 75 ? "bold" : "normal" }}>
                    {entryTitle.length} / 75 chars
                  </span>
                </div>
                <input
                  id="entry-title"
                  type="text"
                  required
                  maxLength={75}
                  placeholder="e.g. Cyberpunk Alleyway LookDev & Lighting Rig"
                  value={entryTitle}
                  onChange={(e) => setEntryTitle(e.target.value)}
                  style={{ width: "100%", padding: "4px", fontSize: "12px", borderColor: entryTitle.length > 75 ? "#c00" : undefined }}
                />
                {entryTitle.length > 75 && (
                  <div style={{ color: "#c00", fontSize: "10px", marginTop: "2px" }}>
                    Pitch cannot exceed 75 characters.
                  </div>
                )}
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <label htmlFor="entry-description" style={{ fontSize: "12px", fontWeight: "bold" }}>
                    Description / Logline (Max 250 chars)
                  </label>
                  <span style={{ fontSize: "11px", color: entryDescription.length > 250 ? "#c00" : "#666" }}>
                    {entryDescription.length} / 250 chars
                  </span>
                </div>
                <textarea
                  id="entry-description"
                  rows={3}
                  maxLength={250}
                  placeholder="Summarize core creative direction and pipeline notes (250 char limit)..."
                  value={entryDescription}
                  onChange={(e) => setEntryDescription(e.target.value)}
                  style={{ width: "100%", padding: "4px", fontSize: "12px" }}
                />
              </div>

              <div>
                <label htmlFor="entry-media" style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>
                  Media Attachment (Image or Video, max 5 MB)
                </label>
                <input
                  id="entry-media"
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
                  onChange={handleFileChange}
                  style={{ fontSize: "11px" }}
                />
                {selectedFile && (
                  <div style={{ fontSize: "11px", color: "#276a3c", marginTop: "2px" }}>
                    Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </div>
                )}
                {fileError && (
                  <div style={{ color: "#c00", fontSize: "11px", marginTop: "2px", fontWeight: "bold" }}>
                    {fileError}
                  </div>
                )}
              </div>

              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                <em>Note: Submitted proposals undergo supervisor approval in the admin dashboard before entering the live voting pool.</em>
              </div>

              {entrySubmitSuccess && (
                <div style={{ padding: "8px", backgroundColor: "#e2f0d9", border: "1px solid #276a3c", color: "#276a3c", fontSize: "12px", fontWeight: "bold" }}>
                  &check; {entrySubmitSuccess}
                </div>
              )}

              {entrySubmitError && (
                <div style={{ padding: "8px", backgroundColor: "#fde8e8", border: "1px solid #c00", color: "#c00", fontSize: "12px", fontWeight: "bold" }}>
                  Error: {entrySubmitError}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  className="action-btn"
                  disabled={isSubmittingEntry || !isTitleValid || !isDescriptionValid || Boolean(fileError)}
                  style={{ fontWeight: "bold" }}
                >
                  {isSubmittingEntry ? "Submitting..." : "Submit Proposal"}
                </button>
              </div>
            </div>
          </form>
        )}
      </fieldset>
    </div>
  );
}
