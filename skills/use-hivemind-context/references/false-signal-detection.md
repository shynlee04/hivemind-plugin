# False Signal Detection

## Why Signals Lie

Verification outputs (tests, type checks, linters, docs) can emit signals that do not reflect actual project health. Treating these signals as ground truth leads to wrong conclusions and wasted work.

## Signal Categories

### 1. False Positive — passes when it should fail

| Source | Example | Detection |
|--------|---------|-----------|
| Trivially true test | `expect(true).toBe(true)` | Inspect assertion; if it asserts nothing about the system, it is noise |
| Stub masking real behavior | Test uses mock SDK instead of real API surface | Check if the test exercises the actual SDK or a stub |
| Outdated assertion encoding wrong behavior | Test asserts old return format that no longer matches implementation | Compare assertion to current implementation return shape |
| Linter configured to skip error class | `.eslintrc` ignores the category in question | Check config rules for relevant suppressions |

**When detected:** Mark the test or check as `false-positive` in scan output. Do not count it as passing evidence.

### 2. False Negative — fails when it should pass

| Source | Example | Detection |
|--------|---------|-----------|
| Missing dependency / setup issue | `MODULE_NOT_FOUND` in test that works when dependencies are installed | Check if `npm ls` or equivalent shows missing dep |
| Environment mismatch | Test assumes specific Node version or OS | Check env requirements in test preamble |
| Timing / flaky test | Test fails intermittently, passes on rerun | Rerun and compare; if inconsistent, classify as flaky |
| Stale snapshot | Snapshot test fails because a safe change updated output format | Check if snapshot is up to date with current code |

**When detected:** Mark the test as `false-negative` and do not use the failure as evidence for architectural conclusions.

### 3. Noise — output that carries no diagnostic value

| Source | Example | Detection |
|--------|---------|-----------|
| Deprecation warnings from transitive deps | npm WARN messages about upstream packages | Ignore unless the deprecation affects a direct dependency |
| Compiler informational output | TypeScript emitting `--noEmit` info lines | Filter to exit code and error lines only |
| Verbose logging from test framework | Test runner printing progress bars or timing | Focus on assertion results, not runner chrome |

**When detected:** Filter out before analysis. Do not let noise inflate or deflate rot scores.

## Detection Protocol

When evaluating any verification output:

1. **Read the raw output.** Do not summarize before reading.
2. **Classify each signal** as `valid-pass`, `valid-fail`, `false-positive`, `false-negative`, or `noise`.
3. **Cross-check failures against implementation.** Does the code actually have the bug the test reports?
4. **Cross-check passes against intent.** Does the test actually verify the behavior we care about?
5. **Quarantine unresolvable signals.** If you cannot classify a signal, mark it `unresolved` and note it — do not drop it silently.

## Integration with Rot Scoring

- A `false-positive` on a critical gate **adds** rot points (the gate is unreliable).
- A `false-negative` on a critical gate does **not** add rot points (the system is likely fine, the test is broken).
- More than 3 `false-positive` results from the same gate raise the rot dimension score for that category by +2.
- `noise` is never counted toward rot.

## Anti-Patterns

- Treating all green tests as proof of health without inspecting what they assert
- Treating all red tests as proof of breakage without checking setup
- Using test counts as quality metrics without verifying assertion depth
- Letting noisy output inflate perceived severity
