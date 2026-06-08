---
name: hm-coord-router
description: >
  Classify user intent and route to the right command + agent pair. Use when the
  front-facing orchestrator (build) receives a user prompt and needs to: (1) classify
  the intent (spec / test / debug / refactor / ship / research / cross-cut / product /
  intent / coord), (2) select the matching command from `assets/commands/`, (3) pair
  the command with the right specialist agent from `assets/agents/`, (4) compose a
  delegation packet, and (5) execute via `delegate-task`. Pattern 2 Navigation — high
  freedom across multiple routing paths. Tech-agnostic + stack-agnostic. NOT for
  multi-agent dispatch patterns (load `hm-coord-loop` for that), NOT for spec
  authoring (load `hm-spec-authoring`).
metadata:
  consumed-by:
    - "hm-orchestrator"
  lineage-scope: "hm-*"
  access: "FLEXIBLE"
  role: "orchestrator"
  pattern: "P2-Navigation"
  realm: "spec,arch,clean-code"
version: "1.0.0"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - delegate-task
  - delegation-status
  - execute-slash-command
  - semantic-agent-selector
---

# Coordinator Router

Classify the user's prompt into one of 10 intent classes, then route to the
matching command + agent pair. Produces a delegation packet and dispatches it
via `delegate-task`. Single intent per dispatch — for multi-intent prompts,
load `hm-coord-loop` and split into coordinated sub-dispatches.

## When This Skill Loads — Do This First

1. **Read the user's prompt.** If it is `<10 words` and unambiguous, classify
   directly. If longer or ambiguous, load `references/intent-classification-tree.md`
   to walk the decision tree.
2. **Pick ONE primary intent.** Multi-intent prompts (e.g. "fix the bug AND
   write tests") must be split — load `hm-coord-loop` for that.
3. **Validate the intent class** against `references/intent-classification-tree.md`.
   If no class fits, escalate to the user with the ambiguous prompt and a
   1-sentence description of the intent candidates considered.
4. **Look up the command** in `references/command-routing-table.md` (keyed by
   intent class).
5. **Look up the agent** in `references/agent-routing-table.md` (keyed by
   command). The agent is the execution target.
6. **Compose a delegation packet** from `templates/delegation-packet-template.md`.
7. **Dispatch** via `delegate-task` with the composed packet. Then poll
   `delegation-status` until DONE.

## 10 Intent Classes (the routing taxonomy)

| # | Intent class | Trigger verbs | Example prompts |
|---|---|---|---|
| 1 | **spec** | "spec", "specify", "lock", "define", "write requirements" | "Lock the spec for the new auth flow" |
| 2 | **test** | "test", "TDD", "red-green", "coverage", "vitest" | "Write a failing test for the parser" |
| 3 | **debug** | "debug", "diagnose", "fix", "broken", "error" | "Why is the sidecar timing out?" |
| 4 | **refactor** | "refactor", "clean up", "restructure", "rename" | "Refactor the session-tracker to use Maps" |
| 5 | **ship** | "ship", "deploy", "release", "production", "rollout" | "Ship the v0.2 milestone" |
| 6 | **research** | "research", "investigate", "deep-dive", "compare" | "Research how other harnesses handle routing" |
| 7 | **cross-cut** | "across", "all modules", "everywhere", "global" | "Update the lint config across the monorepo" |
| 8 | **product** | "user value", "RICE", "product lens", "validate" | "Is the sync phase actually valuable?" |
| 9 | **intent** | "what should we build", "brainstorm", "ideate" | "Help me think through what to ship next" |
| 10 | **coord** | "multi-agent", "parallel", "wave", "delegate 3+" | "Coordinate 5 subagents to audit the skills" |

For each intent class, the routing tables below list the canonical command +
agent pair. The agent is a specialist; the command is the user-facing surface.

## Command Routing Table (intent → command)

| Intent | Command (at `assets/commands/`) | Why |
|---|---|---|
| spec | `hm-spec-phase` | Socratic spec-locking flow |
| test | `hm-execute-phase` (TDD variant) | RED-GREEN-REFACTOR with cycles |
| debug | `hm-debug-systematic` | Hypothesis-driven debugging |
| refactor | `hm-arch-refactor` | Architecture + clean-code patterns |
| ship | `hm-ship` | Production readiness + deploy |
| research | `hm-research-deep` | Multi-source research with citations |
| cross-cut | `hm-cross-change` | Pan-impact analysis + ordering |
| product | `hm-product-validation` | RICE + user-lens scoring |
| intent | `hm-intent-brainstorm` | Socratic ideation + intent loop |
| coord | `hm-coord-loop` | Wave/parallel/pipeline dispatch |

## Agent Routing Table (command → agent)

| Command | Agent (at `assets/agents/`) | Specialization |
|---|---|---|
| `hm-spec-phase` | `hm-specifier` | Spec-driven authoring, EARS |
| `hm-execute-phase` | `hm-executor` | TDD cycles, atomic commits |
| `hm-debug-systematic` | `hm-debugger` | Reproduce-minimize-hypothesize-instrument |
| `hm-arch-refactor` | `hm-architect` | ADR + clean-code refactor |
| `hm-ship` | `hm-shipper` | Production readiness + rollback |
| `hm-research-deep` | `hm-phase-researcher` | Citation tracking, source synthesis |
| `hm-cross-change` | `hm-ecologist` | Pan-impact + ordering |
| `hm-product-validation` | `hm-planner` | RICE scoring, user impact |
| `hm-intent-brainstorm` | `hm-intent-loop` | Socratic ideation |
| `hm-coord-loop` | `hm-orchestrator` | Wave dispatch + handoff |

## Delegation Packet (5 required sections)

Every `delegate-task` call uses this envelope — see `references/delegation-packet-schema.md` for the full schema and `templates/delegation-packet-template.md` for a fillable template.

1. **Task** — one-sentence description
2. **Scope** — include/exclude file paths
3. **Context** — only what is needed (max 50 lines; use references for the rest)
4. **Expected Output** — concrete deliverables + acceptance criteria
5. **Verification** — exact command the agent must run and report

Plus a metadata block:

```yaml
source_agent: "hm-orchestrator"
target_agent: "<from table above>"
intent_class: "<one of 10>"
allowed_destinations: []
history_policy: "include only relevant context"
expected_return: "DONE|DONE_WITH_CONCERNS|NEEDS_CONTEXT|BLOCKED"
resume_pointer: "<file:line or path>"
```

## Anti-Patterns

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| Routing without intent classification | Picks the wrong agent. Work is silently redone. | Always classify first. If ambiguous, escalate. |
| Combining 2+ intents in one dispatch | Agent tries to do both. Context exhausted halfway. | Split. One intent per dispatch. |
| Dispatching directly to a sub-skill (bypassing the command) | Loses user-facing surface + protocol guarantees. | Always go command → agent, not command → sub-skill. |
| Using `hm-coord-router` for "dispatch 5 agents to do parallel work" | That's coordination, not routing. | Load `hm-coord-loop` for that. |
| Routing with stale `agent-routing-table.md` | Agent may not exist or may have moved. | Run `node scripts/sync-assets.js` first to ensure deployable state. |
| Dispatching without `delegation-status` polling | Output is lost. Agent completes but never collected. | Always store delegationId, then poll. |

## Cross-References

| Skill | Boundary |
|---|---|
| `hivemind-power-on` | Loads first to discover session state. `hm-coord-router` runs after. |
| `hm-coord-loop` | Multi-agent dispatch patterns. `hm-coord-router` decides WHO to dispatch; `hm-coord-loop` decides HOW. |
| `hm-spec-authoring` | The spec class routes to `hm-spec-phase` which loads `hm-spec-authoring`. |
| `hm-intent-brainstorm` | The intent class routes there. For sub-classification of user intent. |
| `hm-product-validation` | The product class routes there. For product-lens work. |

## Additional Resources

### Reference Files (load on demand)
- **`references/intent-classification-tree.md`** — full decision tree with keywords
- **`references/agent-routing-table.md`** — complete command → agent mapping
- **`references/command-routing-table.md`** — complete intent → command mapping
- **`references/delegation-packet-schema.md`** — full packet schema with examples

### Templates (fillable)
- **`templates/delegation-packet-template.md`** — blank 5-section packet
- **`templates/intent-summary-template.md`** — pre-dispatch intent summary

### Workflows
- **`workflows/route-and-delegate-workflow.md`** — 7-step dispatch sequence
- **`workflows/escalation-workflow.md`** — when to stop and ask the user

### Scripts (executable)
- **`scripts/match-agent-by-intent.sh`** — given an intent class, print the agent + command

### Evaluation
- **`evals/evals.json`** — 5 routing test cases (intent → expected command → expected agent)
- **`metrics/gate-scorecard.md`** — gate-evidence-truth scorecard
