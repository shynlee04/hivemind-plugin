# Architecture Patterns

**Domain:** OpenCode governance plugin, runtime harness, and terminal operations dashboard
**Researched:** 2026-03-18

## Recommended Architecture

Use a **hybrid modular monolith**:

- top-level **feature ownership** for discoverability
- top-level **runtime surfaces** (`tools`, `hooks`, `plugin`, `commands`) because OpenCode itself is surface-driven
- a separate **dashboard app boundary** because OpenTUI currently wants Bun while the shipped package is Node

### Recommended Structure

```text
src/
  features/
    runtime-entry/
    session-entry/
    workflow/
    trajectory/
    handoff/
    doc-intelligence/
    runtime-observability/
  tools/
  hooks/
  commands/
  plugin/
  shared/
    contracts/
    utils/
apps/
  opentui/
```

This is the important compromise: do not delete `tools/` and `hooks/` just to be "feature-first." Keep them as thin OpenCode adapter surfaces, but move actual ownership into `features/`. That gives you the navigability of `oh-my-openagent` without losing alignment to the OpenCode runtime model.

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `features/runtime-entry` | Bootstrap, repair, settings, harness readiness, runtime attachment | `commands`, `tools`, `@opencode-ai/sdk` |
| `features/session-entry` | Start-work classification, route decisions, readiness gates | `hooks`, `features/workflow`, `features/trajectory` |
| `features/workflow` | Workflow lifecycle, task ownership, verification state | `tools`, `features/runtime-observability` |
| `features/trajectory` | Trajectory ledger, checkpoints, transitions, narrative continuity | `tools`, `features/runtime-observability` |
| `features/handoff` | Delegation packets and recovery handoff logic | `tools`, `features/trajectory` |
| `features/runtime-observability` | Runtime snapshots, receipts, event reduction, dashboard read models | `@opencode-ai/sdk`, `tools`, dashboard app |
| `tools` | Thin mutation adapters for agents | feature modules only |
| `hooks` | Thin interception adapters for OpenCode lifecycle | feature modules only |
| `commands` | Thin command registry and dispatch | `features/runtime-entry` |
| `plugin` | Assembly only | `hooks`, `tools` |
| `apps/opentui` | Dashboard app, view models, panels, user interactions | `@opencode-ai/sdk`, `features/runtime-observability` contracts |

### Data Flow

1. The OpenCode server emits events and exposes runtime/session APIs through `@opencode-ai/sdk`.
2. Plugin hooks and tools adapt OpenCode lifecycle events into feature-module calls.
3. Feature modules mutate or read authoritative state and emit typed runtime-observability records.
4. CLI commands and the dashboard consume the same runtime-observability contracts.
5. The dashboard triggers actions only through approved commands/tools and then re-renders from server truth.

## Patterns to Follow

### Pattern 1: Surface Adapters, Feature Owners
**What:** Keep `tools/`, `hooks/`, and `commands/` thin; move ownership into `features/`.
**When:** Always.
**Example:** `hivemind_runtime_status` should delegate to `features/runtime-observability`, not assemble status itself.

### Pattern 2: Dashboard as Separate App
**What:** Treat the OpenTUI dashboard as `apps/opentui`, not as an orphan folder inside the shipped Node package.
**When:** Immediately.
**Example:** dashboard package runs under Bun, imports shared contracts, and talks to the same OpenCode server as the CLI.

### Pattern 3: Shared Contracts Only in `shared/contracts`
**What:** `shared` holds reusable contracts and small utilities, not business logic.
**When:** Any shared type or payload crosses backend and dashboard boundaries.
**Example:** runtime status payload, event envelope, approved dashboard action types.

### Pattern 4: One Concept, One Module Owner
**What:** Workflow code stays in workflow, trajectory code stays in trajectory, runtime-entry stays in runtime-entry.
**When:** Refactoring current cross-folder logic.
**Example:** trajectory should stop activating workflow tasks directly.

### Pattern 5: Read Models for the Dashboard
**What:** The dashboard should consume reduced, typed view models instead of raw tool payloads or ad hoc SSE objects.
**When:** Before adding more panels.
**Example:** `ExecutionStatus` should render a `DashboardExecutionViewModel`, not arbitrary `any[]` events.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Pure Technical-Layer Tree
**What:** Organizing most code by `core`, `shared`, `hooks`, `tools`, `control-plane`, `delegation`, `governance`, `recovery`, and similar technical buckets without feature ownership.
**Why bad:** One workflow becomes a scavenger hunt.
**Instead:** introduce `features/` as the first place maintainers look.

### Anti-Pattern 2: Orphan Dashboard
**What:** Keeping `src/tui` compiling but not integrated into exports, scripts, or runtime contracts.
**Why bad:** It looks real without being real.
**Instead:** move it into a real app boundary and wire it to server truth.

### Anti-Pattern 3: Mixed Node/Bun Assumptions in One Package Surface
**What:** Expecting the same root runtime to satisfy both the Node CLI/package and Bun-only OpenTUI behavior.
**Why bad:** It creates broken tests and confusing execution rules.
**Instead:** split runtime concerns by package/app boundary.

### Anti-Pattern 4: `shared` as a Dumping Ground
**What:** Letting `shared` become the real owner of runtime truth.
**Why bad:** It destroys discoverability and boundary clarity.
**Instead:** shrink `shared` to contracts and small helpers.

### Anti-Pattern 5: Feature Mutation Across Modules
**What:** Trajectory code mutating workflow state, or commands owning runtime truth.
**Why bad:** Boundaries look clean in the tree but stay dirty in behavior.
**Instead:** cross-feature calls should use narrow APIs and typed contracts.

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| Runtime status reads | Direct server reads plus reduced view models are fine | Add caching/reduction for noisy event streams | Split operator dashboards from general runtime traffic |
| Maintainability | One team can still reason about the tree | Feature ownership becomes essential | Modular extraction becomes possible because boundaries already exist |
| Dashboard event volume | Raw events can be rendered after light reduction | Need stronger event summarization | Need persistence and replay layers for observability |

## Sources

- Angular style guide - https://angular.dev/style-guide - HIGH
- OpenAI harness engineering - https://openai.com/index/harness-engineering/ - HIGH
- Anthropic harness guidance - https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents - HIGH
- Microsoft modular monolith guidance - https://microsoft.github.io/multi-agent-reference-architecture/docs/design-options/Modular-Monolith.html - HIGH
- Spring Modulith - https://spring.io/projects/spring-modulith - HIGH
- Local code audit: `src/cli/harness.ts`, `src/control-plane/control-plane-handler.ts`, `src/shared/runtime-attachment.ts`, `src/tools/runtime/tools.ts`, `src/hooks/start-work/start-work-router.ts`, `src/tui/**` - HIGH
