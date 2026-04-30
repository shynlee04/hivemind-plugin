# Phase 27 G-B Final Evidence Catalog

**Completed:** 2026-04-25  
**Scope:** `hm-spec-driven-authoring` and `hm-test-driven-execution` only.  
**Exit decision:** PASS for both G-B target skills at `SUBSTANTIVE` tier.  
**Phase 28-31 scope use:** None. Phase 31 cross-lineage end-to-end validation remains excluded from Phase 27 completion evidence.

## Final Records

### hm-spec-driven-authoring

```yaml
skill_path: .opencode/skills/hm-spec-driven-authoring/SKILL.md
quality_tier: SUBSTANTIVE
dimension_scores:
  HMQUAL-01: { score: PASS, evidence: "Use-when description, negative exclusions, boundary eval, stacked eval", blocker: none }
  HMQUAL-02: { score: PASS, evidence: "Entry Gate, Spec-Lock Workflow, Exit Criteria, Anti-Patterns", blocker: none }
  HMQUAL-03: { score: PASS, evidence: "6-NON Defence Table covers NON-1 through NON-6", blocker: none }
  HMQUAL-04: { score: PASS, evidence: "evals/evals.json has positive, negative, boundary, assertions, stacked_scenario", blocker: none }
  HMQUAL-05: { score: PASS, evidence: "Reference Map cites two one-level references", blocker: none }
  HMQUAL-06: { score: PASS, evidence: "Integration Wiring covers agents, commands, tools, hooks, runtime state", blocker: none }
  HMQUAL-07: { score: PASS, evidence: "Cross-Platform Adapters cover OpenCode, Hivemind, arbitrary projects", blocker: none }
  HMQUAL-08: { score: PASS, evidence: "Self-Correction covers vague source, conflicts, blocked tests, handoff", blocker: none }
verification_commands:
  - bash .opencode/skills/hm-spec-driven-authoring/scripts/validate-skill.sh
eval_bundle_status:
  trigger_coverage: PASS
  negative_coverage: PASS
  boundary_coverage: PASS
  stacked_scenario: PASS
reference_bundle_status:
  files: ["references/spec-to-req-mapping.md", "references/acceptance-test-patterns.md"]
  cited_from_skill: PASS
  one_level_deep: PASS
  stale_link_status: PASS
integration_wiring_notes:
  agents: applicable and documented
  commands: applicable and documented
  tools: prompt-skim, prompt-analyze, session-patch documented with fallbacks
  plugin_hooks: fact-reporting behavior documented
  runtime_state: requirement IDs, source, blockers, handoff status documented
cross_platform_notes:
  opencode_native: documented
  hivemind_harness: documented
  arbitrary_user_project: documented without local path dependency
self_correction_notes:
  retry: one rewrite attempt for vague source
  rollback: not applicable to authoring; blocked handoff used instead
  escalation: conflicting requirements stop and escalate
  blocked_handoff: structured packet specified
```

### hm-test-driven-execution

```yaml
skill_path: .opencode/skills/hm-test-driven-execution/SKILL.md
quality_tier: SUBSTANTIVE
dimension_scores:
  HMQUAL-01: { score: PASS, evidence: "Use-when description, negative exclusions, boundary ambiguous-requirements eval", blocker: none }
  HMQUAL-02: { score: PASS, evidence: "Entry Gate, RED/GREEN/REFACTOR Gates, Runtime-Truthful Testing, Coverage Claims", blocker: none }
  HMQUAL-03: { score: PASS, evidence: "6-NON Defence Table covers NON-1 through NON-6", blocker: none }
  HMQUAL-04: { score: PASS, evidence: "evals/evals.json has positive, negative, boundary, invalid_red, coverage fallback, stacked_scenario", blocker: none }
  HMQUAL-05: { score: PASS, evidence: "Reference Map cites two one-level references", blocker: none }
  HMQUAL-06: { score: PASS, evidence: "Integration Wiring covers agents, commands, tools, hooks, runtime state and coverage commands", blocker: none }
  HMQUAL-07: { score: PASS, evidence: "Node/Python/Go/no-coverage adapters plus OpenCode/Hivemind/arbitrary-project notes", blocker: none }
  HMQUAL-08: { score: PASS, evidence: "Self-Correction covers invalid RED, GREEN retry budget, refactor regression, missing coverage, blocked handoff", blocker: none }
verification_commands:
  - bash .opencode/skills/hm-test-driven-execution/scripts/validate-skill.sh
eval_bundle_status:
  trigger_coverage: PASS
  negative_coverage: PASS
  boundary_coverage: PASS
  invalid_red: PASS
  coverage_absent: PASS
  stacked_scenario: PASS
reference_bundle_status:
  files: ["references/red-green-refactor.md", "references/coverage-verification.md"]
  cited_from_skill: PASS
  one_level_deep: PASS
  stale_link_status: PASS
integration_wiring_notes:
  agents: applicable and documented
  commands: applicable and documented
  tools: run-background-command, prompt-skim, prompt-analyze, session-patch documented
  plugin_hooks: warning/recording boundaries documented
  runtime_state: red/green/refactor/blocked, command, output, coverage status, retry count documented
cross_platform_notes:
  opencode_native: documented
  hivemind_harness: documented
  arbitrary_user_project: documented for Node, Python, Go, and no coverage tooling
self_correction_notes:
  retry: three focused attempts before blocked handoff
  rollback: refactor regression rollback specified
  escalation: ambiguous requirements route to hm-spec-driven-authoring
  blocked_handoff: structured packet specified
```

## Explicit Blockers

No non-PASS HMQUAL cells remain for the Phase 27 G-B target pair. Phase 31 remains responsible for later cross-lineage end-to-end validation and is not claimed here.
