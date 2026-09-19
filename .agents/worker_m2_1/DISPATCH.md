# Worker Dispatch: Milestone 2 (Mobile View & Layout Density Overhaul)

## Exclusive File Write Ownership
- `src/views/VoterApp/VotePage.tsx`
- `src/views/VoterApp/PublicLeaderboard.tsx`
- `src/views/Docs/DocsPage.tsx`
- `src/views/Settings/SettingsPage.tsx`
- `src/views/Progress/ProgressPage.tsx`
- `src/views/GrabBox/GrabBoxPage.tsx`
- `src/styles.css` (view density, podium, table-wrap, card chips, reorder chevrons)

## Authoritative Inputs
- Read `/home/yierke/Documents/vote-ui/.agents/ORIGINAL_REQUEST.md` (specifically `## Follow-up — 2026-09-19T14:59:02Z` R3).
- Read `/home/yierke/Documents/vote-ui/PROJECT.md`.
- Read Explorer 2 report at `/home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_survey2_2/report.md` for exact line-level blueprints.

## Objectives
1. **0px Horizontal Overflow (320px–428px)**:
   - Ensure all subpages scale cleanly without horizontal document overflow between 320px and 428px.
   - Use `.table-wrap` (`overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch;`) around wide tables.
2. **VotePage Overhaul (`VotePage.tsx`)**:
   - Add inline tap-to-rank action chips `[1st]`, `[2nd]`, `[3rd]` (`.tap-rank-chip`) on candidate cards with >=44×44px touch area and 8px gap (`.tap-chips-group`).
   - Add slot Up/Down reorder chevrons (`.slot-reorder-btn`, 44×44px) with ▲/▼ on filled ballot slots (slot 1 has Down, slot 2 has Up & Down, slot 3 has Up).
   - Clear slot button has class `.slot-clear-btn` with 44×44px area.
   - Cast Ballot submit button label matches `/Cast (Your )?Ballot|cast-ballot|cast-vote/i` and is reachable on mobile.
   - Import and call `sounds` (`playPop()` on chip tap, `playReset()` on clear slot, `playLevelUp()` on ballot submit).
3. **PublicLeaderboard Stacked Mobile Podium (`PublicLeaderboard.tsx`)**:
   - Assign classes `.podium-place-1`, `.podium-place-2`, `.podium-place-3` to podium columns.
   - On `< 768px`, order places Gold (#1) on top, followed by Silver (#2) and Bronze (#3).
   - Wrap standings table in `<div className="table-wrap">`.
4. **DocsPage Wikipedia Layout (`DocsPage.tsx`)**:
   - Add `.docs-page-layout` (1 column on `< 768px`).
   - Wrap all 4 specification tables in `<div className="table-wrap">`.
   - Ensure infobox (`.wiki-infobox`) wraps cleanly on 320px screens.
5. **Secondary Pages (`SettingsPage.tsx`, `ProgressPage.tsx`, `GrabBoxPage.tsx`)**:
   - `SettingsPage`: 1 column on `< 768px` with horizontally scrollable `.settings-nav-tabs`.
   - `ProgressPage`: fluid `.progress-timeline-track` milestone track.
   - `GrabBoxPage`: responsive card layout.

## Verification Requirements
- Execute `npm run typecheck` (0 errors).
- Execute `node tests/runner.mjs --filter="Rank"`
- Execute `node tests/runner.mjs --filter="Reorder"`
- Execute `node tests/runner.mjs --filter="Overflow"`
- Execute `node tests/runner.mjs --filter="Secondary"`
- Document execution and results in `handoff.md`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
