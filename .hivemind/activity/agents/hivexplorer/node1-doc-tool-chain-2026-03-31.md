---
investigation: doc-tool-chain
agent: hivexplorer
date: 2026-03-31
commit: d351aecf
scope: "Trace hivemind_doc tool full execution chain: tool definition -> handler -> feature layer -> intelligence layer"
status: complete
---

# Codebase Investigation Report: `hivemind_doc` Tool Execution Chain

**Scope:** Full execution chain from tool definition through feature layer to intelligence layer
**Question:** What are the exact action enums, schema fields, layer connections, write capabilities, and layer connectivity for `hivemind_doc`?
**Commit:** `d351aecf`
**Date:** 2026-03-31

---

## FINDINGS

### FINDING 1: Action Enums

**5 read-only actions defined as a TypeScript union type and mirrored in Zod enum schema.**

| Action | Defined At | Evidence |
|--------|-----------|----------|
| `skim` | `src/tools/doc/types.ts:4` | `export type HivemindDocAction = 'skim' \| 'skim_directory' \| 'read' \| 'chunk' \| 'search'` |
| `skim_directory` | `src/tools/doc/types.ts:4` | same line |
| `read` | `src/tools/doc/types.ts:4` | same line |
| `chunk` | `src/tools/doc/types.ts:4` | same line |
| `search` | `src/tools/doc/types.ts:4` | same line |

Zod mirror at `src/tools/doc/tools.ts:16`:
```typescript
action: s.enum(['skim', 'skim_directory', 'read', 'chunk', 'search'])
```

All 5 actions have pressure contracts at `src/tools/doc/types.ts:16-21`, all set to `'steady-state'`.

### FINDING 2: Schema Fields

**6 fields defined in Zod schema and TypeScript interface.**

| Field | Zod Type | TS Type | Required | Evidence |
|-------|----------|---------|----------|----------|
| `action` | `s.enum(...)` | `HivemindDocAction` | YES | `tools.ts:16`, `types.ts:7` |
| `filePath` | `s.string().optional()` | `string \| undefined` | NO | `tools.ts:17`, `types.ts:8` |
| `dirPath` | `s.string().optional()` | `string \| undefined` | NO | `tools.ts:18`, `types.ts:9` |
| `heading` | `s.string().optional()` | `string \| undefined` | NO | `tools.ts:19`, `types.ts:10` |
| `maxTokens` | `s.number().int().positive().optional()` | `number \| undefined` | NO | `tools.ts:20`, `types.ts:11` |
| `query` | `s.string().optional()` | `string \| undefined` | NO | `tools.ts:21`, `types.ts:12` |
| `globFilter` | `s.string().optional()` | `string \| undefined` | NO | `tools.ts:22`, `types.ts:13` |

### FINDING 3: Layer Chain — Tool -> Feature -> Intelligence

**Three-layer architecture, fully connected. No broken links.**

```
Layer 1: Tool Definition        src/tools/doc/tools.ts (35 LOC)
         │  imports executeHivemindDocAction from features
         │  imports error/success from shared/tool-response
         │  imports renderToolResult from shared/tool-helpers
         │  imports HivemindDocToolArgs from ./types
         │
         ▼  (tools.ts:3 → features/doc-intelligence/doc.js)
Layer 2: Feature Dispatcher      src/features/doc-intelligence/doc.ts (102 LOC)
         │  imports skimDocument, readSection, searchDocuments,
         │          skimDirectory, readChunked from intelligence/doc
         │  imports docActionPressureContracts, HivemindDocToolArgs from tools/doc/types
         │
         ▼  (doc.ts:1-7 → intelligence/doc/index.js)
Layer 3: Intelligence Operations  src/intelligence/doc/read-ops.ts (151 LOC)
         │  imports from node:fs/promises (readFile, readdir)
         │  imports from ./formats/md.js (5 functions)
         │  imports from ./safety.js (3 functions)
         │  imports types from ./types.js
         │
         ▼
Layer 3a: Markdown Parser         src/intelligence/doc/formats/md.ts (177 LOC)
          imports remark, unist-util-visit, mdast types
```

**Complete import chain:**
```
tools.ts:3   → '../../features/doc-intelligence/doc.js'        (feature layer)
doc.ts:1-7   → '../../intelligence/doc/index.js'               (intelligence layer)
read-ops.ts  → './formats/md.js'                               (markdown parser)
read-ops.ts  → './safety.js'                                   (path safety)
```

### FINDING 4: H-A Verdict — Write Operations Absent (CONFIRMED)

**H-A: "Doc tool lost all write operations during migration" — VERDICT: ALL OPERATIONS ARE READ-ONLY BY DESIGN**

Evidence:
- `src/tools/doc/tools.ts:13` — description explicitly states "Read-only document intelligence"
- `src/tools/doc/tools.ts:16` — action enum contains only: `skim`, `skim_directory`, `read`, `chunk`, `search`
- `src/intelligence/doc/read-ops.ts:1` — imports only `readFile` and `readdir` from `node:fs/promises` (no `writeFile`, `mkdir`, `appendFile`, etc.)
- `src/intelligence/doc/safety.ts` — contains `safePath()` which ONLY resolves and validates paths for reading
- No file in the entire chain imports or uses any write-capable Node.js API

**Assessment:** This is not "lost write operations" — the tool was designed as read-only from the ground up. The action names (`skim`, `read`, `chunk`, `search`) are all read semantics. There is zero write capability anywhere in the chain. The phrase "lost during migration" in H-A is misleading — no write capability ever existed in this tool's current form.

### FINDING 5: H-B Verdict — Feature Layer Is CONNECTED (NOT disconnected)

**H-B: "Feature layer is disconnected from tool" — VERDICT: FULLY CONNECTED**

Evidence of connection:
- `src/tools/doc/tools.ts:3` — `import { executeHivemindDocAction } from '../../features/doc-intelligence/doc.js'`
- `src/tools/doc/tools.ts:25` — `const result = await executeHivemindDocAction(projectRoot, args)` (direct invocation)
- `src/features/doc-intelligence/doc.ts:1-7` — imports 5 functions from intelligence layer
- `src/features/doc-intelligence/doc.ts:22-101` — dispatches to all 5 intelligence operations based on `args.action`

**Every action in the enum has a corresponding handler in the feature layer:**

| Action | Feature Handler | Intelligence Function | Evidence |
|--------|----------------|----------------------|----------|
| `skim` | `doc.ts:28-43` | `skimDocument()` | `read-ops.ts:63-74` |
| `skim_directory` | `doc.ts:45-56` | `skimDirectory()` | `read-ops.ts:76-85` |
| `read` | `doc.ts:58-73` | `readSection()` | `read-ops.ts:87-91` |
| `chunk` | `doc.ts:75-86` | `readChunked()` | `read-ops.ts:93-106` |
| `search` | `doc.ts:88-101` | `searchDocuments()` | `read-ops.ts:108-151` |

---

## STRUCTURE MAP

```
src/tools/doc/
├── tools.ts              (35 LOC) — Tool factory, Zod schema, execute handler
└── types.ts              (22 LOC) — HivemindDocAction type, HivemindDocToolArgs interface, pressure contracts

src/features/doc-intelligence/
├── doc.ts               (102 LOC) — Feature dispatcher: validates args, calls intelligence ops
└── index.ts               (1 LOC) — Re-export barrel

src/intelligence/doc/
├── index.ts               (3 LOC) — Re-export barrel (router + types + read-ops)
├── doc-surface-router.ts (39 LOC) — Maps PurposeClass to DocKnowledgeSurface (NOT used by tool chain)
├── types.ts              (29 LOC) — HeadingHierarchy, DocumentChunk, DocumentSkim, DocumentSearchResult
├── read-ops.ts          (151 LOC) — Core read operations: skimDocument, skimDirectory, readSection, readChunked, searchDocuments
├── safety.ts            (22 LOC)  — Path traversal protection, markdown detection, relative path resolution
└── formats/
    └── md.ts            (177 LOC) — Remark-based markdown parsing: outline, metadata, section extraction, chunking

Total: 581 LOC across 10 files
```

---

## PATTERNS FOUND

1. **Three-layer CQRS read-side compliance**: Tool (LLM interface) -> Feature (dispatch/validation) -> Intelligence (pure operations). No layer crosses write boundaries.
2. **Path safety enforcement**: All file paths go through `safePath()` (`safety.ts:5-14`) which prevents path traversal attacks.
3. **Pressure contracts on every action**: All 5 actions have `steady-state` pressure contracts (`types.ts:16-21`).
4. **Remark-based parsing**: The intelligence layer uses `remark` + `unist-util-visit` for AST-based markdown parsing (`formats/md.ts:1-3`).
5. **Barrel exports**: Both `features/doc-intelligence/index.ts` and `intelligence/doc/index.ts` are re-export barrels.

---

## GAPS

1. **`doc-surface-router.ts` is ORPHANED from the tool chain.** It exports `resolveDocKnowledgeSurfaces()` and `DocKnowledgeSurface` but these are NOT imported by the tool, the feature layer, or `read-ops.ts`. The intelligence layer's `index.ts` re-exports it, but nothing in the doc tool chain consumes it. This file appears to serve a different system (session routing) and was placed in this directory for organizational proximity, not for use by the doc tool.

2. **No `write` / `update` / `create` / `delete` actions exist.** The tool is purely read-only. If the tool ever needs to support doc mutations, a new action enum and handler chain would need to be added.

---

## BLOCKED

None. All 10 files in the chain were read and analyzed successfully. No contradictions found between schema definitions and handler implementations.
