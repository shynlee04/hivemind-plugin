# Phase 2: Unified Runtime Operations - Research

**Researched:** 2026-03-18
**Domain:** unified runtime operations with TUI-infrastructure-first rebaseline
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- TUI infrastructure comes first in Phase 2.
- The first plan in this phase must be an infrastructure slice (`02-00`) before the existing `02-01`, `02-02`, and `02-03` work.
- Do not add richer TUI panels first; first make the dashboard a real app/runtime boundary.
- Keep the shipped core package on Node/TypeScript.
- Move the OpenTUI surface toward a real Bun/OpenTUI app boundary instead of growing `src/tui` inside the Node package.
- The TUI must consume backend-owned truth through shared contracts; it must not become a second authority surface.
- Shared runtime status/read-model contracts should be established before broader runtime-entry consolidation work in this phase.

### Claude's Discretion
- Exact package/workspace structure for the Bun/OpenTUI app boundary, as long as it is clearly separated from the Node-shipped package surface.
- Exact names and file layout for the shared runtime-status/read-model contract files.
- Exact order of the remaining Phase 2 backend plans after `02-00`, as long as they still satisfy `CTRL-03`, `CTRL-04`, and `INSP-03`.

### Deferred Ideas (OUT OF SCOPE)
- Richer dashboard panels and advanced operator workflows.
- Large workflow/trajectory ownership refactors beyond what Phase 2 needs for unified runtime inspection.
- Full completion of `TUI-01`, `TUI-02`, and `TUI-03` as user-facing product requirements if the necessary backend seams are not yet ready.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CTRL-03 | User can inspect authoritative runtime status from a single backend-owned source of truth | Establish one backend-owned runtime read model and shared contracts before any TUI work; route CLI, tools, and Bun app through the same snapshot builder. |
| CTRL-04 | User can run bootstrap, doctor, and harness flows against the same authoritative runtime contract | Rebind `hm-init`, `hm-doctor`, `hm-harness`, and `hivemind_runtime_command` to one additive runtime contract instead of mixing command-specific assembly paths. |
| INSP-03 | User can inspect current runtime authority, active workflow state, and last significant runtime events from one additive inspection seam | Extend the Phase 1 runtime-status seam to include workflow summary and reduced recent-event records; expose that seam to both CLI and Bun/OpenTUI consumers. |
</phase_requirements>

## Summary

Phase 2 should plan around one core idea: the backend seam already exists, but it is not complete enough yet for a real operator client. Phase 1 established authoritative runtime identity through `loadRuntimeBindingsSnapshot()` and `buildRuntimeStatusSnapshot()`, and `hivemind_runtime_status` already consumes that seam. That is the correct foundation. The problem is that the seam still omits the fields Phase 2 cares about most for operator use: workflow execution detail is still `null`, recent runtime events are not surfaced as a reduced read model, and runtime command flows still split truth across CLI code, slash-command execution, and dated artifact writers.

The TUI-first rebaseline is correct, but only if `02-00` is infrastructure-first. The current `src/tui` code is an orphan spike: it is not exported, not reachable from the CLI, and not referenced anywhere outside `src/tui` itself. Official OpenTUI docs say it is Bun-exclusive today, and the current Node test path fails with `ERR_UNKNOWN_FILE_EXTENSION` on OpenTUI `.scm` assets. At the same time, the repo contains a second dead dashboard track: `src/dashboard-v2/` has no `package.json`, and the existing `npm run typecheck:dashboard-v2` script fails immediately. Planning should treat both as evidence that Phase 2 must first create a real Bun app boundary and kill the illusion that the current dashboard is already a product surface.

The strongest planning recommendation is: `02-00` should create `apps/opentui/` as a Bun-owned app boundary, define shared runtime-status/read-model contracts in a backend-owned shared contract module, and wire a minimal runtime-status view that consumes those contracts from the backend truth only. Then the remaining Phase 2 backend plans should harden that same seam for status, runtime commands, workflow state, and recent events. Do not plan richer panels until the backend seam can answer `CTRL-03`, `CTRL-04`, and `INSP-03` by itself.

**Primary recommendation:** Plan `02-00` as a Bun app boundary plus shared backend-owned runtime read models, then make every remaining Phase 2 slice deepen that same seam instead of adding parallel status or event logic.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@opencode-ai/sdk` | `1.2.27` | Runtime client/server control and event streaming | Phase 1 already uses SDK-owned authority; official docs show this is the correct control-plane boundary. |
| `@opencode-ai/plugin` | `1.2.27` | Hook and tool execution boundary | Official plugin docs keep tools and hooks as the supported execution-plane extension surface. |
| `typescript` | `5.9.3` | Shared language for backend and Bun app contracts | Keeps backend seam and Bun client contracts typed from one source. |
| `zod` | `4.3.6` | Shared contract schemas and validation | Matches repo governance (`tool.schema`) and prevents backend/TUI contract drift. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@opentui/core` | `0.1.88` | Native terminal renderer | Use only inside the isolated Bun app boundary. |
| `@opentui/react` | `0.1.88` | React bindings for OpenTUI | Use for the minimal runtime-status app shell and view composition. |
| `react` | `19.2.4` | Component model for OpenTUI app | Use inside `apps/opentui` only. |
| `proper-lockfile` | `4.1.2` | Safe local artifact/state writes | Keep file-backed runtime evidence safe without adding a database. |
| `tsx` | `4.21.0` | Current Node-side test runner | Keep for core package tests until a Bun app test lane exists. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `apps/opentui` Bun app boundary | Keep `src/tui` inside the root Node package | Current OpenTUI docs and local test failure both say this stays brittle and misleading. |
| Shared backend-owned read models | Raw SDK events in the UI | Faster to spike, but it makes the UI interpret runtime truth on its own. |
| One additive runtime inspection seam | Separate CLI, tool, and TUI status assemblers | Easier short-term, but it directly violates `CTRL-03` and `INSP-03`. |

**Installation:**
```bash
npm install @opencode-ai/sdk@1.2.27 @opencode-ai/plugin@1.2.27 zod@4.3.6 proper-lockfile@4.1.2
npm install -D typescript@5.9.3 tsx@4.21.0
```

```bash
bun add @opentui/core@0.1.88 @opentui/react@0.1.88 react@19.2.4
```

**Version verification:**
- `@opencode-ai/sdk` `1.2.27` - repo + npm registry align; latest as of 2026-03-17.
- `@opencode-ai/plugin` `1.2.27` - repo + npm registry align; latest as of 2026-03-17.
- `@opentui/core` `0.1.88` - repo + npm registry align; latest as of 2026-03-17.
- `@opentui/react` `0.1.88` - repo + npm registry align; latest as of 2026-03-17.
- `zod` `4.3.6` - repo + npm registry align; latest stable as of 2026-01-22.
- `proper-lockfile` `4.1.2` - repo + npm registry align; latest published version.
- `bun --version` currently fails locally (`command not found`), so Phase `02-00` needs a Bun bootstrap step before verification can pass.

## Architecture Patterns

### Recommended Project Structure
```text
apps/
  opentui/
    package.json        # Bun-owned app boundary
    tsconfig.json       # Bun/OpenTUI compile settings
    src/
      main.tsx          # app bootstrap
      app.tsx           # root view
      views/
        runtime-status.tsx
      adapters/
        runtime-client.ts
src/
  shared/
    contracts/
      runtime-status.ts # zod schema + TS types for backend/TUI seam
      runtime-events.ts # reduced recent-event read model
  sdk-supervisor/
    runtime-status.ts   # backend-owned snapshot builder
  tools/runtime/
    tools.ts            # authoritative runtime inspection + command tools
  cli/
    harness.ts
    doctor.ts
    init.ts
```

### Pattern 1: Backend-Owned Read Model
**What:** Build one additive runtime inspection model on the backend, then let CLI and Bun/OpenTUI consume it.
**When to use:** Always for `CTRL-03` and `INSP-03` work.
**Example:**
```typescript
// Source: /Users/apple/hivemind-plugin/src/tools/runtime/tools.ts
const snapshot = await loadRuntimeBindingsSnapshot(projectRoot)
const statusSnapshot = await buildRuntimeStatusSnapshot({
  projectRoot,
  sessionId: context.sessionID,
  agentId: context.agent,
  snapshot,
})
```

### Pattern 2: Bun App as a Client Boundary
**What:** Keep the shipped root package on Node, but run the OpenTUI client in a dedicated Bun app.
**When to use:** `02-00` immediately.
**Example:**
```tsx
// Source: https://github.com/anomalyco/opentui/blob/main/packages/react/README.md
import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"

const renderer = await createCliRenderer()
createRoot(renderer).render(<App />)
```

### Pattern 3: Stream SDK Events, Then Reduce Them
**What:** Use the SDK event stream as input, but expose reduced recent-event records to the UI.
**When to use:** For `INSP-03`; never render raw runtime events as the main contract.
**Example:**
```typescript
// Source: https://github.com/sst/opencode-sdk-js/blob/main/README.md
const stream = await client.event.list()
for await (const event of stream) {
  // reduce into backend-owned recent event records
}
```

### Pattern 4: Surface Adapters Stay Thin
**What:** `cli/`, `tools/runtime/`, and plugin hooks should call the shared runtime seam, not rebuild it.
**When to use:** For `02-01` through `02-03`.
**Example:** `runHarnessCommand()` should consume the same additive runtime read model that powers `hivemind_runtime_status`, not a separate command-specific interpretation path.

### Anti-Patterns to Avoid
- **Orphan TUI:** `src/tui` compiles in isolation but is not a real runtime surface; replace it with `apps/opentui`.
- **Two dashboard tracks:** `src/tui` plus `src/dashboard-v2` guarantees drift; archive or supersede both with one boundary.
- **Raw event UI authority:** the UI must not decide what runtime truth means from arbitrary SDK events.
- **Per-command truth assembly:** `hm-init`, `hm-doctor`, `hm-harness`, and runtime tools cannot each own their own status model.
- **Node/Bun blur:** do not try to make `tsx --test` the validation path for OpenTUI assets.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TUI runtime bootstrapping | Custom terminal renderer bootstrap layer | `@opentui/core` + `@opentui/react` | Official path already exists and matches current component model. |
| Runtime event transport | Custom SSE/EventSource protocol | `@opencode-ai/sdk` event stream | Keeps the UI bound to the same official runtime surface. |
| Cross-boundary schemas | Ad hoc TypeScript interfaces duplicated in app and backend | Shared `zod` contract module | Prevents backend/TUI drift and supports parsing at the boundary. |
| Runtime truth cache in UI | Local dashboard store as source of truth | Backend snapshot + reduced read models | Avoids split-brain operator state. |
| File write concurrency | Custom lock discipline | `proper-lockfile` | Already fits repo-local artifact state without extra infrastructure. |

**Key insight:** The deceptive complexity in this phase is not rendering; it is authority. Hand-rolled event transport, dashboard state, or contract duplication will recreate the same split-brain problem this phase is meant to remove.

## Common Pitfalls

### Pitfall 1: Planning `02-00` as UI feature work instead of infrastructure work
**What goes wrong:** The plan starts with tabs, panels, and interactions before the backend seam is ready.
**Why it happens:** The repo already has a visible dashboard spike, so it feels closer to done than it is.
**How to avoid:** Restrict `02-00` to app boundary, shared contracts, backend wiring, and one minimal runtime-status view.
**Warning signs:** New UI components appear before a shared runtime-status schema and Bun app package exist.

### Pitfall 2: Keeping `src/tui` alive as a quasi-product path
**What goes wrong:** The team wires more code into a spike that official docs say should run under Bun, not the Node package.
**Why it happens:** It already imports OpenTUI and renders something.
**How to avoid:** Treat current `src/tui` as migration source material only.
**Warning signs:** `package.json` still has OpenTUI only as root devDependencies, while no CLI route or app package exists.

### Pitfall 3: Assuming the Phase 1 status seam is already enough for Phase 2
**What goes wrong:** Planning ignores the fact that `workflowGraph`, `workflowWave`, and `workflowGuard` are still `null`, and recent events are not in the status payload.
**Why it happens:** `hivemind_runtime_status` already exists, so the seam looks complete.
**How to avoid:** Plan additive extensions to `RuntimeStatusSnapshot` and `HivemindRuntimeStatusPayload` before richer clients.
**Warning signs:** A plan claims `INSP-03` without adding workflow summary and recent-event records.

### Pitfall 4: Depending on broken local dashboard tracks as validation proof
**What goes wrong:** Planning assumes there is already a valid dashboard test lane.
**Why it happens:** The repo contains both `tests/tui/*` and `src/dashboard-v2`.
**How to avoid:** Start from the real evidence: `tests/tui/client.test.ts` currently fails under Node, and `npm run typecheck:dashboard-v2` currently fails because `src/dashboard-v2/package.json` does not exist.
**Warning signs:** The plan references dashboard-v2 as an active package or treats `tests/tui/client.test.ts` as green.

### Pitfall 5: Forgetting Bun is not installed locally
**What goes wrong:** The phase plan jumps straight to Bun verification without a workspace bootstrap step.
**Why it happens:** Bun is assumed because OpenTUI docs use it.
**How to avoid:** Make Bun installation and verification part of Wave 0 for `02-00`.
**Warning signs:** `bun --version` is not run, or the plan has Bun commands without an install/preflight task.

## Code Examples

Verified patterns from official sources:

### OpenTUI React App Bootstrap
```tsx
// Source: https://github.com/anomalyco/opentui/blob/main/packages/react/README.md
import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"

function App() {
  return <text>Hello, world!</text>
}

const renderer = await createCliRenderer()
createRoot(renderer).render(<App />)
```

### Stream Runtime Events Through the SDK
```typescript
// Source: https://github.com/sst/opencode-sdk-js/blob/main/README.md
const stream = await client.event.list()

for await (const event of stream) {
  console.log(event)
}

stream.controller.abort()
```

### Bun Workspace Declaration
```json
// Source: https://github.com/oven-sh/bun/blob/main/docs/guides/install/workspaces.mdx
{
  "workspaces": ["apps/*", "packages/*"]
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `src/tui` spike inside Node package | Bun-owned app boundary over shared contracts | OpenTUI docs current as of 2026-03-18 | Prevents Node/OpenTUI asset breakage and clarifies authority boundaries. |
| Tool payloads assembled ad hoc per surface | One additive backend read model consumed everywhere | Phase 1 laid the base; Phase 2 must complete it | Enables `CTRL-03` and `INSP-03` without split-brain status logic. |
| UI reading raw runtime events directly | Backend reduces recent events into stable read models | Needed now for operator correctness | Keeps the UI a consumer, not an interpreter of truth. |
| Node `tsx --test` for OpenTUI spike | `bun test` for Bun app, `tsx --test` for Node core | Required by current OpenTUI docs and local failure evidence | Prevents fake green test lanes. |

**Deprecated/outdated:**
- `src/tui` as the long-term app boundary: outdated for this roadmap because it keeps OpenTUI inside the shipped Node package.
- `src/dashboard-v2`: effectively dead; current typecheck script proves it is not a real package.
- `client.event.subscribe()` in the TUI spike: current SDK docs show `client.event.list()` as the streaming API, so event streaming should be revalidated during `02-00`.

## Open Questions

1. **Should shared contracts live in `src/shared/contracts` only, or in a dedicated `packages/runtime-contracts` workspace package?**
   - What we know: locked decisions require separation from the Node-shipped app surface, not necessarily a published shared package.
   - What's unclear: whether the root package should adopt workspaces immediately or keep contract sharing repo-internal first.
   - Recommendation: start with repo-internal shared contracts under `src/shared/contracts` plus an `apps/opentui` app; only introduce `packages/runtime-contracts` if app/backend build isolation becomes painful.

2. **What exact reduced event shape should satisfy `INSP-03`?**
   - What we know: current status snapshot has no recent-event read model, but the trajectory ledger already records summarized events.
   - What's unclear: whether Phase 2 should surface raw recent SDK events, reduced event summaries, or both.
   - Recommendation: expose reduced recent-event records only in Phase 2; defer richer replay/audit detail to later phases.

3. **How far should workflow inspection go in Phase 2?**
   - What we know: current `RuntimeStatusSnapshot` leaves workflow graph/wave/guard as `null`.
   - What's unclear: whether Phase 2 needs full workflow graph inspection or only active workflow summary for operator status.
   - Recommendation: scope Phase 2 to active workflow summary and current gate state, not full workflow graph authoring or replay.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `node:test` + `tsx --test` for the Node package; `bun test` for the new Bun app |
| Config file | `package.json` scripts for Node package; none yet for Bun app |
| Quick run command | `tsx --test tests/runtime-tools.test.ts tests/control-plane-runtime-tools.test.ts tests/harness-command.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CTRL-03 | runtime status comes from one backend-owned seam | integration | `tsx --test tests/runtime-tools.test.ts tests/control-plane-runtime-tools.test.ts` | ✅ |
| CTRL-04 | bootstrap, doctor, and harness run against the same runtime contract | integration | `tsx --test tests/harness-command.test.ts tests/control-plane-runtime-tools.test.ts` | ✅ |
| INSP-03 | one seam exposes runtime authority, workflow summary, and recent events | integration | `tsx --test tests/runtime-tools.test.ts` | ❌ Wave 0 |
| 02-00 app boundary | Bun/OpenTUI app consumes backend contracts without owning truth | app/integration | `bun test apps/opentui` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `tsx --test tests/runtime-tools.test.ts tests/control-plane-runtime-tools.test.ts`
- **Per wave merge:** `npm test` for Node package + `bun test apps/opentui` once the app exists
- **Phase gate:** Node suite green, Bun app suite green, and at least one end-to-end runtime-status app smoke path green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `apps/opentui/package.json` - establish the Bun/OpenTUI app boundary
- [ ] `apps/opentui/tsconfig.json` - isolate Bun app compile settings from the root Node package
- [ ] `apps/opentui/src/main.tsx` - real app bootstrap using OpenTUI React
- [ ] `apps/opentui/src/views/runtime-status.tsx` - minimal real runtime-status view over shared contracts
- [ ] `apps/opentui/tests/runtime-status.test.tsx` - proves the app consumes backend read models rather than mock truth
- [ ] `tests/runtime-inspection-seam.test.ts` - covers workflow summary + recent-event records for `INSP-03`
- [ ] Bun install: `curl -fsSL https://bun.com/install | bash` - `bun --version` currently fails locally

## Sources

### Primary (HIGH confidence)
- Context7 `/sst/opencode-sdk-js` - event streaming API, session/client API surface
- Context7 `/anomalyco/opentui` - React/OpenTUI bootstrap patterns
- Context7 `/oven-sh/bun` - workspace/package structure guidance
- https://opencode.ai/docs/plugins - current plugin/tool/hook execution model (last updated Mar 17, 2026)
- https://opentui.com/docs/getting-started - Bun-exclusive installation guidance for OpenTUI
- https://bun.sh/docs/installation - Bun installation and verification steps
- Local code evidence: `package.json`, `src/tools/runtime/tools.ts`, `src/sdk-supervisor/runtime-status.ts`, `src/shared/runtime-attachment.ts`, `src/cli/harness.ts`, `src/tui/index.ts`, `src/tui/client.ts`, `src/tui/Dashboard.tsx`, `src/tui/sse.ts`, `tests/tui/client.test.ts`

### Secondary (MEDIUM confidence)
- `.planning/research/SUMMARY.md` - prior repo-specific architecture recommendation
- `.planning/research/ARCHITECTURE.md` - hybrid modular-monolith guidance for runtime seams
- `.planning/research/STACK.md` - prior stack recommendation aligned with current registry versions
- `.planning/research/PITFALLS.md` - repo-specific failure modes confirmed by current code and tests

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - official docs, Context7, npm registry, and repo evidence agree.
- Architecture: HIGH - locked user decisions and repo evidence strongly align around backend-owned truth plus Bun app boundary.
- Pitfalls: HIGH - current repo failures are directly observable (`src/tui` orphaning, failing Node OpenTUI test, broken `dashboard-v2` script, missing Bun).

**Research date:** 2026-03-18
**Valid until:** 2026-04-17
