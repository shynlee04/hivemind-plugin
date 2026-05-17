---
phase: CP-ST-06
type: runtime-failure-fix
status: verified-scoped
scope: session-tracker runtime preservation
---

# CP-ST-06 Runtime Failure Fix

## Su co thuc te

CP-ST-06 da pass validation/code-review tren test suite cu, nhung runtime that van fail cac logic cot loi:

- Child session van tao top-level subdirectory sai trong `.hivemind/session-tracker/`.
- Child actions, tool calls, tool results, assistant messages bi mat sau compact/long-haul.
- Main `.md` co the bi re-initialize va xoa body da ghi truoc do.
- `unknownSub` van roi vao bootstrap/main capture path va tao root directory sai.
- L2 child co the ghi vao thu muc L1 thay vi root main directory.

## Bang chung RED

Da them `tests/features/session-tracker/runtime-preservation-regressions.test.ts` voi 4 regression tests. Lan chay dau tien RED 4/4:

- `initializeSessionFile()` xoa `## USER`, assistant block, compact block da ton tai.
- `handleChatMessage()` voi `route: "unknownSub"` van goi `ensureSessionReady()`.
- `handleToolExecuteAfter()` voi `kind: "unknownSub"` van goi `ensureSessionReady()`.
- `session.created` cua L2 ghi child `.json` sai vi hierarchy duoc register sau khi ghi file.

## Fix da ap dung

- `src/features/session-tracker/persistence/session-writer.ts`
  - `initializeSessionFile()` bay gio doc file hien co, merge frontmatter, va giu nguyen body content.
  - Loai bo overwrite rong gay mat USER/assistant/compact content.

- `src/features/session-tracker/index.ts`
  - Them `hasMainSessionFile()` de phan biet unknownSub chua co main file voi main session da duoc tao.
  - `unknownSub` chat/tool khong con bootstrap thanh main moi neu chua co `.md`.
  - `unknownSub` cua tool `task` van duoc phep bootstrap vi do la delegation authority cho main session lazy path.

- `src/features/session-tracker/capture/event-capture.ts`
  - `writeImmediateChildFile()` register hierarchy truoc khi goi `childWriter.createChildFile()`.
  - L2 co rootMain resolved truoc khi ghi, nen child `.json` nam duoi root main directory.
  - Delegation depth tinh tu hierarchy neu co, fallback ve 1.

- `src/features/session-tracker/recovery/session-recovery.ts`
  - `rebuildSessionContext()` bay gio append root-owned child `.json` context vao `fileContent`.
  - Child `turns`, `journey`, va `lastMessage` duoc render thanh markdown recovery context.
  - Dieu nay chan mat context sau compact/resume khi main `.md` chi co compact marker nhung child data nam trong `.json`.

## Fix dong bo sau audit toan module

- Root cause thuc te: OpenCode SDK khong emit `chat.message` / `tool.execute.after` hooks cho subagent sessions. Child update pipeline co ton tai nhung activation-dead trong runtime.
- `src/features/session-tracker/capture/tool-capture.ts`
  - Parent `task` result bay gio parse `<task_result>...</task_result>` hoac payload sau `task_id`.
  - Child `.json` duoc append real assistant turn, `journey` type `assistant_message`, `lastMessage`, va status `completed` khi co result.
  - Dispatch-only output chi co `task_id` van giu behavior cu.
- `src/features/session-tracker/tool-delegation.ts`
  - Nested child task delegation (L1 -> L2) dung cung parent-capture strategy de khong mat L2 result.
  - L2 duoc nest dung duoi L1 trong `session-continuity.json` bang `parentSessionID` argument.
- `src/features/session-tracker/initialization.ts` va `index.ts`
  - `ChildWriteRetryQueue` duoc wire vao runtime `ChildWriter`, flush on init, va periodic flush moi 30s.
  - `cleanup()` clear periodic interval.
- `src/features/session-tracker/capture/event-capture.ts`
  - Lifecycle status routing dung SDK -> hierarchy -> pending fallback.
  - Child status update ghi vao child `.json`, root-owned `session-continuity.json`, va `hierarchy-manifest.json` dong bo.
  - Immediate child write cap nhat them `session-continuity.json` va `project-continuity.json` de tranh JSON/manifest/index diverge.
  - Gate 0 chi auto-map pending khi co dung 1 pending dispatch; nhieu pending thi cho authoritative task result.
- `src/features/session-tracker/index.ts`
  - Fork child-copy khong chay cho delegation children da nam trong hierarchy index, tranh tao child root directory sai.
  - `unknownSub` task khong tao root dir moi tru khi SDK xac nhan do la root session (`parentID: null`).
- `src/features/session-tracker/recovery/session-recovery.ts`
  - Recovery doc duoc child session IDs trong `project-continuity.json` bang root-owned child `.json`, khong con gia dinh moi session deu co `{sessionID}.md`.

## Verification

- `npx vitest run tests/features/session-tracker/runtime-preservation-regressions.test.ts` -> 10/10 pass.
- `npx vitest run tests/features/session-tracker/` -> 418/418 pass, 44/44 files.
- `npx tsc --noEmit` -> pass, no output.
- `npx vitest run` -> 2221 pass, 2 skipped, 5 failed, 1 failed suite. The failures match unrelated pre-existing areas: steering-engine missing module, plugin event observer export/mock mismatch, bootstrap tool registration mock mismatch, execute-slash-command API expectation mismatch.

## Rủi ro con lai

- Fix nay da pin recovery cua root-owned child `.json` va parent task-result capture, nhung runtime live compact/resume van can UAT bang mot long-haul session that de xac nhan OpenCode task output format khop voi parser.
- Full suite van co 5 failures + 1 failed suite unrelated ngoai session-tracker; khong duoc tinh la CP-ST-06 regression moi.
