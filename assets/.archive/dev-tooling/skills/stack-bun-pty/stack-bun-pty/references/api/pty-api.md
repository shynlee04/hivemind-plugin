# bun-pty API Reference

> Stack: bun-pty | Version: 0.4.x | Updated: 2026-04-28

## Overview

`bun-pty` provides cross-platform pseudo-terminal (PTY) support for the Bun runtime. It uses Rust's `portable-pty` library compiled to native code, accessed via Bun's FFI capabilities.

**Package:** `bun-pty` (original) or `@zenyr/bun-pty` (fork with ARM64 support)
**Runtime requirement:** Bun (uses `bun:ffi`)
**Platforms:** macOS (x64 + ARM64), Linux (x64 + ARM64), Windows

---

## `spawn(file, args, options): IPty`

Creates and spawns a new pseudoterminal process.

```typescript
import { spawn } from "bun-pty"

const pty = spawn("bash", [], {
  name: "xterm-256color",
  cols: 80,
  rows: 24,
  cwd: process.cwd(),
  env: process.env as Record<string, string>,
})
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `file` | `string` | Path or name of the executable to spawn |
| `args` | `string[]` | Positional arguments to the executable |
| `options` | `IPtyForkOptions` | Terminal and environment configuration |

---

## `IPtyForkOptions`

Configuration object for PTY spawn.

```typescript
interface IPtyForkOptions {
  /** Terminal type (e.g., "xterm-256color", "xterm") */
  name?: string
  /** Initial column width (default: 80) */
  cols?: number
  /** Initial row height (default: 24) */
  rows?: number
  /** Working directory for the child process */
  cwd?: string
  /** Environment variables forwarded to the child */
  env?: Record<string, string>
}
```

---

## `IPty` Interface

The process handle returned by `spawn()`.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `pid` | `number` | OS process ID of the child (read-only) |

### Methods

#### `onData(callback): IDisposable`

Subscribe to stdout/stderr output from the child process.

```typescript
const subscription = pty.onData((data: string) => {
  process.stdout.write(data)
})

// Later: dispose to stop receiving events
subscription.dispose()
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `callback` | `(data: string) => void` | Called with each output chunk |
| **Returns** | `IDisposable` | Subscription handle with `dispose()` method |

#### `onExit(callback): IDisposable`

Subscribe to process exit events.

```typescript
const exitSub = pty.onExit((event: IExitEvent) => {
  console.log(`Exit code: ${event.exitCode}`)
})
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `callback` | `(event: IExitEvent) => void` | Called when process exits |
| **Returns** | `IDisposable` | Subscription handle with `dispose()` method |

#### `write(data: string): void`

Write data to the child process stdin.

```typescript
pty.write("ls -la\n")
```

#### `kill(): void`

Terminate the child process. Sends SIGKILL on POSIX systems.

```typescript
pty.kill()
```

#### `resize(cols: number, rows: number): void`

Resize the terminal dimensions. The child process receives SIGWINCH.

```typescript
pty.resize(120, 40)
```

---

## `IExitEvent`

Event payload delivered by `onExit()`.

```typescript
interface IExitEvent {
  /** Process exit code (0 = success) */
  exitCode: number
  /** Signal that caused termination (platform-dependent name) */
  signal?: number | string
  /** Alias for signal (some versions) */
  signalCode?: number | string
  /** Human-readable signal name (some versions) */
  signalName?: string
}
```

**Signal extraction note:** The harness uses `extractExitSignal()` in `pty-manager.ts` to normalize signal across `event.signal`, `event.signalCode`, and `event.signalName` fields, since different bun-pty versions expose different property names.

---

## `IDisposable`

Subscription handle returned by `onData()` and `onExit()`.

```typescript
interface IDisposable {
  /** Unsubscribe from the event and release resources */
  dispose(): void
}
```

---

## Type Imports

```typescript
import type { IPty, IPtyForkOptions, IExitEvent, IDisposable } from "bun-pty"
```

All types are exported as TypeScript interfaces from the package.

---

## Platform Notes

| Platform | Binary | Notes |
|----------|--------|-------|
| macOS x64 | `*.dylib` | Fully supported |
| macOS ARM64 | `*.dylib` | Supported in `@zenyr/bun-pty` fork v0.3.3+ |
| Linux x64 | `*.so` | Fully supported |
| Linux ARM64 | `*.so` | Supported in fork v0.3.3+ |
| Windows | `*.dll` | Fully supported |

**Bun 1.3.5+ alternative:** Bun now has built-in `Bun.spawn({ terminal })` with `Bun.Terminal` API. This is the future migration path away from `bun-pty`. The built-in API provides `write()`, `resize()`, `setRawMode()`, `ref()`/`unref()`, and `close()`.
