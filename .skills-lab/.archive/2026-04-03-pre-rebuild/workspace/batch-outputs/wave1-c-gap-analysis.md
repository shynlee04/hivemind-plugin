# Gap Analysis: Skill Authoring Package → Spec-Compliant Meta-Builder

**Produced:** 2026-04-03
**Agent:** hivexplorer (terminal repository investigator)
**Evidence sources:**
- `use-authoring-skills/SKILL.md` (282 lines)
- 9 bundled reference/template files (1,969 total lines)
- `authoring-skills-improved-resources.md` (TABs 2–6, lines 293–1493)
- `essentials.md` (7 principles, 51 lines)
- 5 OpenCode platform docs (first-100-line scope reads)

---

## A. Spec Coverage Map

### TAB 2 — Specification Compliance

| Spec Requirement | Current Coverage | Status | Evidence |
|---|---|---|---|
| Directory structure (skill-name/SKILL.md + optional dirs) | `01-skill-anatomy.md:13-18` — shows SKILL.md required, but missing `scripts/` and `assets/` in required structure | **PARTIAL** | Spec adds `scripts/`, `references/`, `assets/` as official optional dirs. Current only shows `references/` and `scripts/` briefly. |
| Frontmatter: `name` field (1-64 chars, lowercase, no consecutive hyphens, match dir name) | `02-frontmatter-standard.md:29-49` — good coverage of kebab-case rules | **COVERED** | |
| Frontmatter: `description` field (1-1024 chars, WHAT+WHEN+KEYWORDS) | `02-frontmatter-standard.md:51-73` — comprehensive | **COVERED** | |
| Frontmatter: `license` (optional) | `02-frontmatter-standard.md:78-93` — **FORBIDDEN** | **CONFLICT** | Spec defines `license` as valid optional field. Current package FORBIDS it. Must reconcile. |
| Frontmatter: `compatibility` (optional, 1-500 chars) | `02-frontmatter-standard.md:78-93` — **FORBIDDEN** | **CONFLICT** | Spec defines `compatibility` as valid. Current FORBIDS it. Must reconcile. |
| Frontmatter: `metadata` (optional, string→string map) | `02-frontmatter-standard.md:78-93` — **FORBIDDEN** | **CONFLICT** | Spec defines `metadata` as valid. Current FORBIDS. Must reconcile. |
| Frontmatter: `allowed-tools` (optional, experimental) | Not mentioned anywhere in current package | **MISSING** | New field. Needs reference doc. |
| Body content (no format restrictions, recommended sections) | `01-skill-anatomy.md:48-53` — 4 required sections defined | **PARTIAL** | Spec says "no format restrictions" and recommends step-by-step, examples, edge cases. Current is more prescriptive (Purpose, When to Activate, Core Behavior, Anti-Patterns). |
| Progressive disclosure (3 tiers: metadata ~100t, instructions <5000t, resources on-demand) | SKILL.md line 65: "Keep it under 400 lines" — **wrong threshold** | **MISALIGNED** | Spec recommends <500 lines for SKILL.md, ~100 tokens for metadata, <5000 tokens for instructions. Current says 400 lines. |
| File references (relative paths, one level deep) | `01-skill-anatomy.md:69-76` — depth rule exists but "1-level depth MAX" is about references, not about file references from SKILL.md | **PARTIAL** | Spec: "Keep file references one level deep from SKILL.md. Avoid deeply nested reference chains." Current covers reference depth but not the file reference convention explicitly. |
| Validation (`skills-ref validate`) | Not mentioned | **MISSING** | Spec references `skills-ref` CLI tool for validation. Current has no mention. |

**TAB 2 Summary:** 4 covered, 3 partial, 3 conflicts, 2 missing.

### TAB 3 — Using Scripts in Skills

| Spec Requirement | Current Coverage | Status | Evidence |
|---|---|---|---|
| One-off commands (uvx, npx, bunx, deno, go run, pipx) | Not mentioned | **MISSING** | Entire TAB 3 content absent. |
| PEP 723 inline Python dependencies | Not mentioned | **MISSING** | |
| Deno `npm:` / `jsr:` imports | Not mentioned | **MISSING** | |
| Bun auto-install | Not mentioned | **MISSING** | |
| Ruby bundler/inline | Not mentioned | **MISSING** | |
| Referencing scripts from SKILL.md | `01-skill-anatomy.md:79-86` — minimal mention of scripts/ directory | **PARTIAL** | Only says "read-only by default, no mutation scripts, safe for multi-environment." Missing the relative-path convention and listing pattern. |
| Non-interactive design (avoid TTY prompts) | Not mentioned | **MISSING** | Critical for agentic execution. |
| `-help` documentation | Not mentioned | **MISSING** | |
| Structured output (JSON/CSV > prose) | Not mentioned | **MISSING** | |
| Idempotency, dry-run, exit codes | Not mentioned | **MISSING** | |
| Predictable output size / truncation awareness | Not mentioned | **MISSING** | |

**TAB 3 Summary:** 1 partial, 10 missing. This is the largest gap.

### TAB 4 — Evaluating Skills

| Spec Requirement | Current Coverage | Status | Evidence |
|---|---|---|---|
| Test case structure (prompt + expected_output + files) | `04-tdd-workflow.md:46-60` — has scenario format but not spec-compliant eval format | **PARTIAL** | Current uses "Failing Scenario" format. Spec uses `evals/evals.json` with id, prompt, expected_output, files, assertions. |
| evals/evals.json format | Not mentioned | **MISSING** | Spec defines a JSON schema for test cases. |
| Workspace structure (iteration-N/eval-name/{with_skill,without_skill}/) | Not mentioned | **MISSING** | Current has no iteration/workspace concept. |
| Spawning runs with clean context | `04-tdd-workflow.md:82-87` — "Clear any skill loading, execute test prompt" — similar concept | **PARTIAL** | Lacks the subagent isolation pattern. |
| Assertions (verifiable statements about output) | `04-tdd-workflow.md:176-188` — Skill-Judge dimensions serve similar purpose | **ANALOG** | Different approach. Current uses weighted dimensions (Trigger Accuracy, etc.). Spec uses per-eval assertions with PASS/FAIL + evidence. |
| Grading with evidence | `05-skill-quality-matrix.md:284-324` — evaluation template exists | **PARTIAL** | Current grades on 5 dimensions. Spec grades individual assertions. Both require evidence but different granularity. |
| benchmark.json aggregation | Not mentioned | **MISSING** | No statistical aggregation of eval results. |
| Train/validation split | Not mentioned | **MISSING** | |
| Iteration loop methodology | `07-iterative-refinement.md:82-115` — refinement loop exists | **PARTIAL** | Current loop triggers on Skill-Judge <3.5. Spec loop is eval-driven (run evals → grade → analyze → iterate). Different trigger conditions. |
| Human review integration | Not mentioned | **MISSING** | Spec defines feedback.json for structured human review. |

**TAB 4 Summary:** 3 partial, 1 analog, 6 missing.

### TAB 5 — Optimizing Descriptions

| Spec Requirement | Current Coverage | Status | Evidence |
|---|---|---|---|
| Trigger rate testing | `05-skill-quality-matrix.md:33-50` — Trigger Accuracy dimension scores this | **PARTIAL** | Current evaluates via Skill-Judge scoring (1-5 scale). Spec uses quantitative trigger rate (fraction of runs). |
| Should-trigger query design | `02-frontmatter-standard.md:54-72` — description requirements exist | **PARTIAL** | Description writing guidance exists but no systematic query testing approach. |
| Should-not-trigger (near-miss) queries | Not mentioned | **MISSING** | Current has no concept of false-positive testing. |
| Multiple runs for nondeterminism (3x, trigger rate threshold) | Not mentioned | **MISSING** | |
| Train/validation split for description testing | Not mentioned | **MISSING** | |
| Optimization loop (evaluate → identify → revise → repeat) | `07-iterative-refinement.md:82-115` — generic refinement exists | **PARTIAL** | Loop exists but is not description-specific. |
| Overfitting prevention | Not mentioned | **MISSING** | |
| 1024-char limit enforcement during optimization | Not mentioned | **MISSING** | |

**TAB 5 Summary:** 3 partial, 5 missing.

### TAB 6 — Adding Skill Support to Your Agent

| Spec Requirement | Current Coverage | Status | Evidence |
|---|---|---|---|
| Discovery (scanning directories, scopes) | SKILL.md:56-63 — "Bundled Resources" shows directory structure | **PARTIAL** | Shows the result of discovery but not the mechanism. Spec defines where to scan (project, user, org levels). |
| Progressive disclosure implementation (3 tiers) | SKILL.md:134-143 — "Universal Design" principle 5 mentions "Progressive enhancement" | **PARTIAL** | Concept mentioned but not the spec's 3-tier implementation (catalog → instructions → resources). |
| Skill catalog format (XML/JSON/bullets) | Not mentioned | **MISSING** | |
| Activation mechanisms (file-read vs dedicated tool) | Not mentioned | **MISSING** | |
| Structured wrapping (`<skill_content>` tags) | Not mentioned | **MISSING** | |
| Permission allowlisting for skill directories | Not mentioned | **MISSING** | |
| Context compaction protection | Not mentioned | **MISSING** | |
| Deduplication of activations | Not mentioned | **MISSING** | |
| Name collision handling (project > user) | Not mentioned | **MISSING** | |
| Trust considerations (untrusted repos) | Not mentioned | **MISSING** | |
| Cloud/sandboxed agent discovery | Not mentioned | **MISSING** | |
| Malformed YAML handling | Not mentioned | **MISSING** | |

**TAB 6 Summary:** 2 partial, 11 missing.

---

## B. New Reference Files Needed

### 06 — Cross-Platform Activation Guide (MISSING — referenced by 07 and 08)

**What happened:** Files `07-iterative-refinement.md:196` and `08-conflict-detection.md:213` both reference `06-agent-activation.md`, but this file does not exist.

| Property | Value |
|---|---|
| **Filename** | `references/06-cross-platform-activation.md` |
| **Estimated size** | ~250 lines |
| **Content scope** | How skills are discovered, loaded, and activated across platforms (OpenCode, Claude Code, Gemini CLI, Cursor). Covers the spec's TAB 6 content but distilled for skill *authors* (not agent *builders*). |
| **Key sections** | Discovery paths per platform; progressive disclosure tiers from the author's perspective; how to structure skills for reliable activation; `allowed-tools` field usage; platform-specific quirks (OpenCode `.opencode/skills/` vs `.claude/skills/` vs `.agents/skills/`). |
| **Replaces** | Nothing — fills a gap |
| **Source material** | TAB 6 (lines 1152–1493) + OpenCode skills doc + OpenCode agents doc |

### 09 — Spec Compliance Reference

| Property | Value |
|---|---|
| **Filename** | `references/09-spec-compliance.md` |
| **Estimated size** | ~200 lines |
| **Content scope** | The authoritative mapping between the Agent Skills spec and the HiveMind skill format. Resolves the frontmatter field conflicts. Explains which spec fields to use and how. |
| **Key sections** | Allowed vs forbidden frontmatter fields (reconcile with `02-frontmatter-standard.md`); `license`, `compatibility`, `metadata`, `allowed-tools` field usage; spec naming rules (regex `^[a-z0-9]+(-[a-z0-9]+)*$`); progressive disclosure token budgets; file reference conventions; validation with `skills-ref`. |
| **Replaces** | Updates `02-frontmatter-standard.md` (which must be revised to allow spec-defined optional fields) |
| **Source material** | TAB 2 (lines 5–291) |

### 10 — Scripts in Skills

| Property | Value |
|---|---|
| **Filename** | `references/10-scripts-in-skills.md` |
| **Estimated size** | ~350 lines |
| **Content scope** | How to write, bundle, and reference executable scripts in skills. Covers self-contained scripts in multiple languages and agentic design principles. |
| **Key sections** | One-off commands (uvx, npx, bunx, deno, go run) with version pinning; PEP 723 Python inline deps; Deno npm:/jsr: imports; Bun auto-install; Ruby bundler/inline; referencing scripts from SKILL.md; non-interactive design; `-help` documentation pattern; structured output (JSON/CSV); idempotency; dry-run; exit codes; output size awareness. |
| **Replaces** | Partially replaces the scripts guidance in `01-skill-anatomy.md:79-86` (which is too minimal) |
| **Source material** | TAB 3 (lines 293–638) |

### 11 — Eval-Driven Iteration

| Property | Value |
|---|---|
| **Filename** | `references/11-eval-driven-iteration.md` |
| **Estimated size** | ~400 lines |
| **Content scope** | The spec-compliant evaluation framework: designing test cases, running evals, grading outputs, aggregating results, iterating. Bridges the existing Skill-Judge quality matrix to the spec's eval framework. |
| **Key sections** | evals/evals.json schema and examples; workspace structure (iteration-N/ directories); spawning isolated runs; assertion writing (good vs weak examples); grading with PASS/FAIL + evidence; benchmark.json aggregation; pattern analysis (remove always-pass, investigate always-fail); human review (feedback.json); iteration loop (5 steps). Maps existing Skill-Judge dimensions to spec assertions. |
| **Replaces** | Supersedes the evaluation aspects of `04-tdd-workflow.md` and `sw-04-tdd-workflow.md` while keeping the RED/GREEN/REFACTOR cycle |
| **Source material** | TAB 4 (lines 640–947) + existing `05-skill-quality-matrix.md` |

### 12 — Description Optimization

| Property | Value |
|---|---|
| **Filename** | `references/12-description-optimization.md` |
| **Estimated size** | ~300 lines |
| **Content scope** | Systematic methodology for optimizing skill descriptions for reliable triggering. Goes beyond the current "write a good description" guidance to a scientific testing approach. |
| **Key sections** | How triggering works (progressive disclosure tier 1); writing effective descriptions (imperative phrasing, user intent, pushy-but-precise); designing trigger eval queries (20 queries, should/should-not-trigger, near-misses, realism tips); running trigger tests (3x runs, trigger rate threshold 0.5); train/validation split (60/40); optimization loop (5 iterations); overfitting prevention; applying results. |
| **Replaces** | Extends `02-frontmatter-standard.md:54-73` and `05-skill-quality-matrix.md:33-50` |
| **Source material** | TAB 5 (lines 949–1150) |

---

## C. Template and Script Requirements

### Templates Needed (based on TAB 4 eval framework)

| Template | Purpose | Estimated Size | Source Spec Section |
|---|---|---|---|
| `templates/evals.json` | Starting eval test-case file with schema comments | ~30 lines JSON | TAB 4 line 666-683 |
| `templates/grading-rubric.json` | Grading output structure template | ~25 lines JSON | TAB 4 line 819-850 |
| `templates/benchmark.json` | Aggregated statistics template | ~20 lines JSON | TAB 4 line 866-885 |
| `templates/feedback.json` | Human review feedback template | ~10 lines JSON | TAB 4 line 909-914 |
| `templates/skill-scaffold/` | Complete scaffold directory: SKILL.md + evals/ + scripts/ + references/ + assets/ | ~5 files | Spec directory structure |
| `templates/trigger-queries.json` | Train/validation split query template for description testing | ~40 lines JSON | TAB 5 line 989-993 |

### Scripts Needed (based on TAB 3 + TAB 4 + TAB 5)

| Script | Purpose | Language | Estimated Size |
|---|---|---|---|
| `scripts/validate-skill.sh` | Validates SKILL.md frontmatter (name regex, description length, forbidden fields, spec compliance) | Bash (portable, no deps beyond grep/sed) | ~80 lines |
| `scripts/check-overlaps.sh` | Scans two skill directories for trigger overlap, shared file paths, and scope conflicts | Bash (uses grep, diff) | ~100 lines |
| `scripts/run-eval.sh` | Runs a single eval case with/without skill, captures timing and output | Bash | ~60 lines |
| `scripts/grade-eval.sh` | Grades assertions against output using structured PASS/FAIL with evidence | Bash + jq | ~50 lines |
| `scripts/test-triggers.sh` | Tests trigger rates for description optimization (multi-run, threshold calculation) | Bash + jq | ~70 lines (TAB 5 provides the full script pattern at lines 1051-1083) |

### Existing Template Gap

Current `templates/skill-audit.json` (15 lines) is a flat pass/fail checklist. It should be **expanded** to cover spec compliance checks (frontmatter field validation, name regex, description length, progressive disclosure compliance) alongside the existing operational checks.

---

## D. Cross-Platform Bridge

### OpenCode-Specific Knowledge to Incorporate

From the 5 OpenCode platform docs read (first 100 lines each):

| Platform Concept | What the Skill Needs to Know | How to Keep Platform-Agnostic |
|---|---|---|
| **Skill discovery paths** (`.opencode/skills/`, `.claude/skills/`, `.agents/skills/` at project + user + global levels) | Authors need to know WHERE to place skills for reliable discovery. | Present as a discovery matrix: "Place your skill in any of these standard locations." Show OpenCode paths as ONE column alongside Claude Code, Gemini CLI, etc. Use the `.agents/skills/` convention as the universal recommendation. |
| **Permission system** (`allow`/`ask`/`deny` patterns, `skill.*` permission config) | Authors need to know that skills can be permission-gated. | Document the `allowed-tools` frontmatter field (from spec). Explain that platforms may have permission systems. Don't hardcode OpenCode's config format — reference it as "For example, in OpenCode..." |
| **Agent types** (Build, Plan, General, Explore as primary/subagent) | Authors need to know skills may activate differently in primary vs subagent context. | Abstract as: "Some platforms distinguish between primary and delegated execution contexts. Skills should be usable in both." |
| **Custom tools** (`.opencode/tools/`, `tool()` helper, Zod schemas) | Skills that reference tools should understand the tool ecosystem. | Document in a "Platform Capabilities" appendix. Skills should use generic tool references. Platform-specific tool names go in examples only. |
| **Commands** (`.opencode/commands/`, markdown templates with `$ARGUMENTS`) | Skill activation can happen via commands (slash commands). | Document as one activation mechanism among several. Keep the SKILL.md format generic. |
| **Frontmatter handling** (OpenCode recognizes: name, description, license, compatibility, metadata; ignores unknowns) | Confirms spec compliance. | Use as validation that the spec's optional fields are real and functional. |

### Recommended Bridge Architecture

```
references/06-cross-platform-activation.md
├── Section 1: Universal Discovery Convention
│   └── .agents/skills/ as cross-client standard
│   └── Platform-specific paths (table format)
├── Section 2: Progressive Disclosure from Author's View
│   └── What tier 1/2/3 means for how you WRITE skills
│   └── Token budgets and line count guidance
├── Section 3: Activation Mechanisms
│   └── File-read (universal)
│   └── Dedicated tool (platform-specific)
│   └── Slash commands (platform-specific)
├── Section 4: Permission and Trust
│   └── allowed-tools frontmatter (spec)
│   └── Platform permission examples (OpenCode, Claude Code)
├── Section 5: Platform Compatibility Table
│   └── Per-platform: discovery paths, frontmatter support, activation, permissions
│   └── OpenCode | Claude Code | Gemini CLI | Cursor | Generic
└── Section 6: Anti-Deception and Gatekeeping
    └── How to write skills that resist hallucination
    └── How to write skills that enforce domain boundaries
```

### Keeping It Platform-Agnostic

1. **Universal truths first.** Every section starts with what the spec defines, then shows platform specifics as examples.
2. **The `.agents/skills/` convention as primary.** This is the spec-endorsed cross-client path.
3. **Platform specifics in tables, not prose.** Makes them easy to update without restructuring.
4. **Conditional examples.** "If targeting OpenCode, also consider..." rather than "Always do X."

---

## E. Progressive Disclosure Tier Assignment

### Current Files

| File | Lines | Recommended Tier | Rationale |
|---|---|---|---|
| `SKILL.md` | 282 | **Tier 2 (Instructions)** | Loaded when skill activates. Already close to spec's <5000 token guidance. |
| `references/01-skill-anatomy.md` | 259 | **Tier 3 (On-demand)** | Detailed structure reference. Loaded only when creating new skills. |
| `references/02-frontmatter-standard.md` | 321 | **Tier 3 (On-demand)** | Detailed frontmatter reference. Needed during creation/audit. |
| `references/03-three-patterns.md` | 323 | **Tier 3 (On-demand)** | Pattern selection guidance. Needed during design phase. |
| `references/04-tdd-workflow.md` | 392 | **Tier 3 (On-demand)** | TDD methodology. Loaded during implementation phase. |
| `references/05-skill-quality-matrix.md` | 339 | **Tier 3 (On-demand)** | Quality evaluation framework. Loaded during review phase. |
| `references/07-iterative-refinement.md` | 196 | **Tier 3 (On-demand)** | Iteration patterns. Loaded during improvement cycles. |
| `references/08-conflict-detection.md` | 215 | **Tier 3 (On-demand)** | Conflict detection. Loaded during audit/overlap checking. |
| `references/audit-checklist.md` | 32 | **Tier 3 (On-demand)** | Quick reference for audit. Could be loaded during any review. |
| `references/sw-04-tdd-workflow.md` | 392 | **Tier 3 (On-demand)** | Duplicate of 04. Should be removed or merged. |
| `templates/skill-audit.json` | 15 | **Tier 3 (On-demand)** | Template, loaded when running an audit. |

### New Files

| File | Estimated Lines | Recommended Tier | Rationale |
|---|---|---|---|
| `references/06-cross-platform-activation.md` | ~250 | **Tier 3 (On-demand)** | Platform specifics. Loaded when questions arise about discovery, activation, or compatibility. |
| `references/09-spec-compliance.md` | ~200 | **Tier 3 (On-demand)** | Spec field reference. Loaded during creation/audit when frontmatter questions arise. |
| `references/10-scripts-in-skills.md` | ~350 | **Tier 3 (On-demand)** | Script authoring guidance. Loaded only when skill includes scripts. |
| `references/11-eval-driven-iteration.md` | ~400 | **Tier 3 (On-demand)** | Eval framework. Loaded during skill evaluation cycles. |
| `references/12-description-optimization.md` | ~300 | **Tier 3 (On-demand)** | Description testing. Loaded during description optimization. |
| `templates/evals.json` | ~30 | **Tier 3 (On-demand)** | Loaded when creating eval test cases. |
| `templates/grading-rubric.json` | ~25 | **Tier 3 (On-demand)** | Loaded when grading eval outputs. |
| `templates/benchmark.json` | ~20 | **Tier 3 (On-demand)** | Loaded when aggregating eval results. |
| `templates/feedback.json` | ~10 | **Tier 3 (On-demand)** | Loaded during human review. |
| `templates/skill-scaffold/` | ~5 files | **Tier 3 (On-demand)** | Loaded when scaffolding a new skill. |
| `templates/trigger-queries.json` | ~40 | **Tier 3 (On-demand)** | Loaded during description optimization. |
| `scripts/validate-skill.sh` | ~80 | **Tier 3 (On-demand)** | Executed during validation. |
| `scripts/check-overlaps.sh` | ~100 | **Tier 3 (On-demand)** | Executed during conflict detection. |
| `scripts/run-eval.sh` | ~60 | **Tier 3 (On-demand)** | Executed during eval runs. |
| `scripts/grade-eval.sh` | ~50 | **Tier 3 (On-demand)** | Executed during grading. |
| `scripts/test-triggers.sh` | ~70 | **Tier 3 (On-demand)** | Executed during description testing. |

### Tier Architecture Summary

```
Tier 1 — Metadata (~100 tokens, always loaded)
  └── SKILL.md frontmatter: name + description

Tier 2 — Instructions (<5000 tokens, loaded on activation)
  └── SKILL.md body (282 lines, ~2000 tokens)
      ├── When to Load (routing table)
      ├── Skill Anatomy (quick reference)
      ├── Naming Convention
      ├── Creation Template
      ├── Universal Design (5 principles)
      ├── Conflict Detection (5 types)
      ├── Review Checklist (9-phase)
      ├── Platform Abstraction Matrix
      ├── Anti-Patterns (8 entries)
      ├── Handoff Paths
      └── Bundled Resources index

Tier 3 — Resources (loaded on demand)
  ├── references/ (10-12 files, loaded per-task)
  ├── templates/ (6 items, loaded when needed)
  └── scripts/ (5 scripts, executed when invoked)
```

---

## F. Essentials (7 Principles) Compliance

| Principle | Current Coverage | Gap |
|---|---|---|
| **1. Framework Integrity** | Partial — anatomy + patterns exist but spec conflicts (forbidden fields vs spec-allowed fields) | Reconcile `02-frontmatter-standard.md` with spec. Update `01-skill-anatomy.md` to include all spec-defined optional directories. |
| **2. Skill Writing** (progressive disclosure, horizontal/vertical organization, anti-deception, gatekeeping) | Partial — progressive disclosure concept exists but wrong thresholds; horizontal/vertical patterns exist; **anti-deception and gatekeeping are completely absent** | Add anti-deception section to `06-cross-platform-activation.md` or create dedicated reference. Add gatekeeping patterns (domain boundaries, refusal-to-proceed, consultant delegation). |
| **3. Readiness and Depth** (TDD, spec-driven, orchestrator workflows, portable toolkits) | Partial — TDD exists but not spec-compliant eval; no portable script toolkits | Implement `scripts/` directory with eval/validate/test-trigger scripts. Bridge TDD to eval framework. |
| **4. Deterministic Design** (portable scripts, pathing conventions, non-breaking patterns) | Absent — no scripts, no deterministic patterns | All 5 proposed scripts must follow TAB 3 guidelines (non-interactive, structured output, idempotent). Use Bash for maximum portability. |
| **5. Meta-Framework Awareness** (hierarchical access, discovery scripts, date-based conflict resolution) | Absent — no discovery tooling | `scripts/validate-skill.sh` and `scripts/check-overlaps.sh` address discovery and conflict detection. |
| **6. Tone and Language** (schematic reasoning, breadth vs depth, conflict highlighting) | Partial — anti-patterns section has good tone. Conflict Detection section exists. | No changes needed — current tone is appropriate. |
| **7. Concision vs Completeness** (progressive disclosure, necessary details bundled) | Partial — progressive disclosure concept exists but not fully implemented per spec | All new reference files should follow spec's tier model. SKILL.md body stays lean, detail goes to references. |

---

## G. Priority-Ordered Action Items

### Critical (Must Fix — spec compliance conflicts)

1. **Reconcile frontmatter fields.** `02-frontmatter-standard.md` FORBIDS `license`, `compatibility`, `metadata` which the spec allows. Create `09-spec-compliance.md` and update `02` to reflect spec-allowed optional fields while maintaining guidance about where internal metadata belongs.

2. **Create `06-cross-platform-activation.md`.** Referenced by two existing files but doesn't exist. Must cover TAB 6 content for skill authors plus anti-deception/gatekeeping patterns.

3. **Remove duplicate `sw-04-tdd-workflow.md`.** Identical content to `04-tdd-workflow.md` (392 lines each). Dead reference.

### High (Must Add — major spec coverage gaps)

4. **Create `10-scripts-in-skills.md`.** TAB 3 is entirely uncovered. Scripts are a core skill capability.

5. **Create `11-eval-driven-iteration.md`.** TAB 4 eval framework is the spec's quality assurance mechanism. Currently only HiveMind-specific Skill-Judge exists.

6. **Create `12-description-optimization.md`.** TAB 5 systematic trigger testing methodology is missing. Current relies on author intuition.

7. **Create `scripts/` directory** with `validate-skill.sh`, `check-overlaps.sh`, `run-eval.sh`, `grade-eval.sh`, `test-triggers.sh`.

8. **Create `templates/` additions** — `evals.json`, `grading-rubric.json`, `benchmark.json`, `feedback.json`, `skill-scaffold/`, `trigger-queries.json`.

### Medium (Should Improve — quality and completeness)

9. **Update `01-skill-anatomy.md`** to include all spec-defined optional directories (`scripts/`, `assets/`) and correct the line count threshold (spec says <500, current says <200/<400/<450 depending on pattern).

10. **Update `SKILL.md`** line 65 threshold from "400 lines" to spec's "<500 lines" recommendation, and add a note about the <5000 token budget for Tier 2.

11. **Add `allowed-tools` documentation** to the frontmatter reference and to the creation template.

12. **Expand `templates/skill-audit.json`** to include spec compliance checks alongside existing operational checks.

---

## H. Current Package Metrics

| Metric | Current | After Gap Fill (Projected) |
|---|---|---|
| Reference files | 8 (1 missing, 1 duplicate) | 12 (no gaps, no duplicates) |
| Template files | 1 | 7 |
| Script files | 0 | 5 |
| SKILL.md lines | 282 | ~320 (minor updates) |
| Total reference lines | ~1,969 | ~3,869 (+1,900 new content) |
| Spec TAB coverage | TAB 2 partial, TABs 3-6 absent | All TABs covered |
| Essentials principles covered | 2 of 7 | 6 of 7 (Principle 2 anti-deception still needs dedicated content) |

---

*End of gap analysis report.*
