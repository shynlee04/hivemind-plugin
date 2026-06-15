# Cross-Cutting Change Patterns

5 patterns for handling changes that span multiple surfaces.

## Pattern 1: Surface Inventory

Before any cross-cutting change, inventory the affected surfaces.

```yaml
change: "<description>"
affected_surfaces:
  - surface: skills
    count: <N files>
    entry_points: ["<path>", "<path>"]
  - surface: agents
    count: <N files>
    entry_points: ["<path>"]
  - surface: commands
    count: <N files>
    entry_points: ["<path>"]
  - surface: workflows
    count: <N files>
    entry_points: ["<path>"]
  - surface: references
    count: <N files>
  - surface: templates
    count: <N files>

affected_agents:
  - <agent-name>
  - <agent-name>

cross_ref_count: <N>
```

## Pattern 2: Ordering for Atomic Commits

When the change spans surfaces, commit in this order:
1. **References first** — they have the most cross-refs
2. **Templates next** — they're often loaded by skills
3. **Skills** — depends on templates + references
4. **Commands** — invokes skills
5. **Workflows** — composes commands
6. **Agents** — declare `tools:` last

**Why**: Each layer's "outbound" refs can be updated in the same
commit. If you go bottom-up, the higher layer's ref points to nothing.

## Pattern 3: Cross-Ref Migration Phases

For >50 inbound refs, use 4-phase strategy:
- Phase A: agents (declare `tools:` first)
- Phase B: skills (update description, body)
- Phase C: commands (update description, agent: field)
- Phase D: workflows + references + templates (lowest priority)

Each phase: 1 atomic commit. Tests pass between phases.

## Pattern 4: Deprecation Shim

For HIGH-RISK renames (≥20 inbound refs):
- Keep old name as a stub that imports + re-exports new name
- Stub logs deprecation warning
- Stub has `deprecation-removal-date` frontmatter
- Removal: separate commit after all inbound refs migrated

## Pattern 5: Framework Migration

For migrating between frameworks (e.g., GSD → Hivemind):
1. **Inventory all GSD references** in shipped assets
2. **Map each to Hivemind equivalent** (custom tool, agent, skill)
3. **Update by surface** (4 phases above)
4. **Remove GSD SDK** from `.opencode/get-shit-done/` last
5. **Update sync-assets.js** to not deploy gsd-* paths

## Hivemind Tools for Cross-Cutting

- `hivemind-trajectory` — record cross-cutting events
- `hivemind-agent-work` — formal change contract
- `hivemind-sdk-supervisor` — runtime health during migration
- `execute-slash-command` — run validation commands
- `delegate-task` — parallelize surface updates
