# Pan Classification Taxonomy

## The Rule

```
Every file touched by a cross-cutting change must be classified into exactly one pan.
Misclassification causes ordering errors that produce contract drift and broken consumers.
```

## Purpose

Define a universal taxonomy for classifying source files into pans (architectural layers). This taxonomy is language-agnostic and framework-agnostic. Each pan has a defined change order, lifecycle rules, and interfacing constraints.

Adapted from architectural layering patterns in `addyosmani/agent-skills@test-driven-development` and `helderberto/skills@tdd`, extended with consumer and config pans for multi-module codebases.

## The Five Pans

```
┌─────────────────────────────────────────────────┐
│                  CONSUMER                        │
│  (downstream services, plugins, CLI wrappers)    │
├─────────────────────────────────────────────────┤
│                  INTERFACE                       │
│  (public API, types, routes, contracts)          │
├─────────────────────────────────────────────────┤
│                  DEEP MODULE                     │
│  (business logic, services, data layer)          │
├─────────────────────────────────────────────────┤
│                  CONFIG                          │
│  (feature flags, env, deployment descriptors)    │
├─────────────────────────────────────────────────┤
│                  TEST                            │
│  (unit, integration, e2e — all test files)       │
└─────────────────────────────────────────────────┘
```

### Pan: INTERFACE

**What it contains:**
- Public API endpoints (REST routes, GraphQL resolvers, gRPC service definitions)
- Exported type definitions, interfaces, and contracts
- CLI command definitions and argument parsers
- Plugin/hook registration points
- Public-facing DTOs, serializers, response schemas
- Published library API surface

**Identification signals:**
- Files in `src/api/`, `src/routes/`, `src/controllers/`
- Files exporting types consumed by external modules
- OpenAPI/Swagger/GraphQL schema files
- `index.ts`, `public-api.ts`, `exports.ts` barrel files
- CLI entry point files (`src/cli/`, `src/commands/`)

**Change ordering:** MODIFY FIRST. Interface contracts are the public face of the system. Deep modules implement against interfaces. Changing interfaces after deep modules causes contract drift.

**Lifecycle impact:** Every consumer of the interface is affected. Changing a route signature or exported type is a breaking change for all consumers.

### Pan: DEEP MODULE

**What it contains:**
- Business logic and domain services
- Data access layer (repositories, ORM models, query builders)
- Core algorithms and computation engines
- State management and caching logic
- Background job processors, workers
- Internal utilities shared across multiple deep modules

**Identification signals:**
- Files in `src/core/`, `src/services/`, `src/domain/`, `src/lib/`
- Files not in `api/`, `routes/`, `controllers/`, or test directories
- Files imported by interface-layer files but not part of the interface itself
- Business rule files with complex logic

**Change ordering:** MODIFY SECOND, after interface contracts stabilize. Deep modules implement against interface contracts. The interface tells the deep module WHAT to do; the deep module determines HOW.

**Lifecycle impact:** Affects interface-layer consumers indirectly. A deep module behavior change that alters outputs is visible through the interface but should not break the interface contract itself.

### Pan: TEST

**What it contains:**
- All test files regardless of framework (Jest, Vitest, pytest, Go test, etc.)
- Test fixtures, test data, test helpers
- Test configuration files (jest.config.ts, vitest.config.ts)
- Test infrastructure (setup files, custom matchers, test doubles)
- Integration test suites, e2e test suites

**Identification signals:**
- Files in `tests/`, `__tests__/`, `*.test.ts`, `*.spec.ts`, `*_test.go`
- Fixture directories (`fixtures/`, `__fixtures__/`)
- Test config files (`jest.config.*`, `vitest.config.*`)

**Change ordering:** TESTS FAIL FIRST (RED) before implementation. Test body changes (assertions, setup) are ordered AFTER deep module stabilization, because assertions must match the new behavior.

**Lifecycle impact:** Tests validate the behavior contract. A test that passes deceptively (through heavy mocking) undermines the entire cross-cutting change governance.

### Pan: CONFIG

**What it contains:**
- Environment variable definitions and defaults
- Feature flags and toggle configuration
- Deployment descriptors (Dockerfile, kubernetes manifests)
- Build configuration (webpack, vite, esbuild)
- Runtime configuration files (JSON, YAML, TOML, .env templates)
- Secrets management and credential references

**Identification signals:**
- Files in `config/`, `.env*`, `docker-compose*.yml`, `k8s/`
- `.github/workflows/`, `Dockerfile`, `Makefile`
- `feature-flags.json`, `feature-toggles.yaml`
- `tsconfig.json`, `package.json` (when changing build settings)

**Change ordering:** MAY CHANGE IN PARALLEL with deep modules. Config changes are low-risk because they do not affect compile-time interfaces. However, config that gates behavior must have corresponding tests.

**Lifecycle impact:** Config values control behavior at runtime. A misconfigured feature flag can silently disable a new feature. Config changes must be paired with config-specific tests.

### Pan: CONSUMER

**What it contains:**
- Downstream services that call the changed interface
- Plugin systems that depend on the changed contract
- CLI wrappers and shell scripts that invoke the changed CLI
- Integration adapters and SDK clients
- Monitoring and observability dashboards keyed on changed metrics

**Identification signals:**
- Files outside the primary source tree that import from the changed interface
- External service code in separate repositories or monorepo packages
- CI/CD pipeline scripts that invoke the changed entry point
- Documentation files that reference changed API signatures

**Change ordering:** MODIFY LAST, after interface and deep module changes are stable and tested. Consumers depend on the public contract. Changing consumers before the contract is stabilized produces misleading breakage.

**Lifecycle impact:** Consumer changes are the highest-risk tier because they span repository or deployment boundaries. Every consumer must be tested against the stabilized interface before declaring the cross-cutting change complete.

## Classification Decision Tree

```
Is the file in a test directory or named *.test|spec.*?
  YES → TEST pan
  NO → Is it a config/env/deployment file?
    YES → CONFIG pan
    NO → Does it export types/interfaces consumed by external code?
      YES → INTERFACE pan
      NO → Is it outside the primary source tree and consumes an interface?
        YES → CONSUMER pan
        NO → DEEP MODULE pan (default)
```

## Multi-Pan Files (Rare — Resolve)

Some files may straddle boundaries (e.g., a file that exports both an interface and its implementation). In these cases:

1. If the file exports public types → INTERFACE pan
2. If the file is primarily business logic with incidental exports → DEEP MODULE pan
3. If the file is a test → TEST pan (override)

When classification is genuinely ambiguous, split the file into separate files (interface-only and implementation-only) as part of the change. Document the split in the handoff packet.

## Framework-Specific Classification

### TypeScript/JavaScript (Node.js)

| Path pattern | Pan |
|---|---|
| `src/routes/**`, `src/controllers/**`, `src/api/**` | INTERFACE |
| `src/services/**`, `src/lib/**`, `src/domain/**` | DEEP MODULE |
| `tests/**`, `__tests__/**`, `*.test.ts`, `*.spec.ts` | TEST |
| `config/**`, `.env*`, `feature-flags.*` | CONFIG |
| `packages/consumer-*/**`, downstream repos | CONSUMER |

### Python

| Path pattern | Pan |
|---|---|
| `api/`, `views/`, `routes/`, `schemas/` | INTERFACE |
| `services/`, `core/`, `domain/`, `models/` | DEEP MODULE |
| `tests/`, `test_*.py` | TEST |
| `config/`, `settings/`, `.env` | CONFIG |
| External services importing this package | CONSUMER |

### Go

| Path pattern | Pan |
|---|---|
| `cmd/`, `api/`, `handler/`, `transport/` | INTERFACE |
| `internal/service/`, `internal/domain/`, `pkg/` | DEEP MODULE |
| `*_test.go` | TEST |
| `config/`, `env/`, `deployments/` | CONFIG |
| External modules importing this module | CONSUMER |

### Rust

| Path pattern | Pan |
|---|---|
| `src/routes/`, `src/api/`, public `lib.rs` exports | INTERFACE |
| `src/services/`, `src/core/`, `src/domain/` | DEEP MODULE |
| `tests/`, `#[cfg(test)]` modules | TEST |
| `config/`, `.env`, `Cargo.toml` features | CONFIG |
| Crates depending on this crate | CONSUMER |

## Pan Classification Artifact

After classification, produce this artifact and save it for the handoff packet:

```yaml
change_id: "CC-abc123"
classification_timestamp: "2026-04-28T10:30:00Z"
pans:
  interface:
    - src/api/routes.ts
    - src/types/contract.ts
  deep_module:
    - src/core/engine.ts
    - src/services/pipeline.ts
  test:
    - tests/api/routes.test.ts
    - tests/core/engine.test.ts
    - tests/integration/cross-pan.test.ts
  config:
    - config/feature-flags.json
  consumer:
    - packages/consumer-service/src/adapter.ts
ambiguous_files: []
split_files: []
```

## Validation Checklist

Before proceeding past Phase 2 (Classify):

- [ ] Every scanned file assigned to exactly one pan
- [ ] No file left unclassified
- [ ] Multi-pan files resolved (split or assigned)
- [ ] At least 2 pans identified (cross-cutting requirement)
- [ ] Interface pan files identified (these change FIRST)
- [ ] Consumer pan files identified (these change LAST)
- [ ] Classification artifact saved for handoff packet
- [ ] Classification reviewed by a second reader (if available)
