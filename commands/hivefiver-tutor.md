---
name: hivefiver-tutor
description: Interactive tutoring mode with progressive disclosure, MCQ checks,
  adaptive hints, and 10-attempt escalation policy.
owner_agent: hivefiver
kind: utility
alias_resolved_to: hivefiver-tutor
required_skills:
  - meta-builder-governance
  - hivefiver-persona-routing
  - hivefiver-spec-distillation
required_templates: []
chain_group: hivefiver
group: hivefiver
entry_gate: session_declared
return_schema:
  type: json
  fields:
    - concept_id
    - attempt
    - max_attempts
    - hint_mode
    - confidence
    - next_question
    - deferred_queue
---

# HiveFiver Tutor

## Purpose
Provide always-on tutoring for EN/VI users while preserving strict workflow control.

## Tutoring Protocol
1. Present concept summary (2-3 sentences).
2. Ask MCQ with options and one `need explanation` path.
3. Track attempts and adaptive hints:
- attempt 1-2: concise correction
- attempt 3-5: example-based hint
- attempt 6-9: guided walkthrough
- attempt 10: escalation with recommended lane reset
4. Keep deferred queue for skipped concepts.

## Tab-Structured Output
Use this sequence every cycle:
- `[📋 Concept]`
- `[🧠 Check]`
- `[🛠 Hint]`
- `[✅ Progress]`

## Output Contract
Return:
- `concept_id`
- `attempt`
- `max_attempts`: 10
- `hint_mode`
- `confidence`
- `next_question`
- `deferred_queue`
