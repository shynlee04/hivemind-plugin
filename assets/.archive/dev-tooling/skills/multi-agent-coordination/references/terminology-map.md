# Coordination Terminology Map

## Why this matters

The same word — "wave," "orchestrator," "agent" — means radically different things in GSD, OMO, and Hivemind. When you load a skill from one framework and apply its coordination patterns to another, you create silent failures. This map prevents that category error.

---

## Core Concept Comparison

| Concept | GSD | OMO (oh-my-openagent) | Hivemind |
|---------|-----|----------------------|----------|
| **Coordination model** | Phase-gated sequential waves. One phase = one wave. Waves are sequential by design. | Agent pool with category routing. Any agent can pick up any task matching its category. No explicit wave structure. | WaiterModel: parent dispatches, parent waits. Child sessions form a tree. Dual-signal completion (text response + status). |
| **Dispatch trigger** | Human initiates a phase → orchestrator executes plans in waves | Category routing: task is classified, matched to agent pool entry | Parent agent calls `delegate-task` (always-background) or `task` (subagent dispatch) |
| **Parallelism** | Within a wave, plans can run in parallel. Waves themselves are strictly sequential. | Pool-based: agents run concurrently. No ordering guarantee between pool members. | Parent can dispatch multiple children concurrently (up to 5 recommended). Children unaware of each other. |
| **Completion signal** | Plans complete when all tasks in plan are done. Phase completes when all plans complete. | Agent returns result to pool. No central aggregator — results live in file system. | Dual-signal: (1) text response returned, (2) `delegation-status` reports `completed`. Both must agree. |
| **Error handling** | Plan failure → orchestrator retries or marks phase blocked | Agent failure → pool retries with different agent or same agent retry | Timeout (60s stall) or explicit error → parent decides: retry, escalate, skip |
| **State persistence** | `.planning/` directory — ROADMAP.md, PLAN.md, progress.md | `.omx/state/` (OMO-specific directory) | `.hivemind/state/` — continuity records, delegation records, session hierarchy |
| **Human gating** | Discuss phase → plan phase → execute phase. Each phase boundary is a human gate. | No explicit human gating. Agents run autonomously within category constraints. | Human-gate checkpoints at configurable intervals. Max-iteration enforcement forces human re-authorization. |

---

## Terminology Translations

### "Wave"

| Framework | Meaning |
|-----------|---------|
| **GSD** | A group of plans within a phase that can run in parallel because they share no dependencies. "Wave 1" = first set of parallel plans. |
| **OMO** | Not a first-class concept. Tasks flow through agent pools; parallelism is emergent, not designed. |
| **Hivemind** | A group of child sessions dispatched concurrently by one parent. "Wave 1 completes → gate → Wave 2 dispatches." Similar to GSD but with session-tree tracking and explicit gate enforcement. |

### "Orchestrator"

| Framework | Meaning |
|-----------|---------|
| **GSD** | A top-level agent that manages phases: discuss → plan → execute → verify. Owns the roadmap. Long-lived across sessions. |
| **OMO** | Category-based routing. The "orchestrator" is the routing engine, not an agent. Tasks are classified and matched automatically. |
| **Hivemind** | An L0/L1 agent that dispatches specialists. Owns the task inventory, checkpoint gates, and completion detection. Short-lived per workflow. |

### "Agent"

| Framework | Meaning |
|-----------|---------|
| **GSD** | Specialist subagent spawned by orchestrator. Example: `gsd-planner` creates plans, `gsd-executor` runs them. |
| **OMO** | Pool entry with category + toolset. Any agent in the pool can handle any task in its category. Agents are stateless. |
| **Hivemind** | Specialist with defined lineage (hm-, hf-, gate-, stack-). Statically defined in `.opencode/agents/`. Loaded with specific `allowed-tools` and `skills:`. Session-bound — state lives in session hierarchy, not in agent memory. |

### "Checkpoint"

| Framework | Meaning |
|-----------|---------|
| **GSD** | Phase boundary. `gsd-pause-work` writes context handoff. `gsd-resume-work` restores. Checkpoints are between phases, not within. |
| **OMO** | Not a first-class concept. Work is atomic; completion is binary. |
| **Hivemind** | Mid-workflow pause for human input. "Here's what happened. Here's what's next. Approve?" Can occur within a wave, between waves, or after N iterations. |

### "Session" / "Context"

| Framework | Meaning |
|-----------|---------|
| **GSD** | A session = one conversational turn or a sequence of subagent dispatches. Context is preserved via `.planning/` files. |
| **OMO** | Session = one agent invocation. Context resets between invocations. All state lives in files. |
| **Hivemind** | Session = a node in a parent-child tree. Sessions persist across invocations. Session hierarchy is tracked via `session-hierarchy` tool. Children inherit tools/permissions from parent. |

---

## Pattern Compatibility Matrix

Can you apply pattern X from framework A in framework B?

| Pattern | From GSD in Hivemind | From OMO in Hivemind | From Hivemind in GSD |
|---------|---------------------|---------------------|---------------------|
| Wave-based dispatch | ✅ Compatible. GSD waves map naturally to Hivemind waves. Add explicit gate enforcement (GSD waves lack this). | ❌ OMO has no wave concept. | ⚠️ Possible but GSD waves are phase-scoped. Hivemind waves are session-scoped. |
| Agent pool routing | ❌ GSD agents are purpose-built, not pooled. | ⚠️ OMO pooling assumes stateless agents. Hivemind agents are session-bound. Pooling would break session hierarchy. | N/A (GSD has no pool concept) |
| Category-based dispatch | ⚠️ GSD phases map to categories loosely. | ❌ OMO categories are tool-based. Hivemind categories are lineage-based. Direct translation creates mismatches. | N/A |
| Checkpoint gating | ✅ GSD phase gates are checkpoints. Add within-phase checkpoints for finer control. | ❌ OMO has no gating. | ✅ Compatible. GSD phase gates = Hivemind checkpoint gates. |
| Dual-signal completion | ❌ GSD uses plan-completion, not dual-signal. | ❌ OMO uses binary return. | ✅ Hivemind dual-signal is unique to Hivemind. GSD would need to adopt `delegation-status` polling. |
| Session-tree hierarchy | ❌ GSD sessions are sequential, not hierarchical. | ❌ OMO sessions are independent. | ✅ Unique to Hivemind. GSD phases map to sibling sessions, not parent-child. |

---

## The Key Tension

The fundamental difference between these three frameworks is their answer to: **"Who owns the state?"**

- **GSD:** The file system owns the state. `.planning/ROADMAP.md` is truth. Agents read and write files. If a file says "Phase 3 is done," Phase 3 is done.
- **OMO:** No one owns the state. State is emergent. Agents write to disk; agents read from disk. If two agents disagree, the last write wins.
- **Hivemind:** The session hierarchy owns the state. `.hivemind/state/` is the canonical root. All mutations go through CQRS tools. Read-side tools (`session-tracker`, `session-hierarchy`) query the hierarchy. Write-side tools (`delegate-task`) mutate it.

This means:
- GSD coordination patterns assume file-based state. If you apply them in Hivemind, you'll miss the session tree.
- OMO coordination patterns assume pool-based routing. If you apply them in Hivemind, you'll break the lineage contract.
- Hivemind coordination patterns assume parent-child sessions. If you apply them in GSD, you'll over-engineer simple sequential workflows.

**The rule of thumb:** When coordinating in a Hivemind environment, use the session tree as your coordination backbone. The patterns in SKILL.md are designed for this model. When working in a GSD environment, treat phases as coordination boundaries. When working in an OMO environment, treat categories as routing boundaries.
