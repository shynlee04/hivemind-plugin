---
name: stack-l3-bun-pty
version: 0.4.8
description: "bun-pty pseudo-terminal integration: lazy-loading patterns, signal handling, and cross-platform PTY management for Bun runtime"
category: stack
triggers:
  - bun-pty
  - pty integration
  - pseudo terminal
  - terminal integration
  - background command
  - pty spawn
  - IPty
  - IPtyForkOptions
  - IExitEvent
  - IDisposable
  - pty session
  - terminal session
  - lazy load pty
  - pty zombie process
metadata:
  consumed-by:
    - "hf-l2-tool-builder"
    - "hm-l2-researcher"
  lineage-scope: "stack"
  access: "OPEN"

---

# Stack: bun-pty

> bun-pty 0.4.x — Cross-platform pseudo-terminal (PTY) for Bun, powered by Rust's portable-pty via Bun FFI.

## ⚠️ Key Gotchas

1. **Runtime: Bun only** — uses `bun:ffi` + Rust native libs; crashes if imported in Node.js
2. **Always lazy-load** — never `import` at module top-level; use dynamic `import()` with try/catch
3. **`kill()` does NOT wait** — process may linger; check `onExit` for confirmation
4. **Signal handling differs per platform** — `IExitEvent.signal` property names vary across bun-pty versions
5. **`onData`/`onExit` return `IDisposable`** — MUST call `.dispose()` to prevent memory leaks

## Navigation

| Topic | File | What You'll Find |
|-------|------|-----------------|
| Core API | `references/api/pty-api.md` | `spawn()`, `IPty`, `IPtyForkOptions`, events |
| Lazy Loading | `references/patterns/lazy-loading.md` | Lazy import + graceful fallback pattern |
| TOC | `TOC.md` | Full table of contents |

## Quick Reference

```typescript
import { spawn } from "bun-pty"
import type { IPty, IPtyForkOptions, IExitEvent, IDisposable } from "bun-pty"
```

## Decision Tree: PTY vs Headless

```
Need interactive terminal (user sees output)? → PTY via spawn()
Need fire-and-forget command?                 → Bun.spawn() or child_process
Need streaming output capture?                → PTY with onData ring buffer
Running in non-Bun environment?               → Fallback to child_process.exec
Bun 1.3.5+ with simple terminal needs?         → Bun.spawn({ terminal }) instead
```

## Anti-Patterns

| Anti-Pattern | Why It Breaks | Correct Pattern |
|-------------|---------------|-----------------|
| Top-level `import { spawn } from "bun-pty"` | Crashes in non-Bun environments | Dynamic `const pty = await import("bun-pty")` in try/catch |
| Forgetting to `.dispose()` event subscriptions | Memory leak — `onData`/`onExit` hold references | Always dispose in `finally` block |
| Calling `kill()` without waiting for `onExit` | Zombie process — `kill()` sends signal but doesn't wait | Use `onExit` promise to confirm termination |
| Ignoring exit signal normalization | `IExitEvent` has divergent property names across versions | Use `extractExitSignal()` helper to normalize |
| Creating PTY without size limits | Ring buffer grows unbounded under high throughput | Cap buffer size; implement overflow strategy |

## Ecosystem Routing

| When working on... | Also load... | Because... |
|---------------------|--------------|------------|
| OpenCode run-background-command tool | `stack-opencode` | PTY integration via plugin hooks |
| Testing PTY code | `stack-vitest` | Mock bun-pty with null fallback pattern |
| Lifecycle gate for PTY modules | `gate-lifecycle-integration` | CQRS boundary: write-side (spawn) vs read-side (onData) |

## Migration Path

Bun 1.3.5+ has built-in `Bun.Terminal` via `Bun.spawn({ terminal })` — this may replace bun-pty for simple use cases. Keep bun-pty for advanced features (resize, bidirectional write, exit signal detail).

## Self-Correction

> Reference documents provide facts, not workflows. When facts conflict with reality, this section guides resolution.

### When Information Is Outdated
1. **Check the version in frontmatter** (currently: 0.4.8) — if the installed version differs, the reference may be stale.
2. **Consult `scripts/update.sh`** to re-fetch source when bun-pty version changes.
3. **Verify against live docs:** `npx --yes ctx7 library bun-pty "spawn API"` or search npm for `bun-pty` changelog.
4. **If Bun version ≥ 1.3.5:** Check `Bun.Terminal` availability as an alternative — the migration path may be complete before this reference is updated.

### When Unsure About API Accuracy
1. **Corroborate with source:** Read `node_modules/bun-pty/dist/index.d.ts` for exact TypeScript signatures.
2. **Check the bundled references** (`references/api/pty-api.md`) — these were extracted from source at a specific version.
3. **If the `IExitEvent` shape differs:** The signal property divergence documented here is version-specific. Normalize via the `extractExitSignal()` helper pattern.

### When the User Contradicts Reference Content
1. **Cite the source:** "This stack-bun-pty reference (v0.4.8) documents [specific claim]. If your version differs, the API may have changed."
2. **Offer verification:** Run `npx --yes bun-pty --version` to check installed version, then consult the corresponding docs.
3. **Do not override:** This is a reference document, not a workflow — user's runtime environment takes precedence.

### When an Edge Case Is Encountered
1. **Document the gap:** Missing edge cases include exit code normalization, stdin stream handling, resize events, and Unix socket compatibility.
2. **Search bundled references** (`references/`) for coverage — some edge cases may be documented at deeper levels.
3. **Escalate to skill maintainer:** If the edge case is common, file an update request with the specific scenario and expected behavior.
4. **Temporary workaround:** Use `Bun.spawn()` as a fallback for simple cases where bun-pty edge cases are unresolved.
