---
phase: SE-11
plan: naming-syndicate-formalization
subsystem: skill-ecosystem
tags:
  - naming-convention
  - meta-builder-governance
  - lineage-enforcement
  - glob-patterns
requires:
  - SE-9 (all skills stable)
provides:
  - formal naming rules across 5 lineages
  - machine-verifiable validation (regex + glob)
  - agent L0/L1/L2 layer hierarchy
affects:
  - hm-lineage-router
  - hf-meta-builder
  - hivefiver-skill-author
  - hivefiver-agent-builder
  - AS-11 (naming syndicate block)
tech-stack:
  added:
    - none (governance skill, no code)
  patterns:
    - naming syndicate (governance-as-validation)
    - glob-based permission patterns
    - regex-based name validation
key-files:
  created:
    - .hivefiver-meta-builder/skills-lab/active/refactoring/hf-l2-naming-syndicate/SKILL.md
    - .hivefiver-meta-builder/skills-lab/active/refactoring/hf-l2-naming-syndicate/evals/evals.json
    - .hivefiver-meta-builder/skills-lab/active/refactoring/hf-l2-naming-syndicate/metrics/rich-gate-scorecard.md
  modified:
    - .planning/workstreams/skill-ecosystem/STATE.md
    - .planning/workstreams/skill-ecosystem/phases/SE-11-naming-syndicate-formalization/SE-11-CONTEXT.md
decisions:
  - "Naming convention follows {lineage}-{depth}-{role} pattern with L0/L1/L2/L3 layer suffixes"
  - "Glob patterns enable machine-verifiable lineage enforcement in agent allowlists"
  - "gsd-* agents excluded from naming scheme (internal build tools, not shipped)"
  - "RICH-8 8/8 with D1-D8 108/120 (A) — all gates pass"
  - "SE-11 decoupled from SE-10 (naming rules can exist before routers)"
metrics:
  duration: "N/A (completed in one session)"
  completed_date: 2026-04-30
---

# Phase SE-11: Naming Syndicate Formalization — Summary

**One-liner:** Created hf-l2-naming-syndicate, a governance skill that defines formal naming conventions for ALL Hivemind meta-concepts across 5 lineages with machine-verifiable regex + glob pattern validation, scoring RICH-8 8/8.

## Deliverables

### 1. hf-l2-naming-syndicate SKILL.md (313 lines)
Comprehensive naming convention documentation covering:
- **Agent Naming Convention:** `{lineage}-{depth}-{role}` pattern with L0 (orchestrator), L1 (coordinator), L2 (specialist) layer suffixes
- **Skill Naming Convention:** `{lineage}-{depth}-{name}` with L2 (execution/how-to) and L3 (research/reference) layers
- **Lineage Rules:** hm-* STRICT (agents only load hm/gate/stack), hf-* FLEXIBLE (can load all), gate-* INTERNAL (project-only), gsd-* EXCLUDED
- **Glob Pattern Reference:** Agent allowlist patterns (`"hm-l2-*": allow`), exact-match patterns, skill routing patterns, 4 glob enforcement rules
- **Machine-Verifiable Rules:** Regex patterns for each lineage prefix plus word count bounds
- **Human-Review Rules:** Lineage integrity, no straddling, no abbreviations, directory-name match, no numeric suffixes
- **Conflict Resolution:** 4-step escalation (lineage check → function differentiation → merge → naming review)
- **Rename History:** 10 renames from SE-1, disabled/archived entries, 6 known name anomalies
- **Self-Correction:** 5 modes (rule violations, rule updates, false positives, lineage name sharing, regex bugs)
- **Anti-Patterns:** 5 patterns (Unprefixed Drifter, Boundary Straddler, Lazy Abbreviator, Suffix Violator, V2 Clinger)

### 2. evals/evals.json (16 scenarios)
- 8 positive scenarios (hm/hf/gate/stack naming validation, agent L0 validation, glob L2 specialists, glob exact match, glob gsd exclusion)
- 6 negative scenarios (too many words, wrong prefix, suffix violation, abbreviation, numeric version, cross-lineage glob)
- 2 boundary scenarios (unprefixed skills, straddling lineages)
- Full rich_source_evidence block for all 8 RICH gates

### 3. metrics/rich-gate-scorecard.md
- **RICH-8 Score: 8/8** ✅
- **D1-D8 Total: 108/120 (90%, Grade: A)**
- All 8 RICH gates pass with specific evidence citations

## Verification

| Criteria | Status | Evidence |
|----------|--------|----------|
| Skill created with correct YAML frontmatter | ✅ | `name: hf-l2-naming-syndicate`, `lineage: hf-*`, 15 trigger phrases |
| Agent naming convention documented | ✅ | L0/L1/L2 layer hierarchy with suffix rules |
| Skill naming convention documented | ✅ | L2/L3 layer distinction, domain-function pattern |
| Lineage rules documented | ✅ | STRICT/FLEXIBLE/INTERNAL/EXCLUDED classification |
| Glob pattern reference included | ✅ | Agent allowlist, exact-match, skill routing, 4 enforcement rules |
| Self-correction (4+ modes) | ✅ | 5 modes with detection + recovery |
| Evals/metrics on disk | ✅ | 16 eval scenarios + D1-D8 scorecard |
| RICH-8 ≥ 6/8 | ✅ | 8/8 PASS, D1-D8 108/120 (A) |
| STATE.md updated | ✅ | SE-11 → COMPLETE, phases 12/17 |
| SE-11 CONTEXT.md updated | ✅ | status → COMPLETE |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Added Glob Pattern Reference section**
- **Found during:** Task execution
- **Issue:** Original SE-11 prompt specified glob pattern reference (`"hm-l2-*": allow` patterns) but existing SKILL.md had no glob section
- **Fix:** Added comprehensive Glob Pattern Reference section with agent allowlist patterns, exact-match patterns, skill routing patterns, and 4 glob enforcement rules
- **Files modified:** SKILL.md (+43 lines), evals/evals.json (+4 scenarios), metrics/rich-gate-scorecard.md (D1 +1, D8 +1)
- **Commit:** pending

### Architectural Adjustments

**1. SE-11 dependency relaxed from SE-10 to SE-9**
- **Original plan:** SE-11 depends on SE-10 (naming syndicate needs routers)
- **Resolution:** Naming rules can exist before routers — the naming convention is a governance document that routers consume, not vice versa. STATE.md dependency updated accordingly.

## Threat Flags

None — this is a governance skill (documentation + validation rules). No network endpoints, no auth paths, no file access beyond reading skill directories for validation.

## Known Stubs

None — all sections complete. References directory exists (empty) as placeholder for future `naming-taxonomy.md` if needed.

## RICH-8 Scorecard

| Gate | Status |
|------|--------|
| RICH-1 (Knowledge Delta) | PASS |
| RICH-2 (Validation Strategies) | PASS |
| RICH-3 (Cross-References) | PASS |
| RICH-4 (Structured Naming) | PASS |
| RICH-5 (Progressive Disclosure) | PASS |
| RICH-6 (Framework-Agnostic) | PASS |
| RICH-7 (Honest Limitations) | PASS |
| RICH-8 (Evals + Metrics) | PASS |

**Final: 8/8 PASS — D1-D8: 108/120 (A)**
