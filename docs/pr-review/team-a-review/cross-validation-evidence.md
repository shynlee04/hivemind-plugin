# Team A: Cross-Validation Evidence (Refresh)

**Review date:** 2026-02-13  
**Target branch validated:** `origin/master` @ `28f6c3d`

## 1) Validation method

Team A validated each Jules PR in three layers:
1. **Lineage check:** PR merge commit exists in `origin/master`.
2. **Post-merge drift check:** whether later commits modified or removed the PR artifacts.
3. **HEAD reality check:** verify current runtime code/tests, not PR description text.

## 2) Repository truth snapshot

```bash
git rev-parse HEAD
# 28f6c3deb5ff9932bd2809b67503ddf9e2c1f9c8

git rev-parse origin/master
# 28f6c3deb5ff9932bd2809b67503ddf9e2c1f9c8
```

All listed Jules PRs (#4-#17) are merged historically. However, a later commit (`28f6c3d`) changed or removed multiple merged PR artifacts.

## 3) Merge lineage evidence

| PR | Merge commit | Jules head commit | Merged? |
|---|---|---|---|
| #4 | `4774e60` | `a91a7fc` | Yes |
| #5 | `e149b2c` | `22ac043` | Yes |
| #6 | `9e18b82` | `d474461` | Yes |
| #7 | `10127de` | `93d1abd` | Yes |
| #8 | `2914155` | `abb5b06` | Yes |
| #9 | `0bb8a9c` | `4d17e31` | Yes |
| #10 | `18c89e3` | `6a021c9` | Yes |
| #11 | `399fea6` | `a24528e` | Yes |
| #12 | `3d25327` | `57c2b3e` | Yes |
| #13 | `f23ceec` | `ab4d43a` | Yes |
| #14 | `8ae2ade` | `f171cfb` | Yes |
| #15 | `c051b54` | `165a81e` | Yes |
| #16 | `beac4cf` | `eff9a0d` | Yes |
| #17 | `b8c7180` | `2a46f0d` | Yes |

## 4) Post-merge drift evidence (critical)

`28f6c3d` includes direct reversions/removals of prior Jules artifacts:

- `flattenTree` iterative DFS reverted to recursive (`src/lib/hierarchy-tree.ts:422`).
- unified `renderNode` abstraction removed; duplicated render paths reintroduced (`src/lib/hierarchy-tree.ts:585`, `src/lib/hierarchy-tree.ts:616`).
- async lock/copyFile/concurrent cleanup reverted in persistence layer (`src/lib/persistence.ts:38`, `src/lib/persistence.ts:77`, `src/lib/persistence.ts:109`, `src/lib/persistence.ts:241`).
- `CliFormatter` file removed (`src/lib/cli-formatter.ts` deleted).
- `src/utils/string.ts` and `tests/string-utils.test.ts` removed.
- dedicated tests removed: `tests/sdk-context.test.ts`, `tests/agent-behavior.test.ts`, `tests/persistence-logging.test.ts`, `tests/config-health.test.ts`.
- path traversal sanitization by `basename(stamp)` no longer present; raw `stamp` used in fallback path joins (`src/lib/planning-fs.ts:324`, `src/lib/planning-fs.ts:327`).

## 5) HEAD evidence by claim

| PR | Claim summary | HEAD evidence | Team A status |
|---|---|---|---|
| #4 | iterative flattenTree | recursive implementation at `src/lib/hierarchy-tree.ts:422` | Regressed |
| #5 | extract `migrateBrainState` | no `migrateBrainState` in HEAD; inline migration in `src/lib/persistence.ts:155` | Partially retained by behavior, not structure |
| #6 | unified render helper | duplicated render logic at `src/lib/hierarchy-tree.ts:585` and `src/lib/hierarchy-tree.ts:616` | Regressed |
| #7 | sdk-context test suite | dedicated file removed, but equivalent coverage retained in `tests/sdk-foundation.test.ts:58` and `tests/sdk-foundation.test.ts:100` | Functionally retained |
| #8 | centralized config constants arrays | validators now use inline arrays (`src/schemas/config.ts:101`, `src/schemas/config.ts:117`) | Partial/reverted |
| #9 | `CliFormatter` utility | utility deleted; duplication remains in `src/tools/list-shelves.ts:28` and `src/tools/recall-mems.ts:49` | Regressed/removed |
| #10 | backup-failure logging in `withState` | `withState` rename failure remains silent at `src/lib/persistence.ts:289`; save-path warn exists at `src/lib/persistence.ts:250` | Partial |
| #11 | async lock release | still `openSync`/`closeSync` (`src/lib/persistence.ts:77`, `src/lib/persistence.ts:109`) | Regressed |
| #12 | path traversal fix | fallback joins raw `stamp` (`src/lib/planning-fs.ts:324`, `src/lib/planning-fs.ts:327`) | Regressed/high risk |
| #13 | comprehensive agent behavior tests | dedicated test removed; no direct `generateAgentBehaviorPrompt` suite remains | Partial/regressed |
| #14 | concurrent backup cleanup | sequential loop at `src/lib/persistence.ts:38` | Regressed |
| #15 | `fs.copyFile` optimization | still read+write copy at `src/lib/persistence.ts:241` | Regressed |
| #16 | extract levenshtein utility | local function remains in `src/lib/detection.ts:508`; utility file removed | Regressed/removed |
| #17 | session lifecycle CI fix | intent retained (GOV-08 passing) via current file layout and checks in `tests/governance-stress.test.ts:141` | Functionally retained |

## 6) Runtime verification evidence

```bash
npm test
# PASS (full suite)

npm run typecheck
# PASS

npm run lint:boundary
# PASS
```

So, this is **not** a broken build state. It is a **lineage inconsistency state**: merged PR claims vs current HEAD reality diverge in multiple areas after later consolidation.

## 7) Cross-team reconciliation note

Team C domain reports are still useful for risk reasoning, but many assume a pre-`28f6c3d` code state. Team A treated Team C outputs as **historical signal**, then revalidated each claim directly against current HEAD.
