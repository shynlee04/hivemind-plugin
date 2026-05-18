# CP-DT-01-08 Surgical Remediation Plan
> Ngày: 2026-05-19 | Phase: CP-DT-01 | Phases trước: SR-04→SR-10, CP-DT-01 G1-G10
> Approach: Incremental waves — từng batch verify typecheck + tests

## Mục tiêu

Dọn rác (category/safetyCeiling/classifications) + thêm missing features (completion detection, TUI notification, progressive thresholds, resume/chain) qua 8 wave tuần tự, mỗi wave có verification gate.

## Evidence Sources

- Session `ses_1c44`: Live test — delegation-status KHÔNG trả output, control actions fail
- Session `ses_1c50`: Live test — delegate-task dispatch OK, nhưng KHÔNG có TUI notification khi complete
- Grep audit: 33 source files + 29 test files nhiễm rác params
- Test suite: 6 files fail, 13 tests fail, typecheck sạch

---

## Wave A: Dọn rác (category/safetyCeiling/classifications)

### Wave A.1: Xóa 2 files + plugin import [CRITICAL]

**Xóa hoàn toàn:**
- `src/coordination/delegation/category-gates.ts` — 21 rác refs, toàn bộ file là category gate logic
- `src/coordination/delegation/category-gate-audit.ts` — 3 rác refs, audit cho category gates

**Sửa:**
- `src/plugin.ts` — xóa import `recordCategoryGateask`, xóa registration option

**Verify:** `npm run typecheck` clean

### Wave A.2: Dọn types + runtime-policy + dispatcher [CRITICAL]

**Sửa:**
- `src/coordination/delegation/types.ts` — xóa `category?: DelegationCategory`, `safetyCeilingMs?: number`, `CategoryInput`, `CategoryDecision` types
- `src/shared/types.ts` — xóa `category?:` fields (3 locations), `DelegationCategory` enum/type, `CategoryGatePolicy` refs
- `src/shared/runtime-policy.ts` — xóa 16 category policy refs, `DEFAULT_CATEGORY_GATE_POLICY`
- `src/coordination/delegation/dispatcher.ts` — xóa 16 category gate refs, `resolveCategoryGateDecision` call

**Verify:** `npm run typecheck` clean

### Wave A.3: Dọn manager + state-machine [HIGH]

**Sửa:**
- `src/coordination/delegation/manager-runtime.ts` — xóa 22 rác refs (LARGEST file)
- `src/coordination/delegation/manager.ts` — xóa 3 category refs
- `src/coordination/delegation/state-machine.ts` — xóa 2 safetyCeiling logic, thay bằng spec thresholds

**Verify:** `npm run typecheck` clean, delegation-manager tests pass

### Wave A.4: Dọn remaining files [MEDIUM]

**Sửa (1-8 refs mỗi file):**
- `src/features/bootstrap/cross-primitive-validator.ts` — 13 refs
- `src/tools/delegation/delegate-task.ts` — 7 refs (xóa category param)
- `src/coordination/spawner/spawn-request-builder.ts` — 7 refs
- `src/coordination/concurrency/queue.ts` — 6 refs (category queue key)
- `src/features/prompt-packet/kernel-packet.ts` — 3 refs
- `src/features/prompt-packet/compaction-preservation.ts` — 3 refs
- `src/coordination/delegation/agent-resolver.ts` — 3 refs
- `src/task-management/lifecycle/index.ts` — 2 refs
- `src/shared/helpers.ts` — 2 refs
- `src/coordination/command-delegation/handler.ts` — 2 refs
- `src/tools/hivemind/run-background-command.ts` — 1 ref
- `src/tools/delegation/delegation-status.ts` — 1 ref
- `src/task-management/continuity/index.ts` — 1 ref
- `src/task-management/continuity/delegation-persistence.ts` — 1 ref
- `src/shared/security/redaction.ts` — 1 ref
- `src/routing/session-entry/language-resolution.ts` — 1 ref
- `src/hooks/lifecycle/session-hooks.ts` — 1 ref
- `src/hooks/guards/tool-guard-hooks.ts` — 1 ref
- `src/features/bootstrap/primitive-registry.ts` — 1 ref
- `src/features/bootstrap/control-plane/gatekeeper.ts` — 1 ref
- `src/coordination/spawner/spawner-types.ts` — 1 ref
- `src/coordination/spawner/concurrency-key.ts` — 1 ref
- `src/coordination/delegation/sdk-child-session-starter.ts` — 1 ref

**Verify:** `npm run typecheck` clean, full test suite pass (hoặc chỉ còn pre-existing failures)

---

## Wave B: Thêm missing features

### Wave B.1: Completion Detector [CRITICAL]

**Tạo mới:**
- `src/coordination/delegation/completion-detector.ts`
  - 3 điều kiện: (1) Tools >1 phút không activity, (2) Assistant last message tồn tại, (3) File changes detected
  - Dùng `session.messages()` parse `Message[]` và `Part[]`
- `tests/lib/coordination/delegation/completion-detector.test.ts`

**Verify:** New tests pass, typecheck clean

### Wave B.2: Notification Formatter + TUI Append [HIGH]

**Tạo mới:**
- `src/coordination/delegation/notification-formatter.ts`
  - Format system notification block khi delegate hoàn thành
  - Format: `[DT:{id}] ✅ Complete | {elapsed}s | tools={t} | agent={name}`

**Sửa:**
- `src/coordination/delegation/notification-router.ts` — thêm TUI system message append:
  - Live delegation → `tui.prompt.append` event
  - Ended delegation → `session.prompt({ noReply: true })`

**Verify:** New tests pass, typecheck clean

### Wave B.3: Progressive Escalation Thresholds [HIGH]

**Sửa:**
- `src/coordination/delegation/escalation-timer.ts` — sửa thresholds:
  - 60s → WARN (inject warning)
  - 120s → NUDGE (inject stronger)
  - 180s → ALERT (inject alert)
  - 300s → TERMINATE (mark failure, stop injection)
  - 600s → final fail callback
- `src/coordination/delegation/monitor.ts` — tích hợp progressive injection với thresholds đúng

**Verify:** Escalation tests pass, typecheck clean

### Wave B.4: Control Actions + Resume/Chain [HIGH]

**Sửa:**
- `src/tools/delegation/delegation-status.ts` — thêm control actions:
  - `abort` — terminate running delegation
  - `cancel` — graceful cancel
  - `restart` — re-dispatch with same params
  - `resume` → `session.promptAsync()` với cùng session ID
  - `chain` → prompt mới vào existing session
- `src/coordination/delegation/coordinator.ts` — resume/chain support

**Verify:** Control action tests pass, typecheck clean

---

## Wave C: Fix tests

### C.1: Update test refs for Wave A changes
- 29 test files cần update để remove category refs
- Prioritize: `delegation-manager.test.ts` (65 refs), `dispatcher.test.ts` (21 refs), `cross-primitive-validator.test.ts` (14 refs)
- Fix 5 failing delegation-manager tests
- Fix escalation-timer test

### C.2: Fix remaining test failures
- `tests/features/steering-engine/injection-builder.test.ts` — 1 failure
- `tests/plugin/bootstrap-tools-registration.test.ts` — 2 failures
- `tests/hooks/plugin-event-observers.test.ts` — 1 failure

---

## Wave D: Final verification

- `npm run typecheck` → clean
- `npm test` → all pass (2341 tests)
- Live UAT via delegate-task tool (L1 proof)
- Session evidence documented

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking changes từ xóa category | Mỗi wave verify typecheck + tests |
| manager-runtime.ts (22 refs) phá vỡ logic | Wave A.3 riêng, test kỹ trước khi proceed |
| Test cascading failures | Wave C riêng, fix sau khi source ổn định |
| Missing SDK API cho TUI append | Validate `EventTuiPromptAppend` exists trước khi implement |

## Success Criteria

1. Zero `category|categoryHint|classifications|safetyCeilingMs|recordCategoryGate` references trong `src/`
2. `category-gates.ts` + `category-gate-audit.ts` deleted
3. Completion detector tạo mới, 3 conditions hoạt động
4. Progressive thresholds 60→120→180→300→600 implemented
5. TUI system notification khi delegation complete
6. Control actions (abort/cancel/restart/resume/chain) hoạt động
7. All tests pass, typecheck clean
