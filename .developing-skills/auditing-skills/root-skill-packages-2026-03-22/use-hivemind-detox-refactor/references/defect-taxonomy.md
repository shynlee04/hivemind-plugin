# Defect Taxonomy

## Rule

All currently verified detox defects are `mixed`.

- The router must guard against them immediately.
- Root `skills/**` or `src/**` cleanup follows later.

## Defects

### `entry_router_contamination`

- Guard now:
  - narrow activation
  - avoid broad router inheritance
- Source follow-up:
  - clean trigger prose in Bundle A skills

### `false_enforcement_or_auto_run_claims`

- Guard now:
  - ignore `MUST LOAD`, `auto-run`, and similar claims unless `src/**` backs them
- Source follow-up:
  - rewrite unsupported enforcement prose in active root skills

### `missing_route_targets`

- Guard now:
  - block missing or generic targets
- Source follow-up:
  - replace them with real active targets or remove the route

### `git_memory_continuity_breakage`

- Guard now:
  - refuse routes to `use-hivemind-session-resume`, `session-memory-resume`, and `delegation-handoff`
- Source follow-up:
  - align skill routes with current handoff/memory authority

### `cross_bundle_ownership_leak`

- Guard now:
  - treat cross-owned scripts as bundle debt, not safe shared authority
- Source follow-up:
  - move or duplicate ownership under documented shared authority

### `projection_drift_or_stale_support_files`

- Guard now:
  - ignore `.opencode/**` as authority
- Source follow-up:
  - harden nested-file pruning and route validation in `src/**`

### `meta_builder_overreach`

- Guard now:
  - prefer external audit/remediation lanes over live builder routes
- Source follow-up:
  - split builder creation from audit/remediation responsibilities

## Immediate Router Refusals

- `permission-design`
- `profile management`
- `governance enforcement`
- `Domain specialist`
- `use-hivemind-session-resume`
- `session-memory-resume`
- `delegation-handoff`
- any route into `_archived` or `_deprecated_hive`
- any attempt to treat `.opencode/**` as the source of truth
