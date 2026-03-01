# HiveFiver V2 — Agent Team Topology

> **Last Updated**: 2026-03-01
> **Status**: ACTIVE
> **SOT Type**: Iterative — modify in place

---

## Table of Contents

| Section | Anchor | Classification |
|---------|--------|----------------|
| Three-Row Delegation Architecture | [§1](#1-three-row-delegation-architecture) | architecture |
| Agent Registry | [§2](#2-agent-registry) | reference |
| Delegation Wiring | [§3](#3-delegation-wiring) | orchestration |
| Delegation Packet Contract | [§4](#4-delegation-packet-contract) | contract |
| Anti-Loop Safeguards | [§5](#5-anti-loop-safeguards) | governance |
| Parallelism Rules | [§6](#6-parallelism-rules) | orchestration |
| Compound vs Atomic Cycles | [§7](#7-compound-vs-atomic-cycles) | architecture |
| Activation Note | [§8](#8-activation-note) | operations |

---

## 1. Three-Row Delegation Architecture

<!-- CLASSIFICATION: architecture, delegation-topology, three-row -->
<!-- SYNTHESIS-TAGS: row-1-primary, row-2-compound, row-3-atomic, context-isolation -->

```
┌─────────────────────────────────────────────────────────────────────┐
│  ROW 1 — PRIMARY COORDINATOR (hivefiver)                            │
│  • Owns TODOs, owns compound cycle frame                            │
│  • NEVER polluted by deep context — delegates filtering downstream  │
│  • Manages: intent → plan → checkpoint → handoff                    │
│                                                                     │
│  Delegates to: Row 2 (compound agents)                              │
│  Delegates to: Row 3 (atomic agents, for simple leaf tasks)         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐  ┌────────────────┐  ┌──────────────┐
│  ROW 2        │  │  ROW 2         │  │  ROW 2       │
│  mf-specifier │◄►│  mf-architect  │◄►│  mf-auditor  │
│               │  │                │  │              │
│  Compound     │  │  Compound      │  │  Compound    │
│  Spec cycles  │  │  Arch cycles   │  │  Gate cycles │
└───────┬───────┘  └───────┬────────┘  └──────┬───────┘
        │                  │                   │
        │    ┌─────────────┼─────────────┐     │
        └────┤             │             ├─────┘
             ▼             ▼             ▼
      ┌──────────┐  ┌────────────┐  ┌──────────┐
      │  ROW 3   │  │  ROW 3     │  │  ROW 3   │
      │ mf-      │  │ mf-crafter │  │ mf-      │
      │researcher│  │            │  │verifier  │
      │          │  │            │  │          │
      │  Atomic  │  │  Atomic    │  │  Atomic  │
      │  Read+Web│  │  Write     │  │  Read+Run│
      └──────────┘  └────────────┘  └──────────┘
      LEAF WORKER    LEAF WORKER    LEAF WORKER
      No delegation  No delegation  No delegation
```

### Row Responsibilities

| Row | Agent(s) | Context Load | Delegation Capability | Key Principle |
|-----|----------|-------------|----------------------|---------------|
| **1** | hivefiver (existing) | Minimal frame only | → Row 2, → Row 3 | Never polluted. Owns skeleton + TODOs. |
| **2** | mf-specifier, mf-architect, mf-auditor | Full compound context | → Row 3, ↔ Row 2 (lateral) | Manages filtering, robustness, depth, width. |
| **3** | mf-researcher, mf-crafter, mf-verifier | Single-task context | NONE (leaf workers) | Executes atomic tasks. Returns structured results. |

### Context Isolation Model

```
Row 1 (hivefiver)
  Context: ~5% of total → frame, TODO state, delegation packets, verdicts
  Knowledge: Routing table, agent registry, current phase position
  Anti-rot: Delegates ALL depth work downstream

Row 2 (compound agents)
  Context: ~30% of total → requirements, specs, architecture, research synthesis
  Knowledge: Domain expertise loaded via skills, references read on demand
  Anti-rot: Return structured results upstream, don't propagate raw context

Row 3 (atomic agents)  
  Context: ~65% of total → deep file reads, web research, full validation runs
  Knowledge: Task-specific, loaded fresh per delegation (no carryover)
  Anti-rot: Fresh 200K context per invocation, no state accumulation
```

---

## 2. Agent Registry

<!-- CLASSIFICATION: reference, agent-inventory -->

| Agent | File | Row | Mode | Hidden | Temp | Key Permissions |
|-------|------|-----|------|--------|------|----------------|
| **hivefiver** | `.opencode/agents/hivefiver.md` | 1 | all | false | — | Full orchestrator (existing, DO NOT MODIFY) |
| **mf-specifier** | `.opencode/agents/mf-specifier.md` | 2 | subagent | true | 0.2 | read+write+edit+task → (Row 2 + Row 3) |
| **mf-architect** | `.opencode/agents/mf-architect.md` | 2 | subagent | true | 0.2 | read+write+edit+task → (Row 2 + Row 3) |
| **mf-auditor** | `.opencode/agents/mf-auditor.md` | 2 | subagent | true | 0.1 | read+bash+task → (mf-researcher, mf-verifier only). NO write/edit. |
| **mf-researcher** | `.opencode/agents/mf-researcher.md` | 3 | subagent | true | 0.3 | read+webfetch+bash. NO write/edit/task. |
| **mf-crafter** | `.opencode/agents/mf-crafter.md` | 3 | subagent | true | 0.2 | read+write+edit+bash. NO task. |
| **mf-verifier** | `.opencode/agents/mf-verifier.md` | 3 | subagent | true | 0.1 | read+bash. NO write/edit/task. |

### Agent Sizing

| Agent | Target Lines | Body Focus |
|-------|-------------|------------|
| mf-specifier | ~100L | Compound spec cycle + delegation rules + output schema |
| mf-architect | ~95L | Compound arch cycle + design principles + output schema |
| mf-auditor | ~105L | Gate architecture + verdict schema + evidence rules |
| mf-researcher | ~95L | Research protocol + evidence hierarchy + return schema |
| mf-crafter | ~100L | Asset contracts + writing protocol + parity rules |
| mf-verifier | ~95L | Verification types + check definitions + verdict schema |

---

## 3. Delegation Wiring

<!-- CLASSIFICATION: orchestration, wiring-table -->

### Who Can Delegate To Whom

| From ↓ / To → | mf-specifier | mf-architect | mf-auditor | mf-researcher | mf-crafter | mf-verifier |
|---------------|:---:|:---:|:---:|:---:|:---:|:---:|
| **hivefiver** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **mf-specifier** | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| **mf-architect** | ✅ | — | ✅ | ✅ | ✅ | ✅ |
| **mf-auditor** | ❌ | ❌ | — | ✅ | ❌ | ✅ |
| **mf-researcher** | ❌ | ❌ | ❌ | — | ❌ | ❌ |
| **mf-crafter** | ❌ | ❌ | ❌ | ❌ | — | ❌ |
| **mf-verifier** | ❌ | ❌ | ❌ | ❌ | ❌ | — |

### Wiring Rationale

- **Row 1 → all**: Primary can reach any agent (via `"*": ask` in existing hivefiver.md)
- **Row 2 → Row 2 (lateral)**: Specifier and Architect can cross-delegate for spec↔arch reviews. Auditor is terminal — never delegates laterally.
- **Row 2 → Row 3**: All compound agents can delegate to atomic workers
- **Row 3 → anyone**: BLOCKED. Leaf workers have `task: deny`
- **Auditor special case**: Read-only + verdict, can only delegate to researcher (evidence) and verifier (checks)

---

## 4. Delegation Packet Contract

<!-- CLASSIFICATION: contract, delegation-packet -->

Every delegation across rows MUST include this packet:

```yaml
delegation_packet:
  # Metadata
  caller: "agent-name"
  target: "agent-name"
  cycle_type: "compound | atomic"
  cycle_id: "TYPE-YYYYMMDD-N"  # e.g., spec-20260301-1
  
  # Scope
  objective: "single measurable outcome"
  in_scope_paths:
    - ".hivemind/hive-modules/hivefiver-v2/"
    - ".opencode/"
  out_of_scope_paths:
    - "src/**"
    - "tests/**"
  
  # Constraints
  constraints:
    - "no destructive operations"
    - "structured output only"
  
  # Expected Return
  required_outputs:
    - "type-specific output (findings | craft_result | verdict)"
  return_schema:
    status: "success | partial | failure"
    confidence: "0-100"
    evidence: "{}"
```

### Return Schema Per Agent Type

| Agent Type | Return Schema Name | Key Fields |
|-----------|-------------------|------------|
| mf-researcher | `research_findings` | objective, findings[], gaps[], recommendations[] |
| mf-crafter | `craft_result` | action, file_path, line_count, contract_compliance{} |
| mf-verifier | `verification_verdict` | type, target, checks[], summary{}, overall, blockers[] |
| mf-auditor | `gate_verdict` | gate, status, evidence{passed,failed,skipped}, blockers[], next_action |
| mf-specifier | structured spec | requirement_ids[], acceptance_criteria[], ambiguity_map[] |
| mf-architect | architecture output | dependency_graph, asset_contracts{}, design_decisions[] |

---

## 5. Anti-Loop Safeguards

<!-- CLASSIFICATION: governance, anti-loop, safety -->

### Rules

| Rule | Description | Enforcement |
|------|-------------|-------------|
| **No return delegation** | Agent A delegates to B → B MUST NOT delegate back to A in same cycle | Tracked via `caller` field in packet |
| **Max lateral depth: 1** | Row 2 agent can lateral-delegate once, not chain (A→B→C blocked) | Row 2 agents track lateral count |
| **Auditor is terminal** | mf-auditor never delegates laterally, only downward to Row 3 | `task` permission restricted to mf-researcher + mf-verifier only |
| **Row 3 cannot delegate** | `task: deny` on all Row 3 agents | OpenCode permission enforcement |
| **Max delegation depth: 3** | Row 1 → Row 2 → Row 3 (max 3 levels) | No Row 3 task permission = hard ceiling |
| **Cycle ID tracking** | Every delegation carries a `cycle_id` — same ID means same cycle | Packet contract enforcement |

### Delegation Path Examples

```
✅ VALID: hivefiver → mf-specifier → mf-researcher (Row 1 → Row 2 → Row 3)
✅ VALID: hivefiver → mf-architect → mf-specifier → mf-crafter (Row 1 → Row 2 → Row 2 → Row 3, lateral once)
✅ VALID: hivefiver → mf-auditor → mf-verifier (Row 1 → Row 2 → Row 3)
✅ VALID: hivefiver → mf-researcher (Row 1 → Row 3 direct, for simple research)

❌ INVALID: mf-specifier → mf-architect → mf-specifier (loop back)
❌ INVALID: mf-researcher → mf-crafter (Row 3 → Row 3, no task permission)
❌ INVALID: mf-specifier → mf-architect → mf-auditor → mf-specifier (chain too deep + loop)
```

---

## 6. Parallelism Rules

<!-- CLASSIFICATION: orchestration, parallelism -->

### Parallel Dispatch Criteria

Parallel dispatch (multiple `task` tool calls in single message) is allowed ONLY when ALL conditions are true:

| Condition | Check | Example |
|-----------|-------|---------|
| Zero file overlap | Agents write to different directories | mf-crafter writing templates/ while another writes workflows/ |
| Zero ordering dependency | Neither depends on the other's output | Two independent research queries |
| Zero shared mutable state | No common SOT file being modified | Both NOT writing to MAPPING.md |
| Failure isolation | One agent's failure doesn't break the other | Independent verification checks |

### Common Parallel Patterns

| Pattern | Agents | Valid? | Why |
|---------|--------|--------|-----|
| Research + Scan | mf-researcher (web) + mf-researcher (codebase) | ✅ | Different tools, no file overlap |
| Write 3 templates | mf-crafter × 3 (different files) | ✅ | Different files, no dependency |
| Research THEN Plan | mf-researcher → mf-specifier | ❌ Sequential | Planner needs research output |
| Write THEN Validate | mf-crafter → mf-verifier | ❌ Sequential | Verifier needs written file |
| Spec + Arch review | mf-specifier + mf-architect | ⚠️ Depends | OK if different concerns, not if arch reviews spec |

---

## 7. Compound vs Atomic Cycles

<!-- CLASSIFICATION: architecture, cycle-types -->

### Compound Cycle (Front Delegation)

Managed by Row 2 agents. Contains multiple steps with checkpoints.

```
COMPOUND CYCLE (managed by Row 2 agent)
  1. RECEIVE → delegation packet from Row 1
  2. INVESTIGATE → may delegate to mf-researcher (Row 3)
  3. RESEARCH → may delegate to mf-researcher (Row 3)
  4. SYNTHESIZE → Row 2 agent processes gathered evidence
  5. CREATE/DESIGN → may delegate to mf-crafter (Row 3)
  6. VALIDATE → may delegate to mf-verifier (Row 3)
  7. GATE CHECK → may delegate to mf-auditor (Row 2 lateral)
  8. RETURN → structured output to Row 1
```

### Atomic Cycle (2nd Delegation)

Executed by Row 3 agents. Single-purpose, single-task, single-return.

```
ATOMIC CYCLE (executed by Row 3 agent)
  1. RECEIVE → delegation packet from Row 2 (or Row 1)
  2. EXECUTE → single focused task
  3. RETURN → structured result to caller
```

### When to Use Which

| Scenario | Cycle Type | Agent |
|----------|-----------|-------|
| Distill requirements from user input | Compound | mf-specifier |
| Design module architecture | Compound | mf-architect |
| Run quality gate checkpoint | Compound | mf-auditor |
| Research a specific OpenCode pattern | Atomic | mf-researcher |
| Create a workflow file | Atomic | mf-crafter |
| Validate contract compliance | Atomic | mf-verifier |

---

## 8. Activation Note

<!-- CLASSIFICATION: operations, activation -->

### Current hivefiver.md Task Permissions

The existing `hivefiver.md` has `"*": ask` for task permissions. This means:
- All mf-* agents CAN be invoked by hivefiver
- Each invocation will prompt for user approval (ask mode)
- To enable autonomous orchestration, hivefiver.md will need updating to `allow` mf-* agents

### Recommended Future Update (DO NOT APPLY NOW)

```yaml
# Add to hivefiver.md task permissions when ready:
permission:
  task:
    "*": deny
    "mf-specifier": allow
    "mf-architect": allow
    "mf-auditor": allow
    "mf-researcher": allow
    "mf-crafter": allow
    "mf-verifier": allow
    # Keep existing:
    "hivefiver": allow
    "hivexplorer": allow
    "hiveplanner": allow
    "hiverd": allow
```

This update is deferred until user approves the team structure.

---

## Change Log

| Date | Change | By |
|------|--------|-----|
| 2026-03-01 | Initial creation — 3-row delegation topology with 6 new agents | hivefiver |
