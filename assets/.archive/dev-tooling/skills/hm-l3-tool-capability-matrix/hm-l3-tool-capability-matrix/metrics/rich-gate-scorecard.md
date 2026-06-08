# RICH Gate Scorecard: hm-l3-tool-capability-matrix

**Date:** 2026-04-30 | **Auditor:** gsd-executor (SE-12) | **Version:** 1.0.0

## RICH Classification: RICH

Reference skill — complete tool capability matrix for the Hivemind ecosystem documenting ALL tools (17 native OpenCode + 10 Hivemind custom + 13 MCP provider groups), per-depth typical permissions (L0-L3), per-lineage rules (5 lineages), and granular permission pattern templates.

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 18 | 20 | Complete tool catalog: 17 native + 10 custom + 13 MCP groups = 40+ tools documented with descriptions, permission options, and pattern support. 56-agent tool allowance summary derived from actual agent definitions. Per-depth permission templates for L0/L1/L2/L3. No comparable single reference exists. |
| D2: Mindset + Procedures | 14 | 15 | Clear On Load workflow (identify depth→lineage→scan matrix→apply template→verify). Validation Loop with audit→fix→repeat cycle. Granular permission patterns (bash, edit, task, skill) for copy-paste reuse. |
| D3: Anti-Pattern Quality | 14 | 15 | Six anti-patterns: Gate-Opener, Cross-Lineage Breaker, Delegation Leaker, File-Scoper, Harness Abuser, Blind Agent. Each with detection+correction. Relevant to permission configuration domain. |
| D4: Spec Compliance | 14 | 15 | Valid frontmatter with lineage, layer, role, version. Complete description covering tool catalog scope. Clear "NOT for general coding tasks" boundary. |
| D5: Progressive Disclosure | 12 | 15 | Dense SKILL.md (340+ lines) but well-structured: Part 1 (catalog) → Part 2 (per-depth) → Part 3 (per-lineage) → Part 4 (patterns) → Part 5 (summary). Each section independently usable. |
| D6: Freedom Calibration | 13 | 15 | Appropriate for reference skill — provides factual data, templates, and rules. Does not prescribe rigid workflow. Self-correction decision trees support adaptive use. |
| D7: Pattern Recognition | 12 | 15 | Three distinct patterns: (1) Catalog-with-permissions pattern, (2) Per-depth template pattern derived from real agents, (3) Lineage-boundary enforcement rules. Clear and reusable. |
| D8: Practical Usability | 14 | 15 | Granular permission templates immediately copyable. On Load workflow immediately actionable. Self-correction covers 4 realistic failure modes. Cross-references to related skills. |
| **D1-D8 Total** | **111/125** | | **Grade: A (88.8%)** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | Native tools documented from official OpenCode docs + permissions reference. Hivemind tools sourced from `src/tools/` directory. MCP tools from current environment configuration. |
| RICH-2 | PASS | Reference catalog pattern intentionally chosen. No tutorial or workflow — this is a lookup reference for agent configuration decisions. |
| RICH-3 | PASS | Cross-refs to hm-platform-reference (native tools), hm-subagent-delegation-patterns (task tool usage), hf-naming-syndicate (agent naming), hf-delegation-gates (permission enforcement), opencode-config-workflow (permission application). |
| RICH-4 | PASS | Granular permission pattern templates with copyable JSON. Per-depth templates with rationale columns. Anti-pattern detection table. |
| RICH-5 | PASS | 40+ tools cataloged (17 native + 10 custom + 13 MCP groups). 5 lineages documented. 4 depth tiers with typical permissions. 56-agent summary. |
| RICH-6 | PASS | Permission templates use project-relative paths. No hardcoded absolute paths. Framework-agnostic in agent permission patterns. |
| RICH-7 | PASS | Self-correction: 4 modes (too restrictive, too permissive, lineage violation, MCP availability). Validation Loop with audit→fix→repeat. Anti-patterns for drift detection. |
| RICH-8 | PASS | This scorecard. `evals/evals.json` with 3 scenarios. Self-correction decision trees (4 modes). |

## Exit Decision: PASS
**RICH-8 Score:** 8/8 ✅

All RICH gates pass. D1-D8 score: 111/125 (A, 88.8%). Comprehensive tool capability reference covering all 5 lineages and all 4 depth tiers with actionable permission templates.
