# Phase 50: Cleanup opencode-tmux fork — Research

**Researched:** 2026-06-02
**Branch:** `feature/harness-implementation`
**Base commit:** `ad43e657 P50 Checkpoint 5: 50-CONTEXT.md — 5 questions resolved (Q1 scope/Q2 cache/Q3 AGENTS.md/Q4 CHANGELOG/Q5 branch)`
**Confidence:** HIGH (docs-only synthesis, all 4 deletion targets verified clean against code truth)
**Composite risk:** **0.05** (TARGET ≤ 0.20 ✓)

---

## 1. Executive Summary

Phase 50 is a **docs-only synthesis phase** that drops the in-tree `opencode-tmux/` fork (932 LOC src + 1820 LOC test across 15 entries) plus 3 CI-coupled artifacts (`scripts/sync-fork.sh` 126 LOC, `tests/scripts/sync-fork.bats` 210 LOC, `.github/workflows/ci.yml:64-82` `bats-vendor-sync` job). Two doc edits update `.planning/AGENTS.md` and `CHANGELOG.md` to reflect "in-tree tmux-copilot (P51-P55)" instead of "vendored opencode-tmux fork". **No source code in `src/` will be modified** — the runtime safety net (D-04 `existsSync` check in `src/features/tmux/integration.ts:197-202`) gracefully no-ops when the fork is absent, satisfying EARS-3. Composite risk 0.05 is well below the 0.20 threshold; EXECUTE phase can proceed with a single atomic commit.

---

## 2. Scope Confirmation

5 locks from `50-CONTEXT.md` verified against code truth:

| CONTEXT Decision | Resolution | Code-Truth Evidence |
|------------------|------------|---------------------|
| **Q1 — Scope** | 4 file deletions + 2 doc edits (AGENTS.md, CHANGELOG.md). NO AWC amend. | `ls opencode-tmux/` shows 15 entries; `ls scripts/sync-fork.sh tests/scripts/sync-fork.bats .github/workflows/ci.yml` confirms 3 CI-coupled files |
| **Q2 — Cache** | No intermediate `dist/` files to keep; `opencode-tmux/dist/` (build output) is fully deletable | `opencode-tmux/dist/` is regenerated only by the fork's own build, not consumed by Hivemind |
| **Q3 — AGENTS.md** | Will remove "opencode-tmux fork" wording; replace with "in-tree tmux-copilot (P51-P55)" | `grep "opencode-tmux"` in `.planning/AGENTS.md` returns 1 match (in tmux-copilot context) |
| **Q4 — CHANGELOG.md** | Will add "P50 — Drop vendored opencode-tmux fork; preserve D-04 existsSync graceful-fallback" entry | `CHANGELOG.md` exists, P50 entry pending |
| **Q5 — Branch** | `feature/harness-implementation` (current) | `git branch --show-current` confirms |

**CP-PTY runway separation** (per `.opencode/rules/universal-rules.md` §7): Phase 50 does NOT touch CP-PTY-01..04. All `child_process.spawn('tmux', ...)` calls in P51-P55 use headless process spawn (not PTY). `SC-PTY-01` read-only projection DEFERRED and unaffected.

**AWC amend policy:** NO `agent-work-contract` modifications. P50 is content-only.

---

## 3. Codebase Findings

### 3.1 Files in deletion scope (4)

| Path | Type | LOC | Status |
|------|------|-----|--------|
| `opencode-tmux/` (15 entries: `src/`, `src/__tests__/`, `dist/`, `node_modules/`, `coverage/`, `.github/`, `package.json`, `bun.lock`, `bunfig.toml`) | Directory | ~932 src + ~1820 test | Self-contained fork |
| `scripts/sync-fork.sh` | Shell script | 126 | BATS-under-test (PINNED_FILES L22-27) |
| `tests/scripts/sync-fork.bats` | BATS test | 210 | 3 scenarios (fast-forward, non-pinned conflict, pinned-file conflict) |
| `.github/workflows/ci.yml` L64-82 (`bats-vendor-sync` job) | CI YAML | 19 lines | `continue-on-error: true` (D-08 soft signal) |

### 3.2 Fork source files (informational only — for P51+ L-targets)

- **`opencode-tmux/src/tmux.ts`** (307 lines): `TmuxMultiplexer` class with `isAvailable()`, `isInsideSession()`, `spawnPane()`, `closePane()`, `quoteShellArg()` at L34-36. Pattern: `execFile` from `node:child_process` (not PTY).
- **`opencode-tmux/src/session-manager.ts`** (307 lines): 6 state sets — `sessions`, `knownSessions`, `spawningSessions`, `spawnedSessions`, `closedSessions`, `pendingClose`. Pane lifecycle FSM (idle/attaching/attached/detaching/dead). `respawnIfKnown()` L230-260 and `spawnPaneWithMeta()` L267-287 are **PUBLIC** methods called by Hivemind adapter (Phase 43 REQ-06). Hivemind delegation metadata captured via `EnrichedSessionEvent.hivemindMeta` (L13-19, L85, L122, L258).
- **`opencode-tmux/src/grid-planner.ts`** (120 lines): `PaneGridPlanner` class. DFS preorder walk (L59-67). 500ms trailing-edge debounce (L41, L89-98). Direction rule: depth-1 → "h" (horizontal), depth-2+ → "v" (vertical) (L60). NO cache layer (D-43-04).
- **`opencode-tmux/src/__tests__/`**: 3 test files (tmux.test.ts 599 lines, grid-planner.test.ts 198 lines, session-manager.test.ts ~600 lines). All `bun:test`-based (NOT vitest).

### 3.3 Files referencing fork patterns (NO deletions required)

| File:line | Type | Action |
|-----------|------|--------|
| `src/features/tmux/fork-bridge.ts:5,13,31,53,66` | Comments only (no TS imports) | **NO CHANGE** — comments document the structural-types boundary |
| `src/features/tmux/integration.ts:197-202` | D-04 runtime safety net (`existsSync` check) | **PRESERVE** — graceful fallback per P43-02 contract |
| `tests/lib/tmux/integration.test.ts:310,315` | Test mock for FORK_PACKAGE_DIR path | **NO CHANGE** — `existsSyncMock.mockImplementation` fakes `true` independently of filesystem |
| `tests/integration/hook-registration.test.ts:103` | Asserts `Object.keys(result.tool).length === 26` | **NO CHANGE** — 26 tools live in `src/tools/`, not `opencode-tmux/` |

### 3.4 CP-PTY references (verified absent)

- `grep -rn "child_process.spawn" src/features/ src/coordination/`: **0 matches**
- `grep -rn "execFile" src/features/tmux/`: 2 matches in `integration.ts:7,15` (sync, via `promisify` for binary resolution and tmux version detection)
- PTY integration (when used elsewhere) is via the optional `bun-pty` dependency — never in tmux-copilot path
- P51+ tmux-copilot will use `child_process.spawn('tmux', ...)` per `.opencode/rules/universal-rules.md` §7 CP-PTY runway separation

---

## 4. Dependency & Risk Analysis

### 4.1 Lockfile validation (RESEARCH scope §1)

- **`package.json`** (root): **0 matches** for `opencode-tmux|@hivemind/opencode-tmux|FORK_PACKAGE_DIR|sync-fork|bats-vendor-sync`. No `workspaces`, no `file:` reference. Scripts: `typecheck` (tsc --noEmit) and `test` (vitest run) at L43-44.
- **`package-lock.json`** (root, 191882 B): **0 matches** for fork patterns. Lockfile is clean — fork was vendored in-tree, NEVER installed as npm dep.
- **`opencode-tmux/bun.lock`** (7944 B): Lives INSIDE the fork; will be deleted with the directory. Root install unaffected.
- **`opencode-tmux/package.json`** (v0.6.0, name `@hivemind/opencode-tmux`): Self-contained. Peer dep `@opencode-ai/plugin ^1.15.13`. Repo: `https://github.com/shynlee04/opencode-tmux`. Scope "hivemind/" is misleading — this is a sibling fork, not a Hivemind product.
- **`opencode.json`** (root): Plugin manifest at `./dist/plugin.js` (in-tree, no fork reference).

**Conclusion:** `npm ci` will be unaffected by deletion. No lockfile edits required.

### 4.2 Test impact analysis

- `tests/integration/hook-registration.test.ts:103` — asserts 26 tool keys. All 26 tools live in `src/tools/` (delegation, session, config, hivemind, prompt). Deletion does NOT affect count.
- `tests/lib/tmux/integration.test.ts:310,315` — mocks `existsSync` to return `true` for the FORK_PACKAGE_DIR path. Mock is independent of filesystem; test still passes after deletion (production check returns `false`, but test fakes `true`).
- `tests/lib/tmux/fork-bridge.test.ts`, `tmux-copilot.test.ts`, `observers.test.ts` — test the structural adapter pattern, not the fork. Unaffected.
- `opencode-tmux/src/__tests__/*` — `bun:test`-based, NOT run by `npm test` (which uses vitest). Deletion is safe; no test loss in CI/CD.

### 4.3 CI impact

- `bats-vendor-sync` job L64-82 in `.github/workflows/ci.yml`: `continue-on-error: true` (D-08 soft signal). Job is non-gating. Deletion will not block any other CI step.
- After deletion, `bats tests/scripts/sync-fork.bats` step is removed; CI will not attempt to run BATS (which is not in `package.json` devDependencies).
- **L1 evidence for P50:** `npm run typecheck` (tsc --noEmit) + `npm test` (vitest run). These are the only commands in scope; both should pass unchanged.

### 4.4 Runtime safety net (D-04)

`src/features/tmux/integration.ts:197-202`:
```ts
const FORK_PACKAGE_DIR = "node_modules/@hivemind/opencode-tmux";
if (forkSessionManager !== undefined && forkSessionManager !== null) {
  if (existsSync(join(projectDirectory, FORK_PACKAGE_DIR))) {
    setForkSessionManager(forkSessionManager);
  }
}
```

After P50 deletion:
- `existsSync(...)` returns `false` (fork package absent)
- `setForkSessionManager()` is NOT called
- Integration still works for tmux pane commands (binary detection, port persistence, version resolution)
- tmux-copilot tool calls return `{available: false, reason: "fork-not-wired"}` (P43-02 graceful-unavailable contract preserved)
- This is the EXACT mechanism EARS-3 requires

---

## 5. Cross-Reference Matrix (SPEC ↔ CONTEXT ↔ Code Truth)

| SPEC Req | CONTEXT Decision | Code Truth | Status |
|----------|------------------|------------|--------|
| **EARS-1** Drop `opencode-tmux/` directory | Q1 scope | `ls opencode-tmux/` shows 15 entries (src/, dist/, node_modules/, etc.) | ✓ VERIFIED |
| **EARS-2** Drop `scripts/sync-fork.sh` | Q1 scope | File exists, 126 LOC, BATS-under-test | ✓ VERIFIED |
| **EARS-3** Integration gracefully no-op when fork absent | Q1 scope (preserve D-04) | `src/features/tmux/integration.ts:197-202` has `existsSync` check | ✓ PRESERVED |
| **EARS-4** Drop `tests/scripts/sync-fork.bats` | Q1 scope | File exists, 210 LOC, 3 scenarios | ✓ VERIFIED |
| **EARS-5** Drop `bats-vendor-sync` CI job | Q1 scope | `.github/workflows/ci.yml:64-82`, `continue-on-error: true` | ✓ VERIFIED |
| **EARS-6** Update AGENTS.md to remove fork wording | Q3 | TBD in EXECUTE | ⏳ PENDING |
| **EARS-7** Add CHANGELOG.md entry | Q4 | TBD in EXECUTE | ⏳ PENDING |

**EARS-1..EARS-5** (5 boundary contracts): all preserved by deletion.
**EARS-6, EARS-7** (2 doc edits): queued for EXECUTE phase.

---

## 6. STRIDE Threat Model

| Threat | Category | Assessment | Mitigation |
|--------|----------|------------|------------|
| **Spoofing** (forge fork presence) | S | N/A | D-04 `existsSync` check is the only authority; deletion strengthens this by removing the only place the fork COULD exist |
| **Tampering** (modify fork code post-deletion) | T | N/A | Directory deleted; no surface to tamper. `git log` will show the deletion commit; future cherry-picks cannot reintroduce without explicit `git rm` reversal |
| **Repudiation** (claim fork was loaded) | R | LOW | `fork-bridge.ts:getForkSessionManager()` returns `null` after deletion; tmux-copilot tool returns `{available: false, reason: "fork-not-wired"}` per P43-02 contract |
| **Information Disclosure** (leak fork source) | I | LOW (RESOLVED) | 932 LOC src + 1820 LOC test leaves repo; reduces public surface. No secrets found (scan: 0 matches for `.env*|.npmrc|*.pem|*.key|id_rsa*`) |
| **Denial of Service** (CI fails on BATS install) | D | RESOLVED | BATS job has `continue-on-error: true` (D-08); deletion removes the only failure path entirely |
| **Elevation of Privilege** (use fork as backdoor) | E | N/A | Fork was runtime-injected via `setForkSessionManager()`; structural adapter type prevents unexpected input. Deletion removes attack surface. |

**Net STRIDE:** All categories N/A or LOW. No new threats introduced by deletion. **2 RESOLVED, 4 N/A.**

---

## 7. Open Questions / Blockers

3 open questions from `50-CONTEXT.md`, all CLOSED by this research:

| # | Question | Resolution | Evidence |
|---|----------|------------|----------|
| 1 | Q1 — Scope: 4 deletions or 4 deletions + 2 doc edits? | **CLOSED: 4 deletions + 2 doc edits** | CONTEXT §Q1 + Q3/Q4 |
| 2 | Q2 — Cache: keep `opencode-tmux/dist/`? | **CLOSED: DELETE all 15 entries** | Fork is self-contained; `dist/` not consumed by Hivemind |
| 3 | Q3 — AGENTS.md wording | **CLOSED: replace "vendored opencode-tmux fork" with "in-tree tmux-copilot (P51-P55)"** | Per Q3 decision |
| 4 | Q4 — CHANGELOG.md entry | **CLOSED: add P50 entry** | Per Q4 decision |
| 5 | Q5 — Branch | **CLOSED: `feature/harness-implementation`** | `git branch --show-current` confirms |

**No blockers. Composite risk 0.05 < 0.20 threshold. EXECUTE phase (Checkpoint 9) can proceed.**

---

## 8. Composite Risk Score

| Risk Vector | Score | Rationale | Verification |
|-------------|-------|-----------|--------------|
| Lockfile drift | 0.00 | 0 matches in `package.json` / `package-lock.json` | §4.1 grep |
| Code import break | 0.00 | 0 TS imports of fork; structural types only | §3.3 grep |
| Test break | 0.05 | 26 tool keys + tmux test mocks; verified independent of filesystem | §4.2 |
| CI regression | 0.00 | BATS job `continue-on-error: true`; non-gating | §4.3 |
| Boundary contract violation | 0.00 | EARS-1..EARS-5 boundary contracts preserved | §5 |
| CP-PTY coupling | 0.00 | P50 does not touch CP-PTY runway (§3.4) | §3.4 grep |
| AGENTS.md / CHANGELOG.md edit miss | 0.00 | Q3 + Q4 resolved; 2 edits queued for EXECUTE | §2 |
| **Composite** | **0.05** | **TARGET ≤ 0.20 ✓** | weighted max |

**Conclusion:** Composite risk 0.05 is **4× below** the 0.20 threshold. EXECUTE phase is GREEN-LIT.

---

## 9. Recommended Approach for EXECUTE Phase

### 9.1 Deletion sequence (4 git operations)

```bash
# 1. Drop the in-tree fork (15 entries, ~2752 LOC total)
git rm -r opencode-tmux/

# 2. Drop the BATS-under-test shell script (126 LOC)
git rm scripts/sync-fork.sh

# 3. Drop the BATS test suite (210 LOC, 3 scenarios)
git rm tests/scripts/sync-fork.bats

# 4. Edit .github/workflows/ci.yml to remove bats-vendor-sync job (L64-82)
#    Use Edit tool, not git rm (preserves the rest of the workflow file)
#    Delete lines 64-82 inclusive
```

### 9.2 Doc edits (2)

1. **`AGENTS.md`** — Remove "vendored opencode-tmux fork" wording; add "in-tree tmux-copilot (P51-P55)".
2. **`CHANGELOG.md`** — Add entry: `P50 — Drop vendored opencode-tmux fork; preserve D-04 existsSync graceful-fallback. Composite risk 0.05.`

### 9.3 L1 verification commands

```bash
# Type-check (must pass)
npm run typecheck

# Test suite (must pass; 26 tool keys + fork-bridge mocks unaffected)
npm test

# Working tree confirms 4 deletions + 2 edits
git status --short

# Confirm 0 remaining fork refs in non-md files
git grep -n 'opencode-tmux' -- ':!*.md' ':!*.md.backup'

# Final lockfile integrity check
npm ls @hivemind/opencode-tmux 2>&1 | grep -q "empty" && echo "OK: no npm dep"
```

### 9.4 Atomic commit

Per `AGENTS.md` ("Atomic commits are mandatory. One logical change = One commit."):

```bash
git add -u  # stages all tracked-file modifications and deletions
# (DO NOT use `git add -A` — it would also stage any untracked .hivemind/ files
#  from the session-tracker, which is append-only and should NOT be in this commit)

# Verify staged set is exactly the 4 deletions + 2 doc edits
git status --short

git commit -m "P50 Checkpoint 6: 50-RESEARCH.md — 7-point scope verified (composite_risk TARGET ≤ 0.20)"
```

### 9.5 Trajectory event

- `trajectoryId`: `traj-phase-50`
- `eventId`: `event-phase50-checkpoint6-research-complete-2026-06-02`
- `eventType`: `checkpoint_complete`
- `summary`: `P50 Checkpoint 6 (RESEARCH) complete — 50-RESEARCH.md committed`

---

## 10. References & Anchors

### Phase artifacts
- **SPEC:** `.planning/phases/50-cleanup-opencode-tmux-fork/50-SPEC.md` (31427 B, 7 EARS, composite clarity 0.036)
- **CONTEXT:** `.planning/phases/50-cleanup-opencode-tmux-fork/50-CONTEXT.md` (23829 B, 5 decisions, 0 open questions after this research)
- **Close-pivot:** `.planning/phases/49-close-tmux-end-to-end-gap-register-tmux-copilot-in-src-plugi/49-CLOSE-PIVOT-2026-06-02.md` (16388 B)
- **AGENTS.md:** `.planning/AGENTS.md` §7 (CP-PTY runway separation)
- **Universal Rules:** `.opencode/rules/universal-rules.md` §4 (11-checkpoint phase loop), §7 (CP-PTY)

### Source files (verified, NOT modified by P50)
- `src/features/tmux/fork-bridge.ts:127-138` — runtime-injection boundary, structural types (L5, L13, L31, L53, L66 comments only)
- `src/features/tmux/integration.ts:197-202` — D-04 graceful-fallback `existsSync` check (PRESERVE)
- `tests/lib/tmux/integration.test.ts:310,315` — test mock for FORK_PACKAGE_DIR
- `tests/integration/hook-registration.test.ts:103` — 26 tool keys assertion
- `package.json` (root) — 0 fork references
- `package-lock.json` (root, 191882 B) — 0 fork references
- `opencode.json` — plugin manifest `./dist/plugin.js` (in-tree)

### Fork files (deletion targets, informational for P51+ L-targets)
- `opencode-tmux/package.json` — v0.6.0, name `@hivemind/opencode-tmux`, peer `@opencode-ai/plugin ^1.15.13`
- `opencode-tmux/src/tmux.ts` (307 lines) — `TmuxMultiplexer` class
- `opencode-tmux/src/session-manager.ts` (307 lines) — 6 state sets FSM + Hivemind delegation metadata
- `opencode-tmux/src/grid-planner.ts` (120 lines) — DFS preorder + 500ms debounce
- `opencode-tmux/src/__tests__/tmux.test.ts` (599 lines) — bun:test
- `opencode-tmux/src/__tests__/grid-planner.test.ts` (198 lines) — bun:test
- `opencode-tmux/src/__tests__/session-manager.test.ts` (~600 lines) — bun:test
- `opencode-tmux/bun.lock` (7944 B) — INSIDE fork, deletes with dir
- `opencode-tmux/bunfig.toml`, `dist/`, `node_modules/`, `coverage/`, `.github/`

### CI artifacts (deletion targets)
- `scripts/sync-fork.sh` (126 LOC) — BATS-under-test (PINNED_FILES L22-27, dry-run, merge-tree)
- `tests/scripts/sync-fork.bats` (210 LOC) — 3 scenarios (fast-forward, non-pinned, pinned-file)
- `.github/workflows/ci.yml:64-82` — `bats-vendor-sync` job, `continue-on-error: true`

### Git anchors
- **Branch:** `feature/harness-implementation`
- **Base:** `ad43e657 P50 Checkpoint 5: 50-CONTEXT.md — 5 questions resolved`
- **Previous P49 close:** `a3f3f647 docs(plan): close P49, advance to P50-P55 in-tree synthesis`
- **Pivot commit:** `209ca5f8 docs(49): close P49 with code truth — pivot to P50-P55 in-tree synthesis`

---

**End of RESEARCH.md — EXECUTE phase (Checkpoint 9) is GREEN-LIT. Composite risk 0.05 ≤ 0.20 target. Single atomic commit queued. No AWC amend. No CP-PTY coupling.**
