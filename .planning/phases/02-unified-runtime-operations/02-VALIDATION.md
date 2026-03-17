---
phase: 02
slug: unified-runtime-operations
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-18
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node:test` + `tsx --test` for the Node package; `bun test` for the Bun/OpenTUI app |
| **Config file** | `package.json` for Node package; `apps/opentui/package.json` after Wave 0 bootstrap |
| **Quick run command** | `tsx --test tests/control-plane-runtime-tools.test.ts` |
| **Full suite command** | `npm test && bun test apps/opentui` |
| **Estimated runtime** | ~20-30 seconds for smoke lane; ~60 seconds for full suite |

---

## Sampling Rate

- **After every task commit:** Run `tsx --test tests/control-plane-runtime-tools.test.ts`
- **After every app-boundary task commit (once `apps/opentui` exists):** Run `bun test apps/opentui/tests/runtime-status.test.tsx`
- **After every plan wave:** Run `npm test && bun test apps/opentui`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds for smoke lane, 60 seconds for full wave gate

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-00-01 | 00 | 1 | CTRL-03 | app/integration | `bun test apps/opentui` | ❌ W0 | ⬜ pending |
| 02-01-01 | 01 | 2 | CTRL-03 | integration | `tsx --test tests/runtime-tools.test.ts tests/control-plane-runtime-tools.test.ts` | ✅ | ⬜ pending |
| 02-02-01 | 02 | 3 | CTRL-04 | integration | `tsx --test tests/harness-command.test.ts tests/control-plane-runtime-tools.test.ts tests/runtime-entry-contract.test.ts` | ✅ | ⬜ pending |
| 02-03-01 | 03 | 4 | INSP-03 | integration | `tsx --test tests/runtime-inspection-seam.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/opentui/package.json` — Bun app boundary and scripts
- [ ] `apps/opentui/tsconfig.json` — isolated Bun/OpenTUI compile settings
- [ ] `apps/opentui/src/main.tsx` — real OpenTUI bootstrap entry
- [ ] `apps/opentui/src/views/runtime-status.tsx` — minimal runtime-status view over shared contracts
- [ ] `apps/opentui/tests/runtime-status.test.tsx` — Bun app contract consumption tests
- [ ] `tests/runtime-inspection-seam.test.ts` — workflow summary and recent-event read-model coverage
- [ ] `bun` installation verified with `bun --version`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Minimal OpenTUI runtime-status view renders authoritative backend data | CTRL-03 | Terminal rendering smoke path is still best verified interactively after automated gates | Run the `apps/opentui` app against a healthy local runtime and confirm the status view shows runtime authority, server URL, and workflow summary from backend data only |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Smoke feedback lane targets < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
