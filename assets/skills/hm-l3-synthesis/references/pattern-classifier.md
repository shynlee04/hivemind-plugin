# Pattern Classifier

Full detection algorithm, edge case handling, and classification output format for code pattern analysis.

---

## Classification Axes

Every module classified along three axes, adapted from skill-synthesis pattern detection:

| Axis | Categories | What It Measures |
|------|-----------|-----------------|
| **Pattern** | P1 (Fundamental), P2 (Integration), P3 (Utility) | Structural complexity and dependency count |
| **Role** | leaf, mid, root | Position in dependency graph |
| **Stability** | stable, evolving, volatile | Change frequency based on git history |

These axes are independent. A P1 module can be a leaf (typical) or a root (unusual). A P3 module can be stable (typical) or volatile (watch out).

---

## P1/P2/P3 Detection Rules

| Pattern | LOC | Internal Deps | Imported By | Decision |
|---------|-----|---------------|-------------|----------|
| **P1 — Fundamental** | < 200 | 0-2 | Any number | Single responsibility, no coordination |
| **P2 — Integration** | 200-500 | 3-8 | Any number | Coordinates multiple P1/P3 modules |
| **P3 — Utility** | Any | Any | ≥ 5 modules | Cross-cutting concern, reused broadly |

### Detection Algorithm

```bash
#!/usr/bin/env bash
set -euo pipefail

FILE="${1:?Usage: classify-module.sh <file>}"
SRC_DIR="${2:?Usage: classify-module.sh <file> <src-dir>}"

line_count=$(wc -l < "$FILE")

# Count internal imports
internal_deps=$(grep -c "from ['\"]\.\." "$FILE" 2>/dev/null || echo 0)

# Count how many other files import this module
module_name=$(basename "$FILE" .ts)
imported_by=$(grep -rl "from.*['\"]\..*${module_name}" "$SRC_DIR" --include="*.ts" 2>/dev/null | wc -l || echo 0)

# Classify by pattern
if [ "$internal_deps" -le 2 ] && [ "$line_count" -lt 200 ]; then
  pattern="P1"
  pattern_name="Fundamental"
elif [ "$internal_deps" -ge 3 ] && [ "$internal_deps" -le 8 ]; then
  pattern="P2"
  pattern_name="Integration"
elif [ "$imported_by" -ge 5 ]; then
  pattern="P3"
  pattern_name="Utility"
elif [ "$line_count" -le 500 ]; then
  pattern="P2"
  pattern_name="Integration"
else
  pattern="P2"
  pattern_name="Integration"
fi

# Determine role
if [ "$internal_deps" -eq 0 ]; then
  role="leaf"
elif [ "$imported_by" -eq 0 ]; then
  role="root"
else
  role="mid"
fi

jq -n \
  --arg pattern "$pattern" \
  --arg pattern_name "$pattern_name" \
  --arg role "$role" \
  --argjson lines "$line_count" \
  --argjson deps "$internal_deps" \
  --argjson imported_by "$imported_by" \
  '{
    pattern: $pattern,
    pattern_name: $pattern_name,
    role: $role,
    line_count: $lines,
    internal_deps: $deps,
    imported_by: $imported_by
  }'
```

---

## Role Classification

Position in the dependency graph determines module role:

| Role | Detection | Responsibility |
|------|-----------|---------------|
| **leaf** | 0 internal dependencies | Pure logic, types, constants. Depend on nothing. |
| **mid** | Has deps AND is imported by others | Business logic, coordination. Most modules live here. |
| **root** | Has deps but imported by nobody (or only test files) | Entry points: `plugin.ts`, `index.ts`, CLI main. |

### Role Distribution Health

A healthy codebase has:
- **≥30% leaf modules** — prevents brittle dependency chains
- **≤3 root modules** — too many entry points = unclear architecture
- **Max depth ≤4** — root → mid → mid → leaf. Longer chains indicate coupling.

---

## Stability Classification

```bash
# Count changes in last 30 days
changes=$(git log --since="30 days ago" --oneline -- "$FILE" | wc -l)
```

| Stability | Changes (30d) | Implication |
|-----------|---------------|-------------|
| **stable** | 0-2 | Safe to depend on. Interface unlikely to change. |
| **evolving** | 3-8 | Active development. Expect breaking changes. |
| **volatile** | > 8 | Rapid iteration. Build abstraction layers over it. |

---

## Classification Output Format

Every classified module produces a JSON record:

```json
{
  "module": "src/lib/concurrency.ts",
  "pattern": "P1",
  "pattern_name": "Fundamental",
  "role": "leaf",
  "stability": "stable",
  "line_count": 87,
  "internal_deps": 1,
  "imported_by": 4,
  "confidence": "high",
  "purpose": "Keyed semaphore with FIFO queue for concurrency control"
}
```

### Batch Output

For a full codebase classification:

```json
{
  "codebase": "opencode-harness",
  "generated": "2025-04-08T12:00:00Z",
  "summary": {
    "total_modules": 12,
    "P1": 5,
    "P2": 5,
    "P3": 2,
    "leaf": 5,
    "mid": 5,
    "root": 2
  },
  "modules": [
    { "module": "src/lib/types.ts", "pattern": "P1", "role": "leaf", ... },
    { "module": "src/lib/helpers.ts", "pattern": "P1", "role": "leaf", ... }
  ],
  "issues": [
    { "type": "deep_chain", "files": ["..."], "depth": 5 }
  ]
}
```

---

## Evidence Requirements

Every classification must include:

| Evidence | Required | How |
|----------|----------|-----|
| Line count | Yes | `wc -l` |
| Internal dependency count | Yes | `grep -c "from ['\"]\.\."` |
| Imported-by count | Yes | `grep -rl` reverse lookup |
| Purpose statement | Yes | One sentence, human-written or inferred from exports |
| Confidence level | Yes | `high` (clear) / `medium` (boundary) / `low` (ambiguous) |
| Stability | Optional | Git history analysis |

### Confidence Levels

| Level | Criteria |
|-------|----------|
| **high** | Pattern, role, and stability all unambiguous |
| **medium** | One axis is on a boundary (e.g., 195 LOC with P1 cutoff at 200) |
| **low** | Multiple axes ambiguous. Flag for human review. |

---

## Edge Cases

### Ambiguous Classification

When a module falls on a boundary (e.g., 195 LOC with 3 deps):

1. **Primary purpose heuristic**: What does the module spend most lines on?
   - Single concern with helpers → P1
   - Coordinating multiple modules → P2
   - Cross-cutting utility → P3

2. **Flag in output**:
   ```json
   {
     "pattern": "P1",
     "confidence": "medium",
     "ambiguity_reason": "LOC suggests P1 (195L) but dep count suggests P2 (3 deps)"
   }
   ```

### Hybrid Modules

Some modules combine patterns. Handle by primary purpose:

| Hybrid | Detection | Resolution |
|--------|-----------|------------|
| P1 with P2 traits | Leaf module that also coordinates | Classify as P2, flag `primary_purpose: "leaf_coordination"` |
| P2 with P3 traits | Integration module imported by many | Classify as P3, flag `primary_purpose: "shared_integration"` |
| P1/P3 combined | Small, widely-imported utility | Classify as P3 (usage breadth wins over size) |

### Large Leaf Modules

A module with 0 deps but 500+ LOC is unusual. Investigate:
- Is it doing too much? → Recommend split
- Is it a generated file? → Exclude from classification
- Is it a data file (constants, mappings)? → Classify as P1 with note

---

## Classification Workflow

```
1. SKIM: glob "**/*.ts" → module list
2. SCAN: For each module:
   a. wc -l → line count
   b. grep -c → dep count
   c. grep -rl → imported-by count
3. CLASSIFY: Run detection algorithm per module
4. AGGREGATE: Build summary statistics
5. FLAG: Mark ambiguous, hybrid, and oversized modules
6. REPORT: JSON output with all records
```

---

## Anti-Patterns

| Anti-Pattern | Detection | Fix |
|-------------|-----------|-----|
| Classifying without evidence | Pattern claim without line count + dep count | Run detection algorithm. Attach evidence. |
| Ignoring role distribution | 80% mid modules, 5% leaf | Restructure: extract leaf modules from mid |
| Over-classifying | Every 50-line file gets its own P1 | Merge small modules with shared concern |
| Stale classification | Module changed since classification date | Re-run for changed modules. Timestamp output. |
