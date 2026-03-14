# Dashboard-v2 Phase 8 Restructuring Adjustment

> **Document Type**: Phase Plan Adjustment
> **Created**: 2026-02-26
> **Trigger**: `index.tsx` at 969 LOC (3.2x over 300 LOC strategic limit)
> **Governance**: Strict, plan_driven
> **Source**: Component analysis + OpenTUI patterns + Clean Architecture

---

## Executive Summary

The current `index.tsx` has grown to **969 lines**, violating the 300 LOC strategic limit and creating:
- **Tangled concerns**: State management, rendering, keyboard handling, SSE all in one file
- **Testability issues**: Cannot unit test individual panels or handlers
- **Maintenance burden**: Any change requires understanding the entire file
- **Reuse barriers**: Panel components cannot be shared or composed

This document records **W0 Component Restructuring completion** and reconciles evidence before continuing `W2.4 -> W3 -> W4 -> W5`.

---

## 1. Current State Analysis

### LOC Breakdown (execution baseline at index.tsx = 969 lines)

| Section | Lines | Concern | Target Split |
|---------|-------|---------|--------------|
| Imports + Constants | 52 | Configuration | Keep in index.tsx |
| AppState + Types | 50 | State Management | → `state.ts` |
| Reducer + Actions | 32 | State Management | → `state.ts` |
| renderOverviewPanel | 86 | Panel Rendering | → `panels/OverviewPanel.tsx` |
| renderPipelinePanel | 51 | Panel Rendering | → `panels/PipelinePanel.tsx` |
| renderHierarchyPanel | 29 | Panel Rendering | → `panels/HierarchyPanel.tsx` |
| renderIncidentsPanel | 27 | Panel Rendering | → `panels/IncidentsPanel.tsx` |
| renderCodeIntelPanel | 40 | Panel Rendering | → `panels/CodeIntelPanel.tsx` |
| renderGovernancePanel | 49 | Panel Rendering | → `panels/GovernancePanel.tsx` |
| renderSettingsPanel | 33 | Panel Rendering | → `panels/SettingsPanel.tsx` |
| MainPanel | 56 | Panel Routing | → `components/MainPanel.tsx` |
| App (useEffect) | 115 | Keyboard/SSE Handlers | → `hooks/useKeyboardHandler.ts` |
| App (render) | 187 | UI Layout | Keep in index.tsx (reduced) |
| HelpOverlay | 35 | UI Component | → `components/HelpOverlay.tsx` |

### Coupling Analysis

```
index.tsx (969 LOC)
├── State Management (82 LOC) ──────┐
├── 7 Panel Renderers (315 LOC) ────┼── HIGH COUPLING
├── Keyboard Handler (115 LOC) ─────┤   (all share state)
├── SSE/Polling (embedded) ─────────┤
└── UI Layout (187 LOC) ────────────┘
```

**Problem**: Single file contains presentation, state, and business logic.

### W0 Execution Result (Closeout)

- LOC progression: `969 -> 862 -> 531 -> 395 -> 240`
- W0.1 complete: `state.ts` extracted (123 LOC)
- W0.2 complete: `constants.ts` + 7 panel files extracted (all <150 LOC)
- W0.3 complete: `components/MainPanel.tsx` (74 LOC), `components/HelpOverlay.tsx` (60 LOC)
- W0.4 complete: `hooks/useDashboardData.ts` (37 LOC), `hooks/useKeyboardHandler.ts` (142 LOC)
- Strategic gate achieved: `index.tsx` now 240 LOC (`<300`)

---

## 2. Target Architecture

### Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ index.tsx   │  │ components/ │  │   panels/   │         │
│  │  (Entry)    │  │ Modal,Help  │  │ Overview,...│         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  state.ts   │  │  hooks/     │  │   api.ts    │         │
│  │ (Reducer)   │  │useKeyboard  │  │ (HTTP/SSE)  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  types.ts   │  │   i18n.ts   │  │ snapshot.ts │         │
│  │ (Entities)  │  │ (Strings)   │  │ (Data)      │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Target File Structure

```
src/dashboard-v2/src/
├── index.tsx                    # Entry point (~150 LOC)
├── state.ts                     # State management (~100 LOC)
├── types.ts                     # Type definitions (~80 LOC)
├── api.ts                       # HTTP + SSE client (~250 LOC)
├── snapshot.ts                  # Data loading (~400 LOC)
├── i18n.ts                      # Translations (~500 LOC)
│
├── components/
│   ├── InputModal.tsx           # Text input modal (~130 LOC)
│   ├── HelpOverlay.tsx          # Help overlay (~80 LOC)
│   ├── MainPanel.tsx            # Panel router (~100 LOC)
│   └── ErrorBoundary.tsx        # Error handling (~50 LOC)
│
├── panels/
│   ├── OverviewPanel.tsx        # Overview tab (~100 LOC)
│   ├── PipelinePanel.tsx        # Pipeline tab (~80 LOC)
│   ├── HierarchyPanel.tsx       # Hierarchy tab (~60 LOC)
│   ├── IncidentsPanel.tsx       # Incidents tab (~50 LOC)
│   ├── CodeIntelPanel.tsx       # CodeIntel tab (~70 LOC)
│   ├── GovernancePanel.tsx      # Governance tab (~80 LOC)
│   └── SettingsPanel.tsx        # Settings tab (~60 LOC)
│
└── hooks/
    ├── useKeyboardHandler.ts    # Keyboard input (~150 LOC)
    └── useSSEConnection.ts      # SSE management (~100 LOC)
```

### LOC Targets After Restructuring

| File | Current | Target | Max |
|------|---------|--------|-----|
| index.tsx | 240 (post-W0) | <= 300 strategic | 300 |
| state.ts | - | 100 | 150 |
| panels/*.tsx | - | 60-100 each | 150 |
| components/*.tsx | 136+35 | 50-130 each | 150 |
| hooks/*.ts | - | 100-150 each | 200 |

---

## 3. W0 Component Restructuring Wave

### W0 Definition

**Wave ID**: W0
**Wave Name**: Component Restructuring
**Priority**: P0 (Completed closeout)
**Duration Estimate**: 3-4 hours
**Mode**: Sequential (file dependencies)

### W0 Scope

**In Scope**:
- Extract state management to `state.ts`
- Extract 7 panel renderers to `panels/*.tsx`
- Extract keyboard handler to `hooks/useKeyboardHandler.ts`
- Extract HelpOverlay to `components/HelpOverlay.tsx`
- Reduce `index.tsx` to strategic `<300` LOC (stretch target `<200`)
- Maintain all existing functionality

**Out of Scope**:
- New features
- API changes
- SSE implementation (W1/W3)
- i18n expansion (W4)

### W0 Sub-Lanes (Executed)

| Lane | Task | Outcome | Evidence |
|------|------|---------|----------|
| W0.1 | Extract state.ts | ✅ COMPLETE | `src/state.ts` = 123 LOC |
| W0.2 | Extract panels/ + constants | ✅ COMPLETE | `src/constants.ts` + `src/panels/*.tsx` (7 files, each <150 LOC) |
| W0.3 | Extract components/ | ✅ COMPLETE | `MainPanel.tsx` = 74 LOC, `HelpOverlay.tsx` = 60 LOC |
| W0.4 | Extract hooks/ | ✅ COMPLETE | `useDashboardData.ts` = 37 LOC, `useKeyboardHandler.ts` = 142 LOC |
| W0.5 | Reconcile closeout artifacts | ✅ COMPLETE | Planning docs synchronized with gate evidence and transition path |

### W0 Entry Criteria

- [x] W2.3 (Help Overlay) complete
- [x] No pending TypeScript errors
- [x] All tests passing
- [x] Current index.tsx LOC count recorded (969)

### W0 Exit Criteria (Closeout)

- [x] `index.tsx` reduced to 240 LOC and under strategic `<300` limit
- [x] All 7 panels extracted to separate files
- [x] State management isolated in `state.ts`
- [x] All TypeScript gates pass (dashboard tsc, root tsc)
- [x] All tests pass (`npm test`: 197 pass, 0 fail)
- [ ] Runtime interactive keyboard paths manually sanity-checked in TUI

### W0 Validation Gates (Executed)

**Pre-Gate (Before Each Lane)**:
- Scope lock verified
- Dependency check (previous lane complete)
- Evidence obligations declared

**Post-Gate (After Each Lane)**:
```bash
# TypeScript validation
cd /Users/apple/hivemind-plugin/src/dashboard-v2 && bunx tsc --noEmit
cd /Users/apple/hivemind-plugin && npx tsc --noEmit

# Test validation
cd /Users/apple/hivemind-plugin && npm test

# LOC validation (W0.5 only)
wc -l /Users/apple/hivemind-plugin/src/dashboard-v2/src/index.tsx
# Closeout result: 240 (strategic target < 300 achieved)
```

**Recorded outcomes**:
- Dashboard TypeScript gate: PASS
- Root TypeScript gate: PASS
- Test gate: PASS (197 pass, 0 fail)
- LOC gate: PASS against strategic threshold (`index.tsx` = 240)

---

## 4. Adjusted Phase 8 Roadmap

### Original Wave Order
```
W1 → W2 → W3 → W4 → W5
```

### Adjusted Wave Order
```
W0 complete → W2.4 → W3 → W4 → W5
```

### Wave Catalog (Adjusted)

| Wave | Name | Status | Dependencies |
|------|------|--------|--------------|
| **W0** | **Component Restructuring** | **✅ COMPLETE (W0.5 closeout)** | W2.3 ✅ |
| W1 | Real-Time Spine | COMPLETE | - |
| W2 | Interaction Completeness | W2.1-W2.3 ✅, W2.4 NEXT | W1 |
| W3 | Observability Surfaces | PENDING | W2 |
| W4 | Resilience and Recovery | PENDING | W3 |
| W5 | End-to-End Readiness | PENDING | W4 |

### Critical Path

```
W0 ✅ → W2.4 → W3 → W4 → W5
                │
                └── BLOCKING: W3 waits for W2 completion only
```

---

## 5. Success Metrics (Adjusted)

### W0 Specific Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| index.tsx LOC | < 300 strategic | `wc -l` (`240` achieved) |
| Panel file LOC | < 150 each | `wc -l` per file (all pass) |
| Circular dependencies | 0 | `madge --circular` |
| TypeScript errors | 0 | `tsc --noEmit` (dashboard + root pass) |
| Test failures | 0 | `npm test` (197 pass, 0 fail) |
| Functional regression | 0 critical regressions | Manual keyboard/modal sanity-check pending |

### Phase 8 Overall Metrics

| Metric | Original | Adjusted | Reason |
|--------|----------|----------|--------|
| Total Waves | 5 | 6 | W0 added |
| Estimated Duration | 7h | 10-11h | W0 execution + closeout completed |
| LOC Compliance | TBD | Strategic compliance achieved | `index.tsx` reduced to 240; extracted files all below tactical caps |
| Maintainability Score | Low | High | Concerns split across state/panels/components/hooks |

---

## 6. Acceptance Criteria (W0)

### Functional Requirements (F)

| ID | Requirement | Verification |
|----|-------------|--------------|
| F1 | All 7 tabs render correctly after extraction | Structural verification complete; runtime sanity pass pending |
| F2 | Keyboard shortcuts preserve precedence rules | Hook extraction complete; runtime sanity pass pending |
| F3 | Modal opens and closes without key leakage | Keyboard precedence implemented; runtime sanity pass pending |
| F4 | Language toggle remains wired after split | Wiring preserved; runtime sanity pass pending |
| F5 | Help overlay toggles and does not bypass modal priority | Help extraction complete; modal-precedence path retained |
| F6 | Server status panel wiring remains intact | No data-path removals in W0 extraction |
| F7 | Navigation paths preserved (Tab, j/k, 1-7) | `MainPanel` routing extraction complete |

### Non-Functional Requirements (NF)

| ID | Requirement | Target | Verification |
|----|-------------|--------|--------------|
| NF1 | Type safety | 100% | `bunx tsc --noEmit` + `npx tsc --noEmit` pass |
| NF2 | Code coverage | Maintain | `npm test` = 197 pass, 0 fail |
| NF3 | LOC limits | Strategic `<300` on entry file, tactical caps on extracted files | `index.tsx` = 240; extracted files within caps |
| NF4 | No circular deps | 0 | `madge --circular` |
| NF5 | Import clarity | Single direction | Code review |

### Edge Cases

| ID | Edge Case | Handling |
|----|-----------|----------|
| E1 | Server offline during restructure | No transport contract change in W0; rendering remains data-driven |
| E2 | Empty snapshot data | Extracted panels keep defensive empty-state rendering |
| E3 | Modal state during tab switch | Keyboard handler precedence keeps modal as first gate |
| E4 | Help overlay + modal conflict | Modal takes precedence over help toggle path |
| E5 | Keyboard handler state race | `stateRef` and extracted hook preserve deterministic key handling |

---

## 7. Risk Register (W0)

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Circular imports during extraction | High | Medium | Extract in dependency order (state → panels → components → hooks → index) |
| State ref breakage | High | Low | Use stateRef pattern consistently |
| TypeScript path resolution | Medium | Medium | Update tsconfig.json includes |
| Test regression | Medium | Low | Run full test suite after each lane |
| Functional regression in interactive keyboard flows | High | Low | Manual TUI sanity pass on `c/m/x/t/a/l/?/q`, modal/help precedence |

---

## 8. Delegation Contract (W0)

Each W0 lane delegation MUST include:

```
Task: [Specific extraction task]
Scope: [Explicit files to create/modify]
Return format: { outcome, files_changed, loc_counts, evidence }
Success metric: TypeScript gates pass, tests pass, LOC target met
Acceptance criteria: [From section 6]
Constraints:
  - No functional changes
  - No new features
  - No API changes
  - ABSOLUTE BAN: Do NOT delegate further. Return directly.
Evidence: TypeScript output, test output, wc -l output
```

---

## 9. Phase 9 Linkage (W0)

W0 emits the following Phase 9 obligations:

| Obligation | Type | Description |
|------------|------|-------------|
| P9-REFACTOR-001 | Refactor | Extract ErrorBoundary component |
| P9-REFACTOR-002 | Refactor | Extract useSSEConnection hook |
| P9-REFACTOR-003 | Refactor | Add panel-level unit tests |
| P9-VERIFY-001 | Verification | E2E test for all keyboard shortcuts |

---

## 10. Next Actions

1. **Close W0 in all planning artifacts** - Mark W0.1-W0.4 executed and W0.5 reconciled
2. **Start W2.4 packet** - Resume remaining interaction-completeness lane
3. **Advance to W3** - Only after W2 complete
4. **Carry residual risk** - Run manual TUI keyboard sanity pass before W3 execution
5. **Continue roadmap** - `W3 -> W4 -> W5`

---

## Appendix A: Extraction Order (Dependency Graph)

```
types.ts (no deps)
    │
    ▼
state.ts (imports types)
    │
    ├──────────────────┬──────────────────┐
    ▼                  ▼                  ▼
i18n.ts           snapshot.ts        api.ts
    │                  │                  │
    └────────┬─────────┴──────────────────┘
             ▼
    panels/*.tsx (imports state, i18n, types)
             │
             ▼
    components/*.tsx (imports state, panels)
             │
             ▼
    hooks/*.ts (imports state, api)
             │
             ▼
    index.tsx (imports all)
```

---

## Appendix B: OpenTUI Component Patterns

From `opentui` skill, relevant patterns:

1. **Layout**: Use `box` with `flexDirection`, `flexGrow`, `padding`
2. **Text styling**: Nested modifier elements, not props
3. **Input handling**: `stdin.on('data')` with `stateRef.current`
4. **State**: React `useReducer` with immutable updates
5. **Cleanup**: Return cleanup function from `useEffect`

---

## Appendix C: Clean Architecture Rules Applied

From `clean-architecture` skill:

1. **dep-inward-only**: Panels depend on state, not vice versa
2. **comp-screaming-architecture**: File structure reveals domain
3. **usecase-single-responsibility**: Each panel has one purpose
4. **bound-main-component**: index.tsx is the "main" plugin

---

*Document generated following Phase 8 adjustment protocol*
*Prepared for: W0 Component Restructuring Wave*
