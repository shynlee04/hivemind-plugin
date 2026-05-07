# Bootstrap CLI — Grey Areas & Decision Matrix

**Date:** 2026-05-07 | **Status:** AWAITING USER DECISIONS
**Evidence:** L5 — docs-only. All decisions below require explicit authorization before BOOT-02 begins.

**Phase 0 supersession note:** Older examples using `opencode-harness` are legacy alias examples. Canonical package/bin naming is `hivemind` per `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md`.

---

## Decision 1: CLI Framework — Router vs. Commander

| # | Option | Description | Risk |
|---|--------|-------------|------|
| **1A** | **Keep Phase 40 router** | Build `init`/`doctor`/`recover` as `CliCommand` handlers on the existing framework-free router. Add `@clack/prompts` within handlers for interactive mode. | Lower dependency bloat. Router is already tested and follows `[Harness]` error policy. |
| **1B** | **Migrate to commander** | Replace the custom router with commander. Add subcommands, option parsing, help generation from commander. | Increases bin-surface dependency surface. Custom error policy lost. Need to wrap commander errors with `[Harness]` prefix. |
| **1C** | **Hybrid** | Keep router for simple commands (`help`, `doctor` built-in). Use commander as a separate entry for complex commands (`init` with wizard). | Two dispatch paths to maintain. Complexity for marginal gain. |

**Recommendation: 1A** — The existing router is clean, tested, and follows Hivemind conventions. `@clack/prompts` can be loaded lazily within the `init` handler for interactive mode. Remove `commander` from package.json or mark as `@future-use`.

---

## Decision 2: Interactive vs. Non-Interactive Init

| # | Option | Description |
|---|--------|-------------|
| **2A** | **Default non-interactive** | `npx hivemind init` runs silently with defaults. `npx hivemind init --interactive` enables the wizard. |
| **2B** | **Always interactive** | Always launches `@clack/prompts` wizard. |
| **2C** | **CI-aware** | Detect CI/TTY. Non-interactive in CI (exit with error if required fields missing). Interactive when TTY present. |

**Recommendation: 2C** — Follows ecosystem patterns (DCP checks environment). `--yes`/`--force` flags for scripted use.

---

## Decision 3: `.hivemind/` Structure — Minimal vs. Full

| # | Option | Description |
|---|--------|-------------|
| **3A** | **Minimal** | Create only `state/` subdirectory with `session-continuity.json` and `delegations.json`. Add others lazily as tools write to them. |
| **3B** | **Full skeleton** | Create all 19 subdirectories with `.gitkeep` at init time. Typed CRUD modules per subdirectory. |
| **3C** | **Tiered** | Tier 1 (always): `state/`, `event-tracker/`. Tier 2 (on first use): `planning/`, `trajectory/`, `journals/`. Tier 3 (deferred): vector/graph memory. |

**Recommendation: 3C** — Bootstrap only what's immediately needed. D-CRUD-05 (typed ownership) can be deferred until BOOT-03 scope. Avoids premature structure creation.

---

## Decision 4: `.opencode/` Symlink Recovery — Scope

| # | Option | Description |
|---|--------|-------------|
| **4A** | **Full restore** | Walk `.hivefiver-meta-builder/` → recreate all `.opencode/agents/`, `skills/`, `commands/` symlinks. Validate against expected list. |
| **4B** | **Validate only** | Report missing/broken symlinks. Do NOT create. User runs `recover` explicitly. |
| **4C** | **Init-time only** | Create only during first `init`. Subsequent runs validate but don't overwrite. |

**Recommendation: 4C** — Init creates; `doctor` validates; `recover` restores. Clear separation of concerns.

---

## Decision 5: Config Bootstrap — Schema Defaults vs. User Input

| # | Option | Description |
|---|--------|-------------|
| **5A** | **Schema defaults** | Write `configs.json` with only `$schema` reference. All defaults applied at runtime from Zod schema. |
| **5B** | **Full defaults** | Write config file with every field populated from defaults. |
| **5C** | **Guided** | Wizard asks for key fields (`conversation_language`, mode profile). Everything else defaults. |

**Recommendation: 5A** — Follows DCP's `createDefaultConfig()` pattern. Minimal file, runtime defaults. Config-traceability doc already maps all fields.

---

## Decision 6: Doctor Command Scope

| # | Check | Priority |
|---|-------|----------|
| 6a | `.hivemind/` structure integrity | P0 |
| 6b | `.opencode/` symlink health | P0 |
| 6c | `configs.json` validity against schema | P0 |
| 6d | OpenCode SDK availability | P0 |
| 6e | Plugin registration (tools + hooks discovered) | P1 |
| 6f | Typecheck passes | P1 |
| 6g | Test suite passes | P1 |
| 6h | Module count + health | P2 |
| 6i | Dependency freshness audit | P2 |
| 6j | Delegation ledger consistency | P2 |

**Recommendation:** All P0 checks in BOOT-06. P1 checks added incrementally. P2 deferred.

---

## Decision 7: Evidence Level at BOOT-07

The ROADMAP sets BOOT-07 as L1 (runtime proof: nuke + init + all gates pass). Is this what you want before authorizing Cycle 3 (Routing Foundation), or are you willing to proceed with L3 (automated tests pass, typecheck clean) + manual verification?
