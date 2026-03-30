# Code Review Checklist

Use this checklist after a refactor plan is drafted and before the refactor is marked safe. Every item points to a concrete OpenCode tool or shell command so the review is reproducible.

## Review Operating Rules

1. Start with semantic impact analysis before editing code.
2. Prefer `lsp` for symbol-aware queries and `grep` for broad pattern sweeps.
3. Record evidence, not opinions.
4. Treat `npx tsc --noEmit`, `npm test`, `npm run lint`, and `npm run build` as hard gates.
5. If a tool is unavailable, note the fallback explicitly.

## Tool Quick Reference

| Need | Preferred Tool | Fallback | Expected Output |
|---|---|---|---|
| Symbol definition | `lsp goToDefinition` | `grep` + `read` | Exact declaration location |
| All symbol usages | `lsp findReferences` | `grep` | List of callers/consumers |
| Dead code suspicion | `lsp prepareCallHierarchy` + `incomingCalls` | `grep` | No live inbound calls |
| File shape review | `lsp documentSymbol` | `read` | Outline of functions/classes |
| Pattern sweep | `grep` | `lsp workspaceSymbol` | Matching files and lines |
| Type safety | `bash: npx tsc --noEmit` | none | Zero errors |
| Regression check | `bash: npm test` | targeted test command | Passing suite |
| Style check | `bash: npm run lint` | none | Zero violations |
| Integration check | `bash: npm run build` | none | Successful build |

## Phase 1: Scope and Blast Radius

### Checklist

| # | What to check | Tool | Example | Expected output | Pass condition |
|---|---|---|---|---|---|
| 1 | Target symbol exists where the plan says it does | `lsp goToDefinition` | `lsp { "operation": "goToDefinition", "filePath": "src/orders/service.ts", "position": { "line": 42, "character": 12 } }` | One canonical declaration | Declaration matches the refactor target |
| 2 | Planned rename/move will not cross unknown modules | `lsp findReferences` | `lsp { "operation": "findReferences", ... }` | Reference list across files | All affected files are in the plan |
| 3 | Similar names are not hiding extra targets | `grep` | `grep { "pattern": "processOrder|processOrders", "include": "*.ts" }` | All near-match symbols | No surprise sibling symbol omitted |
| 4 | File contains only the responsibilities the refactor claims | `lsp documentSymbol` | `lsp { "operation": "documentSymbol", "filePath": "src/orders/service.ts" }` | Function/class outline | Outline matches planned scope |
| 5 | Imports reveal external dependencies | `read` | Read the import block | Import list | Every dependency is understood before editing |

### Reviewer Notes

- If `findReferences` returns more files than the plan lists, stop and expand the plan first.
- If `documentSymbol` shows multiple responsibilities, prefer smaller incremental refactors.
- If `grep` finds duplicated helper names, check whether an extraction already exists.

## Phase 2: Safety Checks Before Edit

| # | What to check | Tool | Example | Expected output | Pass condition |
|---|---|---|---|---|---|
| 6 | Existing type state is green before change | `bash` | `npx tsc --noEmit` | Exit code 0 | Baseline has no new type errors from this slice |
| 7 | Existing tests are green before change | `bash` | `npm test` | Passing tests | Baseline behavior is stable enough to refactor |
| 8 | Existing lint is green or known failures are documented | `bash` | `npm run lint` | Passing lint or known baseline failures | Refactor will not hide lint regressions |
| 9 | Existing build succeeds | `bash` | `npm run build` | Successful build | Integration state is known |
| 10 | Worktree diff is understood | `bash` | `git diff --stat` | File summary | No unrelated local changes in target files |

### Pass/Fail Guidance

- Fail the review if the baseline is red and the failure source is unknown.
- Allow proceeding only when red baseline failures are documented and outside the refactor scope.

## Phase 3: Symbol-Level Review

| # | What to check | Tool | Example | Expected output | Pass condition |
|---|---|---|---|---|---|
| 11 | Rename affects all call sites | `lsp findReferences` | Search the old symbol before and after rename | Old references disappear, new references appear | No stale symbol references remain |
| 12 | Move keeps dependency direction sane | `lsp goToDefinition` + `read` | Jump through imports after move | Updated import graph | No circular or reversed dependency introduced |
| 13 | Extracted helper has a single clear responsibility | `lsp documentSymbol` | Inspect extracted file/function outline | Smaller focused symbol list | Extracted unit is cohesive |
| 14 | Inline refactor removed dead wrapper references | `grep` | `grep { "pattern": "wrapperFunction", "include": "*.ts" }` | Zero or expected matches | No leftover indirection remains |
| 15 | Parameter object fields match prior parameter usage | `lsp findReferences` | Search for each old parameter use | References now point through the object | No lost field or renamed semantic |
| 16 | Polymorphism refactor removes type-switch branches | `grep` | `grep { "pattern": "switch \(|if \(.*type", "include": "*.ts" }` | Reduced conditional matches | Strategy subclasses own behavior |

## Phase 4: Code Smell Regression Sweep

| # | What to check | Tool | Example | Expected output | Pass condition |
|---|---|---|---|---|---|
| 17 | Magic numbers were replaced intentionally, not multiplied | `grep` | `grep { "pattern": "\\b(7|30|60|86400)\\b", "include": "*.ts" }` | Limited remaining literals | Remaining literals are justified |
| 18 | Temporary names were removed | `grep` | `grep { "pattern": "\b(tmp|temp|data|value2|helper2)\b", "include": "*.ts" }` | Few or zero matches | New names communicate intent |
| 19 | Comment drift was not introduced | `read` | Read edited blocks with nearby comments | Comments align with code | No stale comments remain |
| 20 | Dead exports were not introduced | `grep` + `lsp findReferences` | Check exported symbols with zero references | Export list + zero/low usage | Unused exports are removed or justified |
| 21 | Duplicate helper logic was not created | `grep` | `grep { "pattern": "calculate.*Total|build.*Payload", "include": "*.ts" }` | Similar helpers surfaced | Shared logic is centralized |
| 22 | File size and shape improved | `lsp documentSymbol` + `read` | Compare before/after outline | Shorter or clearer structure | Complexity did not increase |

## Phase 5: Review by Refactor Technique

### Extract Function

| Check | Tool | Expected output | Pass condition |
|---|---|---|---|
| Inputs to extracted function are explicit | `read` | New signature lists required inputs | No hidden dependency on outer mutable state |
| Extracted name states intent | `read` | Function name reads like a business action | Reviewer can infer purpose without body |
| Caller is shorter and clearer | `read` | Fewer lines and less branching in caller | Original function complexity decreased |

### Inline

| Check | Tool | Expected output | Pass condition |
|---|---|---|---|
| Wrapper logic truly adds no value | `read` | Wrapper body is a trivial pass-through | Inline reduces indirection |
| Removed symbol has no remaining references | `lsp findReferences` or `grep` | Zero references | Safe to delete wrapper |

### Move

| Check | Tool | Expected output | Pass condition |
|---|---|---|---|
| New home uses the moved symbol more naturally | `lsp findReferences` | References cluster near the new module | Ownership improved |
| Import churn is intentional and bounded | `git diff --stat` | Limited affected files | Blast radius matches plan |

### Rename

| Check | Tool | Expected output | Pass condition |
|---|---|---|---|
| Old name disappears from target scope | `grep` | Zero stale matches | Rename completed consistently |
| New name improves domain clarity | `read` | Updated symbol names | Reviewers can explain the intent faster |

### Collapse Hierarchy

| Check | Tool | Expected output | Pass condition |
|---|---|---|---|
| Removed subclass had no unique behavior | `lsp documentSymbol` + `read` | Empty or trivial subclass outline | Merge is behavior-safe |
| Call sites still reach the same behavior | `npm test` | Passing regression suite | Polymorphic behavior preserved |

### Extract Interface

| Check | Tool | Expected output | Pass condition |
|---|---|---|---|
| Interface contains only shared contract | `read` | Small focused interface | No implementation leakage |
| Consumers depend on interface, not concrete class | `grep` | Consumer imports updated | Dependency inversion improved |

### Replace Magic Number

| Check | Tool | Expected output | Pass condition |
|---|---|---|---|
| Constant name communicates domain meaning | `read` | Named constant near use or shared config | Number meaning is obvious |
| Literal occurrences are reduced | `grep` | Fewer raw literal hits | No inconsistent leftovers |

### Introduce Parameter Object

| Check | Tool | Expected output | Pass condition |
|---|---|---|---|
| Grouped fields belong together conceptually | `read` | Object fields form a coherent set | No junk-drawer object |
| Call sites are clearer, not noisier | `read` | Fewer positional arguments | Meaning improved at invocation sites |

### Replace Conditional with Polymorphism

| Check | Tool | Expected output | Pass condition |
|---|---|---|---|
| Behavior is selected by type object, not condition tree | `grep` | Fewer type checks | Dispatch moved into polymorphic implementations |
| New subclasses/strategies are easy to extend | `read` | Clear shared interface/base class | Future cases add code, not condition branches |

## Phase 6: Verification Commands

| # | Command | Why it matters | Expected output | Pass condition |
|---|---|---|---|---|
| 23 | `npx tsc --noEmit` | Confirms type-safe graph after rename/move/extract | No diagnostics | Zero errors |
| 24 | `npm test` | Confirms regression safety | Passing tests | All required suites pass |
| 25 | `npm run lint` | Catches unused imports, style drift, complexity issues | Clean lint output | Zero violations |
| 26 | `npm run build` | Confirms packaging and integration safety | Successful build output | Exit code 0 |
| 27 | `git diff --stat` | Verifies file churn stayed within plan | Compact changed-file summary | Affected files match scope |

## Expected Review Evidence

Record the following in the review note or activity log:

- Target symbols reviewed with `lsp`.
- Pattern sweeps performed with `grep`.
- Pre/post command results for `npx tsc --noEmit`, `npm test`, `npm run lint`, and `npm run build`.
- Any fallback used because LSP was unavailable.
- Final pass/fail call per checklist section.

## Fast Pass Template

```markdown
### Refactor Review Summary

- Scope validated with: `lsp findReferences`, `lsp documentSymbol`
- Pattern sweep: `grep { "pattern": "...", "include": "*.ts" }`
- Type safety: PASS / FAIL
- Regression: PASS / FAIL
- Lint: PASS / FAIL
- Build: PASS / FAIL
- Reviewer verdict: PASS / FAIL
- Notes: <risk, fallback, or follow-up>
```
