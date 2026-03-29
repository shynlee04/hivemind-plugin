# Handoff to Planning Protocol

## Articulation

The handoff from ideation to planning is the critical transition where validated ideas become executable work. This reference defines the exit criteria, packet format, and validation procedure.

## Exit Checklist

ALL five conditions must be true before handoff:

| # | Criterion | How to Verify |
|---|-----------|---------------|
| 1 | All HIGH-IMPACT ambiguity resolved | No questions marked "Resolve Before Planning" remain unanswered |
| 2 | Requirements doc has stable IDs | Every requirement has an R-prefixed ID (R1, R2, R3...) |
| 3 | Decision Log has dispositions | Every key decision has a resolution, not just "pending" |
| 4 | Feature quality gate passed | Score ≥0.7 (PASS) or 0.4-0.69 (CONDITIONAL with documented caveats) |
| 5 | No pending reviewer objections | All reviewer dispositions are APPROVED or concerns are addressed |

### Partial Handoff

If criteria 1-4 pass but reviewer objections remain:
- Document the objections
- Mark as "CONDITIONAL handoff"
- Planning may proceed but must address objections before implementation

If criteria 1-3 fail:
- Do NOT hand off
- Return to the failing phase and resolve

## Handoff Packet Format

References `use-hivemind-delegation/templates/delegation-packet.md`:

```json
{
  "session_id": "<ideation-session-id>",
  "scope": "<Lightweight|Standard|Deep>",
  "approved_approach": {
    "name": "<approach name>",
    "summary": "<one paragraph summary>",
    "approach_number": 1
  },
  "requirements_doc_path": ".hivemind/activity/ideating/{session-id}/requirements-{topic}-{date}.md",
  "decision_log_path": ".hivemind/activity/ideating/{session-id}/decisions-{topic}-{date}.md",
  "ten_x_analysis_path": ".hivemind/activity/ideating/{session-id}/ten-x-{topic}-{date}.md",
  "vocabulary_map_path": ".hivemind/activity/ideating/{session-id}/vocab-{topic}-{date}.md",
  "evidence_package_path": ".hivemind/activity/ideating/{session-id}/evidence-package.json",
  "quality_gate_result": {
    "creep_prevention": "PASS|CONDITIONAL|FAIL",
    "ten_x_score": 0.75,
    "reviewer_dispositions": [
      {"role": "skeptic", "disposition": "APPROVED"},
      {"role": "constraint-guardian", "disposition": "APPROVED"},
      {"role": "user-advocate", "disposition": "APPROVED"}
    ]
  },
  "open_questions": [],
  "exit_criteria_met": true,
  "_meta": {
    "created_at": "2026-03-29T12:00:00Z",
    "updated_at": "2026-03-29T12:00:00Z",
    "producer": "use-hivemind-ideating"
  }
}
```

## What Planning Expects

`use-hivemind-planning` requires:

1. **Stable requirement IDs** — Planning will reference R1, R2, R3... in task decomposition
2. **Decision rationale** — Planning will respect documented decisions, not re-litigate
3. **Scope boundaries** — Planning will stay within "In Scope" and not expand to "Out of Scope"
4. **Quality gate evidence** — Planning will trust the gate result, not re-evaluate
5. **Open questions list** — Planning will address these during decomposition

## Validation Commands

```bash
# Validate handoff readiness
bash scripts/hm-ideating-validate.sh \
  .hivemind/activity/ideating/{session-id}/

# Validate individual artifacts
bash ../use-hivemind-delegation/scripts/hm-artifact-validate.sh \
  .hivemind/activity/ideating/{session-id}/handoff-packet-{date}.json
```

## Handoff Failure Recovery

| Failure | Recovery |
|---------|----------|
| Missing requirements IDs | Return to Phase 6, add stable IDs |
| Undocumented decisions | Return to Phase 2, complete decision log |
| Failed quality gate | Return to Phase 5, address failing criteria |
| Pending reviewer objections | Return to Phase 4, address or escalate |
| Missing evidence | Return to Phase 3, gather missing evidence |

## Coordination

| Agent | Role in Handoff |
|-------|----------------|
| Ideation agent (this skill) | Produces handoff packet |
| Planning agent (`use-hivemind-planning`) | Consumes handoff packet |
| Orchestrator (`use-hivemind`) | Routes handoff between agents |
| Gatekeeping (`hivemind-gatekeeping`) | Validates exit criteria |

## Metrics

| Metric | Target |
|--------|--------|
| Handoff success rate | ≥90% first-attempt |
| Planning rejection rate | ≤10% |
| Missing artifact rate | 0% |

## Conditions

- **Use when:** All 7 phases complete and exit criteria are met
- **Do NOT use when:** Any exit criterion fails — return to the failing phase
