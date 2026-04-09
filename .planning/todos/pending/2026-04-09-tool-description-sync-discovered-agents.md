---
created: 2026-04-09T21:20:18.703Z
title: Tool description sync with discovered agents and categories
area: api
files:
  - src/tools/delegate-task.ts:191-200
---

## Problem

The `delegate-task` tool's arg descriptions list valid agents/categories as static strings. After dynamic discovery is implemented, these descriptions will be stale — they won't reflect the actual discovered agents/categories at load time.

## Solution

Generate tool descriptions at plugin init time from the discovered agent/category registry:
```typescript
const discoveredAgents = Object.keys(agentRegistry).join(", ")
// Use in tool description: `Valid agents: ${discoveredAgents}`
```
This ensures the LLM always sees accurate, current information about what agents are available.
