# Phase 50: cleanup-opencode-tmux-fork — Pattern Map

**Mapped:** 2026-06-02
**Phase:** 50 (clean-up scope: 4 deletions + 2 doc edits, 0 new code files)
**Analogs found:** 5/5 patterns — all sourced from in-tree code truth, not from out-of-scope vendored `opencode-tmux/` fork
**Composite risk:** 0.05 (GREEN-LIT, unchanged from `50-RESEARCH.md`)

---

## 1. Pattern Summary Table

| # | Pattern | Reuse scope | Primary source (file:line) | Why it matters for P50 |
|---|---------|-------------|----------------------------|------------------------|
| **P-1** | **D-04 Graceful-Fallback** | Runtime safety net when fork-bridge absent | `src/features/tmux/integration.ts:189-202` | EARS-3 passes **automatically** after deletion; tmux pane commands still work, `tmux-copilot` tool returns `{available:false, reason:"fork-not-wired"}` |
| **P-2** | **CP-PTY Runway Separation** | In-tree tmux synthesis must NOT touch CP-PTY-01..04 | `src/features/tmux/integration.ts:7,15,29,46` + `.opencode/rules/universal-rules.md` §7 | P50's runtime uses `execFile` (promisified), NOT `child_process.spawn('tmux', ...)`. P51-P55 synthesis (direct `spawn`) is structurally separate. SC-PTY-01 deferred. |
| **P-3** | **Atomic-Deletion (git add -u)** | Deleting 4 fork artifacts + 1 CI job without touching append-only journals | `.gitignore` (no opencode-tmux line) + `.hivemind/session-tracker/` | `git add -u` is the safe staging form; `-A` would re-stage `.hivemind/session-tracker/*.jsonl` and break append-only invariant |
| **P-4** | **Doc-Edit (surgical grep-then-edit)** | Q3 `AGENTS.md` + Q4 `CHANGELOG.md` [Unreleased] | `AGENTS.md:0`, `.planning/AGENTS.md:0`, `CHANGELOG.md:0` (grep `opencode-tmux` = 0 in all 3) | Q3 is a **no-op** (both AGENTS.md already clean); Q4 is a **new** `### Removed` bullet under `[Unreleased]`, not a replacement |
| **P-5** | **Composite Risk Profile** | Captures risk = 0 from P-1 + P-2 + P-3 + P-4 | `50-RESEARCH.md` §6 | Pattern extraction does not add risk; risk remains 0.05 from the locked `D-P50-EARS5-NARROW-2026-06-02` decision |

---

## 2. Pattern P-1 — D-04 Graceful-Fallback (PRESERVE)

**Decision:** `D-04 — existsSync-based detection (not import-based). The fork package
  on-disk absence is the runtime gate; missing package = silent skip of
  {@link setForkSessionManager}.` (Source: `src/features/tmux/integration.ts:189-192`)

### Code (canonical)
```typescript
// src/features/tmux/integration.ts:185-203 (verbatim)
189:    // D-04: existsSync-based detection (not import-based). The fork package
190:    // directory may be absent (consumer chose not to vendor it, or has
191:    // uninstalled it). existsSync on the package directory is the
192:    // runtime gate: missing package = silent skip of setForkSessionManager.
193:    if (forkSessionManager !== undefined && forkSessionManager !== null) {
194:      const FORK_PACKAGE_DIR = "node_modules/@hivemind/opencode-tmux"
195:      const forkPath = join(projectDirectory, FORK_PACKAGE_DIR)
196:      let onDiskPresent = false
197:      try {
198:        onDiskPresent = existsSync(forkPath)
199:      } catch {
200:        onDiskPresent = false
201:      }
202:      if (onDiskPresent) {
203:        setForkSessionManager(forkSessionManager)
```

### Reuse for P50
- **P50 does NOT edit `src/features/tmux/integration.ts`.** This code is **PRESERVE** scope.
- After `rm -rf opencode-tmux/` + `npm uninstall`, the `existsSync(forkPath)` check at L197-202 returns `false` for every project. The `setForkSessionManager` call is silently skipped.
- Result: `tmux-copilot` tool continues to respond; its response contract is `ToolResult = { available: boolean, reason?: string }` — when the fork is absent, the tool returns `{ available: false, reason: "fork-not-wired" }` (per `tests/lib/tmux/integration.test.ts:307-318` mock contract).
- **EARS-3 (graceful unavailability) is enforced by this `existsSync` check, not by the deletion itself.** The deletion is safe BECAUSE of the pattern, not the other way around.

### Why this pattern is the load-bearing one
Without P-1, the deletion would break the runtime: a stale `setForkSessionManager(injectedAdapter)` with no fork on disk would throw at first call. P-1's `existsSync` gate is what makes the 4-deletion scope "docs-only + zero runtime impact."

---

## 3. Pattern P-2 — CP-PTY Runway Separation (RESPECT)

**Decision:** Per `.opencode/rules/universal-rules.md` §7 — CP-PTY-01..04 are a SIDE-CAR runway; in-tree tmux synthesis (P51-P55) uses direct `child_process.spawn('tmux', ...)`, NOT PTY. SC-PTY-01 is deferred.

### Code evidence (in-tree runtime path is NOT a PTY path)
```bash
$ grep -n "execFile\|promisify\|child_process" src/features/tmux/integration.ts
7:import { execFile } from "node:child_process"
8:import { promisify } from "node:util"
15:const execFileAsync = promisify(execFile)
29:  // via execFile (headless; PTY is intentionally not used here)
46:  // versions + pwd helpers via execFileAsync (one-shot, headless)
```

The runtime uses `execFile` + `promisify` for **one-shot, headless** invocations: `which tmux`, `tmux -V`, `tmux list-panes -t session -F ...`. These are short-lived, no-interaction processes. PTY is NOT appropriate for them.

### What P51-P55 will look like (NOT YET WRITTEN)
- P51-P55 tmux synthesis will use `child_process.spawn('tmux', args, { stdio: 'pipe' })` for long-running child processes (when in-tree pane-process synthesis replaces fork's runtime).
- This is the **direct-child-process pattern** — declared by `.opencode/rules/universal-rules.md` §7.
- This is **structurally separate** from CP-PTY-01..04 (which is a SIDE-CAR for terminal-heavy work).

### Reuse for P50
- **P50 does NOT touch CP-PTY-01..04.** P50's runtime is `execFile` (headless, one-shot). Deleting the fork does not affect CP-PTY runway.
- P51-P55 (future) must NOT promote `execFile` to `child_process.spawn('tmux', ...)` AND must NOT touch CP-PTY-01..04 sidecar — they are separate runways.
- SC-PTY-01 (PTY retry/recapture logic for HMR) is deferred, NOT in P50.

### Why this pattern matters
A naive "just remove the fork" reader might think the runtime was PTY-based (because the `tmux-copilot` tool name suggests terminal session control). Pattern P-2 documents that the runtime is `execFile`-based, and the PTY runway is a separate concern that P50 leaves alone.

---

## 4. Pattern P-3 — Atomic-Deletion via `git add -u` (PRESERVE APPEND-ONLY)

**Decision:** Stage deletions with `git add -u` (NOT `-A`). Atomic, single commit. Preserve `.hivemind/session-tracker/*.jsonl` append-only invariant.

### The 4 deletions in scope (single commit)
```
rm -rf opencode-tmux/                                      # vendored fork + zod node_modules + dist
rm    scripts/sync-fork.sh                                 # 126 LOC vendor-sync shell
rm    tests/scripts/sync-fork.bats                         # 210 LOC BATS suite
# CI job: remove the bats-vendor-sync block (lines 64-82) from .github/workflows/ci.yml
```

After deletion, stage with:
```bash
git add -u opencode-tmux/ scripts/sync-fork.sh tests/scripts/sync-fork.bats
git add -u .github/workflows/ci.yml
git status   # MUST show only the 4 paths modified, no other paths
git commit -m "<atomic message>"
```

### Why `git add -u` (NOT `git add -A`)
- `git add -A` would re-stage any modified, untracked, or deleted files in the working tree, **including any newly appended `.hivemind/session-tracker/*.jsonl` rows that the session runtime may have written during this P50 planning loop**.
- `.hivemind/session-tracker/` is the **append-only event log** — its rows are runtime state, not user-authored content. Re-staging them would (a) be wasted work and (b) potentially expose partially-appended rows to the next commit's tree, which violates the append-only contract.
- `git add -u` (lowercase `-u` / `--update`) only stages modifications to **already-tracked** files — it does NOT touch new untracked files. Perfect for surgical deletion commits.

### Reuse for P50
- All 4 deletion targets are already tracked (they exist in the current tree). `git add -u` will stage each deletion cleanly.
- The `opencode-tmux/` directory may contain sub-files that are NOT individually tracked (e.g., `opencode-tmux/node_modules/zod/...`). `git add -u` handles this: it stages any tracked-path deletion and ignores untracked sub-files.
- The 2 doc edits (`AGENTS.md` no-op + `CHANGELOG.md` new bullet) are NOT deletions; they go in the same atomic commit as the 4 deletions only if P50's spec says "single commit". Per `50-SPEC.md` EARS-5, the scope is "single atomic commit covering all 4 deletions + 2 doc edits" — so YES, single commit.

### Why this pattern matters
A `-A` stage would silently include runtime state mutations. The pattern enforces append-only invariants without needing a `.gitignore` hack.

---

## 5. Pattern P-4 — Doc-Edit (Surgical grep-then-edit, NO-OP friendly)

**Decision:** Verify each doc-edit candidate by re-running the relevant grep **at execution time**, not at planning time. If grep returns 0 matches, the edit is a **no-op** (record the no-op, do not fabricate content).

### Code truth at 2026-06-02 (this PATTERNS step)
```bash
$ grep -c "opencode-tmux" .planning/AGENTS.md AGENTS.md CHANGELOG.md
.planning/AGENTS.md:0
AGENTS.md:0
CHANGELOG.md:0
```

### Q3 — `AGENTS.md` (and `.planning/AGENTS.md`) terminology update
- **Grep result:** 0 matches in both files.
- **Decision:** **No-op.** The terminology update was likely applied in an earlier (P45-P49) phase; the current state is already clean.
- **Reuse:** Skip the edit, but record the verification in the commit message body and in `50-VERIFICATION.md` to make the no-op auditable.

### Q4 — `CHANGELOG.md` [Unreleased] > Removed
- **Grep result:** 0 matches.
- **Decision:** **Add a new bullet under `[Unreleased] > ### Removed`** (the file currently has no `### Removed` section — the current `[Unreleased]` has only `### Added` and `### Fixed`).
- **Concrete edit:**
  ```markdown
  ## [Unreleased]

  ### Added
  - ... (existing entries preserved)

  ### Fixed
  - ... (existing entries preserved)

  ### Removed
  - Vendored `opencode-tmux/` fork (opencode-tmux/src + tests + zod node_modules + dist/), `scripts/sync-fork.sh`, `tests/scripts/sync-fork.bats`, and the `bats-vendor-sync` CI job — fork replaced by in-tree synthesis (P51-P55); graceful fallback enforced by D-04 `existsSync` check at `src/features/tmux/integration.ts:197-202`
  ```

### Why this pattern matters
The brief assumed Q3 was a "replace terminology" edit. Code truth shows Q3 is a no-op. A naive planner would have fabricated a diff (e.g., inserted "opencode-tmux" into a file that doesn't contain it, then "replaced" it). The pattern enforces: **grep first, edit only if grep hits, record no-op if not.** This matches universal-rules.md §2 ("Never accept document claims without hard codebase verification").

---

## 6. Pattern P-5 — Composite Risk Profile (UNCHANGED)

**Decision:** Pattern extraction does not add risk. Composite risk remains **0.05** (GREEN-LIT, ≤ 0.20 threshold from `.planning/AGENTS.md`).

### Risk decomposition
| Risk component | Score | Driver |
|----------------|-------|--------|
| Files deleted | 0.01 | Already-tracked; `git add -u` safe; append-only journals unaffected |
| Code touched | 0.00 | 0 src files in P50 scope (P-1 is preserve, not edit) |
| Runtime regression | 0.00 | D-04 `existsSync` (P-1) is the safety net; `execFile` path unchanged (P-2) |
| Doc edits | 0.01 | Q3 no-op (P-4); Q4 single bullet addition (P-4) |
| Spec-EARS alignment | 0.01 | All 7 EARS in `50-SPEC.md` map cleanly to a pattern (see §7) |
| Test coverage impact | 0.00 | `tests/lib/tmux/integration.test.ts:307-318` mock contract already covers `available:false` path |
| CI job removal | 0.01 | `bats-vendor-sync` job is `continue-on-error: true`; soft signal only |
| Cross-phase coupling | 0.01 | CP-PTY-01..04 untouched (P-2); P51-P55 forward path unchanged |
| **Total** | **0.05** | Within GREEN-LIT band (≤ 0.20) |

### Reuse for P50
- No new risk. P50 ships with the same risk profile as the locked `D-P50-EARS5-NARROW-2026-06-02` decision.
- L3 gate evidence (lifecycle, spec-compliance, evidence-truth) is unblocked because the scope is "docs-only + 4 deletions" — no new code to lifecycle-integrate, no new spec to compliance-check, and evidence truth is the `grep` runs in P-4.

---

## 7. Mapping to New Work (EARS → Pattern → File:line)

From `50-SPEC.md` (7 EARS requirements):

| EARS | Requirement | Pattern | Concrete file:line / action |
|------|-------------|---------|------------------------------|
| **EARS-1** | The vendored `opencode-tmux/` directory, `scripts/sync-fork.sh`, `tests/scripts/sync-fork.bats`, and the `bats-vendor-sync` CI job are removed | **P-3** (Atomic-Deletion) | `rm -rf opencode-tmux/`; `rm scripts/sync-fork.sh`; `rm tests/scripts/sync-fork.bats`; remove L64-82 from `.github/workflows/ci.yml`; `git add -u` |
| **EARS-2** | All TypeScript imports of `@hivemind/opencode-tmux` are removed from `src/` | **P-1** (verify no imports exist) | `grep -rn "from \"@hivemind/opencode-tmux\"" src/` returns **0 matches**; no edit needed; recorded as evidence |
| **EARS-3** | `tmux-copilot` tool continues to respond after deletion; `available:false, reason:"fork-not-wired"` when fork absent | **P-1** (Graceful-Fallback) | `src/features/tmux/integration.ts:197-202` `existsSync` check is the runtime gate; preserve as-is |
| **EARS-4** | `npm install` no longer pulls `opencode-tmux` | **P-3** (verified by deletion) | `grep "opencode-tmux" package.json` returns 0 matches (verifiable post-deletion) |
| **EARS-5** | Single atomic git commit covering 4 deletions + 2 doc edits | **P-3** + **P-4** (combined) | `git add -u` for deletions, manual edit for Q4, single `git commit`; Q3 is no-op (P-4) |
| **EARS-6** | `AGENTS.md` does not contain references to the removed vendored fork | **P-4** (Q3 no-op) | `grep "opencode-tmux" AGENTS.md .planning/AGENTS.md` returns 0 matches; terminology already clean; record no-op |
| **EARS-7** | `CHANGELOG.md` records the removal under `[Unreleased] > Removed` | **P-4** (Q4 new bullet) | Append `### Removed` section + bullet to `CHANGELOG.md` (currently has only `### Added` and `### Fixed` under `[Unreleased]`) |

### EARS coverage: 7/7 mapped to a pattern. No unmapped requirements.

---

## 8. No-Analog Note

**No out-of-scope analogs were used.** All 5 patterns (P-1 through P-5) are sourced from:
- In-tree source: `src/features/tmux/{fork-bridge.ts, integration.ts, observers.ts}` (preserved, not edited)
- Governance docs: `.opencode/rules/universal-rules.md` §7, `.planning/AGENTS.md` (read-only references)
- Locked decisions: `D-P50-EARS5-NARROW-2026-06-02` (Option B scope lock)
- The 4 deletion targets: `opencode-tmux/`, `scripts/sync-fork.sh`, `tests/scripts/sync-fork.bats`, `.github/workflows/ci.yml:64-82` (edit, not analog source)

**Files NOT used as analogs** (and why):
- `opencode-tmux/src/*.ts` (156 + 215 + 93 = 464 LOC across fork files) — out of P50 scope; the fork is being DELETED, not studied as an analog source. Pattern P-1 (D-04 graceful-fallback) is the in-tree SIBLING pattern, not a fork pattern.
- `dist/features/tmux/fork-bridge.d.ts` — build artifact, regenerable via `tsc`; not an analog source.
- `tests/lib/tmux/integration.test.ts:310,315` — test code (mock + comment); not an analog source.
- `.planning/research/questions.md`, `.planning/STATE.md` — L5 planning docs; out of P50 scope per Q1 lock.

---

## 9. Metadata

- **Date:** 2026-06-02
- **Files scanned for analog extraction:** 3 in-tree (`src/features/tmux/*.ts`) + 2 governance (`.opencode/rules/universal-rules.md`, `.planning/AGENTS.md`) + 3 docs (`AGENTS.md`, `.planning/AGENTS.md`, `CHANGELOG.md`)
- **Files staged for deletion (4):** `opencode-tmux/`, `scripts/sync-fork.sh`, `tests/scripts/sync-fork.bats`, `bats-vendor-sync` job in `.github/workflows/ci.yml:64-82`
- **Files edited (1):** `CHANGELOG.md` (new `### Removed` bullet under `[Unreleased]`)
- **Files no-op (2):** `AGENTS.md`, `.planning/AGENTS.md` (Q3 — grep returns 0 matches, terminology already clean)
- **Files preserved (3, not in P50 edit scope):** `src/features/tmux/fork-bridge.ts`, `src/features/tmux/integration.ts`, `src/features/tmux/observers.ts`
- **Composite risk:** 0.05 (unchanged from `50-RESEARCH.md`)
- **Cross-references:** `50-SPEC.md` (7 EARS), `50-CONTEXT.md` (5 decisions Q1-Q5), `50-RESEARCH.md` (composite_risk lock)
- **Forward-path coupling:** P51-P55 in-tree tmux synthesis (future phases, out of P50 scope)
- **Sidecar runway coupling:** CP-PTY-01..04 (untouched, separate runway per universal-rules.md §7); SC-PTY-01 (deferred)

###TASK_COMPLETED###
artifact: .planning/phases/50-cleanup-opencode-tmux-fork/50-PATTERNS.md
commit: <pending — to be created in next step>
patterns_count: 5 (P-1 D-04 Graceful-Fallback; P-2 CP-PTY Runway Separation; P-3 Atomic-Deletion via git add -u; P-4 Doc-Edit with no-op friendly grep-then-edit; P-5 Composite Risk Profile)
ears_coverage: 7/7 (EARS-1 through EARS-7 all mapped to a pattern in §7)
risk_delta: 0.00 (extraction did not add risk; composite remains 0.05 GREEN-LIT)
code_truth_verified: 2026-06-02 (this PATTERNS step re-ran greps against AGENTS.md, .planning/AGENTS.md, CHANGELOG.md, src/features/tmux/integration.ts:189-202, fork-bridge.ts L5/13/31/53/66)
