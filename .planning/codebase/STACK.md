# Technology Stack

**Analysis Date:** 2024-05-24

## Languages

**Primary:**
- TypeScript 5.3.0 - Used globally across the entire project (`src/`, `tests/`)

**Secondary:**
- None significant (JSON and YAML used for configuration)

## Runtime

**Environment:**
- Node.js >=20.0.0
- Target: ES2022 / NodeNext Module Resolution

**Package Manager:**
- npm 
- Lockfile: present (`package-lock.json`)
- Workspaces: Yes (`apps/*`)

## Frameworks

**Core:**
- `@opencode-ai/plugin` (>=1.1.0) - Base framework for OpenCode AI plugin architecture
- `@opencode-ai/sdk` (^1.2.27) - Core SDK for the AI platform interactions
- React (^19.2.4) - Used for rendering Terminal UI components
- `ink` (^6.8.0) - React-based terminal UI framework
- `@opentui/core` & `@opentui/react` (^0.1.88) - TUI library for dashboard and CLI

**Testing:**
- Node.js Native Test Runner - Executed via `tsx --test`

**Build/Dev:**
- `tsc` (TypeScript Compiler) - For building to `dist/` directory
- `tsx` - For running TypeScript directly in development and testing

## Key Dependencies

**Critical:**
- `zod` (^4.3.6) - Runtime type schema validation and configuration definition
- `web-tree-sitter` (^0.26.5) - Abstract Syntax Tree parsing for code analysis
- `proper-lockfile` (^4.1.2) - File-level locking for concurrent filesystem state modifications

**Infrastructure/CLI:**
- `@clack/prompts` (^1.0.0) - Lightweight, beautiful terminal prompts
- `remark` (^15.0.1) & `unist-util-visit` - Markdown AST processing and analysis
- `yaml` (^2.8.2) - YAML serialization and parsing

## Configuration

**Environment:**
- Environment variables are not directly used in the codebase (`process.env` yielded no results). Configuration is primarily passed through the OpenCode SDK plugin context.

**Build:**
- `tsconfig.json` - Configured for strict TypeScript compilation targeting `ES2022`, utilizing NodeNext module resolution, and building out to `./dist`. Excludes `tests` and `src/dashboard-v2` from compilation.

## Platform Requirements

**Development:**
- Node.js environment >=20.0.0

**Production:**
- Deployed as an npm module (`dist/` output) and intended to run as a plugin inside the OpenCode AI environment.

---

*Stack analysis: 2024-05-24*
