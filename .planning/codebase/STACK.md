# Technology Stack

**Analysis Date:** 2026-03-21

## Languages

**Primary:**
- TypeScript 5.3.0 - All source code in `src/`, strict mode enabled, compiled to ES2022/NodeNext

**Secondary:**
- JavaScript (ESM) - Compiled output in `dist/`
- JSON - Configuration files (opencode.json, package.json, manifest.json)

## Runtime

**Environment:**
- Node.js >=20.0.0 - Runtime requirement specified in package.json
- ESM (ES Modules) - Package type set to "module"
- Target: ES2022 for compiled output
- Module system: NodeNext with Node16-style resolution

**Package Manager:**
- npm - Primary package manager
- Lockfile: package-lock.json present

## Frameworks

**Core:**
- @opencode-ai/plugin >=1.1.0 - OpenCode plugin framework for tool and hook registration
- @opencode-ai/sdk ^1.2.27 - OpenCode client SDK for control-plane operations
- React 19.2.4 (peer dependency) - Used by dev dependencies (OpenTUI)

**Testing:**
- tsx ^4.7.0 - TypeScript test execution runtime
- No formal testing framework declared - Tests use tsx directly

**Build/Dev:**
- TypeScript 5.3.0 - Compiler for dist/ output
- ink ^6.8.0 - React-based CLI/TUI framework for dev tooling

## Key Dependencies

**Critical:**
- zod ^4.3.6 - Schema validation for tool arguments and internal contracts
- @opencode-ai/plugin - Tool registration and hook assembly
- @opencode-ai/sdk - Control-plane client operations

**Infrastructure:**
- remark ^15.0.1 - Markdown parsing and AST processing
- unist-util-visit ^5.1.0 - AST traversal for document processing
- web-tree-sitter ^0.26.5 - Code syntax tree parsing
- yaml ^2.8.2 - Configuration file parsing
- magic-string ^0.30.21 - Source code manipulation

**CLI/TUI:**
- ink ^6.8.0 - React-based terminal UI framework
- @clack/prompts ^1.0.0 - Interactive CLI prompts
- @json-render/core ^0.14.1 + @json-render/react ^0.14.1 - JSON rendering utilities

**Utilities:**
- proper-lockfile ^4.1.2 + @types/proper-lockfile ^4.1.4 - Dependency lockfile management
- ignore ^7.0.5 - File system ignore patterns

## Configuration

**Environment:**
- Configured via `opencode.json` - OpenCode-level configuration
- Runtime state in `.hivemind/` directory - Generated runtime output
- CLI flags for init/doctor/settings/harness commands

**Key configs required:**
- `opencode.json` - Plugin registration, model/provider settings
- `tsconfig.json` - TypeScript compilation rules
- `.hivemind/config/runtime-attachment.json` - Runtime attachment settings (optional)

**Build:**
- TypeScript compiler config in `tsconfig.json`
- Build script: `npm run clean && tsc && chmod +x dist/cli.js`
- Type check gate: `npx tsc --noEmit` (must pass before commit)
- Boundary lint scripts: `npm run lint:boundary` - Enforces SDK boundaries and anti-patterns

## Platform Requirements

**Development:**
- Node.js >=20.0.0
- npm or compatible package manager
- TypeScript compiler (included)

**Production (npm install):**
- Node.js >=20.0.0
- React 19.2.4 (peer dependency, optional for consumers)
- @opencode-ai/plugin runtime environment

**OpenCode Compatibility:**
- Plugin interface: `@opencode-ai/plugin` >=1.1.0
- SDK client: `@opencode-ai/sdk` ^1.2.27
- Uses experimental SDK hooks: `experimental.chat.messages.transform`, `experimental.session.compacting`

---

*Stack analysis: 2026-03-21*
