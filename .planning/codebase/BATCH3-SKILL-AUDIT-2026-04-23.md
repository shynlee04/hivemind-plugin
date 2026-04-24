# Batch 3 Skill Audit Report

**Audit Date:** 2026-04-23
**Auditor:** gsd-codebase-mapper (subagent)
**Frameworks Applied:** skill-judge (D1-D8), skill-development (Structure), skill-creator (Eval & Iteration)

---

## hm-phase-execution

**Grade**: 96/120 (80%) — Grade B
**Pattern**: P2-hybrid (Process)
**Knowledge Ratio**: E:A:R ≈ 65:25:10
**Vendor Lock-in Score**: 0 references
**Has 6-NON Table**: Yes — Specific
**Has Evals**: Yes (trigger_queries only, 4 queries)
**Has Scripts**: Yes (quality: Mediocre — basic validate-skill.sh only)
**Has References**: Yes (count: 2)

### Dimension Scores
| D | Score | Notes |
|---|-------|-------|
| D1 | 14/20 | Strong expert knowledge on wave-based execution and checkpoint recovery. Some activation content in bash commands. |
| D2 | 11/15 | Good thinking pattern (Iron Law). Domain procedures (wave protocol) are valuable. Some generic procedures. |
| D3 | 12/15 | Good anti-patterns (Todo Lister, Silent Skip, Re-Executer, Uncommitted Wave) with detection and correction. |
| D4 | 14/15 | Excellent description with WHAT, WHEN, KEYWORDS, explicit triggers, and NOT FOR exclusion. |
| D5 | 12/15 | Good progressive disclosure. References are small and focused. Could use explicit "Do NOT load" guidance. |
| D6 | 13/15 | Appropriate constraint for fragile phase execution operations. |
| D7 | 8/10 | Strong P2 pattern application with minor deviations. |
| D8 | 12/15 | Decision trees present for failure scenarios. Edge cases (interruption) covered. Error handling could be deeper. |

### Critical Issues
- Evals are minimal: only 4 trigger queries, no substantive test prompts or assertions
- Scripts directory contains only a basic validator; no operational scripts for wave execution
- References exist but are very small (334 and 435 lines); may not contain enough depth for complex recovery scenarios

### Top 3 Improvements
1. Expand evals to include full test prompts with assertions (e.g., "Execute a 3-wave phase where Wave 2 plan fails — verify subsequent waves abort")
2. Add operational scripts (e.g., `wave-dispatch.sh`, `checkpoint-save.sh`) to make the skill actionable
3. Add explicit "Do NOT load" guidance in the Reference Map

---

## hm-phase-loop

**Grade**: 86/120 (71.7%) — Grade C
**Pattern**: P2-hybrid (Process)
**Knowledge Ratio**: E:A:R ≈ 60:30:10
**Vendor Lock-in Score**: 0 references
**Has 6-NON Table**: Yes — Generic/template
**Has Evals**: No
**Has Scripts**: No
**Has References**: Yes (count: 1)

### Dimension Scores
| D | Score | Notes |
|---|-------|-------|
| D1 | 13/20 | Good expert knowledge on iterative loops and stall detection. Some basic loop semantics are activation-level. |
| D2 | 10/15 | Check-revise-escalate pattern is valuable. Thinking patterns present but somewhat mechanical. |
| D3 | 11/15 | Good anti-patterns (Copy loop, Silent stall, Infinite loop, Premature exit) with detection/correction. |
| D4 | 12/15 | Description has WHAT, WHEN, NOT FOR. A bit terse on keywords and trigger scenarios; not very "pushy." |
| D5 | 10/15 | Single reference is 5,178 lines — massive. No explicit loading triggers beyond `<files_to_read>`. No "Do NOT load." |
| D6 | 12/15 | Good calibration for loop control. Could be more rigid on max iterations enforcement. |
| D7 | 7/10 | P2 pattern, but the single massive reference is unusual. Lacks operational scripts. |
| D8 | 11/15 | Good severity levels and exit criteria. Example usage is vague. No error handling for checker crashes. |

### Critical Issues
- **No evals at all** — cannot iterate or benchmark
- **One massive reference file** (5,178 lines) with no loading guidance — risks context bloat if loaded
- **No scripts** — a loop-management skill with no operational scripts is under-equipped
- 6-NON table is generic/template-quality, not specific to the skill

### Top 3 Improvements
1. Create `evals/evals.json` with test prompts covering stall detection, max iteration enforcement, and escalation paths
2. Split `references/revision-loop.md` into smaller focused references (e.g., `stall-detection.md`, `escalation-patterns.md`)
3. Add operational scripts: `loop-tracker.sh`, `issue-counter.sh`, `stall-detector.sh`

---

## hm-planning-with-files

**Grade**: 96/120 (80%) — Grade B
**Pattern**: P3 (declared), but body is P2-sized (~168 lines)
**Knowledge Ratio**: E:A:R ≈ 70:20:10
**Vendor Lock-in Score**: 0 references
**Has 6-NON Table**: Yes — Generic/template
**Has Evals**: No
**Has Scripts**: No
**Has References**: Yes (count: 3)

### Dimension Scores
| D | Score | Notes |
|---|-------|-------|
| D1 | 15/20 | Strong expert knowledge on filesystem-as-memory, session recovery, delegation envelopes. Tiered response concept is excellent. |
| D2 | 12/15 | Excellent thinking patterns (Iron Law, read-before-write). Domain procedures (3-file system, subagent envelope) are expert. |
| D3 | 12/15 | Excellent anti-patterns (Todo Relier, Goal Forgetter, Error Hider, Plan Bloater, Plan Skipper, Skill Writer). |
| D4 | 13/15 | Good description with WHAT, WHEN, NOT FOR. Could use more trigger keywords and be more "pushy." |
| D5 | 11/15 | Good progressive disclosure. 3 references with clear map. No "Do NOT load" guidance. No scripts. |
| D6 | 13/15 | Good calibration. High freedom for planning, structured for file operations. |
| D7 | 7/10 | Declares P3 but body is only 168 lines (P2 territory). References are substantial. |
| D8 | 13/15 | Excellent usability. Decision tree for tiered response. Concrete file paths. Session recovery protocol. Subagent envelope pattern. |

### Critical Issues
- **No evals** — cannot iterate or benchmark
- **No scripts** — for a skill about filesystem persistence, operational scripts (e.g., `checkpoint-save.sh`, `plan-validate.sh`) would add value
- 6-NON table is generic/template-quality

### Top 3 Improvements
1. Create `evals/evals.json` with test prompts for session recovery, subagent handoffs, and plan drift detection
2. Add operational scripts for checkpointing and plan validation
3. Expand description with more trigger keywords and "pushy" language

---

## hm-refactor

**Grade**: 104/120 (86.7%) — Grade B
**Pattern**: P2-hybrid (Process)
**Knowledge Ratio**: E:A:R ≈ 75:20:5
**Vendor Lock-in Score**: 0 references
**Has 6-NON Table**: Yes — Specific
**Has Evals**: Yes (trigger_queries only, 4 queries)
**Has Scripts**: Yes (quality: Mediocre — basic validate-skill.sh only)
**Has References**: Yes (count: 2)

### Dimension Scores
| D | Score | Notes |
|---|-------|-------|
| D1 | 16/20 | Strong expert knowledge. Decision tree for surgical vs structural, rollback protocol, safety checklist. Very little redundancy. |
| D2 | 13/15 | Excellent thinking pattern (Iron Law). Domain procedures (rollback commands, branch workflow) are expert-level. |
| D3 | 13/15 | Excellent anti-patterns (Behavior Changer, Testless Restructure, Mega-Commit, No-Rollback) with specific correction. |
| D4 | 14/15 | Excellent description. Comprehensive with WHAT, WHEN, KEYWORDS, triggers, NOT FOR. Very "pushy." |
| D5 | 12/15 | Good progressive disclosure. 2 small references. SKILL.md is lean. Could use "Do NOT load" guidance. |
| D6 | 14/15 | Excellent calibration. Rigid where needed (safety checklist, rollback), flexible for decision-making. |
| D7 | 8/10 | Strong P2 pattern application. |
| D8 | 14/15 | Excellent usability. Decision tree, rollback commands, concrete examples. Error handling at each gate. |

### Critical Issues
- Evals are minimal: only 4 trigger queries, no substantive test prompts or assertions
- Scripts directory contains only a basic validator; no operational scripts for refactoring workflows

### Top 3 Improvements
1. Expand evals to include full test prompts with assertions (e.g., "User says 'refactor this module' with no tests — verify skill directs to write tests first")
2. Add operational scripts (e.g., `safety-check.sh`, `rollback-helper.sh`)
3. Add explicit "Do NOT load" guidance in the Reference Map

---

## hm-research-chain

**Grade**: 98/120 (81.7%) — Grade B
**Pattern**: P1 (Router)
**Knowledge Ratio**: E:A:R ≈ 70:25:5
**Vendor Lock-in Score**: 0 references
**Has 6-NON Table**: Yes — Specific
**Has Evals**: Yes (trigger_queries only, 4 queries)
**Has Scripts**: Yes (quality: Mediocre — basic validate-skill.sh only)
**Has References**: Yes (count: 2)

### Dimension Scores
| D | Score | Notes |
|---|-------|-------|
| D1 | 15/20 | Strong expert knowledge on research chain (detect→research→synthesize→artifact). Tool matrix and stage contracts are expert. |
| D2 | 12/15 | Good thinking pattern (Iron Law). Domain procedures (stage outputs, when to use full chain) are valuable. |
| D3 | 12/15 | Good anti-patterns (Skipped Detect, Hoarder, Single-Source, Orphan Artifact) with specific correction. |
| D4 | 14/15 | Excellent description. Very comprehensive with WHAT, WHEN, KEYWORDS, triggers, NOT FOR. |
| D5 | 12/15 | Good progressive disclosure. 2 small references. SKILL.md is lean at 121 lines. Could use "Do NOT load." |
| D6 | 13/15 | Good calibration. Medium freedom for research direction, structured for chain execution. |
| D7 | 8/10 | Strong P1 pattern (router). 121 lines, 2 references. |
| D8 | 12/15 | Good usability. Decision table for when to use chain. Stage outputs defined. Could use more error handling (what if detect fails?). |

### Critical Issues
- Evals are minimal: only 4 trigger queries, no substantive test prompts or assertions
- Scripts directory contains only a basic validator
- No error handling for stage failures (e.g., what if `hm-detective` returns no findings?)

### Top 3 Improvements
1. Expand evals to include full test prompts with assertions (e.g., "Research task with single source — verify skill insists on multi-source synthesis")
2. Add stage-failure handling to the Canonical Chain section
3. Add operational scripts for chain progress tracking

---

## hm-skill-synthesis

**Grade**: 101/120 (84.2%) — Grade B
**Pattern**: P2-hybrid (Process)
**Knowledge Ratio**: E:A:R ≈ 70:20:10
**Vendor Lock-in Score**: 0 references
**Has 6-NON Table**: Yes — Specific
**Has Evals**: Yes (evals.json with 5 test cases + trigger-queries.json with 20 queries)
**Has Scripts**: Yes (quality: Good — 7 scripts including validators, graders, classifiers)
**Has References**: Yes (count: 5)

### Dimension Scores
| D | Score | Notes |
|---|-------|-------|
| D1 | 16/20 | Strong expert knowledge. Pipeline (INGEST→CLASSIFY→SCAFFOLD→VALIDATE), classification axes, decision tree. Non-interactive shell compliance is expert. |
| D2 | 13/15 | Excellent thinking pattern (Iron Law: NO SKILL WITHOUT EVALS). Domain procedures (repomix patterns, validation gates) are very specific. |
| D3 | 13/15 | Excellent anti-patterns (Hoarder, LLM Simulator, Template Copier, Silent Failure) with specific correction. |
| D4 | 13/15 | Good description with WHAT, WHEN, triggers. A bit dense. Could be more "pushy" or explicit about WHEN. |
| D5 | 13/15 | Good progressive disclosure. 5 references loaded by decision tree. "Load only ONE reference" guidance present. Many scripts. |
| D6 | 12/15 | Good calibration. Medium freedom for synthesis, low freedom for validation (exact scripts). |
| D7 | 8/10 | Strong P2 pattern. |
| D8 | 13/15 | Good usability. Decision tree for path selection. Error handling table. Non-interactive shell compliance. Could use more edge case coverage. |

### Critical Issues
- Evals exist but assertions are all `passed: false` with empty evidence — not yet executed/validated
- Description could be more "pushy" to combat undertriggering
- `task_plan.md` exists in skill root (should not be committed — it's a runtime artifact)

### Top 3 Improvements
1. Execute evals and populate assertion results; add more negative test cases
2. Make description more "pushy" with adjacent concept triggers
3. Remove `task_plan.md` from skill directory (add to .gitignore if needed)

---

## hm-spec-driven-authoring

**Grade**: 102/120 (85%) — Grade B
**Pattern**: P2-hybrid (Process)
**Knowledge Ratio**: E:A:R ≈ 75:20:5
**Vendor Lock-in Score**: 0 references
**Has 6-NON Table**: Yes — Specific
**Has Evals**: Yes (trigger_queries only, 5 queries)
**Has Scripts**: Yes (quality: Mediocre — basic validate-skill.sh only)
**Has References**: Yes (count: 2)

### Dimension Scores
| D | Score | Notes |
|---|-------|-------|
| D1 | 16/20 | Strong expert knowledge on spec→req→test pipeline, requirement format, falsifiable conditions. Very little redundancy. |
| D2 | 13/15 | Excellent thinking pattern (Iron Law). Domain procedures (red-green-refactor with spec focus) are expert. REQ format is expert. |
| D3 | 13/15 | Excellent anti-patterns (Vague Spec, Untestable Req, Green Before Red, Missing Negative) with specific correction. |
| D4 | 14/15 | Excellent description. Comprehensive with WHAT, WHEN, KEYWORDS, triggers, NOT FOR. |
| D5 | 12/15 | Good progressive disclosure. 2 small references. SKILL.md is lean. Could use "Do NOT load." |
| D6 | 13/15 | Good calibration. Structured for spec operations, medium freedom for test design. |
| D7 | 8/10 | Strong P2 pattern. |
| D8 | 13/15 | Excellent usability. Clear 5-step pipeline. Requirement format template. Coverage claims verification. Error handling at each gate. |

### Critical Issues
- Evals are minimal: only 5 trigger queries, no substantive test prompts or assertions
- Scripts directory contains only a basic validator

### Top 3 Improvements
1. Expand evals to include full test prompts with assertions (e.g., "User provides vague spec with 'fast' — verify skill rewrites as measurable condition")
2. Add operational scripts (e.g., `req-validator.sh`, `spec-parser.sh`)
3. Add explicit "Do NOT load" guidance in the Reference Map

---

## hm-subagent-delegation-patterns

**Grade**: 91/120 (75.8%) — Grade C
**Pattern**: P2-hybrid (Process)
**Knowledge Ratio**: E:A:R ≈ 65:25:10
**Vendor Lock-in Score**: 0 references
**Has 6-NON Table**: No
**Has Evals**: No
**Has Scripts**: Yes (quality: Mediocre — basic validate-skill.sh only)
**Has References**: Yes (count: 3)

### Dimension Scores
| D | Score | Notes |
|---|-------|-------|
| D1 | 14/20 | Good expert knowledge on delegation envelopes, checkpoint protocols, resume logic. Context continuity patterns are valuable. |
| D2 | 12/15 | Good thinking pattern (Iron Law). Domain procedures (session ID tracking, checkpoint return format) are expert. Deviation rules are strong. |
| D3 | 12/15 | Good anti-patterns (Fire-and-Forget, Re-Creator, Context Polluter, Silent Fail, Infinite Retry) with specific correction. |
| D4 | 12/15 | Good description with WHAT, WHEN, NOT FOR. Could use more trigger keywords and be more "pushy." |
| D5 | 11/15 | Good progressive disclosure. 3 references with clear map. SKILL.md 157 lines. No evals. No "Do NOT load." |
| D6 | 12/15 | Good calibration. Low freedom for checkpoint format, medium for deviation rules. |
| D7 | 7/10 | P2 pattern, but missing 6-NON table. Cross-references present. |
| D8 | 12/15 | Good usability. Concrete bash examples. Checkpoint return format template. State persistence table. Could use more error handling for edge cases. |

### Critical Issues
- **No 6-NON Defence Table** — defence table gap
- **No evals** — cannot iterate or benchmark
- **Scripts directory contains only a basic validator** — for a skill about delegation patterns, operational scripts (e.g., `resume-session.sh`, `checkpoint-parser.sh`) would add significant value

### Top 3 Improvements
1. Add a specific 6-NON Defence Table
2. Create `evals/evals.json` with test prompts covering session resume, checkpoint parsing, and deviation rules
3. Add operational scripts for delegation tracking and session resume

---

## hm-synthesis

**Grade**: 92/120 (76.7%) — Grade C
**Pattern**: P2 (declared), but body behaves like Tool (~383 lines)
**Knowledge Ratio**: E:A:R ≈ 65:25:10
**Vendor Lock-in Score**: 0 references
**Has 6-NON Table**: Yes — Generic/template
**Has Evals**: No
**Has Scripts**: No
**Has References**: Yes (count: 7)

### Dimension Scores
| D | Score | Notes |
|---|-------|-------|
| D1 | 15/20 | Strong expert knowledge on compression tiers, cross-dependency analysis, interface extraction, pattern classification. Corpus gate is expert. |
| D2 | 12/15 | Good thinking patterns. Domain procedures (5-step protocol, extraction templates) are valuable. Some sections are more reference-like than mindset. |
| D3 | 11/15 | Good anti-patterns (Over-Compression, Classification Without Corpus, Stale Dependency Graph, Interface Drift, Orphaned Artifact). |
| D4 | 12/15 | Good description with WHAT, WHEN, NOT FOR. Could use more trigger keywords. |
| D5 | 10/15 | SKILL.md is 383 lines (approaching 500 limit). 7 references, no explicit "Do NOT load" guidance. Quick Jump table adds length. No scripts. |
| D6 | 12/15 | Good calibration. High freedom for creative synthesis, structured for extraction. |
| D7 | 7/10 | P2 pattern but 383 lines is large for P2. Quick Jump table makes it more like a Tool pattern. |
| D8 | 13/15 | Good usability. Decision table for compression tiers. Extraction templates. Corpus gate thresholds. Tech-stack detection protocol. |

### Critical Issues
- **No evals** — cannot iterate or benchmark
- **SKILL.md body is 383 lines** — approaching the 500-line limit. Quick Jump table and extensive in-body protocols could be moved to references
- **No scripts** — for a skill with deterministic tasks (compression, dependency analysis), scripts would add value
- 6-NON table is generic/template-quality

### Top 3 Improvements
1. Create `evals/evals.json` with test prompts for compression tier selection, corpus gate validation, and artifact export
2. Split SKILL.md body: move Quick Jump table and detailed protocols into references to bring body under 250 lines
3. Add operational scripts for dependency analysis and interface extraction

---

## hm-test-driven-execution

**Grade**: 103/120 (85.8%) — Grade B
**Pattern**: P2-hybrid (Process)
**Knowledge Ratio**: E:A:R ≈ 75:20:5
**Vendor Lock-in Score**: 0 references
**Has 6-NON Table**: Yes — Specific
**Has Evals**: Yes (trigger_queries only, 5 queries)
**Has Scripts**: Yes (quality: Mediocre — basic validate-skill.sh only)
**Has References**: Yes (count: 2)

### Dimension Scores
| D | Score | Notes |
|---|-------|-------|
| D1 | 15/20 | Strong expert knowledge on red-green-refactor, coverage verification, TDD gates. Very little redundancy. |
| D2 | 13/15 | Excellent thinking pattern (Iron Law). Domain procedures (coverage verification command) are expert. |
| D3 | 13/15 | Excellent anti-patterns (Test-After, Fake Green, Refactor-First, Coverage Lie) with specific correction. |
| D4 | 14/15 | Excellent description. Comprehensive with WHAT, WHEN, KEYWORDS, triggers, NOT FOR. Very "pushy." |
| D5 | 12/15 | Good progressive disclosure. 2 small references. SKILL.md is lean. Could use "Do NOT load." |
| D6 | 14/15 | Excellent calibration. Rigid for TDD cycle (must fail first), flexible for test design. |
| D7 | 8/10 | Strong P2 pattern. |
| D8 | 14/15 | Excellent usability. Clear 3-phase loop with gates. Coverage claim format (valid/invalid). Verification command. Error handling at each gate. |

### Critical Issues
- Evals are minimal: only 5 trigger queries, no substantive test prompts or assertions
- Scripts directory contains only a basic validator; no operational scripts for TDD workflows

### Top 3 Improvements
1. Expand evals to include full test prompts with assertions (e.g., "User claims 90% coverage — verify skill demands fresh command output")
2. Add operational scripts (e.g., `coverage-verify.sh`, `red-green-tracker.sh`)
3. Add explicit "Do NOT load" guidance in the Reference Map

---

## hm-user-intent-interactive-loop

**Grade**: 90/120 (75%) — Grade C
**Pattern**: P3 (declared), but behaves like Process (~399 lines)
**Knowledge Ratio**: E:A:R ≈ 60:30:10
**Vendor Lock-in Score**: 2 references (Claude Code in Platform Adaptation table)
**Has 6-NON Table**: No
**Has Evals**: Yes (evals.json with 8 test cases + trigger-queries.json with 20 queries)
**Has Scripts**: Yes (quality: Good — 5 scripts including intent-verify.sh, verify-hierarchy.sh, first-action.sh)
**Has References**: Yes (count: 5)

### Dimension Scores
| D | Score | Notes |
|---|-------|-------|
| D1 | 14/20 | Good expert knowledge on interactive loops, question protocols, context preservation, long session management. Some content is more procedural than expert. |
| D2 | 12/15 | Good thinking patterns (hierarchy awareness, delegation rules). Domain procedures (intent-verify.sh, 6 stop conditions) are expert. |
| D3 | 12/15 | Excellent anti-patterns (Premature Executor, Interrogator, Yes-Agent, Abandoner, Amnesiac, Silent Worker, Scope Creep, Orphan Dispatcher, Skill Ignorer, Coordinator Executor). Very comprehensive. |
| D4 | 12/15 | Good description with WHAT, WHEN, triggers. A bit long. Could be more "pushy." |
| D5 | 9/15 | SKILL.md is 399 lines (very close to 500 limit). 5 large references. Has `<files_to_read>` but no explicit "Do NOT load." Scripts are substantial. |
| D6 | 11/15 | Good calibration. High structure for PROBE phase, medium for other phases. Question cap is rigid. |
| D7 | 7/10 | P3 pattern declared, but 399 lines is large even for P3. Structure is more like a Process pattern. |
| D8 | 13/15 | Excellent usability. Decision matrix, 6-phase loop, worked examples, platform adaptation. Validation loop procedure. Error handling for each gate. |

### Critical Issues
- **No 6-NON Defence Table** — defence table gap
- **SKILL.md body is 399 lines** — very close to the 500-line limit. Could be trimmed by moving Platform Adaptation and Reference Map sections to references
- **2 vendor lock-in references** to Claude Code — minor but present
- **Assertion fields in evals are all `passed: false`** with empty evidence — not yet executed

### Top 3 Improvements
1. Add a specific 6-NON Defence Table
2. Trim SKILL.md body: move Platform Adaptation table and Reference Map to references to bring body under 300 lines
3. Execute evals and populate assertion results; remove or minimize vendor lock-in references

---

# Batch 3 Summary

## Grade Distribution
| Grade | Count | Skills |
|-------|-------|--------|
| A | 0 | — |
| B | 7 | hm-phase-execution, hm-planning-with-files, hm-refactor, hm-research-chain, hm-skill-synthesis, hm-spec-driven-authoring, hm-test-driven-execution |
| C | 4 | hm-phase-loop, hm-subagent-delegation-patterns, hm-synthesis, hm-user-intent-interactive-loop |
| D | 0 | — |
| F | 0 | — |

**Batch Average**: 95.5/120 (79.6%) — Solid B overall, but no A grades.

## Critical Gaps Across Batch
1. **Missing or minimal evals (7 of 11 skills)** — Only `hm-skill-synthesis` and `hm-user-intent-interactive-loop` have substantive evals with test prompts and assertions. The other 9 skills have either no evals or only lightweight `trigger_queries` with no assertions. This blocks iteration and benchmarking.
2. **Missing 6-NON Defence Tables (2 skills)** — `hm-subagent-delegation-patterns` and `hm-user-intent-interactive-loop` lack 6-NON tables entirely. Another 3 skills have generic/template-quality 6-NON tables rather than skill-specific defences.
3. **Overly long SKILL.md bodies (2 skills)** — `hm-synthesis` (383 lines) and `hm-user-intent-interactive-loop` (399 lines) are approaching the 500-line limit. This reduces token efficiency and makes the skills harder to load.
4. **Weak script coverage (9 of 11 skills)** — Only `hm-skill-synthesis` and `hm-user-intent-interactive-loop` have substantial operational scripts. Most other skills have only a basic `validate-skill.sh`, and 3 skills have no scripts at all.

## Skills Most Likely to Fail in Production
1. **hm-phase-loop** — No evals, one massive 5,178-line reference file with no loading guidance, no operational scripts. Risk: context bloat, untested stall detection logic.
2. **hm-synthesis** — No evals, 383-line body, no scripts. Risk: token inefficiency, untested compression tier decisions.
3. **hm-subagent-delegation-patterns** — No evals, no 6-NON table, only basic validator script. Risk: untested resume logic, missing defence against overlapping skills.

## Framework 2 (skill-development) Cross-Cut
| Check | Pass | Fail | Notes |
|-------|------|------|-------|
| SKILL.md + valid frontmatter | 11/11 | 0 | All valid |
| Description: third person + trigger phrases | 11/11 | 0 | All pass |
| Body: imperative/infinitive form | 11/11 | 0 | All pass |
| Body lean (< 5,000 words, target < 2,000) | 11/11 | 0 | All under limit |
| Details in references/ | 11/11 | 0 | All pass |
| Referenced files exist | 11/11 | 0 | All verified |
| Progressive disclosure | 11/11 | 0 | Core in body, details in refs |
| scripts/ for deterministic tasks | 8/11 | 3 | Missing: hm-phase-loop, hm-planning-with-files, hm-synthesis |
| examples/ for working examples | 0/11 | 11 | No skill has examples/ directory |
| No broken examples | N/A | N/A | No examples to check |

## Framework 3 (skill-creator) Cross-Cut
| Check | Pass | Fail | Notes |
|-------|------|------|-------|
| evals/evals.json exists | 7/11 | 4 | Missing: hm-phase-loop, hm-planning-with-files, hm-subagent-delegation-patterns, hm-synthesis |
| Test prompts realistic & substantive | 4/11 | 7 | Only hm-skill-synthesis and hm-user-intent-interactive-loop have full evals |
| Assertions objectively verifiable | 2/11 | 9 | Only hm-skill-synthesis and hm-user-intent-interactive-loop have assertions |
| Iteration-ready | 2/11 | 9 | Only hm-skill-synthesis and hm-user-intent-interactive-loop |
| Description is "pushy" | 5/11 | 6 | hm-refactor, hm-research-chain, hm-test-driven-execution, hm-phase-execution, hm-spec-driven-authoring are pushy |
| Has trigger-queries.json | 2/11 | 9 | Only hm-skill-synthesis and hm-user-intent-interactive-loop |

---

*Audit completed: 2026-04-23*
