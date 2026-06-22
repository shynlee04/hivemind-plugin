---
name: systematic-debugging-hivemind
description: "Debug HiveMind issues methodically by gathering evidence, investigating root causes, forming hypotheses, and verifying fixes using hivemind_session, hivemind_memory, and hivemind_inspect commands. Use when npm test fails, LSP diagnostics report errors, runtime errors occur, or hooks and commands behave unexpectedly."
---

# Systematic Debugging HiveMind

Single-hypothesis debugging methodology for HiveMind. Enforces evidence-first investigation before any fix attempt using HiveMind-specific commands in a strict sequence.

## Workflow

1. **Gather evidence** — start `hivemind_session({ action: "start", mode: "quick_fix" })`, capture error output, identify scope with `grep`
2. **Investigate root cause** — check known solutions via `hivemind_memory({ action: "recall", shelf: "solutions" })`, check anchors, analyze drift with `hivemind_inspect({ action: "drift" })`
3. **Form hypothesis** — state root cause with supporting evidence, create minimal reproduction
4. **Fix and verify** — write a failing test first (`npm test -- --grep "<name>"`), apply ONE minimal change, verify with `npm test && npx tsc --noEmit`
5. **Save solution** — persist to `hivemind_memory({ shelf: "solutions", tags: "debug,bugfix,[category]" })`

## Debugging Patterns

### Hook Debugging (`src/hooks/*.ts`)

1. Read hook index: `read({ filePath: "src/hooks/index.ts" })`
2. Verify event binding: `grep({ include: "*.ts", pattern: "experimental\\..*\\.transform" })`
3. Test manually: `node bin/hivemind-tools.cjs session trace <timestamp>`

### Command Debugging (`bin/hivemind-tools.cjs`)

1. Check implementation: `read({ filePath: "src/lib/[command].ts" })`
2. Test in isolation: `node bin/hivemind-tools.cjs [command] --help`

### Session/State Debugging

1. Inspect state: `hivemind_inspect({ action: "scan" })`
2. Check hierarchy: `scan_hierarchy({ action: "status" })`
3. Review memory: `hivemind_memory({ action: "recall", limit: 10 })`

### Test Suite Debugging

1. Run single test: `npm test -- --grep "<test_name>"`
2. Watch mode: `npm test -- --watch`
3. Find test files: `glob({ pattern: "tests/**/*.test.ts" })`

## Red Flags — Stop and Return to Evidence Gathering

- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "I think X is probably the cause"

Any of these means you are skipping evidence. Return to step 1.

## Checklist

- [ ] Debug session started with `hivemind_session`
- [ ] Evidence gathered before proposing fixes
- [ ] Known solutions checked via `hivemind_memory`
- [ ] Hypothesis verified with minimal test
- [ ] Solution saved to memory

## File References

- `src/hooks/*.ts` — hook patterns
- `bin/hivemind-tools.cjs`, `src/lib/*.ts` — command patterns
- `.hivemind/state/`, `graph/*.json` — state patterns
- `tests/**/*.test.ts` — test patterns
