# Phase 27 SDA Evidence Record

**Skill:** `hm-spec-driven-authoring`  
**skill_path:** `.opencode/skills/hm-spec-driven-authoring/SKILL.md`  
**quality_tier:** SUBSTANTIVE  
**Evidence date:** 2026-04-25

## dimension_scores

| HMQUAL | Score | Evidence | Blocker |
|---|---|---|---|
| HMQUAL-01 / D1 Trigger Accuracy | PASS | `SKILL.md` description starts with “Use when”, excludes exploratory coding/generic planning/TDD execution, and `evals/evals.json` includes positive, negative, and boundary trigger cases. Maps to REQ-SDA-01. | none |
| HMQUAL-02 / D2 Body Depth | PASS | `SKILL.md` includes Entry Gate, Boundary Rules, Spec-Lock Workflow, Requirement Extraction, Acceptance-Test Derivation, Handoff, Exit Criteria, Anti-Patterns, and Self-Correction. Maps to REQ-SDA-02. | none |
| HMQUAL-03 / D3 6-NON Defence | PASS | `SKILL.md` contains `6-NON Defence Table` with NON-1 through NON-6 defences. Maps to REQ-SDA-03. | none |
| HMQUAL-04 / D4 Eval Coverage | PASS | `evals/evals.json` includes `assertions`, negative and boundary cases, and `stacked_scenario` with `hm-test-driven-execution` and `hm-planning-with-files`. Maps to REQ-SDA-04. | none |
| HMQUAL-05 / D5 Reference Completeness | PASS | `SKILL.md` Reference Map cites one-level references `spec-to-req-mapping.md` and `acceptance-test-patterns.md`; both files provide supportive details without replacing body workflow. Maps to REQ-SDA-05. | none |
| HMQUAL-06 / D6 Integration Wiring | PASS | `SKILL.md` Integration Wiring names agents, commands, tools (`prompt-skim`, `prompt-analyze`, `session-patch`), plugin hooks, runtime state, `hm-test-driven-execution`, and `hm-planning-with-files`. Maps to REQ-SDA-06. | none |
| HMQUAL-07 / D7 Cross-Platform Compatibility | PASS | Cross-Platform Adapters cover OpenCode-native, Hivemind harness, and arbitrary user projects without requiring `.planning/`, GSD, Node, or absolute local paths. Maps to REQ-SDA-07. | none |
| HMQUAL-08 / D8 Self-Correction | PASS | Self-Correction defines vague source, conflicting requirements, impossible acceptance tests, failed handoff, blocked state, and evidence packet behavior. Maps to REQ-SDA-08. | none |

## verification_commands

```bash
grep -q "hm-test-driven-execution" .opencode/skills/hm-spec-driven-authoring/SKILL.md
grep -q "hm-planning-with-files" .opencode/skills/hm-spec-driven-authoring/SKILL.md
grep -q "prompt-skim" .opencode/skills/hm-spec-driven-authoring/SKILL.md
grep -q "prompt-analyze" .opencode/skills/hm-spec-driven-authoring/SKILL.md
grep -q "Self-Correction" .opencode/skills/hm-spec-driven-authoring/SKILL.md
grep -q "blocked" .opencode/skills/hm-spec-driven-authoring/SKILL.md
grep -q "stacked_scenario" .opencode/skills/hm-spec-driven-authoring/evals/evals.json
bash .opencode/skills/hm-spec-driven-authoring/scripts/validate-skill.sh
```

## eval_bundle_status

| Coverage | Status | Evidence |
|---|---|---|
| Positive trigger | PASS | `positive-prd-to-reqs`, `positive-contract-compliance` |
| Negative trigger | PASS | `negative-exploratory-coding` |
| Boundary handoff | PASS | `boundary-handoff-to-tdd` |
| Stacked scenario | PASS | `spec-to-tdd-persistent-workflow` |
| Assertions | PASS | Each eval object includes expected assertions/failure signals. |

## reference_bundle_status

- Files: `references/spec-to-req-mapping.md`, `references/acceptance-test-patterns.md`.
- Cited from `SKILL.md`: PASS.
- One-level deep: PASS.
- Stale/circular link status: PASS by package-local inspection.

## integration_wiring_notes

- Agents: applicable — role boundaries and subagent handoff packet are specified.
- Commands: applicable — `$ARGUMENTS` parsing and non-interactive expectations are stated.
- Tools: applicable — `prompt-skim`, `prompt-analyze`, and `session-patch` roles are named with fallbacks.
- Plugin hooks: applicable — hooks may suggest/record facts but not silently rewrite requirements.
- Runtime state: applicable — requirement IDs, source, blocked reasons, and handoff status must persist via available project mechanism.

## cross_platform_notes

- OpenCode-native: PASS — skill discovery and tool substitution notes included.
- Hivemind harness: PASS — delegation, continuity, and runtime guardrails addressed.
- Arbitrary user project: PASS — no `.planning/`, GSD, Node, or local absolute-path dependency.

## self_correction_notes

Retry/rewrite, conflict escalation, impossible-test blocking, and handoff packet behavior are defined in `Self-Correction`.
