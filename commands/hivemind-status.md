---
description: "Show current HiveMind governance state, session health, and recent activity."
---

# HiveMind Status Check

Show the user a comprehensive view of their HiveMind governance state.

## Actions
1. Call `scan_hierarchy` to get the current session state, hierarchy, metrics, and anchors
2. Call `list_shelves` to see what's in the Mems Brain
3. Read `.hivemind/config.json` to show current configuration
4. Call `check_drift` to verify alignment with declared trajectory

## Report Format
Present findings as a clean status report:

```
HiveMind Status
━━━━━━━━━━━━━━━━━━━━━━━━━━
Session: <id> | Mode: <mode> | Status: <OPEN/LOCKED>
Trajectory: <current trajectory>
  └─ Tactic: <current tactic>
       └─ Action: <current action>

Metrics
  Turns: <count> | Drift: <score>/100 | Health: <score>/100
  Files touched: <count>

Mems Brain
  <shelf counts>

Configuration
  Governance: <mode> | Language: <lang> | Automation: <level>
```
