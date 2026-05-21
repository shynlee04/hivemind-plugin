# commit_docs Config Field Investigation

**Date:** 2026-05-21
**Status:** COMPLETE
**Author:** gsd-researcher
**Context:** The user does not remember creating `commit_docs` and suspects it is being misused as a gate for delegation persistence.

---

## 1. All References (Source Code Only)

### Source Files (src/)

| File | Line | Role |
|------|------|------|
| `src/schema-kernel/hivemind-configs.schema.ts` | 282 | **DEFINITION**: `commit_docs: z.boolean().default(true)` — no JSDoc, no comment |
| `src/task-management/continuity/delegation-persistence.ts` | 59-64 | **ONLY RUNTIME CONSUMER**: gates `persistDelegations()` with `if (!config.commit_docs) return` |

### Test Files

| File | Lines | Role |
|------|-------|------|
| `tests/lib/delegation-persistence.test.ts` | 141-222 | 3 tests: true→writes, false→skips, defaults→true |
| `tests/schema-kernel/hivemind-configs.schema.test.ts` | 254, 278, 320-327, 414, 474, 563 | Default value and parsing validation |
| `tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts` | 58 | Included in mock config (passive) |
| `tests/lib/config-subscriber.test.ts` | 139 | Asserts property exists |
| `tests/schema-kernel/generate-config-json-schema.test.ts` | 66, 92 | Verifies JSON schema generation |

### Config Files

| File | Value |
|------|-------|
| `.hivemind/configs.json` | `commit_docs: true` (runtime) |
| `.planning/config.json` | `commit_docs: true` (legacy GSD planning) |
| `.hivemind/configs.schema.json` | `{ "type": "boolean", "default": true }` — no description field |

### External GSD Framework (`.opencode/`) — INTENDED TRUE CONSUMERS

**162 matches** across `.opencode/get-shit-done/workflows/`. Key pattern:
- **`COMMIT_DOCS=$(gsd-sdk query config-get commit_docs 2>/dev/null || echo "true")`** — used in `execute-phase.md`, `plan-phase.md`, `quick.md`, `spec-phase.md`, `complete-milestone.md`, `docs-update.md`, and 15+ other workflow files
- **Controls whether `.planning/` documentation files are committed to git**: `# Only amend the commit with .planning/ files if commit_docs is enabled (#1783)`
- `.opencode/get-shit-done/workflows/settings.md:51` documents it: `"commit_docs — whether .planning/ files are committed to git (default: true if absent)"`
- `.opencode/get-shit-done/agents/gsd-executor.md:66` and other agent definitions pass `commit_docs` from init JSON

**These are NOT part of the Hivemind npm package.** They are GSD framework (soft meta-concepts) that configures OpenCode agent behavior.

---

## 2. Origin Trace

### Schema Definition

```typescript
// src/schema-kernel/hivemind-configs.schema.ts:282
commit_docs: z.boolean().default(true),
```

**No JSDoc. No comments.** The field is defined as a bare Zod entry alongside `parallelization` and `atomic_commit`, grouped as "execution field" toggles. The only nearby question-answering context comes from:

**`src/task-management/continuity/delegation-persistence.ts:59-60`:**
```typescript
// CA-03: commit_docs toggle gate (D-16)
// When false, document auto-commit is skipped.
```

The comment itself reveals the **category error**: it says "document auto-commit is skipped" but the code gates **delegation persistence** (writing `delegations.json`), not document committing.

### Design History (from CA-03 archived planning)

The CA-03 phase ("Workflow Toggle Runtime Binding") explicitly designed `commit_docs` as execution field **D-16**:

- `CA-03-RESEARCH.md:168`: The consumer table maps `commit_docs` → `delegation-persistence.ts` → `persistDelegations()` → "Document auto-commit skipped"
- `CA-03-CONTEXT.md:58`: **"D-16:** `commit_docs` → consumed by `.hivemind/` document persistence to toggle auto-commit of documentation artifacts."
- `CA-03-02-PLAN.md:284-306`: Explicit implementation plan wiring `commit_docs` as a toggle gate in `persistDelegations()`

**Conclusion: The delegation-persistence gate was DESIGNED intentionally, not accidental.** However, it was a **design error**: the CA-03 plan conflated "persisting delegation records to disk" with "committing documentation artifacts to git." These are semantically different operations.

### Original Event Tracker Consumer (Defunct)

`CP-ST-01-SPEC.md:13` mentions: the old `event-tracker` "is gated by a `commit_docs` toggle." The event tracker was **removed in Phase 18** (source directory `src/task-management/journal/event-tracker/` no longer exists). This was likely the original intended runtime consumer before CA-03 rewired it.

---

## 3. Consumer Map (Runtime Only)

### The SOLE runtime consumer in `src/`

```
src/task-management/continuity/delegation-persistence.ts:58-64
│
├── Called by: src/coordination/delegation/state-machine.ts:218, 394
│   └── persistDelegations(Array.from(this.delegations.values()))
│
└── Called by: src/coordination/delegation/retry-handler.ts:23
    └── DelegationRetryHandler uses persistDelegations via option injection
```

**No other `src/` file reads `commit_docs`.** The field is defined in the schema, validated in tests, and consumed by exactly ONE function that gates exactly ONE behavior: writing `delegations.json` to disk.

### External Consumers (GSD Framework, NOT in `src/`)

162+ references in `.opencode/` workflows and agents that use `commit_docs` to decide whether to `git commit` `.planning/` documentation files. These are outside the Hivemind npm package and not part of this investigation's scope — but they confirm that the name `commit_docs` matches the GSD framework's intended meaning: "commit docs to git."

---

## 4. Original Purpose

| Source | Stated Purpose | Actual Behavior |
|--------|---------------|-----------------|
| Field name (`commit_docs`) | "Commit docs to git" | Gating delegation persistence |
| CA-03 D-16 design | "Document auto-commit" | Delegation persistence gate |
| GSD workflows | "Commit .planning/ to git" | Git operations on docs |
| Old event-tracker | "Gate event tracker output" | Was event tracker gate (deleted) |
| Delegation-persistence comment | "document auto-commit is skipped" | Skips delegations.json write |

**The original purpose is ambiguous** because:
1. The GSD framework (external) uses it correctly for its name — controlling git commits of planning docs
2. The Hivemind harness (internal) abuses it as a delegation persistence gate
3. The old event-tracker (now deleted) used it for yet another purpose

**What it SHOULD control** (by name): Whether documentation/planning artifacts are committed to git.

**What it ACTUALLY controls** (in `src/`): Whether delegation records are written to `.hivemind/state/delegations.json`.

---

## 5. Delegation-Persistence Abuse Assessment

### Is this the ONLY use?

**Yes.** There is NO other runtime code in `src/` that reads or branches on `commit_docs`. The delegation-persistence gate is the sole consumer.

### What happens if we remove the check?

If `config.commit_docs` is removed from `delegation-persistence.ts:62`:

```typescript
// Current (lines 58-64):
export function persistDelegations(delegations: Delegation[]): void {
  // CA-03: commit_docs toggle gate (D-16)
  const config = getCachedConfig()
  if (!config.commit_docs) {
    return  // Skip document persistence
  }
  // ... writes to disk ...
```

→ **`persistDelegations()` always writes to disk.** No config gate.
→ **Zero regression risk.** The `commit_docs` field in config is simply ignored (for this purpose).
→ **3 tests break** in `tests/lib/delegation-persistence.test.ts` (the commit_docs toggle tests) — they need updating.

### What SHOULD gate delegation persistence?

Option A: **No gate at all** — delegation persistence is a core reliability concern. Writing delegation records to disk is cheap (one file overwrite, atomic rename). There is no performance reason to skip it. Removing the gate makes the system more reliable by default.

Option B: **A new `persist_delegations` config field** — if users genuinely need to disable delegation persistence (e.g., CI environments, ephemeral sessions), add a semantically accurate config field.

Option C: **The existing `delegation_systems` field** — this is already defined in the schema but marked as DEAD (zero consumers). However, `delegation_systems` is about delegation DISPATCH (whether to use native_task/delegate_task/background_delegation), not about persistence. Patching this to also gate persistence would be another category error.

**Recommended: Option A** — remove the gate entirely. Delegation persistence is a system reliability feature, not a configurable toggle. If a future need for opt-out arises, add `persist_delegations` then.

---

## 6. Recommendation

### Should `commit_docs` remain as a config field?

**Yes, but only if the GSD framework (external) needs it.** Within the Hivemind harness (`src/`), `commit_docs` has NO valid consumer after removing the delegation-persistence gate. However:

- The GSD framework actively uses `commit_docs` via `gsd-sdk query config-get commit_docs` across 20+ workflows
- Removing it from the schema would break GSD framework operation
- The schema field costs nothing (1 line, no runtime overhead when consumers are removed)

### Decision Table

| Action | Files affected | Risk | Benefit |
|--------|---------------|------|---------|
| **(A) Remove gate, keep field** | `delegation-persistence.ts` + 1 test file | Low — always persist | Fixes category error, restores delegation persistence |
| **(B) Add `persist_delegations` field** | Schema + delegation-persistence + tests | Low — new field | Semantic accuracy, explicit opt-out |
| **(C) Remove field entirely** | Schema + 6 test files + GSD external | HIGH — breaks GSD | Clean slate |
| **(D) Do nothing** | 0 | HIGH — footgun continues | 0 |

### Recommended Action

**Implement Option A immediately (P21 scope):**
1. Remove the `commit_docs` gate from `src/task-management/continuity/delegation-persistence.ts:58-64`
2. Delete or modify the 3 `commit_docs` toggle tests in `tests/lib/delegation-persistence.test.ts:140-222`
3. Keep the schema field for external GSD framework use
4. If a user request for opt-out emerges later, add `persist_delegations: z.boolean().default(true)` to the schema

**Defer resolution of this gray area (G-4):** The prior `session-tracker-gray-areas-investigation` already identified this as G-4 needing human decision on the config key name if Option B is chosen. Option A sidesteps this entirely.

### Summary

```
commit_docs was designed (CA-03, D-16) to gate "document auto-commit"
but was wired to delegation persistence instead of git operations.
The field name is correct for its INTENDED purpose (GSD framework uses it for git commits).
The field behavior is WRONG for its ACTUAL consumer (gates delegation persistence).
→ Fix: Remove the gate from delegation-persistence. Keep the schema field for GSD.
```
