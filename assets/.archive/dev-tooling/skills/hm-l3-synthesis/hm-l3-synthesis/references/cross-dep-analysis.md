# Cross-Dependency Analysis

Full 5-step protocol for dependency analysis, graph generation, and monorepo handling.

---

## Protocol Overview

```
MAP → CLASSIFY → DETECT → RESOLVE → VALIDATE
```

Each step produces an artifact. Each step validates the previous step's output.

---

## Step 1: MAP — List Every Dependency

### Source Extraction

Extract all dependency declarations from source code:

```bash
# ES Module imports
grep -rn "import.*from" src/ --include="*.ts" > /tmp/deps-imports.txt

# CommonJS requires
grep -rn "require(" src/ --include="*.ts" >> /tmp/deps-imports.txt

# Event emissions (runtime dependencies)
grep -rn "\.emit(\|\.on(" src/ --include="*.ts" >> /tmp/deps-imports.txt

# Dynamic imports
grep -rn "import(" src/ --include="*.ts" >> /tmp/deps-imports.txt
```

### Package Manifest Extraction

```bash
# Production dependencies
jq -r '.dependencies // {} | keys[]' package.json > /tmp/deps-prod.txt

# Peer dependencies
jq -r '.peerDependencies // {} | keys[]' package.json > /tmp/deps-peer.txt

# Dev dependencies
jq -r '.devDependencies // {} | keys[]' package.json > /tmp/deps-dev.txt
```

### Output Format

```json
{
  "file": "src/lib/lifecycle-manager.ts",
  "line": 5,
  "type": "import",
  "source": "./continuity",
  "symbols": ["loadState", "saveState"],
  "category": "unclassified"
}
```

---

## Step 2: CLASSIFY — Tag Each Dependency

### Classification Rules

| Category | Detection Pattern | Confidence |
|----------|-------------------|------------|
| **internal** | Starts with `./` or `../`, or matches a workspace package path | High |
| **external** | Found in `dependencies` or `devDependencies` of `package.json` | High |
| **peer** | Found in `peerDependencies` of `package.json` | High |
| **dev** | Found in `devDependencies` and only imported in `test/` or `*.test.*` files | Medium |
| **phantom** | Imported in source but NOT in any `package.json` field | Requires investigation |

### Classification Script

```bash
#!/usr/bin/env bash
set -euo pipefail

DEPS_FILE="${1:?Usage: classify-deps.sh <deps-file>}"
PKG_JSON="package.json"

while IFS=: read -r file line import; do
  if [[ "$import" =~ ^\./ ]] || [[ "$import" =~ ^\.\./ ]]; then
    category="internal"
  elif jq -e --arg pkg "$import" '.peerDependencies[$pkg]' "$PKG_JSON" > /dev/null 2>&1; then
    category="peer"
  elif jq -e --arg pkg "$import" '.dependencies[$pkg]' "$PKG_JSON" > /dev/null 2>&1; then
    category="external"
  elif jq -e --arg pkg "$import" '.devDependencies[$pkg]' "$PKG_JSON" > /dev/null 2>&1; then
    category="dev"
  else
    category="phantom"
  fi
  echo "${file}:${line}:${import}:${category}"
done < "$DEPS_FILE"
```

---

## Step 3: DETECT — Find Problems

### Version Conflict Detection

```bash
# Find duplicate packages at different versions
find node_modules -name "package.json" -exec jq -r '{name: .name, version: .version}' {} \; \
  | jq -s 'group_by(.name) | map(select(length > 1)) | .[]'
```

### Circular Dependency Detection

```bash
# Build adjacency list from imports
grep -rn "import.*from ['\"]\." src/ --include="*.ts" \
  | sed 's/:import.*from ['\''"]\(.*\)['\''"].*/ \1/' \
  | sort -u > /tmp/deps-adjacency.txt

# Detect cycles (requires ts-graph or manual BFS)
# Manual approach: for each file, trace imports until loop or dead end
```

**Common circular dependency patterns:**

| Pattern | Example | Typical Fix |
|---------|---------|-------------|
| A → B → A | `continuity.ts` ↔ `lifecycle-manager.ts` | Extract shared types to leaf module |
| A → B → C → A | Three-way cycle via transitive deps | Identify shared concern, extract to leaf |
| Re-export cycle | `index.ts` files re-exporting each other | Flatten re-export chains |

### Missing Peer Detection

```bash
# Packages used in source but not declared as peers
grep -rn "from ['\"]@opencode-ai" src/ --include="*.ts" \
  | sed "s/.*from ['\"]//;s/['\"].*//" \
  | sort -u > /tmp/used-peers.txt

jq -r '.peerDependencies // {} | keys[]' package.json \
  | sort -u > /tmp/declared-peers.txt

comm -23 /tmp/used-peers.txt /tmp/declared-peers.txt
```

---

## Step 4: RESOLVE — Propose Fixes

### Fix Template

For each detected issue, produce a structured record:

```json
{
  "id": "DEP-001",
  "type": "circular_dependency",
  "severity": "high",
  "files": ["src/lib/continuity.ts", "src/lib/lifecycle-manager.ts"],
  "evidence": "continuity.ts:12 imports from lifecycle-manager.ts, lifecycle-manager.ts:8 imports from continuity.ts",
  "fix": "Extract shared types to src/lib/types.ts",
  "effort": "low",
  "breaking": false,
  "validation": "npm run typecheck && npm test"
}
```

### Severity Classification

| Severity | Criteria | Action |
|----------|----------|--------|
| **critical** | Circular dependency in core modules | Fix immediately, blocks other work |
| **high** | Missing peer, version conflict | Fix before release |
| **medium** | Phantom dependency, orphan import | Fix when convenient |
| **low** | Dev dependency in production code | Advisory, fix opportunistically |

---

## Step 5: VALIDATE — Prove It Works

### Validation Sequence

```bash
# Type checking catches interface mismatches
npm run typecheck
# Expected: exit 0

# Build catches missing exports, broken imports
npm run build
# Expected: exit 0

# Tests catch behavioral regressions from refactoring
npm test
# Expected: all pass
```

### Validation Failure Loop

```
VALIDATE
  |
  +-- typecheck fails → RESOLVE: fix type errors → VALIDATE
  +-- build fails → RESOLVE: fix build errors → VALIDATE
  +-- tests fail → RESOLVE: fix regressions → VALIDATE
  +-- all pass → DONE
```

**Max iterations:** 5. After 5 failures, stop and escalate.

---

## Dependency Graph Generation

### Adjacency List Format

```
# File → Dependencies (one per line)
src/lib/types.ts → (none)
src/lib/helpers.ts → src/lib/types.ts
src/lib/concurrency.ts → src/lib/types.ts
src/lib/continuity.ts → src/lib/types.ts, src/lib/helpers.ts
src/lib/lifecycle-manager.ts → src/lib/types.ts, src/lib/continuity.ts, src/lib/concurrency.ts
src/plugin.ts → src/lib/lifecycle-manager.ts, src/lib/continuity.ts
```

### Graph Properties to Check

| Property | How | Why |
|----------|-----|-----|
| **Leaf count** | Nodes with 0 internal deps | Should be ≥30% of modules |
| **Max depth** | Longest path from root to leaf | Should be ≤4 levels |
| **Fan-out** | Nodes with most outgoing deps | Flag if >8 |
| **Fan-in** | Nodes with most incoming deps | Identify shared modules |
| **Cycles** | Nodes in circular paths | Must be 0 |

### DOT Output (for visualization)

```bash
# Generate DOT graph from adjacency list
echo "digraph deps {"
echo "  rankdir=LR;"
echo "  node [shape=box];"
while read -r file deps; do
  file_node=$(basename "$file" .ts)
  for dep in $deps; do
    dep_node=$(basename "$dep" .ts)
    echo "  \"$file_node\" -> \"$dep_node\";"
  done
done < /tmp/deps-adjacency.txt
echo "}"
```

---

## Monorepo Handling

### Package Boundary Detection

```bash
# Find all package.json files (indicates workspace packages)
find . -name "package.json" -not -path "*/node_modules/*" \
  | while read -r pkg; do
    dir=$(dirname "$pkg")
    name=$(jq -r '.name' "$pkg")
    echo "${dir}:${name}"
  done
```

### Cross-Package Dependency Rules

| Rule | Detection | Fix |
|------|-----------|-----|
| No circular package deps | Package A depends on B, B depends on A | Extract shared package |
| Peer deps declared | Cross-package imports have peer declarations | Add to `peerDependencies` |
| No version skew | Same package at different versions across workspace | Use workspace protocol |
| Build order respected | Dependency graph → topological sort for build | Adjust build scripts |

### Workspace Protocol

```json
{
  "dependencies": {
    "@scope/shared": "workspace:*"
  }
}
```

Use `workspace:*` for intra-monorepo dependencies. Package manager resolves to local path during development, published version during release.
