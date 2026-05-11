# Hivemind — Runtime Composition Engine

**Phase 0 authority:** `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` locks canonical naming. Product = Hivemind. Package/bin = `hivemind`. `opencode-harness` and `hivemind-tools` are legacy aliases only.

## What This Is

Hivemind is a **runtime composition engine** for OpenCode — an npm package (`hivemind`) providing tools, hooks, and a plugin for delegated session orchestration, continuity persistence, concurrency control, and runtime guardrails. It makes agents genuinely intelligent through architecture: the **HIVE** (structure, hierarchy, delegation) and the **MIND** (memory, continuity, MEMS-BRAIN knowledge pieces). Not through bigger models — through compounding intelligence across sessions.

**Two halves:** Hard Harness (`src/` npm package) + Soft Meta-Concepts (`.opencode/` agents, skills, commands). State lives in `.hivemind/` (canonical per Q6).

## Core Value

**Agents build on each other's work across sessions.** Without Hivemind, every session starts from zero. With it, decisions, patterns, and lessons compound. The human collaborates with agents across cognitive layers — the human provides intent and judgment, agents provide execution and pattern recognition.

## Requirements

### Validated

- ✓ TypeScript strict mode, ES2022, NodeNext modules — builds clean, 0 type errors
- ✓ 16 custom tools registered in plugin.ts with Zod schemas (CQRS write-side)
- ✓ 6 hook types registered (session.created, system.transform, messages.transform, shell.env, tool.execute.after, chat.system.transform)
- ✓ Dual-layer state: continuity.ts (durable JSON) + state.ts (in-memory Maps)
- ✓ 149 test files, 1978 test cases — gate-enforced
- ✓ Delegation hierarchy: L0 → L1 → L2 → L3 agent chain with CQRS boundaries
- ✓ Q6 state root: `.hivemind/` canonical, `.opencode/` primitives-only
- ✓ 89 agents, 125 active skill directories, 19 commands tracked in the current primitive inventory (source in `.hivefiver-meta-builder/`)
- ✓ 3 config modes: expert-advisor, hivemind-powered, free-style
- ✓ Behavioral profile system with mode dispatch
- ✓ 14 workflow toggles in configs.json (6 wired, 4 with @future-consumer, 4 deferred)

### Active

- [ ] **Bootstrap/recovery**: `.opencode/` and `.hivemind/` must be restorable (postinstall script or CLI init)
- [ ] **Config consumer wiring**: Phase 0 config contract requires every active config field to have named consumers or explicit deferred/dead status
- [✓] **Dead code removal**: `messages-transform.ts` deleted (SR-10); `src/lib/` removed
- [ ] **Plugin.ts LOC reduction**: 242 LOC vs 100 LOC target — extract into dedicated hook/tool modules
- [ ] **12 stale modules**: document or wire (toggle-gates.ts, runtime-detection/, etc.)
- [ ] **f-04 auto-routing engine**: intent classification, command parsing, workflow routing (MISSING)
- [ ] **E2E tests**: all 1978 tests are unit — zero integration/E2E
- [ ] **Delegation hierarchy enforcement**: L0→L1→L2 depth not runtime-validated
- [ ] **`.hivemind/` state modules**: 11 subdirectories, only 2 have typed CRUD owners (continuity.ts, delegation-persistence.ts)
- [ ] **Lifecycle audit**: gate-l3-lifecycle-integration SKILL.md references/ directory is empty — criteria docs missing
- [ ] **Naming validation CI**: no automated check for hm-*/hf-*/gate-*/stack-* conventions

### Out of Scope

- Sidecar GUI dashboard — WS-8 (DEFERRED, blocked on Core + Workflows completion)
- Graph-based delegation — GAP-22 (blocked on WS-5 delegation revamp)
- MCP tool registry — GAP-06 (blocked on WS-3 primitive registry)
- Full autonomy mode — Hivemind is collaborative by default; full autonomy available as option later
- GSD framework, BMAD methodology — Hivemind hosts them, doesn't embed them
- `.planning/` → `.hivemind/planning/` migration — D-2 OPEN, no schedule

## Context

**Technical environment:** Node.js >= 20, TypeScript ^5.0 strict, ES2022 target, ESM, Zod v4 for schema validation, @opencode-ai/sdk ^1.14.41, @opencode-ai/plugin ^1.14.41 (peer), Bun optional for PTY. Vitest for testing with V8 coverage, thresholds enforced (85/72/85/85).

**Architecture:** CQRS pattern (tools = write-side, hooks = read-side). Plugin composition root at `plugin.ts`. src/lib/ removed (SR-10). Source planes: shared/, task-management/, coordination/, features/, config/, routing/, hooks/, tools/. 6 hook files, 8 tool files, 16 schema-kernel files. Max module: 500 LOC. No circular deps. `types.ts` is leaf — all modules depend outward.

**Prior work:** Project originated from oh-my-openagent (OMO) architecture study + harneess-experiment worktree. 31 phase directories (completed and in-progress) track core feature delivery (concurrency, delegation revamp, completion detection, PTY integration, session journal, lifecycle manager). WS-1 Restructuring consolidated into 3 themed workstreams (Core Architecture, Agent Workflows, User Experience). Core Architecture (CA-01 through CA-03) delivered configs schema, behavioral profiles, and toggle gate binding. Skill-ecosystem (SE-1 through SE-14) delivered 48/51 hm-* skills at ≥6/8 RICH-8 quality. Agent-synthesis (AS-0 through AS-11) delivered 89 agents with lineage classification.

**Known issues:** STATE.md claimed Phase 70-71 COMPLETE with no git evidence. 14 archived milestone phases still on disk. 2 empty workstreams (primitive-registry, bootstrap-cli-onboarding). `asString` duplicated in helpers.ts and continuity.ts. `storeCache` singleton prevents isolated testing in continuity.ts. `.hivemind/` git-track vs gitignore contradiction.

**User philosophy:** Hivemind is for "wanders-of-curiosity" — people who explore, not just execute. It optimizes for compounded learning, not throughput. The 5 pillars: Hierarchical Superiority, Collaborative Domains, Strategically Measurable, Iteratively Granular, Growing MEMS-BRAIN. The user envisions graph-based, hierarchical, domain-classified agent collaboration where complexity is "behind-scenes" and the front-facing context stays high-level.

## Constraints

- **Tech stack**: Node.js >= 20, TypeScript strict, Zod v4, vitest — no new runtime deps without explicit gate
- **Module size**: 500 LOC max (target 300)
- **Lineage**: hm-* (product dev, STRICT), hf-* (meta-builder, FLEXIBLE), gate-* (quality, INTERNAL), stack-* (reference)
- **CQRS**: tools mutate, hooks observe — enforced by `hook-cqrs-boundary.ts`
- **State root**: `.hivemind/` for runtime state, `.opencode/` for primitives only (Q6)
- **Error prefix**: `[Harness]` on all thrown errors
- **Commit format**: `type(scope): description — why`
- **No hf-* skills in hm-* lineage** — STRICT binding
- **OpenCode runtime**: all features must work within OpenCode SDK surfaces — no standalone execution

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Q1: Hybrid + Spec-Driven Runtime Detection | Deep codemap, file watcher, MCP tools, dependency graph | — Pending |
| Q2: Artifact-Focused Sidecar | Next.js 15 + @json-render/react, READ-ONLY canonical state | — Pending |
| Q3: Session Journal as Complement | Append-only event timeline, independent of continuity.ts | — Pending |
| Q4: MVP = 5 of 8 memory categories | Post-MVP = 3 with explicit gates | — Pending |
| Q5: Full RICH gate required | 0 of 25 skills pass today is honest status | — Pending |
| Q6: `.hivemind/` internal state root | One-way migration, `.opencode/` ONLY for primitives | ✓ Locked |
| D-CONF-05: configs.json loaded every session | Missing → defaults, invalid → warn, unknown → strip | ✓ Locked |
| D-BIND-03: every active config field must have consumer | Phase 0 config contract maps field consumers/status; unresolved fields must be wired or explicitly deferred | ⚠️ Revisit |
| P0-ID: Hivemind identity contract | Product Hivemind; package/bin `hivemind`; harness is project type; OpenCode is platform | ✓ Locked |
| D-CRUD-05: each `.hivemind/` dir has typed owner | Only 2/11 dirs have owners | ⚠️ Revisit |
| D-WS-01: 5→3 themed workstreams | Core Architecture → Agent Workflows → User Experience | ✓ Good |

---
*Last updated: 2026-05-11 — Phase 11 governance reconciliation. All numeric claims verified against 11-TRUTH-MATRIX.md.*

**Evidence baseline:** .planning/phases/11-governance-reconciliation-update-all-core-artifacts-state-md/11-TRUTH-MATRIX.md
