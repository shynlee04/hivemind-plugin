---
adr_id: ADR-2026-04-30-branch-strategy
title: Canonical branch is `main` (renamed from `feature/harness-implementation`); `master` is archived as `legacy/v2.x`
status: proposed
date: 2026-04-30
authors: [audit-remediation autonomous run, Phase 16.4.1]
supersedes: []
amends: 16.4
phase: 16.4.1
audit_finding: 7 (validated, inverted)
verification_gate: G7
---

# ADR — Canonical Branch Strategy

## Status

**Proposed** — scaffolded by Phase 16.4.1 of the 2026-04-30 audit-remediation track. Recorded BEFORE any branch operations are performed, per `.planning/workstreams/milestone/phases/16.4.1-branch-strategy-resolution/CONTEXT.md § Constraints`.

The branch operations (Step 4 of the migration checklist below) require **maintainer/admin authorization on GitHub**. This ADR defines the destination state and the exact commands to get there; the maintainer enacts them.

## Context

The 2026-04-30 delegation-async-pty-lifecycle audit (Finding 7) characterised the project as "two divergent codebases":

| Branch | What it is | Evidence |
|---|---|---|
| `master` | Legacy `hivemind-plugin` v2.x baseline | 56 test files; older delegation surface; package name `hivemind-plugin` |
| `feature/harness-implementation` | Canonical v3 runtime composition engine | 84 test files / 1,164+ specs (post-PR #68); full delegation manager + lifecycle/completion/persistence; package name `opencode-harness@0.1.0` |

The branches diverged ~2026-04-08 with the v3 rebuild. **All recent product work, planning artifacts, runtime tests, and audit-remediation phases (PR #64, #65, #66, #67, #68, #69) live on `feature/harness-implementation`.** The original audit's recommendation to "delete worktree duplicates and port tests to main" inverts reality: the worktree IS the product; `master` is the legacy snapshot.

Additional signal that the rename is overdue:
- `.github/workflows/qwen-scheduled-triage.yml` already triggers on `main` — a branch that does not yet exist in this repository, so that workflow is silently dead.
- The package has no `package.json#repository` block today, so consumers `npm install opencode-harness` without any branch-name dependency.

## Decision

**Adopt Option B from `phases/16.4.1-branch-strategy-resolution/CONTEXT.md § Requirements`:** rename `feature/harness-implementation` → `main` and rename current `master` → `legacy/v2.x`.

### Rationale

1. **CI is already aligned with `main`.** Renaming costs zero CI churn — the existing workflow that references `main` becomes live the moment the rename happens. Option A would either leave `qwen-scheduled-triage.yml` broken or require a separate edit to retarget it onto `master`.
2. **Preserves history without force-pushes.** Option A requires force-pushing the v3 history onto `master`, which permanently rewrites the published `master` ref. Option B is purely additive: `master` is preserved verbatim under a new name (`legacy/v2.x`), and `main` becomes the new pointer for the v3 history.
3. **Modern convention.** GitHub's default for new repos is `main`; downstream tooling (Dependabot, default branch checks, `git clone` HEAD) expects it.
4. **Clear semantics for npm consumers.** `legacy/v2.x` reads as "frozen reference"; `main` reads as "what `npm install opencode-harness` builds against". Option A loses this signal — anything tagged on `master` becomes ambiguous between v2.x and v3.

### Why not just keep `feature/harness-implementation` as canonical?

CONTEXT.md frames the audit as wanting to end the "two divergent codebases" perception. Leaving the canonical work on a `feature/*` prefix indefinitely keeps reinforcing that perception. The point of this ADR is to commit to a destination, not to defer indefinitely.

## Consequences

### Positive

- `git clone https://github.com/shynlee04/hivemind-plugin` resolves to v3 (the actual product) on first checkout.
- The dead `main` reference in `qwen-scheduled-triage.yml` becomes live.
- Open PRs (#63 planning artifacts, #68 Phase 38.1, #69 Phase 32.1, this PR for 16.4.1) can be retargeted from `feature/harness-implementation` → `main` via GitHub's UI without re-creating PRs.
- `legacy/v2.x` remains accessible for forensic reference (no ref deleted, no history rewritten).

### Negative / Migration cost

- Anyone running `git pull` on a local `feature/harness-implementation` checkout after the rename will need `git branch -m feature/harness-implementation main && git fetch origin && git branch -u origin/main main && git remote set-head origin -a`. (One-liner included in Step 4.4 below.)
- If any CI workflow file or external dashboard hardcodes `master` or `feature/harness-implementation`, it will break and needs to be updated. Step 5 below grep-greps for these.
- Any in-flight PR draft created between the rename and the GitHub-default-branch update will need its base branch flipped.

### Neutral

- npm publish is unaffected — it consumes `dist/` from whatever branch is being released, not a branch name. Releases continue from `main` post-rename.
- Tags (e.g. `v0.1.0`) point at commits, not branches; no retag needed.

## Migration Steps

### Step 1 — Pre-flight verification (anyone can run)

```bash
git fetch --all --prune
git rev-parse --verify origin/master                      # MUST exist
git rev-parse --verify origin/feature/harness-implementation  # MUST exist
git rev-parse --verify origin/main                        # MUST fail (does not exist yet)
git rev-parse --verify origin/legacy/v2.x                 # MUST fail (does not exist yet)
```

### Step 2 — Land all open audit-remediation PRs first

Recommended order (so the rename target is the most up-to-date head):

1. PR #63 — planning artifacts (resolve merge conflicts first if still present)
2. PR #68 — Phase 38.1 fresh-install regression test
3. PR #69 — Phase 32.1 workstream path layout doc
4. PR #70 (this one) — Phase 16.4.1 branch strategy ADR

After all four merge into `feature/harness-implementation`, proceed.

### Step 3 — Tag the legacy snapshot before any rename

```bash
git fetch origin
git tag legacy/v2.x-baseline origin/master
git push origin legacy/v2.x-baseline
```

This produces an immutable annotated tag pointing at the exact `master` HEAD at the time of the strategy decision. **Required** — recoverable evidence per CONTEXT.md.

### Step 4 — Rename the branches (requires repo admin on GitHub)

#### 4.1 — Create the archive branch from `master`

GitHub UI: **Code → Branches → Create branch → name `legacy/v2.x` → from `master`**.

Or via CLI (requires push to a non-default branch name):

```bash
git push origin refs/heads/master:refs/heads/legacy/v2.x
```

#### 4.2 — Promote `feature/harness-implementation` to `main`

GitHub UI: **Settings → Branches → Default branch** is currently `master`.

1. **Settings → Branches → Default branch → switch indicator → pick `feature/harness-implementation`** as new default.
2. Then **Settings → Branches → Branch → "Rename branch"** on `feature/harness-implementation` → new name `main`.

GitHub will atomically:
- Rename the branch on the remote
- Retarget all open PRs whose base was `feature/harness-implementation`
- Update default-branch UI references
- Show a banner to anyone with a stale local clone

#### 4.3 — Delete the now-stale `master` ref

Once `legacy/v2.x` is verified to point at the same commit as old `master`:

```bash
git push origin --delete master
```

Or via GitHub UI: **Code → Branches → Delete `master`**. Skip this step if the maintainer prefers to keep `master` as a redirect — but note that "stale-pointer-to-legacy" is exactly the perception this ADR is closing.

#### 4.4 — Local-clone update one-liner (publish to README)

For anyone with an existing checkout:

```bash
git fetch origin --prune
git branch -m feature/harness-implementation main
git branch -u origin/main main
git remote set-head origin -a
git branch -D master 2>/dev/null || true
```

### Step 5 — Update repo references after the rename

Run these greps on the renamed repo and update each hit:

```bash
git grep -nE 'feature/harness-implementation|\bmaster\b' .github/ docs/ README.md package.json
```

Expected hits:
- `.github/workflows/*.yml` — none currently reference `feature/harness-implementation`; `qwen-scheduled-triage.yml` already uses `main`. No change required, but verify after rename.
- `package.json` — add `"repository": { "type": "git", "url": "https://github.com/shynlee04/hivemind-plugin.git", "directory": "" }` (was missing). Optional but recommended for npm registry display.
- README.md — Branches section already added by this PR points at `main`/`legacy/v2.x`; no further edit needed.
- Planning docs reference `feature/harness-implementation` historically — leave alone (those reference the *audit-time* state and should not be rewritten).

### Step 6 — Verification (proves G7 is closed)

```bash
git remote show origin | grep "HEAD branch"   # MUST report: HEAD branch: main
git ls-remote --heads origin main             # MUST return one ref
git ls-remote --heads origin legacy/v2.x      # MUST return one ref
git ls-remote --heads origin master           # SHOULD return nothing
git ls-remote --tags origin legacy/v2.x-baseline  # MUST return one ref
test -f .planning/decisions/ADR-2026-04-30-branch-strategy.md && echo "ADR present"
```

All six checks green = verification gate **G7** from `.planning/workstreams/milestone/AUDIT-VALIDATION-2026-04-30.md §6` is closed.

## Alternatives Considered

### Option A — Force-push `feature/harness-implementation` onto `master`, tag legacy as `legacy/v2.x-baseline`

Rejected because:

- Requires a force push on the published default branch, which permanently rewrites `origin/master`. Anyone who has cloned/forked at v2.x sees their `master` history disappear on next pull.
- Leaves the dead `main` reference in `qwen-scheduled-triage.yml` to be cleaned up separately, or requires a coupled CI edit.
- Keeps `master` as the default name, going against modern GitHub convention.

### Option C — Keep `feature/harness-implementation` as canonical; rename nothing

Rejected because:

- Leaves the audit's "two divergent codebases" perception in place permanently.
- `feature/*` prefix conventionally means "in-flight work that will merge somewhere else and be deleted" — exactly the wrong signal for the canonical branch.
- The dead `main` reference in CI never becomes live.

### Option D — Delete `master` outright without archiving

Rejected because:

- CONTEXT.md and the audit explicitly require a recoverable legacy snapshot. `legacy/v2.x` (branch) plus `legacy/v2.x-baseline` (tag) are cheap and irreversible — there's no reason to take history offline.

## Ownership

**Devin's scope (this PR):**

- Author this ADR (✅ here)
- Reference the ADR from `.planning/PROJECT.md` (✅ in this PR)
- Add a "Branches" section to `README.md` documenting the destination state (✅ in this PR, written as the post-rename truth)

**Maintainer's scope (post-merge enactment):**

- Run Step 3 (tag legacy)
- Run Step 4 (the actual GitHub rename — requires repo admin)
- Run Step 5 (any reference updates greps surface)
- Run Step 6 (verification) and update this ADR's `status:` from `proposed` → `accepted` once enacted

## References

- `.planning/workstreams/milestone/phases/16.4.1-branch-strategy-resolution/CONTEXT.md` — phase scope
- `.planning/workstreams/milestone/phases/16.4.1-branch-strategy-resolution/16.4.1-01-PLAN.md` — plan tasks
- `.planning/workstreams/milestone/AUDIT-VALIDATION-2026-04-30.md` — Finding 7 (validated, inverted) and gate G7
- `.planning/workstreams/milestone/AUDIT-REMEDIATION-TRACKING-2026-04-30.md §4` — execution order (16.4.1 depends on 16.2.1 ✅ merged in PR #64)
