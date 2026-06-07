---
name: hm-platform-references
description: >
  Navigation + routing for the 15 platform reference skills (deep-research,
  detective, engine-contracts, state-reference, integration-contracts,
  omo-reference, non-interactive-shell, platform-reference, project-audit,
  research-chain, subagent-patterns, synthesis, tech-compliance,
  tech-ingest, tool-capability-matrix). Use when the user needs to query
  the Hivemind platform surface, OpenCode SDK details, or engine
  contracts. Triggers on verbs like "platform", "SDK", "Hivemind engine",
  "OpenCode reference", "integration". Pattern 2 Navigation — high freedom
  across 15 reference skills. Tech-agnostic + stack-agnostic. NOT for
  execution (load `hm-coord-router` to dispatch), NOT for authoring
  primitives (load `hf-meta-builder`).
metadata:
  consumed-by:
    - "hm-orchestrator"
    - "hf-meta-builder"
  lineage-scope: "hm-*"
  access: "FLEXIBLE"
  role: "platform-navigator"
  pattern: "P2-Navigation"
  realm: "arch,doc,clean-code"
version: "1.0.0"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Platform References

Navigation + routing for the 15 Hivemind platform reference skills.
This is NOT a single skill — it's a routing map. Each row below
points to the actual reference skill to load.

## The 15 Reference Skills

| When you need to | Load this reference skill | Source skill (archived) |
|---|---|---|
| Run deep research with citations | `hm-research-deep` | hm-l3-deep-research |
| Investigate codebases (SCAN/READ/DEEP) | `hm-detective` | hm-l3-detective |
| Reference Hivemind engine contracts (plugin/SDK) | `hm-engine-contracts` | hm-l3-hivemind-engine-contracts |
| Reference Hivemind state root structure | `hm-state-reference` | hm-l3-hivemind-state-reference |
| Reference skill/agent/command binding registry | `hm-integration-contracts` | hm-l3-integration-contracts |
| Reference oh-my-openagent architecture | `hm-omo-reference` | hm-l3-omo-reference |
| Write non-interactive shell scripts | `hm-non-interactive-shell` | hm-l3-opencode-non-interactive-shell |
| Reference OpenCode platform surface | `hm-platform-opencode` | hm-l3-opencode-platform-reference |
| Audit OpenCode projects for boundaries | `hm-project-audit` | hm-l3-opencode-project-audit |
| Orchestrate research chains | `hm-research-chain` | hm-l3-research-chain |
| Apply subagent delegation patterns | `hm-subagent-patterns` | hm-l3-subagent-delegation-patterns |
| Compress research into artifacts | `hm-synthesis` | hm-l3-synthesis |
| Validate tech-stack compatibility | `hm-tech-compliance` | hm-l3-tech-context-compliance |
| Ingest third-party SDKs/docs | `hm-tech-ingest` | hm-l3-tech-stack-ingest |
| Reference Hivemind tool capability matrix | `hm-tooling-capability` | hm-l3-tool-capability-matrix |

## Loading Strategy

```
1. Identify the question
2. Look up the table above
3. Load the matching reference skill (not this one — this is the router)
4. The reference skill's SKILL.md will tell you when to load its
   references/ files
```

**Anti-pattern:** Loading all 15 reference skills at once. Each loads
~5KB. Loading all = ~75KB context, most of it unused. Always load ONE
at a time.

## Cross-References

| Skill | Boundary |
|---|---|
| `hivemind-power-on` | Loads first; this skill loads after |
| `hm-coord-router` | Routes here when intent class is "research" / "platform" |
| `hf-meta-builder` | When the user is creating/auditing/configuring OpenCode primitives |
| The 15 reference skills listed above | Each is the destination, not this skill |

## Routing Patterns

Common questions → skill to load:

- "What's the engine contract for X?" → `hm-engine-contracts`
- "Where in `.hivemind/` is the state for Y?" → `hm-state-reference`
- "How does the OpenCode SDK expose Z?" → `hm-platform-opencode`
- "What tools can the agent use?" → `hm-tooling-capability`
- "Is library X compatible with Hivemind?" → `hm-tech-compliance`
- "How do I dispatch to a subagent?" → `hm-subagent-patterns`
- "What does the OMO reference do?" → `hm-omo-reference`
- "How do I ingest a third-party SDK?" → `hm-tech-ingest`

## Additional Resources

### Reference Files
- **`references/loading-decision-tree.md`** — full decision tree for "which reference do I load?"
- **`references/when-not-to-load.md`** — anti-patterns (when NOT to load any reference)

### Templates
- **`templates/reference-load-card.md`** — pre-load checklist

### Evaluation
- **`evals/evals.json`** — 5 routing cases
- **`metrics/gate-scorecard.md`** — gate-evidence-truth scorecard
