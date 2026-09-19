# Survey Report 2: Core Voting Flow, Candidate Pitch Cards, Ranked Ballot Selector & Touch Ergonomics

**Inspector**: Survey Explorer 2  
**Target Repository**: `vote-ui` (`/home/yierke/Documents/vote-ui`)  
**Date**: 2026-09-19  
**Status**: Comprehensive Survey Completed  
**Primary Files Inspected**:
- `/home/yierke/Documents/vote-ui/src/views/VoterApp/VotePage.tsx`
- `/home/yierke/Documents/vote-ui/src/App.tsx`
- `/home/yierke/Documents/vote-ui/src/styles.css`
- `/home/yierke/Documents/vote-ui/src/hooks/useVotingApi.ts`
- `/home/yierke/Documents/vote-ui/src/utils/soundEffects.ts`
- `/home/yierke/Documents/vote-ui/src/context/AuthContext.tsx`
- `/home/yierke/Documents/vote-ui/src/context/SettingsContext.tsx`
- `/home/yierke/Documents/vote-ui/src/api/client.ts`
- `/home/yierke/Documents/vote-internals/src/validate-ballot.ts`

---

## 1. Executive Summary

The voting workflow in `vote-ui` implements a 3-tier ranked choice ballot system where community voters expend 6 points across three distinct slots:
- **1st Choice (Rank 1)**: 3 Points (Gold highlight)
- **2nd Choice (Rank 2)**: 2 Points (Silver highlight)
- **3rd Choice (Rank 3)**: 1 Point (Bronze highlight)

On desktop viewports (>= 1024px), the layout operates as a side-by-side two-column dashboard (`1.15fr 1fr`):
1. **Left Column**: A vertical slot machine roller containing pitch cards with video/image thumbnails and inspection triggers, backed by a deterministic seeded Fisher-Yates PRNG shuffle to neutralize candidate presentation primacy bias.
2. **Right Column**: The 3-tier ranked drop slots with drag-and-drop targets, validation banners, and ballot submission triggers.

### Critical Mobile Usability Blockers Identified
1. **Fatal Mobile Layout Trapping & Column Clipping**:
   - `App.tsx` locks the ballot page into `page-non-scroll` (`overflow: hidden; height: 100%`) inside `container-sidebar` (`height: calc(100vh - 24px); overflow: hidden;`).
   - `.vote-layout-grid` has `overflow: hidden;`. At `@media (max-width: 1024px)`, it switches to `grid-template-columns: 1fr`, stacking Column 2 (Ballot Slots & Submit Button) beneath Column 1 (Roller).
   - Because Column 1 occupies full height and the parent containers strictly forbid page scrolling, **Column 2 (the ballot slots, validation errors, and Cast Vote button) is pushed below the fold and rendered completely unreachable and invisible on phones and small tablets**.
2. **HTML5 Drag-and-Drop Incompatibility on Touchscreens**:
   - Desktop uses native HTML5 Drag and Drop (`draggable`, `onDragStart`, `onDragOver`, `onDrop`).
   - Mobile touchscreens do NOT fire HTML5 drag events without polyfills. Mobile users cannot drag cards into slots or drag slots to rearrange them.
3. **Severe Touch Target Deficiencies (< 44×44px)**:
   - Clear slot buttons: `20px` height (55% below minimum).
   - Thought bubble brief trigger: `32×32px` (28% below minimum).
   - Pool submit button: `22px` height (50% below minimum).
   - Card "Inspect" link: unpadded text link (`11px`).
   - Quick slot buttons in detail view: `~30px` height.
   - No quick reorder controls exist for single-handed mobile usage.
4. **Lack of Inline Card Actions**:
   - Tapping any candidate card immediately opens the full Detail View (`vote-detail-view`), displacing the entire proposal pool.
   - To vote on mobile, users are trapped in a tedious loop: Tap Card -> Detail View -> Tap Slot -> Tap Back to Roller -> Repeat 3 times.
   - No direct tap-to-rank buttons exist on the cards in the pool list.

---

## 2. Architecture & State Management

### 2.1 State Boundaries & Call Hierarchy

```
App.tsx (Root State Orchestrator)
 │
 ├── rank1, rank2, rank3 (strings: entry IDs)
 ├── handleSelectRank(rank, entryId) [Bidirectional swap / assignment]
 ├── handleClearSlot(rank)
 ├── handleSubmitBallot() [Calls castBallotMutation.mutateAsync]
 ├── auto-populate via useMyBallot(currentRoundId)
 │
 └── VotePage.tsx (Presentation & Local Interaction State)
      ├── selectedEntryId (string | null -> switches Roller vs Detail View)
      ├── focusedIndex (number -> keyboard / wheel focus index)
      ├── draggedId, dragOverSlot, isDragOverPool (Drag & Drop states)
      ├── randomizedEntries (deterministic seeded shuffle)
      └── validate_ballot(ballot, activeEntrySet) from @platform/internal-logic
```

### 2.2 Rank Assignment & Swapping Logic (`App.tsx`)
In `App.tsx` (lines 117–140), `handleSelectRank(rank, entryId)` handles slotting:
- **Intra-ballot Swap**: If `entryId` is already in a slot (e.g. Slot 2) and the user assigns it to Slot 1, `handleSelectRank` performs a bidirectional swap: Slot 1 gets `entryId`, and Slot 2 receives the previous occupant of Slot 1.
- **Direct Assignment**: If `entryId` is not yet in any slot, it directly fills the target slot.
- **Clear Action**: `handleClearSlot(rank)` resets that rank state to `''`.

### 2.3 Deterministic Fisher-Yates Permutation (`VotePage.tsx`)
Lines 48–67 implement a deterministic seeded Fisher-Yates PRNG:
- Seed: `${voterId || 'community_voter'}-${activeRound?.id || 'round-seed'}-pool-perm`
- Algorithm: 32-bit FNV-1a hash seed initializing a mulberry32 PRNG.
- Purpose: Ensures every voter sees a consistent, reproducible candidate order for that round while eliminating top-of-page presentation bias across different voters.
- **Preservation Requirement**: This algorithm must remain untouched.

### 2.4 Ballot Validation (`@platform/internal-logic`)
Imported from `@platform/internal-logic`:
`validate_ballot(ballot, activeEntrySet)` checks:
1. `ballot.voterId`: Must be non-empty string.
2. Complete 6-point expenditure: `rank1`, `rank2`, and `rank3` must all be populated (no partial ballots allowed).
3. Anti-stacking: `rank1 !== rank2`, `rank1 !== rank3`, `rank2 !== rank3`.
4. Round integrity: All three IDs must exist in `validEntrySet`.

---

## 3. Candidate Pitch Cards Analysis

### 3.1 Anatomy of `.slot-roller-card`
Inside `.slot-roller-container`:
- **Dimensions & Box Model**:
  - `padding: 14px 20px`
  - `border-radius: var(--radius-md)` (14px)
  - `border: 1px solid var(--border-subtle)`
  - `cursor: grab; user-select: none;`
- **Center Focus State** (`.center-focus`):
  - Green accent border (`var(--accent-green)`, 2px), subtle glow (`box-shadow: 0 8px 24px -4px rgba(34, 197, 94, 0.28)`), and gradient background.
- **Ranked State** (`.is-ranked`):
  - `opacity: 0.55; border-style: dashed;`
- **Internal Content Hierarchy**:
  1. Top metadata row: Category badge (`.badge-engine`), rank status badge (`.slot-badge.slot-rank-X` if ranked), and mono entry ID.
  2. Title: 14px, weight 800, `color: var(--text-main)`.
  3. Description: 12px, 2-line clamp (`-webkit-line-clamp: 2`).
  4. Author row: Avatar circle (20×20px) + "By {username}" + "Inspect" text link.
  5. Media Preview: `.slot-card-media-preview`:
     - Fixed `width: 120px; height: 84px; border-radius: 8px;`
     - Video preview: `<video src={mediaUrl} muted playsInline preload="metadata" />` with play triangle indicator.
     - Image preview: `<img src={mediaUrl} />`.

### 3.2 Mobile Responsiveness Deficiencies of Candidate Cards
1. **Side-by-Side Media Pinch**:
   - The card uses a horizontal flex container (`display: flex; gap: 14px;`).
   - The media preview is locked to `width: 120px`.
   - On viewports < 400px (or when the right rail occupies 64px), available card width is ~260px.
   - Subtracting 120px media and 14px gap leaves only ~126px for title, description, and author badges.
   - Text overflows or clips awkwardly.
2. **Missing Tap-to-Rank Controls**:
   - There are zero slotting buttons on the card itself.
   - Dragging is impossible on touch.
   - Users are forced to open the modal-like detail view for every candidate.

### 3.3 Detail Inspection View (`.vote-detail-view`)
When `selectedEntryId` is active:
- Replaces the entire roller with a detailed inspection card (`padding: 28px; gap: 20px;`).
- Large media container (`max-height: 280px;`) with interactive `<video controls />` or full image.
- Creator avatar chip (`submitter-avatar-img-lg`, 34×34px).
- Full un-truncated description (`white-space: pre-wrap`).
- Three quick slot action buttons: "Slot 1st (3p)", "Slot 2nd (2p)", "Slot 3rd (1p)".
- **Mobile flaw**: "Back to Roller" is located at the top-left (farthest reach from right thumb), and buttons have only 30px height.

---

## 4. 3-Tier Ranked Ballot Selector Analysis

### 4.1 Slot Hierarchy & Styling (`.drop-slots-column`)
The three target slots represent decreasing point values:
1. **Slot 1 (3 Points - Gold)**:
   - CSS: `.slot-drop-target.slot-1.filled`
   - Border: `var(--accent-gold)` (#f59e0b)
   - Background: `linear-gradient(180deg, rgba(234, 179, 8, 0.06) 0%, var(--bg-card) 100%)`
   - Shadow: `0 8px 24px -2px rgba(234, 179, 8, 0.2)`
2. **Slot 2 (2 Points - Silver)**:
   - CSS: `.slot-drop-target.slot-2.filled`
   - Border: `var(--accent-silver)` (#64748b)
   - Background: `linear-gradient(180deg, rgba(148, 163, 184, 0.06) 0%, var(--bg-card) 100%)`
   - Shadow: `0 8px 24px -2px rgba(148, 163, 184, 0.2)`
3. **Slot 3 (1 Point - Bronze)**:
   - CSS: `.slot-drop-target.slot-3.filled`
   - Border: `var(--accent-bronze)` (#d97706)
   - Background: `linear-gradient(180deg, rgba(217, 119, 6, 0.06) 0%, var(--bg-card) 100%)`
   - Shadow: `0 8px 24px -2px rgba(217, 119, 6, 0.2)`

### 4.2 Interactive Slot States
- **Empty State**:
  - Displays `.cue-pulse` animation (`target-glow-pulse 2.2s infinite ease-in-out`).
  - Text: "Drag & drop an entry box here for X points".
- **Drag-Over State**:
  - `.drag-over`: `border-color: var(--accent-green); background: rgba(34, 197, 94, 0.08); transform: scale(1.02);`
- **Filled State**:
  - Displays candidate title, submitter avatar, compact media thumbnail (54×42px).
  - Clear button: `.btn.btn-secondary.btn-sm` (`padding: 2px 8px; fontSize: 11px;`).
  - Draggable: `draggable={Boolean(rankX) && !isBarred}`.

### 4.3 Validation & Submission Bar
- Complete indicator: "3 of 3 Slots Selected" vs "Incomplete Ballot".
- Validation errors: `.callout.callout-danger` showing errors from `validate_ballot`.
- Discord Auth callout: `.callout.callout-warning` when unauthenticated.
- Primary CTA:
  - Unauthenticated: "Log In to Vote" (`#5865F2`).
  - Authenticated: "Cast Vote" (or "Update Vote" if `myBallot` exists).

---

## 5. Touch Ergonomics & Mobile Interaction Audit

### 5.1 Interactive Elements Touch Target Audit (WCAG 2.5.5 / 44×44px Standard)

| Interactive Element | File & Line | Current Rendered Size | Status | Remediation Required |
|---|---|---|---|---|
| **Round Brief Trigger** | `VotePage.tsx:210` | 32×32px circle | **FAIL** (28% undersized) | Expand hit target to min 44×44px via padding or larger button |
| **Round Brief Popover** | `VotePage.tsx:220` | Hover-triggered `div` | **FAIL** (No touch support) | Convert hover popover to tap-toggle dialog / bottom sheet |
| **Submit Proposal (Header)** | `VotePage.tsx:263` | ~34px height (`padding: 8px 18px`) | **FAIL** (undersized height) | Set `min-height: 44px; display: inline-flex; align-items: center;` |
| **Back to Roller Button** | `VotePage.tsx:297` | ~30px height (`.btn-sm`) | **FAIL** (undersized) | Increase to `min-height: 44px; padding: 10px 16px;` |
| **Quick Slot 1st (Detail)** | `VotePage.tsx:354` | ~30px height (`.btn-sm`) | **FAIL** (undersized) | Set `min-height: 44px; flex: 1; font-size: 13px;` |
| **Quick Slot 2nd (Detail)** | `VotePage.tsx:361` | ~30px height (`.btn-sm`) | **FAIL** (undersized) | Set `min-height: 44px; flex: 1; font-size: 13px;` |
| **Quick Slot 3rd (Detail)** | `VotePage.tsx:368` | ~30px height (`.btn-sm`) | **FAIL** (undersized) | Set `min-height: 44px; flex: 1; font-size: 13px;` |
| **Submit Pitch (Pool Head)** | `VotePage.tsx:386` | ~22px height (`padding: 2px 10px`) | **FAIL** (50% undersized) | Enlarge to `min-height: 44px; padding: 8px 14px;` |
| **Candidate Card Container** | `VotePage.tsx:430` | ~120px height | PASS on area, FAIL on intent | Card click intercepts scrolling; opens detail instead of quick vote |
| **Candidate "Inspect" Text** | `VotePage.tsx:472` | 11px unpadded span | **FAIL** (no hit box) | Replace with explicit button or badge meeting 44×44px |
| **Slot 1 Clear Button** | `VotePage.tsx:532` | 45×20px (`padding: 2px 8px`) | **FAIL** (55% undersized height)| Set `min-height: 44px; min-width: 44px;` with centered ✕ icon |
| **Slot 2 Clear Button** | `VotePage.tsx:584` | 45×20px (`padding: 2px 8px`) | **FAIL** (55% undersized height)| Set `min-height: 44px; min-width: 44px;` with centered ✕ icon |
| **Slot 3 Clear Button** | `VotePage.tsx:636` | 45×20px (`padding: 2px 8px`) | **FAIL** (55% undersized height)| Set `min-height: 44px; min-width: 44px;` with centered ✕ icon |
| **Slot Reorder Controls** | Not implemented | Non-existent | **CRITICAL DEFICIT** | Add 44×44px Up/Down chevrons or Swap buttons on filled slots |
| **Cast Vote / Log In Button** | `VotePage.tsx:696,704` | ~38px height | **FAIL** (< 44px height) | Enlarge to `min-height: 48px; width: 100%;` on mobile |

### 5.2 Single-Handed Mobile Ergonomics & Thumb Zone Mapping
On mobile devices (320px–430px wide, 667px–932px tall), single-handed users interact predominantly within the **Natural Thumb Zone** (bottom 40% of viewport):
- **Current Layout Conflict**:
  - The ballot slots and submission button are stacked at the bottom of the document beneath a long list of cards.
  - Due to `overflow: hidden` on parent containers, they cannot even be scrolled into view!
  - If a card is clicked, the "Back to Roller" button appears at the top-left (the "Hard to Reach / Red Zone" for right-handed thumb usage).
- **Recommended Ergonomic Architecture**:
  1. **Inline Card Rank Chips**:
     Provide three tap chips on every candidate card: `[1st (3p)]`, `[2nd (2p)]`, `[3rd (1p)]` with minimum 44×44px touch bounding boxes. Voters can assemble their entire ballot directly while scrolling through pitches with their thumb.
  2. **Touch Quick-Reorder Controls on Slots**:
     Each filled slot should feature prominent, thumb-friendly reorder controls:
     - Up chevron (`▲`, 44×44px): Swaps entry with the slot above.
     - Down chevron (`▼`, 44×44px): Swaps entry with the slot below.
     - Clear button (`✕`, 44×44px): Removes entry from slot.
  3. **Mobile Segmented Switcher or Sticky Bottom Ballot Drawer**:
     - Provide a mobile view toggle: `[ Browse Pitches (X) ]` and `[ My Ballot (X/3) ]`.
     - Or introduce a sticky bottom ballot bar showing slot status (`[1: Gold] [2: Silver] [3: Empty] -> Review & Cast`) that slides up a mobile bottom sheet with the ranked slots, reorder controls, and full-width 48px "Cast Vote" button right inside the thumb zone.

---

## 6. Sounds & Audio Engine Analysis

### 6.1 Sound Engine Architecture (`src/utils/soundEffects.ts`)
```ts
// Sound engine disabled for UI interactions - audio playback is reserved exclusively for video players

class SoundEngine {
  public setEnabled(_enabled: boolean): void {}
  public isEnabled(): boolean { return false; }
  public playClick(): void {}
  public playSlot(): void {}
  public playPop(): void {}
  public playLevelUp(): void {}
  public playWhoosh(): void {}
  public playReset(): void {}
}

export const sounds = new SoundEngine();
```

### 6.2 Settings & Audio Policy
- `SettingsContext.tsx`:
  - Tracks `settings.soundEffects` (persisted in `localStorage.getItem('mcs_sound_effects')`).
  - Calls `sounds.setEnabled(settings.soundEffects)`.
  - Can be toggled via Settings Page or Command Palette (`act-sound`).
- Existing Triggers in Codebase:
  - `CreatePitchModal.tsx`: Calls `sounds.playReset()`, `sounds.playPop()`, `sounds.playLevelUp()`.
  - `CommandPalette.tsx`: Calls `sounds.playPop()`, `sounds.playReset()`, `sounds.playClick()`, `sounds.playSlot()`.
- Video Audio Policy:
  - **Core platform principle**: "Audio playback is reserved exclusively for video players."
  - Thumbnail videos in roller: `<video muted playsInline preload="metadata" />` — strictly muted.
  - Detail inspection view: `<video controls />` — full user-initiated audio playback.

### 6.3 Integration Recommendations for Voting Flow
To maintain zero regressions while integrating with the audio system:
- Add audio trigger hooks in `VotePage.tsx`:
  - `sounds.playSlot()`: Triggered when an entry is assigned to a rank (via tap chip or drag-and-drop).
  - `sounds.playClick()`: Triggered when slots are reordered or swapped.
  - `sounds.playReset()`: Triggered when a slot is cleared.
  - `sounds.playLevelUp()`: Triggered when the ballot is successfully submitted (`handleSubmitBallot` success).
- Because `SoundEngine` methods are safe no-ops when disabled, adding these hooks maintains architectural consistency without violating the audio policy.

---

## 7. Animations & Visual Effects Audit

1. **Empty Slot Pulse (`.cue-pulse`)**:
   - Lines 3086–3099 in `styles.css`:
     `animation: target-glow-pulse 2.2s infinite ease-in-out;`
     Pulses border color to `var(--accent-gold)` with a 16px glow. Guides user attention to empty drop slots.
2. **Detail View Entrance (`.vote-detail-view`)**:
   - Lines 2967–2979 in `styles.css`:
     `animation: detail-appear 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);`
     Animates `opacity: 0 -> 1` and `transform: translateY(6px -> 0)`.
3. **Roller Focus (`.center-focus`)**:
   - Green border, translateY(-2px), and green shadow.
4. **Unused Doodle Arrow Assets in CSS**:
   - Lines 3004–3057 in `styles.css` contain `.doodle-arrow-container`, `.doodle-arrow-svg`, `.doodle-arrow-path`, and `.doodle-badge` under the comment `/* VOTE PAGE: ANIMATED DOODLE ARROW (ENTRIES TO EMPTY SLOTS) */`.
   - These styles are currently orphaned (not referenced in `VotePage.tsx`).
5. **Reduced Motion Accessibility**:
   - `SettingsContext.tsx` tracks `settings.reducedMotion`.
   - Respects `prefers-reduced-motion` and suppresses blaze transitions and animations.

---

## 8. API & Mock Bindings Audit

### 8.1 API Surface (`src/hooks/useVotingApi.ts`)

| Hook | HTTP Endpoint | HTTP Method | Polling / Stale Time | Query Invalidation Trigger |
|---|---|---|---|---|
| `useRounds()` | `/rounds` | GET | Stale: 10s | On round create/delete/status change |
| `useActiveRound()` | Derived from `useRounds()` | - | - | Auto-syncs with rounds query |
| `useRoundEntries(roundId)` | `/rounds/{roundId}/entries` | GET | Stale: 10s | On entry submit/moderate/delete |
| `useMyBallot(roundId)` | `/rounds/{roundId}/ballots/mine` | GET | Enabled if user logged in | On `castBallotMutation.onSuccess` |
| `useLiveLeaderboard(roundId)`| `/rounds/{roundId}/leaderboard` | GET | Refetch: 3000ms | On `castBallotMutation.onSuccess` |
| `useLiveTelemetry(roundId)` | `/rounds/{roundId}/telemetry` | GET | Refetch: 5000ms | On `castBallotMutation.onSuccess` |
| `useCastBallot(roundId)` | `/rounds/{roundId}/ballots` | POST | Mutation | Invalidates leaderboard, ballots, telemetry |
| `useSubmitEntry(roundId)` | `/rounds/{roundId}/entries` | POST | Mutation | Invalidates entries, leaderboard |

### 8.2 Ballot Mutation Payload
`useCastBallot` sends:
```json
{
  "rank1_entry_id": "<entryId>",
  "rank2_entry_id": "<entryId>",
  "rank3_entry_id": "<entryId>"
}
```
Expects: `{ success: boolean, data?: any }`.
On submission failure: Throws descriptive error, alerted via error banner or try/catch.
On submission success: Shows `ballotSuccessMessage` ("Your vote was successfully recorded in the live pool.") for 5 seconds.

---

## 9. Layout, Breakpoints & Container Query Modernization Plan

### 9.1 Root Cause of Current Mobile Breakage
1. **Outer Layout Row Lock**:
   ```css
   .app-root-layout.layout-with-sidebar {
     flex-direction: row; /* Locks nav rail to right side on mobile */
     padding: 12px;
     gap: 14px;
     height: 100vh;
     overflow: hidden; /* Forbids window scroll */
   }
   ```
2. **Dashboard Container Overflow Lock**:
   ```css
   .dashboard-container.container-sidebar {
     height: calc(100vh - 24px);
     overflow: hidden; /* Forbids container scroll */
   }
   ```
3. **Page View Non-Scroll Lock**:
   ```css
   .page-view-wrapper.page-non-scroll {
     overflow: hidden;
     height: 100%;
   }
   ```
4. **Grid Stacking with Hidden Overflow**:
   ```css
   .vote-layout-grid {
     overflow: hidden; /* Clips anything beyond viewport height */
   }
   @media (max-width: 1024px) {
     .vote-layout-grid {
       grid-template-columns: 1fr; /* Stacks column 2 below column 1 */
     }
   }
   ```

### 9.2 Proposed Responsive Architecture
To satisfy Requirement R1 (scaling fluidly from 320px to 768px without horizontal scrollbars or clipping) and Requirement R3 (preserving desktop fidelity >= 1024px):

1. **Breakpoints Strategy**:
   - `Desktop (>= 1024px)`: Retain existing 2-column side-by-side grid (`1.15fr 1fr`), drag-and-drop, full mouse-wheel roller, and desktop sidebar.
   - `Tablet (768px - 1023px)`: Fluid 2-column layout or scrollable stacked layout with sticky ballot summary.
   - `Mobile (< 768px down to 320px)`:
     - Nav rail transforms to responsive bottom navigation or header bar.
     - `.page-view-wrapper.page-non-scroll` on mobile must allow vertical scrolling (`overflow-y: auto`) OR provide a segmented tab switch (`Pitches` | `Ballot (X/3)`).
     - Remove fixed `height: 100vh; overflow: hidden;` constraints on mobile.

2. **Container Queries**:
   - Add `container-type: inline-size; container-name: vote-page;` on the voting card container.
   - `@container vote-page (max-width: 720px)`:
     - Card media preview switches to compact thumbnail (72×72px) or full-width banner.
     - Inline rank buttons (`1st`, `2nd`, `3rd`) render on cards.
     - Drop slots show touch chevrons (`▲`/`▼`) and 44×44px clear buttons.
     - Sticky bottom ballot summary dock activates.

---

## 10. Summary Checklist for Implementers

- [ ] Add mobile tabbed navigation or sticky bottom ballot bar for screens < 768px.
- [ ] Add inline `[+ 1st]`, `[+ 2nd]`, `[+ 3rd]` tap buttons (min 44×44px) directly on candidate cards in the pool.
- [ ] Add `▲` / `▼` quick-reorder chevrons (min 44×44px) on filled ballot slots for instant touch rearrangement.
- [ ] Increase touch hit areas for all buttons (Clear buttons, Thought Bubble trigger, Back to Roller, Submit Pitch) to >= 44×44px.
- [ ] Convert Thought Bubble hover popover into a tap-friendly accessible dialog / popover.
- [ ] Make candidate card media thumbnail responsive (flexible on small mobile viewports, avoiding squished title text).
- [ ] Hook `sounds.playSlot()`, `sounds.playClick()`, and `sounds.playReset()` into voting actions while respecting the muted UI default.
- [ ] Remove `overflow: hidden` trap on mobile viewports so that users can smoothly scroll or switch between pitches and ballot slots.
- [ ] Ensure all changes pass `npm run build` and `npm run typecheck` with 0 errors.
