# HIVEFIVER MISSIONS Vs. THE CONCEPTS' MISCONCEPTIONS

While most aspects of onboarding and planning remain relevant, several misconceptions persist that can incrementally build into irreversible regressions over time.

---

## The Lineage-Hierarchy-Domains Relationship: Granular Engineering to Harness

We are constructing the Hivefiver lineage, referring to the Hivefive meta-builder module. The mission of this lineage when deployed in other projects with running Hivemind engines wrapping OpenCode is: **Providing users with advanced configuration of stacking and chaining workflows that best suit their purposes.**

### Critical Implicit Assumptions Often Overlooked

The environment is client-facing, and certain variables must not be taken lightly. These variables differ based on their origin:

| Variable Type | Characteristics | Risk Level |
|---------------|-----------------|------------|
| Deterministic/Programmatic | Calculated, scripted, explicit logic | High if mishandled |
| Initiator/Trigger Actors | Event-driven, cause-effect chains | Critical for sequencing |
| Pathing/Naming Conventions | Structural integrity, references | Breaks if inconsistent |
| Vocabulary/Framework | Semantic meaning, standards | Causes misalignment |
| Reflective Models | Meta-interpretations | Ambiguity if unclear |

**The following are implicit assumptions that have NOT been properly addressed:**

Since the environment is client-facing, there exist variables in charge that should not be taken lightly—particularly when they originate from deterministic, programmatic, initiator, and trigger actors versus when reflecting to models. Mindless, careless setup without variants, without setting up for scaling and incremental build-up, nor without spaces for mistakes, can compound issues exponentially.

For example:

<user_example_context_start>
- Instructing with absolute "MUST" orders without variant handling
- Requiring git hash tracking into `[plan.md](http://plan.md)` without acknowledging that hierarchical plan.md files exist at multiple levels
- Creating a plan.md that cannot contain level 4/4 corporate complexity PRD requiring breakdown
- Not instructing regex searches for pattern matching
- <user_example_context_end>
<user_prompt_context_resume>
These represent examples of how things can go wrong, and these issues compound when matrixed into hierarchical contexts requiring progressive coverage of relational entities, anticipating variants, and interleaving thinking that includes previous points as rationales. When everything clicks, proceed downstream.
</user_prompt_context_resume>

<hierarchical_context_start>
**Order of Operations for Hierarchical Context:**

1. In order of the hierarchy, progressively expand the coverage of relational entities
2. Further anticipate variants
3. Make interleaving thinking that includes previous points as rationales
4. When everything clicks, proceed downstream
5. Do not put too much conditional hedging ("but...wait...i think...")
</hierarchical_context_end>

---

## Operational Systems and Development Environments

The systems in use are OpenCode-based but span Windows, Linux, and macOS environments. These OS differences must be accounted for in all engineering decisions.

---

## Agents Dev Platforms and Skills Ecosystem

Similar to OpenCode, there are approximately 100+ Agents Dev Platforms that adopt skills (reference: [agentskills.io/what-are-skills](https://agentskills.io/what-are-skills)).

### Skills Definition and Function

Skills can be summarized as:
- Universal, natural language-activated
- Self-contained teaching-an-expertise kits
- Regulate other skills as background knowledge
- May be in charge of entire workflows until designed purposes are fulfilled
- Often contain bash parameters and portable scripts for reutilization

### Skills Constraints in AI Development

The proliferation of skills creates certain constraints when developing with AI:
- Users employ skills (project or global) across different platforms
- Skills remain discoverable as candidates when users prompt with command combinations
- Command syntax: `prompt X` with `command Y`
- Command Y is stacked with parsed workflows, references, and/or instructions in YAML headers or deterministic XML tags

<giving_example_context_start>
**Example Execution Context:**
```xml
<execution_context>
@~/.claude/get-shit-done/workflows/audit-uat.md
</execution_context>
```
This will definitely change agent behavior and decision-making. The agent will execute this with 98% certainty regardless of where it appears in the command body.
</giving_example_context_end>

**Therefore:** Skills and commands must be crafted with precision and granular composition. Without this, they become messy and conflict with each other.

---

## Engineering Harness Factors for OpenCode Agents

Since all platforms use OpenCode Agents coding platform, the following factors must be incorporated into the engineering harness:

| Scope | Contributing Factors |
|-------|---------------------|
| Local | Immediate execution context |
| Global | System-wide configurations |
| Extended | Additional contributors requiring acknowledgment |

For the easiest gaping flow, it always starts with:

<hierarchical_context_start>
1. An agent or command with prompt
2. Prompting + commands
3. Users' intention (interchangeable with manually selected commands because if command is configured as subagents, subagents run first and return results to the main agent)
4. Skills are highly flexible but shape workflow decisions of what to do next
</hierarchical_context_end>

---

## Understanding Lineage: Capabilities and Boundaries

The lineage brought to shaping the capabilities and boundaries in workflows regarding the next ones requires systematic understanding of:
- Inherited properties from meta-builder modules
- Scope limitations based on deployment context
- Configuration boundaries for stacking/chaining operations
- Scaling considerations for incremental builds

---

## Prevention Mechanisms

### When Starting the Flow: Agent Role Awareness

**Critical Question:** "Are you Coordinator/Orchestrator or are you being coordinated/delegated?"

This is a head-turner if you are unaware you are not in the team. If you do not know, **get yourself stopped and step out.**

### Immediate Signs of Role Misidentification

These signs are based on:

1. **Not knowing the very first user's prompting** when a new session starts, and for delegated agents, not knowing the orchestrator's first prompt
2. **The first actions of the session are not among context-integrity status and implementation**

---

## Engineering Tips and Best Practices

### Tool Utilization

Some tools are useful particularly in the innate tools section. Explicitly document how certain tools are used to improve evocations.

### Avoiding Over-Engineering Pitfalls

Over-engineering can always be applied through:
- More analytical breakdown
- Hierarchical structuring
- Guardrails implementation
- Stacking mechanisms
- Granular control application

### Composition Patterns

Consider how:
- Tools can be stacked
- Commands relate to tasks `$ARGUMENT`
- Agents' permissions apply
- Plugins can include tools
- Progressive disclosure design patterns follow context budgets

### Workflow Utilization

Workflows, references, and templates can all be utilized with harness techniques for:
- Conditional uses of commands
- Workflow invocation toward CLI commands
- Invocation of different subtasks as subagent

### Granular Over Restrictive

**Be granular and instructive over banning and blocking.** It is all simpler with a well-crafted prompt.

---

## Summary Matrix: Key Misconception Vectors

| Vector | Misconception | Correct Approach |
|--------|---------------|-------------------|
| Variable Origins | Treating all variables equally | Differentiate by deterministic vs. reflective |
| Role Awareness | Assuming coordinator status | Verify role before acting |
| Skills Composition | Ad-hoc skill usage | Granular, well-crafted compositions |
| Command Context | Ignoring execution context tags | Honor XML/YAML execution contexts |
| Scaling Readiness | Single-instance thinking | Design for incremental build-up |
| Hierarchical Context | Linear processing | Progressive disclosure with variant anticipation |
| Constraint Handling | Absolute "MUST" orders | Variant-aware conditional instructions |