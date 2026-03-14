# Dashboard-v2 Phase 8 W0.1 Execution Packet

> **Wave**: W0 (Component Restructuring)
> **Lane**: W0.1 (State Extraction)
> **Date**: 2026-02-26
> **Mode**: Sequential (first lane, no dependencies)
> **Coordinator**: main session only

---

## 1) Task Definition

**Objective**: Extract state management from `index.tsx` to dedicated `state.ts` module.

**Current State**:
- `index.tsx` contains 82 LOC of state-related code (AppState interface, AppAction union, reducer, createInitialState)
- This is mixed with rendering, keyboard handling, and SSE logic

**Target State**:
- New `state.ts` file with ~100 LOC containing all state management
- `index.tsx` imports from `state.ts`
- No functional changes

---

## 2) Scope

### Files to CREATE

| File | Purpose | LOC Target |
|------|---------|------------|
| `src/dashboard-v2/src/state.ts` | State management module | ~100 |

### Files to MODIFY

| File | Changes | LOC Change |
|------|---------|------------|
| `src/dashboard-v2/src/index.tsx` | Remove state code, add import | 969 → ~890 |

### Files NOT to Touch

- `src/dashboard-v2/src/types.ts`
- `src/dashboard-v2/src/api.ts`
- `src/dashboard-v2/src/snapshot.ts`
- `src/dashboard-v2/src/i18n.ts`
- `src/dashboard-v2/src/components/*`

---

## 3) Extraction Specification

### Code to Extract (from index.tsx)

```typescript
// Lines 53-86: AppState interface
interface AppState {
  activeTab: number;
  connected: boolean;
  loading: boolean;
  error: string | null;
  snapshot: any | null;
  serverData: {
    connected: boolean;
    version: string | null;
    sessions: Array<{ id: string; title?: string }>;
    agents: Array<{ id: string; name: string }>;
  };
  lastAction: string | null;
  currentSessionId: string | null;
  modal: { type: string; payload?: any } | null;
  actionLoading: boolean;
  lang: DashboardLanguage;
  helpOverlay: boolean;
}

// Lines 72-85: AppAction union type
type AppAction =
  | { type: "TAB_NEXT" }
  | { type: "TAB_PREV" }
  | { type: "TAB_SET"; value: number }
  | { type: "CONNECTED"; value: boolean }
  | { type: "SNAPSHOT"; value: any }
  | { type: "SERVER_DATA"; value: any }
  | { type: "LAST_ACTION"; value: string }
  | { type: "ERROR"; value: string }
  | { type: "SET_SESSION"; value: string | null }
  | { type: "ACTION_LOADING"; value: boolean }
  | { type: "SET_LANG"; value: DashboardLanguage }
  | { type: "OPEN_MODAL"; value: { type: string; payload?: any } }
  | { type: "CLOSE_MODAL" }
  | { type: "TOGGLE_HELP_OVERLAY" }
  | { type: "CLOSE_HELP_OVERLAY" };

// Lines 87-106: createInitialState function
function createInitialState(): AppState {
  return {
    activeTab: 0,
    connected: false,
    loading: true,
    error: null,
    snapshot: null,
    serverData: {
      connected: false,
      version: null,
      sessions: [],
      agents: [],
    },
    lastAction: null,
    currentSessionId: null,
    actionLoading: false,
    lang: getPersistedLang(),
    modal: null,
    helpOverlay: false,
  };
}

// Lines 108-140: reducer function
function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "TAB_NEXT":
      return { ...state, activeTab: (state.activeTab + 1) % TAB_KEYS.length };
    case "TAB_PREV":
      return { ...state, activeTab: (state.activeTab - 1 + TAB_KEYS.length) % TAB_KEYS.length };
    case "TAB_SET":
      return { ...state, activeTab: action.value };
    case "CONNECTED":
      return { ...state, connected: action.value };
    case "SNAPSHOT":
      return { ...state, snapshot: action.value, loading: false, error: null };
    case "SERVER_DATA":
      return { ...state, serverData: action.value, connected: action.value.connected };
    case "LAST_ACTION":
      return { ...state, lastAction: action.value };
    case "ERROR":
      return { ...state, loading: false, error: action.value };
    case "SET_SESSION":
      return { ...state, currentSessionId: action.value };
    case "ACTION_LOADING":
      return { ...state, actionLoading: action.value };
    case "SET_LANG":
      persistLang(action.value);
      return { ...state, lang: action.value };
    case "OPEN_MODAL":
      return { ...state, modal: action.value };
    case "CLOSE_MODAL":
      return { ...state, modal: null };
    case "TOGGLE_HELP_OVERLAY":
      return { ...state, helpOverlay: !state.helpOverlay };
    case "CLOSE_HELP_OVERLAY":
      return { ...state, helpOverlay: false };
    default:
      return state;
  }
}
```

### Target state.ts Structure

```typescript
// src/dashboard-v2/src/state.ts

import { getPersistedLang, persistLang } from "./i18n.js";
import type { DashboardLanguage } from "./i18n.js";

// TAB_KEYS constant (needed by reducer)
export const TAB_KEYS = [
  "tab.overview",
  "tab.pipeline",
  "tab.hierarchy",
  "tab.incidents",
  "tab.codeintel",
  "tab.governance",
  "tab.settings",
] as const;

// AppState interface
export interface AppState {
  activeTab: number;
  connected: boolean;
  loading: boolean;
  error: string | null;
  snapshot: any | null;
  serverData: {
    connected: boolean;
    version: string | null;
    sessions: Array<{ id: string; title?: string }>;
    agents: Array<{ id: string; name: string }>;
  };
  lastAction: string | null;
  currentSessionId: string | null;
  modal: { type: string; payload?: any } | null;
  actionLoading: boolean;
  lang: DashboardLanguage;
  helpOverlay: boolean;
}

// AppAction union type
export type AppAction =
  | { type: "TAB_NEXT" }
  | { type: "TAB_PREV" }
  | { type: "TAB_SET"; value: number }
  | { type: "CONNECTED"; value: boolean }
  | { type: "SNAPSHOT"; value: any }
  | { type: "SERVER_DATA"; value: any }
  | { type: "LAST_ACTION"; value: string }
  | { type: "ERROR"; value: string }
  | { type: "SET_SESSION"; value: string | null }
  | { type: "ACTION_LOADING"; value: boolean }
  | { type: "SET_LANG"; value: DashboardLanguage }
  | { type: "OPEN_MODAL"; value: { type: string; payload?: any } }
  | { type: "CLOSE_MODAL" }
  | { type: "TOGGLE_HELP_OVERLAY" }
  | { type: "CLOSE_HELP_OVERLAY" };

// Initial state factory
export function createInitialState(): AppState {
  return {
    activeTab: 0,
    connected: false,
    loading: true,
    error: null,
    snapshot: null,
    serverData: {
      connected: false,
      version: null,
      sessions: [],
      agents: [],
    },
    lastAction: null,
    currentSessionId: null,
    actionLoading: false,
    lang: getPersistedLang(),
    modal: null,
    helpOverlay: false,
  };
}

// Reducer function
export function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "TAB_NEXT":
      return { ...state, activeTab: (state.activeTab + 1) % TAB_KEYS.length };
    case "TAB_PREV":
      return { ...state, activeTab: (state.activeTab - 1 + TAB_KEYS.length) % TAB_KEYS.length };
    case "TAB_SET":
      return { ...state, activeTab: action.value };
    case "CONNECTED":
      return { ...state, connected: action.value };
    case "SNAPSHOT":
      return { ...state, snapshot: action.value, loading: false, error: null };
    case "SERVER_DATA":
      return { ...state, serverData: action.value, connected: action.value.connected };
    case "LAST_ACTION":
      return { ...state, lastAction: action.value };
    case "ERROR":
      return { ...state, loading: false, error: action.value };
    case "SET_SESSION":
      return { ...state, currentSessionId: action.value };
    case "ACTION_LOADING":
      return { ...state, actionLoading: action.value };
    case "SET_LANG":
      persistLang(action.value);
      return { ...state, lang: action.value };
    case "OPEN_MODAL":
      return { ...state, modal: action.value };
    case "CLOSE_MODAL":
      return { ...state, modal: null };
    case "TOGGLE_HELP_OVERLAY":
      return { ...state, helpOverlay: !state.helpOverlay };
    case "CLOSE_HELP_OVERLAY":
      return { ...state, helpOverlay: false };
    default:
      return state;
  }
}
```

### Changes to index.tsx

```typescript
// REMOVE: Lines 18-26 (TAB_KEYS constant - move to state.ts)
// REMOVE: Lines 53-86 (AppState interface)
// REMOVE: Lines 72-85 (AppAction type)
// REMOVE: Lines 87-106 (createInitialState function)
// REMOVE: Lines 108-140 (reducer function)

// ADD at top:
import {
  TAB_KEYS,
  type AppState,
  type AppAction,
  createInitialState,
  reducer,
} from "./state.js";
```

---

## 4) Acceptance Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| AC1 | `state.ts` created with all state code | File exists |
| AC2 | `index.tsx` imports from `state.ts` | Import statement present |
| AC3 | TAB_KEYS accessible in index.tsx | No undefined errors |
| AC4 | TypeScript compiles | `bunx tsc --noEmit` = 0 errors |
| AC5 | Tests pass | `npm test` = 0 failures |
| AC6 | LOC target met | `wc -l state.ts` < 150 |
| AC7 | No functional regression | Manual: all tabs work |

---

## 5) Validation Gates

### Pre-Gate
- [ ] Current index.tsx LOC recorded (969)
- [ ] Scope lock verified (state extraction only)
- [ ] No pending TypeScript errors

### Post-Gate
```bash
# Gate 1: dashboard-v2 TypeScript
cd /Users/apple/hivemind-plugin/src/dashboard-v2 && bunx tsc --noEmit
# Expected: 0 errors

# Gate 2: root TypeScript
cd /Users/apple/hivemind-plugin && npx tsc --noEmit
# Expected: 0 errors

# Gate 3: all tests
cd /Users/apple/hivemind-plugin && npm test
# Expected: 197 pass, 0 fail

# Gate 4: LOC verification
wc -l /Users/apple/hivemind-plugin/src/dashboard-v2/src/state.ts
# Expected: < 150 LOC

wc -l /Users/apple/hivemind-plugin/src/dashboard-v2/src/index.tsx
# Expected: < 900 LOC (reduced from 969)
```

---

## 6) Delegation Contract

**Task**: Extract state management from index.tsx to state.ts

**Scope**:
- CREATE: `src/dashboard-v2/src/state.ts`
- MODIFY: `src/dashboard-v2/src/index.tsx` (remove state code, add import)

**Do NOT touch**:
- `types.ts`, `api.ts`, `snapshot.ts`, `i18n.ts`
- `components/*`
- Any other files

**Return format**:
```json
{
  "outcome": "success" | "partial" | "failure",
  "files_changed": ["list"],
  "loc_counts": {
    "state.ts": <number>,
    "index.tsx": <number>
  },
  "command_evidence": "output from validation commands",
  "residual_risks": "any issues"
}
```

**Success metric**: All 4 gates pass

**Constraints**:
- No functional changes
- No new features
- No API changes
- **ABSOLUTE BAN: Do NOT delegate to any subagent. Return results directly to main orchestrator session.**

---

## 7) Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Import path issues | Use `.js` extension for ESM imports |
| TAB_KEYS not exported | Export from state.ts, import in index.tsx |
| Circular dependency | state.ts imports from i18n.ts only (no back-imports) |
| Type inference issues | Explicit return types on functions |

---

## 8) Next Lane Preview (W0.2)

After W0.1 complete, W0.2 will extract panel renderers:
- `renderOverviewPanel` → `panels/OverviewPanel.tsx`
- `renderPipelinePanel` → `panels/PipelinePanel.tsx`
- etc. (7 panels total)

W0.2 depends on W0.1 for state imports.

---

*Packet prepared for level-2 builder delegation*
