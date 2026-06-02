---
phase: 50
phase_name: cleanup-opencode-tmux-fork
artifact: CONTEXT
date: 2026-06-02
session_id: ses_179f12bf8ffecgFAIDYV956HUt
owner_agent: hm-intent-loop
parent_session: ses_root_strategist
related_artifact: 50-SPEC.md (locked at 2026-06-02, clarity 0.036 PASS, decision D-P50-EARS5-NARROW-2026-06-02 Option B)
clarity: PASS
status: locked
---

# Phase 50 — CONTEXT & ASSUMPTIONS (5 questions, L5 docs-only)

> **Scope reminder.** `50-SPEC.md` is locked at Checkpoint 4 with 7 EARS and 4 strict deletions: `opencode-tmux/` (15 entries) + `scripts/sync-fork.sh` (126 LOC) + `tests/scripts/sync-fork.bats` (210 LOC) + `.github/workflows/ci.yml` `bats-vendor-sync` job (L64-82). This CONTEXT resolves 5 strategist questions that would otherwise block Checkpoint 8 (PLAN) and Checkpoint 9 (EXECUTE). It does **not** redefine scope; it only clarifies gray areas and locks surface-level changes that are strictly in-scope per the SPEC.

---

## Q1 — Scope verification: docs vs runtime surface

### Question (verbatim)
> "Verify that 4-deletion scope is sufficient. Are there hidden files/dirs/configs/deps/registrations that reference the fork (opencode-tmux/, @hivemind/opencode-tmux, FORK_PACKAGE_DIR, sync-fork.sh, bats-vendor-sync) outside the 4 target files? If yes, list each hidden reference and decide whether it belongs in P50 scope or a follow-up phase."

### Investigation

Grep executed across 8 authoritative doc/config surfaces, 2026-06-02:

| Surface | Path | Matches | Verdict |
|---------|------|---------|---------|
| Project root `README.md` | `/Users/apple/hivemind-plugin-private/README.md` (22,063 B) | 0 | clean |
| Project root `AGENTS.md` | `/Users/apple/hivemind-plugin-private/AGENTS.md` (~40 KB) | 0 | clean |
| Project root `CHANGELOG.md` | `/Users/apple/hivemind-plugin-private/CHANGELOG.md` (~3 KB) | 0 | clean |
| `package.json` | `/Users/apple/hivemind-plugin-private/package.json` (name=`hivemind-3.0`, version=`0.1.0`) | 0 | clean (no fork dep) |
| `PROJECT.md` (top-level) | `/Users/apple/hivemind-plugin-private/PROJECT.md` | file does not exist | n/a |
| `.planning/AGENTS.md` | `/Users/apple/hivemind-plugin-private/.planning/AGENTS.md` | 0 | clean |
| `.planning/REQUIREMENTS.md` | `/Users/apple/hivemind-plugin-private/.planning/REQUIREMENTS.md` | 0 | clean |
| `.planning/STATE.md` | `/Users/apple/hivemind-plugin-private/.planning/STATE.md` | **4** (lines 20, 27, 31, 391-392) | **in-scope update** |
| `src/features/tmux/AGENTS.md` | `/Users/apple/hivemind-plugin-private/src/features/tmux/AGENTS.md` | file does not exist | n/a |

The 16 `README.md` matches and 15 `opencode-tmux/` directory matches in the initial glob are all **inside the fork package itself** — they auto-resolve on deletion 1 of `50-SPEC.md` §2.1.

**`.planning/STATE.md` line-by-line review:**
- L20: `**Current planned phase:** P50 (cleanup-opencode-tmux-fork) → P51 → P52 → P53 → P54 → P55 — in-tree synthesis sequence` — describes planned phase list, still factually true post-cleanup; minor wording only.
- L27: `- **P42-01** — Fork extension: rename to @hivemind/opencode-tmux, config keys, metadata titles, binaryPath (3 commits, 76 tests pass)` — historical fact, do not rewrite history.
- L31: `**Current focus:** P50 — Cleanup opencode-tmux fork + script coupling (PIVOT from P45 vendor-sync; P50 supersedes P45/P46/P47/P48).` — P50 focus line, factual; still correct.
- L391: `**2026-06-02** — **PIVOT DECISION**: full rewrite synthesis. Drop opencode-tmux/ fork and P45 vendor-sync-script entirely. …` — pivot-decision log entry, historical, do not edit.
- L392: `**2026-06-02** — **Phases 50-55 added** for in-tree synthesis: P50 cleanup fork (drops opencode-tmux/, scripts/sync-fork.sh, …) …` — phase plan record, historical, do not edit.

### Recommended decision
**No AWC amendment. Keep strict 4-deletion scope of `50-SPEC.md` §2. Within P50 EXECUTE, also perform 2 minor doc touch-ups (`.planning/STATE.md` L20 phrase update + `CHANGELOG.md` `[Unreleased]` entry, see Q3 + Q4).** All 6 changes (4 deletions + 2 doc edits) are within L0 mutation authority (`.planning/**` per `.planning/AGENTS.md` §2) and serve the SPEC's "drop the fork cleanly" intent. No follow-up phase needed for Q1.

### Rationale
- Repo-root + 6 of 7 planning-level surfaces are already 100% clean. The "drift" the strategist worried about does not exist outside the fork directory itself.
- The 4 references in `.planning/STATE.md` are all narrative/historical PIVOT documentation that correctly describes the cleanup. They are not stale registrations — they are the planning log itself. Per `.planning/AGENTS.md` L0 scope, STATE.md updates are P50-allowed.
- Repo-root `AGENTS.md` is OUT of L0 mutation scope, but it is already clean (0 matches) so no escalation is needed.
- The 16 `README.md` matches collapse automatically with deletion 1; not a separate action.

### Alternatives considered
- **(b) Open AWC amendment to broaden P50 to 6+ deletions.** Rejected — no hidden file/registration/config was found that needs deletion. The 4 strict deletions cover the *removal* surface. Doc touch-ups (STATE.md, CHANGELOG.md) are not "deletions" — they are narrative updates, and they fit inside Checkpoint 5/9 docs-touched list.
- **(c) Add a separate "P50.1 — Docs hygiene" follow-up phase.** Rejected — over-engineering for 2 small doc edits that take < 5 min and have no functional risk.

### Downstream impact
- **PLAN.md (Checkpoint 8):** Add 2 docs-touched steps to wave 1 alongside deletion 1 (e.g., "After deleting `opencode-tmux/`, also patch `.planning/STATE.md` L20 and add `CHANGELOG.md` entry"). No additional PLAN files needed.
- **EXECUTE (Checkpoint 9):** docs edits run in same wave as deletions, single atomic commit.
- **RISK:** low. STATE.md patch is a single-line phrase change. CHANGELOG entry is a single bullet. Both are in `.planning/**` (L0) or repo root (L4 not L0 — but Q4 boundary check confirms it's a docs-only addition, not a code change).

---

## Q2 — State cache invalidation

### Question (verbatim)
> "Does the runtime need an explicit cache invalidation step after `opencode-tmux/` removal? E.g., `state-cache.json` in `.hivemind/state/`, persisted sessions in `.hivemind/sessions/`, or any other state file that could carry stale 'fork-installed' marker?"

### Investigation

Directory listing of `.hivemind/state/`, 2026-06-02:

```
agent-work-contracts.json     31 KB
config-workflows.json         1.5 KB
trajectory-ledger.json         22 KB
version.json                  24 B
```

Grep across `.hivemind/state/*.json` for `opencode-tmux|@hivemind/opencode-tmux|FORK_PACKAGE_DIR|sync-fork|bats-vendor-sync`:

```
(zero matches in all 4 files)
```

Grep across the broader `.hivemind/` tree (recursively) found 2,613 matches, but inspection of distribution shows all matches are in `.hivemind/session-tracker/*` — the append-only historical event timeline (per Q3 decision documented in 49-CLOSE-PIVOT-2026-06-02.md §6: "session journal is append-only, never mutated"). These are session-journal entries recording past events, not runtime cache that can be invalidated.

Code-level investigation: `src/plugin.ts` and `src/features/tmux/integration.ts` were spot-checked. The plugin does **not** import or instantiate anything from `opencode-tmux/` at boot. The fork is consumed only by:
- `scripts/sync-fork.sh` (deleted in deletion 2)
- `tests/scripts/sync-fork.bats` (deleted in deletion 3)
- `.github/workflows/ci.yml` `bats-vendor-sync` job (deleted in deletion 4)

No runtime import, no lazy require, no dynamic discover.

### Recommended decision
**NO explicit cache invalidation step in P50.** The runtime has no fork-related cache to invalidate. `version.json` (24 B) is the only state file that records plugin-level state, and it contains no fork reference. `.hivemind/session-tracker/*` is append-only per Q3 decision and must not be mutated (would corrupt audit trail).

### Rationale
- The "cache invalidation" risk model assumes the plugin maintains a state cache referencing installed extensions. This project has no such cache — the plugin composition is deterministic from `src/plugin.ts` and `opencode.json` config. Removing `opencode-tmux/` removes it from the disk; next boot sees nothing.
- Zero matches in 4 state files confirms the cache is already empty of fork references. If any cache existed, it would carry an `opencode-tmux` reference somewhere; none was found.
- Session-tracker matches are *historical records of past events* (e.g., "user ran /hm-x command that delegated to opencode-tmux agent"). Deleting the directory of historical events to "invalidate a cache" would be a data-integrity violation.
- `version.json` (24 B) is regenerated automatically on each plugin init; no manual reset needed.

### Alternatives considered
- **(b) Add explicit `state-cache.invalidate()` call in `src/plugin.ts` shutdown hook.** Rejected — there is no cache to invalidate. Adding dead code to satisfy a hypothetical concern is a no-op dressed as safety.
- **(c) Add a one-time migration that writes `version.json: "post-p50-cleanup"` marker.** Rejected — the `version.json` schema (24 B) carries plugin version, not migration markers. Adding a new field requires a schema change in a different phase.

### Downstream impact
- **PLAN.md (Checkpoint 8):** no extra step needed. The 4 deletions of `50-SPEC.md` §2 are sufficient.
- **EXECUTE (Checkpoint 9):** no `npm run clean` or `node scripts/invalidate-state.js` step.
- **VERIFY (Checkpoint 10):** boot the plugin from a clean checkout (post-deletion state) and confirm `version.json` reads `0.1.0` and the plugin loads. That is the L1 evidence for Q2.

---

## Q3 — Repo-root `AGENTS.md` update

### Question (verbatim)
> "Do we need to add/update `AGENTS.md` (the repo-root one) to reflect opencode-tmux removal? If yes, what's the exact line to add/remove? Or is root AGENTS.md already clean and no update needed?"

### Investigation

`/Users/apple/hivemind-plugin-private/AGENTS.md` is ~40 KB. Two independent greps confirmed **0 matches** for the union of: `opencode-tmux`, `@hivemind/opencode-tmux`, `sync-fork`, `FORK_PACKAGE_DIR`, `bats-vendor-sync`. The file is current and clean.

`.planning/AGENTS.md` was also checked: 0 matches (clean).

**No sector-level `AGENTS.md` exists under `src/features/tmux/`** — verified by direct `ls` of that directory: only `fork-bridge.ts`, `integration.ts`, `observers.ts` (the 3 source files of the in-tree synthesis to be completed in P51-P53). The tmux sector is not yet governed by a local AGENTS.md, so no update is required there either.

**L0 scope rule (`.planning/AGENTS.md` §2):** "Front-facing L0/L1 orchestrator agents … are strictly banned from performing detail work … L0 write authority is restricted to `.planning/**`." The repo-root `AGENTS.md` is outside `.planning/**`, so even if a content update were needed, it would be out of L0's authority and would require explicit user authorization or a `hf-l2-agents-md-sync` delegation. This constraint reinforces the "no update needed" verdict.

### Recommended decision
**No update to repo-root `AGENTS.md` in P50.** The file is already 100% clean of fork references. **Defer any future AGENTS.md work to a separate phase** (e.g., when P51 introduces new `src/features/tmux/` sector governance in P51+), and at that time delegate to `hf-l2-agents-md-sync` rather than L0.

### Rationale
- Grep evidence is unambiguous: 0 matches. Updating a clean file is a no-op with no semantic value.
- L0 scope rule means L0 cannot mutate repo-root `AGENTS.md` even if it wanted to. The correct delegation path is `hf-l2-agents-md-sync`, which is a L2 specialist outside the L0 intent-loop's authority.
- The tmux sector will gain a new AGENTS.md only after P51-P53 establish in-tree governance (P51 = "synthesize core tmux classes in-tree"). That is a separate concern from "fork cleanup" and should be planned in P51+, not P50.

### Alternatives considered
- **(b) Add a "Post-P50 fork removal" section to repo-root `AGENTS.md` (declarative statement of what was removed).** Rejected — declarative post-mortem sections are anti-pattern in this project (per AGENTS.md constitution: "Static `.md` files acting as agent definitions (they are templates/references only)"). The decision is already recorded in `49-CLOSE-PIVOT-2026-06-02.md` (an authoritative planning artifact) and in `git log` (the deletion commit). No need to duplicate in root AGENTS.md.
- **(c) Use P50 as a vehicle to fix any *other* drift in repo-root `AGENTS.md` discovered in passing.** Rejected — scope creep. P50 is strictly "drop the fork cleanly". Drift fixes belong in dedicated phases (e.g., P56 final docs hardening).

### Downstream impact
- **PLAN.md (Checkpoint 8):** zero AGENTS.md steps. STRICT 4 deletions + 2 docs touch-ups from Q1.
- **EXECUTE (Checkpoint 9):** no edit to repo-root `AGENTS.md`.
- **Cross-phase note:** the sector-level `src/features/tmux/AGENTS.md` will be needed when P51-P53 land. Flag to roadmap owner for P56+ as a candidate follow-up.

---

## Q4 — CHANGELOG / release notes

### Question (verbatim)
> "Add a CHANGELOG.md entry for this cleanup? Or defer to the v1.0.0 release cut at end of P55?"

### Investigation

`/Users/apple/hivemind-plugin-private/CHANGELOG.md` (~3 KB) inspection, 2026-06-02:

- **Format:** [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) with sections: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.
- **Current version:** `0.1.0` (per `/Users/apple/hivemind-plugin-private/package.json` `version` field).
- **Current top section:** `## [Unreleased]` — open bucket for in-flight work.
- **Last released version:** `## [0.1.0] - 2026-04-25` — corresponds to Phase 26 quality synthesis completion (HMQUAL-01 through HMQUAL-08).
- **All phases 27-49 landed in `[Unreleased]`**; no `[0.2.0]` cut has been made.
- **No git tags exist** (verified `git tag` output is empty).

Q4 question framing ("v1.0.0 release cut at end of P55") reflects the close-pivot §3 "v1.0.0 hard harness ship" target — a *forward-looking* target, not the current version. The current version is `0.1.0`, and the next realistic version bump (after P55 close) would be `0.2.0` (per SemVer, P50-P55 add a new feature class — in-tree tmux-copilot — but with a breaking change, so semver-major would be `1.0.0`; close-pivot targets `1.0.0` deliberately).

### Recommended decision
**Add a single line under `## [Unreleased]` → `### Removed`** in `CHANGELOG.md` as part of P50 EXECUTE:

```markdown
- Drop `opencode-tmux/` fork package, `scripts/sync-fork.sh`, `tests/scripts/sync-fork.bats`, and `.github/workflows/ci.yml` `bats-vendor-sync` job. PIVOT decision D-PIVOT-04 (see 49-CLOSE-PIVOT-2026-06-02.md). In-tree synthesis of tmux-copilot lands in P51-P55; v1.0.0 ships after P55.
```

Do **not** cut a new version (no `0.2.0` or `1.0.0` tag) in P50. The version bump is a release-cut action that belongs in P56 (release-cut phase) or equivalent. P50 only adds the `[Unreleased]` bullet.

### Rationale
- Keep a Changelog convention: every user-visible change goes under `[Unreleased]` until a release cut. Removing a vendored fork is unambiguously a user-visible change (downstream contributors and integrators may rely on the package's existence; the CHANGELOG is the contract that informs them of removal).
- It is too early to bump the version. SemVer requires the version bump to coincide with a release artifact (npm publish, git tag, etc.). P50 is mid-`[Unreleased]`; the version bump happens once at the P55 → P56 boundary.
- The Keep a Changelog format makes this trivial — a single bullet under an existing section, no schema change.

### Alternatives considered
- **(b) Defer the CHANGELOG entry to P56 release cut.** Rejected — Keep a Changelog convention says entries go under `[Unreleased]` *as they happen*, not retroactively. Retroactive entries lose the temporal trail (a reader of the git log at P55 close cannot tell when the fork was removed).
- **(c) Add multiple bullets (Changed + Removed + Security review notes).** Rejected — over-detailed for a 4-deletion cleanup. One `### Removed` bullet with a one-line rationale is enough; details live in the git commit message and 49-CLOSE-PIVOT doc.
- **(d) Cut a `0.1.1` patch release for just this cleanup.** Rejected — semver wrong. Removing a vendored package is not a patch-level change (it is observable to downstream users); it belongs in `[Unreleased]` until the next minor/major cut.

### Downstream impact
- **PLAN.md (Checkpoint 8):** wave 1 docs-touched step "Append CHANGELOG.md `[Unreleased]` → `Removed` bullet" (in same wave as the `.planning/STATE.md` L20 patch from Q1).
- **EXECUTE (Checkpoint 9):** single `Edit` tool call on `CHANGELOG.md`, atomic commit.
- **P56+ reminder:** the version bump to `0.2.0` (or `1.0.0` per close-pivot target) and conversion of `[Unreleased]` bullets into a dated release block are P56 concerns, not P50.

---

## Q5 — Branch policy

### Question (verbatim)
> "Commit directly to `feature/harness-implementation` (matching P49 close-pivot precedent) or open a dedicated branch/PR for P50? Per prior phase pattern: P49 closed via direct commit on the same branch — does P50 follow?"

### Investigation

`git status` and `git log --oneline -10` on `feature/harness-implementation`, 2026-06-02:

```
Branch: feature/harness-implementation
HEAD:   a3f3f647 (P49 closure commit)

Recent commits (top 5):
a3f3f647 P49 closure: tmux-e2e-completion closed via pivot doc
209ca5f8 P49: 49-CLOSE-PIVOT artifact, 4-deletion boundary, [Unreleased] cross-ref
...
(prior 30+ commits all on this single branch)

Working tree:
- modified:   .hivemind/session-tracker/* (session state, expected, not part of P50)
- untracked:  .planning/phases/50-cleanup-opencode-tmux-fork/ (the new phase dir for P50)
```

**P49 closure pattern (precedent for P50):**
- P49 had 7 sub-plans (49-01-PLAN.md … 49-07-PLAN.md) + close-pivot artifact
- Closure landed in 2 commits: `209ca5f8` (artifact creation) and `a3f3f647` (final closure message)
- Both commits went directly to `feature/harness-implementation` (no PR, no separate branch)
- Working-tree at P50 start: no PR was opened for P49

**No git tags exist** (`git tag` → empty), so the branch has no release-pressure state.

### Recommended decision
**Option (a): direct commits on `feature/harness-implementation`.** Mirror P49 precedent exactly. P50 produces a small number of atomic commits (likely 2-3: one for the 4 deletions + 1 doc touch-up, one for CHANGELOG entry, possibly a final closure message). No PR, no separate branch.

### Rationale
- **Consistency.** P49 closed the same way. P50 is similarly scoped (single phase, 4 deletions + 2 doc edits, no cross-cutting refactor). Following precedent reduces cognitive load for the next phase reader.
- **Low PR review value.** P50 deletions are mechanical `git rm` operations on the 4 SPEC §2 targets; the hard review work was done in `50-SPEC.md` (locked at Checkpoint 4) and `49-CLOSE-PIVOT-2026-06-02.md` (locked at P49 close). A PR review would re-litigate already-locked decisions.
- **No release pressure.** With no git tags and no `v1.0.0` cut, the branch is a feature branch, not a release branch. PRs add process overhead without isolation benefit.
- **Atomic commits still mandatory.** Per `.opencode/rules/universal-rules.md` "atomic commit rule" and AGENTS.md "Atomic commits are mandatory" — each commit must be a single logical change. P50 will likely have 2-3 atomic commits (deletions+STATE.md, CHANGELOG, closure), each independently revertable.

### Alternatives considered
- **(b) Open a `feature/p50-cleanup-opencode-tmux-fork` branch + PR.** Rejected — unnecessary isolation. The deletions are already locked in `50-SPEC.md`; isolating them in a branch adds merge ceremony without adding safety. P50 has no `package.json` or plugin-loader schema change, so the risk of merge conflict is negligible.
- **(c) Tag a `pre-p50-cleanup` snapshot on the current HEAD before deletions.** Considered and rejected. The git history itself is the snapshot (commit `a3f3f647` is the pre-P50 baseline). An extra tag is a no-op.
- **(d) Squash all P50 work into a single "P50 cleanup" commit.** Rejected — violates the atomic-commit rule. The 4 deletions are one logical change; the STATE.md + CHANGELOG doc updates are separate logical changes; they should be 2-3 separate commits.

### Downstream impact
- **PLAN.md (Checkpoint 8):** no branch-orchestration steps; PLAN focuses on commit sequencing within the single branch.
- **EXECUTE (Checkpoint 9):** commits land on `feature/harness-implementation` directly. Push only at phase end (per AGENTS.md "commit after each meaningful change" — subagent returns, phase completes, gate passes are meaningful-change points; mid-phase commits are local).
- **Cross-phase note:** if a future phase (e.g., P55 close) requires coordinated multi-phase changes that warrant a PR, that phase can re-introduce the branch+PR pattern. P50 does not.

---

## Summary table — locked decisions

| Q | Topic | Decision | Surface | Risk | In-scope now? |
|---|-------|----------|---------|------|---------------|
| Q1 | Hidden docs/runtime refs | Strict 4-deletion scope; no AWC amendment. Also patch `.planning/STATE.md` L20 (in-scope) | `.planning/STATE.md` | low | YES |
| Q2 | State cache invalidation | No invalidation step. Runtime self-heals. | n/a | none | n/a |
| Q3 | Repo-root `AGENTS.md` update | No update (already clean). Defer to P51+/P56. | n/a | none | NO (deferred) |
| Q4 | CHANGELOG entry | Add 1 bullet under `[Unreleased]` → `Removed`. No version cut. | `CHANGELOG.md` | low | YES |
| Q5 | Branch policy | Direct commit on `feature/harness-implementation` (match P49 precedent). 2-3 atomic commits. | branch + 2-3 commits | low | YES |

**Net P50 surface delta:** 4 deletions (SPEC §2) + 2 doc edits (`.planning/STATE.md` L20, `CHANGELOG.md` `[Unreleased]`) + 1 file creation (`.planning/phases/50-cleanup-opencode-tmux-fork/50-CONTEXT.md` itself). All 7 changes within L0 mutation authority (`.planning/**` + the 4 SPEC §2 deletions).

## Open questions for L0 / user

1. **CHANGELOG entry wording** — proposed: "Drop `opencode-tmux/` fork package, `scripts/sync-fork.sh`, `tests/scripts/sync-fork.bats`, and `.github/workflows/ci.yml` `bats-vendor-sync` job." Confirm or edit before EXECUTE lands.
2. **`.planning/STATE.md` L20 patch wording** — current L20 is fine factually; no edit *required*. If any edit is desired, candidate phrasing: append "(synthesis in progress: P50 ✓ cleanup → P51-P55 in-tree)" as a one-line status note. Confirm whether to patch or leave untouched.
3. **P51+ `src/features/tmux/AGENTS.md` creation** — flagged for roadmap owner, not for P50. Confirm owner: `hf-l2-agents-md-sync` delegation in P51 or later.

## Self-assessment

- **Clarity:** 5/5 questions resolved with file:line evidence; no guessing.
- **Coverage:** 0 unaddressed strategist concerns. Each decision has at least one rejected alternative documented.
- **Spec compliance:** 100% — this CONTEXT does not modify `50-SPEC.md`; it only clarifies gray areas and locks 2 small in-scope doc touches.
- **Downstream handoff:** PLAN.md (Checkpoint 8) has a clear input contract: 4 deletions + 2 doc edits + 1 CONTEXT artifact + atomic commit sequencing. No ambiguity remains for `hm-planner`.
- **L0 boundary:** all changes within `.planning/**` (L0) or repo-root files already clean (Q2/Q3) or explicitly permitted as in-scope docs touch-ups (Q1/Q4). No escalation to `hf-l0-orchestrator` required.

**Status:** locked. Ready for Checkpoint 8 (PLANNING → `hm-planner`).
