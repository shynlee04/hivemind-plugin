---
name: hivefiver-discovery
description: "Guided requirement discovery with adaptive QA, language detection, and brainstorming integration"
version: "1.0.0"
contract_version: "1.0"
---

# Discovery Stage Workflow

> Clarifies user pain, requirements, and acceptance evidence before intake using adaptive questioning.

## Entry Criteria

- [ ] Start stage completed (or explicit discovery invocation)
- [ ] User input received (free-form or structured)
- [ ] Gate check passes:
  ```bash
  bash .opencode/skills/hivefiver-coordination/scripts/gate-check.sh discovery .
  # Expected: {"allowed": true}
  ```

## Steps

### Step 1: Profile User
**Action:** Detect user language, maturity, and input complexity:
```bash
bash .opencode/skills/hivefiver-mode/scripts/guided-discovery.sh "$ARGUMENTS"
```

Outputs: `{ language, maturity, input_band, guidance }`

**Verification:** Profile detected with all 4 fields populated.

### Step 2: Classify Intent
**Action:** Determine question focus from intent:
```bash
bash .opencode/skills/hivefiver-mode/scripts/classify-intent.sh "$ARGUMENTS"
```

**Verification:** Intent classified, question groups selected.

### Step 3: Generate Question Pack
**Action:** Build adaptive questions based on profile + intent:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/journey-intake-qa.sh [intent] [maturity] [input_band]
```

**Verification:** Question pack generated with correct group count and follow-up limits.

### Step 4: Wall-of-Text Pre-Processing (conditional)
**Condition:** Only if `input_band = wall_of_text`.

**Action:**
1. Summarize user input into 3 sections: problem, scope, goals
2. Present summary for confirmation
3. Ask user to rank priority
4. Focus questions on highest priority first

**Verification:** Summary accepted or corrected by user.

### Step 5: Guided Question Delivery
**Action:** Deliver questions adapted by maturity level:

| Maturity | Delivery Style |
|----------|---------------|
| L0 (Beginner) | One at a time + examples + paraphrase |
| L1 (Intermediate) | Grouped with examples |
| L2 (Advanced) | All groups, skip answered |
| L3 (Expert) | Gaps only from input extraction |

Language delivery:
| Language | Approach |
|----------|---------|
| `en` | Standard English |
| `vi` | Vietnamese with English technical terms preserved |
| `bilingual` | Both EN and VI for each question |

**Verification:** All question groups completed, answers recorded.

### Step 6: Brainstorming Integration (conditional)
**Condition:** Only for `build_new` or `extend` intents.

**Action:**
1. Present 3 divergent solution approaches
2. Ask which resonates (or user's own idea)
3. Challenge vague criteria with measurables

**Verification:** Selected approach documented.

### Step 7: Answer Validation
**Action:** Classify each answer confidence:
- **high** → concrete, testable, bounded → accept
- **medium** → missing detail → 1 follow-up
- **low** → vague/contradictory → up to N follow-ups

Catch anti-patterns: "make it better", no anti-goals, "it depends"

**Verification:** All answers at medium or high confidence.

### Step 8: Compile Structured Output
**Action:** Produce 8 required fields:

```json
{
  "problem_statement": "...",
  "primary_user_pain": "...",
  "in_scope": ["..."],
  "out_of_scope": ["..."],
  "non_negotiable_constraints": ["..."],
  "acceptance_signals": ["..."],
  "failure_modes": ["..."],
  "verification_evidence": ["..."]
}
```

**Verification:** All 8 fields populated and non-empty.

### Step 9: Promotion Gate
**Action:** Check gate criteria:
- `unresolved_critical == 0`
- `unresolved_minor <= 1`
- All 8 required answers populated
- `verification_evidence` explicit

**Verification:** Gate PASS or FAIL with reason.

### Step 10: Reclassification (for custom/adaptive journey)
**Condition:** If original intent was `custom` or `unknown`.

**Action:** Re-run intent classification with enriched input from discovery:
```bash
bash .opencode/skills/hivefiver-mode/scripts/classify-intent.sh "<compiled discovery answers>"
```

| Reclassified Intent | Route To |
|---------------------|---------|
| build_new | `/hivefiver-intake` (continue full_build pipeline) |
| extend | `/hivefiver-intake` (continue full_build pipeline) |
| fix_broken | `/hivefiver-doctor` (switch to doctor_fix pipeline) |
| audit_health | `/hivefiver-audit` (switch to audit_only pipeline) |
| improve | `/hivefiver-audit` (switch to audit_then_build pipeline) |
| still unknown | Stay in discovery, ask more targeted questions |

**Verification:** Reclassified intent has confidence ≥ medium.

### Step 11: State Update
**Action:**
```bash
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh add-completed discovery .
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-stage intake .
```

**Verification:** State updated, stage advanced.

### Step 12: Post-Turn Enforcement
**Action:**
```bash
bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh post-turn .
```

**Verification:** Post-turn evidence captured.

## Exit Criteria

- [ ] User profile detected (language, maturity, input_band, guidance)
- [ ] All question groups completed
- [ ] 8 structured output fields populated
- [ ] Promotion gate passed (0 critical, ≤1 minor unresolved)
- [ ] Pipeline state updated
- [ ] Post-turn enforcement ran

## Error Routing

| Error | Recovery |
|-------|----------|
| User gives up | Summarize what you have, offer minimum-viable discovery |
| Contradictory answers | Surface both, ask user to choose |
| Language switch mid-session | Auto-detect and adapt |
| Follow-up limit hit | Document as unresolved_minor, proceed |
| Gate fails | Stay in discovery, explain gaps |

## Offer Next

| Condition | Next Command |
|-----------|-------------|
| Promotion gate PASS (build_new/extend) | `/hivefiver-intake` |
| Promotion gate FAIL | `/hivefiver-discovery --continue` |
| Reclassified as fix_broken | `/hivefiver-doctor` |
| Reclassified as audit_health | `/hivefiver-audit` |
| Reclassified as improve | `/hivefiver-audit` |
| Reclassified as custom/unknown (route required) | `/hivefiver` |
| Learn journey: user satisfied | Pipeline END |
| Learn journey: user forms intent | Route to reclassified pipeline |
| User requests restart | `/hivefiver-start` |

## Output Format

Template reference: `.opencode/templates/hivefiver/stage-output-discovery.md`

```json
{
  "stage": "discovery",
  "status": "completed",
  "timestamp": "<ISO-8601>",
  "discovery_summary": {
    "problem_statement": "...",
    "primary_user_pain": "...",
    "in_scope": [],
    "out_of_scope": [],
    "non_negotiable_constraints": [],
    "acceptance_signals": [],
    "failure_modes": [],
    "verification_evidence": []
  },
  "user_profile": {
    "language": "en | vi | bilingual",
    "maturity": "L0 | L1 | L2 | L3",
    "input_band": "short | medium | long | wall_of_text",
    "guidance": "high | medium | low"
  },
  "unresolved_critical": 0,
  "unresolved_minor": 0,
  "brainstorm_output": {
    "selected_approach": "...",
    "alternatives_rejected": []
  },
  "reclassified_intent": "build_new | extend | fix_broken | audit_health | improve | learn | custom | null",
  "promotion_allowed": true,
  "state_updates": {
    "pipeline_active": true,
    "current_stage": "discovery",
    "completed_stages": ["start", "discovery"],
    "pipeline_target": "<target description>"
  },
  "next_command": "/hivefiver-intake | /hivefiver-doctor | /hivefiver-audit | /hivefiver",
  "gate_result": "passed | failed"
}
```
