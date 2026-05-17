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

## Verification

- `npx vitest run tests/features/session-tracker/runtime-preservation-regressions.test.ts` -> 5/5 pass.
- `npx vitest run tests/features/session-tracker/` -> 413/413 pass, 44/44 files.
- `npx tsc --noEmit` -> pass, no output.
- `npx vitest run` -> 2216 pass, 5 failed, 1 failed suite. The failures match unrelated pre-existing areas: steering-engine missing module, plugin event observer export/mock mismatch, bootstrap tool registration mock mismatch, execute-slash-command API expectation mismatch.

## Rủi ro con lai

- Fix nay da pin recovery cua root-owned child `.json`, nhung runtime live compact/resume van can UAT bang mot long-haul session that de xac nhan OpenCode hook event shapes khop voi test harness.
- Full suite van co 5 failures + 1 failed suite unrelated ngoai session-tracker; khong duoc tinh la CP-ST-06 regression moi.
