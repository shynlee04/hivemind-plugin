# THE ZERO EVENT — Strategic Planning Reference

> **Document ID:** ZERO-EVENT-2026-02-27  
> **Purpose:** Master planning reference for hiveminder's long-haul strategic operations. Serves as the single-source-of-truth for understanding the four entity domains, their interactions, and governance patterns.  
> **Audience:** hiveminder (primary), hivefiver (framework building), hiveplanner (phase planning)

---

## 1. The Four Entity Domains

The HiveMind framework operates through four interconnected entity domains. Each domain has distinct responsibilities, ownership, and governance contracts.

| Domain | Location | Primary Owner | Governance Contract |
|--------|----------|---------------|---------------------|
| **Agents** | `agents/`, `.opencode/agents/` | hiveminder | Frontmatter YAML validation, task permissions |
| **Commands** | `commands/`, `.opencode/commands/` | Domain-specific agents | Entry gates, required skills, chain groups |
| **Workflows** | `workflows/`, `.opencode/workflows/` | hiveminder + hiveplanner | Contract version 2+, skill bundles, entry/exit criteria |
| **Skills** | `skills/`, `.opencode/skills/` | hivefiver | Trigger evaluation, progressive disclosure, mode routing |

### Entity Interaction Flow

```
User Intent
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  hiveminder (Orchestrator)                                  │
│  ├── declare_intent() → establishes trajectory              │
│  ├── scan_hierarchy() → validates context health            │
│  └── think_back() → retrieves relevant memories             │
└─────────────────────────────────────────────────────────────┘
    │
    ├──▶ Commands (Entry Points)
    │       ├── hivemind-delegate → validates delegation packet
    │       ├── hivemind-context → enforces investigation-first
    │       └── [domain-specific] → routes to appropriate agent
    │
    ├──▶ Workflows (Execution Paths)
    │       ├── sequential-delegation-workflow
    │       ├── strategic-planning
    │       └── framework-audit
    │
    └──▶ Skills (Capability Bundles)
            ├── delegation-intelligence
            ├── context-integrity
            └── session-lifecycle
```

---

## 2. Agent Domain — Role Architecture

### 2.1 The Agent Hierarchy

HiveMind employs a tiered agent architecture with clear responsibility boundaries:

| Agent | Mode | Role | Can Delegate? | Can Be Delegated? |
|-------|------|------|---------------|------------------|
| **hiveminder** | primary | Supreme orchestrator, strategic architect | Yes (all) | No |
| **hivefiver** | primary | Meta-builder, framework constructor | Yes (Sector 2) | Yes |
| **hiveplanner** | subagent | Phase planner, research synthesis | No | Yes |
| **hivemaker** | subagent | Implementation, code execution | No | Yes |
| **hivexplorer** | subagent | Investigation, codebase research | No | Yes |
| **hivehealer** | subagent | Debugging, repair, recovery | No | Yes |
| **hiveq** | subagent | Quality assurance, validation | No | Yes |
| **hiverd** | subagent | Web research, documentation | No | Yes |

### 2.2 Agent Frontmatter Contract

Every agent MUST define these fields in their YAML frontmatter:

```yaml
---
name: agent-name
description: "Purpose and domain expertise"
mode: primary | subagent | all
tasks:              # REQUIRED — even if empty
  hivemaker: allow
  hivehealer: allow
  # ... other task permissions
workflows:
  - workflow-name
prompts:
  - prompt-reference
tools:
  - tool-name
permissions:
  read: allow
  edit:
    "*": deny
    "specific/path": allow
identity:
  role: role_name
  cognitive_model: model_type
  planning_horizon: short | medium | long_haul_strategic
allowed_tools:
  - tool-list
scope_paths:
  in: [paths]
  out: [paths]
---
```

### 2.3 Agent Selection Matrix

When hiveminder needs to delegate, use this decision matrix:

| Task Type | Primary Agent | Fallback Agent | Required Context |
|-----------|---------------|----------------|--------------------|
| **Planning** | hiveplanner | hiveminder | trajectory, phase goals |
| **Implementation** | hivemaker | hivefiver | code skeleton, requirements |
| **Investigation** | hivexplorer | hiverd | search queries, scope |
| **Debugging** | hivehealer | hiveq | error traces, context |
| **Validation** | hiveq | hivehealer | criteria, test commands |
| **Research** | hiverd | hivexplorer | research questions |
| **Framework Building** | hivefiver | hiveminder | Sector 2 scope |

---

## 3. Command Domain — Entry Point Architecture

### 3.1 Command Categories

Commands are organized by domain and governance purpose:

| Category | Path | Purpose | Entry Gate |
|----------|------|---------|------------|
| **hiveminder/** | `commands/hiveminder-*.md` | Orchestration, context, delegation | session_declared |
| **hivefiver/** | `commands/hivefiver-*.md` | Framework construction | skill_loaded |
| **hiveq/** | `commands/hiveq-*.md` | Quality gates | criteria_defined |
| **hiverd/** | `commands/hiverd-*.md` | Research synthesis | query_framed |

### 3.2 Command Frontmatter Contract

```yaml
---
name: command-name
description: "What this command does and when to use it"
owner_agent: agent-name
kind: router | utility | domain
alias_resolved_to: canonical-name
required_skills:
  - skill-name
required_templates: []
required_prompts: []
chain_group: group-name
group: parent-group
entry_gate: condition-name
---
```

### 3.3 Critical Command Protocols

#### hivemind-delegate (Pre-Delegation Validation)

**MANDATORY** — Execute BEFORE any Task() call:

```typescript
// 1. Scan current state
scan_hierarchy({ action: "status" })

// 2. Check for similar past work
recall_mems({ query: "[task topic]" })

// 3. Identify affected files
glob({ pattern: "**/*[topic]*" })

// 4. Validate delegation packet
// - delegation_source: "agent" | "human"
// - delegation_depth: number
// - return_schema: defined
// - in_scope_paths: list
// - out_of_scope_paths: list
```

#### hivemind-context (Investigation Enforcement)

**MANDATORY** — Execute BEFORE any write/edit operations:

```typescript
// 1. Brownfield scan
scan_hierarchy({ action: "analyze" })

// 2. Check for stale context
// Look for: timestamp_gap, framework_conflict, poisoned_context

// 3. Recall relevant memories
recall_mems({ query: "[work topic]" })

// 4. Load relevant anchors
save_anchor({ mode: "list" })

// 5. Codebase exploration
glob({ pattern: "**/*[topic]*" })
grep({ pattern: "relevant-code" })
```

---

## 4. Workflow Domain — Execution Path Architecture

### 4.1 Workflow Contract Version 2+

All workflows MUST declare `contract_version: 2` and include these fields:

```yaml
---
contract_version: 2
name: workflow-name
target_agent: agent-name
description: "What this workflow accomplishes"
entry_criteria: "precondition that must be met"
exit_criteria: "postcondition that validates success"
steps:
  - name: step-name
    wave: 1                    # Execution wave (1, 2, 3...)
    skill_bundles: [bundle]    # Skills loaded at this step
    entry_criteria: "step precondition"
    exit_criteria: "step postcondition"
guards:
  - rule: guard-name
    check: "deterministic condition"
    enforce: halt | warn | log
---
```

### 4.2 Standard Workflows

| Workflow | Target Agent | Purpose | Waves |
|----------|--------------|---------|-------|
| sequential-delegation-workflow | hiveminder | Task chaining with context pass-through | 3 |
| feature-sprint | hivemaker | Feature implementation | 2 |
| bug-remediation | hivehealer | Debug and fix | 2 |
| strategic-planning | hiveplanner | Phase planning with research | 4 |
| context-recovery | hivefiver | State restoration | 1 |
| framework-audit | hivefiver | Sector 2 validation | 2 |

### 4.3 Wave Execution Pattern

```
Wave 1 (Independent)
    ├── Executor A (fresh 200K context) → commit
    └── Executor B (fresh 200K context) → commit
        │
        ▼
Wave 2 (Depends on Wave 1)
    └── Executor C (fresh 200K context) → commit
        │
        ▼
Verifier
    ├── PASS → VERIFICATION.md
    └── FAIL → Issues logged for human review
```

---

## 5. Skill Domain — Capability Architecture

### 5.1 Progressive Disclosure Model

Skills follow a tiered loading model to prevent context avalanche (D-02):

| Level | What Loads | When | Token Cost |
|-------|-----------|------|------------|
| **L0** | Skill name + description | Always | ~100 tokens |
| **L1** | SKILL.md body | On trigger match | ~500-2K tokens |
| **L2** | Specific reference file | On explicit read | ~1K-5K tokens |
| **L3** | All references + scripts | Full audit mode | ~5K-15K tokens |

### 5.2 Core Skills (Always Available)

| Skill | Purpose | Trigger Keywords |
|-------|---------|------------------|
| **delegation-intelligence** | Packet construction, scope validation | delegate, task, dispatch |
| **context-integrity** | State validation, poison detection | context, investigation, stale |
| **session-lifecycle** | Intent declaration, compact, recovery | session, declare, compact |
| **evidence-discipline** | Anchor creation, proof retention | evidence, anchor, proof |
| **hivemind-governance** | Drift detection, rule enforcement | governance, drift, policy |

### 5.3 Skill Routing Pattern

Every skill that can be invoked must include a mode router. See `.opencode/skills/hivemind-framework-auditor/SKILL.md` for the canonical routing pattern.

---

## 6. Session Governance — The Lifecycle

### 6.1 Mandatory Session Workflow

Every session MUST follow this protocol:

```
┌─────────────────────────────────────────────────────────────┐
│  START (First Turn)                                         │
│  1. declare_intent({ mode, focus })                        │
│  2. map_context({ level: "trajectory", content })          │
│  3. scan_hierarchy({ action: "status" })                   │
│  4. recall_mems({ query: "active plan" })                  │
│  5. User confirmation before writes                         │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  MIDDLE (Every 10 Turns)                                    │
│  1. scan_hierarchy({ action: "validate" })                  │
│  2. Check drift_score (if < 60: STOP, realign)              │
│  3. Save anchors for critical decisions                    │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  END (Session Close)                                        │
│  1. compact_session({ summary })                           │
│  2. Save anchors for key decisions                          │
│  3. Classify session memory                                 │
│  4. Update STATE.md                                        │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Drift Detection Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| **drift_score** | ≥60 | Normal operation |
| **drift_score** | <60 | STOP, run think_back, realign |
| **drift_score** | <40 | HALT, explain to user, request guidance |
| **ignored** | >100 | Governance warnings being bypassed |

---

## 7. Delegation Contracts

### 7.1 Required Delegation Packet Fields

```yaml
delegation_packet:
  delegation_source: "agent"        # CRITICAL: "agent" vs "human"
  delegation_depth: 1                 # Prevents infinite chains
  parent_agent: "hiveminder"         # Who delegated
  parent_context_summary: "2-3 lines"
  return_schema:
    format: "structured"
    fields:
      - status: "success | partial | failure"
      - files_modified: "string[]"
      - evidence: "string"
      - issues: "string[]"
  in_scope_paths: [paths]
  out_of_scope_paths: [paths]
  failure_policy: "STOP and return error"
```

### 7.2 Delegation Anti-Patterns (P0/P1)

| ID | Anti-Pattern | Severity | Prevention |
|----|--------------|----------|-------------|
| D-07 | Upstream Amnesia | P0 | Include delegation_source in EVERY packet |
| D-10 | Scope Creep | P0 | Define in_scope AND out_of_scope_paths |
| D-11 | Depth Unawareness | P0 | Set is_delegated: true + delegation_depth |
| D-12 | No Return Format | P1 | Define explicit return_schema |

---

## 8. Planning Orientations

When hiveminder engages with a user request, it MUST present at least 3 rationale options and request confirmation of workflow orientation:

### 8.1 Output Style Selection

| Style | Description | When to Use |
|-------|-------------|-------------|
| **Supportive/Discovery** | Scaffolded knowledge, expert comparisons, explanatory guidance | Brainstorming, ideation, exploration |
| **Architecture/Planning** | Schema-first, API contracts, data lifecycle mapping | System design, refactoring, planning |
| **Problem Solving/Debugging** | Structured hypothesis testing, granular tracking | Debugging, troubleshooting, recovery |
| **Execution-Oriented** | Ready-to-execute context, strict constraints | Implementation, feature delivery |

### 8.2 Rationale Options Framework

For each user request, present:

1. **Option A: Direct Execution** — Immediate implementation if context is complete
2. **Option B: Planned Approach** — Phase-based with research and validation
3. **Option C: Investigate First** — Requires codebase exploration before decision

Each option MUST include:
- Estimated complexity (1-5)
- Required agents
- Timeline estimate
- Risk factors

---

## 9. Context Engineering Principles

### 9.1 The Three Core Failure Categories

| Category | What Fails | Token Impact | Recovery |
|----------|-----------|--------------|----------|
| **Token Waste** | Efficiency | 5K-50K per occurrence | Low (stop doing it) |
| **Context Poisoning** | Quality | Compounds across turns | Medium (recovery required) |
| **Governance Failure** | Structure | Systemic | High (architectural fix) |

### 9.2 Anti-Pattern Quick Reference

| ID | Pattern | Severity | Section Reference |
|----|---------|----------|-------------------|
| D-02 | Skill Avalanche | P0 | PITFALL-CTX-01 |
| D-07 | Upstream Amnesia | P0 | PITFALL-DELEG-01 |
| D-10 | Scope Creep | P0 | PITFALL-DELEG-02 |
| D-13 | Broken Chain | P0 | PITFALL-SESS-02 |
| D-14 | Session Rot | P1 | PITFALL-CTX-03 |
| D-15 | Skill Without Routing | P1 | PITFALL-ASSET-03 |

---

## 10. Source of Truth Architecture

### 10.1 Project Root Structure

The Project Root serves as the central SOT. All entities trace back to root `id (UUID)`:

```
.hivemind/
├── project/                    # SOT Root
│   ├── codewiki/              # Knowledge graph (decisions, patterns)
│   ├── codemap/               # Structural topology (dependencies)
│   └── code-intel/            # Semantic engine (symbols, refs)
├── planning/                   # GSD-style planning
│   ├── PROJECT.md             # Vision and context (always loaded)
│   ├── REQUIREMENTS.md        # Scoped requirements with IDs
│   ├── ROADMAP.md             # Phase breakdown
│   ├── STATE.md               # Decisions, blockers, session memory
│   └── phases/                # Atomic execution plans
├── state/                      # Runtime state
│   ├── brain.json             # Machine state (metrics, governance)
│   └── hierarchy.json         # Decision tree (trajectory→tactic→action)
├── memory/                     # Persistent memory
│   └── mems.json              # Classified memories
└── sessions/                   # Session artifacts
    ├── active/                # Current session files
    └── archive/               # Historical sessions
```

### 10.2 Update Protocol

- **Iterative Persistence**: SOT entities must be iterated, not replaced
- **Automatic Parsing**: Context updates are automatically parsed into readable SOT format
- **Verification**: Updates require end-to-end verification; unverified changes queue as pending
- **Tracking**: All updates must reference git diff, file watcher events, and commit hashes

---

## 11. Key References

| Document | Purpose | When to Load |
|----------|---------|----------------|
| `docs/PITFALLS.md` | Anti-pattern catalog | Before any refactoring |
| `docs/HIVEMIND-FRAMEWORK-AUDIT-CRITERIA.md` | Structural validation | Audit operations |
| `SYSTEM-DIRECTIVES.md` | Governance patterns | Planning sessions |
| `AGENT_RULES.md` | Branch policy, God Prompts | All operations |
| `docs/refactored-plan.md` | 6-phase master plan | Long-haul planning |

---

*Document maintained by HiveMind Context Governance framework.*  
*Last updated: 2026-02-27*
