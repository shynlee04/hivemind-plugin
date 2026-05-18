---
phase: CP-DT-01
wave: 7
artifact: research
date: 2026-05-18
status: draft-ready
evidence_level: L4 source inspection + L5 synthesis
validated_versions:
  - '@opencode-ai/sdk: 1.15.4'
  - '@opencode-ai/plugin: 1.15.4'
---

# CP-DT-01 Wave 7 Research — OpenCode Runtime Orchestration

## Cau hoi nghien cuu

Wave 7 can tra loi 4 cau hoi thuc thi:

- `delegate-task` co the dispatch child session that bang SDK nao?
- Co API nao de dua progress/result ve TUI hoac parent prompt khong?
- Co signal nao de biet child session da executed tool/action khong?
- Phan nao can runtime UAT vi unit test khong du?

## SDK dispatch da xac minh

Version local: `@opencode-ai/sdk@1.15.4`.

SDK path da dung trong Wave 6:

- `session.create({ body: { parentID, title }, query: { directory } })` tao child session co parent.
- `session.promptAsync({ path: { id }, body: { agent, parts, tools } })` queue prompt vao child session.
- `promptAsync` chi la accepted/queued signal. No khong tu chung minh child session da goi tool, da doc file, hay da tra result.

Ket luan: duong dispatch SDK la kha thi, nhung can lop monitoring doc event/message/tool state rieng.

## TUI va parent notification APIs

SDK local co `Tui` client trong `node_modules/@opencode-ai/sdk/dist/gen/sdk.gen.d.ts`:

- `tui.appendPrompt(...)`: append prompt vao TUI.
- `tui.showToast(...)`: hien toast notification.
- `tui.publish(...)`: publish TUI event.

Types local co endpoint:

- `/tui/append-prompt`
- `/tui/show-toast`
- `/tui/publish`
- `/tui/submit-prompt`

Ket luan: notification ve main UX la kha thi tren SDK 1.15.4, nhung phai wrapper hoa trong `src/shared/session-api.ts` hoac mot TUI notification adapter rieng. Khong nen goi SDK thang trong deep modules neu da co session-api seam.

## Event va execution signals

SDK co event subscription surface:

- `event.subscribe(...)` tra Server-Sent Events stream.
- Type declarations co TUI events nhu `tui.prompt.append`, `tui.toast.show`.

Session test that chi cho thay status polling, khong cho thay child tool/action stream. Vi vay Wave 7 can nghien cuu/implement signal collector theo thu tu uu tien:

1. Event stream signal neu OpenCode expose `message.updated`, `tool.execute.after`, hoac tuong duong trong runtime event feed.
2. Child session message listing/inspection neu SDK expose message list/detail.
3. Fallback persisted delegation heartbeat/action metadata do plugin hook thu thap.

Khong duoc dung `promptAsync accepted` lam proof execution.

## Hien trang codebase theo subagent audit

Subagent `gsd-codebase-mapper` bao cao:

- `src/coordination/delegation/sdk-child-session-starter.ts` la entry SDK child session moi.
- `src/coordination/delegation/coordinator.ts` da tao dispatch path nhung notification route chua deliver ve parent.
- `src/coordination/delegation/monitor.ts` co polling/escalation model, nhung plugin wire `inject` dang no-op.
- `src/tools/delegation/delegation-status.ts` co mismatch voi session test: user/tool ky vong action `get`, schema hien tai la `status|list|control`.
- `src/coordination/delegation/slot-manager.ts` co default 10, can test nhieu parent session.
- Legacy overlap can cleanup: `manager-runtime.ts`, `sdk-delegation/handler.ts`, notification router, session tracker pending dispatch.

## Dieu can lam ro bang runtime UAT

Unit tests co the cover:

- SDK client method calls.
- State transitions.
- Threshold scheduler.
- Notification adapter calls.
- Persistence resume records.

Unit tests khong the cover day du:

- child session co that su bat dau goi tool/action trong OpenCode TUI;
- `tui.appendPrompt` co hien dung parent prompt khong;
- toast co hien dung TUI khong;
- parent endstream/compact xong van nhan result khong;
- restart/redirect/continue completed task co dung child session context khong.

Vi vay Wave 7 acceptance phai yeu cau L1/L2 runtime proof rieng sau khi implement.

## 3 huong giai quyet

1. SDK-only minimal: them child session starter va status polling. Huong nay da lam mot phan o Wave 6. Khong du vi khong co first-action proof, injection, result delivery.
2. Event-driven orchestration: dung SDK event stream/tool-message events lam source of truth, scheduler chi la fallback. Day la huong tot nhat neu OpenCode event feed du tin hieu.
3. Polling-first orchestration: poll session/messages theo cadence, dung `tui.appendPrompt/showToast` de bao parent. Day la huong an toan hon neu event stream khong expose du tool/action signals.

Khuyen nghi: ket hop 2 va 3. Event stream la fast path cho execution signal; polling la portable fallback. Cach nay phu hop harness vi runtime phai chay tren nhieu project/OpenCode state khac nhau va khong duoc fail cung khi mot signal source thieu.

## Ket luan research

OpenCode SDK 1.15.4 co du surface de tiep tuc Wave 7: child session dispatch, TUI append prompt, TUI toast, va event subscription. Gap khong con la "khong co API"; gap la Hivemind chua co execution-signal collector, parent notification adapter, result extractor, va compact-survival loop duoc test/validated.
