[LANGUAGE: Write this file in en per Language Governance.]
[LANGUAGE: en per Language Governance.]
---
session: uat-phase-58.9-session-tools-audit
created: 2026-06-06
mode: parallel-pane-codebase-audit
pane_strategy: 5 lanes aggressive codebase-wide (per steer #3)
constraint: route to gsd-* only, NO hf-*, NO inline work
status: all 5 artifacts verified on disk; synthesis dispatch ready
---

# UAT Phase 58.9 — Session-Tools Audit Landscape

## Purpose

5-way parallel codebase audit of Hivemind session-tools and adjacent surfaces
(tools, coordination, task-management, hooks, lifecycle, plugin, schemas, config,
SDK, primitives, tests). Goal: produce `AUDIT-REPORT.md` consolidating 132
findings + 9 L0 cross-cutting findings into a single P0-prioritized remediation
plan, then update `AGENTS.md` to close the gaps that block the next milestone.

## State at a Glance

| Surface | Status | File | Bytes | Findings | S/P0 | S/P1 | S/P2 | S/P3 |
|---|---|---|---|---|---|---|---|---|
| Lane 1: tools / coordination / task-management | ✅ verified | `lane-1-tools.md` | 39,625 | **34** | 6 | 11 | 12 | 5 |
| Lane 2: hooks / lifecycle / plugin | ✅ verified | `lane-2-hooks-lifecycle.md` | 38,227 | **38** | 8 | 14 | 11 | 5 |
| Lane 3: primitives / .opencode / .hivefiver | ✅ verified | `lane-3-primitives.md` | 30,230 | **16** | 5 | 6 | 3 | 2 |
| Lane 4: schemas / config / SDK | ✅ verified | `lane-4-schemas.md` | 58,013 | **30** | 4 | 12 | 7 | 7 |
| Lane 5: tests / coverage / runtime | ✅ verified (PARTIAL verdict) | `lane-5-tests.md` | 22,500 | **14** | 5 | 3 | 5 | 0 |
| **Total** | | | **188,595** | **132** | **28** | **46** | **43** | **19** |

All 5 files verified on disk via `bash ls -la` and at least one head-read.

## Decision Matrix (applied after all 5 verified)

| State | Action |
|---|---|
| A. BOTH artifacts present | **→ Dispatch synthesis agent for `AUDIT-REPORT.md`** (P0/P1 prioritized) + embed 9 L0 cross-cutting findings + constitutional violation from `.hivemind/AGENTS.md` |
| B. ONE artifact missing | → Re-poll the missing delegation with `delegation-status`; if still missing after 2 polls, escalate to user |
| C. BOTH missing | → Re-dispatch with HARD DIRECTIVE sequence; treat as ghost-completion pattern repeat |

**Result: A.** Synthesis dispatch ready.

## L0 Cross-Cutting Findings (orchestrator-level, not lane-derived)

These findings emerge from observing the 5 parallel delegations themselves and
from cross-lane contradictions surfaced during verification. They are NOT
duplicated in any single lane; they belong to the audit envelope as a whole.

1. **Cross-session metadata write-race (structural)** — Symmetric evidence from
   5 parallel child sessions writing to shared `.hivemind/state/*.json`
   concurrently; observed sibling-status confusion (Lane 1 siblings see Lane 3
   as `active` and vice versa). Source: `delegation-status` polls.
2. **SDK `canStackOn` is state-dependent** — Returns `false` when session
   `status:dispatched`, `true` when `status:completed`. This makes the
   stacking behavior emergent and non-deterministic. Source:
   `delegation-status` (find-stackable) returns across the 5 lanes.
3. **Status schema fragmentation** — Same session shows different status enums
   (`dispatched`, `active`, `running`, `completed`) from different tool
   perspectives. No single source of truth.
4. **File-disk vs delegation-status asynchrony** — Lane 1 retry #2 produced
   `lane-1-tools.md` (39,625 bytes) on disk at `progressPct: 99%` while
   delegation status was still `dispatched`. Write tool executed before
   session-return signaled. Affects WaiterModel assumptions.
5. **Ghost-completion pattern is intermittent, not structural** — Round 1
   saw 2/5 ghost-complete (Lane 1 + Lane 3 with `gsd-codebase-mapper` and
   `gsd-pattern-mapper`); retry round 2 broke both with HARD DIRECTIVE
   sequence (write → bash ls → return). Final ghost rate: 0/5.
6. **Lane 5 coverage BLOCKED** — `npm run test:coverage` non-zero exit (21
   failing tests). No `coverage/coverage-summary.json` or `lcov.info` on
   disk. 13 of 21 failing files have NO companion regression/Prove-It
   test. Real production finding.
7. **Cross-lane envelope shape contradiction** — Lane 4 reported envelope
   as `{code, message, data?}`; Lane 1 confirms actual envelope is
   `{kind, message, data?, metadata?}` per `src/shared/tool-response.ts:6-11`.
   Lane 4 finding must be re-derived against `kind` semantics.
8. **Hook CQRS boundary violation is CONSTITUTIONAL** — Lane 1 P0 #1
   (`src/hooks/guards/tool-guard-hooks.ts:89-94, 109-112, 143-154, 167, 172,
   193-216, 240-241`) directly violates `.hivemind/AGENTS.md` rule:
   *"Hooks SHALL NOT directly write durable state into `.hivemind/`"*.
   Lane 2 F-23 was partial observation; Lane 1 confirms full mutation set.
9. **Agent-level differential** — `gsd-code-reviewer` and
   `gsd-nyquist-auditor` write artifacts correctly on first try;
   `gsd-codebase-mapper` and `gsd-pattern-mapper` intermittent (retry
   resolves). Pattern severity downgraded but not eliminated.

## Constitutional Violation (P0-0)

The system reminder from `.hivemind/AGENTS.md` (Internal State Sector Guidance)
makes the Lane 1 P0 #1 finding a CONSTITUTIONAL VIOLATION, not just a code
finding. Evidence:

- **Rule:** "Hooks SHALL NOT directly write durable state into `.hivemind/`;
  hook effects must stay observation/response-shaping/guard-decision."
- **Code:** `src/hooks/guards/tool-guard-hooks.ts` performs 6
  `stateManager.addWarning` writes from inside hook handlers.
- **Severity:** Constitutional (above P0). Blocks CA-04 bootstrap/state
  ownership readiness per `.hivemind/AGENTS.md:6`.

## Top P0 Aggregation (cross-lane, deduplicated)

| # | Theme | Source lanes | File:Line |
|---|---|---|---|
| P0-0 | **Hook CQRS constitutional violation** | L1#L1-P0-1, L2#F-23 | `src/hooks/guards/tool-guard-hooks.ts:89-94, 109-112, 143-154, 167, 172, 193-216, 240-241` |
| P0-1 | **Delegation persistence fire-and-forget race** | L1#L1-P0-2 | `src/task-management/continuity/delegation-persistence.ts:61-110` |
| P0-2 | **Blank `model` and `subagentType` in persistence** | L1#L1-P0-3 | `src/task-management/continuity/delegation-persistence.ts:34, 40` |
| P0-3 | **Tool registration count drift (log says 26, actual 30)** | L1#L1-P0-4, L2 (overlap) | `src/plugin.ts:473` |
| P0-4 | **Concurrency default duplicated** | L1#L1-P0-6 | `src/coordination/concurrency/queue.ts:53` + `src/task-management/lifecycle/index.ts:80-83` |
| P0-5 | **Archive contradiction** | L3#P0-1 | `AGENTS.md:340` (claim 35 archived) vs 36 still active (21 hm-l2-* + 15 hm-l3-*) |
| P0-6 | **command/ vs commands/ divergence** | L3#P0-2 | `AGENTS.md:342` (claim identical duplication) vs disjoint sets (67 + 125 + 105 unaccounted) |
| P0-7 | **`.backup` pollution** | L3#P0-4 | 42 agents + 12 skill dirs + 124 commands = 178 stale files |
| P0-8 | **Tool envelope shape contradiction** | L1#L1-P0-5, L4 | `src/shared/tool-response.ts:6-11` (actual `{kind,...}` vs Lane 4's `{code,...}` claim) |
| P0-9 | **SDK `isWrapperAvailable` tautology** | L4 | `src/features/sdk-supervisor/index.ts:191, 192, 194-197` (6/8 branches) |
| P0-10 | **Audit-spec envelope 0/40+ tool conformance** | L4 | (no file — needs synthesis to enumerate) |

## Next Step: Dispatch Synthesis

Target: `gsd-research-synthesizer` (leaf agent, NO further delegation).
Input: all 5 lane files.
Output: `.hivemind/planning/uat-phase-58.9-session-tools-audit/AUDIT-REPORT.md`
(atomic commit by synthesis agent).

### Synthesis Brief (to be included in delegate-task prompt)

```
You are gsd-research-synthesizer. Read all 5 lane files in
.hivemind/planning/uat-phase-58.9-session-tools-audit/ and produce
AUDIT-REPORT.md at that path. No sub-delegation. Atomic commit when done.

Required structure:
1. Executive Summary (severity totals, top-10 P0 list, must-fix vs defer)
2. Per-Lane Highlights (1 paragraph each, top-3 findings per lane)
3. Cross-Lane Themes (P0-0 through P0-N from landscape.md)
4. Constitutional Violations (P0-0 from .hivemind/AGENTS.md)
5. Top-10 P0 Action Plan (file:line, evidence, fix shape)
6. P1/P2/P3 Hygiene List (grouped by surface)
7. Test Coverage Reality (Lane 5 verdict, 21 failing, 13 no-regression)
8. Recommended Commit Sequence (atomic per concern, not one mega-commit)

Severity framework: P0=action-blocking/data-loss/invariant-break,
P1=correctness/race/design-debt, P2=quality/readability,
P3=style/discoverability. Constitutional = above P0.

Evidence rule: every P0 must cite file:line. No "code looks complex"
without source citation.

Language: en. Commit message: "audit: AUDIT-REPORT.md synthesis — 132
findings + 9 L0 + constitutional P0-0".
```

## Deferred Investigation (post-audit)

1. Why retry #2 broke the ghost pattern but retry #1 didn't (variable?
   time-elapsed? prompt hardening?).
2. `finalMessageExcerpt` "writing two documents" semantic conflation root cause.
3. Sibling session/agent names mismatch → write-race root cause.
4. SDK `canStackOn` state-dependence: is this a harness bug or intended?
5. File-disk vs delegation-status asynchrony: write tool fires before
   session-return — harness WaiterModel design issue?
6. `_harness` metadata contract (Lane 1 §2.2) — promote to Zod schema in
   `src/schema-kernel/`.
7. Tool count drift resolution path: compute at runtime vs
   `register*Tools()` returning a typed `ToolInventory` object.

## Out of Scope (intentional)

- Direct code fixes (delegate to `hm-executor` or `hm-code-fixer` post-synthesis).
- `.hivemind/state/*.json` mutation (only typed owners may write per
  `.hivemind/AGENTS.md`).
- Hf-* lineage work (cross-lineage: route to `hf-l0-orchestrator` if user requests).
- `gsd-codebase-mapper` ghost-pattern root cause (architectural, not a
  single-phase fix).
