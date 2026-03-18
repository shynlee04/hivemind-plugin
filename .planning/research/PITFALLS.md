# Domain Pitfalls

**Domain:** OpenCode governance plugin, runtime harness, and terminal operations dashboard
**Researched:** 2026-03-18

## Critical Pitfalls

### Pitfall 1: Orphan TUI
**What goes wrong:** The dashboard compiles, but it is not part of the real product path.
**Why it happens:** UI code was added as a spike inside `src/tui`, but package exports, scripts, and CLI entrypoints never adopted it.
**Consequences:** Maintainers believe a dashboard exists when it is really an isolated experiment.
**Prevention:** Move the dashboard into a real app boundary and wire it to shared runtime contracts and server actions.
**Detection:** Check `package.json`, CLI routes, and exports; if the dashboard is not reachable from a supported entrypoint, it is still orphaned.

### Pitfall 2: Bun/Node Runtime Collision
**What goes wrong:** The repo treats OpenTUI as if it were a normal Node dependency.
**Why it happens:** The core package is Node-based, but OpenTUI docs say Bun-only today.
**Consequences:** Tests and runtime behavior break in confusing ways.
**Prevention:** Isolate OpenTUI into a Bun-powered app package.
**Detection:** The current `tests/tui/client.test.ts` path fails under `npx tsx --test tests/tui/*.test.ts` with `ERR_UNKNOWN_FILE_EXTENSION` for OpenTUI `.scm` assets.

### Pitfall 3: Layer-First Sprawl
**What goes wrong:** One concept is split across CLI, control-plane, shared, core, hooks, commands, and tools.
**Why it happens:** The tree is optimized for file type, not capability ownership.
**Consequences:** Maintainers cannot quickly answer "where does harness live?" or "where does workflow end?"
**Prevention:** Add feature modules and keep top-level surfaces thin.
**Detection:** If tracing one behavior requires hopping across four or more top-level folders, the tree is still too scattered.

### Pitfall 4: Workflow and Trajectory Cross-Mutation
**What goes wrong:** Trajectory and workflow look separate in the tree but not in behavior.
**Why it happens:** The current code lets trajectory logic reach into workflow lifecycle concerns.
**Consequences:** Boundaries remain implicit and refactors stay risky.
**Prevention:** Give each feature a narrow API and stop direct cross-feature mutation.
**Detection:** Search for workflow mutation calls inside trajectory modules and vice versa.

### Pitfall 5: Harness Claims Without Live Proof
**What goes wrong:** The codebase claims a harness architecture is correct because local tests or build steps pass.
**Why it happens:** Live server/plugin/tool verification is slower and harder than local checks.
**Consequences:** The project can look more deterministic than it really is.
**Prevention:** Add a live-proof lane that exercises server, plugin, tools, and event streams together.
**Detection:** If a claim about harness behavior cannot cite a real OpenCode runtime path, it is not proven.

## Moderate Pitfalls

### Pitfall 1: Duplicate Dashboard Tracks
**What goes wrong:** `src/tui` and `src/dashboard-v2` both suggest dashboard ownership.
**Prevention:** Archive one path and commit to the other.

### Pitfall 2: `shared` Becoming the Real Runtime Owner
**What goes wrong:** Runtime attachment and status assembly accumulate in generic helpers.
**Prevention:** Move business ownership into `features/runtime-entry` and `features/runtime-observability`.

### Pitfall 3: God Assembly File Drift
**What goes wrong:** `opencode-plugin.ts` keeps absorbing repeated snapshot loading and orchestration details.
**Prevention:** Keep it assembly-only and push behavior into features and thin adapters.

## Minor Pitfalls

### Pitfall 1: Mock UI Data in Production Paths
**What goes wrong:** Placeholder wiki trees and hardcoded server URLs survive too long.
**Prevention:** Replace them before adding more components.

### Pitfall 2: Barrel Exports Hiding Ownership
**What goes wrong:** `src/index.ts` re-exports broad surfaces and makes everything feel globally reachable.
**Prevention:** Prefer narrower exports at feature boundaries.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| TUI runtime foundation | Orphan TUI and Bun/Node mismatch | Extract dashboard into a real Bun app and wire shared contracts first |
| Runtime-entry consolidation | More glue landing in `shared` | Move ownership directly into `features/runtime-entry` |
| Workflow/trajectory refactor | Hidden cross-feature mutations survive the rename | Refactor behavior boundaries, not just folders |
| Observability layer | Dashboard starts reading raw events directly | Introduce reduced view models before new panels |
| Harness hardening | Live proof is deferred again | Make live verification a release gate |

## Sources

- OpenTUI docs - https://opentui.com/docs/getting-started - HIGH
- Local evidence: `package.json`, `src/tui/Dashboard.tsx`, `src/tui/client.ts`, `tests/tui/client.test.ts`, `src/cli/harness.ts`, `src/control-plane/control-plane-handler.ts`, `src/shared/runtime-attachment.ts`, `src/core/trajectory/trajectory-store.ts` - HIGH
- OpenAI harness engineering - https://openai.com/index/harness-engineering/ - HIGH
- Anthropic harness guidance - https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents - HIGH
