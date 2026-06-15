# Stack Skill Stub

```markdown
---
name: stack-<framework>
description: >
  <Framework> reference for <project-context>. Loads when working with
  <framework-specific keywords: "component A", "API B", "common pattern C">.
  This is a project-specific reference pack, not a shipped primitive.
version: 0.1.0
---

# <Framework> Reference

## When to Use
[Triggers — when does this skill load?]

## Quick Reference
[Most common commands, syntax — load this section always]

## Common Gotchas
[Framework-specific quirks — load when user hits an error]

## API Reference
[Loaded on demand from references/]

## See Also
[Related skills, commands, agents]
```

## Sections to Include

- [ ] **When to Use** — 1-2 sentences, WHEN to load
- [ ] **Quick Reference** — most common commands (always loaded)
- [ ] **Common Gotchas** — 3-5 known pitfalls
- [ ] **API Reference** — loadable from `references/`
- [ ] **Examples** — loadable from `examples/`

## Sections to Avoid

- [ ] Long tutorials (Claude already knows)
- [ ] Standard library docs (Claude already knows)
- [ ] Multiple framework comparisons (pick ONE)

## Storage

Save as `<project>/.opencode/get-shit-done/stack-<framework>/SKILL.md`
(NOT in `assets/skills/` — stack-* is dev-tooling, not shipped).
