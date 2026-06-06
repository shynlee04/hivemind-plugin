# Phase Audit Master Plan

**Date:** 2026-06-06
**Status:** ACTIVE — preparing context for per-phase audit

---

## Purpose

Audit ALL 121 phases in `.planning/phases/` against the 8-cluster inventory. For each phase:
1. Map to cluster(s)
2. Surface assumptions
3. Detect gaps, conflicts, misconducts (legacy), overlapping, flaws
4. Update STATE.md and ROADMAP.md
5. Add refactoring plan
6. Archive completed phases

**Removals and adjustments happen WITHIN each child phase — not in bulk.**

---

## Phase Audit Template

For each phase, produce:

```markdown
# Phase Audit: {phase-name}

**Cluster:** C{N} — {cluster-name}
**Date:** {date}
**Status:** AUDITED | NEEDS-REFACTOR | ARCHIVED

## 1. Phase Summary
- Purpose: {what this phase was supposed to do}
- Artifacts: {list of files in phase directory}
- Dependencies: {what this phase depends on}

## 2. Cluster Mapping
- Primary cluster: C{N}
- Cross-cutting: C{N} (reason)

## 3. Assumptions Surfaced
- {assumption 1}
- {assumption 2}

## 4. Gaps Detected
- {gap 1}
- {gap 2}

## 5. Conflicts
- {conflict 1}
- {conflict 2}

## 6. Misconducts (Legacy)
- {misconduct 1}
- {misconduct 2}

## 7. Overlapping
- {overlap with phase X}
- {overlap with phase Y}

## 8. Flaws
- {flaw 1}
- {flaw 2}

## 9. Refactoring Plan
- {action 1}
- {action 2}

## 10. Archive Decision
- [ ] Archive as-is
- [ ] Archive with notes
- [ ] Needs refactoring before archive
- [ ] Merge with phase {X}
- [ ] Delete (obsolete)
```

---

## 121 Phases Mapped to Clusters

### C1: Governance + CLI + Config (28 phases)

| Phase | Artifacts | Status | Notes |
|-------|-----------|--------|-------|
| `BOOT-01-dependency-audit-architecture` | ? | ? | |
| `BOOT-02-cli-framework-entry-point` | 16 | ? | |
| `BOOT-02R-governance-reconciliation` | ? | ? | |
| `BOOT-03-state-init` | ? | ? | |
| `BOOT-04-primitives-recovery` | ? | ? | |
| `BOOT-05-config-bootstrap-defaults` | ? | ? | |
| `BOOT-06-validation-health-check` | ? | ? | |
| `BOOT-07-end-to-end-proof` | ? | ? | |
| `BOOT-08-agent-skill-integration` | ? | ? | |
| `BOOT-09-mvp-config-schema-entry-init` | ? | ? | |
| `SR-05-config-to-config-realm` | ? | ? | |
| `SR-05-config-governance-cluster-unification-2026-06-04` | ? | ? | |
| `SR-06-routing-to-routing-plane` | ? | ? | |
| `SR-09-plugin-composition-root-update` | ? | ? | |
| `SR-10-cleanup-agents-md-updates` | ? | ? | |
| `SR-11-config-ecosystem-complete-2026-06-04` | ? | ? | |
| `24.3-commands-infrastructure` | ? | ? | |
| `24.3.1-governance-session-prototype` | 25 | ? | |
| `24.3.2-revamp-execute-slash-command` | ? | ? | |
| `24.3.3-namespace-routing-advanced-features` | ? | ? | |
| `24.5-workflow-files-architecture` | ? | ? | |
| `24.6-build-hm-commands` | ? | ? | |
| `24.7-primitives-asset-schema` | ? | ? | |
| `24.8-primitives-install-extraction` | ? | ? | |
| `24.9-bootstrap-init-flow` | ? | ? | |
| `30-schema-kernel-cleanup` | ? | ? | |
| `31-config-plane-redesign` | ? | ? | |
| `32-shipped-primitives-governance-wire` | ? | ? | |
| `37-fix-sync-oss-yml-workflow` | ? | ? | |
| `38-package-opencode-primitives` | ? | ? | |

### C2: Internal Programmatic Modules (22 phases)

| Phase | Artifacts | Status | Notes |
|-------|-----------|--------|-------|
| `01-C1-ChildBackfiller-Initialization` | ? | ? | |
| `CP-ST-01-session-tracker-revamp` | ? | ? | |
| `CP-ST-02-session-tracker-deep-fix-remaining` | ? | ? | |
| `CP-ST-03-architecture-detox` | ? | ? | |
| `CP-ST-04-session-tracker-architecture-fix` | ? | ? | |
| `CP-ST-05-session-data-loss-investigation` | ? | ? | |
| `CP-ST-06-session-tracker-root-cause-rewrite` | 19 | ? | |
| `13-fix-all-session-tracker-defects` | 16 | ? | |
| `16-session-tracker-tool-intelligence` | 20 | ? | |
| `21-session-tracker-design-fix` | 23 | ? | |
| `21.1-execute-slash-command-sdk-redesign` | ? | ? | |
| `21.2-front-agent-switch-one-shot` | ? | ? | |
| `23.1-session-tracker-sdk-investigation` | ? | ? | |
| `23.2-session-tracker-bugfix` | ? | ? | |
| `25-trajectory-agent-work-contract-redesign` | 21 | ? | |
| `25.1-task-tool-integration` | ? | ? | |
| `25.2-trajectory-immutability-guard` | ? | ? | |
| `25.3-pressure-authority-matrix-completion` | ? | ? | |
| `25.5-trajectory-contract-redesign` | 19 | ? | |
| `54-session-persistence-restart-recovery` | ? | ? | |
| `P41-state-cluster-redesign` | 30 | ? | |
| `P41-state-cluster-hardening` | ? | ? | |

### C3: Delegation + Coordination + Intelligence (25 phases)

| Phase | Artifacts | Status | Notes |
|-------|-----------|--------|-------|
| `CP-DT-01-delegate-task-ecosystem-revamp` | 32 | ? | |
| `14-wire-monitor-notification` | 19 | ? | |
| `15-delegate-task-gap-remediation` | 18 | ? | |
| `22-coordination-status-error-unification` | ? | ? | |
| `24-coordination-dispatch-delegate-task-fix` | ? | ? | |
| `24.1-agent-hierarchy-restructure` | ? | ? | |
| `24.2-agent-profile-quality-enforcement` | 36 | ? | |
| `26-pressure-notification-redesign` | ? | ? | |
| `26.1-artifact-naming-convention` | ? | ? | |
| `26.2-artifact-dependency-gatekeeping` | ? | ? | |
| `42-tmux-visual-orchestration-layer` | ? | ? | |
| `43-tmux-co-pilot-model-orchestrator` | ? | ? | |
| `45-vendor-sync-script` | ? | ? | |
| `49-close-tmux-end-to-end-gap` | 21 | ? | |
| `50-cleanup-opencode-tmux-fork` | ? | ? | |
| `51-synthesize-core-tmux-classes` | ? | ? | |
| `52-wire-tmux-copilot-state-query` | ? | ? | |
| `53-live-pane-monitoring-hook` | ? | ? | |
| `56-tmux-stress-test` | ? | ? | |
| `58-tmux-orchestration-programmatic-pool` | 20 | ? | |
| `58.9-sticky-bug-busting` | ? | ? | |
| `59-session-backchannel-tmux-copilot` | ? | ? | |
| `P23.4-da-integration-gate` | ? | ? | |
| `P23.5-ac-integration-gate` | ? | ? | |
| `P23.6-p25-b-integration-gate` | ? | ? | |
| `P23.7-efg-integration-gate` | ? | ? | |

### C4: Injections + Hooks (2 phases)

| Phase | Artifacts | Status | Notes |
|-------|-----------|--------|-------|
| `28-hook-injection-plane-redesign` | ? | ? | |
| `SR-07-hooks-reorganization` | ? | ? | |

### C5: Tool Surfaces (3 phases)

| Phase | Artifacts | Status | Notes |
|-------|-----------|--------|-------|
| `23-notification-fix-and-tool-surface-docs` | 28 | ? | |
| `SR-08-tools-reorganization` | ? | ? | |
| `P44-tool-intelligence-capability-layer` | ? | ? | |

### C6: Assets — Shipped Primitives (5 phases)

| Phase | Artifacts | Status | Notes |
|-------|-----------|--------|-------|
| `MCM-01-agent-migration` | ? | ? | |
| `MCM-02-skill-migration` | ? | ? | |
| `24.3-commands-infrastructure` | ? | ? | |
| `24.4-references-templates-system` | ? | ? | |
| `24.7-primitives-asset-schema` | ? | ? | |

### C7: Sidecar (5 phases)

| Phase | Artifacts | Status | Notes |
|-------|-----------|--------|-------|
| `SC-01-sidecar-foundation` | ? | ? | |
| `SC-02-rest-api-tool-proxy` | ? | ? | |
| `SC-03-nextjs-app` | ? | ? | |
| `SC-PTY-01-read-only-terminal-projection` | ? | ? | |
| `55-e2e-uat` | ? | ? | |

### C8: Foundation (8 phases)

| Phase | Artifacts | Status | Notes |
|-------|-----------|--------|-------|
| `SR-00-preparation-safety-net` | ? | ? | |
| `SR-01-leaf-modules-to-shared` | ? | ? | |
| `SR-02-persistence-journal-to-task-management` | ? | ? | |
| `SR-03-delegation-concurrency-to-coordination` | ? | ? | |
| `SR-04-features-to-features-plane` | ? | ? | |
| `33-plugin-decomposition` | ? | ? | |
| `34-async-io-typed-errors` | ? | ? | |
| `35-module-splits-legacy-inventory` | ? | ? | |

### Cross-Cluster (13 phases)

| Phase | Artifacts | Status | Notes |
|-------|-----------|--------|-------|
| `00.5-dead-code-sweep-dist-rebuild` | ? | ? | |
| `11-governance-reconciliation` | ? | ? | |
| `17-sync-boundary-definition` | ? | ? | |
| `18-root-cleanup` | 17 | ? | |
| `19-non-destructive-remediation` | ? | ? | |
| `20-package-json-dependency-cleanup` | ? | ? | |
| `36-integration-verification` | ? | ? | |
| `39-integration-completion-hardening` | 20 | ? | |
| `C4-Performance-Optimization` | ? | ? | |
| `C5-Error-Handling-Code-Quality` | ? | ? | |
| `C6-Architectural-Refactoring` | ? | ? | |
| `C7-Test-Coverage` | ? | ? | |
| `CP-PTY-00-shell-pty-control-plane-spike` | ? | ? | |
| `CP-PTY-01-background-shell-control-plane-mvp` | ? | ? | |
| `CP-PTY-02-sdk-session-delegation-integration` | ? | ? | |
| `CP-PTY-03-agent-subagent-background-task-coordination` | ? | ? | |
| `CP-PTY-04-cross-cutting-shell-integration` | ? | ? | |
| `P39-integration-completion-hardening` | ? | ? | |
| `P40-public-ship-readiness` | 18 | ? | |

---

## Audit Process (Per Phase)

1. **Read** phase artifacts (PLAN.md, SPEC.md, CONTEXT.md, etc.)
2. **Map** to primary cluster + cross-cutting clusters
3. **Surface** assumptions
4. **Detect** gaps, conflicts, misconducts, overlapping, flaws
5. **Record** in phase audit document
6. **Update** STATE.md and ROADMAP.md
7. **Add** refactoring plan if needed
8. **Commit** after each phase audit
9. **Ask** user for next phase or cluster

---

## Execution Order

**Recommended:** Start with the cluster that has the most phases and the most known issues.

Based on CONCERNS.md and phase counts:
1. **C2 (Internal Modules)** — 22 phases, most known issues (session-tracker defects, data loss, etc.)
2. **C3 (Delegation + Coordination)** — 25 phases, tmux complexity
3. **C1 (Governance + CLI + Config)** — 28 phases, BOOT-* foundation
4. **C8 (Foundation)** — 8 phases, SR-* restructuring
5. **C5 (Tool Surfaces)** — 3 phases, simpler
6. **C4 (Hooks)** — 2 phases, simplest
7. **C6 (Assets)** — 5 phases, primitives
8. **C7 (Sidecar)** — 5 phases, independent

**But user decides order.**

---

*Master plan prepared — 2026-06-06*
