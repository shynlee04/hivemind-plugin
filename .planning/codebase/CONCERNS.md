# Codebase Concerns

**Analysis Date:** 2026-05-08

## Tech Debt

### Codebase Size Exceeding Architecture Target

- **Issue:** The source tree has grown to ~25,000 LOC across 177 TypeScript files, far exceeding the architecture proposal target of ~4,000–5,000 LOC (~20 skills, ~800 LOC each for hooks/shared/lifecycle/delegation/continuity).
- **Files:** `src/**/*.ts` (177 files, 25,020 total LOC)
- **Impact:** Increased cognitive load for agents and developers; module discovery harder; test maintenance cost grows linearly. The original architecture document (`docs/draft/architecture-proposal-hivemind-v3.md`) targeted `~20 SKILL.md files, not hundreds` for the soft side; the hard harness analogously targeted ~25–30 source modules.
- **Fix approach:** Audit for orphan/dead code, consolidate overlapping modules (e.g., `features/bootstrap/` has 10+ files that could be grouped), and consider extracting independent subsystems into separate packages. Run `ts-prune` or `knip` to detect unused exports.

### Three Files At or Near 500 LOC Module Cap

- **Issue:** Three source files sit at or within 10 lines of the 500 LOC module size limit enforced by architecture rules.
- **Files:**
  - `src/coordination/delegation/manager.ts` — **500 LOC** (exactly at cap)
  - `src/tools/config/configure-primitive.ts` — **490 LOC** (10 lines from cap)
  - `src/task-management/continuity/index.ts` — **465 LOC** (35 lines from cap)
- **Impact:** Any new feature in these modules will violate the cap. Complex refactors are blocked by monolithic structure. `manager.ts` combines SDK delegation dispatch, WaiterModel completion, category gate resolution, queue-key concurrency, agent enrichment, and recovery — at least 4 distinct concerns.
- **Fix approach:** Split `manager.ts` into: (1) delegation dispatch, (2) category-gate pipeline, (3) recovery orchestration. Split `configure-primitive.ts` into per-action handlers (read, compile, decompile, list, dry-run). Split `continuity/index.ts` into read-path and write-path modules.

### Barrel Export Anti-Pattern in index.ts

- **Issue:** `src/index.ts` uses 26 `export * from` barrel re-exports, which the architecture documentation explicitly discourages: *"Barrel `index.ts` files use explicit named exports (not `export * from`) for traceability"* (`AGENTS.md`).
- **Files:** `src/index.ts` (26 `export * from` statements)
- **Impact:** Loss of export traceability — consumers cannot tell which module owns a symbol. Tree-shaking may be less effective. Circular dependency detection is harder. Violates the project's own convention.
- **Fix approach:** Replace all `export * from` with explicit named re-exports. For modules with many exports, use intermediate `export { A, B, C } from './path.js'` explicit re-export blocks.

### Deprecated Fields Still Present in Schema

- **Issue:** The agent frontmatter schema retains `tools` and `maxSteps` fields marked `@deprecated` for backward compatibility. These are also present in coordination types (`src/coordination/delegation/types.ts`).
- **Files:**
  - `src/schema-kernel/agent-frontmatter.schema.ts` — `@deprecated` fields with guard messages
  - `src/coordination/delegation/types.ts` — `@deprecated` constants (`STABLE_POLLS_REQUIRED`, adaptive interval)
  - `src/shared/types.ts:195` — `@deprecated` field
- **Impact:** Deprecated code paths remain in the runtime validation surface. Agent configurations may still use the old field names, masking migration incompleteness. Increases schema maintenance burden.
- **Fix approach:** Run a migration window: convert all `.opencode/agents/*.md` frontmatter to use `steps` and `permission` rules. Then remove the deprecated schema fields and their validation messages.

### Weak Cross-Platform Path Handling

- **Issue:** Several files use manual path separator logic (`sep`, `..`, `[\\/]` parsing) rather than `node:path` normative APIs for containment checks. While the security appears sound, it is fragile against edge cases in path normalization.
- **Files:** `src/shared/security/path-scope.ts` (split on `/[\\/]/` for cross-platform `..` detection)
- **Impact:** Low risk currently (the code is well-tested), but refactoring could introduce subtle path traversal bugs. Manual regex-based path parsing is a maintenance hazard.
- **Fix approach:** Centralize path containment into a single utility using `node:path.relative + node:path.resolve` only, rather than mixed regex + lexical checks.

### Missing ESLint/Prettier Configurations

- **Issue:** No ESLint (`.eslintrc*`, `eslint.config.*`) or Prettier (`.prettierrc*`) configuration files exist in the repository. Code style enforcement relies entirely on TypeScript compiler flags (`strict`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`).
- **Files:** None detected (no `.eslintrc*`, `eslint.config.*`, `.prettierrc*`, `biome.json`)
- **Impact:** No automated import ordering, no consistent spacing/quoting rules, no prohibited-pattern detection (e.g., `console.log` in plugin code). Inconsistent style may emerge across contributor work.
- **Fix approach:** Add `eslint.config.mjs` with `@typescript-eslint` plus import ordering rules. Add `.prettierrc` with project standards. Run `npx eslint --fix` and `npx prettier --write` once to normalize the codebase.

### No `esModuleInterop` / `allowSyntheticDefaultImports`

- **Issue:** The `tsconfig.json` uses `"module": "NodeNext"` without `esModuleInterop` or `allowSyntheticDefaultImports`. This is correct for NodeNext ESM, but some CJS interop patterns in dependencies (e.g., `js-yaml`, `gray-matter`) require manual `.default` access.
- **Files:** `tsconfig.json` (no `esModuleInterop`)
- **Impact:** Potential CJS/ESM interop bugs when importing certain dependencies. `skipLibCheck: true` masks type-level issues in declaration files.
- **Fix approach:** Keep current settings (they're correct for strict ESM) but document the interop pattern. The `skipLibCheck: true` is pragmatic but means 3rd-party type bugs are invisible.

## Known Bugs

### npm Audit: Moderate XSS Vulnerability in PostCSS (via Next.js)

- **Symptoms:** `npm audit` reports a moderate-severity CVE (CWE-79, CVSS 6.1) in `postcss <8.5.10`, exposed through `next` as an indirect dependency.
- **Files:** `node_modules/postcss` (via `node_modules/next`), `package.json` — `@json-render/next: ^0.18.0`
- **Trigger:** Any Next.js build process that uses PostCSS CSS stringify output.
- **Workaround:** `@json-render/next` is a cross-render dev-side dependency, unlikely to process untrusted CSS in production. Risk is low for the harness itself. Upgrade path: `npx npm-force-resolutions` to pin `postcss` to `>=8.5.10`, or wait for `@json-render/next` to bump its Next.js dependency.

### configure-primitive-paths.ts Has No Corresponding Test

- **Symptoms:** `src/tools/config/configure-primitive-paths.ts` is imported by `configure-primitive.ts` but has no dedicated test file.
- **Files:** `src/tools/config/configure-primitive-paths.ts` (no `tests/tools/configure-primitive-paths.test.ts`)
- **Trigger:** Any path resolution change in this module is untested in isolation. Only tested indirectly through `configure-primitive.test.ts`.
- **Fix approach:** Create `tests/tools/configure-primitive-paths.test.ts` covering global/project scope path resolution, fallback behavior, and edge cases.

## Security Considerations

### Environment Variable Exposure Through Delegation

- **Issue:** `src/coordination/command-delegation/handler.ts` reads `process.env` keys and passes filtered env to delegated sessions (`buildMinimalEnv`). While the filter appears to strip sensitive vars, the allowlist approach could leak new sensitive environment variables added after this code was written.
- **Files:** `src/coordination/command-delegation/handler.ts:381` — `.map((key) => [key, process.env[key]])`
- **Risk:** If a new sensitive environment variable is added to the runtime (e.g., `LLM_API_KEY`), it could leak to delegated sessions unless the filter is updated.
- **Current mitigation:** The `buildMinimalEnv` method filters to known-safe vars only, not `process.env` wholesale.
- **Recommendations:** Audit `buildMinimalEnv` to ensure it uses a strict allowlist, not a denylist. Add integration test that verifies no unrecognized sensitive env vars pass through delegation.

### path-scope.ts Symlink Resolution Could Return null for Non-Existent Paths

- **Issue:** `resolveExistingPath` in `src/shared/security/path-scope.ts` returns `null` when neither the candidate path nor any ancestor directory exists, causing the realpath check to be skipped.
- **Files:** `src/shared/security/path-scope.ts:73–87`
- **Risk:** For write paths where the file does not yet exist, the symlink-based path traversal check is silently skipped. Lexical checks (`assertRelativePathInsideRoot`) still apply, so the risk is low.
- **Current mitigation:** Lexical containment check runs first and catches `..` escapes.
- **Recommendations:** Add a follow-up check for the deepest existing ancestor to prevent symlink traversal to outside the root for new files.

### skipLibCheck Masks Third-Party Type Errors

- **Issue:** `tsconfig.json` has `"skipLibCheck": true`, which means type errors in `node_modules/**/*.d.ts` are silently ignored.
- **Files:** `tsconfig.json:18`
- **Risk:** A dependency with broken types (`bun-pty`, `bun-types`, `@ast-grep/*`) could introduce subtle runtime type mismatches. `bun-types` at `^1.3.13` is particularly volatile.
- **Recommendations:** Run periodic `npx tsc --noEmit --skipLibCheck false` audits to catch type regressions. Consider pinning `bun-types` to a known-good version.

## Performance Bottlenecks

### Continuity Store Deep-Clone on Every Read

- **Issue:** `src/task-management/continuity/index.ts` uses deep-clone semantics on read to prevent mutation of in-memory state. For large delegation records, this is O(n) per read.
- **Files:** `src/task-management/continuity/index.ts` (clone operations at lines 113, 149, 183, 389–391)
- **Problem:** Delegation history grows unboundedly. Each continuity read clones the entire record. With hundreds of delegations, this could cause latency in session hooks.
- **Cause:** Defensive deep-clone instead of structural sharing (immutable update pattern).
- **Improvement path:** Use structural sharing for immutable updates (e.g., immer-style or manual spread-on-write) instead of deep-clone-on-read. Add a delegation record retention policy (e.g., keep last N delegations in memory).

### Lifecycle Manager Polls in Single-Thread

- **Issue:** `src/task-management/lifecycle/index.ts` uses polling loops with configurable timeouts to watch delegation sessions. All watch loops run within the same Node.js event loop.
- **Files:** `src/task-management/lifecycle/index.ts` — `WATCH_TIMEOUT_MS = 1800000` (30 minutes)
- **Problem:** Long polling on many concurrent delegations could delay event handling for other sessions. Node.js single-threaded event loop means a blocked poll blocks all operations.
- **Improvement path:** Consider `AbortController`-based cancellation for individual polls. Implement polling as async generators to allow cooperative yielding between sessions.

### Large Schema Validation on Every Tool Call

- **Issue:** `src/schema-kernel/hivemind-configs.schema.ts` at 438 LOC is the largest schema file. Zod validation runs on every configure-primitive call.
- **Files:** `src/schema-kernel/hivemind-configs.schema.ts` (438 LOC), `src/schema-kernel/` (17 files)
- **Problem:** Schema compilation and validation on every tool invocation. For hot-path tools like `configure-primitive`, this adds constant overhead.
- **Improvement path:** Pre-compile Zod schemas at module load time (Zod's `.parse()` caches the schema object, but `.refine()` and `.superRefine()` chains re-execute). Memoize schema compilation results.

## Fragile Areas

### delegation/manager.ts — God Object at Module Cap

- **Files:** `src/coordination/delegation/manager.ts` (500 LOC)
- **Why fragile:** This single class orchestrates 6+ subsystems: SDK delegation dispatch, command delegation dispatch, category gate resolution, concurrency queue management, agent enrichment from primitives, session spawning, and recovery. Any change to one subsystem risks regression in another.
- **Safe modification:** New features in delegation should be added via composition (new classes injected into the manager), not by adding methods to `DelegationManager`.
- **Test coverage:** Covered by `tests/lib/delegation-state-machine.test.ts` and `tests/lib/lifecycle-manager.test.ts` indirectly, but unit-level coverage of manager public methods is thin.

### configure-primitive.ts — Monolithic Action Router

- **Files:** `src/tools/config/configure-primitive.ts` (490 LOC)
- **Why fragile:** Handles 6 distinct actions (read, compile, decompile, list, inspect, dry-run) in a single file with a large switch/router pattern. Adding a 7th action requires touching this monolithic file.
- **Safe modification:** Refactor to strategy pattern — each action gets its own handler function in a sibling file under `src/tools/config/actions/`.
- **Test coverage:** Covered by `tests/tools/configure-primitive.test.ts`. Coverage is good but tests are tightly coupled to the monolithic structure.

### Hook CQRS Boundary — Best-Effort Error Swallowing

- **Files:** `src/plugin.ts:92–98`, `src/plugin.ts:108–117`, `src/plugin.ts:162–164`, `src/plugin.ts:180–182`
- **Why fragile:** The plugin composition root wraps several hook factories in `try/catch` with "best-effort" semantics. If an observer or event tracker silently fails, there is no alert — the harness continues operating in a degraded state.
- **Safe modification:** Each try/catch should at minimum emit a structured log/event. Silent failures in event tracking mean unobservable data loss.
- **Test coverage:** Gaps — error paths in the composition root are not systematically tested.

### Schema-Kernel Growth — 17 Zod Schemas

- **Files:** `src/schema-kernel/` (17 `.ts` files)
- **Why fragile:** The schema kernel has grown from the originally envisioned 3–4 schemas to 17. Many schemas are interdependent (e.g., `agent-frontmatter.schema.ts` references permission types, `hivemind-configs.schema.ts` references bootstrap types). A schema change cascades validation failures.
- **Safe modification:** Treat schemas as the public API contract. Changes require backward-compatibility review and migration plan for existing `.opencode/` primitives and `.hivemind/` state files.
- **Test coverage:** Schema validation tests exist but are scattered. No centralized contract-test file validates cross-schema consistency.

## Scaling Limits

### Concurrency Model — Three Hard-Coded Default

- **Issue:** `src/task-management/lifecycle/index.ts:80` hard-codes `concurrencyLimit = 3` with an env var override (`OPENCODE_HARNESS_CONCURRENCY_LIMIT`).
- **Current capacity:** 3 concurrent delegations default; configurable via env var.
- **Limit:** Single Node.js process with no clustering or worker threads. All delegation sessions compete for the same event loop.
- **Scaling path:** For >10 concurrent delegations, consider moving to worker_threads for CPU-bound SDK calls, or implementing cooperative async yielding between polling loops. The architecture supports it via the `DelegationConcurrencyQueue` abstraction.

### Delegation Persistence — Flat JSON File

- **Issue:** `src/task-management/continuity/delegation-persistence.ts` reads and writes the entire delegation array as a single JSON file.
- **Current capacity:** O(n) read/write per delegation status change. Suitable for <100 delegations.
- **Limit:** At >500 delegations, file I/O becomes a bottleneck. Concurrent writes from multiple OpenCode instances could corrupt the file.
- **Scaling path:** Shard delegation records by session or use an append-only log with periodic compaction. Consider SQLite for delegation persistence if delegation volume grows.

### Session Parent Chain — Recursive Traversal

- **Issue:** `src/shared/session-api.ts:257` uses recursive parent chain traversal with cycle detection. Chain depth is capped by `MAX_DELEGATION_DEPTH`.
- **Files:** `src/shared/session-api.ts` — `resolveSessionChain()` recursive function
- **Limit:** Node.js call stack limit (~10,000 frames); with `MAX_DELEGATION_DEPTH` likely <50, this is not a practical concern but the recursive approach is fragile.
- **Scaling path:** Convert to iterative traversal (while-loop) to prevent any possibility of stack overflow.

## Dependencies at Risk

### bun-pty — Optional but Platform-Specific

- **Risk:** `bun-pty: ^0.4.8` is a Bun-specific PTY library. It is an optional dependency, but the fallback path (`createPtyManagerIfSupported` returns `null`) means background command features are silently unavailable on Node.js.
- **Files:** `src/features/background-command/pty/pty-runtime.ts:19` — `return null` on unsupported platforms
- **Impact:** Background command execution and PTY delegation features degrade silently on non-Bun runtimes. No user-facing warning.
- **Migration plan:** Add a startup diagnostic log when PTY is unavailable. Consider `node-pty` (already in `dependencies`) as the Node.js fallback path.

### bun-types — Volatile Version Range

- **Risk:** `bun-types: ^1.3.13` — Bun's type definitions track Bun's rapid release cycle. Breaking changes in Bun 1.4+ could introduce type incompatibilities.
- **Files:** `package.json:50`, `tsconfig.json` (via `skipLibCheck: true` masking type issues)
- **Impact:** Future `bun-types` updates may break type-checking. Currently masked by `skipLibCheck`.
- **Migration plan:** Pin `bun-types` to `~1.3.13` instead of `^1.3.13`. Run quarterly `bun-types` compatibility checks.

### @ast-grep/cli and @ast-grep/napi — Heavy Native Dependencies

- **Risk:** `@ast-grep/cli: ^0.42.1` and `@ast-grep/napi: ^0.42.1` are native Rust bindings (napi) that add platform-specific binary dependencies. They are used for code search/analysis features.
- **Files:** `package.json:40–41`
- **Impact:** Installation failures on platforms without prebuilt binaries (e.g., ARM64 Linux). Increases npm install time and disk usage.
- **Migration plan:** Lazy-load ast-grep only when the relevant tools are invoked. Make ast-grep an optional dependency with graceful degradation.

### @json-render/* Packages (5 Packages)

- **Risk:** Five `@json-render/*` packages at `^0.18.0` are pre-1.0. The `@json-render/next` dependency pulls in `next` which has the PostCSS CVE. These are used for the GUI side-car dashboard but may not be needed in the core runtime.
- **Files:** `package.json:43–47` — `@json-render/core`, `@json-render/ink`, `@json-render/next`, `@json-render/react`, `@json-render/react-pdf`
- **Impact:** ~40% of dependencies are GUI-related but live in the core runtime package. Bloats the npm package for consumers who only need the plugin.
- **Migration plan:** Move GUI dependencies to a separate `@hivemind/sidecar` package. Keep core runtime dependency-free of React/Next.js.

## Missing Critical Features

### No CI/CD Pipeline Configuration

- **Problem:** No `.github/workflows/` directory, no CI configuration detected. All testing, type-checking, and building is manual.
- **Blocks:** Automated quality gates on PR, automated coverage reporting, automated npm publish.
- **Fix approach:** Create `.github/workflows/ci.yml` with steps: checkout → install → typecheck → test (with coverage) → build. Add `.github/workflows/publish.yml` for npm publish on version tags.

### No Graceful Degradation Logging for PTY Unavailability

- **Problem:** When `bun-pty` is unavailable, PTY features silently degrade without any diagnostic information.
- **Files:** `src/features/background-command/pty/pty-runtime.ts:19` — silent `return null`
- **Blocks:** Operators cannot determine why background commands fail on their platform.
- **Fix approach:** Add a startup hook that logs a warning when PTY is unavailable, and expose a `hivemind-sdk-supervisor` diagnostic for PTY availability.

### No Dry-Run Flag for Dangerous Operations

- **Problem:** Several tools (`bootstrap-init`, `bootstrap-recover`, `session-patch`) make filesystem mutations without a dry-run mode for pre-flight validation.
- **Files:** `src/tools/config/bootstrap-init.ts`, `src/tools/config/bootstrap-recover.ts`, `src/tools/session/session-patch/tools.ts`
- **Blocks:** Users cannot preview what changes a bootstrap or recovery operation will make before executing.
- **Fix approach:** Add `dryRun?: boolean` parameter to mutation tools. When enabled, return the planned changes without executing them.

## Test Coverage Gaps

### No Integration Tests for Multi-Session Delegation Workflows

- **What's not tested:** End-to-end delegation flow: `delegate-task` → session spawn → task completion → `delegation-status` → result retrieval. Tests exist for individual components but not the integrated pipeline.
- **Files:** `src/tools/delegation/delegate-task.ts`, `src/coordination/spawner/session-creator.ts`, `src/tools/delegation/delegation-status.ts`
- **Risk:** Integration bugs in the delegation lifecycle (e.g., WaiterModel dual-signal completion timing) may not surface in unit tests.
- **Priority:** Medium

### No Test for src/sidecar/readonly-state.ts

- **What's not tested:** The sidecar module for read-only state access has no direct tests.
- **Files:** `src/sidecar/readonly-state.ts` (exists) — `tests/sidecar/readonly-state.test.ts` (missing)
- **Risk:** Changes to the sidecar contract surface may introduce silent regressions.
- **Priority:** Low

### Error Path Coverage in Plugin Composition Root

- **What's not tested:** All 5 try/catch blocks in `src/plugin.ts` are documented as "best-effort" but have no test coverage for the failure paths.
- **Files:** `src/plugin.ts:92–98`, `108–117`, `162–164`, `180–182`
- **Risk:** A regression that causes observer hooks to throw would silently degrade the harness without detection.
- **Priority:** Medium

### configure-primitive-paths.ts Has No Isolated Test

- **What's not tested:** Path resolution logic for global vs project scope in configure-primitive tooling.
- **Files:** `src/tools/config/configure-primitive-paths.ts` (no corresponding test)
- **Risk:** Path resolution bugs only caught indirectly through parent tool tests.
- **Priority:** Medium

---

*Concerns audit: 2026-05-08*
