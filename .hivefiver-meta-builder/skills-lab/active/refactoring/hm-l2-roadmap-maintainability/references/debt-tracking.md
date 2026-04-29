# Technical Debt Tracking

## Overview

Systematic cataloging, classification, prioritization, and integration of technical debt into roadmap milestones. Based on the Technical Debt Quadrant model (Martin Fowler / Steve McConnell) and interest-on-principal calculation.

## The Debt Quadrant Model

Every debt item falls into one of four quadrants:

| | **Prudent** (conscious, informed trade-off) | **Reckless** (uninformed, careless, or rushed) |
|---|---|---|
| **Deliberate** (chose this path) | **DP:** "We chose a monolith now knowing we'll need to split it by M3. Documented as D-001." | **DR:** "We'll copy-paste this module for now. Someone will fix it later." |
| **Inadvertent** (discovered after the fact) | **IP:** "Turns out this ORM doesn't scale with our growth. We didn't know at the time." | **IR:** "We never wrote tests for the payment flow because we were in a hurry." |

### Quadrant Action Rules

| Quadrant | Typical Action |
|----------|---------------|
| **DP (Deliberate-Prudent)** | Schedule repayment at the planned milestone. Interest is built into the plan. |
| **DR (Deliberate-Reckless)** | Repay IMMEDIATELY. This is active negligence. |
| **IP (Inadvertent-Prudent)** | Evaluate interest rate. Schedule when cost of deferral exceeds cost of repayment. |
| **IR (Inadvertent-Reckless)** | Repay at earliest feasible milestone. This is hidden risk. |

## Debt Inventory Process

### Step 1: Discovery

Sources of debt information:

| Source | What to Look For | Command/Approach |
|--------|-----------------|-----------------|
| **Code comments** | `TODO`, `FIXME`, `HACK`, `XXX`, `WORKAROUND` | `grep -r "TODO\|FIXME\|HACK\|XXX\|WORKAROUND" src/ --include="*.ts"` |
| **Issue tracker** | Issues tagged `tech-debt`, `refactor`, `cleanup` | Check GitHub/GitLab issues with labels |
| **Code review history** | PRs merged with known shortcuts flagged | Review closed PRs with `tech-debt` or similar tags |
| **Architecture ADRs** | Decisions that explicitly accept trade-offs | `ls docs/adr/` — read each for accepted trade-offs |
| **Linter violations** | Disabled rules, rule exceptions, `// eslint-disable` comments | `grep -r "eslint-disable\|ts-ignore\|any" src/` |
| **Test skip/disables** | `it.skip`, `describe.skip`, `xit`, `xdescribe` | `grep -r "\.skip\|xit\|xdescribe" tests/` |
| **Manual audit** | Known pain points from developer interviews | Ask: "What part of the codebase do you dread changing?" |

### Step 2: Catalog Each Item

For each debt item found, complete this template:

```markdown
### D-###: [Short Title]

- **Description:** [What the debt is, in 1-3 sentences]
- **Quadrant:** DP | DR | IP | IR
- **Principal (effort to fix):** [X] days
- **Interest Rate:** Low | Medium | High
  - Low: < 10% velocity reduction per milestone
  - Medium: 10-30% velocity reduction per milestone
  - High: > 30% velocity reduction per milestone
- **Affected Modules:** [module paths]
- **Affected Features:** [F-XXX, F-YYY]
- **First Detected:** YYYY-MM-DD
- **Detection Source:** [TODO grep | issue #N | ADR-N | manual audit]
- **Milestone Impact:** [which roadmap features are blocked/slowed]
- **Repayment Strategy:** [concrete actions to resolve]
- **Deferral Cost (3 milestones):** Principal × (1 + rate)^3 = [X] days
```

### Step 3: Classify Interest Rate

| Rate | Daily Velocity Impact | Key Indicator |
|------|-----------------------|---------------|
| **High** | > 30% slower on affected modules | Every change requires working around the debt; developers actively avoid the module |
| **Medium** | 10-30% slower on affected modules | Occasional workarounds needed; tests are fragile; some changes cascade |
| **Low** | < 10% slower on affected modules | Cosmetic issues; minor inconvenience; no workaround required |

**Interest rate calibration:**
- **Escalation rule:** Interest rates compound if left unresolved. A Low-interest debt becomes Medium after 3 milestones of deferral.
- **Scope rule:** Interest applies to affected modules only. Global debt (e.g., no CI pipeline) has global interest.

## Interest-on-Principal Calculation

### Formula

```
Cost_of_Deferral(n) = Principal × (1 + rate)^n

where:
  Principal = estimated days to resolve
  rate = 0.10 (Low), 0.25 (Medium), 0.40 (High)
  n = number of milestones deferred

Total_Cost = Cost_of_Deferral(n) — Principal
```

### Worked Examples

| Debt | Principal | Rate | Deferred 3 milestones | Cumulative Cost | Total Cost |
|------|-----------|------|----------------------|-----------------|------------|
| D-001: Missing auth tests | 5 days | Medium (0.25) | 3 | 5 × 1.25³ = 9.8 days | 4.8 days of drag |
| D-002: Copy-pasted module | 3 days | High (0.40) | 2 | 3 × 1.40² = 5.9 days | 2.9 days of drag |
| D-003: Outdated docs | 2 days | Low (0.10) | 5 | 2 × 1.10⁵ = 3.2 days | 1.2 days of drag |
| D-004: Monolith split | 30 days | Medium (0.25) | 1 | 30 × 1.25¹ = 37.5 days | 7.5 days of drag |

**Interpretation:** D-001 costs 5 days now vs. ~10 days of cumulative drag if deferred 3 milestones. Deferring costs more than fixing.

### Break-Even Analysis

When deciding whether to fix now vs. defer:

```
Break-even: Cost_of_Deferral(n) > Principal × 2 → Fix now
```

If deferring will more than double the effective cost → fix now. This applies to most High-rate and many Medium-rate debts.

## Prioritization Framework

### P0 — Immediate (Repay in current milestone)

**Criteria (any one is sufficient):**
- Blocks a current-milestone feature
- Quadrant: Deliberate-Reckless (DR) or Inadvertent-Reckless (IR)
- Interest rate: High on a critical path module
- Security vulnerability (CVEs > 7.0)
- Causes production incidents

### P1 — This Roadmap (Repay before affected features)

**Criteria (any one is sufficient):**
- Affects 3+ planned features
- Interest rate: Medium or High
- Break-even analysis says fix now
- Quadrant: Inadvertent-Prudent (IP) with accelerating interest

### P2 — When Convenient (Repay at natural opportunity)

**Criteria (all must be true):**
- Affects ≤ 2 features, none of which are in the next 2 milestones
- Interest rate: Low
- Quadrant: Deliberate-Prudent (DP)
- Can be resolved during adjacent refactoring work

### P3 — Monitor (Track, do not schedule)

**Criteria (all must be true):**
- Interest rate: Low
- Quadrant: Deliberate-Prudent (DP) or Inadvertent-Prudent (IP)
- Affects no planned features
- No compounding escalation risk

## Debt Register Template

```markdown
# Technical Debt Register — [Date]

## Summary

| Priority | Count | Total Principal | Cumulative Interest (3 milestones) |
|----------|-------|----------------|--------------------------------------|
| P0 — Immediate | N | X days | X days |
| P1 — This Roadmap | N | X days | X days |
| P2 — When Convenient | N | X days | X days |
| P3 — Monitor | N | X days | X days |
| **Total** | **N** | **X days** | **X days** |

## Detailed Register

| ID | Title | Quadrant | Principal | Rate | Priority | Affected Features | Target Milestone | Deferral Cost (3mln) |
|----|-------|----------|-----------|------|----------|-------------------|-----------------|----------------------|
| D-001 | ... | DP | 5d | M | P1 | F-003, F-007 | M2 | 9.8d |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |

## Milestone Allocation

| Milestone | Debt Items | Total Days | Feature Days | Combined Days | Capacity | Status |
|-----------|-----------|------------|--------------|---------------|----------|--------|
| M1 | D-002 (3d), D-005 (2d) | 5d | 18d | 23d | 28d | ✅ |
| M2 | D-001 (5d), D-003 (2d) | 7d | 22d | 29d | 28d | ⚠️ Over by 1d |
| ... | ... | ... | ... | ... | ... | ... |
```

## Debt Monitoring Cadence

| Activity | Frequency | Action |
|----------|-----------|--------|
| Discovery scan (TODOs, FIXMEs, skips) | Every milestone start | Run grep-based scan. Add new items to register. |
| Interest rate recalibration | Every milestone end | Reassess Low/Medium/High based on actual velocity impact. |
| Quadrant reclassification | Every 2 milestones | IP → DP if the team now knowingly accepts the trade-off. |
| P3 → escalation check | Every milestone | Any P3 item approaching 3-milestone deferral → escalate to P2. |
| Register cleanup | Quarterly | Remove resolved items. Merge duplicates. |

## Anti-Patterns

| Anti-Pattern | Correction |
|-------------|------------|
| **Debt denial** — claiming no debt exists | Every non-trivial codebase has debt. Run the discovery scan. |
| **Everything is P1** — all debt marked critical | Apply prioritization criteria. If > 50% of items are P0/P1, the codebase is in crisis — escalate. |
| **Debt hoarding** — cataloging but never repaying | Each milestone MUST include debt repayment proportionate to its feature load. Rule of thumb: 10-20% of milestone capacity for debt. |
| **Quadrant gaming** — marking all debt as Deliberate-Prudent to avoid action | DP requires: (a) decision was documented at the time, (b) repayment milestone was planned, (c) trade-off was understood. If any is missing → not DP. |
| **Interest rate anchoring** — never recalibrating rates | Recalibrate every milestone. Debt that seemed Low may prove Medium in practice. |
