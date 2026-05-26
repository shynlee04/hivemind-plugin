# Terminology Map — Cross-Cutting Change Management

Maps cross-cutting change concepts across GSD, BMAD, and Hivemind frameworks. When applying the
cross-cutting change management methodology to a project, use this map to translate universal
concepts into framework-specific taxonomies.

---

## Layer Taxonomy

The universal methodology uses five layers. Each framework maps them differently:

| Universal Layer | GSD Equivalent | BMAD Equivalent | Hivemind Equivalent |
|-----------------|---------------|-----------------|---------------------|
| **Interface / Contract** | Public API surface, exported types, CLI commands, GraphQL/HTTP endpoints | Interface contracts, public modules, exported types | `src/` public API, `src/shared/types.ts`, OpenCode SDK surfaces, hook contracts |
| **Deep Module / Implementation** | Core business logic, services, data layer, algorithms | Implementation modules, internal logic | `src/` internal modules: coordination, task-management, features, config |
| **Test / Verification** | Test files (`tests/`), spec files, verification scripts | Test infrastructure, spec compliance checks | `tests/` directory, spec-driven verification, acceptance tests |
| **Config / Environment** | `.gsd/` config, environment variables, feature flags | `.bmad/` config, environment settings | `.hivemind/` config, `src/config/`, environment variables, feature flags |
| **Consumer / Downstream** | Dependent services, plugins, external API consumers | Downstream modules, dependent workflows | `.opencode/` primitives (agents, commands, skills load from harness tools), external plugins |

### Layer Identification Heuristics

**Interface layer — identify by these signals:**
- Exported from the project's public API surface
- Consumed by external callers (not just internal modules)
- Changing this file risks breaking external consumers
- File path typically includes: `api/`, `routes/`, `types/`, `interfaces/`, `contracts/`

**Deep module layer — identify by these signals:**
- Contains business logic, not just wiring
- Imported by interface-layer files, not the other way around
- Changing this file affects internal behavior but not external contracts
- File path typically includes: `core/`, `services/`, `logic/`, `engine/`, `domain/`

**Test layer — identify by these signals:**
- File name ends in `.test.` or `.spec.`
- Located under a `tests/` or `__tests__/` directory
- Contains assertions about behavior
- Framework-specific test configuration files also belong here

**Config layer — identify by these signals:**
- Environment-specific values (not shared logic)
- Feature flags and deployment descriptors
- File path typically includes: `config/`, `.env`, `feature-flags`, `settings/`

**Consumer layer — identify by these signals:**
- Located in a different module, package, or repository
- Imports from the interface layer
- Changing the interface without updating this file causes breakage
- May be a separate service, plugin, or downstream application

---

## Workflow Phase Translation

The universal 7-phase workflow maps to framework-specific equivalents:

| Universal Phase | GSD Workflow | BMAD Workflow | Hivemind Workflow |
|-----------------|-------------|---------------|-------------------|
| Scan | Grep/Glob across `.planning/` and `src/` | Grep across workspace modules | `hm-detective` SCAN mode, grep across `src/` + `tests/` |
| Classify | Classify files by GSD layer (planning, implementation, test) | Classify by BMAD module type | Classify using `references/pan-classification.md` from hm-l2-cross-cutting-change |
| Impact Analysis | Check cross-phase dependencies | Check module-to-module dependencies | `hm-l2-cross-cutting-change` Phase 3: lifecycle impact matrix |
| Red-First | `gsd-add-tests` for failing tests first | Spec-driven test generation | `hm-l2-cross-cutting-change` Phase 4: red-first protocol |
| Implement (ordering) | Phase execution with wave ordering | Module ordering by dependency graph | `hm-l2-cross-cutting-change` Phase 5: locked ordering |
| Verify | `gsd-code-review`, `gsd-verify-work` | `verify-with-spec` | `hm-l2-cross-cutting-change` Phase 6: honesty check; `hm-completion-looping` |
| Handoff | `gsd-pause-work`, milestone summary | BMAD context handoff | `hm-l2-cross-cutting-change` Phase 7: handoff packet; `hm-l3-subagent-delegation-patterns` |

---

## Concept Translation

| Concept | GSD Term | BMAD Term | Hivemind Term |
|---------|---------|-----------|---------------|
| Layer | Slice / Phase boundary | Module surface | Pan (as in pan-classification.md) |
| Cross-cutting change | Cross-phase change | Cross-module change | Cross-pan modification |
| Consumer | Dependent phase | Downstream module | Consumer surface |
| Test-first | Test-driven execution | Spec-first verification | Red-first protocol |
| Honesty check | Code review → verify | Spec compliance → verify | Mock-honesty detection |
| Handoff | Pause-work manifest | Context handoff | Handoff packet + delegation records |

---

## Framework-Specific Anti-Patterns

### GSD-Specific

| Anti-Pattern | Why It Happens | Prevention |
|-------------|---------------|------------|
| Skipping discuss phase for cross-phase changes | Planning is treated as optional for "simple" changes | Always run `gsd-discuss-phase` when change spans ≥2 phases |
| No cross-phase dependency check | Phases are treated as independent | Run `gsd-analyze-dependencies` before implementing |
| Phase ordering reversed | Implementation convenience overrides dependency order | Follow the locked ordering: interface phases → implementation phases → consumer phases |

### BMAD-Specific

| Anti-Pattern | Why It Happens | Prevention |
|-------------|---------------|------------|
| Module coupling undocumented | BMAD modules are treated as self-contained | Document cross-module dependencies before implementing |
| Spec updates lag behind code | Spec is updated after implementation | Lock spec before implementation; treat spec as interface layer |
| Consumer modules untested | Integration tests are deferred | Include consumer modules in the scan phase |

### Hivemind-Specific

| Anti-Pattern | Why It Happens | Prevention |
|-------------|---------------|------------|
| `.opencode/` mutation during `src/` changes | Soft meta-concepts treated as implementation | Separate scan by sector: `src/` (hard harness) vs `.opencode/` (soft meta-concepts) |
| `.hivemind/` state mutation without CQRS boundary | Direct state file writes bypass tools | Use CQRS tools for state mutations; never write to `.hivemind/` directly |
| Cross-lineage skill loading | hm-* skills loaded from hf-* agents without justification | Document cross-lineage access; justify each load |

---

## Framework Detection Heuristics

To determine which framework a project uses:

| Signal | Framework |
|--------|-----------|
| `.planning/` directory with ROADMAP.md, PROJECT.md, phases/ | GSD |
| `.bmad/` directory with workspace config | BMAD |
| `.hivemind/` state root + `.opencode/` primitives directory | Hivemind |
| `.gsd/` directory with workflows/ | GSD v2 |
| Multiple framework signals present | Document which framework governs which layer |

---

## Quick Translation Guide

When reading the cross-cutting-change-mgmt methodology:

- **"Layer"** = GSD phase/slice, BMAD module, Hivemind pan
- **"Interface"** = GSD public API, BMAD exported contracts, Hivemind `src/` public surfaces
- **"Red-first"** = GSD test-first (gsd-add-tests before implementation), BMAD spec-first, Hivemind red-first protocol
- **"Ordering"** = GSD wave ordering, BMAD module dependency ordering, Hivemind pan-level ordering
- **"Consumer"** = GSD dependent phase, BMAD downstream module, Hivemind consumer surface
