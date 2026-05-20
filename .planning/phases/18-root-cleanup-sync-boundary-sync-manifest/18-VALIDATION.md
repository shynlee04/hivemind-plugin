---
phase: 18
slug: root-cleanup-sync-boundary-sync-manifest
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-20
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose tests/` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose tests/`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 180 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 18-01-01 | 01 | 1 | Dead code deletion — toggle-gates | manual | `npm run typecheck && test -f src/hooks/transforms/toggle-gates.ts && echo "FAIL: still exists" || echo "PASS: deleted"` | ⬜ pending |
| 18-01-02 | 01 | 1 | Dead code deletion — steering-engine + runtime-detection | manual | `npm run typecheck && ls src/features/steering-engine/ 2>&1 | grep -q "No such file"` | ⬜ pending |
| 18-01-03 | 01 | 1 | Dead code deletion — recovery/ submodule | manual | `npm run typecheck && ls src/task-management/recovery/ 2>&1 | grep -q "No such file"` | ⬜ pending |
| 18-02-01 | 02 | 2 | storeCache extraction | unit | `npx vitest run tests/task-management/continuity/store-cache.test.ts` | ⬜ pending |
| 18-03-01 | 03 | 2 | Barrel narrowing (export *) | unit | `grep -c "export \*" src/index.ts` = 0 | ⬜ pending |
| 18-04-01 | 04 | 3 | Manifest sync | manual | `grep -c "18-root-cleanup" .planning/codebase/STRUCTURE.md` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Existing infrastructure covers all phase requirements — no Wave 0 needed

---

## Manual-Only Verifications

| Behavior | Why Manual | Test Instructions |
|----------|------------|-------------------|
| Dead code removal | Confirms files no longer exist — file existence check | `ls path/to/deleted/file` should error |
| Barrel narrowing | Verify public API is unchanged for consumers | `npm run typecheck` + `npx vitest run` |
| Manifest sync | Docs accuracy — human review of file tree | `grep` for removed paths in STRUCTURE.md |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 180s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending 2026-05-20
