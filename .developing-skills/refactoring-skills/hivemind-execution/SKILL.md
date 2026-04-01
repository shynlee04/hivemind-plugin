---
name: hivemind-execution
description: Execution workflow for implementation agents — quality gates, code standards, and dependency audit guidance for clean delivery.
---

# hivemind-execution

Execution workflow guidance for implementation agents (e.g., hivemaker, hivehealer in Hivemind). Governs the receive-implement-verify-return loop, enforces code quality thresholds, and provides dependency audit procedures for clean delivery.

## Table of Contents

- [When You Need This](#when-you-need-this)
- [Do Not Use This For](#do-not-use-this-for)
- [The Execution Loop](#the-execution-loop)
- [Code Quality Standards](#code-quality-standards)
- [CQRS Boundary Awareness](#cqrs-boundary-awareness)
- [Evidence-Before-Assertions](#evidence-before-assertions)
- [Sibling Skills](#sibling-skills)
- [Bundled Resources](#bundled-resources)
- [Independence Rules](#independence-rules)

**Path Parameters** (adapt to your framework):
- `{runtime_state_dir}` — Root runtime state directory (e.g., `.hivemind/`, `.claude/`, `.cursor/`)
- `{runtime_activity_dir}` — Activity artifacts directory (e.g., `.hivemind/activity/`, `.claude/activity/`)
- `{pathing_config}` — Pathing configuration file (e.g., `.hivemind/pathing/active-paths.json`)

## When You Need This

This skill activates when any of the following signals appear:

1. **Received a delegation packet with `mode: execution`** — The agent has been assigned implementation work and needs the execution loop protocol.
2. **Writing new tool implementations** — The agent is creating a new tool under `src/tools/` and needs quality gate guidance.
3. **Implementing hooks or plugin wiring** — The agent is adding hooks under `src/hooks/` or wiring in `src/plugin/`.
4. **Before claiming task completion** — The agent needs the quality gate checklist to verify evidence before returning.
5. **Auditing dependency health** — The agent needs to check for stale, vulnerable, or unused dependencies.
6. **Reviewing code quality during implementation** — The agent needs thresholds for complexity, length, and naming.

## Do Not Use This For

This skill does NOT cover the following concerns. Route them to the correct skill instead:

1. **Architecture decisions** — Use `hivemind-architecture` for ADRs, pattern selection, and structural choices.
2. **Test-first development** — Use `use-hivemind-tdd` for the red-green-refactor cycle and test gate enforcement.
3. **Code refactoring** — Use `hivemind-refactor` for surgical changes that preserve behavior.
4. **Task decomposition** — Use `use-hivemind-delegation` for splitting work across agents.
5. **Debug workflows** — Use `hivemind-system-debug` for reproduction, narrowing, and containment loops.
6. **Planning** — Use `use-hivemind-planning` for requirement distillation and feasibility validation.

## The Execution Loop

Four steps. Sequential. Never skip any step.

```
RECEIVE → LOAD → IMPLEMENT → VERIFY → RETURN
```

### Step 1: Receive Delegation Packet

Parse the execution packet to understand scope, constraints, and success criteria.

| Field | Purpose |
|-------|---------|
| `slice_id` | Unique identifier for this work unit |
| `scope` | What to implement (bounded description) |
| `authority_surfaces` | Allowed file paths for modification |
| `out_of_scope` | Forbidden file paths — never touch these |
| `constraints` | Technical constraints and requirements |
| `success_metrics` | How to verify the work is complete |
| `rollback_command` | Git command to revert if needed |

Use the [Execution Packet Template](templates/execution-packet.md) when creating delegation packets for subagents.

### Step 2: Load Required Skills

Before writing any code, load the skills needed for this specific task:

| Task Type | Required Skills |
|-----------|----------------|
| New tool implementation | `use-hivemind-tdd`, `hivemind-architecture` |
| Hook implementation | `use-hivemind-tdd` |
| Refactoring during implementation | `hivemind-refactor` |
| Any implementation | `hivemind-atomic-commit` (for commit discipline) |

**Rule:** Load skills only for the current task. Do not load the entire skill catalog.

### Step 3: Implement

Execute the implementation following these constraints:

1. **Stay within authority surfaces.** Only modify files listed in `authority_surfaces`.
2. **Follow existing patterns.** Read neighboring files first. Match naming, structure, and conventions.
3. **Apply code quality standards.** See [Code Quality Standards](#code-quality-standards) below.
4. **Respect CQRS boundaries.** See [CQRS Boundary Awareness](#cqrs-boundary-awareness) below.
5. **Use `tool.schema` (Zod) for tool args.** Never define tool args as raw TypeScript interfaces.

### Step 4: Self-Verify

Before returning, run the quality gate. See the [Quality Gate Template](templates/quality-gate.md).

```bash
# Run type checking (e.g., npx tsc --noEmit for TypeScript, mypy for Python) — zero errors required
# Run the test suite (e.g., npm test, pytest, cargo test) — all tests must pass
# Run linting (e.g., npm run lint, eslint, flake8) — zero violations
# Build the project (e.g., npm run build, cargo build) — must succeed
```

**Evidence rule:** Capture command output. Never claim "done" without showing terminal evidence.

### Step 5: Return Evidence Bundle

Return to the orchestrator with:

- Files modified (paths + line counts)
- Verification results (command output for each gate)
- Any deviations from the packet (with justification)
- Open issues or follow-up needed

## Code Quality Standards

These thresholds are non-negotiable. Code that exceeds them must be refactored before returning.

### Thresholds

| Metric | Threshold | Reference |
|--------|-----------|-----------|
| Cyclomatic complexity | ≤10 per function | [code-quality-metrics.md](references/code-quality-metrics.md) |
| Function length | ≤50 lines | [solid-principles.md](references/solid-principles.md) § Single Responsibility |
| Module length | ≤300 lines (HiveMind constitution) | [code-quality-metrics.md](references/code-quality-metrics.md) |
| Parameter count | ≤5 | [code-quality-metrics.md](references/code-quality-metrics.md) |
| Nesting depth | ≤3 levels | [code-quality-metrics.md](references/code-quality-metrics.md) |
| Test coverage | ≥80% for new code | `use-hivemind-tdd` |
| Naming | Intent-revealing, descriptive | [solid-principles.md](references/solid-principles.md) |

### When Thresholds Are Exceeded

1. **Cyclomatic complexity >10:** Extract branches into named functions. Each function should do one thing.
2. **Function >50 lines:** Split into smaller functions. Each function has one reason to change.
3. **Module >300 lines:** This is a constitution violation. Split the module immediately.
4. **Parameters >5:** Use a parameter object pattern. Group related params into an interface.
5. **Nesting >3:** Extract inner blocks into functions. Use early returns to flatten.

### Refactoring During Implementation

When code quality thresholds are exceeded during implementation, apply the smallest safe refactoring. Use `hivemind-refactor` for guidance on behavior-preserving changes.

Calculate refactoring ROI when the fix is non-trivial: see [refactor-roi.md](references/refactor-roi.md).

## CQRS Boundary Awareness

HiveMind enforces a strict CQRS (Command Query Responsibility Segregation) boundary. Implementation agents must respect this boundary at all times.

| Layer | Responsibility | Write? | Read? |
|-------|---------------|--------|-------|
| **Tools** (`src/tools/`) | Command side — execute mutations | ✅ | ✅ |
| **Hooks** (`src/hooks/`) | Query side — inject context, observe | ❌ | ✅ |
| **Plugin** (`src/plugin/`) | Assembly — wire tools and hooks | ❌ | ❌ |

### Rules

1. **Tools write.** Tools are the only layer that may modify state, call external APIs with side effects, or produce durable artifacts.
2. **Hooks read.** Hooks observe events, inject context, and transform data. They never mutate durable state.
3. **Plugin assembles.** The plugin entry point wires tools and hooks together. It contains no business logic.
4. **No exceptions.** A hook that also writes is a CQRS violation. Refactor it into a tool.

### HiveMind-Specific Constraints

| Constraint | Rule |
|-----------|------|
| Tool args | Must use `tool.schema` (Zod re-export) — never raw TypeScript interfaces |
| Tool context | Use `context.sessionID`, `context.agent`, `context.directory` from `ToolContext` |
| JSDoc | Preserve `@param`, `@returns`, `@example` on all public functions |
| Logging | Use `client.app.log()` for structured logging alongside `console` |
| Permission gates | Use `permission.ask` hook or `context.ask()` for state mutations |

## Evidence-Before-Assertions

Never claim "done" without running verification commands and capturing output.

### The Rule

| Excuse | Reality |
|--------|---------|
| "It should compile" | Should ≠ does. Run the type check command. |
| "Tests take too long" | Faster to run them now than debug failures later. |
| "The change is trivial" | Trivial changes break trivially. Test them. |
| "I'm confident it works" | Confidence ≠ evidence. Period. |

### Required Evidence

Every implementation return must include:

```json
{
  "verification": {
    "type_check": { "command": "<type-check-cmd>", "exit_code": 0, "status": "pass" },
    "tests": { "command": "<test-suite-cmd>", "exit_code": 0, "status": "pass" },
    "lint": { "command": "<lint-cmd>", "exit_code": 0, "status": "pass" },
    "build": { "command": "<build-cmd>", "exit_code": 0, "status": "pass" }
  }
}
```
Replace `<*-cmd>` placeholders with your project's commands (e.g., `npx tsc --noEmit`, `npm test`, `pytest`, `cargo test`).

If any gate fails, the implementation is NOT complete. Fix it or return `blocked`.

## OpenCode Tool Matrix

| Need | Primary Tool | Why | Fallback |
| --- | --- | --- | --- |
| inspect the delegated file | `read` | exact local context | `glob` then `read` |
| find sibling usage before editing | `grep` | fast cross-file search | `lsp.findReferences` |
| run required gates | `bash` | real command evidence | none |
| verify symbol ownership | `lsp.goToDefinition` | semantic proof | `grep` |

## Concrete Bash Examples

```bash
# Run type checking (e.g., npx tsc --noEmit for TypeScript, mypy for Python)
# Run the test suite (e.g., npm test, pytest, cargo test)
# Build the project (e.g., npm run build, cargo build)
```

## Gate Failure Decision Tree

1. **IF** the type check command fails, **THEN** fix type errors before touching tests or build output.
2. **IF** type check passes but the test suite fails, **THEN** reproduce the smallest failing test first and keep scope inside delegated files.
3. **IF** tests pass but the build fails, **THEN** treat the work as incomplete and fix the build before return.
4. **IF** any gate fails three times, **THEN** return `blocked` with the failing command and latest output excerpt.

## Advanced Quality Gate Template

Use `templates/quality-gate-advanced.json` when one implementation needs explicit pass conditions, evidence excerpts, retry limits, and fail actions.

## Sibling Skills

| Skill | Relationship |
|-------|-------------|
| `hivemind-architecture` | Architecture decisions during implementation — load when structural choices arise |
| `use-hivemind-tdd` | Test-first execution — load when TDD workflow is required |
| `hivemind-refactor` | Cleanup pass after green — load when code needs behavior-preserving restructuring |
| `hivemind-patterns` | Design patterns reference — load when choosing implementation patterns |
| `use-hivemind-delegation` | Task decomposition — parent skill that dispatches execution packets |
| `hivemind-atomic-commit` | Commit discipline — load before committing implementation work |

## Bundled Resources

| Resource | Path | Purpose |
|----------|------|---------|
| SOLID Principles | `references/solid-principles.md` | SOLID with TypeScript examples and HiveMind guidance |
| Refactoring ROI | `references/refactor-roi.md` | ROI formula, break-even analysis, decision framework |
| Code Quality Metrics | `references/code-quality-metrics.md` | Thresholds, measurement, remediation for each metric |
| Dependency Audit Workflow | `references/dependency-audit-workflow.md` | Step-by-step dependency health check procedure |
| Execution Packet Template | `templates/execution-packet.md` | Template for implementation delegation packets |
| Quality Gate Template | `templates/quality-gate.md` | Pre-commit quality gate checklist |

## Independence Rules

- This is a **depth skill** — loaded after entry routing and delegation decomposition.
- Parent: `use-hivemind` (external — must be loaded via `skill` tool before this skill).
- Depth companions: `hivemind-architecture`, `use-hivemind-tdd`, `hivemind-refactor` (all external).
- This skill does not modify files — it provides guidance that implementation agents follow.
- Quality gate results are evidence artifacts, not durable state.
- Dependency audit results may be stored in `{project}/{runtime_activity_dir}/codescan/` at runtime.

## Activity Output

All artifacts produced by this skill follow the Activity Folder Protocol.

**Pathing:** See `{pathing_config}` for resolved output paths.
**Naming:** `{category}-{semantic-id}-{YYYY-MM-DD}.{ext}`
**Meta:** All JSON includes `_meta.created_at`, `_meta.updated_at`, `_meta.producer`.
**Validation:** Run `bash use-hivemind-delegation/scripts/hm-artifact-validate.sh {path}` to confirm compliance.
