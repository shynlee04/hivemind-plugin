---
phase: 11
slug: 11-runtime-context-detox-and-plugin-flattening
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-19
---

# Phase 11 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node test runner (`tsx --test`) |
| **Config file** | `package.json` |
| **Quick gate** | `npx tsc --noEmit` |
| **Targeted test command** | `npx tsx --test <task-specific test files> -x` |
| **Full suite command** | `npx tsc --noEmit && npm run typecheck:core && npm test` |
| **Target task feedback** | ~5-20 seconds |
| **Wave feedback** | ~45 seconds |

---

## Sampling Rate

- **After every code-changing task:** Run `npx tsc --noEmit`, then only the task's targeted `tsx --test ... -x` command.
- **After every wave:** Run `npx tsc --noEmit && npm run typecheck:core` plus the wave's combined targeted tests.
- **Before `/gsd-verify-work`:** Run `npx tsc --noEmit && npm run typecheck:core && npm test`
- **Max task-level latency:** ~20 seconds for targeted checks

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 11-01-01 | 01 | 1 | P11-06 audit all conditional targets | evidence | `npx tsc --noEmit && rg -n "runtime-plan|surface-registry|create-core-hooks|plugin-types|runtime-invocation|turn-output|lifecycle-spine|runtime-bridge|context-injection|prompt-transformation|plugin-handlers|hooks/start-work/(purpose-classifier|lineage-router|readiness-gates|session-state|start-work-types)" src tests` | ⬜ pending |
| 11-01-02 | 01 | 1 | P11-06 replace false baselines | unit | `npx tsc --noEmit && npx tsx --test tests/plugin-assembly-smoke.test.ts tests/plugin-runtime.test.ts tests/runtime-hook-hierarchy.test.ts tests/runtime-tools.test.ts tests/plugin-context-detox.test.ts -x` | ⬜ pending |
| 11-02-01 | 02 | 2 | P11-01, P11-02, P11-03 helper contracts | unit | `npx tsc --noEmit && npx tsx --test tests/plugin-runtime.test.ts tests/plugin-context-detox.test.ts -x` | ⬜ pending |
| 11-02-02 | 02 | 2 | P11-03, P11-04, P11-05 plugin flattening | integration | `npx tsc --noEmit && npx tsx --test tests/plugin-assembly-smoke.test.ts tests/plugin-runtime.test.ts tests/plugin-context-detox.test.ts -x` | ⬜ pending |
| 11-03-01 | 03 | 2 | P11-06 relocate start-work consumers | unit | `npx tsc --noEmit && rg -n "hooks/start-work/(purpose-classifier|lineage-router|readiness-gates|session-state|start-work-types)|features/session-entry/start-work-types" src/shared/opencode-knowledge.ts src/recovery/recovery-types.ts src/intelligence/doc/doc-surface-router.ts src/features/runtime-entry/attachment.ts src/core/trajectory/trajectory-types.ts src/control-plane/control-plane-types.ts src/control-plane/control-plane-registry.ts src/commands/slash-command/command-types.ts` | ⬜ pending |
| 11-04-01 | 04 | 2 | P11-06 feature-owned runtime-entry loader | integration | `npx tsc --noEmit && npx tsx --test tests/runtime-entry-contract.test.ts -x` | ⬜ pending |
| 11-05-01 | 05 | 3 | P11-06 relocate preserved control-plane and slash-command consumers | integration | `npx tsc --noEmit && npx tsx --test tests/control-plane-runtime-tools.test.ts -x` | ⬜ pending |
| 11-06-01 | 06 | 4 | P11-06 delete plugin orchestration helpers by proof | unit | `npx tsc --noEmit && rg -n "runtime-plan|surface-registry|create-core-hooks|plugin-types" src/plugin src/index.ts` | ⬜ pending |
| 11-06-02 | 06 | 4 | P11-06 prune plugin export surface | unit | `npx tsc --noEmit && rg -n "runtime-plan|surface-registry|create-core-hooks" src/plugin/index.ts src/index.ts` | ⬜ pending |
| 11-07-01 | 07 | 5 | P11-06 resolve shared runtime-invocation + turn-output | unit | `npx tsc --noEmit && rg -n "runtime-invocation|turn-output" src tests` | ⬜ pending |
| 11-07-02 | 07 | 5 | P11-06 resolve lifecycle-spine | unit | `npx tsc --noEmit && rg -n "lifecycle-spine" src tests` | ⬜ pending |
| 11-08-01 | 08 | 5 | P11-06 resolve plugin-handlers family | unit | `npx tsc --noEmit && rg -n "plugin-handlers" src tests` | ⬜ pending |
| 11-09-01 | 09 | 6 | P11-06 resolve runtime-bridge/context-injection/prompt-transformation wrappers | unit | `npx tsc --noEmit && rg -n "hooks/(context-injection|prompt-transformation|runtime-bridge)" src tests` | ⬜ pending |
| 11-10-01 | 10 | 3 | P11-06 resolve start-work shim deletions | unit | `npx tsc --noEmit && rg -n "hooks/start-work/(purpose-classifier|lineage-router|readiness-gates|session-state|start-work-types)" src tests` | ⬜ pending |
| 11-11-01 | 11 | 7 | P11-07 preserved-boundary proof suite | integration | `npx tsc --noEmit && npx tsx --test tests/runtime-tools.test.ts tests/runtime-entry-contract.test.ts tests/control-plane-runtime-tools.test.ts tests/schema-kernel-contracts.test.ts tests/runtime-authority-live-sanity.test.ts -x` | ⬜ pending |
| 11-11-02 | 11 | 7 | P11-07 final green phase gate | integration | `npx tsc --noEmit && npm run typecheck:core && npm test` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave Gates

| Wave | Plans | Combined Gate |
|------|-------|---------------|
| 1 | 11-01 | `npx tsc --noEmit && npx tsx --test tests/plugin-assembly-smoke.test.ts tests/plugin-runtime.test.ts tests/runtime-hook-hierarchy.test.ts tests/runtime-tools.test.ts tests/plugin-context-detox.test.ts -x` |
| 2 | 11-02, 11-03, 11-04 | `npx tsc --noEmit && npx tsx --test tests/plugin-assembly-smoke.test.ts tests/plugin-runtime.test.ts tests/plugin-context-detox.test.ts tests/runtime-entry-contract.test.ts -x` |
| 3 | 11-05, 11-10 | `npx tsc --noEmit && npx tsx --test tests/control-plane-runtime-tools.test.ts tests/runtime-entry-contract.test.ts -x` |
| 4 | 11-06 | `npx tsc --noEmit && npm run typecheck:core` |
| 5 | 11-07, 11-08 | `npx tsc --noEmit && npm run typecheck:core` |
| 6 | 11-09 | `npx tsc --noEmit && npm run typecheck:core` |
| 7 | 11-11 | `npx tsc --noEmit && npm run typecheck:core && npm test` |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| None | P11 corrective phase | All target behaviors have automated verification. | Run the task-level or wave gate commands above. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Faster task-level sampling replaces the old one-command-for-everything loop
- [x] No watch-mode flags
- [x] `npx tsc --noEmit` is present in task-level or wave-level gates
- [ ] Final phase gate green after execution

**Approval:** pending
