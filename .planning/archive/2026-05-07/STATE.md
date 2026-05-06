# Project State

**Last Updated:** 2026-05-06

---

## Workstreams

### harness-ecosystem-recovery — ACTIVE

| Phase | Status | Dependencies |
|-------|--------|-------------|
| HER-0 | ✅ COMPLETE (2026-05-05) | — |
| HER-1 | ✅ COMPLETE (2026-05-05) | HER-0 |
| HER-2 | ✅ COMPLETE (2026-05-05) | HER-1 ✅ |
| HER-3 | 🟢 Ready | HER-2 (→ HER-2 dependency satisfied: prompt-packet/ wired, compaction preservation active; ready to proceed) |
| HER-4 | Ready | HER-1 ✅ |
| HER-5 | Ready | HER-1 ✅ |

### milestone — SUSPENDED (Phase 71)

1604 tests passing | 90.49% coverage | typecheck 0 errors | build pass

| Phase | Status |
|-------|--------|
| Phase 71 (Runtime Detection Engine) | ✅ COMPLETE |
| Phase 70 (Prompt Packet Compiler) | ✅ COMPLETE |
| Phase 69 (SDK Supervisor + Cmd Eng) | ✅ COMPLETE |
| Phase 68 (Agent Work Contracts) | ✅ COMPLETE |
| Phase 66 (Recovery Engine) | ⚠️ PARTIAL (failure-classes only) |
| Phase 52 (End-User Acceptance) | 🔴 BLOCKED/PARTIAL |
| Phase 53 (Release Readiness) | 🔴 NO-SHIP |

### agent-synthesis — CLOSED (2026-04-30)

12/12 phases completed. 56 hm/hf agents created. 0 violations on final verification.

### skill-ecosystem — CLOSED (2026-04-30)

16/17 phases executed (SE-10 deferred). 54 active skills. 48/51 skills ≥6/8 RICH-8.

---

## Proposed Workstreams

| Workstream | Status | Priority | Dependencies | Purpose |
|------------|--------|----------|-------------|---------|
| **hivemind-state-architecture** | PLANNED | CRITICAL | HER-0 | Design `.hivemind/` canonical structure, `configs.json` (5-field minimal), schema specs |
| **primitive-registry** | PLANNED | HIGH | hivemind-state-architecture | Unified registry for agents/skills/commands/tools/MCP/hooks with stacking, chaining, permissions |
| **bootstrap-cli-onboarding** | PLANNED | HIGH | hivemind-state-architecture, primitive-registry | `npm install` model, `npx init`, greenfield/brownfield setup, doctor mode |

## Deferred Workstreams

| Workstream | Priority | Depends On | Purpose |
|------------|----------|------------|---------|
| auto-commands-workflow-router | MEDIUM | primitive-registry | Intent → workflow routing, auto-commands engine |
| delegation-revamp | MEDIUM | primitive-registry | Multi-lane delegation, graph/swarm/CRUD/hierarchy |
| trajectory-task-plus | MEDIUM | delegation-revamp, hivemind-state-architecture | Cross-session task lifecycle, trajectory ledger v3 |
| context-compaction-engine | MEDIUM | trajectory-task-plus, hivemind-state-architecture | Event-tracker redesign, context purification, time-machine |
| sidecar-user-config-ui | LOW | bootstrap-cli-onboarding, primitive-registry | Sidecar dashboard tabs, user config surface |

---

## Build Gates

| Gate | Status |
|------|--------|
| `npm run typecheck` | ✅ 0 errors |
| `npm test` | ✅ 1604 passed |
| `npm run build` | ✅ Pass |
| Coverage | ✅ 90.49% statements |

---

## Key Metrics

| Metric | Value |
|--------|-------|
| Agents | 89 (56 shipped hm/hf + 33 gsd-* dev tooling) |
| Project Skills | 59 (35 hm-* + 13 hf-* + 3 gate-* + 6 stack-* + 1 opencode-* + 1 disabled) |
| Dev Tooling Skills | 65 gsd-* (GSD framework — not shipped) |
| Tools | 16 |
| Commands | 18 |
| Dead code ratio | ~6.5% (was 13.7%, ~1,562 LOC removed across HER-2-01/02; session-entry + prompt-packet wired in HER-2-03) |

---

## Governance Health

| Doc | Sync Date | Status |
|-----|-----------|--------|
| AGENTS.md | 2026-05-05 | Synced |
| ARCHITECTURE.md | 2026-05-05 | Synced |
| ROADMAP.md (Master) | 2026-05-06 | Created |
| ROADMAP.md (HER) | 2026-05-05 | Synced |
| REQUIREMENTS.md | 2026-05-06 | Created |
