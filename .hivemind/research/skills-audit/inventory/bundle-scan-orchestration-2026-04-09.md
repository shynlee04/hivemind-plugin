# Bundle Scan — Orchestration Skills (2026-04-09)

## Auditor: B | Scope: 4 skills

---

## SKILL: coordinating-loop

**Location:** `.claude/skills/coordinating-loop/` (primary)
**Secondary check:** `.opencode/skills/coordinating-loop/` → **NOT FOUND** (empty)
**SKILL.md:** 370 lines

### Directory Structure

```
.claude/skills/coordinating-loop/
├── SKILL.md
├── scripts/
│   ├── verify-hierarchy.sh
│   ├── register-skill.sh
│   ├── init-session.sh
│   ├── coordination-check.sh
│   ├── check-gate.sh
│   ├── validate-envelope.sh
│   ├── run-ralph-loop.sh
│   └── loop-status.sh
├── references/
│   ├── 01-handoff-protocols.md
│   ├── 02-sequential-vs-parallel.md
│   ├── 03-parent-child-cycles.md
│   └── 04-ralph-loop-integration.md
└── evals/
    ├── trigger-queries.json
    └── evals.json
```

### scripts/

| Script | Exists? | Lines | Purpose | Called From SKILL.md | Dependencies |
|--------|---------|-------|---------|---------------------|-------------|
| `verify-hierarchy.sh` | ✅ | 295 | Verify prerequisite skill loading chain by reading `.opencode/state/loaded-skills.json`. Checks skill dirs on disk and JSON registration. | Line 17: `bash scripts/verify-hierarchy.sh coordinating-loop` | Reads `.opencode/state/loaded-skills.json`, checks disk paths |
| `register-skill.sh` | ✅ | 122 | Record skill as loaded in `.opencode/state/loaded-skills.json` with timestamp. jq with sed fallback. | Line 23: `bash scripts/register-skill.sh coordinating-loop` | Writes `.opencode/state/loaded-skills.json` |
| `init-session.sh` | ✅ | 65 | Creates `.coordination/<session>/` directory with task_plan.md, findings.md, progress.md, children/ subdirectory. | Line 42: referenced as `scripts/init-session.sh <session-name>` | None (creates files from scratch) |
| `coordination-check.sh` | ✅ | 192 | Pre-dispatch validation (task_plan has TASK- entries, envelopes exist and pass validation, execution mode set). Also normal session health check. | Lines 46, 109: `bash scripts/coordination-check.sh <session> --pre-dispatch` | Calls `validate-envelope.sh` internally |
| `check-gate.sh` | ✅ | 206 | Per-gate enforcement (G1-G5). G1=tasks written, G2=envelopes valid, G3=no orphans, G4=findings written no conflicts, G5=verify complete. Exits non-zero to block. | Lines 63, 105, 123, 135, 139, 158: `bash scripts/check-gate.sh <session> G1..G5` | Calls `validate-envelope.sh` for G2 |
| `validate-envelope.sh` | ✅ | 75 | Validates task envelope has all 5 required ## headings: Task, Scope, Context, Expected Output, Verification. | Line 104: `bash scripts/validate-envelope.sh <session> <child-id>` | None (grep-based) |
| `run-ralph-loop.sh` | ✅ | 169 | Ralph-loop validator: checks output file exists, verification was run, scope compliance, result non-empty, expected output criteria met. Writes validation-report.md. Max 3 cycles. | Line 118: `bash scripts/run-ralph-loop.sh <session> <child-id>` | Reads envelope.md and result.md from child dir |
| `loop-status.sh` | ✅ | 141 | Reports current loop phase, gate status (passed/failed/pending), child agent status, and next action suggestion. | Not directly called in SKILL.md body — mentioned only in Kit Bundle table | None (reads .coordination/ files) |

### references/

| File | Exists? | Lines | Purpose | Required/Mandatory | Covers What |
|------|---------|-------|---------|---------------------|-------------|
| `01-handoff-protocols.md` | ✅ | 252 | Context transfer patterns between agents — avoiding too much/tooo little/wrong context. Filled-in envelope examples. | Mandatory — core to envelope pattern | Task Envelope structure, receipt confirmation, context sizing |
| `02-sequential-vs-parallel.md` | ✅ | 187 | Execution mode decision framework — fixed decision tree for choosing sequential vs parallel. | Mandatory — core to DECIDE MODE step | Independence criteria, shared state detection, exploratory vs structured tasks |
| `03-parent-child-cycles.md` | ✅ | 212 | Nested agent lifecycle management — creation, monitoring, failure handling, result aggregation. | Mandatory — core to MONITOR step | Parent-child model, failure patterns, budget management, result aggregation |
| `04-ralph-loop-integration.md` | ✅ | 292 | Ralph-loop scripting patterns mapped to skill-authoring workflows. Hooks and automation. | Mandatory — core to Ralph-Loop section | Loop pattern, hook automation, phase completion verification |

### evals/

| File | Exists? | Lines | Purpose |
|------|---------|-------|---------|
| `trigger-queries.json` | ✅ | 24 | 10 positive + 4 negative trigger queries for coordinating-loop skill matching |
| `evals.json` | ✅ | 135 | Test cases for coordination scenarios (parallel dispatch, sequential, gate enforcement) |

### assets/

| File | Exists? | Purpose |
|------|---------|---------|
| (none) | — | No assets directory or files |

### Discrepancies

1. **`loop-status.sh` — called but not prominently used:** SKILL.md lists it in the Kit Bundle table (line 370) as "Reports current loop phase and progress" but never invokes it in the procedural steps. The script exists and works, but SKILL.md doesn't instruct the agent to run it at any specific point. **Minor orphan concern** — the agent has no clear trigger for when to call `loop-status.sh`.

2. **`verify-hierarchy.sh` line 7 comment says "all 5 refactoring skills"** — This is a stale comment. The script actually supports 5 skills (meta-builder, user-intent-interactive-loop, planning-with-files, coordinating-loop, use-authoring-skills) which are orchestration/authoring skills, not "refactoring skills". The comment at line 7 is misleading but the code is correct.

3. **`register-skill.sh` usage comment says `.opencode/state/register-skill.sh`** (line 3) — suggests it lives in `.opencode/state/`, but it actually lives in `scripts/`. The actual usage path in SKILL.md (`bash scripts/register-skill.sh`) is correct. The comment is misleading.

4. **SKILL.md cross-references `dispatching-parallel-agents` skill** (line 43, 349) — This skill is not one of the 4 in this audit. It exists as a separate external skill at `~/.cache/opencode/packages/superpowers@...`. The reference is valid but depends on an external skill being installed.

5. **SKILL.md references `.coordination/` directory** throughout — this is created by `init-session.sh` but NOT in `.opencode/` or `.claude/` paths. It's at project root level. This is intentional but could conflict with `planning-with-files` which writes `task_plan.md`, `findings.md`, `progress.md` to project root. **Potential naming collision:** both skills write files named `task_plan.md`, `findings.md`, `progress.md` but to different locations (project root vs `.coordination/<session>/`).

### Conflicts

1. **`verify-hierarchy.sh` is IDENTICAL to the copy in `user-intent-interactive-loop/scripts/verify-hierarchy.sh`** — byte-for-byte duplicate. 295 lines duplicated across 2 skills.

2. **`register-skill.sh` is IDENTICAL to the copy in `user-intent-interactive-loop/scripts/register-skill.sh`** — byte-for-byte duplicate. 122 lines duplicated across 2 skills.

### Gaps

1. **No `verify-hierarchy.sh` in planning-with-files or phase-loop** — These skills are in the same loading chain (Layer 2) but don't have their own copies of the hierarchy verification script. They rely on `coordinating-loop` or `user-intent-interactive-loop` having it. If loaded standalone, hierarchy verification would fail.

2. **No error recovery script** — If a child agent crashes without writing any output, the only recourse is manual escalation. There's no `cleanup-orphan.sh` or `force-escalate.sh` script.

---

## SKILL: phase-loop

**Location:** `.claude/skills/phase-loop/` (primary)
**Secondary check:** `.opencode/skills/phase-loop/` → **NOT FOUND** (empty)
**SKILL.md:** 117 lines

### Directory Structure

```
.claude/skills/phase-loop/
├── SKILL.md
└── references/
    └── revision-loop.md
```

### scripts/

| Script | Exists? | Lines | Purpose | Called From SKILL.md | Dependencies |
|--------|---------|-------|---------|---------------------|-------------|
| (none) | — | — | — | — | — |

**No scripts directory exists.** The skill has zero scripts.

### references/

| File | Exists? | Lines | Purpose | Required/Mandatory | Covers What |
|------|---------|-------|---------|---------------------|-------------|
| `revision-loop.md` | ✅ | 172 | Detailed loop semantics, stall detection, escalation patterns, and the check-revise-escalate algorithm | Mandatory — explicitly loaded via `<files_to_read>` in SKILL.md | Loop pseudocode, stall detection, max iterations, issue severity levels, worked examples |

### evals/

| File | Exists? | Purpose |
|------|---------|---------|
| (none) | — | No evals directory or files |

### assets/

| File | Exists? | Purpose |
|------|---------|---------|
| (none) | — | No assets directory |

### Discrepancies

1. **SKILL.md uses `<files_to_read>` directive** (lines 26-28) to load `references/revision-loop.md`. This is a valid pattern and the file exists. No phantom references.

2. **SKILL.md references `phase-guardian` agent** (line 102) — This agent is referenced in the Agent Integration table but may not exist in this workspace. The `phase-guardian` agent would need to be defined in `.opencode/agents/` or `.claude/agents/` for the reference to be valid. **Potential phantom reference** — agent existence not verified in this scan scope.

3. **SKILL.md references `intent-loop` agent** (line 101) — Same concern. This agent type is referenced but may not exist in the workspace.

4. **No Kit Bundle section in SKILL.md** — Unlike `coordinating-loop` and `user-intent-interactive-loop`, this skill does not have a "Kit Bundle Contents" table. The reference is loaded via `<files_to_read>` only, which is a valid pattern but inconsistent with sibling skills.

5. **SKILL.md line 10 has `metadata.pattern: P2`** — Not clear what "P2" refers to. Other skills use "P3". No documentation of pattern codes found in this scan.

### Conflicts

None detected. This skill has minimal bundle and doesn't share scripts with other skills.

### Gaps

1. **No scripts at all** — The skill defines loop semantics (check-revise-escalate) but has no script to:
   - Initialize a loop (set `prev_issue_count = Infinity`, `iteration = 0`)
   - Run the checker/validator
   - Detect stalls (compare issue counts)
   - Track iteration count
   - Enforce max 3 iterations
   
   All of these are described in pseudocode but not executable. The skill relies entirely on the agent reading the instructions and implementing the loop mentally.

2. **No evals** — Unlike `coordinating-loop` and `user-intent-interactive-loop`, this skill has no `trigger-queries.json` or `evals.json`. Trigger accuracy cannot be tested.

3. **No hierarchy verification** — The skill doesn't reference or call `verify-hierarchy.sh`, even though it's in the same loading chain (Layer 2). It has no `register-skill.sh` either. This means it can't participate in the skill loading chain that other skills enforce.

---

## SKILL: planning-with-files

**Location:** `.claude/skills/planning-with-files/` (primary)
**Secondary check:** `.opencode/skills/planning-with-files/` → **NOT FOUND** (empty)
**SKILL.md:** 276 lines

### Directory Structure

```
.claude/skills/planning-with-files/
└── SKILL.md
```

### scripts/

| Script | Exists? | Lines | Purpose | Called From SKILL.md | Dependencies |
|--------|---------|-------|---------|---------------------|-------------|
| (none) | — | — | — | — | — |

**No scripts directory exists.** The skill has zero scripts.

### references/

| File | Exists? | Lines | Purpose | Required/Mandatory | Covers What |
|------|---------|-------|---------|---------------------|-------------|
| (none) | — | — | — | — | — |

**No references directory exists.** The skill has zero reference files.

### evals/

| File | Exists? | Purpose |
|------|---------|---------|
| (none) | — | No evals directory |

### assets/

| File | Exists? | Purpose |
|------|---------|---------|
| (none) | — | No assets directory |

### Discrepancies

1. **SKILL.md is entirely self-contained** — All content is in the single SKILL.md file. There are no `<files_to_read>` directives, no script calls, no reference file listings. This is intentional — the skill is a "pure instruction" skill with no executable bundle.

2. **SKILL.md references `task_plan.md`, `findings.md`, `progress.md`** as files the agent writes to project root — these are described but not created by any script. The agent is expected to create them manually using `Write` tool. This is consistent with the skill's "no scripts" design but means there's no validation that the files have correct structure.

3. **SKILL.md line 74 references `ls task_plan.md findings.md progress.md 2>/dev/null`** — This is a bash command in instructions but there's no script that runs it. The agent is expected to run this manually. Consistent with design.

4. **SKILL.md mentions `verify-hierarchy.sh` indirectly** — The skill is referenced by `verify-hierarchy.sh` (in coordinating-loop and user-intent-interactive-loop) as a prerequisite for `coordinating-loop`, but `planning-with-files` itself doesn't call any hierarchy verification scripts. It trusts the loading chain.

5. **SKILL.md references `planning-with-files` integration layer 2** (line 240-243) — Correctly states integration with Layer 1 (`user-intent-interactive-loop`) and Layer 3 (`coordinating-loop`).

### Conflicts

1. **File naming collision with `coordinating-loop`:** Both skills write files named `task_plan.md`, `findings.md`, and `progress.md`. `planning-with-files` writes to project root. `coordinating-loop` writes to `.coordination/<session>/`. When both skills are active, the agent must manage two sets of identically-named files in different directories. This is a design decision but creates confusion risk.

### Gaps

1. **No scripts** — The skill could benefit from:
   - `init-planning.sh` — Create the 3 skeleton files (task_plan.md, findings.md, progress.md) with correct structure
   - `validate-plan.sh` — Verify task_plan.md has Goal section and at least one phase
   - `checkpoint.sh` — Update all 3 files with current state
   
   Currently the agent must do all of this manually, which is error-prone.

2. **No evals** — No `trigger-queries.json` or `evals.json` to test triggering accuracy.

3. **No reference files** — The 276-line SKILL.md is dense but could benefit from extracted reference docs (e.g., file structure templates, recovery protocols). All content is inline.

4. **No hierarchy enforcement** — Unlike the other orchestration skills, this one doesn't call `verify-hierarchy.sh` or `register-skill.sh`. It can be loaded without any chain verification, which contradicts the loading chain model used by its consumers.

---

## SKILL: user-intent-interactive-loop

**Location:** `.claude/skills/user-intent-interactive-loop/` (primary)
**Secondary check:** `.opencode/skills/user-intent-interactive-loop/` → **NOT FOUND** (empty)
**SKILL.md:** 389 lines

### Directory Structure

```
.claude/skills/user-intent-interactive-loop/
├── SKILL.md
├── scripts/
│   ├── verify-hierarchy.sh
│   ├── register-skill.sh
│   ├── intent-verify.sh
│   ├── first-action.sh
│   └── session-checkpoint.sh
├── references/
│   ├── 01-question-protocols.md
│   ├── 02-context-preservation.md
│   ├── 03-brainstorming-patterns.md
│   ├── 04-long-session-management.md
│   └── 05-worked-examples.md
└── evals/
    ├── trigger-queries.json
    └── evals.json
```

### scripts/

| Script | Exists? | Lines | Purpose | Called From SKILL.md | Dependencies |
|--------|---------|-------|---------|---------------------|-------------|
| `verify-hierarchy.sh` | ✅ | 295 | **IDENTICAL COPY** of coordinating-loop's version. Verifies prerequisite skill loading chain. | Line 57: `bash scripts/verify-hierarchy.sh user-intent-interactive-loop` | Reads `.opencode/state/loaded-skills.json` |
| `register-skill.sh` | ✅ | 122 | **IDENTICAL COPY** of coordinating-loop's version. Records skill as loaded. | Line 64: `bash scripts/register-skill.sh user-intent-interactive-loop` | Writes `.opencode/state/loaded-skills.json` |
| `intent-verify.sh` | ✅ | 285 | Validates PROBE stop conditions (all 6 must pass) and DELIVER termination criteria (all 5 must pass). Reads intent.json, progress.md, task_plan.md. | Line 75: `bash scripts/intent-verify.sh --probe` | Reads `.opencode/state/intent.json`, `progress.md`, `task_plan.md`, `.opencode/state/question-count.json` |
| `first-action.sh` | ✅ | 174 | Mandatory first action: runs verify-hierarchy, registers skill, creates state dir, initializes tracking files, checks 3 platform skills loaded. | Not directly called — SKILL.md describes the same steps inline (lines 86-111) | Calls `verify-hierarchy.sh` and `register-skill.sh` internally |
| `session-checkpoint.sh` | ✅ | 160 | Saves current session state (phase, intent, delegation, git state) to timestamped checkpoint file in `.checkpoints/`. | Not directly called in SKILL.md — referenced via "Session Persistence Protocol" section | Reads `task_plan.md`, `progress.md`; runs `git` commands |

### references/

| File | Exists? | Lines | Purpose | Required/Mandatory | Covers What |
|------|---------|-------|---------|---------------------|-------------|
| `01-question-protocols.md` | ✅ | 364 | How to probe user intent — question types, sequencing, skill-creation examples, stop conditions, adaptive probing | Mandatory — core to PROBE phase | Question taxonomy, sequencing rules, stop conditions, anti-patterns |
| `02-context-preservation.md` | ✅ | 309 | Maintaining awareness across sessions — concrete file paths, persistence, recovery, compaction handling | Mandatory — core to session persistence | File paths, what to persist, recovery protocol, compaction handling |
| `03-brainstorming-patterns.md` | ✅ | 394 | Facilitating ideation — divergence/convergence, decision frameworks, skill-creation examples | Mandatory — for brainstorming scenarios | Divergence phase, convergence phase, decision frameworks, agent's role |
| `04-long-session-management.md` | ✅ | 412 | Extended session survival — budget management, checkpoint strategy, fatigue detection, termination | Mandatory — for long sessions | Session budgeting, checkpoint strategy, fatigue detection, compaction prep |
| `05-worked-examples.md` | ✅ | 121 | End-to-end examples: skill creation flow, vague request handling, session recovery | Recommended — concrete examples | PROBE→UNDERSTAND→PLAN→DELEGATE→DELIVER walkthrough |

### evals/

| File | Exists? | Lines | Purpose |
|------|---------|-------|---------|
| `trigger-queries.json` | ✅ | 24 | 10 positive + 4 negative trigger queries for user-intent-interactive-loop skill matching |
| `evals.json` | ✅ | 141 | Test cases for intent probing, validation gate enforcement, delegation decisions |

### assets/

| File | Exists? | Purpose |
|------|---------|---------|
| (none) | — | No assets directory |

### Discrepancies

1. **`first-action.sh` exists but SKILL.md doesn't call it** — The SKILL.md "FIRST ACTION" section (lines 82-111) describes the same steps that `first-action.sh` automates, but instructs the agent to do them individually rather than running the script. The script is effectively **orphaned** — it exists, works correctly, but the SKILL.md instructions bypass it.

2. **`session-checkpoint.sh` exists but SKILL.md doesn't call it** — The Session Persistence Protocol section (lines 294-310) describes what to persist and when, but doesn't reference `session-checkpoint.sh`. The agent is expected to create checkpoints manually. The script is effectively **orphaned**.

3. **SKILL.md Reference Map table (lines 383-389) lists all 5 references correctly** — No phantom references in the reference map.

4. **`verify-hierarchy.sh` line 7 says "5 refactoring skills"** — Same stale comment as in coordinating-loop copy. Should say "5 orchestration/authoring skills".

5. **`register-skill.sh` usage comment says `.opencode/state/register-skill.sh`** — Same misleading path comment as coordinating-loop copy.

6. **SKILL.md line 268 says "bash scripts/intent-verify.sh --probe"** — The script's actual flag parsing (line 28-29) uses `${1:---all}` which defaults to `--all` if no argument. The `--probe` flag is handled in the case statement (line 258). The call is correct but the script also accepts `--delivery` and `--all` which aren't prominently documented in SKILL.md.

7. **SKILL.md Gate 4 describes validation loop** (lines 73-78) referencing `intent-verify.sh --probe` — correct and consistent.

### Conflicts

1. **`verify-hierarchy.sh` is an IDENTICAL duplicate** of the one in `coordinating-loop/scripts/`. 295 lines of code duplication. Both copies support all 5 skills (meta-builder, user-intent-interactive-loop, planning-with-files, coordinating-loop, use-authoring-skills) making the duplication purely for distribution convenience.

2. **`register-skill.sh` is an IDENTICAL duplicate** of the one in `coordinating-loop/scripts/`. 122 lines of code duplication. Same rationale — distributed with each skill for standalone use.

3. **File naming collision with `planning-with-files`:** Both skills reference `progress.md` and `task_plan.md` in project root. When used together (which is the intended layer stack), both write to the same files. This is by design — `user-intent-interactive-loop` creates them, `planning-with-files` provides the structure — but the relationship is implicit, not enforced.

### Gaps

1. **`first-action.sh` is orphaned** — The script automates 6 steps that SKILL.md instructs the agent to do manually. Either SKILL.md should call the script (`bash scripts/first-action.sh`), or the script should be removed to avoid confusion.

2. **`session-checkpoint.sh` is orphaned** — Same issue. The script automates checkpoint creation but SKILL.md doesn't reference it. The agent follows manual instructions instead.

3. **No `question-count.sh` script** — Gate 1 (Question Tool Cap) requires tracking question count in `.opencode/state/question-count.json`, but there's no script to increment or check the count. The agent must update the JSON manually. A `increment-question-count.sh` and `check-question-cap.sh` would enforce the 3-question cap programmatically.

4. **No `validate-intent.sh` script** — While `intent-verify.sh` validates the PROBE stop conditions, there's no script to validate the `intent.json` structure itself (e.g., that arrays are properly formatted, values are within enums).

---

## AGGREGATE FINDINGS

### Scripts Summary

| Metric | Value |
|--------|-------|
| Total scripts | 13 |
| Unique scripts (deduped) | 11 |
| Duplicated scripts | 2 (`verify-hierarchy.sh` × 2, `register-skill.sh` × 2) |
| Total script lines | 2,269 |
| Duplicate lines | 834 (295 + 122 = 417 per copy × 2 copies) |
| Scripts with clear purpose | 13/13 (100%) |
| Scripts with external dependencies | 8 (jq dependency in verify-hierarchy, register-skill; bash fallbacks exist) |
| Scripts called from SKILL.md | 9/13 |
| **Orphaned scripts** (exist but SKILL.md doesn't call) | **4** (`loop-status.sh`, `first-action.sh`, `session-checkpoint.sh`, and indirectly `intent-verify.sh` which is called via Gate 4 pattern) |
| Phantom script references | 0 (SKILL.md doesn't reference any scripts that don't exist) |

### Scripts by Skill

| Skill | Script Count | Lines | Orphaned | Phantom |
|-------|-------------|-------|----------|---------|
| coordinating-loop | 8 | 1,265 | 1 (`loop-status.sh`) | 0 |
| phase-loop | 0 | 0 | 0 | 0 |
| planning-with-files | 0 | 0 | 0 | 0 |
| user-intent-interactive-loop | 5 | 1,036 | 2 (`first-action.sh`, `session-checkpoint.sh`) | 0 |

### References Summary

| Metric | Value |
|--------|-------|
| Total reference files | 10 |
| Total reference lines | 2,715 |
| Average lines per reference | 271.5 |
| Largest reference | `04-long-session-management.md` (412 lines) |
| Smallest reference | `05-worked-examples.md` (121 lines) |

### References by Skill

| Skill | Reference Count | Lines | Coverage |
|-------|----------------|-------|----------|
| coordinating-loop | 4 | 943 | Handoff protocols, sequential/parallel decisions, parent-child cycles, ralph-loop integration |
| phase-loop | 1 | 172 | Revision loop pattern (stall detection, escalation) |
| planning-with-files | 0 | 0 | All content in SKILL.md (276 lines) |
| user-intent-interactive-loop | 5 | 1,600 | Question protocols, context preservation, brainstorming, long sessions, worked examples |

### Evals Summary

| Skill | Has evals? | trigger-queries | evals.json |
|-------|-----------|----------------|------------|
| coordinating-loop | ✅ | 24 lines (14 queries) | 135 lines (multiple test cases) |
| phase-loop | ❌ | — | — |
| planning-with-files | ❌ | — | — |
| user-intent-interactive-loop | ✅ | 24 lines (14 queries) | 141 lines (multiple test cases) |

### Conflicts Found

| Script/Ref | Skill A | Skill B | Nature of Conflict |
|------------|---------|---------|-------------------|
| `verify-hierarchy.sh` (295 lines) | coordinating-loop | user-intent-interactive-loop | **Byte-identical duplicate.** Both copies support all 5 skills. Should be extracted to a shared location (e.g., `.claude/skills/shared/scripts/`). |
| `register-skill.sh` (122 lines) | coordinating-loop | user-intent-interactive-loop | **Byte-identical duplicate.** Same script, same purpose. Should be extracted to shared location. |
| `task_plan.md` / `findings.md` / `progress.md` | planning-with-files (project root) | coordinating-loop (`.coordination/<session>/`) | **Naming collision.** Same filenames in different directories. When both skills are active, agent manages 2 sets of identically-named files. Implicit contract, not enforced. |
| Anti-pattern table: "The Coordinator Executor" | coordinating-loop (line 313) | user-intent-interactive-loop (line 343) | **Shared anti-pattern definition.** Both skills define the same anti-pattern (coordinator doing child's work) with slightly different wording. Consistent but duplicated. |

### Gap Summary

| Skill | Missing Bundle Component | Impact | Severity |
|-------|-------------------------|--------|----------|
| coordinating-loop | `loop-status.sh` not called from procedural steps | Agent has no clear trigger for status reporting; script exists but is orphaned | Low |
| phase-loop | **No scripts at all** | Loop semantics described in pseudocode but not executable. No iteration tracking, no stall detection, no max iteration enforcement via script | **High** |
| phase-loop | **No evals** | Cannot test trigger accuracy for phase-loop scenarios | Medium |
| phase-loop | **No hierarchy enforcement** | Can't verify prerequisite chain when loaded standalone | Medium |
| planning-with-files | **No scripts at all** | 3-file system creation and validation is entirely manual. No `init-planning.sh` or `validate-plan.sh` | **High** |
| planning-with-files | **No evals** | Cannot test trigger accuracy | Medium |
| planning-with-files | **No reference files** | 276-line SKILL.md is dense; file templates and recovery protocols could be extracted | Low |
| planning-with-files | **No hierarchy enforcement** | Layer 2 skill doesn't participate in loading chain verification | Medium |
| user-intent-interactive-loop | `first-action.sh` orphaned | Script automates FIRST ACTION steps but SKILL.md instructs manual execution. Confusion risk | Medium |
| user-intent-interactive-loop | `session-checkpoint.sh` orphaned | Script automates checkpointing but SKILL.md doesn't call it | Low |
| user-intent-interactive-loop | No question count enforcement script | 3-question cap relies on agent self-discipline, not programmatic enforcement | Medium |

### Key Architectural Observations

1. **Script distribution model:** Shared scripts (`verify-hierarchy.sh`, `register-skill.sh`) are duplicated per-skill for standalone operation. This is intentional — each skill can be installed independently. But it creates maintenance burden: changes must be applied to all copies.

2. **Layer model inconsistency:** Skills declare layers (1-3) and reference each other, but only Layer 1 (`user-intent-interactive-loop`) and Layer 3 (`coordinating-loop`) enforce the hierarchy. Layer 2 skills (`planning-with-files`, `phase-loop`) have no enforcement scripts.

3. **Bundle completeness varies dramatically:**
   - `coordinating-loop`: Full bundle (8 scripts, 4 refs, 2 evals)
   - `user-intent-interactive-loop`: Full bundle (5 scripts, 5 refs, 2 evals)
   - `phase-loop`: Minimal bundle (0 scripts, 1 ref, 0 evals)
   - `planning-with-files`: No bundle (0 scripts, 0 refs, 0 evals)

4. **Orphaned scripts pattern:** 3 scripts across 2 skills exist but aren't called from SKILL.md (`loop-status.sh`, `first-action.sh`, `session-checkpoint.sh`). These were likely created during development but the SKILL.md instructions were written to be more granular, bypassing the scripts.

---

_Auditor: B (gsd-code-reviewer)_
_Date: 2026-04-09_
_Scope: 4 orchestration skills (coordinating-loop, phase-loop, planning-with-files, user-intent-interactive-loop)_
_All files read, no files skipped_
