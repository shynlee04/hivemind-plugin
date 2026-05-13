# Sidecar — Phase 42 Foundation

This directory holds the artifact-focused sidecar dashboard scaffold per
the V3 Q2 architectural decision (Next.js + `@json-render/react`).

## What ships in this foundation PR

**SIDECAR-03 only** — read-only enforcement against canonical harness
state (`.hivemind/state/`, `.planning/`). `.hivemind/event-tracker/` removed in CP-ST-03.

The actual enforcement library lives at
`../src/sidecar/readonly-state.ts` because it must be importable by
both the harness package and the eventual sidecar Next.js app. Tests
live at `../tests/sidecar/readonly-state.test.ts` and run under the
root vitest config.

This `sidecar/` directory itself contains the **directory scaffold and
deferred-ready package metadata** — Next.js, React, and
`@json-render/react` are declared as dependencies in `package.json`
but **not installed in this PR**. Future SIDECAR-01/02 phases will
run `npm install` here when UI work begins.

## Deferred to follow-up phases

- **SIDECAR-01** — dashboard tab rendering. Needs UI design decisions,
  per-tab JSON schemas, and `@json-render/react` wiring.
- **SIDECAR-02** — OpenCode SDK server bridge. Needs SDK auth model,
  request shape, and a server-side proxy route.
- **`npm install`** inside this directory — heavy install footprint;
  deferred until UI work begins.
- **Independent CI** — until UI lands, the sidecar has no build
  pipeline of its own; the SIDECAR-03 enforcement test runs under the
  root vitest config.

## Read-only contract

The sidecar **must never** write to harness canonical state. The
contract is enforced by three exports of `readonly-state.ts`:

| Export | Purpose |
|--------|---------|
| `isCanonicalStatePath(p, opts)` | Tests whether a path is inside `.hivemind/state/` or `.planning/` relative to the project root. |
| `readCanonicalState(p, opts)` | Reads a file under a canonical surface. Throws `[Harness]` SIDECAR-03 for any path outside the canonical surface. |
| `refuseCanonicalWrite(p, opts)` | Always throws `[Harness]` SIDECAR-03. Use as a guard at any call site that should be unreachable in a read-only sidecar. |

Path containment is checked logically (`path.relative()` followed by
`..` rejection) so the guard does not require canonical directories to
exist on disk and cannot be bypassed via traversal or absolute-path
escapes.
