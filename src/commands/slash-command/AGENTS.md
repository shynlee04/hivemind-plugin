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
> **The bundle registry is the sole runtime authority for command surfaces; as of 2026-03-17 it registers 10 command bundles.**
> Mirror scope equals `discoverSlashCommandBundles()`, not the contents of root `commands/`.

## Architecture Rules

- **Control Plane Orchestration**: Slash commands operate on the edge of the **Control Plane**. They wrap `@opencode-ai/sdk` client calls (e.g., `client.session.command`) to trigger execution. They should never attempt to bind to `@opencode-ai/plugin` hooks directly.
- **Execution Plane Mapping**: When a slash command fires, the server uses `command.execute.before` (via a Plugin) to resolve the underlying execution plan. Markdown projections (`.opencode/commands/*.md`) are the schema, the Plugin SDK enforces the shape, and the Client SDK observes the result.
- All CLI commands (`init`, `doctor`, `harness`, `settings`) route through bundle execution.
- Bundle metadata is runtime authority; command frontmatter must mirror `id`, `agent`, and `commandFile` rather than inventing parallel routing truth.
- Command execution must fail fast if a bundle references an agent that is missing from the schema-validated runtime registry projection.
