# Skill Audit — Batch 3 of 4

**Audit Date:** 2026-04-07
**Auditor:** researcher (read-only)
**Scope:** Skills 11–15 of 20
**Base Path:** `/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.hivefiver-meta-builder/skills-lab/active/refactoring/`

---

## 11. opencode-non-interactive-shell

### name
`opencode-non-interactive-shell`

### frontmatter
**Present: YES** (3 lines)
```yaml
name: opencode-non-interactive-shell
description: Shell non-interactive strategy for OpenCode. Banned commands, non-interactive flags, environment variables, cognitive optimization patterns for headless agent execution.
```
- Has `name`: ✅
- Has `description`: ✅
- Missing: `version`, `metadata`, `allowed-tools` — no versioning, no layer/role metadata, no tool constraints.

### triggers
**None explicitly listed in frontmatter or as trigger phrases.** The description reads like a reference title, not a trigger string. There are no natural-language phrases like "use when..." or "triggers on..." anywhere in the file. An agent scanning skill descriptions would see a dry reference description with no user-facing trigger language.

### self_contained
**yes** — This skill is a standalone reference document. It contains all its content inline (banned commands, env vars, command tables, cognitive patterns). No `<files_to_read>` directive, no references to other files.

### cross_refs
| Reference | Target | Resolvable? |
|-----------|--------|-------------|
| "Per shell_strategy.md..." (line 211) | `shell_strategy.md` | **NO** — No such file exists in references/ or anywhere in the skill directory. This is a broken internal reference. |
| "OpenCode tools" (line 170) | Generic platform reference | Partially — refers to Read/Write/Edit tools but doesn't specify which skill or doc defines them. |
| "Claude Code's shell capabilities" (line 16) | External platform | Not resolvable within this project — external reference. |

### hardcoded_paths
**None.** No absolute paths, no macOS-specific paths, no platform assumptions. The content is platform-agnostic shell strategy.

### cross_platform_safe
**yes** — Purely conceptual shell strategy. No OS-specific file paths or platform-dependent operations.

### quality_score
**6/10**
- Clarity: Good — well-structured tables, clear BAD vs GOOD patterns.
- Actionability: Good — concrete command examples.
- Completeness: Moderate — missing trigger phrases, no version metadata, broken internal reference.
- No-fluff: Moderate — Section 7 (Advanced Instruction Patterns) is meta-commentary about LLM behavior that adds ~50 lines of general advice not specific to non-interactive shells.

### issues
1. **No trigger phrases** — Description is a reference title, not user-facing language. Agents won't know when to load this.
2. **Broken reference** — Line 211 cites `shell_strategy.md` which doesn't exist.
3. **Missing metadata** — No `version`, `metadata.layer`, `metadata.role`, or `allowed-tools` in frontmatter.
4. **Bloat in Section 7** — "Advanced Instruction Patterns" is general LLM prompt engineering advice, not shell-specific. Could be trimmed or moved to a shared reference.
5. **No references/ folder** — Despite being a "reference" skill, all content is inline. This is acceptable for a self-contained guide but means it can't be incrementally updated.

### connections
- **Agents:** Referenced in `opencode-non-interactive-shell` agent definition (the live `.opencode/agents/` copy). Any agent running in headless mode should have this loaded.
- **Commands:** No command explicitly triggers this skill.
- **Workflows:** Implicitly required by all agent execution flows (Iron Law #5: "EVERY COMMAND SURVIVES CI=true").
- **Dependencies:** None — fully standalone.

---

## 12. opencode-platform-reference

### name
`opencode-platform-reference`

### frontmatter
**Present: YES** (3 lines)
```yaml
name: opencode-platform-reference
description: Complete OpenCode platform documentation and source code. Covers agents, plugins, custom tools, SDK, permissions, skills, commands, configs, MCP servers, rules, models, and full source code. Essential for building OpenCode harness architecture.
```
- Has `name`: ✅
- Has `description`: ✅
- Missing: `version`, `metadata`, `allowed-tools` — no versioning, no layer/role metadata.

### triggers
**None explicitly listed.** The description is a catalog-style summary, not trigger language. No "use when..." or "triggers on..." phrases. An agent would need to infer this is relevant when building harness architecture, but there's no explicit trigger phrase.

### self_contained
**partial** — The SKILL.md itself is a table of contents pointing to 20 files in `references/`. Without the references/ directory, this skill is useless — it's purely an index. The references/ directory exists and is populated (20 files, ~64MB total including two ~30MB repomix-packed OpenCode source files).

### cross_refs
| Reference | Target | Resolvable? |
|-----------|--------|-------------|
| `references/opencode-agents.md` | Local file | ✅ Exists (16,600 bytes) |
| `references/opencode-built-in-tools.md` | Local file | ✅ Exists (7,293 bytes) |
| `references/opencode-commands.md` | Local file | ✅ Exists (5,883 bytes) |
| `references/opencode-configs.md` | Local file | ✅ Exists (17,222 bytes) |
| `references/opencode-custom-tools.md` | Local file | ✅ Exists (4,450 bytes) |
| `references/opencode-formatter.md` | Local file | ✅ Exists (3,851 bytes) |
| `references/opencode-github.md` | Local file | ✅ Exists (9,423 bytes) |
| `references/opencode-lsp-servers.md` | Local file | ✅ Exists (4,930 bytes) |
| `references/opencode-mcp-servers.md` | Local file | ✅ Exists (11,276 bytes) |
| `references/opencode-models.md` | Local file | ✅ Exists (4,956 bytes) |
| `references/opencode-permissions.md` | Local file | ✅ Exists (6,333 bytes) |
| `references/opencode-plugins.md` | Local file | ✅ Exists (8,560 bytes) |
| `references/opencode-rules.md` | Local file | ✅ Exists (5,972 bytes) |
| `references/opencode-sdk.md` | Local file | ✅ Exists (10,133 bytes) |
| `references/opencode-server.md` | Local file | ✅ Exists (8,285 bytes) |
| `references/opencode-share-usage.md` | Local file | ✅ Exists (2,596 bytes) |
| `references/opencode-skills.md` | Local file | ✅ Exists (4,111 bytes) |
| `references/opencode-troubleShooting.md` | Local file | ✅ Exists (8,360 bytes) |
| `references/repomix-opencode.md` | Local file | ✅ Exists (~29.8MB) |
| `references/repomix-opencode.xml` | Local file | ✅ Exists (~34.4MB) |

All 20 referenced files exist and are resolvable.

### hardcoded_paths
**None in SKILL.md.** The references/ files may contain paths but the skill itself is path-agnostic.

### cross_platform_safe
**yes** — Purely documentation reference. No platform-specific operations.

### quality_score
**5/10**
- Clarity: Good — clean table of contents.
- Actionability: Low — it's an index, not instructions. Agents need to know WHEN to load this and WHICH reference file to read for what problem.
- Completeness: Good — 20 reference files covering all OpenCode subsystems.
- No-fluff: Good — no padding.

### issues
1. **No trigger phrases** — Critical gap. This is a massive reference skill (~64MB of references) but agents have no guidance on when to load it.
2. **No usage guidance** — The SKILL.md is purely a table of contents. It should include a "When to use which reference file" section mapping common questions to specific reference files.
3. **Missing metadata** — No `version`, `metadata.layer`, `metadata.role`.
4. **Massive reference files** — `repomix-opencode.md` (~30MB) and `repomix-opencode.xml` (~34MB) will blow context windows if loaded naively. The skill should warn agents to use grep/search patterns rather than full reads.
5. **No `<files_to_read>` directive** — Unlike `phase-loop`, this skill doesn't tell agents which files to read first.
6. **Inconsistent casing** — `opencode-troubleShooting.md` has mixed casing (`troubleShooting` vs `troubleshooting`).

### connections
- **Agents:** Should be loaded by any agent building OpenCode harness architecture (hivefiver-orchestrator, hivefiver-agent-builder, hivefiver-command-builder, builder).
- **Commands:** No command explicitly triggers this skill.
- **Workflows:** Referenced implicitly by any workflow that needs OpenCode platform knowledge.
- **Dependencies:** None — fully standalone (references are bundled).

---

## 13. phase-loop

### name
`phase-loop`

### frontmatter
**Present: YES** (12 lines, well-structured)
```yaml
name: phase-loop
description: |
  Use when defining loop semantics for iterative phase execution. Triggers: 
  "define loop semantics", "what does loop mean", "iterate on document", 
  "phase loop architecture", "revision loop pattern", "check-revise-escalate",
  "how many iterations", "loop exit criteria"
version: 1.0.0
metadata:
  layer: "2"
  role: "domain-execution"
  pattern: P2
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
```
- Has `name`: ✅
- Has `description`: ✅ with explicit trigger phrases
- Has `version`: ✅ (1.0.0)
- Has `metadata`: ✅ (layer, role, pattern)
- Has `allowed-tools`: ✅

### triggers
**Excellent.** 8 explicit trigger phrases in description:
- "define loop semantics"
- "what does loop mean"
- "iterate on document"
- "phase loop architecture"
- "revision loop pattern"
- "check-revise-escalate"
- "how many iterations"
- "loop exit criteria"

### self_contained
**partial** — The SKILL.md contains the full loop definition, semantics, exit criteria, stall detection, validation checklist, anti-patterns, and example usage. However, it has a `<files_to_read>` directive pointing to `references/revision-loop.md` for "detailed loop semantics, stall detection, and escalation patterns." The references/ directory exists and contains `revision-loop.md` (5,178 bytes, 173 lines). The SKILL.md is usable without the reference file (it duplicates most content), but the reference file adds detail.

### cross_refs
| Reference | Target | Resolvable? |
|-----------|--------|-------------|
| `references/revision-loop.md` | Local file | ✅ Exists (5,178 bytes, 173 lines) |
| "checker/validator" (lines 37, 41) | Abstract concept | Not a specific file — refers to any validator agent/script |
| "implementer subagent" (line 51) | Abstract concept | Not a specific file — refers to any builder agent |
| "critic subagent" (line 51, example usage) | Abstract concept | Maps to `critic` agent in the project |
| "orchestrator" (example usage) | Abstract concept | Maps to `coordinator` or `hivefiver-orchestrator` agent |

### hardcoded_paths
**None.** No absolute paths, no platform-specific paths.

### cross_platform_safe
**yes** — Purely conceptual loop pattern. No platform dependencies.

### quality_score
**8/10**
- Clarity: Excellent — loop definition is clear pseudocode, semantics table is clean.
- Actionability: Good — concrete exit criteria, stall detection logic, validation checklist.
- Completeness: Good — covers loop definition, semantics, exit criteria, stall detection, anti-patterns, example usage.
- No-fluff: Good — minimal padding, every section adds value.

### issues
1. **Content duplication** — The loop pseudocode in SKILL.md (lines 36-52) is nearly identical to `references/revision-loop.md` (lines 7-23). The reference file adds some detail but the duplication is redundant.
2. **Minor typo** — Line 50 has inconsistent indentation: `   f. Re-spawn implementer subagent` (extra leading space vs other items).
3. **Abstract references** — "checker/validator", "implementer subagent", "critic subagent" are abstract concepts. The skill should specify which concrete agents in this project fill these roles.
4. **No escalation mechanism defined** — "escalate to user" is mentioned but not HOW to escalate (what tool, what format, what information to include).
5. **Max iterations hardcoded at 3** — This is reasonable but not configurable. No guidance on when to adjust.

### connections
- **Agents:** Used by orchestrator agents (`coordinator`, `hivefiver-orchestrator`) when managing iterative phase execution. The `critic` agent acts as the checker/validator. The `builder` agent acts as the implementer.
- **Commands:** No command explicitly triggers this skill.
- **Workflows:** Part of the GSD revision-loop pattern. Used in check-revise-escalate cycles.
- **Dependencies:** `references/revision-loop.md` for detailed semantics.

---

## 14. planning-with-files

### name
`planning-with-files`

### frontmatter
**Present: YES** (8 lines)
```yaml
name: planning-with-files
description: >
  This skill should be used when the agent is managing a multi-step task that spans
  more than one session, involves delegation to subagents, or needs to survive context
  compaction. It provides a 3-file external memory system (task_plan.md, findings.md,
  progress.md) that prevents goal drift across orchestrator-to-subagent handoffs.
  Activate when the user says "plan this", "break down", "organize", when dispatching
  subagents on a complex task, when recovering after /clear or interruption, or when
  a task touches 3+ files. Do NOT activate for single-file edits, simple questions,
  or one-command operations.
metadata:
  layer: "2"
  role: "persistent-memory"
```
- Has `name`: ✅
- Has `description`: ✅ with trigger phrases and anti-triggers
- Missing: `version`, `allowed-tools`
- Has `metadata`: ✅ (layer, role)

### triggers
**Excellent.** Multiple explicit trigger phrases:
- "plan this"
- "break down"
- "organize"
- "dispatching subagents on a complex task"
- "recovering after /clear or interruption"
- "task touches 3+ files"

Also has explicit **anti-triggers**: "Do NOT activate for single-file edits, simple questions, or one-command operations."

### self_contained
**yes** — The skill is fully self-contained. All content is inline: tiered response decision tree, file structures, delegation protocol, session recovery, error discipline, anti-patterns, integration notes, phase schema, sanity check. No `<files_to_read>` directive, no references/ directory.

### cross_refs
| Reference | Target | Resolvable? |
|-----------|--------|-------------|
| `user-intent-interactive-loop` (line 232) | Skill name | ✅ Exists as a skill in the project |
| `coordinating-loop` (line 233) | Skill name | ✅ Exists as a skill in the project |
| `/clear` (line 195) | OpenCode command | ✅ Valid OpenCode command |
| `task_plan.md`, `findings.md`, `progress.md` | Local files | Created by the skill at project root — not pre-existing |
| `git diff --stat` (line 197) | Git command | ✅ Standard git command |
| "TodoWrite" (line 221) | OpenCode tool | ✅ Valid tool reference |

### hardcoded_paths
**None.** The skill explicitly says "Write to project root" (line 226) and warns against "Creating files in skill directories." No absolute paths.

### cross_platform_safe
**yes** — Purely conceptual file-based memory system. Uses standard git commands and markdown files. No platform dependencies.

### quality_score
**9/10**
- Clarity: Excellent — decision tree, file templates, anti-patterns table all crystal clear.
- Actionability: Excellent — concrete file structures, specific trigger points, delegation envelope pattern.
- Completeness: Excellent — covers initialization, tiered response, delegation, recovery, error discipline, anti-patterns, integration, phase schema, sanity check.
- No-fluff: Excellent — every section is actionable.

### issues
1. **Missing `version` in frontmatter** — Unlike `phase-loop`, no version number.
2. **Missing `allowed-tools` in frontmatter** — No tool constraints declared.
3. **"First Action" gate is ambiguous** (line 71-73) — "Do not proceed with execution until task_plan.md has a Goal and at least one phase defined." But what if the user's request is vague? The skill should specify how to extract a Goal from ambiguous requests.
4. **File location ambiguity** — The skill says "Write to project root" but doesn't specify what happens in multi-project workspaces or when the agent is in a subdirectory.
5. **No cleanup/garbage collection** — The skill doesn't address what happens to planning files after task completion. They accumulate as orphaned files.

### connections
- **Agents:** Used by `coordinator`, `hivefiver-orchestrator`, and any agent managing multi-step tasks. The delegation protocol (lines 170-190) is specifically for orchestrator→subagent handoffs.
- **Commands:** `/plan` command should trigger this skill. Also relevant to `/start-work` and `/ultrawork`.
- **Workflows:** Core memory system for any multi-session workflow. Integrates with `user-intent-interactive-loop` (Layer 1) and `coordinating-loop` (Layer 3).
- **Dependencies:** None — fully standalone.

---

## 15. repomix-exploration-guide

### name
`repomix-exploration-guide`

### frontmatter
**Present: YES** (3 lines)
```yaml
name: repomix-exploration-guide
description: Repomix deep investigation and cross-dependency research cheat sheet. CLI commands, MCP tools, skill generation, token budget management, cross-repo analysis workflows.
```
- Has `name`: ✅
- Has `description`: ✅
- Missing: `version`, `metadata`, `allowed-tools` — no versioning, no layer/role metadata, no tool constraints.

### triggers
**None explicitly listed.** The description is a reference-style summary. No "use when..." or "triggers on..." phrases. However, the content is so specific to Repomix usage that an agent searching for "repomix" or "pack codebase" or "cross-repo analysis" would benefit from this skill.

### self_contained
**yes** — Fully self-contained cheat sheet. All content is inline: MCP tools reference, CLI commands, config schema, cross-dependency workflows, token budget management, practical commands, ignore patterns, mental model diagrams. No `<files_to_read>` directive, no references/ directory.

### cross_refs
| Reference | Target | Resolvable? |
|-----------|--------|-------------|
| `hivemind-plugin` (multiple) | Local repo | ✅ Exists |
| `oh-my-openagent` (multiple) | External repo | ⚠️ Exists but not in this workspace — referenced as `/path/to/oh-my-openagent` |
| `opencode` (multiple) | External repo | ⚠️ Exists but not in this workspace — referenced as `/path/to/opencode` |
| `repomix` (multiple) | External tool/repo | ✅ MCP tools available |
| `src/mcp/mcpServer.ts` (line 25) | Repomix source | ⚠️ External — not in this project |
| `.claude/skills/<name>/` (line 86, 350) | Claude skill output path | ✅ Standard path |
| `repomix.config.json` (line 192) | Config file | ✅ Standard Repomix config |
| `references/` (implicit) | No references/ folder | N/A — skill is self-contained |

### hardcoded_paths
**YES — Multiple.** The skill contains numerous hardcoded absolute path patterns:
- `/path/to/hivemind-plugin` (lines 28, 280, 307, 313, 345, 402, 425)
- `/path/to/oh-my-openagent` (lines 80, 285, 323, 336, 412, 426)
- `/path/to/opencode` (lines 290, 416, 427)
- `/abs/path/to/...` (lines 29, 80, 97, 103)

These are **template/example paths**, not actual hardcoded paths to this project. They're meant to be replaced by the agent. However, they create a macOS/Linux assumption (Unix-style paths).

### cross_platform_safe
**partial** — The content assumes Unix-style paths (`/path/to/...`). On Windows, agents would need to translate to `C:\path\to\...`. The MCP tool calls use JSON with `directory` fields that accept absolute paths, which is platform-dependent. The CLI commands (`repomix`, `cd`, `&&`) are Unix-specific.

### quality_score
**7/10**
- Clarity: Excellent — well-organized sections, clear code examples, good use of tables.
- Actionability: Good — concrete MCP tool payloads, CLI commands, recipes.
- Completeness: Good — covers MCP tools, CLI, config, workflows, token budget, ignore patterns.
- No-fluff: Good — mostly actionable content.

### issues
1. **No trigger phrases** — Critical gap. This is a comprehensive cheat sheet but agents have no guidance on when to load it.
2. **Missing metadata** — No `version`, `metadata.layer`, `metadata.role`, `allowed-tools`.
3. **Hardcoded path templates** — Lines 280, 285, 290, 307, 313, 323, 336, 345, 402, 412, 416, 425, 426, 427 all use `/path/to/...` placeholders. These should be parameterized or use a variable convention like `$REPO_ROOT`.
4. **External repo assumptions** — The skill assumes `oh-my-openagent` and `opencode` repos are available locally. It should clarify what to do if they're not (use `pack_remote_repository` instead).
5. **No references/ folder** — Despite being a "guide" skill, all content is inline. This is acceptable but means it can't be incrementally updated.
6. **Citation markers without sources** — Lines contain `[0-cite-0]`, `[0-cite-1]`, etc. markers but no actual citation URLs or source references. These appear to be leftover from an automated generation process.
7. **Mermaid diagrams may not render** — Lines 261-267 and 445-469 contain Mermaid flowchart syntax. If the agent's environment doesn't support Mermaid rendering, these are just text blocks.
8. **Section 5 has excessive blank lines** — Lines 254-258 are 5 blank lines between the repo structure table and the workflow diagram.

### connections
- **Agents:** Used by `researcher`, `explore`, and any agent doing deep codebase investigation. The `hivefiver-orchestrator` may reference this when delegating cross-repo research tasks.
- **Commands:** `/deep-research-synthesis-repomix` command should trigger this skill.
- **Workflows:** Core exploration toolkit for any workflow requiring codebase analysis.
- **Dependencies:** Repomix MCP server must be configured and available.

---

## Batch Summary

| # | Skill | Frontmatter | Triggers | Self-Contained | Cross-Platform | Quality | Key Issue |
|---|-------|-------------|----------|----------------|----------------|---------|-----------|
| 11 | opencode-non-interactive-shell | ✅ minimal | ❌ none | ✅ yes | ✅ yes | 6/10 | No trigger phrases, broken ref |
| 12 | opencode-platform-reference | ✅ minimal | ❌ none | ⚠️ partial (needs refs/) | ✅ yes | 5/10 | No triggers, no usage guidance, massive refs |
| 13 | phase-loop | ✅ complete | ✅ 8 phrases | ⚠️ partial (has ref file) | ✅ yes | 8/10 | Content duplication, abstract refs |
| 14 | planning-with-files | ✅ good | ✅ multiple + anti-triggers | ✅ yes | ✅ yes | 9/10 | Missing version/allowed-tools |
| 15 | repomix-exploration-guide | ✅ minimal | ❌ none | ✅ yes | ⚠️ partial (Unix paths) | 7/10 | No triggers, hardcoded path templates |

### Patterns Across This Batch

1. **Trigger phrase gap** — 4 of 5 skills lack explicit trigger phrases in their descriptions. Only `phase-loop` and `planning-with-files` have them. This is a systemic issue: agents won't know when to load these skills.
2. **Metadata inconsistency** — Only `phase-loop` has full frontmatter (name, description, version, metadata, allowed-tools). `planning-with-files` has name, description, metadata. The other 3 have only name and description.
3. **No `allowed-tools` declarations** — Only `phase-loop` declares which tools it uses. The others leave this unspecified.
4. **Reference file patterns** — `opencode-platform-reference` and `phase-loop` use `references/` directories. The other 3 are self-contained. Both approaches are valid but should be consistent within the project.
5. **Cross-platform safety** — All skills are largely cross-platform safe. The only concern is `repomix-exploration-guide` with its Unix path assumptions.
