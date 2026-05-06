---
created: 2026-04-09T21:20:18.703Z
title: Dynamic agent discovery from opencode.json and agents/*.md
area: api
files:
  - src/lib/types.ts:7
  - src/lib/specialist-router.ts
  - src/tools/delegate-task.ts
---

## Problem

Currently `VALID_AGENTS` is a hardcoded const array in `src/lib/types.ts`. Even after the Phase 3 fix to add OpenCode built-ins (build, plan, explore), agents defined in `opencode.json` or `.opencode/agents/*.md` are not discovered at runtime. Users must edit source code to add new agents.

## Solution

Build a config loader that:
1. Parses `opencode.json` → `agent` section at plugin init
2. Parses `.opencode/agents/*.md` → YAML frontmatter at plugin init
3. Merges discovered agents with built-in fallbacks
4. Populates agent registry used by `delegate-task`, `specialist-router`, permission engine
