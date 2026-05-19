# Phase 16: Session-Tracker Tool Intelligence + Event-Tracker Deprecation Cleanup — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-20
**Phase:** 16-session-tracker-tool-intelligence-event-tracker-deprecation-
**Areas discussed:** Search Architecture, Tool Action Placement, Cross-Root Query, Resume & Discovery, Event-Tracker Cleanup, Skill Rewrite

---

## Search Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| On-demand scan | Quét child .json files khi search được gọi. Cache trong session. | ✓ |
| Pre-built index | Xây dựng index khi tool init, cần sync invalidation. | |
| Stream + progressive | Trả kết quả ngay khi có match đầu tiên, scan background. | deferred |

**User's choice:** On-demand scan (Recommended)
**Notes:** JSON-aware parsing, remove 50KB limit, add 1MB warning.

---

## Tool Action Placement

| Option | Description | Selected |
|--------|-------------|----------|
| New action filter-sessions | Action riêng trên session-tracker | ✓ |
| Extend list-sessions | Optional filter params | |

**User's choice:** New action `filter-sessions` on `session-tracker`
**Notes:** aggregate → new action on `session-context`. get-manifest → new action on `session-hierarchy`. Tools only for front-facing agents (L0/L1/build).

---

## Cross-Root Query

| Option | Description | Selected |
|--------|-------------|----------|
| New tool hivemind-session-view | Tool chuyên biệt, action 'get' | ✓ |
| Action on session-context | unified-view action | |
| Extend get-status | Mở rộng session-tracker get-status | |

**User's choice:** New tool `hivemind-session-view` (Recommended)
**Notes:** Read-through merge, nested tree output format.

---

## Resume & Discovery

| Option | Description | Selected |
|--------|-------------|----------|
| Rich metadata | sessionId, agentType, depth, lastMessage, createdAt | ✓ |
| Minimal | Chỉ sessionId + agentType + depth | |
| Full context | lastMessage đầy đủ + tool list | |

**User's choice:** Rich metadata
**Notes:** `find-resumable` action REMOVED. `filter-sessions(status: "active")` provides discovery. Resume prompt uses OpenCode SDK fields only (`task_id`, `subagent_type`, `description`). All sessions are inherently resumable — no verify action needed.

---

## Event-Tracker Cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| Verify + docs update | Scan + update AGENTS.md references | ✓ |
| Full cleanup | Plus clean stale test fixtures | |

**User's choice:** Verify + docs update (Recommended)
**Notes:** `src/` confirmed clean. `.opencode/skills/` zero matches. Only historical AGENTS.md references remain.

---

## Skill Rewrite

| Option | Description | Selected |
|--------|-------------|----------|
| Viết lại hoàn toàn | Skill mới dựa trên tools thật | ✓ |
| Edit từng section | Giữ structure, update partial | |

**User's choice:** Viết lại hoàn toàn (Recommended)
**Notes:** Giữ 6 reference files + update content. SKILL.md progressive disclosure với jump links agents follow được. Viết trong phase này, dùng hf-l2-skill-builder/skill-creator standards.

---

## the agent's Discretion
- Chi tiết test implementation patterns
- Caching TTL cho in-memory results
- Warning message format
- SKILL.md exact progressive disclosure hierarchy

## Deferred Ideas
- Stream + progressive search — post-MVP
- LLM/embedding search — future phase
- Resume execution verification — CP-DT-01 gap closure
- Stale test fixture cleanup — low priority
