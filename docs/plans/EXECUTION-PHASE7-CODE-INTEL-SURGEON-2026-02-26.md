# Phase 7 Execution Plan v1.1: Code-Intel Surgeon Engine

> **Created:** 2026-02-26
> **Updated:** 2026-02-26 (Research-validated improvements applied)
> **PRD Reference:** `docs/plans/PRD-PHASE7-CODE-INTEL-SURGEON-ENGINE-2026-02-26.md` (v1.1)
> **Execution Mode:** Layered — Sequential within layers, partial parallelism between independent tasks
> **Baseline:** 194 tests pass, 0 tsc errors, branch `feat/v2_9-c-guardrail`

---

## Overview

This plan transforms `src/lib/code-intel/` from a read-only mock-up to a surgical code intelligence system. Execution follows a strict dependency graph where each layer must complete and verify before the next begins.

**Research-Validated Improvements over v1.0:**
1. Added 7A.5 (watch-integration.ts) and 7A.7 (test updates) — missing from v1.0
2. Corrected LOC impact estimates based on live file scan
3. Added downstream consumer awareness (selective-injector.ts, pattern-search.ts)
4. Incorporated 7 FastCode patterns into surgeon engine designs
5. Added per-task verification commands (not just layer gates)
6. Precise line references from codebase verification

---

## Pre-Requisites

- [x] Phase 6 complete (verified: all 194 tests pass)
- [x] Branch: `feat/v2_9-c-guardrail`
- [ ] Install required packages:
  ```bash
  npm install magic-string ignore remark unist-util-visit
  npm install -D @types/ignore
  ```

---

## Layer 1: Foundation Fixes

### Execution Order

```
[INDEPENDENT]  7A.6: gitignore-filter.ts ─────────────────────┐
                                                                │
[SEQUENTIAL]   7A.1 → 7A.2 → 7A.3 → 7A.4 → 7A.5 ────────────┤
                                                                │
                                                      7A.7: Tests ◄──┘
```

**Parallelism Justification:** 7A.6 (gitignore) touches ONLY `gitignore-filter.ts` — zero file overlap with the byte-offset chain (7A.1–7A.5). The byte-offset chain is strictly sequential because each file imports from the previous.

---

### Task 7A.1: Fix TreeSitterNode Interface
**File:** `src/lib/code-intel/tree-sitter-loader.ts` (370 LOC → ~376 LOC)
**Risk:** Low

**Changes:**
1. Add `startIndex: number` and `endIndex: number` to `TreeSitterNode` interface (after line 19):
```typescript
export interface TreeSitterNode {
  type: string
  text: string
  startIndex: number  // ADD: Exact starting byte offset
  endIndex: number    // ADD: Exact ending byte offset
  startPosition: { row: number; column: number }
  endPosition: { row: number; column: number }
  children: TreeSitterNode[]
  isNamed: boolean
  childForFieldName(fieldName: string): TreeSitterNode | null
  childrenForFieldName(fieldName: string): TreeSitterNode[]
}
```

2. Map byte offsets in `adaptNode()` function (around line 95):
```typescript
function adaptNode(node: any): TreeSitterNode {
  return {
    type: node.type,
    text: node.text,
    startIndex: node.startIndex,  // ADD
    endIndex: node.endIndex,      // ADD
    startPosition: { row: node.startPosition.row, column: node.startPosition.column },
    endPosition: { row: node.endPosition.row, column: node.endPosition.column },
    isNamed: node.isNamed,
    // ... rest unchanged
  }
}
```

**Per-task verification:**
```bash
npx tsc --noEmit  # Must pass — interface extension is additive
```

---

### Task 7A.2: Update Signature Interface
**File:** `src/lib/code-intel/compressed-codemap.ts` (333 LOC → ~335 LOC)
**Depends on:** 7A.1
**Risk:** Medium — all Signature producers must provide these fields

**Changes:**
Add `startIndex` and `endIndex` to `Signature` interface (after line 16):
```typescript
export interface Signature {
  type: "function" | "class" | "interface" | "type" | "variable" | "import"
  name: string
  signature: string
  lineStart: number
  lineEnd: number
  startIndex: number  // ADD: Exact starting string index for patching
  endIndex: number    // ADD: Exact ending string index for patching
  docstring?: string
  parameters?: Parameter[]
  returnType?: string
  exported: boolean
}
```

**Per-task verification:**
```bash
npx tsc --noEmit  # Will show errors in signature-extractor.ts — EXPECTED, fixed in 7A.3
```

**Note:** After this change, `npx tsc --noEmit` WILL fail until 7A.3 is complete. This is expected — signature-extractor.ts creates Signature objects without the new required fields.

---

### Task 7A.3: Update Signature Extractor
**File:** `src/lib/code-intel/signature-extractor.ts` (761 LOC → ~786 LOC)
**Depends on:** 7A.1, 7A.2
**Risk:** Medium — core extraction logic, but changes are additive

**Changes:**

1. **All AST `build*` functions** — add `startIndex`/`endIndex` mapping from `node`:
   - `buildTSFunction()` — add `startIndex: node.startIndex, endIndex: node.endIndex`
   - `buildTSClass()` — same
   - `buildTSInterface()` — same
   - `buildTSTypeAlias()` — same
   - `buildTSEnum()` — same
   - `buildTSLexicalDecl()` — use `node.startIndex` for container, `valueNode.endIndex` for arrow functions
   - `buildTSImport()` — same

2. **All language `walk*` functions** — add byte offsets:
   - `walkPythonChildren()` — `startIndex: child.startIndex, endIndex: child.endIndex`
   - `walkGoChildren()` — same
   - `walkRustChildren()` — same

3. **Regex fallback** (`extractFromRegex`) — calculate byte offsets:
```typescript
function extractFromRegex(content: string): Signature[] {
  const signatures: Signature[] = []
  const lines = content.split(/\r?\n/)
  
  // Pre-calculate line start offsets to map lines to exact string indices
  const lineStartIndices = [0]
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '\n') lineStartIndices.push(i + 1)
  }

  // For each match, calculate exact byte indices:
  // startIndex = lineStartIndices[lineIndex] + leading whitespace offset
  // endIndex = lineStartIndices[blockEndLine] - 1 (or content.length)
}
```

4. **Sort signatures** by `startIndex` for deterministic ordering:
```typescript
sigs.sort((a, b) => a.startIndex - b.startIndex)
```

**Per-task verification:**
```bash
npx tsc --noEmit          # Must pass — all Signature objects now have required fields
npm test 2>&1 | grep -E "(pass|fail)"  # Existing tests should still pass
```

---

### Task 7A.4: Fix Incremental Updater
**File:** `src/lib/code-intel/incremental-updater.ts` (195 LOC → ~240 LOC)
**Depends on:** 7A.1, 7A.2, 7A.3
**Risk:** Medium — core functionality change

**Changes:**

1. **Add imports:**
```typescript
import { compressSingleFile, computeCompressionRatio, type CompressedCodemap } from "./compressed-codemap.js"
import type { TreeSitterInstance } from "./tree-sitter-loader.js"
```

2. **Update constructor** to accept TreeSitterInstance:
```typescript
export class IncrementalUpdater {
  private projectRoot: string
  private listeners: UpdateListener[] = []
  private treeSitter: TreeSitterInstance | null  // ADD

  constructor(projectRoot: string, treeSitter: TreeSitterInstance | null = null) {
    this.projectRoot = projectRoot
    this.treeSitter = treeSitter  // ADD
  }
```

3. **Update `updateFile()` signature** to accept CompressedCodemap:
```typescript
async updateFile(
  codemap: CodeMap,
  filePath: string,
  compressedCodemap?: CompressedCodemap | null  // ADD
): Promise<UpdateResult>
```

4. **Add AST state sync logic** inside `updateFile()`:
```typescript
// Phase 2 AST State Sync — patch CompressedCodemap synchronously
if (compressedCodemap && newEntry) {
  const compIndex = compressedCodemap.files.findIndex(f => f.path === filePath)
  const oldCompEntry = compIndex >= 0 ? compressedCodemap.files[compIndex] : null

  const newCompEntry = await compressSingleFile(
    filePath, this.projectRoot, newEntry.language, this.treeSitter
  )
  
  if (newCompEntry) {
    signatureDelta = newCompEntry.signatures.length - (oldCompEntry?.signatures.length || 0)
    if (oldCompEntry) {
      compressedCodemap.files[compIndex] = newCompEntry
    } else {
      compressedCodemap.files.push(newCompEntry)
    }
  }

  // Recompute stats
  compressedCodemap.totalTokens = compressedCodemap.files.reduce((sum, f) => sum + f.tokenCount, 0)
  compressedCodemap.originalTotalTokens = compressedCodemap.files.reduce((sum, f) => sum + f.originalTokenCount, 0)
  if (compressedCodemap.originalTotalTokens > 0) {
    compressedCodemap.compressionRatio = computeCompressionRatio(
      compressedCodemap.originalTotalTokens, compressedCodemap.totalTokens
    )
  }
}
```

5. **Update `removeFile()`** similarly to accept and patch CompressedCodemap.

**Per-task verification:**
```bash
npx tsc --noEmit          # Must pass
npm test 2>&1 | grep -E "(pass|fail)"  # Check for test failures
```

**Note:** Existing tests in `phase2-incremental-updater.test.ts` call `updateFile(codemap, filePath)` — this still works because `compressedCodemap` is optional (`?`). Tests should pass without changes, but will need updates in 7A.7 to verify the new behavior.

---

### Task 7A.5: Update Watch Integration
**File:** `src/lib/code-intel/watch-integration.ts` (241 LOC → ~246 LOC)
**Depends on:** 7A.4
**Risk:** Low — pass-through change

**Changes:**

1. Accept/store CompressedCodemap reference
2. Update all `updater.updateFile()` calls to pass it:
```typescript
// Line 117 (removeFile — unchanged, but add compressedCodemap if removeFile updated)
await updater.removeFile(codemap, relativePath, compressedCodemap)

// Line 132
await updater.updateFile(codemap, relativePath, compressedCodemap)

// Line 210 (rescanAll)
await updater.updateFile(codemap, filePath, compressedCodemap)
```

**Per-task verification:**
```bash
npx tsc --noEmit          # Must pass
npm test 2>&1 | grep -E "(pass|fail)"
```

---

### Task 7A.6: Replace gitignore Implementation (INDEPENDENT — can run parallel with 7A.1-7A.5)
**File:** `src/lib/code-intel/gitignore-filter.ts` (101 LOC → ~70 LOC)
**Depends on:** `npm install ignore` only
**Risk:** Low — drop-in replacement, same public API

**Changes:**
```typescript
import ignore from "ignore"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const DEFAULT_PATTERNS = [
  ".git/", "node_modules/", ".hivemind/", "dist/", ".next/", 
  "coverage/", ".nyc_output/", "*.min.js", "*.min.css"
]

export function createGitignoreFilter(projectRoot: string): {
  isIgnored: (path: string) => boolean
  getPatterns: () => string[]
} {
  const ig = ignore().add(DEFAULT_PATTERNS)
  
  try {
    const raw = readFileSync(join(projectRoot, ".gitignore"), "utf-8")
    ig.add(raw)
  } catch {
    // No .gitignore, use defaults only
  }
  
  return {
    isIgnored(path: string): boolean {
      const normalized = path.replace(/\\/g, "/").replace(/^\.\//, "")
      return ig.ignores(normalized)
    },
    getPatterns(): string[] {
      return [...DEFAULT_PATTERNS]
    },
  }
}
```

**Per-task verification:**
```bash
npx tsc --noEmit
npm test 2>&1 | grep "gitignore"  # gitignore-filter tests must pass
```

---

### Task 7A.7: Update Existing Tests
**Files:**
- `tests/code-intel/phase2-compressed-codemap.test.ts`
- `tests/code-intel/phase2-incremental-updater.test.ts`
- `tests/code-intel/phase2-watch-integration.test.ts`
- `tests/code-intel/gitignore-filter.test.ts`

**Depends on:** 7A.1–7A.6 all complete

**Changes:**
1. **compressed-codemap tests:** Assert `startIndex`/`endIndex` present and valid (`startIndex < endIndex`, `startIndex >= 0`)
2. **incremental-updater tests:** Add test for non-zero `signatureDelta` when file is modified; test with `compressedCodemap` parameter
3. **watch-integration tests:** Update `updateFile` call expectations
4. **gitignore tests:** Add negation pattern tests (`!important/`), remove `__HM_GLOBSTAR__` assertions

**NEW test to add:**
```typescript
// tests/code-intel/phase7-byte-offsets.test.ts
test("Signature startIndex/endIndex are byte-accurate", async () => {
  const content = 'export function hello(name: string): string {\n  return `Hello ${name}`\n}\n'
  const sigs = await extractSignatures({ path: "test.ts", language: "typescript", content, astRoot })
  assert(sigs[0].startIndex >= 0)
  assert(sigs[0].endIndex > sigs[0].startIndex)
  assert.strictEqual(content.slice(sigs[0].startIndex, sigs[0].endIndex).includes("function hello"), true)
})
```

**Per-task verification:**
```bash
npm test  # ALL 194+ tests must pass
```

---

## Layer 1 Verification Gate

**ALL must pass before Layer 2:**
```bash
npm test                    # All tests pass (194+ including new ones)
npx tsc --noEmit           # 0 type errors
```

**Manual spot-check:**
- Confirm `Signature` objects contain valid `startIndex`/`endIndex`
- Confirm `signatureDelta` is non-zero on file modification
- Confirm negation patterns work in gitignore filter

---

## Layer 2: Surgeon Engines (After Layer 1 Gate)

### Execution Order

```
[PARALLEL]  7B.1: ast-surgeon.ts ────────────────────────────┐
            7B.2: doc-weaver.ts ─────────────────────────────┤──► Layer 2 Gate
            7B.3: lsp-bridge.ts ─────────────────────────────┘
```

**Parallelism Justification:** All 3 surgeon engines are NEW files with zero overlap. Each imports from different dependency chains. Failure of one doesn't block others.

---

### Task 7B.1: ast-surgeon.ts (NEW)
**File:** `src/lib/code-intel/ast-surgeon.ts`
**LOC Target:** ~250 lines
**Depends on:** Layer 1 complete, `magic-string` installed

**Implementation:**
```typescript
import MagicString from "magic-string"
import type { TreeSitterInstance, TreeSitterNode } from "./tree-sitter-loader.js"
import { extractSignatures, type Signature } from "./signature-extractor.js"
import { extensionToLanguage } from "./tree-sitter-loader.js"
import { readFile, writeFile } from "node:fs/promises"
import { join, extname } from "node:path"

export interface SkeletonMap {
  path: string
  imports: string[]
  exports: string[]
  signatures: Array<{
    type: string
    name: string
    signature: string
    startIndex: number
    endIndex: number
    docstring?: string
  }>
  compressedView: string  // Human-readable skeleton text
  originalTokens: number
  skeletonTokens: number
}

export interface PatchResult {
  success: boolean
  bytesChanged: number
  backup: string  // Original content for rollback
  error?: string
}

export interface ByteRange {
  startIndex: number
  endIndex: number
  text: string
}

export class ASTSurgeon {
  constructor(
    private projectRoot: string,
    private treeSitter: TreeSitterInstance
  ) {}
  
  async extractSkeleton(filePath: string): Promise<SkeletonMap | null> { /* ... */ }
  async patchSymbol(filePath: string, symbolName: string, newCode: string): Promise<PatchResult> { /* ... */ }
  async getSymbolRange(filePath: string, symbolName: string): Promise<ByteRange | null> { /* ... */ }
}
```

**Key design decisions (FastCode-informed):**
- `extractSkeleton` walks AST, strips function bodies, keeps signatures + docstrings (FastCode pattern #9: Code Skimming)
- `patchSymbol` uses `magic-string.overwrite(startIndex, endIndex, newCode)` — byte-perfect mutation (FastCode pattern #2: Byte Offset Extraction)
- `getSymbolRange` returns exact byte range for external tools to consume

**Tests to write:**
- `tests/code-intel/phase7-ast-surgeon.test.ts`
  - extractSkeleton compresses a multi-function file
  - patchSymbol replaces a function body without corrupting surrounding code
  - patchSymbol round-trip: patch → parse → verify AST valid
  - getSymbolRange returns null for non-existent symbol

**Per-task verification:**
```bash
npx tsc --noEmit
npx tsx --test tests/code-intel/phase7-ast-surgeon.test.ts
```

---

### Task 7B.2: doc-weaver.ts (NEW)
**File:** `src/lib/code-intel/doc-weaver.ts`
**LOC Target:** ~200 lines
**Depends on:** `remark` + `unist-util-visit` installed

**Implementation:**
```typescript
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkStringify from "remark-stringify"
import { visit } from "unist-util-visit"
import type { Root, Heading } from "mdast"

export interface HeadingHierarchy {
  level: number
  text: string
  line: number
  children: HeadingHierarchy[]
}

export interface DocumentChunk {
  heading: string
  level: number
  content: string
  startOffset: number
  endOffset: number
  tokenEstimate: number
}

export class DocWeaver {
  readOutline(content: string): HeadingHierarchy[] { /* ... */ }
  patchSection(content: string, heading: string, newContent: string): string { /* ... */ }
  chunkByHeadings(content: string, maxChunkTokens: number): DocumentChunk[] { /* ... */ }
}
```

**Tests to write:**
- `tests/code-intel/phase7-doc-weaver.test.ts`
  - readOutline extracts correct heading hierarchy
  - patchSection replaces section content by heading name
  - patchSection handles end-of-document sections
  - chunkByHeadings respects token budget

**Per-task verification:**
```bash
npx tsc --noEmit
npx tsx --test tests/code-intel/phase7-doc-weaver.test.ts
```

---

### Task 7B.3: lsp-bridge.ts (NEW)
**File:** `src/lib/code-intel/lsp-bridge.ts`
**LOC Target:** ~150 lines
**Depends on:** OpenCode SDK availability

**Implementation:**
```typescript
export interface Reference {
  filePath: string
  line: number
  column: number
  text: string
}

export interface Location {
  filePath: string
  line: number
  column: number
}

export class LSPBridge {
  private available: boolean = false
  
  constructor(private lspClient: unknown | null) {
    this.available = lspClient !== null
  }
  
  isAvailable(): boolean { return this.available }
  
  async getBlastRadius(filePath: string, line: number, col: number): Promise<Reference[]> {
    if (!this.available) return []  // Graceful degradation
    // ... wrap LSP findReferences
  }
  
  async getDefinition(filePath: string, line: number, col: number): Promise<Location | null> {
    if (!this.available) return null  // Graceful degradation
    // ...
  }
}
```

**Key design:** Graceful degradation pattern — all methods return empty/null when LSP unavailable. Never throw.

**Tests to write:**
- `tests/code-intel/phase7-lsp-bridge.test.ts`
  - Returns empty array when LSP client is null
  - Returns empty array when LSP call throws
  - Interface type contracts verified

**Per-task verification:**
```bash
npx tsc --noEmit
npx tsx --test tests/code-intel/phase7-lsp-bridge.test.ts
```

---

## Layer 2 Verification Gate

**ALL must pass before Layer 3:**
```bash
npm test                    # All tests pass (200+ including new ones)
npx tsc --noEmit           # 0 type errors
```

---

## Layer 3: Cluster 3 Tools (After Layer 2 Gate)

### Execution Order

```
[PARALLEL]  7C.1: hivemind-read-skeleton.ts (depends on ast-surgeon) ──┐
            7C.2: hivemind-precision-patch.ts (depends on ast-surgeon) ─┤
            7C.3: hivemind-mesh-pull.ts (depends on ast-surgeon + lsp)  ┤──► Final Gate
            7C.4: hivemind-doc-weaver.ts (depends on doc-weaver) ───────┘
```

### Task 7C.1: hivemind-read-skeleton.ts (NEW)
**File:** `src/tools/hivemind-read-skeleton.ts`
**LOC Target:** <150 lines
**Pattern:** Zod schema → validate → call `ASTSurgeon.extractSkeleton()` → format response

### Task 7C.2: hivemind-precision-patch.ts (NEW)
**File:** `src/tools/hivemind-precision-patch.ts`
**LOC Target:** <150 lines
**Pattern:** Zod schema → validate → call `ASTSurgeon.patchSymbol()` → format response

### Task 7C.3: hivemind-mesh-pull.ts (NEW)
**File:** `src/tools/hivemind-mesh-pull.ts`
**LOC Target:** <150 lines
**Pattern:** Zod schema → validate → call `LSPBridge.getBlastRadius()` + `ASTSurgeon.extractSkeleton()` → format response

### Task 7C.4: hivemind-doc-weaver.ts (NEW)
**File:** `src/tools/hivemind-doc-weaver.ts`
**LOC Target:** <150 lines
**Pattern:** Zod schema → validate → call `DocWeaver.patchSection()` → format response

### Task 7C.5: Update tool index and barrel exports
**Files:**
- `src/tools/index.ts` — Register new tools
- `src/lib/code-intel/index.ts` — Export new modules (ast-surgeon, doc-weaver, lsp-bridge)

---

## Layer 3 Verification Gate (FINAL)

**ALL must pass:**
```bash
npm test                    # All tests pass
npx tsc --noEmit           # 0 type errors
npm run guard:public       # Public release safety
```

---

## Delegation Strategy

### Layer 1 Implementation
**Agent:** `hivemaker`
**Mode:** Sequential (7A.1→7A.2→7A.3→7A.4→7A.5→7A.7) with 7A.6 parallel
**Gate:** `npm test` + `npx tsc --noEmit` after each task

### Layer 2 Implementation
**Agent:** `hivemaker` (3 parallel dispatches)
**Mode:** Parallel (7B.1 || 7B.2 || 7B.3) — zero file overlap
**Gate:** Full test suite after all 3 complete

### Layer 3 Implementation
**Agent:** `hivemaker` (4 parallel dispatches)
**Mode:** Parallel — all tools are thin wrappers, zero overlap
**Gate:** Full test suite + `guard:public`

---

## Rollback Plan

| Failure Point | Action |
|---------------|--------|
| Layer 1 partial failure | Revert to last commit; Signature interface change is the critical risk |
| Package install failure | Check Node.js version, try `--force`, check registry |
| Layer 2 failure | Layer 1 changes are stable; only revert the new surgeon file |
| Layer 3 failure | Layer 1+2 are stable; only revert the new tool file |

**Emergency rollback:**
```bash
git stash          # Save current work
git checkout .     # Reset all files
npm test           # Verify clean state
```

---

## Summary of Changes

| Layer | Files Modified | Files Created | Files Deleted | Net LOC |
|-------|---------------|---------------|---------------|---------|
| Layer 1 | 6 (loader, codemap, extractor, updater, watch, gitignore) | 1 (new test) | 0 | +50 |
| Layer 2 | 0 | 6 (3 engines + 3 tests) | 0 | +600 |
| Layer 3 | 2 (index files) | 4 (tools) | 0 | +500 |
| **Total** | **8** | **11** | **0** | **~+1150** |

---

*Document Version: 1.1 (Research-Validated)*
*Last Updated: 2026-02-26*
*Sources: GEMINI audit, HKUDS/FastCode analysis, live codebase verification*
*Baseline: 194 tests, 0 tsc errors, branch feat/v2_9-c-guardrail*
