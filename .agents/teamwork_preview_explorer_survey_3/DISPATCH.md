# Dispatch: Survey Explorer 3 (Modals, Secondary Pages, 320px-768px Viewport Audit)

## Objective
Survey all modals and secondary application pages in `vote-ui` at `/home/yierke/Documents/vote-ui`, including CreatePitchModal, settings popups, PublicLeaderboard, Pitch Submissions, GrabBox, Guidelines, Docs, and DevWorkbench, assessing mobile responsiveness and horizontal scroll risks from 320px to 768px.

## Authoritative Inputs
- `/home/yierke/Documents/vote-ui/.agents/ORIGINAL_REQUEST.md`

## Instructions
1. Inspect `CreatePitchModal` and any other modal/dialog/settings popups. Identify desktop vs mobile behavior, touch-friendly form controls, character counters, file upload triggers, and requirements for transforming desktop-centered modals into smooth mobile bottom sheets/drawers on small viewports.
2. Inspect `PublicLeaderboard`, `Pitch Submissions` / pitch lists, `GrabBox`, `Guidelines`, `Docs`, and `DevWorkbench`.
3. Identify elements that cause or risk horizontal scrollbars, clipped text, or squished UI elements on small screens (tables, code blocks, wide grids, fixed pixel widths).
4. Evaluate desktop preservation requirements (full fidelity, charts, information density at >=1024px).
5. Write your complete survey report to `/home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_survey_3/survey_report.md` and your handoff to `/home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_survey_3/handoff.md`.
6. Send a completion message back to the orchestrator when done.
