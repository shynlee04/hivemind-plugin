# AGENTS.md

Slim root instruction file. Domain-specific rules live in subdirectory `AGENTS.md` files. Loaded by `opencode.json` `instructions` and every agent's `instruction:` frontmatter — keep lean.

## Project

Hivemind is a runtime composition engine for OpenCode. npm package (`hivemind`) that wires Tools, Hooks, and a Plugin into OpenCode with zero business logic in the plugin layer.

## Two Halves — never confuse them

- **Hard Harness** (`src/`, npm package): Tools, Hooks, Plugin, Shared, Task-Management, Coordination, Features, Config, Routing, Schema-Kernel.
- **Soft Meta-Concepts** (`.opencode/`, user-configurable): Skills, Agents, Commands, Rules, Permissions.
- **Internal State** (`.hivemind/`, deep module): Session journals, delegation records, runtime state, planning persistence.
- **Governance** (`.planning/`, planning only): Requirements, roadmaps, architecture, phase authorization.

## CONSTITUTION: Source vs Deploy

- `assets/` is the **source of truth** for all shipped primitives. NEVER develop in `.opencode/` directly.
- Edit in `assets/` → `node scripts/sync-assets.js` → verify in `.opencode/`. `npm run build` also regenerates it.
- Exception: `gsd-*` primitives are developer tooling, NOT shipped, may live in `.opencode/get-shit-done/`.

## THE ABSOLUTE ORDER — Front-Facing L0 Never Does Specialists' Work

- L0/L1 orchestrators (`hm-l0-orchestrator`, `hm-orchestrator`) MUST classify, route, coordinate, gatekeep. **Banned from inline work**: no reading files, writing code, running tests, auditing.
- Delegate ALL detail work to `hm-*` / `hf-*` specialists via the `task` tool.
- Generic agents (`general`, `Explore`, `Plan`) are **prohibited**. All dispatch goes to domain-specific specialists.

## Setup

- `npm install` (Node.js >= 20.0.0); `npm run build` (clean + compile `src/` → `dist/`); `npm test` (vitest, ~2,963 tests); `npm run typecheck` (required before commit).
- No env vars required for build/test. Runtime overrides: `OPENCODE_HARNESS_STATE_DIR`, `OPENCODE_HARNESS_CONTINUITY_FILE`.

## Hard Rules (non-negotiable)

- TypeScript strict (`strict`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`). No `any`; use `unknown`. No `as`. `verbatimModuleSyntax: true` → use `import type`.
- Max module size: **500 LOC**. No circular dependencies. All thrown errors prefixed `[Harness]`.
- Deep-clone-on-read in continuity store. Dual-layer state: durable JSON + in-memory Maps.
- **Atomic commits** — one logical change = one commit. Every commit must pass `npm run typecheck` and `npm test`.
- `.hivemind/` is the canonical state root (Q6). `.opencode/` is for OpenCode primitives only. One-way migration.

## Subdirectory AGENTS.md

OpenCode walks up from cwd and loads the closest `AGENTS.md`. Subdirectory file wins when working in a subtree.

- `src/**` → `src/AGENTS.md` (CQRS, mutation authority, code style, JSDoc, build & deploy)
- `tests/**` → `tests/AGENTS.md` (TDD, evidence labels, coverage states, public-interface discipline)
- `.opencode/**` → `.opencode/AGENTS.md` (HM/HF/gate/stack/gsd lineages, L0 coordination, primitives)
- `.hivemind/**` → `.hivemind/AGENTS.md` (state sector, allowed/forbidden mutations, recovery)

## Canonical Phase Loop (binding)

Scout → Phase CRUD → Trajectory init → SPEC → CONTEXT → RESEARCH → PATTERNS → PLAN → EXECUTE → VERIFY → SHIP. Routes: `/hm-spec-phase`, `/hm-discuss-phase`, `/hm-research`, `/hm-plan-phase`, `/hm-execute-phase`, `/hm-verify-work`, `/hm-ship`.

## Delegation Rules

- **Discover first**: `delegation-status({ action: "find-stackable" })` before new delegation. Stack onto existing sessions via `task_id` / `stackOnSessionId`.
- **Never create duplicate sessions** — stack retry onto the FAILED session to preserve context.
- **Dual-signal completion**: doer + verifier must both pass. **Sequential preferred over parallel** for inherited knowledge.

## Test-First Cycle & Quality Gates

RED (failing test) → GREEN (minimal impl) → Coverage (`npm run test:coverage`) → REFACTOR (only if needed). Evidence labels: `runtime-truthful` > `transport-mocked` > `mock-heavy` > `manual-only`. After 3 focused attempts with the same hypothesis, return a blocked handoff. Full discipline in `tests/AGENTS.md`.

Every specialist wave passes the Quality Gate Triad: `gate-lifecycle-integration` (9-surface mutation, CQRS, event wiring) → `gate-spec-compliance` (spec-to-code, EARS, anti-patterns) → `gate-evidence-truth` (L1 runtime proof; rejects mock-only).

## Architecture Pointers

- `.planning/codebase/ARCHITECTURE.md` (9-surface map), `.planning/codebase/STRUCTURE.md` (file tree)
- `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` (source plane), `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` (lineage taxonomy)
- `docs/proposals/VALIDATION-DECISIONS-2026-04-25.md` (locked Q1-Q6)

## Terminology (one-line glossary)

Use **Harness** not Framework; **Agent (specialist)** not Claude/AI; **Skill** not Prompt; **Delegation packet** not Task assignment; **Runtime composition** not Static definition. Harness composes behavior at runtime.

## Cycle State

For the current active phase and active restructure ordering, read `.planning/STATE.md#active-phase`. Intentionally NOT inlined to prevent drift.
