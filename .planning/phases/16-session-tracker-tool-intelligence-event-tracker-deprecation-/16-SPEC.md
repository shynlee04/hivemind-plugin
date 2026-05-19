# Phase 16: Session-Tracker Tool Intelligence + Event-Tracker Deprecation Cleanup — Specification

**Created:** 2026-05-20
**Ambiguity score:** 0.16 (gate: ≤ 0.20)
**Requirements:** 8 locked

## Goal

3 tools (session-tracker, session-hierarchy, session-context) và 2 delegation tools (delegate-task, delegation-status) được nâng cấp để khai thác dữ liệu session-tracker (.hivemind/session-tracker/) một cách đầy đủ: search child .json, filter status/agentType/depth, cross-session aggregation, resume-aware actions; event-tracker deprecated code được xóa hoàn toàn; hivemind-power-on skill được viết lại dựa trên tools thật.

## Background

**Current state:** Session-tracker WRITE path đã hoàn chỉnh (CP-ST-01→06: 418 tests, hierarchy tracking, 3-gate classification, retry queue, quarantine protocol). Tuy nhiên READ-side tools không khai thác được dữ liệu đã capture:

1. **GAP-1** (`session-tracker.ts:182-184`): `search-sessions` chỉ substring match trên `.md` files — bỏ qua child `.json` files (mất `lastMessage`, `turn.content`, tool I/O của delegated sessions). Silent skip files >50KB.
2. **GAP-2**: Không filter theo `status`/`agentType`/`depth` — `hierarchy-manifest.json` có sẵn dữ liệu nhưng không exposed qua tool actions.
3. **GAP-3**: Không cross-session aggregation — `find-related` chỉ tool overlap scoring. Không thể "đếm active sessions", "top agent types".
4. **GAP-4** (`delegation-status.ts:38-39`): `UNSUPPORTED_REPLACEMENT_MESSAGE` — resume runtime-blocked. `hivemind-power-on` skill mô tả resume workflow không khả thi.
5. **GAP-5**: `hivemind-power-on` skill chứa aspirational design (hallucination) — references mô tả "context auto-preserved", "No thought must" nhưng tools không hỗ trợ.
6. **GAP-6**: 3 data roots riêng biệt (`.hivemind/session-tracker/`, `.hivemind/state/`, `.hivemind/state/trajectory-ledger.json`) — không unified query surface.
7. **Event-tracker**: CP-ST-03 đã excise event-tracker khỏi `src/` (22 files deleted), cần verify không còn remnants trong `.opencode/` skills/docs.

**Trigger:** Agents (L0 orchestrators, L1 coordinators) không thể tận dụng session-tracker data để resume sessions, search context, hay hiểu delegation hierarchy — tools thiếu actions cần thiết.

## Requirements

1. **Search child .json content**: `session-tracker` tool mở rộng `search-sessions` action để quét cả `.json` child session files (tìm trong `lastMessage`, `turn.content`, `journey[].content`).
   - Current: Chỉ quét `.md` files, substring match, skip >50KB
   - Target: Quét `.md` + `.json`, format-aware parsing, resume >50KB limit
   - Acceptance: Search "gsd-planner" tìm được child session .json có `delegatedBy.subagentType: "gsd-planner"` mà không cần đọc .md

2. **Filter by status/agentType/depth**: `session-tracker` tool thêm action `filter-sessions` với params `status`, `agentType`, `minDepth`, `maxDepth`, `timeRange`.
   - Current: Không có filter capability nào
   - Target: `session-tracker({action: "filter-sessions", status: "active", agentType: "gsd-planner"})` trả về sessions khớp
   - Acceptance: Filter "active sessions depth≥1" trả về đúng sessions từ `project-continuity.json` có `childCount > 0`

3. **Cross-session aggregation**: `session-context` tool thêm action `aggregate` trả về thống kê cross-session.
   - Current: Chỉ `find-related` (tool overlap) và `cross-reference` (tool name)
   - Target: `session-context({action: "aggregate", groupBy: "subagentType"})` → histogram; `groupBy: "status"` → counts
   - Acceptance: Aggregate trả về đúng số sessions active/completed/total và top 5 agent types

4. **Hierarchy-manifest exposure**: `session-hierarchy` tool expose data từ `hierarchy-manifest.json`.
   - Current: Chỉ đọc `session-continuity.json` hierarchy tree
   - Target: `session-hierarchy({action: "get-manifest", sessionId: "..."})` trả về flattened child list từ manifest
   - Acceptance: Manifest get-children khớp với disk `hierarchy-manifest.json` content

5. **Resume-discovery actions**: `delegation-status` tool mở rộng với action `find-resumable` trả về sessions có thể resume (active + childCount > 0 + delegator info).
   - Current: `UNSUPPORTED_REPLACEMENT_MESSAGE` blocks resume
   - Target: `delegation-status({action: "find-resumable"})` → list of `{sessionId, agentType, depth, lastMessage[:200], resumePrompt}`
   - Acceptance: Trả về đúng sessions active với child delegations + `resumePrompt` đủ để agents dùng `task(task_id=...)`

6. **Cross-root query**: New tool action hoặc tool mới cho phép query unified view qua `.hivemind/session-tracker/` + `.hivemind/state/` + `.hivemind/state/trajectory-ledger.json`.
   - Current: 3 roots riêng, không tool nào query xuyên root
   - Target: Một action duy nhất trả về unified view: session metadata + delegation status + trajectory events
   - Acceptance: Query theo sessionId trả về enriched object với session status + delegation children + trajectory checkpoints

7. **Event-tracker deprecation completeness**: Xóa hoàn toàn mọi remnants.
   - Current: `src/` confirmed clean (CP-ST-03), cần check `.opencode/` skills + docs references
   - Target: Zero references to "event-tracker" trong `src/`, `.opencode/skills/`, `.planning/` docs
   - Acceptance: `rg -i "event-tracker\|eventTracker\|event_tracker" src/ .opencode/skills/ .planning/` → 0 matches hợp lệ

8. **hivemind-power-on skill rewrite**: Viết lại dựa trên actual tool capabilities.
   - Current: Skill mô tả resume workflow không khả thi, references chứa aspirational hallucination
   - Target: Skill mô tả chính xác tool capabilities; resume section nói rõ "task tool resume phụ thuộc SDK v2, verify trước khi dùng"
   - Acceptance: Skill không còn references đến workflow không khả thi; mô tả match source code thật

## Boundaries

**In scope:**
- Nâng cấp 3 existing tools: `session-tracker`, `session-hierarchy`, `session-context`
- Mở rộng actions: `filter-sessions`, `aggregate`, `get-manifest`, `find-resumable`
- Cải thiện search: child .json content, format-aware parsing
- Cross-root unified query: new action hoặc new tool
- Xóa event-tracker remnants (docs + skills references)
- Viết lại `hivemind-power-on` skill (SKILL.md + references/)
- Cập nhật ROADMAP.md, STATE.md, REQUIREMENTS.md

**Out of scope:**
- Thay đổi session-tracker capture layer (CP-ST-06 vừa xong) — chỉ sửa read-side tools
- Resume execution (vẫn phụ thuộc SDK v2 `task()` — tool chỉ cung cấp discovery metadata)
- LLM/embedding search — substring match + regex là đủ cho MVP
- New tools ngoài existing + 1 unified query tool — không tạo thêm tool nếu existing đủ actions
- CP-PTY-01..04 (background shell) — độc lập, không blocking
- CP-DT-01 gap closure (runtime resume) — phase riêng

## Constraints

- No breaking changes to session-tracker file formats (`project-continuity.json`, `session-continuity.json`, `hierarchy-manifest.json`)
- CQRS boundaries: tools = write-side (mutation), hooks = read-side (capture)
- hành vi behavior model: `filter-sessions` = deterministic, `find-resumable` = condition-based, `aggregate` = deterministic
- CUSTOM-TOOLS-CRITERIA (`.planning/archive/2026-05-07/CUSTOM-TOOLS-CRITERIA-2026-05-05.md`): ≤3 required args, action routing, Zod schemas, .describe() docs
- Tools files ≤200 LOC each (hiện tại: session-tracker 203, session-context 169, session-hierarchy 124, delegation-status 208)
- Q6 state root: `.hivemind/state/` cho cross-root query, không đọc/ghi `.opencode/state/`
- `hivemind-power-on` skill viết lại bằng tiếng Việt (như các skill khác)

## Acceptance Criteria

- [ ] `session-tracker search-sessions` trả về matches từ child `.json` files (verified với test session có nested delegation)
- [ ] `session-tracker filter-sessions` với `status=active&agentType=gsd-planner` trả về đúng sessions
- [ ] `session-context aggregate` với `groupBy=status` trả về đúng counts
- [ ] `session-hierarchy get-manifest` trả về data khớp file trên disk
- [ ] `delegation-status find-resumable` trả về list sessions active có children
- [ ] Cross-root query action trả về unified object với session + delegation + trajectory data
- [ ] `rg -i "event.tracker" .opencode/skills/` → 0 matches (hoặc chỉ legit non-code references)
- [ ] `hivemind-power-on` skill không còn aspirational/hallucination content
- [ ] Tất cả code changes pass typecheck + existing 418 session-tracker tests
- [ ] Atomic commit per logical change

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                              |
|--------------------|-------|------|--------|------------------------------------|
| Goal Clarity       | 0.90  | 0.75 | ✓      | 6 gaps confirmed từ source code    |
| Boundary Clarity   | 0.85  | 0.70 | ✓      | In/out scope explicit              |
| Constraint Clarity | 0.80  | 0.65 | ✓      | CQRS, format compat, criteria doc  |
| Acceptance Criteria| 0.75  | 0.70 | ✓      | 10 pass/fail criteria              |
| **Ambiguity**      | 0.16  | ≤0.20| ✓      |                                    |

## Interview Log

| Round | Perspective   | Question summary                         | Decision locked                         |
|-------|---------------|------------------------------------------|-----------------------------------------|
| --auto| --auto        | Phase requirements derived from source   | 8 requirements from 6 confirmed gaps    |
|       |               | code investigation and user's session    | + event-tracker cleanup + skill rewrite |
|       |               | manipulation analysis                    |                                         |

---

*Phase: 16-session-tracker-tool-intelligence-event-tracker-deprecation-*
*Spec created: 2026-05-20*
*Next step: /gsd-discuss-phase 16 — implementation decisions (tool action design, search algorithm, skill structure)*
