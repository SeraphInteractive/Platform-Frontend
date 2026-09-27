"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRounds, fetchRoundLeaderboard, fetchRoundResults, Round, LeaderboardItem } from "@/lib/api";

function FinishedRoundCard({ round }: { round: Round }) {
  const { data: results, isLoading } = useQuery({
    queryKey: ["round-results", round.id],
    queryFn: () => fetchRoundResults(round.id)
  });

  const winner = results?.entries?.[0];

  return (
    <fieldset className="grab-box" style={{ backgroundColor: "#fafafa" }}>
      <legend style={{ fontWeight: "bold" }}>
        {round.title} &bull; <span className="badge badge-closed">{round.status.toUpperCase()}</span>
      </legend>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Voting Scheme: <strong>{round.scheme === "ranked" ? "Ranked Choice (3-2-1)" : "Binary Approval"}</strong> &bull; Total Ballots: <strong>{results?.totalBallots ?? "-"}</strong>
          </div>
          {isLoading ? (
            <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>Loading certified result...</div>
          ) : winner ? (
            <div style={{ marginTop: "6px", fontSize: "13px" }}>
              <strong>Certified Winner:</strong> <span style={{ fontWeight: "bold", color: "#276a3c" }}>{winner.title}</span> ({winner.rawScore} pts &bull; {winner.voteSharePercentage}% vote share)
            </div>
          ) : (
            <div style={{ marginTop: "6px", fontSize: "12px", color: "#777" }}>
              Results archived in studio ledger.
            </div>
          )}
        </div>
        {results?.certifiedAt && (
          <div style={{ fontSize: "11px", color: "#888" }}>
            Certified: {new Date(results.certifiedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </div>
        )}
      </div>
    </fieldset>
  );
}

export default function LeaderboardsPage() {
  const { data: roundsData, isLoading: roundsLoading } = useQuery({
    queryKey: ["rounds"],
    queryFn: fetchRounds
  });

  const rounds = roundsData?.data || [];
  const activeRounds = rounds.filter((r) => r.status === "active" || r.status === "open" || r.status === "draft");
  const finishedRounds = rounds.filter((r) => r.status === "closed" || r.status === "tallied" || r.status === "finalized");

  const liveRound = activeRounds[0] || rounds.find((r) => r.status === "active" || r.status === "open");
  const liveRoundId = liveRound?.id || "";

  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery({
    queryKey: ["leaderboard", liveRoundId],
    queryFn: () => fetchRoundLeaderboard(liveRoundId),
    enabled: Boolean(liveRoundId),
    refetchInterval: 5000
  });

  const items: LeaderboardItem[] = leaderboardData?.items || [];
  const topFive = items.slice(0, 5);
  const highestScore = topFive.length > 0 ? Math.max(...topFive.map((i) => i.rawScore), 1) : 1;
  const currentWinner = topFive[0];

  return (
    <div>
      <h1>Leaderboard</h1>

      {roundsLoading ? (
        <fieldset className="grab-box" style={{ marginBottom: "20px" }}>
          <p style={{ margin: 0 }}>Loading leaderboard data...</p>
        </fieldset>
      ) : liveRound ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
          <fieldset className="grab-box">
            <legend style={{ fontWeight: "bold" }}>
              {liveRound.title} &bull; <span className="badge badge-active">{liveRound.status.toUpperCase()}</span>
            </legend>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", fontSize: "12px" }}>
              <div>
                Voting Scheme: <strong>{liveRound.scheme === "ranked" || liveRound.pollType === "ranked_choice" ? "Ranked Choice (3-2-1)" : "Binary (1-0)"}</strong>
              </div>
              <div style={{ color: "var(--text-muted)" }}>
                Total Ballots: <strong>{leaderboardData?.totalBallots ?? 0}</strong> &bull; Total Points: <strong>{leaderboardData?.totalPoints ?? 0}</strong>
              </div>
            </div>
          </fieldset>

          {leaderboardLoading ? (
            <p>Loading rankings...</p>
          ) : topFive.length === 0 ? (
            <fieldset className="grab-box" style={{ backgroundColor: "#ffffff" }}>
              <p style={{ margin: 0, color: "#666" }}>
                No ranked submissions or ballots cast for this round yet.
              </p>
            </fieldset>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {currentWinner && (
                <fieldset className="grab-box" style={{ backgroundColor: "#fbf8eb", borderColor: "#b8860b" }}>
                  <legend style={{ fontWeight: "bold", color: "#8b6508" }}>CURRENTLY WINNING LIVE</legend>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px 0", fontSize: "17px", color: "#1a1a1a" }}>
                        #1 {currentWinner.title}
                      </h3>
                      <div style={{ fontSize: "12px", color: "#555" }}>
                        Entry ID: <code>{currentWinner.entryId}</code> &bull; Total Score: <strong>{currentWinner.rawScore} pts</strong>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span className="badge badge-active" style={{ fontSize: "13px", padding: "4px 10px" }}>
                        {currentWinner.voteSharePercentage}% VOTE SHARE
                      </span>
                    </div>
                  </div>
                </fieldset>
              )}

              {/* ranked bar chart */}
              <fieldset className="grab-box" style={{ backgroundColor: "#ffffff" }}>
                <legend>Standings</legend>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "4px 0" }}>
                  {topFive.map((item, idx) => {
                    const rankNumber = idx + 1;
                    const isWinner = rankNumber === 1;
                    const barWidthPercent = Math.max(Math.round((item.rawScore / highestScore) * 100), 6);

                    return (
                      <div key={item.entryId} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                          <div>
                            <strong style={{ fontSize: "13px" }}>
                              #{rankNumber} {item.title}
                            </strong>
                          </div>
                          <div>
                            <strong>{item.rawScore} pts</strong> ({item.voteSharePercentage}%)
                          </div>
                        </div>

                        {/* score bar */}
                        <div
                          style={{
                            width: "100%",
                            height: "18px",
                            backgroundColor: "#f0ede6",
                            border: "1px solid var(--border-dark)",
                            padding: "1px",
                            position: "relative"
                          }}
                        >
                          <div
                            style={{
                              width: `${barWidthPercent}%`,
                              height: "100%",
                              backgroundColor: isWinner ? "#276a3c" : rankNumber === 2 ? "#3a75c4" : "#808080",
                              transition: "width 0.4s ease",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-end",
                              paddingRight: "6px"
                            }}
                          >
                            <span style={{ fontSize: "10px", color: "#ffffff", fontWeight: "bold" }}>
                              {item.rawScore} pts
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </fieldset>

              {/* breakdown data table */}
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: "8%" }}>Rank</th>
                    <th style={{ width: "42%" }}>Entry Title</th>
                    <th style={{ width: "12%" }}>1st Place</th>
                    <th style={{ width: "12%" }}>2nd Place</th>
                    <th style={{ width: "12%" }}>3rd Place</th>
                    <th style={{ width: "14%" }}>Total Score</th>
                  </tr>
                </thead>
                <tbody>
                  {topFive.map((item, idx) => (
                    <tr key={item.entryId} style={{ fontWeight: idx === 0 ? "bold" : "normal", backgroundColor: idx === 0 ? "#fbf8eb" : "inherit" }}>
                      <td>#{idx + 1}</td>
                      <td>
                        {item.title}
                        <div style={{ fontSize: "10px", color: "#777" }}><code>{item.entryId.slice(0, 8)}</code></div>
                      </td>
                      <td>{item.rankCounts?.[0] ?? 0}</td>
                      <td>{item.rankCounts?.[1] ?? 0}</td>
                      <td>{item.rankCounts?.[2] ?? 0}</td>
                      <td>
                        <strong>{item.rawScore}</strong> ({item.voteSharePercentage}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <fieldset className="grab-box" style={{ backgroundColor: "#ffffff", marginBottom: "24px" }}>
          <p style={{ margin: 0, color: "#666" }}>No active voting rounds currently live.</p>
        </fieldset>
      )}

      {/* historical finished rounds */}
      <h2>Past Rounds</h2>

      {finishedRounds.length === 0 ? (
        <fieldset className="grab-box" style={{ backgroundColor: "#ffffff" }}>
          <p style={{ margin: 0, color: "#666" }}>
            No finalized or archived rounds yet. Completed rounds and their certified winners will be preserved here.
          </p>
        </fieldset>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {finishedRounds.map((round) => (
            <FinishedRoundCard key={round.id} round={round} />
          ))}
        </div>
      )}
    </div>
  );
}
