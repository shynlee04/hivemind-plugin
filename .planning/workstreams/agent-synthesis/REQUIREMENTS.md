---
workstream: agent-synthesis
created: 2026-04-29
status: ACTIVE
phase_count: 12
---

# Agent Synthesis Workstream — Requirements

## 1. Purpose

This workstream owns ALL agent definitions in `.opencode/agents/`. It replaces the current 34 GSD agents (`gsd-*`) with a custom 2-lineage system (`hm-*` and `hf-*`) that maps directly to the project's skill taxonomy, enforces a 3-level delegation depth, and standardizes agent body format with XML-tagged structured sections.

The end state: zero `gsd-*` agents, ~30 `hm-*` agents across 11 categories, and ~12 `hf-*` agents across 7 categories — all with YAML frontmatter, XML body, lineage-scoped skill bindings, and depth-aware temperature/permission profiles.

---

## 2. Scope

### In Scope

- 59 agent files total (34 gsd-* deletion + ~30 hm-* creation + ~12 hf-* creation + retained core agents)
- Full GSD replacement (D-AD-03): all `gsd-*` agents deleted and replaced
- L0/L1/L2 depth hierarchy creation (D-AD-02)
- YAML frontmatter standardization across all agents
- XML body quality enforcement (D-AD-04)
- Agent-to-skill wiring with lineage-scoped bindings (D-AD-01)
- Permission models per depth level
- Temperature profiles per depth level
- Capability matrix generation (which agent can access which skills)

### Out of Scope

- Skill content authoring or modification (owned by skill-ecosystem workstream)
- `src/` code changes (harness runtime code)
- `.hivemind/` state or runtime changes
- Command definitions (owned separately)
- Plugin composition changes

---

## 3. Locked Design Decisions

| ID | Decision | Choice | Rationale |
|----|----------|--------|-----------|
| D-AD-01 | Cross-lineage skill binding | hm-agents → hm-skills STRICT; hf-agents → hf-skills + hm-skills FLEXIBLE | hf-* agents sometimes need hm-detective, hm-deep-research for codebase investigation before building meta-concepts |
| D-AD-02 | Delegation depth model | 3-level: Orchestrator (L0) → Coordinator (L1) → Specialist (L2) | Matches OpenCode's subagent dispatch architecture; prevents unbounded delegation chains |
| D-AD-03 | GSD agent replacement strategy | Full replacement — all 34 gsd-* agents deleted | gsd-* agents are external framework agents not tailored to this project's taxonomy; clean break avoids confusion |
| D-AD-04 | Agent body format | XML-tagged structured body: `<task>`, `<scope>`, `<context>`, `<expected_output>`, `<verification>` | Machine-parseable, self-documenting, enables automated quality checks |

---

## 4. Two-Lineage Taxonomy (D-AD-01)

### 4.1 hm-* Lineage — Product Development

Agents that execute product workflows: research, planning, implementation, testing, review, and deployment.

**Skill Binding (STRICT):** hm-agents → hm-skills + gate-* + stack-* ONLY. Cannot access hf-* skills.

**Depth Distribution:**

| Level | Count | Role |
|-------|-------|------|
| L0 Orchestrator | 1–2 | Top-level workflow orchestrators |
| L1 Coordinator | 3–5 | Phase/wave coordinators with gate management |
| L2 Specialist | 20–25 | Single-domain executors, no delegation |

**Categories (11):**

1. **Research** — Codebase investigation, evidence gathering, multi-source synthesis
2. **Planning** — Phase planning, roadmap creation, dependency analysis
3. **Implementation** — Code writing, feature development, refactoring
4. **Quality** — Code review, testing, verification, validation
5. **Domain** — Domain-specific research, framework selection
6. **Documentation** — Doc writing, classification, verification
7. **Phase Lifecycle** — Phase execution, loop management, checkpoint recovery
8. **Audit** — Milestone audit, UAT audit, evaluation review
9. **UI** — UI research, UI checking, UI audit
10. **Intelligence** — Codebase mapping, pattern detection, intel updates
11. **Debug** — Systematic debugging, debug session management

### 4.2 hf-* Lineage — Meta Builder

Agents that build OpenCode meta-concepts: skills, agents, commands, tools.

**Skill Binding (FLEXIBLE):** hf-agents → hf-skills + hm-skills (when needed) + gate-* + stack-*.

hf-* agents may access hm-* skills (e.g., hm-detective for codebase investigation, hm-deep-research for library analysis) when their meta-concept building task requires understanding the existing codebase.

**Depth Distribution:**

| Level | Count | Role |
|-------|-------|------|
| L0 Orchestrator | 1 | Meta-builder orchestrator |
| L1 Coordinator | 1–2 | Category coordinators (agent/skill/tool) |
| L2 Specialist | 4–6 | Single-meta-concept builders |

**Categories (7):**

1. **Orchestration** — Meta-builder orchestrator, workflow routing
2. **Agent Building** — Agent definition creation, audit, repair
3. **Command Building** — Command definition creation, argument parsing
4. **Skill Authoring** — Skill creation, quality audit, pattern extraction
5. **Tool Building** — Custom tool creation with Zod schemas
6. **Context/Audit** — Context absorption, AGENTS.md sync, project audit
7. **Prompt Engineering** — Prompt analysis, optimization, repackaging

### 4.3 Cross-Lineage Rule (D-AD-01 Revised)

```
hm-agent ──→ hm-skills + gate-* + stack-*     (STRICT — no hf-* access)
hf-agent ──→ hf-skills + hm-skills + gate-* + stack-*  (FLEXIBLE)
```

**Rationale:** hf-* agents build meta-concepts that must understand the existing codebase. For example, hf-skill-author needs hm-detective to locate existing patterns before authoring a new skill. hm-* agents are product executors and have no legitimate reason to invoke meta-builder skills.

---

## 5. Three-Level Depth Delegation (D-AD-02)

### 5.1 Level Definitions

| Property | L0 Orchestrator | L1 Coordinator | L2 Specialist |
|----------|----------------|----------------|---------------|
| **Mode** | `primary` | `subagent` | `subagent` |
| **Temperature** | 0.2–0.3 | 0.1–0.2 | 0.0–0.15 |
| **Delegates to** | L1 only | L2 only | Nobody |
| **Implements** | Never | Never | Always |
| **Manages** | Workflow routing, gate decisions | Wave dispatch, checkpoint gates | Single-domain execution |
| **Returns** | Workflow completion summary | Wave results + gate verdicts | Structured domain results |

### 5.2 Delegation Rules

1. **L0 → L1 only.** An orchestrator never delegates directly to L2.
2. **L1 → L2 only.** A coordinator never delegates to another L1 or back to L0.
3. **L2 cannot delegate.** A specialist returns results; it does not spawn subagents.
4. **Temperature decreases with depth.** Lower depth = more deterministic. L0 needs creativity for routing; L2 needs precision for execution.
5. **Permission scope narrows with depth.** L0 has broad read access; L2 has scoped write access to its domain only.

---

## 6. Agent Body Standard (D-AD-04)

Every agent file must follow this structure:

### 6.1 YAML Frontmatter

```yaml
---
name: hm-researcher
description: "Terminal repository investigator for read-only codebase research, evidence collection, and synthesis. Never mutates files or delegates implementation work."
mode: subagent          # primary | subagent
temperature: 0.1        # Within depth range
depth: L2               # L0 | L1 | L2
lineage: hm             # hm | hf
tools:
  - Read
  - Glob
  - Grep
  - Bash
skills:
  - hm-detective
  - hm-deep-research
  - hm-synthesis
permissions:
  read:
    - src/**
    - .opencode/**
    - .hivemind/**
  write: []             # L2 specialist: read-only
  delegate: []           # L2 cannot delegate
---
```

### 6.2 XML Body Template

```xml
<role>
One-sentence description of what this agent does and its boundaries.
</role>

<depth>
Declare delegation authority and constraints for this depth level.
</depth>

<lineage>
Declare skill binding scope and cross-lineage restrictions.
</lineage>

<task>
<!-- PRIMARY: Define what the agent does when invoked directly -->
What this agent must accomplish when it receives a task.
</task>

<scope>
<!-- BOUNDARIES: What this agent may and may not do -->
Explicit boundaries — what is in scope and out of scope.
</scope>

<context>
<!-- PREREQUISITES: What this agent needs before starting -->
Required context, files, or state that must be available.
</context>

<expected_output>
<!-- OUTPUT: What the agent returns on completion -->
Structured description of what the agent produces.
</expected_output>

<verification>
<!-- SUCCESS CRITERIA: How to verify the agent completed its task -->
Checklist of verifiable outcomes.
</verification>
```

---

## 7. GSD Replacement Plan (D-AD-03)

> **Note:** The stages below are sequential implementation steps within this workstream, not separate ROADMAP phases. These stages map to ROADMAP phases AS-4→AS-7, not independent phases. The AS-* numbering in the table header refers to ROADMAP phase IDs, not the stage numbers.

### 7.1 Stage Sequence

| ROADMAP Phase | Stage ID | Action | Description |
|---------------|----------|--------|-------------|
| AS-1 | GSD-DELETE | Delete all gsd-* agents | Remove 34 files from `.opencode/agents/` |
| AS-2 | HM-CREATE | Create hm-* replacements | Build ~30 hm-* agents across 11 categories |
| AS-3 | HF-CREATE | Create hf-* from hivefiver-* | Refactor 6 hivefiver-* → ~12 hf-* agents |
| AS-4 | CAPABILITY | Wire capability matrix | Generate and validate agent↔skill mapping |
| AS-5 | CORE-RETAIN | Retain core agents | Verify build, conductor, coordinator, critic, general, test-router remain unchanged |
| AS-6 | VALIDATE | Validate complete ecosystem | Full integration test: every agent loads, every skill resolves, every permission is valid |
| AS-7 | CLEANUP | Remove dead references | Clean AGENTS.md, remove gsd-* references from all commands |
| AS-8 | DOCUMENT | Update documentation | AGENTS.md, project docs reflect new agent taxonomy |

### 7.2 Transition Safety

- **Coexistence period:** gsd-* and hm-* agents coexist until AS-6 passes validation.
- **No removal without replacement:** Every gsd-* capability must have an hm-* equivalent before the gsd-* agent is deleted.
- **Rollback plan:** If AS-6 fails, revert to gsd-* agents via git revert of the AS-1 commit.
- **AGENTS.md update:** Only after AS-6 passes — prevents documentation-code drift.

### 7.3 W6 Phase Delivery Requirements (AS-8 through AS-11)

| ROADMAP Phase | ID | Action | Description |
|---------------|-----|--------|-------------|
| AS-8 | ENRICH-BODY | Enrich all agent bodies beyond OMO + GSD | Add 5 new XML sections (behavioral_contract, anti_patterns, delegation_boundary, skill_loading, session_continuity) to all 48+ agents. Quality baseline: ≥200 LOC per body, equal or superior to gsd-planner (1248 lines) |
| AS-9 | TOOL-MATRIX | Wire tool capabilities per agent | Create TOOL-CAPABILITY-MATRIX.md. Every agent declares explicit native tools, Hivemind custom tools, and MCP tools. No blanket `"*"` permissions |
| AS-10 | WORKFLOW-AWARE | Make agents workflow-aware | Create WORKFLOW-AWARENESS.md. Add `<workflow_awareness>` XML section. Agents understand .planning/ structure, dependency chains, wave execution, 3-gate verification |
| AS-11 | NAMING-SYNDICATE | Rename all agents to hm-*/hf-* pattern | Create NAMING-SYNDICATE.md. Rename 59 agents to consistent pattern. Delete gsd-* agents. Update all cross-references in AGENTS.md, 49 skills, 13 commands |

### 7.4 W6 Transition Safety
- **Coexistence:** AS-8 through AS-11 enrich and rename existing agents; gsd-* agents remain until AS-11 completion
- **Naming atomicity:** All 59 agents renamed in a single commit (AS-11) — no half-renamed state
- **Cross-reference verification:** Machine-verifiable regex validates all agent names post-AS-11
- **Rollback plan:** If AS-11 naming fails pre-check, revert to pre-AS-11 commit

---

## 8. Quality Contract (AQUAL-01 through AQUAL-08)

Every agent file must satisfy all 8 quality requirements:

| ID | Requirement | Check | Pass Criteria |
|----|-------------|-------|---------------|
| **AQUAL-01** | YAML frontmatter present | Parse YAML block | All required fields present: name, description, mode, temperature, depth, lineage |
| **AQUAL-02** | 5 XML sections minimum | Count XML tags | `<task>`, `<scope>`, `<context>`, `<expected_output>`, `<verification>` all present |
| **AQUAL-03** | Lineage match | Compare declared lineage vs skill list | hm-* agent has zero hf-* skills; hf-* agent may have hm-* skills |
| **AQUAL-04** | Depth declared | Verify depth field | L0, L1, or L2 — no other values |
| **AQUAL-05** | Granular permissions | Check permissions block | read, write, delegate arrays are explicit (no wildcards except `**` for read) |
| **AQUAL-06** | Max 500 lines | Line count | Agent file ≤ 500 lines total (frontmatter + body) |
| **AQUAL-07** | Skill references resolve | Verify each skill exists | Every skill listed in `skills:` array maps to an existing `.opencode/skills/<name>/SKILL.md` |
| **AQUAL-08** | Temperature within depth range | Numeric check | L0: 0.2–0.3, L1: 0.1–0.2, L2: 0.0–0.15 |

---

## 9. Dependencies

### Blocking Dependencies

| Dependency | Workstream | Phase | Status | Impact |
|------------|-----------|-------|--------|--------|
| SE-5 Gate orchestration lineage | skill-ecosystem | SE-5 | Active | hm-* agents need gate-* skills to exist |
| SE-5.5 Internal gate skills | skill-ecosystem | SE-5.5 | Active | Quality gate triad skills must be finalized |

### Read-Only Dependencies

| Dependency | Workstream | Notes |
|------------|-----------|-------|
| Milestone phases | milestone | Agent synthesis reads phase structure but does not modify it |
| Skill taxonomy | skill-ecosystem | Agent skill bindings read from skill definitions |
| Core agents | — | build, conductor, coordinator, critic, general, test-router remain unchanged |

---

## 10. Non-Regression Rules

1. **No deletion without replacement.** Every gsd-* capability must have an hm-* equivalent before deletion (AS-1 blocked by AS-2 completion).
2. **Permissions never downgrade.** New agents must have permissions ≥ their gsd-* predecessors for equivalent functionality.
3. **Depth is immutable after declaration.** An agent's depth level cannot change without a design decision amendment.
4. **Lineage is immutable after declaration.** An agent's lineage cannot change without a design decision amendment.
5. **Body format enforced.** All new agents must pass AQUAL-01 through AQUAL-08 before merge.
6. **Transition period coexistence.** gsd-* agents remain until AS-6 validation passes; no premature removal.

---

## Verification Checklist

- [ ] File exists at `.planning/workstreams/agent-synthesis/REQUIREMENTS.md`
- [ ] D-AD-01 cross-lineage rule documented: hm STRICT, hf FLEXIBLE
- [ ] 3-level depth with temperature ranges: L0 (0.2–0.3), L1 (0.1–0.2), L2 (0.0–0.15)
- [ ] XML body template with all required tags: task, scope, context, expected_output, verification
- [ ] 8 quality requirements AQUAL-01 through AQUAL-08 documented
- [ ] GSD replacement plan with 8 phases documented
- [ ] Dependencies and non-regression rules documented
