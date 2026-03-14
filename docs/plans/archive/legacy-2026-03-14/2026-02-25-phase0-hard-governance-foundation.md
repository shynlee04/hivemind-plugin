# Phase 0: Hard Governance Foundation

**Date:** 2026-02-25
**Status:** PLANNING
**Prerequisites:** Audit Integration Document (`docs/audit/2026-02-25-audit-integration-document.md`)
**Framework Reference:** `HIVEMIND-FRAMEWORK.md`, `docs/planning-draft/forming-the-own-framework.md`

---

## 1. Executive Summary

### The Problem
The governance framework exists in documentation (`AGENT_RULES.md`, 34 skills, 30+ commands) but is **not enforced**. The audit found:
- CQRS violations (hooks writing state)
- CHIMERA-1 (split-brain mem storage)
- Split-brain task store
- No hard gates blocking invalid actions

### The Solution
Implement **Phase 0: Hard Governance Foundation** to wire the constitutional enforcement layer described in `forming-the-own-framework.md`.

### Scope
- Wire the **17 canonical hooks** with proper CQRS boundaries
- Implement **Entity Checklist Enforcement** with gate types
- Create **Hard Gate Engine** that blocks invalid actions
- Fix **CQRS violation** in `soft-governance.ts`

---

## 2. Framework Reference Summary

### 4-Layer Architecture (from `forming-the-own-framework.md`)

```
Layer 1: Plugin Hooks (reactive runtime)
    ↓ function calls + in-process events
Layer 2: Custom Tools (LLM-callable mutation surface)
    ↓ ctx.client SDK bridge
Layer 3: SDK Client (session/control/search)
    ↓ SSE + client API
Layer 4: Sidecar TUI (OpenTUI dashboard)
```

### Key Contracts

| Layer | Allowed Mutation | Constraint |
|-------|-----------------|------------|
| **Hooks (L1)** | Ephemeral request/response context only | **NO persistent state writes** |
| **Tools (L2)** | Persistent state mutations (write path) | Zod-validated, audit trail |
| **SDK (L3)** | Session/control actions via API | No direct file writes |
| **TUI (L4)** | UI-local state + user-triggered actions | Human-gate token required |

### 17 Canonical Hook Types

| Hook ID | Type | May Block | Mutation Scope |
|---------|------|-----------|----------------|
| H01 | `session.init` | No | runtime-only |
| H02 | `session.resume` | No | runtime-only |
| H03 | `session.compaction.pre` | Yes | runtime-only |
| H04 | `session.compaction.post` | No | runtime-only |
| H05 | `experimental.chat.system.transform` | Yes | transformed system prompt |
| H06 | `experimental.chat.messages.transform` | Yes | transformed message list |
| H07 | `chat.preflight` | Yes | runtime-only |
| H08 | `tool.call.pre` | Yes | runtime-only |
| H09 | `tool.call.post` | No | runtime-only |
| H10 | `tool.call.error` | No | runtime-only |
| H11 | `command.pre` | Yes | runtime-only |
| H12 | `command.post` | No | runtime-only |
| H13 | `agent.delegate.pre` | Yes | runtime-only |
| H14 | `agent.delegate.post` | No | runtime-only |
| H15 | `event.stream.receive` | No | runtime-only |
| H16 | `governance.audit.tick` | Soft only | runtime-only |
| H17 | `shutdown.flush` | No | runtime-only |

### Gate Types

| Gate Type | Trigger | Enforcement | Outcome |
|-----------|---------|-------------|---------|
| **auto-gate** | Missing derivable metadata | Hook + safe tool chain | Auto-remediate, continue |
| **soft-gate** | Drift/context concerns | Hook governance | Warning, continue |
| **hard-gate** | Contract violation | Hook/tool-gate | **Block execution** |
| **human-gate** | High-risk operation | Hook + user confirmation | Wait for approval |

---

## 3. Phase 0 Work Breakdown

### P0-01: CQRS Violation Fix (CRITICAL)

**Issue:** `src/hooks/soft-governance.ts` writes state via `queueStateMutation()`
**Reference:** Framework § Hook Classification - "Hooks are read-first and deterministic. Any durable mutation must occur in a tool call."
**Files:**
- `src/hooks/soft-governance.ts` (608 LOC)
- `src/lib/state-mutation-queue.ts` (new)

**Tasks:**
1. Create `src/lib/state-mutation-queue.ts` with pending mutations buffer
2. Hook pushes mutations to buffer (no direct writes)
3. Create `src/tools/hivemind-governance.ts` to flush buffer
4. Remove all `stateManager.save()` calls from hooks/

**Validation:**
```bash
grep -r "stateManager.save" src/hooks/ && echo "FAIL" || echo "PASS"
grep -r "queueStateMutation" src/hooks/ | wc -l  # Should use buffer pattern
```

---

### P0-02: Entity Checklist Engine (CRITICAL)

**Issue:** No enforcement of mandatory entities before action
**Reference:** Framework § Constitutional Governance Contract - Entity Checklist Enforcement Flow

**Files:**
- `src/lib/entity-checklist.ts` (new)
- `src/schemas/governance.ts` (extend)

**Tasks:**
1. Define entity types: `session`, `hierarchy`, `planning-sot`, `code-intel`
2. Implement `evaluateEntityChecklist(mode: string): EntityChecklistResult`
3. Map entity states: `present | stale | missing | inconsistent`
4. Map to gate types: `auto-gate | soft-gate | hard-gate | human-gate`

**Schema:**
```typescript
interface EntityChecklistResult {
  mode: "plan_driven" | "quick_fix" | "exploration";
  entities: {
    name: string;
    status: "present" | "stale" | "missing" | "inconsistent";
    gate: "auto" | "soft" | "hard" | "human";
    remediation?: string;
  }[];
  overallGate: "auto" | "soft" | "hard" | "human";
  blockReason?: string;
}
```

**Validation:**
```bash
npm test -- entity-checklist
npx tsc --noEmit
```

---

### P0-03: Hard Gate Engine (CRITICAL)

**Issue:** No mechanism to block invalid actions
**Reference:** Framework § Gate types adapted for HiveMind

**Files:**
- `src/hooks/hard-gate.ts` (new)
- `src/lib/gate-engine.ts` (new)

**Tasks:**
1. Implement `evaluateGate(intent: TurnIntent): GateDecision`
2. Wire into H07 (`chat.preflight`) and H08 (`tool.call.pre`)
3. Hard-gate blocks:
   - Missing trajectory (no `declare_intent`)
   - Broken hierarchy chain
   - CQRS violation attempts
   - Domain boundary violations
4. Soft-gate warnings:
   - High drift score
   - Stale anchors
   - Old session

**Schema:**
```typescript
interface GateDecision {
  type: "allow" | "soft-block" | "hard-block" | "human-required";
  reason: string;
  remediation?: string;
  evidence: {
    checklistResult: EntityChecklistResult;
    hierarchyStatus: HierarchyStatus;
    driftScore: number;
  };
}
```

**Validation:**
```bash
npm test -- gate-engine
npx tsc --noEmit
```

---

### P0-04: Constitutional Injection Pipeline (HIGH)

**Issue:** No deterministic constitutional digest injection
**Reference:** Framework § Governance injection pipeline

**Files:**
- `src/lib/constitutional-compiler.ts` (new)
- `src/hooks/messages-transform.ts` (extend)

**Tasks:**
1. Load constitutional schemas from `src/schemas/`
2. Compile to `GovernanceInstruction` bundle
3. Pack via cognitive-packer (digest + relevance filter)
4. Inject via H05 (`experimental.chat.system.transform`)
5. Include entity checklist verdict

**Pipeline:**
```
Constitutional Schemas
   → Instruction Compiler
      → Cognitive Packer (digest + relevance)
         → H05 system transform inject
            → LLM turn execution
               → H07/H08 gate evaluation
                  → H16 warning/audit telemetry
```

**Validation:**
```bash
# Every turn should include constitutional digest
node -e "console.log(require('./dist/lib/constitutional-compiler.js').compileConstitutionalDigest())"
```

---

### P0-05: Hook Determinism Audit (MEDIUM)

**Issue:** Need to verify all hooks follow CQRS
**Reference:** Framework § Ownership and mutability rules

**Files:**
- All files in `src/hooks/`

**Tasks:**
1. Audit each hook against framework contract
2. Identify any remaining CQRS violations
3. Document hook execution order compliance
4. Add conformance tests

**Audit Template:**
| Hook File | Primary Category | Canonical Hooks | CQRS Compliant? | Writes State? |
|-----------|-----------------|-----------------|-----------------|---------------|
| `session-lifecycle.ts` | Context Injection | H01, H02, H03, H04 | ? | ? |
| `messages-transform.ts` | Message Transformation | H05, H06 | ? | ? |
| `soft-governance.ts` | Governance Enforcement | H07, H16 | ? | ? |
| ... | ... | ... | ... | ... |

---

## 4. Implementation Sequence

### Session 1: CQRS Fix + Entity Checklist
```
P0-01: CQRS Violation Fix
   ├── Create state-mutation-queue.ts
   ├── Create hivemind-governance.ts tool
   └── Remove stateManager.save from hooks

P0-02: Entity Checklist Engine
   ├── Create entity-checklist.ts
   ├── Define entity types
   └── Implement evaluateEntityChecklist()

Quality Gate: npm test + npx tsc --noEmit
```

### Session 2: Hard Gate Engine + Constitutional Pipeline
```
P0-03: Hard Gate Engine
   ├── Create gate-engine.ts
   ├── Create hard-gate.ts hook
   └── Wire into H07/H08

P0-04: Constitutional Injection
   ├── Create constitutional-compiler.ts
   └── Wire into H05

Quality Gate: npm test + npx tsc --noEmit
```

### Session 3: Hook Audit + Validation
```
P0-05: Hook Determinism Audit
   ├── Audit all hooks
   ├── Add conformance tests
   └── Document execution order

Quality Gate: npm test + npx tsc --noEmit + guard:public
```

---

## 5. Quality Gates

### Per-Session Gates
```bash
npx tsc --noEmit
npm test
```

### Phase 0 Completion Gates
```bash
# CQRS verification
grep -r "stateManager.save" src/hooks/ && echo "FAIL: CQRS violation" || echo "PASS"

# Entity checklist available
node -e "require('./dist/lib/entity-checklist.js')" && echo "PASS"

# Gate engine blocks invalid actions
npm test -- gate-engine

# Constitutional injection works
node -e "require('./dist/lib/constitutional-compiler.js').compileConstitutionalDigest()" && echo "PASS"

# All hooks compliant
npm test -- hook-conformance
```

---

## 6. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing hook behavior | High | Critical | Incremental changes with full test coverage |
| State mutation queue race conditions | Medium | High | File locking via proper-lockfile |
| Hard gate blocking legitimate operations | Medium | High | Comprehensive gate decision logging |
| Constitutional payload too large | Low | Medium | Cognitive packer relevance filtering |

---

## 7. Success Criteria

### P0 Complete When:

1. ✅ **CQRS Enforced**: No hooks write persistent state directly
2. ✅ **Entity Checklist**: Every turn validates mandatory entities
3. ✅ **Hard Gates**: Invalid actions are blocked, not just warned
4. ✅ **Constitutional Injection**: Every turn includes governance digest
5. ✅ **Hook Determinism**: All hooks follow framework contract
6. ✅ **Tests Pass**: `npm test` green, `npx tsc --noEmit` clean
7. ✅ **Guard Public**: `npm run guard:public` passes

---

## 8. Post-P0: Phase B Integration

After Phase 0 completion, proceed to **Phase B: Session Intelligence** with:

- Hard gates preventing session compaction issues
- Entity checklist ensuring session state integrity
- Constitutional governance enforcing lifecycle contracts
- CQRS compliance preventing state corruption

---

## 9. References

- `HIVEMIND-FRAMEWORK.md` - Core philosophy and agent architecture
- `docs/planning-draft/forming-the-own-framework.md` - 4-Layer architecture, hook taxonomy
- `docs/audit/2026-02-25-source-architecture-audit.md` - Audit findings
- `docs/audit/2026-02-25-audit-integration-document.md` - v2.9 alignment
- `docs/plans/2026-02-24-v29-systematic-execution-plan.md` - Current execution plan
- `AGENT_RULES.md` - Constitution and architectural taxonomy

---

*Phase 0 Plan Created: 2026-02-25*
*Status: Ready for execution after user confirmation*
