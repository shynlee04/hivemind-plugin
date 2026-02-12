# Research: Phase 01 - SDK Foundation + System Core

## Overview

This phase establishes the "Materialization Layer" — the bridge between the pure core logic (`src/lib`) and the OpenCode environment. The goal is to wire the SDK client, BunShell, and other context objects into the plugin safely, enabling all downstream features (Session Management, TUI, Events) while maintaining a strict boundary and preventing initialization deadlocks.

## Standard Stack

The OpenCode SDK provides the following standard objects which must be captured and made available:

- **`@opencode-ai/sdk`**: The primary client for interacting with the OpenCode server (sessions, messages, files).
- **`@opencode-ai/plugin`**: The plugin framework types and utilities.
- **`BunShell`**: The shell execution environment provided by the plugin host (aliased as `$`).
- **`Project`**: The current project context.
- **`serverUrl`**: The URL of the OpenCode server.

## Architecture Patterns

### 1. Module-Level Singleton (The "Context Bridge")

Instead of prop-drilling the `client` object through every function, or relying on global state that might be uninitialized, we use a **Module-Level Singleton** pattern restricted to `src/hooks/sdk-context.ts`.

- **Concept**: A dedicated module that holds the references to `client`, `$`, `serverUrl`, and `project`.
- **Initialization**: A setter function (`initSdkContext`) called *once* at the plugin entry point (`src/index.ts`).
- **Access**: Getter functions (`getClient`, `getShell`, etc.) exported for use by hooks and tools.
- **Safety**: The getters return the stored reference (or null), decoupling the *availability* of the client from the *initialization* of the module.

**Why this pattern?**
- **Lifecycle Management**: The `client` is passed *into* the plugin factory, so it's not available at module import time. The singleton allows us to capture it when the plugin starts and make it available to tools/hooks that execute *later*.
- **Deadlock Prevention**: It allows us to store the reference *without* calling any methods on it during initialization.

### 2. Graceful Fallback (`withClient`)

To support filesystem-only modes or scenarios where the SDK is unavailable (e.g., testing, or stripped-down environments), all SDK usage must be wrapped in a graceful fallback mechanism.

- **Pattern**: `withClient<T>(fn: (client) => Promise<T>, fallback?: T)`
- **Behavior**:
  - Checks if `client` is available.
  - If yes: Executes `fn(client)` wrapped in a try/catch block (to handle transient SDK errors).
  - If no (or error): Returns `fallback` or `undefined`.
- **Benefit**: This allows the core logic to remain agnostic to the presence of the SDK. Features like "show toast" or "export session" simply become no-ops if the SDK is missing, rather than crashing the plugin.

### 3. Separation of Concerns (`src/lib` vs `src/hooks`)

- **`src/lib/`**: **PURE**. Contains core logic, state management, and algorithms.
  - **Constraint**: MUST NOT import `@opencode-ai/sdk` or `@opencode-ai/plugin`.
  - **Goal**: Portable, testable, and independent of the OpenCode runtime.
- **`src/hooks/`**: **IMPURE/ADAPTER**. Contains the integration code.
  - **Role**: Imports `@opencode-ai/*`.
  - **Responsibility**: Wires the pure logic to the SDK (e.g., triggering a "save" in `src/lib` and then sending a "toast" via `client.tui`).
  - **Dependencies**: Imports `sdk-context.ts` to access the client.

## Don't Hand-Roll

- **SDK Client Logic**: Never attempt to manually construct HTTP requests to the OpenCode server. Always use the provided `client` instance.
- **Shell Execution**: Do not use Node's `child_process` directly if `BunShell` (`$`) is available. The injected shell often has correct environment variables and context for the plugin.
- **Event Bus**: Do not create a custom event emitter for OpenCode events. Use `client.event.subscribe()` (in Phase 2) to tap into the official event stream.

## Common Pitfalls

### 1. The Initialization Deadlock (Critical)

- **The Issue**: Calling `await client.session.list()` (or any async SDK method) directly inside the plugin's `init` function (the one passed to `HiveMindPlugin`).
- **The Cause**: The OpenCode server waits for the plugin to initialize before fully starting. If the plugin waits for the server to respond (via the client) during initialization, a deadlock occurs.
- **The Fix**: **NEVER** call `client.*` methods in the top-level `HiveMindPlugin` function. Only **store** the reference. Call methods only inside `tool.execute`, `hook.execute`, or other event handlers which run *after* initialization is complete.

### 2. Race Conditions in Singleton Access

- **The Issue**: A tool or hook trying to use `getClient()` before `initSdkContext()` has finished.
- **Mitigation**: Since `initSdkContext` is synchronous (it just assigns variables) and is called at the very beginning of `HiveMindPlugin`, and tools/hooks are registered *after* that (in the return object), the risk is minimal. However, `getClient()` returns `null` if not initialized, forcing consumers to handle the "not ready" state (usually via `withClient`).

## Code Examples

### 1. `src/hooks/sdk-context.ts` (The Singleton)

```typescript
import type { OpencodeClient, Project } from "@opencode-ai/sdk"
import type { PluginInput, BunShell } from "@opencode-ai/plugin"

let _client: OpencodeClient | null = null
let _shell: BunShell | null = null
let _serverUrl: URL | null = null
let _project: Project | null = null

export function initSdkContext(input: Pick<PluginInput, 'client' | '$' | 'serverUrl' | 'project'>) {
  _client = input.client
  _shell = input.$
  _serverUrl = input.serverUrl
  _project = input.project
  // Log usage here if needed, but DO NOT await client calls
}

export function getClient(): OpencodeClient | null {
  return _client
}

// ... getters for others ...

export async function withClient<T>(
  fn: (client: OpencodeClient) => Promise<T>,
  fallback?: T
): Promise<T | undefined> {
  if (!_client) return fallback
  try {
    return await fn(_client)
  } catch (err) {
    // Log error safely
    return fallback
  }
}
```

### 2. Wiring in `src/index.ts`

```typescript
export const HiveMindPlugin: Plugin = async ({
  directory,
  worktree,
  client,
  $: shell, // Alias because '$' is awkward
  serverUrl,
  project
}) => {
  // 1. Initialize Context (Sync, No Side Effects)
  initSdkContext({ client, $: shell, serverUrl, project })

  // 2. Setup Logger & Config
  const effectiveDir = worktree || directory
  // ...

  return {
    // ... tools and hooks ...
  }
}
```

### 3. Usage in a Tool/Hook

```typescript
import { withClient } from "./sdk-context.js"

// Inside a hook or tool execution
await withClient(async (client) => {
  await client.tui.showToast({
    title: "Drift Detected",
    message: "You are straying from the plan.",
    type: "warning"
  })
})
```

## TUI Capabilities (Previous Research)

- **Available**: `showToast()`, `appendPrompt()`, `submitPrompt()`, `clearPrompt()`, built-in dialog openers (`openHelp`, `openSessions`, etc.).
- **Not Available**: Custom panels (`registerPanel`), custom tabs, embedded components.
- **Decision**: Use `showToast()` for Phase 2 governance feedback. Defer embedded dashboard to v2.

