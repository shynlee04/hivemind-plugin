---
name: use-hivemind
description: "Establish HiveMind framework context at session start. Detect lineage (hivefiver vs hiveminder), route to correct implementation skill. Blocks when context is degraded."
---

# use-hivemind

Establish HiveMind framework context and route to the correct implementation skill. This is the master entry point that runs at session start, after compaction, or when the user mentions framework terms.

## Anti-Pattern: When NOT to Use This Skill

- User says "just write some code" → WRONG, this is for framework routing, not implementation
- Agent says "I'll implement this directly" → WRONG, never implement in a router skill
- Session asks "what is hivemind" and agent bypasses routing to explain everything → WRONG, route to specialist
- Agent confuses hivefiver lineage with hiveminder lineage → WRONG, identify lineage before routing
- Agent says "framework work = project work" → WRONG, these are different lineages with different skills

## Process Flow

```digraph hivemind-entry {
  "Session Start" -> "Detect Platform"
  "Detect Platform" -> "Check Context Health"
  "Check Context Health" -> "Health OK?"
  "Health OK?" -> "Identify Lineage" [label="yes"]
  "Health OK?" -> "BLOCK - Context Degraded" [label="no"]
  "Identify Lineage" -> "hivefiver?" [label="framework"]
  "Identify Lineage" -> "hiveminder?" [label="project"]
  "hivefiver?" -> "Route to skill authoring" [label="yes"]
  "hiveminder?" -> "Route to domain skills" [label="yes"]
  "Route to skill authoring" -> "hivemind-skill-write"
  "Route to domain skills" -> "Domain specialist"
  "BLOCK - Context Degraded" -> "context-intelligence-entry"
}
```

## Activation Triggers (Semantically)

This skill activates when ANY of these scenarios occur:

### Session & Context (1-7)
1. **Session initialization**: New conversation starts, user says "help me", "start working", "continue"
2. **Context disruption**: After `/clear` command, after compaction, context feels unclear or confused
3. **After-session resume**: User says "resume", "pick up", "where did we leave off", "continue from"
4. **Context degradation**: User mentions "context rot", "lost context", "forgot what I was doing"
5. **Stack confusion**: User or agent says "too many skills", "stack overflow", "which skills loaded"
6. **Session health check**: User asks "is context healthy", "check session state", "how's my context"
7. **After interruption**: Session resumes after error, timeout, or unexpected termination

### Framework Reference (8-14)
8. **Framework reference**: User mentions "hivemind", "hive", "framework", "meta", "skill system", "agent hierarchy"
9. **Lineage confusion**: Agent or user asks "which lineage", "hivefiver or hiveminder", "who should do this"
10. **Meta-work requested**: User asks about skill authoring, agent creation, framework development
11. **Drift detection**: Context drift, pollution, or chain breaks are detected
12. **Skill routing request**: User asks "what skill do I use for X", "route to correct skill"
13. **Agent identity**: User asks "who am I", "what agent", "what can I do here"
14. **Permission inquiry**: User asks "can I", "am I allowed to", "do I have permission"

### Platform Detection (15-20)
15. **Platform mention**: User mentions "opencode", "claude code", "cursor", "codex", "gemini"
16. **OpenCode context**: Working in `.opencode/` directory, `opencode.json` present
17. **Platform detection**: Agent needs to determine which platform is active
18. **Agent tools check**: User asks "what tools do I have", "show me available tools"
19. **Agent capability**: User asks "can you delegate", "can you use subagents"
20. **Project vs global**: Unclear whether work is project-scoped or global

### Skill & Hierarchy (21-28)
21. **Skill activation**: User says "load a skill", "activate skill", "use skill", "which skills"
22. **Skill conflict**: User mentions "skill overlap", "which skill wins", "multiple skills"
23. **Hierarchy clarification**: User asks "who is orchestrator", "what is coordinator", "role confusion"
24. **Delegation request**: User mentions "delegate", "handoff", "send to subagent"
25. **Context verification**: User claims "done", "finished", "verify this is complete"
26. **Git memory**: User asks "what did we decide", "why was this changed", "commit history"
27. **TDD/Testing**: User mentions "test", "TDD", "verify", "assertion"
28. **Plan request**: User asks "make a plan", "what are the steps", "how do we proceed"

### Explicit Activation (29-35)
29. **Explicit hivemind**: User says "use hivemind", "load hivemind framework"
30. **Framework guide**: User asks "hivemind guide", "how does hivemind work", "explain framework"
31. **Start hivemind**: User says "start hivemind", "initialize framework", "bootstrap hivemind"
32. **Skill system**: User mentions "skill routing", "agent hierarchy", "framework design"
33. **Context chain**: User mentions "parent context", "child context", "context inheritance"
34. **Memory encoding**: User asks "save this", "remember this", "encode to git"
35. **Verification gate**: User mentions "gate", "checkpoint", "before merge"

## Step-by-Step Protocol

1. **DETECT** — Is this session start, after compaction, or framework reference?
2. **CHECK** — Run context health assessment
3. **IF** context health fails → Route to `context-intelligence-entry`, STOP
4. **IDENTIFY** — Is this hivefiver (framework) or hiveminder (project) lineage?
5. **ROUTE** — Send to appropriate specialist skill based on lineage:
   - hivefiver + "write/audit skill" → `hivemind-skill-write`
   - hivefiver + "context/delegation" → respective specialist
   - hiveminder + "implement feature" → domain skills
6. **TEACH** — If lineage unclear, ask one clarifying question

## Key Principles

- **Framework work ≠ project work**: Explicitly identify lineage before routing. hivefiver = framework dev, hiveminder = project dev.
- **Routing is not implementation**: Never implement directly. Hand off to specialist skills for execution.
- **Session start is privileged**: Always load first, defer other skills until framework context is established.
- **Platform detection is mandatory**: OpenCode vs Claude Code vs Cursor have different activation contracts.
- **Two lineages, two paths**: hivefiver routes to meta-builder skills; hiveminder routes to domain skills.

## Terminal State

- **Lineage identified**: User/agent knows which path to take
- **Specialist skill loaded**: Correct implementation skill is active
- **Context healthy**: Session ready for work
- **Next skill**: `hivemind-skill-write` (hivefiver) or domain specialist (hiveminder)

## No-Load Conditions

- Context depth >70% → Defer to `context-intelligence-entry` for recovery
- Session state is degraded → Skip activation entirely
- Stack budget exhausted (Active skills ≥3) → Wait for available slot
- Authority unclear (Conflicting SOT) → Escalate before routing
- Another meta-skill active → Defer to active meta-skill
