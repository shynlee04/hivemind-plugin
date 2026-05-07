# Managed Autonomous Loop Roadmap

**Date:** 2026-05-07  
**Category:** Roadmap / workflow management  
**Reader:** Future Hivemind coordinator or maintainer entering cold  
**Post-read action:** Decide the next authorized workflow cycle without re-opening stale planning context.

---

## 1. Operating Decision

HiveMind should proceed through a **managed autonomous loop**, not through open-ended phase addition or full autonomy.

The loop is:

1. Form authoritative context.
2. Route validated gaps into dependency-ordered phases.
3. Research only when implementation uncertainty exists.
4. Execute exactly one authorized cycle.
5. Verify with lifecycle, spec, and evidence gates.
6. Ask for authorization before entering the next cycle.

This matches the Hivemind philosophy: the HIVE provides hierarchy and domain boundaries; the MIND preserves context, decisions, and evidence across sessions.

---

## 2. Roadmap Maturity

**Maturity:** Draft, usable for execution control.

The current roadmap has enough validated context to route work, but it is not yet safe for fully autonomous multi-cycle execution because the same mechanisms that make autonomy safe are still incomplete.

Blocking safety gaps:

| Gap | Why It Blocks Full Autonomy |
|-----|-----------------------------|
| Bootstrap recovery missing | The runtime cannot restore its primitive/state surfaces after deletion. |
| `conversation_language` has no consumer | Config can claim behavior that runtime does not honor. |
| f-04 routing missing | Agents and commands exist, but no workflow router reliably glues them. |
| Lifecycle gate criteria missing | Quality gates exist, but lifecycle evidence criteria are not fully documented. |
| No E2E runtime tests | Unit coverage is high, but end-to-end behavior is not proven. |

---

## 3. Maintainability Scorecard

Scores are based on the reconciled audit artifacts, not fresh runtime verification in this document.

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Complexity | 6.5/10 | Modules are mostly alive and bounded, but plugin composition and stale modules add coordination complexity. |
| Coupling | 6.0/10 | CQRS boundaries are clear, but bootstrap, state, and routing concerns still cross surfaces. |
| Test Coverage | 7.5/10 | Unit coverage is strong, but E2E/runtime coverage is missing. |
| Documentation | 6.5/10 | Fresh map and audits exist, but lifecycle overview and gate criteria are incomplete. |
| Dependency Freshness | 7.0/10 | Stack is current enough for present work; no new runtime dependency is needed for next cycle. |
| Architectural Debt | 4.5/10 | Bootstrap gap, dead config, missing router, and incomplete state ownership are real architecture debt. |

**Maintainability Index:** 6.3/10 — Moderate.

Interpretation: feature work is allowed only when it closes architecture-enabling gaps. New user-facing features should wait until the managed loop has completed Core Architecture recovery.

---

## 4. Dependency-Ordered Cycle Plan

| Cycle | Name | Status | Depends On | Exit Gate |
|-------|------|--------|------------|-----------|
| Cycle 1 | Lifecycle Alignment | Authorized now | Fresh `.planning` context | User approves routed plan and lifecycle overview |
| Cycle 2 | Bootstrap Recovery + BOOT-02R Reconciliation | Active/authorized by current user request | Cycle 1 | BOOT-02 status truth reconciled; `.opencode/` and `.hivemind/` restoration path documented and verified |
| Cycle 2P | Shell / PTY Control-Plane Spike | Parallel docs/spec only | Cycle 2 reconciliation | CP-PTY context, research, requirements, spec, and route artifacts exist with runtime mutation blocked |
| Cycle 3 | Config-to-Behavior Wiring | Pending authorization | Cycle 2 | `conversation_language` has at least one runtime consumer or is rejected by schema |
| Cycle 4 | State Ownership | Pending authorization | Cycle 2 and Cycle 3 | Priority `.hivemind/` surfaces have typed ownership modules |
| Cycle 5 | f-04 Routing Engine | Pending authorization | Cycle 4 | Intent/classification/router path exists with tests |
| Cycle 6 | Delegation Hierarchy Enforcement | Pending authorization | Cycle 5 | Runtime validates allowed L0/L1/L2/L3 dispatch boundaries |
| Cycle 7 | E2E Runtime Proof | Pending authorization | Cycle 5 and Cycle 6 | At least one real delegation/control-plane flow passes end-to-end |

---

## 5. Architecture Runway

| Runway Item | Enables | Required Before |
|-------------|---------|-----------------|
| Lifecycle overview | Safe phase routing and gate checks | Any autonomous implementation loop |
| Bootstrap recovery | Reinstallable harness package behavior | State ownership and user onboarding |
| Shell/PTY control-plane spec | Safe command lanes, background delegation, and terminal projection boundaries | f-04 routing if command lanes are routed; CP-PTY-01 implementation |
| Config consumer binding | Honest runtime behavior | Any profile/language automation |
| State ownership modules | Durable MIND memory surfaces | Auto-routing and long-session recovery |
| f-04 router | Command/agent/skill coordination | Full autonomous workflow execution |
| E2E proof harness | Evidence-truth gate | Shipping runtime autonomy claims |

---

## 6. Technical Debt Register

| ID | Debt | Class | Priority | Target Cycle |
|----|------|-------|----------|--------------|
| D-001 | Bootstrap/recovery absent for `.opencode/` and `.hivemind/` | Inadvertent-prudent | P0 | Cycle 2 |
| D-002 | `conversation_language` accepted but unused | Inadvertent-reckless | P0 | Cycle 3 |
| D-003 | Dead `messages-transform.ts` module | Inadvertent-prudent | P1 | Cycle 3 or cleanup batch |
| D-004 | Stale modules without consumers | Inadvertent-prudent | P1 | Cycle 4 |
| D-005 | f-04 workflow router missing | Deliberate-prudent | P0 | Cycle 5 |
| D-006 | Lifecycle gate references incomplete | Inadvertent-prudent | P0 | Cycle 1 |
| D-007 | E2E runtime proof missing | Deliberate-prudent | P1 | Cycle 7 |
| D-008 | Shell/PTY/background command lane under-specified across delegation, permissions, lifecycle, and projection | Inadvertent-prudent | P1 | Cycle 2P / CP-PTY-00 |

---

## 7. Product Health Dashboard

| Metric | Value | Status |
|--------|-------|--------|
| Maintainability Index | 6.3/10 | Moderate |
| Roadmap dependency clarity | High after reconciliation | Usable |
| Autonomous execution safety | Medium-low | Requires gates |
| Immediate architecture blockers | 4 | Must address before full autonomy |
| Runtime evidence depth | Unit-heavy | Needs E2E |
| User vision alignment | Improving | Needs lifecycle overview |

Verdict: proceed with managed cycles only. Do not enable broad autonomous workflow execution until Cycle 5 and Cycle 7 are complete.

---

## 8. Capacity Plan

| Cycle | Size | Parallelizable | Notes |
|-------|------|----------------|-------|
| Cycle 1 | M | Partially | Documentation and routing can be drafted together, but final integration is serial. |
| Cycle 2 | M | Low | Bootstrap touches package, filesystem conventions, and install behavior; serialize. BOOT-02R governance reconciliation must complete before BOOT-03 resumes. |
| Cycle 2P | S-M | Medium | CP-PTY-00 is docs/spec only and can run parallel with BOOT continuation because it must not mutate runtime files. |
| Cycle 3 | S-M | Medium | Config wiring and dead module cleanup can be separate if file overlap is low. |
| Cycle 4 | L | Medium | State ownership can split by state surface after interface is locked. |
| Cycle 5 | L-XL | Low initially | Router design must be serialized before implementation slices. |
| Cycle 6 | M-L | Medium | Enforcement can split by dispatch layer after policy is locked. |
| Cycle 7 | M | Medium | E2E tests can parallelize by scenario after harness fixture exists. |

---

## 9. Managed Loop Rules

Each cycle must use this loop:

1. **Entry Gate:** Current cycle has named scope, locked files, and dependency prerequisites satisfied.
2. **Plan Gate:** Phase plan names acceptance criteria and verification commands.
3. **Execution Gate:** Only one cycle runs without explicit user authorization for the next cycle.
4. **Review Gate:** Lifecycle, spec, and evidence checks run in that order where applicable.
5. **Exit Gate:** Cycle produces an updated state artifact and user-visible next-cycle recommendation.

Hard stops:

| Stop Condition | Required Response |
|----------------|-------------------|
| Missing prerequisite artifact | Pause and produce blocker report. |
| Verification evidence weaker than claim | Downgrade claim and request authorization. |
| More than 3 loop iterations | Escalate with issue count and options. |
| Scope starts drifting into unrelated work | Park into backlog; continue only authorized scope. |
| User philosophy conflict detected | Pause and reconcile against HIVE/MIND principles. |

---

## 10. Next Authorized Cycle

**Cycle 1: Lifecycle Alignment** is authorized by the user.

Deliverables:

| Deliverable | Purpose |
|-------------|---------|
| `lifecycle-overview-2026-05-07.md` | Show the end-to-end Hivemind runtime lifecycle. |
| Updated ROADMAP/STATE decision notes | Keep next action visible and non-random. |
| Next-cycle authorization prompt | Ask before starting Bootstrap Recovery. |

Cycle 1 is complete only when a cold reader can answer:

1. What is the lifecycle from user intent to persisted memory?
2. Which runtime surfaces own each step?
3. Which gaps block safe autonomy?
4. What exact cycle should run next?
