# Depth Reference: Built-in Tools

> **Loading trigger:** Read when needing specific built-in tool usage patterns for meta-builder work.
> **Do NOT load** for simple routing tasks.

---

## What It Does

This reference documents OpenCode built-in tools as they apply to meta-builder workflows — skill creation, agent composition, command design, and audit. Unlike general tool documentation, this focuses on tool selection discipline: which tool to use when, why the wrong tool costs context, and how to combine tools for complex meta-concept operations.

The meta-builder operates in a high-stakes environment where every tool call consumes context budget. A `Read` on a 2,000-line file when `Grep` would suffice is a 5% context tax. A `patch` that fails three times is a 15% tax plus user friction. This reference provides decision trees for avoiding such waste.

---

## WHY It Matters for Meta-Builder

Meta-builder tasks are context-intensive by nature:
- Creating a skill requires reading existing skills, researching patterns, writing frontmatter, composing body text, and validating
- Auditing a skill requires cross-referencing multiple files, checking links, and verifying behavior claims
- Composing a stack requires understanding 3+ skills simultaneously, each with its own references

**Tool selection is the primary lever for staying within context budget.** The difference between a meta-builder that completes in 3 tool calls versus 12 is entirely tool discipline.

---

## WHEN to Use Each Tool

| Meta-Builder Task | Primary Tool | Secondary Tool | Anti-Pattern |
|-------------------|--------------|----------------|--------------|
| Find all skills matching a pattern | `Grep` | `Glob` | Reading each SKILL.md individually |
| Verify a reference file exists | `Glob` | — | `Read` the SKILL.md just to check its references list |
| Apply a fix across 5 files | `patch` (batch) | — | 5 separate `Edit` calls |
| Research a new pattern domain | `websearch` | `webfetch` | `Read`ing random URLs hoping for insight |
| Track multi-step skill creation | `todowrite` | — | Keeping state in prose conversation |
| Gate destructive operations | `question` | — | Proceeding without user confirmation |
| Load a related skill for cross-check | `skill` | — | `Read`ing the SKILL.md manually |
| Find type definitions in harness code | `lsp` | `Grep` | `Read`ing entire TypeScript files |

---

## Inline Examples

### `question` — Gating Destructive Operations

**When:** Before deleting a skill, renaming an agent, or changing a command's argument signature.

**Example:**
```
The plan requires deleting the retired `skill-synthesis` directory and moving
it to active/. This will break any open references. Proceed?

Options:
1. Yes — delete retired/ and move to active/
2. No — keep retired/ and copy instead
3. Review first — show what references exist
```

**Why it matters:** Meta-builder operations affect the entire skill graph. A deleted skill that still has routing table entries creates phantom references that waste agent context on every subsequent invocation.

### `todowrite` — Tracking Multi-Step Skill Creation

**When:** Any skill creation plan with >3 tasks, especially when tasks span files (SKILL.md + references/ + scripts/ + evals/).

**Example workflow:**
```yaml
todos:
  - id: scaffold
    content: "Write SKILL.md frontmatter + body skeleton"
    status: in_progress
  - id: references
    content: "Create 2 reference files with real content"
    status: pending
  - id: scripts
    content: "Write validation script + trigger eval"
    status: pending
  - id: validate
    content: "Run skill-judge scoring + fix gaps"
    status: pending
```

**Why it matters:** Without `todowrite`, the agent loses track of which sub-files have been written and which are still stubs. The user sees a "complete" skill that is actually 60% placeholder text.

### `patch` — Applying Audit Fixes Safely

**When:** A code review or skill-judge report identifies 5+ similar issues across files (e.g., "all reference files missing loading triggers").

**Example:**
```patch
--- a/references/depth-built-in-tools.md
+++ b/references/depth-built-in-tools.md
@@ -1,5 +1,7 @@
 # Depth Reference: Built-in Tools

+> **Loading trigger:** Read when needing specific built-in tool usage patterns for meta-builder work.
+
 ## What It Does
```

**Why it matters:** `patch` is atomic — if the patch fails, nothing is partially modified. Five separate `Edit` calls risk leaving the file in an inconsistent state if call 3 fails due to context truncation.

### `Grep` + `Glob` — Finding Before Reading

**When:** You need to know "does this pattern exist?" not "what is the exact content?"

**Example:** Before adding a new skill, verify no name collision:
```bash
grep -r "name: my-new-skill" .opencode/skills/
```

**Why it matters:** A `Glob` + `Grep` pair costs ~200 tokens. Reading 20 SKILL.md files to manually check names costs ~15,000 tokens. For simple existence checks, the ratio is 75:1.

### `skill` — Progressive Disclosure Mechanism

**When:** The meta-builder needs to delegate to a specialist skill (e.g., `skill-judge` for scoring, `skill-creator` for creation patterns).

**Example:**
```
Skill("skill-judge", args="evaluate .opencode/skills/my-new-skill/")
```

**Why it matters:** Loading a skill via `skill` injects its full knowledge into context. This is superior to `Read`ing the SKILL.md because the skill's reference files are also loaded, and the model's behavior is shaped by the skill's decision trees.

### `webfetch` + `websearch` — External Knowledge Retrieval

**When:** Researching a new pattern domain (e.g., "how do other AI coding assistants handle tool calling?") or verifying a specification (e.g., agentskills.io format).

**Example:**
```
# Step 1: Search for authoritative source
websearch: "agentskills.io skill specification format"

# Step 2: Fetch the spec
webfetch: "https://agentskills.io/spec/v1"
```

**Why it matters:** Meta-builder must not reinvent patterns that already have community consensus. Researching first prevents "not invented here" syndrome and ensures skills are compatible with ecosystem standards.

---

## Permission Recommendations

| Meta-Concept Type | Required Tools | Optional Tools | Forbidden Tools |
|-------------------|----------------|----------------|---------------|
| **Skill creation** | Read, Write, Edit, Bash, Glob, Grep | patch, websearch, webfetch, skill | — |
| **Agent creation** | Read, Write, Edit, Bash, Glob, Grep | lsp, websearch | — |
| **Command creation** | Read, Write, Edit, Bash | Glob, Grep | webfetch (avoid external deps) |
| **Audit/validate** | Read, Bash, Glob, Grep | skill, websearch | Write, Edit (read-only audit) |
| **Stack composition** | Read, skill, Glob, Grep | websearch | Write, Edit (analysis only) |

**Rule of thumb:** If the task involves creating or modifying files, `Write` and `Edit` are required. If the task involves analysis only, prefer `Read` + `Grep` + `Glob` and avoid `Write`/`Edit` to prevent accidental modifications during audit.

---

## Context Budget Guidelines

| Operation | Budget | Tool |
|-----------|--------|------|
| Check if a file exists | ~50 tokens | `Glob` |
| Find a string in 10 files | ~100 tokens | `Grep` |
| Read a 200-line reference | ~1,000 tokens | `Read` |
| Read a 2,000-line SKILL.md | ~10,000 tokens | `Read` |
| Apply patch to 3 files | ~500 tokens | `patch` |
| Load a skill + references | ~5,000 tokens | `skill` |

**Golden rule:** Always `Grep` before `Read`. Always `Glob` before assuming a file doesn't exist. The cost of a false-negative (thinking a file doesn't exist when it does) is a full rewrite. The cost of `Glob` is 50 tokens.
