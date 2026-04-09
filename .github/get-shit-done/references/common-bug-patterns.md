# Common Bug Patterns

Checklist of frequent bug patterns to scan before forming hypotheses. Ordered by frequency. Check these FIRST — they cover ~80% of bugs across all technology stacks.

<patterns>

## Null / Undefined Access

- [ ] Accessing property on `null` or `undefined` — missing null check or optional chaining
- [ ] Function returns `undefined` instead of expected value — missing `return` statement or wrong branch
- [ ] Array/object destructuring on `null`/`undefined` — API returned error shape instead of data
- [ ] Optional parameter used without default — caller omitted argument

## Off-by-One / Boundary

- [ ] Loop starts at 1 instead of 0, or ends at `length` instead of `length - 1`
- [ ] Fence-post error — "N items need N-1 separators" miscounted
- [ ] Inclusive vs exclusive range boundary — `<` vs `<=`, slice/substring end index
- [ ] Empty collection not handled — `.length === 0` falls through to logic assuming items exist

## Async / Timing

- [ ] Missing `await` on async function — gets Promise object instead of resolved value
- [ ] Race condition — two async operations read/write same state without coordination
- [ ] Stale closure — callback captures old variable value, not current one
- [ ] Event handler fires before setup complete — initialization order dependency
- [ ] Timeout/interval not cleaned up — fires after component/context destroyed

## State Management

- [ ] Mutating shared state — object/array modified in place affects other consumers
- [ ] State updated but UI not re-rendered — missing reactive trigger or wrong reference
- [ ] Stale state in event handler — closure captures state at bind time, not current value
- [ ] Multiple sources of truth — same data stored in two places, one gets out of sync
- [ ] State machine allows invalid transition — missing guard condition

## Import / Module

- [ ] Circular dependency — module A imports B, B imports A, one gets `undefined`
- [ ] Default vs named export mismatch — `import X` vs `import { X }`
- [ ] Wrong file extension — `.js` vs `.cjs` vs `.mjs`, `.ts` vs `.tsx`
- [ ] Path case sensitivity — works on Windows/macOS, fails on Linux
- [ ] Missing file extension in import — ESM requires explicit extensions

## Type / Coercion

- [ ] String vs number comparison — `"5" > "10"` is `true` (lexicographic), `5 > 10` is `false`
- [ ] Implicit type coercion — `==` instead of `===`, truthy/falsy surprises (`0`, `""`, `[]`)
- [ ] Integer overflow or floating point — `0.1 + 0.2 !== 0.3`, large numbers lose precision
- [ ] Boolean vs truthy check — value is `0` or `""` which is valid but falsy

## Environment / Config

- [ ] Environment variable missing or wrong — different value in dev vs prod vs CI
- [ ] Hardcoded path or URL — works on one machine, fails on another
- [ ] Port already in use — previous process still running
- [ ] File permission denied — different user/group in deployment
- [ ] Missing dependency — not in package.json or not installed

## Data Shape / API Contract

- [ ] API response shape changed — backend updated, frontend expects old format
- [ ] Array where object expected (or vice versa) — `data` vs `data.results` vs `data[0]`
- [ ] Missing field in payload — required field omitted, backend returns validation error
- [ ] Date/time format mismatch — ISO string vs timestamp vs locale string
- [ ] Encoding mismatch — UTF-8 vs Latin-1, URL encoding, HTML entities

## Regex / String

- [ ] Regex `g` flag with `.test()` then `.exec()` — `lastIndex` not reset between calls
- [ ] Missing escape — `.` matches any char, `$` is special, backslash needs doubling
- [ ] Greedy match captures too much — `.*` eats through delimiters, need `.*?`
- [ ] String interpolation in wrong quote type — template literals need backticks

## Error Handling

- [ ] Catch block swallows error — empty `catch {}` or logs but doesn't rethrow/handle
- [ ] Wrong error type caught — catches base `Error` when specific type needed
- [ ] Error in error handler — cleanup code throws, masking original error
- [ ] Promise rejection unhandled — missing `.catch()` or try/catch around `await`

## Scope / Closure

- [ ] Variable shadowing — inner scope declares same name, hides outer variable
- [ ] Loop variable capture — all closures share same `var i`, use `let` or bind
- [ ] `this` binding lost — callback loses context, need `.bind()` or arrow function
- [ ] Block scope vs function scope — `var` hoisted to function, `let`/`const` block-scoped

</patterns>

<usage>

## How to Use This Checklist

1. **Before forming any hypothesis**, scan the relevant categories based on the symptom
2. **Match symptom to pattern** — if the bug involves "undefined is not an object", check Null/Undefined first
3. **Each checked pattern is a hypothesis candidate** — verify or eliminate with evidence
4. **If no pattern matches**, proceed to open-ended investigation

### Symptom-to-Category Quick Map

| Symptom | Check First |
|---------|------------|
| "Cannot read property of undefined/null" | Null/Undefined Access |
| "X is not a function" | Import/Module, Type/Coercion |
| Works sometimes, fails sometimes | Async/Timing, State Management |
| Works locally, fails in CI/prod | Environment/Config |
| Wrong data displayed | Data Shape, State Management |
| Off by one item / missing last item | Off-by-One/Boundary |
| "Unexpected token" / parse error | Data Shape, Type/Coercion |
| Memory leak / growing resource usage | Async/Timing (cleanup), Scope/Closure |
| Infinite loop / max call stack | State Management, Async/Timing |

</usage>
