# Dispatch: Explorer 3 (Layout Wrappers, Mobile Scrolling & Popovers)

## Mission
Investigate `src/App.tsx`, `src/components/SettingsDropdown.tsx`, and layout classes in `src/styles.css` to formulate a precise implementation strategy for:
1. Making `.app-root-layout.layout-with-sidebar` responsive on `< 768px` by switching from `flex-direction: row` with fixed padding to `flex-direction: column` with mobile-safe padding.
2. Unlocking vertical scrolling on `.page-view-wrapper.page-non-scroll` on viewports `< 1024px` (`overflow-y: auto; -webkit-overflow-scrolling: touch;`), while preserving the desktop non-scroll locking on desktop (>= 1024px).
3. Fixing `SettingsDropdown` / `.account-overview-popover` positioning on mobile viewports so it does not calculate negative horizontal offsets or clip off-screen.
4. Ensuring zero horizontal scrollbar triggers on viewports between 320px and 768px in the shell layouts.

## Authoritative Files to Read
- `/home/yierke/Documents/vote-ui/.agents/ORIGINAL_REQUEST.md` (MANDATORY)
- `/home/yierke/Documents/vote-ui/PROJECT.md`
- `/home/yierke/Documents/vote-ui/.agents/sub_orch_milestone_1/SCOPE.md`
- `/home/yierke/Documents/vote-ui/src/App.tsx`
- `/home/yierke/Documents/vote-ui/src/components/SettingsDropdown.tsx`
- `/home/yierke/Documents/vote-ui/src/styles.css`
- Modern web guidance skill: `/home/yierke/.gemini/config/plugins/modern-web-guidance-plugin/skills/modern-web-guidance/SKILL.md`

## Output Requirements
Write your detailed findings and implementation proposal to:
`/home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_m1_3/handoff.md`
Include concrete code/CSS snippets, verification commands, and risk assessments.
Do NOT modify source files yourself (Explorer is read-only).
Send completion message to Sub-orchestrator parent when done.

## 2026-09-19T07:55:02Z
You are Explorer 3 for Milestone 1 of vote-ui.
Your Working Directory: /home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_m1_3
Project Directory: /home/yierke/Documents/vote-ui

Read your assignment in:
/home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_m1_3/DISPATCH.md
and authoritative project records:
/home/yierke/Documents/vote-ui/.agents/ORIGINAL_REQUEST.md
/home/yierke/Documents/vote-ui/PROJECT.md
/home/yierke/Documents/vote-ui/.agents/sub_orch_milestone_1/SCOPE.md

Investigate src/App.tsx, src/components/SettingsDropdown.tsx, and layout classes in src/styles.css to formulate an implementation strategy for:
1. Making .app-root-layout.layout-with-sidebar responsive on <768px (flex-direction: column).
2. Unlocking vertical scrolling on .page-view-wrapper.page-non-scroll on viewports <1024px (overflow-y: auto) while preserving 100vh lock on desktop.
3. Fixing SettingsDropdown / account popover position on mobile so it does not clip off-screen.
4. Eliminating any horizontal scrolling on viewports 320px-768px in the root layout shell.

Write your report to /home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_m1_3/handoff.md and notify me via send_message when complete. Remember that you are read-only: do not edit project source files.
