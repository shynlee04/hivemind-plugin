---
phase: 17
slug: sync-boundary-definition-src-audit-and-cleanup
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-20
approved: 2026-05-20
---

# Phase 17 — Validation Strategy

> Discovery-only phase. Validation focuses on findings report completeness and correctness.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Type-check command** | `npm run typecheck` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Verification Method | Automated Command | Status |
|---------|------|------|-------------------|-------------------|--------|
| 17-01-01 | 01 | 1 | Manual review of shared/ findings | `grep -rn "export" src/shared/ \| wc -l` | ✅ green |
| 17-01-02 | 01 | 1 | Manual review of config/ findings | `npm run typecheck` | ✅ green |
| 17-01-03 | 01 | 1 | Manual review of routing/ findings | `wc -l src/routing/*.ts` | ✅ green |
| 17-02-01 | 02 | 2 | Manual review of schema-kernel/ | `grep -rn "import.*schema-kernel" src/ --include="*.ts"` | ✅ green |
| 17-02-02 | 02 | 2 | Manual review of tools/ + hooks/ | `npm run typecheck` | ✅ green |
| 17-03-01 | 03 | 3 | Manual review of coordination/ | `grep -rn "import.*coordination" src/ --include="*.ts"` | ✅ green |
| 17-03-02 | 03 | 3 | Manual review of task-management/ | `npm run typecheck` | ✅ green |
| 17-04-01 | 04 | 4 | Manual review of features/ | `grep -rn "import.*features" src/ --include="*.ts"` | ✅ green |
| 17-04-02 | 04 | 4 | Manual review of cli/ + sidecar/ | `npm run typecheck` | ✅ green |
| 17-04-03 | 04 | 4 | Compile findings report | `grep -c "F-" 17-FINDINGS.md` | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements (no new tests needed for discovery phase)
- `npx ts-prune` may need install: `npm install -D ts-prune` (non-blocking — manual import tracing is fallback)

---

## Manual-Only Verifications

| Behavior | Why Manual | Test Instructions |
|----------|------------|-------------------|
| Dead code classification | Requires human judgment (import tracing may miss dynamic requires) | For each candidate: grep for all imports across src/, verify 0 hits |
| Context rot detection | Requires architecture pattern knowledge (CQRS, 9-surface) | Compare code against `.planning/codebase/ARCHITECTURE.md` patterns |
| Test coverage gap | Automated via `npx vitest run --reporter=verbose \| grep -i 'no tests'` | Run per-module and record modules with 0 test files |
| Findings report quality | Manual review of FINDINGS.md completeness | Verify all 15 modules represented, categories correct, severity assigned |

---

## Validation Sign-Off

- [x] All tasks have manual verify or automated commands
- [x] Sampling continuity: no 3 consecutive tasks without verification
- [x] Wave 0 covers all MISSING references (ts-prune optional)
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-20

---

## Validation Audit 2026-05-20

| Metric | Count |
|--------|-------|
| Plans executed | 4/4 |
| Tasks completed | 11/11 |
| Findings reported | 60 (F-01 through F-60) |
| Modules audited | 15/15 |
| Dead code files found | 8 |
| Context rot instances | 2 |
| Noise files found | 3 |
| RESEARCH.md corrections | 7 |
| Typecheck status | ✅ PASS |
| Gate verdict | ✅ NYQUIST-COMPLIANT |
