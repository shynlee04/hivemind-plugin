# src/plugin/ — Hook Assembly and Registry

## Responsibilities
- Assemble core hook descriptors.
- Provide system/message transforms and tool registry surfaces.
- Expose the integrated plugin runtime plan.

## Rules
- Do not move config inheritance or command resolution into this layer.
- This layer composes handler outputs; it does not own config loading policy.
