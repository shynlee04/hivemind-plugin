---
phase: SC-03-nextjs-app
status: framework_complete_with_stub_panels
verified: 2026-06-06
truth_level: L5_documentation (honest assessment of what was actually built)
supersedes: SC-03-SUMMARY.md (which marked status as "completed" — that was misleading)
author: hm-roadmapper (Wave 1 of sidecar-honest-rebaseline-2026-06-06)
---

# SC-03: Next.js 16 Standalone App — FRAMEWORK-ONLY STATUS (Honest Assessment)

**Phase:** SC-03-nextjs-app
**Date:** 2026-06-06
**Author:** hm-roadmapper (Wave 1 of `sidecar-honest-rebaseline-2026-06-06`)
**Status:** ⚠️ **FRAMEWORK COMPLETE — Panel implementations are STUBS**

---

## What SC-03 ACTUALLY Delivered (L3 evidence)

| Component | Status | Evidence |
|-----------|--------|----------|
| Next.js 16 standalone config | ✅ Done | `sidecar/next.config.ts:13-37` (`output: "standalone"`, turbopack.root, CJS module.exports) |
| Dashboard shell with 4-tab nav | ✅ Done | `sidecar/src/components/dashboard-shell.tsx:33-214` (URL `?panel=` param, useSse hook) |
| 4 panel imports resolve correctly | ✅ Done | `sidecar/src/lib/constants.ts:46-86` (panel IDs match directory names: `session-explorer`, `delegation-dashboard`, `mems-browser`, `control-panel`) |
| 4 panel files exist with default exports | ✅ Done | `sidecar/src/panels/{session-explorer,delegation-dashboard,mems-browser,control-panel}/index.tsx` |
| 70 unit tests pass | ✅ Done | `npx vitest run` in `sidecar/` = 70/70 (per `sidecar-panel-render-fix-2026-06-06` Wave 1 summary §7.2) |
| `npm run dev` returns HTTP 200 | ✅ Done | Smoke test: `curl http://127.0.0.1:3099/` returns 200, no import errors (per `sidecar-flaws-fix-2026-06-06` summary §L1) |
| TypeScript strict mode | ✅ Done | `sidecar/tsconfig.json` strict: true, no type errors |
| TDD scaffolding (catalog, panel, plugin-client tests) | ✅ Done | `sidecar/tests/catalog.test.ts`, etc. |
| `next/dynamic` SSR issue (Fix 1) | ✅ Done | `sidecar/src/app/page-wrapper.tsx` (Client Component boundary holds `ssr: false`) |
| Panel ID ↔ directory mismatch (Fix 2) | ✅ Done | `sidecar/src/lib/constants.ts:38-86` (IDs now match directory names) |
| Infinite re-import loop (Fix 3) | ✅ Done | `sidecar/src/components/dashboard-shell.tsx:14,46-89` (useRef guard, error fallback) |
| `hivemind-session-view.ts:39` discarded result (GAP-01) | ✅ Done | `sidecar/src/sidecar/server/tool-proxy/handlers/hivemind-session-view.ts:40-72` (per `sidecar-completeness-2026-06-06` Wave 1) |

## What SC-03 Did NOT Deliver (L3 evidence — code shows stubs)

| Gap | File | What it shows | What it should show |
|-----|------|---------------|---------------------|
| Session Explorer: fake sessions | `sidecar/src/panels/session-explorer/index.tsx` (header 28-43) | Hardcoded `ses_1`, `ses_2`, `ses_3` with fake statuses (active/running/pending) | Real session tree from `stateStore.snapshot()` |
| Delegation Dashboard: fake delegations | `sidecar/src/panels/delegation-dashboard/index.tsx` (counters + agent list 33-60) | Hardcoded `hm-researcher`, `hm-planner`, `hm-executor`; Active: 3, Completed: 12 | Real delegation list from `delegationManager` via SC-02 handlers |
| MEMS Browser: fake trajectory | `sidecar/src/panels/mems-browser/index.tsx` (Tier 3 + P25/P26 25-50) | Hardcoded `P25`, `P26` trajectory entries; "Tier 3: 3" | Real trajectory data via `trajectory.inspect()` |
| Control Panel: fake status | `sidecar/src/panels/control-panel/index.tsx` (status indicator 30-44) | Hardcoded "Plugin Server — Connected" (green dot) | Real SSE connection status from `useSse` hook (`{ connected: false }` in offline tests) |
| `next build` production output | `sidecar/.next/standalone/server.js` | NOT EXISTS | `.next/standalone/server.js` from `npx next build` (GAP-08) |
| Real SSE-to-UI data flow | `sidecar/src/components/dashboard-shell.tsx:39-41` | `useSse` hook called, but panels don't subscribe to its data; the `onSseEvent` callback is not wired to the panels | Panels read from `stateStore`; `useSse` should dispatch events into `stateStore.handleEvent()` |
| 5 of 7 tool handlers are stubs (SC-02 cross-cuts) | `sidecar/src/sidecar/server/tool-proxy/handlers/{delegation-status,execute-slash-command,hivemind-trajectory,hivemind-command-engine}.ts` | All return fake/empty data per C7 audit §4.1 | Real tool proxy that calls C3 (delegation) and C5 (tools) backends |
| Integration tests for routes/tool-proxy | `tests/sidecar/server/{routes,tool-proxy}/` | ZERO test files (GAP-11 per C7 audit §7.11) | Full test coverage of 4 GET + 7 POST routes + 7 tool handlers |

## Why SC-03 Was Marked "Complete" But Wasn't (L5 governance gap)

The original `SC-03-SUMMARY.md` (2026-06-03) marked status as ✅ COMPLETE based on:
- 5 atomic commits delivered (`5e289771`, `162d0e3a`, `3d26f70e`, `23ffbc64`, `42f99195`)
- Typecheck clean
- 5/41 tests pass (RED-phase scaffolds expected to fail — TDD discipline accepted)
- `next build` not run (deferred to SC-04/SC-07 per the SUMMARY)

**What was missed:**
1. **The 4 panels were stubs from day 1** — but the SUMMARY framed them as "intentional SC-04+ work" (lines 226-233), not as "SC-03 deliverable gap". The delegation packet's claim that the SUMMARY "marked status as complete" was technically true: `self-check` was ✅ PASS, but only because the existence-of-file check passed. The 4 panel stubs were accepted as forward work, not acknowledged as a deliverable gap.
2. **The dashboard-shell design used `display: none` for non-active panels** — making it look like 1 panel rendered when actually 4 existed (3 hidden). User screenshot 2026-06-06 revealed only the default panel (`session-explorer`) was visible, masking the fact that 3 others were stubs.
3. **The TDD RED-phase scaffolds were never iterated to GREEN** — they were "expected to fail" per the SUMMARY, but the implementation that came later used different export names (e.g. `PluginClient` vs `createPluginClient`). The 32 RED-scaffold tests were not closed.

## 3 Fix-Tracks After 2026-06-03 (L1-L3 evidence)

| Track | Date | What it fixed | What it did NOT fix |
|-------|------|---------------|---------------------|
| `sidecar-flaws-fix-2026-06-06` | 2026-06-06 | Next.js 16 dev-server (3 flaws): `ssr: false` in Server Component, `server` config key, tsconfig auto-modify. 4 atomic commits, dev-server HTTP 200 | Stubs, framework, real data |
| `sidecar-completeness-2026-06-06` Wave 1 | 2026-06-06 | CRITICAL GAP-01: `hivemind-session-view.ts:39` discarded result. Retroactive SC-02 SUMMARY documenting 4 other stub handlers | 4 other stub handlers (GAP-02..05), stub panels, real data |
| `sidecar-panel-render-fix-2026-06-06` Wave 1 | 2026-06-06 | Panel ID mismatch (constants.ts), infinite re-import loop (useRef guard), silent error fallback | Stub data inside panels, `display: none` UX, real data |

**After all 3 tracks, what is true:**
- ✅ Framework works (Next.js 16 dev, dashboard, 4 panel imports)
- ❌ All 4 panels still show FAKE data (hardcoded stubs)
- ❌ Only 1 panel visually rendered (others are `display: none` for non-active)
- ❌ Plugin server runtime not verified (sandbox tests only — `npm run dev` works but plugin server not exercised end-to-end in the fix tracks)
- ❌ 5 of 7 SC-02 tool handlers return fake data (per C7 audit §4.1)

## Path Forward (Cross-references)

- **Honest re-baseline session:** `.hivemind/planning/sidecar-honest-rebaseline-2026-06-06/`
- **C7 audit (12 gaps):** `.planning/phases/AUDIT-03-deep-inventories/03-C7-INVENTORY-ASSET.md`
- **SC-04 GSD setup (next step):** Wave 2 of `sidecar-honest-rebaseline-2026-06-06`
- **SC-02 stub handlers (GAP-02..05):** Wave 2 of `sidecar-completeness-2026-06-06` (paused)
- **Decision entry D-SIDECAR-STATUS-TRUTH-01:** `.planning/STATE.md` Decisions Record (NEW 2026-06-06)

## Self-Check

- [x] All 3 docs updated atomically
- [x] Honest assessment, no false claims
- [x] Cross-references to all 3 prior wave sessions
- [x] Truth table (delivered vs not delivered) with file:line evidence
- [x] Path forward identified
- [x] Supersession of `SC-03-SUMMARY.md` is explicit (SUMMARY retained for historical reference)

---
*This document is the source of truth for SC-03 status. Supersedes the optimistic `SC-03-SUMMARY.md` (2026-06-03) which marked "complete" without acknowledging stub panels. The SUMMARY remains on disk for historical reference.*
