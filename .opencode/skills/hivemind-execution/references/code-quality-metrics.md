# Code Quality Metrics

Thresholds, measurement techniques, and remediation guidance for code quality enforcement during implementation.

## Table of Contents

- [Metric Thresholds](#metric-thresholds)
- [Cyclomatic Complexity](#cyclomatic-complexity)
- [Function Length](#function-length)
- [Module Length](#module-length)
- [Parameter Count](#parameter-count)
- [Nesting Depth](#nesting-depth)
- [Naming Quality](#naming-quality)
- [Coupling Metrics](#coupling-metrics)
- [Measurement Commands](#measurement-commands)
- [When Metrics Conflict](#when-metrics-conflict)

---

## Metric Thresholds

| Metric | Threshold | Severity if Exceeded | Reference |
|--------|-----------|---------------------|-----------|
| Cyclomatic complexity | ≤10 per function | Must fix before return | [SOLID § SRP](solid-principles.md#single-responsibility-principle) |
| Function length | ≤50 lines | Must fix before return | [SOLID § SRP](solid-principles.md#single-responsibility-principle) |
| Module length | ≤300 lines | Constitution violation — must fix | AGENTS.md |
| Parameter count | ≤5 | Should fix — use parameter object | [SOLID § ISP](solid-principles.md#interface-segregation-principle) |
| Nesting depth | ≤3 levels | Should fix — extract inner blocks | — |
| Test coverage (new code) | ≥80% | Must fix before return | `use-hivemind-tdd` |
| Naming | Intent-revealing | Should fix during refactor | — |

---

## Cyclomatic Complexity

**Definition:** The number of linearly independent paths through a function's source code. Each `if`, `else`, `for`, `while`, `switch`, `case`, `&&`, `||`, `??`, and ternary adds 1.

**Threshold:** ≤10 per function.

**How to measure:**

```bash
# Manual counting
# Count: if/else/for/while/switch/case/&&/||/??/ternary
# Start at 1 (the function entry point)
```

**What to do when exceeded:**

1. Extract each branch body into a named function.
2. Replace complex conditions with named boolean variables.
3. Use early returns to reduce nesting.
4. If complexity >15, the function likely handles multiple responsibilities — split by concern.

**Example reduction:**

```typescript
// Complexity 12 — too high
function processTask(task: Task) {
  if (task.status === 'pending') {
    if (task.priority === 'high') {
      if (task.assignee) {
        // ... deeply nested logic
      }
    }
  }
}

// Complexity 4 — each function ≤3
function processTask(task: Task) {
  if (!isPending(task)) return;
  if (!isHighPriority(task)) return;
  if (!hasAssignee(task)) return;
  executeAssignedHighPriority(task);
}
```

---

## Function Length

**Definition:** Number of lines in a function body, excluding blank lines and JSDoc comments.

**Threshold:** ≤50 lines.

**How to measure:**

```bash
# Count lines in a specific function
awk '/^function |^  async |^  [a-zA-Z].*\(/ { start=NR } start && /^}/ { print NR-start+1; start=0 }' src/tools/example.ts
```

**What to do when exceeded:**

1. Extract logical blocks into helper functions.
2. Each helper should have a descriptive name that reveals intent.
3. If the function still exceeds 50 lines after extraction, it likely has multiple responsibilities — split by concern.
4. Target: each function should fit on one screen without scrolling.

---

## Module Length

**Definition:** Total lines in a single file, including imports, types, and exports.

**Threshold:** ≤300 lines (HiveMind constitution — non-negotiable).

**How to measure:**

```bash
wc -l src/tools/example.ts
```

**What to do when exceeded:**

1. This is a constitution violation. No ROI calculation needed — must fix.
2. Split the module by responsibility:
   - Types → `types.ts`
   - Helpers → `helpers.ts`
   - Main logic → keep in original file
3. Each resulting module must be ≤300 lines.
4. Update imports in consuming files.

---

## Parameter Count

**Definition:** Number of parameters in a function signature.

**Threshold:** ≤5 parameters.

**How to measure:**

```typescript
// Count commas in parameter list + 1
function example(a: string, b: number, c: boolean, d: Config, e: Options) {
  // 5 parameters — at threshold
}
```

**What to do when exceeded:**

Use the parameter object pattern:

```typescript
// Bad: 7 parameters
function createTask(title: string, desc: string, priority: string, assignee: string, dueDate: string, tags: string[], projectId: string) { ... }

// Good: parameter object
interface CreateTaskParams {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: string;
  tags?: string[];
  projectId: string;
}
function createTask(params: CreateTaskParams) { ... }
```

---

## Nesting Depth

**Definition:** Maximum number of nested control structures within a function.

**Threshold:** ≤3 levels.

**How to measure:**

Count indentation levels. Each `if`, `for`, `while`, `switch`, `try`, callback, or arrow function inside another adds 1.

**What to do when exceeded:**

1. Use early returns (guard clauses) to flatten.
2. Extract nested blocks into named functions.
3. Replace nested callbacks with `async/await`.
4. Use `Array.prototype` methods instead of manual loops.

```typescript
// Nesting depth 4 — too deep
function process(data: Data) {
  if (data) {
    if (data.items) {
      for (const item of data.items) {
        if (item.valid) {
          handleItem(item);
        }
      }
    }
  }
}

// Nesting depth 2 — flat
function process(data: Data) {
  if (!data?.items) return;
  data.items.filter(isValid).forEach(handleItem);
}
```

---

## Naming Quality

**Definition:** Names that reveal intent — a reader should understand what the code does without reading its implementation.

**Threshold:** Qualitative — all names must be intent-revealing.

**Rules:**

| Element | Convention | Example |
|---------|-----------|---------|
| Functions | Verb + noun, describes action | `validateTaskTitle()` not `check()` |
| Variables | Noun, describes what it holds | `pendingTasks` not `list` |
| Booleans | `is`/`has`/`can` prefix | `isValid` not `valid` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` not `maxRetries` |
| Types/Interfaces | PascalCase noun | `TaskConfig` not `ITaskConfig` |
| Files | kebab-case | `task-manager.ts` not `TaskManager.ts` |

**What to do when names are unclear:**

1. Rename during the refactor phase of TDD.
2. Use your IDE's rename refactoring — it updates all references.
3. After renaming, run `npx tsc --noEmit` and `npm test` to verify no breakage.

---

## Coupling Metrics

**Definition:** Afferent coupling (Ca) = number of modules that depend on this module. Efferent coupling (Ce) = number of modules this module depends on.

**Thresholds:**

| Metric | Threshold | Guidance |
|--------|-----------|----------|
| Afferent coupling (Ca) | ≤10 | High Ca means many dependents — change carefully |
| Efferent coupling (Ce) | ≤8 | High Ce means many dependencies — fragile |
| Instability (I = Ce/(Ca+Ce)) | 0.3-0.7 | Too stable (I≈0) resists change; too unstable (I≈1) is fragile |

**HiveMind-specific coupling rules:**

- Tools should depend on `shared/` utilities and SDK types only — never on other tools.
- Hooks should depend on SDK hooks and `shared/` types — never on tools.
- `plugin/` depends on tools and hooks — but tools and hooks never depend on `plugin/`.
- If a module has Ce > 8, consider extracting a shared interface.

---

## Measurement Commands

```bash
# Line count per file
wc -l src/**/*.ts

# Type check
npx tsc --noEmit

# Tests
npm test

# Lint
npm run lint

# Build
npm run build

# Find functions exceeding 50 lines (approximate)
rg "^  (async )?[a-zA-Z]" src/ -n | head -20
```

---

## When Metrics Conflict

Sometimes optimizing for one metric worsens another. Resolution rules:

| Conflict | Resolution |
|----------|-----------|
| Extracting functions reduces complexity but increases file count | Prefer more small files over fewer large files |
| Inlining reduces Ce but increases function length | Keep functions ≤50 lines — accept higher Ce |
| Parameter objects reduce param count but increase type complexity | Accept the parameter object — types are checked by compiler |
| Early returns reduce nesting but create multiple exit points | Prefer readability — multiple returns are fine |
| Splitting modules reduces LOC but creates circular imports | Resolve circular imports first — they're a deeper problem |
