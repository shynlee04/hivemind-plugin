# Dashboard-v2 Phase 8 W1 Execution Packet

> Date: 2026-02-26
> Mode: plan_driven (strict)
> Constraint mode: no-subdelegation, no-new-research
> Source artifacts: `docs/plans/dashboard-v2-comprehensive-inventory-2026-02-26.md`, `docs/plans/dashboard-v2-phase8-orchestration-loop-2026-02-26.md`

---

## 1) Packet Identity

- Wave ID: `W1`
- Wave title: Real-Time Spine
- Objective: lock the SSE/live-update contract, reconnect strategy, and live status surfaces for dashboard-v2 under Phase 8 gate discipline.
- Authority: main session only (`5d529522-ee3c-4dc1-90cc-9505d24c9f1f`).

Anchor constraints:
- `dashboard_v2.delegation_constraint` is immutable.
- Absolute ban on sub-of-sub delegation remains active.
- For this packet run, no further delegation is used; orchestration and control remain in main flow.
- No new research is allowed; only existing `.hivemind/` context and listed artifacts are permitted.

---

## 2) Scope Contract

In scope:
- SSE integration contract for dashboard-v2
- Event handling contract and state update paths
- Reconnect strategy (bounded retries + backoff)
- Live status surfaces (`LIVE`/degraded/offline semantics)
- Evidence and gate records for W1 closeout

Out of scope:
- New feature domains from W2-W5
- Cross-wave refactors unrelated to real-time spine
- Any new inventory/research pass
- Any sub-of-sub delegation pattern

Dependencies (locked):
- Inventory baseline at `docs/plans/dashboard-v2-comprehensive-inventory-2026-02-26.md`
- Phase 8 loop contract at `docs/plans/dashboard-v2-phase8-orchestration-loop-2026-02-26.md`
- Existing dashboard-v2 API/event model and App state pipeline

---

## 3) Entry and Exit Criteria

Entry criteria (must all pass before execution):
- API event schema for W1 is confirmed from existing inventory artifacts.
- W1 scope lock approved with no mixed-scope objectives.
- Pre/In/Post gate matrix is attached and testable.
- Constraint check confirms no further delegation and no new research.

Exit criteria (wave close conditions):
- Live update contract documented and internally consistent.
- Reconnect and fallback behavior documented with thresholds and failover semantics.
- Gate evidence captured for pre/in/post stages.
- Deferred items (if any) mapped to Phase 9 obligations with verification requirement.

---

## 4) Gate Matrix (W1)

### 4.1 Pre-Gate (Before execution)

Checks:
- Scope lock: W1 only
- Dependency lock: artifact-only context
- Constraint lock: no-subdelegation and no-new-research
- Validation lock: commands and evidence paths declared

Required evidence:
- Active hierarchy cursor shows W1 action focus
- Anchor list includes `dashboard_v2.delegation_constraint`
- This packet artifact present under `docs/plans/`

### 4.2 In-Gate (During execution)

Checks:
- Every state transition checkpointed with `map_context`/session update
- No hidden scope expansion
- No external research commands or new investigation loops
- No delegation expansion

Required evidence:
- Checkpoint trail in hierarchy updates
- Command outputs attached to execution notes
- Any partial/fail branch includes retune or controlled defer record

### 4.3 Post-Gate (After execution)

Checks:
- Exit criteria adjudicated pass/fail
- Risk register updated with impact x probability
- Phase 9 obligations emitted for defer paths
- Mandatory quality gates executed and recorded

Required evidence:
- `npm test` output
- `npx tsc --noEmit` output
- (When dashboard-v2 implementation is touched) `bunx tsc --noEmit` output in dashboard-v2

---

## 5) Execution Sequence (Main Flow Controlled)

S1. Context lock
- Confirm hierarchy/action checkpoint for W1.

S2. Contract lock
- Confirm W1 event contract, reconnect behavior, live surface semantics from existing artifacts only.

S3. Validation lock
- Run mandatory quality commands and collect output.

S4. Gate review
- Adjudicate W1 pass/fail/defer with evidence-first rule.

S5. Retune trigger (conditional)
- If fail/partial, issue `W1.delta` with corrected scope and carry-forward blockers.

S6. Phase 9 export
- Emit reliability/refactor/verification obligations for any deferred item.

---

## 6) Validation Commands (Exact)

Run in this order for evidence capture:

```bash
cd /Users/apple/hivemind-plugin && npm test
cd /Users/apple/hivemind-plugin && npx tsc --noEmit
cd /Users/apple/hivemind-plugin/src/dashboard-v2 && bunx tsc --noEmit
```

Evidence policy:
- No "done" claim without command output.
- Any failure forces `W1.delta` retune or controlled defer.

---

## 7) Risk Register (W1)

| Risk | Impact | Probability | Mitigation | Fallback |
|------|--------|-------------|------------|----------|
| SSE disconnect instability | High | Medium | bounded retries + backoff policy | degrade to polling/offline state |
| Event schema drift | High | Medium | strict contract map in packet | block closeout, issue `W1.delta` |
| False-positive completion | High | Low | mandatory command evidence | fail post-gate, reopen wave |
| Hidden scope expansion | Medium | Medium | in-gate scope audits | split to W2+ or defer to P9 |

---

## 8) Phase 9 Linkage Obligations (If Defer/Partial)

P9.1 Reliability obligations:
- SSE fallback behavior hardening
- retry/backoff tuning and outage semantics

P9.2 Refactor obligations:
- state ownership boundaries for live updates
- integration seams between panels and event streams

P9.3 Verification obligations:
- E2E live-update reliability checks
- rollback and recovery validation path

---

## 9) Execution Log Template

| Step | Gate | Command/Check | Result | Evidence Ref |
|------|------|---------------|--------|--------------|
| S1 | Pre | Hierarchy + anchor lock | TBD | session snapshot |
| S2 | In | Contract consistency review | TBD | packet notes |
| S3 | In | `npm test` | TBD | terminal output |
| S3 | In | `npx tsc --noEmit` | TBD | terminal output |
| S3 | In | `bunx tsc --noEmit` | TBD | terminal output |
| S4 | Post | Exit criteria adjudication | TBD | gate decision |
| S6 | Post | Phase 9 obligation export | TBD | obligation registry |

---

## 10) Pass/Fail Rules

Pass:
- All entry criteria met
- Gate evidence complete
- Mandatory commands pass
- Exit criteria complete with no unresolved blockers

Partial:
- Core contract documented but at least one gate or command unresolved
- Must emit `W1.delta` with explicit blocker mapping

Fail:
- Constraint violation, missing evidence, or mandatory command failure
- Must halt closeout and retune before any forward wave progression
