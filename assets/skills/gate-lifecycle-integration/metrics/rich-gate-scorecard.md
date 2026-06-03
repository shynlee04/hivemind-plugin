# RICH Gate Scorecard — gate-lifecycle-integration

**Evaluated:** 2026-05-10
**Evaluated by:** hf-skill-builder (audit-refresh pass)
**Source:** anomalyco/opencode v1.14.44 (verified against STACKS-REFERENCES.md + repomix)
**RICH Classification:** INTERNAL-USE (this project only, not shipped)
**Skill Pattern:** P2 (Hybrid)

## D1–D8 Quality Dimensions

| Dimension | Score | Evidence |
|-----------|-------|----------|
| **D1—Conciseness** | PASS | SKILL.md: ~200 lines, no bloat. Expert knowledge offloaded to 10 reference files. Decision tree is efficiently structured with branch-specific checklists. |
| **D2—Structure** | PASS | Valid YAML frontmatter with name, description (trigger phrases), metadata (classification, synthesis-source, triad-position, triad-siblings, triad-flow), allowed-tools. Body follows: Activation → Two-Halves → 9-Surface → SDK Compliance → CQRS → Delegation Hierarchy → Decision Tree → Routing → Remediation → Evaluation Output. |
| **D3—Procedures** | PASS | Decision tree with 6 artifact-type branches (TOOL, HOOK, LIBRARY, COMPOSITION, LEAF, DELEGATION). Each branch has specific criteria. CQRS enforcement with 7 named anti-patterns. Delegation hierarchy check against 4 runtime constants. Self-correction with 4 failure modes. |
| **D4—Bundled Resources** | PASS | 10 substantive reference files (evaluation-checklist, perspective-rubrics, anti-patterns, adopted-patterns, remediation-paths, nine-surface-authority, sdk-compliance, cqrs-boundaries, gap-documentation, triad-flow). 1 template (gate-report). 1 script (run-gate-eval.sh). 1 eval file (evals.json — 8 scenarios, 38 assertions). |
| **D5—Routing Integration** | PASS | Clear chain: lifecycle (entry) → spec-compliance → evidence-truth. Remediation routing table with 8 failure-to-skill mappings. hm-gate-orchestrator integration section added. Cross-skill boundaries documented. |
| **D6—Independence** | PASS | References src/ and .hivemind/ paths but these are the gate's domain — it validates harness architecture compliance specifically. The 9-surface authority and CQRS rules are harness-architecture-specific by design. Adopted-patterns.md documents third-party synthesis. |
| **D7—Gap Documentation** | PASS | Anti-pattern catalog documents missing capabilities. "Do NOT Load" section lists skip conditions. Gap documentation reference file exists. Missing skills noted in remediation routing. |
| **D8—Trigger Phrase Quality** | PASS | Description contains 10+ concrete trigger phrases covering: "lifecycle gate check", "harness module integration", "CQRS boundary compliance", "delegation hierarchy", "tool/hook registration", "harness quality gate", "plugin composition integrity", "phase audit on src/ modules". |

## RICH Gate Dimensions

| Gate | Status | Evidence |
|------|--------|----------|
| **RICH-1 — Third-party synthesis** | PASS | Adopted-patterns.md synthesizes Clean Architecture (CQRS), Hexagonal Architecture (ports/adapters), OpenCode SDK patterns. Nine-surface authority derived from architecture-proposal. |
| **RICH-2 — Transform-improve-adopt decision** | PASS | CQRS: adopted from Clean Architecture, transformed for tool/hook boundary. 9-surface: adopted from architecture-proposal, codified as mutation authority table. Delegation hierarchy: adopted from runtime constants, transformed into check protocol. |
| **RICH-3 — Horizontal integration** | PASS | Integration with: hm-gate-orchestrator (triad management), gate-spec-compliance (downstream), hm-coordinating-loop (remediation), hm-phase-execution (wiring fixes), hm-refactor (structural), hm-debug (root-cause), hm-completion-looping (verification). |
| **RICH-4 — Routing integration** | PASS | Triad position: ENTRY. Routes to gate-spec-compliance on PASS. Remediation routing table with 8 specific skill targets. hm-gate-orchestrator for full triad lifecycle. |
| **RICH-5 — Professional bundled resources** | PASS | 10 reference files with domain-specific content (not generic). Evaluation-checklist per artifact type. Nine-surface authority table from architecture source. SDK compliance checklists from v1.14.44 docs (anomalyco/opencode). |
| **RICH-6 — Independence audit** | PASS | This gate validates harness architecture specifically — harness paths ARE the domain. Self-correction Mode 1 handles classification ambiguity. Decision tree is artifact-type agnostic within the harness domain. |
| **RICH-7 — Completeness** | PASS | All sections present: Activation, Classification, 9-Surface, SDK Compliance, CQRS, Delegation, Decision Tree, Routing, Remediation, Self-Correction (4 modes), Orchestrator Integration, Bundled Resources. |
| **RICH-8 — Overall quality** | PASS | Professional quality. 4 self-correction modes. hm-gate-orchestrator cross-reference. 8 eval scenarios with 38 assertions. Metrics scorecard on disk. |

## Summary

**Overall RICH-8 Score: 8/8**

Gate lifecycle integration is a well-structured internal quality gate with deep domain expertise in harness architecture compliance. The SE-5.5 hardening pass added: 4 self-correction modes, hm-gate-orchestrator integration section, and metrics scorecard.
