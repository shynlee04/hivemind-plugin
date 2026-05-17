---
status: diagnosed
trigger: "Dieu tra vi sao child session khong cap nhat turns, journey, lastMessage sau khi tao ban dau"
created: 2026-05-17T12:00:00Z
updated: 2026-05-17T12:30:00Z
---

# Child Session Updates Missing

## Muc tieu doc

Doc nay danh cho ky su tiep tuc CP-ST-06 sau compact/resume. Sau khi doc, ho can nam duoc vi sao child `.json` chi co delegation description va flow nao da duoc chon de fix.

## Trieu chung

- Child `.json` chi co turn ban dau tu delegation description.
- `journey` khong co hoac rong.
- `lastMessage` chi la description cua task, khong phai output that cua subagent.
- Runtime khong bao loi; data chi im lang khong duoc ghi.

## Root cause

### RC-1: OpenCode SDK khong emit hooks cho subagent sessions

Plugin dang lang nghe `chat.message` va `tool.execute.after` o cap parent session. Khi `task` tool spawn subagent, runtime khong emit cac hook nay voi `input.sessionID` cua child session.

He qua:

- `ChildRecorder.recordChildMessage()` ton tai va dung, nhung activation-dead.
- `ToolDelegation.recordChildToolJourney()` ton tai va dung, nhung activation-dead.
- Parent `tool.execute.after` cua `task` la diem hook duy nhat co the thay child result.

### RC-2: Hierarchy index chi nam trong memory

`HierarchyIndex` giu mapping child-to-parent trong memory. Sau restart, mapping mat. Neu hook child co emit thi classification van co the fail sau restart cho den khi Gate 1/Gate 3 recover.

### RC-3: Child metadata ban dau thieu `journey: []`

Initial child record trong `tool-capture.ts` truoc fix khong khoi tao `journey`. Dieu nay lam child `.json` khong co surface ro rang de recovery doc lai tool/assistant journey.

## Huong fix da chon

Chon harness-side parent capture:

- Parent `task` tool result duoc parse khi PostToolUse hoan tat.
- Neu output chi co `task_id`, giu behavior dispatch-only.
- Neu output co `<task_result>...</task_result>` hoac payload sau `task_id`, ghi payload do vao child `.json` nhu assistant turn that.
- Ghi them `journey` entry type `assistant_message` voi metadata `capturedFrom: task_tool_result`.
- Mark child status `completed` khi co result that.

Ly do khong chon polling luc nay:

- Polling can them contract voi SDK session content API va co rui ro version mismatch.
- Parent task result da la bang chung gan nhat, co san trong hook hien tai.
- Fix nho hon, it surface moi hon, va co regression test truc tiep.

## Verification hien tai

- Scoped regression file da them test cho completed task result.
- Session-tracker scoped suite pass: `415/415`.
- Typecheck pass: `npx tsc --noEmit` no output.
- Full suite van fail cac khu vuc unrelated da biet: steering-engine missing module, plugin event observer mock/export, bootstrap tool registration mock, execute-slash-command expectation.

## Rui ro con lai

- Parent capture chi thay final result cua subagent, khong thay tung tool call noi bo ben trong child session neu SDK khong expose chung trong result.
- Neu `task` output chi tra `task_id` va chay background, child `.json` van chi co delegation_spawn cho den khi co future polling/status integration.
- Live UAT van can mot long-haul run that de xac nhan OpenCode task output format trong runtime khop voi parser.
