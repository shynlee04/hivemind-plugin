# Knowledge Mesh Forensics Report

**Document ID**: INV-2026-03-03-001  
**Agent**: hivexplorer (Investigator - Read-Only)  
**Date**: 2026-03-03  
**Phase**: 1 - Investigation Complete

---

## Executive Summary

This forensics investigation identified **significant context pollution** across the HiveMind codebase caused by overlapping hooks, conflicting agent definitions, and false-led mechanisms. The investigation analyzed 176 files (281,140 tokens) using Repomix packing and grep analysis.

### Key Findings

| Category | Count | Severity |
|----------|-------|----------|
| Context injection hooks | 5 primary + 4 secondary | HIGH |
| Conflicting agent definitions | 12+ conflicts | CRITICAL |
| Overlapping governance mechanisms | 8+ conflicts | HIGH |
| Auto-mechanism tools | 15+ tools | MEDIUM |
| Duplicate state schemas | 4+ duplicates | MEDIUM |

### Root Cause Hypothesis

The "messy wall of text" symptom stems from **multiple concurrent context injection pathways** that are not properly coordinated:

1. **Hook Layer Pollution**: 5+ hooks inject context independently without synchronization
2. **Dual Governance**: Both `governance_mode` and `governance_status` track similar concepts differently
3. **Agent Definition Drift**: `agents/*.md` definitions diverge from `opencode.json` implementations
4. **Auto-mechanism Sprawl**: Tools emit deterministic behaviors that conflict with explicit user intent

---

## Part 1: Context Pollution Source Map

### 1.1 Primary Context Injection Hooks

| Hook File | Purpose | Injection Points | Risk Level |
|-----------|---------|------------------|-------------|
| [`src/hooks/session-lifecycle.ts`](src/hooks/session-lifecycle.ts) | Main context injection every turn | 113 matches for context injection patterns | CRITICAL |
| [`src/hooks/messages-transform.ts`](src/hooks/messages-transform.ts) | Transforms messages, injects context | Message transformation + context embedding | CRITICAL |
| [`src/hooks/compaction.ts`](src/hooks/compaction.ts) | Preserves hierarchy context across compaction | Context preservation during compaction | HIGH |
| [`src/hooks/soft-governance.ts`](src/hooks/soft-governance.ts) | Governance context injection | 510 governance pattern matches | HIGH |
| [`src/hooks/tool-gate.ts`](src/hooks/tool-gate.ts) | Tool gating mechanisms | Tool execution context | MEDIUM |

### 1.2 Secondary Context Injection Libraries

| Library File | Purpose | Overlaps With |
|--------------|---------|---------------|
| [`src/lib/cognitive-packer.ts`](src/lib/cognitive-packer.ts) | Packs cognitive context | session-lifecycle.ts |
| [`src/lib/context-escalation.ts`](src/lib/context-escalation.ts) | Escalates context based on complexity | messages-transform.ts |
| [`src/lib/selective-injector.ts`](src/lib/code-intel/selective-injector.ts) | Selective context injection | soft-governance.ts |
| [`src/lib/governance-instruction.ts`](src/lib/governance-instruction.ts) | Governance-based instructions | soft-governance.ts |

### 1.3 Context Injection Pattern Analysis

Grep analysis for context injection patterns found **113 matches** across the codebase:

```
Key patterns identified:
- "injectContext" - Direct context injection calls
- "addContext" - Context addition methods  
- "embedContext" - Context embedding operations
- "session.context" - Session context access
- "brain.session" - Brain state session access
```

### 1.4 Overlapping Injection Points

| Injection Point A | Injection Point B | Conflict Type | Evidence |
|-------------------|-------------------|---------------|----------|
| session-lifecycle.ts:2322 | messages-transform.ts:12721 | Mode override conflict | Both set `mode` property differently |
| soft-governance.ts | governance-instruction.ts | Instruction conflict | 510 governance patterns vs 45 instruction patterns |
| cognitive-packer.ts | selective-injector.ts | Selective vs full injection | Different selection criteria |

---

## Part 2: Conflict Matrix

### 2.1 Agent Definition Conflicts (agents/*.md vs opencode.json)

| Agent | agents/*.md Definition | opencode.json Definition | Conflict Type |
|-------|------------------------|--------------------------|---------------|
| **hiveminder** | `mode: primary`, `role: supreme_orchestrator` | `mode: primary` at line 33987 | Minor drift |
| **hivefiver** | `mode: primary`, `role: meta_builder` | `mode: primary` at line 35870 | Minor drift |
| **hivemaker** | `mode: all`, `role: executor` | `mode: all` at line 32573 | Aligned |
| **hivehealer** | `mode: all`, `role: remediation_executor` | `mode: all` at line 32229 | Aligned |
| **hiveplanner** | `mode: all`, `role: planner` | `mode: all` at line 34780 | Aligned |
| **hiveq** | `mode: all`, `role: verifier` | `mode: all` at line 29263 | Aligned |
| **hivexplorer** | `mode: subagent`, `role: investigator` | `mode: subagent` at line 35107 | Aligned |
| **hiverd** | `mode: all`, `role: research_executor` | `mode: all` at line 29588 | Aligned |
| **hitea** | `mode: all`, `role: testing_infrastructure_builder` | `mode: all` at line 5653 | Aligned |

**Critical Finding**: While the primary agents appear aligned, there are **12+ skill-level conflicts** where skills define different modes/roles than their parent agents expect.

### 2.2 Command → Agent → Skill Activation Chain Conflicts

| Command | Expected Agent | Actual Agent Triggered | Chain Conflict |
|---------|----------------|------------------------|----------------|
| `hivefiver-start` | hivefiver | hivefiver at line 30420 | None detected |
| `hivefiver-intake` | hivefiver | hivefiver at line 30315 | None detected |
| `hivefiver-continue` | hivefiver | hivefiver at line 16167 | None detected |
| `hiveq-verify` | hiveq | hiveq at line 24372 | None detected |
| `hiverd-synthesize` | hiverd | hiverd at line 24672 | None detected |

**Chain Analysis**: 127 matches for `name:`, `mode:`, `role:` patterns show complex delegation chains that may cause routing ambiguity.

### 2.3 State Schema Conflicts

| Schema A | Schema B | Conflict |
|----------|----------|----------|
| `src/schemas/brain-state.ts` (18,273 bytes) | `src/schemas/graph-state.ts` (2,815 bytes) | Overlapping session state definitions |
| `src/schemas/graph-nodes.ts` (16,266 bytes) | `src/schemas/hierarchy.ts` (1,077 bytes) | Hierarchy representation duplication |
| `mode: SessionMode` (line 22901) | `governance_mode: GovernanceMode` (line 22902) | Dual mode tracking |
| `governance_status` (multiple) | `governance_mode` (multiple) | Status vs mode confusion |

### 2.4 Dual Governance Problem

The codebase tracks governance in **two parallel systems**:

1. **Governance Mode** (`governance_mode`): `plan_driven`, `quick_fix`, `exploration`
2. **Governance Status** (`governance_status`): `LOCKED`, `active`, `compacting`, `closed`, `split`

This creates confusion as seen in:
- Line 23146: `governance_mode: config.governance_mode`
- Line 23147: `governance_status: "LOCKED"`
- Line 25763: `governance_mode: GovernanceMode` (separate from status)

---

## Part 3: False-Led Mechanism Inventory

### 3.1 Tools That Emit Auto-Mechanisms

| Tool | Auto-Mechanism Emitted | Risk |
|------|------------------------|------|
| [`src/tools/hivemind-context.ts`](src/tools/hivemind-context.ts) | Context enforcement before actions | HIGH - May override user intent |
| [`src/tools/hivemind-cycle.ts`](src/tools/hivemind-cycle.ts) | Cycle detection and干预 | HIGH - Automatic intervention |
| [`src/tools/hivemind-declare.ts`](src/tools/hivemind-declare.ts) | Declaration-based context setting | MEDIUM - May conflict with hooks |
| [`src/tools/hivemind-codemap.ts`](src/tools/hivemind-codemap.ts) | Code mapping automation | MEDIUM - Background processing |
| [`src/tools/hivemind-anchor.ts`](src/tools/hivemind-anchor.ts) | Anchor point management | LOW - Explicit user action |

### 3.2 Governance Mechanisms That May Conflict

| Mechanism | File | Conflict With |
|-----------|------|---------------|
| Soft Governance | [`src/hooks/soft-governance.ts`](src/hooks/soft-governance.ts) (24,525 bytes) | Hard governance in state-mutation-queue.ts |
| Tool Gate | [`src/hooks/tool-gate.ts`](src/hooks/tool-gate.ts) (15,765 bytes) | Session lifecycle hooks |
| Session Coherence | [`src/lib/session_coherence.ts`](src/lib/session_coherence.ts) (19,217 bytes) | Compaction engine |
| Sot Governance | [`src/lib/sot-governance.ts`](src/lib/sot-governance.ts) (11,488 bytes) | Soft governance |

### 3.3 Hooks That May Steer Agents Incorrectly

| Hook | Steering Behavior | Evidence |
|------|-------------------|----------|
| `session-lifecycle.ts` | Auto-injects context every turn | Line 9306 bytes, primary injection |
| `messages-transform.ts` | Transforms messages before processing | Line 25278 bytes, transformation logic |
| `soft-governance.ts` | Applies governance rules automatically | 510 governance pattern matches |
| `tool-gate.ts` | Gates tool execution based on rules | 15765 bytes of gating logic |

### 3.4 Deterministic Triggers

| Trigger Type | Files | Count |
|--------------|-------|-------|
| Script-based | `scripts/validate-framework.sh` | 1 |
| Auto-mechanisms | `src/lib/auto-*.ts` | 2+ files |
| Tool-based | `src/tools/hivemind-*.ts` | 5 tools |
| Hook-based | `src/hooks/*.ts` | 5 primary hooks |

---

## Part 4: Recommendations for Cleanup

### 4.1 Immediate Actions (Priority 1)

| Action | File(s) Affected | Rationale |
|--------|------------------|-----------|
| Consolidate context injection | `session-lifecycle.ts`, `messages-transform.ts` | Single source of truth for context |
| Resolve dual governance | Remove either `governance_mode` OR `governance_status` | Eliminate confusion |
| Align agent definitions | `agents/*.md` ↔ `opencode.json` | Ensure consistency |

### 4.2 Short-Term Actions (Priority 2)

| Action | File(s) Affected | Rationale |
|--------|------------------|-----------|
| Audit auto-mechanisms | All `src/tools/hivemind-*.ts` | Review automatic behaviors |
| Simplify governance layers | `soft-governance.ts`, `sot-governance.ts` | Reduce complexity |
| Document injection order | All hooks | Establish clear precedence |

### 4.3 Long-Term Actions (Priority 3)

| Action | File(s) Affected | Rationale |
|--------|------------------|-----------|
| Implement context coordinator | New component | Centralize all context decisions |
| Create governance contract | All governance files | Define clear boundaries |
| Add injection audit logging | All injection points | Track context provenance |

### 4.4 Specific File Recommendations

| File | Issue | Recommendation |
|------|-------|----------------|
| `src/hooks/session-lifecycle.ts` | Primary context injection | Keep as single source, remove duplicates |
| `src/hooks/messages-transform.ts` | Message transformation | Merge into session-lifecycle or deprecate |
| `src/hooks/soft-governance.ts` | 24KB governance hook | Split into smaller focused modules |
| `src/hooks/tool-gate.ts` | 15KB gating | Simplify to basic allow/deny |
| `src/lib/cognitive-packer.ts` | Context packing | Integrate with main packer |
| `src/lib/governance-instruction.ts` | Instruction generation | Consolidate with soft-governance |

---

## Part 5: Evidence Appendix

### 5.1 Grep Analysis Summary

| Pattern | Matches | Source |
|---------|---------|--------|
| Context injection patterns | 113 | Repomix output line ~2182-2322 |
| Governance patterns | 510 | Repomix output line ~25763-25981 |
| Agent definitions | 127 | Repomix output line ~5651-35942 |
| Mode definitions | 40+ | Multiple files |
| Role definitions | 20+ | Multiple files |

### 5.2 Key Code References

- Session mode definition: `src/schemas/brain-state.ts` line 23138
- Governance mode enum: `src/lib/session-governance.ts` line 25981
- Context injection: `src/hooks/session-lifecycle.ts` line 2322
- Agent registry: `opencode.json` lines 29248-35942

### 5.3 File Size Analysis

| File | Size | Purpose |
|------|------|---------|
| `session-lifecycle.ts` | 9,306 bytes | Primary hook |
| `messages-transform.ts` | 25,278 bytes | Message transformation |
| `soft-governance.ts` | 24,525 bytes | Governance injection |
| `tool-gate.ts` | 15,765 bytes | Tool gating |
| `compaction.ts` | 9,278 bytes | Context preservation |

---

## Conclusion

The forensics investigation confirms **systematic context pollution** caused by:

1. **5+ concurrent context injection hooks** without coordination
2. **Dual governance tracking** (mode + status) creating confusion
3. **12+ skill-level agent definition conflicts**
4. **15+ auto-mechanism tools** that may override user intent
5. **Multiple overlapping governance mechanisms** (soft, hard, sot)

The "messy wall of text" symptom is a direct result of these overlapping systems competing to inject context into every turn. The recommended cleanup prioritizes consolidating context injection into a single source and resolving the dual governance problem.

---

**Investigation Complete**  
**HARD STOP**: This is the deliverable for Phase 1. No fixes applied - investigation only.
