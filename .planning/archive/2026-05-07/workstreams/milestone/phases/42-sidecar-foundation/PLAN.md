---
phase: 42-sidecar-foundation
artifact: plan
created: 2026-05-01
requirements: [SIDECAR-03]
deferred_requirements: [SIDECAR-01, SIDECAR-02]
---

# Phase 42 Plan — Sidecar Foundation (Foundation-Only Scope)

## Approach

Scoped to the **foundation PR** per user direction:
> "Scaffold just the read-only Next.js skeleton + SIDECAR-03 enforcement test as a foundation PR, deferring the dashboard tabs / OpenCode SDK bridge / @json-render/react integration to follow-up phases."

The foundation PR ships:
1. **Directory scaffold** for the Next.js 15 sidecar at `sidecar/` (separate from the harness `src/` so build, type-check, and test surfaces stay independent).
2. **SIDECAR-03 enforcement layer** — a pure TypeScript module (`sidecar/src/lib/readonly-state.ts`) that wraps file-system access against `.hivemind/state/` and `.planning/` and throws on any write. This is the **actual contract** SIDECAR-03 demands; the Next.js layer will consume it later.
3. **Conformance tests** that exercise both the reader (allow) and writer guards (reject) for the enforcement module.
4. **Out-of-scope markers** in `sidecar/README.md` so future phases know what's deliberately deferred.

The Next.js dependencies are **declared in `sidecar/package.json` but not installed** in this PR — installing Next.js + React + @json-render/react would balloon CI and is unnecessary until SIDECAR-01/02 actually render anything. Future phases will run `npm install` inside `sidecar/`.

## Requirement Tree

### SIDECAR-03 — Read-only enforcement against canonical state

**Module:** `sidecar/src/lib/readonly-state.ts` (~150 LOC).

**API:**

```ts
export type ReadOnlyStateOptions = {
  /** Absolute path to the project root. */
  projectRoot: string
}

/**
 * Returns true if the given absolute path lies inside the canonical
 * state surfaces (.hivemind/state/, .hivemind/event-tracker/,
 * .planning/) relative to the configured project root.
 */
export function isCanonicalStatePath(absolutePath: string, opts: ReadOnlyStateOptions): boolean

/**
 * Read the contents of a file under the canonical state surface.
 * Returns the file's UTF-8 contents. Throws [Harness] error if the
 * path is outside the canonical surface.
 */
export function readCanonicalState(absolutePath: string, opts: ReadOnlyStateOptions): string

/**
 * SIDECAR-03 enforcement: throws an unrecoverable [Harness] error.
 * The sidecar is permanently read-only; this guard exists so any
 * accidental call from sidecar code surfaces immediately rather than
 * silently corrupting state.
 */
export function refuseCanonicalWrite(absolutePath: string, opts: ReadOnlyStateOptions): never
```

**Behaviour:**
- `isCanonicalStatePath` resolves `absolutePath` and checks if the resolved path is contained within `${projectRoot}/.hivemind/` (state, event-tracker) or `${projectRoot}/.planning/`. Path containment is checked with `path.relative()` and `..` rejection so symlinks don't bypass the guard.
- `readCanonicalState` reads the file with `fs.readFileSync` and `utf8` encoding. Outside-canonical-surface paths throw `[Harness] sidecar SIDECAR-03: read denied for non-canonical path`.
- `refuseCanonicalWrite` always throws `[Harness] sidecar SIDECAR-03: write to canonical state forbidden — sidecar is read-only`.

### Directory scaffold (deferred-ready)

```
sidecar/
├── README.md                    # explains scope + deferred items
├── package.json                 # declares Next.js 15 + @json-render/react (not installed here)
├── tsconfig.json                # extends parent strict config
├── next.config.ts               # minimal Next.js config stub
├── src/
│   ├── app/
│   │   ├── layout.tsx           # minimal stub, defers UI to SIDECAR-01
│   │   ├── page.tsx             # minimal stub, defers UI to SIDECAR-01
│   │   └── .gitkeep
│   └── lib/
│       ├── .gitkeep
│       └── readonly-state.ts    # SIDECAR-03 enforcement
└── .gitkeep
```

`.gitkeep` files registered per AGENTS.md folder-tracking rule.

## Test Strategy (TDD, RED→GREEN)

| Test file | Coverage |
|-----------|----------|
| `tests/sidecar/readonly-state.test.ts` | (1) `isCanonicalStatePath` returns true for `.hivemind/state/foo.json`, true for `.planning/x.md`, true for `.hivemind/event-tracker/y.md`, false for `src/` paths, false for `..` traversal, false for absolute paths outside project root; (2) `readCanonicalState` returns file contents for canonical paths, throws `[Harness]` on non-canonical; (3) `refuseCanonicalWrite` always throws `[Harness] sidecar SIDECAR-03`. |

Test fixture uses `os.tmpdir()` so it doesn't pollute the real `.hivemind/` directory.

## Out of Scope (deliberately deferred — separate phases)

- **SIDECAR-01 dashboard tabs** — needs UI design decisions, JSON schemas for each tab, and `@json-render/react` wiring. Belongs in a follow-up phase.
- **SIDECAR-02 OpenCode SDK bridge** — needs SDK auth model, request shape, and a server-side proxy route. Belongs in a follow-up phase.
- **`npm install` inside sidecar/** — Next.js + React + @json-render/react are heavy installs; deferred until UI work begins.
- **CI for sidecar** — until UI lands, sidecar has no build/test pipeline of its own; the SIDECAR-03 enforcement test runs under the root vitest config.

## Gates

- `npm run typecheck` (root) — clean
- `npm test` (root) — all 1196+ tests must pass plus SIDECAR-03 (estimated +6 tests)
- `npm run build` (root) — clean
- AGENTS.md compliance: every new function JSDoc'd; modules well under 500 LOC; `[Harness]` prefix on all thrown errors; `.gitkeep` files for every empty directory.
- Sidecar's own package.json/tsconfig.json/next.config.ts are static scaffolds; no install/build is run for them in this PR.

## Risk Notes

- **Symlink bypass** — path containment uses `path.relative()` followed by `startsWith('..')` rejection, which protects against `../` traversal and absolute-path escapes. We do NOT call `fs.realpath()` because that would require all canonical paths to exist on disk; the enforcement is logical not realpath-based, which is what the user-facing surface actually needs.
- **Fixture cleanup** — every test creates a fresh tmp dir and removes it in `afterEach`; no global state leakage.
