# Technology Stack

**Analysis Date:** 2026-03-21

## Languages

**Primary:**
- TypeScript 5.3+ - All source code under `src/`, ES2022 target

**Secondary:**
- JavaScript - Test files, build output, CLI entrypoints
- JSX (React) - Dashboard/TUI components via `@opentui/react`

## Runtime

**Environment:**
- Node.js >=20.0.0 (per `package.json` `engines`)
- ESM-only project (`"type": "module"` in `package.json`)

**Package Manager:**
- npm (with workspaces support for `apps/*`)

## Frameworks

**Core:**
- OpenCode Plugin SDK (`@opencode-ai/plugin`) >=1.1.0 - Plugin hooks and tool definitions
- OpenCode SDK (`@opencode-ai/sdk`) ^1.2.27 - Client/server runtime creation

**CLI & TUI:**
- Ink ^6.8.0 - React-like TUI rendering
- `@opentui/core` ^0.1.88 - TUI renderer
- `@opentui/react` ^0.1.88 - React components for TUI
- React ^19.2.4 - UI components (peer dependency)

**Build/Dev:**
- TypeScript ^5.3.0 - Language
- tsx ^4.7.0 - Test runner with ESM support

## Key Dependencies

**Critical:**
- `zod` ^4.3.6 - Schema validation for tool args (`tool.schema`)
- `yaml` ^2.8.2 - Configuration parsing
- `magic-string` ^0.30.21 - Source code manipulation
- `proper-lockfile` ^4.1.2 - File locking for concurrent access
- `@json-render/core` ^0.14.1 - JSON rendering utilities

**Infrastructure:**
- `@clack/prompts` ^1.0.0 - CLI prompts
- `@z_ai/coding-helper` ^0.0.7 - Coding assistance utilities
- `ignore` ^7.0.5 - Gitignore-style pattern matching
- `remark` ^15.0.1 - Markdown processing
- `unist-util-visit` ^5.1.0 - AST visitor for markdown
- `web-tree-sitter` ^0.26.5 - Tree-sitter bindings for code parsing

## Configuration

**TypeScript:**
- Config: `tsconfig.json`
- Target: ES2022
- Module: NodeNext (ESM)
- Strict mode enabled
- JSX: react-jsx with `@opentui/react` import source

**Build:**
- Output: `dist/`
- Source maps enabled
- Declaration files generated
- Executable CLI: `dist/cli.js`

**Project Structure:**
- Workspace: `apps/*` for opentui
- Main entry: `dist/index.js`
- Plugin entry: `dist/plugin/opencode-plugin.js`

## Platform Requirements

**Development:**
- Node.js 18.x or 20.x (tested in CI)
- npm for dependency management

**Production:**
- Node.js >=20.0.0
- OpenCode runtime environment (for plugin hooks to function)

## Tool Definitions

All custom tools use `tool.schema` (Zod-based) for argument validation:
- Located in `src/tools/*/tools.ts`
- Pattern: `tool({ description, args: {...}, execute })`

## Layer Architecture

| Layer | Location | Technology |
|-------|----------|------------|
| Plugin | `src/plugin/` | OpenCode Plugin SDK |
| Hooks | `src/hooks/` | OpenCode Plugin SDK (read-side) |
| Tools | `src/tools/` | OpenCode Plugin Tool SDK |
| SDK Supervisor | `src/sdk-supervisor/` | OpenCode SDK |
| Schema Kernel | `src/schema-kernel/` | OpenCode SDK |
| Control Plane | `src/control-plane/` | OpenCode SDK |
| CLI | `src/cli.ts` | Node.js native |

---

*Stack analysis: 2026-03-21*
