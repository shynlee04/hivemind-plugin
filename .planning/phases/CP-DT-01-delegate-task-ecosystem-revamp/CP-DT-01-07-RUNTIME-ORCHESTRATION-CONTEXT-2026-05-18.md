---
phase: CP-DT-01
wave: 7
artifact: context
date: 2026-05-18
status: draft-ready
evidence_level: L5 planning, L3 test evidence required next
source_inputs:
  - session-ses_1c50.md
  - CP-DT-01-SPEC.md
  - CP-DT-01-RESEARCH.md
  - CP-DT-01-CONTEXT.md
  - CP-DT-01-06-RUNTIME-GAPS-2026-05-18-PLAN.md
  - subagent:ses_1c45f7753ffeeQnJ2K1biVM9LG
  - subagent:ses_1c45f76a4ffeOJGmPiF3BSCa8U
---

# CP-DT-01 Wave 7 Context — Runtime Orchestration Gaps

## Ly do mo lai

Yeu cau goc cua CP-DT-01 khong chi la tao child session. Yeu cau goc la `delegate-task` phai la mot lop orchestration async co kiem soat, dung OpenCode SDK va cac interface OpenCode de:

- tao child session dung agent va permission;
- ghi nhan child session ID;
- phat hien child session da actually executed bang first tool/action signals;
- chu dong poll va inject progress ve main session theo cadence;
- tu dong dua result/failure ve dung parent session, ke ca khi parent da end stream;
- ho tro abort/cancel/restart/redirect/resume/continue bang session ID;
- tach ro khoi OpenCode native `task` tool va background PTY command lane.

Wave 6 moi sua duoc slice toi thieu: `delegate-task` khong con tra `runtime-blocked`, va da co duong `session.create(parentID)` + `session.promptAsync(agent, parts, tools)` qua SDK. Dieu nay la can thiet nhung chua du de dat intent goc.

## Bang chung tu session test that

File: `session-ses_1c50.md`.

- User yeu cau live test delegation va OpenCode SDK architecture: `session-ses_1c50.md:11-13`.
- Assistant dien giai dung muc tieu live tester: `session-ses_1c50.md:21-35`.
- `delegate-task` bi category gate reject voi category khong hop le: `session-ses_1c50.md:468-515`.
- `delegate-task` tao duoc delegation ID/status running trong mot so lan: `session-ses_1c50.md:972-1000`, `1034-1058`, `1184-1208`.
- `delegation-status` schema khong khop ky vong khi action `get` bi reject: `session-ses_1c50.md:1016-1031`, `1066-1072`.
- Nhieu delegation co status `completed` nhung khong co result summary/action summary/file change evidence: `session-ses_1c50.md:1263-1319`, `1407-1489`, `1609-1640`.
- Task phuc tap van `running` qua nhieu lan poll, khong thay report tu dong ve parent: `session-ses_1c50.md:1874-1905`, `1965-1977`, `1992-2023`, `2257-2288`, `2588-2637`.
- Khong thay auto-injection, toast, hoac system reminder tu `delegate-task`; parent chi thay manual polling bang `delegation-status`.

## Gap hien tai

| Nhom | Trang thai | Gap can dong |
|---|---|---|
| Child session dispatch | Mot phan | Da co SDK child session path, nhung can L1/L3 proof child actually executes tools/actions. |
| Execution detection | Thieu | Chua co first tool/action window 60s va action counter. |
| Polling/injection | Thieu | `DelegationMonitor` co cadence nhung plugin wire `inject` dang no-op. |
| Failure thresholds | Thieu | Co 60/120/180/300 trong type/escalation, thieu 600s va semantics 2 cap failure. |
| Result delivery | Thieu | V2 coordinator notification route chua noi voi parent append/resume/result extraction pipeline. |
| TUI toast | Thieu | OpenCode SDK co `tui.showToast`, nhung delegation injection/terminal path chua wire. |
| Control tools | Mot phan | `abort/cancel/restart/redirect` dang co, nhung resume/continue completed task bang session ID chua thanh public flow. |
| 10 slots per parent | Mot phan | `SlotManager` co default 10, nhung can proof isolation nhieu parent session. |
| Primitive discovery | Mot phan | Project `.opencode` co scan, global config path chua scan/merge. |
| Compact/endstream survival | Thieu | Co utility/pending artifacts, nhung chua co compaction hook va endstream delivery proof. |
| Cleanup deprecated/confusing logic | Thieu | V2 coordinator, legacy runtime adapter, SDK handler, notification router, session tracker pending dispatch con overlap. |

## Ranh gioi dung

`delegate-task` khong phai OpenCode native `task` tool. Native `task` la tool noi bo cua OpenCode, co `promptOps`, background jobs, synthetic parent injection, va permission inheritance rieng. `delegate-task` la Hivemind tool dung OpenCode SDK/API de orchestration nhieu child sessions voi monitoring va notification chu dong.

`delegate-task` cung khong phai `run-background-command`. Background command/PTY lane quan ly process/terminal; `delegate-task` quan ly agent child sessions, messages, tools/actions, permissions, result delivery.

## Ket luan context

Wave 7 phai xu ly nhu mot remediation phase rieng: lap spec bo sung, research kha thi moi, va plan GSD theo slices. Khong duoc tiep tuc claim CP-DT-01 complete cho den khi co proof cho execution detection, injection, result delivery, control/resume, va compact/endstream survival.
