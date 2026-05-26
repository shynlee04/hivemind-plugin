# Needs vs. Wants: Surfacing Real Stakeholder Requirements

Stakeholders often express wants as needs. This reference provides the framework for distinguishing true needs from nice-to-haves, using the Five Whys method and structured classification.

## Core Distinction

| Dimension | Need | Want |
|---|---|---|
| **Definition** | A capability whose absence causes measurable harm (revenue loss, legal liability, safety risk, user abandonment) | A desired capability whose absence causes inconvenience but no measurable harm |
| **Test** | "What measurable consequence occurs if we don't build this?" | "What measurable consequence occurs if we don't build this?" |
| **Evidence** | Quantifiable impact with source | Preference or opinion |
| **Stakeholder reaction** | "We must have this or we cannot launch" | "It would be nice to have" |
| **Timeline** | Blocking milestone | Can be deferred |

**The Litmus Test:** If removing a requirement doesn't change any measurable business metric, it's a want.

## The Five Whys Method

For each requirement, ask "Why?" five times to drill from stated request to underlying need.

### Procedure

```
1. Stated requirement:
   "We need a real-time dashboard showing sales by region."

2. Why? → "So the VP of Sales can see performance at a glance."
   ↳ Surface: Who is the stakeholder? What decision do they make?

3. Why? → "Because they currently wait for weekly reports and miss opportunities."
   ↳ Surface: What is the current pain? What's the latency cost?

4. Why? → "Because the Midwest team lost a $500K deal last month due to slow pricing response."
   ↳ Surface: Is there a concrete negative consequence? Quantify it.

5. Why? → "Because competitor pricing changed mid-week and we didn't know until Friday."
   ↳ Surface: What's the root cause? Is the solution a dashboard or faster data?

6. Root need: "Regional managers need same-day awareness of competitor pricing changes 
   that affect deals above $100K."

   Original want: "Real-time dashboard with sales by region"
   Actual need: "Same-day competitor pricing intelligence for deals >$100K"
   
   The need could be met by: A dashboard, OR a daily alert email, OR a Slack notification, 
   OR an API integration with a pricing intelligence service.
```

### Five Whys Template

```
REQUIREMENT: [verbatim text]
─────────────────────────────────
Why 1 (what decision/pain does this address?):
Why 2 (what happens if we don't address it?):
Why 3 (what concrete negative consequence?):
Why 4 (what's the underlying cause?):
Why 5 (what's the root need?):
─────────────────────────────────
ROOT NEED: [distilled from Why 5]
ORIGINAL WANT: [the stated requirement]
ALTERNATIVE SOLUTIONS: [2-3 simpler ways to meet the root need]
─────────────────────────────────
CLASSIFICATION: NEED / WANT
JUSTIFICATION: [measurable harm if absent, or lack thereof]
```

## Classification Framework

### Level 1: Mission-Critical Need

**Characteristics:**
- Absence = system failure, legal liability, or safety incident
- Cannot launch without it
- Quantifiable damage if missing

**Examples:**
- "Authentication must validate credentials before granting access"
- "Payment system must comply with PCI-DSS"
- "Medical device must fail-safe on power loss"

**Treatment:** Must be in MVP. Non-negotiable. Use SHALL.

### Level 2: Core Functionality Need

**Characteristics:**
- Absence = product doesn't deliver its primary value proposition
- Users cannot complete the main workflow without it
- Competitors all have it

**Examples:**
- E-commerce: "Users must be able to add items to a cart"
- Analytics: "Dashboard must display time-series data"
- Messaging: "Users must be able to send messages"

**Treatment:** Must be in MVP. Scope may be reduced but capability must exist. Use SHALL.

### Level 3: Quality Need

**Characteristics:**
- Absence = degraded experience but core workflow still works
- Users can accomplish the task with friction
- Competitors have it but users tolerate its absence temporarily

**Examples:**
- "Search results should load within 200ms" (vs. 2 seconds)
- "Form should auto-save drafts" (vs. manual save)
- "Error messages should suggest remediation" (vs. generic "error occurred")

**Treatment:** Should be in MVP, but can be deferred to v1.1 if blocking. Use SHOULD.

### Level 4: Differentiator Want

**Characteristics:**
- Absence = no measurable user or business impact
- No competitor has it and users don't expect it
- It's someone's good idea but unvalidated

**Examples:**
- "Dark mode toggle with custom color palette"
- "Animated confetti on task completion"
- "Voice command input for search"

**Treatment:** Not in MVP. Validated with user research before commitment. Use MAY.

### Level 5: Distraction Want

**Characteristics:**
- Absence = no impact. Presence = added complexity with no user-facing benefit.
- Solution in search of a problem
- "Wouldn't it be cool if..."

**Examples:**
- "Blockchain-based audit trail" (for a system that doesn't need distributed trust)
- "AI-powered recommendation engine" (for a product catalog of 10 items)
- "Microservices architecture" (for a team of 2 building an internal tool)

**Treatment:** Reject. Flag as scope creep. Document as out-of-scope.

## Surfacing Techniques

### Technique 1: The Replacement Question

> "If we replaced this with [simpler alternative], what would break?"

If the answer is "nothing would break," it's a want. If "users couldn't complete their primary task," it's a need.

**Example:**
- Want: "Real-time dashboard with 15 visualizations"
- Replacement: "Daily email with the top 5 metrics"
- Question: "What would break?"
- Answer: "The VP already checks email. They just want the data sooner." → Want (the dashboard form factor is a want; the data latency reduction is a need).

### Technique 2: The Delay Question

> "If we shipped without this for 3 months, what measurable harm would occur?"

**Scoring:**
- "We would lose customers / be sued" → Need
- "Users would complain" → Level 3 Need or Level 4 Want (depends on complaint severity)
- "Stakeholder X would be unhappy" → Want (unless stakeholder X controls the budget)
- "Nothing, but it would be nice" → Want

### Technique 3: The Single-User Question

> "If we solved this for only ONE user persona, which one? And what's the minimum?"

This surfaces the 80/20 of needs — the 20% of functionality that serves 80% of value.

**Example:**
- Want: "Role-based dashboards for Admin, Manager, Viewer, and Guest"
- Single-User: "Who makes the most decisions from this data?" → Manager
- Minimum: "What 3 things does a Manager need to decide within 5 minutes of opening this?" → Current pipeline value, deals at risk, team quota progress

### Technique 4: The Competitor Test

> "Do our top 3 competitors have this? Did they have it at launch?"

If competitors didn't have it at launch and succeeded, it's likely a Level 4 Want for MVP.

## Needs-to-Wants Mapping Template

Use this table format in the gap report:

```
| Req ID | Stated Requirement | Why 1-5 Summary | Root Need | Classification | Alternative | Measurable Harm If Absent |
|---|---|---|---|---|---|---|
| REQ-07 | Real-time dashboard with 15 widgets | VP needs same-day awareness of regional performance | Same-day regional sales intelligence for deals >$100K | Level 3 — Quality Need | Daily email with top 5 KPIs | Deal response time >24hrs costs ~$500K/quarter in lost deals |
| REQ-12 | Dark mode with custom color palette | Designer preference | No user request or evidence | Level 4 — Differentiator Want | System dark mode (no customization) | None measurable |
| REQ-19 | Blockchain audit trail | CTO read a blog post | No trust-distribution requirement exists | Level 5 — Distraction Want | Standard database audit log | None — all parties trust central authority |
```

## Anti-Patterns

| Anti-Pattern | Signal | Correction |
|---|---|---|
| **Everything is a need** | 100% of requirements classified as Level 1-2 | Reclassify using the Delay Question. At least 20-30% of stated requirements are typically wants. |
| **Stakeholder identity as evidence** | "The VP said so" without measurable harm | Apply the Replacement Question. Authority doesn't make a want into a need. |
| **Featuritis** | Requirements that don't trace to any user workflow | Apply the Single-User Question. If no user persona's primary workflow breaks without it, it's a want. |
| **False urgency** | "We need this in MVP or we'll lose" without evidence | Ask: "Has a customer said they won't buy without this specific feature?" |
| **Tech-first requirements** | Implementation details dressed as user needs | Apply Five Whys to drill past the tech choice to the user need. |
| **Over-correction** | Classifying genuine needs as wants to reduce scope | If the Litmus Test (measurable harm if absent) shows actual harm, it's a need regardless of how complex it is. |
