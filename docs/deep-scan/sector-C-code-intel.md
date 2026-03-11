# Sector C: Code Intelligence

## File Inventory

| Filename | LOC | Primary Responsibility |
|----------|-----|------------------------|
| `index.ts` | 63 | Barrel exports for all code-intel modules |
| `signature-extractor.ts` | 821 | AST + regex extraction of function/class/type signatures |
| `tree-sitter-loader.ts` | 374 | WebAssembly tree-sitter loading, language management |
| `watch-integration.ts` | 245 | FileSystemWatcher → IncrementalUpdater → EventBus bridge |
| `selective-injector.ts` | 229 | Token-budgeted source injection for context |
| `compressed-codemap.ts` | 335 | Signature-only codemap for 70% token reduction |
| `incremental-updater.ts` | 258 | Hot file updates with hash-based change detection |
| `knowledge-commits.ts` | 190 | Atomic git commits for code-intel state |
| `file-scanner.ts` | 191 | Full project scan with hash, tokens, secrets, language |
| `pattern-search.ts` | 191 | Pattern-first search on compressed signatures |
| `doc-weaver.ts` | 163 | Markdown section patching by heading |
| `ast-surgeon.ts` | 185 | Precision symbol patching via AST byte ranges |
| `secret-detector.ts` | 166 | Regex-based secret detection (AWS, JWT, keys) |
| `token-counter.ts` | 95 | Tiktoken cl100k_base encoding with fallback |
| `lsp-bridge.ts` | 103 | LSP find-references / get-definition bridge |
| `codemap-io.ts` | 120 | CodeMap JSON serialization + legacy compat |
| `gitignore-filter.ts` | 30 | .gitignore parsing via `ignore` package |
| `binary-detector.ts` | 40 | Extension-based binary file filtering |
| **Total** | **3,799** | |

---

## Code Scanning Pipeline

### Entry Points
1. **`scanToFullCodeMap()`** — Full project scan
   - Recursively collects all files via `collectProjectFiles()`
   - Applies gitignore filter via `createGitignoreFilter()`
   - Skips binaries via `isBinaryPathSafe()`
   - Computes per-file: hash (SHA256), size, lineCount, tokenCount, hasSecrets, secretTypes, lastModified, language
   - Returns `CodeMap` with aggregated stats

2. **`scanFilesToCodeMap()`** — Legacy scanner
   - Returns minimal `{ files: [{ path }] }` shape for backward compat

### Triggers
- **Initial scan**: Manual call to `scanToFullCodeMap()` during project init
- **Watch mode**: `startWatchIntegration()` connects `FileSystemWatcher` → `IncrementalUpdater`
- **Incremental**: `IncrementalUpdater.updateFile()` for single-file hot updates

### File Collection Algorithm
```
collectProjectFiles(root, dir):
  for entry in sorted(readdir(dir)):
    if entry.isDirectory():
      collectProjectFiles(root, entry.path)
    else if entry.isFile():
      yield relative(root, entry.path)
```

---

## AST Operations

### Signature Extraction (`signature-extractor.ts`)

**Two-Mode Extraction:**
1. **AST Mode** (when `astRoot` provided from tree-sitter)
   - Walks AST nodes by language-specific handlers
   - Extracts: functions, classes, interfaces, types, enums, imports, exports
   - Captures: parameters, return types, docstrings, exported flag

2. **Regex Fallback** (when no AST)
   - Pattern-matches: `function`, `class`, `interface`, `type`, `const arrow =`
   - Limited accuracy but zero dependencies

**Language Support:**
| Language | AST Handler | Export Detection |
|----------|-------------|------------------|
| TypeScript | `walkTSChildren()` | `export` keyword |
| JavaScript | `walkTSChildren()` | `export` keyword |
| Python | `walkPythonChildren()` | Non-underscore name |
| Go | `walkGoChildren()` | Uppercase first letter |
| Rust | `walkRustChildren()` | `pub` keyword |

### AST Surgeon (`ast-surgeon.ts`)

**Precision Patching:**
```typescript
class ASTSurgeon {
  // Extract skeleton (imports, exports, signatures, token counts)
  async extractSkeleton(filePath): Promise<SkeletonMap>

  // Get byte range for a named symbol
  async getSymbolRange(filePath, symbolName): Promise<ByteRange>

  // Patch a symbol in-place using MagicString
  async patchSymbol(filePath, symbolName, newCode): Promise<PatchResult>
}
```

**MagicString Integration:**
- Uses `MagicString.overwrite(startIndex, endIndex, newCode)`
- Preserves source maps by operating on byte ranges
- Returns backup for rollback capability

---

## Token Budget Management

### Token Counting (`token-counter.ts`)

**Primary Encoding:** `cl100k_base` (GPT-4/Claude compatible)

**Fallback Chain:**
1. Try `tiktoken.get_encoding("cl100k_base")`
2. On failure: use approximation `Math.ceil(content.length / 4)`

**Caching:**
- Encoder cached globally after first load
- Active encoding tracked (`cl100k_base` or `approximation`)

### Budget Allocation (`selective-injector.ts`)

**Constants:**
- `SMALL_FILE_THRESHOLD = 500` tokens → inject full source
- `MIN_PER_FILE_BUDGET = 200` tokens → minimum per-file allocation

**Allocation Algorithm:**
```typescript
selectSourceForInjection(codemap, fileLocks, budget):
  lockedFiles = codemap.files.filter(f => fileLocks.includes(f.path))
  lockedFiles.sort(by relevance: exports * 2 + totalSigs)
  perFileBudget = max(200, floor(budget / lockedFiles.length))

  for file in lockedFiles:
    remaining = budget - totalTokens
    if remaining <= 0: break

    if file.originalTokens <= 500 && file.originalTokens <= budget:
      inject full source
    else if file.tokenCount <= perFileBudget:
      inject all signatures
    else:
      inject top signatures by export priority
```

---

## Context Injection Patterns

### Injection Types (`SelectedFile.injectionType`)

| Type | Condition | Content |
|------|-----------|---------|
| `full` | File < 500 tokens | Complete signatures |
| `signature` | Signatures fit budget | All extracted signatures |
| `range` | Partial fit | Top exported signatures only |

### XML Rendering (`renderSourceSelectionXml`)
```xml
<source_code budget_used="1234" budget_total="5000">
  <locked_file path="src/lib/core.ts" tokens="234" type="signature">
    /** Docstring */
    export function foo(bar: string): void
  </locked_file>
</source_code>
```

### Relevance Scoring
```typescript
scoreFileRelevance(file):
  return (file.signatures.filter(s => s.exported).length * 2)
       + file.signatures.length
```

---

## Tree-sitter Integration

### Loading Pipeline (`tree-sitter-loader.ts`)

**Factory Pattern:**
```typescript
const factory = createTreeSitterFactory()
await factory.preloadLanguage("typescript")
const instance = await factory.getInstance()
const ast = instance.parse(content, "typescript")
```

**WASM Resolution Strategy:**
1. Resolve via `createRequire` from `package.json`
2. Look relative to `web-tree-sitter` in `node_modules`
3. Load `.wasm` bytes → `Parser.Language.load(wasmBytes)`

**Supported Languages:**
| Extension | Language | NPM Package |
|-----------|----------|-------------|
| `.ts` | typescript | tree-sitter-typescript |
| `.tsx` | tsx | tree-sitter-typescript |
| `.js`, `.jsx`, `.mjs`, `.cjs` | javascript | tree-sitter-javascript |
| `.json` | json | tree-sitter-json |
| `.py` | python | tree-sitter-python |
| `.go` | go | tree-sitter-go |
| `.rs` | rust | tree-sitter-rust |

**Node Adaptation:**
- Raw web-tree-sitter nodes wrapped to `TreeSitterNode` interface
- Lazy `children` getter via `adaptNode()` recursive adapter

---

## LSP Bridge

### Interface (`lsp-bridge.ts`)

```typescript
class LSPBridge {
  constructor(lspClient: unknown | null)

  isAvailable(): boolean

  async getBlastRadius(filePath, line, col): Promise<Reference[]>
  // Finds all references to symbol at position

  async getDefinition(filePath, line, col): Promise<Location | null>
  // Finds definition location
}
```

**Method Resolution:**
- Tries multiple method names: `findReferences`, `references`, `getReferences`
- Graceful degradation on missing methods

**Usage:**
- Cross-file impact analysis
- Definition navigation for context injection

---

## Knowledge Persistence

### CodeMap Structure (`codemap-io.ts`)

```typescript
interface CodeMap {
  version: string
  projectRoot: string
  generatedAt: string
  gitCommit?: string
  totalFiles: number
  totalTokens: number
  totalSize: number
  files: CodeMapEntry[]
}

interface CodeMapEntry {
  filePath: string
  language: string
  hash: string          // SHA256
  size: number
  lineCount: number
  tokenCount: number
  hasSecrets: boolean
  secretTypes: string[]
  lastModified: string
}
```

### Compressed CodeMap (`compressed-codemap.ts`)

```typescript
interface CompressedCodemap {
  version: string
  createdAt: string
  projectRoot: string
  totalTokens: number
  originalTotalTokens: number
  compressionRatio: number    // Typically 70% reduction
  files: CompressedFileInfo[]
}

interface CompressedFileInfo {
  path: string
  hash: string
  extension: string
  tokenCount: number          // Compressed
  originalTokenCount: number
  signatures: Signature[]
  imports: string[]
  exports: string[]
}
```

### Knowledge Commits (`knowledge-commits.ts`)

**Files Written:**
- `.hivemind/codebase/code-intel/compressed-codemap.json` — Full state
- `.hivemind/codebase/code-intel/codemap-summary.json` — Lightweight metadata

**Commit Pattern:**
```typescript
commitKnowledgeState(projectRoot, codemap, options):
  writeFiles(knowledgeDir)
  if gitStatus.hasChanges:
    git add .hivemind/codebase/code-intel
    git commit -m "chore: update code intelligence state [skip ci]"
```

---

## Watch & Incremental Updates

### Watch Integration (`watch-integration.ts`)

**Event Flow:**
```
FileSystemWatcher
  → onFileEvent({ type: "file:created" | "file:modified" | "file:deleted" })
    → pendingQueue.push({ path, type })
      → processQueue() [concurrency=5]
        → IncrementalUpdater.updateFile() / removeFile()
          → emitEvent("codemap:updated")
```

**Debouncing:**
- Default: 300ms debounce on file events
- Batch processing with concurrency limit

### Incremental Updater (`incremental-updater.ts`)

**Update Detection:**
```typescript
async updateFile(codemap, filePath, compressedCodemap):
  oldEntry = codemap.files.find(f => f.filePath === filePath)
  newEntry = await buildEntry(filePath)

  if !newEntry:
    changeType = "deleted"
  else if !oldEntry:
    changeType = "created"
  else if oldEntry.hash !== newEntry.hash:
    changeType = "modified"
  else:
    return { changeType: "modified", tokenDelta: 0 }  // No-op
```

**Stale File Detection:**
```typescript
async getStaleFiles(codemap):
  for entry in codemap.files:
    currentHash = SHA256(readFile(entry.filePath))
    if currentHash !== entry.hash:
      yield entry.filePath
```

---

## Security Filtering

### Secret Detection (`secret-detector.ts`)

**Patterns:**
| Type | Pattern | Severity |
|------|---------|----------|
| AWS Access Key | `AKIA[0-9A-Z]{16}` | High |
| Private Key | `-----BEGIN (RSA\|EC\|DSA\|OPENSSH )?PRIVATE KEY-----` | High |
| JWT | `eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+` | Medium |
| GitHub Token | `gh[ps]_[A-Za-z0-9_]{36,}` | Medium |
| Slack Token | `xox[bprs]-[A-Za-z0-9-]+` | Medium |
| Generic API Key | `api[_-]?key\s*[:=]\s*['"][A-Za-z0-9]{20,}['"]` | Low |

**Line/Column Resolution:**
- Builds line start indices via binary search
- Maps byte offset → `{ line, column }`

**Redaction:**
```typescript
redactSecret(match):
  if match.length <= 10: return "[REDACTED]"
  return `${match.slice(0,4)}...${match.slice(-4)}`
```

### Binary Detection (`binary-detector.ts`)

**Extension Blocklist:**
- Images: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.ico`, `.svg`
- Fonts: `.woff`, `.woff2`, `.ttf`, `.otf`, `.eot`
- Archives: `.zip`, `.gz`, `.tar`, `.7z`
- Media: `.mp3`, `.mp4`, `.mov`, `.avi`, `.webm`
- Binaries: `.wasm`, `.exe`, `.dll`, `.dylib`, `.so`

---

## Cross-Sector Dependencies

### Consumers of code-intel

| Sector | Module | Usage |
|--------|--------|-------|
| Session | `cognitive-packer.ts` | Uses `selectSourceForInjection()` for context packing |
| Tools | `hivemind_codemap` tool | Exposes `scan`, `compress`, `search`, `inject` |
| Planning | Task file_locks | Drives selective injection |
| Watcher | `watcher.ts` | Emits file events consumed by `watch-integration.ts` |
| Events | `event-bus.ts` | Receives `codemap:updated` events |

### Dependencies of code-intel

| Dependency | Module | Purpose |
|------------|--------|---------|
| `web-tree-sitter` | `tree-sitter-loader.ts` | WASM-based AST parsing |
| `tree-sitter-*` | `tree-sitter-loader.ts` | Language grammars |
| `ignore` | `gitignore-filter.ts` | .gitignore parsing |
| `magic-string` | `ast-surgeon.ts` | Source manipulation |
| `remark` | `doc-weaver.ts` | Markdown parsing |
| `unist-util-visit` | `doc-weaver.ts` | AST traversal |
| `tiktoken` | `token-counter.ts` | Token encoding (optional) |

---

## Knowledge Gaps

### After Deep Scan Analysis

1. **LSP Client Interface**
   - `LSPBridge` accepts `unknown` as lspClient
   - Method names are discovered dynamically at runtime
   - Missing: concrete LSP client implementation examples

2. **Tree-sitter Error Recovery**
   - `adaptNode()` uses `any` type for WASM nodes
   - Missing: error handling for malformed AST nodes
   - No retry logic on WASM load failures

3. **Pattern Search Scoring**
   - `matchSignatureToQuery()` uses simple weighted average
   - Missing: relevance tuning based on actual usage patterns
   - No fuzzy matching for typo tolerance

4. **Incremental Update Race Conditions**
   - `processQueue()` has `isProcessing` flag but no mutex
   - Potential race if multiple events fire during processing
   - Missing: transaction boundaries for multi-file updates

5. **Compression Ratio Prediction**
   - `compressionRatio` calculated post-hoc
   - Missing: pre-compression estimation for budget planning
   - No adaptive compression based on content type

6. **Secret Detection Context**
   - Detects secrets but doesn't capture surrounding context
   - Missing: secret severity escalation based on file path
   - No integration with `.secretsignore` patterns

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                     Code Intelligence Sector                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌───────────────┐    ┌─────────────────┐  │
│  │ file-scanner │───►│ codemap-io    │───►│ compressed-     │  │
│  │              │    │               │    │ codemap         │  │
│  └──────────────┘    └───────────────┘    └─────────────────┘  │
│         │                   │                     │             │
│         ▼                   ▼                     ▼             │
│  ┌──────────────┐    ┌───────────────┐    ┌─────────────────┐  │
│  │ gitignore-   │    │ incremental-  │    │ selective-      │  │
│  │ filter       │    │ updater       │    │ injector        │  │
│  └──────────────┘    └───────────────┘    └─────────────────┘  │
│                             │                     │             │
│         ┌───────────────────┴───────────────────┘              │
│         ▼                                                      │
│  ┌──────────────┐    ┌───────────────┐    ┌─────────────────┐  │
│  │ watch-       │───►│ tree-sitter-  │───►│ signature-      │  │
│  │ integration  │    │ loader        │    │ extractor       │  │
│  └──────────────┘    └───────────────┘    └────────────────-┘  │
│                             │                                  │
│         ┌───────────────────┼───────────────────┐              │
│         ▼                   ▼                   ▼              │
│  ┌──────────────┐    ┌───────────────┐    ┌─────────────────┐  │
│  │ ast-surgeon  │    │ pattern-      │    │ lsp-bridge      │  │
│  │              │    │ search        │    │                 │  │
│  └──────────────┘    └───────────────┘    └─────────────────┘  │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ Security Layer                                             ││
│  │  ┌──────────────┐    ┌───────────────┐                    ││
│  │  │ secret-      │    │ binary-       │                    ││
│  │  │ detector     │    │ detector      │                    ││
│  │  └──────────────┘    └───────────────┘                    ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ Persistence Layer                                          ││
│  │  ┌──────────────┐    ┌───────────────┐                    ││
│  │  │ knowledge-   │    │ token-        │                    ││
│  │  │ commits      │    │ counter       │                    ││
│  │  └──────────────┘    └───────────────┘                    ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ Documentation Layer                                        ││
│  │  ┌──────────────┐                                          ││
│  │  │ doc-weaver   │                                          ││
│  │  └──────────────┘                                          ││
│  └────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

*Deep scan completed: 18 files analyzed, 3,799 lines of code.*
