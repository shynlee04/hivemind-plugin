# Activity Pathing

## Purpose

Each domain skill defines its own artifact layout under `.hivemind/activity/{domain}/`.
This reference documents the base pattern and domain-specific conventions.

Different domains produce different artifacts — TDD has red/green/refactor evidence,
research has packets and synthesis, delegation has packets and returns. Don't force
them into the same tree.

## Base Pattern

```
{project}/.hivemind/activity/{domain}/{artifacts...}
```

- `{domain}` = the domain skill folder name (e.g., `delegation`, `planning`, `research`, `tdd`, `codescan`)
- `{artifacts...}` = whatever the domain needs — the domain's SKILL.md defines this
- Folders are created on demand, not pre-created

## Domain Conventions

Each domain declares its own activity structure in its SKILL.md. Common patterns:

| Domain    | Base Path                              | Typical Structure                                                        |
|-----------|----------------------------------------|--------------------------------------------------------------------------|
| Delegation| `.hivemind/activity/delegation/`       | `{packet_id}.json`, `{packet_id}-return.json`                           |
| Planning  | `.hivemind/activity/planning/`         | `{plan_id}.md`, `{plan_id}-revision-{n}.md`                             |
| TDD       | `.hivemind/activity/tdd/`              | `red/{evidence}.md`, `green/{evidence}.md`, `refactor/{evidence}.md`    |
| Research  | `.hivemind/activity/research/`         | `{packet_id}.json`, `synthesis/{topic}.md`                              |
| Codescan  | `.hivemind/activity/codescan/`         | `{pass_id}/batch_{n}.json`, `{pass_id}/synthesis.json`                   |
| Debug     | `.hivemind/activity/debug/`            | `{session_id}/diagnosis.md`, `{session_id}/fix-evidence.md`             |

These are conventions, not mandates. Each domain may vary its structure per workflow.

## Cross-Domain Discovery

When domain A needs to find domain B's artifacts:

1. Read the target domain's SKILL.md for its activity path convention
2. Look in `.hivemind/activity/{target_domain}/`
3. Or use explicit references passed through delegation packets

Don't assume all artifacts live in a shared flat structure.

## Session Continuity (Global)

Two paths are shared across all domains:

| Path | Purpose |
|------|---------|
| `.hivemind/activity/sessions/continuity.json` | Session identity and turn state |
| `.hivemind/activity/pathing/active-paths.json` | Domain path resolution registry |

These are the ONLY global paths. Everything else is domain-scoped.

## Pathing Registry

`pathing/active-paths.json` maps domain names to their activity paths:

```json
{
  "base": ".hivemind/activity",
  "domains": {
    "delegation": ".hivemind/activity/delegation",
    "planning": ".hivemind/activity/planning",
    "tdd": ".hivemind/activity/tdd",
    "research": ".hivemind/activity/research",
    "codescan": ".hivemind/activity/codescan"
  },
  "shared": {
    "sessions": ".hivemind/activity/sessions",
    "pathing": ".hivemind/activity/pathing"
  }
}
```

Domains register their own paths when first used. New domains don't require updating a master list.

## Activity Typing

Records should include typed metadata for cross-domain understanding:

- `activity_type`: What kind of work (planning, delegation, codescan, debug, refactor, research, tdd, verification)
- `phase_type`: Where in the lifecycle (entry, mapping, proof, synthesis, gate, stabilization)
- `domain`: Which domain skill owns this artifact

These fields enable cross-domain filtering without reading full artifacts.

## Anti-Patterns

- Creating a flat `.hivemind/activity/` with all domains' artifacts mixed together
- Hardcoding a fixed subfolder tree that all domains must follow
- Using `pathing/active-paths.json` as a master registry that must be pre-populated
- Assuming every domain produces the same types of artifacts
