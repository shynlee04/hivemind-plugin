---
created: 2026-04-09T21:20:18.703Z
title: Configurable category routing with user-defined categories
area: api
files:
  - src/lib/types.ts:8-15
  - src/lib/categories.ts
  - src/lib/specialist-router.ts
---

## Problem

`VALID_DELEGATION_CATEGORIES` is hardcoded to 6 values. After Phase 3 fix, unknown categories fall through to signal-based routing (no longer throw), but users cannot define their own categories with custom model, temperature, or tool profiles.

## Solution

Allow category definitions in `opencode.json` harness section:
```json
{
  "harness": {
    "categories": {
      "wave1-fix": { "toolProfile": "builder", "temperature": 0.15 },
      "wave1-dedup": { "toolProfile": "builder", "temperature": 0.1 }
    }
  }
}
```
Unknown categories without config fall through to signal-based routing. Known categories use the user-defined config.
