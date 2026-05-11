# Reference 01: Lineage Routing

> **Jump targets:** [ref-01 §1]–[ref-01 §6]

## §1 — Lineage Classification Decision Tree

Before any domain work, classify the task into the correct lineage:

```
Is the task about CREATING / AUDITING / REPAIRING meta-concepts?
  ├─ YES: agents, skills, commands, tools → hf-* lineage
  └─ NO:  features, bugs, architecture, implementation → hm-* lineage

Does the command start with /hf-*?
  └─ YES → hf-* lineage

Does the command start with /plan, /ultrawork, /gsd-*?
  └─ YES → hm-* lineage

Still ambiguous?
  └─ Read 1 user turn via session-tracker → grep "## USER" → classify intent
```

### Decision Tree: User Request → Lineage

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
    │   ├── "create an agent", "add agent", "build agent" → hf-* → Agent Building
    │   ├── "create a skill", "write SKILL.md", "audit skill" → hf-* → Skill Authoring
    │   ├── "create a command", "add slash command" → hf-* → Command Dev
    │   ├── "build a custom tool", "create OpenCode plugin" → hf-* → Tool Building
    │   └── "audit skills/agents", "check drift", "refactor meta" → hf-* → Audit/Refactor
    │
    ├── About features, bugs, architecture, implementation?
    │   ├── "research", "investigate", "find out", "explore" → hm-* → Research
    │   ├── "plan", "spec", "requirements", "design", "architect" → hm-* → Planning
    │   ├── "implement", "build", "execute", "run phase", "code" → hm-* → Execution
    │   ├── "test", "verify", "quality", "TDD", "validate" → hm-* → Quality
    │   ├── "debug", "fix", "broken", "failing", "error" → hm-* → Debug
    │   └── "review", "audit", "readiness", "deploy check" → hm-* → Review
    │
    └── Ambiguous — can't classify?
        └── Use session-tracker to read last user turn
            └── Still ambiguous? → hm-* as default (product dev is primary)
```

### Action Verb → Lineage Matrix

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

## §2 — hf-* Lineage: Command Routing & Domain Dispatch

### Command Prefix Routing

| Prefix | Lineage | Load |
|--------|---------|------|
| `/hf-create` | hf-* | `hf-l2-skill-router` |
| `/hf-audit` | hf-* | `hf-l2-skill-router` |
| `/hf-stack` | hf-* | `hf-l2-skill-router` |
| `/hf-configure` | hf-* | `hf-l2-skill-router` |
| `/plan` | hm-* | `hm-l2-lineage-router` |
| `/ultrawork` | hm-* | `hm-l2-lineage-router` |
| `/gsd-*` | hm-* (via GSD) | `hm-l2-lineage-router` |
| No prefix | Classify by intent | See §1 decision tree |

### hf-* L2 Specialist Dispatch

| Task Category | L2 Specialist | Skills to Load |
|---------------|---------------|----------------|
| Agent Building | hf-l2-agent-builder | hf-l2-agents-and-subagents-dev + hf-l2-agent-composition |
| Skill Authoring | hf-l2-skill-builder | hf-l2-use-authoring-skills + hf-l2-skill-synthesis |
| Command Building | hf-l2-command-builder | hf-l2-command-dev + hf-l2-command-parser |
| Tool Building | hf-l2-tool-builder | hf-l2-custom-tools-dev |
| Audit (meta-concept) | hf-l2-auditor | hf-l2-agents-md-sync + gate-l3-evidence-truth |
| Refactoring (meta-concept) | hf-l2-refactorer | hf-l2-agents-md-sync + hm-l2-refactor (cross-lineage) |
| Synthesis (meta-patterns) | hf-l2-synthesizer | hf-l2-skill-synthesis + hm-l3-synthesis (cross-lineage) |
| Prompt Engineering | hf-l2-prompter | prompt-skim → prompt-analyze |
| Meta-Concept Workflow | hf-l2-meta-builder | hf-l2-meta-builder-core |

## §3 — hm-* Lineage: Command Routing & Domain Dispatch

### hm-* L2 Specialist Dispatch

| Task Category | L2 Specialist | Skills to Load |
|---------------|---------------|----------------|
| Ideation / Brainstorming | hm-l2-brainstormer | hm-l2-brainstorm |
| Requirements Analysis | hm-l2-analyst | hm-l2-requirements-analysis |
| Feature Ecosystem Design | hm-l2-ecologist | hm-l2-feature-ecosystem |
| Product Validation | hm-l2-assessor | hm-l2-product-validation |
| Architecture Design | hm-l2-architect | hm-l2-spec-driven-authoring |
| Planning / Spec Authoring | hm-l2-planner | hm-l2-spec-driven-authoring |
| Implementation / Execution | hm-l2-executor | hm-l2-phase-execution + hm-l2-cross-cutting-change |
| Testing / TDD | hm-l2-spec-verifier | hm-l2-test-driven-execution |
| Code Review | hm-l2-reviewer | gate-l3-lifecycle-integration → gate-l3-spec-compliance → gate-l3-evidence-truth |
| Debugging | hm-l2-debugger | hm-l2-debug + hm-l2-completion-looping |
| Refactoring | hm-l2-optimizer | hm-l2-refactor + hm-l2-cross-cutting-change |
| Production Readiness | hm-l2-curator | hm-l2-production-readiness + gate-l3-evidence-truth |
| Deep Research | hm-l2-researcher | hm-l3-detective → hm-l3-deep-research → hm-l3-synthesis |
| Tech Stack Validation | hm-l2-technician | hm-l3-tech-context-compliance + hm-l3-tech-stack-ingest |
| Documentation | hm-l2-writer | hm-l2-spec-driven-authoring |
| Risk Assessment | hm-l2-risk-assessor | hm-l2-product-validation |
| Completion / Finishing | hm-l2-finisher | hm-l2-completion-looping |
| Context Mapping | hm-l2-context-mapper | hm-l3-detective |
| Integration / E2E | hm-l2-integrator | hm-l2-production-readiness + gate-l3-evidence-truth |

## §4 — Edge Cases & Ambiguity

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

### Case 4: Complete ambiguity
Example: "I'm not sure what workflow to use — I have a new feature idea"

- Action: ambiguous
- Subject: "feature idea" (product dev)
- Verdict: **hm-* lineage → Brainstorm/Planning domain**
- Load: `hm-l2-lineage-router` → `hm-l2-brainstorm` first
- If still unclear: use session-tracker to read last user turn

## §5 — Cross-Lineage Rules

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

### Cross-Lineage Bridge: When to Bridge (hf-* → hm-*)

| Need | Bridge To | Justification |
|------|-----------|---------------|
| Codebase investigation | hm-l3-detective | Pattern detection, structure mapping |
| Deep research | hm-l3-deep-research | Version-matched evidence gathering |
| Synthesis | hm-l3-synthesis | Compression, artifact creation |
| Spec validation | hm-l2-spec-driven-authoring | Requirements against implementation |
| Refactoring methodology | hm-l2-refactor | Surgical vs structural decisions |

### Cross-Lineage Bridge: When to Bridge (hm-* → hf-*)

Only when explicitly routed by hf-l0-orchestrator. Never autonomously.

### Documentation Requirement

Every cross-lineage skill load MUST be logged with justification in the return report. Format:
```
Cross-Lineage Access: [skill-name] — [justification]
```

## §6 — Stack Reference Skills (Any Lineage May Load)

| Stack | Skill | When to Load |
|-------|-------|-------------|
| OpenCode Platform | stack-opencode | Understanding OpenCode SDK, tool registration |
| Zod v4 | stack-l3-zod | Schema validation patterns |
| Vitest | stack-l3-vitest | Test framework reference |
| Bun PTY | stack-l3-bun-pty | PTY integration patterns |
| Next.js | stack-l3-nextjs | GUI sidecar reference |
| json-render | stack-l3-json-render | Generative UI patterns |
