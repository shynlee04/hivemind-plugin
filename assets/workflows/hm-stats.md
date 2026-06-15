<purpose>
Display comprehensive project statistics including phases, plans, requirements, git metrics, and timeline.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="gather_stats">
Gather project statistics:

```bash
# SDK resolution: prefer local hm-tools.cjs, fall back to global hm-sdk (#3668)
Hivemind_TOOLS="${RUNTIME_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}/hivemind/bin/hm-tools.cjs"
if [ -f "$Hivemind_TOOLS" ]; then
  Hivemind_SDK="node $Hivemind_TOOLS"
elif command -v hm-sdk >/dev/null 2>&1; then
  Hivemind_SDK="hm-sdk"
else
  echo "ERROR: hm-sdk not found on PATH and $Hivemind_TOOLS does not exist." >&2
  echo "Run: npx hivemind-cc@latest --claude --local" >&2
  exit 1
fi
STATS=$($Hivemind_SDK query stats.json)
if [[ "$STATS" == @file:* ]]; then STATS=$(cat "${STATS#@file:}"); fi
```

Extract fields from JSON: `milestone_version`, `milestone_name`, `phases`, `phases_completed`, `phases_total`, `total_plans`, `total_summaries`, `percent`, `plan_percent`, `requirements_total`, `requirements_complete`, `git_commits`, `git_first_commit_date`, `last_activity`.
</step>

<step name="present_stats">
Present to the user with this format:

```
# 📊 Project Statistics — {milestone_version} {milestone_name}

## Progress
[████████░░] X/Y phases (Z%)

## Plans
X/Y plans complete (Z%)

## Phases
| Phase | Name | Plans | Completed | Status |
|-------|------|-------|-----------|--------|
| ...   | ...  | ...   | ...       | ...    |

## Requirements
✅ X/Y requirements complete

## Git
- **Commits:** N
- **Started:** YYYY-MM-DD
- **Last activity:** YYYY-MM-DD

## Timeline
- **Project age:** N days
```

If no `.planning/` directory exists, inform the user to run `/hm-new-project` first.
</step>

<step name="mvp_summary">
**MVP phase summary.** Read all phases via `hm-sdk query roadmap.analyze` (Phase 1's `cmdRoadmapAnalyze` surfaces a `mode` field per phase). Count phases by mode:

```bash
ANALYZE=$($Hivemind_SDK query roadmap.analyze)
if [[ "$ANALYZE" == @file:* ]]; then ANALYZE=$(cat "${ANALYZE#@file:}"); fi
MVP_COUNT=$(echo "$ANALYZE" | jq '[.phases[] | select(.mode == "mvp")] | length')
TOTAL_COUNT=$(echo "$ANALYZE" | jq '.phases | length')
```

Emit a summary line in the stats output:

```
Phases: ${TOTAL_COUNT} total | ${MVP_COUNT} MVP | $((TOTAL_COUNT - MVP_COUNT)) standard
```

If `MVP_COUNT == 0`, the project has no MVP-mode phases — omit the line (no clutter for non-MVP projects).
</step>

</process>

<success_criteria>
- [ ] Statistics gathered from project state
- [ ] Results formatted clearly
- [ ] Displayed to user
</success_criteria>
