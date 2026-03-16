# src/commands/slash-command/ — Command Bundle Registry

Defines, discovers, and executes slash-command bundles that map to `.opencode/commands/*.md` files.

## Boundary

| File | Purpose |
|------|---------|
| `command-bundles.ts` | Static registry of all `SlashCommandBundle` definitions |
| `command-discovery.ts` | `discoverSlashCommandBundles()`, `findSlashCommandBundle()` |
| `command-runner.ts` | `executeSlashCommandBundle()` — loads assets, dispatches handlers |
| `command-types.ts` | Bundle, input, result, preview types |
| `recovery-handlers.ts` | Recovery-specific command execution path |

## Audit Note

> [!WARNING]
> **`SlashCommandBundle` has 18 fields** including `pressureContract`, `stateAuthority`, `hostEvent`, `continuationMode`. This creates high coupling — every bundle definition requires understanding all 18 properties. Consider splitting into core bundle (5 fields) + extension interfaces.

> [!IMPORTANT]
> **The bundle registry is the sole runtime authority for mirrored command surfaces; as of 2026-03-17 it registers 10 command bundles.**
> Mirror scope equals `discoverSlashCommandBundles()`, not the contents of root `commands/`.

## Rules

- All CLI commands (`init`, `doctor`, `harness`, `settings`) route through bundle execution
- Bundle `commandFile` maps to a `.md` asset in `commands/`
- Bundles are the bridge between CLI invocation and control-plane handling
- Bundle metadata is runtime authority; command frontmatter must mirror `id`, `agent`, and `commandFile` rather than inventing parallel routing truth
- Command execution must fail fast if a bundle references an agent that is missing from the schema-validated runtime registry projection
