ok# Whole-System Deep-Scan Audit

Date: 2026-03-07
Status: active-audit
Type: codebase-architecture-audit

## Purpose

Map the project as a whole system rather than treating `.hivemind` in isolation.

The key architectural rule established by this audit is:

- `.hivemind` is primarily a generated and accumulated result surface
- the authored and controlling source surfaces live in `src/**`, `.opencode/**`, and the root framework asset directories

## Audit Lens

This audit uses three layers:

1. source layer
2. execution/control layer
3. result/persisted layer

It also maps:

- user journey
- schema families
- the two lineages
- refactor-critical contradictions

## Most Authoritative Surfaces

### Highest trust

- `src/index.ts`
- `src/cli/init.ts`
- `src/cli/sync-assets.ts`
- `src/tools/index.ts`
- `src/lib/paths.ts`
- `src/lib/fs/planning-ops.ts`
- `src/hooks/*.ts` in active runtime paths
- `src/schemas/*.ts`

### High trust but descriptive

- `AGENTS.md`
- `CONTAMINATION-GUARDRAILS.md`
- `docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md`

### Medium trust, useful but not final authority

- `.opencode/references/*.md`
- `agents/*.md`
- planning documents that describe target behavior rather than current runtime truth

## Layer 1: Source Layer

These are the authored surfaces that define behavior or are copied into delivery surfaces.

### Core engine source

- `src/lib/**`
- `src/hooks/**`
- `src/tools/**`
- `src/schemas/**`
- `src/cli/**`

### Framework asset source

- `agents/**`
- `commands/**`
- `skills/**`
- `workflows/**`
- `templates/**`
- `prompts/**`
- `references/**`

### Project-local delivery surface

- `.opencode/**`

`src/cli/sync-assets.ts` treats the root framework asset folders as canonical authored sources and syncs them into `.opencode/<group>` targets by profile and target.

## Layer 2: Execution And Control Layer

This is the automatic machinery that makes the system behave.

### Bootstrap and installation

- `src/cli/init.ts`
  - creates `.hivemind`
  - seeds planning root
  - initializes state
  - registers plugin config
  - syncs framework assets into `.opencode`
  - injects governance blocks into `AGENTS.md` / `CLAUDE.md`

### Main runtime plugin

- `src/index.ts`

This is the main OpenCode plugin entry. It:

- initializes SDK context
- loads config
- regenerates manifests
- activates file watching
- registers HiveMind tools
- wires core runtime hooks

### Parallel governance plugin

- `.opencode/plugins/hiveops-governance/index.ts`

This is a second automatic control lane. It wires GX-style governance scripts and hook logic around:

- tool execution before/after
- events
- compaction
- per-turn message injection

### Per-turn control surfaces

The most important automatic surfaces are:

- `src/hooks/session-lifecycle.ts`
- `src/hooks/messages-transform.ts`
- `src/hooks/tool-gate.ts`
- `src/hooks/soft-governance.ts`
- `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`
- `.opencode/plugins/hiveops-governance/hooks/delegation.ts`

These surfaces are the main reason the project cannot be reasoned about casually. They change what the model sees and what the runtime allows on every turn.

## Layer 3: Result And Persisted Layer

This is what the system produces and accumulates over time.

### Runtime state

- `.hivemind/state/`
- `.hivemind/memory/`
- `.hivemind/sessions/`
- `.hivemind/graph/`
- `.hivemind/system/`

### Readable planning and continuity

- `.hivemind/project/planning/`
- `.hivemind/checkpoints/`
- `.hivemind/handoffs/`

### Derived knowledge and code intelligence

- `.hivemind/codemap/`
- `.hivemind/codewiki/`
- `.hivemind/docs/`

`src/lib/paths.ts` is the authoritative structural contract for these persisted surfaces.

## User Journey (What A Random User Should Experience)

### Stage 1: Install / Init

The user runs init once.

The system should:

- scaffold `.hivemind`
- scaffold readable planning root
- create a fresh runtime session state
- register plugin behavior
- sync framework assets into `.opencode`

### Stage 2: Normal Use

The user works through OpenCode using the delivered `.opencode` assets and the runtime plugin.

The system should automatically:

- classify entry condition
- track session state
- maintain hierarchy and continuity
- inject guidance and governance
- expose tools for declare/inspect/cycle/plan/context/memory

### Stage 3: Long-Haul Continuity

As the project evolves, the system should accumulate:

- runtime JSON state
- session history
- planning markdown
- graph/task/memory lineage
- checkpoints and handoffs

The random user should not need to reconstruct the project from chat every session.

## Schema Families

### Session and governance state

- `src/schemas/brain-state.ts`
- `src/schemas/config.ts`
- `src/schemas/governance-constitution.ts`
- `src/schemas/hierarchy.ts`
- `src/schemas/events.ts`

These define:

- session identity
- governance mode and lock/open behavior
- drift and failure counters
- hybrid versus runtime field lifecycles
- governance instruction/checklist structures

### Graph and execution state

- `src/schemas/graph-nodes.ts`
- `src/schemas/graph-state.ts`
- `src/schemas/manifest.ts`
- `src/schemas/delegation-packet.ts`

These define:

- trajectory, plan, phase, task, verification, memory, delegation, and export nodes
- graph state files
- task manifests and related-entity links

### Planning state

- `src/schemas/planning.ts`

This defines the machine-checkable planning model behind readable planning artifacts:

- requirements
- phases
- planning state
- milestones
- plan file frontmatter
- validation artifacts

## Two Lineages

### Shared entry

The dual-lineage journey document is clear on one important point:

- there is one shared entry sequence before routing

That shared entry sequence covers:

- state detection
- context coherence
- auto-init if needed
- declare intent
- progressive research / synthesis
- minimal targeted context gathering

### Hivefiver lineage

Nominal role:

- framework/meta-builder lineage
- focuses on tooling, commands, skills, workflows, governance hardening, and meta-package design

Primary source surfaces:

- `.opencode/**`
- root framework asset folders
- planning and continuity assets

### Hiveminder lineage

Nominal role:

- project execution/orchestration lineage
- coordinates project implementation work and delegates to specialist agents

Primary source surfaces:

- project-level planning and coordination surfaces
- delegated implementation and validation pathways

### Critical lineage rule

The architecture only makes sense if lineages stay separate after shared entry.

Shared pattern does not mean shared artifact space.

## Refactor-Critical Contradictions

### C1. `.hivemind` is often described as if it were the source of the system

But in code, `.hivemind` is mostly the persisted outcome of authored source plus automatic runtime behavior.

### C2. There are two automatic governance/injection lanes

- main runtime lane under `src/**`
- GX/governance plugin lane under `.opencode/plugins/**`

This is the root reason the project is fragile under casual reasoning.

### C3. Lineage and scope descriptions drift across sources

Examples include:

- broad planning and `AGENTS.md` scope claims
- stricter plugin-enforced delegation and path boundaries
- older lineage documents that assume narrower or different ownership

### C4. Some descriptive documents are target-state or method-state, not runtime-truth

This is especially true for:

- planning docs
- some `.opencode/references`
- some agent profiles

They remain useful, but they must not outrank active code and schema surfaces.

## What Must Anchor A Whole-Project Refactor

Any real refactor of the whole system must anchor on this order:

1. `src/lib/paths.ts`
2. `src/cli/init.ts`
3. `src/index.ts`
4. `src/hooks/**` active per-turn surfaces
5. `.opencode/plugins/hiveops-governance/**`
6. `src/schemas/**`
7. only then the planning and descriptive docs

If this order is reversed, the refactor will optimize the narrative instead of the system.

## Practical Conclusion

The project is an AI project operating system with:

- authored framework assets
- a TypeScript runtime engine
- a parallel governance/plugin lane
- a persisted operational memory and planning layer

The correct question is not:

- “what is inside `.hivemind`?”

The correct question is:

- “how do the authored source surfaces and automatic runtime controls systematically produce a coherent `.hivemind` over time?”

That is the correct center of gravity for the refactor.
