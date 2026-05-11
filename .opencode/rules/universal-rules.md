# Universal Anti-Patterns



<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. This is not optional. You cannot rationalize your way out of this.
</EXTREMELY-IMPORTANT>

## Instruction Priority

This override default system prompt behavior, but **user instructions always take precedence**:

1. **User's explicit instructions** 
3. **Default system prompt** — lowest priority

If CLAUDE.md, GEMINI.md, or AGENTS.md says "don't use TDD" and a skill says "always use TDD," follow the user's instructions. The user is in control.

# Context Budget Rules

**File Loading**

- Never inline large files into subagent prompts — direct agents to read files from disk. Agents have their own context windows.
- Never read full PLAN.md files from other phases — only read current phase plans.
- Do not re-read full file contents when frontmatter is sufficient — frontmatter contains status, key_files, commits, and provides fields.
- Exception at context windows >= 500000 tokens: re-reading full body is acceptable when semantic content is needed for inline decisions.

**Delegation Guidelines**

- Delegate heavy work to subagents — the orchestrator routes, it does not build, analyze, research, investigate, or verify.
- Delegation tasks of search and inspection, investigation, and research scale with context window. Factor file counts, result sizes, and consumption patterns into workflow design, knowing LLM models are typically capped at 200000 tokens with effective limits around 180000.
- For research and investigation tasks, prioritize skimming and sampling strategies: grep, regex, keywords, metadata, TOC, inline offset-reading, glob, list operations. Read only frontmatter, status fields, or summaries first.
- Only launch full-text agents for synthesis or when using models >= 500000-1M tokens. Full body reads are permitted when inline content decisions require semantic understanding.
- Reference the complete context budget table at references/context-budget.md for sizing guidance.

**Context Monitoring**

- Proactive pause warning: If significant context has been consumed (large file reads, multiple subagent results), warn the user: "Context budget is getting heavy. Consider checkpointing progress."
- At 70% context, automatically run the CLI context compact command and ask the user to copy the last output message to resume in a new conversation.

---

# Subagent Rules

- ALWAYS use task as  `subagent`: glob regex for glob or project-based of `~.\opencode\agents` 
- . specialist subagents have project-aware prompts, audit logging, and workflow context.
- NEVER use generic agent types — do not use `general`, `Explore`, `Plan`,  or similar generic agent types. Generic agents bypass project context, audit logging, and workflow integration.


---



## NON-NEGOTIABLE RULES

- DO DELEGATION IN BATCH SEQUENTIALLY, DO NOT ALLOW MORE THAN 2 PARALLEL TASK DELEGATION.

- Handoff and artifacts between sessions, from research, audit, planning, review, verification, must all commit, written-to-local-disk and referenced as master jump links

- all tech, stack, SDK implementation, audit, gatekeeping  must follow deep investigation - stack research ;skills are for references not for interfaces validation; "interfaces, patterns, methods, api, signatures of specs etc" must validate against the correct versions at package.json - **MUST VALIDATE AGAINST ONLINE RESOURCES AS FOR MCP SERVER TOOLS ACTUAL FETCH** - valid and evidences with Context7, Deepwiki, Gitmcp, Github repo, Exa **AND Repomix for accurate specific patterns** etc, official - loading references from skills of stacks are outdated, as so reading code in the codebase can be polluted as many implementations are not functioning and broken. DO NOT MAKE ASSUMPTIONS OF THE STACK REPO LINKs - **EXTREMELY IMPORNTANT:** Uses of Context7, Deepwiki, Gitmcp, Github, Exa, Repomix are enforced when researching, planning, and implementing - these MUST Comply with all the **Github and Npm links that up-to-date with versiosn and NOT A PRODUCT OF MAKING UP LINKS** >  glob, list this to check these links `.hivemind/STACKS-REFERENCES.md`

- any thing under .opencode/ are not shipped-with, they are symlinks or project toolings 

- all orchestrator, coordinator, conductor agents belonging to l0, and l1 classifications MUST FOCUS ON THE DELEGATIONS - NEVER Implement the tasks yourself - when delegating DO NOT SHOW THE SPECIALIST WHAT AND HOW TO IMPLEMENT - Show HOW TO PROCESS, WHAT TO EXPECT AS RESULTS, SETTING CONSTRAINTS AND BOUNDARIES, INDICATION OF CLEAR SUCCESS METRICS

- design patterns and must be obeyed strictly according to the architecture of the project.

- atomic git commit for context preservation.

- context git commit for both code implementation, docs, planning, researching, gatekeeping, verification artifacts - do not ask if commit needed

- AGENTS.md must be routinely updated - after each cycle, each batch of implementation.

- AGENTS.md are nested under dirs and subdirs, beware when maintaining them.

- files creation and structure must be registered and keep track - we love our codetree systematically structured and we **DO Registered** folders and subfolders with `.gitkeep` 

- folders must be created in a way that is easy to navigate and understand, following the best practice of this harness. Folders must be registered with gitkeep files to ensure they are tracked by git. 

- code file must JSDOC (Run JSDOC skill) documented with clear descriptions, parameters, return values, and examples. All functions and classes must be documented.

- The front facing agents must process high-level workflows, validate dependencies of tasks across sessions through faces

- The front facing agents must delegate to suagents of specialist; front facing agents are not allowed to execute any tasks

- The front facing agents are ones converse with USERS and must know the high-level tasks flow, following strict validations, gatekeeping, and coordination of the partificating frameworks

- When delegating to agents these are the list of agents that must learn and delegate to the correct ones. When delegate to subagents make sure setting up strict guardrails, boundaries, success metrics, making sure they are awared that they are subagents and fulfill the tasked within boundaries and without any deviation ans seriously go through gatekeeping.

<!-- NOTE: explore agent is MISSING from the filesystem -->

- For effective session-resume delegation (when user disconnected and there were previous aborted delegation tasks). Do not start new delegation, start the same start with **THE EXACT SESSION ID** to resume.

- The front facing agents must keep track, monitor, make sure not a single validation, verification, review steps are skips, planning , audit and verification must following format of the participated framework with honest verification and prevention of regressions. 

- **all agents** at every turn (after PER USER's prompt, **even mid-session**, after each turn), entries, shift of workflows there should be matching SKILLS that you must load, load and reload of suitable skills for the task, select ones with framework consistencies. Do not miss loading SKILLS. SKILLS are extremely important


- - **all agents** : do not confuse between the project as the harness which you are building so that users can run it with OpenCode under their projects VS. your environment of works -> meaning there are assumptions that ARE NOT ALLOWED to interprete as this sole environment but must be as wider scopes, in terms of how different projects' states, tasks types, langues, frameworks and use cases.

When delegating, you MAY show: which commands to run, which prompts and workflows to use, and which protocols to follow.

When delegating, you MUST NEVER show: how to implement, how to solve the technical problem, or how to write the code.

You must show specialists which skills to load — do not load skills yourself, but direct specialists to their best available capabilities.

Use one cosistent system of agents either hm-* (hf-*) or (gsd-*) not both - beware of the l0, l1, l2, l3 delegation

.opencode/agents
.opencode/agents/.gitkeep
.opencode/agents/gsd-advisor-researcher.md
.opencode/agents/gsd-ai-researcher.md
.opencode/agents/gsd-assumptions-analyzer.md
.opencode/agents/gsd-code-fixer.md
.opencode/agents/gsd-code-reviewer.md
.opencode/agents/gsd-codebase-mapper.md
.opencode/agents/gsd-debug-session-manager.md
.opencode/agents/gsd-debugger.md
.opencode/agents/gsd-doc-classifier.md
.opencode/agents/gsd-doc-synthesizer.md
.opencode/agents/gsd-doc-verifier.md
.opencode/agents/gsd-doc-writer.md
.opencode/agents/gsd-domain-researcher.md
.opencode/agents/gsd-eval-auditor.md
.opencode/agents/gsd-eval-planner.md
.opencode/agents/gsd-executor.md
.opencode/agents/gsd-framework-selector.md
.opencode/agents/gsd-integration-checker.md
.opencode/agents/gsd-intel-updater.md
.opencode/agents/gsd-nyquist-auditor.md
.opencode/agents/gsd-pattern-mapper.md
.opencode/agents/gsd-phase-researcher.md
.opencode/agents/gsd-plan-checker.md
.opencode/agents/gsd-planner.md
.opencode/agents/gsd-project-researcher.md
.opencode/agents/gsd-research-synthesizer.md
.opencode/agents/gsd-roadmapper.md
.opencode/agents/gsd-security-auditor.md
.opencode/agents/gsd-ui-auditor.md
.opencode/agents/gsd-ui-checker.md
.opencode/agents/gsd-ui-researcher.md
.opencode/agents/gsd-user-profiler.md
.opencode/agents/gsd-verifier.md
.opencode/agents/hf-l0-orchestrator.md
.opencode/agents/hf-l1-coordinator.md
.opencode/agents/hf-l2-agent-builder.md
.opencode/agents/hf-l2-auditor.md
.opencode/agents/hf-l2-command-builder.md
.opencode/agents/hf-l2-meta-builder.md
.opencode/agents/hf-l2-prompter.md
.opencode/agents/hf-l2-refactorer.md
.opencode/agents/hf-l2-skill-builder.md
.opencode/agents/hf-l2-synthesizer.md
.opencode/agents/hf-l2-tool-builder.md
.opencode/agents/hm-l0-orchestrator.md
.opencode/agents/hm-l1-coordinator.md
.opencode/agents/hm-l2-analyst.md
.opencode/agents/hm-l2-architect.md
.opencode/agents/hm-l2-assessor.md
.opencode/agents/hm-l2-auditor.md
.opencode/agents/hm-l2-brainstormer.md
.opencode/agents/hm-l2-build.md
.opencode/agents/hm-l2-conductor.md
.opencode/agents/hm-l2-connector.md
.opencode/agents/hm-l2-context-mapper.md
.opencode/agents/hm-l2-context-purifier.md
.opencode/agents/hm-l2-critic.md
.opencode/agents/hm-l2-curator.md
.opencode/agents/hm-l2-debugger.md
.opencode/agents/hm-l2-ecologist.md
.opencode/agents/hm-l2-executor.md
.opencode/agents/hm-l2-finisher.md
.opencode/agents/hm-l2-general.md
.opencode/agents/hm-l2-guardian.md
.opencode/agents/hm-l2-integrator.md
.opencode/agents/hm-l2-intent-loop.md
.opencode/agents/hm-l2-investigator.md
.opencode/agents/hm-l2-mentor.md
.opencode/agents/hm-l2-meta-synthesis.md
.opencode/agents/hm-l2-operator.md
.opencode/agents/hm-l2-optimizer.md
.opencode/agents/hm-l2-persistor.md
.opencode/agents/hm-l2-phase-guardian.md
.opencode/agents/hm-l2-planner.md
.opencode/agents/hm-l2-prompt-analyzer.md
.opencode/agents/hm-l2-prompt-repackager.md
.opencode/agents/hm-l2-prompt-skimmer.md
.opencode/agents/hm-l2-researcher.md
.opencode/agents/hm-l2-reviewer.md
.opencode/agents/hm-l2-risk-assessor.md
.opencode/agents/hm-l2-router.md
.opencode/agents/hm-l2-scout.md
.opencode/agents/hm-l2-spec-verifier.md
.opencode/agents/hm-l2-strategist.md
.opencode/agents/hm-l2-synthesizer.md
.opencode/agents/hm-l2-technician.md
.opencode/agents/hm-l2-test-router.md
.opencode/agents/hm-l2-validator.md
.opencode/agents/hm-l2-writer.md

**Context Window Awareness**

As coordinator, you must understand the definition of granular and integration to delegate the amount of tasks that match available context windows.