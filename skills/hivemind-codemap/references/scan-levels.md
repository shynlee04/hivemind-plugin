# Scan Levels

## Validated Transfer
- BMAD supports three levels: `quick`, `deep`, `exhaustive`.
- `quick` is pattern-based and avoids broad source reading.
- `deep` reads critical directories.
- `exhaustive` reads all relevant source files except ignored vendor/build paths.

## HiveMind Codemap Mapping

### Quick
- Use for initial classification and routing.
- Inputs: manifests, configs, directory structure, entry surfaces.
- Outputs: scan plan, early seam hypotheses, likely authority and entrypoint map.

### Deep
- Use for selected critical directories or known seams.
- Inputs: router-selected slices, critical directories, branch-family priorities, key pipelines.
- Outputs: seam inventory, hotspot notes, pipeline map, codemap synthesis.

### Exhaustive
- Use for migration planning, severe rot, or when hidden overlap remains unresolved.
- Inputs: whole repo excluding ignored paths.
- Outputs: full seam inventory, hotspot ledger, pipeline map, journey map, restoration-ready synthesis.

## Required Reasoning Depth

- `quick` must still identify likely entrypoints and authority surfaces.
- `deep` must explain how critical directories participate in execution paths, state transitions, and downstream consumers.
- `exhaustive` must add user journeys, degraded paths, resume paths, and edge-case coverage before claiming map completeness.

## Ignore Set
- `node_modules`
- `.git`
- `dist`
- `build`
- `coverage`

Expand only if the repo has additional generated/vendor directories worth excluding.
