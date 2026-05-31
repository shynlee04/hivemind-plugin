# Phase 42: Tmux Visual Orchestration — Fork Extension — Assumptions

**Created:** 2026-05-31
**Calibration tier:** standard (3-4 assumption areas, 2 alternatives per item)

> Structured assumptions surfaced by codebase analysis. Each assumption cites file-path evidence
> and includes a risk level, alternative, and mitigation strategy. Confidence levels reflect
> what the codebase actually reveals — not what the spec hopes to be true.

---

## Assumptions

### 1. Technical Approach — Bun Runtime & Fork Architecture

- **Assumption:** The `@hivemind/opencode-tmux` fork can stay Bun-native (Bun for build/test) while Hivemind integrates it via standard Node.js hooks in `src/`. The fork's runtime is NOT required inside Hivemind's main Node.js process.
  - **Why this way:** The opencode-tmux plugin compiles to Node-compatible ESM via `bun build --target node` (`opencode-tmux/package.json:32`). Its runtime APIs (`node:child_process`, `node:fs`, `node:path`, `node:util`) are standard Node.js — no Bun-specific APIs like `Bun.file()` or `Bun.spawn()` are used. The `TmuxMultiplexer` uses `execFile` from `node:child_process` (`opencode-tmux/src/tmux.ts:1-6`). Hivemind's `createPtyManagerIfSupported()` in `src/features/background-command/pty/pty-runtime.ts:13-21` demonstrates the exact pattern: attempt to load, fail silently if runtime unsupported.
  - **If wrong:** If the fork inadvertently uses Bun-only APIs (e.g., `Bun.which()` instead of `which tmux`), it would crash on Node.js. This would force either a rewrite of the fork to pure Node.js or restrict Hivemind to Bun-only environments for tmux integration.
  - **Risk:** LOW — upstream code already targets Node via `--target node` and uses only `node:*` imports.
  - **Alternative 1:** Rewrite the fork in pure Node.js/TypeScript (no Bun dependency). _Rationale to reject:_ Increases maintenance burden (double CI config, loss of Bun's fast test runner) and contradicts the spec's explicit constraint "the fork remains Bun-native" (42-SPEC.md:73).
  - **Alternative 2:** Bundle the fork as a Hivemind monorepo asset in `src/features/tmux/`. _Rationale to reject:_ The spec explicitly says "stays in its own repo" (42-SPEC.md:76). Integration via hooks is sufficient.
  - **Mitigation:** Audit the fork's `src/` files for Bun-only API usage before Phase 42 delivery. The current codebase (`opencode-tmux/src/tmux.ts`, `session-manager.ts`, `config.ts`, `index.ts`) already passes this audit. Re-run after modifications.

- **Assumption:** The Hivemind-side `src/features/tmux/` module can follow the same opt-in pattern as `src/features/background-command/pty/pty-runtime.ts` — a factory that returns null when the runtime is unsupported.
  - **Why this way:** `createPtyManagerIfSupported()` in `pty-runtime.ts` wraps the PTY manager in a try/catch and returns `null` on failure. This pattern is proven in production (loaded at `src/plugin.ts:374`). The spec requires Tmux detection to follow the same silent-fallback model (42-SPEC.md:54-57).
  - **If wrong:** A different integration pattern (e.g., compile-time feature flag, environment variable toggle) would increase complexity and diverge from the codebase's established convention.
  - **Risk:** LOW — the pattern is well-established.
  - **Mitigation:** Implement `createTmuxIntegrationIfSupported()` mirroring `createPtyManagerIfSupported()` signature. Wire into plugin.ts alongside PTY manager.

---

### 2. Dependency Assumptions — Fork Repo & OpenCode SDK Compatibility

- **Assumption:** The fork at `shynlee04/opencode-tmux` exists, is accessible, and its current API surface (Plugin factory, Event types) is compatible with the Hivemind-installed `@opencode-ai/plugin` version (^1.15.10).
  - **Why this way:** Hivemind's `package.json` declares `@opencode-ai/plugin: "^1.15.10"` (`package.json:58`). The upstream opencode-tmux declares `^1.15.5` (`opencode-tmux/package.json:37`). Minor version bumps are backward-compatible within the same major. The `Plugin`, `PluginInput` types are unchanged between 1.15.5 and 1.15.10 based on SDK stability guarantees. The event types (`EventSessionCreated`, `EventSessionStatus`, `EventSessionDeleted`) are consumed via `@opencode-ai/sdk` — an indirect dependency of `@opencode-ai/plugin`.
  - **If wrong:** If Hivemind ships a breaking SDK version (e.g., v2.0.0) or if `@opencode-ai/sdk` event types change shape, the fork's event handlers break silently — no pane spawning, no errors surfaced to user.
  - **Risk:** MEDIUM — OpenCode SDK is pre-1.0 (no major version stability guarantee). Event type shapes could change between SDK releases.
  - **Alternative 1:** Pin the fork's peer dependency to exactly `^1.15.10` (matching Hivemind's installed version) and add a CI check that runs the fork's test suite against Hivemind's installed SDK version. _Accepted:_ This is the recommended mitigation.
  - **Alternative 2:** Vendor the event types in the fork (duplicate the SDK type definitions) to decouple from SDK version drift. _Rationale to reject:_ Increases maintenance burden — type drift from upstream SDK would cause subtle incompatibilities.
  - **Mitigation:** Pin fork peer dependency to `^1.15.10`. Add integration test in Hivemind's CI that loads the fork plugin against the actual installed SDK and verifies event dispatch.

- **Assumption:** The renamed package `@hivemind/opencode-tmux` does not conflict with existing npm packages and can be published to npm (or consumed as a git dependency).
  - **Why this way:** The spec requires renaming from `@floschl/opencode-tmux` to `@hivemind/opencode-tmux` (42-SPEC.md:36). The `@hivemind/` npm scope has not been checked for conflicts. The fork's `package.json:28-29` points to `github.com/FloSchl8/opencode-tmux` — this URL also needs updating.
  - **If wrong:** If `@hivemind/opencode-tmux` is taken on npm, the package cannot be published under that name, forcing a different name or a git-based dependency with all the complexity of monorepo-style consumption.
  - **Risk:** LOW — npm scope `@hivemind/` is plausibly available (the project has not published any packages under this scope yet). Even if unavailable, git dependency with `github:shynlee04/opencode-tmux` works as fallback.
  - **Mitigation:** Check npm availability for `@hivemind/opencode-tmux` during planning. If unavailable, use a git-based dependency in Hivemind's `package.json` (e.g., `"@hivemind/opencode-tmux": "github:shynlee04/opencode-tmux"`).

---

### 3. Integration Assumptions — Event Pipeline & Session-Tracker

- **Assumption:** The OpenCode event pipeline in Hivemind can accommodate a new tmux-specific event observer without changing the existing event dispatch chain.
  - **Why this way:** The `core-hooks.ts` event handler (`src/hooks/lifecycle/core-hooks.ts:153-167`) dispatches events through `eventObservers` — an array of async callbacks registered in `createCoreHooks()`. The plugin.ts composition root (`src/plugin.ts:550-556`) constructs this array. A new observer can be appended to this array without modifying any existing observer. The observer receives `{ event?: unknown }` and the fork's `onSessionCreated` handler internally type-narrows via the `Event` discriminated union (`opencode-tmux/src/index.ts:30`).
  - **If wrong:** If the event pipeline needs significant refactoring (e.g., async ordering constraints between tmux observer and session-tracker observer), scope could expand beyond Phase 42 boundaries.
  - **Risk:** LOW — The observer array pattern is designed for extensibility. The existing `consumeDelegationFact`, `consumeSessionTrackerFact`, etc., all coexist as independent observers.
  - **Alternative 1:** Register the tmux plugin as a separate OpenCode plugin in the user's `opencode.json` (standalone, decoupled from Hivemind). _Rationale to reject:_ Hivemind metadata (agent type, delegation ID) would not be available to the plugin without Hivemind integration code.
  - **Alternative 2:** Wrap the tmux plugin inside the Hivemind plugin via `input.client.plugins` or a similar SDK surface. _Rationale to reject:_ The SDK may not support nested plugin registration; this would couple the tmux lifecycle to Hivemind's plugin lifecycle.
  - **Mitigation:** Register the tmux observer as one more entry in the `eventObservers` array in `plugin.ts:550`. The fork's event handler dispatches to `SessionManager` methods — no change needed to core-hooks.ts.

- **Assumption:** Agent type and delegation ID metadata are available in the event pipeline at the time `session.created` fires, so they can be injected into pane titles.
  - **Why this way:** The spec requires pane titles like `[gsd-phase-researcher] ses_abc — Research phase 42` (42-SPEC.md:42). Hivemind's `DelegationMeta` type (`src/shared/types.ts:91-99`) stores `agent` and `rootID`/`depth` per session. The `getDelegationMeta()` function (`src/plugin.ts:40`) retrieves this from in-memory state. However, the fork's `SessionManager.onSessionCreated()` currently receives `EventSessionCreated` which only has `info.title`, `info.parentID`, `info.id` — no agent type or delegation ID (`opencode-tmux/src/session-manager.ts:55-65`).
  - **If wrong:** If delegation metadata is not available until after the session.created event fires (e.g., it's populated asynchronously), the pane title would be set after the pane already exists with a default title, requiring a two-phase title update (create → fetch metadata → update title).
  - **Risk:** MEDIUM — The `delegate-task` tool calls `delegationManager` which populates `DelegationMeta` before the SDK creates the child session, so metadata should be available synchronously. But the timing gap between `childSessionStarter.start()` and the actual `session.created` event is non-deterministic.
  - **Alternative 1:** Enrich the pane title asynchronously after spawn: create pane with temporary title, then update via `select-pane -T` after metadata resolves. _Accepted fallback:_ The fork already has a `select-pane -T` call post-spawn (`opencode-tmux/src/tmux.ts:129-138`), so this is feasible.
  - **Alternative 2:** Pass metadata through the event observer wrapper — wrap the fork's event handler in a Hivemind-specific adapter that injects delegation ID and agent type into the event payload before forwarding. _Recommended:_ This is the cleanest approach and keeps the fork generic.
  - **Mitigation:** In the Hivemind event observer wrapper, resolve `getDelegationMeta(sessionId)` before calling the fork's `onSessionCreated`. Pass metadata alongside the event. If unavailable at event time, fall back to async pane title update (Alternative 1).

---

### 4. Environment Assumptions — OpenCode Server Mode & Tmux Presence

- **Assumption:** OpenCode can be auto-started in server mode (`--port <stablePort>`) from within a Hivemind plugin bootstrap hook, with zero user configuration.
  - **Why this way:** Spec requirement (42-SPEC.md:49-52): "Hivemind bootstrap hook detects Tmux → auto-starts OpenCode with `--port <stablePort>`". Hivemind's existing bootstrap at `src/features/bootstrap/` has no such mechanism — grep for `--port`, `serverUrl`, `server_mode` returned zero results in `src/`. The OpenCode CLI's `--port` flag is well-documented but there is no existing code in Hivemind that starts OpenCode with port flags.
  - **If wrong:** Auto-init may be impossible from within the plugin because: (a) the plugin runs inside an already-started OpenCode process (chicken-and-egg — OpenCode must already be running for the plugin to load), (b) OpenCode may not support re-initializing its HTTP server after startup, (c) the user's OpenCode may already be running in a non-server mode.
  - **Risk:** HIGH — This is the riskiest assumption in Phase 42. There is ZERO existing infrastructure for this capability. The OpenCode SDK may not expose a way to start server mode programmatically from within a plugin.
  - **Alternative 1:** Document that users must start OpenCode with `--port` when using the tmux integration. Move auto-init to Phase 43 or a separate bootstrap script. _Rationale:_ Reduces Phase 42 risk but contradicts the "zero manual steps" spec requirement.
  - **Alternative 2:** Implement auto-init as a pre-start shell script (opencode.json's `hooks` or a bin script) rather than from within the plugin. The script checks `pgrep opencode --port` and restarts if needed. _Acceptable fallback:_ This is simpler than in-plugin server restart and works within OpenCode's process model.
  - **Mitigation:** Research OpenCode CLI's `--port` behavior and plugin lifecycle hooks during Phase 42 planning. If in-plugin auto-init is impossible, implement Alternative 2 (pre-start script) and document the limitation. Do NOT block Phase 42 delivery on this — the fork and integration code can ship with a manual `--port` requirement first, and auto-init can follow in Phase 42.5 or Phase 43.

- **Assumption:** A stable port across Hivemind sessions for the same project can be derived deterministically (e.g., from project path hash) without conflicting with other ports on the system.
  - **Why this way:** Spec requires "port stability across Hivemind sessions within the same project" (42-SPEC.md:83) so tmux panes re-attach correctly after restarts. A deterministic hash of `projectDirectory` would give the same port for the same project every time.
  - **If wrong:** If the computed port is already in use by another process, `opencode --port <port>` fails silently or binds to a different port, breaking tmux re-attachment. The plugin's `isServerRunning()` check (`opencode-tmux/src/session-manager.ts:223-240`) polls `/health` on the expected URL — if the port shifted, the health check targets the wrong URL.
  - **Risk:** MEDIUM — Port conflicts are a real concern in multi-project scenarios or when other services use the same port range.
  - **Alternative 1:** Use OS-assigned port (port 0) and persist the assigned port to `.hivemind/state/tmux-port.json`. On restart, read the persisted port. _Recommended:_ More robust than deterministic hashing because it cannot conflict.
  - **Alternative 2:** Let the user configure the port in `opencode-tmux.json` with a `port` config key. Default to a safe high port (e.g., 15999). _Fallback:_ Simple, but requires user awareness.
  - **Mitigation:** Implement port persistence to `.hivemind/state/tmux-port.json`. On first start, try port 0 (OS-assigned), capture the bound port, persist it. On subsequent starts, read the persisted port. If port 0 is not available through the plugin API, use deterministic hashing with collision detection + fallback.

- **Assumption:** The `opencode` binary is available in `PATH` inside spawned Tmux panes.
  - **Why this way:** The fork's `spawnPane()` constructs `opencode attach <serverUrl> --session <sessionId> --dir <dir>` as the command to execute in the new pane (`opencode-tmux/src/tmux.ts:92-100`). It runs this via `execFile(tmux, ["split-window", ..., opencodeCmd])` — the shell is tmux's internal shell, which inherits the parent tmux session's PATH.
  - **If wrong:** If the `opencode` binary is installed in a non-standard location (e.g., `~/.nvm/versions/...` via npm global, or a toolchain-managed path), the spawned Tmux pane may not find it in PATH. The pane would open but immediately show `command not found: opencode`.
  - **Risk:** MEDIUM — Node.js toolchains (nvm, fnm, asdf) often install global binaries in user-specific paths that may not propagate to tmux panes.
  - **Alternative 1:** In the pane spawn command, prepend `npx` or use the full path to `opencode` resolved at Hivemind startup. _Accepted:_ Resolve `opencode` via `which opencode` at bootstrap and use the full path in the spawn command.
  - **Alternative 2:** Add a PATH check in the pane spawn that echoes `$PATH` if `opencode` is not found, with an explanatory message. _Fallback:_ Better UX than a silent "command not found".
  - **Mitigation:** Add `resolveOpenCodeBinary()` to the Hivemind tmux integration module that runs `which opencode` at bootstrap and caches the full path. Pass the resolved path to the fork's spawn command instead of relying on PATH propagation.

---

## Needs External Research

1. **OpenCode plugin API port/start capability:** Can an OpenCode plugin programmatically restart OpenCode with `--port` flags, or at minimum query whether OpenCode is running in server mode? The plugin SDK (`@opencode-ai/plugin` ^1.15.10) needs investigation — currently there is NO code in Hivemind (`src/`) that starts or manages the OpenCode process itself. The answer shapes whether auto-init is feasible or deferred.

2. **Port 0 (OS-assigned) behavior in OpenCode CLI:** Does `opencode --port 0` work? Does it print the assigned port to stdout or a known file? This determines the port strategy (deterministic hash vs. OS-assignment vs. user config).

3. **`@opencode-ai/sdk` event type shape stability:** Are the event types (`EventSessionCreated`, `EventSessionStatus`, `EventSessionDeleted`) stable across SDK minor versions? The fork depends on `@opencode-ai/sdk` indirectly via `@opencode-ai/plugin`. A type change (e.g., `parentID` → `parent_id`) would silently break the `session-manager.ts` guard at line 59.

4. **Tmux environment propagation:** Does `tmux split-window` inherit the parent process's PATH exactly? Or does it depend on tmux's `default-command` / `default-shell` settings? This affects whether `opencode` is found in the spawned pane without explicit path resolution.

---

*Assumptions document for Phase 42 — Tmux Visual Orchestration Fork Extension*
*Generated by gsd-assumptions-analyzer via codebase analysis of 15 source files*
*Next step: Review assumptions with user before advancing to `/gsd-plan-phase 42`*
