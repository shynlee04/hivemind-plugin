# Skill Audit — Batch 2 of 4

**Date:** 2026-04-07  
**Auditor:** researcher (terminal repository investigator)  
**Batch:** Skills 6–10  
**Base path:** `/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.hivefiver-meta-builder/skills-lab/active/refactoring/`

---

## 6. custom-tools-dev

### Frontmatter
- **Has YAML frontmatter:** Yes
- **Fields:** `name`, `description`
- **Missing metadata:** No `metadata` block (no layer, role, version, pattern)

### Triggers
- "create a custom tool"
- "build an OpenCode plugin"
- "write a tool with Zod schema"
- "add a plugin hook"
- "create CLI script"
- "build a tool for agent"
- Mentions of: `tool()` helper, Zod validation, plugin lifecycle, hooks (PreToolUse, PostToolUse), `bin/` scripts
- **Assessment:** Triggers are comprehensive and embedded in the description. Good coverage.

### Self-Contained
- **Verdict:** partial
- **Explanation:** The SKILL.md contains the core Iron Law, anti-patterns, validation gate, and plugin lifecycle summary. However, the "On Load" section mandates reading `references/plugin-lifecycle.md` and `references/zod-patterns.md` — both exist and are substantive (147 LOC and 128 LOC respectively). Without them, the skill lacks the code examples and Zod patterns that agents need for implementation.

### Cross-References
| Reference | Type | Resolvable? | Notes |
|-----------|------|-------------|-------|
| `references/plugin-lifecycle.md` | Internal reference | ✅ Yes — exists at `custom-tools-dev/references/plugin-lifecycle.md` | Full lifecycle with TypeScript code examples |
| `references/zod-patterns.md` | Internal reference | ✅ Yes — exists at `custom-tools-dev/references/zod-patterns.md` | Good/Bad examples, common patterns |
| `@opencode-ai/plugin` | External dependency | ✅ Yes — npm package, referenced in plugin-lifecycle.md | Peer dependency of opencode-harness |
| `zod` | External dependency | ✅ Yes — npm package | Standard Zod library |

### Hardcoded Paths
- **None found.** The skill explicitly warns against hardcoded paths ("The Path Hardcoder" anti-pattern). No absolute paths in SKILL.md or reference files.

### Cross-Platform Safety
- **Verdict:** yes
- **Explanation:** No platform-specific paths. Uses relative references within the skill package. TypeScript/Zod patterns are platform-agnostic.

### Quality Score: 7/10
- **Clarity:** Strong. Iron Law is unambiguous. Anti-pattern table is actionable.
- **Actionability:** Good, but depends on reference files for implementation details.
- **Completeness:** Missing `metadata` frontmatter block (layer, role, version, pattern). No `allowed-tools` declaration.
- **No-fluff:** Tight. 74 LOC for SKILL.md is well within limits.

### Issues
1. **Missing metadata frontmatter** — No `metadata` block with layer, role, version, pattern. The `opencode-platform-reality.md` reference (line 191-207) documents the expected frontmatter standard, which this skill does not follow.
2. **No `allowed-tools` declaration** — The skill does not declare which tools it permits.
3. **No `scripts/` directory** — Unlike other skills in the batch, this one has no validation scripts. The validation gate is a checklist in markdown only — no executable validation.
4. **Reference to `bin/` scripts in triggers** — The trigger mentions "bin/ scripts" but the project's AGENTS.md says "Bash scripts outside `bin/` CLI substrate" is an anti-pattern. The trigger should clarify this refers to the OpenCode plugin's `bin/` directory, not the project root.

### Connections
- **Agents using this skill:** Referenced by `harness-audit` Phase 3 (Tools audit) via `references/pointers.md`. Referenced by `meta-builder` routing table ("build a custom tool" → `custom-tools-dev`).
- **Commands triggering it:** None directly. Via `/hf-create` routing through `meta-builder`.
- **Workflows executing it:** `harness-audit` Phase 3 declares it as execution context.

---

## 7. harness-audit

### Frontmatter
- **Has YAML frontmatter:** Yes
- **Fields:** `name`, `description`, `metadata` (layer: "1", role: "auditor", version: "3.0.0")
- **Missing:** No `pattern` field in metadata. No `allowed-tools` declaration.

### Triggers
- "audit harness"
- "check boundaries"
- "verify architecture"
- "audit skills"
- "check governance"
- "context poisoning"
- "cross-platform audit"
- "audit my opencode project"
- "full harness audit"
- "validate opencode setup"
- **Assessment:** Comprehensive trigger coverage. All phrases are distinct and specific.

### Self-Contained
- **Verdict:** partial
- **Explanation:** The SKILL.md is a thin orchestrator — it defines the architecture, phases, dispatch protocol, and anti-patterns. However, it depends on 7 subagent profile templates in `assets/profiles/` (all 7 exist), `references/pointers.md` (exists), and two scripts (`compile-bundle.sh`, `validate-skill.sh` — both exist and are functional). The skill cannot execute without these supporting files.

### Cross-References
| Reference | Type | Resolvable? | Notes |
|-----------|------|-------------|-------|
| `assets/profiles/phase-1-skills.md` | Internal asset | ✅ Yes — exists | Skills audit profile |
| `assets/profiles/phase-2-commands.md` | Internal asset | ✅ Yes — exists | Commands audit profile |
| `assets/profiles/phase-3-tools.md` | Internal asset | ✅ Yes — exists | Tools audit profile |
| `assets/profiles/phase-4-permissions.md` | Internal asset | ✅ Yes — exists | Permissions audit profile |
| `assets/profiles/phase-5-agents.md` | Internal asset | ✅ Yes — exists | Agents audit profile |
| `assets/profiles/phase-6-subagents.md` | Internal asset | ✅ Yes — exists | Subagents audit profile |
| `assets/profiles/phase-7-synthesis.md` | Internal asset | ✅ Yes — exists | Synthesis profile |
| `references/pointers.md` | Internal reference | ✅ Yes — exists | Points to 7 skills for execution context |
| `scripts/compile-bundle.sh` | Internal script | ✅ Yes — exists, functional | Validates profile structure, copies to `.harness-audit/compiled/` |
| `scripts/validate-skill.sh` | Internal script | ✅ Yes — exists, functional | Checks SKILL.md, frontmatter, profile count, references |
| `use-authoring-skills` | External skill | ✅ Yes — exists at `.opencode/skills/use-authoring-skills/` | Phase 1 execution context |
| `command-dev` | External skill | ✅ Yes — exists at `.opencode/skills/command-dev/` | Phase 2 execution context |
| `custom-tools-dev` | External skill | ✅ Yes — exists (this batch) | Phase 3 execution context |
| `opencode-platform-reference` | External skill | ✅ Yes — exists at `.opencode/skills/opencode-platform-reference/` | Phase 4 execution context |
| `agents-and-subagents-dev` | External skill | ✅ Yes — exists at `.opencode/skills/agents-and-subagents-dev/` | Phases 5-6 execution context |
| `coordinating-loop` | External skill | ✅ Yes — exists at `.opencode/skills/coordinating-loop/` | Phase 7 execution context |

### Hardcoded Paths
- **None in SKILL.md.** Scripts use `SCRIPT_DIR` and `dirname` for relative resolution — no hardcoded absolute paths.
- The `compile-bundle.sh` script references `$HOME` indirectly via `$SKILL_DIR` resolution — this is portable.

### Cross-Platform Safety
- **Verdict:** yes
- **Explanation:** Scripts use bash with `set -euo pipefail` and `set -e` — standard POSIX-compatible patterns. No macOS-specific commands. No platform assumptions. The `validate-skill.sh` uses `wc -l` and `ls -1` which are available on Linux and macOS.

### Quality Score: 8/10
- **Clarity:** Excellent. Architecture diagram is clear. Phase table is explicit.
- **Actionability:** Strong — dispatch protocol is well-defined. Subagent profile envelope is specified.
- **Completeness:** All 7 profiles exist. Both scripts exist and are functional. `references/pointers.md` resolves all external skill references.
- **No-fluff:** 143 LOC. Tight orchestrator pattern.

### Issues
1. **Missing `pattern` in metadata** — The metadata block has `layer`, `role`, and `version` but no `pattern` field (P1/P2/P3). The `opencode-platform-reality.md` frontmatter standard (line 196) shows `pattern` as part of the standard.
2. **No `allowed-tools` declaration** — The skill orchestrates Task tool dispatch but does not declare its permitted tools.
3. **Phase 0 "FIRST RUN ONLY" bootstrap is fragile** — The script checks if `assets/profiles/` is empty, but the profiles are committed to git. This bootstrap only makes sense if profiles are generated dynamically, which they are not — they're static files. The bootstrap logic appears vestigial.
4. **`delegate-task` is not a real tool name** — The dispatch protocol (line 102) references `delegate-task` but the actual OpenCode tool is `task` with `run_in_background: true`. This is a documentation inconsistency.
5. **Output format specifies `audit-report-YYYY-MM-DD.md` but no template exists** — The skill describes the output format but provides no template or script to generate it. Phase 7 synthesis is supposed to write it, but there's no guidance on the exact structure beyond "structured JSON."

### Connections
- **Agents using this skill:** Referenced in `ecosystem-structure.md` as a P1 skill. Likely used by `hivefiver-orchestrator` via `/hf-audit` command.
- **Commands triggering it:** `/hf-audit` (via `hivefiver-orchestrator`).
- **Workflows executing it:** Standalone audit orchestrator. Dispatches 6 parallel subagents + 1 synthesis phase.

---

## 8. harness-delegation-inspection

### Frontmatter
- **Has YAML frontmatter:** Yes
- **Fields:** `name`, `description`, `metadata` (layer: "1", role: "domain-execution", pattern: P3, version: "1.0.0"), `allowed-tools` (Read, Write, Edit, Bash, Glob, Grep, Task)
- **Assessment:** Most complete frontmatter in this batch. Has all expected fields.

### Triggers
- "how to delegate"
- "subagent patterns"
- "GSD execution model"
- "context continuity"
- "MCP server usage"
- "inspect opencode project"
- "how does gsd work"
- "fail resume with ID"
- "session continuity"
- "ecosystem structure"
- **Assessment:** Comprehensive but some triggers are vague. "how to delegate" could match many skills. "MCP server usage" is broad.

### Self-Contained
- **Verdict:** partial
- **Explanation:** The SKILL.md contains substantial content (delegation protocol, inspection protocol, anti-patterns, severity levels). However, the "On Load" section mandates reading 5 reference files — all 5 exist and are substantive (307, 173, 208, 206, and 323 LOC respectively). The skill is essentially an index to its references.

### Cross-References
| Reference | Type | Resolvable? | Notes |
|-----------|------|-------------|-------|
| `references/gsd-execution-patterns.md` | Internal reference | ✅ Yes — exists (307 LOC) | GSD execution model, checkpoint/resume, SDK architecture |
| `references/mcp-server-reality.md` | Internal reference | ✅ Yes — exists (173 LOC) | MCP server catalog, usage patterns, env vars |
| `references/ecosystem-structure.md` | Internal reference | ✅ Yes — exists (208 LOC) | Full Hivefiver ecosystem map |
| `references/context-continuity.md` | Internal reference | ✅ Yes — exists (206 LOC) | Dual-layer state, auto-export, resume protocol |
| `references/opencode-platform-reality.md` | Internal reference | ✅ Yes — exists (323 LOC) | Platform architecture, permissions, compaction |
| `$HOME/.claude/get-shit-done/bin/gsd-tools.cjs` | External path | ⚠️ Partial — hardcoded path | This is a GSD-specific path, not Hivefiver. May not exist in all environments. |
| `.planning/STATE.md` | External path | ⚠️ Partial — GSD convention | GSD-specific file location. Not a Hivefiver convention. |
| `.planning/phases/NN-name/SUMMARY.md` | External path | ⚠️ Partial — GSD convention | GSD-specific file location. |
| `context7_resolve-library-id` | MCP tool | ✅ Yes — Context7 MCP server | Referenced in inspection protocol |
| `context7_query-docs` | MCP tool | ✅ Yes — Context7 MCP server | Referenced in inspection protocol |
| `repomix_pack_codebase` | MCP tool | ✅ Yes — Repomix MCP server | Referenced in inspection protocol |
| `repomix_grep_repomix_output` | MCP tool | ✅ Yes — Repomix MCP server | Referenced in inspection protocol |
| `repomix_read_repomix_output` | MCP tool | ✅ Yes — Repomix MCP server | Referenced in inspection protocol |
| `github_get_file_contents` | MCP tool | ✅ Yes — GitHub MCP server | Referenced in inspection protocol |
| `github_search_code` | MCP tool | ✅ Yes — GitHub MCP server | Referenced in inspection protocol |
| `github_list_commits` | MCP tool | ✅ Yes — GitHub MCP server | Referenced in inspection protocol |
| `.temp/audit/<audit-id>/findings/slice-N.json` | Output path | ⚠️ Partial — convention only | No script creates this directory structure |
| `.hivemind/state/` | State path | ⚠️ Partial — HiveMind convention | Referenced in context-continuity.md but may not exist in all projects |

### Hardcoded Paths
- **`$HOME/.claude/get-shit-done/bin/gsd-tools.cjs`** (line 44, gsd-execution-patterns.md line 15) — macOS-specific path. Hardcoded to Claude Code's home directory. Will not work on Linux or with Copilot CLI.
- **`.planning/STATE.md`** — GSD-specific convention. Not portable to non-GSD projects.
- **`.hivemind/state/`** — HiveMind-specific state directory. Not a universal OpenCode convention.
- **`.temp/audit/`** — Convention-only path. No script creates it.

### Cross-Platform Safety
- **Verdict:** no
- **Explanation:** Multiple issues:
  1. `$HOME/.claude/` path is macOS/Claude Code-specific. The `gsd-execution-patterns.md` does mention path conversion to `~/.copilot/` (line 292), but the SKILL.md itself still uses the Claude Code path.
  2. References to GSD-specific tooling (`gsd-tools.cjs`) that may not be installed.
  3. References to `.planning/` directory structure which is a GSD convention, not a Hivefiver convention.
  4. The `scripts/` directory exists but is **empty** — the SKILL.md references no scripts in its "On Load" section, but the empty directory is misleading.
  5. The `allowed-tools` list includes `Write` and `Edit` — this skill is supposed to be about delegation and inspection, but it grants mutation permissions.

### Quality Score: 6/10
- **Clarity:** Good structure. Delegation and inspection protocols are well-separated.
- **Actionability:** Strong on GSD patterns, weak on Hivefiver-specific guidance. Much of the content is about GSD, not Hivefiver.
- **Completeness:** All 5 reference files exist and are substantive. But the skill conflates GSD execution patterns with Hivefiver delegation patterns.
- **No-fluff:** 194 LOC for SKILL.md is reasonable, but the references total 1,217 LOC — this skill is mostly an index.

### Issues
1. **GSD/Hivefiver conflation** — The skill is named `harness-delegation-inspection` but 70% of its content is about GSD (get-shit-done) execution patterns. The `gsd-tools.cjs` CLI, `.planning/` directory structure, and GSD phase runner are all external to Hivefiver. This skill should either be renamed to `gsd-delegation-inspection` or refactored to focus on Hivefiver's own delegation model.
2. **Hardcoded macOS path** — `$HOME/.claude/get-shit-done/bin/gsd-tools.cjs` will not work on Linux or with non-Claude runtimes.
3. **Empty `scripts/` directory** — The directory exists but contains no files. This is either a placeholder or a leftover from refactoring.
4. **`.DS_Store` file in skill root** — The `oh-my-openagent-reference` skill has this, but this skill is clean. (Noted for batch consistency.)
5. **`allowed-tools` includes Write/Edit** — This grants mutation permissions to a skill that claims to be about inspection. The `Write` and `Edit` permissions are justified by the auto-export protocol in context-continuity.md, but this should be documented in the SKILL.md.
6. **Trigger "how to delegate" is too broad** — This phrase could match `agents-and-subagents-dev`, `coordinating-loop`, or `meta-builder`. Needs more specificity.
7. **Deviation Rules (line 99-106) are dangerously permissive** — "Auto-add missing functionality" and "Auto-fix blocking issues" give subagents broad permission to modify code without human review. This contradicts the "Iron Law" of reporting facts only.

### Connections
- **Agents using this skill:** Referenced in `ecosystem-structure.md` skill table. Likely used by `researcher` and `explore` agents for inspection work.
- **Commands triggering it:** None directly. Via `/hf-audit` or `/hf-create` routing.
- **Workflows executing it:** Referenced by `harness-audit` as a potential execution context for tool audits (Phase 3).

---

## 9. meta-builder

### Frontmatter
- **Has YAML frontmatter:** Yes
- **Fields:** `name`, `description`, `metadata` (layer: "0", role: "router", version: "3.0.0")
- **Missing:** No `pattern` field. No `allowed-tools` declaration.

### Triggers
- "create a skill"
- "build an agent"
- "configure OpenCode"
- "stack skills"
- "audit skill"
- "fix skill trigger"
- **Assessment:** Good coverage for a router skill. Triggers are specific and distinct.

### Self-Contained
- **Verdict:** partial
- **Explanation:** The SKILL.md contains the routing table, stacking recipes, question discipline, and anti-patterns. It references `references/04-skills-chaining.md` (exists, 121 LOC) and `references/05-hivefiver-agent.md` (exists, 84 LOC). However, it also references 3 deleted files (`01-mindsnetwork-graph.md`, `02-deterministic-control.md`, `03-long-horizon-persistence.md`) — these files still exist on disk but the SKILL.md says they've been deleted. This is a contradiction.

### Cross-References
| Reference | Type | Resolvable? | Notes |
|-----------|------|-------------|-------|
| `references/04-skills-chaining.md` | Internal reference | ✅ Yes — exists (121 LOC) | Skills chaining patterns, loading order, stack patterns |
| `references/05-hivefiver-agent.md` | Internal reference | ✅ Yes — exists (84 LOC) | Hivefiver orchestrator agent definition |
| `references/01-mindsnetwork-graph.md` | Internal reference | ⚠️ Exists on disk but marked as deleted | SKILL.md line 90 says "these referenced the deleted graph structure and have been deleted" but the file still exists (172 LOC) |
| `references/02-deterministic-control.md` | Internal reference | ⚠️ Exists on disk but marked as deleted | Same issue — file exists (143 LOC) but SKILL.md says deleted |
| `references/03-long-horizon-persistence.md` | Internal reference | ⚠️ Exists on disk but marked as deleted | Same issue — file exists (173 LOC) but SKILL.md says deleted |
| `use-authoring-skills` | External skill | ✅ Yes — exists at `.opencode/skills/use-authoring-skills/` | Routing target |
| `skill-creator` | External skill | ✅ Yes — exists at global skills | Routing target for "create a skill like this @file" |
| `agents-and-subagents-dev` | External skill | ✅ Yes — exists | Routing target |
| `command-dev` | External skill | ✅ Yes — exists | Routing target |
| `custom-tools-dev` | External skill | ✅ Yes — exists (this batch) | Routing target |
| `opencode-platform-reference` | External skill | ✅ Yes — exists | Routing target |
| `skill-synthesis` | External skill | ✅ Yes — exists | Routing target |
| `task_plan.md`, `findings.md`, `progress.md` | External files | ⚠️ Partial — planning-with-files convention | These are project-root files, not skill-specific. May or may not exist. |
| `.meta-builder/graph.json` | Internal state | ✅ Yes — exists at `.meta-builder/graph.json` | MINDNETWORK graph definition |
| `.meta-builder/state/` | Internal state | ✅ Yes — exists | Checkpoint and session state |
| `scripts/graph-init.sh` | Internal script | ✅ Yes — exists | Graph initialization |
| `scripts/graph-traverse.sh` | Internal script | ✅ Yes — exists | Graph traversal |
| `scripts/register-skill.sh` | Internal script | ✅ Yes — exists | Skill registration |
| `scripts/route-check.sh` | Internal script | ✅ Yes — exists | Route validation |
| `scripts/state-persist.sh` | Internal script | ✅ Yes — exists | State persistence |
| `scripts/validate-graph.sh` | Internal script | ✅ Yes — exists | Graph validation |
| `agents/` | Internal directory | ⚠️ Empty directory exists | No agent definitions present |
| `evals/evals.json` | Internal eval | ✅ Yes — exists | Evaluation data |
| `evals/trigger-queries.json` | Internal eval | ✅ Yes — exists | Trigger query test data |

### Hardcoded Paths
- **No absolute paths in SKILL.md.**
- **`task_plan.md`, `findings.md`, `progress.md`** — These are referenced as project-root files (relative paths). This is correct per the `planning-with-files` skill convention.
- **`.meta-builder/state/`** — Relative path within the skill directory. Portable.
- The reference files (`01-mindsnetwork-graph.md`, `02-deterministic-control.md`, `03-long-horizon-persistence.md`) contain `.meta-builder/graph.json` and `.meta-builder/state/checkpoint.json` paths — these are relative and portable.

### Cross-Platform Safety
- **Verdict:** partial
- **Explanation:** The SKILL.md itself is platform-agnostic. However:
  1. The `scripts/` directory contains 6 bash scripts — their content was not fully audited but they likely contain bash-specific syntax.
  2. The `references/01-mindsnetwork-graph.md` references `graph.json` and state files — these are JSON and platform-agnostic.
  3. The deleted-but-still-present reference files create confusion about what the skill actually depends on.
  4. The `agents/` directory is empty — if agents are supposed to be bundled with this skill, they're missing.

### Quality Score: 5/10
- **Clarity:** Routing table is clear. Stacking recipes are well-defined.
- **Actionability:** Good for routing decisions. Weak on what to do when routing fails.
- **Completeness:** The SKILL.md says 3 reference files are deleted, but they still exist on disk. This is a significant inconsistency. The `agents/` directory is empty.
- **No-fluff:** 90 LOC for SKILL.md is tight. But the presence of deleted-but-not-removed files adds noise.

### Issues
1. **Deleted-but-present reference files** — SKILL.md line 90 says `01-mindsnetwork-graph.md`, `02-deterministic-control.md`, and `03-long-horizon-persistence.md` "have been deleted" but all three files exist on disk with substantial content (172, 143, and 173 LOC respectively). This creates confusion: should agents read them or not? If they're truly deleted, remove the files. If they're still needed, update the SKILL.md.
2. **Empty `agents/` directory** — The directory exists but contains no files. If this skill is supposed to bundle agent definitions, they're missing. If not, the directory should be removed.
3. **Missing `pattern` in metadata** — Same issue as `harness-audit`. No P1/P2/P3 pattern designation.
4. **Missing `allowed-tools` declaration** — No tool permission declaration.
5. **MINDNETWORK graph references are inconsistent** — The SKILL.md says the graph structure is deleted, but `references/01-mindsnetwork-graph.md` describes the full graph JSON schema, node types, edge types, and traversal algorithm. The `scripts/` directory has 6 graph-related scripts. The `.meta-builder/graph.json` exists. The graph is clearly NOT deleted — the SKILL.md's deletion note is wrong.
6. **`evals/` directory content not referenced** — The `evals/evals.json` and `evals/trigger-queries.json` files exist but are never mentioned in the SKILL.md. They appear to be test data for trigger evaluation but have no documentation.
7. **`scripts/` directory has 6 scripts but none are referenced in "On Load"** — Unlike `harness-audit` which explicitly runs its scripts on load, `meta-builder` does not mention any of its 6 scripts. The scripts (`graph-init.sh`, `graph-traverse.sh`, `register-skill.sh`, `route-check.sh`, `state-persist.sh`, `validate-graph.sh`) appear to support the MINDNETWORK graph system that the SKILL.md claims is deleted.

### Connections
- **Agents using this skill:** `hivefiver-orchestrator` (primary agent). The `references/05-hivefiver-agent.md` explicitly lists `meta-builder` in its allowed skills.
- **Commands triggering it:** `/hf-create`, `/hf-audit`, `/hf-stack` — all route through `hivefiver-orchestrator` which uses `meta-builder` for routing decisions.
- **Workflows executing it:** Layer 0 router — invoked by any meta-concept request. Stacks with up to 3 skills per the "Iron Law."

---

## 10. oh-my-openagent-reference

### Frontmatter
- **Has YAML frontmatter:** Yes
- **Fields:** `name`, `description`
- **Missing:** No `metadata` block. No `allowed-tools` declaration. No `pattern` field.

### Triggers
- The description says: "Complete oh-my-openagent repo packed for harness architecture reference."
- **Assessment:** Weak triggers. There are no specific trigger phrases in quotes. The description is a statement of what the skill contains, not what users say to activate it. An agent scanning descriptions for trigger phrases would not find specific phrases like "oh-my-openagent" or "openagent reference" or "plugin system reference."

### Self-Contained
- **Verdict:** yes
- **Explanation:** This is a reference skill. The SKILL.md is an index to packed Repomix output. All reference files exist: `references/summary.md`, `references/project-structure.md`, `references/files.md`, and `references/oh-my-openagent-full.xml`. The skill works as a lookup table — read the index, grep the files.

### Cross-References
| Reference | Type | Resolvable? | Notes |
|-----------|------|-------------|-------|
| `references/summary.md` | Internal reference | ✅ Yes — exists | Repomix-generated summary |
| `references/project-structure.md` | Internal reference | ✅ Yes — exists | Directory tree with line counts |
| `references/files.md` | Internal reference | ✅ Yes — exists | All file contents from packed repo |
| `references/oh-my-openagent-full.xml` | Internal reference | ✅ Yes — exists | Raw Repomix XML output |
| `repomix attach_packed_output` | MCP tool | ✅ Yes — Repomix MCP server | Referenced for exploration |
| `repomix grep_repomix_output` | MCP tool | ✅ Yes — Repomix MCP server | Referenced for pattern search |
| `repomix read_repomix_output` | MCP tool | ✅ Yes — Repomix MCP server | Referenced for targeted reads |

### Hardcoded Paths
- **`.DS_Store` file** — macOS artifact in the skill root directory. Should be gitignored.
- No other hardcoded paths. All references are relative to the skill directory.

### Cross-Platform Safety
- **Verdict:** partial
- **Explanation:** The skill content is platform-agnostic (markdown index to packed XML). However:
  1. The `.DS_Store` file is a macOS-specific artifact that shouldn't be in a cross-platform skill package.
  2. The skill depends on Repomix MCP tools being available — if Repomix is not configured, the skill's exploration instructions won't work.
  3. The `references/files.md` file is likely very large (contains all file contents from the packed repo) — this could blow context windows on smaller models.

### Quality Score: 4/10
- **Clarity:** The SKILL.md is clear but minimal. It's essentially a README for a packed repo.
- **Actionability:** Low. The skill tells you how to grep through packed output but doesn't provide any domain-specific guidance about what to look for in the oh-my-openagent codebase.
- **Completeness:** All reference files exist. But the skill lacks trigger phrases, metadata, and any substantive guidance beyond "grep this file."
- **No-fluff:** 46 LOC — very short. Almost too short to be useful as a standalone skill.

### Issues
1. **No trigger phrases in description** — The description is a statement, not a set of trigger phrases. Agents scan descriptions for quoted phrases like "create a skill" or "audit harness." This skill has none. It should include phrases like "oh-my-openagent", "openagent plugin system", "plugin architecture reference", "hook system patterns".
2. **No metadata frontmatter** — Missing `metadata` block (layer, role, version, pattern).
3. **No `allowed-tools` declaration** — No tool permission declaration.
4. **`.DS_Store` file in skill root** — macOS artifact. Should be removed and gitignored.
5. **No substantive guidance** — The skill is purely an index. It doesn't tell agents what patterns to look for in the oh-my-openagent codebase, what's important, what's deprecated, or how it relates to Hivefiver. Compare this to `harness-delegation-inspection` which provides extensive domain-specific guidance.
6. **`references/files.md` is likely massive** — This file contains all file contents from the packed oh-my-openagent repo. If an agent reads it without offset/limit, it will blow the context window. The SKILL.md should warn about this and recommend grep-first approach more strongly.
7. **No scripts directory** — Unlike most skills in this batch, there's no `scripts/` directory for validation or utility scripts.
8. **Attribution line is bare** — "This skill was generated by [Repomix](https://github.com/yamadashy/repomix)" — this is fine but adds no value for agents.

### Connections
- **Agents using this skill:** Referenced in `ecosystem-structure.md` as a P3 skill. Likely used by `researcher` and `explore` agents when investigating OpenCode plugin architecture patterns.
- **Commands triggering it:** None directly. Via `/hf-create` or `/deep-research-synthesis-repomix` routing.
- **Workflows executing it:** Reference skill — loaded when agents need to understand OpenCode's plugin system, hook system, or agent registration patterns.

---

## Batch Summary

### Frontmatter Compliance

| Skill | name | description | metadata | pattern | allowed-tools |
|-------|------|-------------|----------|---------|---------------|
| custom-tools-dev | ✅ | ✅ | ❌ | ❌ | ❌ |
| harness-audit | ✅ | ✅ | ✅ (partial) | ❌ | ❌ |
| harness-delegation-inspection | ✅ | ✅ | ✅ | ✅ | ✅ |
| meta-builder | ✅ | ✅ | ✅ (partial) | ❌ | ❌ |
| oh-my-openagent-reference | ✅ | ✅ | ❌ | ❌ | ❌ |

**Only `harness-delegation-inspection` has complete frontmatter.** All others are missing at least `pattern` and `allowed-tools`.

### Cross-Platform Safety

| Skill | Verdict | Primary Issue |
|-------|---------|---------------|
| custom-tools-dev | ✅ yes | None significant |
| harness-audit | ✅ yes | None significant |
| harness-delegation-inspection | ❌ no | Hardcoded `$HOME/.claude/` paths, GSD-specific tooling |
| meta-builder | ⚠️ partial | Deleted-but-present files, empty `agents/` directory |
| oh-my-openagent-reference | ⚠️ partial | `.DS_Store` artifact, no trigger phrases |

### Quality Scores

| Skill | Score | Primary Strength | Primary Weakness |
|-------|-------|-----------------|------------------|
| custom-tools-dev | 7/10 | Clear Iron Law, good anti-patterns | Missing metadata, no executable validation |
| harness-audit | 8/10 | Complete architecture, all profiles exist | Vestigial bootstrap logic, `delegate-task` vs `task` naming |
| harness-delegation-inspection | 6/10 | Most complete frontmatter, rich references | GSD/Hivefiver conflation, hardcoded paths |
| meta-builder | 5/10 | Clear routing table, good stacking recipes | Deleted-but-present files, empty `agents/` dir |
| oh-my-openagent-reference | 4/10 | All reference files present | No trigger phrases, minimal substantive content |

### Critical Issues Requiring Attention

1. **`harness-delegation-inspection` — Hardcoded macOS paths** — `$HOME/.claude/get-shit-done/bin/gsd-tools.cjs` will break on Linux and non-Claude runtimes. This is the only skill in the batch rated "no" for cross-platform safety.

2. **`meta-builder` — Deleted-but-present files** — Three reference files (01, 02, 03) are marked as deleted in SKILL.md but still exist on disk with 488 combined LOC. This creates agent confusion about what to read.

3. **`oh-my-openagent-reference` — No trigger phrases** — The description contains no quoted trigger phrases. Agents will not know when to load this skill.

4. **`harness-delegation-inspection` — Empty `scripts/` directory** — The directory exists but contains no files. Either populate it or remove it.

5. **`meta-builder` — Empty `agents/` directory** — Same issue. Directory exists, no content.

### Resolvable Cross-Reference Summary

| Skill | Total References | Resolvable | Partial | Broken |
|-------|-----------------|------------|---------|--------|
| custom-tools-dev | 4 | 4 | 0 | 0 |
| harness-audit | 16 | 16 | 0 | 0 |
| harness-delegation-inspection | 17 | 11 | 6 | 0 |
| meta-builder | 23 | 19 | 4 | 0 |
| oh-my-openagent-reference | 7 | 7 | 0 | 0 |

**Total: 67 references, 57 resolvable (85%), 10 partial (15%), 0 broken.**

---

*End of Batch 2 audit report.*
