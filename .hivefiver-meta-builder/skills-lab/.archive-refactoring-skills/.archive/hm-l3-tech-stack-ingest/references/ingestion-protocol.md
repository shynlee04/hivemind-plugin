# Ingestion Protocol — Step-by-Step

This reference provides the detailed, executable steps for every phase of the ingestion pipeline. Follow these steps in order. Each step includes commands to run and validation checks.

## Phase 1: DETECT — Identify What to Ingest

### Step 1.1: Find Manifest Files

```bash
# Scan for all supported manifest files in the project
find . -maxdepth 3 \( -name "package.json" -o -name "requirements.txt" -o -name "go.mod" -o -name "Cargo.toml" -o -name "pyproject.toml" -o -name "Pipfile" -o -name "pom.xml" -o -name "build.gradle" -o -name "composer.json" -o -name "mix.exs" -o -name "Gemfile" \) -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null
```

### Step 1.2: Parse Each Manifest by Ecosystem

**Node.js / TypeScript (`package.json`):**
```bash
# Extract dependencies with versions
cat package.json | grep -A 500 '"dependencies"' | grep -B 500 '"devDependencies"' | grep '": "' | sed 's/.*"\(.*\)": "\(.*\)".*/\1 @ \2/'

# List dev dependencies separately
cat package.json | grep -A 500 '"devDependencies"' | grep '": "' | head -50 | sed 's/.*"\(.*\)": "\(.*\)".*/\1 @ \2/'

# Check lock file for exact versions
ls package-lock.json 2>/dev/null && echo "Lock file found" || echo "WARNING: No lock file"
```

**Python (`requirements.txt`, `pyproject.toml`):**
```bash
cat requirements.txt 2>/dev/null
# For pyproject.toml, dependencies are under [tool.poetry.dependencies] or [project].dependencies
```

**Go (`go.mod`):**
```bash
cat go.mod | grep -E '^\s+[a-zA-Z]' | sed 's/^\s*//'
```

**Rust (`Cargo.toml`):**
```bash
cat Cargo.toml | grep -A 200 '\[dependencies\]' | grep -B 200 '^\[' | grep '='
```

### Step 1.3: Build the Priority Queue

Classify each dependency:

| Priority | Criteria | Examples |
|----------|----------|----------|
| **HIGH** | SDK, framework, type system, ORM, API client | `@opencode-ai/plugin`, `next`, `django`, `zod`, `prisma` |
| **MEDIUM** | Testing, linting, build tools, state management | `vitest`, `eslint`, `webpack`, `redux` |
| **LOW** | Utility libraries, formatters, CLI helpers | `yaml`, `chalk`, `lodash`, `date-fns` |

Write the queue to a file at `references/tech-stacks/ingest-queue.md`:

```markdown
# Ingest Queue — <date>

## Phase 1: HIGH (ingest immediately)
| # | Package | Version | Ecosystem | Repo URL | Status |
|---|---------|---------|-----------|----------|--------|
| 1 | @opencode-ai/plugin | ^1.14.19 | npm | TBD | PENDING |
| 2 | zod | ^4.3.6 | npm | TBD | PENDING |

## Phase 2: MEDIUM (ingest when needed)
| # | Package | Version | Ecosystem | Repo URL | Status |
|---|---------|---------|-----------|----------|--------|
| 3 | vitest | ^4.1.1 | npm | TBD | PENDING |

## Phase 3: LOW (lazy-load)
| # | Package | Version | Ecosystem | Repo URL | Status |
|---|---------|---------|-----------|----------|--------|
| 4 | yaml | ^2.8.2 | npm | TBD | PENDING |
```

### Step 1.4: Validate Detection

```bash
# Confirm queue file exists
ls references/tech-stacks/ingest-queue.md

# Count detected packages
grep -c '| PENDING' references/tech-stacks/ingest-queue.md
```

If 0 packages detected: Route to `hm-tech-context-compliance` to auto-detect the project's tech stack.

---

## Phase 2: DISCOVER — Find Canonical Repos

### Step 2.1: Resolve Repository URLs

**For npm packages:**
```bash
# Get repository URL from npm registry
npm view <package-name> repository.url 2>/dev/null
npm view <package-name> repository 2>/dev/null
npm view <package-name> homepage 2>/dev/null

# Alternative: check the package.json on unpkg
# Used for scoped packages or when npm view fails
```

**For pip packages:**
```bash
pip show <package-name> 2>/dev/null | grep -i "home-page\|url"
```

**For Go modules:**
The module path IS the repo. `github.com/user/repo` → `https://github.com/user/repo`.

**For Rust crates:**
```bash
cargo search <crate-name> --limit 1 2>/dev/null
# Then check https://crates.io/crates/<crate-name> for repository link
```

### Step 2.2: Select MCP Tools per Package

For each package in the queue, select the MCP tool strategy:

```markdown
| Package | Repo URL | Strategy | Tools |
|---------|----------|----------|-------|
| zod | github.com/colinhacks/zod | Full repo + API docs | repomix + context7 + deepwiki |
| @opencode-ai/plugin | (private/internal) | Context7 + web docs | context7 + tavily + exa |
| vitest | github.com/vitest-dev/vitest | Full repo + docs | repomix + deepwiki |
```

**Tool selection rules** (see `references/mcp-tool-cheatsheet.md` for complete mapping):

| Criterion | Tool |
|-----------|------|
| Full source code needed | `repomix_pack_remote_repository` |
| API signatures / types | `context7_query_docs` |
| Structured documentation | `deepwiki_read_wiki_contents` |
| Specific code search | `gitmcp_search_github_com_code` |
| Web documentation | `tavily_tavily_search` + `exa_web_search_exa` |

### Step 2.3: Confirm Availability

Before downloading, verify each source is accessible:

```bash
# For GitHub repos: check the repo exists
# Use gitmcp or a direct HTTP check

# For npm: check the package exists
npm view <package-name> version 2>/dev/null && echo "EXISTS" || echo "NOT_FOUND"

# For pip: check PyPI
pip index versions <package-name> 2>/dev/null
```

If a source is inaccessible, note it in the queue and try the next fallback (e.g., if GitHub repo is private, try context7 for public docs).

---

## Phase 3: INGEST — Download and Persist

### Step 3.1: Create the Target Directory

```bash
mkdir -p references/tech-stacks/<stack-name>/{api,docs,examples,raw}
```

### Step 3.2: Execute the Selected MCP Tools

**Using repomix (full repo):**

Invoke `repomix_pack_remote_repository` with:
- `remote`: "github.com/user/repo" (or GitHub URL)
- `style`: "xml" (structured, searchable)
- `compress`: false (we want full content, not tree-sitter compression)

Store the output in `references/tech-stacks/<stack-name>/raw/repomix-output.xml`.

Note: For large repos (>500MB), use `compress: true` or switch to context7 for API surface only.

**Using context7 (API docs):**

1. Call `context7_resolve_library_id` with the library name to get the library ID.
2. Call `context7_query_docs` with the library ID and specific queries:
   - "all exported types and functions"
   - "all public interfaces"
   - "all class methods and properties"
3. Store responses in `references/tech-stacks/<stack-name>/api/`.

**Using deepwiki (structured docs):**

1. Call `deepwiki_read_wiki_structure` with the repo name (e.g., "colinhacks/zod").
2. Call `deepwiki_read_wiki_contents` for the full documentation.
3. Call `deepwiki_ask_question` for specific topics if needed.
4. Store in `references/tech-stacks/<stack-name>/docs/`.

**Using gitmcp (targeted search):**

1. Call `gitmcp_search_github_com_code` with targeted queries.
2. Call `gitmcp_fetch_github_com_documentation` for docs.
3. Store in `references/tech-stacks/<stack-name>/api/` or `docs/`.

**Using tavily (web search):**

1. Call `tavily_tavily_search` to find documentation pages.
2. Call `tavily_tavily_crawl` to crawl documentation sites.
3. Call `tavily_tavily_extract` for specific page content.
4. Store in `references/tech-stacks/<stack-name>/docs/`.

**Using exa (web research):**

1. Call `exa_web_search_exa` to find relevant documentation.
2. Call `exa_web_fetch_exa` for specific page content.
3. Store in `references/tech-stacks/<stack-name>/docs/`.

### Step 3.3: Verify Download Completeness

```bash
# Check that files were actually created
ls -la references/tech-stacks/<stack-name>/raw/
ls -la references/tech-stacks/<stack-name>/api/
ls -la references/tech-stacks/<stack-name>/docs/

# For repomix output, verify it has content
wc -l references/tech-stacks/<stack-name>/raw/repomix-output.xml
```

If any directory is empty, re-run the ingest for that source or switch to a fallback tool.

---

## Phase 4: ORGANIZE — Progressive Disclosure Structure

### Step 4.1: Write metadata.json

```json
{
  "stack_name": "<package-name>",
  "version": "<installed-version>",
  "source_url": "https://github.com/user/repo",
  "ingest_date": "YYYY-MM-DD",
  "ingest_tool": "repomix + context7 + deepwiki",
  "ecosystem": "npm|pip|go|cargo|maven|composer|mix",
  "package_type": "sdk|framework|utility|testing|build-tool",
  "last_validated": "YYYY-MM-DD",
  "checksum": "",
  "tags": ["tag1", "tag2"],
  "source_files": {
    "repomix": "raw/repomix-output.xml",
    "context7": "api/context7-output.md",
    "deepwiki": "docs/deepwiki-output.md"
  }
}
```

### Step 4.2: Write TOC.md

The TOC must include jump links to every section of every file. Example:

```markdown
# <Package Name> v<version> — Tech Stack Reference

**Ingested:** YYYY-MM-DD | **Source:** <repo-url> | **Ecosystem:** <npm/pip/go/...>

## Navigation

### Architecture
- [Architecture Overview](architecture.md)
  - Module Map
  - Dependency Graph
  - Core Abstractions

### API Surface
- [API Index](api/index.md)
  - [Exported Functions](api/exports.md#functions)
  - [Exported Types](api/exports.md#types)
  - [Exported Classes](api/exports.md#classes)

### Documentation
- [Documentation Index](docs/index.md)
  - [Getting Started](docs/getting-started.md)
  - [Core Concepts](docs/core-concepts.md)
  - [Advanced Usage](docs/advanced-usage.md)

### Examples
- [Example Index](examples/index.md)

### Meta
- [Metadata](metadata.json)
- [Changelog](changelog.md)
```

### Step 4.3: Write architecture.md

Map the package's internal module structure:

```markdown
# <Package Name> Architecture

## Module Map

\`\`\`
src/
├── index.ts          # Public API entry point
├── types.ts          # Core type definitions
├── parser.ts         # Schema parsing engine
├── validator.ts      # Validation runtime
└── errors.ts         # Error types and formatting
\`\`\`

## Core Abstractions

| Abstraction | Module | Purpose |
|------------|--------|---------|
| Schema | types.ts | Base class for all schema types |
| Parser | parser.ts | Converts schema definitions to validators |
| Validator | validator.ts | Runtime validation engine |

## Dependency Graph

\`\`\`
types.ts (leaf — no dependencies)
  ↓
parser.ts → types.ts
  ↓
validator.ts → parser.ts, types.ts
  ↓
index.ts → validator.ts, types.ts
\`\`\`
```

### Step 4.4: Populate api/

For each ingested API artifact, create well-organized markdown files:

- `api/index.md` — index with jump links to all API sections
- `api/exports.md` — all exported functions, classes, types
- `api/types.md` — type definitions and interfaces
- `api/<module>.md` — per-module API details

### Step 4.5: Populate docs/

Organize ingested documentation by topic:

- `docs/index.md` — documentation index
- `docs/getting-started.md` — installation and basic usage
- `docs/core-concepts.md` — key concepts
- `docs/<topic>.md` — specific documentation topics

### Step 4.6: Populate examples/

Store usage examples from any source:

- `examples/index.md` — example index
- `examples/<use-case>.md` — per-use-case examples with code blocks

### Step 4.7: Validate Organization

```bash
# Required files must exist
ls references/tech-stacks/<stack-name>/metadata.json
ls references/tech-stacks/<stack-name>/TOC.md
ls references/tech-stacks/<stack-name>/architecture.md
ls references/tech-stacks/<stack-name>/api/index.md
ls references/tech-stacks/<stack-name>/docs/index.md
ls references/tech-stacks/<stack-name>/examples/index.md

# Each file must have content (>0 bytes)
for f in metadata.json TOC.md architecture.md api/index.md docs/index.md examples/index.md; do
  size=$(wc -c < "references/tech-stacks/<stack-name>/$f")
  echo "$f: $size bytes"
  [ "$size" -gt 0 ] || echo "ERROR: $f is empty!"
done
```

---

## Phase 5: INDEX — Make It Searchable

### Step 5.1: Create/Update Master Index

Append to `references/tech-stacks/index.json`:

```json
{
  "last_updated": "YYYY-MM-DD",
  "stacks": [
    {
      "name": "<stack-name>",
      "version": "<version>",
      "path": "references/tech-stacks/<stack-name>/",
      "ecosystem": "npm",
      "ingested": "YYYY-MM-DD",
      "last_validated": "YYYY-MM-DD",
      "tags": ["tag1", "tag2"]
    }
  ]
}
```

If `index.json` doesn't exist, create it with the stacks array.

### Step 5.2: Verify Searchability

```bash
# Glob: all markdown files in the stack should be discoverable
glob "references/tech-stacks/<stack-name>/**/*.md"

# Grep: key terms should return results
grep -r "export " references/tech-stacks/<stack-name>/api/ | head -10
grep -r "interface " references/tech-stacks/<stack-name>/api/ | head -10
grep -r "function " references/tech-stacks/<stack-name>/api/ | head -10

# Count searchable symbols
echo "Exported symbols: $(grep -rc "export " references/tech-stacks/<stack-name>/api/ | awk -F: '{s+=$2} END {print s}')"
```

### Step 5.3: Update the Ingest Queue

Mark the package as COMPLETED in `references/tech-stacks/ingest-queue.md`:

```markdown
| 1 | zod | ^4.3.6 | npm | github.com/colinhacks/zod | **COMPLETED** |
```

---

## Phase 6: VALIDATE — Gate Check

### Step 6.1: Run Final Validation

```bash
# 1. metadata.json has required fields
python3 -c "
import json
with open('references/tech-stacks/<stack-name>/metadata.json') as f:
    m = json.load(f)
required = ['stack_name', 'version', 'source_url', 'ingest_date', 'ecosystem']
missing = [k for k in required if k not in m]
if missing:
    print(f'FAIL: Missing metadata fields: {missing}')
else:
    print('PASS: metadata.json valid')
"

# 2. TOC has jump links
grep -c '\[' references/tech-stacks/<stack-name>/TOC.md

# 3. All index files exist
for f in TOC.md architecture.md api/index.md docs/index.md examples/index.md; do
    [ -s "references/tech-stacks/<stack-name>/$f" ] && echo "PASS: $f" || echo "FAIL: $f missing or empty"
done

# 4. Version matches installed
# (Ecosystem-specific version comparison)
```

### Step 6.2: Commit the Ingestion

```bash
# Add all ingested files
git add references/tech-stacks/<stack-name>/
git add references/tech-stacks/index.json
git add references/tech-stacks/ingest-queue.md

# Commit with descriptive message
git commit -m "ingest: cache <stack-name> v<version> tech stack assets"
```

---

## Quick Reference: Full Pipeline Commands

```bash
# All-in-one ingestion command sequence
STACK="zod"
VERSION="4.3.6"

# Phase 1: DETECT
npm ls $STACK --depth=0 2>/dev/null || pip show $STACK 2>/dev/null

# Phase 2: DISCOVER
npm view $STACK repository.url 2>/dev/null

# Phase 3: INGEST (use MCP tools — see mcp-tool-cheatsheet.md)

# Phase 4: ORGANIZE
mkdir -p references/tech-stacks/$STACK/{api,docs,examples,raw}
# Write metadata.json, TOC.md, architecture.md
# Populate api/, docs/, examples/

# Phase 5: INDEX
# Update index.json
# Verify with glob and grep

# Phase 6: VALIDATE
# Run validation checks from Step 6.1
```
