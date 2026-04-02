# Meta-Builder Skill Architecture

**Date:** 2026-04-03
**Pattern:** Mix of Pattern 2 (domain) and Pattern 3 (routing advanced)

---

## Meta-Builder is the Parent Skill

The meta-builder skill is the specialist in building meta concepts and advanced chaining for this project. It utilizes the wide range of "soft meta concepts" of OpenCode platforms — designed with the mindset that users will either call it directly, or the agent must detect through natural language and later be stacked with other concepts.

**OpenCode meta concepts consumed:**
- opencode-agents.md
- opencode-built-in-tools.md
- opencode-commands.md
- opencode-configs.md
- opencode-lsp-servers.md
- opencode-mcp-servers.md
- opencode-permissions.md
- opencode-skills.md
- opencode-custom-tools.md
- opencode-rules.md

---

## Hierarchy

```
meta-builder (parent orchestrator)
├── GROUP 1: Specialist "How-to-Implement" Skills (Pattern 1/2)
│   ├── 1. user-intent-interactive-loop
│   ├── 2. coordinating-loop
│   ├── 3. planning-with-files
│   ├── 4. tech-to-feature-synthesis + deep-investigation
│   └── 5. [TDD, Spec-driven — later]
│
├── GROUP 2: Domain-Parked Exclusive Skills (Pattern 1/2, shared with agentic dev)
│   ├── use-authoring-skills (skill authoring) ← CURRENT FOCUS
│   ├── use-authoring-commands (commands) ← FUTURE
│   ├── use-authoring-agents (agents vs subagents) ← FUTURE
│   ├── use-authoring-tools (tools, permissions, custom-tools) ← FUTURE
│   └── use-authoring-workflows (workflows) ← FUTURE
│
└── GROUP 3: Shared Concept-Specific Skills (stackable)
    └── [skills, commands, agents, tools, permissions, custom-tools, etc.]
```

---

## GROUP 1: Specialist Skills (How-to-Implement)

### 1. user-intent-interactive-loop
- Iterative, hierarchy, keep looking and build up on
- Uses question tools + coordinating-loop, planning-with-files, deep-investigation
- Helps with: getting users' ideas, brainstorming, investigation, deep research
- Persists through long-haul sessions
- Front agent keeps control of tasks and delegation while being a strategist to update and help users

### 2. coordinating-loop
- Like: dispatching-parallel-agents, hand-off, decision between sequential/parallel
- Keeps iterative and looping child/parent cycles throughout phases
- Scripting and techniques: ralph-loop pattern
- Kit-like skill with bundles ready

### 3. planning-with-files
- The official one: templates, samples, scripts, assets
- What currently exists in this project is what makes the agent hallucinate
- MUST be replaced with the proper version from planning-with-files repo

### 4. tech-to-feature-synthesis + deep-investigation
- Utilizes all above + GROUP 2 skills
- Loops, spawns subagents, plans progressively, sustains long memory
- Requires the other meta-concept skills built to make deep-research-synthesis happen

### 5. [TDD, Spec-driven — later]
- Not confusing further now

---

## GROUP 2: Domain-Parked Exclusive Skills

These are meta-builder's exclusive domain-parked skills. They need skills to refactor/improve/create skills.

**First to address:** `use-authoring-skills` + GROUP 1 skills (a, b, c)

**Later:** concept-specific like skills, commands, agents vs subagents, tools, permissions, custom-tools

These can stack together in advanced combinations. Will be progressively built and adjusted.

Reference: `/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.skills-lab/refactoring-skills/users-prompting-workspace-resources`

---

## Implementation Priority

1. **First:** Get `use-authoring-skills` to a state that sustains iterative loops, orchestrations, long-run users' intents locked
2. **Then:** Build GROUP 1 skills (a, b, c) — user-intent-interactive-loop, coordinating-loop, planning-with-files
3. **Then:** Build GROUP 2 skills (commands, agents, tools, workflows)
4. **Then:** Progressive refinement of GROUP 3

---

## Skills That Must Be Loaded

When using meta-builder, load these skills together:
- `skill-creator`, `skill-development`, `writing-skills` — for creating skills
- `skill-judge`, `skill-review` — for auditing skills
- `gcc` — for git-backed memory
- `planning-with-files` — for long-running planning
- `find-skill` — for discovering relevant skills
- `dispatching-parallel-agents` — for parallel orchestration

---

## Current State (Updated 2026-04-03 — Milestone 1 Complete)

### ✅ COMPLETED Skill Packs
- `use-authoring-skills/` — 24 files, ~4,500 lines. SKILL.md + 12 refs + 4 scripts + 4 templates + 3 hooks
- `user-intent-interactive-loop/` — 5 files, 1,433 lines. SKILL.md + 4 refs
- `coordinating-loop/` — 7 files, 1,205 lines. SKILL.md + 4 refs + 2 scripts
- `planning-with-files/` — 11 files, 1,805 lines. SKILL.md + 4 refs + 3 templates + 3 scripts

### ❌ NOT YET BUILT
- **Meta-builder parent skill** — the orchestrator that routes between all GROUP 1/2 skills
- **GROUP 2 remaining:** use-authoring-commands, use-authoring-agents, use-authoring-tools, use-authoring-workflows
- **GROUP 1 remaining:** tech-to-feature-synthesis, deep-investigation, TDD, Spec-driven
- **GROUP 3:** Shared concept-specific skills (stackable)
- **Cross-package bridging spec**
- **Integration tests** between skill packs
- **OpenCode docs consumption** (20 files available but not yet embedded into skills)
