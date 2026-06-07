# Success Metrics: Defining and Measuring User Value

## Success Metrics: Purpose and Scope

Define falsifiable success metrics before implementation begins. A vague metric ("users will be happier") cannot validate whether a feature delivered value. This reference provides templates, counter-metric patterns, and measurement-window selection to ensure every feature ships with a validation contract.

## The Falsifiability Contract

Every success metric must be falsifiable — meaning it can be proven wrong. If you cannot define what failure looks like, you cannot measure success.

**Unfalsifiable → Falsifiable:**

| Unfalsifiable | Falsifiable |
|---|---|
| "The feature will improve performance" | "P95 API latency for endpoint X decreases from 850ms to under 400ms within 30 days of launch" |
| "Users will love it" | "Net Promoter Score for the affected workflow increases by ≥5 points within 60 days" |
| "This will reduce errors" | "Error rate on form submission decreases from 3.2% to under 1% within 14 days" |
| "It will be more intuitive" | "Task completion rate (users who start and finish) increases from 62% to ≥85% within 30 days" |
| "Better developer experience" | "Time to first successful API call decreases from 45 min to under 10 min, measured via onboarding analytics" |

## Metric Definition Template

For every feature that passes RICE threshold, fill in this template:

```markdown
### Success Metric: [Feature Name]

**Primary Metric:**
- **What:** [precise definition of what's measured]
- **Unit:** [%, ms, count, score, etc.]
- **Baseline:** [current value, source, time period]
- **Target:** [numeric target after launch]
- **Window:** [measurement period — 7d, 14d, 30d]
- **Source:** [analytics event, log query, survey, database query]

**Counter-Metric:**
- **What:** [metric that should NOT degrade]
- **Threshold:** [acceptable bound — must not exceed X, must not drop below Y]
- **Action if violated:** [pause, rollback, investigate]

**Minimum Detectable Effect:**
- **MDE:** [smallest change that would be statistically meaningful]
- **Sample size needed:** [users or events required for significance]

**Validation Gate:**
- **1-week check:** [early signal criteria]
- **30-day check:** [full measurement criteria]
- **If target not met:** [next action — extend, iterate, rollback]
```

### Example: Checkout Flow Redesign

```markdown
### Success Metric: Checkout Flow Redesign

**Primary Metric:**
- **What:** Time from cart page load to order confirmation
- **Unit:** Minutes
- **Baseline:** 4.2 min (analytics, last 30 days, P50)
- **Target:** <2.5 min (P50)
- **Window:** 30 days post-launch
- **Source:** Analytics event `checkout_complete` — duration from `cart_page_view` to `order_confirmed`

**Counter-Metric:**
- **What:** Cart abandonment rate
- **Threshold:** Must not increase by more than 2 percentage points (from 18% baseline)
- **Action if violated:** Pause checkout redesign rollout, investigate at what step abandonment increases

**Minimum Detectable Effect:**
- **MDE:** 0.3 min (given ~5,000 checkouts/month, 80% power)
- **Sample size needed:** ~2,000 checkouts (~2 weeks of data)

**Validation Gate:**
- **1-week check:** Is time trending downward? Is abandonment flat or decreasing?
- **30-day check:** Is P50 time <2.5 min? Is abandonment ≤ 20%?
- **If target not met:** Extend measurement to 45 days. If still not met, run usability study on the new flow.
```

## Counter-Metric Patterns

Every change that improves one dimension risks degrading another. Counter-metrics detect unintended harm.

### Common Counter-Metric Pairs

| Primary Metric (improving) | Counter-Metric (must not degrade) |
|---|---|
| Task completion speed | Error rate — faster completion shouldn't mean more mistakes |
| Feature adoption rate | Support ticket volume — new feature shouldn't generate confusion |
| Page load speed | Feature richness — don't strip functionality to gain speed |
| Conversion rate | Customer satisfaction — don't dark-pattern users into converting |
| API response time | Data freshness — don't serve stale cached data to hit latency targets |
| User engagement (time on page) | Task efficiency — more time might mean more confusion, not more value |
| Registration completions | Account quality — don't accept bots and throwaways to inflate numbers |
| Search result speed | Search result relevance — fast irrelevant results harm more than slow relevant ones |

### Counter-Metric Selection Rules

1. **Identify the user goal:** What is the user trying to accomplish?
2. **Identify what could go wrong:** How could this feature, even if it works perfectly, harm that goal?
3. **Choose a measurable proxy:** Pick a metric that would signal the harm.
4. **Set a threshold:** Define the unacceptable bound. "Decrease by more than X" or "increase by more than Y."
5. **Define the response:** What happens if the threshold is crossed? Pre-commit to the action.

## Measurement Window Selection

Different metrics mature at different rates. Choose the window based on the metric type:

| Metric Type | Recommended Window | Rationale |
|---|---|---|
| **Performance** (latency, load time) | 7-14 days | Stabilizes quickly; daily and weekly patterns capture typical usage |
| **Adoption** (new feature usage) | 14-30 days | Users need time to discover and form habits; novelty effects fade after ~2 weeks |
| **Behavior change** (workflow efficiency) | 30-60 days | Habit formation takes weeks; compare to baseline trend |
| **Satisfaction** (NPS, CSAT) | 60-90 days | Sentiment shifts slowly; need enough survey responses for statistical significance |
| **Business impact** (revenue, retention) | 90+ days | Macro metrics have many confounders; long window needed for signal |
| **Error/bug rate** | 7 days | Issues surface quickly; if stable for 7 days, likely stable longer term |

### Baseline Measurement Requirements

**Before launch, you must have:**

1. **A known baseline value** for the primary metric, measured over at least the same window as the post-launch period.
2. **The source of the baseline** documented (analytics dashboard, query, manual count).
3. **Baseline trend** — is the metric stable, improving, or degrading before your change? A metric that was already improving makes it harder to attribute gains to your feature.
4. **Seasonality check** — does the metric vary by day of week, time of month, or season? If so, compare post-launch to the same period.

**If no baseline exists:**
- Flag the feature as "No baseline — cannot validate success."
- Add instrumentation as the first deliverable.
- Run in measurement-only mode for one full window before declaring success.

## The Metric Hierarchy

Not all metrics are equal. Classify by their distance from user value:

```
Level 1: Direct User Value (lagging)
  └─ Task completion rate, error rate, NPS, time to value
     Most meaningful, slowest to change.

Level 2: Behavioral Proxy (leading)
  └─ Feature adoption, session duration, return rate, click-through
     Faster signal, requires interpretation.

Level 3: System Proxy (operational)
  └─ Page load time, API latency, uptime, error count
     Fastest signal, least connected to user value.
```

**Rule:** Every feature must have at least one Level 1 metric. Level 2 and 3 metrics are supporting evidence, not primary success criteria. "We improved latency" is not a user success metric unless you can show users accomplish their goal faster or more often.

## Handling Metric Failure

When post-launch metrics don't meet targets, follow this decision framework:

```
Did any counter-metric degrade?
  YES → Is the degradation severe enough to roll back?
    YES → Roll back. Re-evaluate the feature design.
    NO → Investigate root cause. Is it fixable within [window]?
      YES → Fix and extend measurement.
      NO → Accept the trade-off and document it.

Did the primary metric improve but miss the target?
  YES → Is the improvement directionally correct?
    YES → Extend measurement. The effect may be real but slower than expected.
    NO → The feature didn't improve things. Investigate:
      - Was the problem statement wrong?
      - Was the solution wrong for the problem?
      - Was the implementation flawed?

Did nothing change?
  YES → Feature had zero measurable impact on users.
    - Revisit the problem statement (Phase 1).
    - Revisit the impact estimate (Phase 2).
    - Consider whether the feature should be rolled back.
```

## Metric Anti-Patterns

| Anti-Pattern | Detection | Correction |
|---|---|---|
| **Vanity metrics** — tracking what's easy, not what matters | Metrics are all Level 3 (system proxy) | Add at least one Level 1 metric. "Latency improved" isn't enough — did users benefit? |
| **Metric shopping** — cherry-picking the one metric that improved | Only positive metrics reported, counter-metrics absent | Require counter-metrics. Every feature has trade-offs. Report them honestly. |
| **Window gaming** — choosing a window where the metric naturally looks better | Measurement window shorter than baseline period, or excludes known seasonal dip | Match window to baseline. Report full-period results, not just the best slice. |
| **Threshold absence** — "we'll know it when we see it" | No numeric target, just directional aspiration | Define a numeric target before launch. Directional improvement without magnitude isn't validation. |
| **Single-metric myopia** — optimizing one metric at all costs | Primary metric improves, counter-metrics all degrade | This is Goodhart's Law in action. Rebalance — the aggregate user experience matters more than any single metric. |
| **Instrumentation debt** — defining metrics you can't measure | Metric definition is precise but no instrumentation exists | Add instrumentation as part of the feature development. Don't ship with measurement promises you can't fulfill. |
