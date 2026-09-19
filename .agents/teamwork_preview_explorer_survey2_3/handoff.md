# Handoff Report: Explorer 3 — R5 (Dev Viewport Simulator) & R6 (Dev Workbench RBAC)

**Handoff Type**: Hard (Investigation Complete)  
**Agent ID**: `teamwork_preview_explorer_survey2_3`  
**Parent Agent ID**: `0db9731e-f93e-42ce-a73c-7ad6d7a58e25`  
**Working Directory**: `/home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_survey2_3`  
**Date**: 2026-09-19T15:16:00Z  

---

## 1. Observation

1. **DevWorkbench Current Structure**:
   - Located at `src/views/DevWorkbench/DevWorkbench.tsx` (891 lines).
   - Contains 5 sub-tabs at lines 42-45: `'moderation' | 'moments' | 'telemetry' | 'network' | 'roles'`.
   - Gating check at line 205: `if (!isStaff(user?.role))` renders a generic `Restricted Console` card.
   - Mode badge at line 272 renders `{(user?.role || 'supervisor').toUpperCase()} MODE` with class `badge-engine` regardless of tier.
   - `Delete Round` button at lines 308-315 is rendered directly whenever `rounds.length > 0` with no role check.
   - Proposal deletion `×` button in moderation table at line 512 is rendered on every row with no role check.
   - Proposal deletion button in `Inspect` modal at line 851 is rendered with no role check.
   - `Roles` tab button at lines 265-269 is rendered for any user passing `isStaff()`, including `moderator`.
   - In `src/views/DevWorkbench/RolesManagementView.tsx:572`, the role select dropdown is disabled with `disabled={!user || (user.role !== 'admin' && !HARDCODED_ADMIN_DISCORD_IDS.has(user.discordId))}`, which blocks supervisors from modifying roles.

2. **Authentication & Roles System**:
   - Located at `src/context/AuthContext.tsx`.
   - `UserRole` defined at line 5: `export type UserRole = 'user' | 'moderator' | 'admin' | 'supervisor';`.
   - `isStaff` defined at lines 7-9: `return role === 'admin' || role === 'moderator' || role === 'supervisor';`. Does not handle prefix `supervisor_*` for departmental roles.
   - `DEV_DEFAULT_USER` defined at lines 45-52: defaults to `role: 'admin'`.
   - `loginAsUser(profile)` at lines 292-298 allows instant switching of sessions for testing.

3. **CSS Media Queries vs Container Queries**:
   - `src/styles.css` declares responsive rules via `@media (max-width: 767px)`, `@media (min-width: 768px) and (max-width: 1023px)`, `@media (min-width: 1024px)`.
   - These `@media` queries evaluate against the window/viewport. In-tree `div` wrappers cannot trigger `@media (max-width: 767px)` when run on desktop viewports; an `<iframe>` browsing context is required for authentic responsive rendering.

4. **Test Suite Execution**:
   - Ran `node tests/runner.mjs --filter="DevWorkbench"`:
     ```
     ✖ [T1-SEC-04] DevWorkbench wide telemetry tables are enclosed in .table-wrap containers
     ✖ [T2-TOUCH-03] DevWorkbench moderation action buttons (Approve, Reject, Purge) meet >=44px height
     ```
   - In `DevWorkbench.tsx:384`, table wrapper uses `className="table-responsive"` instead of `table-wrap`.
   - `.btn-moderation` is not defined in `src/styles.css` and not used in `DevWorkbench.tsx`.
   - Ran `npm run typecheck`: Passed with 0 TypeScript errors.
   - Ran `npm run build`: Passed cleanly in 1.19s with 0 errors.

---

## 2. Logic Chain

1. **R6 Logic**:
   - Requirement R6 requires that `moderator` role can perform content moderation (Approve, Flag as AI, Reject), inspect AI detection audits, view Moments variance, review Telemetry anomalies, and monitor Network health.
   - Destructive lifecycle actions (Permanent Proposal Deletion, Round Deletion) and the `Roles & Staff Management` tab must be strictly restricted to `admin` and `supervisor`.
   - Because `DevWorkbench.tsx` currently renders these actions unconditionally to any user passing `isStaff()`, a moderator currently has access to round deletion, proposal deletion, and the roles tab.
   - Therefore, an elevated check `isElevatedStaff(role)` must be introduced to gate:
     a) `Delete Round` button (only rendered if `isElevatedStaff(user?.role)`).
     b) Proposal deletion buttons in table and modal (only rendered if `isElevatedStaff(user?.role)`).
     c) `Roles` tab button in console sub-navigation (only rendered if `isElevatedStaff(user?.role)`), with a fallback clearance barrier card if accessed directly.
     d) Enabling role assignment in `RolesManagementView.tsx` for both `admin` and `supervisor`.
     e) Distinct role badges (`ADMINISTRATOR` in red, `SUPERVISOR` in violet/engine, `MODERATOR` in amber).

2. **R5 Logic**:
   - Requirement R5 requires an interactive Dev Viewport Simulator Toolbar with presets (iPhone SE, iPhone 15, Pixel 7, iPad Mini, Desktop Full), controls (zoom 50%–125%, rotate orientation, close, reset), and live photorealistic framed container.
   - Because standard CSS `@media` rules evaluate against the window object, an `<iframe>` running same-origin (`window.location.origin`) with a query flag `?sim_frame=1` provides true media query isolation.
   - The outer container provides device bezels, hardware cutouts (Dynamic Island for iPhone 15, punch-hole camera for Pixel 7), top status bar (time 9:41, wifi, battery), bottom home indicator bar, and touch cursor emulation.
   - When rotated, width and height swap cleanly (e.g. 768×1024 -> 1024×768), testing breakpoint transitions dynamically.
   - The simulator is launched via a floating developer dock button in dev mode or via Dev Workbench header.

3. **Test Alignment Logic**:
   - Updating `className="table-wrap table-responsive"` in `DevWorkbench.tsx:384` directly satisfies `[T1-SEC-04]`.
   - Adding `.btn-moderation { min-height: 44px; padding: 8px 14px; display: inline-flex; align-items: center; justify-content: center; }` to `src/styles.css` and using it on DevWorkbench action buttons satisfies `[T2-TOUCH-03]`.

---

## 3. Caveats

1. **Departmental Roles**: `RolesManagementView.tsx` lists several departmental supervisor roles (`supervisor_story`, `supervisor_art`, etc.). All checks must use prefix matching (`role === 'supervisor' || role?.startsWith('supervisor')`) to avoid inadvertent lockout.
2. **Iframe Recursion**: The simulator must check `window.self !== window.top || window.location.search.includes('sim_frame')` to prevent the simulator toolbar from recursively embedding itself inside the preview frame.
3. **Cross-Origin Limitations**: If deployed to an external preview domain with differing origins, iframe communication would require `postMessage`. In the current architecture, everything runs locally on Vite same-origin, making `localStorage` and direct access fully reliable.

---

## 4. Conclusion

1. DevWorkbench currently lacks the RBAC tier boundaries demanded by R6; moderators have unintended access to round deletion, proposal deletion, and the roles tab.
2. Adding `isElevatedStaff` gating and visual role badges will completely secure DevWorkbench and fulfill R6.
3. Building an `<iframe>`-backed photorealistic Dev Viewport Simulator with the 5 required presets and controls will deliver an authentic mobile preview experience and fulfill R5.
4. Addressing `.table-wrap` and `.btn-moderation` resolves existing test suite failures in `tests/tier1/secondary.test.mjs` and `tests/tier2/touch-targets-bound.test.mjs`.

Full technical details and component specifications are documented in:  
`/home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_survey2_3/report.md`.

---

## 5. Verification Method

To independently verify the findings in this report:

1. **Verify Role Gating Vulnerability in DevWorkbench**:
   - Inspect `src/views/DevWorkbench/DevWorkbench.tsx` at line 308 (`handleDeleteRound`), line 512 (`handleDeleteEntry`), line 851 (`Delete Proposal`), and line 265 (`activeConsoleTab === 'roles'`). Notice the absence of `user?.role === 'admin'` or elevated checks.
   - Inspect `src/views/DevWorkbench/RolesManagementView.tsx` line 572: notice that `user.role !== 'admin'` blocks supervisors from updating roles.

2. **Verify Existing Test Suite Assertions**:
   - Run: `node tests/runner.mjs --filter="DevWorkbench"`
   - Observe failures on `[T1-SEC-04]` (`.table-wrap`) and `[T2-TOUCH-03]` (`.btn-moderation`).

3. **Verify Build & Typecheck**:
   - Run: `npm run typecheck` (verifies 0 TypeScript errors).
   - Run: `npm run build` (verifies clean production bundle).
