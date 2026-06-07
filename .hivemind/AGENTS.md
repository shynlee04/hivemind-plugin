# .hivemind/AGENTS.md

Scope: rules that apply when reading, writing, or auditing code under `.hivemind/`. Inherits the root `AGENTS.md` rules; this file deepens the internal state sector governance. Source of truth: `.planning/codebase/ARCHITECTURE.md` (Q6 state root) and `.hivemind/planning/` planning artifacts.

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## Subdirectory Scope (Phase B)

`.hivemind/` is the runtime state sector. It is **deeply read-relative** — most subdirectories are owned by typed runtime modules and are not free-form editable.

- **Reading state:** Use the public module APIs (`get`, `read`, `find`, `list`) — never `readFile` on a state JSON directly. Mocking the public seam is acceptable; raw file I/O is not.
- **Writing state:** Only typed runtime owners in `src/task-management/`, `src/coordination/`, and `src/features/` may write their assigned state files through approved persistence modules. Evidence: `.planning/codebase/ARCHITECTURE.md:311-315`, `.planning/codebase/ARCHITECTURE.md:405-411`.
- **Triggering state mutations via tools:** Tools may trigger state mutations through library owners when the tool contract permits mutation. Evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- **Event-tracker artifacts:** May be best-effort hook-driven outputs only when routed through library/event-tracker owners; they must not block canonical handling. Evidence: `.planning/codebase/ARCHITECTURE.md:302-315`, `.planning/codebase/ARCHITECTURE.md:388-392`.

## 1. Sector Purpose and Lifecycle Role

`.hivemind/` is the Internal State sector and canonical Q6 state root for Hivemind runtime persistence: session continuity, delegation records, config workflow state, event tracker artifacts, session journals, execution lineage, and recovery artifacts. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/ARCHITECTURE.md:405-411`, `.planning/codebase/STRUCTURE.md:130-134`.

## 2. Allowed Mutation Authority

- Typed runtime owners in `src/task-management/`, `src/coordination/`, and `src/features/` may write their assigned state files through approved persistence modules. Evidence: `.planning/codebase/ARCHITECTURE.md:311-315`, `.planning/codebase/ARCHITECTURE.md:405-411`.
- Tools may trigger state mutations through library owners when the tool contract permits mutation. Evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- Event tracker artifacts may be best-effort hook-driven outputs only when routed through library/event-tracker owners; they must not block canonical handling. Evidence: `.planning/codebase/ARCHITECTURE.md:302-315`, `.planning/codebase/ARCHITECTURE.md:388-392`.

## 3. Forbidden Mutations / Explicit No-Go Boundaries

- Hooks SHALL NOT directly write durable state into `.hivemind/`; hook effects must stay observation/response-shaping/guard-decision. Evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- `.hivemind/` state SHALL NOT be moved back into `.opencode/`; `.opencode/state/` is legacy migration-only. Evidence: `.planning/codebase/ARCHITECTURE.md:351-353`, `.planning/codebase/STRUCTURE.md:295-299`.
- Do not fabricate missing state subdirectories or ownership modules from documentation-only work; bootstrap/state ownership remains an active gap. Evidence: `.planning/PROJECT.md:29-42`, `.planning/REQUIREMENTS.md:46-56`.
- Do not edit runtime state artifacts manually unless a recovery workflow explicitly authorizes it.

## 4. Actors and Consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/task-management/continuity/` | Owns session continuity JSON persistence | Must deep-clone/normalize/quarantine through code owners |
| `src/task-management/continuity/delegation-persistence.ts` | Owns delegation record I/O | Tools/managers call the owner, not raw edits |
| Event tracker/session journal/lineage modules | Produce audit and timeline artifacts | Best-effort artifacts are not completion proof by themselves |
| Sidecar/planning readers | May read canonical artifacts | Read-only consumers must not mutate state |
| Recovery workflows | Assess and repair state under authorization | Must preserve evidence and avoid manual drift |

## 5. Naming and Placement Conventions

- Current known state folders include `.hivemind/state/`, `.hivemind/event-tracker/`, and `.hivemind/poor-prompts/`. Evidence: `.planning/codebase/STRUCTURE.md:40-43`, `.planning/codebase/STRUCTURE.md:130-134`.
- State files should be owned by typed modules before being treated as runtime-contract surfaces. Evidence: `.planning/PROJECT.md:29-42`, `.planning/REQUIREMENTS.md:46-56`.
- Do not use `.opencode/` for new internal state naming or placement. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.

## 6. Quality Gates and Evidence Expectations

- State-sector changes require proof of the owning module, migration behavior, and recovery/quarantine behavior when applicable.
- Unit tests alone do not prove restart recovery; runtime recovery claims need integration or live restart evidence.
- Docs-only edits remain L5 evidence and must not unblock CA-04 bootstrap/state ownership readiness. Evidence: `.planning/ROADMAP.md:29-49`.

## 7. Common Subdirectories & Their Owners

| Path | Owner | Notes |
|------|-------|-------|
| `.hivemind/state/` | `src/task-management/continuity/` | Session continuity JSON, deep-cloned reads |
| `.hivemind/event-tracker/` | `src/features/session-tracker/` | Best-effort hook output; not completion proof |
| `.hivemind/poor-prompts/` | Manual triage only | Captures malformed user/agent prompts for review |
| `.hivemind/planning/` | L0/L1 governance only | Phase plans, roadmaps, research; L0 is the only writer |

## 8. State Mutation Discipline (binding)

- **Deep-clone-on-read.** Any value read from state must be deep-cloned before mutation. The continuity store returns references; mutating a returned reference mutates state.
- **Dual-layer storage.** State lives in two layers: durable JSON (on disk) + in-memory `Map` (hot). The on-disk layer is the source of truth; the in-memory layer is a cache that may be rebuilt.
- **Quarantine on parse failure.** If a state JSON cannot be parsed, do not delete it. Move it to `.hivemind/quarantine/<timestamp>-<basename>` and log the failure. Recovery workflows are the only path back.
- **Atomic writes.** State JSON writes must be atomic (write to temp file, then rename). Partial writes corrupt the continuity store.
- **Schema versioning.** Every state JSON file MUST include a `schemaVersion` field. Bump the version on incompatible changes; do not attempt to migrate silently.

## 9. Session Continuity (read-mostly)

- The continuity store is the single source of truth for session state across compaction, restart, and delegation.
- Continuity records are immutable once written. To "update", write a new record with `supersedes: <previous-id>`.
- Reads return a frozen, deep-cloned snapshot. Do not hold references across awaits; re-read if you need the latest.

## 10. Delegation Records (write via tool)

- Delegation records are produced by the coordination layer, not by L0/L1 directly.
- Tools that need to create a delegation record (e.g., `hm-task` in some modes) must call the owner API in `src/task-management/continuity/delegation-persistence.ts`.
- Delegation records include: `parentSessionId`, `childSessionId`, `agent`, `startedAt`, `endedAt`, `status`, `resultSummary`, `evidenceLevel`. The evidence level is set by the doer specialist, validated by the verifier.

## 11. Recovery Workflows

- Recovery is gated by an explicit `agent-work-contract` with `taskBoundary: "state-recovery"` and `allowedSurfaces: [".hivemind/**"]`.
- Recovery must preserve evidence: never delete state without quarantining first.
- Recovery must produce an audit artifact under `.hivemind/recovery/<timestamp>-<reason>/` describing the diagnosis, the actions taken, and the resulting state hashes.
- Manual edits to runtime state are FORBIDDEN except by a recovery workflow. If a recovery workflow is not active, do not edit state — open a planning issue instead.

## Where to Find More

- Internal state sector reference: `.opencode/skills/hm-l3-hivemind-state-reference/SKILL.md`
- Engine contracts (write authority, lifecycle): `.opencode/skills/hm-l3-hivemind-engine-contracts/SKILL.md`
- 9-surface authority table: `.planning/codebase/ARCHITECTURE.md`
- File tree: `.planning/codebase/STRUCTURE.md`
- Continuity spec: `src/task-management/continuity/` (read with care — runtime critical)
- Code under harness: `src/AGENTS.md`
- OpenCode primitives: `.opencode/AGENTS.md`
