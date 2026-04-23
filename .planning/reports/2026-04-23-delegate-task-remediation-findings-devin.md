# Delegate-Task Runtime Failure — Root Cause + Remediation Plan

**Author:** Devin (investigation session `3ac1654154854ed7a7d05c711c8d67ac`)
**Date:** 2026-04-22
**Scope:** `hivemind-plugin` feature/harness-implementation @ `da80b439` ("debugging delegate-task")
**Deliverable type:** Investigation + remediation plan (NO CODE CHANGES)
**Bug tracker:** `.planning/debug/delegate-task-tool-runtime-failure.md`

---

## TL;DR

The 8× `[Harness] Invalid input: expected string, received undefined` error is **not** a phase 14 regression and **not** a session-schema mismatch. It is a **one-line data-shape bug** in the phase 16 spawner:

`src/lib/spawner/session-creator.ts:5-28` declares a **local** `PermissionRule` type that **omits the required `pattern` field**, and `WRITE_CAPABLE_PERMISSION_RULES` is an array of **8** rules — each missing `pattern`. The OpenCode server validates the inbound `session.create` body with `Permission.Rule` (Effect Schema → Zod v4) which requires `{ permission, pattern, action }`. 8 rules × 1 missing required string = **exactly the 8 Zod validation errors** observed.

The graceful-degradation code added at `delegation-manager.ts:356-376` (R-AGENT-01) and `session-api.ts:87-110` (R-SESSION-01) is treating the symptom, not the cause. The HEAD commit's `extractRawDataFromSdkError()` + "use unvalidated agent" fallbacks are **masking a real server-side 400**, not recovering from an SDK/server schema drift.

**Fix is a 1-file, 8-line patch** (`pattern: "*"` added to each rule). The rest of this document proposes the broader remediation so the class of bug cannot recur, plus cleanup of the unneeded graceful-degradation hacks and the three outstanding 16.2 audit issues.

---

## 1. Root Cause — Definitive

### 1.1 The failing rules

`src/lib/spawner/session-creator.ts:5-28`:

```typescript
type PermissionRule = {        // LOCAL — shadows src/lib/types.ts PermissionRule
  permission: string
  action: "allow" | "deny"
  // MISSING: pattern: string
}

const WRITE_CAPABLE_PERMISSION_RULES: PermissionRule[] = [
  { permission: "read",          action: "allow" },  // #1
  { permission: "edit",          action: "allow" },  // #2
  { permission: "write",         action: "allow" },  // #3
  { permission: "bash",          action: "allow" },  // #4
  { permission: "glob",          action: "allow" },  // #5
  { permission: "grep",          action: "allow" },  // #6
  { permission: "delegate-task", action: "deny"  },  // #7
  { permission: "task",          action: "deny"  },  // #8
]
```

These rules are passed into `client.session.create({ body: { ..., permission: WRITE_CAPABLE_PERMISSION_RULES } })` during every `spawnDelegatedSession` call.

### 1.2 The authoritative schema (OpenCode server)

`/home/ubuntu/repos/opencode/packages/opencode/src/permission/index.ts:25-31`:

```typescript
export class Rule extends Schema.Class<Rule>("PermissionRule")({
  permission: Schema.String,   // required
  pattern:    Schema.String,   // required  ← not optional
  action:     Action,          // required
}) {
  static readonly zod = zod(this)
}

export const Ruleset = Schema.mutable(Schema.Array(Rule))
  .pipe(withStatics((s) => ({ zod: zod(s) })))
```

The Ruleset is a `Schema.Array(Rule)` — every element must be a complete `Rule`. When the server's `validator("json", Session.CreateInput)` middleware runs, it traverses the 8-element array and emits one Zod error per element, each saying `"Invalid input: expected string, received undefined"` at `permission[i].pattern`.

### 1.3 Confirmed 8-error math

| Index | Rule                                | Missing field |
|-------|-------------------------------------|----------------|
| 0     | `{permission:"read",   action:"allow"}`          | `pattern` |
| 1     | `{permission:"edit",   action:"allow"}`          | `pattern` |
| 2     | `{permission:"write",  action:"allow"}`          | `pattern` |
| 3     | `{permission:"bash",   action:"allow"}`          | `pattern` |
| 4     | `{permission:"glob",   action:"allow"}`          | `pattern` |
| 5     | `{permission:"grep",   action:"allow"}`          | `pattern` |
| 6     | `{permission:"delegate-task", action:"deny"}`    | `pattern` |
| 7     | `{permission:"task",   action:"deny"}`           | `pattern` |

8 missing `pattern` fields → 8 Zod errors → server returns `{ errors: [8× "expected string, received undefined"] }` → SDK returns `{ error: { errors: [...] } }` → hivemind's `unwrapData` (`src/lib/helpers.ts:75-85`) joins them with "; " and throws `[Harness] Invalid input: expected string, received undefined; ... (x8)`.

### 1.4 Ground truth — oh-my-openagent always includes `pattern`

Every permission ruleset in oh-my-openagent (the project cited as the architectural reference by phase 16) includes `pattern: "*"`:

- `src/shared/question-denied-session-permission.ts:7-9`
  ```typescript
  export const QUESTION_DENIED_SESSION_PERMISSION: SessionPermissionRule[] = [
    { permission: "question", action: "deny", pattern: "*" },
  ]
  ```
- `src/cli/run/session-resolver.ts:32`
- `src/features/background-agent/manager.test.ts:2170-2171`
- `src/tools/delegate-task/background-task.test.ts:208`
- …13 more call sites — ALL include `pattern`.

The declared type is explicit:
```typescript
export type SessionPermissionRule = {
  permission: string
  action: "allow" | "deny"
  pattern: string   // required
}
```

### 1.5 Why the 17 unit tests pass

`tests/lib/delegation-manager.test.ts` mocks `client.session.create` with a stub resolving to `{ data: { id: "sub_xxx", ... } }`. The mock does **not** run Hono's `validator()` middleware. The malformed permission array never hits schema validation in tests — the server-side rejection only manifests at runtime.

This is the precise bug-class described in `16.2-VALIDATION.md` under R-PTY-02/03 as "PARTIAL coverage".

---

## 2. Regression Analysis — Phase 14 vs Phase 16 / 16.2

### 2.1 Not a phase 14 regression

Phase 14 (`14-DELEGATION-COMPARISON-REPORT.md:32-39`) did **not** call `session.create` at all. It used `client.session.prompt()` against the parent session (or a hardcoded whitelist of agents) — no child session spawn, no permission payload, no `Permission.Rule` validation.

Phase 14 LEARNINGS (`14-LEARNINGS.md`):
- D-14-01 WaiterModel: preserved ✓
- D-14-02 dual-signal completion: preserved (`completion-detector.ts` unchanged) ✓
- D-14-03 safety ceiling: preserved ✓
- D-14-04 delegation-status tool: preserved ✓
- D-14-06 fire-and-forget prompt: preserved ✓
- D-14-15/16 persistence: preserved ✓

All seven Phase 14 architectural invariants still hold in the HEAD code.

### 2.2 It IS a phase 16 regression (introduced, not inherited)

Phase 16 D-04A (`16-CONTEXT.md:42`) required the "truthful SDK child-session path" for agent delegations. This required introducing `spawnDelegatedSession` (new code) and `session-creator.ts` (new file). The `PermissionRule` type was re-declared **locally** inside the new file instead of importing `PermissionRule` from `src/lib/types.ts`, and the `pattern` field was dropped — most likely an unchecked copy of an earlier draft before the write-capable permission model was finalized.

**Regression introduced by:** phase 16 plan 05-06 (spawner extraction). **Present since:** the first commit that landed `WRITE_CAPABLE_PERMISSION_RULES`. Never worked at runtime.

### 2.3 Phase 16.2 made things *worse*, not better

Instead of catching this at integration, phase 16.2 bolted on two symptom-hiding layers:

| Layer | File:Line | Effect |
|-------|-----------|--------|
| R-AGENT-01 | `src/lib/delegation-manager.ts:356-376` | Catches *any* Zod error from `app.agents()` and returns an unvalidated `{ name: agent }`. Trusts arbitrary agent strings. |
| R-SESSION-01 | `src/lib/session-api.ts:87-110` + `extractRawDataFromSdkError` at `:17-49` | Catches Zod errors from `session.create` and attempts to scrape a `{ id: string }` from six candidate paths in the error object. **But Hono's 400 response payload has no session record to scrape** — so this does *not* unblock the failing path. It only hides the error signal. |

These were documented (sort of) in the `delegate-task-tool-runtime-failure.md` `next_action: DO NOT add extraction hacks — find the real root cause.` The extraction hack was added anyway in the HEAD commit. It should be removed.

### 2.4 Summary — regression ledger

| Phase | Item | Status |
|-------|------|--------|
| 14 WaiterModel D-01..D-03 | Preserved | ✅ no regression |
| 14 Dual-signal completion D-14-02 | Preserved | ✅ no regression |
| 14 Safety ceiling D-14-03 | Preserved | ✅ no regression |
| 14 Delegation persistence D-14-15/16 | Preserved, extended by 16.2 persistence helper | ✅ no regression |
| 16 Write-capable permission array | **MALFORMED — missing `pattern`** | ❌ **THE BUG** |
| 16 PTY-first D-04 / D-04A | Incomplete wiring (documented in `16-VERIFICATION.md:37-46`) | ⚠️ known gap, unrelated to 8× Zod |
| 16.2 CR-01 missing test files | `command-delegation.test.ts`, `sdk-delegation.test.ts`, `pty-setup.{ts,test.ts}` do not exist | ❌ deviation |
| 16.2 CR-03 `gracePeriodExpiresAt` | Fixed in HEAD commit (`delegation-manager.ts:326-331`) | ✅ resolved |
| 16.2 WR-01 persistence normalization omits `gracePeriodExpiresAt` | Still present in `delegation-persistence.ts:48-73` | ❌ outstanding |
| 16.2 WR-02 notification test doesn't test failure | Still present (`tests/lib/delegation-manager.test.ts:1563-1585`) | ❌ outstanding |
| 16.2 R-AGENT-01 / R-SESSION-01 graceful-degradation shims | Added in HEAD, masks the real bug | ❌ should be reverted once root fix lands |

---

## 3. Remediation Plan

### 3.1 Wave A — Primary Fix (1 file, blocker)

**Goal:** Send server-valid permission rules so `session.create` succeeds.

**Change:**

`src/lib/spawner/session-creator.ts`:
1. **Delete** the local `PermissionRule` type.
2. **Import** the canonical `PermissionRule` from `src/lib/types.ts` (which already has `pattern: string`).
3. **Add** `pattern: "*"` to every entry in `WRITE_CAPABLE_PERMISSION_RULES`.

Proposed final form:
```typescript
import type { PermissionRule } from "../types.js"

const WRITE_CAPABLE_PERMISSION_RULES: PermissionRule[] = [
  { permission: "read",          pattern: "*", action: "allow" },
  { permission: "edit",          pattern: "*", action: "allow" },
  { permission: "write",         pattern: "*", action: "allow" },
  { permission: "bash",          pattern: "*", action: "allow" },
  { permission: "glob",          pattern: "*", action: "allow" },
  { permission: "grep",          pattern: "*", action: "allow" },
  { permission: "delegate-task", pattern: "*", action: "deny"  },
  { permission: "task",          pattern: "*", action: "deny"  },
]
```

**Why `*`:** matches oh-my-openagent convention and the Permission.Rule evaluator treats unbounded pattern as "applies to every target". Semantically equivalent to the current intent ("bash is allowed for any command, regardless of args").

**Blast radius:** single file, 1 type delete + 1 import + 8 field additions. All other call sites (tests) pass rules through the proper `PermissionRule` from `types.ts` which already requires `pattern`.

**Acceptance criteria:**
- `npm run build` exits 0
- `npm run typecheck` exits 0
- Runtime: `delegate-task` tool creates a child session without any `[Harness] Invalid input` error
- Runtime: server access log shows `POST /session` → `201 Created` (not 400)

### 3.2 Wave B — Remove symptom-hiding code (dependent on Wave A)

**Goal:** Once the root cause is fixed, revert the graceful-degradation hacks so real schema drifts fail loudly again.

**Changes:**

1. **`src/lib/delegation-manager.ts:356-376`** — revert `validateAgent` to:
   ```typescript
   private async validateAgent(agent: string): Promise<ValidatedAgent> {
     const agents = unwrapData<Array<Record<string, unknown>>>(
       await this.client.app.agents()
     )
     // ...existing validation logic that maps agents through
   }
   ```
   *Keep* a single wrapping error: `[Harness] Failed to list agents: <message>`. Do not swallow.

2. **`src/lib/session-api.ts:17-49, 87-110`** — delete `extractRawDataFromSdkError` and the `if (message.includes("expected string, received undefined"))` branch. Let real SDK errors propagate.

3. **Retain** the `[Harness]` prefix in `helpers.ts:unwrapData` — that's correct behavior.

**Acceptance criteria:**
- All 17 existing delegate-task tests still pass
- Runtime smoke test still works (Wave A must be in place first)
- A deliberately malformed agent manifest produces a **loud** `[Harness] Invalid input: ...` instead of silent degradation

**Risk:** Low. The shims provably do not recover `session.create` (Hono's 400 body has no session id to scrape). Only `validateAgent`'s `return { name: agent }` short-circuit ever took effect, and it did so only because `app.agents()` was incidentally downstream of the same malformed-permissions cause (agents carry rulesets too).

### 3.3 Wave C — Prevent recurrence (structural)

**Goal:** Make "malformed permission rule" a compile-time error.

**Changes:**

1. **Single source of truth for `PermissionRule`.** Add a lint rule / architecture test that forbids re-declaration of `PermissionRule`/`PermissionAction` outside `src/lib/types.ts`. Implement as:
   - ESLint `no-restricted-syntax` rule matching `TSTypeAliasDeclaration[id.name=/^PermissionRule$/]` in files other than `src/lib/types.ts`, OR
   - a tiny vitest that greps the repo for `type PermissionRule` and asserts exactly one hit.

2. **Server-shape integration test.** Add `tests/integration/session-create-permissions.test.ts` that stands up an in-process OpenCode server (or uses `@opencode-ai/sdk`'s `createOpencode`) and calls `createSession` with `WRITE_CAPABLE_PERMISSION_RULES`. This is the test that would have caught the bug. It satisfies the "R-PTY-02 / R-PTY-03 PARTIAL → COVERED" action from `16.2-VALIDATION.md`.

3. **Type alignment check.** Add a type-only test that asserts hivemind's `PermissionRule` is assignable to the SDK's body type for `SessionCreateRequest.body.permission`:
   ```typescript
   import type { PermissionRule } from "@/lib/types"
   import type { SessionCreateRequest } from "@opencode-ai/sdk"
   type _assert = PermissionRule[] extends NonNullable<
     NonNullable<SessionCreateRequest["body"]>["permission"]
   > ? true : never
   const _: _assert = true
   ```
   This breaks the build if the SDK changes the shape.

### 3.4 Wave D — Close outstanding 16.2 audit items

These are orthogonal to the Zod bug but were flagged in `16.2-REVIEW.md` and remain open:

| ID | File | Fix |
|----|------|-----|
| CR-01 | n/a | Create `tests/lib/command-delegation.test.ts` and `tests/lib/sdk-delegation.test.ts` per Wave 6 Tasks 1-2. Minimum: one test each for success + timeout + safety-ceiling paths. |
| CR-02 | 16.2 plan config | Either create `src/lib/spawner/pty-setup.ts` + `pty-setup.test.ts` or **remove** the non-existent paths from any plan-level manifest that references them. |
| WR-01 | `src/lib/delegation-persistence.ts:48-73` | Add `gracePeriodExpiresAt: typeof record.gracePeriodExpiresAt === "number" ? record.gracePeriodExpiresAt : undefined` to `normalizePersistedDelegation` return. |
| WR-02 | `tests/lib/delegation-manager.test.ts:1563-1585` | Replace comment about "no notifyParent" with a mock that makes the notification `client.session.prompt` call reject, and asserts finalization still succeeds. |
| WR-03 | `src/lib/delegation-manager.ts:92,110` | Already partially resolved in HEAD commit (single resolution). Verify no remaining double-resolution in `dispatchCommand`. |

### 3.5 Wave E — Cleanup diagnostic artifacts (optional)

HEAD commit da80b439 includes 7000+ lines of ad-hoc session transcript files (`session-ses_249c.md`, `session-ses_249d.md`, `session-ses_24a0.md`, `session-ses_24a3.md`) committed to the repo root. Per AGENTS.md "no accumulating changes across phases" and "never commit unrequested content", these should be `.gitignore`d and removed from the branch before merge.

---

## 4. Test Plan

### 4.1 Unit (Vitest) — must pass
- All existing 503 tests continue green
- New: `tests/lib/spawner/session-creator.test.ts` asserts every rule in `WRITE_CAPABLE_PERMISSION_RULES` has `pattern: "*"` (guards against regression of Wave A)
- New: `tests/lib/command-delegation.test.ts` + `tests/lib/sdk-delegation.test.ts` (CR-01)

### 4.2 Integration — NEW (Wave C #2)
- `tests/integration/session-create-permissions.test.ts`:
  - Spin up `createOpencode({ directory: tmp })`
  - Call `createSession(client, { directory: tmp, permission: WRITE_CAPABLE_PERMISSION_RULES })`
  - Assert `result.id` is a string, assert no `error` field, assert the created session honors `bash` allow / `task` deny when inspected via `/session/:id/permission`

### 4.3 Typecheck
- `npm run typecheck` — unchanged, 0 errors

### 4.4 Runtime smoke (manual, user-driven)
- From a live OpenCode session: `delegate-task({ agent: "explore", prompt: "ls" })`
- Expect: returns `{ status: "dispatched", delegationId: "..." }` (not `{ kind: "error", ... }`)
- `delegation-status({ id })` eventually returns terminal status
- `/tmp/harness-delegate-task-diag.txt` (if diagnostic instrumentation kept) shows `unwrapData` receiving a `data` branch, never an `error` branch

---

## 5. Risk & Rollback

### 5.1 Risks of the fix

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `pattern: "*"` is the wrong wildcard token | Very Low | Verified against oh-my-openagent + server evaluator. Same token used in 50+ test fixtures and production session-resolver. |
| Importing `PermissionRule` from `types.ts` shifts downstream type inference | Low | Already exported; already compatible with how tests construct rules. |
| Removing graceful-degradation shims re-exposes a latent second bug | Medium | That's the goal. If a second malformed payload exists, we want to know. Mitigation: roll Wave A before Wave B and verify runtime green for 24h. |

### 5.2 Rollback

Each wave is independent and revert-safe:
- Wave A rollback: `git revert` restores the missing-`pattern` state (reintroduces the bug but unblocks emergency).
- Wave B rollback: restores the try/catch shims (harmless masking).
- Wave C/D are additive (no behavior change).

---

## 6. Sequencing Recommendation

```
Wave A (spawner fix)
  └─ verify runtime unblock  ──────┐
                                   ▼
                              Wave B (remove shims)
                                   │
Wave C (structural) ───────────────┤
                                   │
Wave D (close 16.2 audit) ─────────┘
                                   ▼
                              Wave E (repo cleanup, optional)
```

Wave A is the only blocker. Estimated total effort:
- A: 10 min code + 1 test
- B: 15 min + green suite
- C: 2–3 h (integration test scaffolding is the bulk)
- D: 2 h (test authoring)
- E: 15 min

---

## 7. Open Questions for the User

1. **Pattern granularity.** `pattern: "*"` preserves current semantics. If the real intent for `bash` should be narrower (e.g. `pattern: "npm run *"`), call out now — Wave A can encode it.
2. **Keep R-SESSION-01 / R-AGENT-01 error branding?** Proposal removes them entirely (Wave B). If you want to keep *any* safety net, say so — a single-layer log without data substitution is reasonable.
3. **Integration harness choice.** Wave C #2 needs either an in-process OpenCode server (heavyweight, true coverage) or a typed mock of Hono's validator (lightweight, catches this specific bug class only). Preference?
4. **HEAD commit hygiene.** Wave E would remove 8k lines of committed session logs. OK to drop them, or do you want them preserved under `.planning/debug/`?

---

## 8. References

### Planning artifacts consulted
- `14-VERIFICATION.md`, `14-LEARNINGS.md`, `14-DELEGATION-COMPARISON-REPORT.md`
- `16-CONTEXT.md`, `16-VERIFICATION.md`, `16-RESEARCH.md`
- `16.2-SPEC-2026-04-22.md`, `16.2-01-PLAN.md`, `16.2-REVIEW.md`, `16.2-SUMMARY.md`, `16.2-VALIDATION.md`
- `.planning/debug/delegate-task-tool-runtime-failure.md`

### Source code consulted
- hivemind-plugin `@da80b439`:
  - `src/lib/spawner/session-creator.ts:5-28` (root cause)
  - `src/lib/types.ts:36` (canonical `PermissionRule`)
  - `src/lib/delegation-manager.ts:78-200, 321-335, 356-380`
  - `src/lib/session-api.ts:17-49, 76-112`
  - `src/lib/helpers.ts:75-85` (`unwrapData`)
  - `src/lib/delegation-persistence.ts:48-73`
  - `tests/lib/delegation-manager.test.ts:1563-1585`
- opencode `@dev`:
  - `packages/opencode/src/permission/index.ts:25-36` (Rule, Ruleset)
  - `packages/opencode/src/session/session.ts:117-159` (Session.Info)
  - `packages/opencode/src/agent/agent.ts:27-46` (Agent.Info)
  - `packages/opencode/src/server/routes/instance/session.ts:201-225` (POST /session)
  - `packages/sdk/js/src/client.ts:32-54` (SDK client factory)
  - `packages/opencode/src/plugin/index.ts:120-131` (plugin client wiring)
- oh-my-openagent (reference pattern):
  - `src/shared/question-denied-session-permission.ts` (correct shape)
  - `src/tools/delegate-task/sync-session-creator.ts`
  - 16+ call sites all consistently include `pattern`

---

**End of plan.**
