# Reference 03: Lineage Routing Tree

**See also:** [04-project-phase-routing.md](#)

## Summary

Decision tree for routing user requests to the correct lineage (hm-* product development vs hf-* meta-concept authoring). Re-evaluate every turn — context changes.

## Complete Decision Tree

```
USER REQUEST RECEIVED
    |
    ├── Starts with /hf-* command?
    |   └── YES → hf-* lineage → load hf-l2-skill-router
    |
    ├── Starts with /plan, /ultrawork, /gsd-*?
    |   └── YES → hm-* lineage → load hm-l2-lineage-router
    |
    ├── About agents, skills, commands, tools?
    |   |
    |   ├── "create an agent", "add agent", "build agent"
    |   |   └── hf-* lineage → Agent Building domain
    |   |
    |   ├── "create a skill", "write SKILL.md", "audit skill"
    |   |   └── hf-* lineage → Skill Authoring domain
    |   |
    |   ├── "create a command", "add slash command"
    |   |   └── hf-* lineage → Command Dev domain
    |   |
    |   ├── "build a custom tool", "create OpenCode plugin"
    |   |   └── hf-* lineage → Tool Building domain
    |   |
    |   └── "audit skills/agents", "check drift", "refactor meta"
    |       └── hf-* lineage → Audit/Refactor domain
    |
    ├── About features, bugs, architecture, implementation?
    |   |
    |   ├── "research", "investigate", "find out", "explore"
    |   |   └── hm-* lineage → Research workflow
    |   |
    |   ├── "plan", "spec", "requirements", "design", "architect"
    |   |   └── hm-* lineage → Planning workflow
    |   |
    |   ├── "implement", "build", "execute", "run phase", "code"
    |   |   └── hm-* lineage → Execution workflow
    |   |
    |   ├── "test", "verify", "quality", "TDD", "validate"
    |   |   └── hm-* lineage → Quality workflow
    |   |
    |   ├── "debug", "fix", "broken", "failing", "error"
    |   |   └── hm-* lineage → Debug workflow
    |   |
    |   └── "review", "audit", "readiness", "deploy check"
    |       └── hm-* lineage → Review workflow
    |
    └── Ambiguous?
        └── Use session-tracker to read last user turn
            └── Still ambiguous? → hm-* as default
```

## Decision Matrix: Action Verb → Lineage

| Action Verb | Lineage | Domain Bundle |
|-------------|---------|---------------|
| create, add, build (agent) | hf-* | Agent Building |
| create, write, audit (skill) | hf-* | Skill Authoring |
| create, add (command) | hf-* | Command Dev |
| build, create (tool/plugin) | hf-* | Tool Building |
| audit, drift, refactor (meta) | hf-* | Audit/Refactor |
| synthesize, extract (patterns) | hf-* | Synthesis |
| research, investigate, find | hm-* | Research |
| plan, spec, design, architect | hm-* | Planning |
| implement, build, execute, run | hm-* | Execution |
| test, verify, validate, TDD | hm-* | Quality |
| debug, fix, broken | hm-* | Debug |
| review, audit (code), readiness | hm-* | Review |
| configure, set up | hf-* or hm-* | Check subject matter |

## Cross-Lineage Rules

```
hm-* agents (STRICT):
  May load: hm-* skills (always), gate-* skills (for quality), stack-* skills (for reference)
  May NOT load: hf-* skills (unless explicitly routed with justification)

hf-* agents (FLEXIBLE):
  May load: hf-* skills (always), gate-* skills (for quality), stack-* skills (for reference)
  May load: hm-* skills for codebase investigation (hm-detective, hm-deep-research, hm-synthesis)
            Must document justification in return report.

gate-* skills (INTERNAL):
  May load: stack-* skills (for reference), hm-* skills for inspection
  May NOT load: hf-* skills (gates don't create meta-concepts)

stack-* skills (REFERENCE):
  May load: other stack-* skills (cross-reference)
  May NOT load: hm-* or hf-* skills (stack is read-only)
```

## Command Prefix Routing

| Prefix | Lineage | Load |
|--------|---------|------|
| `/hf-create` | hf-* | `hf-l2-skill-router` |
| `/hf-audit` | hf-* | `hf-l2-skill-router` |
| `/hf-stack` | hf-* | `hf-l2-skill-router` |
| `/hf-configure` | hf-* | `hf-l2-skill-router` |
| `/plan` | hm-* | `hm-l2-lineage-router` |
| `/ultrawork` | hm-* | `hm-l2-lineage-router` |
| `/gsd-*` | hm-* | `hm-l2-lineage-router` |
| No prefix | Classify by intent | See decision tree above |

## Depth Rules

```
L0 → L1 → L2  (one level per delegation)
L0 → L2       (ONLY for fast-path single-concept hf-* tasks)
L2 → L2       (NEVER — L2 cannot delegate)
L0 → L2 skip  (NEVER — always through coordinator)
Depth > 3     (NEVER — escalate to user)
```
