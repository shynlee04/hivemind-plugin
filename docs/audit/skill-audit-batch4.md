# Skill Audit Report — Batch 4 of 4

**Date:** 2026-04-07
**Auditor:** researcher (Terminal Repository Investigator)
**Batch:** Skills 16–20
**Base Path:** `/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.hivefiver-meta-builder/skills-lab/active/refactoring/`

---

## 16. repomix-explorer

### Frontmatter

```yaml
---
name: repomix-explorer
description: "Use this skill when the user wants to analyze or explore a codebase (remote repository or local repository) using Repomix. Triggers on: 'analyze this repo', 'explore codebase', 'what's the structure', 'find patterns in repo', 'how many files/tokens'. Runs repomix CLI to pack repositories, then analyzes the output."
---
```

- **Has YAML frontmatter:** Yes
- **Has name:** Yes (`repomix-explorer`)
- **Has description:** Yes
- **Has metadata/allowed-tools/version:** No — minimal frontmatter only

### Triggers

Natural language phrases in description:
- "analyze this repo"
- "explore codebase"
- "what's the structure"
- "find patterns in repo"
- "how many files/tokens"

Additional user intent examples in body (lines 12–37): "Analyze the yamadashy/repomix repository", "What's the structure of facebook/react?", "Explore https://github.com/microsoft/vscode", "Find all TypeScript files in the Next.js repo", "Show me the main components of vercel/next.js", "Analyze this codebase", "Explore the ./src directory", "What's in this project?", "Find all configuration files in the current directory", "Show me the structure of ~/projects/my-app", "Find all authentication-related code", "Show me all React components", "Where are the API endpoints defined?", "Find all database models", "Show me error handling code", "How many files are in this project?", "What's the token count?", "Show me the largest files", "How much TypeScript vs JavaScript?"

**Assessment:** Triggers are well-covered in the description. The body provides extensive additional examples but these are NOT visible to the agent before loading — only the description field is.

### Self-Contained

**Yes.** This skill operates independently. It uses `npx repomix@latest` CLI commands and standard shell tools (`grep`, `rm`). No other skills are required. The only external dependency is the Repomix npm package (installed on-demand via `npx`).

### Cross-References

| Reference | Target | Resolvable? |
|-----------|--------|-------------|
| `https://github.com/yamadashy/repomix` | External URL | Yes — public GitHub repo |
| `npx repomix@latest` | External npm package | Yes — public registry |

No references to other skills, agents, commands, or internal files.

### Hardcoded Paths

| Path | Type | Issue |
|------|------|-------|
| `/tmp/<repo-name>-analysis.xml` | macOS/Linux temp dir | Cross-platform safe (both macOS and Linux use `/tmp`) |
| `./repomix-output.xml` | Relative path | Safe |
| `~/projects/my-app` | Home directory | Example only, not hardcoded into logic |

**Assessment:** No problematic hardcoded paths. `/tmp` is universal.

### Cross-Platform Safety

**Yes.** Uses `npx` (cross-platform npm tool), standard `grep`, and `/tmp` (available on macOS, Linux, WSL). No macOS-specific commands (`uuidgen` not used here). No Windows-incompatible patterns.

### Quality Score: 6/10

**Clarity:** Good — clear workflow steps, well-organized sections.
**Actionability:** Good — concrete commands, grep patterns, examples.
**Completeness:** Partial — no `references/`, `scripts/`, `evals/`, or `templates/` folders. No metadata fields (version, layer, role, pattern). No validation scripts. No evals.
**No-fluff:** Moderate — some redundancy in the "Best Practices" and "Example Workflows" sections. The skill is 301 lines but could be tighter.

### Issues

1. **MISSING: No `references/` folder.** The skill is entirely self-contained in SKILL.md but lacks the standard skill package structure.
2. **MISSING: No `scripts/` folder.** No validation scripts, no gate enforcement.
3. **MISSING: No `evals/` folder.** No `evals.json` or `trigger-queries.json` — cannot verify trigger accuracy.
4. **MISSING: No metadata fields.** No `version`, `layer`, `role`, `pattern`, or `allowed-tools` in frontmatter. This is the only skill in the batch with such minimal frontmatter.
5. **MINOR: Redundant content.** The "Search Patterns" section (lines 145–167) repeats patterns already shown in the workflow examples. The "Example Workflows" section (lines 182–246) is verbose and could be condensed.
6. **MINOR: `rm repomix-output.xml`** on line 172 — cleanup command is mentioned but not automated. Large temp files could accumulate.
7. **MINOR: No error recovery for `npx` failures.** The error handling section (lines 248–272) is descriptive but has no automated recovery scripts.

### Connections

| Consumer | Relationship | Evidence |
|----------|-------------|----------|
| `hivefiver-orchestrator` | Allowed skill | `.hivefiver-meta-builder/agents-lab/active/refactoring/hivefiver-orchestrator.md:35` — `"repomix-explorer": allow` |
| `harness-delegation-inspection` | Referenced in ecosystem map | `harness-delegation-inspection/references/ecosystem-structure.md:159` — listed as P1 skill |
| `user-intent-interactive-loop` | Required background skill (as `repomix-exploration-guide`, NOT `repomix-explorer`) | **BROKEN REF** — see below |

**CRITICAL NOTE:** `user-intent-interactive-loop` requires `repomix-exploration-guide` as a background skill (SKILL.md line 59), NOT `repomix-explorer`. These are two different skills. `repomix-explorer` is the simpler CLI-wrapper skill; `repomix-exploration-guide` is the reference/guide skill. This is not a bug but a potential source of confusion — the names are similar but the skills serve different purposes.

---

## 17. session-context-manager

### Frontmatter

```yaml
---
name: session-context-manager
description: Manages session context persistence across phases. Use when the user asks to manage session context, track phase progress, persist context across loops, load session state, read session context, or maintain context between phases.
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
---
```

- **Has YAML frontmatter:** Yes
- **Has name:** Yes (`session-context-manager`)
- **Has description:** Yes
- **Has version:** Yes (`1.0.0`)
- **Has metadata:** Yes (layer: 2, role: domain-execution, pattern: P2)
- **Has allowed-tools:** Yes

### Triggers

Natural language phrases in description:
- "manage session context"
- "track phase progress"
- "persist context across loops"
- "load session state"
- "read session context"
- "maintain context between phases"

**Assessment:** Good trigger coverage. Phrases are specific and actionable.

### Self-Contained

**Partial.** The skill references `references/session-context-protocol.md` (line 21) for detailed checkpoint types and protocol steps. The reference file exists and is substantive (311 lines). However, the skill's core protocol (phase start, context schema, propagation rules) is fully described in SKILL.md itself (155 lines). The reference file provides supplementary detail (state machine diagram, example YAML, initialization scripts).

### Cross-References

| Reference | Target | Resolvable? |
|-----------|--------|-------------|
| `references/session-context-protocol.md` | Local file | Yes — exists, 311 lines |
| `references/summary.md` | Local file | Yes — exists, 58 lines |
| `scripts/validate-skill.sh` | Local script | Yes — exists, 105 lines |
| `.hivemind/state/session-context-prompt.md` | State file path | Convention only, discovered at runtime |
| `.hivemind/state/phase-history.json` | State file path | Convention only, optional |

No references to other skills, agents, or commands.

### Hardcoded Paths

| Path | Type | Issue |
|------|------|-------|
| `.hivemind/state/session-context-prompt.md` | Project-relative convention | Safe — documented as discoverable, not assumed |
| `.hivemind/state/phase-history.json` | Project-relative convention | Safe — optional file |

**Assessment:** Paths are project-relative conventions, not absolute. The skill explicitly instructs agents to discover paths relative to workspace root. Cross-platform safe.

### Cross-Platform Safety

**Yes.** Uses standard YAML, Markdown, and `cat`/`grep` commands. The initialization script in the reference file uses `uuidgen` (line 228 of `session-context-protocol.md`) which is macOS-specific — Linux uses `uuid-gen` or `/proc/sys/kernel/random/uuid`. This is a minor issue in the reference file's example script, not in the skill's core logic.

### Quality Score: 7/10

**Clarity:** Good — clean structure, clear checkpoint types, well-defined schema.
**Actionability:** Good — concrete protocol steps, validation checklist, anti-patterns table.
**Completeness:** Partial — has `references/` and `scripts/` but no `evals/`, `templates/`, or `hooks/`. The `validate-skill.sh` script is functional but basic.
**No-fluff:** Good — 155 lines, focused on protocol.

### Issues

1. **MISSING: No `evals/` folder.** No `evals.json` or `trigger-queries.json`.
2. **MISSING: No `templates/` folder.** No scaffolding templates.
3. **MINOR: `uuidgen` in reference file** (`session-context-protocol.md:228`) is macOS-specific. Linux alternative: `cat /proc/sys/kernel/random/uuid` or `uuid-gen`.
4. **MINOR: Duplicate content in reference file.** Lines 9–17 of `session-context-protocol.md` repeat the same paragraph twice (the "Discovery pattern" text appears at lines 13 and 17).
5. **MINOR: Duplicate content in reference file.** Lines 172–174 repeat the same sentence about context injection twice.
6. **MINOR: `scripts/validate-skill.sh` line 26** has a logical bug — `grep -q "$field" "$SKILL_DIR/SKILL.md" | head -5` — the `head -5` is piped from grep's stdout but `grep -q` produces no stdout (it only sets exit code). This pipe does nothing.
7. **MINOR: No `hooks/` folder.** Unlike `use-authoring-skills`, this skill has no lifecycle hooks.

### Connections

| Consumer | Relationship | Evidence |
|----------|-------------|----------|
| `harness-delegation-inspection` | Referenced in ecosystem map | `ecosystem-structure.md:160` — listed as P2 skill |
| `command-parser` | Example in parsing rules | `command-parser/SKILL.md:52` — `skill=session-context-manager` example |
| `command-parser/references/parsing-rules.md` | Example in parsing rules | `parsing-rules.md:45` — same example |
| `GSD integration` | Referenced in summary.md | `references/summary.md:52-58` — maps to GSD session management |

---

## 18. skill-synthesis

### Frontmatter

```yaml
---
name: skill-synthesis
description: >
  Synthesizes skills by crawling GitHub repositories, extracting skill patterns,
  classifying them into routing/efficiency/testing categories, and generating
  eval-driven skill scaffolds. Use when the user asks to "create skills from
  GitHub repos", "find skill patterns", "build a skill template library",
  "classify skills by pattern type", "generate eval frameworks for skills",
  or "synthesize a skill from a codebase".
metadata:
  layer: "3"
  role: "synthesis"
  pattern: P2
allowed-tools: Read Write Edit Bash Glob Grep webfetch websearch codesearch
---
```

- **Has YAML frontmatter:** Yes
- **Has name:** Yes (`skill-synthesis`)
- **Has description:** Yes — comprehensive with trigger phrases
- **Has metadata:** Yes (layer: 3, role: synthesis, pattern: P2)
- **Has allowed-tools:** Yes
- **Has version:** No

### Triggers

Natural language phrases in description:
- "create skills from GitHub repos"
- "find skill patterns"
- "build a skill template library"
- "classify skills by pattern type"
- "generate eval frameworks for skills"
- "synthesize a skill from a codebase"

**Assessment:** Excellent trigger coverage. All phrases are specific and unlikely to false-positive.

### Self-Contained

**Partial.** The skill has a decision tree that routes to 5 reference files. Each reference file is substantive. The skill also references external skills in its "Integration with Existing Skills" section (lines 173–179): `meta-builder`, `use-authoring-skills`, `skill-judge`, `repomix-exploration-guide`, `opencode-platform-reference`. These are described as relationships, not hard dependencies — the skill can function without them loaded, but references them for context.

### Cross-References

| Reference | Target | Resolvable? |
|-----------|--------|-------------|
| `references/01-github-ingestion.md` | Local file | Yes — exists |
| `references/02-pattern-classifier.md` | Local file | Yes — exists |
| `references/03-eval-framework.md` | Local file | Yes — exists |
| `references/04-quality-matrix.md` | Local file | Yes — exists |
| `references/05-template-library.md` | Local file | Yes — exists |
| `scripts/validate-gate.sh` | Local script | Yes — exists, 118 lines |
| `scripts/validate-skill.sh` | Local script | Yes — exists |
| `scripts/check-overlaps.sh` | Local script | Yes — exists |
| `scripts/run-trigger-evals.sh` | Local script | Yes — exists |
| `scripts/grade-outputs.sh` | Local script | Yes — exists |
| `scripts/classify-pattern.sh` | Local script | Yes — exists |
| `scripts/ingest-repo.sh` | Local script | Yes — exists |
| `evals/evals.json` | Local file | Yes — exists, 5 test cases |
| `evals/trigger-queries.json` | Local file | Yes — exists, 20 queries |
| `templates/eval-scaffold.json` | Local file | Yes — exists |
| `templates/skill-scaffold.md` | Local file | Yes — exists |
| `task_plan.md` | Local file | Yes — exists |
| `meta-builder` | External skill | Referenced as routing source — resolvable in project |
| `use-authoring-skills` | External skill | Referenced as validation script provider — resolvable |
| `skill-judge` | External skill | Referenced as quality matrix provider — exists in global skills |
| `repomix-exploration-guide` | External skill | Referenced for repomix patterns — resolvable |
| `opencode-platform-reference` | External skill | Referenced for domain knowledge — resolvable |
| `https://agentskills.io/llms.txt` | External URL | Yes — public spec |
| `repomix --remote` | External CLI | Yes — public npm package |

### Hardcoded Paths

| Path | Type | Issue |
|------|------|-------|
| `/tmp/skill-ingest-<timestamp>.xml` | Temp file | Cross-platform safe |
| `/tmp/spec-<timestamp>.md` | Temp file | Cross-platform safe |

**Assessment:** No problematic hardcoded paths.

### Cross-Platform Safety

**Yes.** Uses `npx`/`repomix`, `webfetch`, `websearch`, `codesearch`, and bash scripts. All scripts follow non-interactive shell compliance (line 165–170): `CI=true`, `GIT_TERMINAL_PROMPT=0`, `set -euo pipefail`, `timeout 30` wrappers. No macOS-specific commands.

### Quality Score: 8/10

**Clarity:** Excellent — clean pipeline (INGEST → CLASSIFY → SCAFFOLD → VALIDATE), decision tree, anti-patterns table.
**Actionability:** Excellent — concrete commands, validation gates, error handling table.
**Completeness:** Good — has `references/` (5 files), `scripts/` (7 files), `evals/` (2 files), `templates/` (2 files), and `task_plan.md`. Missing `version` in frontmatter.
**No-fluff:** Good — 180 lines, dense with actionable content.

### Issues

1. **MINOR: Missing `version` field in frontmatter.** All other skills in this batch have it except this one and `repomix-explorer`.
2. **MINOR: `task_plan.md` present in skill directory.** This is a working file that should not ship with the skill package — it's session-specific state.
3. **MINOR: References `skill-judge` as external skill** (line 178) but doesn't specify where to find it. The skill exists in global `.agents/skills/` but this isn't documented.
4. **MINOR: `repomix --remote` command on line 54** uses bare `repomix` without `npx` prefix. The skill should be consistent — `repomix-explorer` uses `npx repomix@latest`.
5. **MINOR: The "On Load" section (lines 27–39)** references `scripts/validate-gate.sh` but the script path assumes it's run from the skill directory. This works in practice but could be clearer.
6. **POSITIVE: Evals are well-structured.** `evals.json` has 5 test cases (3 positive, 2 negative). `trigger-queries.json` has 20 queries (10 positive, 10 negative) — meets the "at least 3 test cases and 20 trigger queries" iron law.

### Connections

| Consumer | Relationship | Evidence |
|----------|-------------|----------|
| `meta-builder` | Routes "synthesize skills" → this skill | SKILL.md line 175 |
| `use-authoring-skills` | Provides validation scripts reused by pipeline | SKILL.md line 176 |
| `harness-delegation-inspection` | Referenced in ecosystem map | `ecosystem-structure.md:161` — listed as P3 skill |
| `hivefiver-orchestrator` | Implicit — skill synthesis is a hivefiver operation | Inferred from workflow |

---

## 19. use-authoring-skills

### Frontmatter

```yaml
---
name: use-authoring-skills
description: Use when creating, auditing, refactoring, or doctoring agent skills. Covers frontmatter, pattern selection, TDD workflows, quality scoring, and cross-platform compatibility.
metadata:
  layer: "4"
  role: "domain-execution"
  pattern: P2-hybrid
allowed-tools: Read Write Edit Bash Glob Grep
---
```

- **Has YAML frontmatter:** Yes
- **Has name:** Yes (`use-authoring-skills`)
- **Has description:** Yes
- **Has metadata:** Yes (layer: 4, role: domain-execution, pattern: P2-hybrid)
- **Has allowed-tools:** Yes
- **Has version:** No

### Triggers

Natural language phrases in description:
- "creating agent skills" (implied by "creating")
- "auditing agent skills" (implied by "auditing")
- "refactoring agent skills" (implied by "refactoring")
- "doctoring agent skills" (implied by "doctoring")

**Assessment:** The description uses gerund forms ("creating", "auditing", "refactoring", "doctoring") rather than imperative trigger phrases. An agent seeing "create a skill" or "audit this skill" might not match these. The body's decision tree (lines 89–103) has better trigger phrases: "create a skill", "make a skill", "audit this skill", "review skill", "fix triggers", "skill not loading", "improve this skill", "refactor", "skill overlaps with...", "write evals for skill", "write scripts for skill", "make skill work on X platform", "doctor", "what's wrong with...". But these are in the body, NOT the description — agents only see the description before loading.

### Self-Contained

**Partial.** The skill has a hierarchy enforcement that requires `meta-builder` to exist and route to it (lines 37–51). The `verify-hierarchy.sh` script checks for `meta-builder` as a prerequisite. The skill also has a decision tree routing to 12 reference files. It references `critic` subagent for review (line 140, STEP 9). The skill claims to work standalone in its validation gate (line 249: "Works standalone — doesn't require other HiveMind skills") but the hierarchy check contradicts this.

### Cross-References

| Reference | Target | Resolvable? |
|-----------|--------|-------------|
| `references/01-skill-anatomy.md` | Local file | Yes — exists |
| `references/02-frontmatter-standard.md` | Local file | Yes — exists |
| `references/03-three-patterns.md` | Local file | Yes — exists |
| `references/04-tdd-workflow.md` | Local file | Yes — exists |
| `references/05-skill-quality-matrix.md` | Local file | Yes — exists |
| `references/06-cross-platform-activation.md` | Local file | Yes — exists |
| `references/07-iterative-refinement.md` | Local file | Yes — exists |
| `references/08-conflict-detection.md` | Local file | Yes — exists |
| `references/09-script-authoring.md` | Local file | Yes — exists |
| `references/10-eval-lifecycle.md` | Local file | Yes — exists |
| `references/11-description-optimization.md` | Local file | Yes — exists |
| `references/12-anti-deception.md` | Local file | Yes — exists |
| `scripts/validate-gate.sh` | Local script | Yes — exists, 118 lines |
| `scripts/validate-skill.sh` | Local script | Yes — exists, 187 lines |
| `scripts/check-overlaps.sh` | Local script | Yes — exists, 203 lines |
| `scripts/gate-enforce.sh` | Local script | Yes — exists, 109 lines |
| `scripts/check-complete.sh` | Local script | Yes — exists, 37 lines |
| `scripts/init-session.sh` | Local script | Yes — exists, 121 lines |
| `scripts/register-skill.sh` | Local script | Yes — exists, 122 lines |
| `scripts/verify-hierarchy.sh` | Local script | Yes — exists, 295 lines |
| `hooks/post-tool-use.sh` | Local hook | Yes — exists |
| `hooks/pre-tool-use.sh` | Local hook | Yes — exists |
| `hooks/stop.sh` | Local hook | Yes — exists |
| `evals/evals.json` | Local file | Yes — exists, 8 test cases |
| `evals/trigger-queries.json` | Local file | Yes — exists, 20 queries |
| `templates/evals.json` | Local file | Yes — exists |
| `templates/trigger-queries.json` | Local file | Yes — exists |
| `templates/grading-rubric.json` | Local file | Yes — exists |
| `templates/skill-scaffold/` | Local directory | Yes — exists |
| `task_plan.md` | Local file | Yes — exists |
| `meta-builder` | External skill | Required prerequisite — resolvable |
| `agentskills.io` | External URL/spec | Referenced throughout — public spec |
| `critic` subagent | Internal agent | Referenced in STEP 9 — resolvable in project |

### Hardcoded Paths

| Path | Type | Issue |
|------|------|-------|
| `.opencode/skills/<name>/SKILL.md` | Platform convention | Safe — documented as OpenCode path |
| `.claude/skills/<name>/SKILL.md` | Platform convention | Safe — documented as Claude Code path |
| `.codex/skills/<name>/SKILL.md` | Platform convention | Safe — documented as Codex path |
| `.cursor/skills/<name>/SKILL.md` | Platform convention | Safe — documented as Cursor path |
| `.kilo/commands/deep-research.md` | Example path in eval | Example only, not hardcoded logic |

**Assessment:** No problematic hardcoded paths. Platform paths are documented conventions, not assumptions.

### Cross-Platform Safety

**Yes.** The Platform Adaptation table (lines 212–220) explicitly addresses OpenCode, Claude Code, Codex, and Cursor. The `verify-hierarchy.sh` script checks multiple skill directory locations (`.kilo/`, `.opencode/`, `.agents/`, `.claude/`, `$HOME/.config/opencode/`). Scripts use `bash 3.2` compatible syntax (macOS default). No platform-specific commands.

### Quality Score: 8/10

**Clarity:** Excellent — iron law emphasized, decision tree, validation loop, anti-patterns with detection.
**Actionability:** Excellent — 10-step checklist, gate system, worked example, 8 scripts with real logic.
**Completeness:** Excellent — has `references/` (12 files), `scripts/` (8 files), `evals/` (2 files), `templates/` (4 items), `hooks/` (3 files), and `task_plan.md`. Missing `version` in frontmatter.
**No-fluff:** Good — 255 lines, dense and structured.

### Issues

1. **CRITICAL: Description trigger phrases are gerund-based, not imperative.** The description says "Use when creating, auditing, refactoring, or doctoring agent skills." An agent receiving "create a skill" or "audit this skill" may not match. The Iron Law (line 14) says "NO SKILL WITHOUT TRIGGER PHRASES IN THE DESCRIPTION" but the description itself doesn't follow this rule well. The description should include phrases like "create a skill", "audit this skill", "fix skill triggers", "doctor skill".
2. **CONTRADICTION: Claims standalone but requires meta-builder.** Line 249 says "Works standalone — doesn't require other HiveMind skills" but lines 37–51 enforce hierarchy with `meta-builder` as a prerequisite. The `verify-hierarchy.sh` script blocks execution if `meta-builder` is not found.
3. **MINOR: Missing `version` field in frontmatter.**
4. **MINOR: `task_plan.md` present in skill directory.** Session-specific state file that should not ship.
5. **MINOR: `scripts/validate-gate.sh` is identical to `skill-synthesis/scripts/validate-gate.sh`.** Both files are byte-for-byte identical (118 lines each). This is copy-paste duplication.
6. **MINOR: `scripts/verify-hierarchy.sh` is identical to `user-intent-interactive-loop/scripts/verify-hierarchy.sh`.** Both files are byte-for-byte identical (295 lines each).
7. **MINOR: 12 reference files is a lot.** The decision tree routes to one at a time, but maintaining 12 reference files is a maintenance burden. Some could potentially be consolidated.

### Connections

| Consumer | Relationship | Evidence |
|----------|-------------|----------|
| `hivefiver-orchestrator` | Routes skill creation/audit to this skill | `hivefiver-orchestrator.md:26,59-60` — `"use-authoring-skills": allow`, routing table |
| `phase-guardian` | Allowed skill | `phase-guardian.md:22` |
| `intent-loop` | Allowed skill | `intent-loop.md:27,181` |
| `spec-verifier` | Allowed skill | `spec-verifier.md:26` |
| `harness-audit` | Uses for skill validation | `harness-audit/SKILL.md:57` |
| `harness-audit/references/pointers.md` | Direct reference | `pointers.md:9,31` |
| `meta-builder` | Prerequisite routing source | SKILL.md lines 37–51 |
| `meta-synthesis-agent` | Execution context | `meta-synthesis-agent.md:79` |
| `command-parser` | Example in parsing rules | Referenced in parsing examples |
| `workflows/create.md` | Workflow routing | `create.md:25` |
| `workflows/stack.md` | Stack ordering | `stack.md:39` |
| `.hivefiver-meta-builder/PLAYBOOK.md` | Reference in playbook | `HIVEFIVER-PLAYBOOK.md:309` |

---

## 20. user-intent-interactive-loop

### Frontmatter

```yaml
---
name: user-intent-interactive-loop
description: Use when user intent is unclear, sessions span many turns, or you need to probe requirements before delegating work. Maintains context across long sessions and manages parent/child task delegation.
metadata:
  layer: "1"
  role: "front-agent"
allowed-tools: skill question write edit read bash
---
```

- **Has YAML frontmatter:** Yes
- **Has name:** Yes (`user-intent-interactive-loop`)
- **Has description:** Yes
- **Has metadata:** Yes (layer: 1, role: front-agent)
- **Has allowed-tools:** Yes
- **Has version:** No
- **Has pattern:** No — only skill in batch without pattern field

### Triggers

Natural language phrases in description:
- "user intent is unclear"
- "sessions span many turns"
- "probe requirements before delegating work"
- "maintains context across long sessions"
- "manages parent/child task delegation"

**Assessment:** Moderate trigger coverage. The phrases are descriptive of situations rather than things a user would say. A user saying "help me figure out what I want" or "what were we working on?" would match the intent but not the literal description phrases. The `evals/trigger-queries.json` has better trigger phrases: "help me figure out what I want", "I'm not sure how to approach this", "what should we do next?", "keep going with this", "stay focused on the main goal", "what were we working on again?". These should be in the description.

### Self-Contained

**No.** This skill has the strongest dependency chain in the batch:
1. Requires 3 background skills loaded BEFORE any action: `opencode-platform-reference`, `repomix-exploration-guide`, `opencode-non-interactive-shell` (Gate 3, lines 40–61)
2. References 5 additional skills for post-PROBE use: `dispatching-parallel-agents`, `planning-with-files`, `deep-research`/`deep-investigation`, `gcc`, `skill-creator`/`writing-skills` (lines 107–116)
3. Has a `verify-hierarchy.sh` script that blocks execution if prerequisites are missing
4. References 5 local reference files via decision tree

### Cross-References

| Reference | Target | Resolvable? |
|-----------|--------|-------------|
| `references/01-question-protocols.md` | Local file | Yes — exists |
| `references/02-context-preservation.md` | Local file | Yes — exists |
| `references/03-brainstorming-patterns.md` | Local file | Yes — exists |
| `references/04-long-session-management.md` | Local file | Yes — exists |
| `references/05-worked-examples.md` | Local file | Yes — exists |
| `scripts/intent-verify.sh` | Local script | Yes — exists, 285 lines |
| `scripts/verify-hierarchy.sh` | Local script | Yes — exists, 295 lines |
| `scripts/register-skill.sh` | Local script | Yes — exists |
| `scripts/first-action.sh` | Local script | Yes — exists |
| `scripts/session-checkpoint.sh` | Local script | Yes — exists |
| `evals/evals.json` | Local file | Yes — exists, 8 test cases |
| `evals/trigger-queries.json` | Local file | Yes — exists, 20 queries |
| `opencode-platform-reference` | External skill | Required background — resolvable |
| `repomix-exploration-guide` | External skill | Required background — resolvable |
| `opencode-non-interactive-shell` | External skill | Required background — resolvable |
| `dispatching-parallel-agents` | External skill | Post-PROBE — resolvable |
| `planning-with-files` | External skill | Post-PROBE — resolvable |
| `deep-research` / `deep-investigation` | External skill | Post-PROBE — resolvable |
| `gcc` | External skill | Post-PROBE — resolvable |
| `skill-creator` / `writing-skills` | External skill | Post-PROBE — resolvable |
| `coordinating-loop` | Sibling skill | Referenced in cross-refs (line 354) — resolvable |
| `use-authoring-skills` | Referenced in evals | `evals.json:74` — `target_skill: "use-authoring-skills"` |
| `.opencode/state/question-count.json` | State file | Created at runtime |
| `.opencode/state/intent.json` | State file | Created at runtime |
| `progress.md` | State file | Created at runtime |
| `task_plan.md` | State file | Created at runtime |
| `findings.md` | State file | Created at runtime |

### Hardcoded Paths

| Path | Type | Issue |
|------|------|-------|
| `.opencode/state/question-count.json` | Project-relative state | Safe — OpenCode convention |
| `.opencode/state/intent.json` | Project-relative state | Safe |
| `.opencode/state/loaded-skills.json` | Project-relative state | Safe — used by verify-hierarchy.sh |
| `<project-root>/progress.md` | Project-relative | Safe — documented as project root |
| `<project-root>/task_plan.md` | Project-relative | Safe |
| `<project-root>/findings.md` | Project-relative | Safe |
| `<project-root>/.checkpoints/<timestamp>-<name>.md` | Project-relative | Safe |

**Assessment:** All paths are project-relative conventions. The `verify-hierarchy.sh` script also checks `$HOME/.opencode/skills/`, `$HOME/.config/opencode/skills/`, `$HOME/.agents/skills/`, `$HOME/.claude/skills/`, `$HOME/.kilo/skills/` for external skills — cross-platform safe.

### Cross-Platform Safety

**Partial.** The Platform Adaptation table (lines 360–367) addresses OpenCode, Claude Code, Codex, and Cursor. The `question` tool is OpenCode-native — other platforms use text output instead. The `verify-hierarchy.sh` script is `bash 3.2` compatible. The `intent-verify.sh` script uses `grep`, `sed`, `jq` (with fallback) — all cross-platform.

**Issue:** The `intent-verify.sh` script references `.opencode/state/intent.json` which is an OpenCode-specific path. On Claude Code, this would be `.claude/state/`. The script doesn't discover the platform dynamically — it assumes `.opencode/`.

### Quality Score: 7/10

**Clarity:** Good — well-structured phases, clear gates, anti-patterns table with enforcement.
**Actionability:** Good — concrete validation procedures, decision matrix, worked examples referenced.
**Completeness:** Good — has `references/` (5 files), `scripts/` (5 files), `evals/` (2 files). Missing `templates/`, `hooks/`, `version`, and `pattern` in frontmatter.
**No-fluff:** Moderate — 379 lines is the longest SKILL.md in the batch. Some sections (anti-patterns table with 10 entries, platform adaptation table) are thorough but verbose.

### Issues

1. **CRITICAL: Missing `pattern` field in frontmatter.** This is the only skill in the batch without a `pattern` field. The `metadata` section has `layer` and `role` but no `pattern`. The `verify-hierarchy.sh` script's `is_known_skill` function (line 202) includes this skill but doesn't validate pattern.
2. **CRITICAL: Description lacks user-facing trigger phrases.** The description describes situations ("user intent is unclear", "sessions span many turns") rather than phrases users would say. The eval's `trigger-queries.json` has much better triggers that should be in the description.
3. **CRITICAL: Heavy dependency chain.** Requires 3 background skills loaded before any action. If any of `opencode-platform-reference`, `repomix-exploration-guide`, or `opencode-non-interactive-shell` are missing, the skill is blocked. This makes it fragile in isolation.
4. **MINOR: `intent-verify.sh` assumes `.opencode/` paths.** The script hardcodes `.opencode/state/intent.json` and `.opencode/state/question-count.json`. On non-OpenCode platforms, these paths would not exist. The script should discover the platform state directory.
5. **MINOR: `verify-hierarchy.sh` is duplicated.** Byte-for-byte identical to `use-authoring-skills/scripts/verify-hierarchy.sh` (295 lines). Also identical to the shared version in the verify-hierarchy.sh file we read.
6. **MINOR: `register-skill.sh` is duplicated.** Likely identical to the version in `use-authoring-skills/scripts/`.
7. **MINOR: `task_plan.md` not present but referenced.** The skill references `task_plan.md` in multiple places but there's no `task_plan.md` in the skill directory (unlike `use-authoring-skills` and `skill-synthesis` which have one).
8. **MINOR: References `deep-investigation` skill** (line 114) which may not exist — the evals reference it but it's not in the available skills list in the system prompt.
9. **MINOR: The "Required Skill Loads" table (lines 107–116)** lists 8 additional skills beyond the 3 background skills. This is a LOT of dependencies for a single skill.

### Connections

| Consumer | Relationship | Evidence |
|----------|-------------|----------|
| `hivefiver-orchestrator` | Implicit — front-agent for intent clarification | Inferred from layer: 1, role: front-agent |
| `harness-delegation-inspection` | Referenced in ecosystem map | `ecosystem-structure.md:163` — listed as P2 skill |
| `command-parser` | Example in parsing rules | Parsing examples reference this skill |
| `planning-with-files` | Depends on this skill | `verify-hierarchy.sh` — `planning-with-files` requires `user-intent-interactive-loop` |
| `coordinating-loop` | Sibling skill | SKILL.md line 354 — handoff point documented |
| `use-authoring-skills` | Referenced in evals | `evals.json:74` — delegation target |
| `workflows/stack.md` | Stack ordering | `stack.md:36` — intent skills layer |
| `retrospective-2026-04-04.md` | Progress tracking | Referenced in skills lab retrospective |
| `progress.md` | Progress tracking | Multiple references in skills lab progress |
| `meta-builder-architecture-2026-04-03.md` | Architecture documentation | Referenced in architecture doc |
| `enforcement-gap-analysis-2026-04-03.md` | Gap analysis | Referenced in gap analysis |

---

## Batch Summary

### Frontmatter Completeness

| Skill | name | description | version | metadata | allowed-tools | pattern |
|-------|------|-------------|---------|----------|---------------|---------|
| repomix-explorer | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| session-context-manager | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| skill-synthesis | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| use-authoring-skills | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| user-intent-interactive-loop | ✅ | ✅ | ❌ | ✅ (partial) | ✅ | ❌ |

### Package Structure

| Skill | SKILL.md | references/ | scripts/ | evals/ | templates/ | hooks/ | task_plan.md |
|-------|----------|-------------|----------|--------|------------|--------|--------------|
| repomix-explorer | 301L | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| session-context-manager | 155L | ✅ (2) | ✅ (1) | ❌ | ❌ | ❌ | ❌ |
| skill-synthesis | 180L | ✅ (5) | ✅ (7) | ✅ (2) | ✅ (2) | ❌ | ✅ |
| use-authoring-skills | 255L | ✅ (12) | ✅ (8) | ✅ (2) | ✅ (4) | ✅ (3) | ✅ |
| user-intent-interactive-loop | 379L | ✅ (5) | ✅ (5) | ✅ (2) | ❌ | ❌ | ❌ |

### Evals Compliance (Iron Law: "NO SKILL WITHOUT EVALS")

| Skill | evals.json | trigger-queries.json | Test Cases | Trigger Queries | Compliant? |
|-------|-----------|---------------------|------------|-----------------|------------|
| repomix-explorer | ❌ | ❌ | 0 | 0 | ❌ FAIL |
| session-context-manager | ❌ | ❌ | 0 | 0 | ❌ FAIL |
| skill-synthesis | ✅ | ✅ | 5 | 20 | ✅ PASS |
| use-authoring-skills | ✅ | ✅ | 8 | 20 | ✅ PASS |
| user-intent-interactive-loop | ✅ | ✅ | 8 | 20 | ✅ PASS |

### Cross-Platform Safety

| Skill | Verdict | Issues |
|-------|---------|--------|
| repomix-explorer | ✅ Yes | None |
| session-context-manager | ✅ Yes | `uuidgen` in reference file (minor) |
| skill-synthesis | ✅ Yes | None |
| use-authoring-skills | ✅ Yes | None |
| user-intent-interactive-loop | ⚠️ Partial | `intent-verify.sh` assumes `.opencode/` paths |

### Duplicated Scripts Across Skills

| Script | Appears In | Lines | Identical? |
|--------|-----------|-------|------------|
| `validate-gate.sh` | skill-synthesis, use-authoring-skills | 118 | ✅ Byte-for-byte |
| `verify-hierarchy.sh` | use-authoring-skills, user-intent-interactive-loop | 295 | ✅ Byte-for-byte |
| `register-skill.sh` | use-authoring-skills, user-intent-interactive-loop | ~122 | Likely identical |

### Critical Issues Summary

1. **repomix-explorer** — No evals, no references, no scripts, no metadata. Minimal skill package.
2. **session-context-manager** — No evals. Duplicate content in reference file. Minor bug in validate-skill.sh.
3. **skill-synthesis** — Missing version. `task_plan.md` should not ship. `repomix` vs `npx repomix@latest` inconsistency.
4. **use-authoring-skills** — Description trigger phrases are gerund-based, not imperative (violates own Iron Law). Claims standalone but requires `meta-builder`. Duplicated scripts.
5. **user-intent-interactive-loop** — Missing pattern field. Description lacks user-facing trigger phrases. Heavy dependency chain (3 required background skills + 8 optional). `intent-verify.sh` assumes `.opencode/` paths.

### Dependency Graph

```
user-intent-interactive-loop (L1, front-agent)
  ├── opencode-platform-reference (required background)
  ├── repomix-exploration-guide (required background)
  ├── opencode-non-interactive-shell (required background)
  ├── dispatching-parallel-agents (post-PROBE)
  ├── planning-with-files (post-PROBE)
  ├── deep-research / deep-investigation (post-PROBE)
  ├── gcc (post-PROBE)
  ├── skill-creator / writing-skills (post-PROBE)
  └── coordinating-loop (sibling handoff)

session-context-manager (L2, domain-execution)
  └── (standalone — no skill dependencies)

skill-synthesis (L3, synthesis)
  ├── meta-builder (routing source)
  ├── use-authoring-skills (validation scripts)
  ├── skill-judge (quality matrix)
  ├── repomix-exploration-guide (repomix patterns)
  └── opencode-platform-reference (domain knowledge)

use-authoring-skills (L4, domain-execution)
  └── meta-builder (required prerequisite)

repomix-explorer (no layer, no role)
  └── (standalone — no skill dependencies)
```

---

*End of Batch 4 Audit Report. Report written to `/Users/apple/hivemind-plugin/.worktrees/harness-experiment/docs/audit/skill-audit-batch4.md`.*
