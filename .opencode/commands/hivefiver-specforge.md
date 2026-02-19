---
name: "hivefiver-specforge"
description: "Convert messy ideas into strict spec candidates with ambiguity gating, tab-structured feedback, and 10-attempt clarification loops."
---

# HiveFiver SpecForge

## Purpose
Turn unstructured or mixed-quality inputs into execution-ready specification scaffolds.

## Distillation Stages
1. Signal extraction
2. Requirement clustering
3. Ambiguity map
4. Candidate generation (2-3)
5. Recommended candidate with tradeoffs

## 10-Attempt Clarification Loop
- max attempts: `10`
- thresholds:
  - 1-2: concise clarification
  - 3-5: examples + constraints
  - 6-9: guided decomposition
  - 10: escalation and lane reset recommendation

## Tab Output Contract
Return in fixed order:
1. `[📋 Spec]`
2. `[❓ Clarify]`
3. `[⚠ Risks]`
4. `[✅ Next]`

## DeepWiki-Informed QA Handling
- allow transformed context reminders
- keep output style stable
- persist unresolved items to TODO/task graph

## Required Checkpoint
```ts
map_context({ level: "action", content: "SpecForge distillation and ambiguity gating" })
save_mem({ shelf: "decisions", content: "Spec candidate selected with ambiguity map", tags: ["hivefiver", "spec", "v2"] })
```

## Output Contract
Return:
- `spec_candidate_a`
- `spec_candidate_b`
- `ambiguity_map`
- `clarification_attempt`
- `max_attempts`: 10
- `assumption_log`
- `recommended_spec`
- `next_command`: `/hivefiver research`
