# Failure Analysis: meta-builder Skill Pack

**Date:** 2026-04-03
**Subject:** meta-builder — routing orchestrator for harness framework
**Location:** `.skills-lab/refactoring-skills/meta-builder/`
**Severity:** BLOCK — skill fails to route on the exact user prompt it should handle

---

## Executive Summary

The meta-builder skill pack is a **routing orchestrator in search of a routing problem**. It spends ~900 lines across 5 files describing HOW to classify intent, WHAT groups exist, and WHY HiveMind architecture matters — yet when a user says "I want to create a skill like this @.kilo/command/deep-research-synthesis-repomix.md", the agent loaded `use-authoring-skills` and `skill-creator` directly, **never touching meta-builder at all**. The skill's description did not trigger, and even if it had, it would have given the agent a taxonomy lesson instead of a workflow.

---

## Flaw 1: Description Does Not Trigger on the User's Actual Request

**Severity: BLOCK**

The description reads:
```
Use when creating, modifying, or stacking agent skills, commands, tools, agents,
workflows, or OpenCode configurations. Routes user intent to implementation skills
(GROUP 1) or domain authoring skills (GROUP 2). Triggers: "build a skill", "create
an agent", "set up a command", "configure OpenCode", "stack these skills", "modify
my workflow", "add a custom tool", "set permissions", "add MCP server", "configure
LSP", "write a rule", "meta concept", "harness framework".
```

The user said: **"I want to create a skill like this @.kilo/command/deep-research-synthesis-repomix.md"**

This contains "create a skill" — which is close to "build a skill" and "write a rule" but the description is **trying to do everything at once**. It lists 13 different trigger phrases spanning skill creation, agent config, command setup, tool building, MCP configuration, LSP setup, and permission management. When a description tries to match everything, it matches nothing strongly. The agent in the transcript loaded `use-authoring-skills` directly — the more specific skill — and never considered meta-builder.

**Evidence:** The transcript shows the agent's first action was `skill({ name: "use-authoring-skills" })` at line 25-32. No mention of meta-builder anywhere in 2241 lines of transcript.

---

## Flaw 2: No Concrete "User Says X → Do Y" Workflow

**Severity: BLOCK**

The skill's body is entirely meta-level. It describes:
- A 5-step "Routing Loop" (DETECT → CLASSIFY → LOAD → EXECUTE → INTEGRATE → REPEAT) at SKILL.md:44-79
- A routing table at SKILL.md:87-112
- A stacking guide at SKILL.md:118-145
- An OpenCode concept integration table at SKILL.md:149-166
- A HiveMind v3 alignment table at SKILL.md:170-184

What it does **not** contain: a single concrete workflow that says "when a user asks you to create a skill, do these steps in this order."

The "Routing Loop" is a flowchart, not a workflow. It tells the agent to "Detect Intent" and "Classify Group" but provides no step-by-step actions the agent can execute. Compare this to `skill-creator` which has: Capture Intent → Interview and Research → Write the SKILL.md → Run test cases → Grade → Launch viewer → Read feedback → Improve. That's a workflow. Meta-builder has a taxonomy.

**Evidence:** SKILL.md:44-79 — the "Core Pattern" section is 6 words of ASCII art plus 5 generic step descriptions totaling ~200 words of meta-guidance with zero executable steps.

---

## Flaw 3: The Routing Decision Tree Is Theoretical, Not Operational

**Severity: HIGH**

The routing logic in `references/01-routing-logic.md` presents a weighted scoring formula:

```
GROUP 1 score = (action_signals × 2) + (entity_signals × 1) + (modifier_signals × 1)
GROUP 2 score = (action_signals × 2) + (entity_signals × 1) + (modifier_signals × 1)
```

This formula is **identical for both groups** — the same calculation produces both scores. The document says "The entity with the highest score wins" but provides no mechanism for how action_signals for GROUP 1 differ from action_signals for GROUP 2. The verb tables (SKILL.md:51-58, 01-routing-logic.md:23-32) classify verbs as "likely GROUP 1" or "likely GROUP 2" but the scoring formula doesn't encode this distinction.

Additionally, the decision tree at 01-routing-logic.md:143-156 routes "Skill creation → use-authoring-skills" — which is correct — but the agent doesn't need meta-builder to reach that conclusion. The routing adds a classification step that the agent would do naturally by loading the more specific skill.

**Evidence:** 01-routing-logic.md:76-79 — the scoring formula is literally identical for both groups, making it a no-op.

---

## Flaw 4: OpenCode Concept Overload — 10 Concepts, Zero Guidance on Which One to Use

**Severity: HIGH**

The skill dumps all 10 OpenCode meta concepts on the agent (SKILL.md:149-166, 02-opencode-concepts.md:1-287) when the user wants to create a skill. The agent needs to know: "You're creating a skill → use `use-authoring-skills`." Instead it gets:

| Concept | Pages of content | Useful for "create a skill"? |
|---------|-----------------|------------------------------|
| Agents | 02-opencode-concepts.md:26-54 | No |
| Commands | 02-opencode-concepts.md:58-73 | No |
| Tools (Built-in) | 02-opencode-concepts.md:76-105 | No |
| Skills | 02-opencode-concepts.md:107-123 | Marginally |
| Permissions | 02-opencode-concepts.md:126-148 | No |
| Custom Tools | 02-opencode-concepts.md:150-168 | No |
| MCP Servers | 02-opencode-concepts.md:170-189 | No |
| LSP Servers | 02-opencode-concepts.md:191-209 | No |
| Rules | 02-opencode-concepts.md:211-229 | No |
| Configs | 02-opencode-concepts.md:231-249 | No |

287 lines of concept documentation where the agent needs one sentence: "You're creating a skill — load use-authoring-skills."

**Evidence:** 02-opencode-concepts.md is 287 lines. The "Skills" section (the only relevant one) is 17 lines. That's 6% signal, 94% noise for the "create a skill" use case.

---

## Flaw 5: Stacking Rules Are Abstract and Unactionable

**Severity: HIGH**

The stacking guide (SKILL.md:118-145, 03-stacking-rules.md:1-256) provides principles but no concrete guidance for the agent to follow in real time:

- "Maximum 3 skills active simultaneously" — but which 3?
- "Load the primary skill first" — how does the agent know which is primary vs complementary for a specific request?
- "Never load conflicting skills" — the conflict detection requires reading multiple SKILL.md files and comparing them, which the agent won't do without explicit instruction

The valid combinations table (SKILL.md:130-135) lists 4 patterns, none of which include the most common case: "create a skill from a template file." The invalid combinations table lists "Two skills with same trigger" and "Depth skill + routing skill" — abstract categories that don't help the agent decide whether `use-authoring-skills` + `skill-creator` is valid (it loaded both in the transcript).

**Evidence:** 03-stacking-rules.md:134-139 explicitly marks `use-authoring-skills + skill-creator` as INVALID due to trigger overlap, yet this is exactly what the agent loaded in the transcript (lines 25-32 and 404-412). The stacking rules contradict actual working behavior.

---

## Flaw 6: Missing First Action — No "Load This Skill First" Directive

**Severity: HIGH**

When meta-builder loads, what is the VERY FIRST thing the agent should do? The skill doesn't say. There is no "First Action" section, no "On Loading This Skill" block, no immediate directive.

Compare to `use-authoring-skills` which has a "When to Load" table that immediately routes the agent to specific reference files based on the situation. Meta-builder has a "When to Load" table too (SKILL.md:26-38), but it routes to GROUP classifications, not to actions.

The agent needs: "You loaded meta-builder. Step 1: Read the user's request. Step 2: Match against the routing table below. Step 3: Load the target skill via the skill tool." Instead it gets abstract group theory.

**Evidence:** SKILL.md:26-38 — "When to Load" table maps user intents to GROUP classifications, not to executable actions. The row for "Create a new skill" says "→ GROUP 2: use-authoring-skills" but doesn't say "Load use-authoring-skills now."

---

## Flaw 7: HiveMind v3 Alignment Is Irrelevant Noise

**Severity: MEDIUM-HIGH**

The entire `references/04-hivemind-compatibility.md` file (233 lines) and the SKILL.md summary table (SKILL.md:170-184) describe how meta-builder aligns with HiveMind v3 architecture principles:

- CQRS enforcement
- Code vs configuration boundary
- Module mapping to TypeScript modules
- Migration paths from harness-experiment to HiveMind v3
- Dependency graph alignment

None of this helps an agent create a skill. The agent creating a skill doesn't need to know that meta-builder maps to `src/control-plane/primitives.ts` or that HiveMind has a "clean, modular architecture targeting ~4,000-5,000 LOC." This is architecture documentation for human developers, not agent instructions.

**Evidence:** 04-hivemind-compatibility.md:9 — "HiveMind v3 is a clean, modular architecture for multi-agent coding platforms. It consolidates patterns from harness-experiment (~2,300 LOC) with features from product-detox (~15,000 LOC), targeting ~4,000-5,000 LOC total." This is project planning content, not agent guidance.

---

## Flaw 8: Scripts Don't Work in Practice

**Severity: HIGH**

Both bundled scripts fail when tested:

### route-check.sh
```
$ bash scripts/route-check.sh GROUP_2 use-authoring-skills
PASS: Group 'GROUP_2' is valid
FAIL: Skill 'use-authoring-skills' not found in any known skill directories
PASS: Skill 'use-authoring-skills' is valid for GROUP_2
Route check FAILED: 1 error(s) found
```

The script searches in hardcoded relative paths (`$(dirname "$0")/../..` → `.agents/skills`, `.opencode/skills`, `.claude/skills`) but skills live in the global `~/.agents/skills/` directory which is not in the search path. The script fails for every real skill that isn't co-located with meta-builder.

**Evidence:** route-check.sh:35-39 — search paths are `$(dirname "$0")/..`, `$(dirname "$0")/../../.agents/skills`, `$(dirname "$0")/../../.opencode/skills`, `$(dirname "$0")/../../.claude/skills`. None resolve to `~/.agents/skills/` where most skills actually live.

### stack-validate.sh
```
$ bash scripts/stack-validate.sh use-authoring-skills
FAIL: Skill 'use-authoring-skills' not found at scripts/../use-authoring-skills/SKILL.md
Stack validation FAILED: Skills missing
```

The script only looks in `$(dirname "$0")/..` (the meta-builder parent directory) for skill directories. It cannot find skills anywhere else. It also has a hardcoded 3-skill maximum check (line 16-19) that rejects valid stacks of skills that happen to not be co-located.

**Evidence:** stack-validate.sh:29 — `skill_base="$(dirname "$0")/.."` — single search path, no fallback to global skill directories.

### Additional script issues:
- Both scripts use `set -euo pipefail` which means any single failure aborts the entire script, providing no partial results
- stack-validate.sh's trigger overlap check (lines 47-79) extracts descriptions via awk and does naive word-level deduplication — it would flag any two skills that both mention "skill" or "create" as overlapping
- Neither script handles the case where a skill is loaded from a global path (e.g., `~/.agents/skills/skill-creator`)

---

## Flaw 9: The Skill Is a Router That Routes to Skills the Agent Already Knows About

**Severity: MEDIUM-HIGH**

The fundamental problem: meta-builder is a **routing layer on top of skills that are already in the agent's available_skills list**. The agent can see all skill descriptions at all times. When a user says "create a skill," the agent sees:

- `use-authoring-skills` — "Use when creating a new agent skill, auditing an existing skill..."
- `skill-creator` — "Create new skills, modify and improve existing skills..."
- `writing-skills` — "Use when creating new skills, editing existing skills..."

The agent doesn't need meta-builder to tell it to load `use-authoring-skills`. It can see that skill's description directly. Meta-builder adds a classification step that duplicates what the agent's native skill selection already does.

The only value meta-builder could add is **stacking guidance** (which skills to load together) and **cross-domain coordination** (when a task spans skill authoring + agent orchestration). But the stacking rules are abstract and the coordination guidance is meta-level, not actionable.

**Evidence:** The transcript shows the agent correctly identified `use-authoring-skills` as the relevant skill and loaded it directly (line 21: "the 'use-authoring-skills' skill seems relevant here since it covers creating new skills"). No routing assistance was needed or used.

---

## Flaw 10: Terminology Mandate Contradicts Platform Reality

**Severity: MEDIUM**

The terminology table (SKILL.md:200-208) mandates:
- "Agent" not "Claude, GPT, Gemini"
- "AGENTS.md" not "CLAUDE.md"
- "Universal" not "OpenCode-specific"

But the skill's own content is saturated with OpenCode-specific references:
- `opencode.json` mentioned in 02-opencode-concepts.md:234-249
- `.opencode/skills/` paths throughout
- `tool()` helper from `@opencode-ai/plugin` at 02-opencode-concepts.md:156
- `opencode mcp list` CLI commands at 02-opencode-concepts.md:179

The "universal" terminology mandate is performative — the content is irreducibly OpenCode-specific because the harness framework IS an OpenCode plugin.

**Evidence:** 02-opencode-concepts.md references `opencode.json`, `.opencode/`, `@opencode-ai/plugin`, and `opencode mcp` commands extensively while the terminology table claims to be "Universal."

---

## Flaw 11: GROUP 2 Skills Are Mostly "(future)" — Routing to Nothing

**Severity: MEDIUM**

The routing table (SKILL.md:33-36) and group definitions (SKILL.md:66) list 5 GROUP 2 skills:
- `use-authoring-skills` — exists
- `use-authoring-agents` — **(future)**
- `use-authoring-commands` — **(future)**
- `use-authoring-tools` — **(future)**
- `use-authoring-workflows` — **(future)**

Four out of five routing targets don't exist. When an agent routes "Create a custom tool" to `use-authoring-tools (future)`, it has nowhere to go. The routing table presents these as if they're available destinations.

**Evidence:** SKILL.md:34-36 — three of eight routing rows end with "(future)". 01-routing-logic.md:113-116 repeats the same pattern.

---

## Flaw 12: No Progressive Disclosure — Everything Loads at Once

**Severity: MEDIUM**

The skill is 256 lines in SKILL.md plus 4 reference files totaling ~1,000 lines. When the skill loads, the agent gets the entire SKILL.md body. There is no tiered loading strategy — no "read this section first, then only load references if needed." The reference map at SKILL.md:227-235 lists all 4 files but gives no guidance on which to read when.

Compare to `use-authoring-skills` which has explicit "When to Load" routing to specific reference files: "Creating a new skill → references/01-skill-anatomy.md + references/02-frontmatter-standard.md." Meta-builder's reference map is a flat list with no conditional loading guidance.

**Evidence:** SKILL.md:227-235 — "Reference Map" is a simple table with file names and purposes. No "read X when Y" guidance.

---

## Summary Matrix

| # | Flaw | Severity | Impact |
|---|------|----------|--------|
| 1 | Description doesn't trigger on user's actual request | **BLOCK** | Skill never loads |
| 2 | No concrete "user says X → do Y" workflow | **BLOCK** | Agent has no executable steps |
| 3 | Routing scoring formula is identical for both groups | HIGH | Classification is random |
| 4 | 10 OpenCode concepts dumped, 1 is relevant | HIGH | 94% noise for skill creation |
| 5 | Stacking rules contradict working behavior | HIGH | Agent loads "invalid" stacks |
| 6 | No first-action directive | HIGH | Agent doesn't know what to do first |
| 7 | HiveMind v3 alignment is irrelevant noise | MEDIUM-HIGH | 233 lines of architecture docs |
| 8 | Scripts fail on real skill paths | HIGH | Validation is broken |
| 9 | Routes to skills agent already sees | MEDIUM-HIGH | Redundant classification layer |
| 10 | Terminology mandate contradicts content | MEDIUM | Performative universality |
| 11 | 4 of 5 GROUP 2 targets are "(future)" | MEDIUM | Routing to nowhere |
| 12 | No progressive disclosure | MEDIUM | All 1,000 lines load at once |

---

## Root Cause

The meta-builder skill was designed as an **architecture document** rather than an **agent instruction set**. It describes the harness framework's conceptual model (groups, routing, stacking, HiveMind alignment) but does not give the agent executable guidance for any specific task. It is a map of the territory, not a set of directions.

The agent in the failure transcript succeeded **despite** meta-builder, not because of it. It loaded the correct skills (`use-authoring-skills`, `skill-creator`) through its own judgment and produced a working skill. Meta-builder was never invoked.

---

## Recommendation Direction (not prescriptive)

The skill needs to choose a lane:
- If it's a **routing skill**, it should be thin (<100 lines), with a single decision tree and immediate skill loading instructions.
- If it's a **stacking skill**, it should provide concrete stack recipes for common multi-domain tasks.
- If it's a **concept integration skill**, it should only surface concepts when the user's request actually involves them.

It cannot be all three at 1,000+ lines.
