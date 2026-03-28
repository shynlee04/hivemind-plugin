## Overview

This prompt outlines a comprehensive framework for investigating, orchestrating, and synthesizing a complex codebase and user session data through a layered “hivemind” architecture. Each bundle is a self‑contained, deep investigation package that, when combined, demands precise orchestration instructions.

---

## Domain Bundles of References and Assets

The **Investigation Group** comprises four major bundles, each a standalone, deeply‑nested package. When stacked, they create a highly complex system that requires meticulous coordination.

### 1. Hivemind‑Synthesis (or `use-hivemind-synthesis`)

- **Purpose**: Core synthesis engine.
- **Dependencies**: References to route use‑cases and the three primary skills (two legacy, one new).

### 2. Extended `use-hivemind-research`

- **Focus**: Orchestration, iterative, and traversal research frameworks.
- **Integration**: Works hand‑in‑hand with the core synthesis bundle.

### 3. Delegation‑Related Skills Bundle

- **Goal**: Coordinate synthesized handoffs, domain hierarchy, and delegation workflows.

### 4. Hivemind‑Intelligence Specialist Package

- **Contents**: Investigations, session‑building sessions, planning, time‑machine analysis, codebase inspection, and a holistic context view.

---

## Investigation Elements

| Element | Path / Reference |
|---------|------------------|
| Codebase Investigation | Hierarchy, slices, domains (broad to deep) |
| Session Investigation | Manual users’ session exports and inspection |
| Planning & Handoff | Agent activities, planning, delegation, testing, implementation, atomic Git commits |

Session export files are located under:

```
/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/sessions
/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/session-inspection
```

All investigation workflows are powered by the expanded `hivemind-delegation-*` skills (for swarm waves), `hivemind-research-*` skills (leveraging MCP server tools), and built‑in OpenCode Search utilities such as grep, fast glob, regex, LSP code search, Exa, and hierarchical heading readers.

---

## Research + Investigation → Synthesis

Leveraging MCP servers’ tools—Context7, Deepwiki, Git Fetcher, Web Fetch, Tavily, Exa—alongside local git repositories, we orchestrate sequential and parallel packets of `hivexplorer`, `hiverd`, and `architect` under the coordination of `hiveminder`. The goals are:

- Deep single‑tech‑stack API and feature synthesis.
- Cross‑dependency ideation for multi‑stack interfaces.
- Validation across the codebase to ensure all features align with proven tech, data models, APIs, and schemas.

---

## Gatekeeping and Controlled Synthesis

A pre‑gatekeeping layer on the synthesize SDK guarantees that all tests and implementations remain fully under controlled conditions, preventing uncontrolled experimentation.

---

## Hybrid Pattern 2 & 3 – Broad to Deep Investigation

The design follows a hybrid of Pattern 2 (domain‑specific organization) and Pattern 3 (conditional details). This facilitates a transition from broad codebase scanning to deep, focused investigations, outputting structured reports on concerns, slices, domains, and architecture.

### Pattern 2: Domain‑Specific Organization

For multi‑domain skills, structure content by domain to avoid loading irrelevant context. Example layout:

```
bigquery-skill/
├── SKILL.md
└── reference/
    ├── finance.md
    ├── sales.md
    ├── product.md
    └── marketing.md
```

### Pattern 3: Conditional Details

Provide essential content with links to advanced details. Example:

```
# DOCX Processing

## Creating documents
Use docx-js. See [DOCX-JS.md](DOCX-JS.md).

## Editing documents
Simple edits: modify XML directly.

**Tracked changes**: [REDLINING.md](REDLINING.md)  
**OOXML details**: [OOXML.md](OOXML.md)
```

Guidelines:
- Keep references one level deep from `SKILL.md`.
- Include a table of contents for reference files exceeding 100 lines.

---

## Repomix Integration

Repomix powers cross‑dependency discovery and deep codebase investigation. Key resources:

- **Basic use‑cases**: https://repomix.com/guide/use-cases
- **Prompt examples**: https://repomix.com/guide/prompt-examples
- **Output format**: https://repomix.com/guide/output
- **Configuration**: https://repomix.com/guide/configuration
- **Custom instructions**: https://repomix.com/guide/custom-instructions
- **Remote repository processing**: https://repomix.com/guide/remote-repository-processing
- **Comment removal**: https://repomix.com/guide/comment-removal
- **Code compression**: https://repomix.com/guide/code-compress

### Relevant Repomix XML Configurations

```
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/dynamic-context-prunning/repomix-dynamic-context-prunning.xml
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/oh-my-openagents/repomix-oh-my-openagents.xml
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/repomix-opencode.xml
```

### Session Exports

```
/Users/apple/hivemind-plugin/.worktrees/product-detox/session-ses_2cb9.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/session-ses_2ccb.md
```

### Additional .hivemind Directories

```
/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity
/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/sessions
/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/session-inspection
```

---

## Skills

1. **Agent Skills Generation** – Generate skills for investigating packed codebases.  
   Reference: https://repomix.com/guide/agent-skills-generation

2. **Repomix Explorer Skill** – Explore codebase using skills.  
   Reference: https://repomix.com/guide/repomix-explorer-skill

3. **Repomix as a Library** – Combine with MCP tools (Deepwiki, Exa, Context7) for cross‑dependency knowledge bases.  
   Reference: https://repomix.com/guide/development/using-repomix-as-a-library

Additional community projects include the Codebase MCP repository: https://github.com/DeDeveloper23/codebase-mcp

---

## Next Steps

With the current refactor underway, please:

1. Add this eighteenth skill to the suite.
2. Re‑strategize the orchestration setup.
3. Delegate agents for iterative updates on the master plan.
4. Validate each step meticulously, ensuring every detail is correct.

## Must-ingest and synthesize from these references
# repomix for cross-dependencies & deep codebase investigation skills

# Official Resources

Basic use-cases :https://repomix.com/guide/use-cases  ; Prompt Examples https://repomix.com/guide/prompt-examples 

- Output format: https://repomix.com/guide/output
- config https://repomix.com/guide/configuration
- custom instruction: https://repomix.com/guide/custom-instructions
- Github repo processing: https://repomix.com/guide/remote-repository-processing
- commands removal https://repomix.com/guide/comment-removal
- code compression https://repomix.com/guide/code-compress

## SKILLS

1. Agents’ skills generation → to generate skills to investigate the packed codebase or part of the codebase https://repomix.com/guide/agent-skills-generation 
2. another use cases to explore codebase with skills https://repomix.com/guide/repomix-explorer-skill 
3. use as library for (from this you can combine with the above skills and other MCP servers tools like Deepwiki, Exa, Context7 → to develop cross-dependencies tech knowledge-base) https://repomix.com/guide/development/using-repomix-as-a-library  or this https://repomix.com/guide/tips/best-practices 

## COMMUNITY PROJECTS

1. Codebase MCP https://github.com/DeDeveloper23/codebase-mcp 

## To tap into what are they (the entities of session, repo packed and activity as I have mentioned above you can spawn multiple batches and waves of subagents to inspect them to learn more about what have been mentioned above)

### Repomix repo from git hub

```markdown
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/dynamic-context-prunning/repomix-dynamic-context-prunning.xml
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/oh-my-openagents/repomix-oh-my-openagents.xml
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/repomix-opencode.xml
```

### Sessions export by users

```markdown
/Users/apple/hivemind-plugin/.worktrees/product-detox/session-ses_2cb9.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/session-ses_2ccb.md
```

### Others at .hivemind/*.* → expand them to inspect

```markdown
/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity
/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/sessions
/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/session-inspection
```