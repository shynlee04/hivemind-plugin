# Wave 11 Comparison Sheet: User Profiling & Feature Ecosystem Mapping

This document details the audit and comparison for Wave 11 agents (`hm-user-profiler` and `hm-ecologist`) against GSD equivalents or skills, highlighting the superior design choices implemented in the Hivemind versions.

---

## 1. hm-user-profiler vs gsd-user-profiler

| Compared Element | gsd-user-profiler | hm-user-profiler (Hivemind) | Superior Points in Hivemind |
|---|---|---|---|
| **Data Ingestion** | Reads session files using external commands or gets truncated JSONL. | Directly reads Hivemind-native `.hivemind/state/session-continuity.json` and session logs. | Seamlessly integrates with the active runtime control plane state. |
| **Heuristics & Rubric** | Scans messages based on external `references/user-profiling.md`. | Embeds the 8 behavioral dimensions, scoring metrics, and evidence formats directly within the profile context. | Fully self-contained context, preventing runtime fetching failures or drift. |
| **State Integration** | Writes JSON results inside XML tags parsed by orchestrator. | Programmatically updates `session-continuity.json` and logs a `"user_profile_updated"` event in `trajectory-ledger.json`. | Orchestrator receives telemetry changes directly in the shared continuity records. |
| **Data Sufficiency** | Strict questionnaire vs sample threshold rules. | Built-in rules for Full, Hybrid, and Insufficient data modes with recency weighting (3x multiplier). | Gracefully handles sparse session data while maintaining profile accuracy. |

### Upgrades applied to `hm-user-profiler`:
- Integrated recency weighting protocol (3x for last 30 days).
- Implemented thin data handling thresholds (Full, Hybrid, Insufficient).
- Added direct programmatic updates to `session-continuity.json` and `trajectory-ledger.json`.
- Conformed to 14+ section layout.

---

## 2. hm-ecologist vs hm-l2-ecologist (and general ecosystem tools)

| Compared Element | hm-ecologist (Original) | hm-ecologist (Refactored) | Superior Points in Hivemind |
|---|---|---|---|
| **Dependency Analysis** | Basic dependency listing. | Implements a robust directed acyclic graph (DAG) construction with explicit edge typing (HARD/SOFT/OPTIONAL). | Provides structural rigor in mapping dependencies instead of generic list items. |
| **Cycle Handling** | General notes on circular dependencies. | Explicit loop/cycle detection and DFS traversal mapping, generating cycle chains and resolution recommendations. | Detects circular bottlenecks before implementation tasks are generated. |
| **Delivery Sequencing** | Simple topological ordering. | Delivery Wave Protocol mapping out Wave 0 (zero dependencies), parallelizable components, and stable interface boundaries. | Guides developers to an optimized, parallel development path. |
| **State Integration** | Write-only report to Markdown. | Programmatically updates `.hivemind/state/session-continuity.json` and appends `"ecosystem_mapped"` event to `trajectory-ledger.json`. | Saves mapping metadata for subsequent planners or strategists to consume. |

### Upgrades applied to `hm-ecologist`:
- Upgraded to support edge typing (HARD/SOFT/OPTIONAL) with file:line evidence.
- Integrated DFS/BFS cycle detection rules.
- Implemented the Delivery Wave Protocol for parallel execution.
- Added programmatic state tracking to `session-continuity.json` and `trajectory-ledger.json`.
- Conformed to 14+ section layout.
