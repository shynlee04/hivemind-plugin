# Reading Modes

Detailed procedures and worked examples for the three reading modes: SKIM, SCAN, and DEEP.

---

## SKIM Mode (~5% Token Cost)

Use SKIM for orientation. You are answering: "What is this?" and "Where should I look?"

### Procedures

#### 1. Directory Orientation

```bash
# List top-level structure (not recursive)
ls -1

# Find all TypeScript files
glob "**/*.ts"

# Count files by type
glob "**/*.ts" | wc -l
glob "**/*.md" | wc -l
```

#### 2. File Relevance Check

```bash
# Does this file contain the term? (count only, no output)
grep -c "searchTerm" file.ts

# How many files match? (orientation, not extraction)
grep -rl "searchTerm" src/ | wc -l
```

#### 3. Frontmatter-Only Read (Planning Docs)

For `.md` files with YAML frontmatter, read only the metadata block:

```
Read file.md, offset=1, limit=15
```

This captures the `---` block (name, description, status, key_files) without loading the body.

### Worked Example: "What does this project do?"

```
Step 1: ls -1 → See top-level dirs: src/, tests/, docs/, .opencode/
Step 2: glob "**/*.ts" → 47 TypeScript files found
Step 3: grep -c "export" src/index.ts → 12 exports (this is the public API)
Step 4: Read src/index.ts, offset=1, limit=20 → See re-exports, understand module structure
Step 5: Read AGENTS.md, offset=1, limit=15 → Frontmatter tells you project purpose
```

Total context consumed: ~50 lines. Full project understood at SKIM level.

### SKIM Exit Criteria

- [ ] You can name the top 3 directories and their purpose
- [ ] You know which files are entry points (index.ts, plugin.ts, main.ts)
- [ ] You have a list of candidate files for deeper investigation
- [ ] You have NOT read any file body > 30 lines

If you cannot answer these, escalate to SCAN.

---

## SCAN Mode (~15% Token Cost)

Use SCAN for targeted retrieval. You are answering: "Where is X?" and "What does X look like?"

### Procedures

#### 1. Grep-Before-Read (Always)

```bash
# Find exact line numbers
grep -n "functionName" file.ts
# Output: 45:export function functionName() {

# Find with context (3 lines before/after)
grep -n -C 3 "functionName" file.ts
```

#### 2. Offset Hop-Reading

Once you have line numbers from grep, read only the relevant sections:

```
# grep found match at line 120
# Read 20 lines before and 20 lines after
Read file.ts, offset=100, limit=40
```

**Formula**: `offset = lineNumber - 20`, `limit = 40`

#### 3. TOC Navigation

For large files, extract the structure first:

```bash
# Get all level-2 and level-3 headings
grep -n "^## " file.md
# Output: 10:## Configuration, 45:## API Reference, 120:## Examples
```

Then hop to the relevant section using offset reads.

### Worked Example: "Where is the session recovery logic?"

```
Step 1: grep -rn "recovery" src/ --include="*.ts"
  → src/lib/continuity.ts:45, src/lib/lifecycle-manager.ts:120, src/lib/session-api.ts:89

Step 2: Read src/lib/continuity.ts, offset=25, limit=40
  → Found: JSON persistence layer, not recovery logic

Step 3: Read src/lib/lifecycle-manager.ts, offset=100, limit=40
  → Found: State machine with recovery transitions. This is the target.

Step 4: Read src/lib/session-api.ts, offset=69, limit=40
  → Found: Typed SDK wrappers, calls recovery but doesn't implement it
```

Total context consumed: ~120 lines across 3 targeted reads. Full logic understood.

### SCAN Exit Criteria

- [ ] You have located the exact lines containing your target
- [ ] You have read ±20 lines of context around each target
- [ ] You understand the local code structure (imports, exports, dependencies)
- [ ] You have NOT read any file body > 100 lines

If you still don't understand the full flow, escalate to DEEP.

---

## DEEP Mode (100% Token Cost)

Use DEEP only when you need every line. This is the most expensive mode — reserve it for final understanding.

### Procedures

#### 1. Full File Read

```
Read file.ts
```

Only do this after SKIM + SCAN confirm this is the right file and you need the complete picture.

#### 2. Repomix Pack + Grep

For multi-file understanding:

```bash
# Pack with compression (70% token reduction)
repomix_pack_codebase(directory="src/", compress=true, includePatterns="**/*.ts")

# Then grep the packed output for patterns
repomix_grep_repomix_output(outputId="<id>", pattern="recovery")
```

#### 3. Dependency Chain Tracing

When you need to understand a full call chain:

```
Step 1: grep -n "import.*from" target.ts → List all dependencies
Step 2: For each dependency, SCAN mode first (grep → offset read)
Step 3: Only DEEP read files that are central to the chain
```

### Worked Example: "How does the full delegation chain work?"

```
Step 1 (SKIM): grep -rn "delegate" src/ --include="*.ts" | wc -l → 23 matches
Step 2 (SKIM): grep -rn "delegate" src/ --include="*.ts" → Found in 5 files
Step 3 (SCAN): Read each file at match locations (5 × 40 lines = 200 lines)
Step 4 (DEEP): Full read of lifecycle-manager.ts (450 lines) — central orchestrator
Step 5 (DEEP): Full read of continuity.ts (350 lines) — persistence layer
```

Total context consumed: ~1000 lines. Full delegation chain understood.

### DEEP Exit Criteria

- [ ] You understand every code path in the target file(s)
- [ ] You can trace the full call chain from entry to exit
- [ ] You have identified all side effects and state mutations
- [ ] You have documented findings (see document-pipeline.md)

---

## SCAN (Tech Stack) Mode (~10% Token Cost)

A specialized SCAN variant for detecting technology stacks, versions, and dependencies. Cheaper than full SCAN because it targets only indicator files.

### Trigger

Use SCAN (Tech Stack) when:
- User asks "what tech stack is this?" or "what's this built with?"
- User asks "analyze dependencies"
- Before any compression or analysis that needs stack-aware `--include` patterns
- `.tech-registry.json` is missing or stale

### Procedure

```bash
# Step 1: Detect indicator files (SKIM-level scan)
ls package.json go.mod Cargo.toml pyproject.toml pom.xml build.gradle tsconfig.json bunfig.toml 2>/dev/null

# Step 2: Read the primary indicator file
cat package.json  # or go.mod, Cargo.toml, etc.

# Step 3: Read secondary indicators (5-10 files max)
cat tsconfig.json
cat bunfig.toml
cat README.md | head -50  # often describes the stack

# Step 4: Extract versions from lockfiles
cat package-lock.json | grep -o '"version": "[^"]*"' | head -20
cat Cargo.lock | grep -A1 '^\[\[package\]\]' | grep 'name = "\|version = "' | head -40
```

### Output Format

Produce a 5-10 bullet tech stack summary:

```markdown
## Tech Stack Summary: [project-name]

- **Language:** TypeScript (from tsconfig.json, .ts files)
- **Runtime:** Bun 1.1.x (from bunfig.toml)
- **Framework:** OpenCode Plugin SDK (from src/plugin.ts, package.json)
- **Build Tool:** tsc (from tsconfig.json)
- **Test Framework:** bun:test (from .test.ts files, bun-test.d.ts)
- **Key Dependencies:** (from package.json dependencies)
  - @opencode-ai/plugin
  - (list top 5)
- **Architecture:** Plugin system with hooks, agents, skills, tools, commands
```

### Cost Budget

| Operation | Cost | Notes |
|-----------|------|-------|
| Detect indicator files | ~50 tokens | `ls` or `glob` |
| Read package.json | ~200 tokens | typically 50-100 lines |
| Read 5 secondary files | ~500 tokens | tsconfig, README head, etc. |
| Parse lockfile versions | ~100 tokens | `grep` only, no full read |
| **Total** | **~850 tokens** | vs. ~3000+ for full SCAN of src/ |

### Cross-Skill Integration

- **hm-synthesis**: Tech stack detection runs as SCAN (Tech Stack) before any packing operation. Results inform `repomix --include` patterns.
- **hm-deep-research**: Version data feeds Context7 `resolve-library-id` queries for version-matched documentation research.
- **.tech-registry.json**: Write findings using the unified schema (project, last_updated, stack, concerns, modules) so all three skills share the same data.

---

## Escalation Protocol

```
START
  |
  v
SKIM → Can you answer the question?
  | YES → DONE
  | NO
  v
SCAN or SCAN (Tech Stack) → Can you answer the question?
  | YES → DONE
  | NO
  v
DEEP → Read what you must, no more
  |
  v
DONE
```

**Never skip levels.** Each mode filters out irrelevant content so the next mode costs less.

### Case Study: Understanding a 2000-Line Codebase

| Approach | Lines Read | Context Cost | Understanding |
|----------|-----------|-------------|---------------|
| Read everything | 2000 | 100% | High (but context blown) |
| SKIM → SCAN → DEEP | ~400 | ~20% | High (targeted) |
| SKIM → SCAN only | ~200 | ~10% | Medium (gaps documented) |

The escalation approach delivers equivalent understanding at 20% of the cost.
