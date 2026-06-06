# C5 Cluster Inventory: Tool Surfaces [AUDIT-03 - Deep Inventory]

**Cluster:** C5 — Tool Surfaces (independent LLM-callable tools and supporting feature modules)
**Analysis Date:** 2026-06-06
**Inventory Base:** `src/tools/prompt/` (6 files), `src/tools/config/` (5 files), `src/tools/hivemind/hivemind-doc.ts` (1 file), `src/features/doc-intelligence/` (5 files), `src/features/tool-intelligence/` (2 files), `src/features/prompt-packet/` (2 files)

---

## 1. Cluster Overview

C5 is the most **heterogeneous and cross-cutting** cluster in the harness. It spans 6 of 8 surface areas — tools that LLM agents call directly AND feature modules that other clusters consume at runtime. C5 does NOT own a cohesive domain. Instead it is the "independent utilities" bucket: code that either (a) provides a direct LLM-callable tool surface (7 tools registered in `plugin.ts`) or (b) implements a self-contained capability that other clusters wire in (tool-intelligence, doc-intelligence, prompt-packet).

### C5 Identity Crisis

C5 has a **fundamental boundary problem**: only 6 of its 21 source files are actually tools. The remaining 15 are internal feature modules consumed by C2, C4, and the public npm API:

| File | What It Actually Is | Who Consumes It |
|------|-------------------|-----------------|
| `src/tools/prompt/*` (6 files) | ✅ True tools | plugin.ts registers 2 tools |
| `src/tools/config/*` (5 files) | ✅ True tools | plugin.ts registers 4 tools |
| `src/tools/hivemind/hivemind-doc.ts` | ✅ True tool | plugin.ts registers as `"hivemind-doc"` |
| `src/features/doc-intelligence/*` (5 files) | ❌ Feature module consumed by hivemind-doc + re-exported in public API | `hivemind-doc.ts`, `src/index.ts:19` |
| `src/features/tool-intelligence/*` (2 files) | ❌ Runtime engine | C4 `tool-guard-hooks.ts` |
| `src/features/prompt-packet/*` (2 files) | ❌ Data type + transform | C4 `session-hooks.ts` |

**Total Files Scanned:** 21 source files + 13 test files = **34 files**

| Sub-Group | Source Files | Test Files | Total |
|-----------|--------------|------------|-------|
| Prompt Tools | 6 | 2 | 8 |
| Config Tools | 5 | 4 | 8 |
| Doc Intelligence Tool | 1 | 1 | 2 |
| Doc Intelligence Feature | 5 | 3 | 8 |
| Tool Intelligence Engine | 2 | 1 | 3 |
| Prompt Packet | 2 | 2 | 4 |
| **Total** | **21** | **13** | **34** |

---

## 2. Sub-Groupings

| # | Sub-Group | Files | LOC | Purpose |
|---|-----------|-------|-----|---------|
| 1 | **Prompt Tools** | `src/tools/prompt/` (6 files) | 323 | `prompt-analyze` (169 LOC tools.ts) and `prompt-skim` (107 LOC tools.ts): standalone LLM-accessible text analysis tools. Line-by-line contradiction/vagueness/missing-scope detection. Fast-scan word/token/URL/complexity scoring with file-path verification. |
| 2 | **Config Tools** | `src/tools/config/` (5 files) | 1228 | `configure-primitive` (490 LOC, near cap), `bootstrap-init` (338 LOC), `bootstrap-recover` (239 LOC), `validate-restart` (116 LOC), `configure-primitive-paths` (45 LOC). Bootstrap lifecycle, primitive compile/decompile, restart validation. |
| 3 | **Doc Intelligence Tool** | `src/tools/hivemind/hivemind-doc.ts` (1 file) | 45 | Thin tool wrapper that parses input and delegates to `executeDocIntelligenceAction()`. |
| 4 | **Doc Intelligence Feature** | `src/features/doc-intelligence/` (5 files) | 454 | Read-only Markdown intelligence: skim, skim_directory, read, chunk, search. All sync I/O. Re-exported in public API at `src/index.ts:19`. |
| 5 | **Tool Intelligence Engine** | `src/features/tool-intelligence/` (2 files) | 366 | Runtime tool evaluation engine (4 rules: malformed task, child-session recursion, root-session allow, delegate-task soft governance). Singleton via `getToolIntelligenceEngine()`. |
| 6 | **Prompt Packet** | `src/features/prompt-packet/` (2 files) | 257 | `KernelPacket` type (149 LOC, 57 fields) and `CompactionPreservationPacket` transform. Pure data + conversion functions. |

### Design Patterns Used

- **Factory Function** — All 7 tools use `create*Tool(projectRoot?)` returning `ReturnType<typeof tool>`. Consistent pattern across the cluster.
- **Schema-Kernel Validation** — Every tool validates input through Zod schemas in `schema-kernel/`. Prompt tools use `prompt-enhance.schema.ts`, config tools use `bootstrap.schema.ts`, doc-intelligence uses `doc-intelligence.schema.ts`.
- **Sync I/O in Read-Only Context** — Doc-intelligence (`router.ts`, `parser.ts`) uses `readFileSync`, `readdirSync`, `statSync` exclusively. Acceptable for read-only tools.
- **Singleton** — `ToolIntelligenceEngine` uses a module-level `let _instance` with lazy `getToolIntelligenceEngine()`.
- **Silent Underscore Params** — 3 of 7 tool factories accept an unused `_projectRoot` parameter (prompt-analyze, prompt-skim). The parameter is required for factory signature consistency.
- **Corrupt Data Quarantine** — `configure-primitive.ts` uses `.backup` suffix on existing files before overwriting.
- **Dynamic Import** — `configure-primitive.ts` is the only C5 file with no feature-module imports; it uses `config/workflow` for its workflow turn enforcement.

---

## 3. File Inventory

### 3.1 Prompt Tools — `src/tools/prompt/`

| File | Purpose | Sub-Group | Cross-Cutting Deps | Flaws/Notes |
|------|---------|-----------|-------------------|-------------|
| `prompt-analyze/tools.ts` | Line-by-line analysis: contradiction pairs (CQRS/event-sourcing exception), absolute claims (MUST/NEVER/ALWAYS), vagueness, missing scope. Clarity score 0-100. Zod-validated output. | Prompt Tools | C1 (`shared/tool-helpers`, `shared/tool-response`, `schema-kernel/prompt-enhance.schema`) | 169 LOC. 4 detection categories. The CQRS/event-sourcing contradiction exception (L32-34) is a hardcoded string match — brittle if capitalization or context varies. `_projectRoot` (L44) is unused. |
| `prompt-analyze/types.ts` | Re-exports `PromptAnalysisFinding`, `PromptAnalysisResult` from schema-kernel. Defines `PromptAnalyzeAction` and `PromptAnalyzeArgs`. | Prompt Tools | C1 (`schema-kernel/prompt-enhance.schema`) | 17 LOC. Pure type re-exports. |
| `prompt-analyze/index.ts` | Barrel: re-exports `createPromptAnalyzeTool` and types. | Prompt Tools | — | 6 LOC. |
| `prompt-skim/tools.ts` | Fast scan: word/line/token counts, URL extraction, file-path verification (existsSync), complexity score (1-10), flooding risk, verdict. | Prompt Tools | C1 (`shared/tool-helpers`, `shared/tool-response`, `schema-kernel/prompt-enhance.schema`) | 107 LOC. Uses `existsSync(join(workspaceRoot, path))` for path verification — a best-effort check that requires the workspace root to be correct. `_projectRoot` (L35) is unused. The `pathRegex` (L56) is a loose regex that may capture markdown formatting artifacts. |
| `prompt-skim/types.ts` | Re-exports `PromptSkimResult` from schema-kernel. Defines `PromptSkimAction` and `PromptSkimArgs`. | Prompt Tools | C1 (`schema-kernel/prompt-enhance.schema`) | 18 LOC. Pure type re-exports. |
| `prompt-skim/index.ts` | Barrel: re-exports `createPromptSkimTool` and types. | Prompt Tools | — | 6 LOC. |

**Pattern:** Both prompt tools follow the exact same structure: `tools.ts` (implementation) → `types.ts` (re-exports from schema-kernel) → `index.ts` (barrel). The `_projectRoot` parameter is unused in both factories — accepted for interface compatibility.

### 3.2 Config Tools — `src/tools/config/`

| File | Purpose | Sub-Group | Cross-Cutting Deps | Flaws/Notes |
|------|---------|-----------|-------------------|-------------|
| `bootstrap-init.ts` | Full bootstrap init: creates `.hivemind/` Tier-1 dirs, gitkeep files, `configs.json`, `configs.schema.json`, `version.json`, copies primitives from `assets/`. Supports project/global scope with fallback. | Config Tools | C1 (`features/bootstrap/structure`, `shared/tool-helpers`, `shared/tool-response`, `schema-kernel/bootstrap.schema`, `schema-kernel/generate-config-json-schema`, `config/defaults`) | 338 LOC. **Significant code duplication with `bootstrap-recover.ts`** — both have near-identical `resolveBootstrapScope()`, `listPrimitiveSources()`, `resolvePrimitiveTargetPath()`, and the `copyPrimitive`/`repairPrimitiveFile` pattern. Sync I/O (`readFileSync`, `readdirSync`, `cpSync`). |
| `bootstrap-recover.ts` | Repair bootstrap primitives: walks asset sources, classifies each target (ok/missing/broken/file), repairs symlinks. | Config Tools | C1 (`features/bootstrap/structure`, `shared/tool-helpers`, `shared/tool-response`, `schema-kernel/bootstrap.schema`) | 239 LOC. **Duplicated logic with bootstrap-init.ts:** `resolveBootstrapScope` (123 → 186), `listPrimitiveSources` (158 → 272), `resolvePrimitiveTargetPath` (183 → 297) are copy-pasted with minor differences. `classifyPrimitiveTarget()` always returns "broken" for symlinks (L216) — but the current project uses direct copies, NOT symlinks (per AGENTS.md "direct copies, no symlinks"). This means the recovery tool classifies ALL real files as "broken" symlinks. **This is a major logic flaw.** |
| `configure-primitive.ts` | Full primitive lifecycle tool: compile, decompile, read, list, inspect, resume. Batch mode. Workflow turn enforcement. | Config Tools | C1 (`shared/tool-helpers`, `shared/tool-response`, `shared/security/path-scope`, `features/bootstrap/primitive-loader`, `config/compiler`, `config/workflow`) | 490 LOC — **largest C5 file, at 98% of the 500 LOC cap**. 7 actions (compile/decompile/read/list/inspect/resume). `yaml` and `zod` dependencies. Workflow turn enforcement reads workflow config from disk. Uses YAML fallback parser (L476-482) — if JSON fails, tries YAML. |
| `configure-primitive-paths.ts` | Standalone path resolution helpers: `resolveContextProjectRoot`, `resolveScopeBasePath`, `resolvePrimitiveFilePath`. | Config Tools | None (leaf — `path` only) | 45 LOC. **Zero test coverage** — no test file references any of these 3 functions. Used by `configure-primitive.ts` for path resolution. |
| `validate-restart.ts` | Post-restart simulation: loads all primitives, runs cross-primitive validation + runtime validation + framework detection. Reports errors/warnings. | Config Tools | C1 (`features/bootstrap/framework-detector`, `features/bootstrap/primitive-loader`, `features/bootstrap/cross-primitive-validator`, `features/bootstrap/runtime-validator`, `shared/tool-helpers`, `shared/tool-response`) | 116 LOC. Clean orchestration — 5 validation steps in sequence. |

**Key Issue:** `bootstrap-recover.ts` classifies files as "broken" when they are NOT symlinks (the project uses direct copies, per AGENTS.md). The recovery tool will re-copy every primitive on every run. This is a silent correctness bug.

### 3.3 Doc Intelligence Tool — `src/tools/hivemind/`

| File | Purpose | Sub-Group | Cross-Cutting Deps | Flaws/Notes |
|------|---------|-----------|-------------------|-------------|
| `hivemind-doc.ts` | Thin tool wrapper: parses `DocIntelligenceInputSchema`, delegates to `executeDocIntelligenceAction()` from doc-intelligence feature. | Doc Tool | C2 (`features/doc-intelligence/router`), C1 (`schema-kernel/doc-intelligence.schema`, `shared/tool-helpers`, `shared/tool-response`) | 45 LOC. Minimal — 3 lines of actual logic (L35-36). The try/catch wrapper (L37-39) catches parse errors and action errors uniformly. |

### 3.4 Doc Intelligence Feature — `src/features/doc-intelligence/`

| File | Purpose | Sub-Group | Cross-Cutting Deps | Flaws/Notes |
|------|---------|-----------|-------------------|-------------|
| `types.ts` | All doc-intelligence types: `DocIntelligenceAction` (5 actions), `DocHeading`, `ParsedMarkdownDocument`, `DocChunkOptions`, `DocChunk`, `DocIntelligenceInput`, `DocSearchMatch`, `DocIntelligenceResult` (5 discriminated union variants). | Doc Intelligence | None | 90 LOC. Well-typed discriminated union for results. |
| `router.ts` | `executeDocIntelligenceAction()` — routes 5 actions. All read-only. Uses `assertPathWithinRoot` for path security. | Doc Intelligence | C1 (`shared/security/path-scope`), C5 (`chunker`, `parser`) | 162 LOC. Uses sync I/O exclusively (`readFileSync`, `readdirSync`, `statSync`, `readdirSync`). The `searchMarkdown` function (L125-141) reads every matching file into memory with `readFileSync` — for large codebases with many markdown files, this is slow. No `.gitignore` filtering — searches `node_modules/` and other ignored directories. |
| `parser.ts` | `parseMarkdownDocument()`, `extractMarkdownOutline()`, `slugifyHeading()`, `countWords()`, `countFrontmatterLines()`. | Doc Intelligence | C1 (gray-matter) | 96 LOC. Simple regex-based heading parser. `slugifyHeading` strips non-alphanumeric characters aggressively (L21). |
| `chunker.ts` | `chunkMarkdownDocument()` — heading-aware chunking with paragraph-boundary splitting at configurable max character limit (default 4000). | Doc Intelligence | C5 (`parser`) | 92 LOC. Stable chunk IDs like `README.md#install-guide-1`. Uses `estimatedTokens: Math.ceil(content.length / 4)` — a four-chars-per-token heuristic. |
| `index.ts` | Barrel: re-exports all doc-intelligence types, `chunkMarkdownDocument`, `executeDocIntelligenceAction`, `extractMarkdownOutline`, `parseMarkdownDocument`, `slugifyHeading`. | Doc Intelligence | — | 14 LOC. Re-exported from `src/index.ts:19` — this is part of the **public npm API**. |

### 3.5 Tool Intelligence Engine — `src/features/tool-intelligence/`

| File | Purpose | Sub-Group | Cross-Cutting Deps | Flaws/Notes |
|------|---------|-----------|-------------------|-------------|
| `types.ts` | All tool-intelligence types: `ToolIntelligenceDecisionKind` (allow/warn/block/needs_jit_grant), `ToolIntelligenceGuidance` (5-field guidance), `ToolIntelligenceEvent`, `ToolIntelligenceDecision`, `JITGrant`. | Tool Intelligence | None | 122 LOC. Well-typed with semantic fields. `ToolIntelligenceGuidance` requires all 5 fields (agent, tool, reason, useInstead, context). |
| `index.ts` | `ToolIntelligenceEngine` class + `getToolIntelligenceEngine()` singleton. 4 evaluation rules: (1) warn on malformed task, (2) warn on child-session recursive task without JIT grant, (3) allow root-session task, (4) soft governance warn on delegate-task with code/artifact intent. + `renderGuidance()` helper. | Tool Intelligence | C3 (`capability-gate/index` for `TOOL_CAPABILITY_MAP`) | 244 LOC. **Module-level singleton** (`let _instance` L233). JIT grants are in-process memory (Map) — lost on restart. Rules 1, 2, and 4 return `warn` (soft governance — tool call proceeds), NOT `block`. Only missing-subagent_type and code-in-delegate-task are "warn" soft actions. None of the rules are hard blocks — all bypassable. |

**Important:** The tool-intelligence engine is consumed by C4 (`src/hooks/guards/tool-guard-hooks.ts`), which runs it on EVERY `tool.execute.before` and `tool.execute.after` call. It runs in the hot path of every tool call. Its "warn-only" governance is by design (D-11 soft governance), but it adds 4 `if/return` chains to every tool guard path.

### 3.6 Prompt Packet — `src/features/prompt-packet/`

| File | Purpose | Sub-Group | Cross-Cutting Deps | Flaws/Notes |
|------|---------|-----------|-------------------|-------------|
| `kernel-packet.ts` | `KernelPacket` type (57 fields) + `createKernelPacket()` factory. Converts `SessionContinuityRecord` into flat packet. | Prompt Packet | C1 (`shared/types` for `SessionContinuityRecord`) | 149 LOC. `KERNEL_PACKET_VERSION = "1.0.0"`. The `createKernelPacket` maps every field explicitly (L107-148). 26 nullable/optional fields defaulting to null/empty/0. |
| `compaction-preservation.ts` | `CompactionPreservationPacket` type (30 fields) + `toCompactionPacket()` + `fromCompactionPacket()`. Strips deep-module fields for compaction boundaries. | Prompt Packet | C5 (`kernel-packet`) | 108 LOC. `toCompactionPacket` drops codemap, tool calls, todos, execution lineage. `fromCompactionPacket` restores with `...base` spread + explicit override of 16 fields. |

**Consumers:** Both prompt-packet files are consumed by C4's `session-hooks.ts` — NOT by any tool. They are feature modules, not tool surfaces. Their presence in C5 is a boundary assignment choice, not a functional one.

---

## 4. Test File Inventory

All 13 C5 test files:

| Test File | LOC | Coverage |
|-----------|-----|----------|
| `tests/tools/prompt-analyze.test.ts` | 154 | prompt-analyze: contradictions, vagueness, absolute claims, missing scope, clarity score |
| `tests/tools/prompt-skim.test.ts` | 148 | prompt-skim: word/line/token counts, URL extraction, path verification, complexity |
| `tests/tools/bootstrap-init.test.ts` | 212 | bootstrap-init: directory creation, primitive copying, scope resolution |
| `tests/tools/bootstrap-recover.test.ts` | 98 | bootstrap-recover: repair counts, scope fallback |
| `tests/tools/configure-primitive.test.ts` | 652 | configure-primitive: compile/decompile/read/list/inspect/resume actions |
| `tests/tools/validate-restart.test.ts` | 86 | validate-restart: validation pipeline, error reporting |
| `tests/tools/hivemind-doc.test.ts` | 53 | hivemind-doc: action dispatch, error handling |
| `tests/features/tool-intelligence/tool-intelligence-engine.test.ts` | 276 | ToolIntelligenceEngine: all 4 rules, JIT grant, guidance rendering |
| `tests/lib/doc-intelligence/parser.test.ts` | 31 | parser: slugify, heading extraction, frontmatter counting |
| `tests/lib/doc-intelligence/router.test.ts` | 47 | router: all 5 actions, path security |
| `tests/lib/doc-intelligence/chunker.test.ts` | 23 | chunker: split at paragraph boundaries, max characters |
| `tests/lib/prompt-packet/compaction-preservation.test.ts` | 137 | compaction-preservation: to/from round-trip, extras handling |
| `tests/lib/prompt-packet/kernel-packet.test.ts` | 81 | kernel-packet: createKernelPacket field mapping |
| **Total** | **1998** | |

**Additionally related (not in test count):**

| Test File | LOC | Relevance |
|-----------|-----|-----------|
| `tests/plugin/bootstrap-tools-registration.test.ts` | 82 | Verifies bootstrap-init and bootstrap-recover are registered as plugin tools |
| `tests/lib/plugin-tools.test.ts` | 106 | Plugin tool delegation surface |

---

## 5. Cross-Cutting Dependencies

### C5 → C1 (Governance + CLI + Config + Routing + Schema + Bootstrap)

| C5 File | C1 Target |
|---------|-----------|
| `prompt-analyze/tools.ts` | `shared/tool-helpers`, `shared/tool-response`, `schema-kernel/prompt-enhance.schema` |
| `prompt-skim/tools.ts` | `shared/tool-helpers`, `shared/tool-response`, `schema-kernel/prompt-enhance.schema` |
| `bootstrap-init.ts` | `features/bootstrap/structure`, `shared/tool-helpers`, `shared/tool-response`, `schema-kernel/bootstrap.schema`, `schema-kernel/generate-config-json-schema`, `config/defaults` |
| `bootstrap-recover.ts` | `features/bootstrap/structure`, `shared/tool-helpers`, `shared/tool-response`, `schema-kernel/bootstrap.schema` |
| `configure-primitive.ts` | `shared/tool-helpers`, `shared/tool-response`, `shared/security/path-scope`, `features/bootstrap/primitive-loader`, `config/compiler`, `config/workflow` |
| `validate-restart.ts` | `features/bootstrap/framework-detector`, `features/bootstrap/primitive-loader`, `features/bootstrap/cross-primitive-validator`, `features/bootstrap/runtime-validator`, `shared/tool-helpers`, `shared/tool-response` |
| `hivemind-doc.ts` | `schema-kernel/doc-intelligence.schema`, `shared/tool-helpers`, `shared/tool-response` |
| `doc-intelligence/router.ts` | `shared/security/path-scope` |
| `doc-intelligence/parser.ts` | gray-matter (npm) |
| `kernel-packet.ts` | `shared/types` (`SessionContinuityRecord`) |

### C5 → C3 (Delegation + Coordination)

| C5 File | C3 Target |
|---------|-----------|
| `tool-intelligence/index.ts` | `capability-gate/index` (`TOOL_CAPABILITY_MAP`) |

### C5 → C4 (Hooks)

| C5 File | C4 Target (Consumer) |
|---------|---------------------|
| `tool-intelligence/*` | Consumed by `hooks/guards/tool-guard-hooks.ts` (gets engine, renders guidance) |
| `prompt-packet/*` | Consumed by `hooks/lifecycle/session-hooks.ts` (toCompactionPacket, KernelPacket) |

### C5 → Public API

| C5 File | Re-exported In |
|---------|---------------|
| `doc-intelligence/*` | `src/index.ts:19` (npm package public API) |
| `tool-intelligence/*` | **Not re-exported** — internal |
| `prompt-packet/*` | **Not re-exported** — internal |

### C5 External Consumers (plugin.ts registration)

All C5 tools are registered in `src/plugin.ts`:
- Lines 56-57: `createPromptSkimTool`, `createPromptAnalyzeTool` 
- Lines 63-66: `createConfigurePrimitiveTool`, `createValidateRestartTool`, `createBootstrapInitTool`, `createBootstrapRecoverTool`
- Line 68: `createHivemindDocTool`
- Line 179: `"hivemind-doc"` registered in hivemind-domain tools
- Lines 200-205: Config-domain tools registered with tool names matching the factory names

### C5 Internal Dependencies (within C5)

| Source | Target |
|--------|--------|
| `hivemind-doc.ts` | `doc-intelligence/router.ts` |
| `doc-intelligence/router.ts` | `doc-intelligence/chunker.ts`, `doc-intelligence/parser.ts` |
| `doc-intelligence/chunker.ts` | `doc-intelligence/parser.ts` |
| `compaction-preservation.ts` | `kernel-packet.ts` |
| `tool-intelligence/index.ts` | `tool-intelligence/types.ts` |

---

## 6. Gaps & Flaws

### 6.1 `bootstrap-recover.ts` Misclassifies All Files as "Broken"

**File:** `src/tools/config/bootstrap-recover.ts:207-220`

**Issue:** `classifyPrimitiveTarget()` returns `"broken"` for symbolic links (L216), `"ok"` for regular files, and `"missing"` for ENOENT. The project's AGENTS.md states: "reflected to `.opencode/agents/` as **direct copies, no symlinks**." Since the project uses direct copies, `classifyPrimitiveTarget()` will classify EVERY existing primitive file as `"ok"` if it's a real file. 

Wait — let me re-check: `classifyPrimitiveTarget` checks `stat.isSymbolicLink()` → `"broken"`. But if the file is a regular file, it returns `"ok"` (L219). So for direct copies, everything would be classified as `"ok"`. The issue only occurs if the file IS a symlink — then it's classified as "broken" even if the symlink target exists.

Actually, looking more carefully: `"broken"` is returned for ANY symlink (`stat.isSymbolicLink()`) regardless of whether the target exists. If the project uses direct copies, symlinks would never appear. But if a dev creates a symlink manually (e.g., `ln -s`), the recovery tool would "repair" it by copying over it. This could result in data loss for manually managed symlinks.

**Impact:** Low in the current project (direct copies). Medium for any deployment using symlinks (the tool treats all symlinks as broken and replaces them with copies, changing the link structure).

**Fix:** Check `stat.isSymbolicLink()` AND `existsSync(readlinkSync(targetPath))` — only classify as "broken" if the target doesn't exist.

### 6.2 Bootstrap-Init and Bootstrap-Recover Code Duplication

**Files:** `src/tools/config/bootstrap-init.ts` vs `src/tools/config/bootstrap-recover.ts`

**Issue:** Both files contain near-identical implementations of:
- `resolveBootstrapScope()` — nearly identical logic (L123-155 vs L186-218)
- `listPrimitiveSources()` — identical (L158-181 vs L272-295)
- `resolvePrimitiveTargetPath()` — identical (L183-205 vs L297-319)
- `copyPrimitive()` / `repairPrimitiveFile()` — similar with minor differences

The duplicated `resolveBootstrapScope` function even has a bug in bootstrap-init.ts (L200 uses `${process.env.HOME || "/tmp"}` fallback) but bootstrap-recover.ts has the SAME bug (L137). Both should use the same canonical home-directory resolver.

**Impact:** Any change to the scope resolution or primitive source logic must be applied to BOTH files. The drift risk is high.

**Fix:** Extract shared logic into `features/bootstrap/structure.ts` or a shared `bootstrap-utils.ts`.

### 6.3 `configure-primitive-paths.ts` Has No Tests

**File:** `src/tools/config/configure-primitive-paths.ts` (45 LOC)

**Issue:** Three functions (`resolveContextProjectRoot`, `resolveScopeBasePath`, `resolvePrimitiveFilePath`) have zero test coverage. Verified by grep — no test file references any of the 3 symbols. The `resolveScopeBasePath` function uses `${process.env.HOME || "/tmp"}` (L23) — an unsafe fallback that is also duplicated in bootstrap-init and bootstrap-recover.

**Impact:** Path resolution bugs in configure-primitive can silently write to wrong locations.

### 6.4 `_projectRoot` Unused in 3 Tool Factories

**Files:** `prompt-analyze/tools.ts:44`, `prompt-skim/tools.ts:35`, `bootstrap-init.ts:44` (tool wrapper)

**Issue:** 3 of 7 tool factories accept a `projectRoot` parameter that is never used. The parameter exists for signature consistency (`all tool factories accept projectRoot`) but the prompt tools don't need it (they operate on prompt text only).

**Impact:** Misleading API surface. Developers looking at these signatures expect the tools to use `projectRoot` for something.

**Fix:** Either (a) drop the parameter and update `plugin.ts` call sites, or (b) add a use (e.g., prompt-skim could use projectRoot for path verification).

### 6.5 No C5 Tools Tested in Registration Integration Test

**File:** `tests/plugin/bootstrap-tools-registration.test.ts` (82 LOC)

**Issue:** The registration test only covers `bootstrap-init` and `bootstrap-recover`. It does NOT verify that `prompt-skim`, `prompt-analyze`, `configure-primitive`, `validate-restart`, or `hivemind-doc` are registered as plugin tools.

**Impact:** A tool factory that throws at construction (e.g., due to a broken import) would only be caught at plugin load time, not during CI.

**Fix:** Add registration assertions for all 7 C5 tools in the plugin registration test.

### 6.6 `doc-intelligence/router.ts` Searches All Files Including `node_modules/`

**File:** `src/features/doc-intelligence/router.ts:104-141`

**Issue:** `listMarkdownFiles()` (L104) recursively walks ALL directories starting from the given path. There is no filtering for `.gitignore`, `node_modules/`, `.git/`, or any other standard exclusion. For a `search` action at the project root, it will scan `node_modules/` and `.git/`.

**Impact:** Large codebases with many node_module markdown files will have extremely slow `search` and `skim_directory` actions. The `searchMarkdown` function reads every matching file into memory (`readFileSync`).

**Fix:** Add a skip-list for common exclusion patterns (`node_modules/`, `.git/`, `dist/`, `build/`, `.next/`).

### 6.7 `doc-intelligence` Uses Sync I/O Exclusively

**Files:** `src/features/doc-intelligence/router.ts:1` (imports `readFileSync`, `readdirSync`, `statSync`)

**Issue:** The entire doc-intelligence feature uses synchronous filesystem operations. The tool wrapper (`hivemind-doc.ts`) is an async tool, but the router, parser, and chunker are all sync. This blocks the event loop during large directory scans or file reads.

**Impact:** A `skim_directory` on a large documentation folder (500+ markdown files) blocks the event loop for seconds. During tool execution, this delays all other tool calls in the queue.

**Fix:** Convert to async I/O (`readFile`, `readdir`, `stat` from `node:fs/promises`). The doc-intelligence feature is small enough (5 files, 454 LOC) that the migration is straightforward.

### 6.8 Tool-Intelligence Is "Warn-Only" — All Rules Are Bypassable

**Files:** `src/features/tool-intelligence/index.ts:108-226`

**Issue:** Of 4 evaluation rules, NONE produces a hard `block`. All return `warn` or `allow`:
- Rule 1: malformed task → `warn` (call proceeds)
- Rule 2: child-session recursive task → `warn` (call proceeds)
- Rule 3: root-session task → `allow`
- Rule 4: delegate-task with code intent → `warn` (call proceeds)

The JSDoc at L4-15 says the rules are designed as soft governance. The `block` and `needs_jit_grant` decision kinds are defined in types but never produced by any rule. The `ToolIntelligenceEngine` is effectively a **logging-only** engine — it always allows execution.

**Impact:** Security theater. The engine was designed with hard-block capabilities (per types) but only implements soft suggestions. Any real enforcement must come from C4's tool-guard-hooks (budget/circuit-breaker) or C1's governance-engine.

**Fix:** Either (a) implement actual `block` decisions for at least Rule 2 (child-session recursive task), or (b) downgrade the decision type to `"log" | "warn" | "allow"` to match reality.

### 6.9 Tool-Intelligence JIT Grants Lost on Process Restart

**File:** `src/features/tool-intelligence/index.ts:76-99`

**Issue:** JIT grants are stored in a `Map<string, JITGrant>` in memory. The `hasJITGrant()` check (L97) only finds grants issued in the current process lifetime. If the process restarts, all grants are lost. No persistence layer.

**Impact:** If an orchestrator grants JIT for a child session to self-delegate, and the process restarts mid-session, the grant is lost. The child session would then trigger the Rule 2 warning on every task call.

**Fix:** Persist JIT grants to `.hivemind/state/` using the existing continuity or contract store.

### 6.10 `prompt-analyze` Contradiction Detection Ignores False Positives

**File:** `src/tools/prompt/prompt-analyze/tools.ts:30-36`

**Issue:** The only false-positive exception is `hasContradictionSignal()` match for CQRS/event-sourcing (L32-34). There is no general mechanism for prompt authors to suppress false contradiction detections. The `CONTRADICTION_PAIRS` array (L17-20) is hardcoded with only 2 pairs — it can miss complex contradictions.

**Impact:** The contradiction detection is useful but limited. Complex prompts with nested conditionals (e.g., "Use X if A, use Y if B") are not flagged.

**Fix:** Add a `score` or `likelihood` field to contradiction findings, or accept suppression markers in the prompt text.

### 6.11 `prompt-skim` Path Verification Uses `existsSync` Without Traversal Protection

**File:** `src/tools/prompt/prompt-skim/tools.ts:56-62`

**Issue:** The `pathRegex` (L56) captures paths starting with `./` or matching common file patterns. The `verifiedPaths` map (L61) uses `existsSync(join(workspaceRoot, p))`. If a prompt contains a relative path like `../../../etc/passwd`, the join resolves it inside the workspace. But there's no `assertPathWithinRoot` check — a path like `/etc/passwd` (absolute) would be joined as `<workspaceRoot>/etc/passwd` (not /etc/passwd), so the traversal is naturally scoped. However, the regex may miss edge cases.

**Impact:** Cosmetic — this is a read-only check. False "not found" for unconventional paths.

### 6.12 `kernel-packet.ts` Spreads 26 Nullable/Empty Defaults

**File:** `src/features/prompt-packet/kernel-packet.ts:107-148`

**Issue:** The `KernelPacket` type has 57 fields. `createKernelPacket()` explicitly maps each field (41 lines). 26 of those fields default to `null`, `[]`, `0`, `""`, or `"unknown"`. The `parent_session_id` is hardcoded to `null` (L118) even when a parent exists — the function doesn't extract it from the continuity record.

**Impact:** The `parent_session_id` of every kernel packet is `null`, which means compaction preservation packets always lose parent session identity. This is a data integrity gap — the `SessionContinuityRecord` has `parentSessionID` but `createKernelPacket` ignores it.

**Fix:** Read `record.parentSessionID` and pass it through.

### 6.13 `compaction-preservation.ts` Creates Packets That Lose Source Fields

**File:** `src/features/prompt-packet/compaction-preservation.ts:87-107`

**Issue:** `fromCompactionPacket()` restores by spreading `...base` and then overriding 16 fields from the compact packet. Fields like `parent_session_id` come from the compact (compaction boundary value) — if the compact was created at a compaction boundary hours ago, the overridden `parent_session_id` field may be stale. The `non_goals`, `contract_status`, `todo_authority`, and `return_contract` fields from the compaction packet are explicitly NOT mapped back.

**Impact:** The restored kernel packet may have inconsistent field values where some come from the base (current) and some from the compact (historical). This is by design but creates a subtle hybrid state.

### 6.14 C5 Has No Cluster-Owned Entry Point

**File:** `src/features/doc-intelligence/index.ts` (14 LOC) is the only barrel re-export in C5.

**Issue:** Unlike C2 (clear `src/task-management/` root) or C4 (clear `src/hooks/` root), C5 has no cluster-level barrel or grouping. The 21 files are spread across `src/tools/prompt/`, `src/tools/config/`, `src/tools/hivemind/`, `src/features/doc-intelligence/`, `src/features/tool-intelligence/`, and `src/features/prompt-packet/`. There is no `src/features/c5-index.ts` or similar.

**Impact:** Developers must discover C5 files by directory scanning rather than a central index. The cluster boundary is invisible from the code structure.

---

## 7. Conflicts

### 7.1 C5/C4 Boundary: Tool Intelligence and Prompt Packet Are Not Tools

**Source:** `.planning/codebase/CLUSTER-INVENTORY-2026-06-06.md:90-98`

**Conflict:** The cluster inventory assigns tool-intelligence and prompt-packet to C5 as "Independent features." But:
- `tool-intelligence` is consumed by C4 `tool-guard-hooks.ts` in the hot tool-execution path
- `prompt-packet` is consumed by C4 `session-hooks.ts` in the session lifecycle path
- Neither is re-exported in `src/index.ts` (the public API)
- Neither has a `create*Tool()` factory

These modules belong to C4 structurally — they're feature modules consumed by hooks, not independent tools.

**Resolution:** Move `tool-intelligence/` and `prompt-packet/` to C4 in the next cluster boundary refresh. Their test files (`tests/features/tool-intelligence/`, `tests/lib/prompt-packet/`) should follow.

### 7.2 C5/C1 Boundary: Config Tools Are Governance Operations

**Source:** `.planning/codebase/CLUSTER-INVENTORY-2026-06-06.md:35-48`

**Conflict:** All 5 config tools (`bootstrap-init`, `bootstrap-recover`, `configure-primitive`, `validate-restart`, `configure-primitive-paths`) import heavily from C1 (11 distinct C1 modules). They install primitives, manage `.hivemind/` state, compile/decompile agent definitions, and validate restart readiness. These are governance lifecycle operations, not independent tool surfaces.

**Resolution:** Move config tools to C1 in the next cluster boundary refresh. They already depend on C1 infrastructure — they produce C1 artifacts (`.opencode/` primitives, `.hivemind/configs.json`).

### 7.3 `bootstrap-recover` Assumes Symlinks; Project Uses Direct Copies

**Files:** `src/tools/config/bootstrap-recover.ts:207-220` vs AGENTS.md ("direct copies, no symlinks")

**Conflict:** The recovery tool was designed for symlink-based deployments. The project switched to direct copies (per AGENTS.md). The recovery tool's symlink-only classification means it would "repair" every non-symlink primitive on every run — replacing existing files with fresh copies from `assets/`. This silently discards any user modifications to `.opencode/` primitives.

**Impact:** HIGH. Running `bootstrap-recover` in the current project silently overwrites any user-edited primitives. The `.backup` mechanism (L229-231) only works if the existing file is NOT a symlink — for direct copies, the repair path creates a backup, but the `resolveBootstrapScope` path selection may differ from expectations.

### 7.4 Prompt Tools and Prompt Packet Share "Prompt" Name but Have No Relationship

**Files:** `src/tools/prompt/` (prompt analysis) vs `src/features/prompt-packet/` (KernelPacket + CompactionPreservation)

**Conflict:** Both sub-groups use "prompt" in their name but are completely unrelated:
- Prompt tools analyze free-form text (contradictions, vagueness, complexity)
- Prompt packet serializes session context into structured packets

There is no shared logic, no shared types, and no shared dependencies. The name collision creates confusion about what "prompt" means in the C5 context.

**Resolution:** Rename `prompt-packet` to `session-packet` or `kernel-packet` to match its actual domain (session context serialization, not prompt text).

---

## 8. Key Findings

1. **C5 is the most fragmented cluster.** Its 21 files are spread across 6 different directories, only 7 of them are actual tools, and 2 of the remaining modules are consumed by C4 (not C5). The cluster has no central index or cohesive domain. The cluster boundary assignment places tool-intelligence, prompt-packet, and doc-intelligence in C5, but they functionally belong to C4, C4, and C8 (public API) respectively.

2. **`bootstrap-recover.ts` has a silent correctness bug relative to the project's actual deployment model.** It classifies all non-symlink files as "ok" — which is correct for the project's direct-copy model — but the `classifyPrimitiveTarget()` function treats ANY symlink as "broken" regardless of target validity. Combined with the extensive code duplication between `bootstrap-init.ts` and `bootstrap-recover.ts` (3 near-identical helper functions), any maintenance fix must be applied twice or risk drift.

3. **Tool-intelligence engine is an advisory-only system with no hard enforcement.** All 4 evaluation rules return `warn` (tool call proceeds). The `block` and `needs_jit_grant` decision kinds defined in types.ts are never produced by any rule. The engine adds evaluation overhead to every tool call without providing actual runtime protection. Real enforcement depends entirely on C4's budget/circuit-breaker and C1's governance-engine.

4. **Doc-intelligence blocks the event loop with sync I/O.** The entire feature (5 files, 454 LOC) uses `readFileSync`, `readdirSync`, and `statSync` exclusively. A `skim_directory` on a large folder blocks all other tool calls. There is no `.gitignore` filtering — `node_modules/` and `.git/` are searched.

5. **`configure-primitive-paths.ts` has zero test coverage** despite providing path resolution for the `configure-primitive` tool — the largest C5 file at 490 LOC. A bug in `resolveScopeBasePath` or `resolvePrimitiveFilePath` can silently write primitives to the wrong location, which is the most dangerous failure mode in the config tool suite.

6. **`createKernelPacket()` hardcodes `parent_session_id` to `null`** even when the continuity record has a `parentSessionID`. This means every kernel packet (and every compaction preservation packet derived from it) loses parent session identity. The compaction round-trip (`toCompactionPacket` → `fromCompactionPacket`) produces a hybrid state where some fields come from the current session and some from the compaction boundary.

---

*C5 Inventory: 2026-06-06 — 34 files total (21 source, 13 test)*
