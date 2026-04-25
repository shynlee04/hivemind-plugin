---
spike: 001
name: command-catalog-discovery
type: standard
validates: "Given `.opencode/command/*.md` and `.opencode/commands/*.md` exist with YAML frontmatter, when parsed with gray-matter, then all commands, descriptions, agents, and trigger phrases are extractable"
verdict: VALIDATED
related: [002]
tags: [commands, discovery, yaml, opencode, metadata]
---

# Spike 001: Command Catalog Discovery

## What This Validates

Given `.opencode/command/*.md` and `.opencode/commands/*.md` exist with YAML frontmatter, when parsed with gray-matter, then all commands, descriptions, agents, and trigger phrases are extractable.

## Research

- OpenCode commands are defined in markdown files with YAML frontmatter (`description`, `agent`, `subtask`, `tools`, `argument-hint`)
- The project uses `gray-matter` as a dependency for parsing frontmatter
- Commands live in two directories: `.opencode/command/` (GSD built-in commands, 81 files) and `.opencode/commands/` (custom harness commands, 15 files)
- `opencode.json` may also define commands via JSON config (none found in current config)

**Approaches considered:**

| Approach | Tool/Library | Pros | Cons | Status |
|----------|-------------|------|------|--------|
| Structured YAML parsing | gray-matter | Robust, handles nested objects | Fails on malformed YAML | Used with fallback |
| Regex fallback | native | Recovers from malformed frontmatter | Only handles simple KV pairs | Fallback for edge cases |

**Chosen approach:** Primary parsing with gray-matter, regex fallback for malformed YAML.

## How to Run

```bash
node .planning/spikes/001-command-catalog-discovery/discover-commands.js
```

## What to Expect

- Scans 96 markdown command files across both directories
- Produces `catalog.json` with structured metadata for each command
- Prints field coverage statistics and source distribution

## Investigation Trail

1. **Initial run:** 2 parse errors out of 96 files (97.9% success rate)
   - `gsd-debug.md`: `argument-hint: [list | status <slug> ...]` — square brackets interpreted as YAML inline array, causing parse failure
   - `hf-prompt-enhance-to-plan.md`: Unclosed quoted string in description spanning multiple lines
2. **Added regex fallback:** Extracts simple `key: value` pairs from malformed frontmatter using regex
3. **Re-run:** 100% recovery rate (96/96 files parsed), 0 errors
4. **Source classification bug:** Initially all 96 classified as `builtin` because `.opencode/commands` didn't have trailing slash in `includes()` check
5. **Fixed:** Changed to `root.replace(/\/$/, '').endsWith('commands')` → correct split: 81 builtin, 15 custom

## Results

**Verdict: VALIDATED ✓**

- **Discovery is feasible:** All command definitions are extractable from existing markdown files
- **Catalog coverage:** 96 commands total (81 builtin GSD commands + 15 custom harness commands)
- **Field completeness:**
  - 100% have descriptions (the primary signal for NL routing)
  - 16% have agents specified
  - 6% have explicit trigger phrases embedded in descriptions
  - 81% have `<objective>` blocks (rich semantic content)
  - 80% have `<process>` blocks (execution semantics)
- **Resilience required:** Real command files contain malformed YAML (2/96). A production routing layer needs robust parsing with fallback.
- **No JSON config commands:** Current `opencode.json` has no `command` section, but the citation evidence shows this is a supported mechanism.

**Surprises:**
- Only 6 commands have explicit trigger phrases — most routing would need to infer intent from descriptions and objective/process content, not explicit triggers.
- The custom commands (`harness-audit`, `hf-*`) have richer trigger phrases than the GSD built-ins.
- `hf-prompt-enhance-to-plan.md` has a massive amount of pasted documentation after the frontmatter, making it an outlier in size (~8KB vs typical ~1-2KB).

**Impact on Spike 002:**
- Routing cannot rely solely on explicit trigger phrases (only 6/96)
- Must use description + objective/process content for matching
- Keyword-based matching is viable; LLM-based semantic matching would be stronger
