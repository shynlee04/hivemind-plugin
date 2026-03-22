# Detox Failure Audit

## Purpose

This file records why the prior product-detox audit failed, what evidence contradicted it, and what future agents must assess before they claim a cleanup, restoration, or stabilization under polluted context.

Status of the replaced audit: `POISONED`

- It mixed authority surfaces, runtime projections, local installs, and isolated authoring work into one cleanup bucket.
- It claimed git states that current git evidence does not support.
- It used delegation outputs as conclusions without assigning the right assessor to the right question.
- It treated `.opencode/**` as disposable without proving which parts were generated versus human-managed.

## Primary Failure

The bad audit did not answer the core question: "what is safe to clean up, and who decided it belongs there?"

Instead, it jumped from broad detox language to irreversible cleanup claims. That collapsed four different concerns into one story:

1. structural scan
2. git continuity
3. runtime projection sync
4. human intent

Those are not interchangeable.

## Evidence Priority

Use this order every time:

1. current source code
2. git commit/worktree evidence
3. build or typecheck evidence
4. delegated scan output
5. markdown reports, plans, transcripts, shared activity links

If a lower source contradicts a higher source, the higher source wins.

## What Actually Went Wrong

### 1. Authority collapse

The prior audit treated root `skills/`, `.opencode/skills/`, `.opencode/agents/`, `.opencode/opencode.json`, `.hivemind/`, and `.developing-skills/refactored-skills/` as if they lived in the same ownership domain.

That is false.

### 2. `.opencode/**` was mislabeled as trash

The prior audit called `.opencode/skills/` and `.opencode/agents/` "duplicate" and implied they were safe cleanup targets.

That skipped the required question: is this path a generated projection, a user-local install, a config surface, or a manually maintained local asset?

### 3. Git history was narrated instead of verified

The prior audit claimed `ec0ae42` was partially applied and never committed.

Git contradicts that. `ec0ae42` is a real commit on `2.9.5-harness-dev`.

The prior audit also presented `f8fa9d8` as the current stable state for the workspace. Git contradicts that too. `f8fa9d8` is on the separate `refactor/product-detox-concerns` worktree branch, not the current main worktree branch.

### 4. Delegation did not assign the right assessor

The detox flow routed multiple questions through generic subagent summaries, but it did not preserve a hard question-to-assessor boundary:

- codemap answers structure questions
- git continuity answers history questions
- delegation protocol answers packet and boundary questions
- verification answers completion claims
- runtime sync code answers projection ownership

Without that split, the audit let a structure-flavored narrative overwrite git truth.

### 5. Activity output was over-trusted

The shared activity and transcript are useful as symptom evidence, but they are not authoritative proof.

They show what the agent claimed, not what the repo proves.

## Surface Classification

Every future detox audit must classify touched paths before recommending cleanup.

| Surface | Class | What it means | Cleanup rule |
|---|---|---|---|
| `skills/**` | authority | repo skill source-of-truth discovered by runtime registry | never call duplicate unless replaced by another authority path |
| `agents/**` | authority | repo agent source-of-truth | same rule as above |
| `src/**` | authority | shipped behavior and runtime ownership logic | verify here before trusting markdown claims |
| `.opencode/skills/**` | projection or local-install | runtime projection target, but may also contain local installed material | do not delete without proving ownership path and generation mode |
| `.opencode/agents/**` | projection | user-local runtime projection of root `agents/**` | safe only when change is backed by projection logic and source authority |
| `.opencode/plugins/hivemind-context-governance.ts` | projection | runtime-written local plugin stub | treat as runtime-generated projection |
| `.opencode/opencode.json` | local config | human-local config and permissions | never treat as disposable projection |
| `.hivemind/**` | runtime state | generated activity/state output | not an authoring surface |
| `.developing-skills/refactored-skills/**` | isolated authoring | local refactor pack used for audit/authoring | not runtime authority unless explicitly promoted |

## Repo-Backed Evidence

### Runtime projection evidence

- `src/shared/opencode-skill-registry.ts:87` discovers skills from root `skills/`
- `src/features/runtime-observability/sync.ts:173` writes runtime projections under `.opencode/`
- `src/features/runtime-observability/sync.ts:200` mirrors skill registry output into `.opencode/skills/`
- `src/features/runtime-observability/sync.ts:155` removes top-level projected skill dirs that are no longer in the registry
- `src/AGENTS.md:74` states first-run and repair entry flows are the only writers of user-local `.opencode/**` runtime projection
- `AGENTS.md:49` states `.opencode/agents/**` is a user-local runtime projection, not an independent authority
- `.opencode/agents/hivefiver.md:52` explicitly says user-local `.opencode/**` projections are created by runtime flows, not authored there

### Isolated refactor-pack evidence

- `.developing-skills/refactored-skills/README.md:3` describes this directory as the main local skill pack
- `.developing-skills/refactored-skills/README.md:39` says its `AGENTS.md` is injection content, not runtime-loaded authority

### Contradictory projected-doc evidence

- `.opencode/skills/context-intelligence-entry/references/platform-surface.md:72` says OpenCode prefers `.opencode/skills/`
- `src/shared/opencode-skill-registry.ts:88` shows the registry discovers root `skills/`

When these conflict, runtime code wins.

## Git Corrections

### Branch and worktree reality

- current worktree branch: `2.9.5-harness-dev` at `ec0ae42`
- product-detox worktree branch: `refactor/product-detox-concerns` at `f8fa9d8`
- remote `origin/refactor/product-detox-concerns` is at `d89d79b`
- merge-base between `2.9.5-harness-dev` and `refactor/product-detox-concerns` is `b83d1f9`

### What the prior audit got wrong

- `ec0ae42` was not "never committed"; it is a committed change with large repo impact
- `f8fa9d8` is not the universally current workspace state; it is a separate worktree branch head
- `d89d79b` is not proof of restoration success; it is only the remote state of the detox branch before three local follow-up commits

### Commit-role heuristics

Use heuristics, not fantasy certainty.

#### Likely agent commit

Classify as `likely-agent` when one or more apply:

- author identity is synthetic, local-bot, or explicit bot-like, such as `Developer <dev@hivemind.local>` or `*[bot]`
- subject uses workflow orchestration language such as `Slice B`, `task 11/11`, `stage`, `cluster`, `conductor`, or similarly templated sequencing
- the change shape is broad mechanical relocation, mass rewrite, or generated-doc burst without human narrative style

#### Likely human commit

Classify as `likely-human` when one or more apply:

- author identity is a personal address or local machine identity
- commit arrived through normal merge UI metadata or personal branch work
- subject reflects human intent in product terms rather than orchestration staging terms

Do not claim certainty unless multiple signals align.

## Assessor Responsibility Matrix

This is the boundary the failed audit missed.

| Question | Correct assessor | Wrong assessor |
|---|---|---|
| Which branch/worktree actually contains the commit? | `git-continuity-memory` + git evidence | codemap |
| Is this path source authority or projection? | `src/**` runtime sync code + root governance | generic detox summary |
| Is the file structurally used or orphaned? | `hivemind-codemap` | git memory alone |
| Was a cleanup claim actually verified? | `context-entry-verify` / explicit verification evidence | optimistic stage summary |
| What may be delegated, resumed, and checkpointed? | `use-hivemind-delegation` | git history |

## Audit Rules That Must Be Added

Before any cleanup recommendation, the audit must include all of these sections.

### 1. Surface ownership table

For each touched path, state:

- path
- class: `authority` | `projection` | `local-config` | `runtime-state` | `isolated-authoring` | `advisory-history`
- evidence path
- cleanup allowed: `yes` | `no` | `only with proof`

### 2. Commit containment check

For each cited commit, state:

- which branches contain it
- which worktrees point at it
- whether it is current, divergent, or remote-only

### 3. Human-vs-agent intent check

Before calling something trash, identify:

- who likely introduced it
- whether it was authored, synced, generated, or installed
- whether it carries current user-local configuration value

### 4. Projection-safety check

Never delete under `.opencode/**` unless the audit proves all of the following:

- the path is projection-managed by current runtime code
- the path is not a local config file
- the path is not a manually installed skill/tool/resource
- the corresponding authority source no longer exists or intentionally changed

### 5. Claim verification block

Every "restored", "cleaned", "verified", or "stable" claim must name the exact evidence:

- source file path
- git command or commit
- build/typecheck/test command if relevant
- contradiction notes if any weaker source disagreed

## Shared Activity Handling

The user-provided OpenCode share is useful for seeing the failure pattern, but it is advisory only.

Observed limitation during this audit:

- the fetched share mostly returned shell HTML/JS and transcript content, not independently verifiable state

Therefore:

- use the share to capture bad reasoning patterns
- use the repository and git to prove or disprove each claim

## Minimal Replacement Checklist

Future detox audits must pass this checklist before they recommend cleanup.

- [ ] I classified every touched surface before calling it stale, duplicate, generated, or trash.
- [ ] I proved projection ownership from runtime code, not from projected markdown.
- [ ] I checked commit containment across branches and worktrees.
- [ ] I separated likely-agent commits from likely-human commits using metadata and change shape.
- [ ] I separated codemap findings from git findings.
- [ ] I did not present a branch-local commit as global workspace truth.
- [ ] I did not treat `.opencode/opencode.json` or other local config as disposable.
- [ ] I attached evidence paths for every restoration or cleanup claim.

## Bottom Line

The failure was not just "bad cleanup." It was a category error.

The old audit let the detox story outrun the evidence. It cleaned by narrative instead of by ownership, containment, and proof.

Future agents must first answer:

1. what surface is this
2. who owns it
3. who likely changed it
4. which branch/worktree actually contains the cited state
5. what exact evidence allows cleanup

If any of those are missing, the audit is not ready to recommend deletion, restoration, or stabilization.
