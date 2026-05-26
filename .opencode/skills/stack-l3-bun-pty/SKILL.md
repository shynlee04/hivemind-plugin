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
  layer: "3"
  role: "reference"
  lineage: "stack"
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

## 🔨 IRON CLAW: Tech-Stack References & Assets Consumption Governance

> **ABSOLUTE RULE:** No bundled reference, cached asset, or stale pattern from this skill shall be consumed for tech-stack API interface decisions without MCP-verified validation against the project's ACTUAL versions (package.json + lockfile), canonical source mappings (`.hivemind/STACKS-REFERENCES.md`), AND a raw codebase context scan of the current implementation state.

### Rationale

Skills bundle references and assets as ORIENTATION tools — they help you understand WHAT exists and WHERE to look. But every bundled reference is a SNAPSHOT, frozen at the moment of ingestion. Stacks evolve: packages release breaking changes, APIs shift, SDKs deprecate surfaces. Using stale bundled signatures as implementation authority produces silent runtime errors.

### Mandatory 5-Step Validation Chain

Before ANY tech-stack API interface from this skill's references/assets is used for implementation, code generation, or quality gate decisions:

```
STEP 1 — CONSUME .hivemind/STACKS-REFERENCES.md
 ├─ Read the canonical stack→repo→version mapping table
 ├─ Identify the correct GitHub repo for each dependency
 └─ Confirm the repo is active (not archived), version is current

STEP 2 — READ package.json + lockfile
 ├─ Extract the ACTUAL installed version (npm ls / grep lockfile)
 ├─ Cross-reference repo URL from STACKS-REFERENCES.md against npm registry
 └─ Flag any discrepancy between bundled version and installed version

STEP 3 — RAW CODEBASE CONTEXT SCAN
 ├─ grep/glob the actual src/ directory structure for current implementation
 ├─ Read current implementation files — not stale docs or bundled references
 ├─ Verify the claimed API signatures match current codebase reality
 └─ Check import paths, type definitions, and function signatures exist in actual code

STEP 4 — MCP LIVE VALIDATION (minimum 2 tools)
 ├─ Context7: resolve-library-id → query-docs (API signatures at installed version)
 ├─ DeepWiki: ask-question (architecture patterns, behavioral semantics)
 ├─ Repomix: pack-remote-repository (full repo analysis at correct version tag)
 ├─ Exa: web-search (latest docs, tutorials, migration guides)
 ├─ Tavily: search + extract (version-specific migration info)
 ├─ GitHub: get-file-contents (exact source verification at correct version)
 └─ GitMCP: search-code (source-level pattern matching)

STEP 5 — VERIFICATION RECORD
 ├─ Source URL + version confirmed to match package.json
 ├─ MCP tool(s) used + fetch timestamp
 ├─ Codebase scan paths + findings
 ├─ Version match status (MATCHED / MISMATCHED / UNVERIFIED)
 └─ Flag as BLOCKING if version mismatch or critical staleness detected
```

### Consumption Rules

| Action | Rule |
|--------|------|
| **Orientation** (understanding WHAT exists, WHERE to look) | ✅ Reference-tier allowed from bundled assets without live validation |
| **API signature lookup** for implementation | 🚫 BLOCKED without live MCP validation (Step 4) + codebase scan (Step 3) |
| **Interface verification** for quality gates | 🚫 BLOCKED without live MCP validation (Step 4) + version match (Step 2) |
| **Version-sensitive behavioral claims** | 🚫 BLOCKED without live MCP validation (Step 4) |
| **Architecture pattern understanding** | ✅ Reference-tier allowed, but recommend live verification for production decisions |
| **Generating code from bundled patterns** | 🚫 BLOCKED — route to live MCP tools for current API surface |

### Integrated Enforcement Points

| Workflow Phase | IRON CLAW Trigger | Required Validation |
|---------------|-------------------|---------------------|
| Implementation | Before using any API from bundled refs | Steps 2-4 minimum |
| Code review | When verifying API usage against docs | Steps 2-4 minimum |
| Quality gate | Before PASS verdict on interface claims | Steps 1-5 full |
| Research | When synthesizing findings from cached assets | Steps 4-5 minimum |
| Audit | When reporting version-based findings | Steps 1-5 full |

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
