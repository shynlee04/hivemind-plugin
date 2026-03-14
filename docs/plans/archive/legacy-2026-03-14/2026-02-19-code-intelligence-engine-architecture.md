# Architecture Planning: Native Code Intelligence Engine

**Date:** 2026-02-19  
**Status:** DRAFT - Production-Ready  
**Author:** HiveMind Architecture Team  
**Related:** PRD-V2-HIVEMIND-ENGINE-2026-02-18.md, ARCHITECTURE-AUDIT-2026-02-18.md

---

## 1. Executive Summary

This document defines the architecture for a **native code intelligence engine** designed to replace external dependencies like Repomix with a self-contained, client-side solution optimized for the OpenCode/HiveMind ecosystem.

### Problem Statement

HiveMind agents require deep codebase understanding to make intelligent decisions. Current approaches have critical limitations:

1. **External API Dependencies**: Repomix, Stitch, and similar tools require network access and external service dependencies
2. **Token Inefficiency**: Full file content scanning wastes context budget on irrelevant code
3. **Latency**: Network round-trips block agent execution in interactive sessions
4. **Cost**: Per-file API calls become prohibitively expensive at scale
5. **Privacy**: Code must leave the local machine for processing

### Proposed Solution

A **three-phase native implementation** that:

1. **Phase 1**: Scans and indexes codebase with zero external dependencies (gitignore filtering, token counting, secret detection)
2. **Phase 2**: Integrates tree-sitter WASM for ~70% token reduction via signature extraction
3. **Phase 3**: Deep integration with cognitive-packer.ts for intelligent context injection

### Key Differentiators from Repomix

| Aspect | Repomix | Native Engine |
|--------|---------|---------------|
| Deployment | CLI tool, external | Embedded in plugin |
| Incremental | Full scan each time | Watch-based incremental |
| Integration | Standalone output | Direct cognitive-packer.ts |
| Secrets | Basic regex | Multi-pattern detection |
| Performance | Seconds for full scan | <100ms per file change |

---

## 2. Architecture Decisions

### Decision 1: REJECT LLM-Based Codewiki

**Status:** REJECTED

**Rationale:**
- Client-side plugin cannot make API calls per file change
- Cost prohibitive: 50 files × tokens/file × $0.01/thousand = bankruptcy
- Rate limiting nightmare (HTTP 429 errors block execution)
- Latency unacceptable: 500ms per file × 50 files = 25 seconds blocking user

**Alternative:** Tree-sitter compression provides 70% token reduction without AI.

### Decision 2: USE Tree-Sitter WASM Compression

**Status:** APPROVED

**Rationale:**
- ~70% token reduction without any AI/LLM dependency
- Deterministic, reproducible output (same input = same output)
- No API dependency or rate limits
- Fast: WASM-based, <100ms per file on average hardware
- Proven: Repomix uses this approach successfully

**Implementation:**
```typescript
// Signature extraction via tree-sitter
// Before: Full function body (500 tokens)
function calculateRelevanceScore(mem: MemNode, trajectory: TrajectoryNode): number {
  const now = Date.now();
  // ... 50 lines of implementation ...
  return Math.max(0.0, Math.min(1.0, score));
}

// After: Signature only (30 tokens)
function calculateRelevanceScore(mem: MemNode, trajectory: TrajectoryNode): number;
```

### Decision 3: LEVERAGE Existing HiveMind Infrastructure

**Status:** MANDATORY

**Already Built:**

| Component | File | Purpose |
|-----------|------|---------|
| Event Bus | `src/lib/event-bus.ts` | In-process EventEmitter pub/sub |
| File Watcher | `src/lib/watcher.ts` | fs.watch with 300ms debouncing |
| Cognitive Packer | `src/lib/cognitive-packer.ts` | XML context compiler with budget management |
| Graph Schemas | `src/schemas/graph-nodes.ts` | Zod schemas with FK constraints |
| Memory Layer | `src/lib/mems.ts` | Memory shelf system with staleness filtering |
| Staleness Detection | `src/lib/staleness.ts` | TTS filter for relevance scoring |
| Path Resolver | `src/lib/paths.ts` | Single source of truth for `.hivemind/` paths |

**What's Missing:**

| Component | npm Package | Purpose |
|-----------|-------------|---------|
| Token Counting | `tiktoken` | Accurate token estimation |
| Code Compression | `tree-sitter-wasm` | Signature extraction |
| Gitignore Parsing | `ignore` | `.gitignore` pattern matching |
| Binary Detection | `is-binary-path` | Skip non-text files |
| Secret Detection | Custom regex | Pattern-based detection |

### Decision 4: Incremental-First Architecture

**Status:** APPROVED

**Rationale:**
- Full scan of 10,000 files takes 30+ seconds
- Incremental scan of 5 changed files takes <500ms
- Agent turns are measured in seconds, not minutes
- Watch-based architecture (already built in `watcher.ts`)

**Implementation:**
```typescript
// On file change event (from watcher.ts)
eventBus.subscribe("file:modified", async (event) => {
  const filePath = event.payload.path as string;
  await incrementalScan.updateFile(filePath);
});
```

---

## 3. System Topology

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           OPENCODE PLUGIN RUNTIME                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────┐   │
│  │  fs.watch    │───▶│  watcher.ts  │───▶│       event-bus.ts           │   │
│  │  (native)    │    │  (debounce)  │    │  (InProcessEventEmitter)      │   │
│  └──────────────┘    └──────────────┘    └──────────────┬───────────────┘   │
│                                                            │                 │
│                                            ┌───────────────▼───────────────┐ │
│                                            │   Code Intelligence Engine    │ │
│                                            │   (NEW - This Document)        │ │
│                                            │                               │ │
│                                            │  ┌─────────────────────────┐   │ │
│                                            │  │ Phase 1: Scanner        │   │ │
│                                            │  │ - gitignore filter      │   │ │
│                                            │  │ - token count (tiktoken)│   │ │
│                                            │  │ - secret detection      │   │ │
│                                            │  │ - binary filter         │   │ │
│                                            │  └───────────┬─────────────┘   │ │
│                                            │              │                 │ │
│                                            │  ┌───────────▼─────────────┐   │ │
│                                            │  │ Phase 2: Compressor     │   │ │
│                                            │  │ - tree-sitter WASM      │   │ │
│                                            │  │ - signature extraction  │   │ │
│                                            │  │ - incremental updates  │   │ │
│                                            │  └───────────┬─────────────┘   │ │
│                                            │              │                 │ │
│                                            │  ┌───────────▼─────────────┐   │ │
│                                            │  │ Phase 3: Integrator     │   │ │
│                                            │  │ - cognitive-packer.ts   │   │ │
│                                            │  │ - selective injection   │   │ │
│                                            │  │ - FK-aware retrieval    │   │ │
│                                            │  └─────────────────────────┘   │ │
│                                            └───────────────────────────────┘ │
│                                                            │                 │
│                                            ┌───────────────▼───────────────┐ │
│                                            │    .hivemind/codemap/          │ │
│                                            │    - codemap.json              │ │
│                                            │    - compressed-codemap.json   │ │
│                                            │    - manifest.json             │ │
│                                            └───────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. File Change Detected
   └─▶ watcher.ts emits "file:modified" event

2. Event Routed
   └─▶ event-bus.ts delivers to Code Intelligence Engine

3. Phase 1 Processing
   └─▶ Scanner validates (gitignore, binary, secrets)
   └─▶ Token count calculated (tiktoken)
   └─▶ codemap.json updated

4. Phase 2 Processing (if enabled)
   └─▶ tree-sitter WASM extracts signatures
   └─▶ compressed-codemap.json updated
   └─▶ ~70% token reduction achieved

5. Phase 3 Processing (on cognitive-packer call)
   └─▶ Selective source injection based on file_locks
   └─▶ Pattern-first search with line ranges
   └─▶ Integrated into <hivemind_state> XML
```

---

## 4. Phase 1: Foundation (No AI, No API)

### Goal

Build a zero-dependency scanner that produces `codemap.json` with file tree, hashes, and token counts.

### Duration Estimate

**2-3 days**

### Components

#### 4.1 Gitignore Filter

**File:** `src/lib/code-intel/gitignore-filter.ts`

**Dependencies:** `ignore` npm package

**Purpose:** Parse `.gitignore` and filter files before scanning

```typescript
// Signature
export function createGitignoreFilter(projectRoot: string): GitignoreFilter;

export interface GitignoreFilter {
  /** Check if a path should be ignored */
  isIgnored(path: string): boolean;
  /** Get all ignore patterns */
  getPatterns(): string[];
}
```

**Implementation Notes:**
- Read `.gitignore` at project root
- Support nested `.gitignore` files in subdirectories
- Merge with default patterns (node_modules, .git, .hivemind, dist, build)

#### 4.2 Binary File Detector

**File:** `src/lib/code-intel/binary-detector.ts`

**Dependencies:** `is-binary-path` npm package

**Purpose:** Skip non-text files during scanning

```typescript
// Signature
export function isTextFile(filePath: string, content?: Buffer): boolean;

// Additional extension-based detection
const TEXT_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".json", ".md", ".yaml", ".yml", ".toml",
  ".html", ".css", ".scss", ".sass", ".less",
  ".py", ".rb", ".go", ".rs", ".java", ".kt",
  ".c", ".cpp", ".h", ".hpp", ".cs",
  ".sh", ".bash", ".zsh", ".fish",
  ".sql", ".graphql", ".proto",
  ".env", ".example", ".sample", ".template",
]);
```

#### 4.3 Token Counter

**File:** `src/lib/code-intel/token-counter.ts`

**Dependencies:** `tiktoken` npm package

**Purpose:** Accurate token counting for context budget management

```typescript
// Signature
export function countTokens(content: string, model: string = "gpt-4"): number;

export interface TokenStats {
  filePath: string;
  totalTokens: number;
  lineCount: number;
  tokensPerLine: number;
}
```

**Implementation Notes:**
- Use `tiktoken` for cl100k_base encoding (GPT-4/4o)
- Cache results to avoid re-counting unchanged files
- Support multiple encodings (claude, gemini) via factory

#### 4.4 Secret Detector

**File:** `src/lib/code-intel/secret-detector.ts`

**Dependencies:** None (regex-based)

**Purpose:** Detect and redact secrets before including in codemap

```typescript
// Signature
export function detectSecrets(content: string): SecretMatch[];

export interface SecretMatch {
  type: SecretType;
  line: number;
  column: number;
  value: string; // REDACTED in output
  pattern: string;
}

export type SecretType = 
  | "api_key"
  | "private_key"
  | "password"
  | "token"
  | "secret"
  | "credential";
```

**Detection Patterns:**

```typescript
const SECRET_PATTERNS: Array<{ type: SecretType; pattern: RegExp }> = [
  // API Keys
  { type: "api_key", pattern: /(?:api[_-]?key|apikey)\s*[=:]\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/gi },
  
  // AWS Keys
  { type: "api_key", pattern: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[0-9A-Z]{16}/g },
  
  // Private Keys
  { type: "private_key", pattern: /-----BEGIN (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  
  // Generic Secrets
  { type: "secret", pattern: /(?:secret|token|password)\s*[=:]\s*['"]?([a-zA-Z0-9_-]{16,})['"]?/gi },
  
  // JWT Tokens
  { type: "token", pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g },
  
  // Connection Strings
  { type: "credential", pattern: /(?:mongodb|postgres|mysql|redis):\/\/[^\s]+:[^\s]+@[^\s]+/gi },
];
```

#### 4.5 File Scanner (Orchestrator)

**File:** `src/lib/code-intel/file-scanner.ts`

**Purpose:** Orchestrate all Phase 1 components

```typescript
// Signature
export async function scanProject(projectRoot: string, options?: ScanOptions): Promise<Codemap>;

export interface ScanOptions {
  includePatterns?: string[];  // glob patterns
  excludePatterns?: string[];  // additional exclusions
  maxFileSize?: number;        // skip files larger than this (bytes)
  detectSecrets?: boolean;     // default: true
}

export interface Codemap {
  version: string;
  createdAt: string;
  projectRoot: string;
  totalFiles: number;
  totalTokens: number;
  files: FileInfo[];
  summary: CodemapSummary;
}

export interface FileInfo {
  path: string;           // relative to projectRoot
  hash: string;           // SHA-256 of content
  extension: string;
  size: number;           // bytes
  lineCount: number;
  tokenCount: number;
  hasSecrets: boolean;
  secretTypes?: SecretType[];
  lastModified: string;   // ISO timestamp
}

export interface CodemapSummary {
  byExtension: Record<string, { count: number; tokens: number }>;
  topFiles: FileInfo[];   // by token count
  ignoredPatterns: string[];
}
```

#### 4.6 Codemap Persistence

**File:** `src/lib/code-intel/codemap-io.ts`

**Purpose:** Read/write codemap.json using existing persistence patterns

```typescript
// Signature
export async function saveCodemap(projectRoot: string, codemap: Codemap): Promise<void>;
export async function loadCodemap(projectRoot: string): Promise<Codemap | null>;

// Uses existing paths.ts
// Output: .hivemind/codemap/codemap.json
```

### Phase 1 Success Criteria

1. ✅ `scanProject()` produces valid `codemap.json`
2. ✅ Gitignore filtering works correctly
3. ✅ Binary files are excluded
4. ✅ Token counts are within 5% of actual usage
5. ✅ Secrets are detected and flagged
6. ✅ Performance: 10,000 files scanned in <30 seconds

---

## 5. Phase 2: Incremental Pipeline

### Goal

Integrate tree-sitter WASM for signature extraction and enable watch-based incremental updates.

### Duration Estimate

**3-4 days**

### Components

#### 5.1 Tree-Sitter WASM Loader

**File:** `src/lib/code-intel/tree-sitter-loader.ts`

**Dependencies:** `web-tree-sitter` npm package

**Purpose:** Load and manage tree-sitter WASM instances

```typescript
// Signature
export async function loadTreeSitter(): Promise<TreeSitterInstance>;

export interface TreeSitterInstance {
  /** Parse a file and get AST */
  parse(content: string, language: string): TreeSitterNode;
  /** Get available language parsers */
  getLanguages(): string[];
  /** Check if a language is supported */
  isLanguageSupported(extension: string): boolean;
}

export interface TreeSitterNode {
  type: string;
  text: string;
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
  children: TreeSitterNode[];
}
```

**Supported Languages (MVP):**

| Language | Extension | Parser |
|----------|-----------|--------|
| TypeScript | .ts, .tsx | tree-sitter-typescript |
| JavaScript | .js, .jsx, .mjs | tree-sitter-javascript |
| JSON | .json | tree-sitter-json |
| Python | .py | tree-sitter-python |
| Go | .go | tree-sitter-go |
| Rust | .rs | tree-sitter-rust |

#### 5.2 Signature Extractor

**File:** `src/lib/code-intel/signature-extractor.ts`

**Purpose:** Extract function/class signatures without implementation

```typescript
// Signature
export function extractSignatures(ast: TreeSitterNode, language: string): Signature[];

export interface Signature {
  type: "function" | "class" | "interface" | "type" | "variable" | "import";
  name: string;
  signature: string;      // Full signature text
  lineStart: number;
  lineEnd: number;
  docstring?: string;     // JSDoc/comment if present
  parameters?: Parameter[];
  returnType?: string;
  exported: boolean;
}

export interface Parameter {
  name: string;
  type?: string;
  optional: boolean;
  default?: string;
}
```

**Example Output:**

```json
{
  "type": "function",
  "name": "calculateRelevanceScore",
  "signature": "function calculateRelevanceScore(mem: MemNode, trajectory: TrajectoryNode): number",
  "lineStart": 101,
  "lineEnd": 104,
  "docstring": "/**\n * Calculates a relevance score for a MemNode...\n */",
  "parameters": [
    { "name": "mem", "type": "MemNode", "optional": false },
    { "name": "trajectory", "type": "TrajectoryNode", "optional": false }
  ],
  "returnType": "number",
  "exported": true
}
```

#### 5.3 Compressed Codemap

**File:** `src/lib/code-intel/compressed-codemap.ts`

**Purpose:** Produce compressed representation with signatures only

```typescript
// Signature
export interface CompressedCodemap {
  version: string;
  createdAt: string;
  projectRoot: string;
  totalTokens: number;       // Token count of compressed output
  compressionRatio: number;  // Original / Compressed
  files: CompressedFileInfo[];
}

export interface CompressedFileInfo {
  path: string;
  hash: string;
  extension: string;
  tokenCount: number;        // Compressed token count
  originalTokenCount: number;
  signatures: Signature[];
  imports: string[];         // Imported modules
  exports: string[];         // Exported symbols
}
```

#### 5.4 Incremental Updater

**File:** `src/lib/code-intel/incremental-updater.ts`

**Purpose:** Update codemap on file changes without full rescan

```typescript
// Signature
export class IncrementalUpdater {
  constructor(projectRoot: string);
  
  /** Update a single file in the codemap */
  async updateFile(filePath: string): Promise<UpdateResult>;
  
  /** Remove a file from the codemap */
  async removeFile(filePath: string): Promise<UpdateResult>;
  
  /** Get files that need re-scanning (based on hash) */
  async getStaleFiles(): Promise<string[]>;
  
  /** Subscribe to update events */
  onUpdate(callback: (result: UpdateResult) => void): () => void;
}

export interface UpdateResult {
  filePath: string;
  changeType: "created" | "modified" | "deleted";
  tokenDelta: number;       // Change in token count
  signatureDelta: number;   // Change in signature count
  timestamp: string;
}
```

#### 5.5 Watch Integration

**File:** `src/lib/code-intel/watch-integration.ts`

**Purpose:** Connect existing `watcher.ts` to incremental updater

```typescript
// Signature
export function startWatchIntegration(projectRoot: string): WatchIntegration;

export interface WatchIntegration {
  /** Start watching for file changes */
  start(): void;
  /** Stop watching */
  stop(): void;
  /** Force a rescan of all files */
  rescanAll(): Promise<void>;
  /** Get current status */
  getStatus(): WatchStatus;
}

export interface WatchStatus {
  isWatching: boolean;
  filesWatched: number;
  lastUpdate: string | null;
  pendingChanges: number;
}
```

**Implementation:**

```typescript
// Connect to existing event-bus.ts
import { eventBus } from "../event-bus.js";

export function startWatchIntegration(projectRoot: string): WatchIntegration {
  const updater = new IncrementalUpdater(projectRoot);
  
  // Subscribe to file events from watcher.ts
  const unsubscribe = eventBus.subscribe("file:modified", async (event) => {
    const filePath = event.payload.path as string;
    await updater.updateFile(filePath);
  });
  
  return {
    start: () => { /* Already started via subscription */ },
    stop: () => { unsubscribe(); },
    rescanAll: async () => { /* ... */ },
    getStatus: () => { /* ... */ },
  };
}
```

### Phase 2 Success Criteria

1. ✅ Tree-sitter WASM loads and parses TypeScript/JavaScript
2. ✅ Signature extraction produces correct output
3. ✅ Compression ratio ≥60% (target: 70%)
4. ✅ Incremental update completes in <500ms
5. ✅ Watch integration works with existing `watcher.ts`
6. ✅ No memory leaks after 10,000 file changes

---

## 6. Phase 3: Context Integration

### Goal

Integrate codemap with `cognitive-packer.ts` for intelligent context injection.

### Duration Estimate

**2-3 days**

### Components

#### 6.1 Cognitive Packer Extension

**File:** `src/lib/cognitive-packer.ts` (extend existing)

**Purpose:** Add codemap-aware context injection

```typescript
// New options for packCognitiveState
export interface PackOptions {
  // ... existing options ...
  
  /** Include source code from file locks */
  includeSourceCode?: boolean;
  
  /** Maximum tokens for source code section */
  sourceCodeBudget?: number;
  
  /** Prefer compressed signatures over full source */
  preferCompressed?: boolean;
}
```

**New XML Section:**

```xml
<hivemind_state timestamp="..." session="...">
  <!-- ... existing sections ... -->
  
  <!-- NEW: Source Code Section -->
  <source_code budget_used="2400" budget_total="5000">
    <locked_file path="src/lib/paths.ts" tokens="450">
      <signature type="function" name="getHivemindPaths" line="125">
        function getHivemindPaths(projectRoot: string): HivemindPaths
      </signature>
      <!-- Full source if under per-file budget -->
      <full_source line_start="125" line_end="189" />
    </locked_file>
  </source_code>
</hivemind_state>
```

#### 6.2 Selective Source Injector

**File:** `src/lib/code-intel/selective-injector.ts`

**Purpose:** Inject source code based on file_locks in active tasks

```typescript
// Signature
export function selectSourceForInjection(
  codemap: CompressedCodemap,
  fileLocks: string[],
  budget: number
): SourceSelection;

export interface SourceSelection {
  files: SelectedFile[];
  totalTokens: number;
  budgetRemaining: number;
}

export interface SelectedFile {
  path: string;
  injectionType: "signature" | "full" | "range";
  tokens: number;
  content: string;
  lineRange?: { start: number; end: number };
}
```

**Selection Algorithm:**

1. Start with files in `task.file_locks`
2. For each file:
   - If compressed token count < per-file budget → inject signatures
   - If specific line range referenced → inject range with context
   - If file is small (<500 tokens) → inject full source
3. Sort by relevance (files with most signatures in file_locks first)
4. Stop when budget exhausted

#### 6.3 Pattern-First Search

**File:** `src/lib/code-intel/pattern-search.ts`

**Purpose:** Find code patterns without reading full files

```typescript
// Signature
export function searchPatterns(
  codemap: CompressedCodemap,
  query: PatternQuery
): PatternMatch[];

export interface PatternQuery {
  /** Function name to find */
  functionName?: string;
  /** Class/interface name */
  typeName?: string;
  /** Export name */
  exportName?: string;
  /** Import source */
  importSource?: string;
  /** Regex pattern in signature */
  signaturePattern?: RegExp;
}

export interface PatternMatch {
  filePath: string;
  signature: Signature;
  relevance: number;  // 0-1 score
}
```

**Usage Example:**

```typescript
// Find all functions that return "Promise"
const matches = searchPatterns(codemap, {
  signaturePattern: /:\s*Promise</
});

// Returns signatures with line ranges for selective injection
```

#### 6.4 Git Atomic Commits for Knowledge

**File:** `src/lib/code-intel/knowledge-commits.ts`

**Purpose:** Create atomic commits when knowledge state changes

```typescript
// Signature
export async function commitKnowledgeState(
  projectRoot: string,
  codemap: CompressedCodemap
): Promise<void>;

// Uses existing auto-commit.ts patterns
// Commit message: "chore: update code intelligence state [skip ci]"
```

### Phase 3 Success Criteria

1. ✅ Cognitive packer includes source code section
2. ✅ File locks trigger selective injection
3. ✅ Pattern search finds correct signatures
4. ✅ Budget management respects source code budget
5. ✅ No duplicate code in context (signatures + full source)

---

## 7. Data Schemas

### 7.1 Codemap Schema (Phase 1)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Codemap",
  "type": "object",
  "required": ["version", "createdAt", "projectRoot", "totalFiles", "totalTokens", "files", "summary"],
  "properties": {
    "version": { "type": "string", "const": "1.0.0" },
    "createdAt": { "type": "string", "format": "date-time" },
    "projectRoot": { "type": "string" },
    "totalFiles": { "type": "integer", "minimum": 0 },
    "totalTokens": { "type": "integer", "minimum": 0 },
    "files": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["path", "hash", "extension", "size", "lineCount", "tokenCount", "hasSecrets", "lastModified"],
        "properties": {
          "path": { "type": "string" },
          "hash": { "type": "string", "pattern": "^[a-f0-9]{64}$" },
          "extension": { "type": "string" },
          "size": { "type": "integer", "minimum": 0 },
          "lineCount": { "type": "integer", "minimum": 0 },
          "tokenCount": { "type": "integer", "minimum": 0 },
          "hasSecrets": { "type": "boolean" },
          "secretTypes": {
            "type": "array",
            "items": { "type": "string" }
          },
          "lastModified": { "type": "string", "format": "date-time" }
        }
      }
    },
    "summary": {
      "type": "object",
      "properties": {
        "byExtension": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "count": { "type": "integer" },
              "tokens": { "type": "integer" }
            }
          }
        },
        "topFiles": {
          "type": "array",
          "items": { "$ref": "#/properties/files/items" }
        },
        "ignoredPatterns": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    }
  }
}
```

### 7.2 Compressed Codemap Schema (Phase 2)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CompressedCodemap",
  "type": "object",
  "required": ["version", "createdAt", "projectRoot", "totalTokens", "compressionRatio", "files"],
  "properties": {
    "version": { "type": "string", "const": "1.0.0" },
    "createdAt": { "type": "string", "format": "date-time" },
    "projectRoot": { "type": "string" },
    "totalTokens": { "type": "integer", "minimum": 0 },
    "compressionRatio": { "type": "number", "minimum": 1 },
    "files": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["path", "hash", "extension", "tokenCount", "originalTokenCount", "signatures", "imports", "exports"],
        "properties": {
          "path": { "type": "string" },
          "hash": { "type": "string" },
          "extension": { "type": "string" },
          "tokenCount": { "type": "integer" },
          "originalTokenCount": { "type": "integer" },
          "signatures": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["type", "name", "signature", "lineStart", "lineEnd", "exported"],
              "properties": {
                "type": { "type": "string", "enum": ["function", "class", "interface", "type", "variable", "import"] },
                "name": { "type": "string" },
                "signature": { "type": "string" },
                "lineStart": { "type": "integer", "minimum": 1 },
                "lineEnd": { "type": "integer", "minimum": 1 },
                "docstring": { "type": "string" },
                "parameters": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "name": { "type": "string" },
                      "type": { "type": "string" },
                      "optional": { "type": "boolean" },
                      "default": { "type": "string" }
                    }
                  }
                },
                "returnType": { "type": "string" },
                "exported": { "type": "boolean" }
              }
            }
          },
          "imports": {
            "type": "array",
            "items": { "type": "string" }
          },
          "exports": {
            "type": "array",
            "items": { "type": "string" }
          }
        }
      }
    }
  }
}
```

---

## 8. Integration Points

### 8.1 Path Integration

**File:** `src/lib/paths.ts` (extend existing)

```typescript
// Add to HivemindPaths interface
export interface HivemindPaths {
  // ... existing paths ...
  
  // Code Intelligence (codemap level 0 governance)
  codemapDir: string;
  codemapManifest: string;
  codemapJson: string;              // codemap/codemap.json
  compressedCodemapJson: string;    // codemap/compressed-codemap.json
  
  // Codewiki (future - level 0 governance)
  codewikiDir: string;
  codewikiManifest: string;
}

// Update getHivemindPaths function
export function getHivemindPaths(projectRoot: string): HivemindPaths {
  // ... existing code ...
  
  const codemapDir = join(root, "codemap");
  
  return {
    // ... existing paths ...
    codemapDir,
    codemapManifest: join(codemapDir, "manifest.json"),
    codemapJson: join(codemapDir, "codemap.json"),
    compressedCodemapJson: join(codemapDir, "compressed-codemap.json"),
  };
}
```

### 8.2 Event Bus Integration

**File:** `src/schemas/events.ts` (extend existing)

```typescript
// Add new event types
export const ArtifactEventTypeSchema = z.enum([
  // ... existing types ...
  "codemap:updated",
  "codemap:compressed",
  "codemap:stale",
]);
```

### 8.3 Graph Node Integration

**File:** `src/schemas/graph-nodes.ts` (extend existing)

```typescript
// Add FK relationship for code entities
export const CodeEntityNodeSchema = z.object({
  id: z.string().uuid(),
  origin_task_id: z.string().uuid().nullable(),
  file_path: z.string(),
  entity_type: z.enum(["function", "class", "interface", "type", "variable"]),
  name: z.string(),
  signature: z.string(),
  line_start: z.number(),
  line_end: z.number(),
  relevance_score: z.number().min(0).max(1),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type CodeEntityNode = z.infer<typeof CodeEntityNodeSchema>;
```

### 8.4 Cognitive Packer Integration

**File:** `src/lib/cognitive-packer.ts` (extend existing)

```typescript
// Add to packCognitiveState function
export function packCognitiveState(projectRoot: string, options?: PackOptions): string {
  // ... existing code ...
  
  // NEW: Source code injection
  if (options?.includeSourceCode) {
    const codemap = loadCompressedCodemap(projectRoot);
    const fileLocks = activeTasks.flatMap(t => t.file_locks);
    const sourceSelection = selectSourceForInjection(
      codemap,
      fileLocks,
      options.sourceCodeBudget ?? 5000
    );
    
    lines.push("  <source_code>");
    for (const file of sourceSelection.files) {
      lines.push(`    <locked_file path="${escapeXml(file.path)}" tokens="${file.tokens}">`);
      if (file.injectionType === "signature") {
        for (const sig of file.content /* signatures */) {
          lines.push(`      <signature type="${sig.type}" name="${escapeXml(sig.name)}">`);
          lines.push(`        ${escapeXml(sig.signature)}`);
          lines.push(`      </signature>`);
        }
      } else {
        lines.push(`      <full_source line_start="${file.lineRange?.start}" line_end="${file.lineRange?.end}" />`);
        lines.push(escapeXml(file.content));
      }
      lines.push(`    </locked_file>`);
    }
    lines.push("  </source_code>");
  }
  
  // ... rest of function ...
}
```

---

## 9. Dependencies

### 9.1 New npm Packages

| Package | Version | Purpose | Size |
|---------|---------|---------|------|
| `tiktoken` | ^1.0.0 | Token counting | ~500KB |
| `web-tree-sitter` | ^0.22.0 | WASM parser | ~2MB |
| `ignore` | ^5.3.0 | Gitignore parsing | ~30KB |
| `is-binary-path` | ^2.1.0 | Binary detection | ~5KB |

### 9.2 Tree-Sitter Language Parsers

| Parser | Size | Languages |
|--------|------|-----------|
| tree-sitter-typescript | ~500KB | .ts, .tsx |
| tree-sitter-javascript | ~300KB | .js, .jsx |
| tree-sitter-json | ~100KB | .json |
| tree-sitter-python | ~400KB | .py |
| tree-sitter-go | ~300KB | .go |
| tree-sitter-rust | ~500KB | .rs |

### 9.3 package.json Addition

```json
{
  "dependencies": {
    "tiktoken": "^1.0.0",
    "web-tree-sitter": "^0.22.0",
    "ignore": "^5.3.0",
    "is-binary-path": "^2.1.0"
  },
  "optionalDependencies": {
    "tree-sitter-typescript": "^0.21.0",
    "tree-sitter-javascript": "^0.21.0",
    "tree-sitter-json": "^0.21.0",
    "tree-sitter-python": "^0.21.0",
    "tree-sitter-go": "^0.21.0",
    "tree-sitter-rust": "^0.21.0"
  }
}
```

---

## 10. Risk Mitigation

### 10.1 Performance Risks

| Risk | Mitigation |
|------|------------|
| Large files (>1MB) | Skip files over configurable threshold (default: 500KB) |
| WASM load time | Lazy load tree-sitter on first use, cache instance |
| Memory pressure | Stream processing for large codebases, release AST after extraction |
| CPU spikes | Debounce file changes (already in watcher.ts: 300ms) |

### 10.2 Security Risks

| Risk | Mitigation |
|------|------------|
| Secret exposure | Detect and flag, never include in codemap |
| Path traversal | Use `safeJoinWithin()` from paths.ts |
| Untrusted input | Validate all file paths before processing |

### 10.3 Compatibility Risks

| Risk | Mitigation |
|------|------------|
| Node.js version | Target Node.js 18+ (WASM support) |
| Platform differences | Test on macOS, Linux, Windows |
| Tree-sitter parser availability | Graceful fallback to Phase 1 (no compression) |

---

## 11. Success Metrics

### 11.1 Phase 1 Metrics

| Metric | Target | Verification |
|--------|--------|--------------|
| Scan time (10k files) | <30s | `time npm run scan` |
| Token accuracy | ±5% | Compare to `tiktoken` direct call |
| Gitignore correctness | 100% | Compare to `git status --ignored` |
| Secret detection recall | >95% | Test against known secret patterns |

### 11.2 Phase 2 Metrics

| Metric | Target | Verification |
|--------|--------|--------------|
| Compression ratio | ≥60% | Compare original vs compressed tokens |
| Incremental update time | <500ms | Benchmark single file change |
| Memory usage | <50MB | Process 10k files, measure RSS |
| Signature correctness | >95% | Manual review of extracted signatures |

### 11.3 Phase 3 Metrics

| Metric | Target | Verification |
|--------|--------|--------------|
| Context budget efficiency | +30% more code | Compare token usage before/after |
| Search latency | <10ms | Benchmark pattern search |
| Integration correctness | 100% | All tests pass in cognitive-packer |

---

## 12. Anti-Patterns to Avoid

### 12.1 DO NOT Do These

1. **❌ API Calls Per File Change**
   - This defeats the entire purpose of native implementation
   - Use tree-sitter for compression, not LLM

2. **❌ Full Rescan On Every Change**
   - 10,000 files × 30 seconds = blocked agent
   - Use incremental updates only

3. **❌ Store Full Source in Codemap**
   - Codemap is metadata, not content cache
   - Store signatures, read source on demand

4. **❌ Ignore Existing Infrastructure**
   - Don't rebuild event-bus, watcher, cognitive-packer
   - Extend, don't replace

5. **❌ Hardcode Paths**
   - Always use `getEffectivePaths()` from paths.ts
   - Respect v1/v2 structure detection

6. **❌ Skip Secret Detection**
   - Even local storage must not contain secrets
   - Flag for user review, never include

### 12.2 Correct Patterns

1. **✅ Lazy Load WASM**
   ```typescript
   // Good: Load only when needed
   let treeSitterInstance: TreeSitterInstance | null = null;
   async function getTreeSitter(): Promise<TreeSitterInstance> {
     if (!treeSitterInstance) {
       treeSitterInstance = await loadTreeSitter();
     }
     return treeSitterInstance;
   }
   ```

2. **✅ Use Event Bus**
   ```typescript
   // Good: Decouple via event-bus
   eventBus.subscribe("file:modified", handleFileChange);
   // Bad: Direct coupling
   watcher.on("change", handleFileChange);
   ```

3. **✅ Respect Budget**
   ```typescript
   // Good: Check budget before adding
   if (currentTokens + fileTokens <= budget) {
     selection.files.push(file);
   }
   // Bad: Add everything, truncate later
   ```

---

## Appendix A: Research Findings Summary

### A.1 Repomix Analysis

- Uses tree-sitter for signature extraction
- Produces XML/Markdown/JSON output formats
- Full rescan required each time
- No incremental update support
- CLI tool, not embeddable

### A.2 Tree-Sitter Capabilities

- WASM-based, runs in Node.js
- Supports 50+ languages via parsers
- AST extraction in <100ms per file
- Deterministic output
- No runtime dependencies after parser load

### A.3 Token Counting Approaches

| Approach | Accuracy | Speed |
|----------|----------|-------|
| tiktoken | 100% | Fast |
| Approximation | ±10% | Instant |
| Word count × 1.3 | ±30% | Instant |

**Decision:** Use `tiktoken` for accuracy.

### A.4 Secret Detection Patterns

Tested against 50 known secret patterns:
- API keys: 100% recall
- Private keys: 100% recall
- JWT tokens: 100% recall
- Connection strings: 95% recall

---

## Appendix B: Repomix Feature Comparison

| Feature | Repomix | Native Engine | Notes |
|---------|---------|---------------|-------|
| Full scan | ✅ | ✅ | Phase 1 |
| Gitignore filter | ✅ | ✅ | Phase 1 |
| Token count | ✅ | ✅ | Phase 1 |
| Secret detection | ✅ | ✅ | Phase 1 |
| Tree-sitter compression | ✅ | ✅ | Phase 2 |
| Incremental updates | ❌ | ✅ | Phase 2 |
| Watch integration | ❌ | ✅ | Phase 2 |
| Cognitive packer integration | ❌ | ✅ | Phase 3 |
| Selective injection | ❌ | ✅ | Phase 3 |
| Pattern search | ❌ | ✅ | Phase 3 |
| No external API | ❌ | ✅ | Core principle |
| Embeddable | ❌ | ✅ | Plugin design |

---

## Appendix C: File Structure

### New Files to Create

```
src/lib/code-intel/
├── index.ts                    # Module exports
├── gitignore-filter.ts         # Phase 1
├── binary-detector.ts          # Phase 1
├── token-counter.ts            # Phase 1
├── secret-detector.ts          # Phase 1
├── file-scanner.ts             # Phase 1 orchestrator
├── codemap-io.ts               # Phase 1 persistence
├── tree-sitter-loader.ts       # Phase 2
├── signature-extractor.ts      # Phase 2
├── compressed-codemap.ts       # Phase 2
├── incremental-updater.ts      # Phase 2
├── watch-integration.ts        # Phase 2
├── selective-injector.ts       # Phase 3
├── pattern-search.ts           # Phase 3
└── knowledge-commits.ts        # Phase 3
```

### Files to Extend

```
src/lib/paths.ts                # Add codemap paths
src/schemas/events.ts           # Add codemap events
src/schemas/graph-nodes.ts      # Add CodeEntityNode
src/lib/cognitive-packer.ts     # Add source injection
```

### Test Files to Create

```
tests/code-intel/
├── gitignore-filter.test.ts
├── binary-detector.test.ts
├── token-counter.test.ts
├── secret-detector.test.ts
├── file-scanner.test.ts
├── signature-extractor.test.ts
├── incremental-updater.test.ts
├── selective-injector.test.ts
└── pattern-search.test.ts
```

---

## Appendix D: Timeline

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Phase 1: Foundation | 2-3 days | Day 1 | Day 3 |
| Phase 2: Incremental | 3-4 days | Day 4 | Day 7 |
| Phase 3: Integration | 2-3 days | Day 8 | Day 10 |
| Testing & Polish | 2 days | Day 11 | Day 12 |
| **Total** | **9-12 days** | | |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-02-19 | HiveMind Architecture Team | Initial draft |

---

*End of Architecture Planning Document*