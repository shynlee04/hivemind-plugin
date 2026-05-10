# Hierarchy Alignment Protocol — Agent Body Rewrites

**Date:** 2026-05-10
**Author:** hm-l0-orchestrator
**Status:** LOCKED — all agent body rewrites MUST comply

---

## Purpose

Every shipped agent body must explicitly wire into the Hivemind hierarchical system. This protocol defines the required cross-references that bind the agent fleet into a coherent delegation graph.

---

## 1. Mandatory XML Tags for All Agents

Every agent body MUST contain these tags. No exceptions.

### Vertical References (Upstream/Downstream)

```xml
<hierarchy>
  **Level:** [L0|L1|L2|L3]
  **Receives from:** [parent agent name or "USER" for L0]
  **Delegates to:** [list of child agents, or "TERMINAL — never delegates"]
  **Escalates to:** [parent agent name for issues beyond scope]
</hierarchy>
```

### Horizontal References (Peers)

```xml
<peer_network>
  **Domain peers:** [agents at same level sharing the domain]
  **Cross-domain bridges:** [agents at same level in different domains that this agent collaborates with]
  **Cannot interact with:** [agents outside lineage or above in hierarchy]
</peer_network>
```

### Loop Participation

```xml
<loop_participation>
  **Primary loop:** [which loop this agent participates in]
  - coordinating-loop | completion-looping | phase-loop | research-chain | phase-execution
  **Role in loop:** [what this agent does within the loop cycle]
  **Entry trigger:** [what condition causes this agent to be spawned]
  **Exit condition:** [what condition causes this agent to return results]
  **Loop boundary:** [max iterations or timeout before escalation]
</loop_participation>
```

### Classification

```xml
<classification>
  **Lineage:** [hm|hf|gate|stack|gsd]
  **Domain:** [Quality|Debug|Research|Planning|Execution|Coordination|Context|Meta-Builder]
  **Role type:** [orchestrator|coordinator|executor|specialist|reference]
  **Granularity:** [what specificity level this agent operates at]
  **Delegation authority:** [can this agent delegate, and to whom]
</classification>
```

---

## 2. Depth-Level Body Requirements

### L0 — Orchestrator (Front-Facing)

- Must contain `<hierarchy>` with `Receives from: USER`
- Must enumerate ALL L1 agents it can delegate to
- Must contain workflow routing logic (which intent → which L1)
- Must NOT contain implementation instructions
- Must reference coordination/loop skills it uses for dispatch

### L1 — Coordinator (Wave Manager)

- Must contain `<hierarchy>` with `Receives from: [L0 orchestrator]`
- Must enumerate ALL L2 agents in its domain
- Must contain wave-based dispatch patterns (parallel vs sequential decision)
- Must contain gate enforcement protocol (what to check before accepting L2 results)
- Must reference coordinating-loop and completion-looping skills

### L2 — Specialist (Terminal Executor)

- Must contain `<hierarchy>` with `Receives from: [specific L1 coordinator]` and `Delegates to: TERMINAL`
- Must contain `<delegation_boundary>` with explicit escalation rules
- Must contain expert domain knowledge (concrete patterns, not generic descriptions)
- Must contain `<execution_flow>` with concrete tool calls (grep patterns, read sequences)
- Must reference its mandatory skills and the commands that trigger it

### L3 — Reference (Knowledge Base)

- Must contain `<hierarchy>` with `Receives from: [any agent in lineage]` (read-only)
- Must contain knowledge content, not execution instructions
- Must NOT delegate or mutate state
- Must be consumable as a reference by L2 specialists

---

## 3. Cross-Reference Wiring Rules

### Rule 1: Every delegation edge is bidirectional

If agent A says `Delegates to: [B]`, then agent B must say `Receives from: [A]`.
If any edge is one-directional, it's a wiring defect.

### Rule 2: Loop participation must be explicit

Every agent must declare which loop(s) it participates in:
- `coordinating-loop`: L1 coordinators and above
- `completion-looping`: L2 agents that verify their own work
- `phase-loop`: L1/L2 agents in iterative phase execution
- `research-chain`: L2/L3 agents in detect→research→synthesize pipeline
- `phase-execution`: L2 agents executing plan waves

### Rule 3: Domain classification determines peer network

Agents in the same domain at the same level are peers. They must NOT delegate to each other (that goes through the parent L1). They MAY reference each other in `<peer_network>`.

### Rule 4: Lineage boundary is strict

- hm-* agents ONLY reference hm-* skills and hm-* agents
- hf-* agents reference hf-* skills AND hm-* skills (cross-lineage bridge)
- L3 reference skills are shared across lineages
- gsd-* is never referenced by shipped agents

### Rule 5: Command routing must be declared

Every agent that is triggered by a command must declare:
```xml
<command_routing>
  **Triggered by:** [list of commands that spawn this agent]
  **Expected input:** [what the command provides in the task packet]
  **Expected output:** [what the agent returns to the command workflow]
</command_routing>
```

---

## 4. Body Template — All Agents

```xml
# [agent-name]

<role>
[1-2 sentences: who am I, what domain, what level]
</role>

<hierarchy>
**Level:** [L0/L1/L2/L3]
**Receives from:** [parent]
**Delegates to:** [children or TERMINAL]
**Escalates to:** [parent for out-of-scope issues]
</hierarchy>

<classification>
**Lineage:** [hm|hf]
**Domain:** [domain name]
**Role type:** [orchestrator|coordinator|specialist|reference]
**Delegation authority:** [can delegate to X, cannot delegate to Y]
</classification>

<loop_participation>
**Primary loop:** [loop name]
**Role in loop:** [what this agent does]
**Entry trigger:** [when spawned]
**Exit condition:** [when returns]
**Loop boundary:** [max iterations/timeout]
</loop_participation>

<task>
[Ordered list of concrete steps this agent takes]
</task>

<scope>
**In scope:** [what this agent does]
**Out of scope:** [what this agent does NOT do — escalate to parent]
</scope>

<context>
[Domain expert knowledge: concrete patterns, regex, anti-patterns, language-specific checks]
</context>

<execution_flow>
<step name="step_name" priority="first|normal|last">
[Concrete action with tool calls, grep patterns, file reads]
</step>
</execution_flow>

<expected_output>
[Structured output format with field definitions]
</expected_output>

<verification>
[Checklist of what must be true before returning]
</verification>

<iron_law>
[Non-negotiable rule]
</iron_law>

<output_contract>
[Template for structured return to parent]
</output_contract>

<behavioral_contract>
**MUST:** [required behaviors]
**MUST NOT:** [forbidden behaviors]
**SHOULD:** [recommended behaviors]
</behavioral_contract>

<anti_patterns>
| Anti-Pattern | Detection | Correction |
</anti_patterns>

<delegation_boundary>
[When to stop and escalate, with specific conditions]
</delegation_boundary>

<peer_network>
**Domain peers:** [same-level agents in same domain]
**Cross-domain bridges:** [same-level agents in other domains]
**Cannot interact with:** [out-of-bounds agents]
</peer_network>

<skill_loading>
**Mandatory:** [skills this agent MUST load]
**Optional:** [skills this agent MAY load based on task]
**Never:** [skills this agent MUST NOT load]
</skill_loading>

<command_routing>
**Triggered by:** [commands that spawn this agent]
**Expected input:** [what the command provides]
**Expected output:** [what the agent returns]
</command_routing>

<session_continuity>
[State management: who persists, who reads, recovery paths]
</session_continuity>

<self_correction>
[What to do when stuck, conflicting, or uncertain]
</self_correction>

<naming>
Compliant with hf-naming-syndicate: [agent-name]
</naming>
```

---

## 5. Quality Gate for Rewrites

Every rewritten agent body must pass these checks:

| Gate | Check | Pass Criteria |
|------|-------|---------------|
| G1 | Hierarchy tags present | `<hierarchy>`, `<classification>`, `<loop_participation>` exist |
| G2 | Bidirectional delegation | Every `Delegates to` has matching `Receives from` in target |
| G3 | Loop participation declared | At least one loop with role, entry, exit, boundary |
| G4 | Domain expertise present | Concrete patterns, not generic descriptions |
| G5 | Execution flow concrete | Specific tool calls, grep patterns, read sequences |
| G6 | Command routing declared | If triggered by commands, `<command_routing>` exists |
| G7 | Peer network accurate | Domain peers listed, cross-domain bridges identified |
| G8 | Lineage boundary respected | No references to wrong-lineage skills/agents |
| G9 | Schema completeness | All mandatory XML tags present with content |
| G10 | Self-correction present | Handles stuck/uncertain/conflicting scenarios |

---

## 6. Domain Map — L2 Agent Classification

| Domain | L2 Agents | L1 Coordinator | L0 Orchestrator |
|--------|-----------|----------------|-----------------|
| Quality | reviewer, auditor, validator, critic(→merge) | hm-l1-coordinator | hm-l0-orchestrator |
| Debug | debugger, investigator | hm-l1-coordinator | hm-l0-orchestrator |
| Research | researcher, scout, synthesizer | hm-l1-coordinator | hm-l0-orchestrator |
| Planning | planner, strategist, ecologist | hm-l1-coordinator | hm-l0-orchestrator |
| Execution | executor, finisher, integrator | hm-l1-coordinator | hm-l0-orchestrator |
| Coordination | coordinator, conductor(→merge), router, operator | N/A (IS L1) | hm-l0-orchestrator |
| Context | prompt-engineer(merged 6), context-mapper(→merge) | hm-l1-coordinator | hm-l0-orchestrator |
| Meta-Builder | hf-l2-* agents | hf-l1-coordinator | hf-l0-orchestrator |
| Phase Mgmt | guardian, phase-guardian, persistor | hm-l1-coordinator | hm-l0-orchestrator |
| Authoring | writer, spec-verifier, curator | hm-l1-coordinator | hm-l0-orchestrator |
