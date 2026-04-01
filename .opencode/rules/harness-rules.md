# Harness Behavioral Rules

Loaded into every agent via `opencode.json` instructions. Non-negotiable constraints for all agents in this harness.

---

## 1. Planning Discipline

- **Complex task (>3 steps)**: create `task_plan.md` in the project root before starting any implementation.
- **Discover something**: append to `findings.md` in the project root immediately.
- **End of every session**: update `progress.md` in the project root with what was done, what's next, and any blockers.
- **Before major decisions**: re-read project-root `task_plan.md` to stay aligned with intent.
- **Plan format**: numbered steps with clear done/not-done status per step.
- **Experiment note**: if `.opencode/planning/*` exists in this repo, treat it as harness-development documentation for the experiment itself, not as the runtime planning location for user work.

---

## 2. Delegation Protocol

- **Orchestrator never implements**. Delegate all execution to specialist subagents.
- **Every delegation includes**:
  - **SCOPE**: exactly what to implement or investigate.
  - **CONSTRAINTS**: what NOT to touch or change.
  - **REFERENCES**: file paths or symbols the specialist needs.
- **Specialists return**: summary of changes, files modified, and any issues found.
- **Orchestrator coordinates**: merge specialist results, resolve conflicts, update plan.

---

## 3. Code Quality Standards

- **Read before write.** Always read the target file and surrounding context before making changes.
- **Atomic changes.** One logical change per edit. Do not bundle refactors with feature work.
- **Match existing patterns.** Inspect neighboring files for naming, imports, and style conventions. Follow them.
- **Error handling is mandatory.** Never omit try/catch. Never catch and swallow errors silently. Always surface meaningful messages.
- **No dead code.** Do not leave commented-out blocks, unused imports, or placeholder TODOs without a tracking issue.
- **No comments unless explicitly requested.**

---

## 4. Verification Requirements

- **Before marking any task complete**: review every changed file. Read the diff.
- **Run project test commands** when available. Check `package.json` scripts, `Makefile`, or `AGENTS.md` for test/lint/typecheck commands.
- **After changes**: run `git diff` and `git status` to confirm only intended files were modified.
- **If tests fail**: fix before proceeding. Do not mark sub-tasks done with failing tests.

---

## 5. Context Management

- **Important findings go to files**, not conversation. Write to project-root `findings.md` or `progress.md`.
- **Offload working memory.** If a session involves >5 files, write synthesis notes to a file rather than holding context.
- **Use the skill tool** to load reference knowledge when facing unfamiliar patterns or frameworks.

---

## 6. Shell Safety

This environment is non-interactive. All commands must complete without human input.

- **Always use non-interactive flags**: `-y`, `--yes`, `--no-input`, `--non-interactive`, `-q` as appropriate.
- **Never launch editors**: no `vim`, `nano`, `emacs`, `vi`.
- **Never launch pagers**: no `less`, `more`. Pipe to files instead.
- **Always provide `-m "message"`** for git commits. Never rely on an editor opening.
- **Use timeouts** for commands that may hang: `timeout 60 <cmd>` or set tool-level timeouts.
- **Never use `cd &&`**. Use the `workdir` parameter to set working directory.
