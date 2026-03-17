# Architecture Patterns

**Domain:** OpenCode-native AI coding governance plugin/CLI with deterministic agent runtime and terminal UI
**Project:** HiveMind Runtime Refactor and Deterministic Execution Migration
**Researched:** 2026-03-17

## Recommended Architecture

Use a **contract-first modular monolith with a hard dual-plane split**:

1. **Control plane** for bootstrap, repair, session creation, and external orchestration via `@opencode-ai/sdk`
2. **Execution plane** for OpenCode plugin hooks and agent-callable tools via `@opencode-ai/plugin`
3. **Schema kernel** as the only owner of persisted and cross-session record contracts
4. **Supervisor** as the only owner of orchestration read models and health aggregation
5. **TUI/web surfaces** as read-model consumers, never authorities

This repo should **not** become microservices. It is a local-runtime, SDK-bound product with a single deployment artifact (`dist/cli.js` plus plugin export) and tight in-process coupling to OpenCode hooks. The right 2026 structure is a **progressively layered modular monolith** with strict boundaries, typed contracts, and explicit proof seams.

The architecture should optimize for four things:
- deterministic execution evidence through the real OpenCode boundary
- additive migration from legacy shared/runtime state into owned sectors
- clear distinction between read-side diagnostics and write-side mutation paths
- consumer-safe packaging for npm, CLI, plugin, and future TUI/dashboard surfaces

### Recommended Architecture Diagram

```mermaid
flowchart TD
    User[User / Operator] --> CLI[CLI + Control Plane\nsrc/cli + src/control-plane]
    User --> OpenCode[OpenCode Session]
    CLI --> SDK[@opencode-ai/sdk]
    SDK --> Server[Live OpenCode Server]
    Server --> Plugin[HiveMind Plugin Assembly\nsrc/plugin]

    Plugin --> Hooks[Hooks / Interceptors\nsrc/hooks]
    Plugin --> Tools[Managed Tools\nsrc/tools]

    Hooks --> SharedRuntime[Runtime Attachment / Shared Runtime Read Helpers\nsrc/shared]
    Hooks --> Supervisor[Supervisor Read Models\nsrc/sdk-supervisor]
    Tools --> Core[Core Domain Operations\nsrc/core + domain modules]
    Tools --> Commands[Command Bundles / Registries\nsrc/commands]
    Tools --> SchemaKernel[Schema Kernel Contracts\nsrc/schema-kernel]
    Supervisor --> SchemaKernel
    SharedRuntime --> SchemaKernel

    Tools --> RuntimeStatus[Runtime Inspection Projection\nhivemind_runtime_status]
    RuntimeStatus --> TUI[TUI / Dashboard Read Models\nsrc/tui or future UI]
    Server --> TUI

    LiveProof[Live Verification Harness] --> SDK
    LiveProof --> Server
    LiveProof --> Plugin
```

### Architectural Thesis

- **Keep one deployable runtime, many bounded modules.** The repo is operationally simpler and more testable as a modular monolith.
- **Make contracts explicit before moving behavior.** Migrate from `src/shared/` to `src/schema-kernel/` and `src/sdk-supervisor/` by introducing typed records first, then shifting consumers.
- **Treat plugin hooks as interceptors, not business logic containers.** OpenCode officially exposes hooks, plugin load order, custom tools via `tool()`, and structured client APIs; use those primitives directly instead of inventing an internal runtime protocol. High confidence.
- **Treat the TUI as a projection surface.** The current TUI already consumes SDK event streams; keep that model and never let the UI mutate runtime state directly. High confidence for the SDK event stream capability, medium confidence for the repo-specific recommendation.

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `src/cli/` | Local executable entry, command routing, process bootstrap | `src/control-plane/`, `@opencode-ai/sdk` |
| `src/control-plane/` | Intake, repair, bootstrap gating, runtime projection sync | `src/cli/`, `src/commands/`, `src/sdk-supervisor/`, `@opencode-ai/sdk` |
| `src/plugin/` | Assembly only: register hooks, tools, and event handler | `src/hooks/`, `src/tools/` |
| `src/hooks/` | Read-side interception, prompt/context injection, permission mediation, observation | `src/shared/`, `src/sdk-supervisor/`, `src/plugin-handlers/` |
| `src/tools/` | Only mutation-capable agent surfaces; execute governed actions | `src/core/`, `src/commands/`, `src/schema-kernel/`, `src/sdk-supervisor/` |
| `src/schema-kernel/` | Machine-authoritative contracts for lifecycle, orchestration, and evidence records | All status/reporting consumers |
| `src/sdk-supervisor/` | Orchestration read models, health, session/workflow supervision | `src/schema-kernel/`, `src/tools/runtime/`, `src/control-plane/` |
| `src/core/` | Domain logic for trajectory/workflow/task state transitions | `src/tools/`, selected domain modules |
| `src/commands/` | Slash-command bundle registry and execution | `src/tools/runtime/`, `src/control-plane/` |
| `src/plugin-handlers/` | Resolution/routing helpers for command/tool/session decisions | `src/plugin/`, `src/hooks/` |
| `src/shared/` | Transitional runtime attachment helpers and generic utilities only | Many modules, but shrinking over time |
| `src/tui/` | Operator-facing read model and event stream visualization | `@opencode-ai/sdk`, `hivemind_runtime_status`, SSE events |

### Boundary Rules

1. **Control plane imports SDK only.** No plugin-hook logic in `src/cli/` or `src/control-plane/`.
2. **Execution plane imports plugin primitives only.** No `@opencode-ai/sdk` inside hooks/tools/plugin assembly.
3. **Hooks never own durable mutation.** They may classify, inject, reject, and observe.
4. **Tools are the only write gateway.** If the agent mutates state, it must happen through a managed tool.
5. **Schema kernel owns contracts, not behavior.** No duplicate JSON shapes outside it.
6. **Supervisor owns orchestration read models, not writes.** It aggregates status; it does not become a second tool layer.
7. **TUI owns presentation only.** It subscribes, renders, filters, and steers through approved commands or tools.

## Data Flow

### Flow 1: Agent Turn Inside OpenCode

1. OpenCode loads the plugin and executes registered hooks in sequence. Official docs confirm plugins are loaded from config and plugin directories, and hooks run sequentially. High confidence.
2. `chat.message`, `system.transform`, and `messages.transform` inject runtime context, governance instructions, and route reminders.
3. The model chooses a managed tool.
4. `tool.execute.before` records intent and governance metadata.
5. The tool executes domain logic through `src/core/`, `src/commands/`, or other bounded modules.
6. The tool emits typed outputs and metadata.
7. `tool.execute.after` records observation and updates read-side status inputs.
8. Runtime status becomes inspectable through `hivemind_runtime_status` rather than ad hoc file inspection.

### Flow 2: Bootstrap / Repair / Runtime Projection

1. User runs `hm-init`, `hm-doctor`, `hm-settings`, or `hm-harness`.
2. CLI routes to control-plane intake and gate checks.
3. Control plane resolves missing profile fields and decides whether execution can proceed.
4. Command bundle executes through the common command execution path.
5. Only approved first-run and repair flows write user-local `.opencode/**` runtime projections.
6. Supervisor/runtime status surfaces expose current state back to plugin and TUI consumers.

### Flow 3: Live Determinism Proof

1. Harness starts a real OpenCode server/client session via `@opencode-ai/sdk`.
2. The actual packaged plugin is loaded through the normal OpenCode plugin path.
3. A prompt is submitted to a live session.
4. Evidence is collected from SDK session APIs, event streams, tool invocation traces, and runtime status snapshots.
5. Result is labeled as **live proof**, separate from mocked tests, direct tool instantiation, or health-only checks.

This split is essential. The repo governance is correct to distinguish **local diagnostics** from **live OpenCode proof**. Local evidence is useful, but it is not enough to claim deterministic runtime behavior. High confidence.

## Patterns to Follow

### Pattern 1: Dual-Plane Runtime Boundary
**What:** Separate external orchestration (`@opencode-ai/sdk`) from in-session execution (`@opencode-ai/plugin`).
**When:** Always.
**Why:** It prevents recursive architecture, keeps plugin behavior aligned with OpenCode’s official extension model, and makes proof boundaries legible.

**Example:**
```typescript
// control plane
import { createOpencode, createOpencodeClient } from '@opencode-ai/sdk'

// execution plane
import { tool, type Plugin } from '@opencode-ai/plugin'
```

### Pattern 2: Contract-First Migration
**What:** Introduce schema-kernel records before moving behavior out of `src/shared/`.
**When:** Any time a legacy runtime helper starts carrying cross-session meaning.
**Why:** Brownfield migrations fail when contracts stay implicit inside convenience helpers.

**Example:**
```typescript
const runtimeInvocation = createRuntimeInvocationRecord({
  invocationId,
  sessionId,
  gateState: 'inspection-ready',
  requestReason: 'runtime-status-inspection',
})
```

### Pattern 3: Read Model TUI
**What:** TUI consumes SDK event streams plus explicit runtime-status projections.
**When:** All dashboard/operator UI work.
**Why:** It keeps UI latency low and avoids coupling presentation to file layout or hook internals.

**Example:**
```typescript
const result = await client.event.subscribe()
for await (const event of result.stream) {
  render(event)
}
```

### Pattern 4: Managed Tool Mutation Gateway
**What:** All state-changing agent behavior routes through named tools with `tool.schema` args.
**When:** Any agent action that changes runtime state, workflow state, or user-local projections.
**Why:** Official custom tool support gives validation, introspection, and a stable place to attach metadata and evidence. High confidence.

### Pattern 5: Thin Markdown Projection
**What:** Keep command markdown and other runtime-facing markdown as projections, not authorities.
**When:** Commands, agent surfaces, compatibility files.
**Why:** Runtime behavior must live in TypeScript registries and handlers so it is testable and deterministic.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Plugin-as-God-Object
**What:** Growing `opencode-plugin.ts` into a giant runtime brain.
**Why bad:** It collapses hook assembly, state logic, orchestration, and tool behavior into one unstable file.
**Instead:** Keep plugin entry assembly-only; move contracts to schema-kernel, orchestration to supervisor, mutations to tools.

### Anti-Pattern 2: Shadow Runtime Protocol
**What:** Inventing a second event bus, second session model, or second command protocol beside OpenCode.
**Why bad:** Determinism becomes unprovable because the true authority is unclear.
**Instead:** Translate internal state outward through official OpenCode hooks, tools, SDK sessions, and event streams.

### Anti-Pattern 3: Hooks That Mutate Durable State
**What:** Writing files or persistent runtime state directly from hook handlers.
**Why bad:** Hook order and prompt-driven execution make this hard to reason about and hard to verify.
**Instead:** Hooks classify/inject; tools mutate.

### Anti-Pattern 4: Status by Filesystem Archaeology
**What:** Letting every module inspect `.hivemind/` or `.opencode/` directly and infer its own status shape.
**Why bad:** You get drift, duplicate parsers, and contradictory runtime stories.
**Instead:** Centralize status in schema-kernel records plus supervisor projections surfaced through runtime tools.

### Anti-Pattern 5: UI as Runtime Authority
**What:** Letting the TUI/dashboard write authoritative state or infer unsupported actions from SSE alone.
**Why bad:** UI refresh and event ordering become correctness risks.
**Instead:** UI issues approved commands or tool calls and renders returned read models.

### Anti-Pattern 6: “Deterministic” Claims From Mocked Tests
**What:** Claiming determinism because unit tests passed against mocked plugin input.
**Why bad:** Official docs show real hooks, tools, and events flow through OpenCode runtime surfaces; mocks only prove local slice logic.
**Instead:** Maintain a separate live-proof lane that exercises real OpenCode server/client/plugin boundaries.

### Anti-Pattern 7: Shared Folder Re-Growth
**What:** Continuing to add durable contracts or orchestration logic to `src/shared/` because it is convenient.
**Why bad:** The migration never converges.
**Instead:** `src/shared/` shrinks over time; new durable contracts go to `src/schema-kernel/`, new orchestration read models go to `src/sdk-supervisor/`.

## Build Order Implications

Recommended order for this brownfield migration:

1. **Stabilize authorities first**
   - Freeze boundary rules for `plugin`, `hooks`, `tools`, `schema-kernel`, and `sdk-supervisor`
   - Stop new durable logic from landing in `src/shared/`

2. **Finish contract extraction**
   - Move lifecycle, orchestration, and evidence shapes into `src/schema-kernel/`
   - Make runtime status consumers parse/build only those records

3. **Finish runtime inspection seam**
   - Expand `hivemind_runtime_status` into the single additive inspection surface
   - Ensure CLI, TUI, and tests consume that seam instead of bespoke status assembly

4. **Harden managed tool paths**
   - Ensure all write operations happen via managed tools with `tool.schema`, metadata, and evidence hooks
   - Remove any remaining hidden mutations in command glue or hook utilities

5. **Move orchestration read models into supervisor**
   - Session registry, workflow graph, wave/guard state, health rollups
   - Keep supervisor read-mostly until mutation gateways are mature

6. **Create live verification lane**
   - Real OpenCode server/client/plugin loading
   - Session prompt -> tool selection -> event stream -> runtime-status assertions
   - Publish proof artifacts separately from unit diagnostics

7. **Only then deepen TUI/dashboard**
   - Consume SDK event streams and runtime-status read models
   - Add operator workflows after the backend/runtime authority model is stable

This order matters: **do not build a richer dashboard on top of unstable authorities**. For this repo, the biggest risk is making the UI or harness look convincing while the runtime proof model is still ambiguous.

## Backend and TUI Boundary Recommendation

### Backend / Runtime

- Keep `src/plugin/`, `src/hooks/`, and `src/tools/` as the live execution plane.
- Keep `src/control-plane/` and `src/cli/` as the external operator plane.
- Use `src/schema-kernel/` for typed contracts and `src/sdk-supervisor/` for aggregated orchestration state.
- Treat `src/commands/` as command bundle authority and `src/tools/runtime/` as runtime inspection/command gateway.

### TUI / Frontend

- Keep the TUI on a **read-model architecture**.
- Subscribe to `client.event.subscribe()` for streaming updates and poll or request `hivemind_runtime_status` for coherent snapshots.
- Do not let TUI components parse raw runtime attachment files.
- Do not let components infer workflow legality from visual state alone.
- Prefer a presentation adapter layer between SDK/event payloads and React/OpenTUI components so UI can evolve without leaking runtime internals.

The current `src/tui/` code is a useful spike, but architecturally it should mature into:

`SDK/Event Client -> TUI Read Model Adapter -> Presentational Components`

not:

`Components -> raw SSE/tool payloads -> direct runtime assumptions`

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| Session determinism proof | Manual live harness runs are acceptable | Need automated proof suites per release lane | Need sampled replay suites plus strict contract versioning |
| Runtime status aggregation | Single status tool projection is enough | Need cached read models and explicit freshness metadata | Need partitioned evidence storage and retention policy |
| TUI/event rendering | Direct SSE stream is fine | Need event coalescing and view-model reduction | TUI likely becomes admin/operator niche; web surfaces may take over |
| Command/runtime mutation safety | Tool metadata + permission gates are enough | Need stronger audit trails and replay IDs | Need immutable evidence records and policy enforcement layers |
| Brownfield migration safety | Additive slices are manageable | Need contract migration discipline and deprecation windows | Need versioned runtime contracts and compatibility adapters |

For this repo, design primarily for **single-project local runtime correctness** and **team-scale maintainability**, not internet-scale multi-tenant serving. If scale grows later, the schema-kernel/supervisor split gives a clean extraction seam.

## Confidence and Research Notes

- **High confidence:** OpenCode plugin architecture, plugin load order, hook/event availability, custom tool model, config precedence, SDK event streaming, and SDK APIs. Verified against official OpenCode docs updated Mar 15, 2026.
- **High confidence:** Repo-specific direction toward dual-plane separation, assembly-only plugin entry, additive `schema-kernel` and `sdk-supervisor` sectors, and runtime-status as the inspection seam. Verified from repo governance files.
- **Medium confidence:** The exact long-term shape of a richer TUI/dashboard layer, because current repo code is still partial and read models are still emerging.
- **Medium confidence:** Future adoption priority for `chat.params`, `tool.definition`, and `config` hooks; supported by current docs, but sequencing is product-specific.

## Sources

- OpenCode Plugins docs, updated Mar 15, 2026 — https://opencode.ai/docs/plugins/ — HIGH confidence
- OpenCode SDK docs, updated Mar 15, 2026 — https://opencode.ai/docs/sdk/ — HIGH confidence
- OpenCode Config docs, updated Mar 15, 2026 — https://opencode.ai/docs/config/ — HIGH confidence
- OpenCode Agent Skills docs, updated Mar 15, 2026 — https://opencode.ai/docs/skills/ — HIGH confidence
- OpenCode Custom Tools docs, updated Mar 15, 2026 — https://opencode.ai/docs/custom-tools/ — HIGH confidence
- Repo governance: `src/AGENTS.md` — HIGH confidence for repo-authoritative boundaries
- Repo governance: `src/plugin/AGENTS.md` — HIGH confidence for plugin assembly constraints
- Repo governance: `src/hooks/AGENTS.md` — HIGH confidence for hook CQRS boundary
- Repo governance: `src/control-plane/AGENTS.md` — HIGH confidence for CLI/control-plane boundary
- Repo governance: `src/sdk-supervisor/AGENTS.md` — HIGH confidence for supervisor role
- Repo implementation references: `src/plugin/opencode-plugin.ts`, `src/tools/runtime/tools.ts`, `src/sdk-supervisor/runtime-status.ts`, `src/tui/sse.ts` — HIGH confidence for current-state evidence
