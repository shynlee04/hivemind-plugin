# HIVEMIND Framework Audit & Realignment Guide

> **Document ID**: HIVEMIND-AUDIT-2026-02-28  
> **Version**: 3.0  
> **Status**: Active Guidance  
> **Purpose**: Audit criteria and realignment protocols for `hiveminder`-led agent team working on SECTOR-1 framework harnessing  
> **Sources Consolidated**: 
> - [`docs/plans/2026-02-27-hybrid-ab-master-plan.md`](docs/plans/2026-02-27-hybrid-ab-master-plan.md)
> - [`THE-TIME-LINE-AFTER-THE-ZERO.md`](THE-TIME-LINE-AFTER-THE-ZERO.md)
> - [`SYSTEM-DIRECTIVES.md`](SYSTEM-DIRECTIVES.md)

---

## Executive Summary

This document serves as the **single source of truth** for auditing and realigning the HIVEMIND framework development work carried out by the agent team led by `hiveminder`. It consolidates strategic direction from the HYBRID-A+B Master Plan, sector stabilization requirements from THE-TIME-LINE-AFTER-THE-ZERO, and operational protocols from SYSTEM-DIRECTIVES.

### Core Philosophy

```markdown
HIVE = collaborative rigid hierarchical and relational domain-specific workflows + 
       pipelines of AGENTS on "Full Automation"; "self-governance" iterative 
       ruthless loops of multi-dimensional-aspects of critics til perfection

HIVEMIND = the above achieved through multi-agents working from the same MIND by:
  - Sorting out → systemization as frame/skeleton with expectations for "chaos"
  - "Conditional routing" + "traversing hierarchically" + "resolving both horizontally 
    and vertically" must all be foreseeable
  - Acknowledging agent shortcomings (no deductive thinking, prone to context pollution,
    enjoy "happy-path", hallucinate, unable to traverse in line-of-thought)
  - Breaking down into bite-sized complexity layering on strong foundation
  - Providing tools, libs, programmatic mechanisms, prepared workflows and prompting
```

---

## Part 1: Audit Framework

### 1.1 Purpose of SECTOR-1 (Current Development)

SECTOR-1 exists to **non-disruptively and integrally harness framework-related concepts** such that:

| Success Metric | Validation Criteria |
|----------------|---------------------|
| **Independence Test** | Even when SECTOR-1 is removed, SECTOR-2 works decently when manually initiated |
| **Non-Conflict Guarantee** | No overlapping, conflict, or destructive blocking of SECTOR-2 |
| **Foundation Quality** | SECTOR-1 decisions benefit later SECTOR-2 refactoring |
| **Context Hygiene** | No introduction of context rot, poisoning, or noise |

### 1.2 The 3-RANK Problem Hierarchy (From HYBRID-A+B Master Plan)

Use this hierarchy to prioritize audit findings:

#### RANK 1: Context Injection & Transformation Poisoning (CRITICAL)

**Definition**: All context injections/transformations that overlap, conflict, or fail deterministic alignment with planning SOT.

**Audit Checklist**:
- [ ] Two independent channels (lifecycle + transform) have cross-channel deduplication
- [ ] No P0 duplication: checklist contracts emitted by only ONE channel
- [ ] No P0 pollution: task blocks, ignored counters, tool hints removed from default path
- [ ] Injection footprint is optimized (< 1200 tokens/turn steady-state)
- [ ] Auto-realign menu only fires when commandless + intent confidence fails

**Evidence Locations**:
- [`src/hooks/session-lifecycle.ts:129-155`](src/hooks/session-lifecycle.ts:129) — System channel
- [`src/hooks/messages-transform.ts:530-544`](src/hooks/messages-transform.ts:530) — User-message channel
- [`src/lib/cognitive-packer.ts:391-560`](src/lib/cognitive-packer.ts:391) — Payload shape

#### RANK 2: Tools Routing + Mechanism Design Chain Reactions (HIGH)

**Definition**: How framework commands/workflows/agents/scripts interact with libs/hooks/schemas to create uncontrolled write/read loops into `.hivemind/`.

**Audit Checklist**:
- [ ] Zero unintended writes into `.hivemind/` during normal command flow
- [ ] All export writes validated against schema before persistence
- [ ] Tool naming ambiguity reduced to documented alias set
- [ ] No zombie/orphaned/stale JSON patterns in `.hivemind/state`
- [ ] Event consumer bridges properly wired (not just implemented)

#### RANK 3: In-Session Memory Not Auto-Parsed to Knowledge-Base (MEDIUM)

**Definition**: Missing lifecycle automation that transforms session artifacts into durable, retrievable knowledge.

**Audit Checklist**:
- [ ] Auto-new-session mechanism implemented (SYSTEM-DIRECTIVES §3A)
- [ ] Memory auto-classification (`temporary -> consolidated -> purged`)
- [ ] Session-related memory sorted by category (`discovery/research/planning/implementing/debug/test`)
- [ ] `STATE.md` auto-persistence on compaction
- [ ] TODO-Pending routing for off-track intentions

---

## Part 2: GREEN-FLAG Demonstrations

### 2.1 Meta-Framework Concept: Command Example

**Reference**: GSD's `gsd:debug` command structure

**GREEN-FLAG Checklist for Commands**:

```markdown
✅ YAML Frontmatter (Required Fields):
   - name: Namespaced (e.g., "hivefiver:debug", "hivemind:scan")
   - description: When to use, what it does
   - argument-hint: Expected input format
   - allowed-tools: Explicit capability list
   - triggers: When this command activates

✅ Structured Body Sections:
   - <objective>: Clear goal + orchestrator vs subagent role separation
   - <context>: Prerequisites, environment checks
   - <process>: Numbered steps with tool invocations
   - <success_criteria>: Checklist for completion
   - <failure_policy>: What to do when things go wrong

✅ Deterministic Integration:
   - Scripts for repeatable operations (scripts/)
   - References for domain knowledge (references/)
   - Templates for output consistency (templates/)
```

### 2.2 Meta-Framework Concept: Workflow Chaining

**Reference**: GSD's execution workflow patterns

**GREEN-FLAG Checklist for Workflows**:

```markdown
✅ Workflow Hierarchy:
   - Phase-level (orchestration) → Plan-level (coordination) → Task-level (execution)
   - Each level has explicit INPUT/OUTPUT contracts
   - Dependencies declared upfront, not discovered mid-flight

✅ Deterministic Steps:
   - Each step has: objective, process, success criteria
   - Gate checks between steps (cannot skip)
   - Rollback pointers at each checkpoint

✅ Agent Coordination:
   - Explicit parallel vs sequential decision criteria
   - Subagent spawn with full context (not "figure it out")
   - Result awaiting and validation before proceeding
```

### 2.3 Meta-Framework Concept: Skill Architecture

**Reference**: Claude Skills best practices adapted for HIVEMIND

**GREEN-FLAG Checklist for Skills**:

```markdown
✅ Knowledge Delta Principle:
   - Skill provides what the model DOESN'T already know
   - Expert-only: decision trees, trade-offs, anti-patterns
   - Domain-specific thinking frameworks

✅ Anatomy:
   skill-name/
   ├── SKILL.md (required)
   │   ├── YAML frontmatter (name, description, triggers, version)
   │   └── Markdown instructions (< 500 lines)
   ├── scripts/          - Deterministic code (not rewritten each time)
   ├── references/       - Loaded on-demand only
   └── templates/        - Output assets (not loaded into context)

✅ Progressive Disclosure:
   - L0: Bootstrap-minimal (always loaded)
   - L1: Command-required (triggered)
   - L2: Workflow-step-specific (scoped)
   - L3: Escalation-only (emergency)

✅ Local-First Resolution:
   - Resolve from root skills/ first
   - Then .opencode/skills (deployment mirror)
   - External sources: opt-in only, never auto-loaded
```

### 2.4 Meta-Framework Concept: Reference Patterns

**Reference**: GSD's git-integration references

**GREEN-FLAG Checklist for References**:

```markdown
✅ Static Knowledge Source:
   - Never an active routing mechanism
   - Loaded only when explicitly referenced
   - Grep patterns for large files (>10k words)

✅ Organization by Domain:
   references/
   ├── git-integration.md      # Git workflows, commit patterns
   ├── api-contracts.md        # API specifications
   ├── domain-knowledge.md     # Business logic, schemas
   └── pitfall-catalog.md      # Anti-patterns with evidence

✅ Linking from SKILL.md:
   - "For detailed API specs, see [API.md](references/API.md)"
   - "For common pitfalls, see [PITFALLS.md](references/PITFALLS.md)"
```

---

## Part 3: RED-FLAG Observable Behaviors

### 3.1 Context Pollution Indicators

| RED-FLAG | Why It Hurts | Detection Method |
|----------|--------------|------------------|
| Running lint on document-only changes | Wastes tokens, no value add | Check if `npm test` runs when only .md files changed |
| Trashing .md, .xml, .yaml, .json files without hierarchical order | Creates orphan artifacts, breaks lineage | Validate `.hivemind/` has valid hierarchy.json |
| Repeated delegation for same codebase investigation | Context re-ingestion, no memory consolidation | Check session memory for duplicate research entries |
| Hallucinating disconnected choices | No grounding in session context | Validate choices reference prior turns in conversation |

### 3.2 Agent Awareness Failures

| RED-FLAG | Expected Behavior | Audit Query |
|----------|-------------------|-------------|
| Agent unaware of downstream delegation levels | Must know delegation source (human vs upstream agent) | Check if agent distinguishes `hiveminder` delegation vs user request |
| No turn-awareness | Must know "this is turn N of trajectory T" | Validate `declare_intent` called at session start |
| Context consumption without deterministic routing | Must use progressive disclosure, not batch-load | Check skill loading follows L0-L3 escalation |
| Post-compaction amnesia | Must use `think_back` + `recall_mems` | Verify anchors and mems survive compaction |

### 3.3 Framework Violations

| RED-FLAG | Correct Pattern | Severity |
|----------|-----------------|----------|
| Skill contains orchestration logic | Skills = knowledge delta ONLY | CRITICAL |
| Command contains deep domain tutorials | Commands = routing ONLY | HIGH |
| Workflow contains role policy | Workflows = deterministic procedure ONLY | HIGH |
| Agent has edit permissions on `src/` | Agents delegate, don't implement | CRITICAL |
| Hook performs mutations | Hooks = read-auto, Tools = write-only | CRITICAL |
| Tool exceeds ~300 lines | Strategic limit for maintainability | MEDIUM |

### 3.4 OpenCode Compliance Violations

| RED-FLAG | OpenCode Standard | HIVEMIND Alignment |
|----------|-------------------|-------------------|
| Missing YAML frontmatter in skills | Required: name, description | Enforce in validate-framework.sh |
| Skills > 500 lines without references | Progressive disclosure violation | Split into references/ |
| Commands without allowed-tools | Security/scope violation | Audit all commands in commands/ |
| Duplicate skill names | Namespace collision | Use hierarchical naming |

---

## Part 4: OpenCode Alignment Standards

### 4.1 Configuration Schema (opencode.json)

```json
{
  "skills": {
    "local": [
      "skills/hivemind-governance",
      "skills/context-integrity",
      "skills/delegation-intelligence"
    ],
    "external": [],
    "disclosure": {
      "default_level": "L0",
      "escalation_trigger": "explicit_only"
    }
  },
  "commands": {
    "namespace": "hivemind",
    "routing": "strict",
    "validation": "pre-execution"
  },
  "agents": {
    "hiveminder": {
      "role": "orchestrator",
      "can_delegate": true,
      "can_edit": false
    },
    "hivefiver": {
      "role": "meta-builder",
      "can_delegate": true,
      "can_edit": false
    }
  }
}
```

### 4.2 Skill Bundle Registry

| Bundle | Skills | Disclosure Level | Load Trigger |
|--------|--------|------------------|--------------|
| `governance-core` | hivemind-governance, session-lifecycle, context-integrity | L0 | Every turn |
| `routing-core` | delegation-intelligence, delegation-packet-contract | L1 | Pre-delegation |
| `planning-core` | hiveplanner-orchestration, planning-materializer | L2 | Plan-phase workflow |
| `research-core` | research-methodology, source-evaluation | L2 | Research workflow |
| `verification-core` | gate-enforcement, regression-detection | L2 | Verification phase |
| `repair-core` | systematic-debugging-hivemind, debug-orchestration | L3 | Debug escalation |
| `meta-core` | skill-creator, skill-judge | L3 | Skill development |

### 4.3 Namespace Conventions

```markdown
Commands:    hivemind:<action>      hivefiver:<action>      hiveq:<action>
             (core governance)      (meta-building)         (quality gates)

Skills:      hivemind-<domain>      hivefiver-<domain>      meta-<domain>
             (governance skills)    (builder skills)        (framework skills)

Agents:      hiveminder             hivefiver               hiveplanner
             (orchestrator)         (meta-builder)          (phase-planner)
             
Workflows:   <domain>-<verb>        (e.g., plan-phase, execute-plan, verify-work)
```

---

## Part 5: Realignment Protocols

### 5.1 When to Trigger Realignment

Trigger realignment when ANY of these conditions are met:

1. **Drift Score < 50** — Context degradation detected
2. **3+ Turns without `map_context`** — Stale trajectory
3. **Post-compaction without `think_back`** — Risk of amnesia
4. **Subagent return without `export_cycle`** — Intelligence loss
5. **RED-FLAG behavior observed** — Framework violation

### 5.2 Realignment Prompt Template

```markdown
# HIVEMIND REALIGNMENT PROTOCOL

## Current State Assessment
**Session ID**: [UUID]
**Drift Score**: [0-100]
**Turn Count**: [N]
**Last Action**: [declare_intent | map_context | compact_session | other]

## Required Actions

### Step 1: Context Recovery (MANDATORY)
```typescript
// Load context-first gatekeeping
skill("hivemind-governance")

// Assess current position
scan_hierarchy({})

// If post-compaction or drift detected
think_back({})
recall_mems({ query: "decisions" })
```

### Step 2: Validate Trajectory
- [ ] Current action aligns with active trajectory
- [ ] No orphaned tasks in hierarchy
- [ ] Parent-child chain intact

### Step 3: Re-establish Intent (if needed)
```typescript
declare_intent({
  mode: "plan_driven" | "quick_fix" | "exploration",
  focus: "Current work description",
  reason: "Realignment triggered: [drift|compaction|violation]"
})
```

### Step 4: Document Realignment
```typescript
save_anchor({
  type: "realignment",
  content: "Realignment at turn [N]: [reason]. Resuming [work].",
  tags: ["drift-recovery", "context-maintenance"]
})
```

## Success Criteria
- [ ] Drift score > 70
- [ ] Hierarchy shows current position
- [ ] Session memory accessible
- [ ] Ready to proceed with clear intent
```

### 5.3 Post-Violation Recovery

When RED-FLAG behavior is detected:

```markdown
# POST-VIOLATION RECOVERY PROTOCOL

## Immediate Halt
STOP all work. Do not proceed with current task.

## Violation Classification
| Severity | Action |
|----------|--------|
| CRITICAL | Halt all work, escalate to hiveminder immediately |
| HIGH | Pause current wave, assess blast radius |
| MEDIUM | Log violation, continue with monitoring |

## Recovery Steps
1. **Document the violation** with evidence
2. **Assess blast radius** — what else might be affected?
3. **Revert if necessary** — rollback to last known good state
4. **Root cause analysis** — why did the violation occur?
5. **Prevention measure** — how to avoid in future?

## Evidence Collection
```typescript
save_mem({
  shelf: "violations",
  content: "[VIOLATION-TYPE] at [LOCATION]: [DESCRIPTION]. Evidence: [FILES].",
  tags: ["violation", "recovery", "prevention"]
})
```
```

---

## Part 6: Audit Execution Checklist

### 6.1 Pre-Audit Setup

```bash
# 1. Verify environment
cd /Users/apple/hivemind-plugin
npx tsc --noEmit
npm test

# 2. Check framework validator
./scripts/validate-framework.sh

# 3. Verify .hivemind integrity
node bin/hivemind-tools.cjs validate chain
node bin/hivemind-tools.cjs state hierarchy
```

### 6.2 Per-Wave Audit Checklist

#### Wave β: Context Injection Remediation

- [ ] P0 duplication removed from both lifecycle and transform channels
- [ ] P0 pollution (task blocks, counters, hints) removed from default path
- [ ] Auto-realign conditionalized (fires only when appropriate)
- [ ] Wave α integration points wired safely
- [ ] Cross-channel dedup active
- [ ] Steady-state injection < 1200 tokens/turn
- [ ] `npx tsc --noEmit` pass
- [ ] `npm test` pass

#### Wave γ: Tools & Mechanism Hygiene

- [ ] Event listeners audited for unintended triggers
- [ ] Zombie/orphan JSON patterns cataloged
- [ ] Tool naming conflicts resolved
- [ ] Export contracts validated before write
- [ ] `npx tsc --noEmit` pass
- [ ] `npm test` pass

#### Wave δ: Auto-Session + Memory Lifecycle

- [ ] Auto-new-session mechanism implemented
- [ ] Memory auto-classification working
- [ ] Category sorting implemented
- [ ] `STATE.md` auto-persistence on compaction
- [ ] TODO-Pending lifecycle implemented
- [ ] `npx tsc --noEmit` pass
- [ ] `npm test` pass

### 6.3 Post-Audit Reporting

```markdown
## Audit Report Template

**Audit ID**: AUDIT-[DATE]-[SEQUENCE]
**Auditor**: [Agent Name]
**Scope**: [Waves/Areas Audited]
**Duration**: [Start] - [End]

### Findings Summary
| Severity | Count | Categories |
|----------|-------|------------|
| CRITICAL | [N] | [List] |
| HIGH | [N] | [List] |
| MEDIUM | [N] | [List] |
| LOW | [N] | [List] |

### GREEN-FLAG Validations
- [X] Commands follow frontmatter + structure pattern
- [X] Workflows have deterministic steps
- [X] Skills respect knowledge delta + progressive disclosure
- [X] References are static knowledge sources only

### RED-FLAGS Found
1. **[FLAG]**: [Description]
   - **Location**: [File/Line]
   - **Evidence**: [Quote/Artifact]
   - **Remediation**: [Action Required]

### Recommendations
1. [Priority 1 recommendation]
2. [Priority 2 recommendation]

### Sign-off
- [ ] Technical review complete
- [ ] Framework validator pass
- [ ] Documentation updated
```

---

## Part 7: Quick Reference

### 7.1 Essential Tools

```bash
# Know where you are
node bin/hivemind-tools.cjs state hierarchy

# Know what happened
node bin/hivemind-tools.cjs session trace <stamp>

# Know if things are consistent
node bin/hivemind-tools.cjs validate chain

# Full ecosystem check
node bin/hivemind-tools.cjs ecosystem-check
```

### 7.2 Session Lifecycle Tools

```typescript
// Start
skill("hivemind-governance")
declare_intent({ mode, focus })

// During work
map_context({ level, content })
save_anchor({ type, content, tags })
save_mem({ shelf, content, tags })

// Delegation
skill("delegation-intelligence")
// Spawn subagent with explicit task/scope/return format
export_cycle({ outcome, findings })

// Recovery
skill("context-integrity")
scan_hierarchy({})
think_back({})
recall_mems({ query })

// End
compact_session({ summary })
```

### 7.3 Decision Matrix

| Scenario | Action | Skill to Load |
|----------|--------|---------------|
| Starting new session | `declare_intent` + `scan_hierarchy` | hivemind-governance |
| Drift warning | `think_back` + `recall_mems` | context-integrity |
| About to delegate | Validate 4 parallel conditions | delegation-intelligence |
| Subagent returned | Parse result, `export_cycle` | delegation-intelligence |
| Post-compaction | `think_back` + verify mems | context-integrity |
| Off-track intention | Save to TODO-Pending, continue main | session-lifecycle |
| Unclear requirements | Ask clarifying questions | evidence-discipline |

---

## Appendix A: Related Documents

| Document | Purpose | Location |
|----------|---------|----------|
| HYBRID-A+B Master Plan | Strategic execution map | [`docs/plans/2026-02-27-hybrid-ab-master-plan.md`](docs/plans/2026-02-27-hybrid-ab-master-plan.md) |
| SYSTEM-DIRECTIVES | Framework behavior SOT | [`SYSTEM-DIRECTIVES.md`](SYSTEM-DIRECTIVES.md) |
| AGENTS.md | Agent role definitions | [`AGENTS.md`](AGENTS.md) |
| HIVEMIND-FRAMEWORK.md | Framework overview | [`HIVEMIND-FRAMEWORK.md`](HIVEMIND-FRAMEWORK.md) |
| PITFALLS | Anti-pattern catalog | [`docs/PITFALLS.md`](docs/PITFALLS.md) |

## Appendix B: Evidence Registry

| ID | Evidence | Source |
|----|----------|--------|
| EV-01 | Dual-channel system injection path | [`src/hooks/session-lifecycle.ts:129-155`](src/hooks/session-lifecycle.ts:129) |
| EV-02 | Checklist reminder emitted from lifecycle | [`src/hooks/session-lifecycle.ts:66-70`](src/hooks/session-lifecycle.ts:66) |
| EV-03 | Task block injected each turn | [`src/hooks/session-lifecycle.ts:203-210`](src/hooks/session-lifecycle.ts:203) |
| EV-04 | Auto-realign reminder in transform | [`src/hooks/messages-transform.ts:91-113`](src/hooks/messages-transform.ts:91) |
| EV-05 | Cognitive packer payload shape | [`src/lib/cognitive-packer.ts:391-560`](src/lib/cognitive-packer.ts:391) |

---

*Document maintained by HIVEMIND Documentation Specialist. Last updated: 2026-02-28*
*For questions or updates, delegate to `hiveminder` with reference to this document.*
