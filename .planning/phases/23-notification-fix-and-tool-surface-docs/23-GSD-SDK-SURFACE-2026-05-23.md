# GSD SDK & Integration — Deep Analysis

> **Source:** GSD Repomix output `5875fd23ec62fc70` — docs/ARCHITECTURE.md (SDK Runtime Bridge, CLI Tools), docs/CLI-TOOLS.md (SDK and programmatic access), docs/adr/0005-sdk-architecture-seam-map.md, docs/adr/3524-cjs-sdk-hard-seam.md
> **Date:** 2026-05-23
> **Evidence Level:** L3 (documented observation from GSD docs)
> **Audience:** Hivemind engineers building plugin/SDK architecture

---

## 1. OVERVIEW

GSD has TWO CLI tool layers that coexist:

```
LEGACY:     node gsd-tools.cjs <command> [args]      (CJS, ~20 modules)
MODERN:     gsd-sdk query <command> [args]            (SDK, typed registry)
```

[L22918-L22931]

The CJS tool (`gsd-tools.cjs`) is the original Node.js CLI with 20 domain modules. The SDK (`@gsd-build/sdk`) is a newer TypeScript library with a typed query registry. Both are maintained — the SDK is the preferred path for new orchestration, while CJS is kept for parity tests and CJS-only entrypoints.

This dual-layer architecture is directly analogous to Hivemind's architecture:

```
GSD:          gsd-tools.cjs (legacy)  +  gsd-sdk query (typed registry)  +  @gsd-build/sdk (TS library)
Hivemind:     native tools (bash)     +  hivemind-* tools (custom)        +  @opencode-ai/plugin (SDK)
```

---

## 2. SDK ARCHITECTURE

### 2.1 Three Access Paths

1. **CLI — `gsd-sdk query <argv…>`**
   - Resolves argv with longest-prefix rules from typed registry (`resolveQueryArgv` in `sdk/src/query/registry.ts`)
   - Unregistered commands FAIL FAST — use `gsd-tools.cjs` only for handlers not in registry

2. **TypeScript — `@gsd-build/sdk` (`GSDTools`, `createRegistry`)**
   - Routes through SDK Runtime Bridge Module (`sdk/src/query-runtime-bridge.ts`)
   - Native registry dispatch is preferred
   - Subprocess fallback is explicit policy (`allowFallbackToSubprocess`)
   - Can be disabled for strict SDK-only execution (`strictSdk`)

3. **Direct — `createRegistry()` from `sdk/src/query/index.ts`**
   - For direct typed dispatch without `GSDTools` wrapper
   - Used by workflows that need programmatic access without CLI overhead

[L22940-L22972]

### 2.2 Query Registry

The query registry at `sdk/src/query/` is a typed handler registry. Each registered handler maps a command string to an implementation function:

```
Registry entries:
  init.*         → Context loading per workflow type
  state.*        → STATE.md read/write/update
  roadmap.*      → ROADMAP.md parse/analyze
  phase.*        → Phase operations (next-decimal, plan-index, mvp-mode)
  config.*       → Config read/write/get/set
  commit         → Git commit for planning artifacts
  resolve-model  → Model resolution per agent
  agent-skills   → Load skill files per agent type
  validate.*     → Context validation, task classification
  template.fill  → Template rendering
```

[L29182-L29192]

**Example registry queries:**
| Command | Purpose |
|---------|---------|
| `gsd-sdk query init.plan-phase 12` | Load context for plan-phase on phase 12 |
| `gsd-sdk query state json` | Output STATE.md frontmatter as JSON |
| `gsd-sdk query roadmap analyze` | Full roadmap parse with disk status |
| `gsd-sdk query config-set workflow.tdd_mode true` | Set config value |
| `gsd-sdk query resolve-model gsd-planner` | Get model for planner agent |
| `gsd-sdk query commit "docs: update state" --files .planning/STATE.md` | Git commit |
| `gsd-sdk query phase.next-decimal 6` | Next decimal phase number |
| `gsd-sdk query validate.context --tokens-used 150000 --context-window 200000` | Context usage validation |

[L29185-L29192]

### 2.3 SDK Runtime Bridge (`sdk/src/query-runtime-bridge.ts`)

This is the central dispatch seam. Programmatic SDK callers (`GSDTools`) route through one seam that owns query dispatch policy:

```
GSDTools.dispatch(command, args)
  → RuntimeBridge.execute(command, args)
    → if (native registry has handler): execute natively
    → else if (allowFallbackToSubprocess): spawn gsd-tools.cjs as subprocess
    → else (strictSdk): fail fast with error
    → emit onDispatchEvent({ mode, reason, duration, outcome })
```

[L22265-L22275]

**Key properties:**
- **Mode selection:** `sdk` when `tryLoadSdk()` succeeds and no `GSD_WORKSTREAM` is active, `cjs` otherwise — set once at construction
- **No-throw contract:** `hub.dispatch()` catches all exceptions and returns `{ ok: false, errorKind, message, details }` instead of propagating
- **Six-value errorKind enum:** Exported as frozen `ERROR_KINDS` object — `SdkLoadFailed`, `SdkDispatchFailed`, `ValidationFailed`, `NotFound`, `PermissionDenied`, `InternalError`

[L22265-L22275]

### 2.4 Structured Dispatch Observability

Every SDK dispatch call emits an `onDispatchEvent` with:

| Field | Description |
|-------|-------------|
| `mode` | sdk / cjs / subprocess |
| `reason` | Why this mode was chosen (native handler exists / SDK loaded / fallback policy) |
| `duration` | Execution time in ms |
| `outcome` | success / error / timeout |
| `errorKind` | From ERROR_KINDS enum (if error) |

This provides full observability into which execution path was taken for every command.

---

## 3. CJS → SDK MIGRATION: Shared Module Architecture

GSD is migrating from the monolithic CJS CLI to the typed SDK through a phased "Shared Module" architecture. Each module moves ONE piece of logic from CJS to SDK, with generated adapters for both surfaces. [L22600-L22650]

### The 6-Phase Migration Plan

| Phase | Module | What it moves | CJS consumed by | SDK consumed by |
|-------|--------|--------------|----------------|----------------|
| 1 | STATE.md Document Module | State document parsing/generation | `bin/lib/state.cjs` | `sdk/src/query/state-document.generated.ts` |
| 2 | Configuration Module | Config load, legacy-key normalization, defaults merge, on-disk migration | `bin/lib/config.cjs`, `bin/lib/core.cjs:loadConfig` | `sdk/src/query/config-schema.generated.ts`, `configuration.generated.cjs` |
| 3 | Workstream Inventory Module | Pure projection from directory entries + STATE.md text + plan scan results → typed inventory | Per-side fs Readers | `sdk/src/query/workstream-inventory-builder.generated.ts` |
| 4 | Planning Path Projection Module | Planning directory path resolution | `bin/lib/planning-workspace.cjs` | `sdk/src/query/planning-path.generated.ts` |
| 5 | Query Runtime Bridge | CJS dispatch collapses onto SDK runtime bridge | CJS routers replaced by thin delegates over `QueryRuntimeBridge.execute()` | Native SDK dispatch |
| 6 | Dispatch Policy Module | Final routing seam consolidation | `CommandRoutingHub` | Full SDK-native dispatch |

[L1445-L1501]

**Why phased:** Each phase ships one Shared Module. The smallest (STATE.md Document Module) ships first because both files are already character-identical. Phase 2 closes the critical bug class (#3523). The seam becomes a real wall in Phase 5 when CJS routers stop holding parallel handler implementations. [L1500]

---

## 4. COMMAND ROUTING HUB (`CommandRoutingHub`)

The CJS side has its own dispatch hub at `get-shit-done/bin/lib/command-routing-hub.cjs`. This replaces duplicated routing logic in each command family router. [L22265-L22275]

**Three cross-cutting concerns consolidated:**
1. **Mode selection:** `sdk` or `cjs` — set once at construction
2. **No-throw contract:** Returns `{ ok: false, errorKind, message, details }` instead of propagating exceptions
3. **Six-value errorKind enum:** `SdkLoadFailed`, `SdkDispatchFailed`, `ValidationFailed`, `NotFound`, `PermissionDenied`, `InternalError`

**Important design decision:** No transparent SDK→CJS fallback. An SDK-mode hub that encounters a load or dispatch failure returns `SdkLoadFailed` or `SdkDispatchFailed` WITHOUT retrying via CJS. This prevents silent fallback masking SDK bugs. [L22270-L22275]

---

## 5. GOLDEN TEST PARITY

GSD maintains a golden test suite at `sdk/src/golden/golden.integration.test.ts` that verifies identical exit code + stdout chunks + stderr lines between the CLI (`gsd-tools <family> <subcommand>`) and the SDK (`gsd-sdk query <canonical>`) for every canonical command in the manifest. [L15429-L15430]

This is the final quality gate before marking a command as fully migrated. If the SDK handler produces different output than the CJS version, the test fails and the migration is reverted.

---

## 6. MUTATION EVENTS (SDK)

The SDK has a concept of mutation events — commands that may emit structured events after a successful dispatch. `QUERY_MUTATION_COMMANDS` in `sdk/src/query/index.ts` lists which commands are mutation-bearing. [L22980-L22982]

Examples:
- `state validate` — read-only (no mutation)
- `skill-manifest` — writes only with `--write` flag
- `intel update` — stub (not yet implemented)

This distinction between read and mutation commands is critical for the SDK's CQRS compliance.

---

## 7. CLI TOOLS LAYER (CJS Legacy)

The legacy CLI at `get-shit-done/bin/gsd-tools.cjs` has 20 domain modules: [L22920-L23130]

| Module | Responsibility |
|--------|---------------|
| `core.cjs` | Error handling, output formatting, shared utilities |
| `planning-workspace.cjs` | Planning seam, workstream routing, .planning/.lock |
| `state.cjs` | STATE.md parsing, updating, progression, metrics |
| `phase.cjs` | Phase directory ops, decimal numbering, plan indexing |
| `roadmap.cjs` | ROADMAP.md parsing, phase extraction, plan progress |
| `config.cjs` | config.json read/write, section initialization |
| `verify.cjs` | Plan structure, phase completeness, reference, commit validation |
| `template.cjs` | Template selection and filling with variable substitution |
| `frontmatter.cjs` | YAML frontmatter CRUD operations |
| `init.cjs` | Compound context loading for each workflow type |
| `milestone.cjs` | Milestone archival, requirements marking |
| `commands.cjs` | Misc (slug, timestamp, todos, scaffolding, stats) |
| `model-profiles.cjs` | Model profile resolution table |
| `security.cjs` | Path traversal prevention, prompt injection detection |
| `uat.cjs` | UAT file parsing, verification debt tracking |
| `docs.cjs` | Docs-update workflow init, Markdown scanning |
| `workstream.cjs` | Workstream CRUD, migration, session-scoped active pointer |
| `schema-detect.cjs` | Schema-drift detection for ORM patterns |
| `profile-pipeline.cjs` | User behavioral profiling pipeline |
| `profile-output.cjs` | Profile rendering, USER-PROFILE.md generation |

[L22931-L22940]

Global flags:
- `--raw`: Machine-readable output (JSON or plain text)
- `--cwd <path>`: Override working directory (for sandboxed subagents)
- `--ws <name>`: Workstream context

---

## 8. HOOK SYSTEM

GSD's hook system is a set of Node.js scripts registered in the host runtime's `settings.json`. Hooks integrate with host events: [L22216-L22230]

| Hook | Event | Purpose |
|------|-------|---------|
| `gsd-statusline.js` | `statusLine` | Displays model, task, directory, context usage |
| `gsd-context-monitor.js` | `PostToolUse` / `AfterTool` | Injects agent-facing context warnings at 35%/25% |
| `gsd-check-update.js` | `SessionStart` | Background check for new GSD versions |
| `gsd-check-update-worker.js` | (worker) | Background worker helper |
| `gsd-update-banner.js` | `SessionStart` | Opt-in update availability banner |
| `gsd-prompt-guard.js` | `PreToolUse` | Scans .planning/ writes for prompt injection |
| `gsd-read-injection-scanner.js` | `PostToolUse` | Scans Read output for injected instructions |
| `gsd-workflow-guard.js` | `PreToolUse` | Detects edits outside GSD workflow context |
| `gsd-read-guard.js` | `PreToolUse` | Prevents Edit/Write on unread files |
| `gsd-session-state.sh` | `PostToolUse` | Session state tracking (shell runtimes) |
| `gsd-validate-commit.sh` | `PostToolUse` | Conventional commit enforcement |
| `gsd-phase-boundary.sh` | `PostToolUse` | Phase boundary detection |
| `gsd-graphify-update.sh` | `PostToolUse` | Auto-rebuild knowledge graph |

[L30386-L30450]

**Context Monitor — Agent-Facing Context Warnings:**

| Remaining | Level | Agent Behavior |
|-----------|-------|---------------|
| > 35% | Normal | No warning |
| ≤ 35% | WARNING | "Avoid starting new complex work" |
| ≤ 25% | CRITICAL | "Context nearly exhausted, inform user" |

Debounce: 5 tool uses between warnings. Severity escalation bypasses debounce.

**Architecture:**
```
Statusline Hook → writes /tmp/claude-ctx-{session}.json
Context Monitor → reads bridge file → injects additionalContext warning
```

[L22600-L22620]

---

## 9. PLATFORM ABSTRACTION

GSD supports 15+ AI coding runtimes through a unified install contract: [L22700-L22750]

**Abstraction points:**
1. **Tool name mapping** — Claude's `Bash` → Copilot's `execute`
2. **Hook event names** — Claude `PostToolUse` → Gemini `AfterTool`
3. **Agent frontmatter** — Different format per runtime
4. **Path conventions** — Different config directories per runtime
5. **Model references** — `inherit` profile defers to runtime's model selection

The installer handles all translation at install time. Workflows and agents are written in Claude Code's native format and transformed during deployment.

**Runtime matrix (15 runtimes):**

| Runtime | Global root | Command form | Agent format | Hooks |
|---------|-------------|-------------|-------------|-------|
| Claude Code | ~/.claude | /gsd-command | agents/gsd-*.md | Full |
| OpenCode | ~/.config/opencode | /gsd-command | agents/gsd-*.md | No GSD hooks |
| Kilo | ~/.config/kilo | /gsd-command | agents/gsd-*.md | No GSD hooks |
| Gemini CLI | ~/.gemini | /gsd:command | agents/gsd-*.md | AfterTool |
| Codex | ~/.codex | $gsd-command | TOML config + skills | Hook tables |
| Copilot | ~/.copilot | /gsd-command | .agent.md files | No |
| Cursor | ~/.cursor | /gsd-command | skills + rules | No |
| Windsurf | ~/.codeium/windsurf | /gsd-command | skills + rules | No |
| Trae | ~/.trae | /gsd-command | skills + rules | No |
| Qwen Code | ~/.qwen | /gsd-command | skills + rules | Partial |
| Cline | ~/.cline | .clinerules | Rules only | No |

[L22700-L22750]

---

## 10. COMPARISON WITH HIVEMIND PLUGIN/SDK

| Dimension | GSD | Hivemind | Advantage |
|-----------|-----|----------|-----------|
| **SDK typed registry** | `createRegistry()` + `gsd-sdk query` | Individual tools via `@opencode-ai/plugin` | GSD (unified query surface) |
| **Legacy migration** | Phased Shared Module (CJS → SDK, 6 phases) | Plugin-based, single composition root | Different (GSD migrating from monolithic, Hivemind plugin-native) |
| **Dispatch observability** | `onDispatchEvent` with mode/reason/duration/outcome | `hivemind-sdk-supervisor` health/heartbeat | GSD (per-call granularity) |
| **Error classification** | `GSDError` + `ErrorClassification` + `ERROR_KINDS` enum | `[Harness]` prefix on thrown errors | GSD (structured errors) |
| **Golden test parity** | `golden.integration.test.ts` | None | GSD |
| **Query handlers** | 30+ registered query handlers | N/A (tools are entrypoints) | GSD (more structured) |
| **Mutation events** | `QUERY_MUTATION_COMMANDS` list | Not formalized | GSD |
| **CQRS separation** | Read (query) vs Write (mutation) | read-side: hivemind-command-engine, write-side: various | Similar (both have CQRS) |
| **Runtime abstraction** | Install-time per-runtime transformation | Plugin composition at load time | Different approaches |
| **Hook system** | 13 hooks across 4 event types | Plugin hooks via SDK (PreToolUse, PostToolUse, etc.) | Hivemind (has lifecycle events GSD doesn't) |
| **Plugin composition** | Monolithic installer | `src/plugin.ts` with tools + hooks + lifecycle | Hivemind (more composable) |
| **Session recovery** | `/gsd-pause-work` + STATE.md | `hivemind-trajectory` + delegation persistence | Hivemind (more durable) |
| **Workspace isolation** | `/gsd-workspace` with worktrees/clones | Per-project `.hivemind/` | Equal |

---

## 11. GSD'S UNIQUE SDK INNOVATIONS

### 11.1 Golden Test Parity

GSD maintains identical test suites for both CJS and SDK surfaces. Every canonical command must produce identical exit code + stdout + stderr from both paths. This catches SDK drift before it reaches production. [L15429-L15430]

### 11.2 Phased Migration Architecture

Instead of a big-bang rewrite from CJS to SDK, GSD moves ONE module at a time through a Shared Module architecture. Each module has:
- Source of truth: `sdk/src/<module>/index.ts`
- Generated SDK adapter: `sdk/src/query/<module>.generated.ts`
- Generated CJS adapter: `get-shit-done/bin/lib/<module>.generated.cjs`
- Legacy CJS side: gradually replaced by the generated adapter

This means at any point, both CJS and SDK surfaces are fully functional — just some modules are SDK-native and some are delegating to CJS. [L1445-L1501]

### 11.3 Structured Dispatch Observability

Every SDK dispatch emits a structured event with mode, reason, duration, and outcome. This enables:
- Performance profiling (which dispatches are slow?)
- Debugging (which path was taken for a given command?)
- Monitoring (are fallbacks being triggered? how often?)

### 11.4 Command Routing Hub

The CJS side's `CommandRoutingHub` consolidates three duplicated concerns:
- Mode selection (sdk vs cjs)
- No-throw contract
- Error classification

This pattern ensures consistency across all command families. [L22265-L22275]

---

## 12. HIVEMIND'S UNIQUE ADVANTAGES

### 12.1 Plugin-Based Composition

Hivemind's `src/plugin.ts` is a true composition root:
```typescript
const plugin = {
  name: 'hivemind',
  tools: [delegateTaskTool, delegationStatusTool, ...],
  hooks: { PreToolUse, PostToolUse, ... },
  // lifecycle events GSD doesn't have
};
```

GSD's installer is a ~10,700-line `bin/install.js` that copies files from source to destination. Hivemind's plugin architecture is cleaner, more modular, and easier to extend.

### 12.2 Dual-Layer State

Hivemind has:
- In-memory Maps (fast access, session-scoped)
- Durable JSON files (`.hivemind/state/`, survives restarts)

GSD uses only file-based STATE.md. Hivemind's dual-layer approach is faster for in-session queries while maintaining durability.

### 12.3 Trajectory Ledger

`hivemind-trajectory` provides execution lineage — not just "state at a point in time" but "how did we get here?" GSD relies on git log for this, which is coarser-grained (commit-level vs call-level).

### 12.4 Delegation Journal

GSD doesn't persist delegation records. Hivemind's `delegations.json` + `session-journal-export` provide an audit trail that GSD lacks entirely.

---

## 13. ACTIONABLE RECOMMENDATIONS FOR HIVEMIND

### RECOMMENDATION A: Query Handler Registry (HIGH IMPACT)

**Problem:** Hivemind's tools are individual entrypoints. There's no unified query surface for programmatic access.

**Solution:** Create a `query` handler registry similar to GSD's:

```typescript
// In src/shared/ or src/query/
const queryRegistry = {
  'session.*': { get: ..., list: ..., search: ..., export: ... },
  'delegation.*': { status: ..., list: ..., control: ... },
  'state.*': { load: ..., update: ..., patch: ... },
  'config.*': { get: ..., set: ..., list: ... },
  'trajectory.*': { inspect: ..., traverse: ..., close: ... },
};
```

Each handler:
- Returns typed responses (not arbitrary strings)
- Classifies errors (not `[Harness]` prefix)
- Follows CQRS (read vs write separation)

### RECOMMENDATION B: Golden Test Parity (MEDIUM IMPACT)

**Problem:** No test suite verifies that Hivemind's SDK wrappers produce identical behavior to direct tool calls.

**Solution:** Add a golden test suite:

```typescript
// tests/sdk/session-view.golden.test.ts
describe('session-view golden', () => {
  it('hivemind-session-view should produce identical output to session-tracker', async () => {
    const direct = await sessionTracker({ action: 'list-sessions' });
    const viaSdk = await hivemindSessionView({ action: 'get', sessionId: '...' });
    expect(viaSdk).toEqual(direct); // identical structure
  });
});
```

### RECOMMENDATION C: Structured Dispatch Observability (MEDIUM IMPACT)

**Problem:** `hivemind-sdk-supervisor` has health/heartbeat but no per-call observability.

**Solution:** Add `onDispatch` event to Hivemind's SDK wrappers:

```typescript
interface DispatchEvent {
  mode: 'native' | 'subprocess' | 'fallback';
  reason: string;
  duration: number;  // ms
  outcome: 'success' | 'error' | 'timeout';
  errorKind?: 'NotFound' | 'PermissionDenied' | 'InternalError' | ...;
}
```

### RECOMMENDATION D: Error Classification Enum (MEDIUM IMPACT)

**Problem:** Hivemind uses `[Harness]` prefix on thrown errors — no structured classification.

**Solution:** Define a frozen error kind enum:

```typescript
export const ERROR_KINDS = Object.freeze({
  NotFound: 'NotFound',
  PermissionDenied: 'PermissionDenied',
  ValidationFailed: 'ValidationFailed', 
  SdkLoadFailed: 'SdkLoadFailed',
  SdkDispatchFailed: 'SdkDispatchFailed',
  InternalError: 'InternalError',
} as const);

// All SDK dispatch returns: { ok: boolean, errorKind?: string, message?: string, details?: any }
```

### RECOMMENDATION E: Phased Migration Architecture (LOW IMPACT)

**Problem:** When Hivemind needs to refactor its tool surface, there's no migration path.

**Solution:** Follow GSD's Shared Module pattern:
1. Identify one module to migrate (e.g., session-view from CJS query to typed handler)
2. Source of truth: `src/shared/session-view.ts`
3. Generated SDK adapter: auto-generated from types
4. Legacy path: kept for backward compatibility
5. Golden test: both paths must produce identical results

---

## 14. KEY TAKEAWAYS

1. **GSD's query registry (`gsd-sdk query`)** provides a unified programmatic surface that Hivemind lacks. Implementing a similar registry would unify Hivemind's tool surface.

2. **GSD's golden test parity** ensures SDK changes don't break CLI behavior. Hivemind should adopt this for its SDK wrappers.

3. **GSD's phased migration architecture** is a blueprint for any SDK evolution — move one module at a time, maintain both surfaces, verify with golden tests.

4. **GSD's CQRS separation** (read = query vs write = mutation) is already present in Hivemind (`hivemind-command-engine` = read, tool calls = write) but not formalized.

5. **GSD's structured error classification** is more useful than Hivemind's `[Harness]` prefix pattern. Adopt error kind enums.

6. **GSD's runtime abstraction at install time** vs Hivemind's plugin composition at load time — both are valid but different approaches. Hivemind's is cleaner for a plugin ecosystem.

7. **Hivemind's plugin composition + trajectory + delegation journal** are unique advantages. Never regress on these while adopting GSD's query registry pattern.
