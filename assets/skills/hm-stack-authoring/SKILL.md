---
name: hm-stack-authoring
description: >
  Help users author their own stack-* skills AFTER they install Hivemind
  and complete their project overview + tech-stack decision. Use when the
  user wants to create a project-specific reference pack (e.g.,
  stack-myframework), optimize skill loading for their stack, or
  understand the stack-* namespace. Pattern 1 Mindset — high freedom.
  Tech-agnostic + stack-agnostic (this skill is about authoring
  stack-specific skills, but the skill itself is stack-agnostic). NOT
  for built-in platform references (load `hm-platform-references`), NOT
  for shipped primitives (those are in `assets/skills/hm-*`).
metadata:
  consumed-by:
    - "hf-meta-builder"
  lineage-scope: "hm-*"
  access: "FLEXIBLE"
  role: "meta-builder"
  pattern: "P1-Mindset"
  realm: "doc,arch,clean-code"
version: "1.0.0"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Stack Authoring

Helps users author their own `stack-*` reference packs AFTER they have:
1. Installed Hivemind
2. Completed project overview (what is this project)
3. Made a tech-stack decision (which languages/frameworks/libraries)

The shipped `stack-*` skills (bun-pty, nextjs, vitest, etc.) are
**dev-tooling only** and live in `.opencode/get-shit-done/stack-*/` or
similar. They are NOT shipped to end users.

After a user picks their stack, they can author project-specific
`stack-<framework>` reference packs to:
- Quick-start common commands for the framework
- Document framework-specific gotchas
- Reference API surfaces relevant to their codebase
- Avoid re-discovering the same info per-session

## The Stack Authoring Workflow

### Step 1: Identify the stack

What's the user's stack? Examples:
- Backend: Node.js + Express, Python + Django, Go + Gin
- Frontend: React, Vue, Svelte, SolidJS
- Data: PostgreSQL, MongoDB, SQLite
- Build: Vite, esbuild, Webpack
- Test: Vitest, Jest, Pytest

### Step 2: Decide what to include

For each component, decide:
- Is the component used often? (If yes, document.)
- Does the component have gotchas? (If yes, document.)
- Is the API surface non-obvious? (If yes, document.)

Skip:
- Standard library / well-documented public API
- Components the user already knows cold
- Components used in <10% of the project

### Step 3: Author the stack-* skill

Use the `skill-creator` / `skill-development` skill to create
`<stack-name>/SKILL.md`. The skill should follow the standard
progressive-disclosure pattern:
- SKILL.md (lean, <500 lines, routing-focused)
- references/ (detailed docs, loaded on demand)
- templates/ (if applicable)
- scripts/ (if applicable)

### Step 4: Validate

- `validate-name.sh` exits 0
- The `stack-` prefix is used (not `hm-` — this is dev-tooling, not
  shipped)
- The description triggers on the user's stack keywords
- References load only when the agent is in a project with that stack

## SKILL.md Template for stack-*

```yaml
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
[Most common commands, syntax]

## Common Gotchas
[Framework-specific quirks]

## API Reference
[Loaded on demand from references/]

## See Also
[Related skills, commands, agents]
```

## Anti-Patterns

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| Authoring stack-* before project overview | Stack decisions are not yet locked | Wait for project overview + stack decision |
| Including standard library docs | Claude already knows | Skip well-documented APIs |
| Making stack-* shipped (under `hm-` prefix) | This is dev-tooling, not shipped | Use `stack-` prefix, archive, not deploy |
| Bloat the SKILL.md | Claude context is finite | Lean SKILL.md, move details to references/ |
| One stack-* per framework instead of per project | Different projects use different stacks | Name with project context: `stack-myproject-myframework` |

## Cross-References

| Skill | Boundary |
|---|---|
| `skill-creator` / `skill-development` | Use these to author the stack-* SKILL.md |
| `hm-platform-references` | Built-in platform references (NOT stack-*) |
| `hf-meta-builder` | Meta-builder for OpenCode primitives, including stack-* |

## Additional Resources

### Reference Files
- **`references/authoring-checklist.md`** — pre-flight for new stack-*
- **`references/trigger-keywords.md`** — how to write description that fires on user's stack

### Templates
- **`templates/stack-skill-stub.md`** — blank SKILL.md template

### Workflows
- **`workflows/authoring-flow.md`** — full authoring sequence

### Evaluation
- **`evals/evals.json`** — 5 stack-authoring cases
- **`metrics/gate-scorecard.md`** — gate-evidence-truth scorecard
