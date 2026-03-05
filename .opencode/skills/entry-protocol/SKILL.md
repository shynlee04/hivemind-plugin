---
description: Universal entry protocol for ALL HiveMind agents
globs:
alwaysApply: true
---

# ⚠️ UNIVERSAL ENTRY PROTOCOL — ALL AGENTS MUST EXECUTE

This skill loads FIRST for every agent. Execute immediately.

## STEP 1: Detect State

```bash
./scripts/detect-entry.sh
```

Parse output:
- state_exists: true|false
- lineage: hivefiver|hiveminder|unresolved
- hierarchy_status: missing|empty|malformed|present|awaiting_intent|linked
- entry_condition: bootstrap_required|classify_required|ready

## STEP 2: Bootstrap if Required

If entry_condition === "bootstrap_required":
```bash
./scripts/auto-init.sh
```

## STEP 3: Classify Intent (if required)

If entry_condition === "classify_required" and user message exists:
```bash
echo "user message here" | ./scripts/classify-intent.sh
```

## STEP 4: FIRST OUTPUT (MANDATORY)

Your FIRST message MUST be:
"[ENTRY] lineage=<lineage> | trajectory=<status> | session=<sessionId>"

DO NOT proceed until you output this.
