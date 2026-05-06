# Phase CA-04: CRUD Ownership Modules + Lifecycle Verification - Research

**Researched:** 2026-05-07
**Domain:** TypeScript CRUD ownership modules, file-system state management, lifecycle audit methodology, naming convention validation, OpenCode SDK patterns
**Confidence:** HIGH

## Summary

Phase CA-04 establishes typed CRUD ownership modules for all 19 `.hivemind/` subdirectories, wires one workflow toggle to `lifecycle-manager.ts`, performs a full lifecycle audit across 34 `src/lib/` modules, and validates cross-lineage naming conventions. This is the **architectural integrity capstone** for the core-architecture workstream.

The research confirms that the existing `continuity.ts` CRUD pattern (typed read/write/patch functions, deep-clone-on-read, atomic write-via-temp-file, quarantine-on-corruption) is the established "blessed" pattern to replicate across all new CRUD modules. The OMO (oh-my-openagent) ecosystem confirms this pattern at scale: `boulder-state/storage.ts` uses identical `readBoulderState()`/`writeBoulderState()`/`appendSessionId()`/`upsertTaskSessionState()` with JSON serialization and `mkdirSync({recursive: true})`. OMO's `task-create.ts` adds Zod validation and `acquireLock()`/`release()` for concurrent write safety — a pattern Hivemind should evaluate for its multi-process CRUD modules.

The lifecycle audit's gate skill (`gate-l3-lifecycle-integration`) has **empty `references/` directories** — all 10 criteria documents must be synthesized from `.planning/codebase/ARCHITECTURE.md` before the audit can produce reliable PASS/FAIL verdicts. This synthesis is a blocking prerequisite (D-12). The naming validation is well-supported by existing skills (`hf-l2-naming-syndicate`, `hm-l3-integration-contracts`) but requires a reusable CI script, not a one-shot report.

**Primary recommendation:** Replicate the `continuity.ts` CRUD pattern for all 13 new modules (7 CRUD + 6 append-only), use `z.enum()` with `as const` for the `DirectoryMutationTier` enum, synthesize gate criteria documents from ARCHITECTURE.md before auditing, and build a `scripts/validate-naming.ts` CI script using existing naming-syndicate rules.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| State file read/write for `.hivemind/` subdirectories | `src/lib/` (Library) | — | CRUD modules live in library layer; tools invoke them, hooks observe |
| CRUD module ownership enforcement | `src/lib/` (Library) | `src/plugin.ts` (Assembly) | One module per directory; plugin.ts wires deps only — no business logic |
| Lifecycle audit execution | `src/lib/` (Library) | Gate skill (`.opencode/`) | Audit evaluates 34 src/lib modules; gate skill provides criteria |
| Toggle wiring (`cross_session_tasks_dependencies_validation`) | `src/hooks/` (Hooks) + `src/lib/lifecycle-manager.ts` | Config schema (`.opencode/`) | Hook gate (early return when off) + tool defensive check; schema provides default |
| Naming convention validation | `.opencode/` (Meta-Concepts) | `src/lib/naming-validator.ts` (CI script) | Scan targets soft concepts; reusable script in library layer |
| Gate criteria document synthesis | `.opencode/skills/gate-l3-lifecycle-integration/references/` | `.planning/codebase/ARCHITECTURE.md` | References derive from architecture analysis; skill loads them |

---

## User Constraints (from CONTEXT.md)

### Locked Decisions

All decisions in CA-04-CONTEXT.md are user-directed. No areas were deferred to agent discretion.

- **D-01:** CA-04 scope is tiered CRUD ownership + lifecycle audit + naming validation + single toggle wiring. NOT "full uniform CRUD for everything."
- **D-02:** CRUD operations are tiered by directory semantics: 7 CRUD dirs, 7 append-only, 6 read-only. `DirectoryMutationTier` enum in `src/lib/types.ts`.
- **D-03:** Each directory gets exactly ONE owning module in `src/lib/` with typed TypeScript functions. No other module writes to that directory.
- **D-04:** Existing de-facto owners (`continuity.ts` → `state/`, `delegation-persistence.ts` → `delegation-managements/`) are formalized. New modules for remaining directories.
- **D-05:** `DirectoryMutationTier` enum (`CRUD`, `APPEND_ONLY`, `READ_ONLY`) added to `src/lib/types.ts`. Each owning module exports its tier.
- **D-06:** Deferred directories documented with `@future-owner` JSDoc. Interface contracts defined, not placeholder modules.
- **D-07:** Only `cross_session_tasks_dependencies_validation` wired. Pattern: hook gate (early return) + tool defensive check. Default `false`.
- **D-08:** Remaining 3 toggles stay doc-only; `@future-consumer` annotations updated with status field.
- **D-09:** `@future-consumer` format: `@future-consumer <module> — WIRED in CA-04` or `@future-consumer <module> — DEFERRED to WS-6`.
- **D-10:** Phase 1 audit: verification-only across 34 modules. Produces `CA-04-LIFECYCLE-AUDIT.md`. No code changes.
- **D-11:** Phase 2: targeted fixes on 6 CRUD-owner modules only (`continuity.ts`, `delegation-persistence.ts`, `lifecycle-manager.ts`, `task-status.ts`, `execution-lineage.ts`, `session-journal.ts`).
- **D-12:** Prerequisite: synthesize gate criteria documents from ARCHITECTURE.md before audit.
- **D-13:** Audit findings feed into REQUIREMENTS.md and STATE.md as tracked gaps.
- **D-14:** Layer 1 naming scan: all 56 shipped agents + 51 active skills. Produces `CA-04-NAMING-AUDIT.md`. No auto-fixes.
- **D-15:** Layer 2: reusable CI script (`scripts/validate-naming.sh` or `src/lib/naming-validator.ts`). Validated against 44 primitives.
- **D-16:** gsd-* primitives EXCLUDED from naming audit.
- **D-17:** Cross-lineage loading violations detected but NOT auto-fixed.

### the agent's Discretion

*All decisions were user-directed. No areas were deferred to agent discretion.*

### Deferred Ideas (OUT OF SCOPE)

- Full uniform CRUD for all 19 directories
- Wiring of `trajectory_control`, `advanced_continuity_validation`, `task_plus_enabled`
- ui_phase, ui_safety_gate, ai_integration_phase toggle wiring
- Auto-fixes for naming violations
- Full lifecycle audit of all 34 modules with fixes (28 non-CRUD-owner modules get verification-only)
- E2E runtime UAT validation (19 blocked UATs from CA-03)
- Tool guard enforcement (blocking)
- Commands, workflows, parsing, conditional auto routing, intent routing (skeleton gaps)

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-CRUD-01 | Tiered CRUD ownership modules for 19 `.hivemind/` subdirectories | §Standard Stack (CRUD pattern), §Architecture Patterns (Pattern 1: CRUD Module Ownership), §Code Examples (continuity.ts CRUD pattern) |
| REQ-CRUD-02 | `DirectoryMutationTier` enum in `src/lib/types.ts` | §Standard Stack (Zod enum pattern), §Code Examples (DirectoryMutationTier) |
| REQ-TOGGLE-01 | Wire `cross_session_tasks_dependencies_validation` to `lifecycle-manager.ts` | §Architecture Patterns (Pattern 3: Toggle Gate), §Code Examples (CA-03 toggle gate pattern) |
| REQ-TOGGLE-02 | Update `@future-consumer` annotations with status field | §Architecture Patterns (Pattern 3: Toggle Gate) |
| REQ-AUDIT-01 | Synthesize gate criteria documents from ARCHITECTURE.md | §Standard Stack (gate-l3-lifecycle-integration), §Architecture Patterns (Pattern 2: Lifecycle Audit) |
| REQ-AUDIT-02 | Phase 1 verification-only lifecycle audit across 34 modules | §Architecture Patterns (Pattern 2: Lifecycle Audit), §Common Pitfalls |
| REQ-AUDIT-03 | Phase 2 targeted fixes on 6 CRUD-owner modules | §Architecture Patterns (Pattern 2), §Common Pitfalls (Pitfall 3: CQRS Boundary Violations) |
| REQ-NAMING-01 | Full directory scan of 56 agents + 51 skills for naming compliance | §Standard Stack (hf-l2-naming-syndicate), §Architecture Patterns (Pattern 4: Naming Validation) |
| REQ-NAMING-02 | Reusable CI validation script validated against 44 primitives | §Architecture Patterns (Pattern 4), §Don't Hand-Roll |
| REQ-NAMING-03 | Cross-lineage loading violation detection | §Standard Stack (hm-l3-integration-contracts) |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Zod | v4.x (v4.0.1 latest) [VERIFIED: npm registry] | Schema validation for CRUD operations, enum validation, mutation tier | Already in project (schema-kernel/). `z.enum()` with `as const` for `DirectoryMutationTier`. OMO uses identical pattern. [CITED: zod.dev/api?id=check] |
| Node.js `fs` (readFileSync, writeFileSync, renameSync, mkdirSync) | Built-in (Node 20+) | File I/O for CRUD modules | Already in continuity.ts, delegation-persistence.ts. No additional dependency needed. [VERIFIED: codebase grep] |
| Node.js `path` (join, resolve, dirname) | Built-in | Path resolution for `.hivemind/` subdirectories | Standard in all existing persistence modules. [VERIFIED: codebase grep] |
| OpenCode SDK `@opencode-ai/plugin` | v1.14.28 (peer) [VERIFIED: package.json] | `tool()` factory for CRUD tool registration, `hook()` for toggle gate | Already in project. gate-l3-lifecycle-integration references v1.14.28. [CITED: opencode.ai/docs/plugins] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node:crypto` (randomUUID) | Built-in | Unique temp file names for atomic writes | Every CRUD module that writes files. Already in continuity.ts L1, L61. [VERIFIED: codebase grep] |
| `vitest` | v3.x (project standard) | Unit tests for CRUD modules | Test-driven execution. Already configured with `globals: true`. [VERIFIED: vitest.config.ts] |
| ESLint/TypeScript strict mode | Project standard | Type enforcement | `verbatimModuleSyntax: true`, `noUnusedLocals`, `noUnusedParameters`. [VERIFIED: tsconfig.json] |

### Skill/Pattern Resources (Research-Only, Not npm Dependencies)
| Resource | Source | What to Extract |
|----------|--------|-----------------|
| `continuity.ts` CRUD pattern | `src/lib/continuity.ts` (465 LOC) [VERIFIED: codebase] | Typed read/write/patch/delete, deep-clone-on-read, atomic write, quarantine |
| `delegation-persistence.ts` pattern | `src/lib/delegation-persistence.ts` (197 LOC) [VERIFIED: codebase] | `persistX()` + `readX()` pairs, Zod guard, toggle gate |
| OMO boulder-state CRUD pattern | `code-yeongyu/oh-my-openagent` [CITED: raw.githubusercontent.com] | `readX()`/`writeX()`/`appendX()`/`upsertX()`/`clearX()`, mkdir recursive, JSON parse guard |
| OMO task-create atomic write + lock | `code-yeongyu/oh-my-openagent` [CITED: raw.githubusercontent.com] | `writeJsonAtomic()`, `acquireLock()`/`release()`, Zod validation, per-file JSON |
| gate-l3-lifecycle-integration | `.opencode/skills/gate-l3-lifecycle-integration/SKILL.md` [VERIFIED: codebase] | 9-surface checklist, CQRS boundaries, classification decision tree, anti-pattern catalog (all empty — need synthesis) |
| hf-l2-naming-syndicate | `.opencode/skills/hf-l2-naming-syndicate/SKILL.md` [VERIFIED: codebase] | Prefix rules (hm-*/hf-*/gate-*/stack-*), domain-function pattern, lineage validation |
| hm-l3-integration-contracts | `.opencode/skills/hm-l3-integration-contracts/SKILL.md` [VERIFIED: codebase] | D-AD-01 cross-lineage rules, orphan detection protocol, agent-to-skill bindings |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled `fs` read/parse/write per module | A shared `CRUDModule<T>` abstract base class | Shared base adds coupling; D-03 requires per-directory ownership; explicit typed functions allow per-directory validation that generic base can't express cleanly |
| `z.enum()` with `as const` | TypeScript `enum` keyword | `as const` + `z.enum()` provides both runtime validation AND static type inference. TypeScript `enum` alone lacks runtime validation. [VERIFIED: Context7 zod docs] |
| `writeFileSync` directly | `write-temp-then-renameSync` (atomic write) | Direct write risks corrupt reads if process crashes mid-write. Atomic pattern already proven in continuity.ts and OMO. |
| One-shot naming report | ESLint custom rule | ESLint provides CI integration but requires config maintenance; standalone script is simpler, more portable across CI systems |
| `@future-owner` JSDoc for deferred directories | Placeholder module stubs | JSDoc contracts are lighter weight, don't create dead code, and are machine-verifiable via grep |

**Installation:**
```bash
npm install   # No new dependencies — all CRUD modules use existing stack
```

---

## Architecture Patterns

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CA-04 ENTRY POINTS                             │
│                                                                         │
│  ┌─────────────┐    ┌───────────────┐    ┌──────────────────┐         │
│  │ Toggle Wire  │    │ CRUD Modules  │    │ Lifecycle Audit  │         │
│  │ (D-07)       │    │ (D-02..D-06)  │    │ (D-10..D-13)     │         │
│  └──────┬───────┘    └──────┬────────┘    └───────┬──────────┘         │
│         │                   │                      │                    │
│         ▼                   ▼                      ▼                    │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────────────┐      │
│  │ configs.json │───▶│ src/lib/crud │    │ gate-l3-lifecycle-   │      │
│  │ schema       │    │  /<name>.ts  │    │ integration skill    │      │
│  └──────┬───────┘    └──────┬───────┘    └────────┬─────────────┘      │
│         │                   │                      │                    │
│         │            ┌──────┴───────┐      ┌───────┴───────┐          │
│         │            │  .hivemind/  │      │ ARCHITECTURE  │          │
│         │            │  subdirs     │      │ .md → 10 refs │          │
│         │            └──────────────┘      └───────────────┘          │
│         ▼                                                               │
│  ┌──────────────────────────────────────────────────────┐              │
│  │ lifecycle-manager.ts (consumer)                       │              │
│  │  ┌─────────────────────────────────────────────┐     │              │
│  │  │ if (!config.workflow.cross_session_tasks_   │     │              │
│  │  │     dependencies_validation) return;        │     │              │
│  │  │ // Validate cross-session task dependencies │     │              │
│  │  └─────────────────────────────────────────────┘     │              │
│  └──────────────────────────────────────────────────────┘              │
│                                                                         │
│  ┌──────────────────────────────────────────────────────┐              │
│  │ Naming Validation (D-14..D-17)                        │              │
│  │                                                       │              │
│  │  Layer 1: scan .opencode/agents/ + .opencode/skills/  │              │
│  │           → CA-04-NAMING-AUDIT.md                     │              │
│  │                                                       │              │
│  │  Layer 2: scripts/validate-naming.ts                  │              │
│  │           → CI gate (44 primitives sample)            │              │
│  └──────────────────────────────────────────────────────┘              │
└────────────────────────────────────────────────────────────────────────┘

DATA FLOW (CRUD module → .hivemind/):
  Agent invokes tool → tool calls CRUD module function →
  → CRUD module validates arguments via Zod →
  → Resolves .hivemind/ subdirectory path →
  → Reads/writes JSON file (deep-clone on read, atomic on write) →
  → Returns typed result through ToolResponse envelope

DATA FLOW (Lifecycle Audit):
  Synthesized criteria docs loaded by gate skill →
  → Gate skill evaluates each of 34 src/lib modules →
  → Checks 9-surface mutation authority, CQRS boundaries, actor hierarchy →
  → Produces PASS/FAIL per module per surface →
  → Phase 2 applies fixes to 6 CRUD-owner modules only
```

### Recommended Project Structure
```
src/lib/
├── crud/                              # NEW — tiered CRUD ownership modules
│   ├── state.ts                       # CRUD tier — formalizes continuity.ts ownership
│   ├── delegation-managements.ts      # CRUD tier — formalizes delegation-persistence.ts ownership
│   ├── registries.ts                  # CRUD tier — new module
│   ├── task-managements.ts            # CRUD tier — new module
│   ├── uat.ts                         # CRUD tier — new module
│   ├── manifests.ts                   # CRUD tier — new module
│   ├── configs-crud.ts                # CRUD tier — new module (configs.json)
│   ├── journal.ts                     # APPEND tier — formalizes journal-logger.ts ownership
│   ├── lineage.ts                     # APPEND tier — formalizes trajectory ledger ownership
│   ├── event-tracker.ts               # APPEND tier — formalizes event-tracker agent ownership
│   ├── daily-notes.ts                 # APPEND tier — new module
│   ├── poor-prompts.ts                # APPEND tier — new module
│   ├── artifacts.ts                   # APPEND tier — new module
│   ├── logs.ts                        # APPEND tier — new module
│   └── read-only/                     # READ tier — read-only accessors
│       ├── runtime.ts                 # READ tier — runtime state reader
│       ├── sidecar.ts                 # READ tier — sidecar artifact reader
│       ├── hf-brain.ts                # READ tier — static reference reader
│       ├── hm-brain.ts                # READ tier — static reference reader
│       └── onboarding.ts              # READ tier — static reference reader
├── naming-validator.ts                # NEW — CI validation script (Layer 2)
└── [existing 34 modules unchanged]
```

### Pattern 1: CRUD Module Ownership (Replicate continuity.ts)

**What:** Each `.hivemind/` subdirectory has exactly ONE owning module in `src/lib/crud/` with typed TypeScript functions for all allowed operations. The tier (`CRUD`, `APPEND_ONLY`, `READ_ONLY`) determines which operations are exported. No other module reads or writes that directory directly.

**When to use:** For every CRUD module created in this phase. This is the established pattern from `continuity.ts` and `delegation-persistence.ts`.

**Example (CRUD tier module skeleton):**
```typescript
// src/lib/crud/registries.ts — CRUD tier owner for .hivemind/registries/
import { randomUUID } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import type { RegistryEntry } from "../types.js"
import { DirectoryMutationTier } from "../types.js"
import { assertPathWithinRoot } from "../security/path-scope.js"

export const DIRECTORY_MUTATION_TIER = DirectoryMutationTier.CRUD

const CANONICAL_DIR = resolve(process.cwd(), ".hivemind", "registries")

function resolveFilePath(registryName: string): string {
  return assertPathWithinRoot(CANONICAL_DIR, `${registryName}.json`, "registry state")
}

/** Create a new registry file with initial entries. */
export function createRegistry(registryName: string, entries: RegistryEntry[]): RegistryEntry[] {
  const filePath = resolveFilePath(registryName)
  mkdirSync(dirname(filePath), { recursive: true })
  const tmpFile = `${filePath}.${process.pid}.${randomUUID()}.tmp`
  const data = { version: 1, updatedAt: Date.now(), entries }
  writeFileSync(tmpFile, `${JSON.stringify(data, null, 2)}\n`, "utf-8")
  renameSync(tmpFile, filePath)  // Atomic write
  return entries
}

/** Read a registry file. Returns null if file doesn't exist. */
export function readRegistry(registryName: string): RegistryEntry[] | null {
  const filePath = resolveFilePath(registryName)
  if (!existsSync(filePath)) return null
  const content = readFileSync(filePath, "utf-8")
  const parsed = JSON.parse(content)
  return parsed?.entries ?? null
}

/** Update entries in a registry file (upsert). */
export function updateRegistry(registryName: string, entries: RegistryEntry[]): RegistryEntry[] {
  return createRegistry(registryName, entries)  // Overwrites atomically
}

/** Delete a registry file. Returns true if file existed and was removed. */
export function deleteRegistry(registryName: string): boolean {
  const filePath = resolveFilePath(registryName)
  if (!existsSync(filePath)) return false
  const { unlinkSync } = require("node:fs")
  unlinkSync(filePath)
  return true
}
```

### Pattern 2: Append-Only Module (Formalize journal/lineage/event-tracker)

**What:** Append-only modules export Create + Read + Append functions. They do NOT export Update or Delete. The mutation tier constant is `APPEND_ONLY`. Q3 (journal append-only decision) is enforced at the module level.

**Example (append-only skeleton):**
```typescript
// src/lib/crud/logs.ts — APPEND tier owner for .hivemind/logs/
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { DirectoryMutationTier } from "../types.js"

export const DIRECTORY_MUTATION_TIER = DirectoryMutationTier.APPEND_ONLY

const CANONICAL_DIR = resolve(process.cwd(), ".hivemind", "logs")

/** Create a new log file (erases existing). */
export function createLogFile(name: string, initialContent: string): void { /* ... */ }

/** Append a line to an existing log file. */
export function appendToLogFile(name: string, line: string): void { /* ... */ }

/** Read a log file. */
export function readLogFile(name: string): string | null { /* ... */ }

// NO updateLogFile(), NO deleteLogFile() — APPEND_ONLY tier
```

### Pattern 3: Read-Only Module

**What:** Read-only modules export only Read functions. No Create, Update, Delete, or Append. The mutation tier constant is `READ_ONLY`. Q2 (sidecar read-only) and Q6 (state-root separation) are enforced.

**Example (read-only skeleton):**
```typescript
// src/lib/crud/read-only/runtime.ts — READ tier accessor for .hivemind/runtime/
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { DirectoryMutationTier } from "../../types.js"

export const DIRECTORY_MUTATION_TIER = DirectoryMutationTier.READ_ONLY

const CANONICAL_DIR = resolve(process.cwd(), ".hivemind", "runtime")

/** Read a runtime state file. Returns null if file doesn't exist. */
export function readRuntimeState(name: string): unknown | null { /* ... */ }

// NO create/update/delete/append — READ_ONLY tier
```

### Pattern 4: Toggle Gate (Replicate CA-03 D-03)

**What:** Toggle gate pattern: hook returns early when toggle is `false`, tool performs defensive check and returns advisory message. Toggle defaults to `false` (safe no-op).

**When to use:** For the single toggle wired in CA-04 (`cross_session_tasks_dependencies_validation`).

**Example:**
```typescript
// In hook factory (create-core-hooks.ts or similar):
function validateCrossSessionTasks(deps: HookDependencies, sessionId: string): void {
  if (!deps.hivemindConfig?.workflow.cross_session_tasks_dependencies_validation) return
  // ... validation logic
}

// In tool defensive check:
function getValidationContext(config: HivemindConfigs): { enabled: boolean } {
  return {
    enabled: config.workflow.cross_session_tasks_dependencies_validation,
  }
}
```

### Pattern 5: Lifecycle Audit Two-Phase

**What:** Phase 1 runs verification-only across all 34 modules, producing a structured audit report with PASS/FAIL per module per surface. No code changes. Phase 2 applies targeted fixes to the 6 CRUD-owner modules that CA-04 touches.

**Prerequisite:** Synthesize 10 reference documents for `gate-l3-lifecycle-integration` from ARCHITECTURE.md:
- `references/nine-surface-authority.md` — mapped from ARCHITECTURE.md §Component Responsibilities
- `references/cqrs-boundaries.md` — derived from ARCHITECTURE.md §Pattern Overview (CQRS separation)
- `references/evaluation-checklist.md` — built from gate skill's decision tree + ARCHITECTURE.md anti-patterns
- `references/anti-patterns.md` — expanded from ARCHITECTURE.md §Anti-Patterns
- `references/sdk-compliance.md` — mapped from OpenCode SDK v1.14.28 tool()/hook() signatures
- `references/adopted-patterns.md` — synthesized from OMO patterns and project's own established patterns
- `references/remediation-paths.md` — routing table already defined in gate skill SKILL.md
- `references/gap-documentation.md` — empty catalog to be populated from Phase 1 findings
- `references/triad-flow.md` — gate orchestrator integration contract
- `references/perspective-rubrics.md` — PM/Architect/Dev scoring rubrics

### Pattern 6: Naming Validation Two-Layer

**What:** Layer 1 produces a comprehensive report by scanning all agent/skill directories. Layer 2 produces a reusable CI script that applies naming rules to any set of primitives.

**Layer 1 scan algorithm:**
1. Glob `.opencode/agents/*.md` and `.opencode/skills/*/SKILL.md`
2. Parse YAML frontmatter from each file
3. Check prefix compliance: `name` field matches `^(hm|hf|gate|stack)-` for applicable lineages
4. Check `lineage:` field presence
5. Check `consumed-by:` metadata completeness
6. Check cross-lineage violations (hm-* loading hf-* → D-AD-01 violation)
7. Check orphan skills (no agent lists it in consumed-by)
8. Output `CA-04-NAMING-AUDIT.md` with per-primitive PASS/FAIL + aggregate stats

**Layer 2 CI script structure:**
```typescript
// src/lib/naming-validator.ts
export function validatePrefix(name: string, expectedLineage: string): { pass: boolean; reason: string }
export function validateLineageField(frontmatter: Record<string, unknown>): { present: boolean }
export function validateCrossLineage(agentLineage: string, skillLineage: string): { violation: boolean; rule: string }
// Exits 0 on PASS, 1 on violations found
```

### Anti-Patterns to Avoid

- **Direct `fs` access in hooks:** Hooks route through CRUD modules, never read/write `.hivemind/` directly. Enforced by CQRS boundaries. [VERIFIED: ARCHITECTURE.md §Anti-Patterns]
- **Module-level singleton caches:** `continuity.ts:26` `storeCache` prevents isolated testing. New CRUD modules should encapsulate state in class instances or accept cache through constructor. [VERIFIED: ARCHITECTURE.md §Anti-Patterns]
- **Accumulating Maps without eviction:** `TaskStateManager` Maps grow indefinitely. New CRUD modules should either use file-based persistence (no in-memory accumulation) or include TTL-based eviction. [VERIFIED: ARCHITECTURE.md §Anti-Patterns]
- **CQRS tool/hook confusion:** Writing to `.hivemind/` from hooks = BLOCK violation. Only `src/lib/crud/*.ts` modules (invoked by tools) may write. [VERIFIED: gate-l3-lifecycle-integration SKILL.md]
- **Cross-root state writes:** Tools writing to `.opencode/` or hooks writing to `.hivemind/` without routing through managers = BLOCK. [VERIFIED: gate-l3-lifecycle-integration SKILL.md L67-68]
- **Placeholder modules without `@future-owner` JSDoc:** D-06 requires deferred directories have `@future-owner` annotations. Missing annotations = gap that won't be trackable. [VERIFIED: CA-04-CONTEXT.md D-06]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File locking for concurrent CRUD writes | Custom mutex/lock | OMO's `acquireLock()`/`release()` pattern (file-based lock) OR single-writer-per-process design | Multi-process environments can corrupt JSON files with concurrent writes. OMO pattern uses temp-file-then-rename atomicity + file lock. [CITED: OMO task-create.ts] |
| Atomic file writes | Direct `writeFileSync` | Write to temp file → `renameSync(tmp, target)` | If process crashes mid-write, readers get corrupt JSON. Atomic rename ensures readers see either old or new, never partial. [VERIFIED: continuity.ts L76-78] |
| JSON validation on read | Raw `JSON.parse()` without guard | Type-check parse result shape (isObject, hasFields) OR Zod schema parse | Corrupt files return garbage objects. continuity.ts uses `isParsedStore()` checks; OMO uses `typeof === "object" && !Array.isArray` guard. [VERIFIED: continuity.ts L79, OMO boulder-state/storage.ts] |
| Enum constants without runtime validation | Plain string constants | `as const` + `z.enum()` OR `export const VALID_VALUES = new Set(["a","b"])` | Runtime validation catches misconfigured imports. `as const` + `z.enum()` provides both compile-time AND runtime safety. [VERIFIED: Context7 zod docs] |
| Naming convention enforcement | Per-skill manual review | `scripts/validate-naming.ts` with regex + YAML frontmatter parse | 107 primitives is too many for manual review. Automated scan catches violations consistently. CI script makes it repeatable. [VERIFIED: hf-l2-naming-syndicate SKILL.md] |
| Lifecycle audit criteria | Ad-hoc checklists written from memory | Synthesized reference documents from ARCHITECTURE.md + live source code | gate-l3-lifecycle-integration has empty references/. Criteria must be concrete and verifiable, not subjective. [VERIFIED: gate-l3-lifecycle-integration SKILL.md L75, L91, L101] |
| `@future-consumer` annotation format | Free-form comments without convention | `@future-consumer <module> — STATUS in <phase>` format (D-09) | Machine-parseable format enables grep/generate for consumer discovery. D-09 specifies exact format. [VERIFIED: CA-04-CONTEXT.md D-09] |

**Key insight:** The `write-temp-then-renameSync` atomic write pattern is the single most important non-negotiable pattern for CRUD modules. Without it, a crash during JSON write produces a corrupted file that breaks all downstream reads. Every existing persistence module (`continuity.ts`, `delegation-persistence.ts`) and every OMO storage module uses this pattern. DO NOT write directly to target files.

---

## Runtime State Inventory

> This phase is a greenfield CRUD module creation + audit phase. It does NOT rename existing modules or migrate data. However, it formalizes de-facto ownership, which touches existing persistence paths.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `state/session-continuity.json`, `state/delegations.json`, `state/config-workflows.json` — already written by continuity.ts, delegation-persistence.ts, config-workflow. | None — formalization only. Existing paths unchanged. |
| Live service config | None — all configuration lives in git-tracked files (.hivemind/ is filesystem, not a service DB). | None |
| OS-registered state | None verified | None |
| Secrets/env vars | `OPENCODE_HARNESS_STATE_DIR`, `OPENCODE_HARNESS_CONTINUITY_FILE` — used by continuity.ts for path resolution. No change. | None — env vars read unchanged |
| Build artifacts | None affected by CRUD module additions | None |
| Agent/skill .md files | 56 shipped agents + 51 active skills in `.opencode/` — scanned for naming audit but not mutated. | Read-only scan — no writes |

**Nothing found in category affecting formalization:** CRUD modules formalize existing paths; no data migration needed. Continuity store (`session-continuity.json`, `delegations.json`) remains at canonical paths per Q6.

---

## Common Pitfalls

### Pitfall 1: Singleton Module-Level Cache Preventing Isolated Testing

**What goes wrong:** `continuity.ts:26` `let storeCache: ContinuityStoreFile | undefined` — file-level mutable state means tests can't reset the cache without module reloading. Parallel tests may observe each other's cache state.

**Why it happens:** Convenience — caching avoids repeated file reads. But the cache lives at module scope, not instance scope.

**How to avoid:** New CRUD modules should either:
- A) Avoid in-memory caching for small directory files (read-on-each-call is fine for JSON < 1MB)
- B) Encapsulate cache in a class instance, injected via constructor: `new RegistryStore({ cache: true })`

**Warning signs:** Tests that pass in isolation but fail in suite; tests that depend on file system cleanup between runs; `vi.resetModules()` calls in test setup.

### Pitfall 2: CQRS Boundary Violations (Tools vs Hooks)

**What goes wrong:** A hook directly writes to `.hivemind/` because "it's just a small write." This violates the CQRS contract (hooks = read-side observers, tools = write-side mutation authority).

**Why it happens:** Developer convenience — adding a write to an existing hook feels simpler than creating a new tool. But hooks fire on every session event; a write from a hook creates non-deterministic state changes.

**How to avoid:** Enforce `assertHookWriteBoundary()` from `hook-cqrs-boundary.ts`. CRUD modules are ONLY called from tools. If a hook needs to persist data, it routes through a tool or manager. The lifecycle audit Phase 1 explicitly checks for this.

**Warning signs:** Hook files importing `writeFileSync` or CRUD module write functions; `[Harness]` errors about "hook attempted durable write."

### Pitfall 3: Missing `@future-owner` Annotations on Deferred Directories

**What goes wrong:** A deferred directory (e.g., `hf-brain/`, `hm-brain/`) has no CRUD module but also no `@future-owner` JSDoc annotation. Future developers don't know which workstream owns it.

**Why it happens:** Deferred items are "out of scope, not my problem." But without annotations, the ownership gap is invisible.

**How to avoid:** D-06 requires `@future-owner <workstream-or-phase> — DEFERRED` on all directories that don't get a CRUD module in CA-04. A verification check in the lifecycle audit Phase 1 should scan for missing annotations.

**Warning signs:** `grep -r "hivemind.*write" src/lib/` returns files that aren't the owning module for that directory.

### Pitfall 4: Atomic Write Race Condition from Missing Unique Temp Files

**What goes wrong:** Two concurrent calls use the same temp file name → second call overwrites first call's temp before rename. Race condition produces data loss.

**Why it happens:** Using a fixed temp file name: `const tmpFile = "${filePath}.tmp"`. Two concurrent writes both write to `.tmp` before either renames.

**How to avoid:** Use unique temp names: `const tmpFile = "${filePath}.${process.pid}.${randomUUID()}.tmp"`. continuity.ts and delegation-persistence.ts already do this. [VERIFIED: continuity.ts L61, delegation-persistence.ts L72]

**Warning signs:** `replace("\.json", ".tmp")` or similar fixed-name patterns in new CRUD modules.

### Pitfall 5: Lifecycle Audit Criteria Subjective Without Synthesized Docs

**What goes wrong:** The gate skill runs its diagnostic tree on 34 modules but `references/` is empty. Verdicts become subjective ("I think this looks right") rather than criteria-driven ("check 3.2.a: module uses buildDelegationQueueKey() → PASS/FAIL").

**Why it happens:** The gate skill was authored before the criteria documents were written. The SKILL.md references `.planning/codebase/ARCHITECTURE.md` for source, but the concrete checklists don't exist yet.

**How to avoid:** D-12 mandates synthesizing 10 criteria documents before audit. Each document maps specific ARCHITECTURE.md claims to verifiable check items. Example: `references/nine-surface-authority.md` must list each of the 9 surfaces with their owning modules and mutation/observation authority rules extracted from ARCHITECTURE.md §Component Responsibilities.

**Warning signs:** Audit produces "HIGH confidence: PASS" for every module (sign of no real criteria); audit findings reference "ARCHITECTURE.md says..." rather than "Check 4.2.b: ...".

---

## Code Examples

Verified patterns from official sources and live codebase:

### DirectoryMutationTier Enum (with Zod validation)
```typescript
// Source: CA-04-CONTEXT.md D-05 + Context7 zod docs (z.enum with as const)
// File: src/lib/types.ts (addition)

export const DirectoryMutationTier = {
  CRUD: "crud",
  APPEND_ONLY: "append_only",
  READ_ONLY: "read_only",
} as const

export type DirectoryMutationTier = (typeof DirectoryMutationTier)[keyof typeof DirectoryMutationTier]

// Optional Zod schema for runtime validation:
import { z } from "zod"
export const DirectoryMutationTierSchema = z.enum([
  DirectoryMutationTier.CRUD,
  DirectoryMutationTier.APPEND_ONLY,
  DirectoryMutationTier.READ_ONLY,
])
```

### CRUD Module Pattern (continuity.ts pattern to replicate)
```typescript
// Source: src/lib/continuity.ts L1-78, L54-62, L68-77 [VERIFIED: codebase]
// Atomic write pattern used in ALL persistence modules:

const CANONICAL_DIR = resolve(process.cwd(), ".hivemind", "registries")

export function writeRegistry(name: string, data: RegistryData): void {
  const filePath = join(CANONICAL_DIR, `${name}.json`)
  mkdirSync(dirname(filePath), { recursive: true })
  // Atomic write: temp file first, then rename
  const tmpFile = `${filePath}.${process.pid}.${randomUUID()}.tmp`
  writeFileSync(tmpFile, `${JSON.stringify(data, null, 2)}\n`, "utf-8")
  renameSync(tmpFile, filePath)  // readers see old or new, never partial
}

export function readRegistry(name: string): RegistryData | null {
  const filePath = join(CANONICAL_DIR, `${name}.json`)
  if (!existsSync(filePath)) return null
  try {
    const content = readFileSync(filePath, "utf-8")
    const parsed = JSON.parse(content)
    // Validate shape before returning
    if (typeof parsed !== "object" || parsed === null || !Array.isArray(parsed.entries)) {
      return null
    }
    return parsed as RegistryData
  } catch {
    return null
  }
}
```

### CA-03 Toggle Gate Pattern (replicate for CA-04 toggle)
```typescript
// Source: CA-04-CONTEXT.md §Established Patterns (CA-03 pattern) + CA-03-CONTEXT.md D-03
// [VERIFIED: CA-03-01-SUMMARY.md]

// Hook gate (early return when toggle off):
function handleSessionLifecycleEvent(deps: HookDependencies, event: unknown): void {
  if (!deps.hivemindConfig?.workflow.cross_session_tasks_dependencies_validation) return
  // Validation logic only runs when toggle is enabled
  const sessionId = extractSessionId(event)
  validateCrossSessionTaskDependencies(sessionId)
}

// Tool defensive check:
export function executeValidateCrossSessionTasks(
  args: { sessionId: string },
  context: ToolContext
): ToolResponse {
  const config = getCachedConfig()
  if (!config.workflow.cross_session_tasks_dependencies_validation) {
    return formatToolResponse({
      message: "Cross-session task validation is disabled. Enable cross_session_tasks_dependencies_validation in configs.json.",
    })
  }
  // Proceed with validation...
}
```

### @future-consumer Annotation Update Pattern
```typescript
// Source: CA-04-CONTEXT.md D-09 [VERIFIED]
// File: src/schema-kernel/hivemind-configs.schema.ts

// BEFORE (CA-03 format):
/** @future-consumer lifecycle-manager.ts — CA-04 */
cross_session_tasks_dependencies_validation: z.boolean().default(false),

// AFTER (CA-04 updated format):
/** @future-consumer lifecycle-manager.ts — WIRED in CA-04 (hook-gate + tool-check) */
cross_session_tasks_dependencies_validation: z.boolean().default(false),

/** @future-consumer hivemind-trajectory tool — DEFERRED to WS-6 */
trajectory_control: z.boolean().default(false),
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Ad-hoc file access (any module can read/write `.hivemind/`) | Single-owner CRUD modules (`src/lib/crud/*.ts`) | CA-04 (2026-05) | Enforced ownership, no direct fs access outside CRUD modules |
| Unstructured `@future-consumer` annotations | `@future-consumer <module> — STATUS` format with WIRED/DEFERRED | CA-04 (2026-05) | Machine-parseable, grep-able consumer tracking |
| De-facto ownership (continuity.ts owns state/, delegation-persistence.ts owns delegation-managements/) | Formalized ownership with tier constants and typed CRUD functions | CA-04 (2026-05) | Tier-aware, audit-able, enforcing mutation authority at module level |
| Empty gate criteria references | Synthesized 10 criteria documents from ARCHITECTURE.md | CA-04 (2026-05) | Lifecycle audits produce criteria-driven PASS/FAIL, not subjective judgement |
| Manual naming convention review | Automated CI script with regex + YAML frontmatter parsing | CA-04 Layer 2 (2026-05) | Repeatable, consistent, no human error in prefix checks |

**Deprecated/outdated:**
- Direct `fs` module imports in hooks — replaced by routing through CRUD modules
- `@future-consumer <module> — CA-04` format — replaced by status-qualified format (D-09)
- Ad-hoc lifecycle "code smell" lists — replaced by synthesized criteria documents with explicit check items

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | CRUD modules placed in `src/lib/crud/` subdirectory rather than flat in `src/lib/` — based on CONTEXT.md suggestion to avoid bloating `plugin.ts` toward 500 LOC cap | Recommended Project Structure | Low — alternative is flat structure; either works, but subdirectory provides organizational clarity |
| A2 | `naming-validator.ts` placed in `src/lib/` rather than `scripts/` — based on TypeScript project conventions and desire for type-safe validation | Architecture Patterns (Pattern 6) | Low — `scripts/validate-naming.sh` (D-15) is the alternative; either works, but TS provides Zod validation |
| A3 | OMO's `acquireLock()`/`release()` pattern is unnecessary for single-process `opencode-harness` — process isolation via unique temp file names is sufficient | Don't Hand-Roll | Medium — if the harness ever runs multi-process (e.g., multiple plugin instances), concurrent writes to same JSON file would require locking |
| A4 | 6 CRUD-owner modules fixed in Phase 2 cover the full lifecycle audit scope — based on D-11 listing | Architecture Patterns (Pattern 5) | Low — D-11 explicitly scopes Phase 2 to these 6 modules; if audit surfaces blocking issues in other modules, they're deferred per D-13 |
| A5 | All 34 `src/lib/` modules are discoverable via glob for lifecycle audit Phase 1 — based on ARCHITECTURE.md §Library Layer listing 34 modules | Architecture Patterns (Pattern 5) | Low — glob `src/lib/**/*.ts` covers all; already verified by 1604 passing tests covering 90.49% [VERIFIED: STATE.md] |

---

## Open Questions

1. **CRUD module directory structure: `src/lib/crud/` vs flat `src/lib/`?**
   - What we know: CONTEXT.md suggests `src/lib/crud/` to keep `plugin.ts` under 500 LOC. `continuity.ts` and `delegation-persistence.ts` currently live in flat `src/lib/`.
   - What's unclear: Whether existing CRUD modules should move to `src/lib/crud/` or stay in `src/lib/` and only new modules go to the subdirectory.
   - Recommendation: Move all CRUD modules to `src/lib/crud/` with barrel export at `src/lib/crud/index.ts`. Update imports in `plugin.ts` and all consumers. This provides the clearest architectural boundary and keeps `plugin.ts` lean.

2. **Lifecycle audit Phase 1: gate skill or manual script?**
   - What we know: D-10 says "using synthesized gate-l3-lifecycle-integration criteria." The gate skill's decision tree ($L119-130) provides classification logic. But the skill requires loaded context (references/) that doesn't exist yet.
   - What's unclear: Whether to run the gate skill as a loaded agent (requiring OpenCode runtime) or implement the audit as a standalone TypeScript script that applies the same criteria mechanically.
   - Recommendation: Implement as a standalone script (`scripts/audit-lifecycle.ts`) that applies the synthesized criteria mechanically. The gate skill can remain as the human-oriented version. This avoids the circular dependency of needing the skill to audit the modules that the skill evaluates.

3. **Zod schema inclusion for CRUD module data shapes?**
   - What we know: `delegation-persistence.ts` uses type guards but no Zod schemas for its data. `continuity.ts` uses runtime shape checks (`isParsedStore()`, `normalizeContinuityRecord()`). OMO's `task-create.ts` uses full Zod schemas (`TaskCreateInputSchema`, `TaskObjectSchema`).
   - What's unclear: Whether to add Zod schemas to existing CRUD modules or keep the existing runtime shape checks.
   - Recommendation: Add minimal Zod schemas for CREATE operations (validation on write). READ operations can use lighter runtime checks since data was validated on write. This follows OMO's proven pattern and doesn't require rewriting existing modules.

4. **Cross-lineage loading violation: runtime enforcement or report-only?**
   - What we know: D-17 says "detected in the scan but NOT auto-fixed." Integration contracts D-AD-01 says hm-* loading hf-* = violation.
   - What's unclear: Whether the naming audit report severity should block downstream planning or just flag.
   - Recommendation: Report as HIGH-severity findings per D-17. No auto-fixes. Add to STATE.md as tracked gap. If violations are structural (hm-* agent has hf-* skill in its consumed-by list), flag as BLOCK for that agent's correctness but don't break CI.

---

## Environment Availability

> SKIPPED — No external dependencies beyond what's already installed. CRUD modules use existing Node.js built-ins (fs, path, crypto). Lifecycle audit uses existing ARCHITECTURE.md as source. Naming validation uses existing skill rules and YAML frontmatter parsing (already done by OpenCode's agent loader).

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All CRUD modules | ✓ | v20+ [VERIFIED: project requirement] | — |
| Zod | Schema validation | ✓ | v4.x (in package.json) | — |
| TypeScript | Type checking | ✓ | strict mode (in tsconfig.json) | — |

**No missing dependencies.**

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (project standard) |
| Config file | `vitest.config.ts` (globals: true, coverage: `src/**/*.ts`) |
| Quick run command | `npx vitest run tests/lib/` |
| Full suite command | `npm test` (1604 tests, 90.49% coverage) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-CRUD-01 | Each CRUD module exports typed functions matching its tier | unit | `npx vitest run tests/lib/crud/` | ❌ Wave 0 |
| REQ-CRUD-02 | `DirectoryMutationTier` enum validates via Zod | unit | `npx vitest run tests/lib/types.test.ts` | ❌ Wave 0 |
| REQ-TOGGLE-01 | Hook gate returns early when toggle is `false` | integration | `npx vitest run tests/hooks/` | ❌ Wave 0 |
| REQ-TOGGLE-02 | `@future-consumer` annotations match D-09 format | unit | `npx vitest run tests/schema-kernel/` | ❌ Wave 0 |
| REQ-AUDIT-01 | Synthesized criteria docs exist in gate references/ | verification | `ls .opencode/skills/gate-l3-lifecycle-integration/references/` | ❌ Wave 0 |
| REQ-AUDIT-02 | Audit script produces PASS/FAIL per module without code changes | verification | `npx tsx scripts/audit-lifecycle.ts` | ❌ Wave 0 |
| REQ-AUDIT-03 | 6 CRUD-owner modules pass lifecycle after Phase 2 fixes | integration | `npx vitest run tests/lib/` (existing suite) | ✅ Exists (partial) |
| REQ-NAMING-01 | Naming scan covers all 56 agents + 51 skills | verification | `npx tsx scripts/validate-naming.ts --all` | ❌ Wave 0 |
| REQ-NAMING-02 | CI script validates 44 sample primitives and exits 0 on PASS | unit | `npx vitest run tests/lib/naming-validator.test.ts` | ❌ Wave 0 |
| REQ-NAMING-03 | Cross-lineage violations detected | unit | `npx vitest run tests/lib/naming-validator.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/lib/crud/ --reporter=verbose`
- **Per wave merge:** `npm test` (full suite, 1604+ tests)
- **Phase gate:** Full suite green + audit scripts pass + CA-04-LIFECYCLE-AUDIT.md has 0 HIGH on 6 fixed modules

### Wave 0 Gaps
- [ ] `tests/lib/crud/` — test directory for CRUD modules (create, read, update, delete, append, tier enforcement)
- [ ] `tests/lib/crud/state.test.ts` — covers continuity.ts formalization REQ-CRUD-01
- [ ] `tests/lib/crud/registries.test.ts` — covers new registry CRUD module
- [ ] `tests/lib/naming-validator.test.ts` — covers naming CI script REQ-NAMING-02/03
- [ ] `tests/schema-kernel/toggle-annotations.test.ts` — verifies @future-consumer format REQ-TOGGLE-02
- [ ] `tests/hooks/lifecycle-toggle-gate.test.ts` — toggle gate integration REQ-TOGGLE-01
- [ ] Framework install: `npm install` — already installed, no new deps needed
- [ ] `scripts/audit-lifecycle.ts` — lifecycle audit script
- [ ] `scripts/validate-naming.ts` — naming validation CI script

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | N/A — internal plugin, no external auth |
| V3 Session Management | Partial | Session ID validation in CRUD modules (existing assertValidSessionID pattern) |
| V4 Access Control | Yes | D-CRUD-05: one module per directory — enforced by convention; `assertPathWithinRoot()` prevents directory traversal |
| V5 Input Validation | Yes | Zod schemas on all CRUD write operations; JSON parse guards on read |
| V6 Cryptography | No | No cryptographic operations in CRUD modules |
| V7 Error Handling | Yes | `[Harness]` error prefix; quarantine-on-corruption; try/catch around all file I/O |
| V8 Data Protection | Yes | Deep-clone-on-read prevents mutation aliasing; atomic writes prevent corruption; `redactBoundaryFields()` for sensitive output |

### Known Threat Patterns for File-System State Management

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal (user-supplied filename reaches outside `.hivemind/`) | Tampering | `assertPathWithinRoot()` validates all paths before file operations [VERIFIED: src/lib/security/path-scope.ts] |
| JSON injection via unvalidated write input | Tampering | Zod schema validates all write inputs before serialization |
| Corrupt state from crash during write | Denial of Service | Atomic write (temp-file-then-renameSync) ensures readers see old or new, never partial |
| Information disclosure via error messages | Information Disclosure | `[Harness]` prefix abstracts internal paths; `redactBoundaryFields()` strips sensitive data |
| Concurrent write race condition | Tampering | Unique temp file names (`process.pid.randomUUID().tmp`); single-process model limits concurrent writers |
| Mutation aliasing from shared references | Tampering | Deep-clone-on-read ensures callers can't mutate cached store through returned reference |

---

## Sources

### Primary (HIGH confidence)
- [Context7] `/websites/zod_dev` — `z.enum()` with `as const` pattern, schema validation [VERIFIED: 2026-05-07]
- [Context7] `/websites/opencode_ai_plugins` — `tool()` factory, `hook()` registration, plugin composition patterns [VERIFIED: 2026-05-07]
- [Codebase] `src/lib/continuity.ts` (465 LOC) — established CRUD pattern: typed read/write/patch, deep-clone, atomic write, quarantine [VERIFIED: live codebase]
- [Codebase] `src/lib/delegation-persistence.ts` (197 LOC) — `persistX()`/`readX()` pair pattern, toggle gate [VERIFIED: live codebase]
- [Codebase] `.planning/codebase/ARCHITECTURE.md` (328 LOC) — 9-surface authority table, CQRS boundaries, dependency graph [VERIFIED: live codebase]
- [Codebase] `.opencode/skills/gate-l3-lifecycle-integration/SKILL.md` (209 LOC) — lifecycle gate criteria, anti-pattern catalog, decision tree [VERIFIED: live codebase]
- [Codebase] `.opencode/skills/hf-l2-naming-syndicate/SKILL.md` (313 LOC) — prefix lineage rules, domain-function pattern [VERIFIED: live codebase]
- [Codebase] `.opencode/skills/hm-l3-integration-contracts/SKILL.md` (380 LOC) — D-AD-01 cross-lineage rules, orphan detection [VERIFIED: live codebase]
- [Codebase] `src/schema-kernel/hivemind-configs.schema.ts` (392 LOC) — @future-consumer annotations, toggle defaults [VERIFIED: live codebase]

### Secondary (MEDIUM confidence)
- [External Repo] `code-yeongyu/oh-my-openagent` — OMO boulder-state/storage.ts: `readBoulderState()`/`writeBoulderState()`/`appendSessionId()`/`upsertTaskSessionState()` CRUD pattern with JSON serialization. OMO task-create.ts: `writeJsonAtomic()` + `acquireLock()` + Zod validation. [CITED: raw.githubusercontent.com, 2026-05-07]
- [External Repo] `code-yeongyu/oh-my-openagent` `src/tools/task/` — typed CRUD module organization with per-file JSON storage, task-create/get/list/update separation [CITED: zread.ai/repo-structure, 2026-05-07]
- [Documentation] `docs/proposals/VALIDATION-DECISIONS-2026-04-25.md` — Q2 (sidecar READ-ONLY), Q3 (journal append-only), Q6 (`.hivemind/` state root) [VERIFIED: project docs]

### Tertiary (LOW confidence)
- Naming validation Layer 2 CI script design (derived from skill rules, not yet validated against real primitives)
- OMO `acquireLock()`/`release()` pattern appropriateness for single-process harness (assumed unnecessary — A3)
- Integration of CRUD module tests into existing 1604-test suite without breaking coverage thresholds (90.49% target)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all core libraries already in project; Zod enum pattern verified via Context7; Node.js built-ins are stable
- Architecture: HIGH — established patterns from continuity.ts and OMO are well-understood; ARCHITECTURE.md and gate skill provide detailed criteria
- Pitfalls: HIGH — all pitfalls verified against live codebase (ARCHITECTURE.md §Anti-Patterns) and gate skill (CQRS boundaries, cross-root writes)
- External ecosystem: MEDIUM — OMO patterns verified from source; broader ecosystem patterns (awesome-opencode) not exhaustively surveyed

**Research date:** 2026-05-07
**Valid until:** 2026-06-07 (30 days — stable domain, internal patterns unlikely to change)
