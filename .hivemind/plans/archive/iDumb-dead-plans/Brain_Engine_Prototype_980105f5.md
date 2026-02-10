# Brain Engine Prototype — Code Index Engine (v2)

## SOT Conflict Resolution

MASTER-PLAN.md Phase 9 defines `brain/index/` as the target for machine-generated intelligence.
This plan aligns fully: all scan outputs go under `brain/index/`, not root-level `brain/`.

| Artifact | Path | Owner |
|---|---|---|
| Codemap (symbols, exports) | `.idumb/brain/index/codemap.json` | `populateCodeMap()` |
| Project map (dirs, frameworks) | `.idumb/brain/index/project.json` | `populateProjectMap()` |
| Wiki (per-file docs) | `.idumb/brain/index/wiki.json` | NEW: `scanWiki()` |
| Interface artifacts | `.idumb/brain/index/artifacts.json` | NEW: `scanWiki()` (second output) |
| Frameworks | `.idumb/brain/index/frameworks.json` | Phase 9.1 (future) |
| Quality | `.idumb/brain/index/quality.json` | Phase 9.2 (future) |
| Stacks | `.idumb/brain/index/stacks.json` | Phase 9.3 (future) |
| Human knowledge entries | `.idumb/brain/knowledge.json` (existing) | `govern_brain action=learn` |

Existing `codemap.json` and `project-map.json` at `brain/` root will be migrated to `brain/index/` (legacy fallback reads old paths).

## Governance Decisions

**Read-only actions (no active task required):** `query`, `wiki`, `status`
**Mutating actions (require active task OR coordinator override):** `scan`, `learn`

## Pitfalls Assessment (7 Questions)

Q1: Will agents naturally pick this tool? YES -- `govern_brain` with description targeting "project understanding" and "code intelligence".
Q2: High-frequency use? YES -- query before every edit, status every session, scan on init, learn on discoveries.
Q3: Conflict with existing tools? NO -- complements `govern_plan/task/delegate/shell` as the 5th dimension: knowledge lifecycle.
Q4: Too many fields? NO -- action-based routing. Simplest call: `govern_brain action=query topic="auth"`.
Q5: Granularity? Single tool, 5 actions. Matches existing `govern_*` pattern.
Q6: Harmony? YES -- uses existing schemas, StateManager, BRAIN_PATHS, tool-gate agent scoping.
Q7: Replacing innate tools? NO -- augmenting. Agents still use `read`/`grep`/`find` for raw code.

## Tool API (Consistent Naming)

```
govern_brain action=scan scope="full"           # Full codemap + wiki + artifacts
govern_brain action=scan scope="file" target="src/hooks/tool-gate.ts"  # Single-file rescan
govern_brain action=query topic="authentication" depth="shallow"
govern_brain action=query topic="how does persistence work" depth="deep"
govern_brain action=wiki target="src/lib/persistence.ts"   # Retrieve wiki for file
govern_brain action=learn title="Pattern: hook factory" content="..." entry_type="pattern" evidence="src/hooks/tool-gate.ts,src/hooks/compaction.ts"
govern_brain action=status
```

Field naming is consistent: `entry_type` (not `type`) for brain entry type, `scope` + `target` for scan targeting.

---

## Implementation Phases (Cycle 1 = Implement, Cycle 2 = Integrate)

### Phase 0: Worktree Setup

**Cycle 1:**
1. Create branch `feature/brain-engine-prototype` from `dev`
2. Create git worktree at `/Users/apple/Documents/coding-projects/idumb/v2-brain-prototype`
3. Install dependencies in worktree (`npm install`)
4. Verify baseline: `npm run typecheck` + `npm test` pass

### Phase 1: Wiki + InterfaceArtifact Schema

**File:** `src/schemas/wiki.ts` (~250 LOC)

**Cycle 1 -- Schema definitions:**

```typescript
export type WikiCategory =
    | "util" | "schema" | "hook" | "tool" | "component"
    | "config" | "test" | "lib" | "cli" | "template" | "other"

export interface WikiExport {
    name: string
    signature: string        // e.g., "(user: User) => Promise<void>"
    purpose: string          // Heuristic-generated summary
}

export interface WikiEntry {
    filePath: string         // Relative to project root
    checksum: string         // CRC32 of file content -- skip unchanged
    title: string            // Human-readable (derived from filename)
    summary: string          // 1-2 sentence overview
    exports: WikiExport[]    // Exported symbols with purpose
    imports: string[]        // Files this imports (resolved relative paths)
    importedBy: string[]     // Reverse lookup (populated during graph build)
    category: WikiCategory
    complexity: "low" | "medium" | "high"
    lineCount: number
    lastScanned: number
    brainEntryIds: string[]  // Cross-reference to BrainEntries
}

export interface InterfaceArtifact {
    filePath: string
    checksum: string
    exports: WikiExport[]    // Same shape -- compressed summary for downstream
    complexity: "low" | "medium" | "high"
}

export interface WikiStore {
    version: string
    entries: WikiEntry[]
    artifacts: InterfaceArtifact[]  // Machine-readable compressed summaries
    importGraph: Record<string, string[]>  // filePath -> imported filePaths
    lastFullScan: number
    scanDurationMs: number
    topologicalOrder: string[]  // Computed from importGraph
}
```

Factory functions: `createWikiEntry()`, `createWikiStore()`, `createWikiExport()`, `createInterfaceArtifact()`
Helpers: `formatWikiEntry()`, `formatWikiSummary()`, `findWikiByPath()`, `formatArtifactCompact()`

**Cycle 2 -- Integration:**
- Add barrel exports to `src/schemas/index.ts`
- Verify `npm run typecheck` passes

### Phase 2: Import Resolver

**File:** `src/lib/import-resolver.ts` (~250 LOC)

**Cycle 1 -- Import graph building:**

Brain-indexer currently writes `importPaths: []` (line 221). Rather than modifying brain-indexer, the import resolver reads files directly:

```typescript
export interface ImportGraph {
    edges: Record<string, string[]>      // filePath -> resolved import paths
    reverseEdges: Record<string, string[]> // filePath -> files that import this
    files: string[]                       // All scanned file paths
}

// Parse imports from a single file's content (regex-based, no AST)
export function parseImports(content: string, filePath: string): string[]

// Resolve a relative import to an actual file path
export function resolveImport(importPath: string, fromFile: string, projectRoot: string): string | null

// Build full import graph by scanning all source files
export async function buildImportGraph(dir: string): Promise<ImportGraph>

// Kahn's algorithm with cycle detection
export function topologicalSort(graph: ImportGraph): {
    order: string[]         // Leaves first
    cycles: string[][]      // Detected circular deps
}
```

Handles: ES `import` (named, default, dynamic), `require()`, re-exports.
Skips: `node_modules` imports, bare specifiers.
Extension resolution: tries `.ts`, `.tsx`, `.js`, `.jsx`, `/index.ts`, `/index.js`.

**Cycle 2 -- Wire into brain-indexer:**
- `populateCodeMap()` calls `parseImports()` to fill `importPaths` field (currently `[]`)
- Import graph data stored in WikiStore, not CodeMapStore (separation of concerns)

### Phase 3: Wiki Scanner

**File:** `src/lib/wiki-scanner.ts` (~300 LOC)

**Cycle 1 -- Rolling Context Digestion engine:**

```typescript
// Full scan: build import graph -> topo sort -> digest each file
export async function scanWiki(
    dir: string,
    existingStore?: WikiStore  // For checksum-based skip
): Promise<WikiStore>

// Single-file rescan using cached artifacts
export async function scanWikiFile(
    dir: string,
    filePath: string,
    store: WikiStore
): Promise<WikiEntry>

// Core: digest one file using dependency artifacts as context
export function digestFile(
    content: string,
    filePath: string,
    depArtifacts: InterfaceArtifact[]
): { wiki: WikiEntry; artifact: InterfaceArtifact }

// Heuristic file classification from path + content patterns
export function classifyFile(filePath: string, content: string): WikiCategory

// Heuristic summary from exports, imports, file category
export function generateSummary(
    exports: WikiExport[],
    imports: string[],
    filePath: string,
    category: WikiCategory
): string
```

Digest loop (heuristic-only, no LLM):
1. Build import graph via `import-resolver.ts`
2. Topologically sort (leaves first)
3. For each file in order:
   a. Read content, compute CRC32 checksum
   b. If checksum matches existing entry -- skip (reuse cached)
   c. Retrieve dependency InterfaceArtifacts (not raw code)
   d. Extract exports with signatures from CodeMap or re-parse
   e. Classify file category from path patterns
   f. Generate heuristic summary
   g. Create WikiEntry + InterfaceArtifact
   h. Store artifact for downstream consumers

Circular dependency handling:
- Pass 1: Detect cycles via `topologicalSort()`. Generate stub InterfaceArtifacts (name + signature only)
- Pass 2: Re-process cycled files with stubs as context

Two-output pattern (per Brain Engine spec): each file produces:
- WikiEntry -- human-readable, stored in `brain/index/wiki.json`
- InterfaceArtifact -- machine-readable, stored in `brain/index/artifacts.json`

**Cycle 2 -- Wire into init.ts:**
- `tools/init.ts` line 470-490: add `scanWiki()` call alongside existing `populateCodeMap()` and `populateProjectMap()`
- Wiki and artifact data saved via StateManager to `brain/index/` paths

### Phase 4: Brain Tool

**File:** `src/tools/govern-brain.ts` (~350 LOC)

**Cycle 1 -- Tool implementation:**

```typescript
import { tool } from "@opencode-ai/plugin/tool"
import { stateManager } from "../lib/persistence.js"
import { scanWiki, scanWikiFile } from "../lib/wiki-scanner.js"
import { createBrainEntry } from "../schemas/brain.js"
import type { BrainEntryType } from "../schemas/brain.js"

export const govern_brain = tool({
    description: "Scan, query, and learn from the project codebase. Produces code intelligence (wiki, symbol maps, knowledge) that survives context windows. Read-only actions (query, wiki, status) need no active task. Mutating actions (scan, learn) require an active task.",
    args: {
        action: tool.schema.enum(["scan", "query", "wiki", "learn", "status"]).describe(
            "Action: 'scan' index codebase, 'query' search knowledge, 'wiki' file docs, 'learn' record discovery, 'status' brain health"
        ),
        scope: tool.schema.string().optional().describe(
            "For 'scan': 'full' (default) or 'file'"
        ),
        target: tool.schema.string().optional().describe(
            "File path for scope=file scans or wiki lookups"
        ),
        topic: tool.schema.string().optional().describe(
            "Search topic for 'query' action"
        ),
        depth: tool.schema.string().optional().describe(
            "For 'query': 'shallow' (default) or 'deep'"
        ),
        title: tool.schema.string().optional().describe(
            "Title for 'learn' action"
        ),
        content: tool.schema.string().optional().describe(
            "Content for 'learn' action"
        ),
        entry_type: tool.schema.string().optional().describe(
            "Brain entry type for 'learn': architecture, decision, pattern, tech-stack, research, codebase-fact, convention, gotcha"
        ),
        evidence: tool.schema.string().optional().describe(
            "Comma-separated file paths as evidence for 'learn'"
        ),
    },
    async execute(args, context) {
        // 5 action handlers: scan, query, wiki, learn, status
        // scan: calls scanWiki() + populateCodeMap()
        // query: searches BrainStore + WikiStore by topic
        // wiki: returns WikiEntry for target file
        // learn: creates BrainEntry in knowledge.json
        // status: reports brain health (coverage, freshness, sizes)
    },
})
```

**Cycle 2 -- Integration:**
- Register in `src/tools/index.ts` barrel
- Add to plugin tool map in `src/index.ts` (line 186-195)
- Add `AGENT_TOOL_RULES` scoping in `src/hooks/tool-gate.ts` (line 49-104):
  - Coordinator: `govern_brain` -- `query`, `wiki`, `status` only (no `scan`, no `learn`)
  - Investigator: `govern_brain` -- all actions (brain entries are investigator territory)
  - Executor: `govern_brain` -- `query`, `wiki`, `status` only (no `scan`, no `learn`)
- Add to `PLUGIN_TOOLS` set in tool-gate.ts (line 49)

### Phase 5: Persistence + State Wiring

**Cycle 1 -- New paths and WikiStore persistence:**

`src/lib/paths.ts` -- add to BRAIN_PATHS:
```typescript
wiki: ".idumb/brain/index/wiki.json",
artifacts: ".idumb/brain/index/artifacts.json",
// Migrate existing codemap + projectMap to brain/index/
codemapIndex: ".idumb/brain/index/codemap.json",
projectIndex: ".idumb/brain/index/project.json",
```

`src/lib/persistence.ts` -- DO NOT expand this file (already 1018 LOC).
Instead, create `src/lib/wiki-persistence.ts` (~120 LOC) as a focused module:
```typescript
export class WikiPersistence {
    async loadWikiStore(dir: string, log: Logger): Promise<WikiStore>
    async saveWikiStore(dir: string, store: WikiStore, log: Logger): Promise<void>
    async loadArtifacts(dir: string, log: Logger): Promise<InterfaceArtifact[]>
    async saveArtifacts(dir: string, artifacts: InterfaceArtifact[], log: Logger): Promise<void>
}
```

StateManager gets thin proxy methods that delegate to WikiPersistence (adds ~20 LOC, not hundreds).

**Cycle 2 -- Wire state readers:**
- `src/lib/state-reader.ts` (line 61-121): add `wikiStore: WikiStore | null` to `GovernanceSnapshot`
- `src/lib/state-reader.ts`: add `readWikiStore(projectDir)` convenience reader
- `src/dashboard/shared/schema-types.ts`: add `WikiStore`, `WikiEntry`, `InterfaceArtifact` type exports

### Phase 6: Agent Template Updates

**Cycle 1 -- Update templates.ts tool tables:**

Coordinator tool table (line 111-120):
```
| `govern_brain` | Codebase intelligence | query, wiki, status |
```

Investigator tool table (add):
```
| `govern_brain` | Codebase intelligence | scan, query, wiki, learn, status |
```

Executor tool table (add):
```
| `govern_brain` | Codebase intelligence | query, wiki, status |
```

Add usage examples in coordinator Quick Reference section.

**Cycle 2 -- Verify:** Template changes compile, deploy test passes.

### Phase 7: Tests (3 Separate Suites)

**Cycle 1 -- Test files:**

1. `tests/wiki.test.ts` (~180 LOC) -- Wiki schema tests:
   - Factory functions create valid entries
   - `formatWikiEntry()` output format
   - `findWikiByPath()` lookup
   - `createInterfaceArtifact()` from WikiEntry
   - Category classification edge cases
   - Checksum comparison logic

2. `tests/import-resolver.test.ts` (~150 LOC) -- Import resolver tests:
   - `parseImports()` with ES import, require, dynamic import
   - `resolveImport()` with extension resolution (.ts, .tsx, /index.ts)
   - `buildImportGraph()` on test fixtures
   - `topologicalSort()` with DAG, cycles, isolated nodes
   - Cycle detection returns correct cycles

3. `tests/govern-brain.test.ts` (~200 LOC) -- Brain tool tests:
   - `action=scan scope=full` produces WikiStore + artifacts
   - `action=scan scope=file target=...` rescans single file
   - `action=query topic=...` returns matching entries
   - `action=wiki target=...` returns wiki entry
   - `action=learn` creates BrainEntry
   - `action=status` reports health
   - Read-only actions succeed without active task
   - Mutating actions fail without active task (governance check)

**Cycle 2 -- Add to test runner:**
- Add all 3 suites to `package.json` test script
- Verify full `npm test` passes (859+ existing + new assertions)

### Phase 8: Dashboard -- CodeMapPanel (NEW)

**Cycle 1 -- Backend API endpoints:**

`src/dashboard/backend/server.ts` -- add:
```
GET /api/wiki           -- WikiStore snapshot
GET /api/wiki/:path     -- Single WikiEntry by file path
GET /api/artifacts      -- InterfaceArtifact list (extend existing /api/artifacts)
GET /api/import-graph   -- ImportGraph for visualization
```

**Cycle 1 -- Frontend panel:**

`src/dashboard/frontend/src/components/panels/CodeMapPanel.tsx` (~250 LOC):
- Dependency graph visualization (nodes = files, edges = imports)
- Node colors: green = digested, grey = pending, blue = active scan
- Click node -> show WikiEntry sidebar
- Stats bar: files scanned, coverage %, scan duration
- Category legend (util, schema, hook, tool, etc.)

Uses `@tanstack/react-query` (already in project) for data fetching.
Graph rendering: simple CSS grid or SVG (no heavy d3 dependency for prototype).

**Cycle 2 -- Wire into App.tsx:**
- Import `CodeMapPanel` in `App.tsx` (line 11)
- Add as 5th panel in `DashboardLayout` (line 84-88)
- Add `WikiStore`, `InterfaceArtifact` types to `schema-types.ts`
- WebSocket: add `wiki-updated` message type for live scan progress

### Phase 9: Verify + Merge Strategy

1. `npm run typecheck` -- zero errors
2. `npm test` -- 859+ existing + ~50-70 new assertions pass
3. LOC discipline: no new file > 500 LOC
4. All files in `src/` (rule 7)
5. Brain outputs land in `brain/index/` (SOT alignment)
6. Templates updated so agents know `govern_brain` exists
7. Dashboard panel renders wiki data
8. Merge worktree branch `feature/brain-engine-prototype` back to `dev`

---

## File Summary

### New Files

| File | Purpose | Est. LOC |
|---|---|---|
| `src/schemas/wiki.ts` | WikiEntry, WikiStore, InterfaceArtifact schemas + helpers | ~250 |
| `src/lib/import-resolver.ts` | Import parsing, graph building, topological sort | ~250 |
| `src/lib/wiki-scanner.ts` | Rolling Context digestion engine (two-output) | ~300 |
| `src/lib/wiki-persistence.ts` | WikiStore + artifacts load/save (avoid bloating persistence.ts) | ~120 |
| `src/tools/govern-brain.ts` | Unified brain tool (5 actions) | ~350 |
| `src/dashboard/frontend/src/components/panels/CodeMapPanel.tsx` | Dependency graph + wiki viewer | ~250 |
| `tests/wiki.test.ts` | Wiki schema tests | ~180 |
| `tests/import-resolver.test.ts` | Import resolver tests (separate suite) | ~150 |
| `tests/govern-brain.test.ts` | Brain tool tests | ~200 |

**Total new code: ~2,050 LOC across 9 files**

### Modified Files

| File | Change | Lines Added |
|---|---|---|
| `src/tools/index.ts` | Add `govern_brain` export | ~2 |
| `src/index.ts` (line 186) | Add `govern_brain` to plugin tool map | ~2 |
| `src/lib/paths.ts` | Add `wiki`, `artifacts`, `codemapIndex`, `projectIndex` to BRAIN_PATHS | ~6 |
| `src/lib/persistence.ts` | Thin proxy to WikiPersistence (getWikiStore/saveWikiStore) | ~20 |
| `src/lib/state-reader.ts` (line 61, 79) | Add `wikiStore` to GovernanceSnapshot + reader | ~10 |
| `src/hooks/tool-gate.ts` (line 49, 70-104) | Add `govern_brain` to PLUGIN_TOOLS + AGENT_TOOL_RULES | ~15 |
| `src/tools/init.ts` (line 470) | Wire scanWiki() into brain index population | ~10 |
| `src/schemas/index.ts` | Add wiki barrel exports | ~10 |
| `src/templates.ts` (tool tables ~line 111, ~536, ~898) | Add govern_brain to all 3 agent tool tables + examples | ~15 |
| `src/dashboard/shared/schema-types.ts` | Add WikiStore, WikiEntry, InterfaceArtifact exports | ~10 |
| `src/dashboard/backend/server.ts` | Add /api/wiki, /api/import-graph endpoints | ~40 |
| `src/dashboard/frontend/src/App.tsx` (line 11, 84) | Import + render CodeMapPanel | ~3 |
| `package.json` | Add 3 new test suites to test script | ~3 |

**Total modifications: ~146 lines across 13 files**
