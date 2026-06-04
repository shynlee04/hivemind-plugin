# Interface Extraction

Templates, multi-file extraction procedures, and contract validation for extracting typed interfaces from source code.

---

## Extraction Types

Four contract types, each with its own extraction tool and output format.

| Type | Source Signal | Output |
|------|--------------|--------|
| **TypeScript types** | `export type`, `export interface`, `export enum` | Type declarations with all fields |
| **Module boundaries** | `index.ts` re-exports | Public API surface per module |
| **Event contracts** | `.emit()`, `.on()` call sites | Event name + payload type |
| **CLI contracts** | YAML frontmatter in command files | Command name, arguments, agent routing |

---

## TypeScript Type Extraction

### Single-File Extraction

```bash
grep -n "^export type\|^export interface\|^export enum" src/lib/types.ts
```

Output for each match:
- Line number
- Declaration name
- All member fields (for interfaces/enums)
- Generic type parameters

### Multi-File Extraction

For a full API surface across a module:

```bash
# Find all exported types across the module
grep -rn "^export type\|^export interface\|^export enum" src/ --include="*.ts"

# Extract full declarations (not just signatures)
# Read each file at the grep-reported lines, ±N lines for body
```

### Extraction Template

For each file with exported types:

```markdown
## `src/lib/types.ts`

**Exported Types:**
- `TaskStatus` (enum) — Lifecycle states for a task
- `SessionState` (interface) — Runtime state for an active session
- `DelegationPacket` (type) — Payload passed to subagents

**Exported Functions:**
- `isTransitionValid(from: TaskStatus, to: TaskStatus): boolean`
- `createPacket(config: PacketConfig): DelegationPacket`
```

### Full Extraction Script

```bash
#!/usr/bin/env bash
set -euo pipefail

SRC_DIR="${1:?Usage: extract-types.sh <src-dir>}"
OUT_FILE="${2:?Usage: extract-types.sh <src-dir> <output-file>}"

echo "# Interface Extraction Report" > "$OUT_FILE"
echo "**Generated:** $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$OUT_FILE"
echo "" >> "$OUT_FILE"

while IFS= read -r -d '' file; do
  rel_path="${file#$SRC_DIR/}"
  echo "## $rel_path" >> "$OUT_FILE"
  echo "" >> "$OUT_FILE"

  # Extract exported type/interface/enum lines
  grep -n "^export type\|^export interface\|^export enum" "$file" \
    | while IFS=: read -r line_num declaration; do
      echo "- \`$declaration\` (line $line_num)" >> "$OUT_FILE"
    done

  # Extract exported function signatures
  grep -n "^export function\|^export async function\|^export const.*= (" "$file" \
    | while IFS=: read -r line_num signature; do
      echo "- \`$signature\` (line $line_num)" >> "$OUT_FILE"
    done

  echo "" >> "$OUT_FILE"
done < <(find "$SRC_DIR" -name "*.ts" -print0 | sort -z)
```

---

## Module Boundary Extraction

### Procedure

```
1. Find all index.ts files (module entry points)
2. Read re-export statements
3. Trace re-exported symbols back to source files
4. Build module dependency graph from index.ts imports
```

### Extraction Template

For each module:

```markdown
## Module: `src/lib/continuity`

**Public API (re-exported from index.ts):**
- `loadState(path: string): SessionState`
- `saveState(path: string, state: SessionState): void`
- `mergeState(base: SessionState, patch: Partial<SessionState>): SessionState`

**Internal Dependencies:**
- `src/lib/types.ts` (leaf)
- `src/lib/helpers.ts` (leaf)

**Consumers (who imports this module):**
- `src/lib/lifecycle-manager.ts`
- `src/plugin.ts`
```

### Dependency Direction

```
types.ts (leaf) → helpers.ts (leaf) → continuity.ts → lifecycle-manager.ts → plugin.ts
                                                       ↑
                                              completion-detector.ts
```

Modules at the left are leaves (no internal deps). Modules at the right are roots (depend on everything). The extraction captures this directionality.

---

## Event Contract Extraction

### Detection Patterns

```bash
# EventEmitter pattern
grep -rn "\.emit(" src/ --include="*.ts"
grep -rn "\.on(" src/ --include="*.ts"

# Custom event bus pattern
grep -rn "dispatch\|subscribe\|publish" src/ --include="*.ts"
```

### Extraction Template

For each event:

```markdown
## Event: `task:completed`

**Emitter:** `src/lib/lifecycle-manager.ts:342`
**Payload:** `{ taskId: string, status: TaskStatus, duration: number }`
**Listeners:** `src/lib/notification-handler.ts:45`
**When emitted:** After task reaches a terminal state and notification is dispatched
```

### Event Flow Mapping

```
Emitter → Event Name → Payload Type → Listeners → Side Effects
```

For each event, trace the full chain. If a listener emits another event, mark the transitive chain.

---

## CLI Contract Extraction

### Detection

CLI contracts live in YAML frontmatter of command files:

```bash
# Find all command files
find .opencode/commands/ -name "*.md" -exec grep -l "^---" {} \;
```

### Extraction Template

For each command:

```markdown
## Command: `/start-work`

**File:** `.opencode/commands/start-work.md`
**Agent:** conductor
**Arguments:** `$ARGUMENTS` (freeform task description)
**Tools Used:** bash, skill, delegate-task
**Bash Injection:** Yes (non-interactive safety required)
**Skill Loading:** Yes (loads relevant skills based on task type)
```

---

## Contract Validation

After extraction, validate every contract against the running code.

### Validation Checklist

| Check | How | Pass Criteria |
|-------|-----|---------------|
| All exported types compile | `npm run typecheck` | Exit 0 |
| All event payloads match | Trace emit → listener types | Types compatible |
| All module boundaries accurate | Compare re-exports vs actual exports | 100% match |
| No orphaned types | Grep for usage of each exported type | Each used ≥1 time |
| No missing exports | Compare index.ts vs grep for `export` | All public symbols re-exported |

### Validation Script

```bash
#!/usr/bin/env bash
set -euo pipefail

# Verify typecheck passes with extracted interfaces
npm run typecheck
echo "PASS: typecheck"

# Verify build succeeds
npm run build
echo "PASS: build"

# Count orphaned types (exported but never imported)
total_exports=$(grep -rn "^export type\|^export interface" src/ --include="*.ts" | wc -l)
total_imports=$(grep -rn "import.*from" src/ --include="*.ts" | wc -l)

echo "Exports: $total_exports"
echo "Imports: $total_imports"

if [ "$total_exports" -gt 0 ] && [ "$total_imports" -eq 0 ]; then
  echo "WARN: No imports found (likely false positive)"
fi
```

---

## Multi-File Extraction Workflow

For large codebases (>20 files):

```
1. SKIM: glob "**/*.ts" → file list
2. SCAN: grep -rn "^export " → all exports
3. DEEP: Read each index.ts → module boundaries
4. EXTRACT: Apply templates for each contract type
5. VALIDATE: Run typecheck + build
6. EXPORT: Write to .tech-registry.json and interface docs
```

### Context Budget Management

| Step | Mode | Estimated Cost |
|------|------|---------------|
| File list | SKIM | ~20 lines |
| Export scan | SCAN | ~100 lines |
| Module boundaries | DEEP (index.ts only) | ~200 lines |
| Template fill | DEEP (targeted) | ~300 lines |
| **Total** | | **~620 lines** |

For a 5000 LOC codebase, this is ~12% of full read cost.

---

## Anti-Patterns

| Anti-Pattern | Detection | Fix |
|-------------|-----------|-----|
| Extracting private members | Interface doc includes `_`-prefixed symbols | Only extract `export`-ed symbols |
| Missing event payloads | Event listed with `emit("name")` but no payload type | Scan call site for the object literal passed |
| Stale contracts | Interface doc doesn't match current typecheck | Re-run extraction after any code change |
| Circular module deps | Module A boundary imports Module B, which imports A | Flag in extraction report. See cross-dep-analysis.md |
