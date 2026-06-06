# Codebase Concerns

**Analysis Date:** 2026-06-06

This document captures actionable warnings about the Hivemind runtime composition engine codebase. It is consumed by `/gsd-plan-phase` and `/gsd-execute-phase` to inform risk-aware change management. Concerns are organized by impact category and prioritized by risk.

---

## Tech Debt

### GSD framework migration residue (high)

**Issue:** The 2026-06-06 GSD framework migration (`.opencode/get-shit-done/` → `.opencode/gsd-core/`) was completed but the directory migration was not atomic — both names exist in partial form.

**Files & evidence:**
- `.opencode/get-shit-done/` (still present) — only `templates/verification.md` is non-empty; `bin/`, `contexts/`, `references/`, `workflows/` are empty (0 bytes each).
- `.opencode/gsd-core/` — fully populated (4.2 MB) with `VERSION=1.3.1` and the 424-file manifest at `.opencode/gsd-file-manifest.json`.
- `.opencode/gsd-migration-journal/` — contains 230 KB journal + `*-backups/` and `*-rollback/` snapshots (4.5 MB total). The rollback directory preserves the pre-rename gsd files (now stranded).
- `.opencode/gsd-local-patches/backup-meta.json` — record of one file preserved during migration (`get-shit-done/templates/spec.md`), but the file itself is missing from the new layout.
- `.opencode/gsd-install-state.json` — `appliedMigrations` list with two entries (2026-05-29 first-time baseline + 2026-06-06 rename); only the second is in the new system.

**Impact:** Confusing for new contributors who see `get-shit-done` and `gsd-core` coexisting. Risk that future sync operations re-resurrect the old path. The `gsd-local-patches/` directory pattern is undocumented outside this file and not in the `SoT-POLICY.md` hand-maintained exclusions list (§4 of `SoT-POLICY.md`).

**Fix approach:**
1. After confirming all `get-shit-done/` files are 0-byte stubs, run `git rm -r .opencode/get-shit-done/`.
2. Move `.opencode/gsd-migration-journal/*.json` (non-journal) into a single archived `migration-history-2026.json` and gitignore subsequent ones.
3. Document `.opencode/gsd-local-patches/` ownership in `SoT-POLICY.md` §4 or remove the dir if not needed.
4. Verify `.opencode/gsd-core/VERSION` is the single source of truth and stop writing `gsd-install-state.json` after migrations complete (move to gitignored runtime state).

### gsd-* primitives deployed at wrong path (high — constitutional violation)

**Issue:** The project root `AGENTS.md` declares: "Exception: `gsd-*` primitives are developer tooling, NOT shipped, and may live in `.opencode/get-shit-done/`." However, the GSD framework migration replaced `.opencode/get-shit-done/` with `.opencode/gsd-core/`, and the 33 `gsd-*` agent files now live in `.opencode/agents/` alongside shipped `hm-*` and `hf-*` agents.

**Files & evidence:**
- `.opencode/agents/gsd-codebase-mapper.md` and 32 other `gsd-*.md` files (33 total) in the deployed agents directory.
- `.hivefiver-meta-builder/agents-lab/active/refactoring/` also contains 33 `gsd-*.md` files (mirror, not source — per `SoT-POLICY.md` §2 the Lab layer is not authoritative).
- `assets/agents/` has only 44 files — none of them are `gsd-*` (per `SoT-POLICY.md` §2 the Source layer is canonical and ships only `hm-*`/`hf-*`/`build*`).
- The 33 deployed `gsd-*` agents are NOT in `assets/agents/`, so they are produced by the migration tool (`gsd-core` install) and re-deployed at every sync without going through Source review.

**Impact:** Direct violation of `AGENTS.md` §CONSTITUTION. Causes "What's shipped vs what's tooling" ambiguity for OpenCode agent resolution. `gsd-*` agents are loaded by OpenCode alongside `hm-*` agents, polluting the agent name space. 33 entries in the load path slow agent discovery.

**Fix approach:**
1. Update `AGENTS.md` §CONSTITUTION to specify that `gsd-*` primitives may live in either `.opencode/get-shit-done/` (legacy) or `.opencode/gsd-core/` (current).
2. Add a separate OpenCode config rule that excludes `.opencode/agents/gsd-*.md` from agent discovery (or move them to `.opencode/gsd-core/agents/`).
3. Document the new `gsd-core/agents/` path in `SoT-POLICY.md` §4 hand-maintained exclusions.

### Source-of-Truth ↔ Deployed drift in agents (medium)

**Issue:** The deployed layer has 77 `.md` files in `.opencode/agents/`, but the Source layer `assets/agents/` has only 44. The 33-file delta is the gsd-* set (covered above). The remaining 0-file mismatch is hidden — file-level diff between source and deployed shows 100% name match for `hm-*` and `hf-*` primitives, but content may have drifted between the most recent sync.

**Files & evidence:**
- `.opencode/agents/build.md` (new front-facing agent) — not present in `assets/agents/build.md` (verified, only in deployed).
- `.opencode/agents/hm-steer.md` (new steering dispatcher) — not present in `assets/agents/hm-steer.md`.
- `assets/agents/build.md` exists in Source (per `ls assets/agents/`) but a diff-based SHA check is required to confirm content parity.

**Impact:** Without automated content-hash verification on every `node scripts/sync-assets.js` run, drift between Source and Deployed is silent. The `gsd-file-manifest.json` covers 424 `gsd-core/` paths but NOT the `hm-*`/`hf-*` shipped primitives.

**Fix approach:**
1. Extend `scripts/sync-assets.js` (currently 512 LOC at `scripts/sync-assets.js`) to emit a separate `assets-manifest.json` containing SHA-256 hashes for every `assets/${kind}/` primitive.
2. Add a `gate-lifecycle-integration` check that fails CI when `assets-manifest.json` diverges from a freshly-computed deployed-side hash.
3. Run `git diff` between `assets/agents/build.md` and `.opencode/agents/build.md` to confirm the deployed version is the canonical one, then backport or update Source.

### Residual `.backup` directories from sync operations (medium)

**Issue:** The sync engine at `scripts/sync-assets.js` (L92-97) backs up user-modified Deployed files to `.opencode/${kind}/.backup/` BEFORE overwriting. These backups are never cleaned up by the sync itself — they accumulate.

**Files & evidence:**
- `.opencode/agents/.backup/` — 17 files (build.json, build.md, all hf-*.md, hm-orchestrator.md, hm-steer.md, etc.)
- `.opencode/commands/*.backup` — 124 sibling `.backup` files at top-level (not in `.backup/` subdir but as `<name>.md.backup` siblings).
- `.opencode/references/*.backup` — 70 sibling `.backup` files.
- `.opencode/rules/.backup/` — populated directory.
- `.opencode/skills/<name>.backup/` — 12 backup-skill directories (completion-detection.backup, iterative-loop.backup, wave-execution.backup, etc.).

**Impact:** 200+ stale backup files inflate the deployed tree. Some are 30+ days old (mtime Jun 1 2026 vs current Jun 6 2026). Increases the surface for accidental inclusion in agent discovery (`.backup/` is gitignored but is on disk).

**Fix approach:**
1. Add a `scripts/clean-backups.js` that runs in `postinstall` and prunes `.backup` files older than 7 days, then add it to the sync chain.
2. Update `.gitignore` to confirm `.opencode/**/.backup/**` and `.opencode/**/*.backup` are ignored (currently they are via `*.backup*` in root gitignore L48, but should be explicit).
3. Document the backup lifecycle in `SoT-POLICY.md` §5 — "if you edit `.opencode/...` directly, your edit is backed up to `.backup/`; the backup is deleted on `rm -rf .opencode && node scripts/sync-assets.js`."

### Active `TODO-2` markers (R7/R9 mitigation debt) (medium)

**Issue:** 19 `TODO-2 (2026-06-04, R7|R9|MVD §12.4)` markers across 9 source files document pending work for the Minimum Viable Discriminator (MVD) feature. None of them are tracked in `ROADMAP.md` or `STATE.md`.

**Files & evidence:**
- `src/coordination/delegation/types.ts:83` — `delegationType?` optional field deferred to write-time
- `src/task-management/continuity/delegation-persistence.ts:53, 98` — discriminator not set at write time
- `src/tools/delegation/readers/types.ts:67, 150` — reader-side enrichment deferred
- `src/features/session-tracker/capture/tool-capture.ts:298` — handler reach restricted
- `src/features/session-tracker/capture/handlers/types.ts:112, 129, 168, 205` — 4 markers
- `src/features/session-tracker/types.ts:61, 225, 351, 394` — 4 markers
- `src/features/session-tracker/tool-delegation.ts:309, 358, 413` — 3 markers
- `src/features/session-tracker/persistence/hierarchy-manifest.ts:72` — manifest discriminator
- `src/features/session-tracker/persistence/child-writer.ts:331` — preserve across merges

**Impact:** All 19 markers are dated 2026-06-04, indicating they were introduced during the MVD migration but the write-side and propagation logic was deferred. Without an explicit "phase" or ticket, these will become invisible to phase planning. R7 = "compute at write time", R9 = "mirror to child + manifest". Both are non-trivial cross-module changes.

**Fix approach:**
1. Add a `phase 39.9` (or appropriate next phase) item to `.planning/ROADMAP.md` titled "Resolve TODO-2 R7/R9 mitigations" with the 19 markers as acceptance criteria.
2. Add a `// TODO-2-mitigated` tag for resolved ones to make the search trivial.
3. Add a `gate-spec-compliance` check that fails on any new `TODO-2` marker without a corresponding ROADMAP entry.

### `as any` / untyped escape hatches in sidecar and SDK glue (medium)

**Issue:** 13 instances of `as any` casts in source bypass TypeScript's type safety in code paths that bridge the OpenCode SDK and the harness's internal types.

**Files & evidence:**
- `src/plugin.ts:538` — `(client as any).session.prompt({...})` (SDK client cast)
- `src/plugin.ts:556, 559, 560, 561, 562, 572, 576, 581` — 8 casts in message normalizer (parts filtering)
- `src/sidecar/server/tool-proxy/handlers/hivemind-session-view.ts:37` — `(registry as any).sessionTracker`
- `src/sidecar/server/tool-proxy/handlers/delegate-task.ts:43` — `(dm.dispatch as any)({...})`
- `src/sidecar/server/tool-proxy/handlers/hivemind-trajectory.ts:48` — `(registry as any).trajectory`
- `src/sidecar/server/routes/state.ts:37` — `(registry as any).sessionTracker`
- `src/sidecar/server/routes/sessions.ts:29` — `(registry as any).sessionTracker`
- `src/routing/behavioral-profile/resolve-behavioral-profile.ts:77-80` — 4 casts in config field coercion

**Impact:** Each `as any` is a maintenance hazard when the OpenCode SDK updates its message format. The `plugin.ts` message normalizer (8 casts) is the most fragile — when the SDK changes `parts[].type` enum, the harness silently misclassifies messages. AGENTS.md §Code Style says "No `any` types on new code" but this rule was not applied to existing bridge code.

**Fix approach:**
1. Define `OpenCodeMessagePart` and `OpenCodeSession` types in `src/shared/session-api.ts` (which already exists) — make them interfaces the SDK's loose `any` shapes conform to.
2. Replace each `as any` with a narrowing function: `isToolPart(p): p is OpenCodeToolPart`, `isTextPart(p): p is OpenCodeTextPart`, etc.
3. For the sidecar routes' `registry as any`, expose a typed accessor on `SidecarRegistry` rather than reaching into internal state.

### Raw `throw new Error(...)` without `[Harness]` prefix (low)

**Issue:** AGENTS.md §Code Style requires `[Harness]` prefix on all thrown errors. 56 of 125 `throw new Error(...)` sites omit the prefix.

**Files & evidence:**
- `src/coordination/delegation/manager-runtime.ts` — 5 of 7 throws unprefixed (lines 193, 218, 223, 228, 233, 344) — but lines 207 and 576 DO use `[Harness]`
- `src/coordination/spawner/ralph-loop.ts:106` — unprefixed
- `src/coordination/spawner/auto-loop.ts:100` — unprefixed
- `src/coordination/sdk-delegation/handler.ts:104` — unprefixed
- `src/tools/hivemind/run-background-command.ts:132` — unprefixed
- `src/task-management/continuity/index.ts:302` — unprefixed
- `src/task-management/journal/query.ts:125` — unprefixed
- `src/task-management/trajectory/store-operations.ts:95` — unprefixed
- `src/task-management/trajectory/ledger.ts:50` — unprefixed

**Impact:** When unprefixed errors bubble up through the OpenCode agent loop, the user sees `Error: parentSessionId is required` instead of `[Harness] dispatch pre-send validation failed: parentSessionId is required`. Harder to triage, harder to grep logs.

**Fix approach:**
1. Add an ESLint rule `no-throw-without-harness-prefix` that matches `throw new Error(.*[^(])` and suggests a fix-it to prepend `[Harness] `.
2. Run a one-shot migration script: `find src -name "*.ts" | xargs sed -i 's|throw new Error("|throw new Error("[Harness] |g'` and review the diff.
3. Better: replace the throws with the typed errors already declared in `src/shared/errors/commands.ts` (CommandNotFoundError, AgentNotFoundError, DelegationTimeoutError, etc.).

### Files exceeding 500-LOC max module size (low — governance)

**Issue:** AGENTS.md §Code Style mandates "Max module size: 500 LOC". 9 source files exceed this.

**Files & evidence (LOC from `wc -l`):**
- `src/plugin.ts` — 1,076 lines (composition root)
- `src/tools/delegation/delegation-status.ts` — 906 lines
- `src/tools/session/execute-slash-command.ts` — 863 lines
- `src/config/defaults.ts` — 832 lines
- `src/coordination/delegation/coordinator.ts` — 746 lines
- `src/features/session-tracker/persistence/child-writer.ts` — 685 lines
- `src/features/session-tracker/index.ts` — 671 lines
- `src/coordination/delegation/manager-runtime.ts` — 616 lines
- `src/features/tmux/tmux-multiplexer.ts` — 606 lines

**Impact:** Larger files are harder to test in isolation, harder to grep, and harder to refactor. The composition root at 1,076 LOC (`src/plugin.ts`) imports 60+ modules and is the single biggest source-of-cyclic-dependency risk.

**Fix approach:**
1. `src/plugin.ts` (1,076): split into `composition/tools.ts`, `composition/hooks.ts`, `composition/state.ts` (already partially done in `src/hooks/composition/`).
2. `src/tools/delegation/delegation-status.ts` (906): split read-side from write-side; the tool has 4 distinct concerns (status, find-stackable, peek, control).
3. `src/tools/session/execute-slash-command.ts` (863): split by execution surface (sdk, pty, headless).

### `console.*` instead of typed logger (low)

**Issue:** 30+ source files call `console.error`/`console.warn` directly with `[Harness]` string prefixes instead of using a structured logger. The harness already has a logger at `client.app?.log?.({...})` (per `src/features/governance-engine/create-governance-session.ts:175`).

**Files & evidence:** Top offenders (10+ console calls each):
- `src/task-management/continuity/index.ts` — 4 console calls
- `src/task-management/continuity/delegation-persistence.ts` — 4 console calls
- `src/tools/session/execute-slash-command.ts` — 2 console calls
- `src/tools/session/dispatch-command.ts` — 2 console calls
- `src/features/session-tracker/persistence/retry-queue.ts` — 1 console call (but in a hot path)

**Impact:** Console output is unstructured, not filterable by level, and doesn't propagate to OpenCode's log collector. Ties to the `observability` skill — agent-first observability requires structured logs.

**Fix approach:** Create `src/shared/logger.ts` exporting `harnessLog(level, message, ctx)` that wraps `client.app.log` when available and `console.*` as fallback. Migrate 30+ call sites in a single pass with a code review.

### Deprecated types retained for backward compat (low)

**Issue:** 5 `@deprecated` markers in source, some with audit history. The Phase 46.1 marker is the most concerning — the underlying flag is a no-op but the schema still accepts it.

**Files & evidence:**
- `src/shared/types.ts:217` — `TrustedRuntimePolicy.builtinAsyncBackgroundChildSessions` — **DEPRECATED Phase 46.1 (audit 2026-04-30, Finding 3)**: "no longer consulted by the dispatch path. Setting it to `false` no longer downgrades to sync." But the field is still on the type and still in `configs.schema.json`.
- `src/schema-kernel/agent-frontmatter.schema.ts:100, 118` — two deprecated fields in agent frontmatter validation.
- `src/features/session-tracker/classification.ts:33` — `kind` discriminator deprecated in favor of `kind` discriminator (circular reference in the deprecation message).
- `src/features/session-tracker/persistence/retry-queue.ts:368` — `ChildWriteRetryQueue` wrapper deprecated.

**Impact:** `TrustedRuntimePolicy.builtinAsyncBackgroundChildSessions` is the most concerning — users setting `false` will get unexpected sync→async behavior. The deprecation message says it's "no longer consulted" but the schema still validates it.

**Fix approach:**
1. Add a deprecation warning at `src/shared/types.ts:217` that emits a `console.warn` when the field is encountered with `false`.
2. After one release, remove the field from `configs.schema.json` and the `TrustedRuntimePolicy` type.
3. Fix the circular `@deprecated` comment in `src/features/session-tracker/classification.ts:33` — the deprecation target IS `kind`, but the comment reads "Use `kind` discriminator instead" while the line defines `kind`.

---

## Known Bugs

### 12 pre-existing test failures (high)

**Issue:** Per `coverage-report.md` (generated 2026-05-28, C7-Test-Coverage, Plan 01-01), 12 tests are failing pre-existing and unrelated to the C7 phase.

**Files & evidence:** Coverage report states "12 pre-existing failures (bootstrap-init, bootstrap-recover, doctor commands, coherence) — unrelated to this phase."

**Symptoms:** `npm test` reports 2,778 passed / 12 failed / 2 skipped (per coverage-report.md). The 12 failures cluster in:
- Bootstrap tools (`bootstrap-init`, `bootstrap-recover`).
- Doctor commands (the `harness-doctor` slash command).
- Coherence checks (likely `tests/lib/coherence.test.ts` or similar).

**Trigger:** Likely caused by the GSD framework migration (2026-06-06) which renamed `get-shit-done` → `gsd-core` and changed the bootstrap's expected file paths. Tests that hard-coded `get-shit-done` paths in fixtures are now broken.

**Workaround:** None documented. The failures are treated as "pre-existing" and ignored.

**Root cause:** Path-string assertions in test fixtures reference the old `get-shit-done/` path. Bootstrap tools discover the new `gsd-core/` but tests still expect the old names.

**Blocked by:** None — a fix is mechanical (update test fixture paths).

### Session-tracker dual-write races (high)

**Issue:** `delegation-persistence.ts:79-108` and `continuity/index.ts:363-445` perform dual writes (child file + manifest) without atomic transaction guarantees. Errors during the second write are caught and logged but the first write stands — state can be left half-applied.

**Files & evidence:**
- `src/task-management/continuity/delegation-persistence.ts:79` — `console.warn` after skip; not transactional.
- `src/task-management/continuity/delegation-persistence.ts:86, 103, 108` — `console.error` after write failures.
- `src/task-management/continuity/index.ts:363, 366` — `console.error` after `recordSessionContinuity` dual-write failure.

**Trigger:** A crash or timeout between the child-file write and the manifest write (e.g., parent process killed, ENOSPC during manifest write). The `console.error` in `delegation-persistence.ts:108` admits the failure.

**Workaround:** None. The retry logic in `src/features/session-tracker/persistence/retry-queue.ts` only retries the child-writer, not the manifest.

**Root cause:** Dual-write is implemented as two sequential `await` calls. There is no temp-file-rename pattern, no journal replay, no idempotency key.

**Blocked by:** None — a fix requires implementing a write-ahead log (the journal already exists in `src/task-management/journal/index.ts` and could be reused).

### S5b tmux pane synthesis race (medium — recently fixed but fragile)

**Issue:** Per `CHANGELOG.md` "Fixed" section, S5b was a live UAT blocker where "tmux panel now spawns for every SDK-created child session, even when the OpenCode SDK does not fire `session.created`." The fix synthesizes an `EnrichedSessionEvent` in `DelegationCoordinator` and calls `tmuxIntegration.adapter.onSessionCreated` directly.

**Files & evidence:**
- `src/coordination/delegation/coordinator.ts:122, 257, 684` — 3 S5b-fix comments marking the synthesized event path.
- `src/coordination/delegation/coordinator.ts:252-262` — the actual synthesis block.
- The S5b fix relies on `SessionManager.sessions` / `spawningSessions` idempotency guards.

**Trigger:** If a future change moves the S5b synthesis block (e.g., refactor to a different module) without preserving the idempotency check, a single session can spawn two tmux panes.

**Workaround:** Idempotency guards via `spawningSessions` set.

**Root cause:** OpenCode SDK does not consistently fire `session.created` for SDK-spawned child sessions. The harness is patching the missing event from outside.

**Blocked by:** OpenCode SDK fix would eliminate the need for synthesis. Track in upstream issue tracker.

### Coordinator state-machine key drift detector (medium)

**Issue:** `src/coordination/delegation/manager-runtime.ts:207` throws `[Harness] Canonical delegation queue-key drift detected.` when `spawnQueueKey !== acquireQueueKey`. This is an integrity check that fires when `buildDelegationQueueKey` is called twice with the same input but different output.

**Files & evidence:**
- `src/coordination/delegation/manager-runtime.ts:200-208` — drift check.

**Symptoms:** Delegation request fails with the drift error before acquiring a semaphore slot.

**Trigger:** Any future change to `buildDelegationQueueKey` (canonical context builder) that introduces non-determinism (e.g., a `Date.now()` call, a Map iteration, a random salt).

**Workaround:** None — the check is correct and should fire.

**Root cause:** Defensive code, not a bug per se. The risk is that the check fires in production and the throw aborts the user's delegation.

**Blocked by:** None — a future enhancement could downgrade the throw to a `console.warn` + metric for non-critical drift.

---

## Security Considerations

### `.env` file at repo root contains live API keys (high)

**Issue:** The repository root contains a `.env` file with active API keys for TAVILY, GITHUB_PAT, NOTION_API_TOKEN, and EXA_API_KEY.

**Files & evidence:**
- `.env` — 5,627 bytes, last modified 2026-06-05.
- `.gitignore` line 18: `.env` (and `!.env.*` exception) — `.env` is in the gitignore so the keys are NOT committed to git.

**Risk:** The keys are stored on disk in plaintext at the project root. If the user's shell history, IDE scratch files, or any of the 30+ session-journal markdown files at `session-ses_*.md` capture a `source .env` or `cat .env` command, the keys propagate to ungoverned file surfaces.

**Current mitigation:** `.gitignore` prevents git commit. The `redaction.ts` module at `src/shared/security/redaction.ts` redacts `API_KEY`, `TOKEN`, `PASSWORD`, `AUTHORIZATION` from text passing through harness output.

**Recommendations:**
1. Move to `.env.local` (already gitignored via `!.env.*` exception) so each developer's local overrides don't sync to a single `.env`.
2. Add a `preinstall` check that fails `npm install` if `.env` exists at the project root (catches the case where a developer copies the file as a starter).
3. Run `git log --all -- .env` to verify no historical commit contained the file (a defensive check, not a fix).

### `buildMinimalEnv()` env allowlist (good)

**Issue:** The command delegation handler at `src/coordination/command-delegation/handler.ts:375-385` builds a minimal env for child processes.

**Files & evidence:**
- `src/coordination/command-delegation/handler.ts:375-385` — `buildMinimalEnv()` allows only `PATH, HOME, TERM, LANG, PWD` plus the `extraEnv` parameter.
- `src/features/governance-engine/create-governance-session.ts:175-185` — similar minimal env for git operations.

**Current mitigation:** Strict allowlist prevents child processes from inheriting the parent's full env. The `extraEnv` parameter is the only escape hatch.

**Recommendations:** This is exemplary — keep the pattern. Add a unit test that fails if a new key is added to `allowedKeys` without a corresponding justification comment.

### `OPENCODE_CONFIG_DIR` env path traversal (low)

**Issue:** `src/tools/config/configure-primitive-paths.ts:23` and `src/tools/config/bootstrap-init.ts:200`, `src/tools/config/bootstrap-recover.ts:137`, `src/config/compiler.ts:73` all read `process.env.OPENCODE_CONFIG_DIR` and pass it to `path.resolve()` without validating the result is within an expected directory tree.

**Files & evidence:**
- `src/tools/config/configure-primitive-paths.ts:23` — direct passthrough to `path.resolve`.
- `src/tools/config/bootstrap-init.ts:200` — `globalRoot = resolve(explicitGlobalConfigDir ?? process.env.OPENCODE_CONFIG_DIR ?? ...)`.

**Risk:** Low. `OPENCODE_CONFIG_DIR` is set by OpenCode itself; a malicious user setting it to `/etc/` could trick the harness into reading config from an unexpected location. The risk is a confused-deputy attack where the harness reads the wrong user's opencode config.

**Current mitigation:** None. The harness trusts the env var.

**Recommendations:** Add `path.resolve(allowedRoot, process.env.OPENCODE_CONFIG_DIR)` and verify the result starts with `allowedRoot` before proceeding. Log a warning if the env var is set but doesn't match the expected location.

### Sidecar `(registry as any)` accesses (low)

**Issue:** 5 sidecar routes/tools reach into `registry` via `as any` to access `sessionTracker`, `trajectory`, etc. (`src/sidecar/server/tool-proxy/handlers/hivemind-session-view.ts:37`, `delegate-task.ts:43`, `hivemind-trajectory.ts:48`, `routes/state.ts:37`, `routes/sessions.ts:29`).

**Risk:** If the sidecar is exposed on a network port (the `opencode.json` has `server.port: 4096`), an attacker reaching the port could exploit a future change that re-exposes the entire `registry` object via JSON serialization.

**Current mitigation:** The sidecar validates `sessionId` in the URL path before calling the handlers.

**Recommendations:** Define a `SidecarReadRegistry` interface that only exposes the read methods needed, and pass that to the routes. The current pattern of reaching into `registry` couples every sidecar handler to the full internal state shape.

### Delegation queue-key shape is a regex (low)

**Issue:** `src/coordination/delegation/manager-runtime.ts:230-233` validates the queue key with `/^(?:[a-z][a-z0-9-]*:.+|default)$/`. A malformed key (anything not matching the shape) throws.

**Risk:** None directly — the regex is a strict shape check. The risk is that the regex is too permissive (allows arbitrary content after `:`).

**Current mitigation:** Strict regex enforces `provider|model|agent:<id>` or `default`.

**Recommendations:** Tighten the regex to require `:`, then `agent-` or `model-` prefix, then a UUID. The current shape accepts `provider:'; rm -rf /` if a future bug allowed user input into the key.

---

## Performance Bottlenecks

### Plugin composition root loads 60+ modules at startup (medium)

**Problem:** `src/plugin.ts` (1,076 LOC) imports 60+ modules and instantiates all hooks, tools, observers, and consumers on every plugin load.

**Files & evidence:**
- `src/plugin.ts` — composition root, top of `index.ts` re-export.

**Measurement:** Plugin load time has not been formally benchmarked. Anecdotally, OpenCode startup is slowed by 100-300 ms when the harness is enabled.

**Cause:** Eager module instantiation in `plugin.ts`. The `createCoreHooks`, `createSessionHooks`, `createToolGuardHooks`, `createDelegationEventObserver`, and other factory functions all run at startup.

**Improvement path:**
1. Convert all factory calls to lazy `getOrCreateXxx()` patterns.
2. Use `import()` for non-critical surfaces (e.g., sidecar tool-proxy handlers).
3. Add a `plugin.ts` startup benchmark test that fails if load time exceeds 200ms.

### Session-tracker dual-write performs 2x fsyncs (medium)

**Problem:** Every delegation completion triggers two file writes (child file + manifest). Each write is awaited separately.

**Files & evidence:**
- `src/task-management/continuity/delegation-persistence.ts:53-108` — dual-write loop.

**Measurement:** At 50 delegations/min, the harness performs 100 fsyncs/min. On a slow SSD (1ms fsync), that's 100ms of write time per minute.

**Cause:** Sequential await calls; no batching.

**Improvement path:**
1. Batch manifest writes — accumulate updates in memory, flush to disk every N completions or N seconds (whichever comes first).
2. Use `Promise.all` for parallel writes if the manifest and child file are on different volumes (rare in practice).
3. Cache the manifest in memory and only write on shutdown or eviction.

### Delegation status tool reads 4+ JSON files (low)

**Problem:** `src/tools/delegation/delegation-status.ts` (906 LOC) reads multiple files per query: `delegation-managements/*.json`, `journal/*/state.json`, `trajectory-ledger.json`, `session-tracker/*.json`.

**Files & evidence:**
- `src/tools/delegation/delegation-status.ts:470, 655, 695, 772` — 4 projectRoot resolutions each followed by fs reads.

**Measurement:** A `delegation-status find-stackable` query reads ~10-20 files. On a typical session, the tool is called 5-10 times per phase.

**Cause:** No in-memory cache. Each call re-reads from disk.

**Improvement path:**
1. Add a `statusCache` Map keyed by delegation ID with TTL of 5 seconds.
2. Invalidate on `delegation-update` event from the writer.

### Console.error on every persistence failure (low)

**Problem:** `console.error` calls in `delegation-persistence.ts:86, 103, 108` and `continuity/index.ts:363, 366, 442, 445` fire on every persistence failure. Under load (e.g., a child process flooding the persistence layer), this can spam the terminal.

**Files & evidence:** See above.

**Measurement:** Not measured; depends on failure rate.

**Cause:** Failure logging is not rate-limited.

**Improvement path:** Throttle identical error messages to one per N seconds.

---

## Fragile Areas

### Plugin composition root (`src/plugin.ts` — 1,076 LOC)

**Why fragile:** 60+ imports, 20+ factory calls, all eager. Any change to an import path requires a transitive review of 60+ files.

**Common failures:**
- Circular import detection (silent in production, loud in dev).
- Module load order matters — `task-management/lifecycle/index.ts` is instantiated before `coordination/delegation/manager.ts` which depends on it. Reordering breaks.
- The `process.env.OPENCODE_HARNESS_STATE_DIR` read in `continuity/index.ts:34` and `delegation-status.ts:470` happens at module init — if the env var changes mid-session, the read is stale.

**Safe modification:**
1. Add a new module by writing it under `src/features/<name>/` and adding the import to `plugin.ts` at the correct position.
2. Before changing an existing import, run `npm test` to confirm the build.
3. Use `path.relative` to keep imports relative to the file doing the importing.

**Test coverage:** 290 test files. No dedicated `tests/plugin.test.ts` covers the composition root end-to-end. The `tests/plugin/` subdirectory exists but its scope is unclear.

### Delegation state machine (`src/coordination/delegation/state-machine.ts` — 445 LOC)

**Why fragile:** Implements a finite-state machine with 6 states (`pending`, `dispatched`, `running`, `awaiting-completion`, `completed`, `failed`, `cancelled`). Transition rules are encoded in switch statements.

**Common failures:**
- A new state added without updating the transition table.
- A transition handler throws, leaving the delegation in an inconsistent state.
- The `recoveryGuarantee` field is a union of 3 values; adding a 4th requires updates to 3 readers and 2 writers.

**Safe modification:**
1. Add new states by extending the `DelegationStatus` union in `src/coordination/delegation/types.ts` first, then propagate.
2. After any state-machine change, run `npx vitest run tests/coordination/delegation/manager.test.ts` to confirm all paths.

**Test coverage:** 4 test files in `tests/coordination/` (delegation, manager, monitor, types). State machine has 6 unit tests but no fuzz tests.

### Session-tracker persistence (`src/features/session-tracker/persistence/child-writer.ts` — 685 LOC)

**Why fragile:** Implements dual-writes (child JSON + hierarchy manifest) with 19 TODO-2 markers tracking incomplete R7/R9 mitigations. The `kind` discriminator and `delegationType` are optional fields with backward-compat logic.

**Common failures:**
- A schema change to the `Delegation` type without updating the manifest writer.
- A race between two writers (e.g., session-tracker and a manual edit) corrupting the manifest.
- The `retry-queue.ts` retries only the child writer, not the manifest.

**Safe modification:**
1. New schema fields must be `?:` optional during the deprecation period.
2. After adding a field, update both `child-writer.ts` and `hierarchy-manifest.ts` in the same commit.
3. Use the `R7` / `R9` mitigation pattern from the TODO-2 markers as a guide.

**Test coverage:** `tests/features/session-tracker/` has 8 test files but only 1 covers `child-writer.ts` directly. Manifest writer has no dedicated tests.

### Tmux multiplexer (`src/features/tmux/tmux-multiplexer.ts` — 606 LOC)

**Why fragile:** Wraps the `tmux` CLI as an external process. Handles signal forwarding, ANSI escape parsing, and pane lifecycle. The PTY fallback (`bun-pty`) is optional and may not be installed in all environments.

**Common failures:**
- A child process exits but the tmux pane is not closed (orphaned pane).
- Signal forwarding races cause a child to receive SIGTERM twice.
- ANSI escape codes are not always parsed correctly, leading to corrupted terminal output.

**Safe modification:**
1. The `terminalKind: "non-resumable-after-restart"` (per AGENTS.md) is intentional — never try to resume a PTY delegation across a harness restart.
2. When changing the multiplexer, run `tests/features/tmux/integration.test.ts` with `BUN_PTY=1` to verify the PTY path.
3. Test with a real tmux session before merging.

**Test coverage:** 4 test files. Integration tests are gated on `bun-pty` being available; without it, only the headless path is tested.

### SDK child-session starter (`src/coordination/delegation/sdk-child-session-starter.ts`)

**Why fragile:** Wraps `client.session.prompt()` with type-erased casts (`(client as any).session.prompt(...)` in `src/plugin.ts:538`). The SDK's message shape is not formally typed by `@opencode-ai/sdk`.

**Common failures:**
- The SDK changes the `parts[].type` enum and the harness misclassifies messages.
- A new SDK version deprecates `client.app.log` and the harness's structured logging silently fails.

**Safe modification:**
1. Pin `@opencode-ai/sdk` and `@opencode-ai/plugin` to exact versions (currently `^1.16.2` which allows minor bumps).
2. After SDK upgrades, run the full test suite to catch type mismatches.
3. Use `context7` to verify the SDK's actual API surface before adding new SDK calls.

**Test coverage:** `tests/tools/delegation/delegate-task-e2e.test.ts` and `delegate-task-v2.test.ts` cover the dispatcher. The SDK cast is not tested in isolation.

### Two front-facing agents (`build.md` and `hm-orchestrator.md`)

**Why fragile:** Both `build.md` and `hm-orchestrator.md` are front-facing L0 agents. They have overlapping responsibilities (delegation, quality gates) and may conflict when both are active in a session.

**Files & evidence:**
- `.opencode/agents/build.md` — new front-facing L0 strategist, max 3 skills, "Routes meta-concept work to hf-orchestrator."
- `.opencode/agents/hm-orchestrator.md` — L0 front-facing for session orchestration, hidden.

**Common failures:**
- OpenCode picks the wrong one based on `description` matching.
- A user prompt matches both, leading to dual dispatch.

**Safe modification:**
1. Decide which is the canonical L0 (per the project owner's choice between `build` and `hm-orchestrator`).
2. If `build` is canonical, mark `hm-orchestrator` as `hidden: true` in `opencode.json` or remove it.
3. Document the division of responsibility in `AGENTS.md`.

**Test coverage:** N/A — agent definitions are not unit-tested.

### GSD-resident `gsd-codebase-mapper` is the same as `gsd-codebase-mapper` in deployed (me)

**Why fragile:** The agent definition that spawned this analysis (`.opencode/agents/gsd-codebase-mapper.md`) lives in `.opencode/agents/`. It is not in the assets/ source-of-truth, so any edit to it is at risk of being wiped by `node scripts/sync-assets.js`.

**Safe modification:**
1. Edit `.hivefiver-meta-builder/agents-lab/active/refactoring/gsd-codebase-mapper.md` (the Lab layer per `SoT-POLICY.md` §2).
2. Run `node scripts/sync-assets.js` to propagate.
3. Never edit `.opencode/agents/gsd-*.md` directly.

**Test coverage:** N/A.

---

## Scaling Limits

### Agent discovery scan grows linearly with primitive count (medium)

**Current capacity:** 75 agents, 34 non-GSD skills, 19 commands in shipped layer (plus 33 gsd-* in deployed layer).

**Limit:** OpenCode's agent discovery scans all `.md` files in `.opencode/agents/`. At 200+ agents, discovery time grows linearly.

**Scaling path:**
1. Move gsd-* agents to `.opencode/gsd-core/agents/` and update the discovery config.
2. Group agents by lineage (hm-*, hf-*, gate-*) and allow OpenCode to load only the relevant lineage.
3. Use `agents.json` index instead of directory scan (would require sync-assets.js change).

### Session-tracker JSON files grow unbounded (medium)

**Current capacity:** Each session creates 1+ JSON files in `.hivemind/delegation-managements/`, `.hivemind/journal/`, `.hivemind/session-tracker/`. A long-running session (30 phases) can produce 1,000+ files.

**Limit:** File-system lookup degrades above 10,000 files per directory. Some harness users run multi-day sessions.

**Scaling path:**
1. Shard by date: `.hivemind/delegation-managements/YYYY-MM-DD/`.
2. Compress old files to `.json.gz` after 7 days.
3. Rotate via `.hivemind/.archive/` (the existing `.archive/` dir at repo root suggests the pattern is intended).

### Continuity store: `recordSessionContinuity` appends to JSON (medium)

**Current capacity:** `.hivemind/state/agent-work-contracts.json` is a single JSON file. Each session event rewrites the entire file (per `src/task-management/continuity/index.ts:302`).

**Limit:** A file with 1,000 sessions can reach 5-10 MB. Rewrites are O(n).

**Scaling path:**
1. Switch to an append-only journal (`.hivemind/journal/harness/`) and compact on read.
2. Use SQLite for the state file (would require a dependency).
3. Implement a `stateVersion` schema migration to allow breaking changes.

---

## Dependencies at Risk

### `@opencode-ai/sdk` and `@opencode-ai/plugin` pinned at `^1.16.2` (medium)

**Risk:** Both are pinned with caret (`^1.16.2`), allowing minor version upgrades. The harness has 13 `as any` casts in the SDK bridge code (`src/plugin.ts`, `src/sidecar/...`); a minor version bump can break the harness silently.

**Impact:** A future OpenCode release could rename `parts[].type` values, change the message envelope, or restructure `client.session.prompt()` — all without test failures (the casts absorb the type errors).

**Migration plan:** Pin exact versions (`1.16.2` → `1.16.2`, not `^1.16.2`) and require manual review of the OpenCode changelog before any upgrade.

### `bun-pty` is optional (low)

**Risk:** `bun-pty ^0.4.8` is in `optionalDependencies`. If absent, the harness falls back to headless `node:child_process` (per AGENTS.md). On macOS, bun-pty is usually available; on Linux, it may not be.

**Impact:** Tmux-based delegation requires bun-pty. Without it, the harness degrades to headless and tmux panes are not created.

**Migration plan:** Document the bun-pty requirement in `README.md` and add a `npm install bun-pty` recommendation.

### `zod` major version (low)

**Risk:** `zod: ^4.4.3`. Zod 4 introduced breaking changes from v3. The harness's `src/schema-kernel/prompt-enhance.schema.ts` and other schemas may use v3 patterns.

**Impact:** A future Zod minor (4.5, 4.6) may break schema construction.

**Migration plan:** Run `npm run typecheck` after every `npm install`. Add a test that constructs every Zod schema and validates a sample.

### `eslint` major version `^10.4.1` (low)

**Risk:** ESLint 10 is current. ESLint's major releases often break plugin compatibility.

**Impact:** A future ESLint 11 may require plugin updates.

**Migration plan:** Track via `npm outdated`.

---

## Missing Critical Features

### No E2E test for full delegation lifecycle (medium)

**Problem:** Tests cover individual modules (delegation manager, status, completion detector) but no test runs a full LLM provider → session-tracker → completion → status polling cycle.

**Blocks:** Cannot verify that the S5b tmux synthesis, the R7/R9 mitigation, and the dual-write all work together in production conditions.

**Suggested fix:** Add `tests/e2e/delegation-lifecycle.test.ts` that uses a mock SDK client (per `transport-mocked` evidence label from `AGENTS.md` §Test-Driven Development) and asserts on the full delegation state machine.

### No `node scripts/sync-assets.js` dry-run mode (medium)

**Problem:** `scripts/sync-assets.js` (512 LOC) runs the full sync on every `npm run build`. A broken sync (e.g., missing source file) is detected only at build time, not at `git commit` time.

**Blocks:** Phase work can commit a half-synced state and break the deployed layer.

**Suggested fix:** Add `--dry-run` and `--check` flags to `sync-assets.js` and wire `--check` into a pre-commit hook.

### No automated drift detection between `assets/` and `.opencode/` (medium)

**Problem:** The SoT policy at `SoT-POLICY.md` §5 says "If you edit `.opencode/...` directly: The edit is a sync violation... will not appear in git diff against `assets/...` and will be lost on fresh install." But there is no automated check for this — the only enforcement is the install-state file and the migration journal.

**Blocks:** The constitution is enforced by convention, not by tool.

**Suggested fix:** Add a `scripts/check-sot-drift.js` that compares `assets/agents/`, `assets/skills/`, `assets/commands/`, etc. against their `.opencode/` counterparts and reports mismatches. Wire it into a pre-commit hook.

### No README for the `dist/` build output (low)

**Problem:** `dist/` is gitignored and regenerated by `npm run build`. The schema-kernel generates `.hivemind/configs.schema.json` at build time, but the schema is not versioned or tested.

**Blocks:** Consumers of the npm package cannot verify which schema version they need.

**Suggested fix:** Add a `scripts/verify-build.js` that asserts the generated `configs.schema.json` matches the expected version.

---

## Test Coverage Gaps

### Below-target coverage (high)

**Current state:** Per `coverage-report.md` (2026-05-28):
- Statements: 79.4% (target 90%)
- Branches: 66.2% (target 80%)
- Functions: 85.83% (target 90%)
- Lines: 81.4% (target 90%)

**Files & evidence:** `coverage-report.md` provides per-module breakdown but is dated 2026-05-28 (9 days old as of analysis). No fresh `npm run test:coverage` was run during this analysis.

**Risk:** Untested branches hide latent bugs. The 12 pre-existing failures compound the risk.

**Priority:** High. Bring branches to 80% first (lowest current, highest ROI for risk reduction).

### No tests for `src/plugin.ts` (the composition root) (high)

**Files:** `src/plugin.ts` (1,076 LOC) is the most fragile file but has no dedicated test file (`tests/plugin/` subdir exists but is unclear in scope).

**What's not tested:** The factory function calls, the hook chain order, the tool registration, the config subscriber wiring.

**Risk:** A new contributor changing the import order could break the harness silently.

**Priority:** High. A composition-root test is cheap and high-value.

### No tests for the sidecar HTTP routes (high)

**Files:** `src/sidecar/server/routes/` (state.ts, sessions.ts, etc.) and `src/sidecar/server/tool-proxy/handlers/`.

**What's not tested:** Route handlers, query parameters, error responses, authentication (or lack thereof).

**Risk:** The sidecar is exposed on `server.port: 4096` per `opencode.json`. A misconfigured route could expose delegation state to network callers.

**Priority:** High. Add integration tests for each route.

### `src/coordination/delegation/coordinator.ts` partially covered (medium)

**Files:** 746 LOC, 3 of the S5b-fix paths are commented but only 1 has direct test coverage.

**What's not tested:** The S5b synthesis block, the fallback path when `tmuxIntegration` is null, the session-tracker integration.

**Risk:** A regression in S5b would only be caught at UAT (per `CHANGELOG.md` it was a UAT blocker).

**Priority:** Medium. Add focused tests on the S5b path before the next tmux change.

### `src/coordination/command-delegation/handler.ts` minimal coverage (medium)

**Files:** ~400 LOC, 1 test file (`tests/coordination/command-delegation/handler.test.ts` likely).

**What's not tested:** `buildMinimalEnv()` (the env allowlist), the PTY → headless fallback, the error recovery flow.

**Priority:** Medium. The env allowlist is a security boundary; it should be unit-tested.

---

## Summary of Priorities for Phase Planning

| Priority | Concern | Category |
|---|---|---|
| P0 (next phase) | 12 pre-existing test failures | Bug |
| P0 | gsd-* agents in wrong path (`assets/agents/` vs `.opencode/get-shit-done/`) | Constitutional violation |
| P0 | `.env` API key safety review | Security |
| P0 | Below-target coverage (66% branches) | Test gap |
| P0 | No tests for `src/plugin.ts` composition root | Test gap |
| P1 | Resolve 19 TODO-2 R7/R9 mitigations | Tech debt |
| P1 | Dual-write race in `delegation-persistence.ts` | Bug |
| P1 | No E2E delegation lifecycle test | Test gap |
| P1 | No automated SOT drift detection | Missing feature |
| P2 | GSD framework migration residue (`get-shit-done/` empty, `gsd-migration-journal/`) | Tech debt |
| P2 | 200+ stale `.backup` files in `.opencode/` | Tech debt |
| P2 | 13 `as any` escape hatches in SDK bridge | Tech debt |
| P2 | 56 unprefixed `throw new Error(...)` sites | Tech debt |
| P2 | 9 source files exceeding 500-LOC limit | Tech debt |
| P2 | 5 `@deprecated` markers in source | Tech debt |
| P2 | Two front-facing L0 agents (build, hm-orchestrator) | Fragile area |
| P3 | 30+ `console.*` calls instead of typed logger | Tech debt |
| P3 | Pin `@opencode-ai/sdk` and `@opencode-ai/plugin` to exact versions | Dependencies |
| P3 | Session-tracker JSON growth unbounded | Scaling limit |
| P3 | Continuous console.error spam on persistence failure | Performance |
| P3 | Plugin load time not benchmarked | Performance |

---

*Concerns audit: 2026-06-06*
