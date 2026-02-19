---
name: "hivefiver-intake"
description: "Run controlled multi-choice intake for HiveFiver v2 across dev and non-dev domains with adaptive tutoring profiles."
---

# HiveFiver Intake

## Purpose
Collect structured inputs that can route into specification, research, and execution workflows.

## Intake Rules
- MCQ-first, bounded free-text second.
- Every answer maps to a planning field.
- Unknown/ambiguous inputs must trigger clarification.

## Required Intake Grid
1. Outcome target
2. Persona confidence
3. Domain lane
4. Regulatory pressure
5. Complexity class
6. MCP readiness
7. Testing posture
8. Delivery confidence target
9. Language mode
10. Output style
11. Task export target
12. Automation level

## Persona Coaching
- `vibecoder`: examples-first and defaults-forward.
- `floppy_engineer`: cleanup-first and coherence scoring.
- `enterprise_architect`: strict risk/compliance checks.

## Required Checkpoint
```ts
map_context({ level: "action", content: "HiveFiver v2 intake normalization" })
```

## Output Contract
Produce:
- `intake_json`
- `persona_scores`
- `constraint_matrix`
- `risk_register_v0`
- `domain_pack_recommendation`
- `automation_profile`
- `language_contract`
- `next_command`: `/hivefiver spec`
