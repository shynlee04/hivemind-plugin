---
name: "hivefiver-intake"
description: "Run controlled multi-choice intake across technical and non-technical domains to produce a normalized requirement baseline."
---

# HiveFiver Intake

## Purpose
Collect structured inputs in a cohesive, high-control format that is usable for both novice and enterprise users.

## Intake Mode Rules
- Prefer multiple-choice first, then limited free-text refinement.
- Keep each question mapped to a downstream planning field.
- Reject ambiguous inputs by emitting clarification prompts.

## Intake Grid (Required)
1. Outcome target: `idea validation` | `MVP` | `production scale`
2. Persona confidence: `low` | `medium` | `high`
3. Domain lane: `dev` | `marketing` | `finance` | `office-ops` | `hybrid`
4. Regulatory pressure: `none` | `moderate` | `high`
5. Complexity class: `small` | `medium` | `large` | `extreme`
6. MCP readiness: `full` | `partial` | `unavailable`
7. Testing posture: `explicit TDD` | `hidden assist TDD`
8. Delivery confidence target: `usable` | `hardened` | `audit-ready`
9. Language mode: `en` | `vi` | `bilingual`
10. Preferred output style: `tutorial` | `concise` | `audit-grade`
11. Task export target: `plain plan` | `gsd` | `ralph-json` | `beads`
12. Automation level: `manual checkpoints` | `semi-automatic` | `deterministic workflow`

## Persona Behaviors
- `vibecoder`: provide examples and defaults aggressively; keep hard concepts translated.
- `enterprise`: force ambiguity resolution, compliance notes, and dependency maps.

## Required Checkpoint
```ts
map_context({ level: "action", content: "HiveFiver intake normalization" })
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
- `next_command`: `/hivefiver-specforge`
