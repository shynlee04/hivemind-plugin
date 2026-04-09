# Bundle Scan — Remaining Skills (2026-04-09)
## Auditor: D | Scope: 5 skills

---

## SKILL: harness-audit

**Location:** `.claude/skills/harness-audit/`
**OpenCode duplicate:** `.opencode/skills/harness-audit/` — **NOT FOUND** (only exists in `.claude/skills/`)

### Directory Structure

```
.claude/skills/harness-audit/
├── SKILL.md                                    # 152 lines — thin orchestrator
├── assets/
│   └── profiles/
│       ├── phase-1-skills.md                   # 433 lines — skills audit profile
│       ├── phase-2-commands.md                 # 292 lines — commands audit profile
│       ├── phase-3-tools.md                    # 219 lines — tools audit profile
│       ├── phase-4-permissions.md              #  29 lines — permissions audit profile
│       ├── phase-5-agents.md                   # 136 lines — agents audit profile
│       ├── phase-6-subagents.md                #  92 lines — subagents audit profile
│       └── phase-7-synthesis.md                # 275 lines — synthesis audit profile
├── references/
│   └── pointers.md                             #  40 lines — skill pointer table
├── scripts/
│   ├── compile-bundle.sh                       #  73 lines — compiles profiles to .harness-audit/compiled/
│   └── validate-skill.sh                       #  47 lines — validates skill structure
└── .harness-audit/
    └── compiled/                               # 7 files — compiled copies of profiles
        ├── phase-1-skills.md                   # 433 lines
        ├── phase-2-commands.md                 # 292 lines
        ├── phase-3-tools.md                    # 219 lines
        ├── phase-4-permissions.md              #  29 lines
        ├── phase-5-agents.md                   # 136 lines
        ├── phase-6-subagents.md                #  92 lines
        └── phase-7-synthesis.md                # 275 lines
```

### scripts/

| Script | Exists? | Lines | Purpose | Called From SKILL.md | Dependencies |
|--------|---------|-------|---------|---------------------|-------------|
| `scripts/compile-bundle.sh` | YES | 73 | Validates each profile has required envelope fields (role, core_principle, verification_dimensions, structured_returns, success_criteria) then copies valid ones to `.harness-audit/compiled/` | YES — Line 51: "Run `bash scripts/compile-bundle.sh`" | `bash`, `grep`, `cp`, `mkdir`; validates against `assets/profiles/phase-*-*.md` |
| `scripts/validate-skill.sh` | YES | 47 | Validates SKILL.md has name/description frontmatter, exactly 7 profiles in assets/profiles/, pointers.md exists, compile-bundle.sh exists | YES — Line 52: "Run `bash scripts/validate-skill.sh`" | `bash`, `grep`, `ls`, `wc`; depends on `assets/profiles/`, `references/pointers.md`, `scripts/compile-bundle.sh` |

### references/

| File | Exists? | Lines | Purpose | Required/Mandatory | Covers What |
|------|---------|-------|---------|---------------------|-------------|
| `references/pointers.md` | YES | 40 | Maps each of 7 audit phases to an external skill that provides execution context | Mandatory (referenced by validate-skill.sh line 32) | Phase→Skill mapping table; loading instructions for subagents |

### assets/

| File | Exists? | Lines | Purpose |
|------|---------|-------|---------|
| `assets/profiles/phase-1-skills.md` | YES | 433 | Subagent profile for skills audit — trigger accuracy, frontmatter validation, body quality, reference integrity |
| `assets/profiles/phase-2-commands.md` | YES | 292 | Subagent profile for commands audit — frontmatter validity, $ARGUMENTS parsing, agent reference, determinism |
| `assets/profiles/phase-3-tools.md` | YES | 219 | Subagent profile for tools audit — built-in tools, custom tools, Zod schemas, plugin lifecycle |
| `assets/profiles/phase-4-permissions.md` | YES | 29 | Subagent profile for permissions audit — cascading, glob patterns, overrides, conflicts |
| `assets/profiles/phase-5-agents.md` | YES | 136 | Subagent profile for agents audit — structure, role clarity, delegation acyclic, permission chain |
| `assets/profiles/phase-6-subagents.md` | YES | 92 | Subagent profile for subagents audit — spawn patterns, session inheritance, task config |
| `assets/profiles/phase-7-synthesis.md` | YES | 275 | Subagent profile for synthesis — aggregate all findings into unified audit report |

### Discrepancies

- **[ORPHAN] `.harness-audit/compiled/` directory** — 7 compiled files exist but SKILL.md never mentions this directory. The `compile-bundle.sh` script writes here, but SKILL.md only says "compile all 7 subagent profiles" without specifying the output location. The compiled files are exact copies of the source profiles — no transformation occurs.
- **[ORPHAN] `.harness-audit/compiled/phase-*-*.md` (7 files)** — Generated build artifacts that are not documented in the architecture tree in SKILL.md (lines 31-47). The architecture tree does not show `.harness-audit/`.

### Conflicts

- **None** — No cross-skill conflicts detected. All files are self-contained within this skill.

### Gaps

- **phase-4-permissions.md is skeletal** — Only 29 lines compared to 92-433 for other profiles. May lack sufficient depth for a meaningful permissions audit (only has header + envelope, likely missing detailed verification procedures).
- **SKILL.md does not document `.harness-audit/compiled/` output** — The architecture tree (lines 31-47) omits the compiled output directory, creating confusion about where build artifacts go.
- **No cleanup mechanism** — `compile-bundle.sh` does `cp` (overwrite) but never cleans stale files from `.harness-audit/compiled/` if a profile is removed.

---

## SKILL: harness-delegation-inspection

**Location:** `.claude/skills/harness-delegation-inspection/`
**OpenCode duplicate:** `.opencode/skills/harness-delegation-inspection/` — **NOT FOUND** (only exists in `.claude/skills/`)

### Directory Structure

```
.claude/skills/harness-delegation-inspection/
├── SKILL.md                                    # 194 lines — domain reference skill
└── references/
    ├── gsd-execution-patterns.md               # 307 lines — real GSD execution model
    ├── mcp-server-reality.md                   # 173 lines — available MCP servers
    ├── ecosystem-structure.md                  # 208 lines — labs→symlinks→.opencode pipeline
    ├── context-continuity.md                   # 206 lines — state across sessions
    └── opencode-platform-reality.md            # 323 lines — platform internals
```

### scripts/

| Script | Exists? | Lines | Purpose | Called From SKILL.md | Dependencies |
|--------|---------|-------|---------|---------------------|-------------|
| *(none)* | N/A | N/A | N/A | N/A | N/A |

### references/

| File | Exists? | Lines | Purpose | Required/Mandatory | Covers What |
|------|---------|-------|---------|---------------------|-------------|
| `references/gsd-execution-patterns.md` | YES | 307 | Documents actual GSD execution loop: init→parse→connect→launch→fail-resume, not templates | Mandatory (SKILL.md "On Load" step 1) | gsd-tools.cjs CLI, checkpoint protocol, atomic commits, wave-based execution |
| `references/mcp-server-reality.md` | YES | 173 | Maps available MCP servers (Context7, Tavily, Repomix, GitHub, Brave, etc.) with actual URLs and commands | Mandatory (SKILL.md "On Load" step 2) | MCP server inventory, tool calling conventions |
| `references/ecosystem-structure.md` | YES | 208 | Three-entity model: OpenCode (platform), HiveMind (parent), Hivefiver (meta-builder); pipeline: labs→symlinks→.opencode | Mandatory (SKILL.md "On Load" step 3) | Entity boundaries, deployment pipeline, directory conventions |
| `references/context-continuity.md` | YES | 206 | Session recovery, auto-compaction, checkpoint/restore, state files (.planning/STATE.md) | Mandatory (SKILL.md "On Load" step 4) | Context window management, state persistence, resume by session ID |
| `references/opencode-platform-reality.md` | YES | 323 | Platform architecture, skill system, plugin loading, permission model, compaction behavior | Mandatory (SKILL.md "On Load" step 5) | OpenCode internals, config structure, skill discovery |

### assets/

| File | Exists? | Purpose |
|------|---------|---------|
| *(none)* | N/A | N/A |

### Discrepancies

- **None** — All 5 references listed in SKILL.md "On Load" (lines 30-35) and "Reference Map" (lines 189-194) exist on disk. No phantom references.

### Conflicts

- **None** — All files are self-contained. No overlap with other skills.

### Gaps

- **No scripts/** — This is a pure reference skill (no build/validation scripts). This is appropriate for its role as a domain-knowledge reference.
- **No assets/** — No templates or profiles needed. Appropriate for a reference skill.
- **Heavy "On Load" cost** — SKILL.md instructs agents to read ALL 5 references on load (lines 30-35). Total: 1,217 lines across 5 files. This is significant context consumption before any work begins. The skill could benefit from progressive disclosure (read-on-demand rather than read-all-on-load).

---

## SKILL: command-parser

**Location:** `.claude/skills/command-parser/`
**OpenCode duplicate:** `.opencode/skills/command-parser/` — **NOT FOUND** (only exists in `.claude/skills/`)

### Directory Structure

```
.claude/skills/command-parser/
├── SKILL.md                                    #  79 lines — propositional command parser
├── references/
│   └── parsing-rules.md                        #  71 lines — grammar specification
└── task_plan.md                                #  17 lines — development task plan
```

### scripts/

| Script | Exists? | Lines | Purpose | Called From SKILL.md | Dependencies |
|--------|---------|-------|---------|---------------------|-------------|
| *(none)* | N/A | N/A | N/A | N/A | N/A |

### references/

| File | Exists? | Lines | Purpose | Required/Mandatory | Covers What |
|------|---------|-------|---------|---------------------|-------------|
| `references/parsing-rules.md` | YES | 71 | Formal grammar for $ARGUMENT parsing: token classification (named_arg, flag_arg, positional), edge cases | Mandatory (SKILL.md `<files_to_read>` block line 22) | BNF grammar, edge case table, examples |

### assets/

| File | Exists? | Purpose |
|------|---------|---------|
| *(none)* | N/A | N/A |

### Discrepancies

- **[ORPHAN] `task_plan.md`** — This file exists in the skill directory but is NOT referenced anywhere in SKILL.md. It appears to be a development artifact from skill creation (contains a checklist with items like "G1: Intent captured", "G5: validate-skill.sh passes"). It references `validate-skill.sh` which does not exist in this skill (that script belongs to harness-audit).
- **[PHANTOM] `validate-skill.sh` reference in task_plan.md** — Line 11 of task_plan.md mentions "G5: validate-skill.sh passes" but this skill has no `scripts/` directory and no `validate-skill.sh`. This is a stale reference from a different skill's development workflow.

### Conflicts

- **None** — No cross-skill conflicts.

### Gaps

- **No scripts/** — This is a pure reference skill for mental parsing (the LLM performs parsing, not code). Appropriate for its function.
- **Stale development artifact** — `task_plan.md` should be cleaned up. It's a development-phase checklist that serves no purpose in the deployed skill and could confuse agents loading the skill.

---

## SKILL: hm-deep-research

**Location:** `.claude/skills/hm-deep-research/`
**OpenCode duplicate:** `.opencode/skills/hm-deep-research/` — **NOT FOUND** (only exists in `.claude/skills/`)

### Directory Structure

```
.claude/skills/hm-deep-research/
├── SKILL.md                                    # 234 lines — multi-stage research orchestrator
└── references/
    ├── stage-1-framing.md                      # 243 lines — research framing procedures
    ├── stage-2-domain-research.md              # 204 lines — domain-level research execution
    ├── stage-3-cross-tech-research.md           # 203 lines — multi-agent cross-domain research
    ├── stage-4-validation-synthesis.md          # 221 lines — evidence scoring and report writing
    ├── tool-operations.md                       # 381 lines — per-tool operational knowledge
    ├── cheat-sheets.md                          # 297 lines — copy-paste tool invocation examples
    ├── research-plan-template.md                #  50 lines — Stage 1 output template
    ├── findings-format-template.md              #  75 lines — Stage 2-3 findings template
    └── synthesis-report-template.md             #  92 lines — Stage 4 output template
```

### scripts/

| Script | Exists? | Lines | Purpose | Called From SKILL.md | Dependencies |
|--------|---------|-------|---------|---------------------|-------------|
| *(none)* | N/A | N/A | N/A | N/A | N/A |

### references/

| File | Exists? | Lines | Purpose | Required/Mandatory | Covers What |
|------|---------|-------|---------|---------------------|-------------|
| `references/stage-1-framing.md` | YES | 243 | Research question writing, hypothesis formation, context budget estimation | Mandatory (SKILL.md line 41: "MANDATORY: Load references/stage-1-framing.md") | Research types, framing checklist, gate criteria |
| `references/stage-2-domain-research.md` | YES | 204 | Per-research-type tool bundles, query refinement, findings protocol | Mandatory (SKILL.md line 66: "MANDATORY: Load references/stage-2-domain-research.md") | Tool sequences by research type, research loop, context budget rules |
| `references/stage-3-cross-tech-research.md` | YES | 203 | Delegation triggers, wave structure, subagent prompt envelope | Conditional (SKILL.md line 115: "MANDATORY: Load" when Stage 3 needed) | Trigger scenarios, agent patterns, prompt envelope (5 required sections) |
| `references/stage-4-validation-synthesis.md` | YES | 221 | Evidence scoring rubric, citation format, synthesis report structure | Mandatory (SKILL.md line 156: "MANDATORY: Load references/stage-4-validation-synthesis.md") | Evidence levels (Direct/Correlational/Testimonial/Absence), citation format |
| `references/tool-operations.md` | YES | 381 | Per-tool params, rate limits, pitfalls, best practices | On-demand (SKILL.md line 81: "see tool-operations.md") | Tavily, Context7, Repomix, DeepWiki, Brave, Exa, Fetcher operational details |
| `references/cheat-sheets.md` | YES | 297 | Copy-paste tool invocation examples with parameter values | On-demand (SKILL.md line 20: Quick Jump table) | All tool cheat sheets with example invocations |
| `references/research-plan-template.md` | YES | 50 | Template for Stage 1 output (research plan) | Required at Stage 1 (SKILL.md line 61) | Research question, hypotheses, tool budget, scope |
| `references/findings-format-template.md` | YES | 75 | Template for Stage 2-3 findings output | Required at Stages 2-3 (SKILL.md line 91) | Findings structure, per-hypothesis results |
| `references/synthesis-report-template.md` | YES | 92 | Template for Stage 4 final deliverable | Required at Stage 4 (SKILL.md line 181) | Executive summary, key findings, gaps, source index |

### assets/

| File | Exists? | Purpose |
|------|---------|---------|
| *(none)* | N/A | N/A |

### Discrepancies

- **None** — All 9 references listed in SKILL.md "References" section (lines 214-224) exist on disk. No phantom references detected. SKILL.md accurately describes each file's purpose.

### Conflicts

- **Cross-reference to external skill:** `stage-3-cross-tech-research.md` (line 5) and SKILL.md (lines 111, 117) reference the `coordinating-loop` skill as a prerequisite for Stage 3. This is an external dependency, not a conflict, but it means Stage 3 cannot function without `coordinating-loop` being available.
- **No other cross-skill conflicts.**

### Gaps

- **No scripts/** — Appropriate for a research orchestrator that delegates to tools/MCP servers rather than running bash scripts.
- **Heavy reference load** — 9 reference files totaling 1,766 lines. SKILL.md uses progressive disclosure (load on demand per stage), which mitigates context cost. The "When NOT to Load References" table (lines 226-233) is well-designed.
- **Templates are unpopulated** — `research-plan-template.md`, `findings-format-template.md`, `synthesis-report-template.md` contain markdown templates inside code fences. Agents must copy these templates and fill them. This is by design but could be fragile if the agent doesn't copy the full template.

---

## SKILL: eval-harness

**Location:** `.agents/skills/eval-harness/`
**OpenCode duplicate:** `.opencode/skills/eval-harness/` — **NOT FOUND** (only exists in `.agents/skills/`)

### Directory Structure

```
.agents/skills/eval-harness/
└── SKILL.md                                    # 270 lines — eval-driven development framework
```

### scripts/

| Script | Exists? | Lines | Purpose | Called From SKILL.md | Dependencies |
|--------|---------|-------|---------|---------------------|-------------|
| *(none)* | N/A | N/A | N/A | N/A | N/A |

### references/

| File | Exists? | Lines | Purpose | Required/Mandatory | Covers What |
|------|---------|-------|---------|---------------------|-------------|
| *(none)* | N/A | N/A | N/A | N/A | N/A |

### assets/

| File | Exists? | Purpose |
|------|---------|---------|
| *(none)* | N/A | N/A |

### Discrepancies

- **[ORPHAN in principle]** SKILL.md references storage at `.claude/evals/` (lines 188-194) for eval definitions, run history, and baselines. This is an external output path, not a skill-internal file. No phantom references within the skill directory itself.
- **SKILL.md mentions commands that don't exist** — Lines 168-183 reference `/eval define`, `/eval check`, `/eval report` commands. These are conceptual integration patterns, not implemented slash commands. No `.opencode/commands/eval*` files were found.

### Conflicts

- **None** — Self-contained single-file skill.

### Gaps

- **No references/** — The entire skill is one 270-line SKILL.md with no supplementary material. For a framework covering eval types, graders, metrics, and workflow, this is unusually lean.
- **No templates** — SKILL.md defines eval definition format (lines 32-39), regression eval format (lines 44-50), and report format (lines 142-163) inline. These would benefit from template files in `references/` for consistency.
- **No scripts/** — No validation or runner scripts. The eval workflow relies entirely on the LLM reading SKILL.md and manually performing each step.
- **No bash grader implementations** — Code grader examples (lines 59-67) are illustrative only. No executable grader scripts.
- **Location mismatch** — This skill lives in `.agents/skills/` (global scope) while the other 4 skills live in `.claude/skills/` (project scope). This is intentional (ECC origin = globally available), but worth noting for consistency.

---

## AGGREGATE FINDINGS

### Scripts Summary

| Metric | Value |
|--------|-------|
| Total skills with scripts | 1 of 5 (harness-audit only) |
| Total scripts | 2 |
| Scripts with clear purpose | 2 of 2 |
| Scripts with external dependencies | 0 (all use standard bash/grep/cp/mkdir) |
| Phantom script references | 0 |

**Script inventory:**

| Script | Skill | Lines | Purpose | External deps |
|--------|-------|-------|---------|--------------|
| `compile-bundle.sh` | harness-audit | 73 | Validate + copy profiles to compiled/ | None (bash builtins) |
| `validate-skill.sh` | harness-audit | 47 | Validate skill structure integrity | None (bash builtins) |

### References Summary

| Metric | Value |
|--------|-------|
| Total skills with references | 3 of 5 |
| Total reference files | 16 |
| Total reference lines | 2,877 |
| Phantom references (SKILL.md → missing file) | 0 |
| Orphan references (file → no SKILL.md mention) | 1 (`task_plan.md` in command-parser) |

**Reference inventory by skill:**

| Skill | Refs | Lines | Avg Lines/Ref |
|-------|------|-------|--------------|
| harness-delegation-inspection | 5 | 1,217 | 243 |
| hm-deep-research | 9 | 1,766 | 196 |
| harness-audit | 1 | 40 | 40 |
| command-parser | 1 | 71 | 71 |
| eval-harness | 0 | 0 | N/A |

### Assets Summary

| Metric | Value |
|--------|-------|
| Total skills with assets | 1 of 5 (harness-audit only) |
| Total asset files | 7 (all profile subagent templates) |
| Total asset lines | 1,476 |

### Conflicts Found

| Conflict | Skill A | Skill B | Nature |
|----------|---------|---------|--------|
| *(none)* | N/A | N/A | No cross-skill file conflicts detected. All 5 skills are self-contained. |

**Cross-skill dependencies (not conflicts, but important):**

| Dependency | Source Skill | Target Skill | Nature |
|------------|-------------|-------------|--------|
| Stage 3 requires `coordinating-loop` | hm-deep-research | coordinating-loop | Hard prerequisite for multi-agent research |
| Phase execution contexts | harness-audit | use-authoring-skills, command-dev, custom-tools-dev, opencode-platform-reference, agents-and-subagents-dev, coordinating-loop | Soft references (loaded by subagents, not skill itself) |
| `task_plan.md` references `validate-skill.sh` | command-parser | harness-audit | Stale development artifact — wrong skill |

### Gap Summary

| Skill | Missing Bundle | Impact | Severity |
|-------|---------------|--------|----------|
| harness-audit | SKILL.md doesn't document `.harness-audit/compiled/` output dir | Agents won't know where compiled profiles go; orphan build artifacts accumulate | LOW |
| harness-audit | `phase-4-permissions.md` is only 29 lines (others: 92-433) | Permissions audit may be superficial; inconsistent depth with other phases | MEDIUM |
| harness-audit | `compile-bundle.sh` doesn't clean stale files from compiled/ | If a profile is removed, stale compiled copy persists indefinitely | LOW |
| command-parser | `task_plan.md` is a stale development artifact not referenced by SKILL.md | No functional impact, but clutters skill directory and references non-existent `validate-skill.sh` | LOW |
| eval-harness | No `references/` directory — all content in single 270-line SKILL.md | Templates defined inline are fragile; no reusable artifacts | MEDIUM |
| eval-harness | No `scripts/` for graders or validation | Evals rely entirely on LLM discipline; no automated verification | LOW |
| eval-harness | `/eval` commands referenced but not implemented | Integration patterns are conceptual only — cannot be invoked | MEDIUM |
| eval-harness | Different location (`.agents/skills/` vs `.claude/skills/`) | Consistency issue; may confuse agents searching in wrong directory | LOW |
| harness-delegation-inspection | Heavy "On Load" — all 5 refs (1,217 lines) loaded upfront | Significant context cost before any work begins; could benefit from progressive disclosure | LOW |
| hm-deep-research | Templates are unpopulated markdown-in-code-fences | Agents must manually copy templates; risk of incomplete template use | LOW |

### `.opencode/skills/` Duplicate Check

| Skill Name | `.claude/skills/` | `.opencode/skills/` | Duplicate? |
|------------|-------------------|---------------------|------------|
| harness-audit | YES | NO | No duplicate |
| harness-delegation-inspection | YES | NO | No duplicate |
| command-parser | YES | NO | No duplicate |
| hm-deep-research | YES | NO | No duplicate |
| eval-harness | NO (in `.agents/skills/`) | NO | No duplicate |

**Result:** Zero duplicates found across all 5 skills.

---

_Scan completed: 2026-04-09_
_Auditor: D (Bundle Scanner)_
_Files scanned: 33_
_Total lines analyzed: ~7,812_
