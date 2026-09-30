"use client";

import React, { useState } from "react";
import Link from "next/link";

type DocTab = "rules" | "voting-math" | "anti-cheat" | "pipeline";

export default function DocumentationPage() {
  const [activeTab, setActiveTab] = useState<DocTab>("rules");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <h1 style={{ margin: 0, borderBottom: "none" }}>Guidelines & System Architecture</h1>
        <span className="badge" style={{ backgroundColor: "#e2f0d9", color: "#276a3c", fontWeight: "bold" }}>
          INTEGRITY SPEC v2.0
        </span>
      </div>

      <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "var(--text-muted)" }}>
        Project Stairway is a transparent, community-driven animated film. Explore our voting rules, mathematical scoring invariants, and automated anti-cheat telemetry below.
      </p>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "4px", borderBottom: "2px solid var(--border-dark)", marginBottom: "14px", flexWrap: "wrap" }}>
        {[
          { id: "rules", label: "General Rules" },
          { id: "voting-math", label: "Voting Math" },
          { id: "anti-cheat", label: "Anti-Cheat Systems" },
          { id: "pipeline", label: "Contributor Pipeline" }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as DocTab)}
            style={{
              padding: "6px 14px",
              fontFamily: "inherit",
              fontSize: "12px",
              fontWeight: activeTab === tab.id ? "bold" : "normal",
              backgroundColor: activeTab === tab.id ? "#ffffff" : "#e0ded8",
              border: "1px solid var(--border-dark)",
              borderBottom: activeTab === tab.id ? "1px solid #ffffff" : "1px solid var(--border-dark)",
              marginBottom: activeTab === tab.id ? "-2px" : "0",
              cursor: "pointer"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: General Rules */}
      {activeTab === "rules" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <fieldset className="grab-box" style={{ backgroundColor: "#ffffff" }}>
            <legend style={{ fontWeight: "bold" }}>1. Community Philosophy & Mission</legend>
            <p style={{ margin: "4px 0", fontSize: "12px", lineHeight: "1.5" }}>
              Project Stairway is an open-production animated film. All major creative choices—from character designs and environmental concepts to scene storyboards and score tracks—are decided through democratic community elections and executed by skilled contributors.
            </p>
          </fieldset>

          <fieldset className="grab-box" style={{ backgroundColor: "#ffffff" }}>
            <legend style={{ fontWeight: "bold" }}>2. Identity, Accounts & Fair Play</legend>
            <ul style={{ paddingLeft: "20px", margin: "4px 0", display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
              <li>
                <strong>One Person, One Account:</strong> Each voter must authenticate with their primary Discord account. Alternate accounts, disposable throwaways, and automated scripts are strictly prohibited.
              </li>
              <li>
                <strong>Verified Human Credentials:</strong> Official voting requires email verification. For your privacy, our platform stores only salted one-way SHA-256 cryptographic hashes—your raw email is never exposed or logged.
              </li>
              <li>
                <strong>Ballot Mutability:</strong> You may update your ranking anytime while a round is open. Only your final submitted ballot counts at the close of the election.
              </li>
              <li>
                <strong>Permanent Finality:</strong> Once a round timer expires and results are certified by supervisors, results are cryptographically sealed in the immutable election ledger.
              </li>
            </ul>
          </fieldset>

          <fieldset className="grab-box" style={{ backgroundColor: "#ffffff" }}>
            <legend style={{ fontWeight: "bold" }}>3. Role Tiers & Permissions</legend>
            <table className="data-table" style={{ fontSize: "12px" }}>
              <thead>
                <tr>
                  <th style={{ width: "20%" }}>Role Tier</th>
                  <th style={{ width: "35%" }}>Primary Responsibilities</th>
                  <th style={{ width: "45%" }}>Platform Permissions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Community (Voter)</strong></td>
                  <td>Vote on rounds, pitch creative proposals, participate in discussions.</td>
                  <td>Cast 3-2-1 ranked ballots, vote in quick polls, submit concept pitches.</td>
                </tr>
                <tr>
                  <td><strong>Contributor</strong></td>
                  <td>Claim 3D modeling, animation, layout, lighting, voice, or sound tasks.</td>
                  <td>Access the Grab-Box, lock scene tasks, upload `.blend` source files & video previews.</td>
                </tr>
                <tr>
                  <td><strong>Supervisor & Admin</strong></td>
                  <td>Lead departments, QA deliverables, curate proposals, audit integrity.</td>
                  <td>Approve/reject deliverables, create rounds, trigger quick polls, review anti-cheat telemetry.</td>
                </tr>
              </tbody>
            </table>
          </fieldset>
        </div>
      )}

      {/* Tab 2: Voting Math */}
      {activeTab === "voting-math" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <fieldset className="grab-box" style={{ backgroundColor: "#ffffff" }}>
            <legend style={{ fontWeight: "bold" }}>1. Ranked-Choice Voting (3-2-1 Borda Count)</legend>
            <p style={{ margin: "4px 0 8px 0", fontSize: "12px", lineHeight: "1.5" }}>
              For creative rounds with multiple candidate proposals, Project Stairway uses a modified positional Borda count. Voters select and order their top 3 favorites:
            </p>
            <table className="data-table" style={{ fontSize: "12px", marginBottom: "8px" }}>
              <thead>
                <tr>
                  <th>Rank Preference</th>
                  <th>Points Awarded</th>
                  <th>Mathematical Rationale</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>1st Choice</strong></td>
                  <td><strong style={{ color: "#276a3c" }}>3 Points</strong></td>
                  <td>Primary creative preference</td>
                </tr>
                <tr>
                  <td><strong>2nd Choice</strong></td>
                  <td><strong style={{ color: "#3a75c4" }}>2 Points</strong></td>
                  <td>Secondary endorsement</td>
                </tr>
                <tr>
                  <td><strong>3rd Choice</strong></td>
                  <td><strong style={{ color: "#856404" }}>1 Point</strong></td>
                  <td>Tertiary consensus support</td>
                </tr>
              </tbody>
            </table>
            <div style={{ fontFamily: "monospace", backgroundColor: "#f4f3ef", border: "1px solid #ccc", padding: "8px 12px", fontSize: "12px" }}>
              Points_Per_Ballot = 3 + 2 + 1 = 6 Points
            </div>
          </fieldset>

          <fieldset className="grab-box" style={{ backgroundColor: "#ffffff" }}>
            <legend style={{ fontWeight: "bold" }}>2. Point Conservation Invariant Law</legend>
            <p style={{ margin: "4px 0 6px 0", fontSize: "12px", lineHeight: "1.5" }}>
              Every ranked-choice election is strictly governed by a mathematical conservation law. The sum of all points distributed across all proposals must exactly equal six times the total number of valid ballots:
            </p>
            <div style={{ fontFamily: "monospace", backgroundColor: "#f4f3ef", border: "1px solid #ccc", padding: "8px 12px", fontSize: "12px", margin: "6px 0" }}>
              Total_Points = 6 × Total_Ballots
            </div>
            <p style={{ margin: "4px 0", fontSize: "11px", color: "var(--text-muted)" }}>
              <strong>Why this prevents manipulation:</strong> If an unauthorized script attempts to inject phantom votes, inflate candidate points, or alter rankings post-submission, the invariant sum breaks immediately, tripping automatic election quarantine.
            </p>
          </fieldset>

          <fieldset className="grab-box" style={{ backgroundColor: "#ffffff" }}>
            <legend style={{ fontWeight: "bold" }}>3. Bayesian Shrinkage Regularization (Empirical Bayes)</legend>
            <p style={{ margin: "4px 0 6px 0", fontSize: "12px", lineHeight: "1.5" }}>
              In elections with many candidate proposals, early votes or small brigading groups could temporarily push a niche entry to the top. To ensure statistical stability, our scoring engine calculates a <strong>regularized score</strong> using Bayesian shrinkage toward the round mean:
            </p>
            <div style={{ fontFamily: "monospace", backgroundColor: "#f4f3ef", border: "1px solid #ccc", padding: "8px 12px", fontSize: "12px", margin: "6px 0" }}>
              Regularized_Score = (Entry_Points + K × Prior_Mean) / (Total_Ballots_In_Round + K)
            </div>
            <ul style={{ paddingLeft: "20px", margin: "6px 0", fontSize: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <li><strong>Prior Weight (K = 30):</strong> Acts as 30 pseudo-votes anchoring scores to the community average.</li>
              <li><strong>Small Sample Resistance:</strong> An entry with only 3 top-rank votes is tempered by the prior, preventing sudden rogue takeovers.</li>
              <li><strong>High Confidence Convergence:</strong> As an entry receives dozens or hundreds of organic votes, the empirical data overwhelms the prior, reflecting genuine community consensus.</li>
            </ul>
          </fieldset>

          <fieldset className="grab-box" style={{ backgroundColor: "#ffffff" }}>
            <legend style={{ fontWeight: "bold" }}>4. Binary Matchups & Quick Polls</legend>
            <p style={{ margin: "4px 0", fontSize: "12px", lineHeight: "1.5" }}>
              For direct decisions (e.g., Yes/No approvals or head-to-head art style matchups), supervisors run Binary rounds. Each ballot grants 1 point for Yes and 0 for No. Winner is decided by simple majority threshold (&gt; 50%).
            </p>
          </fieldset>
        </div>
      )}

      {/* Tab 3: Anti-Cheat Systems */}
      {activeTab === "anti-cheat" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <fieldset className="grab-box" style={{ backgroundColor: "#ffffff" }}>
            <legend style={{ fontWeight: "bold" }}>1. Real-Time Raid & Anomaly Telemetry</legend>
            <p style={{ margin: "4px 0 8px 0", fontSize: "12px", lineHeight: "1.5" }}>
              Project Stairway runs automated background statistical monitors on all active elections. Any attempt to brigade, bot, or coordinate unfair voting rings is detected in real time:
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px", marginTop: "8px" }}>
              <div style={{ border: "1px solid #ddd", padding: "10px", backgroundColor: "#faf9f6" }}>
                <strong style={{ fontSize: "12px", color: "#8b6508" }}>Velocity Z-Score (Z)</strong>
                <div style={{ fontFamily: "monospace", backgroundColor: "#fff", border: "1px solid #ccc", padding: "4px 8px", fontSize: "11px", margin: "6px 0" }}>
                  Z = (V_current - V_average) / V_std_dev
                </div>
                <p style={{ margin: 0, fontSize: "11px", color: "#555" }}>
                  Measures the rate of ballot arrival in 5-minute sliding windows. A score of <strong>Z &gt; 2.5</strong> flags sudden artificial vote surges.
                </p>
              </div>

              <div style={{ border: "1px solid #ddd", padding: "10px", backgroundColor: "#faf9f6" }}>
                <strong style={{ fontSize: "12px", color: "#8b6508" }}>Shannon Rank Entropy (H)</strong>
                <div style={{ fontFamily: "monospace", backgroundColor: "#fff", border: "1px solid #ccc", padding: "4px 8px", fontSize: "11px", margin: "6px 0" }}>
                  H = - Σ [ p(r) × log2(p(r)) ]
                </div>
                <p style={{ margin: 0, fontSize: "11px", color: "#555" }}>
                  Measures the randomness and distribution of ranks. Coordinated &quot;bullet-voting&quot; rings collapse entropy (<strong>H &lt; 0.35</strong>), triggering instant anomaly flags.
                </p>
              </div>
            </div>
          </fieldset>

          <fieldset className="grab-box" style={{ backgroundColor: "#ffffff" }}>
            <legend style={{ fontWeight: "bold" }}>2. Co-Occurrence Graph & Sybil Clustering</legend>
            <p style={{ margin: "4px 0 6px 0", fontSize: "12px", lineHeight: "1.5" }}>
              Our telemetry engine maps the correlation network of co-occurring ballot selections across multiple elections:
            </p>
            <ul style={{ paddingLeft: "20px", margin: "6px 0", fontSize: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <li>
                <strong>Clique Detection:</strong> If a set of accounts always casts identical rank orders across unconnected rounds within seconds of each other, their voting weights are isolated for supervisor audit.
              </li>
              <li>
                <strong>Skew Ratio Analysis:</strong> Measures the proportion of 1st-place votes relative to 2nd and 3rd place votes. Extreme bullet skew on single proposals is highlighted on supervisor scatter graphs.
              </li>
              <li>
                <strong>Audit Ledgers:</strong> Supervisors and administrators can inspect discord snowflake audit logs for both round types to confirm vote legitimacy before final certification.
              </li>
            </ul>
          </fieldset>

          <fieldset className="grab-box" style={{ backgroundColor: "#ffffff" }}>
            <legend style={{ fontWeight: "bold" }}>3. Why Vote Manipulation Is Futile</legend>
            <div style={{ fontSize: "12px", lineHeight: "1.5", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div>
                <strong>1. Bot Spikes Are Smoothed:</strong> Bayesian regularization (K=30) prevents sudden low-volume surges from overtaking established community preferences.
              </div>
              <div>
                <strong>2. Sybil Clusters Are Isolated:</strong> Real-time velocity (Z) and entropy (H) monitors detect raid patterns before elections close.
              </div>
              <div>
                <strong>3. Full Finality & Verification:</strong> Certified election results are signed into the permanent ledger. Discarded spam does not affect production.
              </div>
            </div>
          </fieldset>
        </div>
      )}

      {/* Tab 4: Contributor Pipeline */}
      {activeTab === "pipeline" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <fieldset className="grab-box" style={{ backgroundColor: "#ffffff" }}>
            <legend style={{ fontWeight: "bold" }}>1. Grab-Box & Task Claiming Workflow</legend>
            <p style={{ margin: "4px 0 8px 0", fontSize: "12px", lineHeight: "1.5" }}>
              The Grab-Box contains open production shots for the film. Contributors claim tasks according to their specialty:
            </p>
            <ol style={{ paddingLeft: "20px", margin: "4px 0", display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
              <li>
                <strong>Find an Open Task:</strong> Browse the <Link href="/grabbox">Grab-Box</Link> for tasks matching your craft (Animation, Layout, 3D Modeling, Texturing, Lighting, VFX, Sound).
              </li>
              <li>
                <strong>Claim & Lock:</strong> Claiming a task assigns it exclusively to you, locking it from other contributors while you work.
              </li>
              <li>
                <strong>Produce & Test:</strong> Build your shot according to the official asset package and storyboard specs.
              </li>
              <li>
                <strong>Submit Deliverables:</strong> Upload your compressed video preview (`.mp4` / `.webm`) and clean `.blend` scene file for review.
              </li>
              <li>
                <strong>Supervisor QA & Approval:</strong> Department supervisors review the work. If changes are needed, feedback is posted to your linked Discord thread. Once approved, the asset enters master film assembly!
              </li>
            </ol>
          </fieldset>

          <fieldset className="grab-box" style={{ backgroundColor: "#ffffff" }}>
            <legend style={{ fontWeight: "bold" }}>2. Difficulty Tiers & Senior Priority</legend>
            <table className="data-table" style={{ fontSize: "12px" }}>
              <thead>
                <tr>
                  <th style={{ width: "20%" }}>Tier</th>
                  <th style={{ width: "40%" }}>Task Scope</th>
                  <th style={{ width: "40%" }}>Exclusivity Window</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Tier 1 (Introductory)</strong></td>
                  <td>Basic background props, simple environment assets, UI graphics.</td>
                  <td>Open immediately to all contributors.</td>
                </tr>
                <tr>
                  <td><strong>Tier 2 (Standard)</strong></td>
                  <td>Secondary character animation, camera staging, texturing passes.</td>
                  <td>Open to all verified contributors.</td>
                </tr>
                <tr>
                  <td><strong>Tier 3 (Advanced)</strong></td>
                  <td>Hero character rigging, complex action sequences, lighting setups.</td>
                  <td>Optional senior priority exclusivity window (e.g., 24h) before general grab-box release.</td>
                </tr>
                <tr>
                  <td><strong>Tier 4 (Master)</strong></td>
                  <td>Climactic VFX, hero voice tracks, master scene compositions.</td>
                  <td>Reserved for senior contributors & department leads.</td>
                </tr>
              </tbody>
            </table>
          </fieldset>

          <fieldset className="grab-box" style={{ backgroundColor: "#ffffff" }}>
            <legend style={{ fontWeight: "bold" }}>3. Quality Assurance & AI Policy</legend>
            <p style={{ margin: "4px 0 6px 0", fontSize: "12px", lineHeight: "1.5" }}>
              Project Stairway is committed to high-fidelity, handcrafted human artistry:
            </p>
            <ul style={{ paddingLeft: "20px", margin: "4px 0", display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
              <li>
                <strong>Raw Source Verification:</strong> All 3D and animation deliverables must include inspectable `.blend` source project files with clean topology and rigging.
              </li>
              <li>
                <strong>AI Heuristic Screening:</strong> Deliverables and proposal pitches are screened for automated AI artifacts or synthetic text generation to ensure all submissions meet human creative standards.
              </li>
              <li>
                <strong>Discord Thread Sync:</strong> Each claimed shot automatically syncs with a dedicated discussion thread in the official Discord server for direct feedback with department leads.
              </li>
            </ul>
          </fieldset>
        </div>
      )}
    </div>
  );
}

