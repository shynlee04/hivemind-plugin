# User-Facing Runtime Configuration Design

**Date**: 2026-04-08
**Status**: DESIGN DRAFT — ready for review
**Primary entry point**: guided in-chat setup
**Primary durable output**: full generated runtime config file
**Sources**: `docs/superpowers/specs/2026-04-08-v3-implementation-spec.md`, `.planning/reports/2026-04-08-architecture-audit.md`, `.planning/phases/02-v3-runtime-architecture/02-CONTEXT.md`, `.planning/phases/02-v3-runtime-architecture/PLAN-VERIFICATION.md`, Hivefiver analysis `ses_29328fbd8ffexRPdI804CiizIR`

---

## 1. Problem Statement

The current harness runtime is mostly engineer-facing. Core capabilities exist, but they are exposed as internal implementation details rather than as a product surface users can understand, configure, and trust.

The actual product need is not to add more runtime primitives first. It is to turn existing runtime primitives into a public, community-friendly experience that:

- guides users through setup in chat
- produces a full persisted config file they can inspect and edit
- explains why the generated settings were chosen
- validates the config before activation
- supports both plugin usage and a wider SDK/runtime foundation

This product should feel closer to a collaborative runtime operating layer than a raw plugin. The user is not expected to know what `compactionCheckpoint`, `queueKey`, or `stableStringify` mean. They should answer product-level questions and receive a valid, explainable runtime configuration.

---

## 2. Product Goals

### Goals

1. Make runtime behavior user-operable through guided chat.
2. Generate one complete config file as the primary durable artifact.
3. Preserve existing useful runtime primitives instead of rewriting them again.
4. Separate product-facing choices from low-level implementation knobs.
5. Validate generated config through schema, semantic checks, and smoke tests.
6. Keep the plugin assembly thin while making the runtime reusable as a Plugin++ / SDK-aligned foundation.

### Non-Goals

1. Recreate original Phase 2 plans exactly as written.
2. Expose every internal flag directly to end users in V1.
3. Ship every advanced runtime mode in the first product-facing pass.
4. Depend on plan workflow artifacts like `SUMMARY.md` to make the runtime product-usable.

---

## 3. Product Positioning

This project is a public community runtime product similar in ambition to `oh-my-openagent`, but differentiated by:

- stronger user guidance
- better collaboration between agents and users
- persisted, inspectable runtime setup
- support for plugin assembly and SDK/runtime reuse

The product should treat setup as a collaborative conversation, not as a static config authoring exercise.

---

## 4. V1 User Experience

### Primary Journey

1. User starts a guided setup command such as `/hf-setup`.
2. A setup-oriented agent asks product questions, not implementation questions.
3. The system maps answers onto runtime capabilities.
4. The user sees a generated config preview and rationale summary.
5. The config is validated.
6. If validation passes, the full config file is written.
7. The user can review, edit, and re-run validation later.

### Example Question Themes

- How autonomous should agents be: safe, balanced, or autonomous?
- Should background work be visible, limited, or disabled?
- How aggressively should retries and loops be allowed?
- Should sessions recover automatically after restart?
- Should the system optimize for speed, quality, or cost?

These answers must be translated into runtime settings without forcing users to reason about hook internals, lifecycle records, or delegation packet wire formats.

---

## 5. Capability Inventory and Product Surface

| Runtime capability | Current evidence | Product-facing surface | V1 decision |
|---|---|---|---|
| Category profiles | `src/lib/categories.ts` | work profiles and routing defaults | Keep |
| Session continuity | `src/lib/continuity.ts` | persistence and resume behavior | Keep |
| Lifecycle state | `src/lib/lifecycle-manager.ts` | run state visibility and recovery semantics | Keep |
| Delegation packets | `src/lib/delegation-packet.ts` | history, lineage, audit surface | Keep, enrich later |
| Background tasks | `src/lib/background-manager.ts` | background execution policy | Keep after hardening |
| Auto-loop | `src/hooks/create-session-hooks.ts` | retry policy and completion behavior | Keep, move toward safer control |
| Tool budgets and circuit breaker | `src/hooks/create-tool-guard-hooks.ts` | safety budget policy | Keep, restore configurability |
| Compaction checkpointing | `src/lib/compaction-checkpoint.ts` | session resume continuity hints | Keep |
| Thin plugin assembly | `src/plugin.ts` | clean plugin/runtime split | Keep strongly |
| Schema kernel pattern | `src/schema-kernel/*` | config contract and validation | Extend |

### Product Translation Rule

Each retained capability must be expressed in one of three ways:

1. a direct user-facing setting
2. an inferred setting chosen by a product-level answer
3. an internal-only setting with a documented default

V1 should prefer product-level answers over direct exposure.

---

## 6. Phase 2 Decision Triage

### Restore

The following original Phase 2 decision families still matter to product readiness and should return in adapted form:

1. configurable budget and threshold behavior
2. recovery staleness and risk framing
3. execution-mode selection surface
4. richer delegation packet and audit lineage

### Merge Into Current Architecture

1. hybrid config strategy: generated config file plus runtime/API overrides when necessary
2. preference for OpenCode built-ins where available
3. durability and continuity decisions merged into the current V3 runtime

### Retire

1. exact old incremental-implementation path as a constraint
2. zombie registry directions such as `agent-registry.ts`
3. reliance on plan execution artifacts as a prerequisite for product runtime setup

---

## 7. Recommended Approach

### Approach A: Thin setup over current internals

Expose most current runtime knobs directly through a setup flow.

**Pros**
- fastest path
- low translation effort

**Cons**
- too engineer-facing
- leaks internal architecture into product UX

### Approach B: Product-level guided setup with internal mapping

Users answer high-level product questions. The system maps answers onto a complete config file.

**Pros**
- best UX
- public-facing and explainable
- keeps room for future internal refactors without rewriting user intent

**Cons**
- requires a translation layer and rationale model

### Approach C: Setup plus generated pack

The setup flow outputs a config file plus generated support assets and optional `.opencode/` package material.

**Pros**
- strongest Plugin++ story
- good long-term expansion path

**Cons**
- larger V1 surface
- more validation complexity

### Recommendation

Adopt **Approach B** for V1, with a light future path to C.

The V1 contract is:

- guided chat is the primary entry point
- one complete config file is the primary durable artifact
- rationale and validation are first-class
- optional generated packs remain a later expansion path

This keeps the first public version understandable while still aligning with the Plugin++ direction.

---

## 8. Architecture Overview

### Layers

1. **Guided Setup Layer**
   - chat-driven questioning
   - answer capture
   - config preview and confirmation

2. **Config Mapping Layer**
   - translates product answers into runtime config
   - applies defaults and compatibility rules
   - records rationale metadata

3. **Validation Layer**
   - schema validation
   - semantic validation
   - runtime smoke checks

4. **Runtime Core Layer**
   - lifecycle
   - continuity
   - categories
   - budgets
   - recovery
   - background execution

5. **Plugin Assembly Layer**
   - registers hooks and tools
   - consumes validated config
   - stays thin and replaceable

### Boundary Rule

The plugin remains assembly-only. Product setup, config mapping, and validation should not live as ad hoc logic inside `src/plugin.ts`.

---

## 9. Hivefiver Readiness Package

To ship this as a real product surface, Hivefiver should provide the meta-concepts needed to author, explain, validate, and evolve configuration.

### Required Meta-Concepts

| Type | Candidate | Purpose |
|---|---|---|
| Command | `/hf-setup` or `/hf-configure` | main user entry point |
| Workflow | guided setup workflow | question -> map -> preview -> validate -> write |
| Agent | setup orchestrator | user-facing setup conductor |
| Agent | config explainer | explains generated config and editable fields |
| Agent | config validator | validates generated config before ready state |
| Skill | guided setup skill | setup-specific instructions |
| Skill | runtime config productizer | maps runtime primitives to product config |
| Skill | config explainability | turns config into user-readable rationale |
| References | config contract docs | documents managed vs editable fields |

### Reusable Existing Assets

Potentially reusable sources already present include:

- `meta-builder`
- `user-intent-interactive-loop`
- `intent-loop`
- `planning-with-files`
- `session-context-manager`
- `opencode-platform-reference`
- Hivefiver lab agents, commands, workflows, and references under `.hivefiver-meta-builder/`

---

## 10. Validation and Safety Model

Generated config must not be treated as ready until it passes three layers.

### 1. Schema Validation

- strict schema parse
- default application
- enum and range enforcement
- rejection of unknown or partial output

### 2. Semantic Validation

- profile and routing references resolve
- execution mode combinations are legal
- budgets and safety thresholds are sane
- paths are allowed and normalized

### 3. Runtime Smoke Validation

- plugin/runtime loads with generated config
- categories resolve correctly
- continuity path is usable
- lifecycle and recovery policies initialize without contradiction

This validation model is part of the product, not just engineering hygiene. It is how users learn that the generated setup is safe to trust.

---

## 11. Security and UX Constraints

The current audit still blocks direct productization of some runtime surfaces.

### Must Harden Before Public Exposure

1. background command execution must be restricted
2. session patch path writes must be sandboxed
3. event-hook overwrite bug must be resolved
4. hook-side hidden control flow should be reduced before promising fine-grained user control

### UX Rule

Users can be offered a choice only if the runtime can honor that choice predictably and safely.

---

## 12. Testing Strategy

### Config Contract Tests

- valid config fixtures parse successfully
- invalid configs fail with clear messages
- defaults are applied predictably

### Integration Tests

- plugin/runtime initializes with generated config fixtures
- safe, balanced, and autonomous profiles all load
- background execution policy is enforced
- recovery settings are honored

### Explainability Tests

- generated rationale matches chosen config sections
- managed fields are clearly identified
- editable fields remain stable across regeneration rules

---

## 13. Ordered Work Packets

1. Define the V1 runtime config contract.
2. Author the guided setup workflow.
3. Define the setup orchestrator, explainer, and validator roles.
4. Add runtime config schema contracts and fixtures.
5. Add validation and smoke-test workflow.
6. Reconcile selected Phase 2 gaps with the V3 runtime.
7. Harden unsafe runtime surfaces before exposing them in guided setup.

Each packet should be atomic, reviewable, and separately verifiable.

---

## 14. Open Questions

1. Which settings are generator-managed versus safe for manual editing?
2. Should V1 write only one config file, or also a rationale sidecar file?
3. How much of execution-mode selection should be visible in V1?
4. Which runtime behaviors are plugin-only, and which belong to the SDK/runtime core?
5. How aggressively should advanced knobs be hidden behind profiles versus exposed directly?

---

## 15. Design Summary

The right next move is not another runtime rewrite. It is to build a product layer over the current runtime:

- guided setup in chat
- one complete persisted config file
- explicit rationale
- strict validation before activation
- a clean runtime core beneath a thin plugin assembly

That is the shortest path from internal harness mechanics to a public, community-friendly Plugin++ product.
