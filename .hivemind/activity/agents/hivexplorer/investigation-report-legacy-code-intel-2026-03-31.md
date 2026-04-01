# Legacy Code-Intelligence Full Scope Investigation Report

**Archive:** `.archive/legacy-src-20260314-140720/`
**Date:** 2026-03-31
**Total LOC:** 12,586 across 33 TypeScript files

---

## Module: lib/code-intel/index.ts
**File:** `lib/code-intel/index.ts`
**LOC:** 63
**Purpose:** Barrel export aggregator for all code-intel modules
**Format Support:** N/A (module re-exports)
**Operation Types:** Export/re-export only
**Key Exports:**
- `createGitignoreFilter` — creates gitignore filter instance
- `isBinaryPathSafe` — binary file detection
- `detectSecrets/hasSecrets/getSecretTypes` — secret scanning
- `countTokens/countTokensForFile/getEncoding` — token counting
- `scanFilesToCodeMap/scanToFullCodeMap/detectLanguage` — project file scanning
- `createEmptyCodeMap/saveCodeMap/loadCodeMap` — codemap I/O
- `createTreeSitterFactory/createTreeSitterLoader` — Tree-sitter factory
- `extractSignatures/extractImportsRegex/extractExportsRegex` — signature extraction
- `compressCodemap/compressSingleFile/renderCompressedCodemap` — codemap compression
- `IncrementalUpdater` — incremental codemap updates
- `startWatchIntegration` — file system watcher bridge
- `selectSourceForInjection/renderSourceSelectionXml` — selective context injection
- `searchPatterns/findFunction/findType/findExport/findImporters` — pattern search
- `commitKnowledgeState/hasKnowledgeChanged/getLastKnowledgeCommit` — knowledge commits
- `ASTSurgeon` — AST-based code surgery
- `DocWeaver` — document weaving
- `LSPBridge` — LSP integration

**Dependencies:**
- Internal: all code-intel submodules
- External: `ignore` npm package

**Used By:** `tools/hivemind-codemap.ts`, `tools/hivemind-read-skeleton.ts`, `tools/hivemind-doc.ts`

---

## Module: ast-surgeon.ts
**File:** `lib/code-intel/ast-surgeon.ts`
**LOC:** 185
**Purpose:** AST-based code surgery — extract skeletons, patch symbols, analyze code structure
**Format Support:** TypeScript, JavaScript, Python, Go, Rust
**Operation Types:** Read (AST parse), Write (symbol patching)
**Key Exports:**
- `ASTSurgeon` class — main surgeon engine
- `extractSkeleton(filePath)` — extract imports, exports, signatures, compressed view
- `getSymbolRange(filePath, symbolName)` — get byte range for a symbol
- `patchSymbol(filePath, symbolName, newCode)` — patch symbol code with backup

**Dependencies:**
- Internal: `token-counter`, `signature-extractor`, `tree-sitter-loader`
- External: `magic-string` npm package (for surgical edits)

**Used By:** `tools/hivemind-read-skeleton.ts`

---

## Module: binary-detector.ts
**File:** `lib/code-intel/binary-detector.ts`
**LOC:** 40
**Purpose:** Detect binary file extensions to skip during code scanning
**Format Support:** N/A (file extension detection)
**Operation Types:** Inspect
**Key Exports:**
- `isBinaryPathSafe(filePath)` — returns false for binary extensions

**Dependencies:** None

**Used By:** `file-scanner.ts` (internal)

---

## Module: codemap-io.ts
**File:** `lib/code-intel/codemap-io.ts`
**LOC:** 120
**Purpose:** Serialization/deserialization of CodeMap to/from JSON files
**Format Support:** JSON
**Operation Types:** Read, Write
**Key Exports:**
- `CodeMapEntry` interface — file entry with hash, size, tokens, secrets
- `CodeMap` interface — collection of entries with metadata
- `createEmptyCodeMap(projectRoot)` — factory
- `saveCodeMap(path, codemap)` — JSON serialization
- `loadCodeMap(pathOrDir)` — JSON deserialization
- `computeCodeMapStats(entries)` — compute totals
- `scanProjectToCodeMap` — legacy scanner
- `loadCodeMapFromDir` — legacy loader

**Dependencies:** None (pure file I/O)

**Used By:** `file-scanner.ts`, `incremental-updater.ts`, `tools/hivemind-codemap.ts`

---

## Module: compressed-codemap.ts
**File:** `lib/code-intel/compressed-codemap.ts`
**LOC:** 335
**Purpose:** Compress codebase into signature-only representation for token-efficient context injection
**Format Support:** TypeScript, JavaScript, Python, Go, Rust, JSON
**Operation Types:** Transform (compression), Read (signature extraction)
**Key Exports:**
- `Signature` interface — function/class/interface/type/variable/import signature
- `Parameter` interface — function parameter with name, type, optional, default
- `CompressedFileInfo` — per-file compressed data
- `CompressedCodemap` — full compressed codemap
- `compressCodemap(codemap, options)` — full compression pipeline
- `compressSingleFile(filePath, projectRoot, language)` — single file compression
- `renderCompressedCodemap(codemap)` — human-readable serialization
- `computeCompressionRatio` — ratio calculation

**Dependencies:**
- Internal: `codemap-io`, `tree-sitter-loader`, `token-counter`, `signature-extractor`

**Used By:** `incremental-updater.ts`, `pattern-search.ts`, `selective-injector.ts`, `knowledge-commits.ts`, `tools/hivemind-codemap.ts`

---

## Module: doc-weaver.ts
**File:** `lib/code-intel/doc-weaver.ts`
**LOC:** 417
**Purpose:** Markdown document weaving — patch, upsert, append, insert, delete sections by heading
**Format Support:** Markdown (with frontmatter)
**Operation Types:** Read (outline, section content), Write (patch, upsert, append, insert, delete, frontmatter)
**Key Exports:**
- `DocWeaver` class — main weaver engine
- `readOutline(content)` — parse heading hierarchy
- `readSectionContent(content, heading)` — extract section body
- `patchSection(content, heading, newContent)` — replace section body
- `upsertSection(content, heading, newContent, level)` — replace or create section
- `appendToSection(content, heading, appendContent)` — append to section
- `insertAfterSection(content, afterHeading, newHeading, level, body)` — insert new section
- `deleteSection(content, heading)` — delete section
- `readFrontmatter(content)` — parse YAML frontmatter
- `writeFrontmatter(content, metadata)` — write/merge frontmatter
- `chunkByHeadings(content, maxChunkTokens)` — token-budget-aware chunking
- `batchPatchSections(content, ops)` — batch section operations

**Dependencies:**
- External: `remark` (markdown parser), `unist-util-visit`

**Used By:** `lib/doc-intel.ts` (top-level doc-intel imports from code-intel/doc-weaver.ts)

---

## Module: file-scanner.ts
**File:** `lib/code-intel/file-scanner.ts`
**LOC:** 191
**Purpose:** Recursive project file collection with gitignore/binary filtering
**Format Support:** All text files (detects language by extension)
**Operation Types:** Read (directory traversal)
**Key Exports:**
- `detectLanguage(filePath)` — extension-based language detection
- `scanFilesToCodeMap(projectRoot, options)` — legacy scanner (returns `{files: [{path}]}`)
- `scanToFullCodeMap(projectRoot, options)` — full scanner with hash, tokens, secrets

**Dependencies:**
- Internal: `gitignore-filter`, `binary-detector`, `token-counter`, `secret-detector`, `codemap-io`

**Used By:** `incremental-updater.ts` (via codemap-io)

---

## Module: gitignore-filter.ts
**File:** `lib/code-intel/gitignore-filter.ts`
**LOC:** 30
**Purpose:** Filter files based on .gitignore patterns
**Format Support:** N/A
**Operation Types:** Inspect (path filtering)
**Key Exports:**
- `createGitignoreFilter(projectRoot)` — creates filter instance with `isIgnored()` and `getPatterns()`

**Dependencies:**
- External: `ignore` npm package

**Used By:** `file-scanner.ts` (internal)

---

## Module: incremental-updater.ts
**File:** `lib/code-intel/incremental-updater.ts`
**LOC:** 258
**Purpose:** Incremental codemap updates on file change events with listener subscription
**Format Support:** All code files
**Operation Types:** Read (file content), Write (codemap mutation), Event subscription
**Key Exports:**
- `IncrementalUpdater` class — main updater engine
- `buildEntry(relativePath)` — build CodeMapEntry for a single file
- `updateFile(codemap, filePath, compressedCodemap?)` — delta update
- `removeFile(codemap, filePath, compressedCodemap?)` — file deletion
- `getStaleFiles(codemap)` — find files whose hash changed
- `onUpdate(callback)` — subscribe to update events

**Dependencies:**
- Internal: `token-counter`, `secret-detector`, `file-scanner`, `compressed-codemap`, `codemap-io`, `tree-sitter-loader`

**Used By:** `watch-integration.ts`

---

## Module: knowledge-commits.ts
**File:** `lib/code-intel/knowledge-commits.ts`
**LOC:** 190
**Purpose:** Atomic git commits for code intelligence state persistence
**Format Support:** JSON (codemap files)
**Operation Types:** Write (git commit)
**Key Exports:**
- `commitKnowledgeState(projectRoot, codemap, options)` — commit compressed codemap state
- `hasKnowledgeChanged(projectRoot)` — check for uncommitted changes
- `getLastKnowledgeCommit(projectRoot)` — get last knowledge commit info

**Dependencies:**
- Internal: `compressed-codemap`
- External: `node:child_process` (git exec)

**Used By:** `tools/hivemind-codemap.ts`

---

## Module: lsp-bridge.ts
**File:** `lib/code-intel/lsp-bridge.ts`
**LOC:** 103
**Purpose:** Bridge to Language Server Protocol for cross-file navigation (find references, go to definition)
**Format Support:** Any LSP-supported language
**Operation Types:** Read (LSP queries)
**Key Exports:**
- `LSPBridge` class — LSP client wrapper
- `isAvailable()` — check if LSP client connected
- `getBlastRadius(filePath, line, col)` — find all references
- `getDefinition(filePath, line, col)` — go to definition

**Dependencies:** None (interfaces with LSP client)

**Used By:** None in this archive

---

## Module: pattern-search.ts
**File:** `lib/code-intel/pattern-search.ts`
**LOC:** 191
**Purpose:** Fast pattern-first search on compressed codemap without full file reads
**Format Support:** TypeScript, JavaScript, Python, Go, Rust
**Operation Types:** Search (signature matching)
**Key Exports:**
- `searchPatterns(codemap, query)` — search by function/type/export/import/regex
- `findFunction(codemap, name)` — find functions
- `findType(codemap, name)` — find classes/interfaces/types
- `findExport(codemap, name)` — find exported symbols
- `findByPattern(codemap, pattern)` — find by regex
- `findImporters(codemap, source)` — find files importing a module

**Dependencies:**
- Internal: `compressed-codemap`

**Used By:** `tools/hivemind-codemap.ts`

---

## Module: secret-detector.ts
**File:** `lib/code-intel/secret-detector.ts`
**LOC:** 166
**Purpose:** Detect API keys, tokens, private keys, and other secrets in source code
**Format Support:** Any text file
**Operation Types:** Inspect (pattern scanning)
**Key Exports:**
- `detectSecrets(content, filePath?)` — returns `SecretMatch[]` with line/column
- `hasSecrets(content)` — boolean quick check
- `getSecretTypes(content)` — list of detected secret types
- `detectSecretsLegacy(content, filePath?)` — legacy API with `{kind, line, match}`

**Dependencies:** None (pure regex)

**Used By:** `file-scanner.ts`, `incremental-updater.ts`

---

## Module: selective-injector.ts
**File:** `lib/code-intel/selective-injector.ts`
**LOC:** 229
**Purpose:** Select source code for context injection based on file locks and token budget
**Format Support:** TypeScript, JavaScript, Python, Go, Rust
**Operation Types:** Transform (selective injection)
**Key Exports:**
- `selectSourceForInjection(codemap, fileLocks, budget)` — select files/signatures within budget
- `renderSourceSelectionXml(selection, budget)` — render as XML for cognitive packer

**Dependencies:**
- Internal: `compressed-codemap`

**Used By:** `tools/hivemind-codemap.ts`

---

## Module: signature-extractor.ts
**File:** `lib/code-intel/signature-extractor.ts`
**LOC:** 821
**Purpose:** Extract function/class/interface/type/enum signatures from source code using AST or regex fallback
**Format Support:** TypeScript, JavaScript, Python, Go, Rust
**Operation Types:** Read (signature extraction)
**Key Exports:**
- `extractSignatures(input)` — main extractor with AST or regex fallback
- `extractImportsRegex(content)` — fast import path extraction
- `extractExportsRegex(content)` — fast export name extraction

**Dependencies:**
- Internal: `tree-sitter-loader`

**Used By:** `compressed-codemap.ts`, `ast-surgeon.ts`

---

## Module: token-counter.ts
**File:** `lib/code-intel/token-counter.ts`
**LOC:** 95
**Purpose:** Count LLM tokens using tiktoken (cl100k_base) or deterministic fallback
**Format Support:** Any text
**Operation Types:** Inspect (token counting)
**Key Exports:**
- `countTokens(content)` — main counter
- `countTokensForFile(filePath)` — file-based counter
- `getEncoding()` — get active encoding name

**Dependencies:**
- External: `tiktoken` npm package (optional, falls back to char/4)

**Used By:** `ast-surgeon.ts`, `compressed-codemap.ts`, `file-scanner.ts`, `incremental-updater.ts`

---

## Module: tree-sitter-loader.ts
**File:** `lib/code-intel/tree-sitter-loader.ts`
**LOC:** 374
**Purpose:** Load Tree-sitter language parsers (WASM) for AST parsing
**Format Support:** TypeScript, JavaScript, JSON, Python, Go, Rust
**Operation Types:** Read (AST parsing)
**Key Exports:**
- `createTreeSitterFactory()` — recommended factory API
- `createTreeSitterLoader(options)` — legacy loader (deprecated)
- `extensionToLanguage(extension)` — map extension to language name
- `getSupportedExtensions()` — list supported extensions

**Dependencies:**
- External: `web-tree-sitter` npm package, `tree-sitter-*` language packages

**Used By:** `signature-extractor.ts`, `compressed-codemap.ts`, `ast-surgeon.ts`, `incremental-updater.ts`, `tools/hivemind-read-skeleton.ts`

---

## Module: watch-integration.ts
**File:** `lib/code-intel/watch-integration.ts`
**LOC:** 245
**Purpose:** Bridge FileSystemWatcher → IncrementalUpdater → EventBus for live codemap updates
**Format Support:** All code files
**Operation Types:** Read (file watching), Write (event emission)
**Key Exports:**
- `startWatchIntegration(projectRoot, codemap, options, compressedCodemap?, treeSitter?)` — start watching
- `WatchIntegration` interface — stop(), rescanAll(), getStatus()

**Dependencies:**
- Internal: `incremental-updater`, `codemap-io`, `compressed-codemap`, `tree-sitter-loader`
- External: `../watcher.js`, `../event-bus.js`

**Used By:** None in this archive

---

## Module: lib/doc-intel/formats/md.ts
**File:** `lib/doc-intel/formats/md.ts`
**LOC:** 388
**Purpose:** Full Markdown FormatWeaver implementation with remark AST parsing
**Format Support:** Markdown
**Operation Types:** Read, Write, Transform
**Key Exports:**
- `estimateTokens(content)` — rough token estimation
- `mdWeaver` object — FormatWeaver implementation with:
  - `readOutline(content)` — parse heading hierarchy
  - `readSection(content, id)` — read section body
  - `upsertSection(content, id, newContent, level)` — replace or create section
  - `writeSection(content, id, newContent)` — replace section body
  - `appendSection(content, id, newContent)` — append to section
  - `insertSection(content, afterId, newId, level, body)` — insert new section
  - `deleteSection(content, id)` — delete section
  - `readMetadata(content)` — parse YAML frontmatter
  - `writeMetadata(content, metadata)` — write/merge frontmatter
  - `chunkBySections(content, maxTokens)` — token-budget-aware chunking
  - `isWellFormed(content)` — markdown parse validation

**Dependencies:**
- External: `remark`, `unist-util-visit`, `mdast` types

**Used By:** `lib/doc-intel/index.ts`

---

## Module: lib/doc-intel/formats/json.ts
**File:** `lib/doc-intel/formats/json.ts`
**LOC:** 55
**Purpose:** JSON FormatWeaver stub — read-only (validate JSON, no section operations)
**Format Support:** JSON
**Operation Types:** Read (isWellFormed only)
**Key Exports:**
- `jsonWeaver` — FormatWeaver with all write ops throwing "Not implemented"

**Dependencies:** None

**Used By:** `lib/doc-intel/index.ts`

---

## Module: lib/doc-intel/formats/xml.ts
**File:** `lib/doc-intel/formats/xml.ts`
**LOC:** 55
**Purpose:** XML FormatWeaver stub — read-only (validate XML, no section operations)
**Format Support:** XML
**Operation Types:** Read (isWellFormed only)
**Key Exports:**
- `xmlWeaver` — FormatWeaver with all write ops throwing "Not implemented"

**Dependencies:** None

**Used By:** `lib/doc-intel/index.ts`

---

## Module: lib/doc-intel/formats/yaml.ts
**File:** `lib/doc-intel/formats/yaml.ts`
**LOC:** 83
**Purpose:** YAML FormatWeaver stub with basic validation
**Format Support:** YAML
**Operation Types:** Read (isWellFormed only)
**Key Exports:**
- `yamlWeaver` — FormatWeaver with all write ops throwing "Not implemented"

**Dependencies:** None

**Used By:** `lib/doc-intel/index.ts`

---

## Module: lib/doc-intel/index.ts
**File:** `lib/doc-intel/index.ts`
**LOC:** 58
**Purpose:** Barrel export and format registry for doc-intel FormatWeavers
**Format Support:** Markdown, XML, JSON, YAML
**Operation Types:** Export/registry only
**Key Exports:**
- `getWeaver(ext)` — get FormatWeaver by extension
- `getSupportedExtensions()` — list supported extensions
- `isExtensionSupported(ext)` — check support
- `mdWeaver`, `xmlWeaver`, `jsonWeaver`, `yamlWeaver` — format weavers

**Dependencies:**
- Internal: `formats/md`, `formats/xml`, `formats/json`, `formats/yaml`

**Used By:** `write-ops.ts`, `read-ops.ts`

---

## Module: lib/doc-intel/types.ts
**File:** `lib/doc-intel/types.ts`
**LOC:** 112
**Purpose:** Type definitions for doc-intel operations and write results
**Format Support:** N/A (types)
**Operation Types:** N/A
**Key Exports:**
- `HeadingHierarchy` — nested heading with level, text, line, children
- `DocumentChunk` — token-budget chunk with heading, content, tokenEstimate
- `FormatWeaver` interface — all format operations
- `WriteResult` — write operation result with hash, bytesChanged, opId
- `ChunkWriteSignal` — signal for section-by-section writes
- `CreateVerificationReceipt` — read-after-write verification
- `CreateDocumentResult` — document creation result
- `BatchEditOp` — single section operation
- `BatchFileOp` — multi-file operation
- `BatchFileResult` — per-file batch result

**Dependencies:** None

**Used By:** `write-ops.ts`, `read-ops.ts`, `index.ts`

---

## Module: lib/doc-intel/safety.ts
**File:** `lib/doc-intel/safety.ts`
**LOC:** 120
**Purpose:** Path validation, file-type guards, and governance write denylist enforcement
**Format Support:** N/A
**Operation Types:** Inspect
**Key Exports:**
- `safePath(projectRoot, filePath)` — resolve path with traversal prevention
- `isWritable(filePath)` — check if extension allows writes
- `isDocument(filePath)` — check if recognized document type
- `relativeProjectPath(projectRoot, absPath)` — normalize to project-relative
- `matchGovernanceWriteDenylist(normalizedPath)` — check governance patterns
- `assertGovernanceWriteAllowed(projectRoot, absPath, allowGovernance)` — enforcement

**Dependencies:** None

**Used By:** `write-ops.ts`, `read-ops.ts`

---

## Module: lib/doc-intel/read-ops.ts
**File:** `lib/doc-intel/read-ops.ts`
**LOC:** 664
**Purpose:** All read operations for document intelligence (skim, search, list, index, xref, context)
**Format Support:** Markdown, XML, JSON, YAML
**Operation Types:** Read
**Key Exports:**
- `skimDocument(projectRoot, filePath)` — extract outline, metadata, size
- `skimDirectory(projectRoot, dirPath, glob?)` — batch skim
- `listDocuments(projectRoot, dirPath, options?)` — list with metadata
- `searchDocuments(projectRoot, dirPath, query, options?)` — keyword/regex search
- `indexDocuments(projectRoot, dirPath, glob?)` — comprehensive index
- `xrefDocuments(projectRoot, dirPath, glob?)` — cross-reference analysis
- `contextExtract(projectRoot, dirPath, query, tokenBudget, glob?)` — smart context

**Dependencies:**
- Internal: `index` (getWeaver), `safety`

**Used By:** Not imported directly in this archive (merged into doc-intel.ts)

---

## Module: lib/doc-intel/write-ops.ts
**File:** `lib/doc-intel/write-ops.ts`
**LOC:** 877
**Purpose:** All write operations with locking, atomic writes, chunking guards, and verification
**Format Support:** Markdown, XML, JSON, YAML
**Operation Types:** Write
**Key Exports:**
- `upsertSection(projectRoot, filePath, heading, content, level?, expectedHash?, allowGovernance?)` — write or create
- `writeSection(projectRoot, filePath, heading, content, expectedHash?, allowGovernance?)` — replace section
- `appendSection(projectRoot, filePath, heading, content, expectedHash?, allowGovernance?)` — append to section
- `insertSection(projectRoot, filePath, afterHeading, newHeading, level, body, expectedHash?, allowGovernance?)` — insert section
- `deleteSection(projectRoot, filePath, heading, expectedHash?, allowGovernance?)` — delete section
- `writeMetadata(projectRoot, filePath, metadata, expectedHash?, allowGovernance?)` — frontmatter update
- `createDocument(projectRoot, filePath, title, metadata?, initialContent?, allowGovernance?)` — create new doc
- `batchEdit(projectRoot, filePath, ops, expectedHash?, allowGovernance?)` — single file batch
- `batchFiles(projectRoot, ops, allowGovernance?)` — multi-file batch

**Dependencies:**
- Internal: `index` (getWeaver), `types`, `safety`
- External: `proper-lockfile` npm package

**Used By:** Not imported directly in this archive (merged into doc-intel.ts)

---

## Module: lib/doc-intel.ts (top-level)
**File:** `lib/doc-intel.ts`
**LOC:** 1,785
**Purpose:** Unified document intelligence library — monolithic aggregator combining all doc-intel operations
**Format Support:** Markdown, XML, JSON, YAML
**Operation Types:** Read, Write, Search, Index, Cross-reference, Context extraction
**Key Exports:**
- `skimDocument/projectRoot, filePath)` — extract outline, metadata, size
- `skimDirectory(projectRoot, dirPath, glob?)` — batch skim
- `readSection(projectRoot, filePath, heading)` — extract section by heading
- `readChunked(projectRoot, filePath, heading?, maxTokens?)` — token-budget chunked read
- `readMetadata(projectRoot, filePath)` — frontmatter extraction
- `readLines(projectRoot, filePath, startLine, endLine)` — line range read
- `generateTOC(projectRoot, filePath)` — markdown TOC generation
- `upsertSection/writeSection/appendSection/insertSection/deleteSection` — all section operations
- `writeMetadata(projectRoot, filePath, metadata)` — frontmatter update
- `createDocument(projectRoot, filePath, title, metadata?, initialContent?)` — document creation
- `batchEdit/batchFiles` — batch operations
- `inspectCode(projectRoot, filePath)` — extract JSDoc, comments, exports, signatures
- `searchDocuments(projectRoot, dirPath, query, options?)` — keyword/regex search
- `listDocuments(projectRoot, dirPath, options?)` — document listing
- `indexDocuments(projectRoot, dirPath, glob?)` — comprehensive index
- `xrefDocuments(projectRoot, dirPath, glob?)` — cross-reference analysis
- `contextExtract(projectRoot, dirPath, query, tokenBudget, glob?)` — smart context

**Internal Dependencies:**
- `DocWeaver` from `code-intel/doc-weaver.ts`
- All doc-intel types from `doc-intel/types.ts`

**Used By:** `tools/hivemind-doc.ts`, `tools/hivemind-doc-weaver.ts`

---

## Tool: hivemind-doc.ts
**File:** `tools/hivemind-doc.ts`
**LOC:** 911
**Purpose:** Unified V2 document intelligence tool with 20 actions (supersedes hivemind_doc_weaver)
**Format Support:** Markdown, XML, JSON, YAML
**Operation Types:** All doc-intel read/write operations as OpenCode tool
**Key Exports:**
- `createHivemindDocTool(directory)` — OpenCode tool definition

**Actions:**
- skim, read, read_lines, metadata, list, search, inspect, index, xref, context (read side)
- write, upsert, append, insert, delete, batch, batch_files, set_metadata, create, toc (write side)

**Dependencies:**
- Internal: `doc-intel.js` (lib/doc-intel.ts)

---

## Tool: hivemind-doc-weaver.ts
**File:** `tools/hivemind-doc-weaver.ts`
**LOC:** 72
**Purpose:** Legacy compatibility wrapper — routes old callers through new writeSection path
**Format Support:** Markdown
**Operation Types:** Write (section patching)
**Key Exports:**
- `createHivemindDocWeaverTool(directory)` — compatibility tool definition

**Dependencies:**
- Internal: `lib/doc-intel.js` (writeSection)

---

## Tool: hivemind-inspect.ts
**File:** `tools/hivemind-inspect.ts`
**LOC:** 81
**Purpose:** Unified session state inspection tool (merged from scan_hierarchy, think_back, check_drift)
**Format Support:** N/A (session state)
**Operation Types:** Inspect
**Key Exports:**
- `createHivemindInspectTool(directory)` — OpenCode tool definition

**Actions:** scan, deep, drift, introspect, traverse

**Dependencies:**
- Internal: `lib/inspect-engine.js` (scanState, deepInspect, driftReport, introspectState, traverseState)

---

## Tool: hivemind-read-skeleton.ts
**File:** `tools/hivemind-read-skeleton.ts`
**LOC:** 57
**Purpose:** Extract AST skeleton for a source file using Tree-sitter
**Format Support:** TypeScript, JavaScript, Python, Go, Rust
**Operation Types:** Read (AST extraction)
**Key Exports:**
- `createHivemindReadSkeletonTool(directory)` — OpenCode tool definition

**Dependencies:**
- Internal: `lib/code-intel/index.js` (ASTSurgeon, createTreeSitterFactory)

---

## Tool: hivemind-codemap.ts
**File:** `tools/hivemind-codemap.ts`
**LOC:** 316
**Purpose:** Code Intelligence tool — scan, compress, status, search, inject, commit
**Format Support:** All code files
**Operation Types:** Read, Write, Search, Transform
**Key Exports:**
- `createHivemindCodemapTool(directory)` — OpenCode tool definition

**Actions:**
- scan — scan project to codemap
- compress — compress codemap to signatures
- status — show codemap status
- search — pattern search (function, type, export, importer, pattern)
- inject — select source for context injection
- commit — commit knowledge state to git

**Dependencies:**
- Internal: `lib/code-intel/index.js` (all exports), `lib/paths.js`

---

## Tool: hivemind-hierarchy.ts
**File:** `tools/hivemind-hierarchy.ts`
**LOC:** 204
**Purpose:** Hierarchy tree management tool (merged from hierarchy_prune, hierarchy_migrate)
**Format Support:** N/A (hierarchy JSON)
**Operation Types:** Read, Write
**Key Exports:**
- `createHivemindHierarchyTool(directory)` — OpenCode tool definition

**Actions:** prune (dry-run supported), migrate, status

**Dependencies:**
- Internal: `lib/hierarchy-tree.js` (loadTree, saveTree, pruneCompleted, migrateNode, etc.)

---

## Dependency Graph

```
lib/doc-intel.ts (top-level)
├── code-intel/doc-weaver.ts (DocWeaver)
├── doc-intel/types.ts
├── doc-intel/safety.ts
└── doc-intel/formats/*.ts (mdWeaver, xmlWeaver, jsonWeaver, yamlWeaver)

lib/doc-intel/index.ts
├── doc-intel/types.ts
├── doc-intel/formats/md.ts (remark, mdast)
├── doc-intel/formats/json.ts
├── doc-intel/formats/xml.ts
└── doc-intel/formats/yaml.ts

lib/doc-intel/read-ops.ts
├── doc-intel/index.ts (getWeaver)
└── doc-intel/safety.ts

lib/doc-intel/write-ops.ts
├── doc-intel/index.ts (getWeaver)
├── doc-intel/types.ts
├── doc-intel/safety.ts
└── proper-lockfile npm

lib/code-intel/index.ts (barrel)
├── code-intel/gitignore-filter.ts (ignore npm)
├── code-intel/binary-detector.ts
├── code-intel/secret-detector.ts
├── code-intel/token-counter.ts (tiktoken npm)
├── code-intel/file-scanner.ts
├── code-intel/codemap-io.ts
├── code-intel/tree-sitter-loader.ts (web-tree-sitter npm, tree-sitter-* npm)
├── code-intel/signature-extractor.ts
├── code-intel/compressed-codemap.ts
├── code-intel/incremental-updater.ts
├── code-intel/watch-integration.ts (watcher.js, event-bus.js)
├── code-intel/selective-injector.ts
├── code-intel/pattern-search.ts
├── code-intel/knowledge-commits.ts (git exec)
├── code-intel/ast-surgeon.ts (magic-string npm)
├── code-intel/doc-weaver.ts (remark, mdast)
└── code-intel/lsp-bridge.ts

tools/hivemind-doc.ts
└── lib/doc-intel.ts

tools/hivemind-doc-weaver.ts
└── lib/doc-intel.ts (writeSection)

tools/hivemind-codemap.ts
└── lib/code-intel/index.ts

tools/hivemind-read-skeleton.ts
└── lib/code-intel/index.ts (ASTSurgeon, createTreeSitterFactory)

tools/hivemind-inspect.ts
└── lib/inspect-engine.js

tools/hivemind-hierarchy.ts
└── lib/hierarchy-tree.js
```

---

## Capability Inventory Matrix

| Capability | lib/code-intel | lib/doc-intel | lib/doc-intel.ts | tools/* |
|-----------|---------------|---------------|------------------|---------|
| **Section Read** | doc-weaver.ts (markdown) | formats/md.ts | ✓ (all formats via weaver) | hivemind-doc.ts |
| **Section Write** | doc-weaver.ts | write-ops.ts (upsert/write/append/insert/delete) | ✓ (monolithic) | hivemind-doc.ts |
| **AST Parse** | tree-sitter-loader.ts, signature-extractor.ts | — | — | hivemind-read-skeleton.ts |
| **Outline Extraction** | doc-weaver.ts | formats/md.ts | ✓ (skimDocument) | hivemind-doc.ts |
| **Token Counting** | token-counter.ts | — | estimateTokens | hivemind-codemap.ts |
| **Secret Detection** | secret-detector.ts | — | — | — |
| **Pattern Search** | pattern-search.ts | — | — | hivemind-codemap.ts |
| **Language Detection** | file-scanner.ts | — | — | — |
| **Codemap I/O** | codemap-io.ts | — | — | hivemind-codemap.ts |
| **Codemap Compression** | compressed-codemap.ts | — | — | hivemind-codemap.ts |
| **Incremental Updates** | incremental-updater.ts, watch-integration.ts | — | — | — |
| **Source Injection** | selective-injector.ts | — | — | hivemind-codemap.ts |
| **Knowledge Commits** | knowledge-commits.ts | — | — | hivemind-codemap.ts |
| **File Scanning** | file-scanner.ts | — | — | hivemind-codemap.ts |
| **LSP Bridge** | lsp-bridge.ts | — | — | — |
| **Code Surgery** | ast-surgeon.ts | — | — | hivemind-read-skeleton.ts |
| **Document Search** | — | read-ops.ts | ✓ (searchDocuments) | hivemind-doc.ts |
| **Document List** | — | read-ops.ts | ✓ (listDocuments) | hivemind-doc.ts |
| **Document Index** | — | read-ops.ts | ✓ (indexDocuments) | hivemind-doc.ts |
| **Cross-References** | — | read-ops.ts | ✓ (xrefDocuments) | hivemind-doc.ts |
| **Smart Context** | — | read-ops.ts | ✓ (contextExtract) | hivemind-doc.ts |
| **Batch Operations** | — | write-ops.ts | ✓ (batchEdit/batchFiles) | hivemind-doc.ts |
| **Document Create** | — | write-ops.ts | ✓ (createDocument) | hivemind-doc.ts |
| **Frontmatter Ops** | — | formats/md.ts, write-ops.ts | ✓ (read/writeMetadata) | hivemind-doc.ts |
| **Hierarchy Mgmt** | — | — | — | hivemind-hierarchy.ts |
| **Session Inspect** | — | — | — | hivemind-inspect.ts |

---

## Special Focus Findings

### doc-intel.ts vs lib/doc-intel/ Relationship

**`lib/doc-intel.ts`** (1,785 LOC) is the **monolithic top-level aggregator** that combines all doc-intel functionality into a single module. It:
- Imports `DocWeaver` from `code-intel/doc-weaver.ts`
- Contains ALL type definitions inline
- Implements ALL operations directly (not delegating to submodules)
- Has its own safety, locking, path resolution, and format rendering logic

**`lib/doc-intel/`** (8 files, ~2,412 LOC) is the **modular decomposition** where:
- `index.ts` — format registry and weaver exports
- `types.ts` — shared type definitions
- `safety.ts` — path and governance safety
- `read-ops.ts` — all read operations (664 LOC)
- `write-ops.ts` — all write operations (877 LOC)
- `formats/*.ts` — format-specific implementations

**The monolithic `doc-intel.ts` predates/duplicates the modular `lib/doc-intel/` structure.** Tools import from `doc-intel.ts`, not from `lib/doc-intel/`.

---

### doc-weaver.ts — What "Weaving" Means

In this codebase, **weaving** refers to **section-aware document patching**:
- Not code generation or aspect-oriented weaving
- Operations: `patchSection`, `upsertSection`, `appendToSection`, `insertAfterSection`, `deleteSection`
- Uses heading text as section identifiers
- Backs up full document before changes
- Operates on remark AST for accurate boundary detection

**DocWeaver** in `lib/code-intel/doc-weaver.ts` (417 LOC) is the **markdown-specific** implementation.
**lib/doc-intel/formats/md.ts** (388 LOC) is the **markdown FormatWeaver** that implements the generic `FormatWeaver` interface from `lib/doc-intel/types.ts`.

---

### write-ops.ts — Write Operations in Legacy doc-intel

The legacy doc-intel had comprehensive write operations with:

1. **File Locking** — advisory locks via `proper-lockfile` npm
2. **Atomic Writes** — temp file + rename pattern
3. **Content Hashing** — SHA-256 for change detection
4. **Chunking Guard** — 400+ LOC files return `chunk_required` signal
5. **Governance Denylist** — blocks writes to `.hivemind/**`, `.opencode/**`, `opencode.json`, `AGENTS.md`, `CLAUDE.md`
6. **Format-Aware Dispatch** — delegates to FormatWeaver by extension
7. **Verification Receipts** — read-after-write verification for create operations

**Supported write operations:**
- `upsertSection` — replace or create
- `writeSection` — replace only
- `appendSection` — append to section
- `insertSection` — insert after heading
- `deleteSection` — remove section + content
- `writeMetadata` — frontmatter update
- `createDocument` — new file with scaffold
- `batchEdit` — multiple ops on one file
- `batchFiles` — multi-file batch

---

### ast-surgeon.ts — Code Surgery Capabilities

The `ASTSurgeon` class provides surgical code manipulation:

1. **`extractSkeleton(filePath)`** — extracts:
   - Imports list
   - Exports list
   - All signatures (function/class/interface/type)
   - Compressed view (signatures-only text)
   - Token counts (original vs skeleton)

2. **`getSymbolRange(filePath, symbolName)`** — gets exact byte range for a symbol

3. **`patchSymbol(filePath, symbolName, newCode)`** — surgical replacement:
   - Uses `magic-string` for accurate range replacement
   - Creates backup before patching
   - Returns success/bytesChanged/backup

**Requires:** Tree-sitter instance for AST parsing

---

### signature-extractor.ts — Code Intelligence Provided

**Languages supported:** TypeScript, JavaScript (including TSX), Python, Go, Rust

**For each signature extracts:**
- Type: function/class/interface/type/variable/import
- Name
- Full signature string
- Line range (start/end)
- Byte range (startIndex/endIndex)
- Docstring (JSDoc above declaration)
- Parameters (name, type, optional, default)
- Return type
- Export flag

**Dual extraction modes:**
1. **AST-based** (with Tree-sitter) — accurate parameter parsing, type extraction
2. **Regex fallback** — when no Tree-sitter available

**Utility exports:**
- `extractImportsRegex(content)` — fast import path extraction
- `extractExportsRegex(content)` — fast export name extraction

---

### lsp-bridge.ts — LSP Integration

**Design:** Wrapper around external LSP client (not a full LSP implementation)

**Capabilities:**
- `getBlastRadius(filePath, line, col)` — find all references to a symbol
- `getDefinition(filePath, line, col)` — go to definition

**Interface methods checked dynamically** (fallback chain):
- `findReferences` → `references` → `getReferences`
- `getDefinition` → `definition` → `findDefinition`

**Graceful degradation:** Returns empty array/null if LSP unavailable

---

### tree-sitter-loader.ts — Tree-sitter Usage

**Architecture:**
- Factory pattern (`createTreeSitterFactory`) — recommended API
- WASM-based language loading from `tree-sitter-*` npm packages
- Singleton parser per factory instance
- Per-language caching

**Supported languages with npm packages:**
```
typescript → tree-sitter-typescript
tsx → tree-sitter-typescript
javascript → tree-sitter-javascript
json → tree-sitter-json
python → tree-sitter-python
go → tree-sitter-go
rust → tree-sitter-rust
```

**Key interface:**
```typescript
interface TreeSitterNode {
  type: string
  text: string
  startIndex: number
  endIndex: number
  startPosition: { row: number; column: number }
  endPosition: { row: number; column: number }
  children: TreeSitterNode[]
  isNamed: boolean
  childForFieldName(fieldName: string): TreeSitterNode | null
  childrenForFieldName(fieldName: string): TreeSitterNode[]
}
```

**Graceful degradation:** Throws on init failure, `parse()` returns null if language not loaded

---

## Gaps

1. **lib/doc-intel.ts and lib/doc-intel/ are redundant** — same functionality duplicated
2. **XML/YAML/JSON FormatWeavers are stubs** — only `mdWeaver` is fully implemented
3. **LSP bridge not integrated** — `lsp-bridge.ts` exists but not connected to any tool
4. **Watch integration not connected** — `watch-integration.ts` exists but not wired to tools
5. **Code inspection in doc-intel.ts uses regex** — not Tree-sitter like signature-extractor
6. **No real-time collaboration** — locking is advisory only, no CRDT or operational transform
