<!-- generated-by: gsd-doc-writer -->

# Triển khai / Deployment

> **Hướng dẫn xuất bản gói npm `hivemind` — English + Vietnamese bilingual guide.**

Hivemind được phân phối dưới dạng **gói npm** (`hivemind`). "Triển khai" đồng nghĩa với việc xuất bản lên npm registry để các dự án OpenCode có thể cài đặt và sử dụng như một plugin.

Hivemind is distributed as an **npm package** (`hivemind`). "Deployment" means publishing to the npm registry so OpenCode projects can install and consume it as a plugin.

> **Note:** Hivemind is a library and runtime plugin — it runs **within** the OpenCode process. There is no server to deploy, no database to provision, and no infrastructure to manage. No `Dockerfile`, `docker-compose.yml`, `vercel.json`, `netlify.toml`, `fly.toml`, or `railway.json` present.

## Mục tiêu triển khai / Deployment Targets

| Target | Mechanism | Config Reference |
|--------|-----------|-----------------|
| **npm registry** | `npm publish` | `package.json` `files` field, `prepack` hook |
| **OpenCode project** | `npm install hivemind` | Plugin entry in `.opencode/plugins/` |
| **Container / platform** | Not applicable | No Docker or cloud platform configs |

## Gói xuất bản / Published Package Surface

Trường `files` trong `package.json` giới hạn nội dung được xuất bản:

The `package.json` `files` field limits published content to:

```json
["dist", "bin", "assets", ".hivemind/configs.schema.json"]
```

| Directory / File | Purpose |
|------------------|---------|
| `dist/` | Compiled TypeScript output (`.js`, `.d.ts`, `.js.map`) |
| `bin/` | CLI entry (`hivemind.cjs`) |
| `assets/` | Source-of-truth for shipped OpenCode primitives (skills, agents, commands) |
| `.hivemind/configs.schema.json` | Generated JSON Schema for runtime configuration validation |

Source files (`src/`), tests (`tests/`), development configs, and `.opencode/` are excluded from the published tarball.

### Entrypoints của gói / Package Entrypoints

| Import path | Exported file | Consumer |
|-------------|---------------|----------|
| `hivemind` | `dist/index.js` | Public API re-exports |
| `hivemind/plugin` | `dist/plugin.js` | OpenCode plugin loader |
| `hivemind/cli` | `dist/cli/index.js` | CLI dispatch |

### CLI Binary

Defined in `package.json` `bin`:

```json
"bin": {
  "hivemind": "./bin/hivemind.cjs"
}
```

## Pipeline xây dựng / Build Pipeline

### Build địa phương / Local Build

Script `build` trong `package.json` thực hiện 4 bước:

The build script in `package.json` executes 4 steps:

```bash
npm run build
# Step-by-step equivalent:
# 1. npm run clean           → Xóa dist/
# 2. node scripts/sync-assets.js  → Đồng bộ assets/ → .opencode/
# 3. tsc                     → Compile TypeScript src/ → dist/
# 4. node dist/schema-kernel/generate-config-json-schema.js → Tạo JSON schema cho configs
```

**Chi tiết từng bước / Step details:**

| Step | Command | Purpose |
|------|---------|---------|
| 1. Clean | `node -e "rmSync('dist', {recursive:true,force:true})"` | Xóa thư mục `dist/` hoàn toàn |
| 2. Sync assets | `node scripts/sync-assets.js` | Sao chép primitives từ `assets/` → `.opencode/` (backup user-modified files trước) |
| 3. Compile | `tsc` | TypeScript compiler (`target: ES2022`, `module: NodeNext`, strict mode) |
| 4. Gen schema | `node dist/schema-kernel/generate-config-json-schema.js` | Tạo `.hivemind/configs.schema.json` từ Zod schemas |

### Prepack Hook

`prepack` lifecycle hook tự động chạy `npm run build` trước khi `npm pack` hoặc `npm publish`:

The `prepack` lifecycle hook automatically runs `npm run build` before `npm pack` or `npm publish`:

```json
"scripts": {
  "prepack": "npm run build"
}
```

### Yêu cầu build / Build requirements

| Requirement | Value |
|-------------|-------|
| **Node.js** | `>=20.0.0` (from `package.json` `engines`) |
| **TypeScript** | `^5.0.0` (devDependency) |
| **Build target** | ES2022 |
| **Module resolution** | NodeNext |
| **Module system** | ESM (`"type": "module"` in `package.json`) |

## Quản lý phiên bản / Version Management

Phiên bản hiện tại được quản lý thủ công trong `package.json`:

Current version is managed manually in `package.json`:

```
"version": "0.1.0"
```

**Chính sách phiên bản / Versioning policy:**

- **Pre-v1.0** (`0.x.x`): Breaking changes expected. Minor version bumps for feature additions, patch for bug fixes.
- **v1.0+** (future): Semantic Versioning (`major.minor.patch`):
  - `major`: Breaking API or behavior changes
  - `minor`: New features, backward-compatible
  - `patch`: Bug fixes, backward-compatible

Không có công cụ tự động (như `standard-version`, `changesets`, `semantic-release`) được phát hiện trong cấu hình — việc bump phiên bản là thủ công.

No automated tooling (e.g., `standard-version`, `changesets`, `semantic-release`) detected in configuration — version bumps are manual.

## Xuất bản / Publishing

### Các bước thủ công / Manual Steps

```bash
# 1. Kiểm tra trạng thái
git status                    # Ensure clean working tree
git log --oneline -5         # Review recent commits

# 2. Bump phiên bản (thủ công)
# Sửa "version" trong package.json

# 3. Commit bump
git add package.json
git commit -m "chore: bump version to X.Y.Z — release notes"

# 4. Tag
git tag vX.Y.Z

# 5. Build và kiểm tra
npm install
npm run typecheck
npm test

# 6. Xuất bản (prepack chạy build tự động)
npm publish

# 7. Push tag
git push origin vX.Y.Z
git push origin main
```

### Xác thực npm / npm Authentication

Yêu cầu tài khoản npm có quyền publish cho gói `hivemind`:

An npm account with publish access to the `hivemind` package is required:

```bash
npm login                     # Interactive login
# OR use NPM_TOKEN:
npm config set //registry.npmjs.org/:_authToken ${NPM_TOKEN}
```

<!-- VERIFY: The npm token, registry URL, and package ownership are managed outside the repository. Confirm who has publish access to the `hivemind` package. -->

## CI/CD

Hiện tại không có pipeline CI/CD tự động cho build, test, hoặc publish gói `hivemind`.

No automated CI/CD pipeline exists for building, testing, or publishing the `hivemind` package.

Các GitHub workflows hiện tại (`opencode.yml`, `qwen-dispatch.yml`, `qwen-triage.yml`, `qwen-invoke.yml`, `qwen-scheduled-triage.yml`) phục vụ tương tác cộng đồng và QA automation — không có workflow nào chứa `npm test`, `npm run build`, hoặc `npm publish`.

The existing GitHub workflows (`opencode.yml`, `qwen-dispatch.yml`, `qwen-triage.yml`, `qwen-invoke.yml`, `qwen-scheduled-triage.yml`) serve community-engagement and QA automation — none contain `npm test`, `npm run build`, or `npm publish` steps.

<!-- VERIFY: An npm publish workflow may exist as a separate repository action, GitHub environment, or external CI service not captured in this codebase. -->

## Quy trình rollback / Rollback Procedure

Vì "triển khai" là xuất bản lên npm, rollback tuân theo quy trình npm tiêu chuẩn:

Since "deployment" means publishing to the npm registry, rollback follows standard npm practices:

1. **Xác định phiên bản ổn định trước đó**:
   ```bash
   npm view hivemind versions
   ```

2. **Deprecate phiên bản bị lỗi** (khuyến nghị):
   ```bash
   npm deprecate hivemind@<broken-version> "Rolled back due to ..."
   ```

3. **Xuất bản bản sửa lỗi** với version bump patch:
   ```bash
   # Fix the issue → commit → bump patch version → publish
   npm version patch
   npm publish
   ```

4. **Cho consumer projects**: Downgrade:
   ```bash
   npm install hivemind@<previous-version>
   ```

> **Note:** npm typically does not allow republishing the exact same version. Always bump the version for fixes.

Không cần rollback server hay infrastructure — không có server, container, hoặc cloud deployment nào cần revert.

No server or infrastructure rollback is needed — there are no servers, containers, or cloud deployments to revert.

## Giám sát / Monitoring

Hivemind không bao gồm tích hợp monitoring bên thứ ba. Không có `@sentry/*`, `dd-trace`, `newrelic`, hoặc `@opentelemetry/*` trong dependencies.

The harness does not include third-party monitoring integrations. No `@sentry/*`, `dd-trace`, `newrelic`, or `@opentelemetry/*` packages are present in `package.json`.

### Chẩn đoán tích hợp sẵn / Built-in Diagnostics

| Tool | Purpose |
|------|---------|
| `hivemind-sdk-supervisor` | Inspect SDK wrapper health, heartbeat, bounded diagnostics, and readiness |
| `hivemind-pressure` | Classify runtime pressure, detect pure control-plane outcomes |
| `hivemind-trajectory` | Inspect and update the execution trajectory ledger |
| `session-journal-export` | Export bounded Session Journal and Execution Lineage as JSON/Markdown |

Runtime state được persist tại `.hivemind/state/`:

Runtime state is persisted to `.hivemind/state/`:

| File | What to monitor |
|------|-----------------|
| `session-continuity.json` | Session lifecycle state, delegation records, budget usage |
| `checkpoints.json` | Compaction checkpoints for long-running sessions |

### Logging

Sử dụng console logging với prefix `[Harness]` cho tất cả errors:

Uses console logging with `[Harness]` prefix for all thrown errors. Integrate `.hivemind/state/` persistence files with external monitoring tools as needed.

<!-- VERIFY: External monitoring dashboard URLs, alert webhook endpoints, and production-specific logging configurations are managed by individual consumer deployments, not by this package. -->

## Phụ thuộc khi chạy / Runtime Dependencies for Consumers

Sau khi cài đặt `hivemind`, consumer project cần:

After installing `hivemind`, the consumer project needs:

1. **Cài đặt / Install:**
   ```bash
   npm install hivemind
   ```

2. **Build:**
   ```bash
   npm run build
   ```

3. **Plugin entry** trong `.opencode/plugins/harness.ts`:
   ```ts
   export { HarnessControlPlane as default } from "hivemind/plugin"
   ```

4. **Peer dependency:** `@opencode-ai/plugin` >= 1.15.10
5. **Optional dependency:** `bun-pty` >= 0.4.8 (PTY-backed background commands; falls back to `node:child_process`)

## Tài liệu tham khảo / References

- [Package.json](../../package.json) — full build scripts and configuration
- [Architecture Overview](../architecture/overview.md) — plugin composition and 9-surface model
- [Configuration — Environment Variables](../configuration/settings.md) — runtime configuration
- [README.md](../../README.md) — quick start and usage
<!-- VERIFY: Verify the latest published version at https://www.npmjs.com/package/hivemind -->
