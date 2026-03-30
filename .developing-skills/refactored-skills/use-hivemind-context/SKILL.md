---
name: use-hivemind-context
description: Context health verification — verifies doc/code agreement, detects context rot, and runs verification gates before trusting prior sessions or memory.
parent: use-hivemind
---

<!-- LOAD-POSITION
slot: domain
role: domain
-->

## Load Position

**Layer: Domain — context health**. `use-hivemind` is always loaded first.

| Constraint | Rule |
|-----------|------|
| Position | Domain layer |
| Load order | After `use-hivemind` |
| Prerequisites | `use-hivemind` (entry router) |
| Conflict | Cannot co-load with another domain skill for the same concern |

# use-hivemind-context

You're about to trust something — a doc, a memory, a prior session's claim, a test result. Stop. This domain router puts a checkpoint between "I remember" and "I trust." It doesn't do the checking itself. It dispatches to the right specialist based on what kind of doubt you have: session health uncertainty, or project-structural verification.

**Parent:** `use-hivemind` (entry router)

## Table of Contents

- [Load Position](#load-position)
- [When You Need This](#when-you-need-this)
- [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
- [The 3-Step Trust Check](#the-3-step-trust-check)
- [Distrust Levels](#distrust-levels)
- [Session Position Detection](#session-position-detection)
- [Routing Logic](#routing-logic)
- [Verification Gates](#verification-gates-project-reality)
- [Freshness Probe](#freshness-probe)
- [Cross-Team Context Awareness](#cross-team-context-awareness)
- [Multi-Source Comparison](#multi-source-comparison)
- [Context Preservation Across Long Sessions](#context-preservation-across-long-sessions)
- [Multi-Wave Context Protocol](#multi-wave-context-protocol)
- [Token Budget Awareness](#token-budget-awareness)
- [Distrust Protocol](#distrust-protocol)
- [Orchestrator Integration](#orchestrator-integration)
- [Handoff Paths](#handoff-paths)
- [Carry-Forward](#carry-forward)
- [Sibling Skills](#sibling-skills)
- [Anti-Patterns](#anti-patterns)
- [Bundled Resources](#bundled-resources)

## When You Need This

| Signal | Route To |
|--------|----------|
| Session just resumed after interruption, compaction, or `/clear` | `use-hivemind-context` (quick mode) |
| Something feels off — docs don't match code, memory seems stale | `use-hivemind-context` (rot mode) |
| Need a full trust breakdown before a major decision | `use-hivemind-context` (full mode) |
| Before starting work — baseline project health | `use-hivemind-context` (gate-chain or landscape) |
| Between implementation phases — gate checkpoint | `use-hivemind-context` (individual gates) |
| Validating a completion claim with hard evidence | `use-hivemind-context` (gate-chain) |
| After merges, dependency changes, or long gaps | `use-hivemind-context` (landscape) |

## Anti-Patterns to Avoid

**NEVER skip context check when resuming after a user prompt.** The user's message arrives into an existing workflow state — an active plan, pending delegations, partial completions. Verify that state before acting. Assuming the user's prompt means "start fresh" breaks the mandate of roles.

**NEVER trust session continuity without verifying artifacts.** `continuity.json` claims a task is complete? Verify the output file exists and matches expectations. `continuity.json` claims context is CLEAN? Run the freshness probe. Continuity state is a convenience layer, not a ground truth.

**NEVER assume CLEAN context after compaction/disconnect without a probe.** Session compaction rewrites context. Disconnections lose state. After either event, run at minimum the quick mode freshness probe before trusting accumulated context. CLEAN requires proof, not assumption.

**NEVER act on the user's next prompt without verifying workflow, orchestration, and artifact state.** Agents in the next N turns always assume they can execute after the user's next-in-turn prompt. This assumption is WRONG. Check: Is there an active workflow? Pending delegations? Unresolved returns? Documents that contradict current intent? The user's prompt exists inside a system state — verify that system state first.

## The 3-Step Trust Check

Before routing, run this mental model. It takes five seconds and catches most problems.

1. **Freshness** — Was anything relevant written in the last 48 hours?
   - Docs, commits, session state files. If nothing is recent, your context is suspect.
2. **Code vs Docs** — Does the code match what the docs claim?
   - Open the file. Don't trust the doc's word. The code is the authority.
3. **Prior Sessions** — Is memory corroborated by git or build output?
   - If you "remember" something but git doesn't show it, the memory is wrong.

If step 1 fails → go straight to rot check. If step 2 or 3 fails → go full analysis.

## Distrust Levels

Declare the level explicitly. Don't mumble "it might be stale." Say what it is.

| Level | Meaning | What To Do |
|-------|---------|------------|
| **CLEAN** | Docs, code, and git agree. Recent commits exist. Session state is readable. | Proceed normally. |
| **SUSPECT** | One source disagrees with others, or documents are >48 hours old. | Cross-check the disagreeing source before trusting. |
| **DEGRADED** | Multiple contradictions. Session state is stale or unreadable. | Run rot check. Quarantine unverified claims. |
| **POLLUTED** | Active misinformation — docs claim things the code doesn't do, or AGENTS.md references non-existent files. | Trust-nothing mode. Verify everything from code and git. |
| **POISONED** | Session context is actively contradictory. Prior session memory conflicts with git history. | Full analysis. Emit checkpoint. Do not proceed until trust is rebuilt. |

When DEGRADED or worse, say it out loud: "Context is DEGRADED. Distrusting [specific sources] until verified."

## Session Position Detection

Before routing context checks, determine session position:

| Signal | Position | Context Action |
|--------|----------|---------------|
| First message in session | Main, Fresh | Quick mode baseline |
| Mid-conversation, no interruptions | Main, Accumulated | Trust accumulated unless signals indicate rot |
| After `/clear` or compaction | Main, Recovering | Load continuity.json, run rot check |
| After user cancel + resume | Main, Suspect | Full mode — verify everything |
| Received delegation packet | Sub-agent | Trust packet's validated context, skip self-check |

## Routing Logic

```
Input: what's doubted?
  ├── Session health, freshness, prior memory
  │     → use-hivemind-context
  │       ├── --quick  (fast continuity probe)
  │       ├── --rot    (deterministic PASS/FAIL gate)
  │       └── --full   (deep trust breakdown)
  │
  └── Project state, build, tests, git structure
        → use-hivemind-context
          ├── gate-chain  (fail-fast sequential)
          ├── landscape   (full report, never blocks)
          └── individual  (targeted gate checks)
```

## Verification Gates (Project Reality)

When `use-hivemind-context` is dispatched for project verification, these four layers run:

| Layer | What It Checks | Gate Type |
|-------|---------------|-----------|
| 1. Project Reality | Build, tests, contracts, dependencies, SDK surface | Hard — blocks |
| 2. Planning Integrity | Plan files exist, reference real files, no contradictions | Hard — requires `.planning/` convention |
| 3. Git Evidence | Branch state, last commit, diff stats, merge-conflict-free | Hard — blocks |
| 4. Architecture | Domain boundaries, dead exports, circular dependencies | Soft — warnings only |

Layer 2 assumes a `.planning/` directory with `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md`. If your project doesn't use that convention, use `landscape` instead of `gate-chain` to skip meaningless failures.

## Freshness Probe

Quick checks you can run before dispatching:

- **Document age**: `find . -name "*.md" -mtime -2` — anything older than 2 days is suspect
- **Git recency**: `git log --oneline -5` — if the latest commit is days old, session memory is stale
- **Session state**: Check `.hivemind/activity/sessions/continuity.json` exists and has a recent `updated_at`
- **Test signal**: Run `npx tsc --noEmit && npm test` — if tests pass but code looks wrong, the test is lying

## Cross-Team Context Awareness

Context rot from other agents is invisible without git probing. Before dispatching, check for cross-team contamination.

<HARD-GATE>
The orchestrator MUST run these probes before trusting context that touches shared files. Skipping this step means you inherit invisible breakage from other agents.
</HARD-GATE>

| Probe | Command | Trigger |
|-------|---------|---------|
| Uncommitted changes from other agents | `git status` | Before any dispatch to shared files |
| Recent commits on shared interfaces | `git log --oneline --since="48 hours ago" -- <path>` | Before dispatching to files others may have touched |
| Branch divergence | `git fetch --dry-run` | Before starting work on a feature branch |
| Worktree isolation check | `git worktree list` | When multiple agents are active |

**Cross-team drift rules:**

1. **Another agent modified a file you depend on** → your context is at least **SUSPECT**. Cross-check that file's current state before proceeding.
2. **Shared interfaces changed in the last 48 hours** → read the diff. If types, schemas, or exported APIs changed, your implementation context is **DEGRADED**.
3. **Multiple worktrees active** → assume concurrent work is happening. Never trust that a file you read 10 minutes ago is still accurate without re-checking.
4. **Uncommitted changes on files you're about to edit** → stop. Another agent has a lock on that state. Coordinate or rebase before touching.

When cross-team changes are detected, declare it: "Cross-team drift detected on [files]. Reclassifying context to [level]."

## Multi-Source Comparison

When sources disagree, you need a systematic way to resolve conflicts. Never guess — compare and decide.

<HARD-GATE>
When docs contradict code → code wins. Always. No exceptions. This is the single most important rule in the context health domain.
</HARD-GATE>

**Resolution hierarchy:**

| Source A | Source B | Winner | Why |
|----------|----------|--------|-----|
| Documentation | Code | **Code** | Docs are advisory. Code is truth. |
| Git history | Session memory | **Git history** | Memory is reconstructed. Git is recorded. |
| Test output | Implementation | **Read the assertion** | Test may be trivially true (`assert(true)`). Inspect what it actually checks before trusting the pass. |
| Doc X (recent) | Doc Y (old) | **Doc X** | Prefer the fresher source, but verify both against code. |
| AGENTS.md instruction | Filesystem | **Filesystem** | If the file doesn't exist, the instruction is stale regardless of what AGENTS.md says. |
| Build output | README claims | **Build output** | Build output is deterministic. README claims are aspirational. |

**When multiple docs give different answers:**

1. List every source that addresses the claim.
2. For each source, check if it matches the current code. Discard any that don't.
3. If remaining sources still disagree, check git history for which one was written after the other.
4. Quarantine the stale one — mark it as `<!-- STALE: superseded by [source] on [date] -->` if you have write access, or flag it explicitly in your output if you don't.
5. Never leave contradictions unresolved. If you can't determine which is correct, escalate to the orchestrator with both options and the evidence.

**Test-signal cross-check protocol:**

| Test Signal | Interpretation |
|-------------|----------------|
| Passes, code matches intent | Trust the pass |
| Passes, code looks wrong | **False positive** — read the assertion. The test may encode the wrong behavior. |
| Fails with setup error | **Noise** — isolate the environment issue from the logic issue |
| Fails, only on certain runs | **Flaky** — do not use as architectural evidence |
| Passes but is trivially true | **Nonsensical** — quarantine the test |

## Context Preservation Across Long Sessions

Long sessions rot faster than short ones. Context decays with every compaction, every delegation, every phase transition. Manage it explicitly.

<HARD-GATE>
Emits continuity checkpoints at EVERY phase transition. No exceptions. A phase transition without a checkpoint is a context loss event.
</HARD-GATE>

**Continuity checkpoint protocol:**

1. **At phase transition** → emit checkpoint to `{project}/.hivemind/activity/sessions/continuity.json`
2. **Carry-forward compression** → ≤5 items:
   - Key findings (what you learned)
   - Blocked routes (what didn't work and why)
   - Recommended next action (what to do next)
   - Output paths (where artifacts live)
   - Active distrust (what's still SUSPECT or worse)
3. **After compaction** → reload `continuity.json` and verify state matches expectations
4. **After delegation** → include distrust context in delegation packet so child agents don't repeat false trust

**Staleness guard:**

- If context grows stale during a long session → **delegate a fresh probe** instead of trusting accumulated context
- The orchestrator must NOT accumulate implementation detail — that pollutes routing context
- If you've been working for >30 minutes without a checkpoint, emit one now

**Compaction awareness:**

- After `session.compacting` fires, your session context has been rewritten
- The compaction prompt may have lost nuance — re-verify critical claims after compaction
- Continuity checkpoints survive compaction because they're written to disk, not session memory

## Multi-Wave Context Protocol

When the orchestrator needs context verification before dispatching multi-wave work:

1. **Quick mode** on current session — is session fresh?
2. If fresh → proceed to dispatch
3. If SUSPECT or worse → run rot check BEFORE any dispatch
4. Include distrust context in ALL delegation packets for the wave
5. After wave returns → re-run quick mode to verify context didn't rot during dispatch

**Between waves**: Run freshness probe on shared files touched by prior wave.

## Token Budget Awareness

Context health includes token budget estimation:

| Operation Type | Estimated Tokens | Risk |
|---------------|-----------------|------|
| Single file read | 1-5k | Low |
| Codebase scan (grep/glob) | 5-15k | Low |
| Deep investigation (multi-file) | 20-50k | Medium |
| Research (tavily/webfetch) | 30-80k | High |
| Repomix/deepwiki scan | 50-150k | Critical |

When accumulated context + estimated dispatch tokens > 150k:
→ Emit continuity checkpoint BEFORE dispatch
→ Consider splitting into parallel independent slices
→ Compress carry-forward to ≤3 items instead of 5

## Distrust Protocol

When rot is detected or after session interruption:

1. **Trust-Nothing Mode**: Treat all prior context as stale until verified from code, git, or build output. Not "mostly trustworthy." Stale.
2. **AGENTS.md Quarantine**: Verify every instruction in AGENTS.md against actual code before following it. If it references a file that doesn't exist, quarantine the instruction — don't follow it and don't delete it.
3. **False Signal Awareness**: Test output, linter results, and doc-claimed behavior must be cross-checked against implementation reality. A passing test that asserts `true === true` proves nothing.

## Orchestrator Integration

When the orchestrator's session is already heavy:

- **Quick mode** can run inline — it's lightweight enough
- **Rot and full modes** should be **delegated** to a subagent — their output can be large
- The orchestrator reads only: `rot_level`, `trust`, `can_proceed`, `recommendations`
- If rot result is DEGRADED or worse, declare distrust before routing to any other domain

## Handoff Paths

```
.hivemind/activity/context/check-cache.json    ← runtime cache (not official boundary)
.hivemind/activity/codescan/                   ← scan outputs per pass
.hivemind/activity/sessions/continuity.json    ← session continuity state
```

Paths are relative to project root. Resolve via `pathing/active-paths.json`.

## Carry-Forward

After any context check completes:

- If issues were found, emit a continuity checkpoint noting what was verified and what remains uncertain
- Store it in `{project}/.hivemind/activity/context/` or `{project}/.hivemind/activity/sessions/`
- If delegation follows, include the distrust context in the delegation packet so child agents don't repeat false trust
- Compress to ≤5 key findings, blocked routes, recommended next action, output paths

## OpenCode Tool Matrix

| Context Check | Preferred Tool | Why |
| --- | --- | --- |
| locate candidate files or session artifacts | `glob` | fast discovery |
| inspect exact session state | `read` | source of truth |
| scan contradictory claims | `grep` | cross-file mismatch hunting |
| validate git freshness | `bash` | real branch and history evidence |

## Concrete Bash Examples

```bash
find . -name "*.md" -mtime -2 | head -10
git log --oneline --since="48 hours ago" -- . | head -10
git status --short --branch
```

## Freshness Probe Decision Tree

1. **IF** docs are older than 48 hours and code changed recently, **THEN** distrust docs first.
2. **IF** shared files changed on the current branch, **THEN** reclassify context to at least `SUSPECT`.
3. **IF** continuity state is missing or stale, **THEN** rebuild context before routing execution work.
4. **IF** multiple sources disagree after probing, **THEN** escalate to a deeper context pass instead of guessing.

## Freshness Reference

Use `references/freshness-probe-reference.md` for the minimal command set and session-state checks.

Use `templates/context-freshness-report.json` when a router needs a small machine-readable freshness verdict.

## Sibling Skills

| Parent | This Skill | Depth Partners |
|--------|-----------|----------------|
| `use-hivemind` | `use-hivemind-context` | `hivemind-gatekeeping` |

This router consolidates the former `context-intelligence-entry` (session health, rot detection, trust scoring) and `context-entry-verify` (project verification gates, build/test/git checks) into unified `use-hivemind-context` routing, alongside `hivemind-gatekeeping` (iterative verification loops, checkpoint gates, carry-forward compression). Domain-specific scripts and references remain in their respective `scripts/` and `references/` directories.

## Anti-Patterns

**You assume remembered context is trustworthy.** It's not. Run a quick probe. Takes seconds, saves hours of debugging based on stale assumptions.

**You treat quick mode as sufficient for major decisions.** Quick tells you if the session is alive. It doesn't tell you if the project is healthy. Use rot or full when it matters.

**You trust a test pass without reading the assertion.** A test that asserts `expect(result).toBeDefined()` on a function that returns garbage is lying to you. Read what it actually checks.

**You follow AGENTS.md instructions that reference files you haven't confirmed exist.** If AGENTS.md says "load the skill at `skills/foo/SKILL.md`" and that path doesn't exist, the instruction is stale. Quarantine it.

**You skip the distrust declaration and just keep working.** If context is DEGRADED and you don't say so, the next agent inherits your false confidence. Declare the level. Every time.

**You run full analysis when quick mode would answer the question.** Full analysis is expensive. If you just need to know "is this session fresh?", quick mode is the right tool. Don't bring a spectrometer to check if the light is on.

**Trusting cross-team state without checking git.** Other agents are working. Shared files may have changed since you last read them. Run `git status` before dispatching to shared paths.

**Single-source verification.** Trusting one document without cross-checking against code or git is asking for stale context. Compare at least two sources before committing to a decision.

**Accumulating implementation context.** The orchestrator reads code files, pollutes routing context. Implementation detail belongs in subagent sessions, not the orchestrator's mental model.

**Skipping continuity checkpoint.** Phase transition without writing state to disk means the next agent starts blind. Emit the checkpoint. Every time.

## Bundled Resources

| Resource | Path | Purpose |
|----------|------|---------|
| Context Distrust Protocol | `references/context-distrust-protocol.md` | When and how to distrust context sources |
| Context Rot Taxonomy | `references/context-rot-taxonomy.md` | Classification of context degradation types |
| Delegation Scope | `references/delegation-scope.md` | Scope boundaries for context delegation |
| Entry State Matrix | `references/entry-state-matrix.md` | Session state detection and handling matrix |
| False Signal Detection | `references/false-signal-detection.md` | Identifying false positives in context assessment |
| Gate Chain Order | `references/gate-chain-order.md` | Order of context verification gates |
| Gate Definitions | `references/gate-definitions.md` | Formal definitions of each verification gate |
| Context Freshness Report | `templates/context-freshness-report.json` | Minimal machine-readable freshness verdict |
| Platform Surface | `references/platform-surface.md` | Platform-specific context surfaces |
| Trust Matrix | `references/trust-matrix.md` | Trust levels for different context sources |
| Output Schema | `schemas/output.schema.ts` | TypeScript schema for context assessment output |
| Context Harness Init | `scripts/context-harness-init.cjs` | Context harness initialization script |
| HM Verify | `scripts/hm-verify.cjs` | Context verification execution script |
| Direct Invocation | `tests/direct-invocation.md` | Test scenario for direct skill invocation |

## Activity Output

All artifacts produced by this skill follow the Activity Folder Protocol.

**Pathing:** See `.hivemind/pathing/active-paths.json` for resolved output paths.
**Naming:** `{category}-{semantic-id}-{YYYY-MM-DD}.{ext}`
**Meta:** All JSON includes `_meta.created_at`, `_meta.updated_at`, `_meta.producer`.
**Validation:** Run `bash use-hivemind-delegation/scripts/hm-artifact-validate.sh {path}` to confirm compliance.
