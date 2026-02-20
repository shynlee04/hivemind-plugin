# Technology Stack

**Analysis Date:** 2026-02-18

## Languages

**Primary:**
- TypeScript 5.3+ - All source code, strict mode enabled

**Secondary:**
- JavaScript (ESM) - Generated dist output

## Runtime

**Environment:**
- Node.js 20.0.0+ (ES2022 target)
- ES Module format (`"type": "module"`)

**Package Manager:**
- npm
- Lockfile: package-lock.json (present)

## Frameworks

**Core:**
- @opencode-ai/plugin ^1.1.53 - OpenCode plugin SDK (devDependency, required peer)
- Zod ^4.3.6 - Schema validation and type inference

**Testing:**
- tsx ^4.7.0 - TypeScript test runner with native Node test support
- Node.js built-in test runner (no Jest/Vitest)

**Build/Dev:**
- TypeScript ^5.3.0 - Compilation
- tsc --watch for development

**TUI (Dashboard):**
- Ink ^5.0.0 - React-based terminal UI (optional peer)
- React ^18.0.0 - UI framework (optional peer)

## Key Dependencies

**Critical:**
- proper-lockfile ^4.1.2 - File locking for atomic operations
- yaml ^2.3.4 - YAML parsing for governance instructions
- @clack/prompts ^1.0.0 - Interactive CLI prompts

**Infrastructure:**
- Node.js built-in: `fs`, `path`, `events`, `crypto`
- No external database - filesystem-based persistence

## Configuration

**Environment:**
- No `.env` files required
- Configuration via `.hivemind/config.json`
- 12-factor app compatible

**Build:**
- `tsconfig.json` - Strict TypeScript config
- Target: ES2022, Module: NodeNext
- JSX: react (for dashboard components)

**Linting:**
- No ESLint/Prettier detected
- `npm run lint:boundary` - Custom SDK boundary check script

## Platform Requirements

**Development:**
- Node.js 20.0.0+
- npm
- TypeScript 5.3+

**Production:**
- OpenCode plugin host environment
- Filesystem access for `.hivemind/` directory
- No external services required

## Project Metadata

| Property | Value |
|----------|-------|
| Package Name | hivemind-context-governance |
| Version | 2.7.0 |
| License | MIT |
| Main Entry | dist/index.js |
| CLI Bin | `hivemind-context-governance`, `hivemind` |

---

*Stack analysis: 2026-02-18*
