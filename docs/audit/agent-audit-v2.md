# Agent Audit V2 — Hivefiver Agent Lab

**Date:** 2026-04-07  
**Scope:** 22 agent definition files in `.hivefiver-meta-builder/agents-lab/active/refactoring/` + 1 orchestrator copy  
**Method:** Full read + cross-reference validation against OpenCode platform reference, permissions reference, existing commands, workflows, and archived skills  

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Total agents audited | 22 |
| Agents with valid frontmatter | 17 |
| Agents with broken cross-refs | 13 |
| Agents with duplicate/overlap content | 6 |
| Agents with invalid permissions | 5 |
| Agents with zero skill/command/workflow connections (orphaned) | 4 |
| Agents with hardcoded platform paths | 3 |
| Agents with self-containment issues | 2 |
| **Overall health:** | **41% pass (9/22 clean)** |

---

## Valid OpenCode Permission Keys (from platform reference)

The following are valid permission keys in OpenCode:

`read`, `edit`, `bash`, `task`, `skill`, `glob`, `grep`, `list`, `webfetch`, `websearch`, `codesearch`, `external_directory`, `doom_loop`, `lsp`, `question`, `patch` (alias for edit)

Valid values: `"allow"`, `"ask"`, `"deny"`, or object with pattern → value mapping.

**Invalid permission keys found in this audit:**
- `delegate-task` — NOT a valid OpenCode permission key (should be `task`)
- `offset-read` — NOT a valid OpenCode permission key
- `patch` — valid but alias for `edit`; redundant if `edit` also present
- `todoread` / `todowrite` — NOT valid permission keys (these are tool names, not permissions)
- `webbrowse` — NOT a valid OpenCode permission key (should be `webfetch`)

---

## Per-Agent Scorecard

Legend: ✅ PASS | ❌ FAIL | ⚠️ PARTIAL | 🔴 CRITICAL

### 1. builder.md

| Check | Status | Detail |
|-------|--------|--------|
| Frontmatter validity | ✅ | Valid YAML, all required fields present |
| Cross-references resolve | ⚠️ `instructions` refs `.opencode/rules/anti-patterns.md`, `opencode/rules/execution-loop.md` (missing leading dot), `.opencode/rules/skill-activation.md` — verify existence |
| No duplicates | ✅ | Unique content |
| Tool permissions valid | ✅ | All keys are valid OpenCode permissions |
| Role distinct | ✅ | Clear implementation specialist role |
| Connects to ≥1 resource | ✅ | Referenced by conductor.md, coordinator.md, hivefiver-orchestrator.md, ultrawork.md, hf-prompt-enhance.md |
| No hardcoded paths | ✅ | Uses relative paths only |
| Self-contained | ✅ | Complete role, workflow, rules, output contract |

**Score: 7.5/8** — Minor issue with inconsistent path prefix in `instructions` (one entry missing leading dot).

---

### 2. conductor.md

| Check | Status | Detail |
|-------|--------|--------|
| Frontmatter validity | ✅ | Valid YAML |
| Cross-references resolve | ✅ | Delegates to `researcher`, `builder`, `critic` — all exist |
| No duplicates | ❌ **Description is IDENTICAL to coordinator.md** — "Primary orchestrator. Receives tasks, classifies intent, delegates to specialists, and maintains wisdom across sessions. Does not implement directly." |
| Tool permissions valid | ❌ `delegate-task` is NOT a valid OpenCode permission key (should be `task`) |
| Role distinct | ❌ **Overlaps with coordinator.md** — both claim to be "primary orchestrator" with same description |
| Connects to ≥1 resource | ✅ | Invoked by ultrawork.md, plan.md, start-work.md, harness-doctor.md |
| No hardcoded paths | ✅ | `.harness/wisdom/` is relative |
| Self-contained | ✅ | Complete workflow |

**Score: 5/8** — Duplicate description with coordinator, invalid `delegate-task` permission key.

---

### 3. context-mapper.md

| Check | Status | Detail |
|-------|--------|--------|
| Frontmatter validity | ✅ | Valid YAML |
| Cross-references resolve | ⚠️ `instructions` refs may not exist |
| No duplicates | ✅ | Unique content |
| Tool permissions valid | ✅ | Valid keys, valid patterns |
| Role distinct | ✅ | Clear reference-grounding role |
| Connects to ≥1 resource | ⚠️ Only connected via prompt-enhance.md workflow lanes. No command directly invokes it. |
| No hardcoded paths | ✅ | All relative |
| Self-contained | ✅ | Complete role and workflow |

**Score: 7/8** — Weak connection: only referenced in workflow, no command entry point.

---

### 4. context-purifier.md

| Check | Status | Detail |
|-------|--------|--------|
| Frontmatter validity | ✅ | Valid YAML |
| Cross-references resolve | ⚠️ `instructions` refs may not exist |
| No duplicates | ✅ | Unique content |
| Tool permissions valid | ✅ | Valid keys, valid patterns |
| Role distinct | ✅ | Clear distillation role |
| Connects to ≥1 resource | ⚠️ Only connected via prompt-enhance.md workflow lanes |
| No hardcoded paths | ✅ | All relative |
| Self-contained | ✅ | Complete role and workflow |

**Score: 7/8** — Same weakness as context-mapper.

---

### 5. coordinator.md

| Check | Status | Detail |
|-------|--------|--------|
| Frontmatter validity | 🔴 **CRITICAL** — Uses `instruction:` (singular, not `instructions:`) with glob pattern `.opencode/rules/*.md` — valid YAML but non-standard field name |
| Cross-references resolve | ❌ References skills that DON'T EXIST in active directory: `meta-builder`, `hivefiver`, `planning-with-files`, `coordinating-loop`, `use-authoring-skills`, `user-intent-interactive-loop`, `opencode-platform-reference`, `repomix-exploration-guide`, `opencode-non-interactive-shell`, `repomix-explorer`, `skill-synthesis`, `agents-and-subagents-dev`, `command-dev`, `custom-tools-dev` — ALL are in `.archive` directories |
| No duplicates | 🔴 **CRITICAL** — File contains DUPLICATE Task_Management sections (lines ~55-113 and ~116-166). Contains duplicate `permission:` blocks (the second overrides the first). Contains malformed markdown with backtick escaping (`\Todowrite\``). Body content appears to be injected TypeScript code from `buildDefaultSisyphusPrompt()` function — not agent instructions. |
| Tool permissions valid | ⚠️ `patch` is valid but redundant with `edit`. First `permission` block has `read: {"*": deny, "*.json": allow, "*.md": allow}` but second block has `read: allow` — the second overrides, making the first useless. |
| Role distinct | ❌ **Description is IDENTICAL to conductor.md** — "Primary orchestrator. Receives tasks, classifies intent, delegates to specialists, and maintains wisdom across sessions. Does not implement directly." |
| Connects to ≥1 resource | ⚠️ No command directly invokes coordinator.md |
| No hardcoded paths | ✅ | All relative |
| Self-contained | ❌ **Body content is corrupted** — contains TypeScript function code (`export function buildDefaultSisyphusPrompt(...)`) mixed with agent instructions, XML tags (`<Role>`, `<Behavior_Instructions>`), and duplicate todo management sections |

**Score: 1.5/8** — 🔴 CRITICAL: structural corruption, dead skill references, duplicate frontmatter blocks, TypeScript code injection.

---

### 6. critic.md

| Check | Status | Detail |
|-------|--------|--------|
| Frontmatter validity | ✅ | Valid YAML, all fields present |
| Cross-references resolve | ⚠️ `instructions` refs: `.opencode/rules/anti-patterns.md`, `opencode/rules/execution-loop.md` (missing leading dot), `.opencode/rules/skill-activation.md` |
| No duplicates | ✅ | Unique, well-structured content |
| Tool permissions valid | ✅ | All valid keys |
| Role distinct | ✅ | Clear quality verification role |
| Connects to ≥1 resource | ✅ | Referenced by conductor.md, hivefiver-orchestrator.md, intent-loop.md, prompt-repackager.md, spec-verifier.md, risk-assessor.md |
| No hardcoded paths | ✅ | All relative |
| Self-contained | ✅ | Complete review process, output format, rules |

**Score: 7.5/8** — Minor path inconsistency in instructions.

---

### 7. explore.md

| Check | Status | Detail |
|-------|--------|--------|
| Frontmatter validity | 🔴 **CRITICAL** — Duplicate `todoread: allow` and `todowrite: allow` entries (lines 22-25). `todoread`/`todowrite` are NOT valid OpenCode permission keys. `webbrowse` is NOT a valid permission key (should be `webfetch`). |
| Cross-references resolve | ✅ | References tools that exist in OpenCode |
| No duplicates | 🔴 **CRITICAL** — File content after line ~108 is IDENTICAL to researcher.md — both contain the same 300+ line "Opencode Tool Taxonomy" reference document (Parts I-IV with mermaid diagrams) |
| Tool permissions valid | ❌ Invalid keys: `todoread`, `todowrite`, `webbrowse` |
| Role distinct | ❌ **Near-identical to researcher.md** — both are "repository investigator" with same workflow, same tool taxonomy |
| Connects to ≥1 resource | ✅ | Referenced by coordinator.md, hivefiver-orchestrator.md, researcher.md, deep-init.md |
| No hardcoded paths | ✅ | All relative |
| Self-contained | ❌ Agent definition is ~108 lines; remaining 300+ lines are a reference document, not agent instructions |

**Score: 2.5/8** — 🔴 CRITICAL: near-duplicate of researcher.md, invalid permission keys, bloat.

---

### 8. hivefiver-agent-builder.md

| Check | Status | Detail |
|-------|--------|--------|
| Frontmatter validity | ⚠️ Uses `name:` field (non-standard — OpenCode uses filename as name). Uses `instruction:` (singular, not `instructions:`) |
| Cross-references resolve | ✅ | References `agents-and-subagents-dev`, `opencode-platform-reference`, `opencode-non-interactive-shell` — all exist (in archive) |
| No duplicates | ✅ | Unique content |
| Tool permissions valid | ✅ | All valid keys |
| Role distinct | ✅ | Clear agent creation specialist |
| Connects to ≥1 resource | ✅ | Referenced by hivefiver-orchestrator.md, connected to create.md workflow |
| No hardcoded paths | ⚠️ References `.codexdisabled/agents/` — non-standard path; also `.skills-lab/active/refactoring-skills/` which doesn't exist |
| Self-contained | ✅ | Complete workflow, templates, validation |

**Score: 6.5/8** — Non-standard frontmatter field names, references non-existent paths.

---

### 9. hivefiver-command-builder.md

| Check | Status | Detail |
|-------|--------|--------|
| Frontmatter validity | ⚠️ Uses `name:` (non-standard), `instruction:` (singular) |
| Cross-references resolve | ✅ | References `command-dev`, `opencode-non-interactive-shell`, `opencode-platform-reference` — exist (in archive) |
| No duplicates | ✅ | Unique content |
| Tool permissions valid | ✅ | All valid keys |
| Role distinct | ✅ | Clear command creation specialist |
| Connects to ≥1 resource | ✅ | Referenced by hivefiver-orchestrator.md, connected to create.md workflow |
| No hardcoded paths | ⚠️ References `.skills-lab/active/refactoring-skills/command-dev/` which doesn't exist |
| Self-contained | ✅ | Complete workflow, templates, validation |

**Score: 6.5/8** — Same pattern as agent-builder.

---

### 10. hivefiver-orchestrator.md

| Check | Status | Detail |
|-------|--------|--------|
| Frontmatter validity | ⚠️ Uses `name:` (non-standard), `instructions:` (correct plural) with glob |
| Cross-references resolve | ❌ References `skill-judge` skill — DOES NOT EXIST anywhere in the project. References `skill-synthesis` — exists only in archive. |
| No duplicates | ✅ | Unique orchestrator content |
| Tool permissions valid | ✅ | All valid keys |
| Role distinct | ⚠️ Overlaps significantly with hivefiver.md — both are "orchestrator" meta-agents |
| Connects to ≥1 resource | ✅ | Invoked by hf-audit.md, hf-create.md, hf-prompt-enhance.md, hf-stack.md |
| No hardcoded paths | ✅ | All relative |
| Self-contained | ✅ | Complete routing table, delegation protocol, workflow |

**Score: 6/8** — Dead reference to `skill-judge`, role overlap with hivefiver.md.

---

### 11. hivefiver-skill-author.md

| Check | Status | Detail |
|-------|--------|--------|
| Frontmatter validity | ⚠️ Uses `name:` (non-standard), `instruction:` (singular) |
| Cross-references resolve | ❌ References `skill-judge` and `skill-creator` skills — NEITHER EXISTS in project |
| No duplicates | ✅ | Unique content |
| Tool permissions valid | ❌ References non-existent skills `skill-judge` and `skill-creator` in skill permission allowlist |
| Role distinct | ✅ | Clear skill creation specialist |
| Connects to ≥1 resource | ✅ | Referenced by hivefiver-orchestrator.md, connected to create.md workflow |
| No hardcoded paths | ⚠️ References `.skills-lab/active/refactoring-skills/use-authoring-skills/` which doesn't exist |
| Self-contained | ✅ | Complete workflow, patterns, validation |

**Score: 5/8** — Two dead skill references (`skill-judge`, `skill-creator`).

---

### 12. hivefiver-tool-builder.md

| Check | Status | Detail |
|-------|--------|--------|
| Frontmatter validity | ✅ | Valid YAML, uses `instructions:` (correct plural) |
| Cross-references resolve | ✅ | References `custom-tools-dev`, `opencode-platform-reference`, `opencode-non-interactive-shell` — exist (in archive) |
| No duplicates | ✅ | Unique content |
| Tool permissions valid | ✅ | All valid keys |
| Role distinct | ✅ | Clear tool creation specialist |
| Connects to ≥1 resource | ✅ | Referenced by hivefiver-orchestrator.md routing table, connected to create.md workflow |
| No hardcoded paths | ✅ | All relative |
| Self-contained | ✅ | Complete workflow, templates, validation |

**Score: 8/8** — Clean file. Best-structured of the hivefiver specialist agents.

---

### 13. hivefiver.md

| Check | Status | Detail |
|-------|--------|--------|
| Frontmatter validity | ⚠️ Duplicate skill entries: `repomix-exploration-guide` appears twice, `opencode-platform-reference` appears twice |
| Cross-references resolve | ❌ References `hivefiver` as a skill in its own skill allowlist (self-reference). All referenced skills are in archive. |
| No duplicates | ❌ **Role significantly overlaps with hivefiver-orchestrator.md** — both are "orchestrator" with routing responsibilities |
| Tool permissions valid | ⚠️ `patch` is valid but redundant with `edit`. `offset-read` is NOT a valid OpenCode permission key. |
| Role distinct | ❌ Same orchestrator role as hivefiver-orchestrator — "MINDNETWORK graph traversal" concept never explained |
| Connects to ≥1 resource | ⚠️ No command directly invokes it. Referenced by coordinator.md and hivefiver-agent-builder.md |
| No hardcoded paths | ✅ | All relative |
| Self-contained | ⚠️ MINDNETWORK graph concept mentioned but never defined or implemented |

**Score: 3/8** — Role overlap with hivefiver-orchestrator, invalid `offset-read` permission, duplicate skill entries, self-referencing skill.

---

### 14. intent-loop.md

| Check | Status | Detail |
|-------|--------|--------|
| Frontmatter validity | ⚠️ Uses `instruction:` (singular) |
| Cross-references resolve | ❌ References `brainstorming` skill — DOES NOT EXIST in project. `use-authoring-skills` exists only in archive. |
| No duplicates | ✅ | Unique content |
| Tool permissions valid | ✅ | All valid keys |
| Role distinct | ✅ | Clear Phase 0 intent clarification role |
| Connects to ≥1 resource | ❌ **ORPHANED** — No command, skill, or workflow invokes it. Description says "Invoked by /plan command" but plan.md uses `conductor` agent. Only references `critic` agent outbound. |
| No hardcoded paths | ✅ | All relative |
| Self-contained | ✅ | Complete workflow, output contract, iteration protocol |

**Score: 4/8** — Orphaned (no entry point), dead `brainstorming` skill reference.

---

### 15. meta-synthesis-agent.md

| Check | Status | Detail |
|-------|--------|--------|
| Frontmatter validity | ⚠️ Non-standard format: `name:` not quoted, multi-line description without quotes, no `permission:` block, no `mode:` field, no `temperature:` field, no `steps:` field |
| Cross-references resolve | ❌ References `gsd-verifier`, `gsd-plan-checker`, `gsd-codebase-mapper` — these are GSD framework agents, NOT present in this project |
| No duplicates | ✅ | Uses XML-style tags (`<role>`, `<construction_patterns>`) — unique format |
| Tool permissions valid | ❌ **No permission block at all** — agent has no declared permissions |
| Role distinct | ✅ | Unique meta-concept analysis role |
| Connects to ≥1 resource | ❌ **ORPHANED** — No command, skill, workflow, or other agent references it |
| No hardcoded paths | ✅ | All relative |
| Self-contained | ⚠️ XML-style tags are inconsistent with all other agents; requires understanding of GSD framework to use effectively |

**Score: 2/8** — 🔴 CRITICAL: No frontmatter permissions, no mode, no temperature; orphaned; references external framework agents.

---

### 16. phase-guardian.md

| Check | Status | Detail |
|-------|--------|--------|
| Frontmatter validity | ⚠️ Uses `name:` (non-standard), `instruction:` (singular) |
| Cross-references resolve | ❌ References `agent-authorization` and `use-authoring-skills` skills — both exist only in archive |
| No duplicates | ✅ | Unique content |
| Tool permissions valid | ✅ | All valid keys |
| Role distinct | ✅ | Clear phase guardrails role |
| Connects to ≥1 resource | ❌ **ORPHANED** — Description says "Invoked by phase-loop skill" but `phase-loop` skill exists only in archive and doesn't reference this agent. No command invokes it. |
| No hardcoded paths | ✅ | All relative |
| Self-contained | ✅ | Complete workflow, gate sequences, output contract |

**Score: 4/8** — Orphaned (no entry point), dead skill references.

---

### 17. prompt-analyzer.md

| Check | Status | Detail |
|-------|--------|--------|
| Frontmatter validity | ✅ | Valid YAML |
| Cross-references resolve | ⚠️ `instructions` refs may not exist |
| No duplicates | ✅ | Unique content |
| Tool permissions valid | ✅ | Valid keys, valid patterns |
| Role distinct | ✅ | Clear deep prompt analysis role |
| Connects to ≥1 resource | ⚠️ Only connected via prompt-enhance.md workflow lanes. No command directly invokes it. |
| No hardcoded paths | ✅ | All relative |
| Self-contained | ✅ | Complete role and analysis targets |

**Score: 7/8** — Weak connection: only in workflow lanes.

---

### 18. prompt-repackager.md

| Check | Status | Detail |
|-------|--------|--------|
| Frontmatter validity | ✅ | Valid YAML |
| Cross-references resolve | ⚠️ `instructions` refs may not exist |
| No duplicates | ✅ | Unique content |
| Tool permissions valid | ✅ | Valid keys, valid patterns |
| Role distinct | ✅ | Clear final assembly role |
| Connects to ≥1 resource | ⚠️ Only connected via prompt-enhance.md workflow lanes. References other lane agents as inputs. |
| No hardcoded paths | ✅ | All relative |
| Self-contained | ⚠️ Depends on inputs from 5 other lane agents (skim, analyzer, context-mapper, risk-assessor, context-purifier) — cannot function in isolation |

**Score: 6.5/8** — Dependent on multiple other agents; only in workflow lanes.

---

### 19. prompt-skimmer.md

| Check | Status | Detail |
|-------|--------|--------|
| Frontmatter validity | ✅ | Valid YAML |
| Cross-references resolve | ⚠️ `instructions` refs may not exist |
| No duplicates | ✅ | Unique content |
| Tool permissions valid | ✅ | Valid keys, valid patterns |
| Role distinct | ✅ | Clear Phase 0 fast-scan role |
| Connects to ≥1 resource | ⚠️ Only connected via prompt-enhance.md workflow lanes |
| No hardcoded paths | ✅ | All relative |
| Self-contained | ✅ | Complete role and workflow |

**Score: 7/8** — Weak connection: only in workflow lanes.

---

### 20. researcher.md

| Check | Status | Detail |
|-------|--------|--------|
| Frontmatter validity | 🔴 **CRITICAL** — Duplicate `todoread: allow` and `todowrite: allow` entries. `todoread`/`todowrite`/`webbrowse` are NOT valid OpenCode permission keys |
| Cross-references resolve | ✅ | References tools that exist |
| No duplicates | 🔴 **CRITICAL** — File content after line ~108 is NEARLY IDENTICAL to explore.md — same 300+ line tool taxonomy (Parts I-IV, mermaid diagrams) |
| Tool permissions valid | ❌ Invalid keys: `todoread`, `todowrite`, `webbrowse` |
| Role distinct | ❌ **Near-identical to explore.md** — both are "repository investigator" with same workflow, same tool taxonomy |
| Connects to ≥1 resource | ✅ | Referenced by conductor.md, hivefiver-agent-builder.md, hivefiver-orchestrator.md, deep-init.md |
| No hardcoded paths | ✅ | All relative |
| Self-contained | ❌ Agent definition is ~108 lines; remaining 300+ lines are a reference document |

**Score: 2.5/8** — 🔴 CRITICAL: near-duplicate of explore.md, invalid permission keys, bloat.

---

### 21. risk-assessor.md

| Check | Status | Detail |
|-------|--------|--------|
| Frontmatter validity | ✅ | Valid YAML |
| Cross-references resolve | ⚠️ `instructions` refs may not exist |
| No duplicates | ✅ | Unique content |
| Tool permissions valid | ✅ | Valid keys, valid patterns |
| Role distinct | ✅ | Clear safety analysis role |
| Connects to ≥1 resource | ⚠️ Only connected via prompt-enhance.md workflow lanes |
| No hardcoded paths | ✅ | All relative |
| Self-contained | ✅ | Complete role and analysis targets |

**Score: 7/8** — Weak connection: only in workflow lanes.

---

### 22. spec-verifier.md

| Check | Status | Detail |
|-------|--------|--------|
| Frontmatter validity | ⚠️ Uses `name:` (non-standard), `instruction:` (singular) |
| Cross-references resolve | ❌ References `use-authoring-skills` and `planning-with-files` — exist only in archive |
| No duplicates | ✅ | Unique content |
| Tool permissions valid | ✅ | All valid keys |
| Role distinct | ✅ | Clear spec verification role |
| Connects to ≥1 resource | ❌ **ORPHANED** — Description says "Invoked by /ultrawork command" but ultrawork.md uses `conductor` agent, not `spec-verifier`. Only references `critic` outbound. |
| No hardcoded paths | ✅ | All relative |
| Self-contained | ✅ | Complete workflow, output contract, loop protocol |

**Score: 4/8** — Orphaned (no entry point), dead skill references.

---

## Orchestrator Copy: `.hivefiver-meta-builder/agents-lab/orchestrator/coordinator.md`

| Check | Status | Detail |
|-------|--------|--------|
| Frontmatter validity | 🔴 **CRITICAL** — Uses `tools:` (deprecated), has TWO `permission:` blocks (second overrides first), `"temperature":` with quotes |
| Cross-references resolve | ❌ Same dead skill references as refactoring/coordinator.md |
| No duplicates | 🔴 **CRITICAL** — Same corruption: duplicate Task_Management sections, TypeScript code injection, malformed backticks |
| Tool permissions valid | ❌ First block: `read: {"*": deny}` overridden by second block: `read: allow` |
| Role distinct | ❌ Same description as conductor.md |
| Connects to ≥1 resource | ❌ No command invokes this orchestrator copy |
| No hardcoded paths | ✅ | All relative |
| Self-contained | ❌ Contains TypeScript source code, not agent instructions |

**Score: 1/8** — 🔴 CRITICAL: This is a corrupted file containing TypeScript function source code mixed with agent instructions.

---

## Broken Cross-References (Complete List)

| Agent | Reference | Type | Status |
|-------|-----------|------|--------|
| coordinator.md | `meta-builder` | Skill | In archive only |
| coordinator.md | `hivefiver` | Skill | In archive only |
| coordinator.md | `planning-with-files` | Skill | In archive only |
| coordinator.md | `coordinating-loop` | Skill | In archive only |
| coordinator.md | `use-authoring-skills` | Skill | In archive only |
| coordinator.md | `user-intent-interactive-loop` | Skill | In archive only |
| coordinator.md | `opencode-platform-reference` | Skill | In archive only |
| coordinator.md | `repomix-exploration-guide` | Skill | In archive only |
| coordinator.md | `opencode-non-interactive-shell` | Skill | In archive only |
| coordinator.md | `repomix-explorer` | Skill | In archive only |
| coordinator.md | `skill-synthesis` | Skill | In archive only |
| coordinator.md | `agents-and-subagents-dev` | Skill | In archive only |
| coordinator.md | `command-dev` | Skill | In archive only |
| coordinator.md | `custom-tools-dev` | Skill | In archive only |
| hivefiver-orchestrator.md | `skill-judge` | Skill | **DOES NOT EXIST** anywhere |
| hivefiver-orchestrator.md | `skill-synthesis` | Skill | In archive only |
| hivefiver-skill-author.md | `skill-judge` | Skill | **DOES NOT EXIST** anywhere |
| hivefiver-skill-author.md | `skill-creator` | Skill | **DOES NOT EXIST** anywhere |
| intent-loop.md | `brainstorming` | Skill | **DOES NOT EXIST** anywhere |
| intent-loop.md | `use-authoring-skills` | Skill | In archive only |
| phase-guardian.md | `agent-authorization` | Skill | In archive only |
| phase-guardian.md | `use-authoring-skills` | Skill | In archive only |
| spec-verifier.md | `use-authoring-skills` | Skill | In archive only |
| spec-verifier.md | `planning-with-files` | Skill | In archive only |
| hivefiver.md | `meta-builder` | Skill | In archive only |
| hivefiver.md | `hivefiver` | Skill | Self-reference |
| hivefiver.md | `planning-with-files` | Skill | In archive only |
| hivefiver.md | `coordinating-loop` | Skill | In archive only |
| hivefiver.md | `use-authoring-skills` | Skill | In archive only |
| hivefiver.md | `user-intent-interactive-loop` | Skill | In archive only |
| hivefiver.md | `opencode-platform-reference` | Skill | In archive only |
| hivefiver.md | `repomix-exploration-guide` | Skill | In archive only (duplicate entry) |
| hivefiver.md | `opencode-non-interactive-shell` | Skill | In archive only |
| hivefiver.md | `repomix-explorer` | Skill | In archive only |
| hivefiver.md | `repomix-exploration-guide` | Skill | In archive only (duplicate entry #2) |
| hivefiver.md | `opencode-platform-reference` | Skill | In archive only (duplicate entry #2) |
| hivefiver.md | `skill-synthesis` | Skill | In archive only |
| hivefiver.md | `agents-and-subagents-dev` | Skill | In archive only |
| hivefiver.md | `command-dev` | Skill | In archive only |
| hivefiver.md | `custom-tools-dev` | Skill | In archive only |
| meta-synthesis-agent.md | `gsd-verifier` | Agent | External GSD framework |
| meta-synthesis-agent.md | `gsd-plan-checker` | Agent | External GSD framework |
| meta-synthesis-agent.md | `gsd-codebase-mapper` | Agent | External GSD framework |

---

## Invalid Permission Keys

| Agent | Invalid Key | Should Be |
|-------|------------|-----------|
| conductor.md | `delegate-task` | `task` |
| coordinator.md | `patch` (redundant) | Remove (covered by `edit`) |
| explore.md | `todoread` | Remove (not a permission) |
| explore.md | `todowrite` | Remove (not a permission) |
| explore.md | `webbrowse` | `webfetch` |
| hivefiver.md | `offset-read` | Remove (not a permission) |
| hivefiver.md | `patch` (redundant) | Remove (covered by `edit`) |
| researcher.md | `todoread` | Remove (not a permission) |
| researcher.md | `todowrite` | Remove (not a permission) |
| researcher.md | `webbrowse` | `webfetch` |

---

## Duplicate / Overlapping Content

### Critical Duplicates

| Pair | Overlap | Severity |
|------|---------|----------|
| **explore.md ↔ researcher.md** | Both contain identical 300+ line "Opencode Tool Taxonomy" reference (Parts I-IV with mermaid diagrams). Both have same "Terminal Repository Investigator" role. | 🔴 CRITICAL — Should be one agent + shared reference file |
| **conductor.md ↔ coordinator.md** | Identical description: "Primary orchestrator. Receives tasks, classifies intent, delegates to specialists, and maintains wisdom across sessions. Does not implement directly." | 🔴 CRITICAL — One should be renamed or differentiated |
| **hivefiver.md ↔ hivefiver-orchestrator.md** | Both are "orchestrator" meta-agents with routing responsibilities. hivefiver.md mentions "MINDNETWORK graph" which is undefined. | ⚠️ HIGH — Roles overlap significantly |
| **coordinator.md (body)** | Contains duplicate Task_Management sections + injected TypeScript code (`buildDefaultSisyphusPrompt`) | 🔴 CRITICAL — File is structurally corrupted |
| **orchestrator/coordinator.md** | Same corruption as refactoring/coordinator.md | 🔴 CRITICAL — Same corrupted content |

### Near-Duplicates (Minor)

| Pair | Overlap |
|------|---------|
| prompt-analyzer.md ↔ risk-assessor.md | Similar structure (read-and-report only, same permissions, similar output format) but different analysis targets |
| context-mapper.md ↔ context-purifier.md | Similar structure but different purposes (grounding vs distillation) |
| prompt-skimmer.md ↔ prompt-analyzer.md | Both analyze prompts but at different depths (skim vs deep) |

---

## Orphaned Agents (Zero Skill/Command/Workflow Connections)

| Agent | Why Orphaned | Recommended Fix |
|-------|-------------|-----------------|
| **intent-loop.md** | Description claims "Invoked by /plan command" but plan.md uses `conductor`. Description claims triggers "clarify intent, draft specification" but no command uses these. | Connect to plan.md as pre-planning step, or add dedicated `/clarify` command |
| **meta-synthesis-agent.md** | No permission block, no mode, no command/skill/workflow references it. References external GSD agents. | Either integrate into hf-audit.md or remove. Add permission block and mode. |
| **phase-guardian.md** | Description claims "Invoked by phase-loop skill" but phase-loop is archived and doesn't reference this agent. | Connect to a command or remove. Update description to match actual entry point. |
| **spec-verifier.md** | Description claims "Invoked by /ultrawork command" but ultrawork.md uses `conductor` agent. | Add to ultrawork.md as post-implementation step, or add dedicated `/verify` command. |

---

## Hardcoded Platform-Specific Paths

| Agent | Path | Issue |
|-------|------|-------|
| hivefiver-agent-builder.md | `.codexdisabled/agents/` | Non-standard directory (codex-specific) |
| hivefiver-agent-builder.md | `.skills-lab/active/refactoring-skills/agents-and-subagents-dev/` | Directory does not exist |
| hivefiver-command-builder.md | `.skills-lab/active/refactoring-skills/command-dev/` | Directory does not exist |
| hivefiver-skill-author.md | `.skills-lab/active/refactoring-skills/use-authoring-skills/` | Directory does not exist |
| hivefiver-skill-author.md | `.opencode/skills/use-authoring-skills/references/03-three-patterns.md` | Skill is archived; specific ref file may not exist |
| meta-synthesis-agent.md | `.opencode/agents/*.md` | Glob in agent body (minor) |
| meta-synthesis-agent.md | `.opencode/skills/*/SKILL.md` | Glob in agent body (minor) |

---

## Self-Containment Issues

| Agent | Issue |
|-------|-------|
| coordinator.md | Body contains TypeScript source code (`buildDefaultSisyphusPrompt`, `buildKeyTriggersSection`, etc.) — requires understanding of build system to interpret |
| orchestrator/coordinator.md | Same TypeScript injection as above |
| explore.md | 75% of file is reference documentation, not agent instructions — requires separation to understand agent role |
| researcher.md | Same issue as explore.md |
| meta-synthesis-agent.md | Uses XML-style tags and references external GSD framework agents — not self-contained for OpenCode |
| prompt-repackager.md | Depends on inputs from 5 other lane agents — cannot function as standalone |

---

## Connection Map: Agents → Skills/Commands/Workflows

```
AGENT                    → SKILLS (active/archive)         → COMMANDS              → WORKFLOWS
─────────────────────────────────────────────────────────────────────────────────────────────────────
builder                  → (none declared)                 → ultrawork.md          → (indirect)
                         →                                 → hf-prompt-enhance.md

conductor                → (none declared)                 → ultrawork.md
                         →                                 → plan.md
                         →                                 → start-work.md
                         →                                 → harness-doctor.md

context-mapper           → (none declared)                 → (none)                → prompt-enhance.md

context-purifier         → (none declared)                 → (none)                → prompt-enhance.md

coordinator              → 14 skills (ALL archived)        → (none direct)         → (none)
                         → meta-builder, hivefiver,
                           planning-with-files, etc.

critic                   → (none declared)                 → ultrawork.md (indirect)→ (none)

explore                  → (none declared)                 → deep-init.md
                         →                                 → deep-research-synthesis-repomix.md

hivefiver-agent-builder  → agents-and-subagents-dev (arch) → (none direct)         → create.md

hivefiver-command-builder→ command-dev (archived)           → (none direct)         → create.md

hivefiver-orchestrator   → 9 skills (1 dead, 8 archived)   → hf-audit.md
                         → skill-judge (DEAD)              → hf-create.md
                         →                                 → hf-prompt-enhance.md
                         →                                 → hf-stack.md

hivefiver-skill-author   → use-authoring-skills (arch)     → (none direct)         → create.md
                         → skill-judge (DEAD)
                         → skill-creator (DEAD)

hivefiver-tool-builder   → custom-tools-dev (archived)     → (none direct)         → create.md

hivefiver                → 13 skills (ALL archived)        → (none direct)         → (none)
                         → 2 duplicate entries

intent-loop              → brainstorming (DEAD)            → (none)                → (none)
                         → use-authoring-skills (arch)

meta-synthesis-agent     → (NO PERMISSION BLOCK)           → (none)                → (none)

phase-guardian           → agent-authorization (arch)      → (none)                → (none)
                         → use-authoring-skills (arch)

prompt-analyzer          → (none declared)                 → (none)                → prompt-enhance.md

prompt-repackager        → (none declared)                 → (none)                → prompt-enhance.md

prompt-skimmer           → (none declared)                 → (none)                → prompt-enhance.md

researcher               → (none declared)                 → deep-init.md
                         →                                 → deep-research-synthesis-repomix.md
                         →                                 → hf-prompt-enhance.md

risk-assessor            → (none declared)                 → (none)                → prompt-enhance.md

spec-verifier            → use-authoring-skills (arch)     → (none)                → (none)
                         → planning-with-files (arch)
```

---

## Per-Agent Fix List

### builder.md
1. Fix inconsistent path prefix: `opencode/rules/execution-loop.md` → `.opencode/rules/execution-loop.md`

### conductor.md
1. Change `delegate-task: allow` → `task: allow` in permissions
2. Differentiate description from coordinator.md (e.g., "Primary orchestrator for autonomous execution")

### context-mapper.md
- No critical fixes needed. Consider connecting to a command.

### context-purifier.md
- No critical fixes needed. Consider connecting to a command.

### coordinator.md 🔴 CRITICAL
1. **Remove all TypeScript code** — the `buildDefaultSisyphusPrompt`, `buildKeyTriggersSection`, etc. functions are NOT agent instructions
2. **Remove duplicate `permission:` block** — keep only one
3. **Remove duplicate Task_Management section** — keep only one
4. **Change `instruction:` → `instructions:`** (plural)
5. **Differentiate description from conductor.md**
6. **Replace all archived skill references** with active equivalents or remove them
7. **Fix malformed backticks** (`\Todowrite\`` → proper formatting)

### critic.md
1. Fix inconsistent path prefix: `opencode/rules/execution-loop.md` → `.opencode/rules/execution-loop.md`

### explore.md 🔴 CRITICAL
1. **Remove duplicate `todoread` and `todowrite`** entries
2. **Remove `todoread`, `todowrite`** — not valid permission keys
3. **Change `webbrowse` → `webfetch`**
4. **Remove 300+ line tool taxonomy** (Parts I-IV) — move to shared reference file
5. **Differentiate role from researcher.md** — give explore a distinct focus (e.g., "fast reconnaissance" vs "deep investigation")

### hivefiver-agent-builder.md
1. Change `instruction:` → `instructions:` (plural)
2. Remove `.codexdisabled/agents/` reference (non-standard path)
3. Remove `.skills-lab/active/refactoring-skills/` references (directory doesn't exist)

### hivefiver-command-builder.md
1. Change `instruction:` → `instructions:` (plural)
2. Remove `.skills-lab/active/refactoring-skills/` references (directory doesn't exist)

### hivefiver-orchestrator.md
1. **Remove `skill-judge`** from skill permissions — does not exist
2. **Remove or replace `skill-synthesis`** — archived

### hivefiver-skill-author.md
1. Change `instruction:` → `instructions:` (plural)
2. **Remove `skill-judge`** — does not exist
3. **Remove `skill-creator`** — does not exist
4. Remove `.skills-lab/active/refactoring-skills/` references (directory doesn't exist)

### hivefiver-tool-builder.md
- ✅ No critical fixes needed.

### hivefiver.md
1. **Remove duplicate skill entries** (`repomix-exploration-guide` x2, `opencode-platform-reference` x2)
2. **Remove `offset-read`** — not a valid permission key
3. **Remove `patch`** — redundant with `edit`
4. **Remove `hivefiver` self-reference** in skill permissions
5. **Differentiate role from hivefiver-orchestrator.md** or merge them
6. Define or remove "MINDNETWORK graph" concept

### intent-loop.md
1. Change `instruction:` → `instructions:` (plural)
2. **Remove `brainstorming` skill reference** — does not exist
3. **Add command entry point** — either modify plan.md to use intent-loop as pre-step, or create new command
4. Update description to match actual entry point

### meta-synthesis-agent.md 🔴 CRITICAL
1. **Add `mode:` field** (primary/subagent)
2. **Add `permission:` block** with explicit permissions
3. **Add `temperature:` field**
4. **Remove GSD agent references** (`gsd-verifier`, `gsd-plan-checker`, `gsd-codebase-mapper`) or replace with local equivalents
5. **Convert XML tags to standard markdown** for consistency
6. **Add command entry point** or remove if unused

### phase-guardian.md
1. Change `instruction:` → `instructions:` (plural)
2. **Add command entry point** — connect to a command that uses phase-loop
3. Update `agent-authorization` and `use-authoring-skills` references (both archived)

### prompt-analyzer.md
- No critical fixes needed.

### prompt-repackager.md
- No critical fixes needed. Consider documenting input contract more clearly.

### prompt-skimmer.md
- No critical fixes needed.

### researcher.md 🔴 CRITICAL
1. **Remove duplicate `todoread` and `todowrite`** entries
2. **Remove `todoread`, `todowrite`** — not valid permission keys
3. **Change `webbrowse` → `webfetch`**
4. **Remove 300+ line tool taxonomy** (Parts I-IV) — move to shared reference file
5. **Differentiate role from explore.md**

### risk-assessor.md
- No critical fixes needed.

### spec-verifier.md
1. Change `instruction:` → `instructions:` (plural)
2. **Add command entry point** — connect to ultrawork.md as post-implementation step
3. Update `use-authoring-skills` and `planning-with-files` references (both archived)

### orchestrator/coordinator.md 🔴 CRITICAL
1. **Same fixes as refactoring/coordinator.md** — remove TypeScript code, fix duplicate blocks
2. **Delete or mark as LEGACY** — this appears to be an outdated copy

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Clean (no critical issues) | 7 (builder, context-mapper, context-purifier, critic, hivefiver-tool-builder, prompt-analyzer, prompt-skimmer, risk-assessor) |
| Minor issues only | 5 (hivefiver-agent-builder, hivefiver-command-builder, hivefiver-orchestrator, prompt-repackager, spec-verifier) |
| Significant issues | 4 (conductor, explore, researcher, intent-loop) |
| Critical issues (needs rewrite) | 4 (coordinator, meta-synthesis-agent, phase-guardian, orchestrator/coordinator.md) |
| Orphaned (no entry point) | 4 (intent-loop, meta-synthesis-agent, phase-guardian, spec-verifier) |
| Invalid permission keys | 5 (conductor, explore, hivefiver, researcher, coordinator) |
| Dead skill references | 5 unique dead skills: `skill-judge`, `skill-creator`, `brainstorming` + 10 archived-only skills |
| Duplicate/near-duplicate content | 6 agents affected |

---

_Verified: 2026-04-07T00:00:00Z_
_Verifier: the agent (gsd-verifier)_
