# Phase 16: Session-Tracker Tool Intelligence + Event-Tracker Deprecation Cleanup — Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Nâng cấp 5 existing tools (session-tracker, session-hierarchy, session-context, delegate-task, delegation-status) với search child .json, filter status/agentType/depth, cross-session aggregation, resume-aware actions; verify event-tracker deprecation completeness; viết lại hivemind-power-on skill dựa trên tools thật.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**8 requirements are locked.** See `16-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `16-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- Nâng cấp 3 existing tools: `session-tracker`, `session-hierarchy`, `session-context`
- Mở rộng actions: `filter-sessions`, `aggregate`, `get-manifest`
- Cải thiện search: child .json content, format-aware parsing
- Cross-root unified query: new tool `hivemind-session-view`
- Xóa event-tracker remnants (docs verification + optional stale test fixture cleanup)
- Viết lại `hivemind-power-on` skill (SKILL.md + references/)
- Cập nhật ROADMAP.md, STATE.md, REQUIREMENTS.md

**Out of scope (from SPEC.md):**
- Thay đổi session-tracker capture layer — chỉ sửa read-side tools
- Resume execution — tool chỉ cung cấp discovery metadata (filter-sessions)
- LLM/embedding search
- CP-PTY-01..04 (background shell)
- CP-DT-01 gap closure (runtime resume)

</spec_lock>

<decisions>
## Implementation Decisions

### Search Architecture (Area 1)
- **D-01:** On-demand scan — đọc child .json files khi search được gọi. Cache kết quả in-memory trong session. Không pre-built index.
- **D-02:** JSON-aware parsing — parse .json files structure, search trong specific fields (`lastMessage`, `turn.content`, `journey[].content`, `delegatedBy.subagentType`). Không flat regex.
- **D-03:** Remove 50KB silent skip limit. Thêm warning nếu file >1MB.
- **D-04:** Stream + progressive (post-MVP) — bắt đầu trả kết quả khi tìm thấy match đầu tiên, tiếp tục scan background.

### Tool Action Placement (Area 2)
- **D-05:** `filter-sessions` = new action trên `session-tracker` (không extend `list-sessions`).
- **D-06:** `aggregate` = new action trên `session-context` (không tạo tool riêng).
- **D-07:** `get-manifest` = new action riêng trên `session-hierarchy` (dễ discover cho L0/L1 front-facing agents).
- **D-08:** Tools chỉ dành cho front-facing agents (build, hm/hf-L0, hm/hf-L1). Permission/routing rõ ràng.

### Cross-Root Query (Area 3)
- **D-09:** New tool `hivemind-session-view` với action `get` trả về enriched unified view.
- **D-10:** Read-through merge strategy — đọc trực tiếp từ 3 roots mỗi lần query. Cache nhẹ in-memory (1 session).
- **D-11:** Output format = nested tree: `{session: {...}, delegations: [...], trajectory: {...}}`.

### Resume & Discovery (Area 4) — gộp vào filter-sessions
- **D-12:** `find-resumable` action REMOVED. Filter `status: active` qua `filter-sessions` = tất cả sessions active đều resumable.
- **D-13:** `filter-sessions` output bao gồm rich metadata: `sessionId`, `agentType`, `depth`, `lastMessage[:500]`, `createdAt`, `updatedAt`, `toolSummary`.
- **D-14:** Resume prompt format dùng OpenCode SDK-compatible fields: `task_id`, `subagent_type`, `description`. Không custom fields.
- **D-15:** No `verify-resume` action — agents tự dùng `task(task_id=...)`. Filter-sessions chỉ discovery.

### Event-Tracker Cleanup (Area 5)
- **D-16:** Scope = verify zero remnants + update AGENTS.md/docs references nếu outdated. Không modify test fixtures.
- **D-17:** Confirmed: `src/` clean (CP-ST-03), `.opencode/skills/` clean. Only historical references in AGENTS.md files remain.

### Skill Rewrite (Area 6)
- **D-18:** Viết lại hoàn toàn `hivemind-power-on` skill (không edit từng section).
- **D-19:** Giữ 6 reference files structure, update content khớp tools thật.
- **D-20:** SKILL.md có progressive disclosure + jump links agents có thể follow (không chỉ route decoration).
- **D-21:** Viết skill trong phase này (song song với tool changes), không defer.
- **D-22:** Dùng hf-l2-skill-builder/skill-creator standards khi viết skill.

### the agent's Discretion
- Chi tiết test implementation (search unit test patterns)
- Caching TTL cho in-memory session results
- Warning message format cho files >1MB
- Error handling patterns (beyond `[Harness]` prefix convention)
- SKILL.md exact progressive disclosure hierarchy

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Tool Design Standards
- `.planning/archive/2026-05-07/CUSTOM-TOOLS-CRITERIA-2026-05-05.md` — Full custom tool design criteria (8 categories, ≤3 required args, action routing, Zod schemas, .describe() docs, ≤200 LOC per tool, ToolResponse<T> envelope)
- `.planning/codebase/ARCHITECTURE.md` — CQRS boundaries, 9-surface model, Q6 state root
- `.planning/codebase/CONVENTIONS.md` — Coding conventions: kebab-case, ESM .js extensions, [Harness] prefix, JSDoc requirements, Zod validation patterns

### Phase Spec & Requirements
- `.planning/phases/16-session-tracker-tool-intelligence-event-tracker-deprecation-/16-SPEC.md` — Locked requirements (8), boundaries, acceptance criteria (10). MUST READ before planning.
- `.planning/REQUIREMENTS.md` — Project-wide requirements (f-02 delegation, f-08 event-tracker status)

### Session Tracker Architecture
- `src/tools/hivemind/session-tracker.ts` — Current tool (203 LOC), existing search-sessions implementation with substring match + 50KB skip
- `src/tools/hivemind/session-hierarchy.ts` — Current tool (124 LOC), get-children/get-parent-chain/get-delegation-depth
- `src/tools/hivemind/session-context.ts` — Current tool (169 LOC), find-related/cross-reference/synthesize-context
- `src/tools/delegation/delegation-status.ts` — Current tool (208 LOC), UNSUPPORTED_REPLACEMENT_MESSAGE at line 38-39
- `src/features/session-tracker/` — Capture layer (418 tests, hierarchy tracking, 3-gate classification, retry queue)

### Session Tracker Data Formats
- `.hivemind/session-tracker/project-continuity.json` — Master index (version 2.0): sessions map + chronologicalOrder
- `.hivemind/session-tracker/{sessionId}/session-continuity.json` — Hierarchy tree: root, children[], turnCount, toolSummary
- `.hivemind/session-tracker/{sessionId}/hierarchy-manifest.json` — Flattened child list: status, delegatedBy, depth, turnCount
- `.hivemind/session-tracker/{sessionId}/{childId}.json` — Child session detail: lastMessage, turns[], journey[], delegatedBy

### Skill Authoring Standards
- `.opencode/skills/hivemind-power-on/SKILL.md` — Current skill (aspirational, needs rewrite)
- `.opencode/skills/hivemind-power-on/references/` — 6 reference files (01-06, need content update)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `safeSessionPath()` + `isValidSessionID()` in `src/features/session-tracker/persistence/atomic-write.ts` — Path safety helpers có thể dùng lại cho tool reads
- `HierarchyIndex` in `src/features/session-tracker/persistence/hierarchy-index.ts` — In-memory parent/child tracking, hiện chỉ dùng cho capture layer, có thể dùng cho tools (thay vì đọc disk mỗi lần)
- `SessionContinuityIndex`, `ProjectContinuityIndex`, `HierarchyManifest` types — Data types cho tool responses

### Established Patterns
- Action routing pattern: mỗi tool dùng `action` enum parameter để route đến handlers (xem `run-background-command`, `hivemind-trajectory`)
- `ToolResponse<T>` envelope: `success(data)`, `error(message)` từ `src/shared/tool-response.ts`
- Zod schemas at tool boundary: all tool args validated via `tool.schema.<type>().describe()`
- JSON reading: existing tools dùng `readFile` + `JSON.parse` từ `node:fs/promises`

### Integration Points
- `src/tools/hivemind/session-tracker.ts` — Search + filter actions cần read-access tới `.hivemind/session-tracker/*/`
- `src/tools/hivemind/session-context.ts` — Aggregate action cần read tất cả `session-continuity.json` files
- `src/tools/hivemind/session-hierarchy.ts` — Get-manifest action cần read `hierarchy-manifest.json`
- `src/tools/delegation/delegation-status.ts` — Output metadata cần bridge tới session-tracker data
- `src/plugin.ts` — Tool registration (new tools/actions cần update plugin.ts)
- `.hivemind/state/trajectory-ledger.json` — Cross-root query cần read trajectory data

</code_context>

<specifics>
## Specific Ideas

- `hivemind-power-on` skill rewrite phải dùng hf-l2-skill-builder/skill-creator/skill-judge tools — không viết tay
- SKILL.md progressive disclosure routing phải có jump links agents thực sự follow được (không chỉ trang trí)
- Tools chỉ dành cho front-facing agents (build, hm/hf-L0, hm/hf-L1) — permission/routing thiết kế rõ ràng
- Resume dùng task tool với task_id — không cần custom resume mechanism

</specifics>

<deferred>
## Deferred Ideas

- Stream + progressive search — post-MVP
- LLM/embedding search — deferred to future phase
- Resume execution verification — CP-DT-01 gap closure
- CP-PTY-01..04 — separate workstreams
- Stale test fixture cleanup (`"Investigate l bugs"`) — low priority, không trong scope

</deferred>

---

*Phase: 16-session-tracker-tool-intelligence-event-tracker-deprecation-*
*Context gathered: 2026-05-20*
