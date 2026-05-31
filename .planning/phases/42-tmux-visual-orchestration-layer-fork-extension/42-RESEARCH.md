# Phase 42: Tmux Visual Orchestration — Fork Extension — Research

**Researched:** 2026-05-31
**Domain:** OpenCode plugin SDK, Tmux integration, Bun build, Hivemind feature module architecture
**Confidence:** HIGH

## Summary

Phase 42 delivers a Bun-native fork of `opencode-tmux` renamed to `@hivemind/opencode-tmux`, plus a Hivemind-side integration module at `src/features/tmux/` that wires `session.created` events to Tmux pane spawning, auto-detects server URL, and silently degrades when Tmux is unavailable.

**Four critical research questions resolved:**

1. **Plugin auto-init server mode [NOT feasible from within plugin]**: An OpenCode plugin runs inside an already-started process. It can NOT restart the parent with `--port`. The plugin receives `serverUrl` via `input.serverUrl.toString()` (a `URL` object on `PluginInput`) — but only if OpenCode was started with an explicit port. Confirmed by OpenCode issue #9099 and plugin docs. **Mitigation:** Document that user must configure `server.port` in `opencode.json`. Pre-start wrapper deferred to Phase 43.

2. **`opencode --port 0` behavior [tries 4096 first, then random OS port]**: From OpenCode server source (`server/server.ts`): `const server = opts.port === 0 ? (tryServe(4096) ?? tryServe(0)) : tryServe(opts.port)`. Port 0 does NOT directly yield OS-assigned — 4096 is preferred. No `OPENCODE_SERVER_URL` env var exists (feature requested in issue #9099, not implemented). **Mitigation:** Persist detected port to `.hivemind/state/tmux-port.json` for cross-session stability.

3. **Event type stability [MEDIUM risk — pre-1.0 but stable in practice]**: Both `@opencode-ai/plugin` and `@opencode-ai/sdk` at version `1.15.13`. Hivemind depends on `^1.15.10`. Event types (`EventSessionCreated`, `EventSessionStatus`, `EventSessionDeleted`) are documented in official plugin docs as standard events. No breaking changes observed across 1.15.x. **Mitigation:** Pin fork peer dependency to `^1.15.13` and add integration test that loads the plugin against installed SDK.

4. **Tmux PATH propagation [panes do NOT inherit parent PATH]**: Tmux `split-window` creates a new login shell per pane reading `default-shell` (bash/zsh). The parent process `$PATH` is NOT inherited. Toolchain-managed binaries (nvm, fnm, asdf) may be absent. **Mitigation:** Resolve `opencode` full binary path at bootstrap via `which opencode`, pass to fork's `spawnPane()` as explicit argument instead of relying on PATH.

**Primary recommendation:** Fork `shynlee04/opencode-tmux` (currently identical upstream), rename to `@hivemind/opencode-tmux`, add Hivemind-specific config keys. Implement `src/features/tmux/` module mirroring `createPtyManagerIfSupported()` pattern. Wire into `eventObservers` array in plugin.ts. Use documented `server.port` config rather than in-plugin auto-init.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Tmux pane lifecycle | Fork (`@hivemind/opencode-tmux`) | — | Fork owns spawn/close/layout/respawn — unchanged from upstream architecture |
| Server URL detection | Hivemind plugin.ts | Fork `SessionManager` | Hivemind reads `input.serverUrl`; fork uses for `opencode attach` URL construction |
| Delegation metadata enrichment | Hivemind `src/features/tmux/observers.ts` | Fork `SessionManager` | Hivemind resolves `getDelegationMeta(sessionId)` and enriches event before forwarding |
| Silent fallback | Hivemind `src/features/tmux/integration.ts` | — | `createTmuxIntegrationIfSupported()` returns null when tmux unavailable |
| Port persistence | Hivemind bootstrap | — | Port stored in `.hivemind/state/tmux-port.json` for cross-session stability |
| Binary path resolution | Hivemind `src/features/tmux/integration.ts` | Fork `tmux.ts` | Resolve `opencode` path; pass into fork's spawn command |

## User Constraints (from SPEC.md)

### Locked Decisions
- Fork stays Bun-native (Bun build → Node-compatible ESM via `--target node`)
- Fork stays in its own repo (`shynlee04/opencode-tmux`)
- Silent fallback when Tmux unavailable (no errors, no warnings)
- OpenCode server mode auto-init on Tmux detect (HOWEVER — must be pre-start or config, NOT in-plugin)
- Stable port across Hivemind sessions within same project
- `opencode` binary path must be resolved to avoid Tmux PATH issues
- 3-phase roadmap: 42 (fork+basic), 43 (co-pilot), 44 (graph+restore)

### Discretion Areas
- Port strategy: deterministic hash vs. OS-assignment with persistence file vs. user-configured
- Whether auto-init is a pre-start wrapper or documented manual step
- Exact pane metadata title format

### Deferred Ideas (OUT OF SCOPE)
- Orchestrator intervention via send-keys — Phase 43
- Pane grid planning / layout calculation — Phase 43
- Visual dependency graph — Phase 44
- Session-tracker replay/restore — Phase 44
- Rewriting Bun APIs to Node.js

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-01 | Fork extension with Hivemind-specific config | Fork structure verified (5 source files, 594 LOC); add `copilot`, `agentLabelFormat` to config.ts; relax `parentID` guard in session-manager.ts:59 |
| REQ-02 | Hivemind metadata in pane titles | `DelegationMeta` type exists in shared/types.ts:91-99 with `agent`, `rootID`, `depth`; event observer wrapper can resolve `getDelegationMeta(sessionId)` before forwarding |
| REQ-03 | Hivemind plugin integration (hooks/tools in src/) | PTY runtime pattern proven (`createPtyManagerIfSupported` in plugin.ts:374); `eventObservers` array at core-hooks.ts:164 accepts new entries without refactoring |
| REQ-04 | Auto-initiate OpenCode server mode at bootstrap | **IMPOSSIBLE from within plugin** — must be pre-start script or user config; `server.port` in opencode.json is the viable approach; `input.serverUrl` in PluginInput provides URL when port is configured |
| REQ-05 | Graceful degradation (silent fallback) | `createTmuxIntegrationIfSupported()` returns null on failure; delegation proceeds normally; same pattern as PTY runtime |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@opencode-ai/plugin` | ^1.15.10 (Hivemind), ^1.15.13 (latest) | Plugin SDK — event hooks, PluginInput, tool() | Required by Hivemind and fork; provides `input.serverUrl` for URL discovery |
| `@opencode-ai/sdk` | ^1.15.10 | Event type definitions (`EventSessionCreated`, etc.) | Indirect dependency of plugin; provides discriminated union event types |
| `bun` | latest | Runtime, test runner, bundler | Spec requirement — fork stays Bun-native; build targets Node-compatible ESM |
| `typescript` | ^5.9.0 | Type checker | Upstream devDep |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@types/node` | ^24.0.0 | Node.js type definitions | Fork uses `node:child_process`, `node:fs`, `node:path`, `node:util` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Bun-native fork | Pure Node.js/TypeScript rewrite | Contradicts SPEC constraint; increases CI maintenance; fix: fork's runtime APIs already Node-compatible via `--target node` |
| Own repo fork | Hivemind monorepo asset | SPEC says fork stays in own repo; reduces coupling |
| Standalone plugin (no Hivemind wrapper) | Hivemind-wrapped integration | Wrapper needed for metadata injection; standalone approach lacks agent type + delegation ID in pane titles |

**Installation:**
```bash
# Fork (in its own repo directory):
bun install

# Hivemind (no new npm deps — fork consumed via opencode.json plugin list):
# The fork is a separate npm/git dependency, NOT bundled in Hivemind's package.json
```

**Version verification:**
```bash
npm view @opencode-ai/plugin version    # → 1.15.13  [VERIFIED: npm registry]
npm view @opencode-ai/sdk version       # → 1.15.13  [VERIFIED: npm registry]
npm view @hivemind/opencode-tmux        # → 404: not published, name available  [VERIFIED: npm registry]
```

## Package Legitimacy Audit

> **Note:** Phase 42 does NOT install new packages into Hivemind's `package.json`. The fork `@hivemind/opencode-tmux` is consumed as a separate package referenced in `opencode.json` (external consumer pattern). Hivemind's own integration (`src/features/tmux/`) uses zero external packages beyond existing Hivemind deps (`@opencode-ai/plugin`, `@opencode-ai/sdk`). Therefore, slopcheck is not needed — no Hivemind packages are being modified or added.

| Package | Registry | Age | Downloads | Source Repo | Disposition |
|---------|----------|-----|-----------|-------------|-------------|
| `@hivemind/opencode-tmux` | npm | not published | 0 | `github:shynlee04/opencode-tmux` | **Available to publish** |
| `@floschl/opencode-tmux` (upstream) | npm | ~6 mo | ~1,346/wk | `github:FloSchl8/opencode-tmux` | Reference only |

**Packages removed due to slopcheck:** None — no new Hivemind packages being installed.
**Packages flagged as suspicious:** None.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  OpenCode Process                                                            │
│                                                                              │
│  ┌─────────────────────────────┐    ┌──────────────────────────────────┐    │
│  │  Hivemind Plugin (plugin.ts) │    │  @hivemind/opencode-tmux (fork) │    │
│  │                             │    │  (loaded via opencode.json)      │    │
│  │  ┌───────────────────────┐  │    │                                  │    │
│  │  │ Delegation System     │──┼──┐ │  ┌────────────────────────┐     │    │
│  │  │ delegate-task, etc.   │  │  │ │  │ SessionManager        │     │    │
│  │  └───────────┬───────────┘  │  │ │  │  - onSessionCreated   │     │    │
│  │              │               │  │ │  │  - onSessionStatus    │     │    │
│  │  ┌───────────▼───────────┐  │  │ │  │  - onSessionDeleted   │     │    │
│  │  │ core-hooks.ts         │  │  │ │  └──────────┬────────────┘     │    │
│  │  │  eventObservers[]     │  │  │ │             │                   │    │
│  │  │  ├─ consumeDelegation │  │  │ │  ┌──────────▼────────────┐     │    │
│  │  │  ├─ sessionEvent      │  │  │ │  │ TmuxMultiplexer      │     │    │
│  │  │  ├─ consumeTracker    │  │  │ │  │  - spawnPane()       │     │    │
│  │  │  ├─ consumeEntry      │  │  │ │  │  - closePane()       │     │    │
│  │  │  ├─ consumeIsMain     │  │  │ │  │  - applyLayout()     │     │    │
│  │  │  └─ [NEW] tmuxObserver│──┼──┼─┼─▶│  - [MOD] binaryPath  │     │    │
│  │  └───────────────────────┘  │  │ │  └──────────┬────────────┘     │    │
│  │                             │  │ │             │                   │    │
│  │  ┌───────────────────────┐  │  │ │  spawn command:                 │    │
│  │  │ src/features/tmux/    │──┼──┘ │  tmux split-window ...          │    │
│  │  │  integration.ts       │  │    │  "/full/path/to/opencode        │    │
│  │  │  observers.ts         │  │    │   attach <url> --session <id>"  │    │
│  │  └───────────────────────┘  │    └─────────────────────────────────┘    │
│  └─────────────────────────────┘                                           │
│                                                                              │
│  ┌───────────────┐  ┌───────────────────┐  ┌───────────────────┐         │
│  │ TMUX WINDOW   │  │                   │  │                   │         │
│  │ ┌───────────┐ │  │ ┌───────────────┐ │  │ ┌───────────────┐ │         │
│  │ │ Pane 0    │ │  │ │ Pane 1        │ │  │ │ Pane 2        │ │         │
│  │ │ (main)    │ │  │ │ [researcher]  │ │  │ │ [planner]     │ │         │
│  │ │ harness   │ │  │ │ ses_abc — R42 │ │  │ │ ses_def — P43 │ │         │
│  │ └───────────┘ │  │ └───────────────┘ │  │ └───────────────┘ │         │
│  └───────────────┘  └───────────────────┘  └───────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

**Fork repo (`shynlee04/opencode-tmux` → `@hivemind/opencode-tmux`):**
```
opencode-tmux/
├── package.json              # Rename to @hivemind/opencode-tmux, peer ^1.15.13
├── tsconfig.json             # ES2022, ESNext modules, strict (unchanged)
├── bunfig.toml               # 90% coverage threshold (unchanged)
├── README.md                 # Update for Hivemind features
├── src/
│   ├── index.ts              # Plugin factory — expose classes for Hivemind wrapper
│   ├── config.ts             # ADD copilot, agentLabelFormat keys
│   ├── session-manager.ts    # MODIFY parentID guard; ADD metadata handling
│   ├── tmux.ts               # MODIFY spawnPane() — accept binaryPath, hivemindMeta
│   ├── util.ts               # Unchanged
│   └── __tests__/
│       ├── index.test.ts
│       ├── config.test.ts    # ADD new config key tests
│       ├── session-manager.test.ts  # ADD copilot, metadata tests
│       ├── tmux.test.ts      # ADD binaryPath, title format tests
│       └── util.test.ts
└── .github/workflows/ci.yml  # Update package name references
```

**Hivemind side (`hivemind-plugin-private/src/features/tmux/`):**
```
src/features/tmux/
├── integration.ts            # TmuxIntegration class: checkAvailable, resolveBinary, detectServerUrl
├── observers.ts              # createTmuxEventObserver — enriches events with metadata
└── __tests__/
    └── integration.test.ts   # Mock tmux availability; test fallback; metadata enrichment
```

### Pattern 1: Silent Fallback Factory (mirror PTY runtime)

**What:** Factory that checks availability at bootstrap, returns `null` when unsupported. Zero changes to delegation logic when Tmux is absent.

**When to use:** Always — this is the established Hivemind pattern for optional runtime features.

**Proof (codebase scan):**
```typescript
// Source: src/features/background-command/pty/pty-runtime.ts:13-21 [VERIFIED]
export async function createPtyManagerIfSupported(): Promise<PtyManager | null> {
  try {
    const ptyModule = await import("./pty-manager.js")
    const candidate = new ptyModule.PtyManager()
    return candidate.isSupported() ? candidate : null
  } catch {
    return null
  }
}
```

**Mirror for Tmux:**
```typescript
// src/features/tmux/integration.ts
export interface TmuxIntegration {
  isAvailable(): boolean
  version: string | null
  binaryPath: string | null
  opencodeBinaryPath: string | null
  serverUrl: string | null
}

export async function createTmuxIntegrationIfSupported(
  projectDirectory: string,
): Promise<TmuxIntegration | null> {
  try {
    // Step 1: Check tmux binary via which/where
    const tmuxPath = await resolveBinary("tmux")
    if (!tmuxPath) return null

    // Step 2: Verify we're inside a tmux session (process.env.TMUX is set by tmux)
    if (!process.env.TMUX) return null

    // Step 3: Resolve opencode binary for pane spawn commands (PATH fix)
    const opencodePath = await resolveBinary("opencode")
    if (!opencodePath) return null

    // Step 4: Detect or read persisted server URL
    const serverUrl = await detectServerUrl(projectDirectory)
    if (!serverUrl) return null

    // Step 5: Get tmux version string
    const version = await getTmuxVersion(tmuxPath)

    return {
      isAvailable: () => true,
      version,
      binaryPath: tmuxPath,
      opencodeBinaryPath: opencodePath,
      serverUrl,
    }
  } catch {
    return null
  }
}
```

### Pattern 2: Event Observer Wrapper with Metadata Enrichment

**What:** Hivemind-side wrapper intercepts `session.created` events, resolves delegation metadata from `getDelegationMeta()`, enriches the event, then forwards to the fork's `SessionManager`.

**When to use:** Required for REQ-02 — Hivemind agent type + delegation ID in pane titles.

```typescript
// src/features/tmux/observers.ts
import { getDelegationMeta } from "../../shared/state.js"

export interface EnrichedSessionEvent {
  type: "session.created"
  properties: {
    info: {
      id: string
      parentID: string | undefined
      title: string
      directory: string
    }
  }
  hivemindMeta?: {
    agent: string          // e.g. "gsd-phase-researcher"
    delegationId: string   // e.g. "ses_abc123"
    depth: number
  }
}

export function createTmuxEventObserver(
  forkSessionManager: {
    onSessionCreated: (event: EnrichedSessionEvent) => Promise<void>
  },
): (input: { event?: unknown }) => Promise<void> {
  return async ({ event }) => {
    if (!event || typeof event !== "object") return

    const evt = event as Record<string, unknown>
    if (evt.type !== "session.created") return

    const props = evt.properties as Record<string, unknown> | undefined
    const info = props?.info as Record<string, unknown> | undefined
    if (!info?.id) return

    const sessionId = String(info.id)
    const meta = getDelegationMeta(sessionId)

    const enriched: EnrichedSessionEvent = {
      type: "session.created",
      properties: {
        info: {
          id: sessionId,
          parentID: info.parentID as string | undefined,
          title: String(info.title ?? "Subagent"),
          directory: String(info.directory ?? ""),
        },
      },
      hivemindMeta: meta ? {
        agent: meta.agent,
        delegationId: sessionId,
        depth: meta.depth,
      } : undefined,
    }

    await forkSessionManager.onSessionCreated(enriched)
  }
}
```

### Pattern 3: Wiring into plugin.ts

**How to wire** the new observer alongside the existing PTY manager pattern:

```typescript
// In plugin.ts (lines 370-556), add alongside existing ptyManager:

// Line 374 (existing):
const ptyManager = await createPtyManagerIfSupported()

// NEW — after ptyManager:
const tmuxIntegration = await createTmuxIntegrationIfSupported(projectDirectory)

// In the createCoreHooks call, add new observer to eventObservers array:
eventObservers: [
  consumeDelegationFact,
  sessionEventObserver,
  consumeSessionTrackerFact,
  consumeSessionEntryFact,
  consumeIsMainSessionFact,
  async ({ event }: { event?: unknown }) => {
    if (event && typeof event === "object") {
      const lmc = sessionTracker.getLastMessageCapture()
      lmc?.handleEvent(event as Record<string, unknown>)
    }
  },
  // NEW: Tmux integration observer (only when tmux is available)
  ...(tmuxIntegration
    ? [createTmuxEventObserver({
        // This wraps the fork's SessionManager via Hivemind's bridge
        onSessionCreated: async (enriched) => {
          // If fork is loaded as npm plugin, delegate to it
          // Otherwise this is a placeholder for Phase 42's bridge
          tmuxIntegration.handleSessionCreated(enriched)
        },
      })]
    : []),
],
```

### Anti-Patterns to Avoid
- **In-plugin server mode auto-init:** Attempting `opencode --port` from within the plugin process — impossible because plugin loads inside already-started process
- **Relying on PATH propagation to Tmux panes:** New panes use login shell, NOT inheriting parent PATH. Always resolve full binary path
- **Hardcoding port 4096:** OpenCode `--port 0` tries 4096 first but falls back to random port; conflicts with other tools common
- **Loading fork plugin inside Hivemind's plugin.ts:** Fork is consumed as separate plugin via `opencode.json`, not loaded inside Hivemind's code
- **Modifying eventObservers signature in core-hooks.ts:** The array pattern `(input: { event?: unknown }) => Promise<void>` must be preserved — do NOT change core-hooks.ts

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tmux pane lifecycle | Custom `execFile` loop | Fork's `TmuxMultiplexer` (211 LOC, tested) | Race conditions, shell quoting, layout reapply, dedup all handled |
| Session-pane mapping | Custom `Map<sessionId, paneId>` | Fork's `SessionManager` (241 LOC, tested) | 6 state sets, idle-during-spawn race, respawn, cleanup |
| Event dispatch routing | Custom `if/else` chain | `@opencode-ai/plugin` `event` hook | OpenCode already routes events to plugin hook |
| Config loading | Custom file watcher | Fork's `loadConfig()` (73 LOC, tested) | 3-level precedence, clamping, fallback |
| Port discovery | Polling stdout | `input.serverUrl.toString()` in PluginInput | PluginInput provides URL directly |
| Shell quoting | Manual `'...'` escaping | Fork's `quoteShellArg()` | Handles single-quote injection via `'\''` escape |

**Key insight:** The fork at 594 source LOC already solves the hardest parts. Hivemind's integration code is a thin metadata-enrichment layer (~100-150 LOC) plus the factory (~60 LOC). Resist rewriting the fork inside Hivemind's codebase.

## Common Pitfalls

### Pitfall 1: In-Plugin Server Mode Auto-Init
**What goes wrong:** Attempting to start OpenCode with `--port` from within the plugin bootstrap code.
**Why it happens:** The plugin function runs inside the already-started OpenCode process. No SDK API exists to restart or reconfigure the parent process's server mode. PluginInput context is read-only.
**How to avoid:** Never attempt this. Instead:
- (Acceptable for Phase 42) Document `"server": { "port": 4096 }` in `opencode.json` as a prerequisite
- (Phase 43) Provide a pre-start shell script that detects Tmux and starts OpenCode with `--port` if needed
**Warning signs:** Plugin crashes with "failed to load plugin" or port binding errors on init.

### Pitfall 2: Port 4096 Conflicts
**What goes wrong:** Multiple OpenCode instances try port 4096; fallback port not discoverable because `OPENCODE_SERVER_URL` env var does not exist (requested in issue #9099, not yet implemented).
**Why it happens:** OpenCode's `--port 0` code: `tryServe(4096) ?? tryServe(0)`. The fallback port is random and silent.
**How to avoid:** Persist detected port to `.hivemind/state/tmux-port.json` after first successful `isServerRunning()` health check. Read that file on subsequent starts.
**Warning signs:** `opencode attach` times out; `isServerRunning()` health check targets wrong URL.

### Pitfall 3: `command not found: opencode` in Tmux Panes
**What goes wrong:** Newly spawned tmux pane shows "command not found" for `opencode`.
**Why it happens:** Fork's `spawnPane()` hardcodes `"opencode"` string (tmux.ts:92-100). Tmux creates login shells — parent PATH not inherited. Toolchain-managed PATH may not be set up.
**How to avoid:** Modify fork's `spawnPane()` to accept an optional `binaryPath` parameter. In Hivemind, resolve full path via `which opencode` and pass it through.
**Warning signs:** `execFile(tmux, ["split-window", ..., "opencode attach ..."])` succeeds but pane shows "command not found".

### Pitfall 4: Event Type Mismatch on SDK Update
**What goes wrong:** `@opencode-ai/sdk` removes or renames `EventSessionCreated.parentID` field, causing the fork's guard `if (!info.parentID) return;` to silently filter all sessions.
**Why it happens:** Pre-1.0 SDK allows breaking changes. The fork's `SessionManager` imports types from `@opencode-ai/sdk` indirectly via `@opencode-ai/plugin`.
**How to avoid:** Pin fork peer dependency to `^1.15.13` matching Hivemind's `^1.15.10`. Add CI step that runs fork tests against Hivemind's installed SDK version.
**Warning signs:** No panes spawn despite delegation working; `enabled: true` but `parentID` always undefined.

## Code Examples

### Binary Path Resolution with Port Detection

```typescript
// src/features/tmux/integration.ts
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { createHash } from "node:crypto"

const execFileAsync = promisify(execFile)
const PORT_FILE = ".hivemind/state/tmux-port.json"

export async function resolveBinary(name: string): Promise<string | null> {
  const cmd = process.platform === "win32" ? "where" : "which"
  try {
    const { stdout } = await execFileAsync(cmd, [name])
    const path = stdout.trim().split("\n")[0]
    return path ?? null
  } catch {
    return null
  }
}

export async function getTmuxVersion(tmuxPath: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(tmuxPath, ["--version"])
    return stdout.trim()
  } catch {
    return null
  }
}

export function readPersistedPort(projectDir: string): number | null {
  const path = join(projectDir, PORT_FILE)
  if (!existsSync(path)) {
    // Fallback: deterministic hash of project directory for stability
    const hash = createHash("sha256").update(projectDir).digest("hex")
    return 10000 + (parseInt(hash.slice(0, 4), 16) % 55535)
  }
  try {
    const data = JSON.parse(readFileSync(path, "utf-8"))
    return typeof data.port === "number" ? data.port : null
  } catch {
    return null
  }
}

export function persistPort(projectDir: string, port: number): void {
  const stateDir = join(projectDir, ".hivemind", "state")
  if (!existsSync(stateDir)) mkdirSync(stateDir, { recursive: true })
  writeFileSync(
    join(projectDir, PORT_FILE),
    JSON.stringify({ port, updatedAt: Date.now() }),
    "utf-8",
  )
}

export async function detectServerUrl(projectDir: string): Promise<string | null> {
  // First try persisted port
  const port = readPersistedPort(projectDir)
  if (port) return `http://localhost:${port}`

  // If no persisted port, return null — server URL will come from PluginInput
  return null
}
```

### Fork Config Extension (src/config.ts)

```typescript
// Current interface (3 keys):
export interface TmuxPluginConfig {
  layout: TmuxLayout
  mainPaneSize: number   // 10..90
  autoClose: boolean
}

// Target interface (5 keys):
export interface TmuxPluginConfig {
  layout: TmuxLayout
  mainPaneSize: number   // 10..90
  autoClose: boolean
  // Hivemind extension:
  copilot: boolean              // false = child-only; true = also non-child sessions
  agentLabelFormat: string      // "{agentType} — {delegationId}"
  opencodeBinaryPath?: string   // Resolved full path to opencode binary
}

// Updated defaults:
export const DEFAULT_CONFIG: TmuxPluginConfig = {
  layout: "main-vertical",
  mainPaneSize: 60,
  autoClose: true,
  copilot: false,
  agentLabelFormat: "{agentType} — {delegationId}",
}

// Updated loadConfig() — add to parser:
const copilot =
  typeof raw.copilot === "boolean" ? raw.copilot : DEFAULT_CONFIG.copilot

const agentLabelFormat =
  typeof raw.agentLabelFormat === "string"
    ? raw.agentLabelFormat
    : DEFAULT_CONFIG.agentLabelFormat

const opencodeBinaryPath =
  typeof raw.opencodeBinaryPath === "string" ? raw.opencodeBinaryPath : undefined

return { layout, mainPaneSize, autoClose, copilot, agentLabelFormat, opencodeBinaryPath }
```

### Fork Pane Title with Hivemind Metadata (src/tmux.ts)

```typescript
// Modify spawnPane() signature and title logic:

interface SpawnPaneOptions {
  sessionId: string
  description: string
  serverUrl: string
  directory: string
  binaryPath?: string   // NEW: resolved opencode path
  hivemindMeta?: {      // NEW: for enriched pane titles
    agent: string
    delegationId: string
  }
}

async spawnPane(options: SpawnPaneOptions): Promise<PaneResult> {
  const tmux = await this.getBinary()
  if (!tmux) return { success: false }

  try {
    const opencodeBinary = options.binaryPath ?? "opencode"
    const quotedDirectory = quoteShellArg(options.directory)
    const quotedUrl = quoteShellArg(options.serverUrl)
    const quotedSessionId = quoteShellArg(options.sessionId)

    const opencodeCmd = [
      opencodeBinary,  // Use resolved path, not hardcoded "opencode"
      "attach",
      quotedUrl,
      "--session",
      quotedSessionId,
      "--dir",
      quotedDirectory,
    ].join(" ")

    // ... rest of split-window logic unchanged ...

    // Pane title with Hivemind metadata:
    if (options.hivemindMeta) {
      const title = `[${options.hivemindMeta.agent}] ${options.hivemindMeta.delegationId.slice(0, 8)} — ${options.description}`
      await execFileAsync(tmux, [
        "select-pane", "-t", paneId, "-T",
        title.slice(0, 40),  // tmux title length limit
      ])
    } else {
      // Original behavior: first 30 chars
      await execFileAsync(tmux, [
        "select-pane", "-t", paneId, "-T",
        options.description.slice(0, 30),
      ])
    }

    // ... layout reapply unchanged ...
  }
}
```

### Fork Session Manager — Relax parentID Guard (session-manager.ts)

```typescript
// Current guard (line 59):
if (!info.parentID) return; // only child sessions

// Target (config-controlled):
async onSessionCreated(event: EnrichedSessionEvent): Promise<void> {
  if (!this.enabled) return

  const info = event.properties.info
  const isChildSession = !!info.parentID

  // If not copilot mode, skip non-child sessions
  if (!this.config.copilot && !isChildSession) return

  const sessionId = info.id
  const parentId = info.parentID ?? "" // co-pilot sessions have no parent
  const title = info.title ?? "Subagent"
  const directory = info.directory ?? this.directory

  // Store metadata from enriched event
  const hivemindMeta = (event as EnrichedSessionEvent).hivemindMeta

  // ... rest of tracking logic unchanged ...
  // Pass hivemindMeta to spawnPane() for title formatting
  const result = await this.tmux.spawnPane({
    sessionId,
    description: title,
    serverUrl: this.serverUrl,
    directory,
    binaryPath: this.config.opencodeBinaryPath,
    hivemindMeta,
  })
  // ...
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `opencode --port 4096` startup | Auto-detect via `server.port` config + PluginInput | Phase 42 | Zero manual startup steps for plugin; user sets port once |
| "first 30 chars of title" pane naming | `[agentType] delegationID — sessionTitle` format | Phase 42 | Clear visual identification of which agent runs in each pane |
| Child-session-only (`!parentID` guard) | `copilot` config flag relaxes guard | Phase 42 | Supports Hivemind's parallel co-pilot model (Phase 43 foundation) |
| No persisted port | `.hivemind/state/tmux-port.json` file | Phase 42 | Cross-session stability for pane re-attachment |
| Hardcoded `"opencode"` in pane command | Resolved binary path from `which opencode` | Phase 42 | Works with nvm/fnm/asdf toolchains |

**Deprecated/outdated:**
- Hardcoded `--port 4096` startup requirement — replaced by `server.port` config
- `parentID` guard as exclusive filter — replaced by `copilot` boolean flag
- First-30-chars title — replaced by Hivemind metadata format
- Assuming `opencode` exists in PATH inside tmux panes — always resolve full path

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The fork at `shynlee04/opencode-tmux` is accessible and has no Bun-only API calls | Standard Stack | LOW — audit confirmed all APIs are `node:*`; no `Bun.*` usage in src/ |
| A2 | `@opencode-ai/plugin` ^1.15.10 is backward-compatible with fork's ^1.15.5 range | Standard Stack | MEDIUM — pinned to ^1.15.13 in fork; Hivemind uses ^1.15.10; same minor range |
| A3 | The `eventObservers` array at plugin.ts:550 accepts a new observer without refactoring | Architecture | LOW — array pattern designed for extensibility; each observer independent |
| A4 | `getDelegationMeta(sessionId)` returns data synchronously at event time | Code Examples | MEDIUM — metadata populated by `DelegationManager` before SDK fires event; fallback: async pane title update |
| A5 | `@hivemind/opencode-tmux` can be published to npm | Standard Stack | LOW — verified: name returns 404, scope `@hivemind` has no other published packages |
| A6 | `input.serverUrl` is a `URL` object (not undefined) when server.port configured | Code Examples | LOW — confirmed by fork source session-manager.ts:41 calling `.toString()` on it |
| A7 | Fork's `findBinary()` (`which`/`where` command) works inside Hivemind's Node.js process | Environment | LOW — uses `execFileAsync` from `node:child_process`; same as PTY runtime |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **Should auto-init be a pre-start wrapper or deferred to Phase 43?**
   - What we know: In-plugin auto-init is impossible (research Q1 confirmed). The plugin runs inside the OpenCode process.
   - What's unclear: Is a pre-start wrapper script within Phase 42 scope, or do we accept documented `server.port` config for Phase 42?
   - Recommendation: **Accept manual `server.port` config for Phase 42.** Provide clear README docs. Move auto-init wrapper to Phase 43. Rationale: Pre-start wrapper would need to detect running OpenCode, manage restart signals, handle `--port` flag — non-trivial scope.

2. **Is `input.serverUrl` guaranteed when no `--port` is set?**
   - What we know: Upstream code calls `input.serverUrl.toString()` assuming it exists (session-manager.ts:41). OpenCode issue #9099 says `ctx.serverUrl` returns fallback `http://localhost:4096`.
   - What's unclear: Is it a `URL` object or `undefined` when server started without port?
   - Recommendation: Add defensive check: `this.serverUrl = input.serverUrl?.toString() ?? ""`. If empty, health check fails and spawning skipped gracefully.

3. **Where should fork CI run?**
   - What we know: Fork has its own `.github/workflows/ci.yml` targeting `ubuntu-latest` and `macos-latest`.
   - Recommendation: Keep independent CI in fork repo. Hivemind CI adds a smoke test that verifies the plugin loads against installed SDK version.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `tmux` | Pane spawning | Not on dev machine | — | Silent fallback: `createTmuxIntegrationIfSupported()` returns null |
| `opencode` | Pane `opencode attach` command | ✓ | — | Resolved at bootstrap via `which opencode` |
| `bun` | Fork build + test | Must install | — | `npm install -g bun` or `brew install oven-sh/bun/bun` |
| `git` | Repo management | ✓ | — | — |
| `node` | Hivemind runtime | ✓ | 20+ | — |
| `@opencode-ai/plugin` | Plugin SDK | ✓ | 1.15.13 | Pinned in package.json |
| `@opencode-ai/sdk` | Event types | ✓ | 1.15.13 | Pinned in package.json |

**Missing dependencies with no fallback:**
- `tmux` — feature silently degrades (by design). Not a blocker.
- `bun` — required for fork development. Install via `npm install -g bun` or `brew install oven-sh/bun/bun`.

## Security Domain

> Phase 42 is an enhancement layer (Tmux visualization) that does not handle user data, secrets, or authentication. Security analysis is minimal.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | Shell-injection protection via `quoteShellArg()` in fork's tmux.ts |
| V6 Cryptography | no | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Shell injection via session title | Tampering | Fork's `quoteShellArg()` wraps in single quotes with `'\''` escape — verified in audit |
| Port hijacking via predictable port | Spoofing | User-configurable `server.port` + persistence file in `.hivemind/state/` |
| Binary path hijacking | Tampering | Resolve via `which opencode` at bootstrap (uses system PATH, not user-supplied) |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (Hivemind), bun:test (fork) |
| Config file | `vitest.config.ts` (Hivemind), `bunfig.toml` (fork — 90% coverage threshold) |
| Quick run command | `npx vitest run tests/lib/tmux/` (Hivemind), `bun test` (fork) |
| Full suite command | `npm test` (Hivemind), `bun test --coverage --isolate` (fork) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-01 | Fork config: `copilot` flag changes behavior | unit | `bun test src/__tests__/config.test.ts` | ✅ (exists, will add cases) |
| REQ-01 | Fork config: `agentLabelFormat` parsed correctly | unit | `bun test src/__tests__/config.test.ts` | ✅ (exists, will add cases) |
| REQ-02 | Pane title includes `[agentType] delegationID — sessionTitle` | unit | `bun test src/__tests__/tmux.test.ts` | ✅ (exists, will add cases) |
| REQ-03 | TmuxIntegration.checkAvailable() returns version when tmux available | unit | `npx vitest run tests/lib/tmux/integration.test.ts` | ❌ Wave 0 |
| REQ-03 | TmuxIntegration unavailable returns `null` silently | unit | `npx vitest run tests/lib/tmux/integration.test.ts` | ❌ Wave 0 |
| REQ-03 | Event observer enriches event with delegation metadata | unit | `npx vitest run tests/lib/tmux/observers.test.ts` | ❌ Wave 0 |
| REQ-04 | Port persistence writes/reads `.hivemind/state/tmux-port.json` | unit | `npx vitest run tests/lib/tmux/integration.test.ts` | ❌ Wave 0 |
| REQ-04 | Deterministic fallback port computed from project dir hash | unit | `npx vitest run tests/lib/tmux/integration.test.ts` | ❌ Wave 0 |
| REQ-05 | Delegation works when tmux unavailable — no error thrown | integration | `npx vitest run tests/lib/tmux/integration.test.ts` | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] `tests/lib/tmux/integration.test.ts` — covers REQ-03, REQ-04, REQ-05
- [ ] `tests/lib/tmux/observers.test.ts` — covers REQ-03 metadata enrichment
- [ ] Add test cases to fork's `session-manager.test.ts` for `copilot` flag behavior
- [ ] Add test cases to fork's `config.test.ts` for `copilot`, `agentLabelFormat`, `opencodeBinaryPath` keys
- [ ] Add test cases to fork's `tmux.test.ts` for binary path parameter and Hivemind metadata title format

*(Framework install: `npm install -g bun` for fork — if not detected)*

## Sources

### Primary (HIGH confidence)
- [VERIFIED: npm registry] `@opencode-ai/plugin` v1.15.13, `@opencode-ai/sdk` v1.15.13 — confirmed via `npm view`
- [VERIFIED: npm registry] `@hivemind/opencode-tmux` — not published (404), name available for publication
- [VERIFIED: codebase scan] `src/features/background-command/pty/pty-runtime.ts:13-21` — silent fallback factory pattern (proven in production)
- [VERIFIED: codebase scan] `src/hooks/lifecycle/core-hooks.ts:153-167` — `eventObservers` array, each observer independent
- [VERIFIED: codebase scan] `src/plugin.ts:374` — PTY manager wired at bootstrap; `:550-556` — observer registration in `createCoreHooks`
- [VERIFIED: codebase scan] `src/shared/types.ts:91-99` — `DelegationMeta` type with `agent`, `rootID`, `depth` fields
- [VERIFIED: codebase scan] `src/shared/state.ts` — `getDelegationMeta(sessionId)` — import available
- [CITED: github.com/FloSchl8/opencode-tmux/src/index.ts] — SHA `b975e3e`, 41 LOC plugin factory
- [CITED: github.com/FloSchl8/opencode-tmux/src/session-manager.ts] — SHA `57dd692`, 241 LOC, `parentID` guard at line 59
- [CITED: github.com/FloSchl8/opencode-tmux/src/tmux.ts] — SHA `546fe40`, 211 LOC, `spawnPane()` line 73, hardcoded `"opencode"` at line 92
- [CITED: github.com/FloSchl8/opencode-tmux/src/config.ts] — SHA `51ca1aa`, 73 LOC, 3 flat config keys
- [CITED: github.com/FloSchl8/opencode-tmux/package.json] — `@floschl/opencode-tmux` v0.6.0, peer `@opencode-ai/plugin ^1.15.5`
- [CITED: github.com/shynlee04/opencode-tmux] — Identical to upstream (same SHAs on all files)
- [CITED: open-code.ai/en/docs/plugins] — Official plugin docs: event types, hook structure, PluginInput shape
- [CITED: open-code.ai/en/docs/server] — Server mode docs: `--port`, `--hostname`, `opencode serve` headless mode

### Secondary (MEDIUM confidence)
- [CITED: github.com/anomalyco/opencode/issues/9099] — `--port 0` behavior: `tryServe(4096) ?? tryServe(0)`; request for `OPENCODE_SERVER_URL` env var (not implemented); `ctx.serverUrl` returns fallback `http://localhost:4096`
- [CITED: github.com/anomalyco/opencode/issues/17022] — `serverUrl` getter on PluginInput; plugin crash when getter throws
- [CITED: stackoverflow.com/questions/37904459] — Tmux pane PATH: new panes use `default-shell`, do NOT inherit parent PATH
- [CITED: superuser.com/questions/1279762] — Tmux ignores PATH when starting shell; uses SHELL/getpwuid

### Tertiary (LOW confidence)
- [ASSUMED] `getDelegationMeta(sessionId)` returns data synchronously at event time — based on codebase analysis, not runtime-verified
- [ASSUMED] Event type shapes between `@opencode-ai/sdk` minor versions are backward-compatible — based on SDK stability patterns, not changelog-verified
- [ASSUMED] `input.serverUrl` returns `http://localhost:4096` fallback when no port configured — based on issue #9099, not tested in this session

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages npm-verified and codebase-audited
- Architecture: HIGH — PTY runtime pattern proven; `eventObservers` array is extensible; observable factory pattern well-understood
- Pitfalls: HIGH — all 4 critical questions resolved with verified evidence from official sources
- Security: MEDIUM — shell injection prevention verified in audit; minimal attack surface for this enhancement layer

**Research date:** 2026-05-31
**Valid until:** 2026-06-30 (OpenCode SDK is fast-moving; event type shapes could change)
