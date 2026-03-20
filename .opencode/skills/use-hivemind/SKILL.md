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

1. **Session initialization**: New conversation starts, user says "help me", "start working", "continue"
2. **Context disruption**: After `/clear` command, after compaction, context feels unclear or confused
3. **Framework reference**: User mentions "hivemind", "hive", "framework", "meta", "skill system", "agent hierarchy"
4. **Lineage confusion**: Agent or user asks "which lineage", "hivefiver or hiveminder", "who should do this"
5. **Meta-work requested**: User asks about skill authoring, agent creation, framework development
6. **Drift detection**: Context drift, pollution, or chain breaks are detected
7. **Skill routing request**: User asks "what skill do I use for X", "route to correct skill"

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
