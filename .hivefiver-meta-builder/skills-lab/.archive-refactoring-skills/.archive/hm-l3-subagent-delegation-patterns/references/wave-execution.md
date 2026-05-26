# Wave-Based Parallel Execution

Wave-based execution patterns for multi-plan phases with dependency ordering.

## Core Concept

Plans within a phase are grouped into **waves**. Plans in the same wave have no interdependencies and can execute in parallel. Plans in later waves depend on earlier waves.

```
Phase → Plans grouped by wave number
Wave 1: Plans with depends_on: [] (run parallel via Promise.allSettled)
Wave 2: Plans with depends_on: ["01"] (run after Wave 1 completes)
Wave N: Plans with depends_on: [previous waves]
```

## Wave Assignment Rules

1. **Wave 1** — Plans with no dependencies (`depends_on: []`)
2. **Wave N** — Plans whose `depends_on` list contains only waves < N
3. **Circular dependencies** — Rejected at planning time; must be resolved before execution

## Execution Protocol

### Per Wave

```bash
# For each wave:
for plan in wave_plans; do
  # Dispatch all plans in wave in parallel
  dispatch "$plan" &
done
wait  # Wait for all parallel dispatches to complete

# Validate wave results
for plan in wave_plans; do
  if [ "$plan_status" != "DONE" ]; then
    echo "Wave $WAVE_NUM plan $plan failed — aborting subsequent waves"
    exit 1
  fi
done
```

### Error Handling

| Scenario | Action |
|----------|--------|
| One plan in wave fails | Abort remaining waves; log failure; return DONE_WITH_CONCERNS |
| All plans in wave succeed | Proceed to next wave |
| Partial success (DONE_WITH_CONCERNS) | Orchestrator decides: proceed with concerns noted, or halt |

## Dependency Declaration

Plans declare dependencies in their PLAN.md frontmatter:

```yaml
---
plan_id: "02"
depends_on: ["01"]
wave: 2
---
```

## Verification

Before executing a phase:
1. Verify all `depends_on` references exist
2. Verify no circular dependencies
3. Verify wave numbers are monotonic (Wave N+1 only depends on waves ≤ N)

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The False Parallel** | Plans in same wave secretly depend on each other | Add explicit dependency, move to later wave |
| **The Mega-Wave** | All plans in Wave 1 (no dependencies declared) | Force dependency declaration; break into smaller waves |
| **The Silent Skip** | Failed wave doesn't halt subsequent waves | Enforce strict wave validation before proceeding |
