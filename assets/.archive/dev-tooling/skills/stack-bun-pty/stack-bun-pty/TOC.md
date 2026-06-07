# Table of Contents — stack-bun-pty

> Generated: 2026-04-28 | Package: bun-pty 0.4.x

## API Reference

### `references/api/pty-api.md`
- `spawn()` — Create and spawn a new pseudoterminal
- `IPty` interface — Process handle with event subscriptions
- `IPtyForkOptions` — Spawn configuration (name, cols, rows, cwd, env)
- `IExitEvent` — Exit event payload (exitCode, signal)
- `IDisposable` — Subscription disposal handle
- `IPty.onData()` — Subscribe to stdout/stderr output
- `IPty.onExit()` — Subscribe to process exit
- `IPty.write()` — Write to process stdin
- `IPty.kill()` — Terminate the child process
- `IPty.resize()` — Resize the terminal dimensions
- `IPty.pid` — OS process ID (read-only)

## Patterns

### `references/patterns/lazy-loading.md`
- Why lazy-load bun-pty
- Dynamic import pattern with try/catch
- Graceful fallback stub interface
- Plugin.ts composition root pattern
- Runtime detection (`typeof spawn === "function" && "Bun" in globalThis`)

### `references/patterns/harness-integration.md`
- PtyManager class architecture
- PtyBuffer ring-buffer output capture
- PtySpawnRequest / PtySessionRecord / PtyReadResult types
- run-background-command tool integration
- DelegationManager dispatch flow for PTY commands
- Session visibility and access control
- Cancellation lifecycle

## Roles

### `references/roles/architect.md`
- When to use PTY vs headless execution
- Bun.Terminal migration path (Bun 1.3.5+)
- Concurrency model for PTY sessions
- Memory management and buffer sizing

### `references/roles/test-developer.md`
- Testing with mock PTY
- Testing PtyManager without Bun runtime
- Testing buffer truncation behavior
- Integration test patterns for run-background-command

### `references/roles/production-manager.md`
- Prebuilt binary compatibility
- ARM64 support matrix
- Memory limits and buffer overflow handling
- Process leak detection

### `references/roles/gatekeeper.md`
- Quality gates for PTY code changes
- Required error handling patterns
- Lazy-loading compliance checks
- Max module size enforcement (500 LOC)

## Scripts

### `scripts/update.sh`
- Refresh skill from latest bun-pty docs
