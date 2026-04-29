---
name: hf-agent-composition
description: Teaches agents how to compose specialist agents from user intent using XML markup grammar, step protocols, and structured return formats. Use when creating agents, designing agent definitions, composing multi-agent workflows, writing agent XML blocks, structuring execution flows, defining deviation rules, setting checkpoint protocols, or building structured return templates. NOT for direct code implementation.
metadata:
  layer: "2"
  role: "composition"
  pattern: P2
allowed-tools: Read Write Edit Bash Glob Grep
---

## Overview

Teaches agents how to compose specialist agents from user intent using XML markup grammar, step protocols, and structured return formats. Use when creating agents, designing agent definitions, composing multi-agent workflows, writing agent XML blocks, or building structured return templates. Produces complete agent definitions ready for deployment.

## Quick Jump

| Need | Reference |
|------|-----------|
| "What XML blocks exist?" | [XML Markup Grammar](references/xml-markup.md) |
| "How do steps work?" | [Step Protocols](references/step-protocols.md) |
| "What does the agent return?" | [Structured Returns](references/structured-returns.md) |
| "How do deviation rules work?" | [Deviation Rules](references/deviation-rules.md) |
| "How do checkpoints work?" | [Checkpoint Protocols](references/checkpoint-protocols.md) |
| "How do agents chain together?" | [Chaining Patterns](references/chaining-patterns.md) |
| "Need a starting template?" | [Agent Definition Template](assets/templates/agent-definition.md) |
| "See a complete example?" | [Worked Example: Performance Auditor](examples/gsd-performance-auditor.md) |

## First Action

When asked to compose or design an agent:

1. Identify the **agent type** (researcher, planner, executor, verifier, auditor, etc.)
2. Determine the **execution pattern** (linear, checkpointed, deviation-aware, read-only)
3. Select the required **XML blocks** from the quick reference below
4. Load the matching reference file for depth
5. Start from `assets/templates/agent-definition.md` for a skeleton, or study `examples/gsd-performance-auditor.md` for a complete worked example
6. Draft the agent definition using the patterns taught here

## XML Block Quick Reference

Every GSD agent definition uses these XML blocks. Pick by purpose:

| Block | Required | Purpose | Example Agents |
|-------|----------|---------|----------------|
| `<role>` | Yes | Identity injection — who this agent is, what it does | All 24 agents |
| `<execution_flow>` | Yes | Ordered `<step>` sequence — the agent's main loop | executor, verifier, nyquist, security |
| `<step name="...">` | Yes (inside execution_flow) | Named, prioritized steps with I/O contracts | All execution agents |
| `<structured_returns>` | Yes | Deterministic output format templates | nyquist, security, verifier |
| `<success_criteria>` | Yes | Validation checklist — how to know the agent did its job | nyquist, security |
| `<project_context>` | Yes | Discovery protocol — AGENTS.md → skills → rules chain | All 24 agents |
| `<core_principle>` | No | Non-negotiable philosophy blocks | verifier, planner |
| `<deviation_rules>` | No | Numbered auto-apply rules with scope boundaries | executor |
| `<checkpoint_protocol>` | No | Pause/resume with typed checkpoints | executor |
| `<analysis_paralysis_guard>` | No | Stuck detection — read-without-action limit | executor |
| `<authentication_gates>` | No | Error-as-gate pattern for auth failures | executor |
| `<discovery_levels>` | No | Research depth routing | planner |
| `<mcp_tool_usage>` | No | MCP server instruction block | executor, planner |
| `<context_fidelity>` | No | User decision enforcement | planner |
| `<scope_reduction_prohibition>` | No | Anti-simplification guard | planner |

**Decision rule:** If the agent executes tasks → needs `<execution_flow>`. If the agent verifies → needs `<structured_returns>` + `<success_criteria>`. If the agent plans → needs `<discovery_levels>` + `<context_fidelity>`.

## The Five Non-Negotiables

Every GSD agent definition MUST include these patterns. Without any one, the agent breaks.

### 1. Mandatory Initial Read Enforcement

```markdown
**CRITICAL: Mandatory Initial Read**
If the prompt contains a `<files_to_read>` block, you MUST use the `Read` tool
to load every file listed there before performing any other actions.
```

This pattern appears in all 24 agents. Without it, agents hallucinate context instead of loading the prompt's structured context blocks. Include this text (or a close variant) in every agent you compose.

### 2. Project Context Discovery Chain

```markdown
**Project instructions:** Read `./AGENTS.md` if it exists.
**Project skills:** Check `.claude/skills/` or `.agents/skills/`:
1. List available skills (subdirectories)
2. Read `SKILL.md` for each skill
3. Load specific `rules/*.md` files as needed
```

Every agent discovers context through this chain: AGENTS.md → skills → rules. This ensures project-specific patterns apply during execution. Adapt the wording to match the agent's purpose, but keep the discovery order.

### 3. Read-Only Enforcement for Verification Agents

```markdown
**Implementation files are READ-ONLY.**
Only create/modify: {allowed outputs}.
Implementation gaps → ESCALATE. Never fix implementation.
```

Verifiers, auditors, and checkers MUST NOT modify implementation. They report; they don't patch. This prevents the "verifier fixes what it should flag" anti-pattern.

### 4. Structured Return Enforcement

Every agent returns one of these formats — never free-form text:

| Agent Type | Return Format | Reference |
|------------|--------------|-----------|
| Executor | SUMMARY.md + checkpoint message | [Checkpoint Protocols](references/checkpoint-protocols.md) |
| Verifier | VERIFICATION.md with status table | [Structured Returns](references/structured-returns.md) |
| Nyquist Auditor | GAPS FILLED / PARTIAL / ESCALATE | [Structured Returns](references/structured-returns.md) |
| Security Auditor | SECURED / OPEN_THREATS / ESCALATE | [Structured Returns](references/structured-returns.md) |
| Planner | PLAN.md with frontmatter + tasks | [Step Protocols](references/step-protocols.md) |

### 5. Escalation Gate Pattern

When an agent encounters something it cannot resolve:

```markdown
**ESCALATE** — surface the gap, don't fix blindly.
Document: what found, why it blocks, suggested action.
```

This prevents agents from making destructive changes they shouldn't. Nyquist auditor, security auditor, and verifier all use this pattern.

## Anti-Patterns — NEVER

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **Content Dump** — copying agent descriptions into the SKILL.md | >400 lines, no XML blocks, no decision tree | Synthesize patterns, don't copy content |
| **Missing Initial Read** — no `<files_to_read>` enforcement | Agent definition lacks "Mandatory Initial Read" text | Add verbatim enforcement block |
| **Free-Form Returns** — no structured return format | No `<structured_returns>` block | Add typed return format (SECURED/ESCALATE/etc.) |
| **Read-Only Violation** — verifier modifies implementation | Agent can edit source files | Add read-only enforcement + ESCALATE |
| **No Escalation Path** — agent must fix everything it finds | No ESCALATE pattern, no gap surfacing | Add escalation gate |
| **Step Soup** — unnamed, unordered steps | `<step>` blocks without `name=` attribute | Name every step, order by execution flow |

## Loading Triggers

Load references only when needed. Do NOT load all references upfront.

```
Need to write XML blocks?           → Load references/xml-markup.md
Need to design step sequences?       → Load references/step-protocols.md
Need output formats?                 → Load references/structured-returns.md
Need deviation rule system?          → Load references/deviation-rules.md
Need checkpoint types?               → Load references/checkpoint-protocols.md
Need agent chain patterns?           → Load references/chaining-patterns.md
```

## Validation Gate

Before declaring an agent definition complete:

- [ ] `<role>` block with identity + scope
- [ ] `<execution_flow>` with named `<step>` blocks (if execution agent)
- [ ] `<structured_returns>` with typed output formats
- [ ] `<success_criteria>` checklist
- [ ] Mandatory Initial Read enforcement text
- [ ] Project context discovery chain
- [ ] Read-only enforcement (if verification agent)
- [ ] Escalation gate pattern
- [ ] No copy-paste from existing agents — synthesized patterns only

## Self-Correction

### When the Task Keeps Failing
[Detection] Agent definition has missing non-negotiables despite 3 attempts. Structured return format doesn't match any known agent type. XML block selection keeps producing incomplete definitions.
[Recovery] STOP composing. Check each of the Five Non-Negotiables one by one: (1) Mandatory Initial Read, (2) Project Context Discovery Chain, (3) Read-Only Enforcement (if applicable), (4) Structured Return Enforcement, (5) Escalation Gate Pattern. If all five are present but the agent still fails, the issue is likely the role definition — the agent's identity may not match its execution pattern. Re-examine the agent type before continuing.

### When Unsure About the Next Step
[Detection] The agent's purpose doesn't clearly match a known agent type (researcher/planner/executor/verifier/auditor). Unclear which XML blocks are required vs optional. Unsure whether the agent needs read-only enforcement.
[Recovery] Start from `assets/templates/agent-definition.md` for the skeleton. Use the decision rule: if the agent executes tasks → needs `<execution_flow>`. If the agent verifies → needs `<structured_returns>`. If it reports findings without modifying code → needs read-only enforcement. Study `examples/gsd-performance-auditor.md` for a complete reference implementation.

### When the User Contradicts Skill Guidance
[Detection] User says "don't bother with structured returns" or "the agent doesn't need an escalation path" or "skip the initial read enforcement." User wants to omit one of the Five Non-Negotiables.
[Recovery] Explain which non-negotiable is being challenged and why it matters: "Agents without Mandatory Initial Read hallucinate context. Agents without structured returns produce inconsistent output. Agents without escalation paths make destructive changes when stuck." If the user still insists, document the omission in the agent definition as a deliberate deviation with rationale. Never omit silently.

### When an Edge Case Is Encountered
[Detection] Agent needs a pattern not covered by the 15 XML blocks (e.g., rate-limiting, retry logic, circuit-breaking). Agent combines multiple execution patterns (executor + verifier hybrid). Agent must work across platforms with different tool names.
[Recovery] For missing patterns: analyze whether the pattern can be composed from existing XML blocks. Rate-limiting could be a `<deviation_rules>` entry. Circuit-breaking could be an `<analysis_paralysis_guard>` variant. For hybrid agents: apply the strictest pattern. For cross-platform: define the canonical pattern in the agent definition and document platform-specific tool mappings in a platform adapter section.
