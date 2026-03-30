The Hivemind framework is designed to integrate everything necessary for agentic coding and the harness of context, tools, Opencode plugins and SDK, deterministic approaches, and specialist factors through the engines and libraries of other dependencies, enabling agents to use features that are not built into any single platform. At the MVP stage we implement the concepts in Opencode, then identify footprints for other platforms such as Claude Code, Codex of OpenAI, Cursor, Kilocode, Antigravity, Gemini, etc. To avoid simplistic classifications we split the approach into three tiers and map the concepts to each group.

## Tier 1

The “Hard Harness”, requires a setup that matches the full complexity of Hivemind‑only. It involves installing additional npm packages, employing deterministic and programmatic methods, and meeting the requirements of the OpenCode SDK. 

## Tier 2

The “Opencode‑Dependable” setup, includes tools, plugins, hooks, commands, agents, sub‑agents, rules, prompts, workflows, permissions, shell commands, and other elements that work only under Opencode. Although they share naming conventions with other agentic coding platforms, they are configured and chained in a way that optimizes autonomous, multi‑role agent workflows.

## Tier 3 

The “SKILLS” tier, is a flexible, fail‑safe harness that enhances but does not disrupt or pollute the system; it provides depth, breadth, and coverage for diverse use cases and projects across multiple development industries in any context.

In developing skills, each must satisfy a set of absolute criteria that must pass a 100 % vertical and horizontal assessment and survive all stress‑tests and real‑life failure patterns. These characteristics are:

Framework and platform agnostic: terminology must be usable with Hivemind, strictly regulated to the entities, workflows, agents, sub‑agents, and task orientations; it must provide fallbacks and reference paths to other frameworks such as GSD, Spec‑kit, BMAD, Superpower, Oh‑my‑openagents, Open‑spec, and to platforms like Claude Code, Codex, Cursor, Kilocode, Antigravity, Gemini, etc.  
Hierarchy, domain‑specificity, intelligence, gatekeeping, delegation, and context integrity must be governed by strict rules: a parent must exist for a child to act, a chain cannot proceed until all dependencies are satisfied, and deterministic smart‑workflow routing is enforced. Front‑facing agents must know they are human‑facing, blind, the brain, and the highest hierarchy, and they must maintain an overview of progress, dependencies, contracts, and skill declarations. They must govern context, retrieve git commit information, understand git worktree and branch structures, and delegate sub‑agents to commit work in atomic batches with classification formats for retrieval. They must coordinate sequential, parallel, or batched tasks, set clear constraints and success metrics, and avoid hallucination or chain‑breaking behaviors.  
Skills must respect the unity and consistency of the framework: assets and references must be meticulously written, templates must provide detailed guidance without confusion, and the writing style must be human‑like with progressive disclosure.  

The skill set is illustrated by the following agent files in the Opencode repository:

```
.opencode/agents
.opencode/agents/architect.md
.opencode/agents/code-skeptic.md
.opencode/agents/explore.md
.opencode/agents/general.md
.opencode/agents/handoff.md
.opencode/agents/hitea.md
.opencode/agents/hivehealer.md
.opencode/agents/hivemaker.md
.opencode/agents/hiveminder.md
.opencode/agents/hiveplanner.md
.opencode/agents/hiveq.md
.opencode/agents/hiverd.md
.opencode/agents/hivexplorer.md
```

The governance model is deterministic and smart: denial is provided with evidence, explaining why a test fails and how agent dependencies lead to the required sequence of actions; it avoids finger‑pointing and instead offers clear, actionable guidance.  

Examples of skill granularity include TDD workflows such as https://github.com/obra/superpowers/tree/main/skills/test-driven-development, which can be installed via `npx skills add https://github.com/mattpocock/skills --skill tdd`, and other matrix skills for debugging, back‑end vs. front‑end patterns, verification, refactoring, documentation, and spec‑driven requirements.  

**Insight**  
Hivemind envisions a synergy of hive and mind: context engineering through “smart” agents that coordinate high‑autonomy workflows, achieve depth and hierarchy, and maintain self‑regulation with both high and low perspectives. This approach handles project complexity without forcing humans into rigid automation, allowing agents to act as companions and instructors while maintaining flexibility and autonomy.

