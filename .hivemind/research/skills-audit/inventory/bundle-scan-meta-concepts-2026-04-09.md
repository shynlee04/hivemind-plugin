# Bundle Scan — Meta-Concept Skills (2026-04-09)

## Auditor: A | Scope: 7 skills

**Location:** All 7 skills found exclusively in `.claude/skills/`. No matches in `.opencode/skills/`.

---

## SKILL: meta-builder

### Directory Structure

```
.claude/skills/meta-builder/
├── SKILL.md (403L)
├── scripts/
│   ├── validate-graph.sh (74L)
│   ├── route-check.sh (73L)
│   ├── graph-traverse.sh (37L)
│   ├── register-skill.sh (24L)
│   ├── state-persist.sh (30L)
│   └── graph-init.sh (25L)
├── references/
│   ├── 01-mindsnetwork-graph.md (172L)
│   ├── 02-deterministic-control.md (143L)
│   ├── 03-long-horizon-persistence.md (173L)
│   ├── 04-skills-chaining.md (121L)
│   ├── depth-built-in-tools.md (17L) ⚠️ STUB
│   ├── depth-repo-analysis.md (13L) ⚠️ STUB
│   ├── depth-github-stacks.md (12L) ⚠️ STUB
│   └── depth-skill-synthesis.md (13L) ⚠️ STUB
├── assets/
│   ├── skill-frontmatter.md (31L)
│   ├── agent-frontmatter.md (33L)
│   └── command-frontmatter.md (33L)
├── workflows/
│   ├── skill-creation-flow.md (14L)
│   ├── agent-creation-flow.md (14L)
│   └── command-creation-flow.md (14L)
├── evals/
│   ├── evals.json (322L)
│   └── trigger-queries.json (24L)
└── .meta-builder/
    ├── graph.json (192L)
    └── state/
        ├── checkpoint.json (1L)
        ├── question-count.json (1L)
        └── session-stack.json (1L)
```

### scripts/

| Script | Exists? | Lines | Purpose | Called From SKILL.md | Dependencies |
|--------|---------|-------|---------|---------------------|-------------|
| validate-graph.sh | ✅ | 74 | Validates MINDNETWORK graph.json structure: checks version/nodes/edges/state fields | ✅ Validation Gate (line 395) | `.meta-builder/graph.json`, `.meta-builder/state/` |
| route-check.sh | ✅ | 73 | Validates routing decision: checks GROUP validity + skill existence across .opencode/.agents/.claude paths | ✅ Validation Gate (line 394) | None (searches filesystem) |
| graph-traverse.sh | ✅ | 37 | Read-only probe of graph traversal state (status/next commands) | ❌ Not referenced in SKILL.md body | `.meta-builder/graph.json`, `.meta-builder/state/checkpoint.json` |
| register-skill.sh | ✅ | 24 | Read-only probe: reports skill status from loaded-skills.json | ❌ Not referenced in SKILL.md body | `loaded-skills.json` (relative path 3 levels up) |
| state-persist.sh | ✅ | 30 | Read-only probe for MINDNETWORK state directory (status/latest) | ❌ Not referenced in SKILL.md body | `.meta-builder/state/` |
| graph-init.sh | ✅ | 25 | Read-only probe for graph directory + state files existence | ❌ Not referenced in SKILL.md body | `.meta-builder/`, `.meta-builder/state/` |

### references/

| File | Exists? | Lines | Purpose | Required/Mandatory | Covers What |
|------|---------|-------|---------|-------------------|-------------|
| 01-mindsnetwork-graph.md | ✅ | 172 | MINDNETWORK graph node/edge types, JSON schema, traversal semantics | MANDATORY for 3-skill stacks | Graph structure definition |
| 02-deterministic-control.md | ✅ | 143 | Pre/during/post execution protocol, rollback rules, retry strategy | MANDATORY for ambiguous routing | Deterministic execution control |
| 03-long-horizon-persistence.md | ✅ | 173 | Dual persistence (planning triplet + graph state), session recovery, checkpoint protocol | Optional (cross-session tasks) | Cross-session state management |
| 04-skills-chaining.md | ✅ | 121 | Max-3 loading order rules, composition anti-patterns, worked examples | MANDATORY for stack operations | Skills chaining patterns |
| depth-built-in-tools.md | ✅ | 17 | **STUB** — placeholder for detailed tool usage guides | When needing tool patterns | Intended: question, todowrite, patch, grep, glob, lsp, skill, webfetch |
| depth-repo-analysis.md | ✅ | 13 | **STUB** — placeholder for repomix explorer patterns | When analyzing repos | Intended: repomix CLI reference |
| depth-github-stacks.md | ✅ | 12 | **STUB** — placeholder for GitHub stack/project patterns | When understanding stacks | Intended: deepwiki, session export |
| depth-skill-synthesis.md | ✅ | 13 | **STUB** — placeholder for skill synthesis from remote repos | When ingesting skills | Intended: GitHub ingestion pipeline |

### assets/

| File | Exists? | Purpose |
|------|---------|---------|
| skill-frontmatter.md | ✅ | YAML skeleton template for new skill frontmatter (31L) |
| agent-frontmatter.md | ✅ | YAML skeleton template for new agent frontmatter (33L) |
| command-frontmatter.md | ✅ | YAML skeleton template for new command frontmatter (33L) |

### Discrepancies

- **4 STUB references:** `depth-built-in-tools.md` (17L), `depth-repo-analysis.md` (13L), `depth-github-stacks.md` (12L), `depth-skill-synthesis.md` (13L) — all contain only "Content (to be filled in SECTION X)" placeholders with outline bullets. SKILL.md Reference Map (line 366-373) lists these as having substantive content ("Detailed guides for...", "repomix-explorer quick reference", etc.) but they are empty shells.
- **4 orphan scripts:** `graph-traverse.sh`, `register-skill.sh`, `state-persist.sh`, `graph-init.sh` exist on disk but are never referenced or called from SKILL.md body. Only `validate-graph.sh` and `route-check.sh` appear in the Validation Gate section.
- **Phantom workspace references:** SKILL.md references `.hivefiver-meta-builder/AGENTS.md`, `.hivefiver-meta-builder/distinguish-hivefiver-meta-builder.md`, `.hivefiver-meta-builder/GENERAL-KNOWLEDGE.md`, `.hivefiver-meta-builder/ONBOARDING-WORKFLOW-PROTOCOL.md`, `.hivefiver-meta-builder/SKILLS-AGENTS-COMMANDS-TOOLS.md`, `.hivefiver-meta-builder/updating-for-hivefiver-onboarding.md`, `.hivefiver-meta-builder/workflows-lab/active/refactoring/` — these are NOT within the skill directory and are cross-references to an external workspace concept that may not exist in this repo.
- **Orphan .meta-builder/ state directory:** Contains `graph.json` (192L) and 3 state files — these are part of the MINDNETWORK graph concept but not documented as an expected directory structure in SKILL.md.

### Conflicts

- `register-skill.sh` exists in both meta-builder (24L, read-only probe) and use-authoring-skills (122L, write registration). Different implementations for different purposes but could confuse agents about which to use.

### Gaps

- **4 depth references are stubs** — SKILL.md claims detailed guidance exists but there's no actual content. Agents loading these will find nothing actionable.
- **No `validate-skill.sh`** — meta-builder is the only skill without its own skill structure validator, yet it's the router that delegates to skills that have them. Low impact since it delegates validation to specialists.

---

## SKILL: use-authoring-skills

### Directory Structure

```
.claude/skills/use-authoring-skills/
├── SKILL.md (255L)
├── scripts/
│   ├── validate-gate.sh (118L)
│   ├── validate-skill.sh (187L)
│   ├── check-overlaps.sh (203L)
│   ├── gate-enforce.sh (109L)
│   ├── check-complete.sh (37L)
│   ├── init-session.sh (121L)
│   ├── register-skill.sh (122L)
│   └── verify-hierarchy.sh (295L)
├── references/
│   ├── 01-skill-anatomy.md (87L)
│   ├── 02-frontmatter-standard.md (121L)
│   ├── 03-three-patterns.md (126L)
│   ├── 04-tdd-workflow.md (149L)
│   ├── 05-skill-quality-matrix.md (164L)
│   ├── 06-cross-platform-activation.md (115L)
│   ├── 07-iterative-refinement.md (141L)
│   ├── 08-conflict-detection.md (73L)
│   ├── 09-script-authoring.md (102L)
│   ├── 10-eval-lifecycle.md (147L)
│   ├── 11-description-optimization.md (133L)
│   └── 12-anti-deception.md (118L)
├── hooks/
│   ├── pre-tool-use.sh (14L)
│   ├── post-tool-use.sh (8L)
│   └── stop.sh (40L)
├── templates/
│   ├── evals.json (112L)
│   ├── grading-rubric.json (133L)
│   ├── trigger-queries.json (126L)
│   └── skill-scaffold/
│       ├── SKILL.md.template (52L)
│       └── references/.gitkeep (0L)
└── evals/
    ├── evals.json (137L)
    └── trigger-queries.json (24L)
```

### scripts/

| Script | Exists? | Lines | Purpose | Called From SKILL.md | Dependencies |
|--------|---------|-------|---------|---------------------|-------------|
| validate-gate.sh | ✅ | 118 | MANDATORY preflight: validates intent, creates task_plan.md, checks pattern selection | ✅ STEP 1, STEP 10 | validate-skill.sh, check-overlaps.sh (co-located) |
| validate-skill.sh | ✅ | 187 | Validates SKILL.md structure: frontmatter, fields, name format, terminology, file refs | ✅ STEP 5, STEP 7 | None |
| check-overlaps.sh | ✅ | 203 | Checks content duplication: duplicate headings, repeated blocks, cross-file vocabulary overlap | ✅ STEP 8 | None |
| gate-enforce.sh | ✅ | 109 | Enforces G1-G5 gate passage: intent, structure, pattern, quality, validation | ✅ Gate System table | validate-skill.sh, check-overlaps.sh |
| check-complete.sh | ✅ | 37 | Reports task_plan.md phase completion status (always exits 0) | ❌ Not directly referenced | task_plan.md |
| init-session.sh | ✅ | 121 | Creates planning file triplet (task_plan.md, findings.md, progress.md) | ❌ Not directly referenced | None |
| register-skill.sh | ✅ | 122 | Records skill load in loaded-skills.json (jq + bash fallback) | ✅ HIERARCHY ENFORCEMENT section | `loaded-skills.json`, jq (optional) |
| verify-hierarchy.sh | ✅ | 295 | Verifies prerequisite chains: checks loaded-skills.json + disk existence for 5 known skills | ✅ HIERARCHY ENFORCEMENT section | `loaded-skills.json`, jq (optional) |

### references/

| File | Exists? | Lines | Purpose | Required/Mandatory | Covers What |
|------|---------|-------|---------|-------------------|-------------|
| 01-skill-anatomy.md | ✅ | 87 | Skill directory structure, required/optional files | Load for creation | Skill filesystem layout |
| 02-frontmatter-standard.md | ✅ | 121 | agentskills.io field specification, constraints per field | Load for frontmatter work | YAML frontmatter spec |
| 03-three-patterns.md | ✅ | 126 | P1/P2/P3 architecture patterns, when to use each | Load for "create a skill" | Pattern selection guide |
| 04-tdd-workflow.md | ✅ | 149 | TDD vs template-driven creation workflows, RED-GREEN-REFACTOR | Load for creation from scratch | Two creation workflows |
| 05-skill-quality-matrix.md | ✅ | 164 | 5-dimension scoring rubric, block rules, grade thresholds | Load for "audit this skill" | Quality scoring system |
| 06-cross-platform-activation.md | ✅ | 115 | How skill triggering works on OpenCode/Claude Code/Codex/Cursor | Load for cross-platform work | Progressive disclosure per platform |
| 07-iterative-refinement.md | ✅ | 141 | Confidence thresholds → action mapping, iterative improvement loop | Load for "improve this skill" | Refinement strategy |
| 08-conflict-detection.md | ✅ | 73 | 5 conflict types (scope, contradictory, shared state, boundary, orphans) | Load for "skill overlaps" | Conflict identification |
| 09-script-authoring.md | ✅ | 102 | When to bundle scripts vs inline, script quality checklist | Load for "write scripts" | Script authoring guide |
| 10-eval-lifecycle.md | ✅ | 147 | CREATE→RUN→GRADE→IMPROVE→REPEAT eval cycle | Load for "write evals" | Eval lifecycle management |
| 11-description-optimization.md | ✅ | 133 | Why description is primary trigger, writing effective descriptions | Load for "fix triggers" | Description optimization |
| 12-anti-deception.md | ✅ | 118 | Skill deception patterns, detection methods, prevention | Load for "doctor" | Anti-deception patterns |

### assets/

| File | Exists? | Purpose |
|------|---------|---------|
| (none — templates/ used instead) | | |

### Discrepancies

- **SKILL.md line 222-236 Scripts table claims line counts that are EXACT matches** with actual disk content. All 8 scripts match their documented sizes. ✅
- **Orphan: `task_plan.md`** (31L) exists at skill root — leftover planning artifact, not part of the skill bundle.
- **Orphan: `templates/` directory** — SKILL.md does not document the templates/ directory anywhere. Contains `evals.json`, `grading-rubric.json`, `trigger-queries.json`, and `skill-scaffold/SKILL.md.template`. These are functional scaffolding tools not mentioned in SKILL.md.
- **Hooks not documented in SKILL.md** — 3 hook scripts exist but are not mentioned in the SKILL.md body. They implement OpenCode hook protocol (pre-tool-use, post-tool-use, stop) but an agent loading this skill wouldn't know they exist.

### Conflicts

- `validate-skill.sh` is IDENTICAL to `skill-synthesis/scripts/validate-skill.sh` (both 187L, exact copy).
- `check-overlaps.sh` is IDENTICAL to `skill-synthesis/scripts/check-overlaps.sh` (both 203L, exact copy).
- `validate-gate.sh` is IDENTICAL to `skill-synthesis/scripts/validate-gate.sh` (both 118L, exact copy).

### Gaps

- **No explicit scripts/ documentation in decision tree** — The decision tree maps user requests to reference files but never to scripts. Agents must discover scripts through the checklist steps, not through the decision tree.
- **Missing reference for `gate-enforce.sh` G4** — The G4 gate references `references/05-skill-quality-matrix.md` for quality scoring but the script itself looks for `grading.json` or `quality-eval.md` files. No documentation explains how to produce these files.

---

## SKILL: agents-and-subagents-dev

### Directory Structure

```
.claude/skills/agents-and-subagents-dev/
├── SKILL.md (177L)
└── references/
    ├── delegation-protocol.md (115L)
    └── worktree-control.md (71L)
```

### scripts/

| Script | Exists? | Lines | Purpose | Called From SKILL.md | Dependencies |
|--------|---------|-------|---------|---------------------|-------------|
| (none) | | | | | |

### references/

| File | Exists? | Lines | Purpose | Required/Mandatory | Covers What |
|------|---------|-------|---------|-------------------|-------------|
| delegation-protocol.md | ✅ | 115 | Dispatch envelope pattern, status handling (DONE/DONE_WITH_CONCERNS/etc), two-stage review | MANDATORY On Load | Subagent delegation protocol |
| worktree-control.md | ✅ | 71 | Git worktree creation/management commands, fork sessions, parallel task isolation | MANDATORY On Load | Git worktree control patterns |

### assets/

| File | Exists? | Purpose |
|------|---------|---------|
| (none) | | |

### Discrepancies

- **No discrepancies.** SKILL.md correctly references exactly the 2 reference files that exist. No phantom references, no orphan files.

### Conflicts

- None.

### Gaps

- **No scripts** — This skill describes delegation patterns but has no validation scripts. It cannot programmatically verify that a delegation envelope is well-formed or that worktree isolation is active.
- **No evals** — No trigger-queries.json or evals.json for testing skill activation accuracy.
- **No agent frontmatter template** — Despite teaching how to create agents, it has no agent frontmatter template. The template exists in meta-builder's `assets/agent-frontmatter.md` instead.

---

## SKILL: command-dev

### Directory Structure

```
.claude/skills/command-dev/
├── SKILL.md (80L)
└── references/
    ├── non-interactive-shell.md (224L)
    └── command-anatomy.md (119L)
```

### scripts/

| Script | Exists? | Lines | Purpose | Called From SKILL.md | Dependencies |
|--------|---------|-------|---------|---------------------|-------------|
| (none) | | | | | |

### references/

| File | Exists? | Lines | Purpose | Required/Mandatory | Covers What |
|------|---------|-------|---------|-------------------|-------------|
| non-interactive-shell.md | ✅ | 224 | Full banned commands list, environment variables, non-interactive flags, behavioral standards | MANDATORY On Load | Non-interactive shell safety |
| command-anatomy.md | ✅ | 119 | Full command template with $ARGUMENTS, !bash, @file, agent:, subtask: patterns | MANDATORY On Load | Command structure and template |

### assets/

| File | Exists? | Purpose |
|------|---------|---------|
| (none) | | |

### Discrepancies

- **No discrepancies.** SKILL.md correctly references exactly the 2 reference files. Both are substantive (not stubs).

### Conflicts

- **`non-interactive-shell.md`** content significantly overlaps with the standalone skill `opencode-non-interactive-shell` available in `.opencode/skills/`. Both cover the same topic (non-interactive shell safety, banned commands, CI=true). The command-dev version (224L) is more detailed than typical standalone skill content.

### Gaps

- **No scripts** — Cannot validate command frontmatter, test shell safety, or verify !bash patterns programmatically.
- **No evals** — No trigger query testing for this skill.
- **No command template in assets/** — The template exists inside `command-anatomy.md` rather than as a standalone file. Compare with meta-builder which has `assets/command-frontmatter.md`.

---

## SKILL: custom-tools-dev

### Directory Structure

```
.claude/skills/custom-tools-dev/
├── SKILL.md (86L)
└── references/
    ├── plugin-lifecycle.md (147L)
    └── zod-patterns.md (128L)
```

### scripts/

| Script | Exists? | Lines | Purpose | Called From SKILL.md | Dependencies |
|--------|---------|-------|---------|---------------------|-------------|
| (none) | | | | | |

### references/

| File | Exists? | Lines | Purpose | Required/Mandatory | Covers What |
|------|---------|-------|---------|-------------------|-------------|
| plugin-lifecycle.md | ✅ | 147 | Plugin init→register→event loop→shutdown pattern with TypeScript code examples | MANDATORY On Load | Plugin architecture and lifecycle |
| zod-patterns.md | ✅ | 128 | Zod schema Good/Bad examples, common mistakes, type safety patterns | MANDATORY On Load | Zod schema design patterns |

### assets/

| File | Exists? | Purpose |
|------|---------|---------|
| (none) | | |

### Discrepancies

- **No discrepancies.** SKILL.md correctly references exactly the 2 reference files. Both are substantive.

### Conflicts

- None.

### Gaps

- **No scripts** — Cannot validate Zod schemas, check plugin layer size, or verify tool naming conventions programmatically.
- **No evals** — No trigger query testing.
- **Thinnest skill** — Only 86L SKILL.md + 2 references = 361L total. Adequate for P2 domain skill but lacks enforcement scripts.

---

## SKILL: skill-synthesis

### Directory Structure

```
.claude/skills/skill-synthesis/
├── SKILL.md (174L)
├── scripts/
│   ├── validate-skill.sh (187L) ← COPY of use-authoring-skills
│   ├── validate-gate.sh (118L) ← COPY of use-authoring-skills
│   ├── check-overlaps.sh (203L) ← COPY of use-authoring-skills
│   ├── run-trigger-evals.sh (166L) — UNIQUE
│   ├── ingest-repo.sh (111L) — UNIQUE
│   ├── grade-outputs.sh (180L) — UNIQUE
│   └── classify-pattern.sh (143L) — UNIQUE
├── references/
│   ├── 01-github-ingestion.md (242L)
│   ├── 02-pattern-classifier.md (242L)
│   ├── 03-eval-framework.md (201L)
│   ├── 04-quality-matrix.md (125L)
│   └── 05-template-library.md (194L)
├── templates/
│   ├── skill-scaffold.md (81L)
│   └── eval-scaffold.json (18L)
└── evals/
    ├── evals.json (57L)
    └── trigger-queries.json (24L)
```

### scripts/

| Script | Exists? | Lines | Purpose | Called From SKILL.md | Dependencies |
|--------|---------|-------|---------|---------------------|-------------|
| validate-skill.sh | ✅ | 187 | Exact copy of use-authoring-skills version | ✅ Phase 4 VALIDATE | None |
| validate-gate.sh | ✅ | 118 | Exact copy of use-authoring-skills version | ✅ Phase 4 VALIDATE | validate-skill.sh, check-overlaps.sh |
| check-overlaps.sh | ✅ | 203 | Exact copy of use-authoring-skills version | ✅ Phase 4 VALIDATE | None |
| run-trigger-evals.sh | ✅ | 166 | Evaluates trigger-queries.json against SKILL.md description using keyword matching | ✅ Phase 4 VALIDATE | jq, trigger-queries.json, SKILL.md |
| ingest-repo.sh | ✅ | 111 | Fetches GitHub repo via repomix --remote, extracts SKILL.md paths, outputs JSON | ✅ Phase 1 INGEST | repomix CLI, jq |
| grade-outputs.sh | ✅ | 180 | Grades skill on 5 dimensions using mechanical proxies, outputs JSON | ✅ Phase 4 VALIDATE | jq, awk |
| classify-pattern.sh | ✅ | 143 | Classifies skill as P1/P2/P3 by line count + refs, outputs JSON | ✅ Phase 2 CLASSIFY | jq |

### references/

| File | Exists? | Lines | Purpose | Required/Mandatory | Covers What |
|------|---------|-------|---------|-------------------|-------------|
| 01-github-ingestion.md | ✅ | 242 | Repomix remote ingestion CLI, --include patterns, output format, error handling | Load for "create skills from GitHub" | GitHub repo ingestion |
| 02-pattern-classifier.md | ✅ | 242 | 3-axis taxonomy (pattern/routing/efficiency/testing), P1/P2/P3 thresholds | Load for "find skill patterns" | Skill classification |
| 03-eval-framework.md | ✅ | 201 | Eval structure from agentskills.io, trigger-queries.json format, grading protocol | Load for "generate evals" | Eval framework design |
| 04-quality-matrix.md | ✅ | 125 | Adapted from use-authoring-skills 05-skill-quality-matrix, mechanical proxy checks | Load for "score this skill" | Quality scoring via scripts |
| 05-template-library.md | ✅ | 194 | Template extraction from classified corpus, scaffold generation process | Load for "build a template" | Template extraction and scaffolding |

### assets/

| File | Exists? | Purpose |
|------|---------|---------|
| (none — templates/ used instead) | | |

### Discrepancies

- **3 copied scripts:** `validate-skill.sh`, `validate-gate.sh`, `check-overlaps.sh` are byte-for-byte copies from use-authoring-skills. If a bug is fixed in one, the other must be manually updated.
- **Orphan: `task_plan.md`** (10L) exists at skill root — leftover planning artifact.
- **SKILL.md references `validate-gate.sh` with `synthesize` action** (line 31) but the script only supports `create|edit|audit`. Running `bash scripts/validate-gate.sh synthesize "..." ` would fail with "Unknown action 'synthesize'".

### Conflicts

- **3 identical script copies** with use-authoring-skills (see Discrepancies above).
- **`04-quality-matrix.md`** explicitly states it's "Adapted from `use-authoring-skills/references/05-skill-quality-matrix.md`" — overlapping coverage with different focus (mechanical proxy checks vs full rubric).

### Gaps

- **`validate-gate.sh` doesn't support `synthesize` action** — SKILL.md line 31 calls it with action `synthesize` but the script only accepts `create|edit|audit`. This is a functional bug.
- **`run-trigger-evals.sh` requires `jq`** — Hard dependency on jq but no fallback (unlike register-skill.sh which has a pure-bash path). Will fail on systems without jq.

---

## SKILL: agent-authorization

### Directory Structure

```
.claude/skills/agent-authorization/
├── SKILL.md (233L)
├── scripts/
│   ├── check-overlaps.sh (131L)
│   └── validate-skill.sh (150L)
└── references/
    └── gates.md (447L)
```

### scripts/

| Script | Exists? | Lines | Purpose | Called From SKILL.md | Dependencies |
|--------|---------|-------|---------|---------------------|-------------|
| check-overlaps.sh | ✅ | 131 | Domain-specific overlap detection: checks file refs, gate content duplication, specialist profile segmentation | ❌ Not referenced in SKILL.md | gates.md |
| validate-skill.sh | ✅ | 150 | Validates agent-authorization skill: frontmatter, trigger phrases, gate definitions, specialist count | ❌ Not referenced in SKILL.md | SKILL.md, gates.md |

### references/

| File | Exists? | Lines | Purpose | Required/Mandatory | Covers What |
|------|---------|-------|---------|-------------------|-------------|
| gates.md | ✅ | 447 | Full gate architecture, 4 gate definitions with criteria/failure messages, checkpoint types (XML), specialist profiles, capability matrix | ✅ Referenced in "First Action" section | Authorization gate system |

### assets/

| File | Exists? | Purpose |
|------|---------|---------|
| (none) | | |

### Discrepancies

- **2 orphan scripts:** Neither `check-overlaps.sh` nor `validate-skill.sh` are referenced in SKILL.md. The skill says nothing about running validation scripts. Compare with use-authoring-skills where every script is documented in a Scripts table and referenced in the workflow.
- **SKILL.md references `references/gates.md`** (line 232: "Reference Files" section) ✅ — exists and is substantive (447L).
- **`validate-skill.sh` uses color codes (ANSI escapes)** — Unlike the use-authoring-skills version which uses plain text PASS/FAIL. This is a style difference, not a bug, but indicates different authorship.
- **`check-overlaps.sh` always exits 0** (line 130) — even when warnings are found. The use-authoring-skills version exits 1 on overlaps. This means overlap detection in agent-authorization is advisory only and cannot be used as a gate.

### Conflicts

- **`validate-skill.sh` is domain-specific** (checks for "agent-authorization" name, gates.md, specialist count) — completely different from the generic versions in use-authoring-skills and skill-synthesis. No code conflict but different validation philosophy.
- **`check-overlaps.sh` is domain-specific** — checks gate-specific patterns (gate definitions, specialist profiles) rather than generic content duplication.

### Gaps

- **No evals** — No trigger-queries.json or evals.json. The skill has no testing for its activation accuracy.
- **Scripts not integrated into workflow** — The skill has validation scripts but never instructs agents to run them. This violates the agentskills.io principle "Validate before done."
- **No templates** — No authorization checkpoint template, gate prompt template (despite SKILL.md showing XML examples inline). The XML checkpoint templates in SKILL.md (lines 111-157) should be in assets/.

---

## AGGREGATE FINDINGS

### Scripts Summary

| Metric | Count |
|--------|-------|
| Total scripts | 23 |
| With clear purpose | 23 (100%) |
| With dependencies | 10 (43%) |
| Called from SKILL.md | 14 (61%) |
| Orphan (not referenced) | 9 (39%) |
| Identical copies across skills | 3 scripts × 2 copies = 6 files |
| Phantom references | 0 |

**Detailed orphan scripts:**
1. meta-builder: `graph-traverse.sh`, `register-skill.sh`, `state-persist.sh`, `graph-init.sh` (4 scripts)
2. agent-authorization: `check-overlaps.sh`, `validate-skill.sh` (2 scripts)
3. use-authoring-skills: `check-complete.sh`, `init-session.sh` (indirectly used via hooks, not via SKILL.md workflow) (2 scripts)
4. skill-synthesis: `classify-pattern.sh` (referenced in Phase 2 but not in decision tree) (1 script)

### References Summary

| Metric | Count |
|--------|-------|
| Total reference files | 33 |
| Lines of reference content | 3,887 |
| Stubs (placeholder content) | 4 (all in meta-builder) |
| Substantive references | 29 |
| Avg lines per substantive reference | 133 |
| Overlapping coverage | 3 pairs (see below) |

**Overlapping coverage:**
1. `use-authoring-skills/references/05-skill-quality-matrix.md` ↔ `skill-synthesis/references/04-quality-matrix.md` — skill-synthesis explicitly adapted from use-authoring-skills version
2. `command-dev/references/non-interactive-shell.md` ↔ standalone skill `opencode-non-interactive-shell` — same topic, different skill directories
3. `use-authoring-skills/references/09-script-authoring.md` ↔ `use-authoring-skills/references/12-anti-deception.md` — both cover validation enforcement from different angles

### Conflicts Found

| Script/Ref | Skill A | Skill B | Nature of Conflict |
|------------|---------|---------|-------------------|
| `validate-skill.sh` | use-authoring-skills (187L) | skill-synthesis (187L) | **IDENTICAL COPY** — must be synced manually |
| `check-overlaps.sh` | use-authoring-skills (203L) | skill-synthesis (203L) | **IDENTICAL COPY** — must be synced manually |
| `validate-gate.sh` | use-authoring-skills (118L) | skill-synthesis (118L) | **IDENTICAL COPY** — must be synced manually |
| `validate-skill.sh` | use-authoring-skills (187L) | agent-authorization (150L) | **Different implementations** — generic vs domain-specific |
| `check-overlaps.sh` | use-authoring-skills (203L) | agent-authorization (131L) | **Different implementations** — generic content vs gate-specific |
| `register-skill.sh` | meta-builder (24L) | use-authoring-skills (122L) | **Different implementations** — read-only probe vs write registration |
| `non-interactive-shell.md` | command-dev references | opencode-non-interactive-shell skill | **Topic overlap** — same domain in two locations |

### Gap Summary

| Skill | Missing Bundle | Impact |
|-------|---------------|--------|
| meta-builder | 4 depth references are stubs (17L, 13L, 12L, 13L) | **HIGH** — SKILL.md claims detailed guidance exists but agents find empty placeholders when loading these files |
| meta-builder | 4 scripts not referenced in SKILL.md | **MEDIUM** — agents won't know to run graph-traverse, state-persist, graph-init, or register-skill |
| agents-and-subagents-dev | No scripts at all | **MEDIUM** — cannot validate delegation envelopes or check worktree status programmatically |
| agents-and-subagents-dev | No evals | **LOW** — cannot test trigger accuracy |
| agents-and-subagents-dev | No agent frontmatter template | **LOW** — relies on meta-builder's assets/ instead |
| command-dev | No scripts at all | **MEDIUM** — cannot validate command structure or shell safety |
| command-dev | No evals | **LOW** — cannot test trigger accuracy |
| custom-tools-dev | No scripts at all | **MEDIUM** — cannot validate Zod schemas or plugin structure |
| custom-tools-dev | No evals | **LOW** — cannot test trigger accuracy |
| skill-synthesis | `validate-gate.sh` doesn't support `synthesize` action | **HIGH** — SKILL.md calls script with unsupported action, causing guaranteed failure |
| agent-authorization | Scripts not integrated into workflow | **MEDIUM** — has validation scripts but SKILL.md never instructs agents to run them |
| agent-authorization | No evals | **LOW** — cannot test trigger accuracy |
| agent-authorization | No templates for checkpoint XML | **LOW** — XML templates are inline in SKILL.md rather than in assets/ |

### Functional Bug

**skill-synthesis `validate-gate.sh` action mismatch:**
- SKILL.md line 31: `bash scripts/validate-gate.sh synthesize "<user-request>" <output-dir>`
- Script only supports: `create`, `edit`, `audit`
- Running with `synthesize` → exits 1 with "Unknown action 'synthesize'"
- **Fix:** Either add `synthesize` as a valid action in the script, or change SKILL.md to use `create` instead.

---

_Scanned: 2026-04-09_
_Auditor: A (Bundle Scanner)_
_Total files scanned: 75_
_Total lines read: ~5,900+_
