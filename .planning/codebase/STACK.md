# Technology Stack

**Analysis Date:** 2026-03-21

## Languages

**Primary:**
- TypeScript - main implementation language across `src/**/*.ts`, plugin assembly in `src/plugin/opencode-plugin.ts`, control plane in `src/control-plane/sdk-runtime.ts`, and CLI entry in `src/cli.ts`

**Secondary:**
- TSX - terminal UI views in `src/tui/Dashboard.tsx`, `src/tui/client.ts`, and `apps/opentui/src/main.tsx`
- JavaScript / CommonJS - utility and legacy-support scripts in `bin/hivemind-tools.cjs` and `get-shit-done/bin/lib/*.cjs`
- Markdown / YAML - shipped command, skill, workflow, and documentation assets in `commands/**`, `skills/**`, `workflows/**`, and parsed registry content in `src/shared/opencode-agent-registry.ts` and `src/shared/opencode-skill-registry.ts`

## Runtime

**Environment:**
- Node.js `>=20.0.0` required by `package.json`
- ES module runtime with NodeNext resolution in `package.json` and `tsconfig.json`

**Package Manager:**
- npm - primary package manager driven by `package-lock.json`, install/test/build scripts in `package.json`, and CI in `.github/workflows/ci.yml`
- Bun - secondary workspace-local runtime for `apps/opentui/package.json`; lockfile present at `.opencode/bun.lock`
- Lockfile: present (`package-lock.json` at repo root)

## Frameworks

**Core:**
- OpenCode Plugin SDK (`@opencode-ai/plugin`) - in-agent plugin surface and hook/tool registration in `src/plugin/opencode-plugin.ts` and `src/tools/runtime/tools.ts`
- OpenCode SDK (`@opencode-ai/sdk`) - out-of-agent runtime creation and attachment in `src/control-plane/sdk-runtime.ts` and live sanity coverage in `tests/runtime-authority-live-sanity.test.ts`
- Zod (`zod`) - schema and contract validation in `src/shared/contracts/runtime-status.ts`, `src/delegation/delegation-record.schema.ts`, and `src/features/agent-work-contract/schema/*.ts`

**Testing:**
- Node test runner via `tsx --test` - wired in `package.json` (`npm test`) and exercised across `tests/*.test.ts`

**Build/Dev:**
- TypeScript compiler (`tsc`) - compile/typecheck pipeline in `package.json` and config in `tsconfig.json`
- TSX (`tsx`) - test runner and TypeScript execution in `package.json`
- GitHub Actions - CI and release automation in `.github/workflows/ci.yml`, `.github/workflows/dev-v3.yml`, and `.github/workflows/publish.yml`
- OpenTUI + React (`@opentui/react`, `react`) - terminal UI layer in `src/tui/client.ts`, `src/tui/Dashboard.tsx`, and `apps/opentui/src/main.tsx`
- Ink (`ink`) - dependency declared in `package.json` for terminal UI support alongside OpenTUI surfaces
- Remark (`remark`) - markdown parsing in `src/intelligence/doc/formats/md.ts`
- YAML (`yaml`) - frontmatter and runtime export parsing in `src/shared/opencode-agent-registry.ts`, `src/shared/opencode-skill-registry.ts`, and `src/features/runtime-entry/turn-output.ts`
- web-tree-sitter - pinned in `package.json` and overridden for OpenTUI compatibility there

## Key Dependencies

**Critical:**
- `@opencode-ai/plugin` - package's shipped plugin contract; exported through `package.json` (`./plugin`) and implemented in `src/plugin/opencode-plugin.ts`
- `@opencode-ai/sdk` - managed/attached runtime authority and event client integration in `src/control-plane/sdk-runtime.ts`, `src/tui/sse.ts`, and `tests/runtime-authority-live-sanity.test.ts`
- `zod` - runtime contract validation for status, delegation, and agent-work records in `src/shared/contracts/runtime-status.ts` and `src/features/agent-work-contract/schema/*.ts`
- `yaml` - required to project root `agents/**` and `skills/**` into `.opencode/**` mirrors via `src/shared/opencode-agent-registry.ts`, `src/shared/opencode-skill-registry.ts`, and `src/features/runtime-observability/sync.ts`

**Infrastructure:**
- `@clack/prompts` - interactive CLI intake dependency declared in `package.json`
- `proper-lockfile` - filesystem locking dependency declared in `package.json`
- `remark` + `unist-util-visit` - markdown intelligence pipeline in `src/intelligence/doc/formats/md.ts`
- `@opentui/core` / `@opentui/react` / `react` - TUI rendering stack in `apps/opentui/package.json` and `src/tui/client.ts`
- `ignore` and `magic-string` - repo utility dependencies declared in `package.json`

## Configuration

**Environment:**
- OpenCode provider config lives in `opencode.json`; current repo config references `MINIMAX_API_KEY` for the `minimax` provider and customizes `openai` model limits there
- OpenCode server attachment falls back to `OPENCODE_SERVER_URL` in `src/features/runtime-entry/harness.ts`
- Debug logging is gated by `HIVEMIND_DEBUG` in `src/shared/logging.ts`
- A root `.env` file exists at `.env`; contents were not read

**Build:**
- TypeScript build config: `tsconfig.json`
- npm scripts and package metadata: `package.json`
- Runtime/plugin config: `opencode.json`
- CI/release config: `.github/workflows/ci.yml`, `.github/workflows/dev-v3.yml`, `.github/workflows/publish.yml`

## Platform Requirements

**Development:**
- OpenCode must already be installed for bootstrap flows per `docs/guide/installation.md`
- Node 20+ and npm are required by `package.json`; Bun is additionally required only for `apps/opentui/package.json`
- Repo expects writable local runtime surfaces under `.hivemind/**` and `.opencode/**` as created by `src/features/runtime-entry/init.handler.ts` and `src/features/runtime-observability/sync.ts`

**Production:**
- Primary distribution target is the npm package `hivemind-context-governance` published from `package.json` and `.github/workflows/publish.yml`
- Runtime target is an OpenCode-managed or attached server lifecycle, created through `src/control-plane/sdk-runtime.ts` and consumed by the plugin export in `src/plugin/index.ts`

---

*Stack analysis: 2026-03-21*
