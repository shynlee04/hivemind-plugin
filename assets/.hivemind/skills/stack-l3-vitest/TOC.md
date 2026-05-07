# Table of Contents — stack-vitest

## API Reference

### `references/api/assertions.md`
- `expect()` — Basic assertions
- Identity matchers: `toBe`, `toEqual`, `toStrictEqual`
- Truthiness: `toBeTruthy`, `toBeFalsy`, `toBeNull`, `toBeUndefined`, `toBeDefined`
- Numbers: `toBeGreaterThan`, `toBeGreaterThanOrEqual`, `toBeLessThan`, `toBeCloseTo`
- Strings: `toContain`, `toMatch`, `toHaveLength`
- Arrays/Iterables: `toContain`, `toContainEqual`, `toHaveLength`
- Exceptions: `toThrow`, `toThrowError`
- Objects: `toHaveProperty`, `toMatchObject`
- Snapshots: `toMatchSnapshot`, `toMatchInlineSnapshot`
- Mocks: `toHaveBeenCalled`, `toHaveBeenCalledWith`, `toHaveReturnedTimes`
- Asymmetric: `expect.any`, `expect.anything`, `expect.arrayContaining`
- Modifiers: `.not`, `.resolves`, `.rejects`
- Special: `expect.soft()`, `expect.poll()`, `expect.extend()`

### `references/api/mocking.md`
- `vi.fn()` — Mock functions
- `vi.spyOn()` — Method spies
- `vi.mock()` — Module mocking (hoisted)
- `vi.doMock()` — Non-hoisted module mocking
- `vi.hoisted()` — Hoisted variable definitions
- `vi.importActual()` — Partial mock imports
- `vi.useFakeTimers()` — Timer control
- `vi.advanceTimersByTime()` — Time manipulation
- `vi.setSystemTime()` — Date control
- `vi.stubGlobal()` — Global variable stubs
- `vi.stubEnv()` — Environment variable stubs
- Mock function methods: `mockImplementation`, `mockReturnValue`, `mockResolvedValue`
- Cleanup: `vi.restoreAllMocks()`, `vi.clearAllMocks()`, `vi.resetAllMocks()`

### `references/api/lifecycle.md`
- `describe()` / `suite()` — Test grouping
- `it()` / `test()` — Test cases
- `bench()` — Benchmark tests
- `beforeAll()` / `afterAll()` — Suite-level setup/teardown
- `beforeEach()` / `afterEach()` — Test-level setup/teardown
- `aroundEach()` / `aroundAll()` — Wrapping hooks (4.1+)
- `onTestFailed()` / `onTestFinished()` — In-test callbacks
- Modifiers: `.skip`, `.only`, `.todo`, `.fails`, `.concurrent`, `.sequential`, `.each`, `.for`
- Conditionals: `.runIf()`, `.skipIf()`
- `test.extend()` — Fixture system with DI
- `test.override()` — Fixture overrides

### `references/api/configuration.md`
- `defineConfig()` from `vitest/config`
- `test.include` / `test.exclude` — File patterns
- `test.environment` — `node`, `jsdom`, `happy-dom`
- `test.globals` — Global API availability
- `test.setupFiles` — Setup scripts
- `test.pool` — Worker pool: `threads`, `forks`
- `test.testTimeout` / `test.hookTimeout`
- `test.clearMocks` / `test.restoreMocks`
- `test.reporters` — Output format
- `test.workspace` — Multi-project configuration
- `test.projects` — Project-specific config overrides

### `references/api/coverage.md`
- Providers: `v8` vs `istanbul`
- `coverage.provider` — Provider selection
- `coverage.reporter` — Output formats: `text`, `json`, `html`, `lcov`
- `coverage.include` / `coverage.exclude` — File patterns
- `coverage.thresholds` — Minimum coverage enforcement
- `coverage.all` — Include untested files
- `coverage.functions` / `coverage.branches` / `coverage.lines` / `coverage.statements`
- CLI: `--coverage` flag

## Patterns

### `references/patterns/testing.md`
- Unit test structure for harness modules
- Integration test patterns for delegation pipeline
- Error handling test patterns
- Async testing patterns
- File-based state testing (continuity, persistence)

### `references/patterns/mocking.md`
- Mocking OpenCode SDK calls
- Mocking delegation sessions
- Mocking continuity store (file I/O)
- Mocking timers for async completion detection
- Partial mocking patterns

## Scripts

### `scripts/update.sh`
- Refresh skill from latest Vitest docs
