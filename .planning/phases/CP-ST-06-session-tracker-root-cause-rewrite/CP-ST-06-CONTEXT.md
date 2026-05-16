---
phase: CP-ST-06
type: discuss-phase-context
status: locked
created: 2026-05-16
author: hm-l2-scout (subagent)
commits:
  - SPEC.md: 69123c07
  - phase dir: 699029e2
  - CP-ST-05 source: fac96d7a, a5eeebdd
---

# CP-ST-06 Discuss-Phase Context

> Bối cảnh khóa từ discuss-phase. Mọi quyết định dưới đây đã được user xác nhận.
> SOURCE: SPEC.md (69123c07), 5 source files đã đọc, 3 reference docs đã load.

---

## Gray Area Decisions

### GA-1: RC-5 Error Propagation Strategy — Retry Queue

**Vấn đề:** `enqueueWrite()` swallow errors qua `.catch(() => {})`. index.ts catch tất cả handler errors.

**Quyết định:** Retry queue — child writes phải **retry bằng mọi giá**.

**Logic:** Khi child active ghi data, upper levels đã idle. Không có lý do child không thể ghi thành công. Retry queue ghi failed writes để retry khi harness restart hoặc periodic check.

**Triển khai:**
- `enqueueWrite()` throw thay vì swallow
- index.ts catch → ghi vào retry queue (in-memory + persist to disk)
- Retry queue flush trên `initialize()` và periodic (mỗi 30s)
- Max retries = 5, exponential backoff (1s, 2s, 4s, 8s, 16s)
- Sau 5 retries → đánh dấu child session "degraded" + log error

**AC bổ sung:** Mọi child write phải thành công hoặc có retry record. Không silent data loss.

---

### GA-2: RC-1 getDepth() Max Depth — L2

**Vấn đề:** `getDepth()` hard-cap tại L2. SPEC nói "hỗ trợ 3 tầng".

**Quyết định:** Max depth = **L2** (3 tầng: L0+L1+L2).

**Phân loại độ sâu:**
- L0 = main session (directory + `.md`)
- L1 = sub session cấp 1 (`.json` dưới ROOT main dir)
- L2 = sub session cấp 2 (`.json` dưới ROOT main dir)

**Fix tập trung:** `getRootMain()` cho reverse-order registration, KHÔNG thay đổi max depth cap.

**AC bổ sung:** Reverse-order registration (L2→L1→L0) phải resolve đúng root main.

---

### GA-3: RC-6 Test Replacement — Individual Audit

**Vấn đề:** ~30 stale mock tests trong `tests/features/session-tracker/`.

**Quyết định:** **Audit từng test individually**, không xóa hàng loạt.

**Logic:** Nhiều tests có thể test logic còn valid không thuộc RC-1→RC-5. Chỉ rewrite/xóa tests testing dead logic. Tests còn valid cho logic hiện tại → GIỮ.

**Triển khai:**
1. Liệt kê tất cả 30 failing tests
2. Phân loại từng test: (a) tests dead logic → xóa/rewrite, (b) tests valid logic → giữ, (c) tests khác phase → flag cho future
3. Tests mới viết = integration tests dùng real file system (temp dirs), no mocks cho persistence
4. Mỗi RC fix phải có ít nhất 1 integration test verify

**AC bổ sung:** Không xóa test nào mà không ghi rõ lý do trong commit message.

---

### GA-4: index.ts Module Size — Trong Scope

**Vấn đề:** `index.ts` = 1038 LOC, vượt 500 LOC cap.

**Quyết định:** Refactoring nằm **trong scope** CP-ST-06.

**Extract targets (đề xuất, finalize trong plan-phase):**
- `session-router.ts` — handleChatMessage routing logic (main vs child paths)
- `child-recorder.ts` — ensureChildRoute, pollForChildSessions, recordChildTaskDelegation
- `initialization.ts` — initialize(), start(), shutdown() lifecycle methods

**Constraints:**
- Mỗi module mới ≤500 LOC
- index.ts sau extract ≤500 LOC
- Giữ barrel re-export pattern cho backward compatibility
- Không thay đổi public API surface

**AC bổ sung:** `wc -l src/features/session-tracker/index.ts` ≤ 500 sau phase.

---

### GA-5: Parallel Children — Verify bằng Tests

**Vấn đề:** 2+ child sessions delegate đồng thời → có race trên HierarchyIndex?

**Quyết định:** **Document as safe** + **verify bằng integration tests**.

**Logic:** Node.js single-threaded, `registerChild()` = synchronous Map operations. Async interleave chỉ tại await points, registration không có await. Map.set() atomic trong event loop.

**Nhưng:** OpenCode architecture cho phép 2+ sub sessions chạy song song → writer PHẢI handle đúng. Verify bằng:
1. Integration test: tạo 3 children song song từ cùng parent → verify hierarchy correct
2. Integration test: tạo nested parallel (L0→L1a+L1b, L1a→L2a+L2b) → verify all correct
3. Integration test: concurrent writes từ 2 children → verify no data loss

**AC bổ sung:** Parallel child registration phải produce correct hierarchy trong tất cả test cases.

---

## Codebase Context

### Files đã đọc và key findings:

| File | LOC | Root Causes | Key Finding |
|------|-----|-------------|-------------|
| `hierarchy-index.ts` | ~400+ | RC-1 | `getRootMain()` fails cho reverse-order; `getDepth()` caps L2 (confirmed correct) |
| `classification.ts` | ~150 | RC-3 | Clean 3-gate fallback (sdk→hierarchy→pending→none); `gate:"none"` defaults to main |
| `child-writer.ts` | ~300 | RC-4, RC-5 | `enqueueWrite()` lines 139,143 swallow errors; `lastMessage` line 297-299 not captured |
| `session-index-writer.ts` | ~250 | RC-2 | `updateChildStatus()` loses nested hierarchy cho L2+ |
| `index.ts` | 1038 | GA-4 | Orchestrator barrel; 1038 LOC; needs extract |

### References đã load:
- `.opencode/get-shit-done/references/domain-probes.md`
- `.opencode/get-shit-done/references/gate-prompts.md`
- `.opencode/get-shit-done/references/universal-anti-patterns.md`

### Test baseline:
- **2165 passed / 30 failed / 2197 total** (12 test files)
- 30 failing tests mapped to RC-6 (stale mock tests)

---

## Scope Boundaries (Confirmed)

### In Scope:
- RC-1: Fix `getRootMain()` reverse-order registration
- RC-2: Fix `updateChildStatus()` nested hierarchy
- RC-3: Fix `gate:"none"` default to sub instead of main
- RC-4: Fix `lastMessage` capture for all levels
- RC-5: Replace error swallowing with retry queue
- RC-6: Individual audit + selective rewrite of stale tests
- GA-4: Refactor index.ts xuống ≤500 LOC
- GA-5: Add parallel children integration tests
- New integration tests cho mỗi RC fix

### Out of Scope:
- PTY integration
- Orphan quarantine protocol
- Plugin composition changes
- Session recovery overhaul
- GUI sidecar changes

---

## Next Steps

1. **Research validation** — verify 6 root causes against live code với online references
2. **Plan-phase** — `/gsd-plan-phase CP-ST-06` → PLAN.md files theo waves
3. **Plan verification** — validate plan quality trước execute
4. **Execute** — TDD implementation theo verified plan
5. **Full verification** — `npm test` + `npm run typecheck` + LOC checks
