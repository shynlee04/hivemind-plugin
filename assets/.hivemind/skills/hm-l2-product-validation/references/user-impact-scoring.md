# User Impact Scoring: RICE and ICE Methodology

## Purpose

Quantify the user impact of features and technical decisions using structured scoring frameworks. This reference applies when prioritizing features, evaluating trade-offs, or deciding what to build next. The RICE framework provides a balanced score; ICE provides a rapid triage alternative.

## RICE Framework (Primary)

RICE = (Reach × Impact × Confidence) / Effort

Use RICE when you have reasonable estimates and need a defensible prioritization. It balances user value against implementation cost.

### Reach: How Many Users Benefit?

Scale: 1.0 – 10.0

| Score | Definition | Example |
|---|---|---|
| 10 | Every active user | Global navigation improvement, error-message clarity |
| 8 | Most users (80%+) | Core workflow change, primary feature enhancement |
| 6 | Majority (50%+) | Power-user workflow, commonly used feature |
| 4 | Significant minority (20-50%) | Admin panel, settings page, specialized tool |
| 2 | Small segment (5-20%) | Niche export format, advanced configuration |
| 1 | Edge cases (<5%) | Accessibility edge case, deprecated browser support |

**Scoring rules:**
- Use actual user counts when available. `Reach = min(10, (target_segment / total_active_users) × 10)`.
- If user counts are unknown, use percentage estimates and set Confidence ≤ 0.5.
- Reach measures *unique users affected*, not usage frequency. Frequency belongs in Impact.
- A feature that every user sees once scores lower than one that affects core daily workflow. Adjust: multiply by adoption likelihood.

### Impact: How Much Does User Experience Improve?

Scale: 0.25 – 3.0

| Score | Definition | Example |
|---|---|---|
| 3.0 | Massive — transforms daily workflow | Reduces core task time from 30 min to 5 min |
| 2.0 | High — significant improvement | Removes a multi-step workaround, saves 10 min/task |
| 1.0 | Medium — noticeable improvement | Adds a shortcut, reduces 3 clicks to 1 |
| 0.5 | Low — minor convenience | Cosmetic improvement, slightly better layout |
| 0.25 | Minimal — barely perceptible | Micro-optimization, text change |

**Impact dimensions to consider:**
- **Time saved:** How many minutes/hours per user per week?
- **Error reduction:** What percentage of errors does this prevent?
- **Satisfaction:** Does this address a top user complaint or request?
- **Completion rate:** Does this increase the percentage of users who finish a task?
- **Cognitive load:** Does this reduce decisions or steps required?

**Scoring rules:**
- Impact scores compound additive benefits. "Saves 5 min + eliminates error" → score higher.
- Impact is per-user benefit. Reach already accounts for user count — do not double-count.
- If you cannot articulate the specific user experience change, score ≤ 0.5.

### Confidence: How Sure Are We?

Scale: 0.2 – 1.0

| Score | Definition | Evidence Required |
|---|---|---|
| 1.0 | Measured | Analytics data, A/B test results, user research with statistical significance |
| 0.8 | High | Multiple qualitative sources, user interviews (5+), strong pattern evidence |
| 0.6 | Medium | One qualitative source, logical inference from similar features, team intuition with domain expertise |
| 0.4 | Low | Informed guess, no direct evidence but analogy to other products |
| 0.2 | Guess | Pure speculation, no evidence at all |

**Anti-inflation check:** If Confidence ≥ 0.8, attach the specific evidence source. "We know from analytics dashboard that..." or "5 of 7 interviewed users described this pain." Without evidence, cap Confidence at 0.5.

### Effort: How Much Work Required?

Scale: Person-weeks, then convert.

**Estimation tiers:**

| Tier | Weeks | Score (10/w) | Typical Scope |
|---|---|---|---|
| Trivial | 0.5 | >10 (cap at 10) | Config change, copy update |
| Tiny | 1 | 10 | Single component, simple endpoint |
| Small | 2 | 5 | Feature with 1-2 screens, basic CRUD |
| Medium | 4 | 2.5 | Multi-screen feature, integration work |
| Large | 8 | 1.25 | New module, data model changes |
| Very Large | 12 | 0.83 | Platform feature, cross-team dependency |
| Massive | 20+ | 0.5 (floor) | Multi-quarter initiative |

**Conversion formula:** `Effort_score = max(0.25, 10 / person_weeks)`

This inverts effort so higher effort produces a lower score, correctly penalizing expensive features.

**Estimation ground rules:**
- Use "T-shirt sizes" for rapid triage, then convert: S=2w, M=4w, L=8w, XL=12w.
- If effort cannot be estimated, score it as 1.0 (10 person-weeks) and flag for engineering validation.
- Include non-coding effort: design, testing, documentation, rollout, monitoring.

### Computing the RICE Score

```
RICE = (Reach × Impact × Confidence) / Person_Weeks
```

**Example calculations:**

| Feature | R | I | C | Wks | RICE | Note |
|---|---|---|---|---|---|---|
| Dark mode | 8 | 1.0 | 0.8 | 2 | 3.2 | High reach, moderate impact, well-validated |
| CSV export | 4 | 2.0 | 0.6 | 3 | 1.6 | Power-user feature, strong demand evidence |
| Admin dashboard redesign | 2 | 0.5 | 0.4 | 8 | 0.05 | Niche audience, low confidence |

**Interpretation thresholds:**

| RICE Score | Quadrant | Recommendation |
|---|---|---|
| >2.0 | Ship Now | High value, relatively low effort — build immediately |
| 1.0–2.0 | Invest | Worth the effort — schedule in next cycle |
| 0.3–1.0 | Low-Hanging | Do if spare capacity exists — otherwise defer |
| <0.3 | Kill | Does not justify the cost — do not build |

## ICE Framework (Rapid Triage)

ICE = (Impact × Confidence × Ease) / 3

Use ICE for rapid triage when precise effort estimates or user counts are unavailable. It's a lightweight alternative that scores on a 1-10 scale for each dimension.

### ICE Dimensions

| Dimension | Definition | Scale |
|---|---|---|
| **Impact** | How much does this improve the user's experience? | 1 (minimal) – 10 (game-changing) |
| **Confidence** | How sure are we about the impact estimate? | 1 (pure guess) – 10 (measured data proves it) |
| **Ease** | How easy is this to build and ship? | 1 (extremely hard) – 10 (trivial) |

### ICE vs. RICE: When to Use Which

| Situation | Use |
|---|---|
| Early-stage brainstorming, no user data | ICE |
| Multiple features across different teams | RICE |
| Single team's backlog prioritization | RICE |
| Pre-research, deciding what to investigate | ICE |
| Defensible prioritization for stakeholders | RICE |
| Rapid gut-check on a new idea | ICE |

### Conversion Between ICE and RICE

When moving from ICE triage to RICE prioritization:

- **Impact:** ICE 10 → RICE 3.0. ICE 7 → RICE 2.0. ICE 5 → RICE 1.0. ICE 3 → RICE 0.5. ICE 1 → RICE 0.25.
- **Confidence:** ICE 10 → RICE 1.0. ICE 7 → RICE 0.8. ICE 5 → RICE 0.6. ICE 3 → RICE 0.4. ICE 1 → RICE 0.2.
- **Ease:** ICE 10 → RICE 10/E score (0.5 weeks). ICE 1 → RICE 10/E score (20+ weeks). Invert: `E_weeks = 20 / ease_score`.

## Value–Effort Matrix

After scoring, plot features on a 2×2 to visualize the portfolio:

```
High Value (RICE > 1.0)
│
│  INVEST ZONE           │  SHIP NOW ZONE
│  These are worth       │  These are obvious
│  the effort —          │  wins — build
│  schedule and staff    │  immediately
│                         │
─────────────────────────┼──────────────────────────
│                         │
│  KILL ZONE             │  LOW-HANGING ZONE
│  Don't build these —   │  Do if there's
│  cost exceeds value    │  spare capacity
│                         │
└──────────────────────────────────────
                    Effort →

Low Value (RICE < 0.3)
```

**Decision rules for each quadrant:**

| Quadrant | Action | Example |
|---|---|---|
| **Ship Now** | Build in current cycle | RICE > 2.0 and effort < 4 weeks |
| **Invest** | Schedule in next 1-2 cycles | RICE > 1.0 but effort > 4 weeks — needs staffing |
| **Low-Hanging** | Opportunistic — do if idle | RICE 0.3-1.0 and effort < 2 weeks |
| **Kill** | Do not build | RICE < 0.3 or effort > 12 weeks with low confidence |

## Scoring Pitfalls

| Pitfall | Cause | Prevention |
|---|---|---|
| **Reach inflation** | Assuming "all users" without segment analysis | Require user demographic data or analytics query for Reach ≥ 8 |
| **Impact conflation** | Mixing business impact with user impact | Business metrics (revenue, retention) are separate. Impact measures user experience only. |
| **Confidence anchoring** | Scoring based on one vocal user's feedback | Require ≥ 3 independent data points for Confidence ≥ 0.8 |
| **Effort underestimation** | Developer optimism, ignoring testing/rollout | Multiply raw estimate by 1.5× to account for non-coding effort |
| **Score precision theater** | Computing RICE to 2 decimal places from guess-level inputs | Round to 1 decimal. Precision doesn't create accuracy. |
| **One-and-done scoring** | Scoring once at planning and never revisiting | Re-score after user research, prototyping, or initial user feedback. |

## Progressive RICE Application

Not every feature needs full RICE. Apply progressively:

1. **ICE triage:** Score all features with ICE to filter obvious Kill/Keep.
2. **RICE for survivors:** Full RICE scoring for features that pass ICE triage.
3. **Deep-dive for top contenders:** For features scoring RICE > 2.0, validate estimates with engineering and user research before committing.
