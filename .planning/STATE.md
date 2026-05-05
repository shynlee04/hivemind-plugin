# Project State

**Last Updated:** 2026-05-05

---

## Workstreams

### harness-ecosystem-recovery — ACTIVE

| Phase | Status | Dependencies |
|-------|--------|-------------|
| HER-0 | ✅ COMPLETE (2026-05-05) | — |
| HER-1 | ✅ COMPLETE (2026-05-05) | HER-0 |
| HER-2 | ✅ COMPLETE (2026-05-05) | HER-1 ✅ |
| HER-3 | Blocked | HER-2 |
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
| Dead code ratio | ~6.5% (was 13.7%, ~1,562 LOC removed across HER-2-01 and HER-2-02) |

---

## Governance Health

| Doc | Sync Date | Status |
|-----|-----------|--------|
| AGENTS.md | 2026-05-05 | Synced |
| ARCHITECTURE.md | 2026-05-05 | Synced |
| ROADMAP.md (HER) | 2026-05-05 | Synced |
