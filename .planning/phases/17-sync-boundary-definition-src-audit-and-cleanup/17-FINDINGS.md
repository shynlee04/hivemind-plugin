---
phase: 17
plan: 01
created: 2026-05-20
status: discovery-complete
---

# Phase 17 Findings Report

**Discovery-only audit of src/shared/, src/config/, and src/routing/**
**Completed:** 2026-05-20

---

## Plan 01 Findings: shared/, config/, routing/

### Executive Summary

Audited **32 files** across **3 modules** totaling **4,412 LOC**. No dead code found. No architecture violations found. Key findings are primarily about test coverage accuracy and minor file categorization. The RESEARCH.md claims of "ZERO test coverage" for routing are **incorrect** — routing has 9 dedicated test files.

| Module | Files | LOC | Dead | Noise | Context-Rot | Test-Gaps |
|--------|-------|-----|------|-------|-------------|-----------|
| src/shared/ | 14 | 1,978 | 0 | 0 | 0 | 3 (minor) |
| src/config/ | 7 | 1,092 | 0 | 0 | 0 | 0 |
| src/routing/ | 11 | 1,342 | 0 | 2 (barrels) | 0 | 0 |
| **Total** | **32** | **4,412** | **0** | **2** | **0** | **3** |

---

### Finding S-01: `src/shared/` — All files CLEAN with active importers

- **Module:** `src/shared/`
- **Classification:** All 14 files are CLEAN
- **Evidence:** Every file has at least 1 external importer across `src/`. `types.ts` has 21 importers (heaviest), `helpers.ts` has 11, `session-api.ts` has 32. All files contain real logic (no stubs).
- **Details per file:**
  - `types.ts` (381 LOC) — Canonical type contracts. Re-exports delegation and workflow types for backward compatibility (documented, intentional). CLEAN.
  - `helpers.ts` (295 LOC) — Utility functions. 11 importers. CLEAN.
  - `session-api.ts` (311 LOC) — SDK wrappers. 32 importers (most imported shared file). CLEAN.
  - `state.ts` (251 LOC) — In-memory TaskStateManager singleton. 7 importers. CLEAN.
  - `runtime-policy.ts` (236 LOC) — Policy loading and validation. 4 importers. CLEAN.
  - `runtime.ts` (95 LOC) — **Not a stub.** Contains `inferContinuityStatusFromEvent()` with real logic. 5 importers. CLEAN.
  - `security/path-scope.ts` (105 LOC) — Path traversal prevention. 9 importers. CLEAN.
  - `security/redaction.ts` (118 LOC) — Text/field redaction. 4 importers. CLEAN.
  - `tool-response.ts` (71 LOC) — Tool response envelope. 21 importers. CLEAN.
  - `workspace-runtime-policy.ts` (38 LOC) — Policy file reader. 1 importer (plugin.ts). CLEAN.
  - `app-api.ts` (24 LOC) — Agent registry reader. 2 importers. CLEAN.
  - `task-status.ts` (22 LOC) — Status transitions. 1 importer. CLEAN.
  - `tool-helpers.ts` (9 LOC) — Single render function. 21 importers. CLEAN.
  - `plugin-tool-output-summary.ts` (22 LOC) — Output summarizer. 1 importer (plugin.ts). CLEAN.
- **Architecture Compliance:** No violations. No deep imports from shared/ into deeper modules (the re-exports in types.ts go the other direction: deeper modules' types are re-exported by shared/types.ts, not imported by shared/).
- **Special investigations:**
  - `asString` duplication: **RESOLVED** — only one definition exists in `helpers.ts`. The continuity.ts duplicate has been removed.
  - `runtime.ts`: **NOT a stub** — 95 LOC with real `inferContinuityStatusFromEvent()` logic.
  - No `toggle-gates.ts` in shared/ (that file is in `src/hooks/transforms/`, a different module).

---

### Finding S-02: Minor test-coverage gaps in `src/shared/` (3 files)

- **Category:** `test-gap`
- **Severity:** `LOW`
- **Module:** `src/shared/`
- **Files with no dedicated test imports:**
  1. `tool-response.ts` (71 LOC) — No test file directly imports it. 21 source importers. Tested indirectly through tool tests.
  2. `task-status.ts` (22 LOC) — No test file directly imports it. 1 source importer. Tiny file, low risk.
  3. `tool-helpers.ts` (9 LOC) — No test file directly imports it. 21 source importers. Trivial single function.
- **Evidence:** `find tests -name "*.test.ts" | xargs grep -l "from.*shared/tool-response"` returns empty. Same for task-status and tool-helpers.
- **Recommendation:** Ad-hoc test addition (Phase 18). Low priority given file sizes and indirect coverage through tool tests.

---

### Finding S-03: `src/config/` — All files CLEAN with good test coverage

- **Module:** `src/config/`
- **Classification:** All 7 files are CLEAN
- **Evidence:**
  - `compiler.ts` (410 LOC) — Well under the 500 LOC cap (RESEARCH.md claim of "~500 LOC" was inaccurate). Real config compilation logic. 1 external importer.
  - `subscriber.ts` (97 LOC) — Lazy config cache. 6 importers (includes tools, plugin.ts). Active, not a stub.
  - `workflow/index.ts` (43 LOC) — Barrel export. CLEAN.
  - `workflow/workflow-types.ts` (53 LOC) — Types. 3 importers. CLEAN.
  - `workflow/workflow-state.ts` (185 LOC) — State machine. 0 direct external importers but consumed through workflow/index.ts barrel. CLEAN.
  - `workflow/workflow-guards.ts` (122 LOC) — Guard conditions. 0 direct external importers but consumed through barrel. CLEAN.
  - `workflow/workflow-persistence.ts` (182 LOC) — State persistence. 0 direct external importers but consumed through barrel. CLEAN.
- **Test coverage:** Excellent — 7 dedicated test files: `tests/lib/config-compiler.test.ts`, `tests/lib/config-subscriber.test.ts`, `tests/lib/config-workflow/workflow-e2e.test.ts`, `tests/lib/config-workflow/workflow-guards.test.ts`, `tests/lib/config-workflow/workflow-persistence.test.ts`, `tests/lib/config-workflow/workflow-regression.test.ts`, `tests/lib/config-workflow/workflow-state.test.ts`.
- **Architecture Compliance:** No violations. Follows CQRS patterns. No state in `.opencode/`.

---

### Finding S-04: `src/config/compiler.ts` — Size verified under 500 LOC cap

- **Category:** N/A (negative finding — no issue)
- **Module:** `src/config/`
- **File:** `src/config/compiler.ts`
- **Evidence:** Actual LOC = 410 (verified via `wc -l`). RESEARCH.md claimed "~500" which was overstated by ~90 lines.
- **Recommendation:** No action needed.

---

### Finding S-05: `src/routing/` — INCORRECT RESEARCH CLAIM of zero test coverage

- **Category:** N/A (correction to RESEARCH.md)
- **Severity:** N/A
- **Module:** `src/routing/`
- **Evidence:** The RESEARCH.md states "NO TESTS" for routing. This is **incorrect**. Routing has **9 dedicated test files**:
  1. `tests/lib/session-entry/intake-gate.test.ts`
  2. `tests/lib/session-entry/language-resolution.test.ts`
  3. `tests/lib/session-entry/profile-resolver.test.ts`
  4. `tests/lib/session-entry/purpose-classifier.test.ts`
  5. `tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts`
  6. `tests/lib/command-engine/command-engine.test.ts`
  7. `tests/hooks/observers/session-entry-consumer.test.ts` (integration)
  8. `tests/tools/hivemind-command-engine.test.ts` (integration)
  9. `tests/features/session-tracker/journey-recording-routing.test.ts` (integration)
- **Root cause:** Tests live under `tests/lib/session-entry/`, `tests/lib/command-engine/`, and `tests/lib/behavioral-profile/` — paths that don't contain "routing" so `find tests | grep routing` missed them.
- **Recommendation:** Update RESEARCH.md claim for Phase 18. No additional test work needed for routing — coverage is adequate.

---

### Finding S-06: `src/routing/session-entry/index.ts` and `src/routing/behavioral-profile/index.ts` are barrel re-export files

- **Category:** `noise` (minor)
- **Severity:** `LOW`
- **Module:** `src/routing/`
- **Files:**
  1. `src/routing/session-entry/index.ts` — 23 LOC, 8 re-exports. No real logic.
  2. `src/routing/behavioral-profile/index.ts` — 29 LOC, 3 re-exports. No real logic.
- **Description:** Both files are standard TypeScript barrel re-exports. This is a common pattern providing clean public API surfaces for each submodule. Classified as minimal `noise` per D-02, but this is expected/acceptable noise — not actionable.
- **Evidence:** `grep -c "^export " src/routing/session-entry/index.ts` = 8 export lines, no function/class definitions. Same pattern for behavioral-profile/index.ts.
- **Recommendation:** No action needed. Barrels are standard TypeScript practice and provide clean API boundaries.

---

### Finding S-07: `src/routing/command-engine/` — Active, tested, CLEAN

- **Category:** CLEAN
- **Module:** `src/routing/`
- **File:** `src/routing/command-engine/index.ts` (223 LOC)
- **Evidence:** Wired in `src/plugin.ts` line 414 as `hivemind-command-engine` tool. Actively consumed by `src/tools/hivemind/hivemind-command-engine.ts`. Has dedicated test file `tests/lib/command-engine/command-engine.test.ts`. Not a stub.
- **Recommendation:** No action needed.

---

### Finding S-08: RESEARCH.md filename error — `profile.ts` should be `profiles.ts`

- **Category:** N/A (documentation error)
- **Severity:** `LOW`
- **Module:** `src/routing/behavioral-profile/`
- **Description:** RESEARCH.md lists the file as `profile.ts` but the actual file is `profiles.ts` (with an 's'). The Research module summary had an inaccurate filename.
- **Recommendation:** Correct filename in any generated reports. Trivial fix.

---

### Finding S-09: All barrelled submodule files in config/workflow/ have zero direct external importers

- **Category:** `noise` (documentational)
- **Severity:** `LOW`
- **Module:** `src/config/`
- **Files:** `workflow/workflow-state.ts`, `workflow/workflow-guards.ts`, `workflow/workflow-persistence.ts`
- **Description:** These 3 files have 0 external importers outside their submodule because consumers import through `config/workflow/index.ts`. This is expected barrel behavior — not an issue. They ARE consumed (tests prove this).
- **Evidence:** `grep -rn "from.*config/workflow/workflow-state" --include="*.ts" src/` returns only references within the workflow submodule itself.
- **Recommendation:** No action needed. Standard barrel pattern.

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Files audited | 32 |
| Total LOC audited | 4,412 |
| Dead files found | 0 |
| Noise files found | 2 (acceptable barrel files) |
| Context-rot files found | 0 |
| Test gaps found | 3 (minor, all in shared/) |
| Architecture violations | 0 |
| RESEARCH.md corrections | 3 (routing test coverage, compiler.ts LOC, profile filename) |

---

*End of Plan 01 findings*
