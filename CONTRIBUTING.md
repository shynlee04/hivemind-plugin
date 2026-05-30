<!-- generated-by: gsd-doc-writer -->

# Contributing to Hivemind

> **Hướng dẫn đóng góp cho dự án Hivemind — Runtime composition engine cho OpenCode platform.**
> English + Vietnamese bilingual guide.

Cảm ơn bạn đã quan tâm đến việc đóng góp cho Hivemind! Tài liệu này cung cấp hướng dẫn và quy tắc cho người đóng góp.

Thank you for your interest in contributing to Hivemind! This document provides guidelines and rules for contributors.

## Quy tắc ứng xử / Code of Conduct

Tham gia dự án này đồng nghĩa với việc bạn đồng ý duy trì một môi trường tôn trọng và hòa nhập cho tất cả mọi người. Vui lòng đọc [quy tắc ứng xử](CODE_OF_CONDUCT.md) trước khi đóng góp.

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

> **Note:** No `CODE_OF_CONDUCT.md` file exists yet in this repository. Contributors are expected to act professionally and respectfully.

## Cách đóng góp / How to Contribute

### Báo cáo lỗi / Reporting Bugs

1. Kiểm tra [issues hiện tại](https://github.com/shynlee04/hivemind-plugin/issues) trước
2. Tạo issue mới với:
   - Tiêu đề rõ ràng, mô tả đầy đủ
   - Các bước tái hiện lỗi
   - Hành vi mong đợi vs thực tế
   - Phiên bản Node.js, HĐH, phiên bản OpenCode

1. Check existing [issues](https://github.com/shynlee04/hivemind-plugin/issues) first
2. Create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Node.js version, OS, OpenCode version

### Đề xuất tính năng / Suggesting Features

Mở issue với nhãn `feature-request`. Bao gồm:
- Phát biểu vấn đề (khoảng trống nào cần lấp đầy?)
- Giải pháp đề xuất
- Cách nó phù hợp với kiến trúc CQRS và 9-surface model của Hivemind

Open an issue with the `feature-request` label. Include:
- Problem statement (what gap does this fill?)
- Proposed solution
- How it fits Hivemind's CQRS architecture and 9-surface model

### Pull Request

1. Fork repository
2. Tạo nhánh feature: `git checkout -b feat/your-feature`
3. Thực hiện thay đổi theo [Code Style](#code-style) bên dưới
4. Chạy kiểm tra: `npm run typecheck && npm test`
5. Commit theo định dạng: `type(scope): mô tả — lý do`
6. Push và mở Pull Request

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes following [Code Style](#code-style) guidelines
4. Run checks: `npm run typecheck && npm test`
5. Commit with format: `type(scope): description — why`
6. Push and open a PR

## Thiết lập môi trường phát triển / Development Setup

### Yêu cầu / Prerequisites

- **Node.js >= 20.0.0** (kiểm tra trong `package.json` `engines` field)
- **npm** (đi kèm với Node.js)
- **Git**

### Các bước / Steps

```bash
# 1. Clone repository
git clone https://github.com/shynlee04/hivemind-plugin.git
cd hivemind-plugin

# 2. Cài đặt dependencies
npm install

# 3. Build project
npm run build        # clean → sync-assets → tsc → generate-config-schema

# 4. Kiểm tra type
npm run typecheck

# 5. Chạy test
npm test             # 245 test files, 2961 tests (as of v0.1.0)
```

> **Note:** `npm run build` chạy tự động `node scripts/sync-assets.js` để đồng bộ primitives từ `assets/` → `.opencode/`, sau đó compile TypeScript và generate JSON schema cho configs.

## Coding Standards

Hivemind follows strict TypeScript patterns documented in `docs/architecture/overview.md` and enforced by CI gates:

### TypeScript Configuration

| Setting | Value | Enforced |
|---------|-------|----------|
| `strict` | `true` | ✅ |
| `noUnusedLocals` | `true` | ✅ |
| `noUnusedParameters` | `true` | ✅ |
| `noImplicitReturns` | `true` | ✅ |
| `noFallthroughCasesInSwitch` | `true` | ✅ |
| `verbatimModuleSyntax` | `true` (use `import type` for type-only) | ✅ |
| `target` | `ES2022` | ✅ |
| `module` / `moduleResolution` | `NodeNext` | ✅ |

### Architecture Rules (Non-Negotiable)

- **No circular dependencies** — `src/shared/types.ts` is the root leaf; max dependency chain depth is 2 levels
- **Max module size: 500 LOC** — `src/plugin.ts` (~664 LOC) is the acknowledged exception
- **`[Harness]` prefix** on all thrown errors
- **No `any` types** on new code
- **Deep-clone-on-read** in continuity store — prevent mutation aliasing
- **CQRS enforced**: Tools = write-side (state mutation), Hooks = read-side (observation only)
- **Dual-layer state**: durable JSON file (`src/task-management/continuity/`) + in-memory Maps (`src/shared/state.ts`)
- **State root separation**: `.hivemind/` for runtime state, `.opencode/` for OpenCode primitives only (see [Q6 decision](docs/architecture/overview.md#quyết-định-kiến-trúc--validation-decisions-q1q6))

### Code Style Enforcement

- ESLint: Check for `.eslintrc*` or `eslint.config.*` — run via `npm run lint` if available
- Prettier (recommended): Format code before committing
- `.editorconfig` present — IDE should auto-load settings

### Testing Standards

- **Framework**: Vitest (`vitest` v4 with globals — `describe`, `it`, `expect` no imports needed)
- **Test location**: `tests/` directory, mirroring `src/` structure (`tests/lib/`, `tests/tools/`)
- **Runtime**: 245 test files, 2961 passing tests, 2 skipped (as of v0.1.0)
- **Always type-check before committing**: `npm run typecheck`
- **Coverage thresholds** (from `vitest.config.ts`):

| Type | Threshold |
|------|-----------|
| Statements | 75% |
| Branches | 62% |
| Functions | 80% |
| Lines | 77% |

- Run specific tests:
  ```bash
  npx vitest run tests/lib/helpers.test.ts        # Single file
  npx vitest run -t "test name"                    # By test name pattern
  npm run test:coverage                            # With coverage report
  ```

## Quy ước commit / Commit Conventions

Hivemind sử dụng **Conventional Commits** với định dạng mở rộng:

Hivemind uses **Conventional Commits** with an extended format:

```
type(scope): description — why
```

**Types (loại commit):** `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `discuss`, `check`

**Scope (phạm vi):** `tools`, `hooks`, `lib`, `schema`, `cli`, `docs`, `plugin`, `coordination`, `continuity`

**Ví dụ / Examples from git log:**

```
feat(tools): add delegation timeout override — prevents orphaned sessions
fix(lib): deep-clone continuity reads — mutation aliasing caused stale state
test(hooks): add auto-loop boundary tests — coverage gap in session hooks
refactor(trajectory): remove unused ledger parameter and fix rawArgs typing
docs(architecture): update component diagram — added 4 new hook factories
chore: update session tracking, workflow states, and add project continuity summary
```

## Quy trình Pull Request / PR Process

1. **Branch naming**: `feat/your-feature`, `fix/issue-description`, `refactor/module-name`
2. **Atomic commits**: One logical change = one commit. Do not bundle unrelated changes. Every commit must pass typecheck + tests.
3. **Before submitting**:
   - `npm run typecheck` — must pass with zero errors
   - `npm test` — all tests must pass
   - Verify no new circular dependencies introduced
4. **PR description** should include:
   - What changed and why
   - Related issues (if any)
   - How it was tested
   - Screenshots/evidence for UI or CLI changes
5. **Review**: At least one maintainer review required before merge
6. **Merge**: Squash merge preferred (clean history on main branch)

## Cấu trúc dự án / Project Structure

```
src/
├── plugin.ts                  # Composition root (~664 LOC) — zero business logic
├── index.ts                   # Public API re-exports
├── coordination/              # Delegation orchestration & concurrency
├── task-management/           # Session state, continuity, journal, trajectory
├── features/                  # Standalone runtime capabilities (10+ features)
├── hooks/                     # Event hooks (read-side CQRS) — 8 factories
├── tools/                     # Custom tools (write-side CQRS) — 23 tools
├── routing/                   # Session entry classification & profiles
├── config/                    # Config subscriber, compiler, workflow
├── schema-kernel/             # Zod validation schemas (~20 files)
├── shared/                    # Leaf utilities, types, SDK wrappers
├── sidecar/                   # Read-only state projection (GUI sidecar)
└── cli/                       # CLI substrate for programmatic dispatch

tests/                         # 245 test files mirroring src/
docs/                          # Architecture, configuration, deployment docs
.opencode/                     # Deployed OpenCode primitives (auto-synced)
.hivemind/                     # Runtime state persistence (Q6 canonical root)
assets/                        # Source of truth for shipped primitives
```

## Câu hỏi? / Questions?

- Mở [issue](https://github.com/shynlee04/hivemind-plugin/issues) hoặc [discussion](https://github.com/shynlee04/hivemind-plugin/discussions)
- Xem thêm: [README.md](README.md) | [ARCHITECTURE.md](docs/architecture/overview.md) | [DEVELOPMENT.md](docs/development/development.md)

<!-- VERIFY: GitHub discussions URL — confirm if discussions are enabled for this repository -->
