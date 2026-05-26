# Skill Anatomy

## Directory Structure

Every skill is a directory containing at minimum a `SKILL.md` file:

```
skill-name/
├── SKILL.md          # Required: metadata + instructions
├── scripts/          # Optional: executable code
├── references/       # Optional: documentation (load on demand)
├── assets/           # Optional: templates, resources
└── ...               # Any additional files or directories
```

## Naming Rules

| Rule | Valid | Invalid |
|------|-------|---------|
| Lowercase only | `deep-research` | `Deep-Research` |
| Hyphens as separators | `use-authoring-skills` | `use_authoring_skills` |
| No leading/trailing hyphens | `skill-name` | `-skill-name`, `skill-name-` |
| No consecutive hyphens | `skill-name` | `skill--name` |
| Max 64 characters | `a` × 64 | 65+ chars |
| Must match directory name | `deep-research/SKILL.md` with `name: deep-research` | Mismatch |

**Regex:** `^[a-z0-9]+(-[a-z0-9]+)*$`

## File Size Guidelines

| File | Max Lines | Purpose |
|------|-----------|---------|
| `SKILL.md` | <400 | Core instructions, decision tree, gates |
| Each reference | 150-300 | Focused topic, one concern |
| Each script | <200 | Single responsibility |
| Total skill | <2000 | Progressive disclosure keeps most unloaded |

## What Goes Where

| Content | Location |
|---------|----------|
| Decision tree, first actions | `SKILL.md` body |
| Frontmatter rules | `references/02-frontmatter-standard.md` |
| Pattern selection (P1/P2/P3) | `references/03-three-patterns.md` |
| TDD methodology | `references/04-tdd-workflow.md` |
| Quality scoring rubric | `references/05-skill-quality-matrix.md` |
| Platform compatibility | `references/06-cross-platform-activation.md` |
| Iteration examples | `references/07-iterative-refinement.md` |
| Conflict detection | `references/08-conflict-detection.md` |
| Script writing guide | `references/09-script-authoring.md` |
| Eval lifecycle | `references/10-eval-lifecycle.md` |
| Description optimization | `references/11-description-optimization.md` |
| Anti-deception patterns | `references/12-anti-deception.md` |

## Progressive Disclosure

Skills load in three tiers:

1. **Tier 1 (always):** `name` + `description` from frontmatter — shown in skill list
2. **Tier 2 (on activation):** Full `SKILL.md` body — loaded when skill is selected
3. **Tier 3 (on demand):** `references/`, `scripts/`, `assets/` — loaded only when referenced

Design for this: put critical routing logic in SKILL.md body. Put deep reference material in separate files.

## Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| SKILL.md > 500 lines | Agent ignores most content | Split into references |
| No decision tree | Agent loads wrong reference | Add "When to Load" section |
| Deeply nested references | Agent can't find files | Keep references 1 level deep |
| Missing `name` field | Skill not discovered | Add required frontmatter |
| `name` doesn't match directory | Skill fails validation | Rename directory or frontmatter |

## Version Policy

Skills do not have a built-in version field. Track versions via:
1. Git commits — each meaningful change is a commit
2. `metadata.version` in frontmatter (optional, string)
3. Changelog in `references/CHANGELOG.md` (optional)

| Change | Bump |
|--------|------|
| New trigger | MINOR |
| Breaking trigger | MAJOR |
| New reference | PATCH |
| Bug fix | PATCH |
