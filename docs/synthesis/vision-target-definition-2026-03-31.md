# Vision Target Definition — Extracted from Planning Documents

**Date:** 2026-03-31  
**Packet ID:** `vision-extraction-artifact-4b-2026-03-31`  
**Git Commit:** `d351aecf8fbd9e8b5871c16fe425cc3c6c27e99e`  
**Status:** Complete extraction from both source documents

**Source Documents:**
1. `docs/planning-draft/modernize-doc-intelligence-layer.md` (592 lines) — *Refactoring vision*
2. `docs/synthesis/tools-plugins-organized-structured.md` (679 lines) — *Implementation proposal*

---

## 1. Executive Summary (Core Vision — 5 bullets)

1. **Three-tool split**: The current monolithic document intelligence layer (`doc-intel.ts`, `hivemind-doc.ts`) is split into three distinct tool families — `hivemind_doc` (document CRUD), `hivemind_handoff` (delegation records), `hivemind_inspect` (investigation/structural inspection) — each with clear boundaries and responsibilities. [mod:128-131]

2. **Standalone-first operation**: All three tools must run without requiring `.hivemind` session state, governance pipelines, task planning artifacts, or any volatile plugin subsystem. They remain independently usable while being easy to integrate later. [mod:365-377]

3. **Hierarchy-first, search-first intelligence**: The design prioritizes outline-before-body, hierarchy-before-full-read, and targeted-section-retrieval over flat search. Token efficiency is achieved through chunking, section targeting, offset reads, and indexing. [mod:379-398]

4. **Structured safety model**: Eight safety invariants govern all operations — read-before-write, atomic writes with file locking, content hashing, file-type safety, large-file chunking guards, dry-run support, malformed-file fallback, and concurrency protection. [impl:233-240, impl:503-512]

5. **Phased delivery**: Implementation proceeds in 3 phases — Phase 1 MVP (foundation libraries + core read/create/write actions), Phase 2 (full CRUD + handoff system), Phase 3 (batch operations + indexing + integration adapters). [impl:630-668]

---

## 2. Part A: Target Architecture

### 2.1 The 3 Tool Families

The new architecture splits capabilities into exactly three tool families registered with OpenCode's plugin SDK: [mod:128-131, impl:13-17]

| Tool Family | Registration File | Responsibility |
|---|---|---|
| `hivemind_doc` | `src/tools/hivemind-doc.ts` | Document and artifact intelligence — hierarchy-aware CRUD, indexing, search, and integrity across document trees. Targets: `docs/**/*`, `.md`, `.xml`, `.yaml`, `.yml`, `.json`. Supports purpose/workflow-based and date/time-based hierarchies. [mod:132-220] |
| `hivemind_handoff` | `src/tools/hivemind-handoff.ts` | Delegation records, sub-session outputs, task handoff artifacts, validation traces, and reusable synthesis inputs. Captures delegated work for monitoring, validation, preservation, retrieval, and future synthesis. Must integrate well with orchestration/delegation flows but must NOT depend on them to function now. [mod:223-300, impl:96-99] |
| `hivemind_inspect` | `src/tools/hivemind-inspect.ts` | Investigation and structural inspection of documents, artifacts, and code files. Works independently when `.hivemind` state, session management, or workflow engines are unstable. Replaces the existing `hivemind-inspect.ts`. [mod:304-358, impl:96-99] |

### 2.2 Internal Library Layer (`src/lib/`)

Shared utilities that never import `@opencode-ai/plugin` — pure logic only: [impl:19-27, impl:66-82]

| Library | Responsibility |
|---|---|
| `doc-intel.ts` | Core document intelligence — parse, skim, read-section, search. Pure document intelligence with no SDK, no `.hivemind` dependency. [impl:76, mod:69-83] |
| `format-parsers.ts` | Format-specific parsing for MD/XML/JSON/YAML — reusable across tools. [impl:77] |
| `handoff-engine.ts` | Handoff artifact generation, templating, validation — no SDK dependency. [impl:78] |
| `inspect-core.ts` | Structure/JSDoc/comment extraction — no SDK dependency. [impl:79] |
| `file-crud.ts` | Atomic read-before-write, locking, validation — reusable across tools. [impl:78] |
| `indexer.ts` | In-memory index building, cross-reference tracking. [impl:81] |
| `tool-response.ts` | (Existing) Shared response formatting. [impl:80] |
| `file-lock.ts` | (Existing) Advisory locking via `withFileLock()`. [impl:81] |

### 2.3 Helper Scripts Layer (`scripts/`)

Lightweight shell helpers invoked via `Bun.$` from tool execute functions: [impl:30-34, impl:530-542]

| Script | Purpose |
|---|---|
| `md-outline.sh` | Fast heading extraction: `grep -n '^#' "$1" \| head -100` [impl:532-533] |
| `jsdoc-extract.sh` | JSDoc block extraction: `awk '/\/\*\*/,/\*\//' "$1"` [impl:535-536] |
| `grep-helper.sh` | Structured grep with context: `grep -rn --include="*.{md,yaml,yml,json,xml}" "$1" "$2" \| head -200` [impl:538-539] |

### 2.4 OpenCode Built-in Composition Strategy

Custom tools compose with OpenCode built-in tools rather than duplicating them: [impl:518-528, mod:466-494]

| Custom Action | Composes With | How |
|---|---|---|
| `hivemind_doc.search` | `grep` + `glob` | Shell out via `Bun.$` to `grep -rn` for speed |
| `hivemind_doc.list` | `glob` | Use `Bun.$` glob or `fs.readdir` with pattern matching |
| `hivemind_doc.read` | `read` | Direct `fs.readFile` (avoids round-trip) |
| `hivemind_doc.write` | `write` | Direct `fs.writeFile` with locking (avoids permission overhead) |
| `hivemind_inspect.jsdoc` | `bash` | Shell script for JSDoc extraction |
| `hivemind_inspect.exports` | `bash` + LSP | `grep -n 'export '` + optional LSP symbol query |

**OpenCode built-in tools available for composition:** `bash`, `edit`, `write`, `read`, `grep`, `glob`, `list`, `patch`, `todowrite`, `todoread`, `webfetch`. [impl:157]

**Key composition principle:** Prefer composing built-in tools over duplicating them. Do not replace built-in tools unnecessarily. Use multiple-tools-per-file structure when it improves maintainability. [mod:488-493]

### 2.5 Architecture Diagram (from implementation proposal)

```
┌─────────────────────────────────────────────────────────────────┐
│ Tool Layer (registered with OpenCode)                           │
│   hivemind_doc │ hivemind_handoff │ hivemind_inspect             │
└───────────┬──────────────────┬──────────────────┬───────────────┘
            │                  │                  │
┌───────────▼──────────────────▼──────────────────▼───────────────┐
│ Internal Library Layer (src/lib/)                               │
│   doc-intel │ format-parsers │ handoff-engine │ inspect-core    │
│   file-crud │ indexer │ tool-response │ file-lock                │
└───────────┬──────────────────────────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────────────────────┐
│ Helper Scripts (scripts/)                                       │
│   grep-helper.sh │ jsdoc-extract.sh │ md-outline.sh             │
└──────────────────────────────────────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────────────────────┐
│ OpenCode Built-in Tools (composed via bash)                     │
│   read │ grep │ glob │ list │ write │ edit │ patch │ bash        │
└──────────────────────────────────────────────────────────────────┘
```

**Architecture boundary rule:** `src/lib/` never imports `@opencode-ai/plugin`. Only `src/tools/` touches the SDK. [impl:66-67]

---

## 3. Part B: Per-Tool Target Capabilities

### 3.1 `hivemind_doc` — Document CRUD Suite

**19 proposed actions across 4 categories:** [impl:104-125]

| Action | Category | Description | Source Line |
|---|---|---|---|
| `skim` | Read | Hierarchy/outline of a file or directory | impl:107 |
| `read` | Read | Section-aware read with optional chunking | impl:108 |
| `read_lines` | Read | Offset-based line read (large files) | impl:109 |
| `metadata` | Read | Extract frontmatter/metadata | impl:110 |
| `list` | Read | List documents matching pattern | impl:111 |
| `search` | Read | Structured search with excerpts | impl:112 |
| `index` | Read | Build/query in-memory index | impl:113 |
| `xref` | Read | Cross-reference and link check | impl:114 |
| `write` | Write | Write section/node (read-before-write) | impl:115 |
| `upsert` | Write | Create-or-update section | impl:116 |
| `append` | Write | Append to end of file/section | impl:117 |
| `insert` | Write | Insert after target heading/node | impl:118 |
| `delete` | Write | Delete section/node with preview | impl:119 |
| `create` | Write | Create new document with template | impl:120 |
| `toc` | Write | Generate/update table of contents | impl:121 |
| `batch` | Multi | Batch operations on one file | impl:122 |
| `batch_files` | Multi | Batch operations across files | impl:123 |
| `set_metadata` | Write | Write/update frontmatter | impl:124 |

**Functional groupings from modernization plan:** [mod:156-220]

- **Group A — Creation** (9 actions): create, upsert, write, append, insert, batch create, batch multi-section writes, batch multi-file writes, frontmatter/template creation, auto-pathing and file naming helpers [mod:157-170]
- **Group B — Update** (7 actions): update section/body, structured search-and-replace, hierarchy updates, rename/move/path updates, metadata updates, diff-aware updates, LSP-assisted or structure-aware edits [mod:173-183]
- **Group C — Read and Search** (12 actions): hierarchy and outline reads, chunked reads, targeted section reads, line-range reads, offset-based reads, directory skims, keyword and regex search, metadata reads, TOC generation, cross-link/reference discovery, structured output [mod:186-200]
- **Group D — Delete** (4 actions): sections, metadata fields, generated indices, whole files (explicit operation mode) [mod:203-210]

**Tool contract (Zod schema):** [impl:169-196]

```typescript
args: {
  action: tool.schema.enum([
    "skim","read","read_lines","metadata","list","search","index","xref",
    "write","upsert","append","insert","delete","create","toc",
    "batch","batch_files","set_metadata"
  ]),
  path: tool.schema.string().optional()
    .describe("File or directory path (relative to root)"),
  root: tool.schema.string().optional()
    .describe("Root directory override (default: docs/)"),
  section: tool.schema.string().optional()
    .describe("Target section heading or node path"),
  content: tool.schema.string().optional()
    .describe("Content for write operations"),
  query: tool.schema.string().optional()
    .describe("Search query or regex pattern"),
  format: tool.schema.enum(["md","xml","json","yaml","yml"]).optional()
    .describe("File format hint (auto-detected if omitted)"),
  offset: tool.schema.number().optional()
    .describe("Line offset for read_lines"),
  limit: tool.schema.number().optional()
    .describe("Max lines/tokens to return"),
  dry_run: tool.schema.boolean().optional()
    .describe("Preview changes without writing"),
  operations: tool.schema.string().optional()
    .describe("JSON array of batch operations"),
}
```

**Structured output contract:** [impl:203-228]

```typescript
interface DocToolOutput {
  status: "success" | "error"
  message: string
  entity_id?: string               // file path or section identifier
  metadata?: {
    // Read operations
    outline?: string[]             // heading hierarchy
    content?: string               // extracted content
    line_count?: number
    format?: string
    frontmatter?: Record<string, unknown>
    matches?: Array<{ path: string; line: number; excerpt: string }>
    related?: string[]             // cross-referenced paths
    // Write operations
    diff_preview?: string          // for dry_run
    bytes_written?: number
    hash?: string                  // content hash after write
    // Batch
    results?: Array<{ action: string; path: string; status: string }>
  }
}
```

### 3.2 `hivemind_handoff` — Delegation/Handoff Artifact Suite

**9 proposed actions across 2 categories:** [impl:126-138]

| Action | Category | Description | Source Line |
|---|---|---|---|
| `create` | Write | Create handoff artifact from template | impl:129 |
| `update` | Write | Update handoff record fields | impl:130 |
| `close` | Write | Finalize handoff with validation | impl:131 |
| `list` | Read | List handoff artifacts | impl:132 |
| `read` | Read | Read specific handoff | impl:133 |
| `search` | Read | Search handoffs by criteria | impl:134 |
| `validate` | Read | Validate handoff completeness | impl:135 |
| `resume` | Read | Generate resume context from handoff | impl:136 |
| `template` | Read | Show available templates | impl:137 |

**Required capabilities from modernization plan:** [mod:240-297]

- **A. Delegation-aware task records** (15+ fields): task type, workflow type, user intent, requirements, acceptance criteria, validation criteria, metrics, execution notes, proof of work, important tool calls, tool order/sequence, parent session id, sub-session id, agent identifier, timestamps, completion status, continuation markers [mod:243-261]
- **B. Exportable/parseable handoff artifacts**: auto-generated `.md` files with YAML frontmatter, predictable location strategy, structured for fast retrieval, sorted navigation, classification, indexing, selective synthesis, future resumption [mod:264-274]
- **C. Naming and hierarchy conventions**: parent-child relationships, chronological ordering, task/workflow grouping, resumability, synthesis-ready indexing [mod:276-284]
- **D. Validation and collaboration integrity**: iterative stops, checkpoint summaries, validation gates, synthesis across related handoffs, cross-domain linking without excessive token cost, context continuity after disconnects/resets [mod:287-297]

**Handoff artifact schema (YAML frontmatter):** [impl:403-424]

```yaml
type: handoff
handoff_id: hoff-2026-03-13-001
session_id: abc-123
parent_session_id: def-456
agent: build
workflow_type: research | implementation | audit | exploration | delegation
task_type: feature | bugfix | refactor | investigation | documentation
objective: "Audit authentication middleware..."
requirements: [...]
criteria:
  success: "..."
  validation: "..."
status: in_progress | blocked | complete | abandoned
confidence: high | medium | low
created: 2026-03-13T10:00:00Z
updated: 2026-03-13T12:00:00Z
```

**Sub-session export format** includes validation summary: [impl:456-468]

```yaml
## Validation Summary
- [x] Objective addressed
- [x] All requirements covered
- [ ] Success criteria met (partial — 4/5 files reviewed)
- Confidence: medium
- Duration: 23 minutes
- Tool calls: 47
```

**Resumability:** The `resume` action generates compact context blocks suitable for injection into new sessions: [impl:470-482]

```
<handoff-context id="hoff-2026-03-13-001">
Objective: Audit auth middleware
Status: in_progress (4/5 files reviewed)
Key findings: JWT expiry check missing in jwt.ts:45
Unresolved: Rate limiter ordering
Next steps: Review src/middleware/session.ts
</handoff-context>
```

**Future orchestrator integration points** (interface stubs, not implemented now): [impl:484-497]

```typescript
interface HandoffAdapter {
  onHandoffCreated?(handoff: HandoffMeta): Promise<void>
  onHandoffClosed?(handoff: HandoffMeta): Promise<void>
  resolveParentSession?(): Promise<string | null>
  resolveAgentId?(): Promise<string | null>
}
```

**Design priority:** Must integrate well with orchestration/delegation flows later, but must NOT depend on them to function now. [mod:299-300]

### 3.3 `hivemind_inspect` — Inspection/Investigation Suite

**12 proposed actions across 3 categories:** [impl:139-153]

| Action | Category | Description | Source Line |
|---|---|---|---|
| `structure` | Read | Hierarchy/skeleton of file(s) | impl:142 |
| `skim` | Read | Quick skim of file or directory | impl:143 |
| `chunk` | Read | Chunked/stepwise read | impl:144 |
| `metadata` | Read | Metadata + links + TOC | impl:145 |
| `links` | Read | Cross-link integrity check | impl:146 |
| `jsdoc` | Code | JSDoc/comment extraction | impl:147 |
| `comments` | Code | Comment extraction and analysis | impl:148 |
| `exports` | Code | Trace exported APIs | impl:149 |
| `compare` | Code | Cross-file comparison | impl:150 |
| `scan` | Legacy | Quick session state snapshot (preserved) | impl:151 |
| `deep` | Legacy | Full context refresh (preserved) | impl:152 |
| `drift` | Legacy | Alignment check (preserved) | impl:153 |

**Required capabilities from modernization plan:** [mod:314-358]

- **A. Hierarchy and skeleton inspection**: file hierarchy reads, document outlines, code skeleton reads, export and symbol summaries, heading and section maps, multi-file relationship overviews [mod:316-322]
- **B. Selective context extraction**: chunked reads, sampled reads, stepwise exploration, multi-file relational inspection, offset-based reading, targeted context windows, metadata-aware reads, selective traversal of only relevant parts [mod:325-335]
- **C. Link and structure inspection**: metadata inspection, cross-link inspection, reference discovery, TOC/structure comparison, document/code relationship tracing, quick investigation workflows using built-in search tools [mod:337-345]
- **D. JSDoc and comment intelligence**: extracting JSDoc blocks, extracting code comments, relating comments to exports/symbols/sections, identifying missing/weak/stale/conflicting annotations, improving investigation of duplicated logic or overlapping responsibilities [mod:347-356]

**LSP usage points:** [impl:544-548]
- `hivemind_inspect.exports` — LSP `textDocument/documentSymbol` for accurate export tracing
- `hivemind_inspect.jsdoc` — LSP hover for type information alongside JSDoc
- Not used for document operations (MD/YAML/JSON/XML are not LSP-served)

---

## 4. Part C: Cross-Cutting Design Principles

### 4.1 The 10 Design Principles (from modernization plan)

| # | Principle | Description | Source Line |
|---|---|---|---|
| 1 | **Standalone-first operation** | Tools must run without requiring `.hivemind` session state, session management engines, governance pipelines, task planning artifacts, internal pathing engines, blockable framework hooks, or other volatile plugin subsystems. Remain independently usable now, easy to integrate later. | mod:365-377 |
| 2 | **Hierarchy-first and traversal-first intelligence** | Prefer outline before body, hierarchy before full read, targeted section retrieval before broad reads, relational traversal over flat search-only. Goal: stronger integrity, less noise, more reliable coverage. | mod:379-387 |
| 3 | **Context-on-demand** | Only pull needed context. Improve token efficiency through chunking, section targeting, offset reads, sampling, indexing, cached/structured summaries. | mod:389-397 |
| 4 | **Read-before-write discipline** | Every write path must follow read-before-write and preserve chunk safety for large files. | mod:399-400 |
| 5 | **Large-file discipline** | No unsafe single-shot writes to large files. Robust fallback: `chunk_required`, staged edits, section-level edits, multi-pass update plans. | mod:402-409 |
| 6 | **File-type-aware behavior** | Differentiate behavior for Markdown, XML, YAML, JSON. Respect each format's structure and edge cases. Do not treat them as identical. | mod:411-418 |
| 7 | **Concurrency and integrity safety** | Handle simultaneous operations, advisory locking, atomic writes, content hashing, stale reads, merge conflicts, malformed structure, partial metadata corruption. | mod:420-431 |
| 8 | **Naming, numbering, and path intelligence** | Support conventions/validation for file names, folder names, numbering chains, child document auto-pathing, hierarchy consistency, retrieval-friendly organization. | mod:432-441 |
| 9 | **Search quality and structured output** | Return structured output: path, file type, heading/symbol, excerpt, metadata, match reason, related links/cross-references, confidence/relevance indicators. | mod:443-452 |
| 10 | **Reliability under noisy environments** | Remain dependable with context-rot, interrupted workflows, incomplete lineage data, stale planning artifacts, missing governance state, noisy session histories. | mod:454-462 |

### 4.2 Safety and Integrity Model (8 invariants)

| # | Invariant | Implementation | Source Line |
|---|---|---|---|
| 1 | **Read-before-write** | Every write action reads current content, computes diff, then writes. Enforced in `file-crud.ts`. | impl:233-234, impl:505 |
| 2 | **File-type safety** | Write operations reject files not in `.md,.xml,.json,.yaml,.yml`. | impl:235-236 |
| 3 | **Large file chunking** | Files > 500 lines (doc) or > 1000 lines (inspect) require `read_lines` with offset; writes use section targeting. | impl:237, impl:512 |
| 4 | **Atomic writes** | Uses existing `withFileLock` from `file-lock.ts` wraps all write operations. | impl:238, impl:506 |
| 5 | **Content hashing** | SHA-256 hash returned after writes; optional `expected_hash` arg for optimistic concurrency. | impl:239, impl:507 |
| 6 | **Dry-run support** | All write actions support `dry_run: true` returning diff preview without writing. | impl:240, impl:509 |
| 7 | **Malformed fallback** | If a file can't be parsed structurally, fall back to line-based operations with warning. | impl:510 |
| 8 | **Concurrency protection** | `proper-lockfile` (already a dependency) prevents TOCTOU races. | impl:511 |

### 4.3 Standalone-First Operation Requirements

All tools check for optional `.hivemind` presence but never require it: [impl:242-256]

```typescript
const hivemindRoot = existsSync(join(directory, '.hivemind')) 
  ? join(directory, '.hivemind') 
  : null
const defaultRoot = hivemindRoot 
  ? join(hivemindRoot, 'docs') 
  : join(directory, 'docs')
```

Preconditions that must NOT be required: `.hivemind` session state, session management engines, governance pipelines, task planning artifacts, internal pathing engines, blockable framework hooks, other volatile plugin subsystems, `/Users/apple/hivemind-plugin/dist` dependencies that may be unstable. [mod:366-376]

### 4.4 Format-Specific CRUD Strategy

#### Markdown [impl:314-323]

| Operation | Strategy |
|---|---|
| Parse structure | Regex heading detection (`^#{1,6}\s`), build heading tree |
| Section read | Find heading, read until next heading of same or higher level |
| Section write | Find heading boundaries, replace content between them |
| Append | Append after last line of target section |
| Insert | Find target heading, insert new section after it |
| Delete | Remove heading and all content until next same-level heading |
| Metadata | Parse YAML frontmatter between `---` delimiters |

#### JSON [impl:326-334]

| Operation | Strategy |
|---|---|
| Parse structure | `JSON.parse`, build key-path tree |
| Node read | Dot-path navigation (`root.items[0].name`) |
| Node write | Deep-set at path, `JSON.stringify` with indent |
| Append | Push to array at path |
| Delete | Delete key at path |
| Validation | `JSON.parse` round-trip after write |

#### YAML [impl:336-343]

| Operation | Strategy |
|---|---|
| Parse structure | Use `yaml` package (already a dependency) |
| Node read | Path navigation through parsed document |
| Node write | Modify parsed tree, serialize back preserving comments where possible |
| Validation | Parse round-trip |

#### XML [impl:345-352]

| Operation | Strategy |
|---|---|
| Parse structure | Regex-based tag detection for lightweight ops; full DOM parse for mutations |
| Node read | XPath-like path navigation |
| Node write | Find element boundaries, replace inner content |
| Validation | Well-formedness check after write |

### 4.5 Chunking Rules

| File Size | Strategy | Source Line |
|---|---|---|
| < 200 lines | Full read allowed | impl:373 |
| 200-1000 lines | Section-targeted read preferred, full read allowed with warning | impl:374 |
| > 1000 lines | `read_lines` with offset required; section read with auto-chunking | impl:375 |

Token budget: `limit` parameter caps output. Default 200 lines for `read`, 50 lines for `search` excerpts. [impl:378]

---

## 5. Part D: Implementation Phasing

### 5.1 Phase 1 — MVP (Foundation)

**Files to CREATE (6):** [impl:633-643]

| File | Purpose |
|---|---|
| `src/lib/doc-intel.ts` | Core document intelligence: parse, skim, read-section, search |
| `src/lib/format-parsers.ts` | MD/JSON/YAML/XML parsing utilities |
| `src/lib/file-crud.ts` | Atomic read-before-write, locking, hashing |
| `src/tools/hivemind-doc.ts` | Tool registration with actions: `skim`, `read`, `read_lines`, `list`, `search`, `create`, `write`, `metadata` |
| `src/tools/hivemind-inspect.ts` | Extend existing with: `structure`, `skim`, `chunk`, `jsdoc`, `comments` (preserve `scan`, `deep`, `drift`) |
| `scripts/md-outline.sh` | Fast heading extraction |
| `scripts/jsdoc-extract.sh` | JSDoc block extraction |

**Files to MODIFY (3):** [impl:645-650]

| File | Change |
|---|---|
| `src/tools/index.ts` | Add exports for `createHivemindDocTool`, update `createHivemindInspectTool` |
| `src/index.ts` | Register `hivemind_doc` in the `tool` object |
| `package.json` | No new dependencies needed (yaml, zod, proper-lockfile already present) |

**Phase 1 actions delivered:**
- `hivemind_doc`: skim, read, read_lines, list, search, create, write, metadata (8 actions)
- `hivemind_inspect`: structure, skim, chunk, jsdoc, comments, scan, deep, drift (8 actions)

### 5.2 Phase 2 — Full CRUD + Handoff

**Files to CREATE (2):** [impl:654-657]

| File | Purpose |
|---|---|
| `src/lib/handoff-engine.ts` | Handoff artifact generation, templates, validation |
| `src/tools/hivemind-handoff.ts` | Tool registration with all handoff actions |

**Actions to ADD:** [impl:658-659]

| Tool | New Actions |
|---|---|
| `hivemind-doc` | `upsert`, `append`, `insert`, `delete`, `toc`, `set_metadata`, `xref` (7 actions) |
| `hivemind-inspect` | `exports`, `compare`, `links`, `metadata` (4 actions) |

**Phase 2 actions delivered:**
- `hivemind_handoff`: all 9 actions (create, update, close, list, read, search, validate, resume, template)
- `hivemind_doc` grows from 8 → 15 actions
- `hivemind_inspect` grows from 8 → 12 actions

### 5.3 Phase 3 — Batch + Index + Integration Adapters

**Files to CREATE (2):** [impl:663-667]

| File | Purpose |
|---|---|
| `src/lib/indexer.ts` | In-memory index, cross-reference graph |
| `src/lib/adapters/` | Optional adapter interfaces for hiveminder/hivefiver integration |

**Actions to ADD:** [impl:666-667]

| Tool | New Actions |
|---|---|
| `hivemind-doc` | `batch`, `batch_files`, `index` (3 actions) |

**Phase 3 actions delivered:**
- `hivemind_doc` grows from 15 → 18 actions (complete)
- Integration adapter stubs for orchestrator wiring

### 5.4 Testing Strategy [impl:670-673]

- Unit tests for `doc-intel.ts`, `format-parsers.ts`, `file-crud.ts` — pure functions, no SDK
- Integration tests for each tool action using mock filesystem (existing test pattern in `tests/`)
- Edge case tests: malformed YAML, empty files, files > 1000 lines, concurrent writes, missing directories

### 5.5 Backward Compatibility and Deprecation Strategy [mod:575-576]

The modernization plan requires:
- Preserve useful existing behavior
- Retire outdated or redundant surfaces cleanly
- `hivemind_doc` should remain the main unified document intelligence tool [mod:124]
- Existing `scan`, `deep`, `drift` actions from `hivemind_inspect` are explicitly preserved [impl:151-153]

**Legacy files requiring migration decision** (32 files listed): [mod:11-49]

Each must be classified as: migrate into a tool family, refactor into a supporting library, reduce to a compatibility shim, or archive.

| File | Listed In | Decision Required |
|---|---|---|
| `src/tools/hivemind-inspect.ts` | mod:21 | Replace with new `hivemind-inspect.ts` |
| `src/tools/hivemind-read-skeleton.ts` | mod:22 | Migration decision |
| `src/tools/hivemind-hierarchy.ts` | mod:23 | Migration decision |
| `src/tools/hiveops-export.ts` | mod:24 | Migration decision |
| `src/tools/hiveops-sot.ts` | mod:25 | Migration decision |
| `src/tools/hiveops-gate.ts` | mod:26 | Migration decision |
| `src/lib/anchors.ts` | mod:27 | Migration decision |
| `src/lib/detection.ts` | mod:28 | Migration decision |
| `src/lib/gatekeeper.ts` | mod:29 | Migration decision |
| `src/lib/hierarchy-tree.ts` | mod:30 | Migration decision |
| `src/lib/hiveops-paths.ts` | mod:31 | Migration decision |
| `src/lib/inspect-engine.ts` | mod:32 | Migration decision |
| `src/lib/paths.ts` | mod:33 | Migration decision |
| `src/lib/project-snapshot.ts` | mod:34 | Migration decision |
| `src/lib/session-governance.ts` | mod:35 | Migration decision |
| `src/lib/session-engine.ts` | mod:36 | Migration decision |
| `src/lib/session-memory-purge.ts` | mod:37 | Migration decision |
| `src/lib/session-runtime.ts` | mod:38 | Migration decision |
| `src/lib/staleness.ts` | mod:39 | Migration decision |
| `src/lib/state-snapshot.ts` | mod:40 | Migration decision |
| `src/lib/task-governance.ts` | mod:41 | Migration decision |
| `src/lib/toast-throttle.ts` | mod:42 | Migration decision |
| `src/lib/tool-activation.ts` | mod:43 | Migration decision |
| `src/lib/tool-names.ts` | mod:44 | Migration decision |
| `src/lib/tool-response.ts` | mod:45 | Migration decision |
| `src/hooks/session_coherence/main_session_start.ts` | mod:46 | Migration decision |
| `src/hooks/event-handler.ts` | mod:47 | Migration decision |
| `src/hooks/soft-governance.ts` | mod:48 | Migration decision |
| `src/hooks/tool-gate.ts` | mod:49 | Migration decision |

### 5.6 Risk Areas and Mitigation [impl:675-680]

| Risk | Mitigation |
|---|---|
| XML parsing complexity | Start with regex-based lightweight parsing; add full DOM parser only if needed |
| Large file mutations | Enforce section-targeting for files > 1000 lines |

---

## 6. Part E: Quality Bar (8 Requirements)

From the modernization plan's "Quality bar" section: [mod:580-592]

| # | Requirement | Description |
|---|---|---|
| 1 | **Practical, not abstract** | Must be strict and precise enough for actual implementation |
| 2 | **Implementation-ready** | Must be strict and precise enough for implementation |
| 3 | **Easy to follow** | Must be easy to follow |
| 4 | **Resilient under framework instability** | Must remain dependable when framework subsystems are broken |
| 5 | **Optimized for agent workflows** | Must be optimized for agent workflows |
| 6 | **Strong on hierarchy, chunking, retrieval** | Must be strong on hierarchy, chunking, and retrieval |
| 7 | **Strong on standalone operation** | Must be strong on standalone operation |
| 8 | **Explicit about safety and migration** | Must be explicit about safety and migration decisions |

### What to Deliver (9 Required Outputs) [mod:498-576]

| # | Output | Description |
|---|---|---|
| 1 | **Architecture split** | Define new architecture for hivemind-doc, hivemind-handoff, hivemind-inspect with clear boundaries, shared libraries |
| 2 | **File-by-file migration map** | For every target and legacy file: keep/merge/split/rename/convert/shim/archive with rationale |
| 3 | **Tool API and action design** | Proposed actions per tool, grouped logically, with concise intent and behavior |
| 4 | **Internal library design** | Which core reusable libraries should exist under `src/lib` |
| 5 | **Data and artifact conventions** | Naming, folder layout, metadata/frontmatter schemas, indexing conventions |
| 6 | **Safety and edge-case handling** | Expected behavior for large files, malformed files, missing headings, etc. |
| 7 | **OpenCode workflow recommendations** | Best built-in tool combinations, call order, workflow patterns |
| 8 | **Implementation order** | Staged implementation plan starting with highest-value, lowest-fragility core |
| 9 | **Backward compatibility and deprecation strategy** | How to preserve useful existing behavior while retiring outdated surfaces |

---

## 7. Part F: Uncaptured Requirements

Goals, constraints, or requirements that don't fit neatly into Parts A-E:

### 7.1 Philosophy to Keep and Strengthen

From the existing `hivemind_doc` V2 baseline: [mod:115-123]

1. **Read before write** — already captured as Principle 4
2. **Chunk discipline** — already captured as Principle 5
3. **Hierarchy-first navigation** — already captured as Principle 2
4. **Context-on-demand** — already captured as Principle 3
5. **File-type safety** — already captured as Principle 6
6. **Swarm-safe operations** — advisory locks, atomic writes, content hashing — already captured in Safety Model

### 7.2 Existing Safety Expectations (Pre-Modernization)

Write operations only on `.md`, `.xml`, `.json`, `.yaml`, `.yml`. Write operations on files larger than 600 LOC return a `chunk_required` signal. [mod:87-90]

### 7.3 Hierarchy Type Support

The tool must support both purpose/workflow-based hierarchies AND date/time-based hierarchies. [mod:149-153]

### 7.4 Iterative and Incremental Document Growth

Support iterative and incremental document growth without forcing full rewrites. [mod:219]

### 7.5 Unnamed or Malformed Document Handling

Handle unnamed or malformed documents gracefully with fallbacks. [mod:217]

### 7.6 Integrity Validation Scope

Support integrity validation across hierarchy, numbering, links, and metadata relationships. [mod:218]

### 7.7 Improvement Over Current Usability

The redesign must make tools "natural first-choice utilities for agents: easier to discover, easier to compose, safer for large files, better for chunked reads, and more suitable for iterative workflows, delegation, validation, and synthesis." [mod:60]

### 7.8 Cross-Link and Reference Discovery

Treat headings, metadata, links, numbering chains, and file naming as first-class navigational structures. [mod:216]

### 7.9 Structured Output Requirements

Search/inspect/context tools should return: path, file type, heading or symbol, excerpt, metadata, match reason, related links or cross-references, confidence or relevance indicators. [mod:445-452]

### 7.10 Deletion Must Be Conservative

Deletion must be conservative, auditable, and safe. [mod:210]

### 7.11 Creation Flows Should Be Low-Friction

Creation flows should be low-friction and optimized for common agent workflows. [mod:170]

### 7.12 Naming Conventions for Handoff Artifacts

Design naming rules and folder conventions so handoff artifacts remain easy to retrieve, diff, sort, and reuse. [mod:276-284]

### 7.13 Intermediate Outputs During Sub-Sessions

Design for delegated workflows where intermediate outputs may be required at multiple checkpoints during a sub-session, not only at the end. [mod:287]

### 7.14 OpenCode Workflow Recommendations

The modernization plan asks for recommendations on built-in tool combinations, call order, and workflow patterns for: investigation, research, synthesis, planning, spec-driven edits, gatekeeping/validation flows, delegation/handoff preservation, document CRUD/indexing. [mod:560-570]

### 7.15 LSP Integration Points

LSP should be used for: export tracing (`textDocument/documentSymbol`) and type information alongside JSDoc. Not used for document operations (MD/YAML/JSON/XML are not LSP-served). [impl:544-548]

### 7.16 Python NOT Justified for MVP

All operations are well-served by TypeScript + shell scripts. Python could be added later for NLP-based document similarity or semantic search if needed. [impl:550-552]

### 7.17 File Naming Conventions (Artifact Layer) [impl:280-286]

| Pattern | Example | Use |
|---|---|---|
| Date-prefix | `2026-03-13-auth-audit.md` | Handoffs, session artifacts |
| Numbered chain | `001-phase-setup.md`, `002-phase-impl.md` | Sequential document series |
| Slug | `auth-middleware-spec.md` | General documents |
| Type prefix | `research-`, `impl-`, `audit-` | Workflow classification |

### 7.18 Directory Hierarchy Convention [impl:264-277]

```
docs/                          # Default root (configurable)
├── handoffs/                  # Handoff artifacts
│   ├── 2026-03-13/           # Date-based grouping
│   └── templates/
├── artifacts/                 # General artifacts
├── investigations/            # Inspection outputs
└── index.md                   # Auto-generated index
```

### 7.19 Hierarchy-First Workflow (Enforced Pattern) [impl:358-368]

```
skim (outline) → search (targeted) → read (section) → read_lines (chunk) → xref (related)
```

The agent should always start with `skim` to get the outline, then narrow down. `skim` returns actionable section identifiers that can be passed directly to `read`.

### 7.20 Indexing Strategy [impl:382-388]

The `index` action builds an ephemeral (rebuilt on demand) in-memory index of:
- File paths and their headings/structure
- Frontmatter metadata
- Cross-references (links between documents)
- Last-modified timestamps

No persistent index file that could go stale. [impl:388]

### 7.21 Cross-Reference Handling [impl:390-395]

The `xref` action:
1. Scans target file for markdown links, YAML `related:` fields, XML hrefs
2. Validates each reference exists
3. Returns: valid links, broken links, orphaned files (files with no inbound references)

### 7.22 Collision Avoidance [impl:155-157]

All tool names use the `hivemind_` prefix. OpenCode built-in tools: `bash`, `edit`, `write`, `read`, `grep`, `glob`, `list`, `patch`, `todowrite`, `todoread`, `webfetch`. No collisions exist.

### 7.23 Multiple-Tools-Per-File Convention [impl:90-92]

Using OpenCode's multiple-tools-per-file convention, each file exports named sub-tools. Plugin tools register via the `tool` key in the `Hooks` return object. Naming uses underscores (`hivemind_doc`, `hivemind_handoff`, `hivemind_inspect`).

### 7.24 Response Pattern [impl:199-201]

All tools return JSON via the existing `toSuccessOutput`/`toErrorOutput` pattern.

### 7.25 JSDoc and Comment Intelligence Upgrade

If current AGENTS.md guidance on JSDoc is too naive, propose a better structure or enforcement direction as part of the redesign. [mod:357]

### 7.26 Hierarchical Read-First Workflow Enforcement

The hierarchy-first workflow is enforced by making `skim` return actionable section identifiers that can be passed directly to `read`. [impl:368]

### 7.27 Frontmatter Convention (General) [impl:289-306]

```yaml
---
type: handoff | artifact | investigation | spec | plan
created: 2026-03-13T10:00:00Z
updated: 2026-03-13T12:00:00Z
session_id: abc-123
parent_session_id: def-456
agent: build
workflow: research | implementation | audit | delegation
status: draft | active | complete | archived
tags: [auth, middleware]
related: [./002-api-refactor.md, ../specs/auth-spec.md]
chain: 3
chain_total: 5
---
```

---

## 8. Line References Index

### Document 1: `docs/planning-draft/modernize-doc-intelligence-layer.md`

| Section | Lines | Content |
|---|---|---|
| Primary refactor targets | 1-9 | 3 files to refactor |
| Legacy modules list | 10-50 | 32 files requiring migration decision |
| Background and intent | 54-60 | Why the redesign is needed |
| Existing baseline: doc-intel | 64-83 | 15 existing capabilities |
| Existing safety expectations | 86-90 | File-type safety, chunk_required |
| Existing baseline: hivemind_doc V2 | 92-113 | 19 existing actions |
| Existing philosophy | 115-123 | 6 principles to keep |
| Required new structure intro | 128-131 | 3 tool families |
| Tool 1: hivemind-doc | 132-220 | Full specification |
| Group A: Creation | 157-170 | 9 creation actions |
| Group B: Update | 173-183 | 7 update actions |
| Group C: Read and search | 186-200 | 12 read/search actions |
| Group D: Delete | 203-210 | 4 delete actions |
| Additional requirements | 212-220 | 7 additional requirements |
| Tool 2: hivemind-handoff | 223-300 | Full specification |
| Cap A: Task records | 240-261 | 15+ fields |
| Cap B: Exportable artifacts | 264-274 | Structured output |
| Cap C: Naming conventions | 276-284 | Hierarchy rules |
| Cap D: Validation integrity | 287-297 | Checkpoint model |
| Design priority | 299-300 | Standalone requirement |
| Tool 3: hivemind-inspect | 304-358 | Full specification |
| Cap A: Hierarchy inspection | 314-322 | 6 capabilities |
| Cap B: Context extraction | 325-335 | 8 capabilities |
| Cap C: Link inspection | 337-345 | 6 capabilities |
| Cap D: JSDoc intelligence | 347-358 | 5 capabilities |
| Cross-cutting principles | 361-462 | 10 principles |
| Principle 1: Standalone | 365-377 | |
| Principle 2: Hierarchy-first | 379-387 | |
| Principle 3: Context-on-demand | 389-397 | |
| Principle 4: Read-before-write | 399-400 | |
| Principle 5: Large-file | 402-409 | |
| Principle 6: File-type-aware | 411-418 | |
| Principle 7: Concurrency | 420-431 | |
| Principle 8: Naming | 432-441 | |
| Principle 9: Search quality | 443-452 | |
| Principle 10: Reliability | 454-462 | |
| OpenCode-native design | 466-494 | Composition strategy |
| What to deliver | 498-576 | 9 required outputs |
| Quality bar | 580-592 | 8 quality requirements |

### Document 2: `docs/synthesis/tools-plugins-organized-structured.md`

| Section | Lines | Content |
|---|---|---|
| Layered structure diagram | 9-65 | Mermaid architecture diagram |
| Architecture boundaries | 66-82 | Why each boundary exists |
| Tool taxonomy | 86-100 | 3 tool names |
| hivemind_doc actions | 104-125 | 18 actions table |
| hivemind_handoff actions | 126-138 | 9 actions table |
| hivemind_inspect actions | 139-153 | 12 actions table |
| Collision avoidance | 155-157 | Built-in tool list |
| Tool contracts | 161-196 | Zod schema for hivemind_doc |
| Structured output contract | 199-228 | DocToolOutput interface |
| Safety behavior | 233-240 | 6 invariants table |
| Standalone vs integrated | 242-256 | Graceful degradation |
| File and artifact conventions | 260-307 | Directory + naming |
| Format-specific CRUD | 311-352 | MD/JSON/YAML/XML strategies |
| Search/Read strategy | 356-395 | Hierarchy-first workflow |
| Chunking rules | 371-378 | 3 file-size tiers |
| Handoff system design | 399-497 | Full handoff spec |
| Artifact schema | 403-424 | YAML frontmatter |
| Sub-session export | 456-468 | Validation summary |
| Resumability | 470-482 | Context injection |
| Future adapters | 484-497 | Interface stubs |
| Safety and integrity model | 501-512 | 8 principles table |
| OpenCode approach | 516-548 | Composition + scripts |
| Examples | 556-623 | Usage examples |
| Implementation plan | 628-668 | 3 phases |
| Phase 1 MVP | 630-650 | Foundation scope |
| Phase 2 | 654-659 | Full CRUD + Handoff |
| Phase 3 | 663-667 | Batch + Index + Adapters |
| Testing strategy | 670-673 | Unit + integration + edge |
| Risk mitigation | 675-680 | 2 risks |

---

## Summary Statistics

| Metric | Value |
|---|---|
| Total proposed actions (all tools) | 40 (18 doc + 9 handoff + 12 inspect + 1 legacy scan) |
| Design principles | 10 |
| Safety invariants | 8 |
| Implementation phases | 3 |
| New files to create | ~10 (6 Phase 1 + 2 Phase 2 + 2 Phase 3) |
| Files to modify | 3 |
| Legacy files requiring migration decision | 32 |
| Required outputs from planning | 9 |
| Quality requirements | 8 |
| Total source lines extracted | 1,271 (592 + 679) |
