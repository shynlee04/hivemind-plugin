# Persona Routing

**CONDITIONAL LOAD**: At entry-resolution Step 3, when session is first onboarding OR lane reassignment signal detected.

> Consolidated from the persona routing skill. Lineage-agnostic — works for both hivefiver and hiveminder sessions.

## When to Load

- **First session**: No prior lane assignment exists
- **Lane reassignment**: User explicitly requests change, OR 3+ consecutive interactions show behavior mismatched to current governance level
- **Audit recovery**: Session diagnostics detect lane-context mismatch

Do NOT re-run on every turn. Cache the resolved lane and only re-evaluate on explicit triggers.

## Signal Collection

Collect exactly 6 signals. Each maps to one dimension scored 0–2.

| # | Signal | Collection Method | Scoring |
|---|--------|-------------------|---------|
| S1 | Technical depth | MCQ: "How would you describe your technical background?" | 0 = non-technical, 1 = some experience, 2 = professional engineer |
| S2 | Project scale | MCQ: "What's the scope of what you're building?" | 0 = personal/hobby, 1 = team/startup, 2 = enterprise/regulated |
| S3 | Process preference | MCQ: "How do you prefer to work?" | 0 = show me examples, 1 = give me structure, 2 = give me compliance gates |
| S4 | Risk tolerance | MCQ: "How do you feel about moving fast vs being thorough?" | 0 = speed first, 1 = balanced, 2 = thoroughness first |
| S5 | Domain type | MCQ: "What domain is this project in?" | Maps to domain_lane (not scored numerically) |
| S6 | Prior artifacts | Automated: check project dirs for existing specs, plans, configs | 0 = none, 1 = partial, 2 = substantial |

### MCQ Rules

- Present ONE question at a time (progressive disclosure)
- Each question has exactly 3 options corresponding to scores 0, 1, 2
- Allow "Type your own answer" for S5 (domain) only
- If user skips a question, assign score 1 (neutral) and flag as `inferred`

## Scoring Algorithm

### Step 1: Compute Composite Score

```
composite = S1 + S2 + S3 + S4 + S6
```

Range: 0–10 (5 signals × max 2 each).

### Step 2: Map to Lane

| Composite Range | Resolved Lane | Governance Mode |
|----------------|---------------|-----------------|
| 0–3 | `vibecoder` | `assisted` — examples-first, soft gates |
| 4–6 | `floppy_engineer` | `standard` — structured, explicit ambiguity gates |
| 7–10 | `enterprise_architect` | `strict` — compliance-first, hard risk blockades |

### Step 3: Tie-Break Rules

When composite falls on a boundary (3 or 7):

1. **S2 (Project Scale) wins**: S2=2 → promote, S2=0 → demote
2. **S4 (Risk Tolerance) wins**: If S2 doesn't resolve, use S4
3. **S3 (Process Preference) wins**: If still tied, use S3
4. **Default to lower lane**: All neutral → assign lower (easier to promote than overwhelm)

### Step 4: Confidence Assessment

| Condition | Confidence |
|-----------|------------|
| All 6 signals collected directly | `high` |
| 1–2 signals inferred (skipped) | `medium` |
| 3+ signals inferred | `low` — suggest re-intake |

## Lane Profiles

### `vibecoder`
- Interaction: examples-first, click-by-click flow
- Gate enforcement: soft (warnings, not blocks)
- Ambiguity: resolve with sensible defaults, explain choices

### `floppy_engineer`
- Interaction: structured chunks, coherence scoring
- Gate enforcement: standard (blocks on high-risk only)
- Ambiguity: surface it, require resolution before proceeding

### `enterprise_architect`
- Interaction: compliance-first, evidence-first
- Gate enforcement: strict (blocks on ANY unresolved gate)
- Ambiguity: block until all resolved with evidence

## Required Output

```yaml
persona_routing_result:
  persona_lane: "vibecoder" | "floppy_engineer" | "enterprise_architect"
  domain_lane: "<from domain-routing.md>"
  governance_mode: "assisted" | "standard" | "strict"
  confidence: "high" | "medium" | "low"
  composite_score: 0-10
  tie_break_applied: null | "S2" | "S4" | "S3" | "default_lower"
```

## Lane Reassignment Protocol

1. Detect drift: explicit request OR 3+ mismatched interactions
2. Re-run signal collection; pre-fill S6 from current state
3. Compare new lane to current lane
4. If different: emit notice with rationale, update lane, adjust governance
5. If same: confirm, no change

## Anti-Patterns

| Pattern | Prevention |
|---------|------------|
| Re-routing every turn | Cache result; only on explicit triggers |
| Skipping MCQ and guessing | Require at least S1, S2, S3 direct for high confidence |
| Promoting without evidence | Tie-break defaults to lower lane |
| Ignoring domain lane | Domain affects tool selection — load domain-routing.md |
