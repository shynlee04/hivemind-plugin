# Phase C5: Error Handling & Code Quality — Specification

**Created:** 2026-05-28
**Ambiguity score:** 0.17 (gate: ≤ 0.20)
**Requirements:** 4 locked

## Goal

Eliminate 14 silent empty catch blocks by adding comments or structured logging, fix the inconsistent SDK message shape handling in coordinator.ts with a typed extraction, and verify remaining `process.env` propagation risks in doctor.ts and create-governance-session.ts — without changing any public API surface or adding external dependencies.

## Background

Three error-handling and code-quality concerns were identified during Phase 17 `src/` audit and documented in CONCERNS.md (lines 200-241). Each concern represents a real risk of silent failure or data loss in production:

1. **5.1 (14 empty catch blocks):** Across 10+ source files, `.catch(() => {})` patterns silently swallow errors. The "concerning" group (write operations like `event-capture.ts:373`, `child-writer.ts:223`) means production data loss can occur without any signal. The "acceptable" group (read-only, expected failures like `session-tracker.ts:105`) still lacks explanatory comments.

2. **5.2 (Inconsistent error shape handling):** `src/coordination/delegation/coordinator.ts:212-219` uses a triple-fallback pattern (`info.role ?? role`, `info.error ?? error`, `error.message || JSON.stringify(errorField)`) indicating the SDK message shape has changed at least once. The code has been patched with fallbacks rather than updating the type.

3. **5.3 (Command delegation env propagation):** The `buildMinimalEnv` allowlist in `handler.ts:375-381` is correct. However, `doctor.ts:244` still passes `{ ...process.env, CI: "true" }` to `spawnSync`, and `create-governance-session.ts:129` passes `{ ...process.env }` to `execSync`. These are acceptable for diagnostic/admin tools but represent remaining risk.

## Requirements

1. **[REQ-01 — 5.1] Fix 14 empty catch blocks**: Every empty `.catch(() => {})` must either (a) add a comment explaining why the error is intentionally discarded, or (b) add `console.warn` / structured logging for write/critical operations.
   - **Current:** 14 empty catch blocks across 10+ files (event-capture.ts, child-writer.ts, session-tracker.ts, session-hierarchy.ts, session-context.ts, state-machine.ts, compiler.ts, initialization.ts, periodic-notifier.ts, notification-router.ts). Some blocks swallow write-operation failures silently.
   - **Target:** Zero empty catch blocks. Acceptable group (read-only, expected failures) annotated with `// Expected: <reason>` comments. Concerning group (write/critical operations) emit `console.warn('[Harness] <context>:', err)` with descriptive context.
   - **Acceptance:** `grep -rn '\.catch\s*(\s*(\(\s*\)|_\s*)?\s*=>\s*\{\s*\}\s*)' src/` returns zero matches. Every annotated catch block is either commented or logs.

2. **[REQ-02 — 5.2] Fix inconsistent error shape in coordinator.ts**: Replace triple-fallback pattern with a typed `SdkMessageShape` union that covers all known SDK message formats, using a single typed extraction function.
   - **Current:** `coordinator.ts:212-219` uses `as any` + triple-fallback (`info.role ?? role`, `info.error ?? error`, `error.message || JSON.stringify(errorField)`). The `JSON.stringify(errorField)` fallback produces very long, unhelpful error strings when the error is a complex object.
   - **Target:** A `SdkMessageShape` type union covering all observed SDK message formats. A single typed extraction function replaces the chain of fallbacks. No `JSON.stringify(errorField)` fallback — instead, a concise string extraction.
   - **Acceptance:** The triple-fallback pattern in `coordinator.ts:212-219` is replaced with a typed extraction. No `as any` casts remain in the error extraction path. Typecheck passes with zero new errors.

3. **[REQ-03 — 5.3] Fix env propagation in create-governance-session.ts**: Replace `{ ...process.env }` in `execSync` call with a scoped environment allowlist matching the `buildMinimalEnv` pattern.
   - **Current:** `create-governance-session.ts:129` passes `{ ...process.env }` to `execSync` for git commit — exposing the full environment to a child process.
   - **Target:** The `execSync` call uses a scoped env object with only explicitly allowed keys (same pattern as `buildMinimalEnv` in `handler.ts`).
   - **Acceptance:** Grep for `process.env` in `src/features/governance-engine/create-governance-session.ts` shows zero full-`process.env` spreads. Only scoped env objects are passed to child processes.

4. **[REQ-04 — 5.3] Document acceptable env spread in doctor.ts**: `doctor.ts:244` passes `{ ...process.env, CI: "true" }` — acceptable for a CLI diagnostic tool. Add a comment explaining why this is safe.
   - **Current:** `doctor.ts` uses `{ ...process.env, CI: "true" }` in `spawnSync` without rationale.
   - **Target:** The env spread has a comment explaining it's an intentional diagnostic operation (not a production delegation path).
   - **Acceptance:** The `process.env` spread in `doctor.ts` has an inline comment explaining its safety rationale.

## Boundaries

**In scope:**
- 14 empty catch blocks across 10+ files — add comments or structured logging
- `coordinator.ts:212-219` — typed SdkMessageShape extraction replacing triple-fallback
- `create-governance-session.ts:129` — scoped env allowlist for git commit
- `doctor.ts:244` — add safety rationale comment for env spread
- TypeScript typecheck must remain clean
- No external dependencies added

**Out of scope:**
- C6 architectural refactoring (session-tracker god module, plugin.ts decomposition, DelegationStatusReader interface) — separate phase
- C7 test coverage improvements (hooks modules, integration tests) — separate phase
- C8 dependency cleanup (bun-pty, bun-types, Zod pinning, SDK version validation) — separate phase
- Performance fixes from C4 — already completed
- Adding a comprehensive error-handling framework or error taxonomy — not needed for this scope
- Refactoring `buildMinimalEnv` in handler.ts — already correct

## Constraints

- Empty catch blocks on write/critical operations MUST use `console.warn('[Harness] <context>:', err)` — not silent swallowing and not full error objects
- Empty catch blocks on read-only/expected failures MUST have `// Expected: <reason>` comments
- The `SdkMessageShape` type must be a Zod-schematized union compatible with the existing Zod dependency (`zod@^4.4.3`)
- No changes to public API signatures
- All changes co-located in their existing files (no new modules)
- `src/coordination/command-delegation/handler.ts` buildMinimalEnv allowlist must remain unchanged (already correct)

## Acceptance Criteria

- [ ] Zero `.catch(() => {})` blocks remain in `src/` — all are either commented or log warnings
- [ ] All write/critical empty catches use `console.warn('[Harness] <context>:', err)` pattern
- [ ] All read-only/expected empty catches have `// Expected: <reason>` inline comments
- [ ] `coordinator.ts:212-219` triple-fallback replaced with typed `SdkMessageShape` extraction
- [ ] Zero `as any` casts remain in `coordinator.ts` error extraction path
- [ ] `create-governance-session.ts` uses scoped env for `execSync` (no `{ ...process.env }`)
- [ ] `doctor.ts` env spread has inline safety rationale comment
- [ ] `npm run typecheck` passes with zero errors
- [ ] Existing test suite passes with zero regressions

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                            |
|--------------------|-------|------|--------|----------------------------------|
| Goal Clarity       | 0.88  | 0.75 | ✓      | Well-defined from ROADMAP + CONCERNS.md |
| Boundary Clarity   | 0.82  | 0.70 | ✓      | Specific files + line numbers per concern |
| Constraint Clarity | 0.75  | 0.65 | ✓      | Patterns specified per fix type (comment vs log vs typed) |
| Acceptance Criteria| 0.82  | 0.70 | ✓      | 8 pass/fail criteria with grep-verifiable checks |
| **Ambiguity**      | 0.17  | ≤0.20| ✓      | All dimensions above minimum |

Status: ✓ = met minimum

## Interview Log

| Round | Perspective  | Question summary                     | Decision locked                           |
|-------|--------------|--------------------------------------|-------------------------------------------|
| —     | — (auto)     | Initial ambiguity 0.17 ≤ 0.20        | All minimums met — skipped interview loop |
| —     | — (auto)     | Requirements derived from CONCERNS.md | 4 REQs from 3 concern sections (5.1-5.3) |

*Auto-selected decisions per `--auto` mode: All 4 dimensions scored above minimum. SPEC.md derived directly from existing documentation (ROADMAP.md + CONCERNS.md) without interview loop.*

---

*Phase: C5-Error-Handling-Code-Quality*
*Spec created: 2026-05-28*
*Next step: /gsd-discuss-phase C5 — implementation decisions (how to build what's specified above)*
