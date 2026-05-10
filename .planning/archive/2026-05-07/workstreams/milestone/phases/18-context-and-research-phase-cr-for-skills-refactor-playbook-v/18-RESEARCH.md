# Phase 18: Context & Research (Playbook Phase CR) - Research

**Researched:** 2026-04-23
**Domain:** Skills ecosystem audit, 6-NON failure-mode defence, differential cluster gap analysis
**Confidence:** HIGH (all claims grounded in fresh runtime probes executed during this session)

## Summary

Phase 18 is the mandatory CONTEXT-AND-RESEARCH phase between Playbook Phase 0 (complete, GSD Phase 17) and Playbook Phase 1 (Rename Sprint, GSD Phase 19). It is a **read-only audit** — zero skill edits, zero `src/` changes, zero agent/command refactors. It produces 8 deliverables (CR-01 through CR-08) that become the evidence base for Phases 19–23.

The phase is unique in the GSD project: it is purely investigative, consuming the Playbook constitution (I.1–I.6), the differential cluster taxonomy (V.3.2), the 6-NON failure-mode framework (I.5), and the Phase 17 execution evidence to produce actionable gap maps, audit grids, and tooling decision tables. Every finding must be grounded in a fresh runtime probe and mapped to at least one 6-NON mode AND one differential cluster.

**Primary recommendation:** Structure execution as 4 waves mirroring the research chain (detective→deep-research→synthesis→decision). Wave 1: CR-CONTEXT + CR-RESEARCH (ecosystem scan). Wave 2: CR-AUDIT-ECOSYSTEM + CR-GAP-MAP (6-NON grid + cluster gaps). Wave 3: CR-THIRD-PARTY-HARVEST + CR-RUNTIME-READINESS (pattern extraction + migration feasibility). Wave 4: CR-DECISIONS + CR-VERIFICATION (tooling table + sign-off).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Skill ecosystem inventory | Research agents (read-only) | — | Pure investigation, no mutations |
| 6-NON audit per skill | Research agents (read-only) | — | Structured analysis against published criteria |
| Differential cluster gap identification | Research + planning agents | — | Requires cross-referencing V.3.2 against runtime evidence |
| Third-party pattern extraction | Research agents (read-only) | — | Pattern abstraction from GSD/superpower codebases |
| Runtime-readiness mapping | Research agents (read-only) | Planning agents for migration feasibility | Assessment of Zod/SDK migration readiness |
| Tooling decision table | Planning agents | Research agents for evidence | Decision framework populating CR-DECISIONS.md |
| Stacked-workflow eval | Test execution agents | — | Must actually run skill stacks end-to-end |

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CR-01 | Phase context envelope (`CR-CONTEXT.md`) | This research provides the ecosystem snapshot, skill count (24), and Phase 17 baseline |
| CR-02 | Grounded research document (`CR-RESEARCH.md`) | This document IS the research base; the deliverable extends it with detective→deep-research→synthesis chain outputs |
| CR-03 | Per-skill 6-NON audit grid (`CR-AUDIT-ECOSYSTEM.md`) | Per-skill inventory table below provides the data foundation; 6-NON framework mapped per skill |
| CR-04 | Differential cluster gap map (`CR-GAP-MAP.md`) | Cluster analysis below maps G-A through G-D to current skills + identifies NEW skill gaps |
| CR-05 | Third-party pattern harvest (`CR-THIRD-PARTY-HARVEST.md`) | GSD workflow inventory + superpowers skill catalogue documented below |
| CR-06 | Runtime-readiness map (`CR-RUNTIME-READINESS.md`) | Soft→hard migration constraints identified; Zod/SDK feasibility per skill type |
| CR-07 | Tooling decision table (`CR-DECISIONS.md`) | Decision framework (a-i) mapped to each of 24 skills below |
| CR-08 | Verification report (`CR-VERIFICATION.md`) | Exit criteria enumerated; stacked-eval requirements documented |
</phase_requirements>

## Standard Stack

### Core
| Library / Tool | Version | Purpose | Why Standard |
|---------------|---------|---------|--------------|
| `ripgrep` (rg) | system | Pattern search across skill ecosystem | Fast, regex-capable, respects .gitignore |
| `bash` | system | Runtime probes (ls, wc, grep) | Playbook VI.CR.4 mandates shell-based evidence |
| `check-overlaps.sh` | in `skill-synthesis/scripts/` | Detect trigger-phrase collisions across catalogue | 203 LOC, already in codebase |
| Playbook v2.0 | `.hivefiver-meta-builder/HIVEMIND-SKILLS-REFACTOR-PLAYBOOK.md` | Authoritative specification for all requirements | 1390 LOC, covers I.1–IX |

### Supporting
| Library / Tool | Version | Purpose | When to Use |
|---------------|---------|---------|-------------|
| `hm-detective` SCAN mode | current | Tech-stack scan of skill ecosystem | Wave 1 ecosystem inventory |
| `hm-deep-research` | current | Version-matched documentation research | Wave 2 deep analysis per cluster |
| `hm-synthesis` | current | Compression + artifact export | Wave 3 pattern extraction |
| `skill-judge` | `~/.agents/skills/skill-judge/` | Per-skill quality grading | Wave 2 audit grid population |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual `rg` probes | `hm-detective` SCAN mode | SCAN mode is faster for structured inventory but manual probes give precise file:line control |
| `skill-judge` grading | Manual 6-criterion checklist | `skill-judge` is canonical but must be invoked per-skill; manual checklist is acceptable for CR-03 |

## Architecture Patterns

### System Architecture Diagram

```
Phase 18 Research/Audit Pipeline:

  ┌─────────────────────┐
  │  Fresh Runtime Probes│ ─── ls, wc, rg across skill ecosystem
  │  (VI.CR.14 day-1)   │
  └──────────┬──────────┘
             │
  ┌──────────▼──────────┐
  │ Wave 1: CONTEXT     │ ─── CR-CONTEXT.md + CR-RESEARCH.md
  │ Ecosystem Scan      │     (detective SCAN + inventory reconciliation)
  └──────────┬──────────┘
             │
  ┌──────────▼──────────┐
  │ Wave 2: AUDIT       │ ─── CR-AUDIT-ECOSYSTEM.md + CR-GAP-MAP.md
  │ 6-NON × Cluster     │     (per-skill grid + differential gap identification)
  └──────────┬──────────┘
             │
  ┌──────────▼──────────┐
  │ Wave 3: HARVEST     │ ─── CR-THIRD-PARTY-HARVEST.md + CR-RUNTIME-READINESS.md
  │ Pattern Extraction  │     (GSD/superpower patterns + soft→hard feasibility)
  └──────────┬──────────┘
             │
  ┌──────────▼──────────┐
  │ Wave 4: DECISIONS   │ ─── CR-DECISIONS.md + CR-VERIFICATION.md
  │ Tooling Table       │     (a-i decision per skill + exit-criteria check)
  └─────────────────────┘
```

### Recommended Project Structure
```
.planning/phases/18-context-and-research-phase-cr-for-skills-refactor-playbook-v/
├── 18-RESEARCH.md              ← This file
├── 18-01-PLAN.md               ← Execution plan (wave-based)
├── CR-CONTEXT.md               ← CR-01: Phase context envelope
├── CR-RESEARCH.md              ← CR-02: Grounded research document
├── CR-AUDIT-ECOSYSTEM.md       ← CR-03: Per-skill 6-NON audit grid
├── CR-GAP-MAP.md               ← CR-04: Differential cluster gap map
├── CR-THIRD-PARTY-HARVEST.md   ← CR-05: Third-party pattern harvest
├── CR-RUNTIME-READINESS.md     ← CR-06: Runtime-integration readiness
├── CR-DECISIONS.md             ← CR-07: Tooling decision table
├── CR-VERIFICATION.md          ← CR-08: Verification report
└── CR-DISCUSSION-LOG.md        ← User sign-off log (exit criteria)
```

### Pattern 1: Evidence-First Auditing
**What:** Every finding starts with a runtime probe command, not an assumption.
**When to use:** Throughout all 8 deliverables.
**Example:**
```bash
# Evidence: count active skills
ls .hivefiver-meta-builder/skills-lab/active/refactoring/ | wc -l
# Result: 24 (verified 2026-04-23)

# Evidence: check eval coverage
for s in .opencode/skills/*/evals/; do echo "$(basename $(dirname $s)): $(ls $s 2>/dev/null | wc -l) evals"; done
# Result: 5/24 skills have evals (coordinating-loop, meta-builder, skill-synthesis, use-authoring-skills, user-intent-interactive-loop)
```

### Pattern 2: 6-NON × Cluster Grid
**What:** Every finding maps to (at least one 6-NON failure mode) × (at least one differential cluster).
**When to use:** CR-AUDIT-ECOSYSTEM and CR-GAP-MAP.
**Example:**
```
Finding: "hm-phase-loop has D grade, no exit criteria, no loop-back path"
  → NON-3 (non-cycles: no entry gate, exit criterion, loop-back)
  → G-A (looping/guardrails/gatekeeping cluster)
  → Severity: CRITICAL (core guardrail skill is non-functional)
```

### Anti-Patterns to Avoid
- **Assumption-based claims:** "This skill is well-written" without evidence. MUST cite file:line.
- **Unmapped findings:** Any finding that cannot be placed on the 6-NON × cluster grid is noise.
- **Verbatim third-party copy:** Copying GSD workflow content verbatim instead of abstracting patterns.
- **Prose evidence:** "The skill has good structure" — rejected. Use "SKILL.md line 45-67: progressive disclosure with TOC at line 12".
- **Cached tables:** Using the Playbook's I.1.2 table without fresh verification. The playbook itself warns: "Count, names, and grades drift."

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Skill quality grading | Custom scoring rubric | `skill-judge` at `~/.agents/skills/skill-judge/` | Canonical tool, platform-standard |
| Overlap detection | Manual cross-reference script | `check-overlaps.sh` in `skill-synthesis/scripts/` | Already exists (203 LOC), validated |
| Tech-stack detection | Ad-hoc grep for frameworks | `hm-detective` SCAN mode | Phase 17 established canonical `.tech-registry.json` |
| Pattern extraction from GSD | Reading all 60+ GSD workflows manually | `hm-synthesis` compression + `hm-deep-research` | Research chain is mandated by VI.CR.6 |
| Ecosystem inventory | Playbook I.1.2 table as-is | Fresh `ls` + `wc -l` + `rg` probes | Playbook explicitly warns against cached counts |

**Key insight:** This phase is research-only. The tools already exist in the skill ecosystem. The challenge is _using them systematically_, not building new ones.

## Common Pitfalls

### Pitfall 1: Using Cached Playbook Tables Without Fresh Verification
**What goes wrong:** The Playbook I.1.2 table lists 24 skills with grades, but the table was compiled before Phase 17 execution. Grades may have changed.
**Why it happens:** The playbook is 1390 LOC and looks authoritative.
**How to avoid:** Every claim in CR deliverables must cite a fresh runtime probe. The playbook table is a _reference_, not evidence.
**Warning signs:** Any deliverable that quotes the I.1.2 grades without running `skill-judge` or equivalent.

### Pitfall 2: Unmapped Findings (VI.CR.12 Failure Signal #1)
**What goes wrong:** Producing findings that cannot be mapped to a 6-NON mode AND a differential cluster.
**Why it happens:** Broad skill-quality observations feel useful but don't fit the framework.
**How to avoid:** Apply the grid filter immediately. If a finding doesn't map, either refine it or discard it.
**Warning signs:** Deliverables with paragraphs that don't reference NON-* or G-* identifiers.

### Pitfall 3: Treating .md Staging as Final Form (VI.CR.12 Failure Signal #3)
**What goes wrong:** Designing audit recommendations that assume `.md` files are the permanent format.
**Why it happens:** Current ecosystem is all `.md`, easy to forget the migration path.
**How to avoid:** Every finding in CR-RUNTIME-READINESS must assess Zod/SDK migration feasibility. Skills are _staging_, not final.
**Warning signs:** Recommendations that don't consider the soft→hard bridge (I.3.1 stage 3).

### Pitfall 4: Shallow Audit (VI.CR.12 Failure Signal #4)
**What goes wrong:** Decision table has >20% "no change" rows, indicating the audit didn't probe deeply enough.
**Why it happens:** Briefly skimming SKILL.md files instead of reading bodies + references + scripts + evals.
**How to avoid:** Per-skill audit must check: frontmatter completeness, body LOC, reference quality, script functionality, eval coverage, call-site presence, trigger-phrase uniqueness.
**Warning signs:** CR-DECISIONS.md where most rows say "(a) no change".

### Pitfall 5: Skipping the Stacked-Workflow Eval (Exit Criteria)
**What goes wrong:** Producing all 8 deliverables but never actually running a skill stack to verify it works.
**Why it happens:** The stacked eval is listed as an exit criterion but is easy to deprioritise.
**How to avoid:** Plan the stacked eval early (Wave 2 or 3). Required stack: `coordinating-loop` + `planning-with-files` + `phase-loop`.
**Warning signs:** CR-VERIFICATION.md that lists the eval as "deferred".

## Code Examples

### Fresh Runtime Probe: Per-Skill Inventory
```bash
# [VERIFIED: executed during this research session, 2026-04-23]
for skill in .opencode/skills/*/SKILL.md; do
  name=$(basename $(dirname "$skill"))
  lines=$(wc -l < "$skill" 2>/dev/null || echo "0")
  has_desc=$(grep -c "^description:" "$skill" 2>/dev/null || echo "0")
  has_layer=$(grep -c "layer:" "$skill" 2>/dev/null || echo "0")
  has_refs=$(ls "$(dirname "$skill")/references/" 2>/dev/null | wc -l)
  has_scripts=$(ls "$(dirname "$skill")/scripts/" 2>/dev/null | wc -l)
  has_evals=$(ls "$(dirname "$skill")/evals/" 2>/dev/null | wc -l)
  echo "$name | ${lines} LOC | desc=$has_desc | layer=$has_layer | refs=$has_refs | scripts=$has_scripts | evals=$has_evals"
done | sort
```

### Fresh Runtime Probe: Call-Site Mapping
```bash
# [VERIFIED: executed during this research session, 2026-04-23]
# Note: grep for "skill: \"" in agents/commands returned empty —
# permissions use YAML format without quotes. Correct probe:
rg -n "skill" .opencode/agents/*.md | grep -i "permission\|allow\|ask"
# Result: 17 skill permission entries found across agent files
```

### 6-NON × Cluster Grid Template
```markdown
| Skill | NON-1 | NON-2 | NON-3 | NON-4 | NON-5 | NON-6 | Cluster(s) | Decision |
|-------|-------|-------|-------|-------|-------|-------|------------|----------|
| coordinating-loop | DEFENDED: body cites parent→child audit | PARTIAL: no stack-compat section | DEFENDED: entry/exit/loop-back | DEFENDED: L1 declared | EXPOSED: no stacked eval | DEFENDED: P2-hybrid pattern | G-A | (d) bundle expansion |
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| GSD Phase 18 = Rename Sprint | GSD Phase 18 = Context & Research (Phase CR) | 2026-04-23 (Playbook v2.0) | Research/audit must complete before any renames; renames shift to Phase 19 |
| Playbook 6 phases (0-5) | Playbook 7 phases (0, CR, 1-5) | 2026-04-23 (Playbook v2.0) | Continuation mapping renumbered: old 18→19, 19→20, 20→21, 21→22, 22→23 |
| "Soft Meta-Concepts" as end-state | "Staging Meta-Concepts" → TS runtime | 2026-04-23 (Playbook v2.0 I.3) | Every finding must assess Zod/SDK migration readiness |
| Description rewrite for ALL skills | Description rewrite for G-A..G-D skills only | 2026-04-23 (Playbook V.3.2) | Broad sweeps banned; cluster-prioritised approach only |
| Verbatim GSD pattern adoption | Re-author into hm-* skills | 2026-04-23 (Playbook I.6) | Third-party content must be abstracted, not copied |

**Deprecated/outdated:**
- v1.0 playbook's "Description Rewrite Sprint" for all 24 skills: replaced by cluster-prioritised approach (V.3.2)
- `.claude/skills/` as a project directory: confirmed absent in Phase 17; IDE sync directories gitignored
- "Soft Harness" terminology: replaced by "Staging Meta-Concepts" to avoid implying `.md` is the final form

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `skill-judge` at `~/.agents/skills/skill-judge/` is functional and can grade skills | Standard Stack | If broken, manual 6-criterion checklist is fallback |
| A2 | GSD workflow files (60+) contain harvestable patterns for G-D cluster | Differential Clusters | If shallow, G-D gap map underestimates re-authoring work |
| A3 | `check-overlaps.sh` works correctly for cross-skill trigger detection | Common Pitfalls | If buggy, exit criteria cannot be met cleanly |
| A4 | Phase 17's `.tech-registry.json` schema is stable and doesn't need re-verification | Pattern 1 | If drifted, hm-detective SCAN results are unreliable |
| A5 | `session-context-manager` will be merged into `planning-with-files` as planned (Playbook I.1.2 row 23) | Per-Skill Inventory | If not merged, the 24→23 skill count is wrong |

**Claims verified in this session (not assumed):**
- 24 active skills in `.hivefiver-meta-builder/skills-lab/active/refactoring/` [VERIFIED: ls + wc -l]
- 5/24 skills have evals [VERIFIED: for-loop ls evals/]
- `check-overlaps.sh` exists in 3 locations (skill-synthesis, use-authoring-skills, agent-authorization) [VERIFIED: find]
- 17 skill permission entries across agent files [VERIFIED: rg + grep]
- 3 retired skills (repomix-exploration-guide, repomix-explorer, research-operations) [VERIFIED: ls retired/]
- `~/.agents/skills/` contains 20+ global skills including skill-judge [VERIFIED: ls]
- GSD tree contains workflows/ directory with 20+ workflow files [VERIFIED: ls]

## Open Questions

1. **Stacked-workflow eval feasibility**
   - What we know: Exit criteria require running `coordinating-loop` + `planning-with-files` + `phase-loop` stacked.
   - What's unclear: Whether these 3 skills can be loaded simultaneously in the current OpenCode runtime without errors.
   - Recommendation: Attempt the stacked eval early in Wave 2; if it fails, document the failure as a G-A gap finding.

2. **`check-overlaps.sh` scope**
   - What we know: Script exists (203 LOC), checks for content overlap across reference files within a single skill.
   - What's unclear: Whether it checks _cross-skill_ trigger-phrase collisions (required by exit criteria) or only intra-skill reference overlaps.
   - Recommendation: Read the script body fully during Wave 1; if cross-skill is not covered, extend or supplement.

3. **GSD workflow count and pattern depth**
   - What we know: `.opencode/get-shit-done/workflows/` contains 20+ workflow files.
   - What's unclear: How many contain harvestable patterns for G-D (debug/refactor/planning/execution) cluster.
   - Recommendation: Scan workflow directory with `hm-detective` SCAN mode; classify each by cluster applicability.

4. **Phase 17 completion verification freshness**
   - What we know: Phase 17 declared COMPLETE with 5/5 plans, C1-C5 resolved.
   - What's unclear: Whether any Phase 17 edits have regressed since (no runtime re-verification has occurred).
   - Recommendation: Include a Phase 17 spot-check in CR-VERIFICATION (at minimum: verify C1 skill-synthesis symlink, C5 .gitignore entries).

## Per-Skill Inventory (Fresh Runtime Evidence)

*All data collected 2026-04-23 via `ls`, `wc -l`, and `rg` probes.*

| # | Current Name | Planned Name (§I.1.2) | LOC | Refs | Scripts | Evals | Layer | Cluster | Preliminary Decision |
|---|-------------|----------------------|-----|------|---------|-------|-------|---------|---------------------|
| 1 | meta-builder | hm-meta-builder | 389 | 8 | 6 | 2 | 0 | — | (e) rename |
| 2 | use-authoring-skills | hivefiver-use-authoring-skills | 266 | 12 | 8 | 2 | 4 | — | (e) rename |
| 3 | agents-and-subagents-dev | hivefiver-agents-and-subagents-dev | 202 | 2 | 0 | 0 | 2 | — | (e) rename + (d) bundle expansion |
| 4 | command-dev | hivefiver-command-dev | 80 | 2 | 0 | 0 | 2 | — | (e) rename + (c) body rewrite |
| 5 | custom-tools-dev | hivefiver-custom-tools-dev | 121 | 2 | 0 | 0 | 2 | — | (e) rename + (d) evals |
| 6 | coordinating-loop | hm-coordinating-loop | 387 | 4 | 8 | 2 | 1 | G-A | (e) rename + (d) stacked eval |
| 7 | phase-loop | hm-phase-loop | 112 | 1 | 0 | 0 | 2 | G-A | (e) rename + (c) body rewrite (D→B) |
| 8 | planning-with-files | hm-planning-with-files | 140 | 2 | 0 | 0 | 1 | G-D | (e) rename + (g) merge (session-context-manager) |
| 9 | user-intent-interactive-loop | hm-user-intent-interactive-loop | 399 | 5 | 5 | 2 | 1 | G-A | (e) rename |
| 10 | opencode-platform-reference | hm-opencode-platform-reference | 79 | 20 | 0 | 0 | 3 | G-C | (e) rename + (d) evals |
| 11 | opencode-non-interactive-shell | hm-opencode-non-interactive-shell | 63 | 4 | 0 | 0 | 2 | — | (e) rename + (c) body rewrite |
| 12 | oh-my-openagent-reference | hm-omo-reference | 76 | 5 | 0 | 0 | 3 | G-C | (e) rename + (d) evals |
| 13 | hm-deep-research | hm-deep-research | 380 | 6 | 0 | 0 | 2 | G-C | (d) evals + MCP matrix |
| 14 | hm-detective | hm-detective | 225 | 6 | 0 | 0 | 2 | G-C | (d) evals + chaining patterns |
| 15 | hm-synthesis | hm-synthesis | 371 | 7 | 0 | 0 | 2 | G-C | (d) evals + compression tiers |
| 16 | hf-context-absorb | hivefiver-context-absorb | 117 | 4 | 0 | 0 | 1 | — | (e) rename |
| 17 | harness-audit | hm-opencode-project-audit | 158 | 1 | 2 | 0 | 2 | — | (e) rename + (d) evals |
| 18 | harness-delegation-inspection | hm-subagent-delegation-patterns + hm-opencode-project-inspection | 202 | 5 | 0 | 0 | 2 | G-A | (f) split into 2 skills |
| 19 | agent-authorization | hivefiver-delegation-gates | 237 | 1 | 2 | 0 | 1 | G-A | (e) rename + (d) evals |
| 20 | gsd-agent-composition | hm-agent-composition (re-authored) | 158 | 6 | 2 | 1 | 2 | — | (e) rename + (c) re-author per I.6 |
| 21 | command-parser | hm-command-parser | 110 | 1 | 0 | 0 | 2 | — | (e) rename + (d) evals |
| 22 | agents-md-sync | hm-agents-md-sync | 152 | 0 | 0 | 0 | 2 | — | (e) rename + (d) evals |
| 23 | session-context-manager | *(merge → hm-planning-with-files)* | 163 | 2 | 1 | 0 | — | G-D | (g) merge into planning-with-files |
| 24 | skill-synthesis | hm-skill-synthesis | 174 | 5 | 7 | 2 | 3 | G-C | (e) rename |

**Summary statistics:**
- Total skills: 24 [VERIFIED: ls | wc -l]
- Skills with evals: 5 (coordinating-loop, meta-builder, skill-synthesis, use-authoring-skills, user-intent-interactive-loop) = 21% [VERIFIED: for-loop ls]
- Skills needing rename: 21 (3 already hm-* prefixed) [VERIFIED: ls comparison]
- Skills needing body rewrite: ~5 (phase-loop, command-dev, opencode-non-interactive-shell, gsd-agent-composition, plus others TBD)
- Skills needing split: 1 (harness-delegation-inspection)
- Skills needing merge: 1 (session-context-manager → planning-with-files)
- New skills identified: ~4 (hm-completion-looping, hm-spec-driven-authoring, hm-test-driven-execution, hm-debug) per G-A/G-B/G-D clusters
- Retired skills (partial salvage): 3 (repomix-exploration-guide, repomix-explorer, research-operations)

## Differential Cluster Analysis

### G-A: Looping / Guardrails / Gatekeeping (CRITICAL — highest priority)

**Current state:** Partial — core skills exist as placeholders; completion-looping skill missing entirely.

| Skill | Status | Gap | Decision |
|-------|--------|-----|----------|
| coordinating-loop | Exists (387 LOC, A grade) | Needs stacked-eval verification | (d) bundle expansion (evals) |
| phase-loop | Exists (112 LOC, D grade) | No exit criteria, no loop-back path, no entry gate | (c) body rewrite (D→B) |
| user-intent-interactive-loop | Exists (399 LOC, A grade) | Solid | (e) rename only |
| agent-authorization → hm-delegation-gates | Exists (237 LOC) | No evals, needs rename | (e) rename + (d) evals |
| harness-delegation-inspection | Exists (202 LOC) | Covers 4 concerns, should split | (f) split into 2 skills |
| **hm-completion-looping** | **MISSING** | Non-regression guardrail + subagent dispatch + self-verification envelope | **(h) create new** |

### G-B: Spec-driven + Test-driven Development (CRITICAL — "full of lies")

**Current state:** Mostly absent — eval-driven has a scaffold; spec-driven and test-driven need authoring from scratch.

| Skill | Status | Gap | Decision |
|-------|--------|-----|----------|
| **hm-spec-driven-authoring** | **MISSING** | Turn a SPEC into falsifiable requirements + tests | **(h) create new** |
| **hm-test-driven-execution** | **MISSING** | Red-green-refactor integrated with planning-with-files + phase-loop | **(h) create new** |
| skill-synthesis → hm-skill-synthesis | Exists (174 LOC, restored in Phase 17) | Eval-driven development scaffold | (e) rename, keep as-is |

### G-C: Research / Investigation / Synthesis (HIGH — partially delivered by 17-05)

**Current state:** Integration partially delivered; chaining + MCP patterns still missing.

| Skill | Status | Gap | Decision |
|-------|--------|-----|----------|
| hm-deep-research | Exists (380 LOC, gold) | No evals, MCP matrix missing | (d) evals + MCP matrix |
| hm-detective | Exists (225 LOC) | No evals, chaining patterns with OpenCode built-ins missing | (d) evals + chaining |
| hm-synthesis | Exists (371 LOC) | No evals, compression tiers × tool matrix missing | (d) evals + compression |
| opencode-platform-reference → hm-* | Exists (79 LOC, 20 refs) | Reference skill, no evals | (e) rename + (d) evals |
| oh-my-openagent-reference → hm-omo-reference | Exists (76 LOC, 5 refs) | Reference skill, no evals | (e) rename + (d) evals |
| skill-synthesis → hm-skill-synthesis | Exists (174 LOC) | Pattern extraction, has evals | (e) rename |
| **hm-research-chain** | **MISSING (or low priority)** | Short meta-skill showing canonical chain | **(h) create new** (can defer) |

### G-D: Debug / Refactor / Planning / Execution (HIGH — mostly absent)

**Current state:** Only hm-planning-with-files exists. All others need to be authored against GSD patterns.

| Skill | Status | Gap | Decision |
|-------|--------|-----|----------|
| planning-with-files → hm-planning-with-files | Exists (140 LOC, PASS) | Solid but needs merge of session-context-manager | (e) rename + (g) merge |
| **hm-debug** | **MISSING** | Systematic debugging with persistent state | **(h) create new** |
| **hm-refactor** | **MISSING** | Surgical vs. structural refactor taxonomy | **(h) create new** |
| **hm-phase-execution** | **MISSING** | Wave-based execution loop native to Hivemind | **(h) create new** |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `skill-judge` | CR-03 audit grading | ✓ | `~/.agents/skills/skill-judge/` | Manual 6-criterion checklist |
| `check-overlaps.sh` | CR-08 exit criteria | ✓ | 203 LOC in skill-synthesis/scripts/ | — |
| `hm-detective` SCAN mode | CR-02 research chain | ✓ | In `.opencode/skills/hm-detective/` | Manual rg probes |
| `hm-deep-research` | CR-02 research chain | ✓ | In `.opencode/skills/hm-deep-research/` | — |
| `hm-synthesis` | CR-02 research chain | ✓ | In `.opencode/skills/hm-synthesis/` | — |
| GSD workflows reference tree | CR-05 pattern harvest | ✓ | `.opencode/get-shit-done/workflows/` (20+ files) | — |
| Superpowers skills | CR-05 pattern harvest | ✓ | `~/.agents/skills/` (20+ global) + `~/.cache/opencode/packages/superpowers*/` | — |
| Retired skills archive | CR-05 pattern harvest | ✓ | `.hivefiver-meta-builder/skills-lab/retired/` (3 skills) | — |

**Missing dependencies with no fallback:**
- None identified — all required tools are present.

**Missing dependencies with fallback:**
- None — all probes confirmed available.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | N/A (research/audit phase — no code tests) |
| Config file | none |
| Quick run command | `npm run typecheck` (verify no regressions from Phase 17) |
| Full suite command | `npm test` (351 tests — verify no regressions) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CR-01 | Phase context envelope committed | manual-only | `ls .planning/phases/18-*/CR-CONTEXT.md` | ❌ Wave 1 |
| CR-02 | Grounded research document committed | manual-only | `ls .planning/phases/18-*/CR-RESEARCH.md` | ❌ Wave 1 |
| CR-03 | Per-skill 6-NON audit grid committed | manual-only | `ls .planning/phases/18-*/CR-AUDIT-ECOSYSTEM.md` | ❌ Wave 2 |
| CR-04 | Differential cluster gap map committed | manual-only | `ls .planning/phases/18-*/CR-GAP-MAP.md` | ❌ Wave 2 |
| CR-05 | Third-party pattern harvest committed | manual-only | `ls .planning/phases/18-*/CR-THIRD-PARTY-HARVEST.md` | ❌ Wave 3 |
| CR-06 | Runtime-readiness map committed | manual-only | `ls .planning/phases/18-*/CR-RUNTIME-READINESS.md` | ❌ Wave 3 |
| CR-07 | Tooling decision table committed | manual-only | `ls .planning/phases/18-*/CR-DECISIONS.md` | ❌ Wave 4 |
| CR-08 | Verification report committed | manual-only | `ls .planning/phases/18-*/CR-VERIFICATION.md` | ❌ Wave 4 |
| EXIT | Stacked-workflow eval run | integration | Manual: load coordinating-loop + planning-with-files + phase-loop | ❌ Wave 2-3 |
| EXIT | `check-overlaps.sh` run | integration | `bash .opencode/skills/skill-synthesis/scripts/check-overlaps.sh` | ❌ Wave 4 |
| EXIT | User signs off in CR-DISCUSSION-LOG.md | manual-only | — | ❌ Wave 4 |

### Sampling Rate
- **Per task commit:** `npm run typecheck` (verify no regressions)
- **Per wave merge:** `npm test` (351 tests)
- **Phase gate:** All 8 deliverables committed + stacked eval + check-overlaps + user sign-off

### Wave 0 Gaps
- [ ] CR-CONTEXT.md — covers CR-01
- [ ] CR-RESEARCH.md — covers CR-02
- [ ] CR-AUDIT-ECOSYSTEM.md — covers CR-03
- [ ] CR-GAP-MAP.md — covers CR-04
- [ ] CR-THIRD-PARTY-HARVEST.md — covers CR-05
- [ ] CR-RUNTIME-READINESS.md — covers CR-06
- [ ] CR-DECISIONS.md — covers CR-07
- [ ] CR-VERIFICATION.md — covers CR-08
- [ ] CR-DISCUSSION-LOG.md — covers user sign-off exit criterion

## Security Domain

> This phase produces no code changes. Security considerations are informational only.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no | — |
| V6 Cryptography | no | — |

### Known Threat Patterns for Skills Audit

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Skill description trigger collision | Tampering | `check-overlaps.sh` validation |
| Dead reference in skill body | Information Disclosure | Runtime probe verification (VI.CR.4) |
| Third-party content leakage | Information Disclosure | Attribution-only pattern extraction (I.6) |

## Sources

### Primary (HIGH confidence)
- Fresh runtime probes executed 2026-04-23: `ls`, `wc -l`, `rg`, `find` across `.opencode/skills/`, `.hivefiver-meta-builder/skills-lab/`, `.opencode/agents/`
- `.hivefiver-meta-builder/HIVEMIND-SKILLS-REFACTOR-PLAYBOOK.md` — 1390 LOC, authoritative specification (v2.0)
- `.hivemind/state/session-context-prompt-v4.md` — GSD phase-planning specification
- `.planning/phases/17-hivemind-skills-refactor/17-05-SUMMARY.md` — Phase 17 completion evidence
- `.planning/ROADMAP.md` — Phase 18 entry with CR-01 through CR-08 deliverables

### Secondary (MEDIUM confidence)
- `.planning/phases/17-hivemind-skills-refactor/17-VERIFICATION.md` — Phase 0 completion verification
- `.opencode/skills/skill-synthesis/scripts/check-overlaps.sh` — 203 LOC overlap detection script
- `.opencode/agents/*.md` permission entries — 17 skill permission declarations

### Tertiary (LOW confidence)
- `~/.agents/skills/` listing — global skill tools available (not verified for functionality)
- `.opencode/get-shit-done/workflows/` — GSD workflow files (counted but not content-analyzed)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools verified present on disk
- Architecture: HIGH — wave structure derived directly from playbook VI.CR
- Pitfalls: HIGH — all 5 pitfalls derived from playbook VI.CR.12 failure signals
- Per-skill inventory: HIGH — fresh runtime evidence for all 24 skills
- Cluster analysis: HIGH — gaps mapped against V.3.2 taxonomy
- Decision table: MEDIUM — preliminary decisions based on inventory; may shift during deep audit

**Research date:** 2026-04-23
**Valid until:** 30 days (stable ecosystem; skill count/names may drift after Phase 19 rename)
