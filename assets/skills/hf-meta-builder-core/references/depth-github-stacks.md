# Depth Reference: GitHub Stacks

> **Loading trigger:** Read when composing skills from GitHub repos into stacks.
> **Do NOT load** for simple routing tasks.

---

## What It Does

This reference documents how to compose 2-3 skills sourced from GitHub repositories into a working, coherent skill stack. Unlike single-skill creation, stacking requires analyzing cross-dependencies, resolving trigger conflicts, establishing loading order, and validating that the combined stack produces correct behavior. A poorly stacked composition causes context bloat (duplicate knowledge), trigger conflicts (which skill fires first?), and broken tool chains (one skill assumes a tool the other has forbidden).

Stacking is the meta-builder's most complex operation — it is where the system transitions from "collection of skills" to "coherent agent personality."

---

## WHY It Matters for Meta-Builder

Independent skill development produces isolated islands of knowledge. A `harness-audit` skill knows about TypeScript patterns but has never heard of `hm-synthesis`. A `hm-detective` skill knows how to scan repositories but lacks the audit patterns to evaluate what it finds. Stacking bridges these islands.

**The risk:** Stacking without analysis produces Frankenstein skills that:
- Have contradictory instructions (Skill A says "always ask before writing", Skill B says "write immediately")
- Trigger on the same phrases but produce different outputs
- Assume different directory structures or tool availability
- Duplicate knowledge (both skills explain "what is a Promise"), wasting context

**The reward:** A well-analyzed stack produces emergent capabilities neither skill has alone. `hm-detective` + `harness-audit` = automated security review with repo scanning.

---

## WHEN to Use

| Trigger | Stack Size | Analysis Depth |
|---------|-----------|----------------|
| User says "combine these skills" or "stack X and Y" | 2-3 skills | Full cross-dependency analysis |
| User says "make a meta-skill from X, Y, Z" | 2-4 skills | Full analysis + loading order optimization |
| Skill references another in its body (e.g., "use hm-synthesis for packing") | 2 skills | Verify the reference is resolvable and non-conflicting |
| Post-creation review of an existing stack | N skills | Regression check: no trigger drift since last analysis |

---

## Inline Examples

### Loading Order Validation

**Rule:** The skill with broader scope loads first; the skill with narrower scope loads second (progressive narrowing).

**Example:**
```
Stack: meta-builder + harness-audit + custom-tools-dev

Loading order:
1. meta-builder (broadest: routes to any skill)
2. harness-audit (narrower: only TypeScript/code quality)
3. custom-tools-dev (narrowest: only tool creation)

Rationale: meta-builder must see the full routing table before
harness-audit can audit it. custom-tools-dev needs harness-audit's
findings to know which tools to create.
```

**Anti-pattern:** Loading `custom-tools-dev` first — it tries to create tools before knowing what the audit found.

### Cross-Dependency Checks

**Check 1: Tool compatibility**
```bash
# Extract allowed-tools from each skill's frontmatter
grep "allowed-tools" skill-a/SKILL.md skill-b/SKILL.md skill-c/SKILL.md

# Verify union is coherent (no forbidden tool in one skill is required in another)
```

**Check 2: Trigger overlap**
```bash
# Extract trigger phrases from description fields
grep -oP '(?<=description: ).*' skill-*/SKILL.md

# Flag exact phrase matches — these will cause routing ambiguity
```

**Check 3: Reference file conflicts**
```bash
# Check if two skills reference files with the same name but different content
comm -12 <(ls skill-a/references/) <(ls skill-b/references/)
```

### Composition Rules

**Rule 1: One primary skill per task type.**
If both `harness-audit` and `custom-tools-dev` claim to handle "code review", designate one as primary and the other as fallback.

**Rule 2: Shared references must be identical or versioned.**
If two skills both ship a `references/typescript-patterns.md`, either:
- Ensure they are byte-identical, OR
- Rename to `references/typescript-patterns-v2.md` in one skill and update its internal references

**Rule 3: Tool chains must be acyclic.**
If Skill A calls Skill B as a tool, and Skill B calls Skill C, then Skill C must NOT call Skill A. Cycles cause infinite delegation loops.

**Rule 4: Context budget sum must stay under ceiling.**
Sum the typical context usage of each skill in the stack. If the total exceeds 80% of the model's context window, the stack will truncate mid-execution. Solutions: compress references, split into sequential phases, or use a larger context model.

---

## Permission Recommendations

| Role | Required Tools | Notes |
|------|----------------|-------|
| **Stack analyzer** (reads skills, reports conflicts) | Read, Glob, Grep, Bash | Read-only — never modifies source skills |
| **Stack composer** (creates merged skill) | Read, Write, Edit, Bash, Glob, Grep | Creates NEW skill directory; leaves originals untouched |
| **Stack validator** (tests merged skill) | Read, Bash, skill | Runs validation scripts; may invoke stack via `skill` |

**Important:** The stack composer NEVER edits the original skills. It creates a new merged skill in a separate directory (e.g., `.opencode/skills/stacked-harness-audit-dev/`). This preserves the originals for independent use and enables A/B testing.

---

## Common Anti-Patterns

| Anti-Pattern | Symptom | Fix |
|-------------|---------|-----|
| **Trigger collision** | Both skills fire on same phrase; output is nondeterministic | Disambiguate triggers or designate primary/secondary |
| **Context bloat** | Combined references exceed context window; truncation mid-task | Compress references, use `--compress` in repomix, or split into phases |
| **Tool starvation** | Skill A assumes `Edit` tool; Skill B's frontmatter forbids it | Union the allowed-tools lists in the merged skill |
| **Circular references** | Skill A references Skill B; B references A; C references both | Break cycles by duplicating (not referencing) the needed content |
| **Orphaned references** | Merged skill references a file that exists only in one source skill | Copy the referenced file into the merged skill's references/ |
