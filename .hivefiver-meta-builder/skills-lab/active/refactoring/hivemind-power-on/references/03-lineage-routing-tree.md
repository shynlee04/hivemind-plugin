# Reference 03: Lineage Routing Tree

## IMPORTANT: Re-Evaluate Every Turn

SKILL.md Section 3 says: **load this skill at every user turn.** The same applies to lineage routing — re-evaluate every time. A request that was hm-* 5 turns ago may have shifted to hf-*. A session that was active last turn may have completed. Don't cache routing decisions.

**The "no thought must" principle applies to delegation, not routing.** For routing, you DO need to think — the decision tree below helps you classify correctly. But once classified, delegate without overthinking.

---

## Complete Decision Tree

```
USER REQUEST RECEIVED
    │
    ├── Starts with /hf-* command?
    │   └── YES → hf-* lineage → load hf-l2-skill-router
    │
    ├── Starts with /plan, /ultrawork, /gsd-*?
    │   └── YES → hm-* lineage → load hm-l2-lineage-router
    │
    ├── About agents, skills, commands, tools?
    │   │
    │   ├── "create an agent", "add agent", "build agent"
    │   │   └── hf-* lineage → Agent Building domain
    │   │
    │   ├── "create a skill", "write SKILL.md", "audit skill"
    │   │   └── hf-* lineage → Skill Authoring domain
    │   │
    │   ├── "create a command", "add slash command"
    │   │   └── hf-* lineage → Command Dev domain
    │   │
    │   ├── "build a custom tool", "create OpenCode plugin"
    │   │   └── hf-* lineage → Tool Building domain
    │   │
    │   └── "audit skills/agents", "check drift", "refactor meta"
    │       └── hf-* lineage → Audit/Refactor domain
    │
    ├── About features, bugs, architecture, implementation?
    │   │
    │   ├── "research", "investigate", "find out", "explore"
    │   │   └── hm-* lineage → Research workflow
    │   │
    │   ├── "plan", "spec", "requirements", "design", "architect"
    │   │   └── hm-* lineage → Planning workflow
    │   │
    │   ├── "implement", "build", "execute", "run phase", "code"
    │   │   └── hm-* lineage → Execution workflow
    │   │
    │   ├── "test", "verify", "quality", "TDD", "validate"
    │   │   └── hm-* lineage → Quality workflow
    │   │
    │   ├── "debug", "fix", "broken", "failing", "error"
    │   │   └── hm-* lineage → Debug workflow
    │   │
    │   └── "review", "audit", "readiness", "deploy check"
    │       └── hm-* lineage → Review workflow
    │
    └── Ambiguous — can't classify?
        └── Use session-tracker to read last user turn
            └── Still ambiguous? → hm-* as default (product dev is primary)
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
  └── May load: hm-* skills (always), gate-* skills (for quality), stack-* skills (for reference)
  └── May NOT load: hf-* skills (unless explicitly routed by hf-l0-orchestrator with justification)

hf-* agents (FLEXIBLE):
  └── May load: hf-* skills (always), gate-* skills (for quality), stack-* skills (for reference)
  └── May load: hm-* skills for codebase investigation (hm-detective, hm-deep-research, hm-synthesis)
                 Must document justification in return report.

gate-* skills (INTERNAL):
  └── May load: stack-* skills (for reference)
  └── May load: hm-* skills for inspection
  └── May NOT load: hf-* skills (gate skills don't create meta-concepts)

stack-* skills (REFERENCE):
  └── May load: other stack-* skills (cross-reference)
  └── May NOT load: hm-* or hf-* skills (stack is read-only reference)
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
| `/gsd-*` | hm-* (via GSD) | `hm-l2-lineage-router` |
| No prefix | Classify by intent | See decision tree above |

## Examples

### Example 1: "Create a skill for deep research that uses repomix"
- Action: "create" (meta-concept creation)
- Subject: "skill" (meta-concept)
- Verdict: **hf-* lineage → Skill Authoring domain**
- Load: `hf-l2-skill-router` → bundle: `hf-l2-use-authoring-skills` + `hf-l2-skill-synthesis`

### Example 2: "Debug the session-tracker module — tests are failing"
- Action: "debug" (product dev)
- Subject: "session-tracker module" (source code)
- Verdict: **hm-* lineage → Debug domain**
- Load: `hm-l2-lineage-router` → bundle: `hm-l2-debug` + `hm-l2-completion-looping`

### Example 3: "Audit all skills in the project for trigger phrase compliance"
- Action: "audit" (quality inspection)
- Subject: "skills" (meta-concepts)
- Verdict: **hf-* lineage → Audit domain**
- Load: `hf-l2-skill-router` → bundle: `hf-l2-use-authoring-skills` + `hf-l2-agents-md-sync` + `gate-l3-evidence-truth`

### Example 4: "/hf-audit"
- Command prefix: `/hf-audit`
- Verdict: **hf-* lineage (command-driven)**
- Load: `hf-l2-skill-router` immediately

### Example 5: "I'm not sure what workflow to use — I have a new feature idea"
- Action: ambiguous
- Subject: "feature idea" (product dev)
- Verdict: **hm-* lineage → Brainstorm/Panning domain**
- Load: `hm-l2-lineage-router` → `hm-l2-brainstorm` first
- If still unclear: use session-tracker to read last user turn

## Edge Cases

### Case 1: Meta-concept + Product-dev hybrid request
Example: "Build an agent that debugs the session-tracker module"

- Primary: "Build an agent" → hf-* (Agent Building)
- Secondary: "debugs session-tracker" → hm-* (Debug)
- Verdict: **hf-* primary** (agent creation is the meta-concept action)
- Load: hf-bundle first, then document hm-* cross-lineage access

### Case 2: User provides a command prefix but topic is ambiguous
Example: "/plan create a new skill"

- `/plan` → hm-* lineage
- But "create a skill" is meta-concept → hf-* lineage
- Verdict: **Command prefix takes precedence** → hm-* lineage
- Result: hm-orchestrator will route to hm-planner, which will detect the meta-concept topic and escalate to hf lineage if needed via cross-lineage bridge

### Case 3: User addresses an L2 agent directly
Example: "@hm-l2-auditor audit the session-tracker"

- Direct L2 mention: user is explicitly routing to hm-*
- Verdict: **hm-* lineage** (user-directed)
- Note: L0 should still intercept and delegate properly through L1
