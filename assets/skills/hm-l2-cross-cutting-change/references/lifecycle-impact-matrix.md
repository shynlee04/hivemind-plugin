# Lifecycle Impact Matrix

## The Rule

```
Every actor and consumer affected by a cross-cutting change must be identified
before implementation begins. A missed consumer is a broken deployment.
```

## Purpose

Classify and document the lifecycle impact of cross-cutting changes on all actors and consumers. This matrix maps each affected file to its consumers, describes the nature of the impact, and identifies lockstep changes required to prevent breakage.

Adapted from `addyosmani/agent-skills@test-driven-development` consumer-impact patterns and `kw12121212/auto-spec-driven@spec-driven-sync-specs` drift/mapping metadata, extended for multi-pan lifecycle governance.

## Actor Taxonomy

Actors are entities that interact with or depend on the changed code. Classify all actors before proceeding to implementation.

| Actor Type | Examples | Detection Method |
|------------|----------|------------------|
| **End User** | Person using the application, browser client | UI tests, user story references |
| **API Consumer** | External service calling REST/GraphQL/gRPC | Dependency graph, OpenAPI consumers |
| **CLI User** | Person running command-line tool | CLI tests, shell scripts |
| **Plugin/Hook** | Third-party plugin depending on hooks | Plugin registry, hook consumers |
| **Internal Service** | Another service in the same system | Import analysis, service dependency map |
| **Scheduled Job** | Cron, background worker, batch processor | Job definitions, queue consumers |
| **Monitoring System** | Alerts, dashboards, log aggregators | Metric names, log format consumers |
| **CI/CD Pipeline** | Build, test, deploy scripts | Pipeline config files |
| **Developer** | Person reading/using the codebase | Developer docs, IDE integrations |
| **Agent/Tool** | AI agent or automation tool using the interface | Agent prompt references, tool definitions |

## Impact Classification

For each actor, classify the impact using this severity scale:

| Severity | Symbol | Definition | Action Required |
|----------|--------|------------|-----------------|
| **Breaking** | 🔴 | Actor's existing integration stops working | MUST update actor before deploying change |
| **Behavioral** | 🟡 | Actor's integration continues but behavior changes | MUST notify actor; SHOULD update tests |
| **Additive** | 🟢 | New capability added, existing behavior unchanged | MAY notify actor; optional adoption |
| **None** | ⚪ | Actor is not affected by this change | No action required |

## Impact Matrix Template

Complete this matrix for every cross-cutting change. Each affected file gets a row; each actor gets a column.

```yaml
change_id: "CC-abc123"
affected_files:
  - file: src/api/routes.ts
    pan: interface
    changes: "Added new 'priority' query parameter to GET /items"
    actors:
      - type: API Consumer
        name: "Mobile App v2.1+"
        severity: 🟢 additive
        lockstep_change: "Mobile app can optionally pass priority parameter"
        test: "tests/integration/mobile-app-adapter.test.ts"
      - type: API Consumer
        name: "Legacy Dashboard v1.0"
        severity: ⚪ none
        lockstep_change: null
        test: "tests/regression/legacy-dashboard.test.ts"
      - type: Monitoring System
        name: "API Metrics Dashboard"
        severity: 🟡 behavioral
        lockstep_change: "Add priority dimension to request metrics"
        test: null

  - file: src/core/engine.ts
    pan: deep_module
    changes: "Engine now processes priority field; defaults to 'normal'"
    actors:
      - type: Internal Service
        name: "Notification Worker"
        severity: 🟡 behavioral
        lockstep_change: "Worker reads priority to determine notification urgency"
        test: "tests/workers/notification-worker.test.ts"
      - type: Scheduled Job
        name: "Daily Report Generator"
        severity: 🔴 breaking
        lockstep_change: "Report schema must include priority aggregation"
        test: "tests/jobs/daily-report.test.ts"

  - file: packages/consumer-service/src/adapter.ts
    pan: consumer
    changes: "Adapter sends priority parameter in API calls"
    actors:
      - type: API Consumer (upstream)
        name: "Main API (routes.ts)"
        severity: 🟢 additive
        lockstep_change: null
        test: "tests/integration/consumer-api.test.ts"

unaffected_actors:
  - type: CLI User
    name: "Admin CLI"
    reason: "Admin CLI does not use priority feature"
    verified_by: "grep -r 'priority' admin-cli/ → no matches"
```

## Lockstep Change Detection

Lockstep changes are modifications that MUST happen simultaneously with the primary change. Missing a lockstep change causes silent breakage that tests may not catch.

### Detection Method

For each affected file, answer:

1. **Does this change modify a contract?** (type, interface, schema, protocol) → Every consumer of that contract needs a lockstep change.
2. **Does this change modify a data format?** (database schema, API response, file format) → Every reader/writer of that format needs a lockstep change.
3. **Does this change modify a configuration key?** → Every config consumer needs a lockstep change.
4. **Does this change modify behavior that another service relies on?** → That service needs a lockstep change or explicit compatibility guarantee.

### Lockstep Detection Commands

```bash
# 1. Find all files importing from a changed interface
grep -rl "from.*changed-module\|import.*changed-module\|require.*changed-module" src/ tests/ packages/

# 2. Find all files referencing a changed type/function name
grep -rl "ChangedType\|changedFunction\|ChangedInterface" src/ tests/ packages/

# 3. Find all config files referencing a changed key
grep -r "CHANGED_CONFIG_KEY\|changed-feature-flag" config/ .env* packages/

# 4. Find all consumers in dependency graph (monorepo)
# Use workspace tools: npm/yarn/pnpm workspace list, or
grep -rl '"changed-package"' packages/*/package.json
```

## Consumer Impact Assessment Protocol

### Step 1: Map the Dependency Graph

Identify how each changed file connects to consumers:

```
changed interface (src/api/routes.ts)
  ├── consumer: Mobile App (separate repo)
  │   └── adapter: packages/mobile-sdk/src/api.ts
  ├── consumer: Web Dashboard (same repo)
  │   └── adapter: packages/dashboard/src/api-client.ts
  ├── consumer: Third-Party Integration (external)
  └── consumer: Internal CLI (src/cli/fetch.ts)
```

Use `grep`, `import` analysis, and dependency tools to build this graph.

### Step 2: Classify Each Consumer's Impact

For each consumer:

1. **Read the consumer's code** — understand how it uses the changed interface
2. **Determine severity** — breaking (🔴), behavioral (🟡), additive (🟢), or none (⚪)
3. **Identify lockstep changes** — what MUST change in the consumer
4. **Identify tests** — which tests verify the consumer still works

### Step 3: Prioritize by Risk

| Risk Level | Consumer Type | Action |
|------------|--------------|--------|
| **Critical** | 🔴 breaking with no automated tests | STOP — add tests before change |
| **High** | 🔴 breaking with tests | Update consumer and tests in lockstep |
| **Medium** | 🟡 behavioral change | Notify; update tests; monitor after deploy |
| **Low** | 🟢 additive change | Optional; document for adoption |
| **None** | ⚪ unaffected | No action |

### Step 4: Stale Consumer Detection

After implementation, verify that no consumer was missed:

```bash
# Re-run the lockstep detection commands on the CHANGED code
grep -rl "newFunction\|newParameter\|newType" src/ tests/ packages/

# Cross-reference with the impact matrix
# Any file in results that is NOT in the matrix → missed consumer
```

## Cross-Repository Impact

When consumers live in separate repositories, impacts are harder to detect. Use these strategies:

1. **API versioning** — if the interface supports versioning (v1, v2), document which version consumers use
2. **Consumer registry** — maintain a list of known consumers with contact info
3. **Deprecation window** — for breaking changes, use deprecation notices before removal
4. **Integration test suite** — maintain integration tests in the primary repo that exercise consumer paths

## Impact Matrix Validation Checklist

Before proceeding past Phase 3 (Impact Analysis):

- [ ] Every affected file has a row in the impact matrix
- [ ] Every actor type that could be affected is considered
- [ ] Every 🔴 breaking impact has a documented lockstep change
- [ ] Every 🟡 behavioral impact has a notification plan
- [ ] Unaffected actors are explicitly listed with verification evidence
- [ ] Lockstep detection commands run and results cross-referenced with matrix
- [ ] Cross-repository consumers identified and documented
- [ ] Consumer dependency graph exists (even if simple)
- [ ] No consumer was detected AFTER the change that wasn't in the matrix (stale detection)
- [ ] Rollback plan considers consumer impact reversal

## Consumer Communication Template

For changes that affect external consumers, produce this notice in the handoff packet:

```
Change Notice: CC-abc123

What changed: Added 'priority' query parameter to GET /items
Consumer impact:
  - Mobile App v2.1+: Optional new parameter (🟢 additive)
  - Legacy Dashboard v1.0: Unaffected (⚪)
  - Scheduled Report: Schema change required (🔴 breaking)

Breaking change timeline:
  - Deprecation notice: 2026-04-28
  - Consumer deadline: 2026-05-12 (2 weeks)
  - Removal: 2026-05-12

Migration guide: docs/migrations/CC-abc123-priority-param.md
Contact: team-platform@example.com
```
