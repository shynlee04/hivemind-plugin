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
> **46 command bundles ship to users** via `commands/*.md`. These reference agents and tools that may not exist in user projects. Misaligned bundles will cause routing failures.

## Rules

- All CLI commands (`init`, `doctor`, `harness`, `settings`) route through bundle execution
- Bundle `commandFile` maps to a `.md` asset in `commands/`
- Bundles are the bridge between CLI invocation and control-plane handling
