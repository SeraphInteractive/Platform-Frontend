import React from "react";

export default function DocumentationPage() {
  return (
    <div>
      <h1>Documentation</h1>

      <fieldset className="grab-box" style={{ marginBottom: "16px" }}>
        <legend>How Voting Works</legend>
        <p style={{ margin: "4px 0 8px 0" }}>
          Project Stairway lets the community vote on ideas, stories, and artwork for the animated film. Here is how a voting round works from start to finish:
        </p>
        <ol style={{ paddingLeft: "20px", margin: "4px 0", display: "flex", flexDirection: "column", gap: "6px" }}>
          <li>
            <strong>1. Ideas are Proposed:</strong> Artists and community members submit proposals (pictures, story ideas, or designs) for a specific round. Supervisors check the entries to make sure they follow the guidelines.
          </li>
          <li>
            <strong>2. Voting Opens:</strong> Once approved, the round opens for everyone to vote on the platform. You log in with your Discord account to cast your ballot.
          </li>
          <li>
            <strong>3. Pick Your Favorites:</strong> Depending on the round type, you either pick your top choices in order (1st, 2nd, and 3rd place) or vote Yes / No on a single proposal.
          </li>
          <li>
            <strong>4. Points are Counted:</strong> Every vote gives points to the entries. When the timer ends, the votes are tallied automatically.
          </li>
          <li>
            <strong>5. The Winner is Announced:</strong> The winning idea is certified, announced in Discord, and moves straight into production!
          </li>
        </ol>
      </fieldset>

      <h2>Voting Systems</h2>
      <table className="data-table" style={{ marginBottom: "16px" }}>
        <thead>
          <tr>
            <th style={{ width: "25%" }}>Type</th>
            <th style={{ width: "35%" }}>How You Vote</th>
            <th style={{ width: "40%" }}>How Points Work</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Ranked Choice (3-2-1)</strong></td>
            <td>Choose your favorite 3 options in order of preference.</td>
            <td>
              1st choice = <strong>3 points</strong><br />
              2nd choice = <strong>2 points</strong><br />
              3rd choice = <strong>1 point</strong>
            </td>
          </tr>
          <tr>
            <td><strong>Binary Vote (1-0)</strong></td>
            <td>Vote <strong>Yes</strong> or <strong>No</strong> on a single proposal or matchup.</td>
            <td>
              Yes = <strong>1 point</strong><br />
              No = <strong>0 points</strong> (Highest percentage wins)
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Fair Play & Rules</h2>
      <fieldset className="grab-box" style={{ marginBottom: "16px" }}>
        <legend>Keeping Votes Fair</legend>
        <ul style={{ paddingLeft: "20px", margin: "4px 0", display: "flex", flexDirection: "column", gap: "6px" }}>
          <li>
            <strong>One Person, One Vote:</strong> Each voter gets one ballot per round. If you change your mind before the round closes, you can update your vote anytime.
          </li>
          <li>
            <strong>Automatic Protection:</strong> The system automatically spots bots or sudden spam waves and keeps the vote clean and fair for real people.
          </li>
          <li>
            <strong>Locked In:</strong> Once a round is finalized, the results are permanent and cannot be changed by anyone.
          </li>
        </ul>
      </fieldset>

      <h2>Roles & Tasks</h2>
      <fieldset className="grab-box">
        <legend>Community & Studio Roles</legend>
        <ul style={{ paddingLeft: "20px", margin: "4px 0", display: "flex", flexDirection: "column", gap: "6px" }}>
          <li>
            <strong>Voters (Community):</strong> Vote on all open rounds, pitch ideas, and take part in discussions.
          </li>
          <li>
            <strong>Contributors:</strong> Pick up creative production tasks (animation, 3D modeling, music, sound) from the Grab-Box and submit deliverables.
          </li>
          <li>
            <strong>Supervisors & Leads:</strong> Review contributor work, approve candidate entries, and keep production moving forward.
          </li>
        </ul>
      </fieldset>
    </div>
  );
}
