---
name: "entry-resolution"
description: "Use at every session start, after compaction, or after user pivots. Universal 6-step entry protocol with conditional routing: detect session state → resolve lineage → classify intent → assess clarity → route → gate. Embeds planning protocol, TDD gate, and spawning guard as innate references."
---

# Entry Resolution

**Core principle:** Resolve before you act. Know WHO you are, WHAT you're doing, and WHERE you are before starting.

## When to Use

- **Every session start** — mandatory
- After compaction (re-resolve to ensure continuity)
- After user pivots intent mid-session

## The Conditional Decision Tree

> This protocol is NOT a flat checklist. Each step's outcome determines which path to take next.

```
Session Start
    │
    ├─ STEP 1: Detect Session State ──────────────────────┐
    │                                                      │
    │   Fresh?        → Full protocol from Step 2          │
    │   Ongoing?      → Skip to Step 3 (lineage known)    │
    │   Recovery?     → Re-anchor from persisted state     │
    │                   THEN Step 2                        │
    │   Continuation? → Load handoff, verify, Step 3      │
    │   Separation?   → Full protocol from Step 2         │
    │                                                      │
    ├─ STEP 2: Resolve Lineage ───────────────────────────┐
    │                                                      │
    │   Framework-domain signals? → hivefiver              │
    │   Product-domain signals?   → hiveminder             │
    │   Unclear?                  → Ask ONE question       │
    │   Still unclear?            → Default cautious       │
    │                             + flag uncertainty        │
    │                                                      │
    ├─ STEP 3: Classify Intent ───────────────────────────┐
    │                                                      │
    │   ┌─ Framework-meta ──→ hivefiver confirmed          │
    │   ├─ Product impl   ──→ hiveminder confirmed         │
    │   ├─ Research       ──→ Current + research skills    │
    │   └─ Ambiguous      ──→ Clarify BEFORE routing       │
    │                                                      │
    │   CONDITIONAL LOAD based on classification:          │
    │   Complex intent?  → MANDATORY: read                 │
    │     references/planning-protocol.md                  │
    │   Delegation needed? → MANDATORY: read               │
    │     references/spawning-guard.md                     │
    │   First session or reassignment?  → MANDATORY: read  │
    │     references/persona-routing.md                    │
    │   Non-dev or cross-domain? → MANDATORY: read         │
    │     references/domain-routing.md                     │
    │                                                      │
    ├─ STEP 4: Assess Clarity ────────────────────────────┐
    │                                                      │
    │   Clear?          → Step 5                           │
    │   Mostly clear?   → Proceed, document assumptions    │
    │   Unclear?        → Ask ONE focused question         │
    │   Contradictory?  → Present contradiction to user    │
    │                                                      │
    │   Non-English input? → MANDATORY: read               │
    │     references/language-adaptation.md                 │
    │                                                      │
    │   HARD RULE: Never proceed with unclear intent.      │
    │   One question now saves 20 wasted turns.            │
    │                                                      │
    ├─ STEP 5: Route to Orchestrator ─────────────────────┐
    │                                                      │
    │   Lineage matches? → Proceed                         │
    │   Tools available? → Proceed                         │
    │   Mismatch?        → STOP: wrong-start-resolver      │
    │                                                      │
    └─ STEP 6: Gate Delegation Readiness ─────────────────┘
        │
        All gates below must pass before work begins:
        │
        1. [ ] Intent explicitly classified (not assumed)
        2. [ ] Lineage confirmed (not defaulted)
        3. [ ] Complexity assessed
        4. [ ] Session continuity checked
        5. [ ] Delegation packet ready (if delegating)
        6. [ ] Intelligence export planned (if delegating)
        │
        ANY gate fails → resolve before proceeding
        ALL gates pass → begin work
        │
        Before ANY completion claim → MANDATORY: read
          references/tdd-gate.md
```

## Session State Detection

| State | Signal | Entry Path |
|-------|--------|------------|
| **Fresh** | No prior state exists | Full protocol (Step 1→6) |
| **Ongoing (early)** | State exists, context fresh | Step 3 (lineage already known) |
| **Ongoing (late)** | State exists, context may be pruned | Re-anchor → Step 2 |
| **Recovery** | Post-compaction | Re-read persisted knowledge → Step 2 |
| **Continuation** | New session resuming previous work | Load handoff → Step 3 |
| **Separation** | New session, unrelated to previous | Full protocol (Step 1→6) |

## Lineage Resolution

| Check | hivefiver | hiveminder |
|-------|-----------|------------|
| Domain | Framework / meta assets | Product implementation |
| Signals | "add skill", "refactor agents", "update governance" | "fix bug", "add feature", "deploy" |
| Delegation pool | Framework subagents | Product subagents |

## Bundled References (Conditional Loading)

> [!IMPORTANT]
> These references are loaded CONDITIONALLY based on the protocol's routing decisions.
> Do NOT load all references at session start. Load only what the decision tree triggers.

| Reference | Trigger | Content |
|-----------|---------|---------|
| [planning-protocol.md](references/planning-protocol.md) | Intent classified as complex | Complexity classification, 5-step planning process |
| [tdd-gate.md](references/tdd-gate.md) | Any completion claim | Verification gate, RED-GREEN-REFACTOR checkpoint |
| [spawning-guard.md](references/spawning-guard.md) | Delegation needed | Pre-spawn checklist, execution model, packet schema |
| [persona-routing.md](references/persona-routing.md) | First session OR reassignment | 6-signal scoring, lane profiles, governance mode |
| [domain-routing.md](references/domain-routing.md) | Non-dev or cross-domain intent | Domain pack matrix, capability mapping |
| [language-adaptation.md](references/language-adaptation.md) | Non-English input detected | EN/VI bilingual rules, terminology preservation |

**Do NOT load** references for steps you've already resolved or that don't apply to the current session.

## Output Template

After completing the 6-step protocol, produce output using [templates/entry-resolution-output.md](templates/entry-resolution-output.md).

## Anti-Patterns

| Pattern | Problem |
|---------|---------|
| Skipping to Step 5 | Routing without lineage or intent = wrong-start |
| Auto-defaulting lineage | "I'll assume hivefiver" without checking = lineage confusion |
| Skipping clarity check | Acting on ambiguous intent = wasted turns |
| Gate-free delegation | Delegating before readiness confirmed = premature delegation |
| Loading all references upfront | Wastes context budget — load only what the tree triggers |
| Flat execution | Treating steps as a checklist instead of conditional tree |

## PLAN.md Protocol Anchor

This skill activates at **Step 1 (Expand)** — classifies scope, routes lineage, and determines which other governance skills will be needed for the cycle. For the full protocol-to-skill activation map, **see** [references/plan-protocol-map.md](references/plan-protocol-map.md).
