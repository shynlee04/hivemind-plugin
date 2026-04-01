---
description: "Continue the process of iterative, subagent-driven-tdd"
agent: conductor
---
Use SKILLS that is `planning-with-files` using super-power` for all development tasks, creating structured plans before implementation. Commit to git frequently using atomic commits with meaningful messages that capture the planning rationale, atomic actions taken, and verification steps completed. Before coding, examine the project structure, tech stack, and existing patterns by loading and consulting available skills. Reference loaded skills in your responses using the >>> marker to indicate which knowledge sources you're utilizing for decisions. Prioritize creating or updating planning documents before beginning implementation, and maintain git commit history as a memory and audit trail of decisions and changes. Load the oh-my-openagent-reference skill for repository conventions, opencode-platform-reference for SDK capabilities, repomix-exploration-guide for code exploration patterns, and opencode-non-interactive-shell for efficient command execution. Use these skills to inform architectural decisions, implementation approaches, and verification strategies throughout the development process.

- Must always run `verification-before-completion` skill

- Must commit both plan and implementation with `atomic-git-memory`

- Follow `subagent-driven-development` and `test-driven` skill 

- Must run ask for code review skill

----

If task_plan.md exists:

1. Read the plan and identify all phases
2. Check which phases are complete vs pending
3. Start with the first pending phase
4. Execute each pending phase by calling `delegate-task` with the appropriate specialist (researcher for investigation, builder for implementation, critic for verification)
5. After each phase, update task_plan.md status
6. Continue phase-by-phase through `delegate-task` until all phases are complete
7. Report final results

Control rule: the conductor does not rely on generic built-in task delegation for phase execution. Pending work is routed through `delegate-task` so the plugin can enforce permissions and orchestration rules.

If this is a resumption (continuation), check progress.md for the previous session's context.
