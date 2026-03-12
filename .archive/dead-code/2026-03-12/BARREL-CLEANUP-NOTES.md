# Barrel Cleanup Notes — 2026-03-12

## What happened

The `src/lib/index.ts` barrel file contained 32 wildcard `export *` re-exports
(e.g., `export * from "./logging.js"`). After import tracing across all `src/`,
`tests/`, and `.opencode/` files, **zero consumers** were found that import
through the barrel. Every consumer uses direct imports like:

```typescript
import { getEffectivePaths } from "./paths.js"     // not from "../lib"
import { createLogger } from "./lib/logging.js"     // not from "./lib"
```

The barrel was pure dead weight — it existed only to be built by `tsc` into
`dist/lib/index.js`, where it was also unused.

## Previous barrel contents (32 modules)

| Module | Direct consumers | Verdict |
|--------|-----------------|---------|
| `logging` | 39 files | Used directly, barrel redundant |
| `persistence` | 63 files | Used directly, barrel redundant |
| `hierarchy-tree` | 30 files | Used directly, barrel redundant |
| `state-mutation-queue` | 22 files | Used directly, barrel redundant |
| `tool-response` | 18 files | Used directly, barrel redundant |
| `detection` | 10 files | Used directly, barrel redundant |
| `anchors` | 10 files | Used directly, barrel redundant |
| `event-bus` | 6 files | Used directly, barrel redundant |
| `tool-names` | 6 files | Used directly, barrel redundant |
| `chain-analysis` | 5 files | Used directly, barrel redundant |
| `staleness` | 5 files | Used directly, barrel redundant |
| `sdk-access` | 5 files | Used directly, barrel redundant |
| `context-purifier` | 3 files | Used directly, barrel redundant |
| `cognitive-packer` | 3 files | Used directly, barrel redundant |
| `framework-context` | 4 files | Used directly, barrel redundant |
| `long-session` | 4 files | Used directly, barrel redundant |
| `session-intent-classifier` | 4 files | Used directly, barrel redundant |
| `auto-commit` | 2 files | Used directly, barrel redundant |
| `commit-advisor` | 2 files | Used directly, barrel redundant |
| `complexity` | 2 files | Used directly, barrel redundant |
| `compaction-engine` | 2 files | Used directly, barrel redundant |
| `session-export` | 2 files | Used directly, barrel redundant |
| `session-coherence-types` | 2 files | Used directly, barrel redundant |
| `watcher` | 2 files | Used directly, barrel redundant |
| `gatekeeper` | 2 files | Used directly, barrel redundant |
| `planning-fs` | 2+ files | Used directly, barrel redundant |
| `inspect-engine` | 1 file | Used directly, barrel redundant |
| `session-swarm` | 1 file | Used directly, barrel redundant |
| `skill-registry` | 1 file | Used directly, barrel redundant |
| `migrate` | 1 lib-internal | Used directly, barrel redundant |
| `sot-governance` | _via barrel entry only_ | Needed, but consumers use direct imports |
| `planning-materializer` | _via barrel entry only_ | Test-only consumer, uses direct imports |

## Feature-similarity recommendations

When revisiting these modules for consolidation (Tranche 3), note these overlaps:

1. **`session-export.ts`** ↔ **`compaction-engine.ts`**: Both produce session output/archive data.
   `compaction-engine` is the richer implementation (449 lines, hierarchy-aware). If consolidating,
   merge `session-export` utilities into `compaction-engine` or a new `session-archive.ts`.

2. **`sot-governance.ts`** ↔ **`gatekeeper.ts`**: Both enforce governance checks.
   `sot-governance` handles pending-change queuing/verification (CQRS pattern).
   `gatekeeper` does quick gate-checks. They're complementary but could share a namespace.

3. **`planning-materializer.ts`** ↔ **`planning-fs.ts`** ↔ **`plan-fs.ts`**: Triple planning split.
   `planning-materializer` writes to `STATE.md`/`PROJECT.md`/`ROADMAP.md` via doc-intel.
   `planning-fs` handles `active.md`/archives. `plan-fs` handles plan-node CRUD.
   Consolidation target: merge into `planning-core.ts` in Tranche 3.

4. **`session-intent-classifier.ts`** ↔ (archived) **`session-memory-classifier.ts`**: Both use
   keyword→score→classify pattern. If reviving memory classification, merge into intent classifier.

5. **`skill-registry.ts`** ↔ **`skill-loader.ts`**: Registry resolves skill paths, loader reads
   and parses YAML frontmatter. Feature-superior: `skill-loader` (more complete). Consider
   absorbing path-resolution from `skill-registry` into `skill-loader`.
