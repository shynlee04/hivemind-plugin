# Repomix Packed XML Format — Deep Structural Analysis

**Date:** 2026-03-22
**Samples Analyzed:** 3 packed repositories

---

## A. Header/Metadata Section

All three files share an **identical** `<file_summary>` block (lines 1–40). It contains no quantitative metrics — no file count, no token count, no byte estimate. Purely descriptive.

### Structure

```
Line 1:  "This file is a merged representation of the entire codebase, combined into a single document by Repomix."
Line 2:  (blank)
Line 3:  <file_summary>
Line 4:  "This section contains a summary of this file."
Line 6:  <purpose>        — describes packed representation purpose
Line 12: <file_format>    — describes 5-section ordering
Line 23: <usage_guidelines> — read-only, path-based disambiguation, security warning
Line 32: <notes>          — exclusion rules (.gitignore, binary, default patterns, sort order)
Line 40: </file_summary>
```

**Key observation:** The `file_format` tag explicitly lists the 5-section order:
1. Summary section (this)
2. Repository information (absent in all 3 samples)
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries (path attribute + contents)

Section 2 ("Repository information") is **not present** in any of the 3 samples — it's described in the template but not populated by default Repomix config.

---

## B. File Tree (Directory Structure)

### Tag: `<directory_structure>...</directory_structure>`

Plain-text indented tree — **not XML nodes**, not JSON. Two-space indentation per level.

```
<directory_structure>
.github/
  ISSUE_TEMPLATE/
    bug_report.yml
    feature_request.yml
  workflows/
    auto-label-issues.yml
agents/
  gsd-codebase-mapper.md
  ...
</directory_structure>
```

**No line numbers, no metadata, no icons.** Pure text with directory trailing `/` absent for files (no trailing slash distinction — all entries are flat names under parent indentation).

### File counts

| File | Tree depth (approx) | Top-level dirs |
|------|---------------------|----------------|
| repomix-bmad-builder.xml | 7 levels | `.claude/`, `.github/`, `docs/`, `samples/`, root files |
| repomix-bmad-method.xml | 8 levels | `.augment/`, `.claude/`, `.github/`, `.husky/`, `docs/`, `src/`, `website/`, root files |
| repomix-gsd-get-shit-done.xml | 6 levels | `.github/`, `agents/`, `assets/`, `bin/`, `commands/`, `docs/`, `get-shit-done/`, `hooks/`, `scripts/`, root files |

---

## C. File Content Representation

### Tag pattern

```xml
<file path="relative/path/to/file.ext">
[file raw contents — no escaping, no CDATA, no line numbers]
</file>
```

**Critical details:**

- **`path` is the only attribute** — no `lang`, `size`, `lines`, `encoding`, `checksum` attributes
- **No line numbering** — raw file contents appear verbatim, no prefix numbers
- **No CDATA wrapping** — raw content is placed directly between tags
- **No escaping** — if a file contains `</` or `<`, it appears raw (potential parse hazard)
- **Binary files are excluded** — SVG is included as text; PNG/JPG listed in directory tree but content absent
- **Sort order:** Files sorted by Git change count (most-changed at bottom per notes)
- **Separator:** Empty line between each `</file>` and next `<file path="...">`

### Example — small file (bmad-builder)

```xml
<file path=".claude/skills/bmad-os-add-doc/SKILL.md">
---
name: bmad-os-add-doc
description: Guided authoring for Diataxis-compliant documentation
disable-model-invocation: true
---

Read `prompts/instructions.md` and execute.
</file>
```

### Example — code file (gsd)

```xml
<file path="bin/install.js">
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
...
</file>
```

**No syntax highlighting, no language hints.** Content type is inferred solely from the file extension in the `path` attribute.

---

## D. Footer/Summary Section

**There is NO footer/summary section.** All three files end with:

```xml
</file>

</files>
```

The last file is always the most-changed file (per the sort order note). The file terminates immediately after `</files>`. No aggregate statistics, no token counts, no file count summary, no generation timestamp.

The `README.md` (or equivalent) is typically among the last files since it changes frequently.

---

## E. Size

| File | Lines | Disk Size |
|------|-------|-----------|
| repomix-bmad-builder.xml | 38,071 | 1.1 MB |
| repomix-bmad-method.xml | 77,918 | 2.7 MB |
| repomix-gsd-get-shit-done.xml | 45,270 | 1.4 MB |
| **Total** | **161,259** | **5.2 MB** |

| File | `<file path=` count |
|------|---------------------|
| repomix-bmad-builder.xml | 364 |
| repomix-bmad-method.xml | 481 |
| repomix-gsd-get-shit-done.xml | 166 |

---

## F. Cross-File Comparison

### Common across all 3

| Element | Identical? | Notes |
|---------|-----------|-------|
| Lines 1–40 (`<file_summary>`) | ✅ Identical | Word-for-word same header |
| `<directory_structure>` format | ✅ Identical | Plain text, 2-space indent |
| `<file path="...">...</file>` | ✅ Identical | Single attribute, raw content |
| `<files>` wrapper | ✅ Identical | Same one-liner: "This section contains the contents of the repository's files." |
| `</files>` closing | ✅ Identical | File ends immediately after |
| Sort order | ✅ Identical | Git change count descending |
| No line numbers | ✅ Identical | None of the 3 have line-numbered content |
| No footer stats | ✅ Identical | No token/file/size summary at end |

### Differences

| Aspect | bmad-builder | bmad-method | gsd |
|--------|-------------|-------------|-----|
| Total lines | 38,071 | 77,918 | 45,270 |
| File count | 364 | 481 | 166 |
| Disk size | 1.1 MB | 2.7 MB | 1.4 MB |
| Largest tree depth | ~7 | ~8 | ~6 |
| Primary content types | `.md`, `.yaml`, `.sh` | `.md`, `.yaml`, `.ts`, `.mjs` | `.md`, `.js`, `.cjs`, `.yml` |
| Repo info in template content | None | Has `{{repository_structure_summary}}` Handlebars template in a `.md` file | None |

---

## G. Grep/Search Patterns

### Finding a specific file entry

```bash
# Find exact file by path
grep -n '<file path="path/to/file.md">' file.xml

# Find all files in a directory
grep -n '<file path="agents/' repomix-gsd-get-shit-done.xml

# Find all .ts files
grep -n '<file path=".*\.ts">' file.xml

# Find all YAML files
grep -n '\.ya\?ml">' file.xml
```

### Extracting a single file's content

```bash
# Extract content between two file tags (using line numbers)
# First get line numbers:
grep -n '<file path="agents/gsd-planner.md">' file.xml
grep -n '</file>' file.xml | head -N

# Then extract with sed:
sed -n '4574,5851p' file.xml | tail -n +2 | head -n -1

# Or with awk (cleaner):
awk '/<file path="agents\/gsd-planner.md">/{found=1; next} /<\/file>/{found=0} found' file.xml
```

### Finding function/class definitions

```bash
# Search for a function across all packed files
grep -n 'function myFunction' file.xml

# Search for exports
grep -n 'export.*default\|module\.exports' file.xml

# Search for imports
grep -n "import.*from\|require(" file.xml

# Search for class definitions
grep -n 'class [A-Z]' file.xml
```

### Cross-file pattern analysis

```bash
# Count files per directory
grep '<file path="' file.xml | sed 's/<file path="//;s/".*//' | sed 's|/[^/]*$||' | sort | uniq -c | sort -rn | head -20

# List all file extensions
grep '<file path="' file.xml | grep -oP '\.\w+(?=")' | sort | uniq -c | sort -rn

# Find all markdown files
grep '<file path=".*\.md">' file.xml | wc -l

# Find files containing a specific string
grep -l 'pattern' file.xml  # only works if pattern is outside tags
```

### Navigating the directory structure

```bash
# View the directory tree
awk '/<directory_structure>/,/<\/directory_structure>/' file.xml

# Count total files listed in tree
awk '/<directory_structure>/,/<\/directory_structure>/' file.xml | grep -v '<directory_structure>\|</directory_structure>' | grep -v '^$' | wc -l
```

---

## H. Ingestion Workflow for AI Agents

### Step 1: Load and validate

```
Input: path to packed XML
- Read first 40 lines → confirm it's a Repomix packed file
- Verify `<file_summary>` tag exists
- Read last 5 lines → confirm `</files>` closing tag
- Record total line count for progress tracking
```

### Step 2: Parse directory structure

```
- Find `<directory_structure>` (grep -n)
- Find `</directory_structure>` (grep -n)
- Extract lines between them
- Build in-memory tree for navigation
- File count = count of `<file path=` tags
```

### Step 3: Locate a specific file

```
Method A — Known path:
  grep -n '<file path="exact/path.md">' packed.xml
  → returns line number N

Method B — Search by name:
  grep -n 'filename' packed.xml  (finds references)
  grep -n '<file path=".*filename' packed.xml  (finds the entry)

Method C — By directory:
  grep -n '<file path="src/tools/' packed.xml
  → lists all files in that directory
```

### Step 4: Extract file content

```
Given: opening line M (from <file path="..."> line)

Option A — Find closing tag:
  next_close=$(awk "NR>{M}" packed.xml | grep -n '</file>' | head -1 | cut -d: -f1)
  end=$((M + next_close - 1))
  sed -n "$((M+1)),${end}p" packed.xml

Option B — Known next file:
  sed -n "$((M+1)),$((NEXT_OPEN-2))p" packed.xml

Option C — Stream extraction:
  awk "NR>{M}" packed.xml | awk '/^<\/file>/{exit} NR>1{print}'
```

### Step 5: Cross-reference between files

```
# Find all files that import/reference a specific module
grep -B1 'import.*module-name' packed.xml | grep '<file path'

# Find all files that reference a function
grep -B2 'functionName' packed.xml | grep '<file path'

# Build dependency map:
# For each <file path="*.ts">:
#   extract all import statements
#   resolve to local paths
#   create adjacency list
```

### Step 6: Batch extraction pattern

```bash
#!/bin/bash
# Extract all files matching a pattern into a temp directory
INPUT="packed.xml"
OUTDIR="/tmp/unpacked"
mkdir -p "$OUTDIR"

awk '
  /<file path="/ {
    match($0, /path="([^"]+)"/, arr)
    filepath = arr[1]
    # Create directory
    dir = filepath
    sub(/\/[^\/]+$/, "", dir)
    system("mkdir -p \"" dir "\"")
    outfile = filepath
    next
  }
  /<\/file>/ {
    outfile = ""
    next
  }
  outfile {
    print >> outfile
  }
' "$INPUT"
```

### Recommended AI ingestion pipeline

```
1. LOAD full XML (or attach via repomix_attach_packed_output)
2. ASK for directory_structure → get overview
3. GREP for specific file paths or patterns
4. READ specific file ranges using line offsets
5. For cross-reference: grep for symbols across all file boundaries
6. For code analysis: extract individual files, parse with tree-sitter
```

### Efficiency notes

- **Do NOT read the entire file into context** — use grep to find offsets, then read ranges
- **Directory structure is small** (~200 lines) — safe to read fully
- **File entries are sequential** — once you find one, the next `</file>` gives you the boundary
- **Paths are sorted by change frequency** — most stable files first, most volatile last
- **The XML is NOT valid XML** — content is raw, no CDATA, no entity escaping. Use line-based parsing, not XML parsers
