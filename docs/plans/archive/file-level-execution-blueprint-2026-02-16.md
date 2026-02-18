# File-Level Execution Blueprint - HiveMind v3 - 2026-02-16

## 1. Summary

| Team | Stories | Stitch Project | GitHub Issue |
|------|---------|----------------|--------------|
| LOCAL | 33 | `projects/9051349330813916457` | https://github.com/shynlee04/hivemind-plugin/issues/55 |
| JULES | 17 | `projects/18146358756909814967` | https://github.com/shynlee04/hivemind-plugin/issues/56 |

**Repository**: `https://github.com/shynlee04/hivemind-plugin`
**Base Branch**: `dev-v3`

---

## 2. Codebase Audit Results

### 2.1 Tools Layer (21 files, 14,958 total lines)

| File | Lines | Category | Action |
|------|-------|----------|--------|
| `src/tools/compact-session.ts` | 441 | Business Logic | Extract `compaction-engine.ts` |
| `src/tools/hivemind-session.ts` | 670 | Business Logic | Extract `session-engine.ts` |
| `src/tools/hivemind-inspect.ts` | 434 | Business Logic | Extract `inspect-engine.ts` |
| `src/tools/scan-hierarchy.ts` | 425 | Business Logic | Extract `brownfield-scan.ts` |
| `src/tools/hivemind-memory.ts` | 284 | Dumb Wrapper | Consolidate |
| `src/tools/hivemind-hierarchy.ts` | 282 | Dumb Wrapper | Consolidate |
| `src/tools/hivemind-cycle.ts` | 277 | Dumb Wrapper | Consolidate |
| `src/tools/hivemind-anchor.ts` | 228 | Dumb Wrapper | Consolidate |
| `src/tools/map-context.ts` | 227 | Business Logic | Keep, simplify |
| `src/tools/declare-intent.ts` | 134 | Business Logic | Keep, simplify |
| `src/tools/export-cycle.ts` | 141 | Business Logic | Keep |
| `src/tools/think-back.ts` | 166 | Business Logic | Extract to lib |
| `src/tools/save-mem.ts` | 63 | Dumb Wrapper | Delete (absorb) |
| `src/tools/recall-mems.ts` | 135 | Dumb Wrapper | Delete (absorb) |
| `src/tools/list-shelves.ts` | 69 | Dumb Wrapper | Delete (absorb) |
| `src/tools/save-anchor.ts` | 105 | Dumb Wrapper | Delete (absorb) |
| `src/tools/self-rate.ts` | 87 | Dumb Wrapper | Keep |
| `src/tools/check-drift.ts` | 83 | Dumb Wrapper | Keep |

**Consolidation Target**: 13 old tool files → 6 canonical tools

### 2.2 Lib Layer (24 files)

| File | Lines | Purity | Notes |
|------|-------|--------|-------|
| `src/lib/planning-fs.ts` | 1027 | Impure | Split into 3 modules |
| `src/lib/detection.ts` | 882 | 90% Pure | Signal compilation |
| `src/lib/hierarchy-tree.ts` | 874 | 90% Pure | Tree operations |
| `src/lib/manifest.ts` | 479 | Impure | File I/O |
| `src/lib/paths.ts` | 438 | Pure | Single source of truth |
| `src/lib/persistence.ts` | 374 | Impure | Core I/O |
| `src/lib/migrate.ts` | 333 | Pure | Migration logic |
| `src/lib/mems.ts` | 115 | Pure | State transformations |
| `src/lib/anchors.ts` | 66 | Pure | State transformations |

### 2.3 Schemas Layer (5 files)

| File | Lines | Status |
|------|-------|--------|
| `src/schemas/brain-state.ts` | 420 | Comprehensive |
| `src/schemas/config.ts` | 250 | Comprehensive |
| `src/schemas/hierarchy.ts` | 45 | Comprehensive |
| `src/schemas/graph-nodes.ts` | 0 | **MISSING** - Create for v3 |
| `src/schemas/graph-state.ts` | 0 | **MISSING** - Create for v3 |

### 2.4 Hooks Layer (9 files)

| File | Lines | CQRS Status |
|------|-------|-------------|
| `src/hooks/soft-governance.ts` | 670 | Intentional read-write |
| `src/hooks/session-lifecycle.ts` | 586 | Intentional read-write |
| `src/hooks/tool-gate.ts` | 329 | Intentional read-write |
| `src/hooks/messages-transform.ts` | 284 | Read-only (prompt compiler) |
| `src/hooks/session-lifecycle-helpers.ts` | 386 | Helper functions |
| `src/hooks/compaction.ts` | 205 | Intentional read-write |
| `src/hooks/event-handler.ts` | 220 | SDK-coupled |
| `src/hooks/sdk-context.ts` | 107 | SDK accessor |

### 2.5 Dashboard (1 file)

| File | Lines | Framework | Migration |
|------|-------|-----------|-----------|
| `src/dashboard/server.ts` | 585 | Ink (React) | OpenTUI required |

---

## 3. LOCAL Team Execution Blueprint

### 3.1 New Files to Create

```
src/
├── schemas/
│   ├── graph-nodes.ts          # US-001: TrajectoryNode, PlanNode, PhaseNode, TaskNode, MemNode
│   └── graph-state.ts          # US-002: TrajectoryState, PlansState, GraphTasksState, GraphMemsState
├── lib/
│   ├── compaction-engine.ts    # US-004: identifyTurningPoints, generateNextCompactionReport
│   ├── session-engine.ts       # US-005: startSession, updateSession, closeSession
│   ├── inspect-engine.ts       # US-006: scanState, deepInspect, driftReport
│   ├── brownfield-scan.ts      # US-007: executeOrchestration
│   ├── session-split.ts        # US-008: maybeCreateNonDisruptiveSessionSplit
│   ├── tool-response.ts        # US-009: formatToolResponse
│   ├── cognitive-packer.ts     # US-010: packCognitiveState, TimeMachine, TTS, XML compression
│   ├── graph-io.ts             # US-014: read/write graph/*.json
│   ├── graph-migrate.ts        # US-018: migrateFromFlat
│   └── session-swarm.ts        # US-020, US-021: 80% splitter, headless researchers
```

### 3.2 Files to Modify

| Target File | US-ID | Change Type |
|-------------|-------|-------------|
| `src/lib/paths.ts` | US-003 | Add graphDir, graphTrajectory, graphPlans, graphTasks, graphMems |
| `src/tools/compact-session.ts` | US-004 | Reduce to <=100 lines, call lib |
| `src/tools/hivemind-session.ts` | US-005 | Reduce to <=100 lines, call lib |
| `src/tools/hivemind-inspect.ts` | US-006 | Reduce to <=100 lines, call lib |
| `src/tools/scan-hierarchy.ts` | US-007 | Reduce to <=100 lines, call lib |
| `src/hooks/soft-governance.ts` | US-008 | Extract split logic |
| `src/hooks/messages-transform.ts` | US-015 | Wire packer |
| `src/hooks/session-lifecycle.ts` | US-017 | Use packer |
| `src/tools/declare-intent.ts` | US-022 | Write-through to graph |
| `src/tools/map-context.ts` | US-022 | Write-through to graph |
| `src/index.ts` | US-023 | Wire 6 canonical tools |
| `src/dashboard/server.ts` | US-038 | Consume packer output |

### 3.3 Files to Delete (US-024)

```
src/tools/save-mem.ts
src/tools/recall-mems.ts
src/tools/list-shelves.ts
src/tools/save-anchor.ts
src/tools/hivemind-memory.ts
src/tools/hivemind-hierarchy.ts
src/tools/hivemind-cycle.ts
src/tools/hivemind-anchor.ts
src/tools/check-drift.ts (absorb into tool-gate)
src/tools/think-back.ts (absorb into session-lifecycle)
```

### 3.4 Test Files to Create

```
tests/
├── graph-nodes.test.ts         # US-026
├── cognitive-packer.test.ts    # US-027
├── graph-io.test.ts            # US-028
├── graph-migrate.test.ts       # US-029
└── session-swarm.test.ts       # US-030
```

---

## 4. JULES Team Execution Blueprint

### 4.1 New Files to Create

```
src/dashboard/
├── App.tsx                           # US-049: Main app with view navigation
├── design-tokens.ts                  # US-050: Neon colors, fonts
├── i18n.ts                           # US-044: EN/VI string tables
├── components/
│   ├── TelemetryHeader.tsx           # US-033: Session ID, mode, drift, language toggle
│   ├── TrajectoryPane.tsx            # US-034: ASCII tree with cursor
│   ├── MemoryPane.tsx                # US-035: Mems with shelf badges
│   ├── AutonomicLog.tsx              # US-036: Scrolling governance log
│   ├── InteractiveFooter.tsx         # US-037: Keyboard shortcuts
│   ├── SwarmMonitor.tsx              # US-040: Active swarm status
│   └── MemCreationModal.tsx          # US-048: Form for creating mems
└── views/
    ├── SwarmOrchestratorView.tsx     # US-045: 9-column agent grid
    ├── TimeTravelDebuggerView.tsx    # US-046: Timeline + diff viewer
    └── ToolRegistryView.tsx          # US-047: Tool catalog + schema

.opencode/commands/
└── hivemind-dashboard.md             # US-041: Slash command entry
```

### 4.2 Files to Modify

| Target File | US-ID | Change Type |
|-------------|-------|-------------|
| `src/dashboard/server.ts` | US-032 | Ink → OpenTUI migration |
| `package.json` | US-032 | Remove ink, add @opentui/core, @opentui/react |

### 4.3 OpenTUI Migration Details

**Replace:**
- `import { Box, Text, render, useApp, useInput } from "ink"`
- `render(<App />)` with `process.exit()` handling

**With:**
- `import { createCliRenderer } from "@opentui/core"`
- `import { createRoot } from "@opentui/react"`
- `const renderer = createCliRenderer()`
- `createRoot(renderer).render(<App />)`
- `renderer.destroy()` instead of `process.exit()`

**Runtime:** Bun (not Node.js)

---

## 5. Parallel Execution Waves

### LOCAL Waves

```
WAVE L0 (Sequential):
  US-001 → US-002 → US-003

WAVE L-A (Parallel after US-003):
  US-004, US-005, US-006, US-007, US-008

WAVE L-B (Parallel schema/I-O):
  US-014, US-018, US-026, US-028

WAVE L-C (Parallel after US-010):
  US-011, US-012, US-038

WAVE L-D (Parallel post-splitter):
  US-021, US-039

WAVE L-E (Sequential):
  US-009 → US-013 → US-015 → US-016 → US-017
  US-019 → US-020 → US-022 → US-023 → US-024 → US-025
  US-027 → US-029 → US-030 → US-031
```

### JULES Waves

```
WAVE J0 (Sequential):
  US-032 (Ink → OpenTUI migration)

WAVE J-A (Parallel after US-032):
  US-033, US-034, US-035, US-036, US-037, US-040, US-041, US-044, US-050

WAVE J-B (Parallel):
  US-042, US-043, US-045, US-046, US-047, US-048

WAVE J-C (Sequential):
  US-049 (view navigation)
```

---

## 6. Integration Gates

### Gate G0 - Setup and Carding
- Stitch project boards created
- All story cards created with dependency links

### Gate G1 - Foundations Complete
- LOCAL: US-003 done, L-A started
- JULES: US-032 done, J-A started
- Evidence: `npm test`, `npx tsc --noEmit` pass

### Gate G2 - Contract Freeze
- LOCAL: US-010, US-011, US-012, US-013, US-015 done
- JULES: US-033, US-035, US-040, US-044 done
- Evidence: Contract doc attached (packer payload keys, token pressure)

### Gate G3 - Integration Stabilization
- LOCAL: US-020, US-021, US-023, US-038, US-039 done
- JULES: US-041, US-045, US-046, US-047, US-048, US-049 done
- Evidence: Dashboard renders with packer data, token pressure visible

### Gate G4 - Release Candidate
- LOCAL: US-031 done (full regression)
- JULES: US-042, US-043, US-050 done
- Evidence: All tests green, guard passes

---

## 7. Verification Commands

```bash
# Fast gate
npx tsc --noEmit

# Functional gate
npm test

# Public branch policy gate (pre-master only)
npm run guard:public

# Full verification
npm run typecheck && npm test && npm run guard:public
```

---

## 8. Naming Conventions

### Branch Naming
- LOCAL: `local/us-<id>-<slug>` (e.g., `local/us-001-graph-node-schemas`)
- JULES: `jules/us-<id>-<slug>` (e.g., `jules/us-032-opentui-migration`)

### Commit Messages
- Format: `<type>(<scope>): <description> (#issue)`
- Examples:
  - `feat(schemas): add graph node Zod schemas (#55)`
  - `refactor(dashboard): migrate from Ink to OpenTUI (#56)`

### File Naming
- Components: PascalCase (e.g., `TelemetryHeader.tsx`)
- Libraries: kebab-case (e.g., `compaction-engine.ts`)
- Tests: match source file (e.g., `graph-nodes.test.ts`)

---

## 9. Links

| Resource | URL |
|----------|-----|
| LOCAL Stitch Project | https://stitch.google.com/projects/9051349330813916457 |
| JULES Stitch Project | https://stitch.google.com/projects/18146358756909814967 |
| LOCAL GitHub Issue | https://github.com/shynlee04/hivemind-plugin/issues/55 |
| JULES GitHub Issue | https://github.com/shynlee04/hivemind-plugin/issues/56 |
| PRD Backend JSON | `tasks/prd-backend.json` |
| PRD Frontend JSON | `tasks/prd-frontend.json` |
| Stitch Screens | `docs/stitch-screens/screen-*.html` |
