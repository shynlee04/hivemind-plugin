---
phase: SC-03
name: nextjs-16-standalone-app
verdict: PASS
date: 2026-06-03
checker: hm-plan-checker
confidence: HIGH (0.92)
---

# Phase SC-03: Next.js 16 Standalone App — Plan Check Verdict

**Verdict: ✅ PASS** — Plan is ready for execution. All 12 verification checks pass with minor observations.

---

## 12-Step Execution Flow — Per-Step Results

### Step 1: Read PLAN.md Frontmatter ✅

| Field | Value |
|-------|-------|
| Phase | SC-03 |
| Name | nextjs-16-standalone-app |
| Status | planned |
| Date | 2026-06-03 |
| Depends On | SC-01 (Foundation), SC-02 (REST API + Tool Proxy) — both COMPLETE |
| Blocks | SC-04, SC-05, SC-06, SC-07 |
| Waves | 5 (0-indexed: 0→4) |
| Total Files | 28 |
| LOC Estimate | ~2,430 |
| Key Risks | 5 listed (json-render API gap, standalone path resolution, Tailwind @source, SSE cleanup, port fallback) — all mitigated |

Frontmatter structure: complete with all required sections (phase metadata, dependencies, risk register).

---

### Step 2: Requirement Coverage ✅

**All 22 requirements from SPEC.md are traced to plan tasks.**

| Family | Count | Coverage | Status |
|--------|-------|----------|--------|
| UR-SC03-01 → UR-SC03-06 | 6 | T1.2, T1.6, T2.2, T2.4 | ✅ |
| ER-SC03-01 → ER-SC03-06 | 6 | T1.8, T1.9, T2.2 | ✅ |
| SR-SC03-01 → SR-SC03-03 | 3 | T1.8, T2.2, T2.5 | ✅ |
| OF-SC03-01 → OF-SC03-03 | 3 | T2.2, T1.9 | ✅ |
| UB-SC03-01 → UB-SC03-04 | 4 | T1.7, T4.4, T1.9 | ✅ |

**Coverage Expectations table** (PLAN.md lines 462-497) provides a comprehensive multi-source audit showing every REQ, GOAL, RESEARCH finding, and CONTEXT decision mapped to task IDs. This is exemplary — rare to see such thorough traceability in phase plans.

**13 ACs** also fully mapped in the AC→Test Mapping section (lines 501-515).

---

### Step 3: Goal-Backward Completeness ✅

**All 12 must-haves are traced backward to acceptance criteria and forward to executable tasks.**

| Must-Have | AC Ref | Artifact Path | Key Implementation Detail | Task Mapping |
|-----------|--------|---------------|---------------------------|--------------|
| App builds with standalone output | AC-SC03-01 | `sidecar/next.config.ts` | `output: "standalone"` | T1.2 |
| Plugin client discovers port + 17 typed methods | AC-SC03-02, AC-SC03-03 | `sidecar/src/lib/plugin-client.ts` | Reads `.hivemind/state/sidecar-port.json` | T1.6 |
| StateStore initializes from snapshot | AC-SC03-04 | `sidecar/src/lib/state-store.ts` | `plugin-client.snapshot()` → `createStateStore` | T1.8 |
| SSE client connects and dispatches events | AC-SC03-05 | `sidecar/src/lib/use-sse.ts` | EventSource → store.set(path, value) | T1.9 |
| Dashboard shell renders 4-panel grid | AC-SC03-06 | `sidecar/src/components/dashboard-shell.tsx` | 2×2 grid with tab navigation | T2.2 |
| json-render catalog defines 44 components | AC-SC03-07 | `sidecar/src/lib/catalog.ts` | `defineCatalog()` with 44 entries | T1.7 |
| Tab switch updates URL and visible panel | AC-SC03-08 | `sidecar/src/components/dashboard-shell.tsx` | `useSearchParams` / `useRouter` | T2.2 |
| Error boundary catches render errors | AC-SC03-09 | `sidecar/src/components/error-boundary.tsx` | `componentDidCatch` with fallback UI | T2.1 |
| Loading skeleton during dynamic import | AC-SC03-10 | `sidecar/src/app/loading.tsx` | `next/dynamic` with loading component | T2.5 |
| No plugin-side imports | AC-SC03-11 | All `sidecar/src/` files | grep returns empty | T4.4 |
| SSE reconnection with exponential backoff | AC-SC03-12 | `sidecar/src/lib/use-sse.ts` | Cleanup + reconnect timer | T1.9 |
| Renderer via `next/dynamic({ ssr: false })` | AC-SC03-13 | `sidecar/src/app/page.tsx` | `dynamic(() => import(...), { ssr: false })` | T2.4 |

**10 observable truths** (PLAN.md lines 31-41) are all falsifiable — each can be checked with an automated command or manual inspection.

---

### Step 4: Task Quality ✅

**All 27 tasks across 5 waves were validated:**

| Quality Dimension | Count | Pass Rate |
|-------------------|-------|-----------|
| Tasks with specific file paths | 27/27 | 100% |
| Tasks with clear, non-vague actions | 27/27 | 100% |
| Tasks with automated verify commands | 27/27 | 100% |
| Tasks with measurable done criteria | 27/27 | 100% |

**Verification Gates per wave** — each wave has its own Verification Gate table with 4-5 check commands and explicit pass conditions. This is a strong pattern.

**Examples of good task quality:**

- **T0.1**: Files=`sidecar/vitest.config.ts`, Action="Write vitest config targeting tests/ with jsdom...", Verify=`vitest run --config sidecar/vitest.config.ts`, Done="Config file exists and vitest discovers test files"
- **T1.6**: Files=`sidecar/src/lib/plugin-client.ts`, Action="Implement: port discovery from `.hivemind/state/sidecar-port.json`...", Verify="All 17 methods have typed signatures; unit tests pass", Done="Full SC-02 surface coverage"
- **T2.2**: Files=`sidecar/src/components/dashboard-shell.tsx`, Action="'use client' component with: tab navigation bar...", Verify="Tab switch test passes; URL sync test passes", Done="Dashboard shell complete"

No vague actions found. All verify commands are automatable (vitest, tsc, next build, grep).

---

### Step 5: Reachability ✅

**All 28 files from the File Inventory (PLAN.md lines 402-424) have a clear producing task.**

| File Category | Count | All Tasks Assigned? |
|---------------|-------|---------------------|
| Config files (package.json, next.config.ts, tsconfig, vitest.config) | 4 | ✅ All (T1.1-T1.3, T0.1) |
| Source files (types, constants, plugin-client, catalog, state-store, use-sse) | 6 | ✅ All (T1.4-T1.9) |
| CSS (globals.css) | 1 | ✅ (T1.10) |
| App pages (layout, page, loading, error) | 4 | ✅ (T2.3-T2.6) |
| Components (dashboard-shell, error-boundary) | 2 | ✅ (T2.1, T2.2) |
| Panel stubs (index + specs × 4) | 8 | ✅ (T3.1-T3.4) |
| Test files (8) | 8 | ✅ (T0.1-T0.8) |
| README | 1 | ✅ (T1.11) |

Each must-have artifact has at least one task producing it. No artifact is orphaned.

---

### Step 6: Scope Reduction ✅

**No scope-reduction language found.** Scanned for:
- "v1" — No use as a scope limiter ❌
- "simplified" — No occurrences ❌
- "hardcoded for now" — No occurrences ❌
- "placeholder" — Used correctly to denote stub panels with explicit deferral to downstream phases ✅

The plan explicitly documents **allowed surfaces** and **forbidden surfaces** for each wave, preventing scope creep. This is best practice.

---

### Step 7: Threat Model Presence ✅

**Threat model present** (PLAN.md lines 446-455) with:

| # | Threat | STRIDE Category | Impact | Mitigation |
|---|--------|-----------------|--------|------------|
| 1 | Unauthorized process reads port file | Information Disclosure | LOW | File in `.hivemind/state/` canonical surface |
| 2 | Plugin server unavailable | Denial of Service | MEDIUM | "Not available" state + 5s retry |
| 3 | SSE event flood | Denial of Service | LOW | 50-connection cap; reconnection limits |
| 4 | Cross-origin request from browser | Spoofing | LOW | localhost binding; no auth needed |
| 5 | Plugin restart → port file changes | Tampering | MEDIUM | Re-reads port file on HTTP error |

**Minor observation:** STRIDE coverage is 4/6 categories — missing **Repudiation** (R) and **Elevation of Privilege** (E). For a localhost-only GUI shell without auth, these are acceptably out of scope. Mitigations are concrete and task-linked.

**Additional security context from RESEARCH.md** (lines 236-251): ASVS categories V2 (no auth needed), V5 (partial input validation via SC-02), V8 (localhost traffic). All appropriate for scope.

---

### Step 8: Frontmatter Validation ✅

**Manual validation** (no dedicated PLAN frontmatter Zod schema exists in `src/schema-kernel/`):

| Field | Expected Type | Actual | Valid? |
|-------|--------------|--------|--------|
| `phase` | string | "SC-03" | ✅ |
| `name` | string | "nextjs-16-standalone-app" | ✅ |
| `status` | string | "planned" | ✅ |
| `date` | date string | "2026-06-03" | ✅ |
| `depends_on` | array | 2 entries | ✅ |
| `blocks` | array | 4 entries | ✅ |
| `waves` | number | 5 | ✅ |
| `total_files` | number | 28 | ✅ |
| `total_loc_estimate` | number | 2430 | ✅ |
| `key_risks` | array | 5 entries | ✅ |

**Observation:** `src/schema-kernel/` contains Zod schemas for agent frontmatter, command frontmatter, and skill metadata, but **no PLAN.md frontmatter schema**. This is a project-level gap, not a plan issue. The plan frontmatter is structurally sound by manual inspection.

**No empty requirements field** — automatic FAIL condition not triggered.

---

### Step 9: Decision Coverage ✅

**All 12 D-SC03-* decisions from CONTEXT.md are cited in the plan.**

| Decision ID | Context | Plan Citation | Status |
|-------------|---------|---------------|--------|
| D-SC03-01 | Next.js 16.2.2 upgrade | T1.1 | ✅ |
| D-SC03-02 | json-render ^0.19.0 packages | T1.1 | ✅ |
| D-SC03-03 | Single typed plugin-client module | T1.6 | ✅ |
| D-SC03-04 | Client component with tab-navigation | T2.2 | ✅ |
| D-SC03-05 | Pre-bundled catalog (not from /api/catalog) | T1.7 | ✅ |
| D-SC03-06 | StateStore via createStateStore | T1.8 | ✅ |
| D-SC03-07 | Custom SSE hook | T1.9 | ✅ |
| D-SC03-08 | Dynamic import for code splitting | T2.4, T3.1-T3.4 | ✅ |
| D-SC03-09 | Port file sentinel, fallback 3199 | T1.6 | ✅ |
| D-SC03-10 | npm package manager | T1.1 | ✅ |
| D-SC03-11 | Tailwind v4 @source for shadcn | T1.10 | ✅ |
| D-SC03-12 | TypeScript path aliases | T1.3 | ✅ |

All decisions are covered in the plan's Coverage Expectations table (PLAN.md lines 486-497). Each decision is implemented by at least one specific task.

---

### Step 10: Nyquist Validation Rate ✅

**AC-to-test mapping completes at 100% (13/13 ACs covered).**

| AC | Test File(s) | Verification Type | Automated? |
|----|-------------|-------------------|------------|
| AC-SC03-01 | Build check | Build | ✅ `next build` |
| AC-SC03-02 | `tests/plugin-client.test.ts` | Unit | ✅ vitest |
| AC-SC03-03 | `tests/plugin-client.test.ts` | Type guard | ✅ `tsc --noEmit` |
| AC-SC03-04 | `tests/state-store.test.ts` | Unit | ✅ vitest |
| AC-SC03-05 | `tests/use-sse.test.ts`, `tests/state-store.test.ts` | Unit | ✅ vitest |
| AC-SC03-06 | `tests/dashboard-shell.test.tsx` | Render | ✅ vitest |
| AC-SC03-07 | `tests/catalog.test.ts` | Unit | ✅ vitest |
| AC-SC03-08 | `tests/dashboard-shell.test.tsx` | Integration | ✅ vitest |
| AC-SC03-09 | `tests/error-boundary.test.tsx` | Render | ✅ vitest |
| AC-SC03-10 | `tests/loading.test.tsx` | Render | ✅ vitest |
| AC-SC03-11 | Grep check | Build | ✅ `grep -r "src/sidecar"` |
| AC-SC03-12 | `tests/use-sse.test.ts` | Unit | ✅ vitest |
| AC-SC03-13 | Code review | Manual | ⚠️ Manual |

**Sampling metrics:**
- Test files: 8 (each ~50 LOC = ~400 test LOC)
- Source LOC: ~2,430
- Test/source ratio: ~16.5% (healthy for a UI shell phase)
- REQs/test file: 2.75 (good density)
- Automated verification: 12/13 ACs (92.3% automated)

**Observation:** AC-SC03-13 (Renderer SSR disabled) is manual code review only — no automated test. This is acceptable as it's a single-line config check that's trivially verifiable by inspection.

---

### Step 11: ASVS Security Controls ✅

**ASVS categories evaluated (per RESEARCH.md):**

| Category | Applies | Control in Plan | Status |
|----------|---------|-----------------|--------|
| V2 Authentication | NO (localhost-only) | N/A — localhost binding is security boundary | ✅ Appropriate |
| V5 Input Validation | PARTIAL | SC-02 validates inputs; SC-03 is typed client | ✅ Appropriate |
| V8 Data Protection | PARTIAL | All traffic is localhost HTTP | ✅ Appropriate |

**Plan security measures:**
1. Port file in `.hivemind/state/` canonical surface (anti-tamper by convention) ✅
2. "Not available" state with 5s retry for plugin downtime ✅
3. SSE 50-connection cap (inherited from SC-01) + reconnection limits ✅
4. localhost:3099 binding (no external exposure) ✅
5. Port file re-read on HTTP error (handles plugin restart) ✅

**No legacy `gsd-sdk` commands referenced** in any plan task. ✅

Controls are appropriate for the localhost-only GUI shell scope. No security gaps identified.

---

### Step 12: Verdict Summary

| Check | Result | Score |
|-------|--------|-------|
| 1. Frontmatter read | ✅ PASS | 1.0 |
| 2. Requirement coverage | ✅ PASS | 1.0 |
| 3. Goal-backward completeness | ✅ PASS | 1.0 |
| 4. Task quality | ✅ PASS | 1.0 |
| 5. Reachability | ✅ PASS | 1.0 |
| 6. Scope reduction | ✅ PASS | 1.0 |
| 7. Threat model | ✅ PASS | 0.85 |
| 8. Frontmatter validation | ✅ PASS | 0.95 |
| 9. Decision coverage | ✅ PASS | 1.0 |
| 10. Nyquist validation rate | ✅ PASS | 0.95 |
| 11. ASVS security controls | ✅ PASS | 1.0 |
| **Overall** | **✅ PASS** | **0.97** |

**Confidence Score: HIGH (0.92)**

---

## Decision Coverage Table (All 12 D-SC03-*)

| Decision ID | Title | Plan Coverage | Mapped Tasks | Status |
|-------------|-------|---------------|--------------|--------|
| D-SC03-01 | Next.js 16.2.2 upgrade | Coverage Expectations §CONTEXT | T1.1 | ✅ Covered |
| D-SC03-02 | json-render ^0.19.0 packages | Coverage Expectations §CONTEXT | T1.1 | ✅ Covered |
| D-SC03-03 | Single typed plugin-client | Coverage Expectations §CONTEXT | T1.6 | ✅ Covered |
| D-SC03-04 | Client component with tab-nav | Coverage Expectations §CONTEXT | T2.2 | ✅ Covered |
| D-SC03-05 | Pre-bundled catalog | Coverage Expectations §CONTEXT | T1.7 | ✅ Covered |
| D-SC03-06 | StateStore via createStateStore | Coverage Expectations §CONTEXT | T1.8 | ✅ Covered |
| D-SC03-07 | Custom SSE hook | Coverage Expectations §CONTEXT | T1.9 | ✅ Covered |
| D-SC03-08 | Dynamic import for code splitting | Coverage Expectations §CONTEXT | T2.4, T3.1-T3.4 | ✅ Covered |
| D-SC03-09 | Port file sentinel, fallback 3199 | Coverage Expectations §CONTEXT | T1.6 | ✅ Covered |
| D-SC03-10 | npm package manager | Coverage Expectations §CONTEXT | T1.1 | ✅ Covered |
| D-SC03-11 | Tailwind v4 @source for shadcn | Coverage Expectations §CONTEXT | T1.10 | ✅ Covered |
| D-SC03-12 | TypeScript path aliases | Coverage Expectations §CONTEXT | T1.3 | ✅ Covered |

---

## Minor Observations (Non-Blocking)

1. **Missing PLAN frontmatter Zod schema in kernel** — `src/schema-kernel/` has schemas for agents, commands, and skills but no PLAN.md schema. Consider adding a generic `plan-frontmatter.schema.ts` for programmatic validation across all phase plans.

2. **Threat model covers 4/6 STRIDE categories** — Repudiation and Elevation of Privilege are absent, but acceptable for a localhost-only GUI shell without auth.

3. **AC-SC03-13 is manual-only** — The `ssr: false` check on dynamic import lacks an automated test. Consider adding a simple unit test that asserts the import options object contains `{ ssr: false }`.

4. **Wave 0 test files listed with "All tests are RED" as done criteria** — This is the correct TDD red-phase pattern, but implementation must ensure these tests actually exist and produce false results (not just pass vacuously).

---

## Gap Report

**No gaps found.** All 12 checks pass. The PLAN.md is exceptionally well-structured with:
- Clear goal-backward traceability from observable truths → must-haves → ACs → tasks
- Per-wave allowed/forbidden surface boundaries
- Comprehensive Coverage Expectations table (7 GOALs, 22 REQs, 5 RESEARCH, 12 CONTEXT decisions)
- AC→Test mapping with verification commands
- Threat model with STRIDE categorization
- Risk register with mitigations and owner assignments
- File Inventory with LOC budgets and AC coverage
- Verification gates per wave with concrete pass conditions
- Stop conditions for early termination
- Atomic commit messages for each wave

---

## Summary

```
╔══════════════════════════════════════════════════════════════╗
║               PLAN CHECK VERDICT: ✅ PASS                    ║
╠══════════════════════════════════════════════════════════════╣
║ Phase: SC-03 — Next.js 16 Standalone App                    ║
║ Checker: hm-plan-checker                                    ║
║ Date: 2026-06-03                                            ║
║ Confidence: HIGH (0.92)                                     ║
║                                                            ║
║ All 12 checks PASS. Plan is ready for execution.            ║
║ 27 tasks across 5 waves. 28 files, ~2,430 LOC.             ║
║ 22 REQs → 13 ACs → 8 test files → all mapped.              ║
║ 12 D-SC03-* decisions → all cited.                         ║
║                                                            ║
║ No gaps found. 4 minor observations (non-blocking).         ║
╚══════════════════════════════════════════════════════════════╝
```
