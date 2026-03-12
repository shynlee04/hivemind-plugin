# Monitoring, Gatekeeping & Quality Gates Synthesis Report

> **Synthesis Date:** Session Analysis
> **Scope:** Tools, Libs, Hooks, Schema, Skills — HiveMind Plugin v2

---

## Executive Summary

The HiveMind monitoring/gatekeeping system implements a **layered defense architecture** with:
- **5 quality gates** (G0-G4) for phase completion
- **4 governance signal types** (drift, compaction, out_of_order, evidence_pressure)
- **10+ detection signals** compiled into agent prompts
- **3-tier escalation** (INFO → WARN → CRITICAL → DEGRADED)
- **Advisory-only enforcement** (HC1 compliance — never blocks)

---

## 1. Monitoring Metrics Catalog

### 1.1 Session-Level Metrics (brain.json.metrics)

| Metric | Type | Purpose | Threshold |
|--------|------|---------|-----------|
| `turn_count` | counter | Total tool calls in session | Configurable (default: 400 max) |
| `user_turn_count` | counter | User message turns | Drift calculation base |
| `drift_score` | score (0-100) | Context alignment health | < 40 = warning, < 70 = good |
| `files_touched` | array | Files modified this session | Commit suggestion trigger |
| `files_read_this_session` | array | Files read for blind-write detection | Cross-reference with writes |
| `violation_count` | counter | Governance violations | Advisory escalation |
| `consecutive_failures` | counter | Tool failure streak | Alert at 3 |
| `consecutive_same_section` | counter | Section repetition (circling) | Alert at 4 |
| `write_without_read_count` | counter | Blind write operations | Risk indicator |
| `total_tool_calls` | counter | Health denominator | Success rate calc |
| `successful_tool_calls` | counter | Health numerator | Success rate calc |
| `auto_health_score` | percentage | Tool success rate | Degradation indicator |
| `context_updates` | counter | map_context calls | Drift reset trigger |
| `compaction_count` | counter | Session compactions | Long session proxy |
| `governance_counters` | struct | Signal type accumulators | Escalation basis |

### 1.2 Detection State (DetectionState)

```typescript
interface DetectionState {
  consecutive_failures: number;      // Reset on success
  consecutive_same_section: number;  // Reset on section change
  last_section_content: string;      // For similarity detection
  tool_type_counts: {
    read: number;
    write: number;
    query: number;
    governance: number;
  };
  keyword_flags: string[];           // Stuck signals detected
}
```

### 1.3 Governance Counters

```typescript
interface GovernanceCounters {
  drift: number;           // Context alignment failures
  compaction: number;      // Session length pressure
  out_of_order: number;    // Workflow sequence violations
  evidence_pressure: number; // Unverified claims
}
```

---

## 2. Gate Taxonomy

### 2.1 Quality Gates (G0-G4)

| Gate | Name | When Checked | Criteria |
|------|------|--------------|----------|
| **G0** | Entry Integrity | Session start, declare_intent | Scope valid, context present, contract identified |
| **G1** | Specification Integrity | Before implementation | Requirements unambiguous, acceptance declared, edges identified |
| **G2** | Orchestration Integrity | Before delegation | Dependencies explicit, parallelization satisfied, packets complete |
| **G3** | Evidence Integrity | Before completion claims | Schema matched, claims verified, no hallucination, confidence accurate |
| **G4** | Export Integrity | Before session close | Handoff complete, next step deterministic, risk declared |

### 2.2 Session State Gates (Gatekeeper)

| Check Code | Severity | Trigger | Suggestion |
|------------|----------|---------|------------|
| `HAS_ACTION_FOCUS` | critical | No action-level hierarchy focus | `map_context({ level: "action" })` |
| `PENDING_FAILURE_ACK` | critical | Unacknowledged subagent failure | `export_cycle` or `map_context(blocked)` |
| `MANDATORY_TOOLS_PENDING` | warning | Required tools not run | Run pending governance tools |
| `FILES_UNCOMMITTED` | warning | Files touched, no commit | Force atomic git commit |
| `DRIFT_THRESHOLD` | advisory | Drift score < threshold | `map_context` to checkpoint |
| `SESSION_TOO_LONG` | warning | Turns > max (default 400) | `compact_session` to archive |

### 2.3 Verification Gates (5 Types from PLAN.md §9)

| Gate | Question | Evidence Strategy |
|------|----------|-------------------|
| **Runtime Authority** | Is selected owner the ONLY active authority? | grep for registrations, verify no parallel control plane |
| **Donor Gate** | Does logic work WITHOUT donor runtime? | grep for imports, trace code paths, standalone tests |
| **Drift Gate** | Do src and dist agree on behavior? | Build succeeds, semantic match, no stale artifacts |
| **State Gate** | Are .hivemind stores correctly classified? | Active stores respond, compat has migration, stale unreferenced |
| **Regression Gate** | Do boundary tests still hold? | Full test suite passes, no skipped tests |

---

## 3. Sub-Session Validation Flow

### 3.1 Pre-Delegation Readiness Guard

```
BEFORE DELEGATION:
├── [ ] Intent classified — User intent 100% clear
├── [ ] Lineage confirmed — Correct orchestrator identified
├── [ ] Complexity assessed — Independent/dependent/unknown
├── [ ] Session continuity checked — Ongoing/fresh/post-compaction
├── [ ] Packet complete — All 5 required fields specified
└── [ ] Intelligence export planned — How results captured
```

### 3.2 Delegation Packet Schema

| Field | Required | Description |
|-------|----------|-------------|
| Objective | ✅ | What to accomplish (not HOW) |
| Scope | ✅ | Explicit boundaries (IS/IS NOT) |
| Constraints | ✅ | Time/token/file/architecture limits |
| Acceptance Criteria | ✅ | How to verify success |
| Output Format | ✅ | Expected result structure |
| Context Payload | ⚠️ | Relevant decisions/state |
| Anti-Constraints | ⚠️ | What NOT to do |

### 3.3 Post-Return Validation Protocol

```
SUBAGENT RETURNS
    │
    ├── Contains failure signals?
    │   (failed, error, couldn't, unable, blocked, partial, skipped)
    │   YES → Record as FAILURE or PARTIAL
    │   NO  → Continue
    │
    ├── Describes what was ACTUALLY done?
    │   VAGUE → Request specifics
    │   SPECIFIC → Verify independently
    │
    └── Can you verify independently?
        RUN verification → Record accurate outcome
        PASS → SUCCESS
        FAIL → FAILURE
```

### 3.4 Evidence Chain Requirements

**Nothing is "done" without ALL of these:**
1. Verification command ran (test/build/lint — at least one)
2. Output inspected (not just exit code — read the output)
3. Work hierarchy updated with accurate status
4. If subagent involved: cycle intelligence exported with accurate outcome

---

## 4. Quality Enforcement Mechanisms

### 4.1 Detection Engine (soft-governance.ts)

**Fires after EVERY tool call (tool.execute.after)**

Responsibilities:
- Increment turn count + track tool health
- Classify tool type (read/write/query/governance)
- Track consecutive failures + section repetition
- Scan tool output for stuck/confused keywords
- Detect governance violations (write in LOCKED)
- Write ALL counters to brain.json.metrics

### 4.2 Tool Gate Hook (tool-gate.ts)

**Fires before EVERY tool call (tool.execute.before)**

Checks:
1. Exempt tool? → Allow immediately
2. Config re-read from disk (Rule 6)
3. Session role suppression check
4. Tool policy validation
5. Framework conflict gate (GOV-06/GOV-07)
6. Session lock status
7. First-turn confirmation gate
8. TaskNode advisory for writes

**HC1 Compliance:** Always returns `allowed: true` — advisory only

### 4.3 Signal Compilation (detection.ts)

**10 Detection Signal Types:**

| Signal | Severity | Trigger | Suggestion |
|--------|----------|---------|------------|
| turn_count | 3 | turns ≥ threshold | map_context |
| consecutive_failures | 1 | failures ≥ 3 | think_back |
| section_repetition | 2 | similar updates ≥ 4 | think_back |
| read_write_imbalance | 4 | reads ≥ 8, writes = 0 | map_context |
| keyword_flags | 2 | stuck keywords detected | think_back |
| tool_hierarchy_mismatch | 3 | writes without action | map_context |
| completed_pileup | 5 | completed branches ≥ 5 | hivemind-scan |
| timestamp_gap | 1 | gap ≥ 2 hours | scan_hierarchy |
| missing_tree | 0 | no hierarchy.json | hivemind-scan |
| session_file_long | 4 | lines ≥ 50 | compact_session |
| write_without_read | 2 | blind writes detected | read files first |

### 4.4 Escalation Tiers

```
turn_count - threshold:
├── 0-3 overshoot  → INFO
├── 4-7 overshoot  → WARN
├── 8+ overshoot   → CRITICAL
└── 15+ overshoot  → DEGRADED
```

### 4.5 Evidence Discipline Enforcement

**Red Flags Detected:**
- "The subagent said it works" → Verify independently
- "The user confirmed it" → Run verification commands
- "I tested it mentally" → Run actual commands
- "It's obvious this is correct" → One test takes 3 seconds
- "I'll verify at the end" → Compaction erases context
- "The error is unrelated" → Prove with diff + test output

---

## 5. Recommendations for Refactor

### 5.1 Consolidation Opportunities

| Current State | Recommendation |
|---------------|----------------|
| Gate definitions in 3 places (hiveops-gate.ts, gate-types.md, gatekeeper.ts) | Consolidate to single source of truth |
| Detection signals compiled in detection.ts AND soft-governance.ts | Single compilation point in detection.ts |
| Validation logic in skills + tools | Extract to shared lib/validators.ts |

### 5.2 Missing Capabilities

1. **Sub-session progress monitoring**
   - Current: Only failure signals captured
   - Need: Progress percentage, milestone tracking

2. **Gate dependency graph**
   - Current: Gates checked independently
   - Need: G3 depends on G1, G4 depends on G3

3. **Evidence verification automation**
   - Current: Manual verification required
   - Need: Auto-run test suite on completion claims

4. **Cross-session gate persistence**
   - Current: Gates reset per session
   - Need: Gate state survives compaction

### 5.3 Architectural Improvements

```
PROPOSED ARCHITECTURE:

┌─────────────────────────────────────────────────────────────┐
│                    Gate Orchestrator                         │
│  (Single entry point for all gate checks)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Quality Gates│  │ State Gates  │  │Verify Gates  │      │
│  │   (G0-G4)    │  │(Gatekeeper)  │  │(PLAN.md §9)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
├─────────────────────────────────────────────────────────────┤
│                    Detection Engine                          │
│  (Unified signal compilation + escalation)                  │
├─────────────────────────────────────────────────────────────┤
│                    Evidence Store                            │
│  (Immutable evidence chain per gate)                        │
└─────────────────────────────────────────────────────────────┘
```

### 5.4 Skill-Tool Integration

| Gap | Solution |
|-----|----------|
| Skills describe gates, tools implement differently | Auto-generate gate definitions from skill references |
| Verification methodology is prose | Convert to executable verification functions |
| Evidence discipline is advisory | Add evidence_required field to gate schema |

---

## 6. Appendix: File Reference Map

### Tools
- `src/tools/hiveops-gate.ts` — G0-G4 quality gates
- `src/tools/hivemind-inspect.ts` — drift, traverse, introspect
- `src/tools/hiveops-todo.ts` — task blocking logic

### Libs
- `src/lib/gatekeeper.ts` — validateSessionState
- `src/lib/inspect-engine.ts` — scan, deep, drift, traverse
- `src/lib/detection.ts` — signal compilation
- `src/lib/long-session.ts` — session length detection

### Hooks
- `src/hooks/soft-governance.ts` — post-tool detection
- `src/hooks/tool-gate.ts` — pre-tool policy enforcement

### Skills
- `skills/verification-methodology/` — goal-backward analysis
- `skills/evidence-discipline/` — proof-before-claim
- `skills/delegation-framework/` — readiness guard + packet schema

### Schema
- `src/schemas/brain-state.ts` — metrics, counters
- `src/schemas/manifest.ts` — TaskNodeSchema

---

*End of Synthesis Report*
