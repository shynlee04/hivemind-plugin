# CRITICAL FINDING: L1→L2 Delegation Chain Blocked
**Date:** 2026-05-05
**Team:** Team B
**Severity:** HIGH
**Test:** 1.5 L0→L1→L2 delegation chain

---

## Finding

The `hm-l1-coordinator` agent does **NOT** have the `delegate-task` tool registered in its tool permissions. It can only use `delegation-status` (read-only polling). This means:

- **L0→L1 delegation:** ✅ Works (L0 has delegate-task)
- **L1→L2 delegation:** ❌ BLOCKED (L1 lacks delegate-task)
- **Full chain depth:** Currently limited to depth 1

## Evidence

The L1 coordinator's full result message states:
> "The `delegate-task` tool is not exposed as a callable tool in my current environment. I have `delegation-status` (read) but not `delegate-task` (write)."

The delegation completed with status=completed but the L2 dispatch was BLOCKED. No nesting depth > 1 was achieved.

## Impact

- Hierarchical delegation (L0→L1→L2) is architecturally intended but **non-functional**
- The `hm-l1-coordinator` agent definition at `.opencode/agents/hm-l1-coordinator.md` likely does not include `delegate-task` in its tool permissions
- Per the tool-capability-matrix skill: "delegate-task: allow or deny — Varies — hm coordinators deny, hf coordinators may allow"

## Three Solutions (from L1 coordinator's analysis)

1. **Best:** Register `delegate-task` in hm-l1-coordinator's tool permissions
2. **Alternative:** L0 dispatches both levels directly (defeats purpose of hierarchical delegation)
3. **Alternative:** Use OpenCode's native `@mention` for child dispatch (less structured)

## Verdict

**TEST 1.5 = PARTIAL PASS** — L0→L1 works, L1→L2 blocked by tool permissions.
This is a **configuration gap**, not a code bug. The tool works; the permission is missing.
