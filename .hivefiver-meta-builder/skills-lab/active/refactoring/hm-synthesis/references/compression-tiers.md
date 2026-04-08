# Compression Tiers

Per-language settings, repomix configuration, and worked examples for the three compression tiers.

---

## Tier Specifications

### Snapshot (0% Reduction)

Full source code with comments, whitespace, and private members preserved.

**When to use:**
- Security audit (need every line)
- Legal compliance (need exact source)
- Final pre-merge review
- Debugging production issues with exact line mapping

**Configuration:**

```bash
repomix_pack_codebase(
  directory="src/",
  compress=false,
  includePatterns="**/*.ts",
  style="xml"
)
```

**What you get:**
- Every function body (public and private)
- All comments (inline, block, JSDoc)
- All type annotations in full
- Whitespace preserved
- Source maps accurate to original lines

### Focused (~50% Reduction)

Tree-sitter signatures for all declarations + full body for key implementations.

**When to use:**
- Dependency analysis
- Code review preparation
- Developer onboarding
- Understanding a module for modification

**Configuration:**

```bash
repomix_pack_codebase(
  directory="src/",
  compress=true,
  includePatterns="**/*.ts",
  style="xml"
)
```

**What tree-sitter compression strips:**
- Function/method bodies → signature only
- Private member implementations → signature only
- Inline comments → stripped
- Block comments → stripped

**What it preserves:**
- All export signatures (types, parameters, return types)
- Public method bodies
- Error handling paths (try/catch blocks)
- Configuration and constants
- Import/export statements

### Signature (~70% Reduction)

Types, interfaces, exports, and module boundaries only. No implementations.

**When to use:**
- Architecture planning
- API contract extraction
- Budget-constrained context (large codebases)
- Interface-first development

**Extraction commands:**

```bash
# TypeScript types and interfaces
grep -n "^export type\|^export interface\|^export enum" src/**/*.ts

# Module public API (re-exports)
grep -n "export.*from\|export {" src/**/index.ts

# Function signatures only
grep -n "^export function\|^export async function\|^export const.*= (" src/**/*.ts

# Class signatures with public methods
grep -n "^export class\|public " src/**/*.ts
```

---

## Per-Language Settings

### TypeScript / JavaScript

| Setting | Snapshot | Focused | Signature |
|---------|----------|---------|-----------|
| `compress` | false | true | N/A (manual grep) |
| `includePatterns` | `**/*.ts` | `**/*.ts` | `**/*.ts` |
| Key grep targets | N/A | N/A | `^export type`, `^export interface`, `^export function` |
| Typical reduction | 0% | 50-55% | 70-80% |

### Python

| Setting | Snapshot | Focused | Signature |
|---------|----------|---------|-----------|
| `compress` | false | true | N/A (manual grep) |
| `includePatterns` | `**/*.py` | `**/*.py` | `**/*.py` |
| Key grep targets | N/A | N/A | `^class `, `^def `, `^async def ` |
| Typical reduction | 0% | 45-55% | 65-75% |

### Go

| Setting | Snapshot | Focused | Signature |
|---------|----------|---------|-----------|
| `compress` | false | true | N/A (manual grep) |
| `includePatterns` | `**/*.go` | `**/*.go` | `**/*.go` |
| Key grep targets | N/A | N/A | `^func `, `^type `, `^var ` |
| Typical reduction | 0% | 50-60% | 70-80% |

---

## Worked Examples

### Example 1: Focused Tier on HiveMind Plugin

**Input:** `src/` directory, ~3000 LOC across 12 TypeScript files.

```bash
# Step 1: Pack with compression
repomix_pack_codebase(
  directory="src/",
  compress=true,
  includePatterns="**/*.ts"
)
# Output: ~1500 lines (50% reduction)

# Step 2: Grep for error handling paths (preserved in focused)
repomix_grep_repomix_output(outputId="<id>", pattern="catch|throw|Error")

# Step 3: Grep for public exports
repomix_grep_repomix_output(outputId="<id>", pattern="^export ")
```

**Result:** Full understanding of module structure, public API, and error paths at half the token cost.

### Example 2: Signature Tier for Architecture Planning

**Goal:** Understand the module boundaries of a 15-file codebase without reading implementations.

```bash
# Step 1: Extract all type/interface declarations
grep -rn "^export type\|^export interface" src/ --include="*.ts"
# Output: 45 declarations across 12 files

# Step 2: Extract module public API
grep -rn "export.*from\|export {" src/**/index.ts
# Output: Re-export map showing module boundaries

# Step 3: Build dependency graph from imports
grep -rn "import.*from" src/ --include="*.ts" | grep -v "node_modules"
# Output: Internal dependency edges

# Step 4: Visualize (manual or dot)
# Feed edges into dependency graph
```

**Result:** Complete architecture understanding at ~2400 tokens for a 3000 LOC codebase (70% savings).

### Example 3: Snapshot for Security Audit

**Goal:** Review every line of authentication module for security vulnerabilities.

```bash
# Full pack, no compression
repomix_pack_codebase(
  directory="src/lib/auth/",
  compress=false,
  style="xml"
)
```

**Why Snapshot:** Security audits require exact line references. Any compression could miss a vulnerability hidden in a function body.

---

## Token Budget Estimates

Estimate token cost before choosing a tier.

| Codebase Size | Snapshot | Focused | Signature |
|---------------|----------|---------|-----------|
| 500 LOC | ~4,000 tokens | ~2,000 tokens | ~1,200 tokens |
| 2,000 LOC | ~16,000 tokens | ~8,000 tokens | ~4,800 tokens |
| 5,000 LOC | ~40,000 tokens | ~20,000 tokens | ~12,000 tokens |
| 10,000 LOC | ~80,000 tokens | ~40,000 tokens | ~24,000 tokens |

**Rule of thumb:** 1 LOC ≈ 8 tokens (TypeScript). Adjust for language:
- Python: 1 LOC ≈ 6 tokens
- Go: 1 LOC ≈ 7 tokens
- Rust: 1 LOC ≈ 10 tokens

---

## Anti-Patterns

| Anti-Pattern | Detection | Fix |
|-------------|-----------|-----|
| Signature for audit work | Security/legal review using signature tier | Always use Snapshot for audit/legal |
| Snapshot for planning | Architecture planning with full source | Signature tier gives you the shape you need |
| Ignoring language differences | Applying TS reduction ratios to Python | Use per-language estimates |
| Compressing test files | Tests compressed, losing assertion details | Exclude test patterns from compression |
