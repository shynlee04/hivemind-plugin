---
name: "hivemind-dashboard"
description: "Launch the HiveMind TUI dashboard for live monitoring of session state, hierarchy, and metrics."
---

# HiveMind Dashboard

Launch the interactive Terminal User Interface (TUI) dashboard.

## Usage

```bash
hivemind dashboard [options]
```

## Options

*   --lang <en|vietnamese>: Set initial language (default: en).
*   --refresh <seconds>: Set refresh interval in seconds (default: 2).

## Features

*   **Telemetry Header**: Live monitoring of Drift, Turns, and Session Mode.
*   **Trajectory Pane**: Active session details and hierarchy structure.
*   **Navigation Tabs**: Switch between 5 views using [1-5] keys or [Tab].
    1.  Main (Trajectory + Logs)
    2.  Swarm Orchestrator (TODO)
    3.  Time Travel Debugger (TODO)
    4.  Tool Registry (TODO)
    5.  Settings
*   **Interactive Controls**:
    *   `[L]`: Toggle Language (EN/VIETNAMESE)
    *   `[R]`: Manual Refresh
    *   `[Q]`: Quit

## Migration Note

This implementation uses `ink` and `react` on Node.js as a compatibility layer.
The target architecture is `@opentui/core` on Bun (US-032).
