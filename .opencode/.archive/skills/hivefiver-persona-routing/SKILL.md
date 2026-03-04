---
name: hivefiver-persona-routing
description: "Route users into vibecoder, floppy_engineer, or enterprise_architect lanes using deterministic scoring with tie-break rules, strict governance defaults, and domain-aware onboarding."
---

# HiveFiver Persona Routing

Deterministic persona classification for HiveFiver onboarding and mid-session lane reassignment.

## When To Use

- **Onboarding**: first `/hivefiver init` or `/hivefiver-start` invocation.
- **Lane Reassignment**: when user intent shifts significantly mid-session (explicit request or detected signal drift beyond threshold).
- **Audit Recovery**: when `hivefiver-doctor` detects lane-context mismatch.

Do NOT re-run routing on every turn. Cache the resolved lane and only re-evaluate on explicit triggers above.

## Mode Router

This skill operates in three modes. Load only the sections relevant to the active mode.

| Mode | Trigger | Sections to Load |
|------|---------|------------------|
| `classify` | New user or first session | Signal Collection → Scoring → Resolution → Persistence |
| `reassign` | User requests lane change or signal drift detected | Signal Collection → Scoring → Resolution → Persistence |
| `inspect` | Audit or debugging | Resolution → Outputs (read-only, no persistence) |

## Signal Collection

Collect exactly these 6 signals. Each signal maps to one dimension scored 0–2.

| # | Signal | Collection Method | Scoring |
|---|--------|-------------------|---------|
| S1 | Technical depth | MCQ: "How would you describe your technical background?" | 0 = non-technical, 1 = some experience, 2 = professional engineer |
| S2 | Project scale | MCQ: "What's the scope of what you're building?" | 0 = personal/hobby, 1 = team/startup, 2 = enterprise/regulated |
| S3 | Process preference | MCQ: "How do you prefer to work?" | 0 = show me examples, 1 = give me structure, 2 = give me compliance gates |
| S4 | Risk tolerance | MCQ: "How do you feel about moving fast vs being thorough?" | 0 = speed first, 1 = balanced, 2 = thoroughness first |
| S5 | Domain type | MCQ: "What domain is this project in?" | Maps to domain_lane (not scored numerically) |
| S6 | Prior artifacts | Automated: check `.hivemind/` and `.opencode/` for existing specs, plans, configs | 0 = none, 1 = partial, 2 = substantial |

### MCQ Presentation Rules

- Present one question at a time (progressive disclosure).
- Each question has exactly 3 options corresponding to scores 0, 1, 2.
- Allow "Type your own answer" for S5 (domain) only.
- If user skips a question, assign score 1 (neutral) and flag as `inferred`.

## Scoring Algorithm

### Step 1: Compute Composite Score

```
composite = S1 + S2 + S3 + S4 + S6
```

Range: 0–10 (5 signals × max 2 each).

### Step 2: Map to Lane

| Composite Range | Resolved Lane |
|----------------|---------------|
| 0–3 | `vibecoder` |
| 4–6 | `floppy_engineer` |
| 7–10 | `enterprise_architect` |

### Step 3: Tie-Break Rules

When composite falls on a boundary (3 or 7), apply these tie-breakers in order:

1. **S2 (Project Scale) wins**: If S2 = 2, promote to higher lane. If S2 = 0, demote to lower lane.
2. **S4 (Risk Tolerance) wins**: If S2 doesn't resolve, use S4 with same logic.
3. **S3 (Process Preference) wins**: If still tied, use S3.
4. **Default to lower lane**: If all tie-breakers are neutral (score = 1), assign the lower lane. Rationale: easier to promote than to overwhelm.

### Step 4: Confidence Assessment

| Condition | Confidence |
|-----------|------------|
| All 6 signals collected directly | `high` |
| 1–2 signals inferred (skipped) | `medium` |
| 3+ signals inferred | `low` — emit warning, suggest re-intake |

## Domain Lane Resolution

S5 maps to domain_lane independently of persona scoring:

| User Response | Resolved Domain Lane |
|--------------|---------------------|
| Software, app, API, code, developer tool | `dev` |
| Marketing, content, brand, campaign | `marketing` |
| Finance, accounting, budget, invoice | `finance` |
| Operations, office, HR, admin, process | `office-ops` |
| Mixed or unclear | `hybrid` |

If domain cannot be resolved from user input, set `domain_lane: "hybrid"` and flag as `inferred`.

## Lane Profiles

### `vibecoder`

- **Governance mode**: `assisted`
- **Workflow**: `hivefiver-vibecoder`
- **Interaction style**: examples-first, click-by-click flow, hidden TDD rails
- **Gate enforcement**: soft (warnings, not blocks)
- **Ambiguity handling**: resolve with sensible defaults, explain choices

### `floppy_engineer`

- **Governance mode**: `standard`
- **Workflow**: `hivefiver-floppy-engineer`
- **Interaction style**: structured chunks, coherence scoring, explicit ambiguity gates
- **Gate enforcement**: standard (blocks on high-risk only)
- **Ambiguity handling**: surface ambiguity, require resolution before proceeding

### `enterprise_architect`

- **Governance mode**: `strict`
- **Workflow**: `hivefiver-enterprise` or `hivefiver-enterprise-architect`
- **Interaction style**: compliance-first, evidence-first, hard risk blockades
- **Gate enforcement**: strict (blocks on any unresolved gate)
- **Ambiguity handling**: block until all ambiguity resolved with evidence

#### Enterprise Workflow Selector

When lane = `enterprise_architect`, select workflow by project characteristics:

| Condition | Workflow |
|-----------|----------|
| Regulatory/compliance requirements detected (S4=2 AND S2=2) | `hivefiver-enterprise-architect` |
| Enterprise scale without hard regulatory requirements | `hivefiver-enterprise` |

## Required Outputs

Every routing invocation must return this exact shape:

```yaml
persona_routing_result:
  persona_lane: "vibecoder" | "floppy_engineer" | "enterprise_architect"
  domain_lane: "dev" | "marketing" | "finance" | "office-ops" | "hybrid"
  workflow_lane: "<resolved workflow name>"
  governance_mode: "assisted" | "standard" | "strict"
  confidence: "high" | "medium" | "low"
  signals:
    S1: { score: 0-2, method: "direct" | "inferred" }
    S2: { score: 0-2, method: "direct" | "inferred" }
    S3: { score: 0-2, method: "direct" | "inferred" }
    S4: { score: 0-2, method: "direct" | "inferred" }
    S5: { value: "<domain string>", method: "direct" | "inferred" }
    S6: { score: 0-2, method: "automated" }
  composite_score: 0-10
  tie_break_applied: null | "S2" | "S4" | "S3" | "default_lower"
  next_action: "<next command to invoke>"
```

## Lane Reassignment Protocol

1. Detect drift signal: user explicitly asks to change lane, OR 3+ consecutive interactions show behavior mismatched to current lane governance level.
2. Re-run signal collection (mode: `reassign`). Pre-fill S6 from current session state.
3. Compare new lane to current lane.
4. If different: emit lane change notice with rationale, update persisted lane, adjust workflow.
5. If same: confirm current lane, no workflow change.

## Anti-Patterns

| Anti-Pattern | Prevention |
|-------------|------------|
| Re-routing every turn | Cache result; only re-evaluate on explicit triggers |
| Skipping MCQ and guessing lane | Require at least S1, S2, S3 direct signals for `high` confidence |
| Promoting without evidence | Tie-break always falls to lower lane when signals are neutral |
| Ignoring domain lane | Domain lane affects workflow tool selection, never skip |

## References

- `references/persona-matrix.md` — detailed persona characteristics and edge cases
- `templates/intake-questionnaire.md` — MCQ question templates
- `scripts/score-persona.sh` — automated S6 artifact detection
