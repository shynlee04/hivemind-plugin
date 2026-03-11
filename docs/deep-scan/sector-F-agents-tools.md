# Sector F: Agents & Custom Tools

**Deep Scan Date**: 2025-01-13
**Scan Scope**: `.opencode/agents/`, `agents/`, `.opencode/tool/`, `src/tools/`

---

## Agent Inventory

| Agent | Mode | Model | Write/Edit/Bash | Permissions | Role |
|-------|------|-------|-----------------|-------------|------|
| **hiveminder** | primary | default | false/false/false | task delegation only | Supreme Orchestrator |
| **hivefiver** | primary | default | false/false/false | task delegation only | Meta-Builder / Framework Doctor |
| **hivemaker** | subagent | default | true/true/true | edit: allow, bash: "*" allow | Execution Specialist |
| **hivehealer** | subagent | default | true/true/true | edit: allow, bash: "*" allow | Remediation Specialist |
| **hiveq** | subagent | default | false/false/limited | edit: deny, bash: test/grep only | QA & Verification |
| **hiveplanner** | subagent | default | false/false/limited | edit: deny, bash: read-only | Planning Specialist |
| **hiverd** | subagent | default | false/false/false | edit: deny, webfetch: allow | Research Specialist |
| **hivexplorer** | subagent | default | false/false/limited | edit: deny, bash: read-only | Investigation Specialist |
| **hitea** | subagent | default | true/true/true | edit: allow, bash: "*" allow | Testing Infrastructure Builder |

---

## Agent Role Definitions

### Primary Agents (Orchestrators)

#### Hiveminder — Supreme Orchestrator & Strategic Architect

| Attribute | Value |
|-----------|-------|
| **Role** | Supreme Orchestrator / Front-Facing Primary Agent |
| **Cognitive Model** | Deep Traverse Deductive Reasoning |
| **Planning Horizon** | Long-haul strategic with tactical precision |
| **Scope** | User project orchestration, strategic planning, team orchestration |
| **Forbidden** | Direct code implementation (`src/`, `tests/`) |

**What They Are:**
1. **Beyond-Coordinator**: Architects outcomes through deep understanding of agent capabilities, cognitive frameworks, and systemic patterns
2. **Strategic Architect**: Maintains long-haul relational planning across sessions via context governance and hierarchical trajectory management
3. **Delegation Master**: Knows every agent's domain, expertise, boundaries, and optimal activation conditions

**Key State Files:**
- `.hivemind/state/brain.json` — Machine state, drift score
- `.hivemind/state/hierarchy.json` — Decision tree
- `.hivemind/state/anchors.json` — Immutable critical decisions
- `docs/PITFALLS.md` — Anti-patterns catalog

**Execution Loop:**
1. INTAKE → Parse user intent, classify by type and complexity
2. CONTEXT → Load relevant history, recall similar patterns
3. ASSESS → Evaluate against anti-patterns, check for PITFALLS
4. PLAN → Create trajectory → tactics → actions hierarchy
5. DELEGATE → Match tasks to optimal agents with proper packets
6. VERIFY → Require evidence bundles, validate outcomes
7. ITERATE → Update hierarchy, adjust tactics, continue

#### HiveFiver — OpenCode Meta-Builder & Framework Doctor

| Attribute | Value |
|-----------|-------|
| **Role** | Meta-builder / Framework Doctor |
| **Scope** | Framework assets (`agents/`, `commands/`, `workflows/`, `skills/`) |
| **Forbidden** | Product implementation (`src/`, `tests/`) |

**What They Are:**
- **Meta-builder**: Engineers the tools that engineers use
- **Framework doctor**: Diagnoses and repairs broken framework chains across ALL lineages
- **Quality gatekeeper**: No asset ships without contract compliance

**Intent → Stage Routing:**
| Intent | Route |
|--------|-------|
| Build new | `start` → `intake` → `spec` → `architect` → `build` |
| Fix broken | `doctor` |
| Audit health | `audit` |
| Extend | `spec` → `architect` → `build` |

**Quality Gates:**
| Gate | Check |
|------|-------|
| G0 Entry | Scope valid, context present |
| G1 Spec | Requirements unambiguous |
| G2 Architecture | Dependencies explicit |
| G3 Evidence | Output matches schema |
| G4 Export | Handoff complete |

---

### Subagents (Specialists)

#### Hivemaker — Execution Specialist

| Attribute | Value |
|-----------|-------|
| **Role** | Executor / Builder |
| **Scope** | `src/`, `tests/`, `docs/` only |
| **Forbidden** | Framework assets (`agents/`, `commands/`, `workflows/`, `skills/`) |

**What They DO:**
- Implement code changes within assigned scope paths
- Create new files when required by the task
- Run tests and type checks to verify changes
- Return structured evidence of what was changed and verified

**Execution Protocol:**
1. Read delegation packet — understand scope, constraints, success criteria
2. Implement — make changes within scope boundaries
3. Verify — run `npx tsc --noEmit` and `npm test`
4. Return — structured evidence with files modified, verification output, issues found

#### Hivehealer — Remediation Specialist

| Attribute | Value |
|-----------|-------|
| **Role** | Recovery Agent |
| **Scope** | `src/**`, `tests/**`, `docs/**` |
| **Forbidden** | Framework assets (`agents/`, `commands/`, `workflows/`, `skills/`) |

**Methodology: Diagnose → Fix → Verify**
1. **Diagnose**: Understand the root cause before touching code
2. **Fix**: Apply minimal, targeted changes
3. **Verify**: Run tests to confirm fix, regression-free

**Key Distinction:** Works on **product implementation**, unlike HiveFiver which works on framework assets.

#### Hiveq — Quality & Verification Specialist

| Attribute | Value |
|-----------|-------|
| **Role** | PASS/FAIL Arbiter |
| **Scope** | Verification only — no code modification |
| **Forbidden** | Implementing fixes, modifying source code |

**Validation Types:**
| Type | Checks |
|------|--------|
| Code Change | Tests pass, types check, no regressions |
| Phase Plan | Strategic coherence, agent assignments |
| Atomic Plan | Independence, reversibility, testability |

**Output Contract:**
- PASS/FAIL outcome
- Per-criterion evidence
- Command outputs used for verification
- Gaps identified as "unverifiable", not assumed

#### Hiveplanner — Planning Specialist

| Attribute | Value |
|-----------|-------|
| **Role** | Roadmap Designer |
| **Scope** | `docs/**`, `.hivemind/**` (read + write plans only) |
| **Forbidden** | `src/**`, `tests/**` — never implement code |

**Core Responsibilities:**
| Responsibility | Output |
|----------------|--------|
| Phase Planning | `docs/plans/XX-YY-PLAN.md` |
| Execution Knots | Knot specifications |
| Dependency Mapping | Dependency graphs |

#### Hiverd — Research Specialist

| Attribute | Value |
|-----------|-------|
| **Role** | Research Executor |
| **Scope** | External knowledge acquisition, ecosystem analysis |
| **Forbidden** | Code implementation, framework assets |
| **Delegation** | Terminal agent — cannot delegate |

**Research Methodology (RESEAR):**
```
R - Receive & Refine the research question
E - Execute Multi-Source Search
S - Synthesize Evidence
E - Evaluate Confidence
A - Articulate Findings
R - Return & Export
```

**Confidence Grading:**
- **HIGH**: Multiple authoritative sources confirm
- **MEDIUM**: Single authoritative source or multiple less-authoritative agree
- **LOW**: Single non-authoritative source or conflicting info

#### Hivexplorer — Investigation Specialist

| Attribute | Value |
|-----------|-------|
| **Role** | Context Explorer, Evidence Collector, Knowledge Synthesizer |
| **Scope** | Read-only investigation across all project files |
| **Forbidden** | Modifying any file (strictly read-only) |

**What They DO:**
- Read any file in the project
- Search codebases with grep, find, and file inspection commands
- Produce structured evidence tables with file paths and line references
- Synthesize across multiple files into coherent analysis

**Output Contract:**
- Evidence table with file paths and relevant content
- Confidence level for each finding
- Gaps identified (what couldn't be found or verified)

#### HITEA — AI-Driven Testing Infrastructure Builder

| Attribute | Value |
|-----------|-------|
| **Role** | Test Architect / Arena Coordinator |
| **Scope** | `tests/**` (primary), `src/**` (read + test file additions only) |
| **Forbidden** | Product implementation, framework asset builder |

**Core Paradigms:**
1. **Property-Based Testing**: Define invariants, not examples
2. **Mutation Testing**: Tests must catch injected bugs
3. **Visual Regression**: VLM sees what humans see

---

## Delegation Patterns

### Agent Capability Matrix

| Agent | Domain | Optimal For | Constraints |
|-------|--------|-------------|-------------|
| **hivefiver** | Meta-Builder | Building the framework itself, creating new capabilities | Cannot execute implementation tasks |
| **hivemaker** | Execution | Scoped code changes within defined boundaries | Must return evidence |
| **hivehealer** | Recovery | Fixing broken code, recovery operations | Focus on restoration |
| **hivexplorer** | Research | Understanding existing code, codebase investigation | Read-only on code |
| **hiverd** | External Research | Web research, external docs, ecosystem analysis | Cannot access internal code |
| **hiveq** | QA & Validation | Quality assurance, test coverage, verification | Focus on verification |
| **hiveplanner** | Phase Planning | Complex multi-phase planning, research synthesis | Plans only |

### Delegation Rules (Hiveminder)

Every delegation MUST include:
- **delegation_source**: "agent"
- **parent_context**: trajectory ID, context summary, active assumptions
- **task**: objective, type, complexity, scope paths, constraints, success criteria
- **return_schema**: status, files_modified, evidence, issues

### Sequential vs Parallel

- **Default is SEQUENTIAL.** Parallel requires explicit justification.
- Parallel ONLY when:
  - Zero file overlap
  - Zero state dependency
  - Zero output dependency
  - Failure isolation

### Delegation Permission Matrix

| From → To | hiveminder | hivefiver | hivemaker | hivehealer | hiveq | hiveplanner | hiverd | hivexplorer | hitea |
|-----------|------------|-----------|-----------|------------|-------|-------------|--------|-------------|-------|
| **hiveminder** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **hivefiver** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **hivemaker** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **hivehealer** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **hiveq** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **hiveplanner** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **hiverd** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **hivexplorer** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Key Observations:**
- Only primary agents (hiveminder, hivefiver) can delegate
- All subagents are terminal — they cannot delegate to others
- HITEA is NOT in any delegation permission list (isolated specialist)

---

## Tool Inventory

| Tool | Purpose | Parameters | Outputs |
|------|---------|------------|---------|
| **hiveops_todo** | Task state machine | action, content, id, priority, domain, plan_id, depends_on, evidence, hierarchy_node | Task status, list, dependency graph |
| **hiveops_sot** | Source-of-truth artifact registry | action, path, query, tags, domain, parent, plan_id, node_id | Artifact registry, search results, tree |
| **hiveops_export** | Session handoff/checkpoint | action, summary, next_agent, next_actions, blockers, decisions, artifacts, plan_id, node_id, risk, label, id | Handoff JSON/MD, checkpoint files |
| **hiveops_gate** | Quality gate verification | action, gate, domain, plan_id, node_id, evidence, reason | PASS/FAIL verdict, gate status |

---

## Tool Implementation Details

### Architecture Pattern

All tools follow a **wrapper → implementation** pattern:
- `.opencode/tool/*.ts` — Compatibility wrapper (imports from src)
- `src/tools/*.ts` — Canonical implementation

```typescript
// Wrapper pattern (.opencode/tool/hiveops_todo.ts)
import { createHiveOpsTodoTool } from "../../src/tools/hiveops-todo.js"
export default createHiveOpsTodoTool(".")
```

### hiveops_todo — Task State Machine

**Canonical Authority:** `.hivemind/state/tasks.json`
**Compatibility Export:** `.hivemind/state/todo.json`

**Actions:**
| Action | Description | Required Params |
|--------|-------------|-----------------|
| `add` | Create new task | content |
| `start` | Mark task in_progress | id |
| `complete` | Mark task completed | id |
| `block` | Mark task blocked | id |
| `cancel` | Mark task cancelled | id |
| `list` | Show all tasks | — |
| `deps` | Show dependencies | id (optional) |
| `export` | JSON export | — |

**Key Features:**
- Maximum 40 active items
- Dependency validation (blocks start if unmet)
- Single in_progress task enforcement
- HARD STOP warning system

**Data Flow:**
```
Agent Call → loadTaskAuthority() → modify → saveTaskAuthority()
                                            ↓
                                    writeManifest(tasks.json)
                                    writeManifest(todo.json) [compat]
                                    queueTaskManifestMutation() [graph sync]
```

### hiveops_sot — Source-of-Truth Artifact Registry

**Storage:** `.hivemind/state/sot-index.json`
**Export:** `.hivemind/state/sot-export.tsv`

**Actions:**
| Action | Description | Required Params |
|--------|-------------|-----------------|
| `register` | Register artifact | path |
| `search` | Search artifacts | query |
| `scan` | Auto-discover artifacts | path (optional, defaults to docs) |
| `stale` | Detect stale artifacts | — |
| `tree` | Show hierarchy | — |
| `index` | Rebuild index stats | — |
| `export` | TSV export | — |

**Artifact Types:**
- plan, spec, reference, synthesis, agent, command, skill, workflow, other

**Staleness Threshold:** 48 hours

**Domain Inference:**
- R1: delegation, agent
- R2: todo, workflow
- R3: context, transform
- R4: quality, gate, validation
- R5: enforce, runtime
- R6: session, export
- R7: sot, artifact
- R8: knowledge, synthesis

### hiveops_export — Session Handoff/Checkpoint

**Storage:** `.hivemind/handoffs/`, `.hivemind/checkpoints/`

**Actions:**
| Action | Description | Required Params |
|--------|-------------|-----------------|
| `handoff` | Create agent handoff | summary, next_agent, next_actions |
| `checkpoint` | Save session snapshot | label |
| `list` | List recent handoffs | — |
| `read` | Read specific handoff | id |

**Handoff Payload:**
```typescript
interface HandoffPayload {
  id: string
  timestamp: number
  fromAgent: string
  toAgent: string
  planId?: string
  nodeId?: string
  summary: string
  completedGates: string[]
  blockers: string[]
  nextActions: string[]
  artifacts: string[]
  decisions: string[]
  residualRisk: string
}
```

**Output:** Both JSON and Markdown files for each handoff

### hiveops_gate — Quality Gate Verification

**Storage:** `.hivemind/state/gates.json`

**Gate Definitions:**
| Gate | Name | Criteria Count |
|------|------|----------------|
| G0 | Entry Integrity | 3 |
| G1 | Specification Integrity | 3 |
| G2 | Orchestration Integrity | 3 |
| G3 | Evidence Integrity | 4 |
| G4 | Export Integrity | 3 |

**Actions:**
| Action | Description | Required Params |
|--------|-------------|-----------------|
| `check` | Check gate criteria | gate |
| `pass` | Mark gate passed | gate, evidence |
| `fail` | Mark gate failed | gate, reason |
| `status` | Show all gate states | — |
| `reset` | Clear gate records | — |
| `criteria` | List gate criteria | gate (optional) |

**Key Principle:** No evidence = no pass. Evidence is mandatory.

---

## Permission Boundaries

### Read/Write Matrix by Agent

| Agent | Read | Write | Edit | Bash | Web |
|-------|------|-------|------|------|-----|
| hiveminder | ❌ | ❌ | ❌ | ❌ | ❌ |
| hivefiver | ❌ | ❌ | ❌ | ❌ | ❌ |
| hivemaker | ✅ | ✅ | ✅ | ✅ | ❌ |
| hivehealer | ✅ | ✅ | ✅ | ✅ | ❌ |
| hiveq | ✅ | ❌ | ❌ | limited | ❌ |
| hiveplanner | ✅ | ❌ | ❌ | limited | ❌ |
| hiverd | ❌ | ❌ | ❌ | ❌ | ✅ |
| hivexplorer | ✅ | ❌ | ❌ | limited | ❌ |
| hitea | ✅ | ✅ | ✅ | ✅ | ❌ |

### Bash Permission Details

**Hiveq (limited):**
- `npx tsc *` ✅
- `npm test*` ✅
- `npm run *` ✅
- `grep *` ✅
- `find *` ✅
- `cat *` ✅

**Hiveplanner (limited):**
- `grep *` ✅
- `find *` ✅
- `cat *` ✅
- `ls *` ✅
- `tree *` ✅

**Hivexplorer (limited):**
- `grep *` ✅
- `find *` ✅
- `cat *` ✅
- `head *` ✅
- `tail *` ✅
- `wc *` ✅
- `ls *` ✅
- `tree *` ✅

### Scope Boundaries

| Agent | Allowed Paths | Forbidden Paths |
|-------|---------------|-----------------|
| hiveminder | — (orchestrates only) | `src/`, `tests/` |
| hivefiver | `agents/`, `commands/`, `workflows/`, `skills/` | `src/`, `tests/` |
| hivemaker | `src/`, `tests/`, `docs/` | `agents/`, `commands/`, `workflows/`, `skills/` |
| hivehealer | `src/`, `tests/`, `docs/` | `agents/`, `commands/`, `workflows/`, `skills/` |
| hiveq | All (read-only) | — |
| hiveplanner | `docs/`, `.hivemind/` | `src/`, `tests/` |
| hiverd | External only | Internal code |
| hivexplorer | All (read-only) | — |
| hitea | `tests/`, `src/` (test additions only) | `agents/`, `commands/` |

---

## .hivemind Interactions

### Files Read/Write by Tools

| Tool | Reads | Writes |
|------|-------|--------|
| **hiveops_todo** | `.hivemind/state/tasks.json` | `.hivemind/state/tasks.json`, `.hivemind/state/todo.json` |
| **hiveops_sot** | `.hivemind/state/sot-index.json` | `.hivemind/state/sot-index.json`, `.hivemind/state/sot-export.tsv` |
| **hiveops_export** | `.hivemind/state/gates.json`, `.hivemind/state/tasks.json` | `.hivemind/handoffs/*.json`, `.hivemind/handoffs/*.md`, `.hivemind/checkpoints/*.json` |
| **hiveops_gate** | `.hivemind/state/gates.json` | `.hivemind/state/gates.json` |

### State File Summary

```
.hivemind/
├── state/
│   ├── tasks.json        # Canonical task authority
│   ├── todo.json         # Compatibility export
│   ├── sot-index.json    # Artifact registry
│   ├── sot-export.tsv    # Grep-friendly export
│   └── gates.json        # Quality gate records
├── handoffs/
│   ├── *.json           # Structured handoff payload
│   └── *.md             # Human-readable handoff
└── checkpoints/
    └── cp-*.json        # Session snapshots
```

---

## Cross-Sector Dependencies

### Agents → Skills

| Agent | Depends On Skills |
|-------|-------------------|
| hiveminder | delegation-framework, entry-resolution, context-integrity |
| hivefiver | meta-builder-governance, skill-creator, command-creator |
| hivemaker | TDD workflow, verification-before-completion |
| hivehealer | systematic-debugging, verification-before-completion |
| hiveq | verification-methodology, evidence-discipline |
| hiveplanner | writing-plans, ralph-tasking |
| hiverd | research-methodology, deep-research |
| hivexplorer | knowledge-synthesis |

### Tools → Libraries

| Tool | Internal Dependencies |
|------|----------------------|
| hiveops_todo | `lib/persistence.js`, `lib/paths.js`, `lib/hiveops-paths.js`, `lib/manifest.js`, `lib/state-mutation-queue.js`, `schemas/manifest.js` |
| hiveops_sot | `lib/manifest.js`, `lib/hiveops-paths.js` |
| hiveops_export | `lib/manifest.js`, `lib/hiveops-paths.js`, `lib/task-authority.js` |
| hiveops_gate | `lib/manifest.js`, `lib/hiveops-paths.js` |

### Tools → External Systems

| Tool | External Dependencies |
|------|----------------------|
| All hiveops tools | `@opencode-ai/plugin/tool` |

---

## Knowledge Gaps

### Unclear After Reading

1. **Model Selection**: All agents specify `model: default` — what model is actually used? Is there a global default or per-agent override?

2. **Skill Preloading**: Agents don't specify `skills:` in frontmatter — how are skills loaded? Is there implicit skill loading based on agent type?

3. **Tool Access**: Agents don't explicitly list `allowedTools` — are the hiveops tools available to all agents automatically?

4. **Hiveminder Bash Access**: Frontmatter shows `bash: false` but the agent needs to coordinate. How does it trigger other agents without bash?

5. **HIVEA Isolation**: HITEA appears in the agent roster but isn't in any delegation permission matrix. Is it a standalone specialist that's invoked directly?

6. **Root vs .opencode Mirror**: Both `agents/` and `.opencode/agents/` exist with identical content. What's the authoritative source? When should each be used?

7. **Session ID Resolution**: Tools reference `context.sessionID` — where is this set? Is it the same as `.hivemind/state/brain.json` session?

8. **Graph Sync**: `queueTaskManifestMutation()` suggests graph database sync — what's the graph implementation? Is this Neo4j, in-memory, or file-based?

9. **Tool Execution Context**: How is `context.directory` resolved? Is it always the project root?

10. **Quality Gate Integration**: G0-G4 gates are defined, but how do agents enforce them? Is there automatic gate checking or is it manual?

---

## Anti-Pattern Recognition (Hiveminder)

| Anti-Pattern | Detection Trigger | Automatic Response |
|--------------|-------------------|-------------------|
| Skill Avalanche | >3 skills loaded in one turn | Halt, unload non-essential |
| Upstream Amnesia | delegation_source missing | Reject packet, require context |
| Scope Creep | Modified files outside scope | STOP, rollback, redefine scope |
| Session Rot | drift_score < 60, turn_count > 20 | Trigger recovery, re-align |

---

## Summary

### Key Findings

1. **Two-Tier Architecture**: Primary agents (hiveminder, hivefiver) orchestrate; subagents execute specialized tasks
2. **Strict Permission Boundaries**: Orchestrators have NO direct code access; executors have scoped permissions
3. **Evidence-Based Verification**: All completion claims require evidence; no evidence = no pass
4. **Tool Migration Complete**: All tools migrated from `.opencode/tool/` wrappers to `src/tools/` implementations
5. **State Canonicalization**: Tasks, gates, SOT all have canonical JSON storage with compatibility exports
6. **Terminal Subagents**: Only primary agents can delegate; all subagents are execution terminals
7. **Framework vs Product Separation**: HiveFiver works on framework; HiveMaker/HiveHealer work on product

### Recommended Next Steps

1. Document the model selection mechanism
2. Clarify skill preloading rules
3. Define HITEA's role in delegation hierarchy
4. Document graph sync implementation
5. Establish authoritative agent location (root vs .opencode)
