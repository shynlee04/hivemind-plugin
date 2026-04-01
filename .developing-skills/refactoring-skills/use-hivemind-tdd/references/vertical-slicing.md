# Vertical Slicing in TDD

## WRONG: Horizontal Slices

```
RED: test1, test2, test3, test4, test5
GREEN: impl1, impl2, impl3, impl4, impl5
```

- Tests written in bulk test **IMAGINED** behavior, not **ACTUAL** behavior.
- Each test was written before the developer had any feedback from a real implementation.
- Tests encode assumptions that may never reflect real code paths.

## RIGHT: Vertical Slices (Tracer Bullets)

```
RED→GREEN: test1 → impl1
RED→GREEN: test2 → impl2
RED→GREEN: test3 → impl3
```

- Each test responds to what you learned from the previous cycle.
- The developer writes the test, then immediately writes the minimum code to make it pass.
- Feedback is instant and concrete.

## Why Vertical Works

1. **You just wrote the code**, so you know what behavior actually matters to verify.
2. **Tests verify behavior through PUBLIC INTERFACES** — they don't depend on internal structure.
3. **Tests survive refactors** because they assert on outcomes, not implementation details.
4. **Each cycle narrows focus** — one failing test at a time keeps attention on the next piece of behavior.

## Anti-Pattern: "Write All Tests First"

Writing an entire test suite before any implementation creates fragile, disconnected tests:

- Tests become **insensitive to real changes** — they pass when behavior breaks, fail when behavior is fine.
- You **outrun your headlights** — assumptions baked into tests may never be validated against running code.
- The test suite becomes a maintenance burden instead of a safety net.

## Rule of Thumb

> One failing test. One implementation. One green bar. Repeat.
