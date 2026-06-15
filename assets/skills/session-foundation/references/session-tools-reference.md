# Session Tools — Complete Reference

## session-tracker

Query session state stored in the session-tracker data root.

**Registration:** `src/tools/hivemind/session-tracker.ts` (373 LOC)

| Action | Parameters | Response Shape | Notes |
|--------|-----------|----------------|-------|
| `list-sessions` | — | Array of `{sessionId, status, depth, createdAt, updatedAt}` | All sessions ordered by recency |
| `filter-sessions` | `{status?, agentType?, minDepth?, maxDepth?, timeRange?}` | Array of matching sessions | `timeRange`: `{after, before}` as ISO strings |
| `search-sessions` | `{query, limit?}` | Array of `{sessionId, matchLocation, snippet}` | Searches .md AND child .json |
| `get-status` | `{sessionId}` | `{status, agentType, depth, delegations}` | Lightweight — no full data |
| `get-summary` | `{sessionId}` | `{title, status, agentType, duration, delegationCount}` | Brief overview |
| `export-session` | `{sessionId}` | Full session data object | Complete session record |

## session-hierarchy

Navigate the delegation hierarchy tree.

**Registration:** `src/tools/hivemind/session-hierarchy.ts` (228 LOC)

| Action | Parameters | Response Shape | Notes |
|--------|-----------|----------------|-------|
| `get-children` | `{sessionId}` | Array of `{sessionId, status, agentType, depth}` | Direct children only |
| `get-manifest` | `{sessionId}` | Flattened array of all descendants | **Preferred** — reads hierarchy-manifest.json |
| `get-parent-chain` | `{sessionId}` | Array `[{sessionId, status, depth}]` ordered root→leaf | Traces delegation path |
| `get-delegation-depth` | `{sessionId}` | `{depth: number}` | Depth is 0-indexed (root = 0) |

## session-context

Cross-session aggregation and synthesis.

**Registration:** `src/tools/hivemind/session-context.ts` (224 LOC)

| Action | Parameters | Response Shape | Notes |
|--------|-----------|----------------|-------|
| `aggregate` | `{groupBy: "status" \| "subagentType"}` | Array of `{key, count}` | Counts per group |
| `find-related` | `{sessionId}` | Array of `{sessionId, relevance, overlap}` | Ranked by tool usage overlap + time proximity |
| `cross-reference` | `{term}` | Array of `{sessionId, occurrences}` | Finds sessions referencing a tool or term |
| `synthesize-context` | `{sessionIds: string[]}` | Merged context object | Combines multiple sessions |

## hivemind-session-view

Unified read-through query across multiple data roots.

**Registration:** `src/tools/hivemind/hivemind-session-view.ts` (127 LOC)

| Action | Parameters | Response Shape | Notes |
|--------|-----------|----------------|-------|
| `get` | `{sessionId}` | `{session: {...}, delegations: [...]}` | Concurrent Promise.all read |

## delegate-task

Create child session via SDK dispatch (write-side tool, referenced for stacking).

**Registration:** `src/tools/delegation/delegate-task.ts` (93 LOC)

| Parameter | Type | Required | Notes |
|-----------|------|----------|-------|
| `agent` | string | yes | Specialist agent type |
| `prompt` | string | yes | Bounded task description |
| `context` | string | no | JSON: `{"parentSessionId": "..."}` for stacking |

## delegation-status

Poll and inspect delegation state.

**Registration:** `src/tools/delegation/delegation-status.ts` (208 LOC)

| Action | Parameters | Notes |
|--------|-----------|-------|
| `status` | `{delegationId}` | Returns delegation progress and current state |
| `list` | `{status?}` | Optionally filter by delegation status |
| `control` | `{action, ...}` | Abort, cancel, restart, resume, chain, adjust-prompt |

## execute-slash-command

Dispatch registered slash commands.

**Registration:** `src/tools/session/execute-slash-command.ts` (288 LOC)

| Parameter | Type | Notes |
|-----------|------|-------|
| `command` | string | Command name without leading slash |
| `arguments` | string | Arguments string |
| `agent` | string | Optional agent context override |
| `subtask` | boolean | One-shot subtask dispatch when true |

## hivemind-command-engine

Command discovery and routing (read-side companion to execute-slash-command).

**Registration:** `src/tools/hivemind/hivemind-command-engine.ts` (67 LOC)

| Action | Purpose |
|--------|---------|
| `discover` | Discover command bundles |
| `list_commands` | List available commands |
| `route_preview` | Preview routing without executing |
| `analyze_contract` | Analyze command contracts |
| `render_context` | Render bounded context payloads |
| `transform_messages` | Narrow command message transforms |

## prompt-skim / prompt-analyze

Fast prompt scanning and deep analysis.

**Registration:** `src/tools/prompt/` (prompt-skim: 7 tests, prompt-analyze: 7 tests)

| Tool | Actions | Use Case |
|------|---------|----------|
| `prompt-skim` | word/lines/tokens count, URL extract, path verify, complexity score | Quick prompt size and structure check |
| `prompt-analyze` | contradiction, vagueness, missing scope, clarity signals | Deep prompt quality analysis |
