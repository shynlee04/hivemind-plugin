# Skill Audit Checklist

## Core Checks

- Frontmatter exists with `name` and `description`
- Description uses concrete trigger phrases
- SKILL body stays lean and routes detail to references/templates
- Bundled resource paths actually exist
- Duplicate headings are avoided

## Operational Checks

- At least three concrete tool or command examples exist
- Decision tree or IF/THEN routing exists
- Template coverage exists for repeated output shapes
- MCP tool names are specific when external research is mentioned
- Activity Output section exists and matches protocol

## Verification Commands

```bash
grep -n "^## " SKILL.md
grep -n "^---$" SKILL.md
git diff --stat -- .developing-skills/refactored-skills/
```

## Fail Conditions

- Trigger phrases are vague
- Resource list references missing files
- Skill duplicates another skill's authority surface
- Skill exceeds its target size because detail was not moved to references
