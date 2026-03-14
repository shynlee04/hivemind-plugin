# Ecosystem Compilation Map

Date: 2026-03-07
Status: active-map
Type: control-map

## Stocks

- authored source surfaces
- delivery mirrors
- runtime JSON state
- readable planning and continuity SOT
- lineage and governance rules

## Flows

### Bootstrap Flow

`src/cli/init.ts` -> `.hivemind/**` + `.opencode/**` + planning root

### Projection Flow

root asset folders -> `src/cli/sync-assets.ts` -> `.opencode/<group>`

### Runtime Flow

OpenCode session -> `src/index.ts` + core hooks -> plugin adapters/fallbacks -> model prompt surface

### Persistence Flow

tools and state mutation queue -> runtime JSON -> planning and continuity surfaces

### Continuity Flow

session close/compaction/handoff -> `.hivemind/sessions/**` + checkpoints + handoffs + planning state

## Leverage Points

### Leverage 1: Source Authority

If the repo has one explicit authored source answer, projection and delivery drift decreases across every later workstream.

### Leverage 2: Transport Adapter Thinning

If plugin hooks become wrappers and fallbacks instead of semantic owners, contamination risk drops quickly.

### Leverage 3: Planning-Root Precedence

If planning-root SOT outranks transitional handoffs consistently, long-haul continuity becomes less noisy.

### Leverage 4: Workstream Gating

If each domain has a local gate under one umbrella master, the repo can move in parallel without reintroducing master-plan drift.
