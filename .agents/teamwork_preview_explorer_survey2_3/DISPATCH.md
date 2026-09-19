# Survey Dispatch: Explorer 3 (Dev Viewport Simulator & Dev Workbench RBAC)

## Target Scope
- Requirement R5: Interactive Real-Time Dev Server Viewport Simulator.
- Requirement R6: Staff & Role-Based Permissions in Dev Workbench.

## Authoritative Instructions
Read:
- `/home/yierke/Documents/vote-ui/.agents/ORIGINAL_REQUEST.md` (specifically `## Follow-up — 2026-09-19T14:59:02Z`).
- Codebase files: `src/views/DevWorkbench/DevWorkbench.tsx`, `src/App.tsx`, `src/components/Navbar.tsx`, `src/styles.css`.
- Existing test suite in `tests/`.

## Output Required
Write `/home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_survey2_3/report.md` detailing:
1. Current implementation of DevWorkbench, staff roles/permissions, state, and actions.
2. Architecture and component design for Dev Viewport Simulator Toolbar (R5):
   - Presets: iPhone SE (375x667), iPhone 15 (393x852), Pixel 7 (412x915), iPad Mini (768x1024), Desktop Full (100%).
   - Controls: Zoom scale slider (50% to 125%), Rotate orientation (portrait / landscape), close/reset.
   - Interactive container architecture (e.g. wrapper in App.tsx or floating toolbar rendering the framed app container or iframe/scaled container with live state).
3. Architecture and implementation details for Staff & Role-Based Permissions in Dev Workbench (R6):
   - Role tiers: `moderator` vs `admin`/`supervisor`.
   - Moderator access: Content moderation (Approve / Flag as AI / Reject), Moments statistical variance analysis, Telemetry anomaly review, Network health monitoring.
   - Admin/Supervisor elevated access: Destructive actions (Permanent Proposal Deletion, Round Deletion), Roles & Staff Management tab strictly gated with clear visual badges/feedback.
4. Identified features, edge cases, and recommendations.

## 2026-09-19T15:02:34Z
<USER_REQUEST>
You are Explorer 3 investigating R5 (Interactive Real-Time Dev Viewport Simulator) and R6 (Staff & Role-Based Permissions in Dev Workbench).
Your working directory is: /home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_survey2_3
MANDATORY: Read /home/yierke/Documents/vote-ui/.agents/ORIGINAL_REQUEST.md (specifically ## Follow-up — 2026-09-19T14:59:02Z). Also read /home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_survey2_3/DISPATCH.md.

Explore the codebase (src/views/DevWorkbench/DevWorkbench.tsx, src/App.tsx, src/components/Navbar.tsx, src/styles.css, tests/tier1/ and tests/tier2/).
Produce a thorough investigation report and save it to:
/home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_survey2_3/report.md
Also write handoff.md in your working directory.
When finished, send a message back with your findings.
</USER_REQUEST>
