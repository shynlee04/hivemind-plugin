---
name: hivemind-refactor
description: Refactor methodology. Smallest safe change. Behavior preservation is non-negotiable. Assess, plan, execute, verify — in that order.
---
> **Parameter Legend**
>
> | Placeholder | Meaning |
> |---|---|
> | `{runtime_state_dir}` | Runtime state directory (e.g., `.hivemind/`) |
> | `{runtime_activity_dir}` | Activity output directory (e.g., `.hivemind/activity/`) |
> | `{pathing_config}` | Active paths configuration file (e.g., `.hivemind/pathing/active-paths.json`) |
>
> Replace placeholders with your project's actual runtime paths.


## Table of Contents

- [When You Need This](#when-you-need-this)
- [The Refactor Loop](#the-refactor-loop)
- [Phase 1: ASSESS](#phase-1-assess)
  - [What You Must Identify](#what-you-must-identify)
  - [Smell Classification](#smell-classification)
  - [Evidence You Must Return](#evidence-you-must-return)
- [Phase 2: PLAN](#phase-2-plan)
  - [Plan Rules](#plan-rules)
  - [Smallest Safe Change](#smallest-safe-change)
  - [Plan Output](#plan-output)
- [Phase 3: EXECUTE](#phase-3-execute)
  - [Execution Rules](#execution-rules)
  - [What "One Change" Means](#what-one-change-means)
- [Phase 4: VERIFY](#phase-4-verify)
  - [Verification Gates](#verification-gates)
  - [Behavior Preservation Proof](#behavior-preservation-proof)
- [Refactor Techniques](#refactor-techniques)
- [Rollback Protocol](#rollback-protocol)
  - [When To Roll Back](#when-to-roll-back)
  - [Rollback Command](#rollback-command)
  - [The Revert-First Rule](#the-revert-first-rule)
- [Code Review Integration](#code-review-integration)
  - [Review Dispatch Triggers](#review-dispatch-triggers)
  - [Review Checklist Usage](#review-checklist-usage)
  - [Multi-Reviewer Dispatch](#multi-reviewer-dispatch)
- [Anti-Patterns](#anti-patterns)
- [Sibling Skills](#sibling-skills)
- [Conditional Loading](#conditional-loading)
- [Bundled Resources](#bundled-resources)
- [Independence Rules](#independence-rules)

**Refactoring is not rewriting. Rewriting changes behavior. Refactoring preserves it. If behavior preservation cannot be proven, refactoring is not happening — guessing is.**

## When You Need This

Activate this skill when:

- Code smells have accumulated and need systematic cleanup
- Technical debt is blocking feature work
- Post-debug cleanup requires structural improvement
- Functions have grown past 50 lines and need decomposition
- Dependencies are tangled and need separation
- Naming no longer reflects intent
- Duplication exists across modules

**Do NOT use this skill for:** new features (use TDD), bug fixes (use debug delegation), or pure research (use research delegation). If adding behavior, this is the wrong tool.

## The Refactor Loop

Four phases. Each gates the next. No skipping. No merging. No assessing and executing simultaneously.

```
ASSESS → PLAN → EXECUTE → VERIFY
  │         │        │         │
  │         │        │         └─ Tests pass? Build clean? Behavior preserved?
  │         │        └─ One change at a time. Tests pass between each.
  │         └─ Smallest safe change. Identify breakage. Confirm green tests.
  └─ Identify smells. Map blast radius.
```

**Skipping ASSESS means refactoring blind. Skipping PLAN means refactoring reckless. Skipping VERIFY means refactoring faith-based. None are acceptable.**

## Phase 1: ASSESS

Before touching any code, understand the current state.

### What You Must Identify

| Item | Why It Matters |
|------|---------------|
| The specific code smell | Cannot fix what cannot be named |
| Blast radius | Which files, functions, and consumers are affected |
| Test coverage | Do tests exist? Do they actually test behavior? |
| Risk level | Low (rename), Medium (extract), High (move across boundaries) |
| Dependencies | What imports this? What does this import? |

### Smell Classification

Not all smells are equal. Classify before acting:

| Smell | Severity | Typical Fix |
|-------|----------|-------------|
| Poor naming | Low | Rename with confidence |
| Duplication | Medium | Extract shared logic |
| God Function | Medium | Decompose into smaller functions |
| God Component | High | Split by responsibility |
| Tight Coupling | High | Introduce seams, extract interfaces |
| Dead code | Low | Remove (after confirming no callers) |
| Magic values | Low | Extract to named constants |

### Evidence You Must Return

The ASSESS phase is not complete until the following questions are answered:

1. What specifically smells? (file:line references)
2. What is the blast radius? (list of affected files)
3. What tests exist for the target area? (test file paths)
4. What is the risk? (low / medium / high with justification)

**If the smell cannot be named with a file and line number, it is speculation, not assessment.**

<HARD-GATE>PLAN phase BLOCKED until ASSESS produces: (1) named smell with file:line, (2) blast radius list, (3) test coverage status, (4) risk classification. No assessment = no plan. No plan = no execution.</HARD-GATE>

## Phase 2: PLAN

The plan is the smallest safe change. Not the most elegant. Not the most comprehensive. The smallest change that improves the code without breaking anything.

### Plan Rules

1. **One refactor type per plan.** Do not mix renaming with extraction with moving. One type. One plan.
2. **List every file that will change.** Discovering a file mid-execution means the plan was incomplete. Stop. Replan.
3. **List every test that must stay green.** These are the contract. If any break, the refactor is wrong.
4. **Define the rollback.** What git command restores the prior state? If rollback cannot be defined, execution is not ready.
5. **Seam inventory.** Where are the natural boundaries for this refactor? Where can cuts be made without cascading breakage?

### Smallest Safe Change

This is the hardest discipline. The temptation to fix everything at once is strong. Resist.

| Current State | Correct Approach |
|--------------|-------------------|
| "Rename, extract, and reorganize in one pass" | Pick ONE. Execute it. Verify. Then plan the next. |
| "Refactor the whole module" | Pick the worst smell. Fix that one. Verify. Repeat. |
| "Modernize the patterns while here" | Modernization is a separate refactor. Stay focused. |

### Plan Output

| Field | Content |
|-------|---------|
| Refactor type | rename / extract / inline / move / collapse |
| Target files | Exact file paths that will change |
| Contract tests | Tests that must remain green |
| Rollback command | `Revert changes (e.g., git checkout <files>, git stash)` |
| Expected behavior delta | NONE — if behavior change is expected, stop |

<HARD-GATE>EXECUTE phase BLOCKED until PLAN produces: (1) single refactor type, (2) file list, (3) contract tests, (4) rollback command, (5) expected behavior delta of NONE.</HARD-GATE>

## Phase 3: EXECUTE

One change at a time. After each change, tests pass. Not "after all changes." After EACH change.

### Execution Rules

1. **Make one atomic change.** Extract one function. Rename one symbol. Move one file.
2. **Run tests immediately.** `Run the test suite (e.g., npm test, pytest, cargo test)` after every single change. Not after two. Not after three. After one.
3. **If a test breaks, STOP.** Do not fix the test. Do not adjust the assertion. REVERT the change. The test is the contract. The change violated it.
4. **Commit incrementally.** Each passing change gets a commit. This provides granular rollback.

### What "One Change" Means

| Action | One Change? |
|--------|------------|
| Rename `foo` to `bar` in one file | Yes |
| Rename `foo` to `bar` across 5 files | No — that is 5 separate changes |
| Extract function `calculateTotal` from `processOrder` | Yes |
| Extract function AND rename parameters | No — extract first, rename after |
| Move file from `utils/` to `shared/` | Yes (if imports updated atomically) |
| Move file AND refactor its internals | No — move first, refactor after |

**The temptation to batch will be strong. Every batch is a gamble. Every gamble that fails costs an hour of bisecting. Make one change. Verify. Repeat.**

<HARD-GATE>After EACH atomic change: `Run the test suite (e.g., npm test, pytest, cargo test)` must pass. If any test fails → REVERT immediately. Do not "fix forward." Revert. Replan. Execute the corrected plan.</HARD-GATE>

## Phase 4: VERIFY

The refactor is not done when the code looks better. It is done when the code looks better AND every verification gate passes.

### Verification Gates

| Gate | Command | Pass Condition |
|------|---------|---------------|
| Type check | `Run type checking (e.g., npx tsc --noEmit for TypeScript)` | Zero errors |
| Test suite | `Run the test suite (e.g., npm test, pytest, cargo test)` | All tests pass |
| Lint | `Run linting (e.g., npm run lint, eslint, pylint)` | Zero violations |
| Build | `Build the project (e.g., npm run build, cargo build)` | Exit code 0 |
| Behavior delta | Manual review | No behavioral change |

**All five must pass. Not three. Not four. All five.**

### Behavior Preservation Proof

Demonstrate behavior is preserved by:

1. All existing tests still pass (same count, same assertions)
2. No new test failures introduced
3. Input/output pairs unchanged (if observable)
4. Side effects unchanged (file writes, API calls, state mutations)

**"The tests pass" is necessary but not sufficient if the tests were weak.** If the ASSESS phase found low test coverage, the VERIFY phase has a confidence gap. Document it. Do not claim certainty that does not exist.

## Refactor Techniques

| Technique | When To Use | Risk |
|-----------|------------|------|
| **Extract Function** | Block of code does one thing, used once, exceeds 15 lines | Low |
| **Inline Function** | Function body is clearer than the function name | Low |
| **Rename** | Name does not match intent | Low |
| **Extract Variable** | Complex expression used in conditionals or returns | Low |
| **Move** | Function/class is in the wrong module | Medium |
| **Extract Interface** | Multiple implementations, need abstraction boundary | Medium |
| **Collapse Hierarchy** | Inheritance depth exceeds 2, subclass is trivial | Medium |
| **Introduce Parameter Object** | Function takes 4+ related parameters | Medium |
| **Replace Conditional with Polymorphism** | Type-checking switch/if-else chains | High |

**Start with low-risk techniques. Escalate only when low-risk does not solve the smell.**

## Rollback Protocol

This is not optional. This is the safety net.

### When To Roll Back

| Trigger | Action |
|---------|--------|
| Any test breaks after a change | REVERT that change immediately |
| Type check fails | REVERT. Types are contracts. |
| Build fails | REVERT. Build is the integration gate. |
| You are unsure if behavior changed | REVERT. Uncertainty is not acceptable. |
| You made 3+ changes before testing | REVERT all. Start over. One change at a time. |

### Rollback Command

```bash
# If changes are staged but not committed
git checkout -- <files>

# If changes are committed
git revert HEAD

# If multiple commits need reverting
git revert HEAD~3..HEAD
```

**The rollback command must be defined in the PLAN phase. Figuring out rollback during EXECUTE means the plan was incomplete.**

### The Revert-First Rule

When a test breaks, the first instinct is to fix the test or fix the code to pass the test. **This instinct is wrong.**

1. REVERT the change
2. Understand why it broke (ASSESS again)
3. PLAN a different approach
4. EXECUTE the new plan

Fix-forward is how refactors become rewrites. Revert-first is how refactors stay safe.

## Code Review Integration

Refactoring and code review are complementary. After the VERIFY phase, optional review dispatch can validate the refactor from multiple dimensions.

### Review Dispatch Triggers

| Trigger | When | Load |
|---------|------|------|
| High-risk refactor | Blast radius >5 files | `code-review-checklist.md` + `reviewer-dimensions.md` |
| Severity calibration needed | Mixed P0-P3 findings | `severity-calibration.md` |
| Structured feedback required | PR-style review needed | `review-comment-template.md` |

### Review Checklist Usage

During VERIFY phase, optionally run the multi-dimensional review checklist from `references/code-review-checklist.md`. Each dimension (correctness, security, performance, readability, architecture, testing) provides pass/fail criteria.

### Multi-Reviewer Dispatch

When review spans multiple dimensions, dispatch separate agents per dimension using `references/reviewer-dimensions.md`. Each agent owns one dimension. No overlaps.

## Anti-Patterns

**These are not theoretical. Every one of these has shipped. Every one caused pain.**

| # | Anti-Pattern | What Actually Happens |
|---|-------------|----------------------|
| 1 | **Refactoring without assessment** | A function that 40 files import gets renamed. Discovery happens at build time. 2 hours wasted. |
| 2 | **Batching changes before testing** | Eight changes are made. Test 5 fails. Which change broke it? 45 minutes spent bisecting. |
| 3 | **Fixing tests during refactor** | The assertion gets "updated" to match new behavior. The test now passes but encodes wrong behavior. Ship day arrives. Production breaks. |
| 4 | **"While I'm here" refactoring** | The task was to rename a variable. The result was a rewritten module. 3 new bugs. Zero original task completed. |
| 5 | **Skipping verify because types passed** | `tsc` is structural. It does not catch runtime behavior changes. The function compiles perfectly and returns the wrong value. |
| 6 | **Refactoring without tests** | No safety net. Every change is a coin flip. With 20 changes, statistically some land wrong. |
| 7 | **Refactoring to "clean code" that is less clear** | Twelve one-line functions extracted. The code is "modular" and completely unreadable. Nobody can trace the flow. |
| 8 | **Claiming "no behavior change" without proof** | Confidence is not evidence. Run the tests. Show the output. Prove it. |

---

## Sibling Skills

| Skill | Relationship |
|-------|-------------|
| `use-hivemind-delegation` | Required prerequisite — provides delegation protocol |
| `use-hivemind-tdd` | If refactor adds behavior, transition to TDD |
| `hivemind-codemap` | For whole-codebase assessment before large refactors |
| `hivemind-patterns` | Architecture pattern reference for refactor decisions |

## Conditional Loading

| Condition | Load Reference |
|-----------|---------------|
| Smell type is Bloaters | `code-smell-taxonomy.md` |
| Smell type is Coupling | `refactor-techniques.md` |
| Review needed after refactor | `code-review-checklist.md` |
| Severity calibration needed | `severity-calibration.md` |
| Multi-agent review dispatch | `reviewer-dimensions.md` |

## Bundled Resources

| Resource | Path | Purpose |
|----------|------|---------|
| Code Review Checklist | `references/code-review-checklist.md` | Multi-dimensional review checklist (50+ items) |
| Code Review Reception | `references/code-review-reception.md` | How to receive and process code review feedback |
| Code Review Request | `references/code-review-request.md` | How to request effective code reviews |
| Code Smell Taxonomy | `references/code-smell-taxonomy.md` | Classification of code smells and their fixes |
| Refactor Techniques | `references/refactor-techniques.md` | Catalog of refactoring techniques |
| Review Comment Template | `references/review-comment-template.md` | Structured review comment format |
| Reviewer Dimensions | `references/reviewer-dimensions.md` | Multi-agent review dimension allocation |
| Severity Calibration | `references/severity-calibration.md` | P0-P3 severity scoring framework |
| Verification Before Completion | `references/verification-before-completion.md` | Evidence-before-assertions gate protocol |
| Code Reviewer Prompt | `templates/code-reviewer-prompt.md` | Template for code review prompts |
| Refactor Checklist | `templates/refactor-checklist.md` | Template for refactor verification checklist |
| Refactor Scenario | `tests/refactor-scenario.md` | Test scenario for refactoring workflow |

## Independence Rules

- This skill operates at depth level — it requires `use-hivemind-delegation` as a prerequisite
- It provides methodology, not delegation mechanics — delegation packets come from the delegation skill
- Refactor artifacts are stored in `{project}/{runtime_activity_dir}/refactor/{session_id}/`
- This skill composes with `hivemind-gatekeeping` for multi-iteration refactor loops

## Activity Output

All artifacts produced by this skill follow the Activity Folder Protocol.

**Pathing:** See `{pathing_config}` for resolved output paths.
**Naming:** `{category}-{semantic-id}-{YYYY-MM-DD}.{ext}`
**Meta:** All JSON includes `_meta.created_at`, `_meta.updated_at`, `_meta.producer`.
**Validation:** `Run artifact validation (e.g., bash scripts/hm-artifact-validate.sh {path})` to confirm compliance.

## OpenCode Tool Matrix for Refactoring

| Task | Primary Tool | Why | Fallback |
|---|---|---|---|
| declaration lookup | `lsp goToDefinition` | semantic symbol jump | `grep` + `read` |
| impact analysis | `lsp findReferences` | full caller list before rename/move | `grep` |
| structure scan | `lsp documentSymbol` | file/class outline for seams | `read` |
| dead code check | `lsp prepareCallHierarchy` + `incomingCalls` | inbound call graph | `grep` |
| pattern sweep | `grep` | fast broad smell detection | `read` |
| targeted inspection | `read` | confirm nearby logic and comments | none |
| code change | `edit` / `patch` | precise refactor updates | `write` for new files |
| verification | `bash` | `Run type checking (e.g., npx tsc --noEmit for TypeScript)`, `Run the test suite (e.g., npm test, pytest, cargo test)`, `Run linting (e.g., npm run lint, eslint, pylint)`, `Build the project (e.g., npm run build, cargo build)` | none |

Prefer semantic tools first. Use `grep` when the symbol name is uncertain or LSP is unavailable.

## LSP Integration for Refactoring

Enable the LSP tool before relying on symbol-aware workflows. Use it for semantic refactors, not just text edits.

1. Use `goToDefinition` before rename or move work to confirm the authority declaration.
2. Use `findReferences` before edits to measure the blast radius.
3. Use `documentSymbol` to pick extract seams and spot oversized files.
4. Use `prepareCallHierarchy` plus `incomingCalls` to detect orphaned code before delete or inline work.
5. Re-run `findReferences` after the refactor to confirm stale references are gone.

Reference `references/lsp-refactor-workflows.md` for the full sequences and JSON examples.

## Code Review Checklist Reference

Load `references/code-review-checklist.md` when:

- the refactor crosses more than one file
- a rename or move changes public or shared symbols
- the plan touches inheritance, interfaces, or conditional dispatch
- the verification gates pass but reviewer confidence is still low

Use the checklist to bind each review question to a tool, expected output, and pass condition.

## Bash Examples (5)

```bash
npx tsc --noEmit 2>&1
```

```bash
npm test 2>&1 | tail -5
```

```bash
git diff --stat
```

```bash
git checkout -- src/orders/service.ts tests/orders/service.test.ts
```

```text
lsp { "operation": "findReferences", "filePath": "src/orders/service.ts", "position": { "line": 42, "character": 14 } }
```

Use these examples exactly as review probes: type safety, regression, scope summary, rollback, and reference mapping.

## Decision Tree: Refactor Technique Selection

| If the smell is... | Choose... | Confirm with... |
|---|---|---|
| one function doing multiple jobs | Extract Function | `lsp documentSymbol` |
| wrapper logic adding no clarity | Inline | `lsp findReferences` |
| logic living with the wrong owner | Move | `lsp goToDefinition` |
| vague or misleading naming | Rename | `lsp findReferences` |
| subclass adds no real behavior | Collapse Hierarchy | `lsp documentSymbol` |
| consumers need a smaller contract | Extract Interface | `grep` + `read` |
| numeric/string literal hides policy | Replace Magic Number | `grep` |
| too many related positional args | Introduce Parameter Object | `read` |
| type switch keeps growing | Replace Conditional with Polymorphism | `grep` + `Run the test suite (e.g., npm test, pytest, cargo test)` |

If `incomingCalls` returns zero and exports are not consumed, treat the symbol as a dead-code candidate before deleting it.

## Cross-Skill Chaining

- Load `hivemind-gatekeeping` when the refactor needs staged verification loops or multi-pass review.
- Load `use-hivemind-tdd` if the refactor reveals missing safety tests and behavior must be locked before structural change.
- Load `hivemind-codemap` when the blast radius is uncertain across the codebase.
- Use `references/refactor-techniques-catalog.md` and `references/lsp-refactor-workflows.md` as the detailed follow-on resources.

## Metrics & Verification

Capture these metrics for every refactor session:

- pre/post `Diff summary (e.g., git diff --stat)`
- reference count delta from `lsp findReferences`
- type error delta from `Run type checking (e.g., npx tsc --noEmit for TypeScript)`
- regression result from `Run the test suite (e.g., npm test, pytest, cargo test)`
- lint delta from `Run linting (e.g., npm run lint, eslint, pylint)`
- integration result from `Build the project (e.g., npm run build, cargo build)`

Use `scripts/hm-refactor-verify.sh` to run the verification bundle and emit a rollback command.