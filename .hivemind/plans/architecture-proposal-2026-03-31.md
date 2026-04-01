# Architecture Proposal — Tool System Refactoring — 2026-03-31

## Executive Summary

The current HiveMind tool system is structurally close to the intended model, but it has three architecture faults that prevent it from being a clean npm-shippable governance harness: a blurred tool/feature boundary around agent-work and settings, a broken event-writing path due to no-op V3 stubs, and an overgrown runtime/admin surface that mixes unrelated concerns. The evidence shows that the canonical pattern already works well for trajectory, task, handoff, doc, runtime, and journal, so this proposal preserves that pattern and refactors only the violating surfaces rather than rewriting the whole system. I recommend a capability-tiered plugin architecture, a smaller default public tool set, and explicit boundary ports for event sinks and hook aliases. The expected outcome is a cleaner core package for long-haul orchestration, optional add-ons for docs/admin UX, and a planner-ready structure that removes silent failure modes without collapsing existing proven behavior.

## Current State Assessment

### What is working

- The plugin assembly itself is structurally clean: it wires hooks and tools but does not contain business logic (`plugins-vs-tools-architecture-audit`, lines 292-295).
- The canonical dependency pattern already exists and works: **Tool → Feature → Core/Shared**. It is followed correctly by trajectory, task, handoff, doc, runtime, journal, init, and doctor tool surfaces, with only one major public exception (`plugins-vs-tools-architecture-audit`, lines 97-123).
- The core orchestration tools are functionally real, not placeholders: trajectory, task, handoff, doc, runtime status, runtime command, journal, and both agent-work tools all have complete call chains (`tool-functionality-verification`, lines 35-141, 190-217).
- Build and type-check pass cleanly, so this is a structural refactor problem, not a compile-failure problem (`tool-functionality-verification`, lines 244-260).

### What is wrong

- The public inventory is inconsistent across reports: two reports enumerate **12 registered tools**, while one report repeatedly says **13** but only lists 12 rows in its own table. The safe conclusion is that the current tool inventory is **disputed** and must be normalized before execution planning (`runtime-event-wiring-investigation`, lines 15, 180-209, 248-253; `plugins-vs-tools-architecture-audit`, lines 48-63, 290-306; `tool-functionality-verification`, lines 10-31, 249-253).
- The `agent-work-contract` feature is a boundary violation hotspot because it contains feature logic **and** plugin-registered tool definitions under `features/agent-work-contract/tools/`, which weakens the stated tool/feature separation (`plugins-vs-tools-architecture-audit`, lines 209-214, 326-329; `tool-functionality-verification`, lines 190-217, 257).
- `hivefiver-setting` is the single worst tool-surface violation: it is bloated, crosses upward into multiple layers, and mixes config reading, dashboard rendering, runtime mirror behavior, and validation into one surface (`plugins-vs-tools-architecture-audit`, lines 115-123, 203, 213, 296-297, 321-324; `tool-functionality-verification`, lines 172-189).
- The event-writing path is architecturally unsafe because hooks call `addEvent()` and `addDiagnostic()`, but both are V3 no-op stubs, so several hook-driven writes silently disappear (`runtime-event-wiring-investigation`, lines 15, 46, 70, 102-104, 124-129, 224-225, 253-254, 268-269).
- Several hook names are evidence-unstable: one report flags mismatches against OpenCode documentation for `permission.ask`, `command.execute.before`, and `chat.message`; another report treats them as available. That means hook resolution itself needs a compatibility boundary, not more direct wiring (`runtime-event-wiring-investigation`, lines 154-179, 244-246, 268-271; `plugins-vs-tools-architecture-audit`, lines 155-175, 293).
- `hivemind_hm_init` and `hivemind_hm_doctor` are explicitly placeholder or partial surfaces, so they should not be treated as equal to production-grade orchestration tools (`tool-functionality-verification`, lines 142-170, 264-272).

### Architectural reading of the evidence

The evidence supports a **selective refactor**, not a rewrite:

1. Preserve the canonical tool family pattern.
2. Extract tool definitions out of features.
3. Split configuration/dashboard concerns from orchestration concerns.
4. Introduce strict runtime boundary ports where the current system is silently failing: event sinks and hook aliases.
5. Reduce the default public surface to tools that are truly about long-haul orchestration and session governance.

## Proposed Tool Taxonomy

**Counting rule for this proposal:** count only **public plugin-registered tool surfaces** that should ship in a stable package. Internal helpers, unregistered tools, and placeholders do not count toward the final stable total.

**Recommended stable final count:**

- **Core package:** 7 public tools
- **Optional add-ons:** 2 public tools
- **Stable ecosystem total:** 9 public tools

### Core package (`hivemind-context-governance`)

| Tool | Action | Change | Rationale |
|------|--------|--------|-----------|
| `hivemind_runtime_status` | Keep | Keep as a separate public tool | Evidence shows status is a clean inspect-only surface; merging it with command risks a god-surface that mixes inspection and execution (`plugins-vs-tools-architecture-audit`, lines 50-58, 319-320; `tool-functionality-verification`, lines 99-125). |
| `hivemind_runtime_command` | Keep | Keep as a separate public tool; share internals with runtime status through one feature facade | Runtime command is execution-oriented and should stay isolated from read-only inspection even if both use one runtime feature module (`tool-functionality-verification`, lines 113-125). |
| `hivemind_agent_work_create_contract` + `hivemind_agent_work_export_contract` | Merge | Replace both with **`hivemind_contract`** actions: `create`, `update`, `export` | These two tools operate on one authority surface and are split mostly because they live inside the feature. Merge the public surface, keep one contract authority, and move tool definitions to `src/tools/contract/` (`runtime-event-wiring-investigation`, lines 186-189, 205-210; `plugins-vs-tools-architecture-audit`, lines 209-214, 326-329; `tool-functionality-verification`, lines 190-217). |
| `hivemind_trajectory` | Keep | No public rename | This is the canonical tool pattern and a core long-haul orchestration authority (`plugins-vs-tools-architecture-audit`, lines 52, 65-73; `tool-functionality-verification`, lines 35-50). |
| `hivemind_task` | Keep | No public rename | Same as trajectory: thin tool, clear action set, correct boundary (`plugins-vs-tools-architecture-audit`, lines 53, 97-112; `tool-functionality-verification`, lines 51-66). |
| `hivemind_handoff` | Keep | No public rename | Handoff is a distinct governance authority and should not be merged into task or trajectory (`plugins-vs-tools-architecture-audit`, lines 54, 133-143; `tool-functionality-verification`, lines 67-82). |
| `hivemind_journal` | Keep | Keep as a hybrid/internal-governance bridge; rebind to an EventSink port | The tool works and is the only explicit write bridge, but it must stop depending on silent no-op event APIs (`plugins-vs-tools-architecture-audit`, lines 58, 303-304; `tool-functionality-verification`, lines 127-141). |

### Optional add-ons

| Tool | Action | Change | Rationale |
|------|--------|--------|-----------|
| `hivemind_doc` | Move | Move to optional `docs` add-on package | It is functional and correctly layered, but it depends on markdown/doc parsing packages and is not part of the product owner’s core orchestration authority set (`plugins-vs-tools-architecture-audit`, lines 55, 279-286; `tool-functionality-verification`, lines 83-98). |
| `hivemind_hm_setting` | Split + rename | Split into config-only public tool **`hivemind_hm_config`**; remove dashboard concerns from this surface | The current tool is bloated because it mixes config read/propose, runtime mirror, rendering, and dashboard behavior (`plugins-vs-tools-architecture-audit`, lines 61, 115-123, 203, 213, 321-324; `tool-functionality-verification`, lines 172-189). |

### Remove from stable public tool surface

| Tool | Action | Change | Rationale |
|------|--------|--------|-----------|
| `hivemind_hm_init` | Remove | Remove from stable plugin tool map until it executes real bootstrap logic | It is explicitly a placeholder that only returns proposed changes (`tool-functionality-verification`, lines 142-155, 264-267). |
| `hivemind_hm_doctor` | Remove | Remove from stable plugin tool map until it performs real diagnostics | It is a partial placeholder that only checks path existence and returns proposed fixes (`tool-functionality-verification`, lines 157-170, 269-272). |
| `classify-intent-tool` | Remove as public candidate | Keep as an internal feature service, not a public tool | It is unregistered and evidence does not justify surfacing it publicly (`runtime-event-wiring-investigation`, lines 205-210, 266-270). |
| Standalone hook helper exports (`handleCompaction()`, `handleTextComplete()`, `handleSessionIdleEvent()`) | Remove | Remove dead standalone exports; keep only wired factory entrypoints | Evidence says these are exported but not used by the plugin (`runtime-event-wiring-investigation`, lines 218-220). |

### Rename policy

- **Internal module family rename:** `hivefiver-*` → `hm-*` or `runtime-admin-*`.
- **Public tool names:** keep existing `hivemind_*` pattern for stable tools; use `hivemind_hm_config` instead of `hivemind_hm_setting` for the refactored config surface.

## Architecture Layer Enforcement Plan

### Target dependency rule

**Enforced runtime dependency direction:**

```text
Tool → Feature → Intelligence/Shared → stdlib / SDK adapters
```

No public tool may import directly from `sdk-supervisor/`, `control-plane/`, or unrelated feature directories. The evidence shows this rule already works for most tools and only needs to be enforced where violated (`plugins-vs-tools-architecture-audit`, lines 97-123).

### Boundary corrections

1. **Extract agent-work tool definitions out of features**
   - Move public contract tool definitions to `src/tools/contract/`.
   - Keep `features/agent-work-contract/` for engine, schema, store, normalization, chain behavior, and intent classification only.
   - Treat `classify-intent-tool` as an internal service unless a user-level use case is explicitly approved.

2. **Create a dedicated runtime-admin feature boundary**
   - Replace direct `hivefiver-setting` imports from `runtime-entry`, `sdk-supervisor`, `control-plane`, and `session-entry` with one feature facade, e.g. `features/runtime-admin/`.
   - The config tool calls only that feature facade.
   - Dashboard/TUI rendering moves out of the config tool surface into an optional presentation adapter.

3. **Decompose event tracking by authority, not by file count alone**
   - The reports already identify event-tracker as bloated, but the more important issue is that write semantics are unclear because the hook callers assume working event appenders that do not actually persist.
   - Split it into:
     - `event-sink/` — persistence contract + implementations
     - `event-rendering/` — markdown rendering only
     - `event-classification/` — event/diagnostic normalization only
   - Core orchestration depends only on the sink contract.

4. **Preserve feature-to-tool type sharing only if it remains type-only**
   - The audit says current feature → tool imports are type-only and acceptable (`plugins-vs-tools-architecture-audit`, lines 124-132).
   - Keep that rule, but prefer moving shared action/result types into `feature/contracts.ts` when the feature is the true authority.

### What belongs in `shared/` vs feature contracts

#### `shared/` should contain only stable cross-feature primitives

- path resolution
- tool response envelope
- hook capability alias registry
- event sink interfaces
- package/distribution manifest types
- state authority enums used by multiple features

#### feature-local contracts should contain domain-owned types

- trajectory action args/results
- task lifecycle args/results
- handoff action args/results
- contract create/update/export schemas
- runtime-admin config/diagnostic schemas
- doc tool read/search schemas

### Interface contracts (TypeScript)

```ts
type HmToolClass = 'deterministic' | 'event-driven' | 'hybrid'

interface ToolFacade<TAction extends string, TArgs, TResult> {
  readonly toolName: string
  readonly toolClass: HmToolClass
  execute(action: TAction, args: TArgs, context: ToolContextPort): Promise<TResult>
}

interface FeatureExecutor<TAction extends string, TArgs, TResult> {
  readonly authority: string
  execute(action: TAction, args: TArgs, deps: FeatureDependencyPort): Promise<TResult>
}

interface EventSink {
  readonly mode: 'active' | 'degraded' | 'disabled'
  appendEvent(record: HmEventRecord): Promise<{ written: boolean; path?: string; reason?: string }>
  appendDiagnostic(record: HmDiagnosticRecord): Promise<{ written: boolean; path?: string; reason?: string }>
}

interface HookBinding {
  capability:
    | 'session-lifecycle'
    | 'tool-observer'
    | 'compaction'
    | 'turn-journaling'
    | 'system-injection'
    | 'message-injection'
    | 'command-context'
    | 'write-gate'
    | 'env-export'
  primary: string
  fallback?: string[]
  required: boolean
}
```

These contracts keep the public shape explicit without prescribing implementation.

## Plugin Hook Strategy

### Decision

Do **not** aggressively strip the hook set in one step. The evidence challenge is that some hooks look "UX-like" but currently participate in runtime governance behavior, prompt injection, per-turn journaling, or command context (`plugins-vs-tools-architecture-audit`, lines 313-317; `runtime-event-wiring-investigation`, lines 21-32, 116-129, 262-265; `tool-functionality-verification`, lines 242-247). The correct design is a **tiered capability model**.

### Tier 1 — default core hook bundle

These stay on by default because current proven behavior depends on them:

- `event` — required session lifecycle interception (`runtime-event-wiring-investigation`, lines 40-75, 78-95)
- `tool.execute.before`
- `tool.execute.after` — required tool event linkage (`runtime-event-wiring-investigation`, lines 96-105)
- `experimental.session.compacting` — required compaction continuity (`runtime-event-wiring-investigation`, lines 106-115)
- `experimental.text.complete` — currently the primary per-turn journal path (`runtime-event-wiring-investigation`, lines 116-129)
- `experimental.chat.system.transform`
- `experimental.chat.messages.transform` — current injection/runtime context path (`plugins-vs-tools-architecture-audit`, lines 22, 31-32; `tool-functionality-verification`, lines 242-247)
- `command.execute.before` — keep in core **if** runtime command remains a core tool surface
- `permission.ask` — keep as the hard-wired default write gate for managed tool calls (`tool-functionality-verification`, lines 258-259)
- `shell.env` — keep as the exported environment bridge (`runtime-event-wiring-investigation`, lines 262-263)

### Tier 2 — probationary hook bundle

- `chat.message`

Reason: it is identified as active, but one report also flags it as undocumented/custom and therefore risky. It should remain behind a feature flag or compatibility switch until runtime verification proves it is part of the stable OpenCode hook contract (`runtime-event-wiring-investigation`, lines 154-179, 244-246, 268-273).

### Tier 3 — leave unwired

- `chat.params`
- `chat.headers`
- `tool.definition`
- `config`
- `auth`

Evidence does not show product need for them today (`plugins-vs-tools-architecture-audit`, lines 33-37, 293).

### Hook compatibility strategy

Because the reports disagree about documented vs actual hook names, the plugin should stop binding raw hook names directly from scattered call sites. Use a **Hook Alias Registry** owned by the plugin assembly layer:

- capability name → preferred hook name
- optional fallback hook names per OpenCode version
- required/optional severity

This isolates SDK naming drift to one boundary instead of scattering it through the plugin.

### Strategy for no-op `addEvent()` / `addDiagnostic()`

Silent no-ops should be treated as an architecture defect, not backward compatibility. The replacement strategy is:

1. Core hook code calls only `EventSink`.
2. `EventSink.mode` must report `active`, `degraded`, or `disabled`.
3. If degraded or disabled, runtime status must surface it explicitly.
4. No hook path is allowed to claim successful persistence when the sink did not write.

That recommendation is directly driven by the evidence that hooks currently believe they are writing events, but the V3 methods do nothing (`runtime-event-wiring-investigation`, lines 224-225, 253-254, 268-269).

## Modular Distribution Strategy

### Recommended package structure

#### 1. Core package — `hivemind-context-governance`

Ships:

- plugin assembly
- default core hook bundle
- `hivemind_runtime_status`
- `hivemind_runtime_command`
- `hivemind_contract`
- `hivemind_trajectory`
- `hivemind_task`
- `hivemind_handoff`
- `hivemind_journal`
- shared contracts, hook alias registry, event sink ports

Reason: these align with the product owner’s long-haul orchestration model and mostly operate against `.hivemind/` state (`tool-functionality-verification`, lines 35-141, 190-217).

#### 2. Docs add-on package

Ships:

- `hivemind_doc`
- markdown/doc-intelligence dependencies (`remark`, `unist-util-visit`, `fast-glob`, `ignore`)

Reason: it is useful, but not part of the smallest orchestration harness and adds content-parsing dependency weight (`plugins-vs-tools-architecture-audit`, lines 279-286).

#### 3. Admin add-on package

Ships:

- `hivemind_hm_config`
- future `hm_doctor` and `hm_init` only when they stop being placeholders

Reason: admin/bootstrap/config surfaces are not the same thing as core orchestration authorities and currently include incomplete logic (`tool-functionality-verification`, lines 142-189, 264-272).

#### 4. UX / dashboard extension

Ships:

- dashboard rendering
- runtime mirror presentation
- any `ink` / `@json-render/*` surfaces
- optional probationary chat-message behavior

Reason: the current `hivefiver-setting` tool is bloated primarily because presentation concerns leaked into a config surface (`plugins-vs-tools-architecture-audit`, lines 203, 213, 321-324, 332-334).

### Minimum viable product vs full feature set

#### MVP

- 7 core orchestration tools
- working event sink with explicit degraded state
- extracted contract tool family
- no public placeholder tools
- no dashboard in the stable package

#### Full feature set

- docs add-on
- admin add-on
- optional UX extension
- matured doctor/init once they become real lifecycle tools instead of proposal tools

## Trade-off Analysis

### Decision 1 — Merge runtime status + command, or keep them separate?

**Option A: merge into one `hivemind_runtime` tool**

**Pros**
- Smaller public inventory
- One family for runtime concerns
- Easier discoverability for users

**Cons**
- Mixes inspection and execution under one authority
- Risks reproducing the god-surface problem already seen in settings
- Expands action schema and permissions surface

**Option B: keep separate public tools, share one internal runtime feature**

**Pros**
- Preserves read vs execute separation
- Keeps permissions and failure modes clearer
- Matches current evidence of two distinct functional chains

**Cons**
- Two public tool names instead of one
- Slightly larger visible inventory

**Recommendation**

Choose **Option B**. The evidence supports shared internals, not a merged public contract (`tool-functionality-verification`, lines 99-125).

**Risk**

Minor: inventory stays slightly larger. Acceptable because it prevents a new runtime god-tool.

### Decision 2 — Keep agent-work tools in `features/`, or extract them to `tools/`?

**Option A: keep them embedded in the feature**

**Pros**
- Minimal movement
- No short-term registration churn

**Cons**
- Violates the declared boundary
- Makes one feature a tool host and a domain host
- Confuses package boundaries and ownership

**Option B: extract public tool definitions into `src/tools/contract/`**

**Pros**
- Restores declared layer model
- Makes packaging and discovery cleaner
- Lets `agent-work-contract` become a true domain feature

**Cons**
- Requires planner to preserve existing consumers carefully because agent-work is a current hub
- File relocation alone does not solve dependency concentration

**Recommendation**

Choose **Option B**, but execute it as a **dependency-closure refactor**, not just a path move (`plugins-vs-tools-architecture-audit`, lines 80-89, 133-143, 209-214, 326-329).

**Risk**

Material: if executed as file motion only, the hub behavior remains and consumers break.

### Decision 3 — Strip hooks down immediately, or tier them by capability?

**Option A: aggressively shrink to a minimal hook set now**

**Pros**
- Smaller surface area
- Less coupling to OpenCode innate concepts
- Easier future maintenance

**Cons**
- Risks removing runtime behaviors that are currently core
- Conflicts with evidence that transform/text-complete/command hooks are part of current governance flow
- Could break compaction continuity, journaling, or injection behavior before replacement exists

**Option B: keep a default core hook bundle, but separate it by capability tier**

**Pros**
- Preserves current proven behavior
- Makes future demotion or package splitting possible
- Localizes hook-name drift behind one alias boundary

**Cons**
- Core package remains broader in the short term
- Requires explicit capability documentation

**Recommendation**

Choose **Option B**. This best matches the evidence and avoids a premature break in runtime behavior (`plugins-vs-tools-architecture-audit`, lines 313-317; `runtime-event-wiring-investigation`, lines 21-32, 116-129).

**Risk**

Material: if capability boundaries are not explicit, the hook bundle remains sticky and never shrinks.

### Decision 4 — Preserve no-op compatibility, or replace it with a strict EventSink boundary?

**Option A: keep no-op compatibility methods**

**Pros**
- Minimal churn
- Lowest immediate refactor cost

**Cons**
- Silent data loss continues
- Hooks keep reporting persistence that never happened
- Runtime health remains untruthful

**Option B: replace with strict EventSink contract and degraded-mode reporting**

**Pros**
- Removes silent failure
- Makes write health observable
- Decouples orchestration from the current event-tracker file layout

**Cons**
- Forces an explicit migration path
- Any missing sink implementation becomes visible immediately

**Recommendation**

Choose **Option B**. Silent no-ops are worse than visible degradation in a governance system (`runtime-event-wiring-investigation`, lines 224-225, 253-254, 268-269).

**Risk**

Material: if rollout happens before a working sink exists, users will see degraded status. That is still preferable to silent loss.

### Decision 5 — Keep one npm package, or split into core + add-ons?

**Option A: one package**

**Pros**
- Simpler install story
- Fewer packaging decisions
- No multi-package release coordination

**Cons**
- Core users inherit optional dependency weight
- Docs/admin/dashboard concerns leak into default installs
- Harder to keep the harness governance-focused

**Option B: core + add-ons**

**Pros**
- Smaller default runtime
- Clear product boundary: orchestration first, extras optional
- Better npm-shippable modularity

**Cons**
- More release discipline needed
- Version compatibility between packages must be managed

**Recommendation**

Choose **Option B**. The evidence already shows clear dependency clusters that map naturally to core, docs, and admin/UX packages (`plugins-vs-tools-architecture-audit`, lines 243-286, 332-334).

**Risk**

Minor to material: release coordination overhead. Mitigate with strict semver and a shared compatibility matrix.

### Decision 6 — Keep placeholder admin tools public, or withdraw them until real?

**Option A: keep `hm_init` and `hm_doctor` public now**

**Pros**
- No API break today
- Signals intended future feature set

**Cons**
- Stable surface includes intentionally incomplete behavior
- Weakens trust in the tool catalog
- Inflates public count with proposal-only tools

**Option B: withdraw them from the stable tool map until real**

**Pros**
- Stable catalog reflects real functionality only
- Reduces cognitive load
- Aligns product surface with evidence

**Cons**
- Short-term compatibility break for anyone depending on them
- Requires planner to decide whether they move to CLI-only or experimental add-on status

**Recommendation**

Choose **Option B** for the stable package. If backward compatibility is mandatory, re-home them under an explicit experimental/admin extension instead of keeping them in the core stable catalog (`tool-functionality-verification`, lines 142-170, 264-272).

**Risk**

Material: external consumers may rely on current names. Mitigate with one release of deprecation shims.

## Risk Assessment

1. **Inventory ambiguity risk**
   - One report says 13 tools while its own evidence tables show 12.
   - **Mitigation:** planner must define a canonical inventory rule before execution begins.

2. **Agent-work hub risk**
   - Extracting tool files without reducing dependency concentration may only relocate complexity.
   - **Mitigation:** plan extraction around current consumers (`handoff`, `runtime-observability`) rather than around folder names alone.

3. **Runtime behavior regression risk**
   - Over-pruning hooks too early could break command context, journaling, or injection behavior.
   - **Mitigation:** capability-tiered hook bundle first, demotion second.

4. **Observability disruption risk**
   - Replacing no-op compatibility with a real sink will surface degraded states that were previously hidden.
   - **Mitigation:** treat that as a required truth exposure, not as a failure of the proposal.

5. **Package fragmentation risk**
   - Core/add-on separation can create version drift.
   - **Mitigation:** release matrix, shared contract package, and deprecation window.

6. **Backward compatibility risk**
   - Renames and removals may affect current consumers.
   - **Mitigation:** one release of alias registration or shim wrappers for renamed tools.

## Implementation Phases (High-Level)

### Phase 1 — Boundary normalization

Scope:

- normalize public inventory and counting rule
- extract contract tool definitions from `features/agent-work-contract/`
- define EventSink and HookBinding contracts
- remove dead standalone exports and dead stubs from the planner’s target map

### Phase 2 — Tool surface refactor

Scope:

- merge contract create/export into `hivemind_contract`
- split `hivemind_hm_setting` into config-only surface plus optional presentation surface
- withdraw placeholder tools from the stable surface or move them to experimental admin packaging

### Phase 3 — Package and hook modularization

Scope:

- establish core vs add-on package boundaries
- move doc tool to docs add-on
- move dashboard/UX behavior to optional extension
- convert hook wiring to capability-tiered registry with alias/fallback support

## Open Questions for User

1. **Backward compatibility:** must current public tool names remain callable for one transition release, or can the stable catalog break now?
2. **Doc tool scope:** do you want `hivemind_doc` to remain in the default install, or should it become an optional add-on aligned with orchestration-first packaging?
3. **Admin posture:** should bootstrap/doctor remain user-facing tools at all, or should they become CLI-only or experimental until real logic exists?
4. **Command-context stance:** do you want command/prompt/message transform behavior to remain default-on in core, or only as a hard-wired default bundle that can later be disabled by consumers?
5. **Journal exposure:** should `hivemind_journal` remain a public tool, or become an internal bridge used by hooks and testing only?
6. **Packaging model:** do you want a single npm package with opt-in modules, or multiple installable add-on packages with explicit composition?
