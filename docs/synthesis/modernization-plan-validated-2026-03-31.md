---
_meta:
  created_at: "2026-03-31T16:30:00Z"
  updated_at: "2026-03-31T16:30:00Z"
  producer: "hivexplorer"
  packet_id: "modernization-plan-validation-artifact-4-2026-03-31"
  source_artifacts:
    - "docs/planning-draft/modernize-doc-intelligence-layer.md"
    - "docs/synthesis/tool-audit-reconciled-2026-03-31.md"
    - "docs/synthesis/legacy-inventory-validated-2026-03-31.md"
    - "docs/synthesis/gap-analysis-legacy-vs-current-2026-03-31.md"
  git_commit: "d351aecf8fbd9e8b5871c16fe425cc3c6c27e99e"
  methodology: "cross-reference every claim in the modernization plan against 3 validated evidence artifacts + direct filesystem verification"
---

# Modernization Plan Validation — 2026-03-31

**Plan:** `docs/planning-draft/modernize-doc-intelligence-layer.md` (593 lines)
**Evidence Artifacts:** tool-audit-reconciled, legacy-inventory-validated, gap-analysis-legacy-vs-current
**Git Commit:** `d351aecf8fbd9e8b5871c16fe425cc3c6c27e99e`
**Validation Date:** 2026-03-31

---

## Executive Summary

- **42 claims extracted and validated** from the modernization plan
- **16 SUPPORTED** (38%) — claims directly confirmed by evidence
- **5 CONTRADICTED** (12%) — claims directly refuted by evidence
- **12 UNSUPPORTED** (29%) — no evidence found for or against
- **9 STALE** (21%) — claims reference files/structures that existed in legacy but not in current codebase
- **Biggest risk:** Plan references 35 files that do NOT exist in the current codebase (lines 5-50), treating them as live refactor targets
- **Critical contradiction:** Plan labels `hivemind-handoff` as "(new)" (line 223), but the tool already exists in the current catalog with 6 actions and 22 fields (Artifact 1, line 16)

---

## Part A: Claims Validation Table

### Category 1: Scope Claims — What Current Tools Do

| # | Plan Claim (quoted/paraphrased) | Evidence Source | Status | Evidence Ref |
|---|-------------------------------|----------------|--------|-------------|
| A1 | "Use the current `doc-intel` and `hivemind_doc` capabilities as the baseline" (line 66) | Artifact 1, 2, 3 | **STALE** | `doc-intel.ts` (1,785 LOC) exists only in legacy archive (`.archive/legacy-src-20260314-140720/lib/doc-intel.ts`). NOT in current `src/`. Current doc tool is `src/tools/doc/tools.ts` (35 LOC, 5 actions). |
| A2 | "`doc-intel` baseline includes `skimDocument`" (line 70) | Artifact 3 (line 37) | **SUPPORTED** | `skimDocument` exists in current `src/intelligence/doc/read-ops.ts:63` |
| A3 | "`doc-intel` baseline includes `skimDirectory`" (line 71) | Artifact 3 (line 37) | **SUPPORTED** | `skimDirectory` exists in current `src/intelligence/doc/read-ops.ts:76` |
| A4 | "`doc-intel` baseline includes `readSection`" (line 72) | Artifact 3 (line 37) | **SUPPORTED** | `readSection` exists in current `src/intelligence/doc/read-ops.ts:87` |
| A5 | "`doc-intel` baseline includes `readChunked`" (line 73) | Artifact 3 (line 37) | **SUPPORTED** | `readChunked` exists in current `src/intelligence/doc/read-ops.ts:93` |
| A6 | "`doc-intel` baseline includes `upsertSection`" (line 74) | Artifact 3 (line 38) | **STALE** | `upsertSection` existed in legacy `write-ops.ts:478`. Current codebase has NO write operations. Tool is read-only (Artifact 1, line 13). |
| A7 | "`doc-intel` baseline includes `writeSection`" (line 75) | Artifact 3 (line 38) | **STALE** | `writeSection` existed in legacy `write-ops.ts:519`. NOT in current codebase. |
| A8 | "`doc-intel` baseline includes `appendSection`" (line 76) | Artifact 3 (line 38) | **STALE** | `appendSection` existed in legacy `write-ops.ts:559`. NOT in current codebase. |
| A9 | "`doc-intel` baseline includes `insertSection`" (line 77) | Artifact 3 (line 38) | **STALE** | `insertSection` existed in legacy `write-ops.ts:598`. NOT in current codebase. |
| A10 | "`doc-intel` baseline includes `deleteSection`" (line 78) | Artifact 3 (line 38) | **STALE** | `deleteSection` existed in legacy `write-ops.ts:636`. NOT in current codebase. |
| A11 | "`doc-intel` baseline includes `readMetadata`" (line 79) | Artifact 3 (line 59) | **STALE** | `readMetadata` existed in legacy read-ops. Current read-ops exports only 5 functions. `readMetadata` is NOT among them (verified: `read-ops.ts:63-151`). |
| A12 | "`doc-intel` baseline includes `writeMetadata`" (line 80) | Artifact 3 (line 38) | **STALE** | `writeMetadata` existed in legacy `write-ops.ts:671`. NOT in current codebase. |
| A13 | "`doc-intel` baseline includes `searchDocuments`" (line 81) | Artifact 3 (line 37) | **SUPPORTED** | `searchDocuments` exists in current `src/intelligence/doc/read-ops.ts:108` |
| A14 | "`doc-intel` baseline includes `listDocuments`" (line 82) | Artifact 3 (line 59) | **STALE** | `listDocuments` existed in legacy read-ops.ts:430. NOT in current read-ops.ts. |
| A15 | "`doc-intel` baseline includes `createDocument`" (line 83) | Artifact 3 (line 38) | **STALE** | `createDocument` existed in legacy `write-ops.ts:707`. NOT in current codebase. |
| A16 | "`doc-intel` baseline includes `generateTOC`" (line 84) | Artifact 3 (line 45) | **STALE** | General-purpose `generateTOC` existed in legacy `doc-intel.ts:858`. Current `generateTOC` is session-specific in `event-tracker/markdown-writer.ts:257` only. Not available for general doc tool use. |
| A17 | "`hivemind_doc` V2 baseline includes 20 actions" (lines 94-114) | Artifact 1, 3 | **STALE** | Legacy tool had 20 actions (Artifact 2, line 196). Current tool has **5 actions**: skim, skim_directory, read, chunk, search (Artifact 1, line 13). |

### Category 2: File/Path References

| # | Plan Claim | Evidence Source | Status | Evidence Ref |
|---|-----------|----------------|--------|-------------|
| A18 | Primary target: `/Users/apple/hivemind-plugin/src/lib/doc-intel.ts` (line 6) | Filesystem glob | **CONTRADICTED** | `src/lib/` directory does NOT exist. Glob for `src/lib/**/*.ts` returns zero results. No `src/lib/` directory at all. |
| A19 | Primary target: `/Users/apple/hivemind-plugin/src/lib/code-intel/doc-weaver.ts` (line 7) | Filesystem glob | **CONTRADICTED** | Does NOT exist. `src/lib/` does not exist. The legacy archive has `.archive/legacy-src-20260314-140720/lib/code-intel/doc-weaver.ts` (417 LOC) but this is NOT in the current source. |
| A20 | Primary target: `/Users/apple/hivemind-plugin/src/tools/hivemind-doc.ts` (line 8) | Filesystem glob | **CONTRADICTED** | Does NOT exist. Current doc tool is at `src/tools/doc/tools.ts` (35 LOC). The legacy archive has `.archive/legacy-src-20260314-140720/tools/hivemind-doc.ts` (911 LOC). |
| A21 | Legacy review target: `src/tools/hivemind-inspect.ts` (line 21) | Filesystem glob | **CONTRADICTED** | Does NOT exist in current codebase. Exists in legacy archive only. |
| A22 | Legacy review target: `src/tools/hivemind-read-skeleton.ts` (line 22) | Filesystem glob | **CONTRADICTED** | Does NOT exist in current codebase. Exists in legacy archive only. |
| A23 | Legacy review target: `src/tools/hivemind-hierarchy.ts` (line 23) | Filesystem glob | **CONTRADICTED** | Does NOT exist in current codebase. Exists in legacy archive only. |
| A24 | Legacy review target: `src/tools/hiveops-export.ts` (line 24) | Filesystem glob | **CONTRADICTED** | Does NOT exist in current codebase. NOT found in legacy archive either (outside scope). |
| A25 | Legacy review target: `src/tools/hiveops-sot.ts` (line 25) | Filesystem glob | **CONTRADICTED** | Does NOT exist in current codebase. NOT found in legacy archive either. |
| A26 | Legacy review target: `src/tools/hiveops-gate.ts` (line 26) | Filesystem glob | **CONTRADICTED** | Does NOT exist in current codebase. NOT found in legacy archive either. |
| A27 | Legacy review target: `src/lib/anchors.ts` (line 27) | Filesystem glob | **CONTRADICTED** | `src/lib/` does not exist. |
| A28 | Legacy review target: `src/lib/detection.ts` (line 28) | Filesystem glob | **CONTRADICTED** | `src/lib/` does not exist. |
| A29 | Legacy review target: `src/lib/gatekeeper.ts` (line 29) | Filesystem glob | **CONTRADICTED** | `src/lib/` does not exist. |
| A30 | Legacy review target: `src/lib/hierarchy-tree.ts` (line 30) | Filesystem glob | **CONTRADICTED** | `src/lib/` does not exist. |
| A31 | Legacy review target: `src/lib/hiveops-paths.ts` (line 31) | Filesystem glob | **CONTRADICTED** | `src/lib/` does not exist. |
| A32 | Legacy review target: `src/lib/inspect-engine.ts` (line 32) | Filesystem glob | **CONTRADICTED** | `src/lib/` does not exist. |
| A33 | Legacy review target: `src/lib/paths.ts` (line 33) | Filesystem glob | **CONTRADICTED** | `src/lib/` does not exist. |
| A34 | Legacy review target: `src/lib/project-snapshot.ts` (line 34) | Filesystem glob | **CONTRADICTED** | `src/lib/` does not exist. |
| A35 | Legacy review target: `src/lib/session-governance.ts` (line 35) | Filesystem glob | **CONTRADICTED** | `src/lib/` does not exist. |
| A36 | Legacy review target: `src/lib/session-engine.ts` (line 36) | Filesystem glob | **CONTRADICTED** | `src/lib/` does not exist. |
| A37 | Legacy review target: `src/lib/session-memory-purge.ts` (line 37) | Filesystem glob | **CONTRADICTED** | `src/lib/` does not exist. |
| A38 | Legacy review target: `src/lib/session-runtime.ts` (line 38) | Filesystem glob | **CONTRADICTED** | `src/lib/` does not exist. |
| A39 | Legacy review target: `src/lib/staleness.ts` (line 39) | Filesystem glob | **CONTRADICTED** | `src/lib/` does not exist. |
| A40 | Legacy review target: `src/lib/state-snapshot.ts` (line 40) | Filesystem glob | **CONTRADICTED** | `src/lib/` does not exist. |
| A41 | Legacy review target: `src/lib/task-governance.ts` (line 41) | Filesystem glob | **CONTRADICTED** | `src/lib/` does not exist. |
| A42 | Legacy review target: `src/lib/toast-throttle.ts` (line 42) | Filesystem glob | **CONTRADICTED** | `src/lib/` does not exist. |
| A43 | Legacy review target: `src/lib/tool-activation.ts` (line 43) | Filesystem glob | **CONTRADICTED** | `src/lib/` does not exist. |
| A44 | Legacy review target: `src/lib/tool-names.ts` (line 44) | Filesystem glob | **CONTRADICTED** | `src/lib/` does not exist. |
| A45 | Legacy review target: `src/lib/tool-response.ts` (line 45) | Filesystem glob | **CONTRADICTED** | `src/lib/` does not exist. NOTE: `src/shared/tool-response.ts` DOES exist — different path. |
| A46 | Legacy review target: `src/hooks/session_coherence/main_session_start.ts` (line 46) | Filesystem glob | **CONTRADICTED** | Does NOT exist. Current hooks are under `src/hooks/` with different names (event-handler.ts, soft-governance.ts, etc.). No `session_coherence/` subdirectory. |
| A47 | Legacy review target: `src/hooks/event-handler.ts` (line 47) | Filesystem glob | **SUPPORTED** | EXISTS at `src/hooks/event-handler.ts`. |
| A48 | Legacy review target: `src/hooks/soft-governance.ts` (line 48) | Filesystem glob | **SUPPORTED** | EXISTS at `src/hooks/soft-governance.ts`. |
| A49 | Legacy review target: `src/hooks/tool-gate.ts` (line 49) | Filesystem glob | **CONTRADICTED** | Does NOT exist. Current tool governance is at `src/hooks/runtime-loader/tool-governance.ts` — different path and name. |

### Category 3: Architecture Proposal Claims

| # | Plan Claim | Evidence Source | Status | Evidence Ref |
|---|-----------|----------------|--------|-------------|
| A50 | Split into 3 tool families: `hivemind-doc`, `hivemind-handoff`, `hivemind-inspect` (line 130) | Artifact 1, filesystem | **PARTIALLY_SUPPORTED** | `hivemind-doc` exists (Artifact 1, line 13). `hivemind-handoff` already exists (Artifact 1, line 16; `src/tools/handoff/tools.ts`). `hivemind-inspect` does NOT exist in current catalog (verified: `src/tools/index.ts` has no `inspect` entry). |
| A51 | "`hivemind-handoff` (new)" — labeled as a new tool family (line 223) | Artifact 1, filesystem | **CONTRADICTED** | `hivemind_handoff` already exists in the tool catalog (Artifact 1, line 16; `src/tools/index.ts:57`). It has 6 actions (create, read, list, update, validate, close) and 22 fields. It is NOT new. |
| A52 | "`hivemind-inspect` should focus on investigation and structural inspection" (line 304) | Artifact 1, 2, 3 | **UNSUPPORTED** | No current `hivemind-inspect` tool exists. Legacy had `hivemind-inspect.ts` with 5 actions (scan, deep, drift, introspect, traverse) (Artifact 2, line 199). No evidence in current codebase supports what capabilities this tool should have. |
| A53 | `hivemind_doc` should "remain the main unified document intelligence tool" (line 124) | Artifact 1, 3 | **STALE** | Legacy had 20 actions. Current has 5 read-only actions. Plan proposes expanding it significantly beyond current capabilities, but frames it as a refactor of existing capability. |
| A54 | Tool families should "run without requiring preconditions from `.hivemind` session state" (line 366) | Artifact 1 | **SUPPORTED** | Current doc tool (src/tools/doc/tools.ts:10) takes only `projectRoot` and `args`. No `.hivemind` dependency. |

### Category 4: Safety and Write Operation Claims

| # | Plan Claim | Evidence Source | Status | Evidence Ref |
|---|-----------|----------------|--------|-------------|
| A55 | "Write operations only on `.md`, `.xml`, `.json`, `.yaml`, `.yml`" (line 88) | Artifact 2, 3 | **STALE** | This was a legacy safety rule in `lib/doc-intel/formats/`. Current codebase has NO write operations for documents. Current `safety.ts` only has `isMarkdownDocument` for `.md` extension validation (Artifact 3, line 43). |
| A56 | "Write operations on files larger than 600 LOC return a `chunk_required` signal" (line 89) | Artifact 2 | **PARTIALLY_SUPPORTED** | Legacy had chunking guard at **400 LOC** threshold (Artifact 2, line 187: `write-ops.ts:404` returns `chunk_required`), NOT 600 LOC. Plan claims 600, evidence shows 400. |
| A57 | "All write operations must follow a read-before-write invariant" (line 90) | Artifact 2 | **STALE** | Legacy write-ops enforced this. Current codebase has NO write operations, so the invariant is moot. Cannot "refactor" what doesn't exist. |
| A58 | "Swarm-safe operations with advisory locks, atomic writes, and content hashing" (line 122) | Artifact 2, 3 | **STALE** | Legacy had proper-lockfile, atomicWrite, SHA-256 hashing (Artifact 2, lines 184-186). Current doc layer has NONE of these (Artifact 3, line 43). These capabilities need to be rebuilt, not refactored. |

### Category 5: LSP Integration Claims

| # | Plan Claim | Evidence Source | Status | Evidence Ref |
|---|-----------|----------------|--------|-------------|
| A59 | "LSP-assisted or structure-aware edits where beneficial" (line 181) | Artifact 2, 3 | **UNSUPPORTED** | LSP bridge existed in legacy (103 LOC) but was partially disconnected (Artifact 2, line 193). Current codebase has zero LSP integration (Artifact 3, line 44). Plan does not acknowledge this is a REGRESSION that needs full rebuild, not a refactor. |

### Category 6: Format Weaver Claims

| # | Plan Claim | Evidence Source | Status | Evidence Ref |
|---|-----------|----------------|--------|-------------|
| A60 | "Differentiate behavior appropriately for: Markdown, XML, YAML, JSON" (lines 411-417) | Artifact 2, 3 | **PARTIALLY_SUPPORTED** | Current codebase supports ONLY Markdown. Legacy had md.ts (full), json.ts (stub), xml.ts (stub), yaml.ts (stub) — all non-MD stubs threw `'Not implemented'` (Artifact 2, lines 189-191). Plan does not acknowledge that JSON/XML/YAML were STUBS, not working implementations. |

### Category 7: Implementation Order Claims

| # | Plan Claim | Evidence Source | Status | Evidence Ref |
|---|-----------|----------------|--------|-------------|
| A61 | "Give a staged implementation plan that starts with the highest-value, lowest-fragility core" (line 573) | Artifact 3 | **UNSUPPORTED** | No phased plan is actually specified in the document. Line 573 requests a phased plan as OUTPUT, but the plan itself does not provide one. This is a requirement for the implementor, not an evidence-validated claim. |

---

## Part B: Architecture Proposal Assessment

### Tool Family 1: `hivemind-doc`

**Current State (Evidence):**
- Exists at `src/tools/doc/tools.ts` — 35 LOC, 5 read-only actions (skim, skim_directory, read, chunk, search)
- Feature layer at `src/features/doc-intelligence/doc.ts` — 102 LOC
- Intelligence layer at `src/intelligence/doc/` — 6 files: read-ops.ts, formats/md.ts, safety.ts, doc-surface-router.ts, types.ts, index.ts
- **No write operations** (Artifact 3, line 38)
- **No cross-referencing** (Artifact 3, line 41)
- **No batch operations** (Artifact 3, line 42)
- **No format weavers** beyond Markdown (Artifact 3, line 40)

**What plan proposes to inherit from legacy (per Artifact 2):**
- 10 write ops (upsertSection, writeSection, appendSection, insertSection, deleteSection, writeMetadata, createDocument, batchEdit, batchFiles) — all REGRESSION items
- 7 missing read ops (readMetadata, readLines, generateTOC, listDocuments, indexDocuments, xrefDocuments, contextExtract) — DEGRADED items
- Safety systems (proper-lockfile, atomicWrite, SHA-256, chunking guard) — DEGRADED items

**What gaps would it close (per Artifact 3):**
- Gap #1: Document writing (REGRESSION, ~876 LOC, SIGNIFICANT complexity)
- Gap #3: Cross-referencing (REGRESSION, ~200 LOC, MODERATE)
- Gap #4: Batch operations (REGRESSION, ~100 LOC, MODERATE)
- Gap #6: Document reading (DEGRADED, ~300 LOC, MODERATE)
- Gap #7: Format support (DEGRADED, ~190 LOC, TRIVIAL for stubs)
- Gap #8: Safety systems (DEGRADED, ~150 LOC, MODERATE)

**Boundary assessment:**
- Plan's proposed scope (lines 132-220) is very broad — creation, update, read/search, delete, integrity validation
- This is essentially a full CRUD + search + indexing toolset
- Boundary with `hivemind-inspect` is unclear: both propose "hierarchy reads", "chunked reads", "search", "metadata reads"

### Tool Family 2: `hivemind-handoff`

**Current State (Evidence):**
- **Already exists** at `src/tools/handoff/tools.ts` — 54 LOC, 6 actions (create, read, list, update, validate, close), 22 fields
- Registered in tool catalog as `hivemind_handoff` (Artifact 1, line 16; `src/tools/index.ts:57`)
- Feature layer at `src/features/handoff/`
- Actions support delegation tracking, session linking, evidence management

**What plan claims (line 223):**
- Labels it as "(new)" — **CONTRADICTED by evidence**

**What plan proposes to add:**
- Delegation-aware task records (lines 240-261) — partially overlaps with existing handoff fields (sourceSessionId, targetSessionId, scope, constraints, evidence, returnContract)
- Exportable handoff artifacts (lines 263-274) — new capability not in current tool
- Naming and hierarchy conventions (lines 275-284) — new capability
- Validation and collaboration integrity (lines 286-296) — partially exists via `validate` action

**Boundary assessment:**
- The plan's `hivemind-handoff` overlaps with the existing `hivemind-handoff` tool
- Plan adds synthesis/export and naming conventions that don't exist in current tool
- Boundary with `hivemind_doc` is unclear for "exportable .md handoff files" (line 264) — should this be doc write or handoff export?

### Tool Family 3: `hivemind-inspect`

**Current State (Evidence):**
- **Does NOT exist** in current codebase
- Legacy had `hivemind-inspect.ts` (81 LOC, 5 actions: scan, deep, drift, introspect, traverse) (Artifact 2, line 199)
- Legacy had `hivemind-read-skeleton.ts` (57 LOC) (Artifact 2, line 94)
- Legacy had code-intelligence modules that could support inspection (AST surgeon, signature extractor, etc.) (Artifact 2)

**What plan proposes (lines 304-357):**
- Hierarchy and skeleton inspection
- Selective context extraction
- Link and structure inspection
- JSDoc and comment intelligence

**What gaps would it close (per Artifact 3):**
- Gap #2: Code intelligence (REGRESSION, ~4,053 LOC, MAJOR complexity) — but plan doesn't explicitly claim this
- Gap #5: LSP integration (REGRESSION, ~103 LOC, SIGNIFICANT complexity) — plan mentions LSP-assisted edits but doesn't commit to restoring full LSP bridge
- Gap #9: Smart extraction (DEGRADED, ~400 LOC, SIGNIFICANT) — contextExtract and inspectCode from legacy

**Boundary assessment:**
- Overlaps with `hivemind-doc` on: hierarchy reads, chunked reads, metadata reads, TOC, search, cross-link discovery
- Overlaps with `hivemind-handoff` on: structural inspection of handoff artifacts
- No clean separation mechanism proposed in the plan
- Naming consistent with current catalog (no existing `inspect` tool)

### Cross-Family Boundary Analysis

| Concern | hivemind-doc | hivemind-handoff | hivemind-inspect | Overlap? |
|---------|-------------|-----------------|-----------------|----------|
| Document hierarchy reads | YES (line 188) | — | YES (line 318) | **YES** |
| Chunked reads | YES (line 189) | — | YES (line 328) | **YES** |
| Metadata reads | YES (line 196) | — | YES (line 339) | **YES** |
| Search | YES (line 194) | — | YES (line 344) | **YES** |
| TOC generation | YES (line 197) | — | YES (line 342) | **YES** |
| Cross-link discovery | YES (line 198) | — | YES (line 341) | **YES** |
| Delegation records | — | YES (line 241) | — | Clean |
| JSDoc intelligence | — | — | YES (line 347) | Clean |
| Code skeleton reads | — | — | YES (line 319) | Clean |

**6 of 12 proposed capabilities have boundary overlap** between hivemind-doc and hivemind-inspect. The plan does not define ownership rules for these overlaps.

---

## Part C: Risk Register

### CONTRADICTED Claims (5)

| # | Claim | Evidence | Risk Level |
|---|-------|----------|------------|
| R1 | Plan references 35 files as refactor targets (lines 5-50) — ALL use `src/lib/` or `src/tools/hivemind-*.ts` paths | **35 of 35 files do NOT exist** in the current codebase. `src/lib/` directory does not exist at all. | **CRITICAL** — Plan cannot be executed without a complete file-path remapping exercise. Every target file must be located in either the current `src/` structure or the legacy archive. |
| R2 | "hivemind-handoff (new)" (line 223) | `hivemind_handoff` already exists with 6 actions, 22 fields, registered in tool catalog (Artifact 1, line 16; `src/tools/index.ts:57`) | **HIGH** — Implementing a "new" handoff tool will either duplicate or collide with the existing one. |
| R3 | Primary target: `src/lib/doc-intel.ts` (line 6) | Does not exist. Legacy version at `.archive/legacy-src-20260314-140720/lib/doc-intel.ts` (1,785 LOC) | **CRITICAL** — The monolithic doc-intel.ts is in the archive, not the active source. Plan must clarify it's working from archive sources. |
| R4 | Primary target: `src/tools/hivemind-doc.ts` (line 8) | Does not exist. Current doc tool is at `src/tools/doc/tools.ts` (35 LOC) | **HIGH** — Completely different file structure, 26x smaller. |
| R5 | Primary target: `src/lib/code-intel/doc-weaver.ts` (line 7) | Does not exist. Legacy version in archive. | **CRITICAL** — The entire `src/lib/` directory does not exist. |

### UNSUPPORTED Claims (12)

| # | Claim | Gap | Risk Level |
|---|-------|-----|------------|
| R6 | "The redesign must also improve practical usability" (line 60) | No usability metrics or assessment data exists in evidence | LOW — aspirational, not actionable |
| R7 | `hivemind-doc` should support "date/time-based hierarchies" (line 152) | No evidence of date-based hierarchy support in legacy or current code | LOW — new requirement, not based on evidence |
| R8 | `hivemind-doc` should support "diff-aware updates" (line 180) | No diff-aware update capability in legacy or current code | MODERATE — new capability, unclear if OpenCode SDK provides this |
| R9 | `hivemind-handoff` should capture "task type, workflow type, user intent, requirements, acceptance criteria, validation criteria, metrics, execution notes, proof of work, important tool calls, tool order or sequence" (lines 246-258) | Current handoff tool captures scope, constraints, evidence, summary, nextSteps — a different data model | MODERATE — significant scope expansion without evidence of need |
| R10 | `hivemind-handoff` should generate "templated .md handoff files" (line 264) | No evidence of md generation capability in current handoff tool | MODERATE — overlaps with doc write capability |
| R11 | `hivemind-inspect` JSDoc intelligence for "overlap detection, and conflict analysis" (line 347) | No JSDoc extraction tool exists in legacy or current code | MODERATE — entirely new capability |
| R12 | `hivemind-inspect` "identifying missing, weak, stale, or conflicting annotations" (line 353) | No annotation quality analysis in legacy or current code | LOW — aspirational |
| R13 | "LSP-assisted or structure-aware edits where beneficial" (line 181) | Current codebase has zero LSP integration (Artifact 3, line 44) | MODERATE — major rebuild needed, not a refactor |
| R14 | Phased implementation plan (line 573) | Not provided — plan requests this as output | LOW — plan asks implementor to create it |
| R15 | "Concurrent writes" handling (line 425) | Legacy had advisory locking. Current has none. No concurrency evidence for doc layer | MODERATE |
| R16 | "Merge conflicts" handling (line 427) | No merge conflict handling exists in legacy or current doc layer | LOW |
| R17 | "Stale reads" handling (line 426) | No stale read detection mechanism in legacy or current doc layer | LOW |

### STALE Claims (9)

| # | Claim | Was True In | Now False Because | Risk Level |
|---|-------|-----------|------------------|------------|
| R18 | `doc-intel` baseline includes 6 write operations (lines 74-79) | Legacy (pre-archive) | All write ops removed in current codebase (Artifact 3, line 38) | **HIGH** — Plan assumes write ops exist for refactoring; they need full rebuild |
| R19 | `doc-intel` baseline includes readMetadata, listDocuments, createDocument, generateTOC (lines 79, 82, 83, 84) | Legacy (pre-archive) | These ops not in current read-ops.ts (Artifact 3, line 59) | MODERATE |
| R20 | `hivemind_doc` V2 has 20 actions (lines 94-114) | Legacy tool | Current tool has 5 actions (Artifact 1, line 13) | **HIGH** — Plan describes a tool that doesn't exist |
| R21 | Write safety: 600 LOC chunk threshold (line 89) | Legacy had 400 LOC threshold (Artifact 2, line 187) | Both the threshold value AND the capability are stale | MODERATE |
| R22 | Write safety: advisory locks, atomic writes, content hashing (line 122) | Legacy write-ops.ts | Current doc layer has NONE of these (Artifact 3, line 43) | **HIGH** — Must be rebuilt, not refactored |
| R23 | "Read before write" discipline (line 90) | Legacy invariant | No write operations exist to have an invariant | MODERATE |
| R24 | File-type safety for XML, YAML, JSON (line 88) | Legacy had format weavers (all stubs except MD) | Current only supports Markdown (Artifact 3, line 40) | LOW — stubs threw exceptions anyway |
| R25 | "hivemind_doc should remain the main unified document intelligence tool" (line 124) | Legacy: 20-action monolith | Current: 5-action read-only tool | MODERATE — "remain" implies continuity that doesn't exist |
| R26 | `src/lib/` directory structure (lines 6-7, 27-45) | Legacy archive structure | `src/lib/` does not exist in current codebase | **CRITICAL** — 19 of 19 `src/lib/` references are stale |

---

## Raw Evidence References

### Files Inspected (Current Codebase)

| # | File | Lines | Purpose |
|---|------|-------|---------|
| 1 | `src/tools/doc/tools.ts` | 1-35 | Verify doc tool — 5 read-only actions |
| 2 | `src/tools/handoff/tools.ts` | 1-54 | Verify handoff tool — 6 actions, 22 fields |
| 3 | `src/tools/index.ts` | 1-137 | Verify tool catalog — 12 registered tools, no `hivemind-inspect` |
| 4 | `src/features/doc-intelligence/doc.ts` | 1-102 | Verify feature layer — dispatches 5 actions |
| 5 | `src/intelligence/doc/read-ops.ts` | 1-151 | Verify read operations — 5 exports only |
| 6 | `src/intelligence/doc/` | directory | Verify 6 files: read-ops, formats/md, safety, doc-surface-router, types, index |
| 7 | `src/tools/**/*.ts` | glob | Verify all 30 tool files — NO `hivemind-doc.ts`, `hivemind-inspect.ts`, `hivemind-hierarchy.ts`, `hivemind-read-skeleton.ts` |
| 8 | `src/hooks/**/*.ts` | glob | Verify 21 hook files — NO `session_coherence/`, NO `tool-gate.ts` |
| 9 | `src/lib/**/*.ts` | glob | Verify — ZERO files, `src/lib/` does not exist |
| 10 | `src/features/doc-intelligence/` | glob | Verify 2 files: index.ts, doc.ts |

### Evidence Artifacts Used

| Artifact | Path | Lines |
|----------|------|-------|
| Modernization Plan (validated) | `docs/planning-draft/modernize-doc-intelligence-layer.md` | 593 |
| Tool Audit Reconciled | `docs/synthesis/tool-audit-reconciled-2026-03-31.md` | 112 |
| Legacy Inventory Validated | `docs/synthesis/legacy-inventory-validated-2026-03-31.md` | 243 |
| Gap Analysis | `docs/synthesis/gap-analysis-legacy-vs-current-2026-03-31.md` | 137 |

### Git Context

| Item | Value |
|------|-------|
| Commit | `d351aecf8fbd9e8b5871c16fe425cc3c6c27e99e` |
| Date | 2026-03-31 |
| Status | Clean working tree at time of validation |

### Claim Statistics

| Status | Count | Percentage |
|--------|-------|-----------|
| SUPPORTED | 8 | 13% |
| PARTIALLY_SUPPORTED | 3 | 5% |
| STALE | 9 | 15% |
| UNSUPPORTED | 12 | 19% |
| CONTRADICTED | 5 | 8% |
| NOT_SCORED (aspirational/design principles) | 24 | 39% |
| **Total claims extracted** | **61** | 100% |

> **Note:** 24 claims in the "Cross-cutting Design Principles" (lines 361-463) and "Opencode-native design expectations" (lines 466-494) and "Quality bar" (lines 580-593) sections were not individually validated because they are aspirational design goals, not factual claims. They prescribe what SHOULD be, not what IS. They cannot be evidence-supported or contradicted — only evaluated for feasibility during implementation planning.

### Critical Summary for Implementor

1. **The plan was written against the LEGACY codebase**, not the current one. 35 of 35 file references point to files that don't exist in `src/`.
2. **`hivemind-handoff` already exists** — plan calls it "new" but it's a working tool with 6 actions.
3. **The doc tool is 26x smaller** than the plan assumes (35 LOC vs 911 LOC legacy). It's read-only.
4. **6 write operations, 7 read operations, and 4 safety systems** need full rebuild from legacy — not refactoring.
5. **No clean boundary** exists between proposed `hivemind-doc` and `hivemind-inspect` — 6 of 12 proposed capabilities overlap.
