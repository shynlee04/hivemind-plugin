---
sessionID: ses_17a9b399affeN0ZfKPoFe41t9L
created: 2026-06-01T22:53:54.836Z
updated: 2026-06-01T22:53:54.836Z
parentSessionID: null
delegationDepth: 0
children:
  - sessionID: ses_17a9974bfffeNpS3PQAB9FFKIR
    childFile: ses_17a9974bfffeNpS3PQAB9FFKIR.json
continuityIndex: session-continuity.json
status: completed
title: null
lastMessage: >-
  Tôi đã có bức tranh toàn cảnh. Hãy để tôi phân tích cho bạn một cách trung
  thực nhất.


  ---


  ## Phân Tích: Fork vs. Tự Viết — TMUX Integration


  ### 1. opencode-tmux thực sự phức tạp như thế nào?


  **932 LOC source (6 files)** + **1,820 LOC test (6 files)**. Nó KHÔNG phải là
  một repo "đơn giản 200 dòng" như cảm giác ban đầu. 


  | File | LOC | Chức năng |

  |------|-----|-----------|

  | `tmux.ts` | 346 | Multiplexer: 6 CLI commands, shell quoting, PaneState
  parsing, layout re-apply |

  | `session-manager.ts` | 307 | 5 interlocking state sets (sessions,
  spawningSessions, spawnedSessions, closedSessions, pendingClose), race
  condition handling |

  | `grid-planner.ts` | 120 | DFS tree→split-command, 500ms debounce |

  | `config.ts` | 90 | Config loader, merge 3 levels |

  | `index.ts` | 41 | Plugin entry |

  | `util.ts` | 28 | Logger |


  **Phần irreducible là `tmux.ts` + `session-manager.ts`** — logic race
  condition idle-trong-khi-spawn, dedup guard, respawn guard không thể nén dưới
  ~500 LOC.


  ### 2. Sự thật phũ phàng: Fork KHÔNG hoạt động với Hivemind


  Đây là CRITICAL FINDING mà audit đã phát hiện:


  ```

  opencode-tmux/src/index.ts:41 — CHỈ export default OpencodeTmux plugin
  function

  SessionManager (L24), TmuxMultiplexer (L11), PaneGridPlanner — closure-private

  → KHÔNG có cách nào để fork gọi được setForkSessionManager() của Hivemind

  ```


  Hivemind có:

  - `fork-bridge.ts` (138 LOC) — type mirrors + DI singleton, **zero tmux
  logic**

  - `integration.ts` (191 LOC) — factory, binary detection

  - `observers.ts` (93 LOC) — event decoration

  - `tmux-copilot.ts` (189 LOC) — **orphan tool, không được register**


  **Tổng cộng 611 LOC scaffolding trống rỗng** — không có tmux operations thực
  sự.


  Chain bị broken ở 3 chỗ:

  ```

  fork export → chỉ plugin function, không có SessionManager class
                             ↓
                  Hivemind's setForkSessionManager() → KHÔNG BAO GIỜ được gọi
                             ↓
                  tmux-copilot tool → KHÔNG được register trong plugin.ts
  ```


  ### 3. Cost-Benefit: Fork vs. Tự Viết


  | Dimension | Fork | Tự Viết |

  |-----------|------|---------|

  | **Source LOC cần viết** | ~200 LOC (modifications) | ~650-750 LOC (full
  rewrite) |

  | **Architectural fit** | ❌ Mismatch — plugin wrapper vs. direct class | ✅
  Thiết kế đúng cho Hivemind |

  | **Maintenance** | ❌ P45 vendor-sync script (1 phase / month) | ✅ Zero vendor
  dependency |

  | **Test cần viết** | ~0 (fork có sẵn tests) | ~1,200-1,500 LOC |

  | **Deployment** | ❌ npm publish / vendored subfolder / bundle | ✅ Direct
  `src/features/tmux/` |

  | **Export surface** | ❌ closure-private, cần modify fork | ✅ Full control |

  | **Risk** | Thấp (code đã chạy) | Trung bình (cần re-debug race) |


  ### 4. Phán quyết: Instinct của bạn LÀ ĐÚNG


  **Lý do chính: fork không vừa với architecture của Hivemind.**


  ```

  Fork:  OpencodeTmux plugin → return { event: ... }
          → SessionManager là local variable → không export được

  Hivemind cần:  class SessionManager { onSessionCreated(), ... }
                  → import trực tiếp → inject vào DI container
  ```


  Đây không phải là "chúng ta fork để tiết kiệm công" — đây là "chúng ta fork
  một thứ mà architecture không match, và giờ phải maintain sync script, modify
  export surface, và sống với technical debt."


  **Khuyến nghị cụ thể:**


  1. **Giữ nguyên code logic của fork làm reference** — race condition handling
  (session-manager.ts:137-162), shell quoting (tmux.ts:34-36), grid planner
  debounce (grid-planner.ts:81-98) — đây là những pattern đã được debug kỹ


  2. **Viết implementation mới trong `src/features/tmux/`** với architecture
  thẳng:
     - `tmux-multiplexer.ts` — export class, không plugin wrapper
     - `session-manager.ts` — export class, có thể import trực tiếp
     - `integration.ts` (đã có sẵn) — chỉ cần sửa để wire real class thay vì noop
     - `tmux-copilot.ts` (đã có sẵn) — register đúng cách

  3. **Xóa dependency vào fork** — bỏ `opencode-tmux/` khỏi repo root, bỏ P45
  (vendor-sync)


  4. **Timeline thực tế**: ~1 week cho L2 specialist (hf-l2-tool-builder +
  implementer) để:
     - Viết 650-750 LOC source (3 ngày)
     - Viết 1,200-1,500 LOC tests (2 ngày)
     - Wire integration + register tool (1 ngày)
     - Gate verification (1 ngày)

  **Bottom line:** Instinct của bạn đúng. Không phải vì opencode-tmux quá đơn
  giản (932 LOC không hề đơn giản), mà vì architectural mismatch khiến fork
  không mang lại lợi ích tương xứng với maintenance cost. Tự viết sẽ clean hơn,
  chủ động hơn, và mất ~1 week — một khoản đầu tư xứng đáng cho core UX feature.


  Bạn có muốn tôi delegate research để xác nhận estimate này không?
---

## USER (turn 1)

**source:** real-human

need honest answer and broad exploration and understanding of the project and codebase (tracking these 42, 43, 45 and 49) about TMUX integration for OpenCode and Copilot for delegate-task as said in @.planning/seeds/tmux-visual-orchestration-layer-2026-05-31.md  . The question: I have the feeling that since opencode-tmux is not a complex repo why do we have to fork it ? is it better just synthesize and write our own interpretation and make even better integration and not h aving to depend on the fork. The TMUX binary is the installation that needs on the users' machine and we will write the user-guide for llms to help users install at their workspace. So is my instinct any good? Please advice 

### Tool: skill

**Input:**
```json
{
  "name": "hivemind-power-on"
}
```

**Output:** (pruned)
```
# Skill: hivemind-power-on
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_02_NCBMQKiWh8s5euaaNjLN4469"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_00_pA1mQxGrDjylOqBD6SMS5300"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_01_rKgWgMPlNjMyQmg2TCD07844"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_04_yUL3P9Ku9P5EYFjE9wZC6015"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_03_NoRgSLtpVvLZhIZjUSEz8032"
}
```


### Tool: invalid

**Input:**
```json
{
  "callID": "call_00_0jT5NNfhZhYSBqHObJdf2559"
}
```


### Tool: invalid

**Input:**
```json
{
  "callID": "call_01_r486Is4e0vPW2ted9QR25860"
}
```


### Tool: invalid

**Input:**
```json
{
  "callID": "call_02_EG9Ob18dtzfcDr00Ebo45643"
}
```


### Tool: invalid

**Input:**
```json
{
  "callID": "call_03_PmFqLcntu8YbngEmmCyw4545"
}
```


### Tool: hivemind-doc

**Input:**
```json
{
  "callID": "call_00_pbTjuo44gk14WtSqsObw9005"
}
```


### Tool: hivemind-doc

**Input:**
```json
{
  "callID": "call_01_MjZ08iAluLMNuwiJTjDY7697"
}
```


### Tool: hivemind-doc

**Input:**
```json
{
  "callID": "call_02_1SwZkecLhnoYQrMymgk66246"
}
```


### Tool: hivemind-doc

**Input:**
```json
{
  "callID": "call_03_wxTN0GRuI7ttQsJv25Pa0406"
}
```


### Tool: hivemind-doc

**Input:**
```json
{
  "callID": "call_00_zBD0FEoNtPez98QBUgsz3592"
}
```


### Tool: hivemind-doc

**Input:**
```json
{
  "callID": "call_01_BRD020w2lU8iUB0kvX2I5766"
}
```


### Tool: hivemind-doc

**Input:**
```json
{
  "callID": "call_02_xcsKPk6No74wHVXOY9Xt4246"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Research opencode-tmux complexity",
  "subagent_type": "general",
  "task_id": "ses_17a9974bfffeNpS3PQAB9FFKIR"
}
```

**Output:** (pruned)
```
task_id: ses_17a9974bfffeNpS3PQAB9FFKIR
```


## ASSISTANT (turn 1)

Tôi đã có bức tranh toàn cảnh. Hãy để tôi phân tích cho bạn một cách trung thực nhất.

---

## Phân Tích: Fork vs. Tự Viết — TMUX Integration

### 1. opencode-tmux thực sự phức tạp như thế nào?

**932 LOC source (6 files)** + **1,820 LOC test (6 files)**. Nó KHÔNG phải là một repo "đơn giản 200 dòng" như cảm giác ban đầu. 

| File | LOC | Chức năng |
|------|-----|-----------|
| `tmux.ts` | 346 | Multiplexer: 6 CLI commands, shell quoting, PaneState parsing, layout re-apply |
| `session-manager.ts` | 307 | 5 interlocking state sets (sessions, spawningSessions, spawnedSessions, closedSessions, pendingClose), race condition handling |
| `grid-planner.ts` | 120 | DFS tree→split-command, 500ms debounce |
| `config.ts` | 90 | Config loader, merge 3 levels |
| `index.ts` | 41 | Plugin entry |
| `util.ts` | 28 | Logger |

**Phần irreducible là `tmux.ts` + `session-manager.ts`** — logic race condition idle-trong-khi-spawn, dedup guard, respawn guard không thể nén dưới ~500 LOC.

### 2. Sự thật phũ phàng: Fork KHÔNG hoạt động với Hivemind

Đây là CRITICAL FINDING mà audit đã phát hiện:

```
opencode-tmux/src/index.ts:41 — CHỈ export default OpencodeTmux plugin function
SessionManager (L24), TmuxMultiplexer (L11), PaneGridPlanner — closure-private
→ KHÔNG có cách nào để fork gọi được setForkSessionManager() của Hivemind
```

Hivemind có:
- `fork-bridge.ts` (138 LOC) — type mirrors + DI singleton, **zero tmux logic**
- `integration.ts` (191 LOC) — factory, binary detection
- `observers.ts` (93 LOC) — event decoration
- `tmux-copilot.ts` (189 LOC) — **orphan tool, không được register**

**Tổng cộng 611 LOC scaffolding trống rỗng** — không có tmux operations thực sự.

Chain bị broken ở 3 chỗ:
```
fork export → chỉ plugin function, không có SessionManager class
                           ↓
                Hivemind's setForkSessionManager() → KHÔNG BAO GIỜ được gọi
                           ↓
                tmux-copilot tool → KHÔNG được register trong plugin.ts
```

### 3. Cost-Benefit: Fork vs. Tự Viết

| Dimension | Fork | Tự Viết |
|-----------|------|---------|
| **Source LOC cần viết** | ~200 LOC (modifications) | ~650-750 LOC (full rewrite) |
| **Architectural fit** | ❌ Mismatch — plugin wrapper vs. direct class | ✅ Thiết kế đúng cho Hivemind |
| **Maintenance** | ❌ P45 vendor-sync script (1 phase / month) | ✅ Zero vendor dependency |
| **Test cần viết** | ~0 (fork có sẵn tests) | ~1,200-1,500 LOC |
| **Deployment** | ❌ npm publish / vendored subfolder / bundle | ✅ Direct `src/features/tmux/` |
| **Export surface** | ❌ closure-private, cần modify fork | ✅ Full control |
| **Risk** | Thấp (code đã chạy) | Trung bình (cần re-debug race) |

### 4. Phán quyết: Instinct của bạn LÀ ĐÚNG

**Lý do chính: fork không vừa với architecture của Hivemind.**

```
Fork:  OpencodeTmux plugin → return { event: ... }
        → SessionManager là local variable → không export được

Hivemind cần:  class SessionManager { onSessionCreated(), ... }
                → import trực tiếp → inject vào DI container
```

Đây không phải là "chúng ta fork để tiết kiệm công" — đây là "chúng ta fork một thứ mà architecture không match, và giờ phải maintain sync script, modify export surface, và sống với technical debt."

**Khuyến nghị cụ thể:**

1. **Giữ nguyên code logic của fork làm reference** — race condition handling (session-manager.ts:137-162), shell quoting (tmux.ts:34-36), grid planner debounce (grid-planner.ts:81-98) — đây là những pattern đã được debug kỹ

2. **Viết implementation mới trong `src/features/tmux/`** với architecture thẳng:
   - `tmux-multiplexer.ts` — export class, không plugin wrapper
   - `session-manager.ts` — export class, có thể import trực tiếp
   - `integration.ts` (đã có sẵn) — chỉ cần sửa để wire real class thay vì noop
   - `tmux-copilot.ts` (đã có sẵn) — register đúng cách

3. **Xóa dependency vào fork** — bỏ `opencode-tmux/` khỏi repo root, bỏ P45 (vendor-sync)

4. **Timeline thực tế**: ~1 week cho L2 specialist (hf-l2-tool-builder + implementer) để:
   - Viết 650-750 LOC source (3 ngày)
   - Viết 1,200-1,500 LOC tests (2 ngày)
   - Wire integration + register tool (1 ngày)
   - Gate verification (1 ngày)

**Bottom line:** Instinct của bạn đúng. Không phải vì opencode-tmux quá đơn giản (932 LOC không hề đơn giản), mà vì architectural mismatch khiến fork không mang lại lợi ích tương xứng với maintenance cost. Tự viết sẽ clean hơn, chủ động hơn, và mất ~1 week — một khoản đầu tư xứng đáng cho core UX feature.

Bạn có muốn tôi delegate research để xác nhận estimate này không?

## ASSISTANT (turn 1)

Tools: skill

## ASSISTANT (turn 2)

Tools: glob, glob, glob, grep, grep

## ASSISTANT (turn 3)

Tools: invalid, invalid, invalid, invalid

## ASSISTANT (turn 4)

Tôi đã có bức tranh toàn cảnh. Hãy để tôi phân tích cho bạn một cách trung thực nhất.

---

## Phân Tích: Fork vs. Tự Viết — TMUX Integration

### 1. opencode-tmux thực sự phức tạp như thế nào?

**932 LOC source (6 files)** + **1,820 LOC test (6 files)**. Nó KHÔNG phải là một repo "đơn giản 200 dòng" như cảm giác ban đầu. 

| File | LOC | Chức năng |
|------|-----|-----------|
| `tmux.ts` | 346 | Multiplexer: 6 CLI commands, shell quoting, PaneState parsing, layout re-apply |
| `session-manager.ts` | 307 | 5 interlocking state sets (sessions, spawningSessions, spawnedSessions, closedSessions, pendingClose), race condition handling |
| `grid-planner.ts` | 120 | DFS tree→split-command, 500ms debounce |
| `config.ts` | 90 | Config loader, merge 3 levels |
| `index.ts` | 41 | Plugin entry |
| `util.ts` | 28 | Logger |

**Phần irreducible là `tmux.ts` + `session-manager.ts`** — logic race condition idle-trong-khi-spawn, dedup guard, respawn guard không thể nén dưới ~500 LOC.

### 2. Sự thật phũ phàng: Fork KHÔNG hoạt động với Hivemind

Đây là CRITICAL FINDING mà audit đã phát hiện:

```
opencode-tmux/src/index.ts:41 — CHỈ export default OpencodeTmux plugin function
SessionManager (L24), TmuxMultiplexer (L11), PaneGridPlanner — closure-private
→ KHÔNG có cách nào để fork gọi được setForkSessionManager() của Hivemind
```

Hivemind có:
- `fork-bridge.ts` (138 LOC) — type mirrors + DI singleton, **zero tmux logic**
- `integration.ts` (191 LOC) — factory, binary detection
- `observers.ts` (93 LOC) — event decoration
- `tmux-copilot.ts` (189 LOC) — **orphan tool, không được register**

**Tổng cộng 611 LOC scaffolding trống rỗng** — không có tmux operations thực sự.

Chain bị broken ở 3 chỗ:
```
fork export → chỉ plugin function, không có SessionManager class
                           ↓
                Hivemind's setForkSessionManager() → KHÔNG BAO GIỜ được gọi
                           ↓
                tmux-copilot tool → KHÔNG được register trong plugin.ts
```

### 3. Cost-Benefit: Fork vs. Tự Viết

| Dimension | Fork | Tự Viết |
|-----------|------|---------|
| **Source LOC cần viết** | ~200 LOC (modifications) | ~650-750 LOC (full rewrite) |
| **Architectural fit** | ❌ Mismatch — plugin wrapper vs. direct class | ✅ Thiết kế đúng cho Hivemind |
| **Maintenance** | ❌ P45 vendor-sync script (1 phase / month) | ✅ Zero vendor dependency |
| **Test cần viết** | ~0 (fork có sẵn tests) | ~1,200-1,500 LOC |
| **Deployment** | ❌ npm publish / vendored subfolder / bundle | ✅ Direct `src/features/tmux/` |
| **Export surface** | ❌ closure-private, cần modify fork | ✅ Full control |
| **Risk** | Thấp (code đã chạy) | Trung bình (cần re-debug race) |

### 4. Phán quyết: Instinct của bạn LÀ ĐÚNG

**Lý do chính: fork không vừa với architecture của Hivemind.**

```
Fork:  OpencodeTmux plugin → return { event: ... }
        → SessionManager là local variable → không export được

Hivemind cần:  class SessionManager { onSessionCreated(), ... }
                → import trực tiếp → inject vào DI container
```

Đây không phải là "chúng ta fork để tiết kiệm công" — đây là "chúng ta fork một thứ mà architecture không match, và giờ phải maintain sync script, modify export surface, và sống với technical debt."

**Khuyến nghị cụ thể:**

1. **Giữ nguyên code logic của fork làm reference** — race condition handling (session-manager.ts:137-162), shell quoting (tmux.ts:34-36), grid planner debounce (grid-planner.ts:81-98) — đây là những pattern đã được debug kỹ

2. **Viết implementation mới trong `src/features/tmux/`** với architecture thẳng:
   - `tmux-multiplexer.ts` — export class, không plugin wrapper
   - `session-manager.ts` — export class, có thể import trực tiếp
   - `integration.ts` (đã có sẵn) — chỉ cần sửa để wire real class thay vì noop
   - `tmux-copilot.ts` (đã có sẵn) — register đúng cách

3. **Xóa dependency vào fork** — bỏ `opencode-tmux/` khỏi repo root, bỏ P45 (vendor-sync)

4. **Timeline thực tế**: ~1 week cho L2 specialist (hf-l2-tool-builder + implementer) để:
   - Viết 650-750 LOC source (3 ngày)
   - Viết 1,200-1,500 LOC tests (2 ngày)
   - Wire integration + register tool (1 ngày)
   - Gate verification (1 ngày)

**Bottom line:** Instinct của bạn đúng. Không phải vì opencode-tmux quá đơn giản (932 LOC không hề đơn giản), mà vì architectural mismatch khiến fork không mang lại lợi ích tương xứng với maintenance cost. Tự viết sẽ clean hơn, chủ động hơn, và mất ~1 week — một khoản đầu tư xứng đáng cho core UX feature.

Bạn có muốn tôi delegate research để xác nhận estimate này không?

## ASSISTANT (turn 5)

Tôi đã có bức tranh toàn cảnh. Hãy để tôi phân tích cho bạn một cách trung thực nhất.

---

## Phân Tích: Fork vs. Tự Viết — TMUX Integration

### 1. opencode-tmux thực sự phức tạp như thế nào?

**932 LOC source (6 files)** + **1,820 LOC test (6 files)**. Nó KHÔNG phải là một repo "đơn giản 200 dòng" như cảm giác ban đầu. 

| File | LOC | Chức năng |
|------|-----|-----------|
| `tmux.ts` | 346 | Multiplexer: 6 CLI commands, shell quoting, PaneState parsing, layout re-apply |
| `session-manager.ts` | 307 | 5 interlocking state sets (sessions, spawningSessions, spawnedSessions, closedSessions, pendingClose), race condition handling |
| `grid-planner.ts` | 120 | DFS tree→split-command, 500ms debounce |
| `config.ts` | 90 | Config loader, merge 3 levels |
| `index.ts` | 41 | Plugin entry |
| `util.ts` | 28 | Logger |

**Phần irreducible là `tmux.ts` + `session-manager.ts`** — logic race condition idle-trong-khi-spawn, dedup guard, respawn guard không thể nén dưới ~500 LOC.

### 2. Sự thật phũ phàng: Fork KHÔNG hoạt động với Hivemind

Đây là CRITICAL FINDING mà audit đã phát hiện:

```
opencode-tmux/src/index.ts:41 — CHỈ export default OpencodeTmux plugin function
SessionManager (L24), TmuxMultiplexer (L11), PaneGridPlanner — closure-private
→ KHÔNG có cách nào để fork gọi được setForkSessionManager() của Hivemind
```

Hivemind có:
- `fork-bridge.ts` (138 LOC) — type mirrors + DI singleton, **zero tmux logic**
- `integration.ts` (191 LOC) — factory, binary detection
- `observers.ts` (93 LOC) — event decoration
- `tmux-copilot.ts` (189 LOC) — **orphan tool, không được register**

**Tổng cộng 611 LOC scaffolding trống rỗng** — không có tmux operations thực sự.

Chain bị broken ở 3 chỗ:
```
fork export → chỉ plugin function, không có SessionManager class
                           ↓
                Hivemind's setForkSessionManager() → KHÔNG BAO GIỜ được gọi
                           ↓
                tmux-copilot tool → KHÔNG được register trong plugin.ts
```

### 3. Cost-Benefit: Fork vs. Tự Viết

| Dimension | Fork | Tự Viết |
|-----------|------|---------|
| **Source LOC cần viết** | ~200 LOC (modifications) | ~650-750 LOC (full rewrite) |
| **Architectural fit** | ❌ Mismatch — plugin wrapper vs. direct class | ✅ Thiết kế đúng cho Hivemind |
| **Maintenance** | ❌ P45 vendor-sync script (1 phase / month) | ✅ Zero vendor dependency |
| **Test cần viết** | ~0 (fork có sẵn tests) | ~1,200-1,500 LOC |
| **Deployment** | ❌ npm publish / vendored subfolder / bundle | ✅ Direct `src/features/tmux/` |
| **Export surface** | ❌ closure-private, cần modify fork | ✅ Full control |
| **Risk** | Thấp (code đã chạy) | Trung bình (cần re-debug race) |

### 4. Phán quyết: Instinct của bạn LÀ ĐÚNG

**Lý do chính: fork không vừa với architecture của Hivemind.**

```
Fork:  OpencodeTmux plugin → return { event: ... }
        → SessionManager là local variable → không export được

Hivemind cần:  class SessionManager { onSessionCreated(), ... }
                → import trực tiếp → inject vào DI container
```

Đây không phải là "chúng ta fork để tiết kiệm công" — đây là "chúng ta fork một thứ mà architecture không match, và giờ phải maintain sync script, modify export surface, và sống với technical debt."

**Khuyến nghị cụ thể:**

1. **Giữ nguyên code logic của fork làm reference** — race condition handling (session-manager.ts:137-162), shell quoting (tmux.ts:34-36), grid planner debounce (grid-planner.ts:81-98) — đây là những pattern đã được debug kỹ

2. **Viết implementation mới trong `src/features/tmux/`** với architecture thẳng:
   - `tmux-multiplexer.ts` — export class, không plugin wrapper
   - `session-manager.ts` — export class, có thể import trực tiếp
   - `integration.ts` (đã có sẵn) — chỉ cần sửa để wire real class thay vì noop
   - `tmux-copilot.ts` (đã có sẵn) — register đúng cách

3. **Xóa dependency vào fork** — bỏ `opencode-tmux/` khỏi repo root, bỏ P45 (vendor-sync)

4. **Timeline thực tế**: ~1 week cho L2 specialist (hf-l2-tool-builder + implementer) để:
   - Viết 650-750 LOC source (3 ngày)
   - Viết 1,200-1,500 LOC tests (2 ngày)
   - Wire integration + register tool (1 ngày)
   - Gate verification (1 ngày)

**Bottom line:** Instinct của bạn đúng. Không phải vì opencode-tmux quá đơn giản (932 LOC không hề đơn giản), mà vì architectural mismatch khiến fork không mang lại lợi ích tương xứng với maintenance cost. Tự viết sẽ clean hơn, chủ động hơn, và mất ~1 week — một khoản đầu tư xứng đáng cho core UX feature.

Bạn có muốn tôi delegate research để xác nhận estimate này không?
