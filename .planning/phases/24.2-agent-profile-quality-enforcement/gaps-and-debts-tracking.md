# Phase 24.2 Agent Quality - Gaps and Debts Tracking

This file tracks all shortcomings, structural debts, legacy `gsd-sdk` references, and missing integration boundaries identified during the audit of the 30 `hm-*` agents against their GSD counterparts.

## 1. Core Architectural & Systemic Debts

| ID | Category | Description | Affected Agents | Resolution Target |
|---|---|---|---|---|
| D-01 | Legacy SDK | Remaining references to `gsd-sdk` commands in TBD sections (e.g. `state.load`, `roadmap.update-plan-progress`) | `hm-planner`, `hm-executor` | Phase 27 (Routing) / Phase 31 (Config) |
| D-02 | Gating Logic | Procedural looping/gating logic still described in agent instructions instead of being completely programmatic | `hm-orchestrator`, `hm-verifier` | Phase 25 (Trajectory) / Phase 26 (Pressure) |
| D-03 | Artifact Clashes | Overlapping output schemas (e.g. both mapper and architect producing `ARCHITECTURE.md` drafts) | `hm-codebase-mapper`, `hm-architect` | Wave 3 & 4 audits |
| D-04 | Mock Validation | Downstream unit tests testing mocks instead of verifying live OpenCode SDK integration | All execution agents | Phase 26 (Pressure & Gates) |

## 2. Agent-Specific Audit Gaps & Debts

*This section will be populated wave-by-wave by the specialist agents during the 15 waves of delegation.*

### Wave 1: Orchestration & Coordination
- **hm-orchestrator**: Audit Complete. Upgraded with L0/L1 coordination parameters, `gsd-*` routing constraints, and `task_id` stacking. Debt: Procedural gating logic still described in profile (tracks D-02).
- **hm-intent-loop**: Audit Complete. Upgraded with progressive Q&A levels and context drift boundary abort rules. No major new debts.

### Wave 2: Research Domain
- **hm-project-researcher**: Audit Complete. Upgraded with exhaustive output format templates and native search integration guidelines. No major new debts.
- **hm-phase-researcher**: Audit Complete. Upgraded with claim provenance, slopcheck legitimacy gates, runtime state inventories, environment availability probes, validation architecture, and security ASVS mappings. No new debts.

### Wave 3: Synthesis & Design
- **hm-synthesizer**: Audit Complete. Upgraded with contradiction resolution logic, session state integration, and structured returns.
- **hm-architect**: Audit Complete. Upgraded with interface design protocol, security by design ASVS guidelines, and ADR compliance checks. No new debts.

### Wave 4: Codebase Mapping
- **hm-codebase-mapper**: Audit Complete. Upgraded with SCAN/READ/DEEP mapping modes, CQRS boundary and 9-surface authority checks, and structured returns.
- **hm-pattern-mapper**: Audit Complete. Upgraded with TS config analysis, JSDoc and type safety guidelines, and standard Vitest testing patterns. No new debts.

### Wave 5: Goal-Backward Planning
- **hm-planner**: Audit Complete. Upgraded by replacing TBD items with programmatic phase state Zod validation. Checked dependency wave calculations.
- **hm-plan-checker**: Audit Complete. Upgraded by replacing manual check notes with schema-kernel frontmatter validator, Nyquist sampling rate checks, and ASVS controls. No new debts.

### Wave 6: Roadmapping & Maintenance
- **hm-roadmapper**: Audit Complete. Upgraded with integer vs decimal phase rules, granularity calibration, UI Hinting, and 5 Critical Governance Reflections.
- **hm-intel-updater**: Audit Complete. Upgraded with modular harness architecture tracing guidelines, schema/dashboard compliance formatting, and 12-step execution flow. No new debts.

### Wave 7: Execution & Verification
- **hm-executor**: Audit Complete. Upgraded by removing legacy `gsd-sdk` CLI commands in favor of programmatic state root updates (`session-continuity.json`, `delegations.json`, `trajectory-ledger.json`). Refined git worktree and branch integrity checks.
- **hm-verifier**: Audit Complete. Upgraded by replacing GSD SDK verification CLI tools with programmatic checks of truths, artifacts, and wiring pathways. Added Vitest test output parsing, strict L1-L5 evidence checks, mock downgrades, and Level 4 data-flow tracing.

### Wave 8: Code Quality
- **hm-code-reviewer**: Audit Complete. Upgraded by removing legacy GSD and skill folders lookup instructions. Added Unified findings classifications, PASS/FAIL verdict reporting, and programmatically updates to `session-continuity.json` and `trajectory-ledger.json`.
- **hm-code-fixer**: Audit Complete. Upgraded by replacing legacy `gsd-sdk query commit` with direct git CLI calls. Standardized the isolated worktree creation, recovery sentinel handling, and transactional cleanup flow. Programmatically updates Hivemind state logs.

### Wave 9: Integration & Debugging
- **hm-integration-checker**: [Pending Wave 9 Audit]
- **hm-debug-session-manager**: [Pending Wave 9 Audit]

### Wave 10: Debugging Specialist & Security
- **hm-debugger**: [Pending Wave 10 Audit]
- **hm-security-auditor**: [Pending Wave 10 Audit]

### Wave 11: User Profiling & Ecosystem
- **hm-user-profiler**: [Pending Wave 11 Audit]
- **hm-ecologist**: [Pending Wave 11 Audit]

### Wave 12: UI Domain (Research & Check)
- **hm-ui-researcher**: [Pending Wave 12 Audit]
- **hm-ui-checker**: [Pending Wave 12 Audit]

### Wave 13: UI Auditing & Ecosystem
- **hm-ui-auditor**: [Pending Wave 13 Audit]
- **hm-nyquist-auditor**: [Pending Wave 13 Audit]

### Wave 14: Documentation Quality
- **hm-doc-writer**: [Pending Wave 14 Audit]
- **hm-doc-verifier**: [Pending Wave 14 Audit]

### Wave 15: Shipping & Specifying
- **hm-shipper**: [Pending Wave 15 Audit]
- **hm-specifier**: [Pending Wave 15 Audit]

---

## 3. Future Action Items (TBD/Deferred)

- [ ] Execute Wave 1 through Wave 15 delegation tasks upon user approval of the implementation plan.
- [ ] Incorporate live UAT verifications on the OpenCode harness.
- [ ] Remove all legacy GSD references from updated files.
