---
phase: 42-sidecar-foundation
artifact: summary
created: 2026-05-01
status: foundation-complete
requirements: [SIDECAR-03]
deferred_requirements: [SIDECAR-01, SIDECAR-02]
---

# Phase 42 Summary — Sidecar Foundation

## Verdict

**Foundation PR complete.** SIDECAR-03 (read-only enforcement against
canonical harness state) shipped and verified by 12 unit tests.
SIDECAR-01 (dashboard tabs) and SIDECAR-02 (OpenCode SDK bridge) are
explicitly deferred to follow-up phases per user direction.

## Deliverables

### SIDECAR-03 — Read-only enforcement against canonical state

**Module:** `src/sidecar/readonly-state.ts` (~120 LOC).

The enforcement library lives in the harness package (not in
`sidecar/`) so it is importable both by the harness itself and by the
eventual sidecar Next.js app once it is installed.

**API:**
- `isCanonicalStatePath(absolutePath, opts)` — logical containment
  check against `.hivemind/state/`, `.hivemind/event-tracker/`, and
  `.planning/` relative to the configured project root. Rejects
  `..` traversal and absolute-path escapes.
- `readCanonicalState(absolutePath, opts)` — reads UTF-8 contents
  for canonical paths; throws `[Harness] sidecar SIDECAR-03: read
  denied for non-canonical path` otherwise.
- `refuseCanonicalWrite(absolutePath, opts)` — always throws
  `[Harness] sidecar SIDECAR-03: write to canonical state forbidden`.
  Return type `never` so TypeScript narrows the call site to
  unreachable.

### Next.js scaffold (deferred-ready)

```
sidecar/
├── README.md            # documents foundation scope + deferred items
├── package.json         # declares Next.js 15 + React 19 + @json-render/react (NOT installed)
├── tsconfig.json        # Next.js-style TS config (used by future SIDECAR-01/02 phases)
├── next.config.ts       # minimal stub for Phase 42 follow-ups to extend
├── .gitignore           # ignores .next/, node_modules/, out/, *.tsbuildinfo, next-env.d.ts
└── src/
    ├── app/
    │   ├── layout.tsx   # minimal Next.js root layout stub
    │   └── page.tsx     # placeholder landing page
    └── lib/
        └── .gitkeep     # placeholder for sidecar-internal helpers
```

Next.js, React, and `@json-render/react` are **declared but not
installed** in this PR — installing them would balloon CI and is
unnecessary until SIDECAR-01/02 phases build UI. The foundation PR
ships only the directory layout + the SIDECAR-03 enforcement library.

## Path Choice — Library at `src/sidecar/`, scaffold at `sidecar/`

Splitting the enforcement library and the Next.js scaffold keeps both
responsibilities clean:

- The harness package can import `src/sidecar/readonly-state.ts`
  directly (and tests can run under root vitest) without depending on
  a not-yet-installed Next.js app.
- The eventual sidecar Next.js app (after SIDECAR-01/02) will import
  the harness package and re-export the same enforcement primitives,
  so there is exactly one source of truth for the SIDECAR-03 contract.
- The root `tsconfig.json` `include: ["src/**/*"]` already
  type-checks the enforcement library; the `sidecar/` directory's
  own `tsconfig.json` is for the Next.js compiler when SIDECAR-01/02
  phases run.

## Test Evidence

| File | Tests |
|------|-------|
| `tests/sidecar/readonly-state.test.ts` | 12 |
| **Total Phase 42 suite** | **12** |

Sub-suites:
- `isCanonicalStatePath` — 6 cases (state/, event-tracker/, planning/, src/, traversal, outside-root)
- `readCanonicalState` — 3 cases (read canonical, throw non-canonical, throw on traversal)
- `refuseCanonicalWrite` — 3 cases (throws even for canonical, throws for non-canonical, never returns)

Full repo suite after rebase onto merged Phase 39: **92 files / 1209
tests passing**, plus `npm run typecheck` and `npm run build` clean.

## Out of Scope (deferred per PLAN.md and user direction)

- **SIDECAR-01** dashboard tab rendering — needs UI design decisions,
  per-tab JSON schemas, `@json-render/react` wiring. Belongs in a
  follow-up phase.
- **SIDECAR-02** OpenCode SDK server bridge — needs SDK auth model,
  request shape, server-side proxy route. Belongs in a follow-up phase.
- **`npm install` inside `sidecar/`** — heavy dependency footprint;
  deferred until UI work begins.
- **Independent CI for sidecar** — until UI lands, the SIDECAR-03
  enforcement test runs under the root vitest config; sidecar has no
  build pipeline of its own yet.

## Gates

- `npm run typecheck` (root) — PASS
- `npm test` (root) — PASS (1209/1209)
- `npm run build` (root) — PASS
- AGENTS.md compliance — every new function JSDoc'd; module well under
  500 LOC; `[Harness]` prefix on all thrown errors; `.gitkeep` files
  for empty directories.
