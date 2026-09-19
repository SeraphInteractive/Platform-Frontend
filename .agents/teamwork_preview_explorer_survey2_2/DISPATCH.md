# Survey Dispatch: Explorer 2 (View Density & Touch Targets)

## Target Scope
- Requirement R3: Comprehensive Mobile View & Layout Density Overhaul (0px horizontal overflow 320px–428px across all subpages).
- Requirement R4: Touch Ergonomics & Dialog Bottom Sheet Unification (>=44x44px touch targets, bottom sheet transformation for all dialogs).

## Authoritative Instructions
Read:
- `/home/yierke/Documents/vote-ui/.agents/ORIGINAL_REQUEST.md` (specifically `## Follow-up — 2026-09-19T14:59:02Z`).
- Codebase files: `src/views/VoterApp/VotePage.tsx`, `src/views/VoterApp/PublicLeaderboard.tsx`, `src/views/Docs/DocsPage.tsx`, `src/views/Progress/ProgressPage.tsx`, `src/views/GrabBox/GrabBoxPage.tsx`, `src/views/Settings/SettingsPage.tsx`, `src/views/DevWorkbench/DevWorkbench.tsx`, `src/components/CreatePitchModal.tsx`, `src/components/CreateRoundModal.tsx`, `src/components/CommandPalette.tsx`, `src/styles.css`.
- Existing test suite in `tests/tier1/` and `tests/tier2/`.

## Output Required
Write `/home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_survey2_2/report.md` detailing:
1. Current implementation state of VotePage, PublicLeaderboard, DocsPage, ProgressPage, GrabBoxPage, SettingsPage, DevWorkbench.
2. Layout fixes needed for 0px horizontal overflow on 320px-428px (candidate roller, ranked slots with reorder chevrons, Cast Ballot button reachability).
3. PublicLeaderboard stacked mobile podium (1st place Gold on top, followed by 2nd Silver and 3rd Bronze) and standings table scroll.
4. DocsPage Wikipedia layout wrapping, infobox, collapsible TOC.
5. Touch ergonomics audit: which elements need >=44x44px touch bounding area and >=8px separation.
6. Bottom Sheet transformation for ALL modals (`CreatePitchModal`, `CreateRoundModal`, `CommandPalette`, `CandidateDetailModal`) with `.modal-drag-pill`, 85vh max height, bottom anchor, backdrop dismiss.
7.
## 2026-09-19T15:02:34Z
<USER_REQUEST>
You are Explorer 2 investigating R3 (Comprehensive Mobile View & Layout Density Overhaul) and R4 (Touch Ergonomics & Dialog Bottom Sheet Unification).
Your working directory is: /home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_survey2_2
MANDATORY: Read /home/yierke/Documents/vote-ui/.agents/ORIGINAL_REQUEST.md (specifically ## Follow-up — 2026-09-19T14:59:02Z). Also read /home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_survey2_2/DISPATCH.md.

Explore the codebase (src/views/VoterApp/VotePage.tsx, src/views/VoterApp/PublicLeaderboard.tsx, src/views/Docs/DocsPage.tsx, src/views/Progress/ProgressPage.tsx, src/views/GrabBox/GrabBoxPage.tsx, src/views/Settings/SettingsPage.tsx, src/components/CreatePitchModal.tsx, src/components/CreateRoundModal.tsx, src/components/CommandPalette.tsx, src/styles.css).
Produce a thorough investigation report and save it to:
/home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_survey2_2/report.md
Also write handoff.md in your working directory.
When finished, send a message back with your findings.
</USER_REQUEST>
