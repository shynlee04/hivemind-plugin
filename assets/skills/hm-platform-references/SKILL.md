---
name: hm-platform-references
description: >
  Navigation + routing for Hivemind platform concerns. Routes to the
  single right skill; does not answer the question itself. Use when the
  user asks to "route a command", "navigate the hm-* skill library",
  "find the right specialist for X", "check which skill governs this
  domain", or mentions routing, coordination, or platform primitives.
  Maps to 6 shipped skills covering coordination, governance, and the
  3-gate quality triad. Pattern 2 Navigation — high freedom across
  shipped-only destinations. Tech-agnostic and framework-agnostic. NOT
  for: hm-coord-router (user-intent classification for the L0
  orchestrator), hm-coord-loop (wave-based multi-agent dispatch).
metadata:
  consumed-by:
    - "hm-orchestrator"
    - "hf-coordinator"
  lineage-scope: "hm-*"
  access: "FLEXIBLE"
  role: "platform-navigator"
  pattern: "P2-Navigation"
  realm: "arch,doc"
version: "2.0.0"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Platform References

Navigation + routing for Hivemind platform concerns. This is NOT a
single answer skill — it is a routing map. Each row below points to
the actual destination skill to load.

## When to Load

The user has a platform-level question and you need to identify which
shipped Hivemind skill owns the answer. Examples:

- "Which skill handles intent classification?"
- "How do I run a multi-agent wave?"
- "Where do I edit a governance rule?"
- "What runs the 3-gate quality sequence?"

## When NOT to Load

- The user's request already matches a specialist skill directly
  (route to the specialist instead of routing through this meta-router).
- The user wants execution dispatched to an agent (load
  `hm-coord-router` for intent classification, then the
  `delegate_task` custom tool).
- The user is creating/auditing OpenCode meta-concepts (load
  `hf-meta-builder-core`).

## Routing Table (6 Shipped Destinations)

| When you need to                                          | Route to                  | Pattern     |
|-----------------------------------------------------------|---------------------------|-------------|
| Classify user intent and pair with a command + agent      | `hm-coord-router`         | P2          |
| Coordinate multi-agent dispatch with validation gates     | `hm-coord-loop`           | P3-Process  |
| Govern cross-cutting changes across pans/layers           | `hm-cross-change`         | P3-Process  |
| Edit a config-driven governance rule in `.hivemind/configs.json` | `hm-config-governance` | P2          |
| Run the 3-gate quality sequence (lifecycle → spec → evidence) | `hm-gate-triad`         | P3-Process  |
| This skill itself (self-reference for "which skill is the navigator?") | `hm-platform-references` | P2      |

## Loading Strategy

```
1. Identify the platform question
2. Look up the table above
3. Load the matching skill (not this one — this is the router)
4. That skill's SKILL.md will tell you when to load its
   references/ files
```

**Anti-pattern:** loading this skill AND every destination at once.
Each loads ~5KB. Always load ONE destination, not the router plus its
fan-out.

## Decision Tree

```
Q1: Is the user's request about creating/auditing/configuring
    OpenCode meta-concepts (skill, agent, command, tool)?
    ├── YES → `hf-meta-builder-core` (out of scope for this router)
    └── NO
        │
Q2: Is the request about session discovery or resume?
    ├── YES → `hivemind-power-on` (load first, before this skill)
    └── NO
        │
Q3: Is the request a class of meta-routing question (which skill,
    where to go, what governs this domain)?
    ├── YES → continue below
    └── NO → the user wants execution; route to `hm-coord-router`
            for intent classification, then `delegate_task`
            │
Q4: Pick the destination by topic:
    ├── intent classification / command pairing → `hm-coord-router`
    ├── multi-agent dispatch / waves             → `hm-coord-loop`
    ├── cross-cutting change governance          → `hm-cross-change`
    ├── config-driven governance rule edit       → `hm-config-governance`
    ├── 3-gate quality sequence                  → `hm-gate-triad`
    └── meta-navigation (this skill)             → self-reference
```

## Cross-References (shipped-only)

| Skill                       | Boundary                                                |
|-----------------------------|---------------------------------------------------------|
| `hivemind-power-on`         | Loads first; this skill loads after session discovery   |
| `hm-coord-router`           | Routes here when intent class is "platform" or "meta"   |
| `hm-coord-loop`             | Routes here when intent class is "dispatch" / "wave"    |
| `hm-cross-change`           | Routes here when intent class is "cross-cutting"        |
| `hm-config-governance`      | Routes here when intent class is "governance rule"      |
| `hm-gate-triad`             | Routes here when intent class is "quality gate"         |
| `hf-meta-builder-core`      | When the user is creating/auditing OpenCode primitives  |
| `hm-spec-authoring`         | When the user is locking a spec (EARS + acceptance)     |
| `hm-arch-refactor`          | When the user is making architecture decisions          |
| `hm-debug-systematic`       | When the user is debugging a regression                 |
| `hm-test-driven`            | When the user is running a TDD cycle                    |

## Archived Reference Material

The historical `hm-l3-*` reference set (15 archived skills covering
deep-research, detective, engine-contracts, state-reference,
integration-contracts, omo-reference, non-interactive-shell,
platform-reference, project-audit, research-chain,
subagent-patterns, synthesis, tech-compliance, tech-ingest,
tool-capability-matrix) lives in
`assets/.archive/dev-tooling/skills/`. These are NOT shipped and must
not be routed to. For deep-reference material on the Hivemind runtime,
see `assets/agents/` and the architecture docs in
`.planning/architecture/`.

## GSD Compatibility

This skill is the canonical replacement for the gsd-* platform
reference set. If the loading agent has legacy gsd-* references, use
this table:

| Legacy gsd-* primitive        | Hivemind equivalent                       |
|-------------------------------|-------------------------------------------|
| `gsd-state` JSON manipulation | `hivemind-power-on` (read `.hivemind/state/`) |
| `gsd-context-monitor`         | `hm-coord-router` + `hivemind-power-on`   |
| `gsd-tools` CLI               | `hm-config-governance` (config-driven rules) |
| `gsd-platform-reference`      | this skill (`hm-platform-references`)     |
| `gsd-engine-contracts`        | `.planning/architecture/` docs + `assets/agents/` |
| `gsd-research-chain`          | `hm-coord-loop` (orchestrate research)    |
| `gsd-tech-stack-ingest`       | per-skill stack-* authoring (see `hm-stack-authoring`) |

The shipped Hivemind custom tools (`delegate_task`,
`execute_slash_command`, `configure_primitive`, plus the `question` /
`todowrite` built-ins) replace the legacy gsd-tools CLI surface.

## Validation Gate

Before declaring any platform-routing task complete:

- [ ] Routed to a SHIPPED skill (verified via `ls assets/skills/<name>/SKILL.md`)
- [ ] No archived l2/l3 / gate-* / stack-* skill named in the response
- [ ] Cross-references resolve to shipped surface
- [ ] Anti-pattern audit: did NOT load all 6 destinations at once
- [ ] Committed to git with descriptive message
