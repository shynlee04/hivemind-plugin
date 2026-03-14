# Phase 7: Code-Intel Surgeon Engine PRD

> **Status:** v1.1 — Research-Validated & Improved
> **Created:** 2026-02-26
> **Updated:** 2026-02-26 (Research synthesis applied)
> **Priority:** High (Post-Phase 6)
> **Dependencies:** Phase 6 completion, magic-string, ignore, remark, unist-util-visit packages
> **Baseline:** 194 tests pass, 0 tsc errors, branch feat/v2_9-c-guardrail

---

## Executive Summary

Transform the HiveMind `src/lib/code-intel/` engine from a **read-only mock-up** to a **surgical code intelligence system** supporting Cluster 3 advanced tools (AST patching, LSP relational pulls, document weaving).

### Research Validation Summary

| Source | Method | Findings |
|--------|--------|----------|
| **Codebase Scan** | hivexplorer deep-scan of 15 files | All 6 core flaws CONFIRMED against live code |
| **FastCode (HKUDS)** | DeepWiki + Repomix analysis | 14 patterns extracted (7 adopt, 3 adapt, 4 avoid) |
| **PRD Verification** | Line-by-line claim validation | 6/6 technical claims TRUE, 0 FALSE |

### Current State Analysis (VERIFIED 2026-02-26)

| Component | LOC | Current Status | Critical Gap | Evidence |
|-----------|-----|----------------|--------------|----------|
| `tree-sitter-loader.ts` | 370 | Working | **Missing `startIndex`/`endIndex`** byte offsets | Lines 17-29: only `startPosition`/`endPosition` |
| `compressed-codemap.ts` | 333 | Working | **Missing `startIndex`/`endIndex`** in Signature interface | Lines 12-22: only `lineStart`/`lineEnd` |
| `incremental-updater.ts` | 195 | **Broken** | **Hardcoded `signatureDelta: 0`** - AST signatures never updated | Line 116: `signatureDelta: 0` |
| `gitignore-filter.ts` | 101 | Fragile | **`__HM_GLOBSTAR__` regex** - works for basic patterns but fails on negations | Lines 44-46: custom regex replacement chain |
| `signature-extractor.ts` | 761 | Working | Missing byte offset propagation in all `build*`/`walk*` functions | All functions use `startPosition.row + 1` only |
| `watch-integration.ts` | 241 | Working | Calls `updater.updateFile(codemap, relativePath)` without CompressedCodemap | Line 132 |
| `selective-injector.ts` | 229 | Working | Uses `lineStart`/`lineEnd` only (line 189) — downstream consumer | Will benefit from byte offsets |
| `pattern-search.ts` | 191 | Working | Uses `lineStart`/`lineEnd` only — downstream consumer | Will benefit from byte offsets |

### Target State

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLUSTER 3: SURGEON TOOLS                      │
├─────────────────────────────────────────────────────────────────┤
│  hivemind_read_skeleton   │  hivemind_precision_patch           │
│  hivemind_mesh_pull       │  hivemind_doc_weaver                │
│  hivemind_shard_refactor  │  hivemind_knowledge_sync            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SURGEON ENGINES (src/lib/code-intel/)         │
├─────────────────────────────────────────────────────────────────┤
│  ast-surgeon.ts           │  doc-weaver.ts     │  lsp-bridge.ts │
│  (Tree-sitter + magic-str)│  (remark + MDAST)  │  (OpenCode SDK)│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FOUNDATION (FIXES)                            │
├─────────────────────────────────────────────────────────────────┤
│  ✓ Byte-perfect offsets (startIndex/endIndex)                   │
│  ✓ Real-time AST sync (incremental-updater fixed)               │
│  ✓ Robust gitignore (ignore library)                            │
│  ✓ Markdown AST (remark + unist-util-visit)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Research Synthesis

### Source 1: GEMINI Audit (Critical Flaws) — ALL VERIFIED

**Flaw 1: Incremental Updater "Faking It" — CONFIRMED**
```typescript
// incremental-updater.ts:116 — VERIFIED at line 116
signatureDelta: 0, // Phase 2 will populate when signatures are extracted
```
- **Impact:** When files are modified, AST signatures become stale immediately
- **Result:** Agents hallucinate patches based on outdated AST data
- **Additional finding:** Also hardcoded at line 149 (removeFile) and line 98

**Flaw 2: AST Data Loss — CONFIRMED**
```typescript
// tree-sitter-loader.ts:17-29 — VERIFIED: interface has NO startIndex/endIndex
export interface TreeSitterNode {
  type: string
  text: string
  startPosition: { row: number; column: number }
  endPosition: { row: number; column: number }
  // ❌ MISSING: startIndex and endIndex (byte offsets)
}
```
- **Impact:** Cannot perform safe sectional patching without exact byte offsets
- **Result:** Line-based patching corrupts code when lines shift
- **Additional finding:** `adaptNode()` (lines 92-110) also omits byte offset mapping

**Flaw 3: Fragile gitignore Implementation — CONFIRMED**
```typescript
// gitignore-filter.ts:44-46 — VERIFIED
const withGlobstar = regexSafePattern.replace(/\*\*/g, "__HM_GLOBSTAR__")
```
- **Impact:** Works for basic patterns but fails on complex nested patterns and negations (`!pattern`)
- **Note:** The implementation is functional for simple cases, but the `ignore` npm package (50M+ weekly downloads) handles the full gitignore spec including negations, nested .gitignore files, and edge cases

**Flaw 4: Zero LSP/Markdown Awareness — CONFIRMED**
- No bridge to OpenCode LSP server for relational queries
- No AST parser for Markdown/XML documents

### Source 2: FastCode Analysis (HKUDS/FastCode) — 14 Patterns Extracted

**Patterns to ADOPT (7):**

| # | Pattern | FastCode Implementation | HiveMind Mapping |
|---|---------|------------------------|------------------|
| 1 | Language Caching | `self.languages_cache: Dict[str, Language]` | Already in `createTreeSitterFactory()` ✅ |
| 2 | Byte Offset Extraction | `code_bytes[node.start_byte:node.end_byte]` | Map `node.startIndex`/`node.endIndex` in adaptNode |
| 3 | CodeElement Unified Schema | `@dataclass CodeElement { id, type, name, file_path, ... }` | Extend `Signature` interface with `startIndex`/`endIndex` |
| 4 | Multi-Level Indexing | file → class → function → documentation | Already partial in compressed-codemap |
| 5 | Read-Only Tool Boundary | All 5 agent tools are read-only | Cluster 3 tools: read tools separate from write tools |
| 6 | Deterministic IDs | `{repo}_{type}_{md5[:16]}` | Use existing hash-based IDs |
| 7 | Smart Pruning | `relevance + source_bonus + type_bonus - size_penalty` | Apply to `selective-injector.ts` token budget |

**Patterns to ADAPT (3):**

| # | Pattern | Adaptation |
|---|---------|------------|
| 8 | Confidence Loop | Multi-round retrieval with ROI → use for scan completeness detection |
| 9 | Code Skimming | Text concatenation → generate compressed XML skeleton via tree-sitter |
| 10 | Global Maps | `file_map + module_map + export_map` → TypeScript Maps with path normalization |

**Anti-Patterns to AVOID (4):**

| # | Anti-Pattern | Why | HiveMind Advantage |
|---|-----------  |-----|-------------------|
| 11 | Full Re-Index | O(n) on every query | HiveMind already has incremental updates via `IncrementalUpdater` |
| 12 | Dual Parser | Python uses stdlib `ast`, others tree-sitter | Use tree-sitter universally |
| 13 | No Write Tools | Agent can only read | Add `patchSymbol` with byte offsets for safe mutation |
| 14 | Regex-Based Skeleton | Uses regex for class/function detection | Use tree-sitter AST queries exclusively |

### Source 3: Required Dependencies — NONE INSTALLED

| Package | Purpose | Weekly Downloads | Status |
|---------|---------|-----------------|--------|
| `magic-string` | AST manipulation with offset tracking | 15M+ | **NOT INSTALLED** |
| `ignore` | Industry-standard gitignore parser | 50M+ | **NOT INSTALLED** |
| `remark` | Markdown AST parser (MDAST) | 2M+ | **NOT INSTALLED** |
| `unist-util-visit` | MDAST traversal utilities | 5M+ | **NOT INSTALLED** |

---

## Phase 7 Implementation Plan

### Sub-Phase 7A: Foundation Fixes (Priority: Critical)

**Objective:** Stop the engine from serving stale, offset-less data

#### 7A.1: Fix AST Data Loss
- **File:** `src/lib/code-intel/tree-sitter-loader.ts` (370 LOC)
- **Changes:**
  - Add `startIndex: number` and `endIndex: number` to `TreeSitterNode` interface (lines 17-29)
  - Map `node.startIndex` and `node.endIndex` in `adaptNode()` function (lines 92-110)
- **LOC Impact:** +6 lines
- **Risk:** Low — Interface extension, backward compatible
- **Downstream:** signature-extractor.ts, compressed-codemap.ts

#### 7A.2: Update Signature Interface
- **File:** `src/lib/code-intel/compressed-codemap.ts` (333 LOC)
- **Changes:**
  - Add `startIndex: number` and `endIndex: number` to `Signature` interface (lines 12-22)
- **LOC Impact:** +2 lines
- **Risk:** Medium — All consumers of Signature need to provide these fields
- **Downstream:** signature-extractor.ts (must provide values), selective-injector.ts, pattern-search.ts (optional consumers)

#### 7A.3: Update Signature Extractor
- **File:** `src/lib/code-intel/signature-extractor.ts` (761 LOC)
- **Changes:**
  - Map `node.startIndex`/`node.endIndex` in ALL `build*` functions (buildTSFunction, buildTSClass, buildTSInterface, buildTSTypeAlias, buildTSEnum, buildTSLexicalDecl, buildTSImport)
  - Map byte offsets in ALL `walk*` functions (walkPythonChildren, walkGoChildren, walkRustChildren)
  - Calculate byte offsets in regex fallback (`extractFromRegex`) using pre-computed line start offset array
- **LOC Impact:** +25 lines
- **Risk:** Medium — Core extraction logic, but additive changes only

#### 7A.4: Fix Incremental Updater
- **File:** `src/lib/code-intel/incremental-updater.ts` (195 LOC)
- **Changes:**
  - Accept `CompressedCodemap` as parameter in `updateFile()` and `removeFile()`
  - Store `TreeSitterInstance` reference in constructor
  - Call `compressSingleFile()` on file modification to extract new AST signatures
  - Populate `signatureDelta` with actual signature count changes
  - Recompute `compressedCodemap` stats on changes
- **LOC Impact:** +40 lines (195 → ~235)
- **Risk:** Medium — Core functionality change, requires test updates

#### 7A.5: Update Watch Integration
- **File:** `src/lib/code-intel/watch-integration.ts` (241 LOC)
- **Changes:**
  - Pass `compressedCodemap` to `updater.updateFile()` calls (lines 117, 132, 210)
  - Initialize or receive `CompressedCodemap` reference
- **LOC Impact:** +5 lines
- **Risk:** Low — Signature change pass-through

#### 7A.6: Replace gitignore Implementation
- **File:** `src/lib/code-intel/gitignore-filter.ts` (101 LOC)
- **Changes:**
  - Remove custom `__HM_GLOBSTAR__` regex logic
  - Use `ignore` npm package for pattern matching
  - Support negations (`!pattern`) correctly
  - Maintain same public API (`createGitignoreFilter`)
- **LOC Impact:** -30 lines (101 → ~70)
- **Risk:** Low — Drop-in replacement, same API surface

#### 7A.7: Update Existing Tests
- **Files:**
  - `tests/code-intel/phase2-compressed-codemap.test.ts`
  - `tests/code-intel/phase2-incremental-updater.test.ts`
  - `tests/code-intel/phase2-watch-integration.test.ts`
  - `tests/code-intel/gitignore-filter.test.ts`
- **Changes:**
  - Update test assertions to expect `startIndex`/`endIndex` in Signature objects
  - Add test for non-zero `signatureDelta` on file modification
  - Add negation pattern tests for gitignore
  - Update `updateFile` call signatures in watch integration tests
- **Risk:** Medium — Must maintain backward compatibility

---

### Sub-Phase 7B: Surgeon Engines (Priority: High)

**Objective:** Build the heavy-lifting engines for Cluster 3 tools

#### 7B.1: ast-surgeon.ts (NEW)
- **Location:** `src/lib/code-intel/ast-surgeon.ts`
- **LOC Target:** ~250 lines
- **Capabilities:**
  ```typescript
  interface ASTSurgeon {
    extractSkeleton(filePath: string): Promise<SkeletonMap>
    patchSymbol(filePath: string, symbolName: string, newCode: string): Promise<PatchResult>
    getSymbolRange(filePath: string, symbolName: string): Promise<ByteRange | null>
  }
  ```
- **Dependencies:** `magic-string`, tree-sitter-loader.ts, signature-extractor.ts
- **FastCode Pattern Applied:** Byte offset extraction (#2), Code Skimming (#9)
- **Risk:** Medium — New implementation

#### 7B.2: doc-weaver.ts (NEW)
- **Location:** `src/lib/code-intel/doc-weaver.ts`
- **LOC Target:** ~200 lines
- **Capabilities:**
  ```typescript
  interface DocWeaver {
    readOutline(content: string): HeadingHierarchy
    patchSection(content: string, heading: string, newContent: string): string
    chunkByHeadings(content: string, maxChunkSize: number): DocumentChunk[]
  }
  ```
- **Dependencies:** `remark`, `unist-util-visit`
- **Risk:** Low — Well-defined problem space

#### 7B.3: lsp-bridge.ts (NEW)
- **Location:** `src/lib/code-intel/lsp-bridge.ts`
- **LOC Target:** ~150 lines
- **Capabilities:**
  ```typescript
  interface LSPBridge {
    getBlastRadius(filePath: string, line: number, col: number): Promise<Reference[]>
    getDefinition(filePath: string, line: number, col: number): Promise<Location | null>
    getHover(filePath: string, line: number, col: number): Promise<HoverInfo | null>
  }
  ```
- **Dependencies:** OpenCode SDK (client.lsp.*)
- **Risk:** Medium — External integration, graceful fallback required

---

### Sub-Phase 7C: Cluster 3 Tools (Priority: High)

**Objective:** Create thin Zod wrappers in `src/tools/` (<150 LOC each)

#### 7C.1: hivemind-read-skeleton.ts
- **Purpose:** On-demand whole-code-file consumption (3000-line file → 150-line skeleton)
- **Input:** `filePath: string`
- **Output:** `{ skeleton: SkeletonMap, tokenCount: number }`

#### 7C.2: hivemind-precision-patch.ts
- **Purpose:** Surgical code patching by symbol name using byte offsets
- **Input:** `filePath: string, symbolName: string, newCode: string`
- **Output:** `{ success: boolean, bytesChanged: number, backup: string }`

#### 7C.3: hivemind-mesh-pull.ts
- **Purpose:** Relational code retrieval (blast radius analysis)
- **Input:** `filePath: string, symbolName: string, depth: number`
- **Output:** `{ affectedFiles: SkeletonMap[], totalTokens: number }`

#### 7C.4: hivemind-doc-weaver.ts
- **Purpose:** Large document manipulation by heading
- **Input:** `filePath: string, heading: string, content: string`
- **Output:** `{ success: boolean, sectionsModified: number }`

---

## Dependency Graph

```
Phase 7A (Foundation Fixes) — SEQUENTIAL CHAIN
├── 7A.6: gitignore-filter.ts (INDEPENDENT — can parallel with 7A.1-7A.3)
│   └── npm install ignore
├── 7A.1: tree-sitter-loader.ts (startIndex/endIndex)
│   └── No dependencies
├── 7A.2: compressed-codemap.ts (Signature interface)
│   └── Depends on: 7A.1
├── 7A.3: signature-extractor.ts (Byte offset mapping)
│   └── Depends on: 7A.1, 7A.2
├── 7A.4: incremental-updater.ts (Real AST sync)
│   └── Depends on: 7A.1, 7A.2, 7A.3
├── 7A.5: watch-integration.ts (Pass CompressedCodemap)
│   └── Depends on: 7A.4
└── 7A.7: Update tests
    └── Depends on: 7A.1–7A.6

Phase 7B (Surgeon Engines) — PARTIALLY PARALLEL
├── 7B.1: ast-surgeon.ts
│   └── Depends on: 7A complete + npm install magic-string
├── 7B.2: doc-weaver.ts (INDEPENDENT of 7B.1)
│   └── Depends on: npm install remark unist-util-visit
└── 7B.3: lsp-bridge.ts (INDEPENDENT of 7B.1, 7B.2)
    └── Depends on: OpenCode SDK integration

Phase 7C (Cluster 3 Tools) — PARTIALLY PARALLEL
├── 7C.1: hivemind-read-skeleton.ts
│   └── Depends on: 7B.1
├── 7C.2: hivemind-precision-patch.ts
│   └── Depends on: 7B.1
├── 7C.3: hivemind-mesh-pull.ts
│   └── Depends on: 7B.1, 7B.3
└── 7C.4: hivemind-doc-weaver.ts
    └── Depends on: 7B.2
```

---

## Risk Register

| Risk ID | Description | Probability | Impact | Mitigation |
|---------|-------------|-------------|--------|------------|
| R1 | magic-string API changes | Low | Medium | Pin version, add integration tests |
| R2 | Tree-sitter WASM compatibility | Low | High | Test with all supported languages |
| R3 | LSP server unavailability | Medium | Medium | Graceful fallback, null-check pattern |
| R4 | Performance regression on large repos | Medium | High | Benchmark before/after, profile hot paths |
| R5 | Breaking Signature interface changes | Medium | High | Additive only (new optional→required fields) |
| R6 | signature-extractor.ts at 761 LOC | Low | Medium | Keep changes additive, don't refactor |
| R7 | Existing test breakage | Medium | Medium | Update tests in same layer as source changes |

---

## Success Criteria

### Phase 7A Acceptance
- [ ] `npm test` passes with all 194+ tests
- [ ] `npx tsc --noEmit` shows 0 errors
- [ ] All `Signature` objects have valid `startIndex`/`endIndex` (startIndex < endIndex)
- [ ] `incremental-updater.ts` returns non-zero `signatureDelta` on file modification
- [ ] `gitignore-filter.ts` handles negation patterns (`!important/`) correctly
- [ ] `watch-integration.ts` passes `CompressedCodemap` to updater

### Phase 7B Acceptance
- [ ] `ast-surgeon.extractSkeleton()` compresses 3000-line file to <200-line semantic map
- [ ] `ast-surgeon.patchSymbol()` modifies code without corruption (round-trip test)
- [ ] `doc-weaver.patchSection()` correctly updates Markdown sections by heading
- [ ] `lsp-bridge.getBlastRadius()` returns affected files (or graceful empty array)

### Phase 7C Acceptance
- [ ] All 4 Cluster 3 tools registered in tool index
- [ ] Each tool <150 LOC
- [ ] Integration tests for each tool
- [ ] Documentation updated in AGENTS.md

---

## Timeline Estimate

| Sub-Phase | Duration | Dependencies | Parallelism |
|-----------|----------|--------------|-------------|
| 7A (Foundation) | 2-3 days | Phase 6 complete | gitignore independent; rest sequential |
| 7B (Engines) | 3-4 days | 7A complete | doc-weaver + lsp-bridge parallel with ast-surgeon |
| 7C (Tools) | 2-3 days | 7B complete | Partially parallel |
| **Total** | **7-10 days** | Sequential dependency chain | |

---

## Package Installation

```bash
# Required for Phase 7 (NONE currently installed)
npm install magic-string ignore remark unist-util-visit

# Type definitions (if needed)
npm install -D @types/ignore
```

---

## Appendix A: File Inventory (15 files, verified 2026-02-26)

| File | LOC | Role | Needs Changes |
|------|-----|------|---------------|
| tree-sitter-loader.ts | 370 | WASM parser wrapper | YES — add byte offsets |
| compressed-codemap.ts | 333 | Codemap compression | YES — Signature interface |
| signature-extractor.ts | 761 | AST → Signature extraction | YES — byte offset mapping |
| incremental-updater.ts | 195 | File change tracking | YES — real AST sync |
| gitignore-filter.ts | 101 | Gitignore pattern matching | YES — replace with `ignore` |
| watch-integration.ts | 241 | File watcher integration | YES — pass CompressedCodemap |
| file-scanner.ts | 191 | Project file scanning | NO |
| codemap-io.ts | 120 | CodeMap persistence | NO |
| secret-detector.ts | 166 | Secret detection | NO |
| token-counter.ts | 95 | Token counting | NO |
| binary-detector.ts | 40 | Binary file detection | NO |
| selective-injector.ts | 229 | Context injection | OPTIONAL — could use byte offsets |
| pattern-search.ts | 191 | Pattern matching | OPTIONAL — could use byte offsets |
| knowledge-commits.ts | 190 | Knowledge git commits | NO |
| index.ts | 53 | Barrel exports | YES — export new modules |

## Appendix B: FastCode Patterns to Adopt

1. **Language Caching** — Already implemented in HiveMind ✅
2. **Byte-Based Parsing** — Core of this PRD
3. **Read-Only Tools** — Cluster 3 skeleton/mesh tools are read-only
4. **Hierarchical Indexing** — File → Class → Function → Doc
5. **Smart Pruning** — Apply to selective-injector.ts token budget
6. **Deterministic IDs** — Align with existing hash-based approach
7. **Security Boundary** — Path traversal prevention for agent tools

## Appendix C: Architecture Decision Records

### ADR-001: Why magic-string?
- **Context:** Need surgical code patching without line-based corruption
- **Decision:** Use magic-string (industry standard, used by Svelte/Vite/Rollup)
- **Evidence:** FastCode uses byte offsets (`node.start_byte:node.end_byte`) for all code extraction
- **Consequences:** Zero risk of offset shifts during patching

### ADR-002: Why ignore library?
- **Context:** Custom gitignore regex works for basic patterns but fails on negations
- **Decision:** Use `ignore` npm package (50M+ weekly downloads)
- **Consequences:** Full gitignore spec compliance, simpler code (-30 LOC)

### ADR-003: Why remark for Markdown?
- **Context:** Need to parse and modify large planning documents safely
- **Decision:** Use remark (MDAST standard, unified ecosystem)
- **Consequences:** Safe heading-based chunking, rich plugin ecosystem

### ADR-004: Why NOT full re-index? (FastCode anti-pattern)
- **Context:** FastCode re-indexes entire repo from scratch every time
- **Decision:** Keep HiveMind's `IncrementalUpdater` approach, fix it to actually sync AST
- **Consequences:** O(1) updates vs O(n) — critical for large repos

---

## Existing Test Files to Update

| Test File | For |
|-----------|-----|
| `tests/code-intel/phase2-compressed-codemap.test.ts` | Signature interface changes |
| `tests/code-intel/phase2-incremental-updater.test.ts` | signatureDelta, CompressedCodemap |
| `tests/code-intel/phase2-watch-integration.test.ts` | New updater call signature |
| `tests/code-intel/gitignore-filter.test.ts` | `ignore` library replacement |

---

*Document Version: 1.1 (Research-Validated)*
*Last Updated: 2026-02-26*
*Sources: GEMINI audit, HKUDS/FastCode analysis, live codebase verification*
*Validation: 3-stream parallel research (hivexplorer + hiverd + hivexplorer)*
