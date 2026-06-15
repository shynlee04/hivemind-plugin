# Reference — Autonomous Loop Mechanics (Ralph-Loop)

This reference outlines the Ralph-Loop autonomous runtime cycle, pressure monitors, and completion budgets.

## Loop Lifecycle

The Ralph-Loop is a self-correcting feedback execution system that automates iterative cycles:

```
┌────────────────────────────────────────────────────────┐
│                      1. Plan                           │
│        Resolve plan criteria and build target list      │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                     2. Execute                         │
│        Perform edits and execute compiler test run     │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                     3. Validate                        │
│        Run L3 Quality Gates (Spec & Evidence)          │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             │ (FAIL)                    │ (PASS)
             ▼                           ▼
┌──────────────────────────┐    ┌────────────────────────┐
│     4. Debug & Fix       │    │     5. Phase Close     │
│  Triage errors & loop    │    │  Commit & Handover     │
└────────────┬─────────────┘    └────────────────────────┘
             │
             └───────────────────────────┘
```

## Running Budgets & Constraints

To prevent infinite loops during automated debugging, the Ralph-Loop enforces strict runtime boundaries:
- **Max Iterations**: Capped at 5 rounds by default. The loop terminates and escalates to the user if no progress is made.
- **Progress Verification**: Each iteration must demonstrate a reduction in compiler errors or failing tests; if error status remains static or worsens for 2 consecutive cycles, the loop stops.
- **Budget Thresholds**: Tracks cumulative API costs and token usage. Triggers a circuit breaker if costs cross preset limits.

## Pressure Monitoring

Hivemind constantly monitors system and model pressure:
- **Context Pressure**: Detects if context length exceeds 80% of context limits, triggering automatic log compaction.
- **Model Degradation**: Checks for repetitive output patterns or looping tool usage. Exits loop immediately if detected.
