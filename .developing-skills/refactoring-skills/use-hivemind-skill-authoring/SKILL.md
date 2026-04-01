---
name: use-hivemind-skill-authoring
description: Skill creation, review, and auditing — naming conventions, universal design, conflict detection, and quality assurance for HiveMind skills.
---

## Parameters

| Parameter | Meaning |
|-----------|---------|
| `{runtime_state_dir}` | Runtime state directory (e.g., `.hivemind/`) |
| `{runtime_activity_dir}` | Activity subdirectory (e.g., `.hivemind/activity/`) |
| `{pathing_config}` | Pathing config file (e.g., `.hivemind/pathing/active-paths.json`) |
| `{validation_script}` | Artifact validation script path |

# use-hivemind-skill-authoring

## Load Position

Layer: Domain. Requires `use-hivemind` (entry router) loaded first.

Whether building a skill, reviewing one, or checking whether two skills conflict — start here.

## Table of Contents

- [Load Position](#load-position)
- [When to Load](#when-to-load)
- [Skill Anatomy](#skill-anatomy)
- [Naming Convention](#naming-convention)
- [Creation Template](#creation-template)
- [Universal Design](#universal-design)
- [Conflict Detection](#conflict-detection)
- [Review Checklist](#review-checklist)
- [Platform Abstraction Matrix](#platform-abstraction-matrix)
- [Anti-Patterns](#anti-patterns)
- [Handoff Paths](#handoff-paths)
- [Bundled Resources](#bundled-resources)

## When to Load

| Situation | Route |
|-----------|-------|
| Creating a new skill | → Skill Anatomy → Creation Template |
| Reviewing an existing skill | → Review Checklist (9-phase audit) |
| Checking if skills conflict | → Conflict Detection |
| Validating cross-platform design | → Universal Design |
| Diagnosing a broken skill | → Review Checklist + Conflict Detection |
| Renaming or restructuring skills | → Naming Convention |

---

## Skill Anatomy

Every HiveMind skill is a single `SKILL.md` file. Here's what goes where:

```
YAML frontmatter        ← name, description, parent
Load Position           ← which slot, what dependency
Purpose                 ← one paragraph: what this skill does
Sections                ← domain-specific content
Templates               ← copy-paste starting points
Anti-patterns           ← what NOT to do (humanized)
Independence rules      ← what this skill owns, what it doesn't
```

**Keep it under 400 lines.** If pushing 450, two skills are likely being combined. Split them.

---

## Naming Convention

All HiveMind skills follow a strict naming pattern:

| Prefix | Meaning | Example |
|--------|---------|---------|
| `hivemind-*` | Depth specialist — one narrow concern | `hivemind-atomic-commit` |
| `use-hivemind-*` | Domain router — multiple concerns, one domain | `use-hivemind-skill-authoring` |
| `use-hivemind` | Entry point — framework bootstrap only | `use-hivemind` |

**Rules:**
- Never use plain English names (`create-skill`, `review-code`) — they belong in general-purpose toolkits, not HiveMind
- Domain routers always start with `use-hivemind-`
- Depth specialists always start with `hivemind-`
- One skill, one name. No aliases, no abbreviations

---

## Creation Template

```markdown
---
name: your-skill-name
description: One sentence. Active voice. What this skill does for the user.
---

# your-skill-name

## Load Position
Layer: [domain|depth]. Requires [dependency] loaded first.

## When You Need This
[Table or list of trigger situations]

## [Core Content]
[Your domain-specific sections here]

## Anti-Patterns
[What NOT to do — be human, be direct]

## Handoff Paths
[Where outputs go, what files are touched]
```

### Bundled Resources

If your skill ships with reference files, templates, or scripts:

```
your-skill-name/
├── SKILL.md
├── templates/
│   └── starter-template.md
└── references/
    └── api-patterns.md
```

Reference them in your SKILL.md: `See templates/starter-template.md`.

---

## Universal Design

Skills should work everywhere — not just in one project, one language, or one team. Five principles:

1. **Terminology abstraction** — Use domain-neutral terms. Say "source file" not "TypeScript file". Say "build step" not "npm run build".

2. **Capability contract** — Declare what the skill needs (file access, network, shell) in frontmatter. Don't assume capabilities exist.

3. **Framework-agnostic workflow** — The steps should make sense whether someone's using React, Vue, Python, or Rust. Language-specific details go in examples, not in core instructions.

4. **Portable evidence format** — Verification output should be parseable. Use structured formats (JSON, tables) not prose paragraphs for evidence.

5. **Progressive enhancement** — Core functionality works with basic tools. Advanced features (MCP servers, plugins) are optional layers.

---

## Conflict Detection

Skills conflict more often than expected. Five types to watch for:

| Type | What It Looks Like | How to Detect |
|------|-------------------|---------------|
| **Scope overlap** | Two skills both claim to handle "creating tools" | Grep for similar trigger phrases across skills |
| **Contradictory instructions** | One says "always use Zod", another says "use raw types" | Read the "When to Load" sections side by side |
| **Shared state mutation** | Both write to the same file or config | Check file paths in Handoff Paths sections |
| **Boundary violation** | A depth specialist (`hivemind-*`) trying to route | Check if the skill has routing logic (it shouldn't) |
| **Dependency cycle** | Skill A requires B, B requires A | Trace the `Requires` chains in Load Position |

**Detection method:** Load both skills, read their frontmatter and Load Position. If trigger phrases overlap more than 70%, a scope problem exists. If file paths overlap, a state problem exists.

---

## Review Checklist

The 9-phase audit. Run this on any skill before shipping:

| Phase | What to Check | Pass Criteria |
|-------|---------------|---------------|
| 1. Frontmatter | name, description, parent present | All required fields filled |
| 2. Load Position | Layer and prerequisites declared | No circular deps |
| 3. Trigger clarity | "When to Load" is specific | No ambiguity about when to load |
| 4. Content depth | Core sections are substantive | No placeholder text |
| 5. Anti-patterns | What NOT to do is explicit | At least 3 entries |
| 6. Naming | Follows `hivemind-*` or `use-hivemind-*` | Matches naming convention |
| 7. Line count | Under 450 lines | Count file length (e.g., `wc -l SKILL.md`) < 450 |
| 8. Independence | No cross-skill state mutation | Handoff Paths are clean |
| 9. Universal design | Works across frameworks | Terminology is abstract |

---

## Platform Abstraction Matrix

| Concern | Generic Term | Avoid |
|---------|-------------|-------|
| Package manager | "your package manager" | npm, yarn, pnpm |
| Test runner | "your test framework" | Jest, Vitest, Mocha |
| Language | "your language" | TypeScript, Python |
| Framework | "your framework" | React, Vue, Express |
| Config format | "config file" | opencode.json, .env |

Use platform-specific terms only in examples, prefixed with "For example, in TypeScript..."

---

## Anti-Patterns

Let's be real — here's how skill authoring goes wrong:

1. **The Novel** — 800-line skills that try to do everything. If a skill is longer than this file, split it. Seriously.

2. **The Ghost Skill** — Exists in the directory but has no clear trigger. If nobody knows when to load it, it's dead weight.

3. **The Identity Crisis** — A depth specialist (`hivemind-*`) that has routing logic. Pick a lane: specialize or route.

4. **The Assumer** — Assumes the user has specific tools installed. Always declare requirements in frontmatter.

5. **The Copy-Paste Factory** — Duplicates content from other skills. Reference them instead.

6. **The Platform Loyalist** — Hardcodes "npm run test" as if that's universal. Use abstractions.

7. **The Silent Conflict** — Two skills handle the same trigger but give different advice. Detect and resolve.

8. **The Orphan** — Created, never reviewed, never updated. Skills need maintenance like code does.

---

## Handoff Paths

| Artifact | Location |
|----------|----------|
| Skill under creation | `.developing-skills/` |
| Refactored skills | `.developing-skills/refactored-skills/` |
| Skill review evidence | `{runtime_activity_dir}/codescan/` |
| Conflict reports | `{runtime_activity_dir}/delegation/` |

---

## OpenCode Tool Matrix

| Authoring Task | Preferred Tool | Why |
| --- | --- | --- |
| inspect the current skill | `read` | precise content review |
| locate duplicate triggers or headings | `grep` | cross-skill audit |
| find peer skills | `glob` | discovery by pattern |
| verify current SDK tool names | `context7_query-docs` or local tool catalog | avoid stale API guidance |

## Tool Examples

```bash
# Search for headings (e.g., grep -n "^## " <skill-file>)
# Check structural changes (e.g., git diff --stat -- <directory>)
# Run type checking (e.g., npx tsc --noEmit for TypeScript)
```

## Skill Audit Decision Tree

1. **IF** the description lacks concrete trigger phrases, **THEN** fail the audit.
2. **IF** the skill references missing files, **THEN** fail the audit before content review.
3. **IF** the skill duplicates another authority surface, **THEN** split or merge responsibilities.
4. **IF** the skill grows too large, **THEN** move detail into references or templates before approval.

## Audit Template Usage

Use `references/audit-checklist.md` for manual review criteria and `templates/skill-audit.json` for structured pass/fail output.

## Sibling Skills

| Skill | Relationship |
|-------|-------------|
| `use-hivemind` | Entry router — parent of this domain skill |
| `hivemind-patterns` | Architecture pattern reference — loaded when skill authoring involves structural decisions |

## Bundled Resources

| File | Purpose |
|------|---------|
| `references/01-skill-anatomy.md` | Skill structure reference |
| `references/02-frontmatter-standard.md` | Frontmatter field specification |
| `references/03-three-patterns.md` | Skill architecture patterns |
| `references/04-tdd-workflow.md` | TDD workflow for skill development |
| `references/05-skill-quality-matrix.md` | Quality scoring matrix |
| `references/07-iterative-refinement.md` | Iterative improvement process |
| `references/08-conflict-detection.md` | Conflict detection methodology |
| `references/sw-04-tdd-workflow.md` | Supplementary TDD workflow |

## Activity Output

All artifacts produced by this skill follow the Activity Folder Protocol.

**Pathing:** See `{pathing_config}` for resolved output paths.
**Naming:** `{category}-{semantic-id}-{YYYY-MM-DD}.{ext}`
**Meta:** All JSON includes `_meta.created_at`, `_meta.updated_at`, `_meta.producer`.
**Validation:** Run `{validation_script} {path}` to confirm compliance.
