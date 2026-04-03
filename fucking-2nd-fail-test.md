# Opencode Repomix deep research patterns

**Session ID:** ses_2ae946f7dffeHpLNoxmSfb6I2O
**Created:** 4/3/2026, 10:38:17 AM
**Updated:** 4/3/2026, 10:39:12 AM

---

## User

@.kilo/command/deep-research-synthesis-repomix.md create this

---

## Assistant (Coordinator · MiniMax-M2.7 · 26.0s)

_Thinking:_

The user has shared a document about "Advanced Repomix + Opencode Orchestration: Deep Research & Cross-Dependency Cheat Sheet". This appears to be a reference document about using Repomix and OpenCode tools for deep research workflows.

Looking at the context, the user seems to want me to understand or use this document. The document covers:

1. OpenCode tool taxonomy (read, grep, glob, bash, webfetch, websearch, codesearch, lsp, skill, task, batch, apply_patch, edit, write, todowrite)
2. Orchestrator & Swarm delegation patterns
3. Repomix advanced techniques for deep research
4. Orchestration patterns
5. Integrated workflow for long-haud audit protocol

The document mentions this is from `/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.kilo/command/deep-research-synthesis-repomix.md`

The user hasn't explicitly asked me to do anything with this document yet. They've just shared it. Let me check if there's an implicit request or if I should acknowledge the document and ask how I can help.

Looking at the user's message, they said `@.kilo/command/deep-research-synthesis-repomix.md create this` - this seems like they might be referencing a command or wanting me to look at this document. The "create this" part is ambiguous - it could mean they want me to create something based on this document, or they created this document and are sharing it.

Given the context and the fact that this is a very detailed technical document about tooling, I should acknowledge what I've read and ask how I can help. However, I should follow the workflow - check for relevant skills, understand the context, and then ask clarifying questions if needed.

Since this appears to be a research/documentation tool reference, and the user hasn't given a specific task, I should:


1. Acknowledge I've loaded the document
2. Ask how I can help - whether they want me to research something using these techniques, create a skill based on this, or something else

The document is clearly a reference guide for deep research workflows using OpenCode and Repomix, so I should clarify what action they'd like me to take with it.

I've loaded the **Advanced Repomix + OpenCode Orchestration** cheat sheet (620 lines). This is a comprehensive reference covering:

- **Part I**: OpenCode tool taxonomy — offset reading, LSP tool, codesearch, websearch vs webfetch, Context7 MCP
- **Part II**: Orchestrator & swarm delegation patterns — Task tool, batch tool, apply_patch
- **Part III**: Repomix advanced techniques — remote repo packing, skill generation, pack-grep-read pipeline
- **Part IV**: Orchestration patterns aligned with research protocols
- **Part V**: Integrated long-haul audit workflow with todo tracking

**How can I help you with this?** For example:

1. **Use these techniques** — apply the Pack-Grep-Read pipeline to investigate a specific subsystem in this repo
2. **Generate a skill** — package the hivemind-plugin codebase as a persistent knowledge artifact using `repomix_generate_skill`
3. **Cross-repo research** — pack remote repos (oh-my-openagent, etc.) and trace dependency patterns
4. **Something else** — create a custom research workflow, audit a specific area, etc.

What's your target?

---

## User

create skill

---

## Assistant (Coordinator · MiniMax-M2.7 · 16.7s)

_Thinking:_

The user wants to create a skill. Looking at the loaded cheat sheet, I can see that skills are created using the `repomix_generate_skill` tool, which creates a structured knowledge package in `.claude/skills/<skill-name>/` with SKILL.md and references/ folder.

Since the user just said "create skill" without specifying what kind of skill or for what purpose, I should ask for clarification. However, given the context of the loaded document which is about Repomix + OpenCode orchestration for deep research, and that this is the harness-experiment worktree of the hivemind-plugin repo, the user might want to:

1. Create a skill for the hivemind-plugin codebase
2. Create a skill based on the cheat sheet they just read
3. Create some other skill

Let me ask for clarification since "create skill" is ambiguous.

I need a bit more context to create the right skill. Here are the most likely options given the loaded document and current workspace:

**What would you like to create?**

| Option | Description |
|--------|-------------|
| **A. hivemind-plugin skill** | Package the current repo (`harness-experiment`) as a persistent skill — `src/`, `tests/`, architecture docs — so it's available as `.claude/skills/hivemind-plugin/` |
| **B. Repomix + OpenCode orchestration skill** | Formalize the cheat sheet you just read (620 lines) as a proper skill — structured usage guide, bundled reference |
| **C. Something else** | A different skill entirely — describe what you need |

**Also tell me:**

1. **Skill name** (kebab-case, e.g., `hivemind-plugin`, `repomix-deep-research`)
2. **Focus area** — what should the skill help with?
3. **Include/exclude patterns** — any specific directories or file types to focus on or skip?

For a quick start with sensible defaults:
- **Name**: `hivemind-plugin`  
- **Focus**: Full codebase + tests
- **Includes**: `src/**/*.ts`, `tests/**/*.ts`
- **Excludes**: `dist/`, `node_modules/`, `*.spec.ts` (test files can be noisy)

---

