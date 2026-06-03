# Lazy Loading Pattern

> Stack: bun-pty | Updated: 2026-04-28

## Why Lazy-Load

`bun-pty` uses `bun:ffi` and Rust native binaries. It will throw at import time in non-Bun environments (Node.js, Deno, browsers). The harness must support:

1. Running under Node.js for testing
2. Graceful degradation when PTY is unavailable
3. Zero runtime crashes from missing native binaries

## Pattern

### Plugin Composition Root

The harness resolves `PtyManager | null` at plugin startup:

```typescript
// src/plugin.ts (composition root)
let ptyManager: PtyManager | null = null

try {
  const { PtyManager } = await import("./lib/pty/pty-manager.js")
  const candidate = new PtyManager()
  if (candidate.isSupported()) {
    ptyManager = candidate
  }
} catch {
  // bun-pty not available (non-Bun runtime, missing binaries)
  ptyManager = null
}
```

### Runtime Detection

`PtyManager.isSupported()` performs two checks:

```typescript
isSupported(): boolean {
  return typeof spawn === "function" && "Bun" in globalThis
}
```

- `typeof spawn === "function"` — module loaded successfully
- `"Bun" in globalThis` — running in Bun runtime

Both must be true for PTY support.

### Tool-Level Null Check

Tools that use PTY receive `PtyManager | null` and check at runtime:

```typescript
export function createRunBackgroundCommandTool(args: {
  delegationManager: DelegationManager
  ptyManager: PtyManager | null  // nullable
}): ReturnType<typeof tool> {
  // ...
  if (!args.ptyManager) {
    return error("[Harness] PTY not available in current environment")
  }
  // ... safe to use args.ptyManager
}
```

## Rules

1. **Never** `import { spawn } from "bun-pty"` at module top-level in any file that could be imported by Node.js
2. **Always** check `ptyManager !== null` before using PTY features
3. **Always** wrap dynamic import in try/catch
4. **Return** meaningful error messages when PTY is unavailable — not silent failures
5. The `pty-manager.ts` module itself DOES import `bun-pty` directly because it is only ever dynamically imported when PTY is available

## Flow Diagram

```
plugin.ts startup
  ├── try: import("./lib/pty/pty-manager.js")
  │   ├── success → new PtyManager() → isSupported()?
  │   │   ├── yes → ptyManager = instance
  │   │   └── no  → ptyManager = null
  │   └── failure (import throws) → ptyManager = null
  └── createRunBackgroundCommandTool({ ptyManager })
      ├── ptyManager !== null → full PTY support
      └── ptyManager === null → stub responses with error messages
```

## Testing Implication

Under `vitest` (Node.js), `ptyManager` will always be `null`. Tests for PTY-dependent code must mock the `PtyManager` interface or test only the null-path behavior.
