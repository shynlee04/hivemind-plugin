# Stack Authoring Workflow

The 4-step process for authoring a project-specific stack-* skill.

## Step 1: Identify the Stack

What's the user's stack? Examples:
- Backend: Node.js + Express, Python + Django
- Frontend: React, Vue, Svelte
- Data: PostgreSQL, MongoDB
- Build: Vite, esbuild
- Test: Vitest, Jest, Pytest

## Step 2: Decide What to Include

For each component:
- Used often? (>10% of project work) → document
- Has gotchas not in standard docs? → document
- Non-obvious API surface? → document

Skip:
- Standard library / well-documented API
- Components user already knows cold
- Components used in <10% of project

## Step 3: Author the Skill

Use `templates/stack-skill-stub.md` as starting point.

Sections to include:
- When to Use (triggers)
- Quick Reference (always loaded)
- Common Gotchas (loadable on error)
- API Reference (loadable from references/)
- Examples (loadable from examples/)

## Step 4: Validate

```bash
bash assets/skills/hm-stack-authoring/scripts/validate-stack-skill.sh <stack_skill_dir>
```

Exits 0 if valid, warns on issues.

## Storage

Save as `<project>/.opencode/get-shit-done/stack-<framework>/` (NOT in
shipped `assets/skills/` — stack-* is dev-tooling per master plan Q3).

## Anti-Patterns

| Anti-pattern | Fix |
|---|---|
| Author before project overview | Wait for project + stack decision |
| Include standard library | Claude already knows |
| Use `hm-` prefix | Use `stack-` (dev-tooling only) |
| Bloat SKILL.md > 500 lines | Move to references/ |
| One per framework | Per project stack |
