# Task Envelope: TASK-W1-C2
## Task
Write real content for 4 empty depth reference files in meta-builder/references/. These files currently exist as stubs and break agent routing when children try to read them.

## Scope
- **Include:** `.opencode/skills/meta-builder/references/depth-*.md` (4 files)
  - `depth-budget.md`
  - `depth-routing.md`
  - `depth-hierarchy.md`
  - `depth-delegation.md`
- **Do NOT touch:** Any other files in the meta-builder skill

## Context
The meta-builder skill references these 4 depth files in its SKILL.md body. Currently they are empty stubs (4 lines or less). Each file should contain:

- `depth-budget.md` — What "depth" means in the routing context, how budget limits work, when to stop traversing
- `depth-routing.md` — How the router decides which skill to delegate to at each depth level
- `depth-hierarchy.md` — The chain of command from orchestrator → specialist → tool, and what each level can/cannot do
- `depth-delegation.md` — When to delegate vs. execute directly, how to write effective delegation packets

Reference the meta-builder SKILL.md for the context these files serve. Reference the planning-with-files skill for delegation best practices.

Each file should be 50-150 lines of useful content. No placeholder text.

## Expected Output
- 4 populated depth files in meta-builder/references/
- Each file must have at least 50 lines of actual content
- Each file must be self-contained (can be read independently and understood)

## Verification
Run: `wc -l .opencode/skills/meta-builder/references/depth-*.md`
All 4 files must show 50+ lines.