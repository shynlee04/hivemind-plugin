# Integration Verification

## Purpose

Verify that parallel delegation results integrate cleanly before claiming workflow completion.

## When to Run

After all parallel slices return (or after re-delegating failed slices and receiving their returns).

## Verification Steps

### 1. Run Integration Test Suite

Execute the project's integration test suite against all returned results simultaneously.

```bash
npm test
npx tsc --noEmit
```

Both must pass with all parallel changes applied together.

### 2. Check Import Conflicts

Scan for cases where the same symbol is imported from different sources across slices.

- One slice imports `helper` from `./utils/a`
- Another slice imports `helper` from `./utils/b`
- Result: ambiguous import — which one wins?

### 3. Check Type Collisions

Scan for cases where the same type name has different definitions across slices.

- One slice defines `interface Config { timeout: number }`
- Another slice defines `interface Config { retries: number }`
- Result: type collision — TypeScript will error

### 4. Check Shared-State Races

Scan for cases where parallel slices mutate the same shared state.

- One slice modifies `shared/config.ts` defaults
- Another slice reads `shared/config.ts` assuming original defaults
- Result: silent behavior change

## Conflict Resolution

1. Identify which specific slice caused each conflict
2. Re-delegate ONLY the conflicting slice — do not re-delegate all
3. Include the conflict context in the re-delegation packet
4. If multiple slices conflict, check if they conflict with each other — if so, switch to sequential mode

## Verification Output

```json
{
  "integration_status": "pass | fail",
  "tests_passing": true,
  "type_check_passing": true,
  "import_conflicts": [],
  "type_collisions": [],
  "shared_state_races": [],
  "conflicting_slices": [],
  "resolution": "none | re-delegate | sequential"
}
```
