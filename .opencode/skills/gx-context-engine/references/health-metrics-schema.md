# Health Metrics Schema — Reference Document

> **Version**: 1
> **Schema ID**: `gx-health-metrics-v1`
> **CR Traceability**: CR-13 (multi-signal vector), CR-06 (strict typed + versioned)
> **Location**: `.hivemind/state/health-metrics.json`

---

## Overview

The health metrics file is the **single source of truth** for agent context health. It replaces the naive `dirty_score` (5 binary checks, max 55, ~100% false-negative rate) with a 12-signal multi-dimensional health vector.

Each signal is independently scored 0-100. A configurable weight vector combines them into a composite score. Temporal analysis tracks velocity (is a signal improving or degrading?).

---

## Signal Definitions

| # | Signal Key | What It Measures | Score Logic | Weight |
|---|-----------|------------------|-------------|--------|
| S1 | `plan_adherence` | Are tool calls within current plan node scope? | `100 - (violations/turns * 100)` | 15 |
| S2 | `hierarchy_freshness` | How recently was hierarchy.json updated? | `100 - (age_minutes * decay_rate)`, L2=10/min, L3=5/min | 15 |
| S3 | `decision_velocity` | Are decisions being made at a healthy rate? | Normalized `decisions / turns` ratio | 10 |
| S4 | `todo_progression` | Are tasks being completed? | Moving average of completions per turn | 10 |
| S5 | `context_saturation` | How much context budget is consumed? | `100 - (turn_count / max_turns * 100)` | 10 |
| S6 | `hard_stop_compliance` | Is the HARD STOP item respected? | 100 if respected, 0 if violated | 5 |
| S7 | `delegation_efficiency` | Are delegations producing useful results? | `completions / delegations * 100` | 5 |
| S8 | `scope_proximity` | How close are actions to scope boundary? | `100 - (near_misses * 20)` | 5 |
| S9 | `domain_continuity` | Do tool calls match declared intent domain? | `% of actions consistent with intent` | 10 |
| S10 | `evidence_quality` | Are completions backed by evidence? | `(items_with_evidence / completed) * 100` | 5 |
| S11 | `turn_normalized` | Where in the session lifecycle are we? | `100 - (turn / expected_max * 100)` | 5 |
| S12 | `chain_integrity` | What % of skill chains are operational? | `(operational / total) * 100` | 5 |

**Weights sum to 100.**

---

## Composite Score

```
composite.score = sum(signal[i].score * weight[i]) / 100
```

### Status Thresholds

| Status | Composite Range | Action |
|--------|----------------|--------|
| `healthy` | >= 70 | Continue normally |
| `warning` | 40-69 | Inject governance reminder |
| `critical` | < 40 | Inject strong governance warning |
| `hard_block` | Any signal in `hard_block.signals` drops below 20 | BLOCK agent actions |

### Hard Block Signals (CR-01)

When **plan_adherence** or **hierarchy_freshness** drops below 20, the system BLOCKS all agent actions until the signal recovers. This is the enforcement mechanism for CR-01 (Hard Block on off-plan actions).

---

## Temporal Analysis

Each signal tracks:
- `score`: Current value (0-100)
- `velocity`: Rate of change from previous measurement (positive = improving, negative = degrading)

The `history` array stores previous composite snapshots for trend analysis.

---

## Schema Version Rules (CR-06)

- **Version 1**: Initial schema. All fields required.
- **Evolution**: Additive-only. New signals may be added. Existing signals MUST NOT be removed or renamed.
- **Unknown fields**: REJECTED (not silently ignored).
- **Migration**: If version changes, a migration script must exist.

---

## Per-Signal Script Contract

Every signal script in `scripts/signals/gx-signal-*.sh` MUST:

1. Accept `WORKDIR` as first argument (default `.`)
2. Accept `AGENT_LEVEL` as second argument (default `2`)
3. Pre-flight check for `jq` (exit gracefully with score 0 + error if missing)
4. Handle missing state files gracefully (return reasonable default, not crash)
5. Output valid JSON: `{"signal": "name", "score": 0-100, "detail": {...}}`
6. Include formula documentation in `detail` object
7. Exit code 0 always (errors reported in JSON, not exit codes)
