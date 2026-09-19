# Comprehensive Investigation Report: R5 (Interactive Dev Viewport Simulator) & R6 (Staff RBAC in Dev Workbench)

**Explorer**: Explorer 3 (Dev Viewport Simulator & Dev Workbench RBAC)  
**Date**: 2026-09-19T15:15:00Z  
**Target Repository**: `vote-ui` (`/home/yierke/Documents/vote-ui`)  
**Scope**: 
- **Requirement R5**: Interactive Real-Time Dev Server Viewport Simulator Toolbar
- **Requirement R6**: Staff & Role-Based Permissions in Dev Workbench

---

## Executive Summary

This report delivers a comprehensive architectural and code-level investigation into implementing **R5** (an interactive real-time mobile device viewport simulator) and **R6** (strict role-based access control gating inside the Dev Workbench console).

Key findings:
1. **Current DevWorkbench Architecture**: DevWorkbench is located at `src/views/DevWorkbench/DevWorkbench.tsx` (891 lines) with five sub-tabs (`moderation`, `moments`, `telemetry`, `network`, `roles`). Currently, it only checks `isStaff(user?.role)` at the root. All staff tiers—including `moderator`—are unintentionally exposed to destructive operations (Round Deletion and Permanent Proposal Deletion) and the `Roles` management tab.
2. **Current RBAC Gaps**: In `DevWorkbench.tsx`, the `Delete Round` button, table deletion `×` button, and inspection modal `Delete Proposal` button have zero role checks. In `RolesManagementView.tsx`, role assignment is restricted solely to `admin` or hardcoded Discord IDs, blocking `supervisor` users despite supervisor elevated status. Role badges lack distinct visual tiers (all staff display generic `ENGINE MODE`).
3. **R5 Dev Viewport Simulator Design**: True CSS responsive evaluation requires an `<iframe>`-based isolated browsing context because standard CSS `@media (max-width: 768px)` queries evaluate against the window/viewport, not CSS container divs. The simulator architecture comprises a top control toolbar (presets, zoom 50%–125%, portrait/landscape orientation toggle, reset, close), photorealistic device chassis bezels (Dynamic Island, punch-hole camera, status bar, home indicator bar), and bidirectional synchronization.
4. **Existing Test Suite Synergies**: The existing test suite in `tests/` contains 138 tests across 4 tiers. Specific DevWorkbench tests `[T1-SEC-04]` (requires container class `.table-wrap`) and `[T2-TOUCH-03]` (requires class `.btn-moderation` with `min-height: 44px`) currently fail and will be cleanly resolved by these improvements.

---

## 1. Current Implementation Analysis: DevWorkbench, Roles, & State

### 1.1 File Architecture

| Component / Module | Path | Purpose |
|---|---|---|
| `DevWorkbench` | `src/views/DevWorkbench/DevWorkbench.tsx` | Main console hosting sub-tabs, round selector, moderation queue, inspection modal |
| `RolesManagementView` | `src/views/DevWorkbench/RolesManagementView.tsx` | Staff directory, live Discord presence polling, custom mutable roles, DB role assignment |
| `MomentsVarianceChart` | `src/views/DevWorkbench/MomentsVarianceChart.tsx` | Statistical moments, rank probabilities ($p_1, p_2, p_3$), variance, skewness, kurtosis |
| `RaidTelemetryChart` | `src/views/DevWorkbench/RaidTelemetryChart.tsx` | Velocity $Z$-score, vote clustering, anomaly severity indicator |
| `SupervisorModerationChart` | `src/views/DevWorkbench/SupervisorModerationChart.tsx` | Category distribution, submission queue health, AI radar distribution |
| `NetworkTelemetryChart` | `src/views/DevWorkbench/NetworkTelemetryChart.tsx` | Real-time endpoint health, latency graphs, API ping diagnostics |
| `AuthContext` | `src/context/AuthContext.tsx` | Discord OAuth session, user profile, role resolution, `isStaff`, `loginAsUser` |
| `App` | `src/App.tsx` | Root layout, routing (`diagnostics` tab renders `DevWorkbench`), modals |
| `Navbar` | `src/components/Navbar.tsx` | Navigation rail & mobile drawer; `diagnostics` tab filtered by `isStaff(user?.role)` |

### 1.2 Current Authentication & Role System

In `src/context/AuthContext.tsx`:
- **Role Types**: `UserRole = 'user' | 'moderator' | 'admin' | 'supervisor'`
- **Current Staff Check**:
  ```typescript
  export function isStaff(role?: string): boolean {
    return role === 'admin' || role === 'moderator' || role === 'supervisor';
  }
  ```
- **Local Dev Fallback**: Under local development (`isLocalDevEnvironment()`), the session defaults to `DEV_DEFAULT_USER` with `role: 'admin'`.
- **Discord Role Resolution**: `resolveDiscordRole(discordUser)` maps Discord administrator/moderator bits and role names (`administrator`, `admin`, `moderator`, etc.) to `'admin'`, `'moderator'`, or `'user'`.
- **Departmental Roles**: `RolesManagementView.tsx` defines supervisor sub-roles such as `'supervisor_story'`, `'supervisor_art'`, `'supervisor_animation'`, `'supervisor_post'`, `'supervisor_audio'`. Currently, `isStaff()` in `AuthContext.tsx` does not check `role.startsWith('supervisor')`, which causes departmental supervisors to be treated as non-staff unless normalized.

### 1.3 Actions and State in DevWorkbench

`DevWorkbench.tsx` manages:
1. **Sub-Nav Tab State**:
   - `activeConsoleTab`: `'moderation' | 'moments' | 'telemetry' | 'network' | 'roles'`
2. **Round Selection & Mutations**:
   - `selectedRoundId`: defaults to active round or first available round.
   - `handleDeleteRound(roundId)`: triggers `deleteRoundMutation.mutateAsync(roundId)`.
3. **Pitches / Content Moderation**:
   - `statusFilter`: `'all' | 'pending' | 'approved' | 'flagged' | 'rejected' | 'ai_flagged'`
   - `categoryFilter`: filter by submission category.
   - `searchQuery`: live substring filtering on title, submitter, and ID.
   - `handleUpdateStatus(entryId, status)`: updates status to `'approved'`, `'rejected'`, `'flagged'`, or `'pending_review'`.
   - `handleDeleteEntry(entryId)`: triggers `deleteEntryMutation.mutateAsync(entryId)`.
   - `inspectedEntry`: opens modal with AI detection metrics (vocabulary entropy, sentence burstiness, AI probability).
4. **Roles & Staff Management**:
   - Fetches users via TanStack Query `/users`.
   - Polls Discord presence status (`online`, `idle`, `dnd`, `offline`).
   - Updates user role via `updateRoleMutation` (`PATCH /users/:id/role`).
   - Manages custom mutable roles registry in `localStorage`.

### 1.4 Vulnerabilities & Missing Permissions Gaps

| Feature / UI Element | Current Behavior | Requirement R6 Specification | Gap Identified |
|---|---|---|---|
| **Round Deletion** (`Delete Round` button, line 308) | Rendered whenever `rounds.length > 0` | Strictly gated to `admin` / `supervisor` | Any moderator can trigger permanent round deletion |
| **Proposal Deletion** (Table `×` button, line 512) | Rendered on all rows for all staff | Strictly gated to `admin` / `supervisor` | Moderators can permanently delete proposals |
| **Proposal Deletion** (Inspect modal `Delete Proposal`, line 851) | Rendered in modal for all staff | Strictly gated to `admin` / `supervisor` | Moderators can permanently delete proposals |
| **Roles & Staff Management Tab** (Sub-nav, line 265) | Button visible to all staff (`moderator` included) | Strictly gated to `admin` / `supervisor` | Moderators can access staff management view |
| **Role Assignment in Roles View** (`RolesManagementView.tsx:572`) | `disabled={!user || (user.role !== 'admin' && !HARDCODED_ADMIN_DISCORD_IDS.has(user.discordId))}` | Gated to `admin` / `supervisor` | Supervisors are locked out of assigning roles |
| **Role Clearance Visual Feedback** (`DevWorkbench.tsx:272`) | Renders generic `{(user?.role \|\| 'supervisor').toUpperCase()} MODE` with class `badge-engine` | Clear visual feedback and role badges for tier distinctions | No clear color coding or clearance tier distinction |

---

## 2. Requirement R5: Interactive Real-Time Dev Server Viewport Simulator

### 2.1 Technical Challenge: Viewport Media Queries vs. Container Divs

In `src/styles.css`, responsive breakpoints are declared with standard CSS media queries:
- `@media (max-width: 767px)` — Mobile dock, mobile header, stacked layouts, bottom sheets.
- `@media (min-width: 768px) and (max-width: 1023px)` — Tablet layout adjustments.
- `@media (min-width: 1024px)` — Full desktop layout density, 64px right vertical navigation rail.

**Fundamental Invariant**: CSS `@media` queries evaluate against the **top-level browser viewport window**. Wrapping a component in a simple `<div style={{ width: 375 }}>` on a 1440px desktop monitor **does not trigger `@media (max-width: 767px)`**.
Therefore, to achieve a genuine, photorealistic real-time simulator where all mobile navigation docks, top contextual headers, bottom sheets, and responsive layouts activate precisely as they would on physical mobile devices, the active application must be hosted inside an **isolated same-origin `<iframe>`**.

### 2.2 Presets Specification

| Preset ID | Device Name | Native Resolution | Aspect Ratio | Form Factor | Physical Characteristics |
|---|---|---|---|---|---|
| `iphone-se` | iPhone SE (3rd Gen) | **375 × 667 px** | ~9:16 | Compact Mobile | Top/bottom bezels, classic speaker ear-piece, home bar |
| `iphone-15` | iPhone 15 / Standard | **393 × 852 px** | ~9:19.5 | Modern Flagship | Ultra-thin bezel, Dynamic Island pill cutout (120×35px), rounded corners (`border-radius: 44px`) |
| `pixel-7` | Google Pixel 7 | **412 × 915 px** | ~9:20 | Modern Android | Symmetrical bezel, center hole-punch selfie camera (`12×12px`), rounded corners (`border-radius: 36px`) |
| `ipad-mini` | iPad Mini | **768 × 1024 px** | 3:4 | Tablet | Tablet chassis, tablet media query boundary (`768px`), rounded corners (`border-radius: 28px`) |
| `desktop` | Desktop Full | **100% × 100%** | Fluid | Desktop | Frameless standard view, full monitor width |

### 2.3 Controls Specification

1. **Preset Selector**:
   - Quick-toggle segmented pills or dropdown for the 5 presets with active indicator.
2. **Orientation Rotator (`rotateOrientation`)**:
   - Toggles between `portrait` and `landscape`.
   - In portrait: `width = preset.width`, `height = preset.height`.
   - In landscape: `width = preset.height`, `height = preset.width`.
   - Crucial boundary behavior: Rotating `iPad Mini` (768×1024) to landscape (1024×768) dynamically crosses the 1024px threshold, testing desktop rail vs tablet behavior in real-time.
3. **Zoom Scale Slider (`zoom`)**:
   - Range: **50% to 125%** (step 5%, default 100%).
   - Value readout: e.g. `100%`.
   - Quick reset click on percentage label returns to 100%.
   - Implemented via CSS `transform: scale(zoom / 100)` with `transform-origin: top center`.
4. **Dimensions & Status Indicator**:
   - Displays current dimensions: `${currentWidth} × ${currentHeight} px • ${orientation.toUpperCase()}`.
5. **Reset Button (`onReset`)**:
   - Restores preset to `iPhone 15`, orientation to `portrait`, zoom to `100%`.
6. **Close / Exit Button (`onClose`)**:
   - Minimizes the simulator toolbar and restores full-screen normal development mode.

### 2.4 Photorealistic Device Chassis Architecture

To provide an authentic preview environment, the device frame container features:
- **Device Shell / Bezel**:
  - Precision border: `12px solid #1e293b` (dark slate chassis) with subtle inner metallic chamfer (`box-shadow: 0 0 0 2px #334155, 0 25px 60px -15px rgba(0, 0, 0, 0.6)`).
  - Rounded corners configured dynamically per preset:
    - iPhone 15: `48px`
    - Pixel 7: `38px`
    - iPhone SE: `32px`
    - iPad Mini: `24px`
- **Hardware Cutout Simulation**:
  - **Dynamic Island** (`preset === 'iphone-15'`): Floating black pill at `top: 10px`, `width: 120px`, `height: 32px`, `border-radius: 20px`, with simulated front-camera lens reflection.
  - **Punch-Hole Camera** (`preset === 'pixel-7'`): Center circular camera at `top: 12px`, `width: 13px`, `height: 13px`, `border-radius: 50%`.
- **Simulated Top Status Bar**:
  - Left: Digital clock showing `9:41` (SF Pro / Inter font).
  - Right: Cellular signal (4 bars), Wi-Fi icon, battery icon with 98% charge and lightning indicator.
  - Transparent overlay with pointer-events pass-through (`pointer-events: none`).
- **Simulated Bottom Home Bar Indicator**:
  - Floating pill bar at bottom: `width: 134px`, `height: 5px`, `border-radius: 100px`, `background: rgba(255, 255, 255, 0.45)` (or adaptive dark in light mode).
- **Touch Cursor Simulation**:
  - When mouse enters simulated frame, cursor displays as a semi-transparent circular touch indicator (`28×28px`) mimicking finger contact on capacitive touchscreens.

### 2.5 Iframe Isolation & Infinite Recursion Prevention

- When launching the application inside the simulator iframe, a URL query parameter or hash flag `?sim_frame=1` is appended.
- Inside `src/App.tsx`, the simulator launcher check includes:
  ```typescript
  const isInsideSimulatorIframe = typeof window !== 'undefined' && (
    window.self !== window.top ||
    new URLSearchParams(window.location.search).has('sim_frame')
  );
  ```
- If `isInsideSimulatorIframe` is true, the Dev Viewport Simulator Toolbar and floating dock trigger do **not** render inside the iframe, preventing infinite recursive simulator nesting.
- Because the iframe is same-origin (`window.location.origin`), `localStorage` (theme settings, auth token, session user) is shared seamlessly without cross-origin security barriers.

---

## 3. Requirement R6: Staff & Role-Based Permissions in Dev Workbench

### 3.1 Role Hierarchy & Permissions Matrix

```
                      [ Root Admin ]
                       (role: 'admin')
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
      [ Story / Art / Post ]     [ Moderator ]
        Supervisors              (role: 'moderator')
    (role: 'supervisor*')
```

| Permission / Action | Non-Staff (`user` / `voter`) | Moderator (`moderator`) | Supervisor (`supervisor` / `supervisor_*`) | Administrator (`admin`) |
|---|:---:|:---:|:---:|:---:|
| **Access Dev Workbench** | ❌ Blocked (`Restricted Console`) | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **View Pitches Submissions Queue** | ❌ | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Inspect AI Detection Radar / Audit** | ❌ | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Approve Proposal (Human Verified)** | ❌ | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Flag Proposal (Synthetic / AI)** | ❌ | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Reject Proposal (Rule Violation)** | ❌ | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Statistical Moments & Variance Tab** | ❌ | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Raid Telemetry & Anomalies Tab** | ❌ | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Network Telemetry Diagnostics Tab** | ❌ | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Permanent Proposal Deletion** | ❌ | ❌ **Strictly Gated** | ✅ **Elevated Access** | ✅ **Elevated Access** |
| **Round Deletion Lifecycle Action** | ❌ | ❌ **Strictly Gated** | ✅ **Elevated Access** | ✅ **Elevated Access** |
| **Roles & Staff Management Tab** | ❌ | ❌ **Strictly Gated** | ✅ **Elevated Access** | ✅ **Elevated Access** |
| **Assign User Roles in Live DB** | ❌ | ❌ | ✅ **Elevated Access** | ✅ **Elevated Access** |
| **Create / Delete Custom Mutable Roles** | ❌ | ❌ | ✅ **Elevated Access** | ✅ **Elevated Access** |

### 3.2 Concrete RBAC Helper Architecture

In `src/context/AuthContext.tsx` or `src/utils/rbac.ts`:

```typescript
export type UserRole = 'user' | 'moderator' | 'admin' | 'supervisor' | string;

/** Checks if a role is any staff member */
export function isStaff(role?: string): boolean {
  if (!role) return false;
  return role === 'admin' || role === 'moderator' || role === 'supervisor' || role.startsWith('supervisor');
}

/** Checks if a role has elevated administration/supervisory access */
export function isElevatedStaff(role?: string): boolean {
  if (!role) return false;
  return role === 'admin' || role === 'supervisor' || role.startsWith('supervisor');
}

/** Specific permission check for destructive lifecycle actions */
export function canDeleteLifecycle(role?: string): boolean {
  return isElevatedStaff(role);
}

/** Specific permission check for Roles & Staff Management */
export function canManageStaff(role?: string): boolean {
  return isElevatedStaff(role);
}

export interface RoleBadgeInfo {
  label: string;
  badgeClass: string;
  color: string;
  tier: 'root' | 'elevated' | 'staff' | 'community';
}

export function getRoleBadgeInfo(role?: string): RoleBadgeInfo {
  if (role === 'admin') {
    return { label: 'ADMINISTRATOR', badgeClass: 'badge-danger', color: '#ef4444', tier: 'root' };
  }
  if (role === 'supervisor' || role?.startsWith('supervisor')) {
    return { label: 'SUPERVISOR', badgeClass: 'badge-engine', color: '#8b5cf6', tier: 'elevated' };
  }
  if (role === 'moderator') {
    return { label: 'MODERATOR', badgeClass: 'badge-warning', color: '#f59e0b', tier: 'staff' };
  }
  return { label: 'VOTER', badgeClass: 'badge-light', color: '#64748b', tier: 'community' };
}
```

### 3.3 UI Implementation & Gating in DevWorkbench.tsx

1. **Console Header Role Badge**:
   Replace the generic `ENGINE MODE` badge with an explicit tier badge:
   ```tsx
   const roleInfo = getRoleBadgeInfo(user?.role);
   <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
     <span className={`badge ${roleInfo.badgeClass}`} style={{ fontWeight: 800, letterSpacing: '0.05em' }}>
       {roleInfo.label} MODE
     </span>
     {isElevatedStaff(user?.role) && (
       <span className="badge badge-light" style={{ fontSize: '10px' }}>ELEVATED CLEARANCE</span>
     )}
   </div>
   ```

2. **Sub-Navigation Roles Tab Gating**:
   ```tsx
   {/* Render Roles tab only if user is elevated staff */}
   {isElevatedStaff(user?.role) && (
     <button
       className={`btn btn-sm ${activeConsoleTab === 'roles' ? 'btn-primary' : 'btn-secondary'}`}
       onClick={() => setActiveConsoleTab('roles')}
     >
       Roles
     </button>
   )}
   ```
   If a moderator bookmarked or defaulted to `roles`, render an accessible barrier card:
   ```tsx
   {activeConsoleTab === 'roles' && (
     !isElevatedStaff(user?.role) ? (
       <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
         <div style={{ fontSize: '18px', fontWeight: 800, color: '#ef4444', marginBottom: 8 }}>
           Elevated Clearance Required
         </div>
         <div style={{ color: 'var(--text-muted)', maxWidth: 460, margin: '0 auto' }}>
           Roles & Staff Management is strictly restricted to Administrators and Supervisors. Content Moderators do not have clearance to modify platform user permissions.
         </div>
       </div>
     ) : (
       <RolesManagementView />
     )
   )}
   ```

3. **Round Deletion Gating**:
   ```tsx
   {rounds.length > 0 && isElevatedStaff(user?.role) && (
     <button
       className="btn btn-secondary btn-sm"
       style={{ color: '#ef4444', fontSize: '11px', padding: '5px 10px' }}
       onClick={() => handleDeleteRound(currentRoundId)}
       title="Delete this round and its proposals (Admin/Supervisor Only)"
     >
       Delete Round
     </button>
   )}
   ```

4. **Permanent Proposal Deletion Gating**:
   - In moderation table:
     ```tsx
     {isElevatedStaff(user?.role) && (
       <button
         className="btn btn-secondary btn-sm"
         style={{ fontSize: '11px', padding: '3px 8px', color: 'var(--text-muted)' }}
         onClick={() => handleDeleteEntry(entry.id)}
         title="Delete Proposal (Admin/Supervisor Only)"
       >
         &times;
       </button>
     )}
     ```
   - In Pitch Inspection Modal:
     ```tsx
     {isElevatedStaff(user?.role) ? (
       <button
         className="btn btn-secondary btn-sm"
         style={{ color: '#ef4444' }}
         onClick={() => handleDeleteEntry(inspectedEntry.id)}
       >
         Delete Proposal
       </button>
     ) : (
       <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
         Permanent deletion requires Admin/Supervisor clearance.
       </div>
     )}
     ```

5. **Supervisor Role Assignment in RolesManagementView.tsx**:
   Update line 572:
   ```tsx
   disabled={!user || (!isElevatedStaff(user.role) && !HARDCODED_ADMIN_DISCORD_IDS.has(user.discordId))}
   ```
   This immediately empowers supervisors to assign and update roles within the live database as demanded by R6.

6. **Interactive Dev Role Switcher**:
   For seamless development and testing of all tiers without multiple Discord logins, a quick **Dev Role Persona Switcher** can be embedded in dev mode at the top of Dev Workbench:
   - `[ Switch Persona: Admin | Supervisor | Moderator | Voter ]`
   - Invoking `loginAsUser({ ...user, role })` allows live verification of all UI gating instantly!

---

## 4. Test Suite Analysis & Synergies

### 4.1 Test Run Findings

Running `node tests/runner.mjs --filter="DevWorkbench"` revealed 2 immediate failures in the existing test harness:

1. **Failure 1: `[T1-SEC-04] DevWorkbench wide telemetry tables are enclosed in .table-wrap containers`**:
   - The test parses `DevWorkbench.tsx` AST and verifies that wide telemetry tables are contained within an element having the class `.table-wrap`.
   - In `DevWorkbench.tsx` line 384, the container has `className="table-responsive"`.
   - **Fix**: Update line 384 to `className="table-wrap table-responsive"`.
   - Result: Resolves `[T1-SEC-04]` and ensures table horizontally scrolls cleanly on 320px screens.

2. **Failure 2: `[T2-TOUCH-03] DevWorkbench moderation action buttons (Approve, Reject, Purge) meet >=44px height`**:
   - The test checks computed CSS declarations for `.btn-moderation` at 375px:
     `const minH = parsePx(btn['min-height'] || btn['height']); assertTrue(minH >= 44 || btn['padding'] !== undefined);`
   - `.btn-moderation` is currently absent from `src/styles.css` and `DevWorkbench.tsx`.
   - **Fix**:
     - In `src/styles.css`:
       ```css
       .btn-moderation {
         min-height: 44px;
         padding: 8px 14px;
         display: inline-flex;
         align-items: center;
         justify-content: center;
         box-sizing: border-box;
       }
       ```
     - In `DevWorkbench.tsx`: Apply `btn-moderation` to the Inspect, Approve, Flag, Reject, and Delete buttons.
   - Result: Resolves `[T2-TOUCH-03]` and satisfies the R4 touch-target requirement (>= 44×44px).

---

## 5. Architectural Blueprints for Implementation

### 5.1 Component Hierarchy for R5 Viewport Simulator

```
src/
├── components/
│   └── DevViewportSimulator/
│       ├── DevViewportSimulator.tsx     # Floating toolbar, preset switcher, zoom slider, rotate, state
│       ├── DevViewportFrame.tsx         # Photorealistic device chassis, Dynamic Island, punch-hole, status bar, iframe
│       └── dev-simulator.css            # Device bezels, realistic shadows, hardware cutouts, touch cursor
```

#### Preset Configuration Data Model
```typescript
export interface DevicePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  deviceType: 'phone' | 'tablet' | 'desktop';
  bezelStyle: 'dynamic-island' | 'punch-hole' | 'classic-notch' | 'tablet' | 'none';
  borderRadius: number;
  hasHardwareCutout: boolean;
}

export const DEVICE_PRESETS: DevicePreset[] = [
  {
    id: 'iphone-se',
    name: 'iPhone SE',
    width: 375,
    height: 667,
    deviceType: 'phone',
    bezelStyle: 'classic-notch',
    borderRadius: 32,
    hasHardwareCutout: false,
  },
  {
    id: 'iphone-15',
    name: 'iPhone 15',
    width: 393,
    height: 852,
    deviceType: 'phone',
    bezelStyle: 'dynamic-island',
    borderRadius: 48,
    hasHardwareCutout: true,
  },
  {
    id: 'pixel-7',
    name: 'Pixel 7',
    width: 412,
    height: 915,
    deviceType: 'phone',
    bezelStyle: 'punch-hole',
    borderRadius: 38,
    hasHardwareCutout: true,
  },
  {
    id: 'ipad-mini',
    name: 'iPad Mini',
    width: 768,
    height: 1024,
    deviceType: 'tablet',
    bezelStyle: 'tablet',
    borderRadius: 24,
    hasHardwareCutout: false,
  },
  {
    id: 'desktop',
    name: 'Desktop Full',
    width: 0, // 100%
    height: 0,
    deviceType: 'desktop',
    bezelStyle: 'none',
    borderRadius: 0,
    hasHardwareCutout: false,
  },
];
```

### 5.2 Simulator Toolbar UI Layout

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 📱 DEV VIEWPORT SIMULATOR                                                              │
│ [iPhone SE] [iPhone 15*] [Pixel 7] [iPad Mini] [Desktop] │ 🔄 Rotate │ Zoom: 50% ──🔘── 125% (100%) │ 393×852px │ ↺ Reset │ ✕ Close │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Identified Edge Cases & Recommendations

1. **Virtual Keyboard Simulation**:
   - On mobile, focus on inputs (e.g. in `CreatePitchModal` or search) shrinks the available viewport height. The simulator frame should declare `overflow: hidden` on its outer wrapper while the iframe internal document scrolls smoothly.
2. **Safe Area Insets**:
   - Modern notch devices require CSS `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`. The simulator chassis top status bar and bottom home pill provide realistic visual alignment for these insets.
3. **Orientation Aspect Ratio Swapping**:
   - Swapping width and height in landscape mode (e.g. `852 × 393 px`) can cause the device height to exceed the developer's laptop screen height. The zoom slider and outer scroll container must ensure the user can pan and view the entire device without clipping.
4. **Iframe Routing Sync**:
   - The iframe should share the active hash or query path with the parent toolbar. A light `postMessage` listener or same-origin `contentWindow.location` observer guarantees that switching tabs inside the simulator keeps the host synchronized.
5. **Supervisor Departmental Wildcard Matching**:
   - Update `isStaff(role)` and `isElevatedStaff(role)` to check `role === 'supervisor' || role?.startsWith('supervisor')` so departmental leads (`supervisor_story`, `supervisor_art`, etc.) are never accidentally demoted or locked out.

---

## 7. Next Steps for Implementation Team

1. **Implement R6 RBAC & DevWorkbench Gating**:
   - Add `isElevatedStaff`, `canDeleteLifecycle`, `canManageStaff`, `getRoleBadgeInfo` to `src/context/AuthContext.tsx`.
   - Update `DevWorkbench.tsx` with elevated checks on Round Deletion, Proposal Deletion (table & modal), and the `Roles` tab.
   - Add `.table-wrap` and `.btn-moderation` (with `min-height: 44px`) to `DevWorkbench.tsx` and `src/styles.css` to fix existing tests `[T1-SEC-04]` and `[T2-TOUCH-03]`.
   - Enable role assignments for supervisors in `RolesManagementView.tsx`.
   - Add dev persona switcher in DevWorkbench for rapid manual testing.
2. **Implement R5 Dev Viewport Simulator Toolbar**:
   - Create `src/components/DevViewportSimulator/DevViewportSimulator.tsx` and CSS styles.
   - Hook the floating launcher and workbench trigger into `src/App.tsx` and `src/views/DevWorkbench/DevWorkbench.tsx`.
   - Support the 5 presets, zoom slider, orientation rotate, reset, and close.
3. **Run Quality Verification**:
   - Run `npm run typecheck` (verify 0 TypeScript errors).
   - Run `npm run build` (verify clean production bundle).
   - Run `node tests/runner.mjs` (verify passing tests).
