# R1: Fix Measurement — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace naive dirty_score (5 binary checks, max 55, false-negative rate ~100%) with a 12-signal multi-dimensional health vector that detects semantic drift, plan adherence, and temporal degradation.

**Architecture:** 12 independent signal scripts, each scoring 0-100, combined via configurable weight vector into composite health. Temporal analysis tracks velocity and recovery rate. Persisted to `.hivemind/state/health-metrics.json`. Replaces `gx-mid-guard.sh` and `computeDrift()` in `context-injection.ts`.

**Tech Stack:** Bash (signal scripts), jq (JSON processing), TypeScript (plugin integration)

**Requirement Traceability:**
- CR-13: Multi-signal health vector
- CR-03: Level-aware relational staleness
- CR-14: L2 every turn, L3 per 3 tool calls
- CR-19: Relational staleness model
- CR-11: Flag degraded chains (S12)
- CR-04: Command output proof

**Depends On:** Nothing (R1 is the foundation)

---

## Task R1-01: Health Metrics Schema + State File

**CRs:** CR-13, CR-06

**Files:**
- Create: `.opencode/skills/gx-context-engine/references/health-metrics-schema.md`
- Create: `.hivemind/state/health-metrics.json` (initial empty state)

**Step 1: Design the schema**

Write the schema reference document defining:

```json
{
  "$schema": "gx-health-metrics-v1",
  "version": 1,
  "computed_at": 1709337600,
  "turn_number": 5,
  "agent_level": 2,
  "task_type": "implementation",
  "signals": {
    "plan_adherence":        { "score": 0, "velocity": 0, "samples": 0 },
    "hierarchy_freshness":   { "score": 0, "velocity": 0, "last_update_turn": 0 },
    "decision_velocity":     { "score": 0, "velocity": 0, "decisions_count": 0 },
    "todo_progression":      { "score": 0, "velocity": 0, "completed_last_5": 0 },
    "context_saturation":    { "score": 0, "velocity": 0, "estimated_tokens": 0 },
    "hard_stop_compliance":  { "score": 0, "velocity": 0, "respected": true },
    "delegation_efficiency": { "score": 0, "velocity": 0, "useful_ratio": 0 },
    "scope_proximity":       { "score": 0, "velocity": 0, "near_misses": 0 },
    "domain_continuity":     { "score": 0, "velocity": 0, "alignment_pct": 0 },
    "evidence_quality":      { "score": 0, "velocity": 0, "with_proof_pct": 0 },
    "turn_normalized":       { "score": 0, "velocity": 0, "position_pct": 0 },
    "chain_integrity":       { "score": 0, "velocity": 0, "operational": 0, "total": 0 }
  },
  "composite": {
    "score": 0,
    "status": "healthy",
    "weights": {
      "plan_adherence": 15,
      "hierarchy_freshness": 15,
      "decision_velocity": 10,
      "todo_progression": 10,
      "context_saturation": 10,
      "hard_stop_compliance": 5,
      "delegation_efficiency": 5,
      "scope_proximity": 5,
      "domain_continuity": 10,
      "evidence_quality": 5,
      "turn_normalized": 5,
      "chain_integrity": 5
    }
  },
  "history": [],
  "thresholds": {
    "healthy": { "min": 70 },
    "warning": { "min": 40, "max": 69 },
    "critical": { "max": 39 },
    "hard_block": { "signals": ["plan_adherence", "hierarchy_freshness"], "below": 20 }
  }
}
```

**Step 2: Write initial state file**

Create `.hivemind/state/health-metrics.json` with all signals at 100 (fresh session = healthy).

**Step 3: Verify**

Run: `jq '.' .hivemind/state/health-metrics.json`
Expected: Valid JSON, all 12 signal keys present, all scores = 100

**Acceptance Criteria:**
- [ ] Schema document exists with all 12 signals defined
- [ ] State file is valid JSON (`jq '.' exits 0`)
- [ ] All 12 signal keys present in `signals` object
- [ ] Composite weights sum to 100
- [ ] Thresholds defined for healthy/warning/critical/hard_block
- [ ] `hard_block.signals` includes plan_adherence and hierarchy_freshness (CR-01)

---

## Task R1-02: Signal — Plan Adherence (S1)

**CRs:** CR-13 (S1), CR-01 (hard block source)

**Files:**
- Create: `.opencode/skills/gx-context-engine/scripts/signals/gx-signal-plan-adherence.sh`

**Step 1: Write the signal script**

```bash
#!/usr/bin/env bash
# gx-signal-plan-adherence.sh — S1: Plan Adherence
# Score: % of recent tool calls whose paths fall within the current hierarchy node's scope
#
# Inputs: enforcement.json (tool call log), hierarchy.json (current node scope)
# Output: JSON { "signal": "plan_adherence", "score": 0-100, "detail": {...} }

set -euo pipefail

WORKDIR="${1:-.}"

# Pre-flight: jq required
if ! command -v jq >/dev/null 2>&1; then
  echo '{"signal":"plan_adherence","score":0,"error":"jq not installed"}'
  exit 0
fi

STATE_DIR="$WORKDIR/.hivemind/state"
ENFORCEMENT="$STATE_DIR/enforcement.json"
HIERARCHY="$STATE_DIR/hierarchy.json"
PROFILE="$STATE_DIR/runtime-profile.json"

# Default: if no data, score 100 (benefit of doubt on first turn)
if [ ! -f "$ENFORCEMENT" ] || [ ! -f "$HIERARCHY" ]; then
  echo '{"signal":"plan_adherence","score":100,"detail":{"reason":"no_data","tool_calls":0}}'
  exit 0
fi

# Get current node scope from profile (dynamic per-task scope)
SCOPE_PATHS=$(jq -r '.capabilities.paths // [".opencode/**",".hivemind/**"] | join("|")' "$PROFILE" 2>/dev/null || echo ".opencode/**|.hivemind/**")

# Count recent tool calls and how many match scope
# enforcement.json tracks scopeViolations — inverse of adherence
TOTAL_TURNS=$(jq -r '.turnCount // 1' "$ENFORCEMENT")
VIOLATIONS=$(jq -r '.scopeViolations | length // 0' "$ENFORCEMENT")

if [ "$TOTAL_TURNS" -eq 0 ]; then
  SCORE=100
else
  # Adherence = 1 - (violations / turns) * 100, clamped to 0-100
  ADHERENCE=$(echo "scale=0; 100 - ($VIOLATIONS * 100 / $TOTAL_TURNS)" | bc 2>/dev/null || echo "100")
  SCORE=$(( ADHERENCE > 100 ? 100 : (ADHERENCE < 0 ? 0 : ADHERENCE) ))
fi

jq -n \
  --arg signal "plan_adherence" \
  --argjson score "$SCORE" \
  --argjson total_turns "$TOTAL_TURNS" \
  --argjson violations "$VIOLATIONS" \
  --arg scope "$SCOPE_PATHS" \
  '{
    signal: $signal,
    score: $score,
    detail: {
      total_turns: $total_turns,
      violations: $violations,
      scope: $scope,
      formula: "100 - (violations/turns * 100)"
    }
  }'
```

**Step 2: Make executable**

Run: `chmod +x .opencode/skills/gx-context-engine/scripts/signals/gx-signal-plan-adherence.sh`

**Step 3: Verify**

Run: `bash .opencode/skills/gx-context-engine/scripts/signals/gx-signal-plan-adherence.sh .`
Expected: Valid JSON with `signal: "plan_adherence"`, `score: 0-100`

Run: `bash .opencode/skills/gx-context-engine/scripts/signals/gx-signal-plan-adherence.sh . | jq '.score >= 0 and .score <= 100'`
Expected: `true`

**Acceptance Criteria:**
- [ ] Script exists and is executable
- [ ] Pre-flight check for `jq` (exits gracefully if missing)
- [ ] Handles missing state files (returns score 100 with reason "no_data")
- [ ] Output is valid JSON with `signal`, `score`, `detail` fields
- [ ] Score is 0-100 range
- [ ] Formula documented in output JSON

---

## Task R1-03: Signal — Hierarchy Freshness (S2)

**CRs:** CR-13 (S2), CR-03, CR-14 (L2 every turn)

**Files:**
- Create: `.opencode/skills/gx-context-engine/scripts/signals/gx-signal-hierarchy-freshness.sh`

**Step 1: Write the signal script**

Logic:
- Read hierarchy.json mtime (last modified timestamp)
- Compare with current turn number from enforcement.json
- Score 100 = updated this turn, decays 10 points per turn without update
- L2 agents: decay rate is 10/turn (strict)
- L3 agents: decay rate is 5/turn (looser, checked less often)
- Stale (score < 20) = HARD BLOCK trigger for L2

```bash
#!/usr/bin/env bash
# gx-signal-hierarchy-freshness.sh — S2: Hierarchy Freshness
set -euo pipefail
WORKDIR="${1:-.}"
AGENT_LEVEL="${2:-2}"

if ! command -v jq >/dev/null 2>&1; then
  echo '{"signal":"hierarchy_freshness","score":0,"error":"jq not installed"}'
  exit 0
fi

STATE_DIR="$WORKDIR/.hivemind/state"
HIERARCHY="$STATE_DIR/hierarchy.json"
ENFORCEMENT="$STATE_DIR/enforcement.json"

if [ ! -f "$HIERARCHY" ]; then
  echo '{"signal":"hierarchy_freshness","score":0,"detail":{"reason":"no_hierarchy_file"}}'
  exit 0
fi

# Get hierarchy file mtime as epoch
HIER_MTIME=$(stat -f %m "$HIERARCHY" 2>/dev/null || stat -c %Y "$HIERARCHY" 2>/dev/null || echo "0")
NOW=$(date +%s)
AGE_SECONDS=$(( NOW - HIER_MTIME ))

# Get turn count
TURN_COUNT=$(jq -r '.turnCount // 0' "$ENFORCEMENT" 2>/dev/null || echo "0")

# Decay rate based on agent level
if [ "$AGENT_LEVEL" -le 2 ]; then
  DECAY_PER_MINUTE=10
else
  DECAY_PER_MINUTE=5
fi

# Score: 100 - (age_minutes * decay_rate), clamped 0-100
AGE_MINUTES=$(( AGE_SECONDS / 60 ))
SCORE=$(( 100 - (AGE_MINUTES * DECAY_PER_MINUTE) ))
SCORE=$(( SCORE > 100 ? 100 : (SCORE < 0 ? 0 : SCORE) ))

jq -n \
  --arg signal "hierarchy_freshness" \
  --argjson score "$SCORE" \
  --argjson age_seconds "$AGE_SECONDS" \
  --argjson agent_level "$AGENT_LEVEL" \
  --argjson decay_rate "$DECAY_PER_MINUTE" \
  --argjson turn_count "$TURN_COUNT" \
  '{
    signal: $signal,
    score: $score,
    detail: {
      age_seconds: $age_seconds,
      agent_level: $agent_level,
      decay_per_minute: $decay_rate,
      turn_count: $turn_count,
      formula: "100 - (age_minutes * decay_rate)"
    }
  }'
```

**Step 2: Make executable + verify**

Run: `chmod +x .opencode/skills/gx-context-engine/scripts/signals/gx-signal-hierarchy-freshness.sh`
Run: `bash .opencode/skills/gx-context-engine/scripts/signals/gx-signal-hierarchy-freshness.sh . 2 | jq '.'`
Expected: Valid JSON, score 0-100

**Acceptance Criteria:**
- [ ] Handles missing hierarchy.json (score = 0)
- [ ] Differentiates L2 (decay 10/min) vs L3 (decay 5/min) per CR-14
- [ ] Score decays with time since last hierarchy update
- [ ] Output includes age_seconds for debugging
- [ ] Pre-flight jq check

---

## Task R1-04 through R1-12: Remaining 10 Signals

**Same pattern as R1-02 and R1-03.** Each signal gets its own script in `scripts/signals/`. One script per signal:

| Task | Signal | File | Key Logic |
|------|--------|------|-----------|
| R1-04 | S3: Decision velocity | `gx-signal-decision-velocity.sh` | Count decisions.jsonl entries / turnCount |
| R1-05 | S4: TODO progression | `gx-signal-todo-progression.sh` | Completed tasks in last 5 turns / total |
| R1-06 | S5: Context saturation | `gx-signal-context-saturation.sh` | Estimated tokens from messages count |
| R1-07 | S6: HARD STOP compliance | `gx-signal-hard-stop.sh` | Is HARD STOP present AND respected? |
| R1-08 | S7: Delegation efficiency | `gx-signal-delegation-efficiency.sh` | Completions / delegations ratio |
| R1-09 | S8: Scope proximity | `gx-signal-scope-proximity.sh` | Near-miss count (close to boundary) |
| R1-10 | S9: Domain continuity | `gx-signal-domain-continuity.sh` | Tool domains matching intent |
| R1-11 | S10: Evidence quality | `gx-signal-evidence-quality.sh` | % completions with evidence field |
| R1-12 | S11: Turn normalized | `gx-signal-turn-normalized.sh` | Position in expected session lifecycle |

Each follows the contract:
- Pre-flight `jq` check
- Graceful degradation on missing files
- Output: `{"signal": "name", "score": 0-100, "detail": {...}}`
- Score formula documented in output

---

## Task R1-13: Signal — Chain Integrity (S12)

**CRs:** CR-13 (S12), CR-11 (flag degraded)

**Files:**
- Create: `.opencode/skills/gx-context-engine/scripts/signals/gx-signal-chain-integrity.sh`

**Key Logic:**
- Scan SKILL.md for chain definitions
- For each chain: check if referenced script is a stub or full implementation
- Score = (operational_chains / total_chains) * 100
- Output includes per-chain status: `"chain_1": "operational"`, `"chain_3": "DEGRADED"`

**This is what makes stubs VISIBLE in monitoring** per CR-11.

**Acceptance Criteria:**
- [ ] Reports DEGRADED (not healthy) for stub chains
- [ ] Score reflects actual chain operability
- [ ] Per-chain status in detail output

---

## Task R1-14: Signal Combinator Script

**CRs:** CR-13 (composite), CR-03 (staleness from signals)

**Files:**
- Create: `.opencode/skills/gx-context-engine/scripts/gx-health-compute.sh`

**Logic:**
1. Run ALL 12 signal scripts
2. Collect scores into the health vector
3. Compute temporal velocity for each signal (compare with previous `health-metrics.json`)
4. Compute composite weighted score
5. Determine status: healthy/warning/critical
6. Check hard_block signals (plan_adherence, hierarchy_freshness < 20)
7. Write updated `health-metrics.json`
8. Output JSON summary

```bash
#!/usr/bin/env bash
# gx-health-compute.sh — Run all 12 signals, combine, persist
set -euo pipefail
WORKDIR="${1:-.}"
AGENT_LEVEL="${2:-2}"
SIGNALS_DIR="$WORKDIR/.opencode/skills/gx-context-engine/scripts/signals"
METRICS_FILE="$WORKDIR/.hivemind/state/health-metrics.json"

# Run each signal, collect scores
RESULTS='{}'
for script in "$SIGNALS_DIR"/gx-signal-*.sh; do
  OUTPUT=$(bash "$script" "$WORKDIR" "$AGENT_LEVEL" 2>/dev/null || echo '{"signal":"unknown","score":50}')
  SIGNAL=$(echo "$OUTPUT" | jq -r '.signal')
  SCORE=$(echo "$OUTPUT" | jq -r '.score')
  RESULTS=$(echo "$RESULTS" | jq --arg sig "$SIGNAL" --argjson score "$SCORE" --argjson detail "$OUTPUT" \
    '. + {($sig): {score: $score, detail: $detail}}')
done

# Compute composite (read weights from existing metrics or use defaults)
# ... (weighted sum computation)
# Write to METRICS_FILE
# Output summary
```

**Acceptance Criteria:**
- [ ] Runs all 12 signal scripts
- [ ] Handles individual signal failures gracefully (uses score 50 as default)
- [ ] Computes weighted composite
- [ ] Computes velocity (diff from previous run)
- [ ] Detects hard_block condition
- [ ] Writes to health-metrics.json atomically
- [ ] Output includes per-signal scores AND composite

---

## Task R1-15: Replace gx-mid-guard.sh

**CRs:** CR-13 (replaces naive score)

**Files:**
- Modify: `.opencode/skills/gx-context-engine/scripts/gx-mid-guard.sh`

**Change:** Replace the 4-counter dirty_score with a call to `gx-health-compute.sh`. Mid-guard becomes a thin wrapper:

```bash
# NEW: delegate to health compute
HEALTH=$(bash "$SIGNALS_DIR/../gx-health-compute.sh" "$WORKDIR" "$AGENT_LEVEL")
COMPOSITE=$(echo "$HEALTH" | jq '.composite.score')
STATUS=$(echo "$HEALTH" | jq -r '.composite.status')
# ... format output to match existing consumers
```

**Acceptance Criteria:**
- [ ] Old dirty_score logic fully replaced
- [ ] All existing consumers (context-injection.ts, gx-steer.md, gx-recover.md) continue to work
- [ ] New output includes all 12 signal scores
- [ ] SPEC-vs-impl mismatch fixed (no more undocumented "drift < 40 → 30 points")

---

## Task R1-16: Replace computeDrift() in context-injection.ts

**CRs:** CR-13 (plugin integration)

**Files:**
- Modify: `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`

**Change:** Replace `computeDrift()` (lines 140-149) with a file read from `health-metrics.json`:

```typescript
function loadHealthMetrics(worktree: string): HealthMetrics | null {
  return loadJson<HealthMetrics>(worktree, ".hivemind/state/health-metrics.json")
}
// In the hook: read composite score instead of computing inline
const health = loadHealthMetrics(state)
const drift = health?.composite.score ?? 100
```

**Acceptance Criteria:**
- [ ] `computeDrift()` function removed
- [ ] Health metrics loaded from file (single source of truth)
- [ ] Context injection shows per-signal breakdown (not just one number)
- [ ] TypeScript compiles: `npx tsc --noEmit .opencode/plugins/hiveops-governance/hooks/context-injection.ts`

---

## Task R1-17: Integration Verification

**CRs:** CR-04 (evidence), CR-16 (user approval)

**Verification script:**

```bash
#!/usr/bin/env bash
# Verify R1: all signals work, combinator works, consumers updated
echo "=== R1 Integration Verification ==="

echo "--- Signal Scripts ---"
for s in .opencode/skills/gx-context-engine/scripts/signals/gx-signal-*.sh; do
  NAME=$(basename "$s")
  OUTPUT=$(bash "$s" . 2 2>/dev/null)
  SCORE=$(echo "$OUTPUT" | jq -r '.score // "FAIL"')
  echo "  $NAME: score=$SCORE"
done

echo "--- Health Compute ---"
bash .opencode/skills/gx-context-engine/scripts/gx-health-compute.sh . 2 | jq '{composite: .composite, signal_count: (.signals | length)}'

echo "--- Mid-Guard (new) ---"
bash .opencode/skills/gx-context-engine/scripts/gx-mid-guard.sh . | jq '{status: .status, score: .composite_score}'

echo "--- TypeScript ---"
npx tsc --noEmit .opencode/plugins/hiveops-governance/hooks/context-injection.ts 2>&1
echo "Exit: $?"

echo "=== R1 Verification Complete ==="
```

**Acceptance Criteria (Phase Gate):**
- [ ] All 12 signal scripts produce valid JSON with score 0-100
- [ ] Health combinator produces composite score
- [ ] Mid-guard uses new health model (not old dirty_score)
- [ ] context-injection.ts reads from health-metrics.json
- [ ] TypeScript compiles clean
- [ ] Command output evidence presented to user
- [ ] User explicitly approves R1 gate

---

## Summary: R1 Story Count

| Story | Title | Depends On |
|-------|-------|------------|
| R1-01 | Health metrics schema + state file | — |
| R1-02 | Signal: Plan adherence (S1) | R1-01 |
| R1-03 | Signal: Hierarchy freshness (S2) | R1-01 |
| R1-04 | Signal: Decision velocity (S3) | R1-01 |
| R1-05 | Signal: TODO progression (S4) | R1-01 |
| R1-06 | Signal: Context saturation (S5) | R1-01 |
| R1-07 | Signal: HARD STOP compliance (S6) | R1-01 |
| R1-08 | Signal: Delegation efficiency (S7) | R1-01 |
| R1-09 | Signal: Scope proximity (S8) | R1-01 |
| R1-10 | Signal: Domain continuity (S9) | R1-01 |
| R1-11 | Signal: Evidence quality (S10) | R1-01 |
| R1-12 | Signal: Turn normalized (S11) | R1-01 |
| R1-13 | Signal: Chain integrity (S12) | R1-01 |
| R1-14 | Signal combinator | R1-02 through R1-13 |
| R1-15 | Replace gx-mid-guard.sh | R1-14 |
| R1-16 | Replace computeDrift() | R1-14 |
| R1-17 | Integration verification | R1-15, R1-16 |
