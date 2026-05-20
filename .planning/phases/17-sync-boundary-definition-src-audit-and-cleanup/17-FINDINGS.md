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

---

## Plan 02 Findings: schema-kernel/, tools/, hooks/

### Executive Summary

Audited **66 files** across **3 modules** totaling **8,019 LOC**. Found **3 dead code files** (permission.schema.ts, tool-definition.schema.ts, toggle-gates.ts). Major correction to RESEARCH.md: **prompt sub-tools DO have tests** (contrary to the "NO tests" claim), and **generate-config-json-schema.ts is runtime code**, not build-time only.

| Module | Files | LOC | Dead | Noise | Context-Rot | Test-Gaps |
|--------|-------|-----|------|-------|-------------|-----------|
| src/schema-kernel/ | 20 | 2,529 | 2 | 0 | 0 | Minor |
| src/tools/ | 30 | 3,961 | 0 | 0 | 0 | Minor |
| src/hooks/ | 16 | 1,529 | 1 | 0 | 0 | 0 |
| **Total** | **66** | **8,019** | **3** | **0** | **0** | **Minor** |

---

### Findings: src/schema-kernel/

### Finding SK-01: All 20 schema files inventoried — 2,529 LOC total

- **Module:** `src/schema-kernel/`
- **Classification:** All files present and accounted for
- **Evidence:** `find src/schema-kernel -name '*.ts' | sort` returns 20 files. `wc -l` total = 2,529. Confirms RESEARCH.md claims exactly.
- **Details:**
  - 16 individual `.schema.ts` files + `index.ts` barrel + `generate-config-json-schema.ts`
  - Largest file: `hivemind-configs.schema.ts` at 446 LOC (under 500 cap)
  - No file exceeds 500 LOC cap
  - RESEARCH.md claim of "20 files, ~2529 LOC" is ACCURATE

---

### Finding SK-02: `index.ts` barrel is NOT noise — contains real validation logic + active re-exports

- **Category:** N/A (negative finding)
- **Module:** `src/schema-kernel/`
- **File:** `src/schema-kernel/index.ts` (337 LOC)
- **Evidence:** Contains `validateWithFallback()` function (40 line real logic) plus re-exports of all 16 schema files. 5 external importers in `src/` (compiler.ts, primitive-loader.ts, cross-primitive-validator.ts). 3 test files import from the barrel. Not a thin re-export file — it provides meaningful validation utility.
- **Recommended action:** None — properly structured barrel with real logic.

---

### Finding SK-03: `generate-config-json-schema.ts` IS runtime code (not build-time only)

- **Category:** N/A (correction to RESEARCH.md)
- **Module:** `src/schema-kernel/`
- **File:** `src/schema-kernel/generate-config-json-schema.ts` (149 LOC)
- **Evidence:** RESEARCH.md claimed this is "build-time only" but it has 2 active runtime importers:
  1. `src/cli/commands/doctor.ts` — used by the `hivemind doctor` CLI command
  2. `src/tools/config/bootstrap-init.ts` — used during runtime for `hivemind init`
- The file uses `mkdirSync` and `writeFileSync` for JSON schema generation. It is an active runtime utility that generates JSON schemas on demand.
- **Recommended action:** Correct RESEARCH.md assumption. No cleanup needed.

---

### Finding SK-04: `permission.schema.ts` — DEAD code (0 consumers outside schema-kernel/)

- **Category:** `dead`
- **Severity:** `MEDIUM`
- **Module:** `src/schema-kernel/`
- **File:** `src/schema-kernel/permission.schema.ts` (168 LOC)
- **Evidence:** ZERO external importers of any permission schema symbol across `src/`. Grep for `PermissionRuleSchema`, `PermissionRulesetSchema`, `PermissionKeySchema`, `PERMISSION_SCHEMA_VERSION`, `AgentPermissionOverrideSchema` returns zero hits outside `src/schema-kernel/`. The `PermissionRule` type used in `src/shared/types.ts` and `src/shared/helpers.ts` is a separate local type definition — NOT imported from this schema file.
- **Bug note:** Line 10 has `z.enum(["allow", "ask", "ask"])` — "ask" appears twice. Should likely be `["allow", "ask", "deny"]` or similar. Since this schema has no consumers, the bug does not affect runtime behavior.
- **Re-exported via:** `index.ts` barrel (lines 193-221), but no code outside schema-kernel/ actually imports these re-exports.
- **Recommended action:** Delete in Phase 18. If permission validation is ever needed, the schema can be recreated from the `shared/types.ts` PermissionRule type.

---

### Finding SK-05: `tool-definition.schema.ts` — DEAD code (0 consumers outside schema-kernel/)

- **Category:** `dead`
- **Severity:** `MEDIUM`
- **Module:** `src/schema-kernel/`
- **File:** `src/schema-kernel/tool-definition.schema.ts` (74 LOC)
- **Evidence:** ZERO external importers of `ToolDefinitionSchema`, `ToolNameSchema`, `ToolFileSchema`, or any other export from this file across `src/`. The `ToolDefinition` type imported by `src/tools/session/execute-slash-command.ts` comes from `@opencode-ai/plugin`, not from this schema file.
- **Re-exported via:** `index.ts` barrel (lines 277-291), but no consumers actually import these.
- **Recommended action:** Delete in Phase 18.

---

### Finding SK-06: Remaining 13 schema files all ACTIVE with confirmed consumers

- **Module:** `src/schema-kernel/`
- **Classification:** All other schema files are ACTIVE

| File | LOC | External Importers (src/) | Test Coverage | Status |
|------|-----|--------------------------|---------------|--------|
| `hivemind-configs.schema.ts` | 446 | 13 (heaviest) | ✅ 6 test files | ACTIVE |
| `prompt-enhance.schema.ts` | 169 | 6 | ✅ 4 test files | ACTIVE |
| `bootstrap.schema.ts` | 109 | 5 | ⚠️ 0 direct test files | ACTIVE |
| `agent-work-contract.schema.ts` | 148 | 4 | ⚠️ 0 direct test files | ACTIVE |
| `session-tracker.schema.ts` | 141 | 3 | ✅ 3 test files | ACTIVE |
| `agent-frontmatter.schema.ts` | 168 | Through barrel (compiler, prim-loader) | ⚠️ 0 direct test files | ACTIVE |
| `command-frontmatter.schema.ts` | 104 | Through barrel (compiler, prim-loader) | ⚠️ 0 direct test files | ACTIVE |
| `skill-metadata.schema.ts` | 111 | Through barrel (compiler, prim-loader) | ⚠️ 0 direct test files | ACTIVE |
| `mcp-server.schema.ts` | 124 | Through barrel (prim-loader) | ⚠️ 0 direct test files | ACTIVE |
| `config-precedence.schema.ts` | 76 | Through barrel (prim-loader) | ⚠️ 0 direct test files | ACTIVE |
| `command-engine.schema.ts` | 32 | 1 | ⚠️ 0 direct test files | ACTIVE |
| `runtime-pressure.schema.ts` | 55 | 1 | ⚠️ 0 direct test files | ACTIVE |
| `sdk-supervisor.schema.ts` | 16 | 1 | ⚠️ 0 direct test files | ACTIVE |
| `doc-intelligence.schema.ts` | 16 | 1 | ⚠️ 0 direct test files | ACTIVE |
| `session-view.schema.ts` | 37 | 1 | ⚠️ 0 direct test files | ACTIVE |
| `trajectory.schema.ts` | 49 | 1 | ⚠️ 0 direct test files | ACTIVE |

- **Test note:** While several schemas lack dedicated test files, they are validated indirectly through tool tests (prompt-analyze, prompt-skim, session-patch, configure-primitive, etc.) and schema-kernel test files (generate-config-json-schema.test.ts, hivemind-configs.schema.test.ts, opencode-config.schemas.test.ts, prompt-enhance.schema.test.ts).
- **Recommended action:** Dedicated schema tests would be ideal but not urgent — indirect coverage is adequate.

---

### Finding SK-07: Module size — no violations, but hivemind-configs.schema.ts at 446 LOC is near the 500 cap

- **Category:** N/A (observational)
- **Module:** `src/schema-kernel/`
- **File:** `src/schema-kernel/hivemind-configs.schema.ts` (446 LOC)
- **Evidence:** RESEARCH.md claimed this file is at 446 LOC. Verified: 446 LOC. Under the 500 LOC cap by 54 lines. Not an immediate concern but worth monitoring.
- **Recommended action:** No action needed. Monitor if Phase 18 adds config schemas.

---

### Findings: src/tools/

### Finding SK-08: All 30 tools/ files inventoried — 3,961 LOC total

- **Module:** `src/tools/`
- **Evidence:** `find src/tools -name '*.ts' | sort` returns 30 files. `wc -l` total = 3,961. Confirms RESEARCH.md claim of "30 files, ~3961 LOC" exactly.
- **Details:**
  - `tools/config/`: 5 files (bootstrap-init 309, bootstrap-recover 219, configure-primitive 490, configure-primitive-paths 45, validate-restart 116)
  - `tools/delegation/`: 3 files (delegate-task 93, delegation-status 208, types 25)
  - `tools/hivemind/`: 11 files (ranging from 45 to 373 LOC)
  - `tools/prompt/`: 6 files (prompt-analyze/index 6, tools 169, types 17; prompt-skim/index 6, tools 107, types 18)
  - `tools/session/`: 5 files (execute-slash-command 152, session-journal-export 117, session-patch/index 6, tools 136, types 19)

---

### Finding SK-09: All 22 tool factories are registered in plugin.ts — no stale tools

- **Category:** N/A (negative finding)
- **Module:** `src/tools/`
- **Evidence:** `src/plugin.ts` lines 45-66 import 22 tool factories. Every tool file in `src/tools/` is represented (or provides a factory used by a file that IS imported). The 11 hivemind/ files all have corresponding imports in plugin.ts.
- **Note:** RESEARCH.md claimed "23 registered tools" but the import count is 22. The discrepancy may be from tool count (including the dual-export hivemind-agent-work.ts which exports 2 tools from one file).
- **Recommended action:** No stale tools to remove. Update RESEARCH.md tool count to 22.

---

### Finding SK-10: `configure-primitive.ts` at 490 LOC is near the 500 cap but within limits

- **Category:** N/A (observational)
- **Module:** `src/tools/config/`
- **File:** `src/tools/config/configure-primitive.ts` (490 LOC)
- **Evidence:** `wc -l` = 490. Under the 500 LOC cap by 10 lines. Confirms RESEARCH.md claim of "~490 LOC". Near the boundary but not over.
- **Recommended action:** No immediate action, but should be watched during Phase 18 in case of additions.

---

### Finding SK-11: CORRECTION to RESEARCH.md — prompt sub-tools DO have dedicated tests

- **Category:** N/A (correction to RESEARCH.md)
- **Module:** `src/tools/prompt/`
- **Evidence:** RESEARCH.md states "prompt-analyze/ and prompt-skim/ have NO tests" and "prompt/ (6 files, ~200 LOC) — Research says NO tests." This is INCORRECT. Dedicated test files exist:
  1. `tests/tools/prompt-analyze.test.ts`
  2. `tests/tools/prompt-skim.test.ts`
  3. `tests/tools/session-patch.test.ts`
  4. `tests/integration/prompt-enhance-pipeline.test.ts` (integration test for the full pipeline)
- **Session-patch tool:** Also correctly wired and tested. Not a separate submodule — it's part of `src/tools/session/session-patch/` (3 files, 161 LOC total, not 269 LOC as RESEARCH.md claimed).
- **Recommended action:** Correct RESEARCH.md claims. All 3 sub-tools (prompt-analyze, prompt-skim, session-patch) are tested and actively invoked.

---

### Finding SK-12: No unified tool registry — f-03c PARTIAL confirmed

- **Category:** `context-rot` (documentational)
- **Severity:** `LOW`
- **Module:** `src/tools/`
- **Evidence:** There is no single file or registry object that enumerates all available tools. Tool registration is distributed across `src/plugin.ts` (22 imports) and individual tool factory functions. REQUIREMENTS.md f-03c lists "Tool Registry" as PARTIAL. Confirmed.
- **Recommended action:** Document as known gap. Phase 18 could add a lightweight registry file if needed.

---

### Findings: src/hooks/

### Finding SK-13: All 16 hooks/ files inventoried — 1,529 LOC total

- **Module:** `src/hooks/`
- **Evidence:** `find src/hooks -name '*.ts' | sort` returns 16 files. `wc -l` total = 1,529. Matches RESEARCH.md claim of "16 files, ~1529 LOC" exactly.
- **Submodule breakdown:**
  - `lifecycle/`: 2 files (core-hooks 212, session-hooks 340) — 552 LOC combined
  - `guards/`: 2 files (governance-block 104, tool-guard-hooks 203) — 307 LOC
  - `transforms/`: 5 files (chat-message-capture 39, toggle-gates 83, tool-after-composer 71, tool-after-workflow 54, tool-before-guard 67) — 314 LOC
  - `observers/`: 5 files (delegation-consumer 41, event-observers 135, session-entry-consumer 22, session-main-consumer 20, session-tracker-consumer 41) — 259 LOC
  - `composition/`: 1 file (cqrs-boundary 36) — 36 LOC
  - `types.ts`: 61 LOC

---

### Finding SK-14: `toggle-gates.ts` — CONFIRMED DEAD code (0 external importers from src/)

- **Category:** `dead`
- **Severity:** `MEDIUM`
- **Module:** `src/hooks/transforms/`
- **File:** `src/hooks/transforms/toggle-gates.ts` (83 LOC)
- **Evidence:**
  - `grep -rn "toggle-gates" --include="*.ts" src/ | grep -v "^src/hooks/transforms/toggle-gates.ts:"` returns **ZERO results** — the file has NO external importers from `src/`
  - `grep -rn "isToggleEnabled\|getDiscussMode" --include="*.ts" src/` returns only self-references within toggle-gates.ts
  - `grep "toggle\|Toggle\|getDiscussMode\|isToggleEnabled" src/config/compiler.ts src/config/subscriber.ts` returns **ZERO results** — config modules don't reference it
  - `plugin.ts` (line 30-42) shows ALL imported hooks: no toggle-gates import present
  - Git log: `git log --oneline --follow src/hooks/transforms/toggle-gates.ts` shows it was created as part of the discuss/plan-check feature (likely D-08 through D-13 context), but the runtime consumer was never wired
- **Context:** Requirements TOG-01 is marked "DELIVERED" — this may mean the config/compile side handles toggle resolution, but the dedicated hook-based toggle-gates consumer is vestigial. The functions `isToggleEnabled()` and `getDiscussMode()` return config values but are never called.
- **Exception:** `tests/hooks/toggle-gates.test.ts` exists — meaning the tests cover dead code.
- **Note for Phase 18:** Deleting this file will require also removing `tests/hooks/toggle-gates.test.ts` and the references in `tests/hooks/toggle-gates.test.ts` imports.
- **Recommended action:** Delete in Phase 18. The toggle logic can be called directly from config without the helper layer.

---

### Finding SK-15: All other hooks/ files are ACTIVE and wired in plugin.ts

- **Module:** `src/hooks/`
- **Evidence:** All 12 hook factories (excluding toggle-gates.ts and non-factory files types.ts, cqrs-boundary.ts) are imported and wired in `src/plugin.ts` lines 30-42:
  - `lifecycle/core-hooks.ts` → `createCoreHooks()` — WIRED
  - `lifecycle/session-hooks.ts` → `createSessionHooks()` — WIRED
  - `guards/tool-guard-hooks.ts` → `createToolGuardHooks()` — WIRED
  - `observers/event-observers.ts` → 3 observer factories — WIRED
  - `transforms/tool-after-composer.ts` → WIRED
  - `transforms/tool-before-guard.ts` → WIRED
  - `transforms/chat-message-capture.ts` → WIRED
  - `transforms/tool-after-workflow.ts` → WIRED
  - `observers/session-entry-consumer.ts` → WIRED
  - `observers/session-main-consumer.ts` → WIRED
  - `observers/delegation-consumer.ts` → WIRED
  - `observers/session-tracker-consumer.ts` → WIRED

- **File size:** No individual hook file exceeds 500 LOC. Largest is `session-hooks.ts` at 340 LOC.
- **lifecycle/ combined 552 LOC:** This is not a single file — it's 2 separate files (core-hooks 212 + session-hooks 340). Each is under 500 LOC individually. Not a violation.

---

### Finding SK-16: hooks/ test coverage — EXCELLENT (19 test files covering all modules)

- **Module:** `src/hooks/`
- **Evidence:** 19 dedicated test files cover hooks:
  - `tests/hooks/create-core-hooks.test.ts` — lifecycle/core-hooks
  - `tests/hooks/create-session-hooks.test.ts` — lifecycle/session-hooks
  - `tests/hooks/create-tool-guard-hooks.test.ts` — guards/tool-guard-hooks
  - `tests/hooks/governance-block.test.ts` — guards/governance-block
  - `tests/hooks/toggle-gates.test.ts` — transforms/toggle-gates (dead code, but tested)
  - `tests/hooks/tool-after-composer.test.ts` — transforms/tool-after-composer
  - `tests/hooks/transforms/chat-message-capture.test.ts` — transforms/chat-message-capture
  - `tests/hooks/transforms/tool-after-workflow.test.ts` — transforms/tool-after-workflow
  - `tests/hooks/transforms/tool-before-guard.test.ts` — transforms/tool-before-guard
  - `tests/hooks/hook-cqrs-boundary.test.ts` — composition/cqrs-boundary
  - `tests/hooks/observers/*.test.ts` (5 files) — all observers
  - `tests/hooks/plugin-event-observers.test.ts` — event-observers integration
  - Integration test files covering hooks in broader context
- **Coverage:** All 5 hook submodules have dedicated test files. No test gaps found.
- **CQRS compliance:** `cqrs-boundary.ts` (36 LOC) enforces `assertHookWriteBoundary()` — confirmed read-only. No violations found in hook code.

---

### Summary: Plan 02

| Metric | Value |
|--------|-------|
| Files audited | 66 |
| Total LOC audited | 8,019 |
| Dead files found | 3 (permission.schema.ts, tool-definition.schema.ts, toggle-gates.ts) |
| Noise files found | 0 |
| Context-rot files found | 0 (f-03c PARTIAL documented) |
| Test gaps found | 0 (prompt tools DO have tests — RESEARCH.md correction) |
| Architecture violations (CQRS) | 0 |
| RESEARCH.md corrections | 3 (generate-config-json-schema runtime, prompt tools tested, tool count 22) |

---

*End of Plan 02 findings*

---

## Plan 03 Findings: coordination/, task-management/

### Executive Summary

Audited **47 files** across **2 modules** totaling **8,216 LOC**. Found **1 significant dead-code finding** (recovery/ submodule — 763 LOC with zero runtime consumers) and **major corrections to RESEARCH.md** regarding sdk-delegation and command-delegation test coverage. Both modules have **far better test coverage than RESEARCH.md claims**.

| Module | Files | LOC | Dead | Noise | Context-Rot | Test-Gaps |
|--------|-------|-----|------|-------|-------------|-----------|
| src/coordination/ | 31 | 5,596 | 0 | 0 | 0 | 0 |
| src/task-management/ | 16 | 2,620 | 5 (recovery/) | 0 | 1 (storeCache singleton) | 1 (recovery/ is dead) |
| **Total** | **47** | **8,216** | **5** | **0** | **1** | **1** |

---

### Findings: src/coordination/

### Finding CO-01: Inventory confirmed — 31 files, 5,596 LOC

- **Module:** `src/coordination/`
- **Evidence:** `find src/coordination -name '*.ts' | sort` returns 31 files. `wc -l` total = 5,596. Matches RESEARCH.md exactly.
- **Submodule breakdown:**
  - `delegation/`: 18 files
  - `spawner/`: 8 files (654 LOC)
  - `completion/`: 2 files (468 LOC)
  - `concurrency/`: 1 file (300 LOC)
  - `sdk-delegation/`: 1 file (324 LOC)
  - `command-delegation/`: 1 file (416 LOC)

---

### Finding CO-02: `delegation/manager.ts` is 362 LOC — RESEARCH.md overstates "~500 LOC"

- **Category:** N/A (correction to RESEARCH.md)
- **Module:** `src/coordination/delegation/`
- **File:** `src/coordination/delegation/manager.ts`
- **Evidence:** Actual LOC = 362 (verified via `wc -l`). RESEARCH.md claimed "~500 LOC" which is overstated by ~138 lines. The largest delegation file is `manager-runtime.ts` at 478 LOC — still under the 500 cap.
- **No size violation:** All delegation files are under 500 LOC. Largest: manager-runtime.ts (478), coordinator.ts (445), state-machine.ts (443).
- **Recommended action:** Correct RESEARCH.md claim.

---

### Finding CO-03: `sdk-delegation/` HAS tests — RESEARCH.md claim is INCORRECT

- **Category:** N/A (correction to RESEARCH.md)
- **Module:** `src/coordination/sdk-delegation/`
- **File:** `src/coordination/sdk-delegation/handler.ts` (324 LOC)
- **Evidence:** RESEARCH.md claims "NO tests" for sdk-delegation/. This is **incorrect**. A dedicated test file exists:
  - `tests/lib/sdk-delegation.test.ts` (618 lines)
- **Wiring:** Imported by `src/coordination/delegation/manager-runtime.ts` (line 10), not directly by plugin.ts. This is correct — sdk-delegation is consumed through the delegation manager-runtime layer.
- **Recommended action:** Correct RESEARCH.md claim. No additional test work needed.

---

### Finding CO-04: `command-delegation/` HAS tests — RESEARCH.md claim is INCORRECT

- **Category:** N/A (correction to RESEARCH.md)
- **Module:** `src/coordination/command-delegation/`
- **File:** `src/coordination/command-delegation/handler.ts` (416 LOC)
- **Evidence:** RESEARCH.md claims "NO tests" for command-delegation/. This is **incorrect**. A dedicated test file exists:
  - `tests/lib/command-delegation.test.ts` (732 lines)
- **Wiring:** Imported by `src/coordination/delegation/manager-runtime.ts` (line 1), not directly by plugin.ts. Correct wiring through the delegation layer.
- **Recommended action:** Correct RESEARCH.md claim. No additional test work needed.

---

### Finding CO-05: `completion/` — Active, tested, wired

- **Category:** CLEAN
- **Module:** `src/coordination/completion/`
- **Files:** `detector.ts` (226 LOC), `notification-handler.ts` (242 LOC)
- **Evidence:** Both files are imported by plugin.ts (line 13). Completion detector is wired to lifecycle manager. Active test coverage:
  - `tests/lib/completion-detector.test.ts`
  - `tests/lib/completion-detector-crash.test.ts`
  - `tests/lib/coordination/completion/detector-v2.test.ts`
  - `tests/lib/notification-handler.test.ts`
- **Recommended action:** None.

---

### Finding CO-06: `concurrency/queue.ts` — Active, tested, wired

- **Category:** CLEAN
- **Module:** `src/coordination/concurrency/`
- **File:** `queue.ts` (300 LOC)
- **Evidence:** Imported by `manager-runtime.ts` and `slot-manager.ts`. Active test coverage:
  - `tests/lib/concurrency.test.ts`
  - `tests/lib/coordination/concurrency/queue.test.ts`
- **Recommended action:** None.

---

### Finding CO-07: `spawner/` — Active, tested, wired

- **Category:** CLEAN
- **Module:** `src/coordination/spawner/`
- **Files:** 8 files, 654 LOC total
- **Evidence:** `auto-loop.ts` and `ralph-loop.ts` imported by plugin.ts (lines 69-70). Other files consumed by delegation/ files (agent-resolver.ts, manager-runtime.ts, dispatcher.ts). 5 dedicated test files:
  - `tests/lib/spawner/agent-primitive-policy.test.ts`
  - `tests/lib/spawner/concurrency-key.test.ts`
  - `tests/lib/spawner/parent-directory.test.ts`
  - `tests/lib/spawner/session-creator.test.ts`
  - `tests/lib/spawner/spawn-request-builder.test.ts`
- **Recommended action:** None.

---

### Finding CO-08: All submodules have active import paths — no broken wires

- **Category:** CLEAN
- **Module:** `src/coordination/`
- **Evidence:** Every submodule has at least one import path from plugin.ts or through delegation manager-runtime:
  - plugin.ts imports: delegation/ (11 files), completion/ (2 files), spawner/ (2 files)
  - manager-runtime.ts imports: sdk-delegation/, command-delegation/, concurrency/
  - delegation/ files import: spawner/ (5 of 8 files)
- **Orphan file check:** All 31 coordination/ .ts files have at least one external importer in `src/`. No orphan files.

---

### Finding CO-09: No coordination/ file exceeds 500 LOC cap

- **Category:** CLEAN
- **Module:** `src/coordination/`
- **Evidence:** Largest file is `manager-runtime.ts` at 478 LOC. All files are under the 500 LOC architecture cap. RESEARCH.md's claim of "delegation/manager.ts ~500 LOC" is corrected to 362 LOC.

---

### Findings: src/task-management/

### Finding TM-01: Inventory confirmed — 16 files, 2,620 LOC

- **Module:** `src/task-management/`
- **Evidence:** `find src/task-management -name '*.ts' | sort` returns 16 files. `wc -l` total = 2,620. Matches RESEARCH.md exactly.
- **Submodule breakdown:**
  - `continuity/`: 2 files (delegation-persistence 196, index 465) — 661 LOC
  - `journal/`: 4 files (execution-lineage 122, index 119, query 168, replay 131) — 540 LOC
  - `lifecycle/`: 1 file (index 242) — 242 LOC
  - `recovery/`: 5 files (assess-state 218, create-checkpoint 143, failure-classes 168, index 29, repair-state 205) — 763 LOC
  - `trajectory/`: 4 files (index 3, ledger 93, store-operations 190, types 128) — 414 LOC

---

### Finding TM-02: `continuity/index.ts` — storeCache singleton CONFIRMED (context-rot)

- **Category:** `context-rot`
- **Severity:** `LOW`
- **Module:** `src/task-management/continuity/`
- **File:** `src/task-management/continuity/index.ts` (465 LOC)
- **Evidence:** Module-level `let storeCache: ContinuityStoreFile | undefined` at line 24. Functions at lines 240-245 check and return the cached value:
  ```
  240:  if (storeCache) { return storeCache }
  244:  storeCache = loadStoreFromDisk()
  ```
  This singleton pattern prevents isolated testing of continuity functions — tests that use continuity must work around the module-level cache. However, existing continuity tests (`tests/lib/continuity.test.ts`) handle this through setup/teardown.
- **Context:** Resetting module-level state between tests requires `vi.resetModules()` or explicit cache clearing. The singleton is documented as a known pattern in ARCHITECTURE.md line 266.
- **Recommended action:** Flag for refactoring (Phase 18 could convert to explicit `ContinuityStore` class with instance-level cache). Low priority.

---

### Finding TM-03: `asString` duplication — RESOLVED (no duplicate exists)

- **Category:** N/A (resolved from earlier phase)
- **Module:** `src/task-management/continuity/`
- **Evidence:** Grep for `asString` in `src/task-management/continuity/index.ts` returns zero results. The only `asString` function definition exists in `src/shared/helpers.ts` (line 87). The continuity.ts duplicate has already been removed (consistent with Plan 01, Finding S-01).
- **Recommended action:** None — already resolved.

---

### Finding TM-04: `recovery/` — CONFIRMED DEAD CODE (5 files, 763 LOC)

- **Category:** `dead`
- **Severity:** `HIGH`
- **Module:** `src/task-management/recovery/`
- **Files:**
  1. `assess-state.ts` (218 LOC) — `assessState()`
  2. `create-checkpoint.ts` (143 LOC) — `createCheckpoint()`
  3. `failure-classes.ts` (168 LOC) — `failureClasses()`
  4. `repair-state.ts` (205 LOC) — `repairState()`
  5. `index.ts` (29 LOC) — barrel re-exporting all 4 functions
- **Evidence:**
  - `grep -rn "task-management/recovery" --include="*.ts" src/` returns **ZERO results** — no src/ file imports the recovery module
  - `grep -rn "assessState\|createCheckpoint\|failureClasses\|repairState" --include="*.ts" src/` returns **ZERO results** outside the recovery/ directory itself
  - The `recoveryGuarantee` field used elsewhere in src/ (delegation state-machine, resume-resolver) is a type field on `Delegation` — NOT an import of recovery module functions
  - Plugin.ts `recovery` references (`recoverPending()`, `bootstrap-recover`) are delegation-level recovery in coordination/delegation/ and tools/config/bootstrap-recover.ts — NOT the task-management/recovery/ module
- **Paradox:** 4 dedicated test files exist (`tests/lib/recovery/*.test.ts`) that test functions no runtime code calls. The code is functional and tested but entirely unused.
- **Recommended action:** Delete in Phase 18. The 4 test files should also be removed. The recovery functionality appears to have been replaced by delegation-level recovery (`src/coordination/delegation/` and `src/features/session-tracker/recovery/`).

---

### Finding TM-05: `journal/` — Active, tested, no orphan event-tracker references

- **Category:** CLEAN
- **Module:** `src/task-management/journal/`
- **Files:** `execution-lineage.ts` (122), `index.ts` (119), `query.ts` (168), `replay.ts` (131)
- **Evidence:**
  - All journal files are exported through `src/index.ts` (lines 15-18) as public API
  - `session-journal-export.ts` tool imports from `execution-lineage.ts`
  - **No orphan event-tracker references:** `grep -rn "eventTracker\|event-tracker" --include="*.ts" src/task-management/` returns **ZERO results**
  - Test coverage: `tests/lib/execution-lineage.test.ts`, `tests/lib/journal-query.test.ts`, `tests/lib/journal-replay.test.ts`, `tests/lib/session-journal.test.ts` (4 test files)
- **Recommended action:** None.

---

### Finding TM-06: `lifecycle/` — Active, wired, tested

- **Category:** CLEAN
- **Module:** `src/task-management/lifecycle/`
- **File:** `index.ts` (242 LOC)
- **Evidence:**
  - Imported by `src/plugin.ts` line 12 as `createHarnessLifecycleManager`
  - Also imported by `hooks/types.ts`, `hooks/guards/tool-guard-hooks.ts`
  - Test coverage: `tests/lib/lifecycle-manager.test.ts`
- **Recommended action:** None.

---

### Finding TM-07: `trajectory/` — Active, wired, tested

- **Category:** CLEAN
- **Module:** `src/task-management/trajectory/`
- **Files:** `index.ts` (3 — barrel), `ledger.ts` (93), `store-operations.ts` (190), `types.ts` (128)
- **Evidence:**
  - Imported by 3 src/ consumers: `hivemind-trajectory.ts` tool, `hivemind-pressure.ts` tool, `agent-work-contracts/operations.ts`
  - Exported as public API via `src/index.ts` line 20
  - Test coverage: `tests/lib/trajectory/ledger.test.ts`
- **Recommended action:** None.

---

### Finding TM-08: Test coverage — adequate across all active submodules

- **Module:** `src/task-management/`
- **Evidence:** RESEARCH.md's claim of "ZERO dedicated test directory" is semantically true (no single `tests/task-management/` directory), but misleading — every active submodule HAS test coverage:

| Submodule | Test Files | Status |
|-----------|-----------|--------|
| continuity/ | `tests/lib/continuity.test.ts`, `tests/lib/delegation-persistence.test.ts` | ✅ |
| journal/ | `tests/lib/execution-lineage.test.ts`, `tests/lib/journal-query.test.ts`, `tests/lib/journal-replay.test.ts`, `tests/lib/session-journal.test.ts` | ✅ |
| lifecycle/ | `tests/lib/lifecycle-manager.test.ts` | ✅ |
| recovery/ | `tests/lib/recovery/assess-state.test.ts`, `tests/lib/recovery/create-checkpoint.test.ts`, `tests/lib/recovery/failure-classes.test.ts`, `tests/lib/recovery/repair-state.test.ts` | ⚠️ Tests exist but code is dead |
| trajectory/ | `tests/lib/trajectory/ledger.test.ts` | ✅ |

- The "ZERO tests" claim applies only if considering task-management/ as a whole without examining submodules. In practice, every submodule has dedicated test files.
- **Recommended action:** Correct RESEARCH.md claim. The recovery/ tests will be removed with the dead code in Phase 18.

---

### Summary: Plan 03

| Metric | Value |
|--------|-------|
| Files audited | 47 |
| Total LOC audited | 8,216 |
| Dead files found | 5 (entire recovery/ submodule — 763 LOC) |
| Noise files found | 0 |
| Context-rot found | 1 (storeCache singleton in continuity/index.ts) |
| Test gaps found | 0 (sdk-delegation, command-delegation, and task-management submodules all have tests) |
| Architecture violations | 0 |
| RESEARCH.md corrections | 3 (manager.ts LOC, sdk-delegation tested, command-delegation tested) |

### Cross-Plan Context

- **Plan 01 finding S-01 verification:** `asString` duplication confirmed RESOLVED. Continuity/index.ts no longer defines `asString` — only `helpers.ts` has it.
- **storeCache singleton:** Known and documented in ARCHITECTURE.md. Flagged for Phase 18 refactoring consideration.
- **Recovery dead code:** The `src/task-management/recovery/` submodule appears to have been superseded by delegation-level recovery in `src/coordination/delegation/` and session-tracker recovery in `src/features/session-tracker/recovery/`. The 763 LOC of dead code should be removed in Phase 18.

---

*End of Plan 03 findings*
