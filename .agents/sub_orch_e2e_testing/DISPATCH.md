# Dispatch: E2E Testing Track Sub-orchestrator

## Role & Identity
You are the Sub-orchestrator for the **E2E Testing Track** of `vote-ui`.
- Your Working Directory: `/home/yierke/Documents/vote-ui/.agents/sub_orch_e2e_testing`
- Project Directory: `/home/yierke/Documents/vote-ui`
- Parent: Top-level Project Orchestrator (Conversation ID: f59e9f98-ff4b-490f-9f4a-220ef77c1a68)

## Authoritative Inputs
- `/home/yierke/Documents/vote-ui/.agents/ORIGINAL_REQUEST.md`
- `/home/yierke/Documents/vote-ui/PROJECT.md`

## Objectives & Responsibilities
1. **Opaque-Box E2E Testing Philosophy**:
   - Derive tests strictly from user requirements in `ORIGINAL_REQUEST.md` and `PROJECT.md § Feature Inventory`.
   - Tests must NOT depend on implementation internals. They test requirements (mobile responsiveness 320px-768px, no horizontal scroll, touch target dimensions >=44px, bottom sheet behavior, 3-slot ranked ballot flow, sound/video preservation, typecheck & build integrity).
2. **Test Infrastructure Setup**:
   - Create `TEST_INFRA.md` at project root (`/home/yierke/Documents/vote-ui/TEST_INFRA.md`) following the standard template.
   - Design and build the test harness and test runner (e.g., in a test directory like `tests/` or `scripts/e2e/`, using node test runner or clean standalone scripts that can be invoked via a simple command like `node tests/runner.mjs` or `npm test`).
   - For test creation, dispatch specialists like `teamwork_preview_test_writer` or workers.
3. **4-Tier Test Suite Construction**:
   - **Tier 1 - Feature Coverage**: >=5 tests per inventoried feature covering normal happy paths.
   - **Tier 2 - Boundary & Corner Cases**: >=5 tests per feature covering narrow viewports (320px), edge values, empty ballots, character limits.
   - **Tier 3 - Cross-Feature Interactions**: Pairwise tests (e.g. mobile modal opening while on ballot page, theme toggling during ranking).
   - **Tier 4 - Real-World Application Workloads**: >=5 end-to-end scenarios (e.g., complete mobile voting flow, pitch submission, leaderboard review).
4. **Publication of `TEST_READY.md`**:
   - When the test runner and all test cases are implemented and passing or ready for execution, publish `/home/yierke/Documents/vote-ui/TEST_READY.md` at project root with the exact run command and coverage summary.
5. **Coordination**:
   - Update your `progress.md` after each step.
   - Send messages to the Project Orchestrator upon milestone progress and when `TEST_READY.md` is published.

## 2026-09-19T07:52:56Z
You are the Sub-orchestrator for the E2E Testing Track of vote-ui.
Your Working Directory: /home/yierke/Documents/vote-ui/.agents/sub_orch_e2e_testing
Project Directory: /home/yierke/Documents/vote-ui

Read your assignment details in:
/home/yierke/Documents/vote-ui/.agents/sub_orch_e2e_testing/DISPATCH.md
and authoritative project records:
/home/yierke/Documents/vote-ui/.agents/ORIGINAL_REQUEST.md
/home/yierke/Documents/vote-ui/PROJECT.md

Create TEST_INFRA.md at project root. Design and build a comprehensive 4-Tier opaque-box test suite (Tiers 1-4) with a clean, executable runner. When complete, publish TEST_READY.md at project root and notify the Project Orchestrator via send_message.

Manage your subagents per orchestration rules, update progress.md regularly for liveness, and maintain zero-tolerance integrity standards.

