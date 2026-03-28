---
name: hivemind-refactor
description: Refactor methodology. Smallest safe change. Behavior preservation is non-negotiable. Assess, plan, execute, verify — in that order.
---

<!-- LOAD-POSITION
slot: depth
role: depth
prerequisites: use-hivemind-delegation
-->

## Load Position

**Layer: Depth**. Loads after entry router and domain skill are in place.

| Constraint | Rule |
|-----------|------|
| Position | Depth layer |
| Load order | After entry router + domain skill |
| Prerequisites | `use-hivemind-delegation` |
| Conflict | None — loads alongside any domain skill |

# hivemind-refactor

**Refactoring is not rewriting. Rewriting changes behavior. Refactoring preserves it. If you cannot prove behavior is preserved, you are not refactoring — you are guessing.**

## When You Need This

You need this skill when:

- Code smells have accumulated and need systematic cleanup
- Technical debt is blocking feature work
- Post-debug cleanup requires structural improvement
- Functions have grown past 50 lines and need decomposition
- Dependencies are tangled and need separation
- Naming no longer reflects intent
- Duplication exists across modules

**You do NOT need this skill for:** new features (use TDD), bug fixes (use debug delegation), or pure research (use research delegation). If you are adding behavior, this is the wrong tool.

## The Refactor Loop

Four phases. Each gates the next. No skipping. No merging. No "I'll assess and execute at the same time."

```
ASSESS → PLAN → EXECUTE → VERIFY
  │         │        │         │
  │         │        │         └─ Tests pass? Build clean? Behavior preserved?
  │         │        └─ One change at a time. Tests pass between each.
  │         └─ Smallest safe change. What breaks? What stays green?
  └─ What smells? What is the blast radius?
```

**If you skip ASSESS, you refactor blind. If you skip PLAN, you refactor reckless. If you skip VERIFY, you refactor faith-based. None of these are acceptable.**

## Phase 1: ASSESS

Before touching any code, understand what you are dealing with.

### What You Must Identify

| Item | Why It Matters |
|------|---------------|
| The specific code smell | You cannot fix what you cannot name |
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

The ASSESS phase is not complete until you can answer:

1. What specifically smells? (file:line references)
2. What is the blast radius? (list of affected files)
3. What tests exist for the target area? (test file paths)
4. What is the risk? (low / medium / high with justification)

**If you cannot name the smell with a file and line number, you have not assessed. You have speculated.**

<HARD-GATE>PLAN phase BLOCKED until ASSESS produces: (1) named smell with file:line, (2) blast radius list, (3) test coverage status, (4) risk classification. No assessment = no plan. No plan = no execution.</HARD-GATE>

## Phase 2: PLAN

The plan is the smallest safe change. Not the most elegant. Not the most comprehensive. The smallest change that improves the code without breaking anything.

### Plan Rules

1. **One refactor type per plan.** Do not mix renaming with extraction with moving. One type. One plan.
2. **List every file that will change.** If you discover a file mid-execution, your plan was incomplete. Stop. Replan.
3. **List every test that must stay green.** These are your contract. If any of these break, the refactor is wrong.
4. **Define the rollback.** What git command restores the prior state? If you cannot define rollback, you are not ready to execute.
5. **Seam inventory.** Where are the natural boundaries for this refactor? Where can you cut without bleeding?

### Smallest Safe Change

This is the hardest discipline. You will want to fix everything at once. Resist.

| What You Want | What You Should Do |
|--------------|-------------------|
| "I'll rename, extract, and reorganize in one pass" | Pick ONE. Execute it. Verify. Then plan the next. |
| "I'll refactor the whole module" | Pick the worst smell. Fix that one. Verify. Repeat. |
| "I'll modernize the patterns while I'm here" | Modernization is a separate refactor. Stay focused. |

### Plan Output

| Field | Content |
|-------|---------|
| Refactor type | rename / extract / inline / move / collapse |
| Target files | Exact file paths that will change |
| Contract tests | Tests that must remain green |
| Rollback command | `git checkout <files>` or `git stash` |
| Expected behavior delta | NONE — if you expect behavior change, stop |

<HARD-GATE>EXECUTE phase BLOCKED until PLAN produces: (1) single refactor type, (2) file list, (3) contract tests, (4) rollback command, (5) expected behavior delta of NONE.</HARD-GATE>

## Phase 3: EXECUTE

One change at a time. After each change, tests pass. Not "after all changes." After EACH change.

### Execution Rules

1. **Make one atomic change.** Extract one function. Rename one symbol. Move one file.
2. **Run tests immediately.** `npm test` after every single change. Not after two. Not after three. After one.
3. **If a test breaks, STOP.** Do not fix the test. Do not adjust the assertion. REVERT the change. The test is the contract. Your change violated it.
4. **Commit incrementally.** Each passing change gets a commit. This gives you granular rollback.

### What "One Change" Means

| Action | One Change? |
|--------|------------|
| Rename `foo` to `bar` in one file | Yes |
| Rename `foo` to `bar` across 5 files | No — that is 5 changes |
| Extract function `calculateTotal` from `processOrder` | Yes |
| Extract function AND rename parameters | No — extract first, rename after |
| Move file from `utils/` to `shared/` | Yes (if imports updated atomically) |
| Move file AND refactor its internals | No — move first, refactor after |

**The temptation to batch will be strong. Every batch is a gamble. Every gamble that fails costs you an hour of bisecting. Make one change. Verify. Repeat.**

<HARD-GATE>After EACH atomic change: `npm test` must pass. If any test fails → REVERT immediately. Do not "fix forward." Revert. Replan. Execute the corrected plan.</HARD-GATE>

## Phase 4: VERIFY

The refactor is not done when the code looks better. It is done when the code looks better AND every verification gate passes.

### Verification Gates

| Gate | Command | Pass Condition |
|------|---------|---------------|
| Type check | `npx tsc --noEmit` | Zero errors |
| Test suite | `npm test` | All tests pass |
| Lint | `npm run lint` | Zero violations |
| Build | `npm run build` | Exit code 0 |
| Behavior delta | Manual review | No behavioral change |

**All five must pass. Not three. Not four. All five.**

### Behavior Preservation Proof

You must demonstrate behavior is preserved by:

1. All existing tests still pass (same count, same assertions)
2. No new test failures introduced
3. Input/output pairs unchanged (if observable)
4. Side effects unchanged (file writes, API calls, state mutations)

**"The tests pass" is necessary but not sufficient if the tests were weak.** If your ASSESS phase found low test coverage, the VERIFY phase has a confidence gap. Document it. Do not claim certainty you do not have.

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

**The rollback command must be defined in your PLAN phase. If you are figuring out rollback during EXECUTE, your plan was incomplete.**

### The Revert-First Rule

When a test breaks, your first instinct will be to fix the test or fix the code to pass the test. **This instinct is wrong.**

1. REVERT the change
2. Understand why it broke (ASSESS again)
3. PLAN a different approach
4. EXECUTE the new plan

Fix-forward is how refactors become rewrites. Revert-first is how refactors stay safe.

## Anti-Patterns

**These are not theoretical. Every one of these has shipped. Every one caused pain.**

| # | Anti-Pattern | What Actually Happens |
|---|-------------|----------------------|
| 1 | **Refactoring without assessment** | You rename a function that 40 files import. You find out at build time. 2 hours wasted. |
| 2 | **Batching changes before testing** | You make 8 changes. Test 5 fails. Which change broke it? You spend 45 minutes bisecting. |
| 3 | **Fixing tests during refactor** | You "update" the assertion to match new behavior. The test now passes but encodes wrong behavior. Ship day arrives. Production breaks. |
| 4 | **"While I'm here" refactoring** | You came to rename a variable. You left having rewritten the module. 3 new bugs. Zero original task completed. |
| 5 | **Skipping verify because types passed** | `tsc` is structural. It does not catch runtime behavior changes. Your function compiles perfectly and returns the wrong value. |
| 6 | **Refactoring without tests** | No safety net. Every change is a coin flip. You flip 20 coins. Statistically, some land wrong. |
| 7 | **Refactoring to "clean code" that is less clear** | You extracted 12 one-line functions. The code is "modular" and completely unreadable. Nobody can trace the flow. |
| 8 | **Claiming "no behavior change" without proof** | You feel confident. Confidence is not evidence. Run the tests. Show the output. Prove it. |

---

## Sibling Skills

| Skill | Relationship |
|-------|-------------|
| `use-hivemind-delegation` | Required prerequisite — provides delegation protocol |
| `use-hivemind-tdd` | If refactor adds behavior, transition to TDD |
| `hivemind-codemap` | For whole-codebase assessment before large refactors |
| `hivemind-patterns` | Architecture pattern reference for refactor decisions |

## Bundled Resources

| Resource | Path | Purpose |
|----------|------|---------|
| Code Review Reception | `references/code-review-reception.md` | How to receive and process code review feedback |
| Code Review Request | `references/code-review-request.md` | How to request effective code reviews |
| Code Smell Taxonomy | `references/code-smell-taxonomy.md` | Classification of code smells and their fixes |
| Refactor Techniques | `references/refactor-techniques.md` | Catalog of refactoring techniques |
| Verification Before Completion | `references/verification-before-completion.md` | Evidence-before-assertions gate protocol |
| Code Reviewer Prompt | `templates/code-reviewer-prompt.md` | Template for code review prompts |
| Refactor Checklist | `templates/refactor-checklist.md` | Template for refactor verification checklist |
| Refactor Scenario | `tests/refactor-scenario.md` | Test scenario for refactoring workflow |

## Independence Rules

- This skill operates at depth level — it requires `use-hivemind-delegation` as a prerequisite
- It provides methodology, not delegation mechanics — delegation packets come from the delegation skill
- Refactor artifacts are stored in `{project}/.hivemind/activity/refactor/{session_id}/`
- This skill composes with `hivemind-gatekeeping` for multi-iteration refactor loops
