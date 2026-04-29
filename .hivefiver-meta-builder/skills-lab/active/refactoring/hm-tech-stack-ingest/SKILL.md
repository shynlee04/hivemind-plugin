---
name: hm-tech-stack-ingest
description: Downloads and caches third-party repositories, SDK docs, and API references as progressive-disclosure bundled assets. Use when ingesting a tech stack, downloading repo docs, caching dependency docs, performing tech stack ingestion, downloading library documentation, ingesting a dependency, fetching SDK API docs, storing a repository as reference, caching tech stack assets, downloading API documentation for offline use, or building a local tech stack cache. This is the foundation skill that enables hm-deep-research, hm-synthesis, and quality gate generation to work against ACTUAL code, not assumptions.
metadata:
  layer: "2"
  role: "domain-execution"
  pattern: P2
  version: "1.0.0"
  lineage: "hm"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
cross-references:
  feeds:
    - "hm-synthesis"
    - "hm-deep-research"
    - "hm-tech-context-compliance"
    - "hm-detective"
  consumed-by:
    - "hm-synthesis"
    - "hm-deep-research"
  input-from:
    - "hm-tech-context-compliance"
  boundary:
    - "hm-synthesis"
task-group: "how-to-implement"
hierarchy: "subagent-level"
---

## The Rule

```
Ingest once. Use everywhere. Never assume an API signature you haven't cached.
```

Every tech stack this skill ingests becomes a local, searchable asset. hm-deep-research, hm-synthesis, and gate orchestration skills load these assets to validate against REAL code — not guesses, stale docs, or hallucinated APIs.

## Quick Jump

| Task | Section / Reference |
|------|---------------------|
| "I need the full ingestion pipeline" | [Ingestion Pipeline](#ingestion-pipeline) |
| "Which MCP tool for which task?" | `references/mcp-tool-cheatsheet.md` |
| "How do I organize ingested repos?" | `references/progressive-disclosure-design.md` |
| "How do I detect and track versions?" | `references/version-tracking.md` |
| "Step-by-step: detect → ingest → index" | `references/ingestion-protocol.md` |
| "How do I search inside cached tech stacks?" | [Search and Index](#search-and-index) |
| "When should I re-ingest?" | [Update Mechanism](#update-mechanism) |

## Entry Gate

Proceed only when at least one of these conditions is true:

1. **You have a concrete dependency list** — from `package.json`, `requirements.txt`, `go.mod`, `Cargo.toml`, or any project manifest.
2. **hm-tech-context-compliance** returned a detected tech stack with version information.
3. **hm-deep-research** has identified a specific library/SDK that needs signature-level validation.
4. **hm-synthesis** has requested offline API references to generate quality gates or skills.

If none of these conditions are met but you suspect tech stack work is needed, route to `hm-tech-context-compliance` to auto-detect the stack first.

Before starting ingestion:
1. Read the `references/tech-stacks/` directory to check if the target stack is already cached.
2. If cached, check version staleness using `references/version-tracking.md`.
3. If the stack is fresh, use the cached assets — skip re-ingestion.
4. If stale or not cached, proceed with the ingestion pipeline below.

## Ingestion Pipeline

The pipeline has five phases. Complete each in order:

```
[1] DETECT → [2] DISCOVER → [3] INGEST → [4] ORGANIZE → [5] INDEX
```

### Phase 1: DETECT — Identify What to Ingest

**Input:** Project manifest files or explicit dependency list.

**Procedure:**

1. Read the project manifest files:
   ```bash
   # Detect Node.js/TypeScript stack
   ls package.json && cat package.json | grep -E '"dependencies"|"devDependencies"|"peerDependencies"' -A 50

   # Detect Python stack
   ls requirements.txt && cat requirements.txt

   # Detect Go stack
   ls go.mod && cat go.mod

   # Detect Rust stack
   ls Cargo.toml && cat Cargo.toml
   ```

2. For each detected dependency, extract:
   - **Package name** (npm: `"@scope/name"`, pip: `name`, go: `module/path`)
   - **Version constraint** (npm: `"^1.2.3"`, pip: `>=1.2,<2.0`, go: `v1.2.3`)
   - **Type** (framework, SDK, utility, testing, build-tool)
   - **Priority** (critical/foundational vs. utility)

3. Prioritize: Ingest foundational dependencies first (SDKs, frameworks, type systems). These are the ones quality gates will validate against. Utilities and build tools can be ingested lazily.

4. Build the ingest list:
   ```markdown
   ## Ingest Queue
   | Priority | Package | Version | Type | Reason |
   |----------|---------|---------|------|--------|
   | HIGH | [your-sdk-package] | ^X.Y.Z | SDK | Quality gate validation |
   | HIGH | [your-schema-lib] | ^X.Y.Z | Schema lib | API surface verification |
   | MEDIUM | [your-test-framework] | ^X.Y.Z | Testing | Test pattern reference |
   | LOW | [your-utility] | ^X.Y.Z | Utility | Lazy-load if needed |
   ```

### Phase 2: DISCOVER — Find the Canonical Repos

For each package in the ingest queue, discover where its canonical source lives.

**Procedure:**

1. **Resolve the canonical repository URL:**
   ```bash
   # For npm packages: extract repository from registry metadata
   npm view <package-name> repository.url 2>/dev/null
   npm view <package-name> homepage 2>/dev/null

   # For Go modules: the module path IS typically the repo
   # go.mod line: "github.com/user/repo v1.2.3" → repo is the module path
   ```

2. **Discover documentation sources** using MCP tools (see `references/mcp-tool-cheatsheet.md` for full mapping):
   - `repomix_pack_remote_repository` — download entire repo as structured pack
   - `deepwiki_read_wiki_contents` / `deepwiki_ask_question` — get structured documentation
   - `gitmcp_search_github_com_code` — find specific files/code
   - `gitmcp_fetch_github_com_documentation` — fetch repo documentation
   - `context7_resolve_library_id` + `context7_query_docs` — API docs with examples
   - `tavily_tavily_search` / `tavily_tavily_crawl` — web documentation
   - `exa_web_search_exa` / `exa_web_fetch_exa` — web research

3. **Select the ingestion strategy** based on what's available:

| Source Available | Strategy | MCP Tool |
|-----------------|----------|----------|
| Full GitHub repo (public) | Download entire repo | `repomix_pack_remote_repository` |
| GitHub repo with docs | Fetch structured docs | `deepwiki_read_wiki_contents` |
| Specific API docs needed | Query API surface | `context7_query_docs` |
| No GitHub repo (private/pkg) | Web crawl + extract | `tavily_tavily_crawl` + `exa_web_fetch_exa` |
| Multiple sources | Combine: repomix for code + context7 for API + deepwiki for docs | All three |

### Phase 3: INGEST — Download and Persist

Execute the ingestion according to the selected strategy.

**Procedure for repomix (full repo):**

```bash
# Ingest a remote repository as a structured pack
# Store the output in a temporary location first
repomix --remote "github.com/user/repo" --style xml --compress false
```

Then move the output to `references/tech-stacks/<stack-name>/raw/`.

**Procedure for context7 (API docs):**

1. Resolve the library: `context7_resolve_library_id("zod", "zod")`
2. Query the API surface: `context7_query_docs("/colinhacks/zod", "all exported types and functions")`
3. Store the response in `references/tech-stacks/<stack-name>/api/`.

**Procedure for deepwiki (structured docs):**

1. Read wiki structure: `deepwiki_read_wiki_structure("colinhacks/zod")`
2. Read full contents: `deepwiki_read_wiki_contents("colinhacks/zod")`
3. Store in `references/tech-stacks/<stack-name>/docs/`.

**Procedure for gitmcp (targeted code search):**

1. Search for specific files: `gitmcp_search_github_com_code("repo:colinhacks/zod path:src types")`
2. Fetch results: `gitmcp_fetch_github_com_documentation()`
3. Store in `references/tech-stacks/<stack-name>/api/`.

### Phase 4: ORGANIZE — Progressive Disclosure Structure

Every ingested tech stack must follow this directory structure inside `references/tech-stacks/<stack-name>/`:

```
references/tech-stacks/<stack-name>/
├── TOC.md                  # Table of contents with jump links
├── metadata.json           # Version, source URL, ingest date, source tool
├── architecture.md         # Architecture overview, module map
├── api/                    # API signatures, types, interfaces
│   ├── index.md            # API index with jump links
│   ├── types.md            # Type definitions (if typed language)
│   ├── exports.md          # Public API surface
│   └── <module>.md         # Per-module API details
├── docs/                   # Ingested documentation
│   ├── index.md            # Documentation index
│   └── <topic>.md          # Per-topic documentation
├── examples/               # Usage examples
│   ├── index.md            # Example index
│   └── <use-case>.md       # Per-use-case examples
├── raw/                    # Raw ingested files (repomix output, etc.)
│   └── <source-tool>-output.<ext>
└── changelog.md            # Version history of this ingestion
```

See `references/progressive-disclosure-design.md` for the detailed design rationale and each file's required content format.

**After creating the structure:**

1. Write `metadata.json` with the ingestion record:
   ```json
   {
     "stack_name": "zod",
     "version": "4.3.6",
     "source_url": "https://github.com/colinhacks/zod",
     "ingest_date": "2026-04-28",
     "ingest_tool": "repomix + context7 + deepwiki",
     "last_validated": "2026-04-28",
     "checksum": "sha256-...",
     "tags": ["schema", "validation", "typescript", "runtime"]
   }
   ```

2. Write `TOC.md` with jump links to all ingested content:
   ```markdown
   # Zod v4.3.6 — Tech Stack Reference

   ## Architecture
   - [Architecture Overview](architecture.md) — module map, dependency graph

   ## API Surface
   - [API Index](api/index.md) — all exported symbols
   - [Types](api/types.md) — type definitions
   - [Exports](api/exports.md) — public API surface

   ## Documentation
   - [Getting Started](docs/index.md)
   - [Schemas](docs/schemas.md)

   ## Examples
   - [Basic Validation](examples/basic-validation.md)
   - [Custom Types](examples/custom-types.md)

   ## Meta
   - [Metadata](metadata.json) — version, source, ingest date
   - [Changelog](changelog.md) — ingestion history
   ```

3. Write `architecture.md` with the module map and core abstractions.

### Phase 5: INDEX — Make It Searchable

After organizing, the agent must be able to find specific signatures, interfaces, and symbols rapidly.

**Indexing procedure:**

1. **Create a glob-based index:** Run glob on the ingested stack to verify files are discoverable:
   ```bash
   glob "references/tech-stacks/<stack-name>/**/*.md"
   glob "references/tech-stacks/<stack-name>/api/**/*.md"
   ```

2. **Create a grep-based search reference:** List the key symbols that can be grepped:
   ```bash
   grep "export " references/tech-stacks/<stack-name>/api/exports.md
   grep "interface " references/tech-stacks/<stack-name>/api/types.md
   ```

3. **Add the stack to the master index:** Append to `references/tech-stacks/index.json`:
   ```json
   {
     "stacks": [
       {
         "name": "zod",
         "version": "4.3.6",
         "path": "references/tech-stacks/zod/",
         "ingested": "2026-04-28",
         "tags": ["schema", "validation"]
       }
     ]
   }
   ```

## Search and Index

When an agent (hm-deep-research, hm-synthesis, hm-detective) needs to find something in an ingested stack, they use these commands:

### Find All Ingested Stacks

```bash
ls references/tech-stacks/
cat references/tech-stacks/index.json
```

### Check if a Specific Stack is Cached

```bash
ls references/tech-stacks/<stack-name>/ && cat references/tech-stacks/<stack-name>/metadata.json
```

### Search for API Signatures

```bash
# Find all exported functions
grep -r "export function" references/tech-stacks/<stack-name>/api/

# Find specific interface
grep -r "interface <Name>" references/tech-stacks/<stack-name>/api/

# Find type definitions
grep -r "type <Name>" references/tech-stacks/<stack-name>/api/
```

### Search for Usage Examples

```bash
grep -r "<pattern>" references/tech-stacks/<stack-name>/examples/
```

### Read Specific Documentation

```bash
# Load the TOC first to navigate
cat references/tech-stacks/<stack-name>/TOC.md

# Then read specific sections
cat references/tech-stacks/<stack-name>/api/exports.md
```

## Update Mechanism

When the project's installed version differs from the cached version, the cached assets are stale and must be re-ingested.

### Check Staleness

```bash
# Compare installed version vs cached version
# For npm:
npm ls <package-name> --depth=0 2>/dev/null
cat references/tech-stacks/<package-name>/metadata.json | grep version

# For pip:
pip show <package-name> | grep Version
cat references/tech-stacks/<package-name>/metadata.json | grep version
```

### Trigger Re-Ingestion

| Condition | Action |
|-----------|--------|
| Installed version > cached version | Re-ingest the NEW version. Archive old version under `archive/<version>/`. |
| Installed version < cached version | Flag as `NEEDS_INVESTIGATION` — downgrade may be intentional or a misalignment. |
| Cached version missing | Run full ingestion pipeline. |
| Cache > 90 days old | Schedule re-ingestion to capture doc updates even if version unchanged. |

### Re-Ingestion Procedure

1. Run Phase 2 (DISCOVER) to confirm the canonical source still exists.
2. Run Phase 3 (INGEST) to download the current version.
3. Run Phase 4 (ORGANIZE) to update the directory structure.
4. Run Phase 5 (INDEX) to rebuild search references.
5. Update `metadata.json` with new `ingest_date` and `version`.
6. Append to `changelog.md` with the re-ingestion record.

See `references/version-tracking.md` for the full version lifecycle.

## Decision Tree

```
What is your situation?
|
+-- "I need to ingest a tech stack from scratch"
|   -> Run the full Ingestion Pipeline (5 phases)
|   -> Start with Phase 1: DETECT
|
+-- "I already have cached assets — are they still good?"
|   -> Load references/version-tracking.md
|   -> Run staleness check
|   -> If stale, run Update Mechanism
|   -> If fresh, use the cached assets
|
+-- "I need a specific API signature from an ingested stack"
|   -> Use Search and Index procedures
|   -> grep for the specific symbol
|   -> If not found, re-ingest the stack
|
+-- "I found a new dependency — should I ingest it?"
|   -> Check priority (SDK/framework = HIGH, utility = LOW)
|   -> If HIGH: run ingestion pipeline immediately
|   -> If LOW: add to queue, ingest when needed
|
+-- "A quality gate needs validation against real SDK APIs"
|   -> Load the appropriate tech stack from references/tech-stacks/
|   -> grep for the relevant API signatures
|   -> Return signatures with source file and line number
|
+-- "I don't know which stacks are ingested"
|   -> Run: cat references/tech-stacks/index.json
|   -> Run: ls references/tech-stacks/
```

## Cross-References

### Skills This Skill Feeds Into

| Skill | What It Provides |
|-------|-----------------|
| `hm-synthesis` | Cached API signatures and code for skill generation and quality gate synthesis |
| `hm-deep-research` | Offline repository references for signature-level validation |
| `hm-detective` | Cached codebases for deep codebase investigation |

### Skills This Skill Consumes From

| Skill | What It Receives |
|-------|-----------------|
| `hm-tech-context-compliance` | Detected tech stack with versions — tells this skill WHAT to ingest |

### Boundary Rules

| Nearby Skill | Boundary |
|-------------|----------|
| `hm-synthesis` | hm-tech-stack-ingest handles INGESTION (downloading and organizing). hm-synthesis handles GENERATION (creating skills and gates from ingested material). |
| `hm-deep-research` | hm-tech-stack-ingest provides the CACHED ASSETS. hm-deep-research uses those assets for research and validation. |
| `hm-tech-context-compliance` | hm-tech-context-compliance DETECTS the stack. hm-tech-stack-ingest INGESTS it. |
| `hm-detective` | hm-detective can search ingested stacks for codebase patterns and definitions. |

## Edge Cases

| Scenario | Response |
|----------|----------|
| Repo URL not found in npm/pip metadata | Try `exa_web_search_exa` or `tavily_tavily_search` to find the repo manually |
| Repo is private or inaccessible | Skip full repo ingestion; use context7 + deepwiki + web docs as substitutes |
| Version in manifest is a range (^1.2.3, >=1.0) | Resolve to the installed version via lock file (`package-lock.json`, `poetry.lock`) |
| No lock file available | Use the latest matching version from the registry; flag as approximate |
| Package is a monorepo (many packages in one repo) | Ingest the entire monorepo once, create sub-indexes per package |
| Repo is VERY large (>500MB, e.g., Chromium, LLVM) | Use context7 for API surface only; skip full repo download |
| Tech stack already ingested but user wants a different version | Archive current version under `archive/<old-version>/`, ingest new version |
| Ingested docs conflict with installed types | Prioritize installed types → the cache represents the DOCS, not the truth. Flag discrepancy. |
| MCP tool returns empty or error | Try the next tool in the fallback chain (see `references/mcp-tool-cheatsheet.md`) |

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Blind Ingest** — downloading without checking if already cached | No `ls references/tech-stacks/<name>/` before download | Always check cache first. Re-use beats re-download. |
| **The Version Blindspot** — caching without recording the version | `metadata.json` missing or has no version field | Always record `version`, `source_url`, and `ingest_date` in metadata.json |
| **The Dumpster** — stashing raw downloads without organizing | `references/tech-stacks/<name>/` has only a `raw/` directory with no TOC, no api/, no examples/ | Run Phase 4 (ORGANIZE) immediately after every ingest |
| **The Rotten Cache** — using cached docs that are months out of date | `metadata.json` `ingest_date` > 90 days old, no staleness check run | Run the Update Mechanism before using stale assets |
| **The Tool Fixation** — using only one MCP tool when better sources exist | Only repomix calls, no context7, no deepwiki | Load `references/mcp-tool-cheatsheet.md` and select the best tool for each package type |
| **The SDK Hallucination** — quality gates validating against assumed API signatures | grep in cached stack returns 0 results for claimed API | Run Phase 2 (DISCOVER) + Phase 3 (INGEST) before validation |
| **The Monorepo Blind Ingest** — ingesting a monorepo package-by-package | Multiple separate ingests for `@scope/*` packages from the same repo | Detect monorepo pattern; ingest once, create per-package indexes |

## Validation Loop

```
do → validate → fix → repeat

1. DETECT: Read manifest → identify dependencies → prioritize
2. DISCOVER: Find canonical repos → select MCP tools → confirm sources
3. INGEST: Execute tool calls → download assets → verify download succeeded
4. ORGANIZE: Create directory structure → write TOC, metadata, api/, examples/
5. INDEX: Run glob/grep to verify searchability → update index.json → verify all files accessible
6. VALIDATE: Check metadata.json has version → check TOC has jump links → check files are readable
```

If any phase fails:
- **Phase 1 fails** (no manifest): Route to `hm-tech-context-compliance`.
- **Phase 2 fails** (can't find repo): Try `tavily_tavily_search` to locate the source. If still unfindable, skip that package and mark it in a `references/tech-stacks/unresolved.json`.
- **Phase 3 fails** (download error): Try the next MCP tool in the fallback chain. If all fail, mark as `NEEDS_CONTEXT`.
- **Phase 4 fails** (incomplete structure): Re-run organize from scratch.
- **Phase 5 fails** (can't find ingested files): Re-run ingest; the download may have been incomplete.

**Maximum 3 iterations** per ingestion pipeline run. After 3 rounds without resolution, hand off with a report of what succeeded and what's blocked.

## Success Criteria

- [ ] Target tech stack dependencies detected from project manifests
- [ ] Canonical repository sources discovered for each dependency
- [ ] Assets downloaded using appropriate MCP tools (repomix, deepwiki, context7, etc.)
- [ ] Progressive disclosure directory structure created under `references/tech-stacks/<stack-name>/`
- [ ] `metadata.json` written with version, source URL, and ingest date
- [ ] `TOC.md` written with jump links to all ingested content
- [ ] `architecture.md` written with module map and core abstractions
- [ ] API signatures, types, and interfaces extracted into `api/`
- [ ] Usage examples stored in `examples/`
- [ ] `index.json` updated with the new stack entry
- [ ] Searchability verified: `grep` and `glob` return results from the ingested stack
- [ ] Version staleness check passes or re-ingestion is scheduled
