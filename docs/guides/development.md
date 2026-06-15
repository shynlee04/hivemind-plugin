<!-- generated-by: gsd-doc-writer -->

# Hướng dẫn phát triển / Development Guide

Hướng dẫn này dành cho các nhà phát triển muốn đóng góp vào Hivemind — thiết lập môi trường, hiểu cấu trúc mã nguồn, tuân thủ quy tắc code style, và quy trình gửi PR.

This guide is for developers contributing to Hivemind — environment setup, understanding the source layout, following code style conventions, and the PR process.

---

## Thiết lập môi trường / Local Setup

### 1. Yêu cầu tiên quyết / Prerequisites

| Dependency | Version | Ghi chú / Notes |
|------------|---------|----------------|
| **Node.js** | `>= 20.0.0` | ES2022 target, NodeNext module resolution |
| **npm** | `>= 10.0.0` | Bundled with Node 20 |
| **OpenCode** | `>= 1.15.0` | Plugin host — peer dependency (`@opencode-ai/plugin`) |
| **TypeScript** | `>= 5.0.0` | Dev dependency |

```bash
node --version   # Must be >= 20.0.0
npm --version    # Must be >= 10.0.0
```

### 2. Fork và Clone

```bash
git clone https://github.com/shynlee04/hivemind-plugin.git
cd hivemind-plugin
```

Nếu bạn có quyền truy cập vào private repository:
If you have access to the private repository:

```bash
git clone https://github.com/shynlee04/hivemind-plugin-private.git
cd hivemind-plugin-private
```

### 3. Cài đặt dependencies

```bash
npm install
npm run build    # Build lần đầu để kiểm tra môi trường
```

Không cần biến môi trường cho phát triển local. Runtime policy mặc định được hardcode trong `src/shared/runtime-policy.ts`. Để biết thêm về cấu hình runtime, xem [Configuration](../configuration/settings.md).

No environment variables are required for local development. Runtime policies fall back to hardcoded defaults in `src/shared/runtime-policy.ts`. For runtime overrides, see [Configuration](../configuration/settings.md).

### 4. Xác minh

```bash
npm test              # Toàn bộ test suite — 2,963 tests
npm run typecheck     # TSC không emit
npm run build         # Build sạch, không lỗi
```

---

## Pipeline Build / Build Commands

| Command | Description / Mô tả |
|---------|---------------------|
| `npm run clean` | Remove `dist/` output directory |
| `npm run build` | Build pipeline đầy đủ: `clean` → `node scripts/sync-assets.js` (sync primitives) → `tsc` (compile) → `node dist/schema-kernel/generate-config-json-schema.js` (generate JSON Schema) |
| `npm run typecheck` | `tsc --noEmit` — kiểm tra kiểu không emit |
| `npm test` | `vitest run` — chạy toàn bộ test suite |
| `npm run test:watch` | `vitest` — chạy test ở chế độ watch |
| `npm run test:coverage` | `vitest run --coverage` — báo cáo coverage |
| `npm run postinstall` | `node scripts/sync-assets.js --mode=install` — sync primitives sau khi cài đặt |
| `npm run prepack` | `npm run build` — chạy tự động trước `npm pack` / `npm publish` |

Chi tiết pipeline build (từ `package.json` scripts):

```
npm run build
  ├── npm run clean
  │     └── rm -rf dist/                     # Dọn sạch thư mục build cũ
  ├── node scripts/sync-assets.js            # Đồng bộ primitives từ assets/ → .opencode/
  ├── tsc                                    # TypeScript compiler → dist/
  └── node dist/schema-kernel/generate-config-json-schema.js
        └── Tạo .hivemind/configs.schema.json  # JSON Schema cho IDE
```

**Important:** `npm run build` đồng thời chạy `sync-assets.js` để đồng bộ agents, skills, commands từ `assets/` (source-of-truth) sang `.opencode/` (deployed copy). Nếu bạn sửa primitives trong `.opencode/`, chúng sẽ bị ghi đè ở lần build tiếp theo. Luôn sửa trong `assets/`.

---

## Cấu trúc dự án / Project Structure

```
hivemind-plugin-private/
├── src/                          # Hard Harness — mã nguồn TypeScript chính (npm package)
│   ├── plugin.ts                 # Composition root (~664 LOC) — OpenCode plugin entry point
│   ├── index.ts                  # Public API re-exports — HarnessControlPlane + modules
│   ├── coordination/             # Điều phối ủy quyền & kiểm soát đồng thời
│   │   ├── delegation/           #   DelegationManager, coordinator, dispatcher, lifecycle...
│   │   ├── completion/           #   Dual-signal completion detection
│   │   ├── concurrency/          #   Keyed semaphore queue
│   │   ├── spawner/              #   Session creation, auto-loop, ralph-loop
│   │   ├── command-delegation/   #   Slash command delegation
│   │   └── sdk-delegation/       #   SDK child session delegation
│   ├── task-management/          # Session state, continuity, journal, trajectory
│   │   ├── continuity/           #   Durable JSON persistence I/O (session-continuity.json)
│   │   ├── journal/              #   Append-only event timeline
│   │   ├── trajectory/           #   Execution lineage ledger
│   │   └── lifecycle/            #   Task lifecycle state machine
│   ├── hooks/                    # Event hook factories — read-side CQRS
│   │   ├── lifecycle/            #   Core lifecycle, session hooks
│   │   ├── guards/               #   Tool execution guardrails
│   │   ├── observers/            #   Event observers (delegation, session entry/tracker)
│   │   ├── transforms/           #   Tool input/output transforms
│   │   └── composition/          #   CQRS boundary classification
│   ├── tools/                    # Custom tool implementations — write-side CQRS (23 tools)
│   │   ├── delegation/           #   delegate-task, delegation-status
│   │   ├── session/              #   execute-slash-command, session-patch, session-tracker...
│   │   ├── config/               #   configure-primitive, bootstrap-init/recover...
│   │   ├── hivemind/             #   hivemind-doc, trajectory, pressure, command-engine...
│   │   └── prompt/               #   prompt-skim, prompt-analyze
│   ├── features/                 # Standalone runtime capabilities
│   │   ├── session-tracker/      #   Session event tracking & recovery
│   │   ├── auto-loop/            #   Automatic task loop
│   │   ├── background-command/   #   PTY command execution
│   │   ├── doc-intelligence/     #   Document querying (skim, read, chunk, search)
│   │   ├── runtime-pressure/     #   Runtime pressure monitoring
│   │   ├── sdk-supervisor/       #   SDK wrapper diagnostics
│   │   ├── agent-work-contracts/ #   Agent work contract persistence
│   │   └── bootstrap/            #   Primitive registry, control plane
│   ├── shared/                   # Leaf utilities, types, SDK wrappers
│   │   ├── session-api.ts        #   Typed OpenCode SDK wrappers
│   │   ├── types.ts              #   Shared type definitions (leaf module)
│   │   ├── state.ts              #   In-memory state Maps
│   │   ├── helpers.ts            #   Pure utility functions
│   │   ├── runtime-policy.ts     #   Runtime policy loading
│   │   ├── security/             #   Path scope validation, data redaction
│   │   └── errors/               #   Error type definitions
│   ├── routing/                  # Session entry classification & behavioral profile
│   │   ├── session-entry/        #   Purpose classifier, intake gate
│   │   ├── behavioral-profile/   #   Profile resolution
│   │   └── command-engine/       #   Command bundle discovery
│   ├── config/                   # Config subscriber, compiler, workflow
│   ├── schema-kernel/            # Zod v4 validation schemas (~20 schema files)
│   ├── sidecar/                  # Read-only state projection (GUI sidecar)
│   └── cli/                      # CLI substrate (init, doctor, recover commands)
│
├── tests/                        # ~245 test files mirroring src/
│   ├── lib/                      #   Unit tests for src/ modules (~56 files)
│   ├── tools/                    #   Tool-level tests (~26 files)
│   ├── hooks/                    #   Hook factory tests (~19 files)
│   ├── integration/              #   Cross-module integration tests (~13 files)
│   ├── features/                 #   Feature-specific tests
│   ├── schema-kernel/            #   Zod schema tests
│   ├── cli/                      #   CLI tests
│   └── coordination/             #   Coordination module tests
├── eval/                         # Stability, coherence, correctness evaluations
├── assets/                       # SOURCE OF TRUTH cho shipped primitives
├── .opencode/                    # DEPLOYED primitives (agents, skills, commands)
│   ├── agents/                   #   89+ agents (33 GSD + 31 hm-* + 11 hf-* + 14 others)
│   ├── skills/                   #   34 non-GSD skills + 67 GSD skills
│   ├── commands/                 #   19 slash commands
│   └── plugins/                  #   Plugin loaders
├── .hivemind/                    # Internal runtime state (gitignored per Q6)
│   └── state/                    #   Session continuity, delegation records
├── .hivefiver-meta-builder/      # Meta-authoring lab for primitives
├── .planning/                    # Governance, architecture, research artifacts
├── docs/                         # Documentation (philosophy, architecture, guides)
│   ├── architecture/overview.md  #   System architecture (CQRS, component diagram)
│   ├── configuration/settings.md #   Configuration reference
│   └── guides/                   #   Development, testing, getting-started guides
├── bin/                          # CLI entry point (hivemind.cjs)
└── scripts/                      # Build and utility scripts (sync-assets.js)
```

**Giải thích / Rationale:**

- **`src/`** — Hard Harness: npm package chứa toàn bộ runtime engine. Plugin composition root ở `plugin.ts`, mọi business logic đều nằm trong các module con.
- **`tests/`** — Test files mirror cấu trúc `src/` giúp dễ tìm test file tương ứng. 245 test files, 2,963 tests pass.
- **`assets/` → `scripts/sync-assets.js` → `.opencode/`** — Pipeline đồng bộ primitives từ source-of-truth sang deployment. Không bao giờ sửa trực tiếp trong `.opencode/`.
- **`.hivemind/`** — Internal runtime state (journals, lineage, delegations) — gitignored. Không bao giờ lưu runtime state trong `.opencode/`.

---

## Quy tắc code / Code Style

### TypeScript Configuration (`tsconfig.json`)

| Setting | Value | Mô tả / Description |
|---------|-------|---------------------|
| `target` | `ES2022` | ECMAScript 2022 output |
| `module` / `moduleResolution` | `NodeNext` | ESM module resolution |
| `strict` | `true` | TypeScript strict mode |
| `noUnusedLocals` | `true` | Lỗi khi có biến local không dùng |
| `noUnusedParameters` | `true` | Lỗi khi có tham số không dùng |
| `noImplicitReturns` | `true` | Yêu cầu return ở mọi nhánh |
| `noFallthroughCasesInSwitch` | `true` | Cấm fallthrough trong switch |
| `verbatimModuleSyntax` | `true` | Bắt buộc `import type` cho type-only imports |
| `declaration` / `declarationMap` | `true` | Tạo `.d.ts` + `.d.ts.map` |
| `sourceMap` | `true` | Tạo `.js.map` cho debugging |

### Quy ước chính / Key Conventions

1. **`[Harness]` prefix** trên mọi thrown error — giúp xác định nguồn gốc lỗi trong OpenCode runtime:
   ```typescript
   throw new Error(`[Harness] Delegation failed for session ${sessionId}`)
   ```

2. **Không dùng `any` trên code mới** — ngoại lệ đã biết: `client: any` trong `plugin.ts` do SDK opaque typing.

3. **`verbatimModuleSyntax: true`** — bắt buộc dùng `import type` cho type-only imports:
   ```typescript
   // ✅ Đúng
   import type { SessionContinuityRecord } from "./types.js"
   import { helpers } from "./helpers.js"

   // ❌ Sai — sẽ báo lỗi compile
   import { SessionContinuityRecord, helpers } from "./types.js"
   ```

4. **Deep-clone-on-read** trong continuity store — mọi read operation trả về cloned object để ngăn mutation aliasing:
   ```typescript
   // src/task-management/continuity/index.ts
   const record = structuredClone(this.store.get(sessionId))
   ```

5. **CQRS separation** — Tools mutate state (write-side), hooks observe events (read-side):
   - Hook không bao giờ tự mutation state
   - `src/hooks/composition/cqrs-boundary.ts` phân loại và thực thi ranh giới này
   - `assertHookWriteBoundary()` ngăn hook thực hiện write operations

6. **Max module size: 500 LOC** — modules được theo dõi và tách nhỏ khi vượt ngưỡng. `plugin.ts` (~664 LOC) là ngoại lệ do là composition root.

7. **No circular dependencies** — `src/shared/types.ts` là leaf module (không import từ project nào khác). Max dependency chain: 2 levels.

---

## Quy tắc kiến trúc / Architecture Rules

Tất cả thay đổi code phải tuân thủ những quy tắc kiến trúc bất di bất dịch sau:

All code changes must respect these non-negotiable architecture rules (full details in [Architecture Overview](../architecture/overview.md)):

### 1. Dependency Rules (Non-Negotiable)

```
src/shared/types.ts  →  leaf module (zero project-internal imports)
src/shared/helpers.ts  →  near-leaf (pure utilities, no src/ imports)
src/shared/*  →  strictly leaf — no module in shared/ imports from other src/ directories

Max chain depth: 2 levels
  types.ts → module_A → module_B  ✅ (OK)
  types.ts → A → B → C            ❌ (vượt quá 2 levels)
```

### 2. Module Size Rule

**Max 500 LOC per module.** Khi một module vượt quá 500 dòng, phải tách submodules:

- `src/coordination/delegation/` — ban đầu là một `delegation-manager.ts` lớn (~735 LOC), đã được tách thành ~20 submodules (manager, coordinator, dispatcher, lifecycle, monitor, agent-resolver, v.v.)
- `src/plugin.ts` (~664 LOC) — composition root, là ngoại lệ duy nhất

### 3. CQRS Boundary

| Surface | Location | Quyền / Authority | Mô tả |
|---------|----------|-------------------|-------|
| **Tools** | `src/tools/` | Write (mutate state) | Nhận input → validate Zod → mutation → trả kết quả |
| **Hooks** | `src/hooks/` | Read (observe events) | Quan sát event → route đến lifecycle manager. Không bao giờ tự mutation |

### 4. Dual-Layer State

| Layer | Location | Mục đích / Purpose |
|-------|----------|-------------------|
| **Durable JSON** | `src/task-management/continuity/` → `.hivemind/state/session-continuity.json` | Source of truth for long-term state |
| **In-Memory Maps** | `src/shared/state.ts` | Fast read/write cho current session state, flushed at checkpoints |

### 5. Error Handling

- **`[Harness]` prefix** trên tất cả thrown errors
- Custom error types cho các failure mode cụ thể
- Error context bao gồm session ID và delegation ID khi có
- Graceful degradation cho optional dependencies (ví dụ: `bun-pty` fallback về `node:child_process`)

### 6. Source-of-Truth Model for Primitives

```
Source:  assets/                   → AUTHOR primitives here
Author:  .hivefiver-meta-builder/  → Meta-authoring lab before reflection
Deploy:  .opencode/                → Synced via scripts/sync-assets.js
Tooling: .opencode/get-shit-done/  → GSD developer tooling (NOT shipped)
```

**Không bao giờ develop trực tiếp trong `.opencode/`.** Nếu `.opencode/` bị xóa, chạy `npm run build` (hoặc `node scripts/sync-assets.js`) để tái tạo.

---

## Kiểm thử / Testing

Chi tiết đầy đủ tại [Testing Guide](testing.md). Tóm tắt các lệnh chính:

Full details in the [Testing Guide](testing.md). Summary of key commands:

```bash
# Chạy toàn bộ test suite
npm test

# Chạy một file test cụ thể
npx vitest run tests/lib/helpers.test.ts

# Chạy test theo tên
npx vitest run -t "isObject returns false for null"

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

**Yêu cầu bắt buộc trước khi commit / Required before committing:**

```bash
npm run typecheck    # Type-check — must pass
npm run build        # Build — must compile cleanly
npm test             # Full suite — 2,963 tests must pass
```

---

## Commit Conventions / Quy ước Commit

Dự án sử dụng **conventional commit style** với các loại (type) chính:

This project uses **conventional commit style** with the following types:

| Type | Scope | Ví dụ / Example |
|------|-------|----------------|
| `feat` | New feature | `feat(39-08): enable execute-slash-command in child sessions and prevent recursive subtasks` |
| `fix` | Bug fix | `fix(39-06): correct PUBLIC_PATHS — exclude .opencode/ entirely` |
| `refactor` | Code restructuring | `refactor(trajectory): remove unused ledger parameter and fix rawArgs typing` |
| `test` | Test changes | `test(39-01): add TIMEOUT_30S constant for bootstrap/doctor test reliability` |
| `docs` | Documentation | `docs(39): final phase summary — 10 plans executed, 19 test failures → 0, sync-oss fixed` |
| `chore` | Maintenance | `chore: update session tracking, workflow states, and add project continuity summary report` |

**Quy tắc commit / Commit Rules:**

1. **Atomic commits** — one logical change = one commit. Không gộp nhiều thay đổi không liên quan vào một commit.
2. **Mô tả rõ "tại sao"** — message giải thích lý do thay đổi, không chỉ mô tả "cái gì" đã thay đổi.
3. **Phase prefix** — GSD-style phase prefix cũng được chấp nhận: `phase: what changed — why it matters`.
4. **Tất cả test phải pass** — trước khi commit, chạy `npm test`, `npm run typecheck`, `npm run build`.

---

## Quy trình PR / PR Process

Hiện tại chưa có Pull Request template (`.github/PULL_REQUEST_TEMPLATE.md`). Khi submit PR:

There is currently no Pull Request template (`.github/PULL_REQUEST_TEMPLATE.md`). When submitting a PR:

1. **Branch naming:**
   - `feature/<description>` — tính năng mới
   - `fix/<description>` — sửa lỗi
   - `refactor/<description>` — tái cấu trúc
   - `docs/<description>` — tài liệu

2. **Trước khi push:**
   - `npm run typecheck` — must pass
   - `npm run build` — must compile cleanly
   - `npm test` — must pass (2,963 tests)
   - `npm run test:coverage` — verify thresholds được duy trì

3. **Mô tả PR:**
   - Nêu rõ thay đổi là gì và tại sao
   - Link đến phase plan hoặc issue liên quan nếu có
   - Liệt kê các breaking changes (nếu có)

4. **Xử lý review:**
   - Respond với từng feedback
   - Atomic fix commits cho mỗi thay đổi review
   - Rebase trước khi merge: `git rebase master`

---

## Các bước tiếp theo / Next Steps

- **Kiến trúc hệ thống**: Xem sơ đồ component, luồng dữ liệu, và ranh giới CQRS trong [Architecture Overview](../architecture/overview.md)
- **Cấu hình**: Tìm hiểu về biến môi trường, runtime policy, và config trong [Configuration](../configuration/settings.md)
- **Kiểm thử**: Chi tiết về test framework, coverage thresholds, và CI integration trong [Testing Guide](testing.md)
- **Bắt đầu**: Hướng dẫn cài đặt và sử dụng cơ bản trong [Getting Started](getting-started.md)
- **Đóng góp**: Xem [CONTRIBUTING.md](../../CONTRIBUTING.md) cho code of conduct và hướng dẫn đóng góp
