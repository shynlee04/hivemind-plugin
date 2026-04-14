# Task Envelope: TASK-W1-C3+C4
## Task
Fix 2 broken references in oh-my-openagent-reference skill: (C3) generate missing tech-stack.md and (C4) regenerate project-structure.md with actual directory tree.

## Scope
- **Include:**
  - `.opencode/skills/oh-my-openagent-reference/references/tech-stack.md` (create if missing)
  - `.opencode/skills/oh-my-openagent-reference/references/project-structure.md` (regenerate)
- **Do NOT touch:** Any other files in oh-my-openagent-reference or any other skill

## Context
The oh-my-openagent-reference skill is a packed reference repo for the OMO architecture. Two reference files are broken:

1. **tech-stack.md** — Missing entirely. Should describe the tech stack of oh-my-openagent (Node.js/TypeScript, plugin system, hooks architecture, circuit breakers, session continuity patterns).

2. **project-structure.md** — Currently only 4 lines (mostly empty). Should contain the actual directory tree of the oh-my-openagent repo with descriptions of each directory/file.

Use `repomix_pack_remote_repository` or `gitmcp` to fetch the OMO repo structure and generate accurate content.

## Expected Output
- `tech-stack.md` with 100+ lines describing OMO tech stack
- `project-structure.md` with accurate directory tree (use `find .` or equivalent to get real structure)

## Verification
Run: `wc -l .opencode/skills/oh-my-openagent-reference/references/tech-stack.md .opencode/skills/oh-my-openagent-reference/references/project-structure.md`
tech-stack.md must be 50+ lines, project-structure.md must be 50+ lines.