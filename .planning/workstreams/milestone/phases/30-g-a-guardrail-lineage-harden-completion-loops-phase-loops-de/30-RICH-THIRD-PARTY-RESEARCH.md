# Phase 30 Rich Third-Party Research: Guardrail Lineage

**Researched:** 2026-04-25  
**Scope:** Phase 30 G-A Guardrail Lineage for `hm-completion-looping`, `hm-phase-loop`, `hm-subagent-delegation-patterns`, `hm-coordinating-loop`, `hm-user-intent-interactive-loop`, plus baseline-adjacent `hivefiver-delegation-gates`.  
**Mode:** Cluster-level third-party source review. Per-skill top-3 source ranking remains BLOCKED where noted.  
**Confidence:** MEDIUM-HIGH for cluster decisions; LOW for exact per-skill top-3 rankings.

## Baseline and Matrix Evidence

- Phase 30 baseline marks five target skills BLOCKED because the RICH gate lacks top-3 third-party crawl and Pattern 1/2/3 adoption records. [VERIFIED: `30-RICH-GATE-BASELINE.md:3-15`]
- The coverage matrix lists `hm-completion-looping`, `hm-coordinating-loop`, `hm-phase-loop`, `hm-subagent-delegation-patterns`, and `hm-user-intent-interactive-loop` as BLOCKED for missing third-party crawl/adoption evidence. [VERIFIED: `30-HM-RICH-COVERAGE-MATRIX.md:7-33`]
- The recovery plan requires third-party guardrail/delegation/loop orchestration crawling, bundled-resource review, and Pattern 1/2/3 decisions before expansion. [VERIFIED: `30-01-PLAN.md:16-32`]

## Local Bundle Snapshot Beyond SKILL.md

| Skill | Local resources inspected | Evidence | RICH implication |
|---|---|---|---|
| `hm-completion-looping` | references + evals + scripts | Verify-after, verify-during, and guardrail loop categories with max iterations exist. [VERIFIED: `.opencode/skills/hm-completion-looping/references/loop-patterns.md:1-22`] | Strong local skeleton; external lineage should refine termination evidence. |
| `hm-phase-loop` | `references/revision-loop.md` | Checker to revise to escalate loop includes issue-count trend, max 3 iterations, and stall detection. [VERIFIED: `.opencode/skills/hm-phase-loop/references/revision-loop.md:1-173`] | Needs eval/script decision and durable execution lineage. |
| `hm-subagent-delegation-patterns` | references + scripts | Delegation envelope defines identity, scope, expected output, status protocol, depth limits, and resume envelope. [VERIFIED: `.opencode/skills/hm-subagent-delegation-patterns/references/delegation-envelopes.md:1-101`] | Strong bundle; needs external support for handoffs/session tracking. |
| `hm-coordinating-loop` | 4 references + 2 eval files + 8 scripts | Core loop is ASSESS to DECIDE MODE to DISPATCH to MONITOR to INTEGRATE to VERIFY, with blocking scripts G1-G5. [VERIFIED: `.opencode/skills/hm-coordinating-loop/SKILL.md:62-168`] | Strongest bundle; adapt external workflow-agent patterns. |
| `hm-user-intent-interactive-loop` | 5 references + 2 eval files + scripts | Hard gates require max 3 questions, six PROBE stop conditions, hierarchy verification, and validation loop. [VERIFIED: `.opencode/skills/hm-user-intent-interactive-loop/SKILL.md:24-77`] | Strong bundle; external sources mainly support HITL/resume/checkpoint discipline. |
| `hivefiver-delegation-gates` | `references/gates.md` + scripts | Authorization gates validate skills loaded, specialist availability, capability match, scope, and human checkpoint. [VERIFIED: `.opencode/skills/hivefiver-delegation-gates/references/gates.md:1-180`] | Include as delegation-boundary lineage source. |

## Domain Cluster 1: Durable Completion and Phase Loops

### Top 3 third-party sources

1. **LangGraph durable execution / interrupts** — LangGraph defines durable execution as saving progress at key points so workflows can pause/resume; it requires persistence/checkpointers and thread identifiers, warns that resumed workflows replay from a starting point rather than continuing same source line, and recommends wrapping side effects/non-determinism in tasks or nodes. [CITED: `https://langchain-ai.github.io/langgraph/concepts/durable_execution/`] LangGraph interrupts persist graph state, wait indefinitely, and resume with `Command(resume=...)` using the same `thread_id`. [CITED: `https://langchain-ai.github.io/langgraph/how-tos/human_in_the_loop/add-human-in-the-loop/`]
2. **AutoGen termination conditions** — AutoGen AgentChat treats termination as first-class: stateful callable conditions inspect delta messages since last call, return `StopMessage`, reset after runs, can combine with AND/OR, and include max-message, text-mention, timeout, handoff, external, and functional termination. [CITED: `https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/termination.html`]
3. **Google ADK LoopAgent** — ADK `LoopAgent` deterministically repeats sub-agents until max iterations or a termination mechanism; docs explicitly warn the `LoopAgent` itself does not decide when to stop and needs max iterations or sub-agent escalation/flag/specific value. [CITED: `https://google.github.io/adk-docs/agents/workflow-agents/loop-agents/`]

### Pattern 1/2/3 decisions

| Pattern | Source lineage | Decision |
|---|---|---|
| Pattern 1: Durable cursor loop | LangGraph checkpointer + `thread_id` + replay-safe tasks | **ADAPT**: require persistent loop cursor (`iteration`, `prev_issue_count`, target path, verification command, last result) before any resume claim. Do not add LangGraph as dependency. |
| Pattern 2: Composable termination predicates | AutoGen termination conditions | **ADAPT**: make done criteria explicit predicates: max-iteration, pass marker, issue-count trend, user/handoff checkpoint, timeout/budget, and external stop. |
| Pattern 3: Deterministic workflow agent | Google ADK `LoopAgent` | **ADOPT conceptually**: loop control must be deterministic policy; subagents may be LLM-driven. |

**Blocked per-skill remainder:** exact per-skill top-3 for `hm-completion-looping` and `hm-phase-loop` remains BLOCKED; this cluster-level top-3 is enough for a first hardening pass, not final RICH PASS.

## Domain Cluster 2: Multi-Agent Delegation, Handoffs, and Coordination

### Top 3 third-party sources

1. **OpenAI Agents SDK handoffs + guardrails + tracing** — Handoffs let one agent delegate to another specialized agent and expose handoffs as tools like `transfer_to_<agent_name>` with callbacks, structured input, input filters, enabled predicates, and history behavior. [CITED: `https://openai.github.io/openai-agents-python/handoffs/`] Guardrails run as input/output/tool checks; tripwires halt execution; docs warn workflow-boundary guardrails do not cover every delegated tool edge. [CITED: `https://openai.github.io/openai-agents-python/guardrails/`] Tracing records agent runs, tool calls, handoffs, and guardrails as traces/spans by default. [CITED: `https://openai.github.io/openai-agents-python/tracing/`]
2. **AutoGen Swarm** — AutoGen `Swarm` lets agents hand off tasks to other agents via `HandoffMessage`, selects the next speaker from the most recent handoff, supports handoff to `user`, and continues until a termination condition is met. [CITED: `https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/swarm.html`]
3. **Claude Code subagents + hooks** — Claude Code subagents run in separate context windows with custom prompts, tool access, and permissions. [CITED: `https://docs.anthropic.com/en/docs/claude-code/sub-agents`] Claude Code hooks expose lifecycle events including `SubagentStart`, `SubagentStop`, `TaskCreated`, `TaskCompleted`, `PreToolUse`, `PostToolUse`, and `Stop`. [CITED: `https://docs.anthropic.com/en/docs/claude-code/hooks`]

### Pattern 1/2/3 decisions

| Pattern | Source lineage | Decision |
|---|---|---|
| Pattern 1: Handoff as explicit tool/event | OpenAI handoffs, AutoGen `HandoffMessage` | **ADAPT**: keep envelope-based delegation but add handoff metadata: source agent, target agent, reason, allowed destinations, history/filter policy, and expected return. |
| Pattern 2: Boundary guardrails at every edge | OpenAI guardrails, Claude hooks | **ADAPT**: distinguish workflow-boundary gates from per-tool/per-child gates. Add explicit child-output guardrail, not only final result verification. |
| Pattern 3: Local swarm without central coordination | AutoGen Swarm | **REJECT for Phase 30 core**: useful as inspiration, but unbounded peer-to-peer swarm conflicts with project rule that front-facing agents gate and track delegation. [VERIFIED: `AGENTS.md` instructions loaded in session] |

**Blocked per-skill remainder:** exact per-skill top-3 for `hm-subagent-delegation-patterns`, `hm-coordinating-loop`, and `hivefiver-delegation-gates` remains BLOCKED.

## Domain Cluster 3: Intent Clarification, Human-in-the-Loop, and Checkpoints

### Top 3 third-party sources

1. **LangGraph interrupts / HITL** — Interrupts pause execution, surface JSON-serializable payloads, persist state, wait indefinitely, and resume with the same thread ID; docs list approval, review/edit, tool-call review, and human input validation patterns. [CITED: `https://langchain-ai.github.io/langgraph/how-tos/human_in_the_loop/add-human-in-the-loop/`]
2. **AutoGen human handoff** — AutoGen Swarm supports handoff to `user`; execution stops and waits for user input, then resumes by sending a `HandoffMessage` to the agent that requested input. [CITED: `https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/swarm.html`]
3. **Temporal durable execution** — Temporal describes Workflow Executions as durable function executions with event history; workflows are reentrant processes that are resumable, recoverable, and reactive, executing to completion despite failures. [CITED: `https://docs.temporal.io/temporal`]

### Pattern 1/2/3 decisions

| Pattern | Source lineage | Decision |
|---|---|---|
| Pattern 1: Human interrupt as durable checkpoint | LangGraph interrupts, AutoGen user handoff | **ADAPT**: `hm-user-intent-interactive-loop` should model user questions/checkpoints as durable wait states with payload, required response shape, and resume pointer. |
| Pattern 2: Reentrant workflow state | Temporal event history | **ADAPT**: persist intent-loop phase, question count, user confirmation, and blockers before asking user; resume from state rather than conversation memory. |
| Pattern 3: Unbounded interrogation | None; anti-pattern contradicted by local skill | **REJECT**: retain max-3 question gate and six PROBE stop conditions. [VERIFIED: `.opencode/skills/hm-user-intent-interactive-loop/SKILL.md:28-46`] |

**Blocked per-skill remainder:** exact per-skill top-3 for `hm-user-intent-interactive-loop` remains BLOCKED; cluster sources justify HITL/checkpoint hardening but not question-taxonomy lineage.

## Cross-Skill Adoption Matrix

| Skill | Adopt/adapt now | Reject | Defer / Blocked |
|---|---|---|---|
| `hm-completion-looping` | Adapt AutoGen termination predicates; adapt OpenAI guardrail tripwire terminology; adapt tracing/evidence fields. | Reject unverified completion claims. | Per-skill top-3 source crawl. |
| `hm-phase-loop` | Adapt LangGraph durable cursor and Temporal reentrant-state language; keep deterministic max-3/stall loop. | Reject copy-loop and unbounded retries. | Eval/script decision and per-skill top-3. |
| `hm-subagent-delegation-patterns` | Adapt OpenAI/AutoGen handoff metadata; retain envelope and resume-by-session rule. | Reject fire-and-forget and peer-to-peer handoff without central audit. | Per-skill top-3 and deeper external repo comparison. |
| `hm-coordinating-loop` | Adapt ADK deterministic workflow-agent model and OpenAI per-edge guardrails. | Reject local swarm as governing architecture for this project. | Per-skill top-3. |
| `hm-user-intent-interactive-loop` | Adapt LangGraph/AutoGen human checkpoint as resumable wait state. | Reject unbounded interrogation. | Question taxonomy third-party lineage. |
| `hivefiver-delegation-gates` | Adapt OpenAI guardrail boundary distinction and Claude hooks lifecycle. | Reject human checkpoint without concrete options. | Not in Phase 30 initial five-skill baseline; include only if planner expands scope. |

## Execution Readiness

**Ready for a first hardening pass:** yes, with cluster-level evidence.  
**Ready for final RICH PASS:** no.

### Recommended first hardening pass

1. Add a shared guardrail vocabulary to all target skills: durable cursor, termination predicate, handoff metadata, per-edge guardrail, trace/evidence span, and explicit resume pointer. [CITED: LangGraph, AutoGen, OpenAI Agents SDK, Claude Code hooks]
2. Strengthen `hm-phase-loop` with a small `evals/` or `scripts/` resource because baseline currently observes references only. [VERIFIED: `30-RICH-GATE-BASELINE.md:5-8`]
3. Add per-child/per-tool edge checks to `hm-coordinating-loop` and `hivefiver-delegation-gates`, not just final workflow gates. [CITED: `https://openai.github.io/openai-agents-python/guardrails/`]
4. Add durable checkpoint wording to `hm-user-intent-interactive-loop`: question count + intent state must be persisted before waiting for the user. [CITED: `https://langchain-ai.github.io/langgraph/how-tos/human_in_the_loop/add-human-in-the-loop/`; `https://docs.temporal.io/temporal`]

### Remaining blockers

- **BLOCKED:** exact top-3 third-party sources per skill. This artifact selected top-3 per cluster due call budget.
- **BLOCKED:** bundled resource diff for every source repository; official docs and DeepWiki summaries were inspected, but full repo resource trees were not crawled.
- **BLOCKED:** question-taxonomy lineage for `hm-user-intent-interactive-loop`; third-party sources strongly support HITL/checkpoints but not the local max-3 question taxonomy.

## Sources Consulted

### Official documentation / primary sources

- LangGraph durable execution: `https://langchain-ai.github.io/langgraph/concepts/durable_execution/`
- LangGraph interrupts / human-in-the-loop: `https://langchain-ai.github.io/langgraph/how-tos/human_in_the_loop/add-human-in-the-loop/`
- AutoGen termination: `https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/termination.html`
- AutoGen Swarm: `https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/swarm.html`
- OpenAI Agents SDK handoffs: `https://openai.github.io/openai-agents-python/handoffs/`
- OpenAI Agents SDK guardrails: `https://openai.github.io/openai-agents-python/guardrails/`
- OpenAI Agents SDK tracing: `https://openai.github.io/openai-agents-python/tracing/`
- Google ADK workflow agents: `https://google.github.io/adk-docs/agents/workflow-agents/`
- Google ADK loop agents: `https://google.github.io/adk-docs/agents/workflow-agents/loop-agents/`
- Claude Code subagents: `https://docs.anthropic.com/en/docs/claude-code/sub-agents`
- Claude Code hooks: `https://docs.anthropic.com/en/docs/claude-code/hooks`
- Temporal overview / durable execution: `https://docs.temporal.io/temporal`

### Repository-level summaries

- DeepWiki query on `langchain-ai/langgraph` for checkpointing, interrupts, and supervisor patterns. [VERIFIED: DeepWiki tool output]
- DeepWiki query on `microsoft/autogen` for coordination, termination, handoffs, and human input. [VERIFIED: DeepWiki tool output]
- DeepWiki query on `openai/openai-agents-python` for handoffs, guardrails, tracing, and lifecycle. [VERIFIED: DeepWiki tool output]
