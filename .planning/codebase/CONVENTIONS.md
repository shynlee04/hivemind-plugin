# Coding Conventions

**Analysis Date:** 2024-05-24

## Naming Patterns

**Files:**
- kebab-case for all files (e.g., `command-routing.ts`, `chain-executor.ts`, `contract-store.test.ts`)

**Functions:**
- camelCase for regular functions (e.g., `resolveCliInvocation`, `dispatchDelegationHandoffPacketAction`)
- PascalCase for React components or factory functions if applicable, though primarily standard TS functions are camelCase.

**Variables:**
- camelCase for local variables and properties
- UPPER_SNAKE_CASE for global constants (e.g., `CLI_COMMANDS`, `AUTHORITATIVE_RUNTIME_TOOL_IDS`)

**Types:**
- PascalCase for interfaces and types (e.g., `ChainActionHandler`, `DelegationProjectionState`, `AgentWorkContract`)

## Code Style

**Formatting:**
- TypeScript is strictly used with strict boundary checks.
- Native ESM modules, meaning relative imports require `.js` extension (e.g., `import { discoverControlPlanePrimitives } from '../control-plane/index.js'`)

**Linting:**
- Boundary Linting: Uses a suite of custom bash scripts for boundary enforcement instead of standard ESLint (e.g., `check-sdk-boundary.sh`, `check-state-write-boundary.sh`, `check-no-event-bus.sh`).
- Typechecking: Runs `tsc --noEmit` locally.

## Import Organization

**Order:**
1. Built-in Node modules with `node:` prefix (e.g., `import { basename } from 'node:path'`)
2. External dependencies
3. Type imports using `import type { ... }`
4. Relative internal imports with `.js` extensions (e.g., `import { ContractStore } from './contract-store.js'`)

**Path Aliases:**
- Standard relative imports (`../` and `./`) are primarily used. Path aliases do not appear to be heavily utilized.

## Error Handling

**Patterns:**
- Errors are allowed to bubble up but are gracefully logged when not blocking (e.g., `console.error('Chain executor handler error...', error)`).
- Throwing explicit `new Error('...')` with contextual messages.

## Logging

**Framework:** `console` methods directly (e.g., `console.error`)

**Patterns:**
- Errors in asynchronous executors are logged with context and stack trace without halting the execution queue.

## Comments

**When to Comment:**
- Module headers explicitly document the module's purpose.
- Documentation for complex orchestration or handler patterns.

**JSDoc/TSDoc:**
- Functions and classes have comprehensive TSDoc comments explaining parameters, returns, and providing `@example` code snippets.
- Use `@module` for file-level documentation.

## Function Design

**Size:** Concise, single-purpose functions where possible.

**Parameters:**
- Use of configuration objects/interfaces for complex inputs (e.g., `dispatchDelegationHandoffPacketAction(input: { ... })`).
- Positional arguments used only for simple, predictable signatures.

**Return Values:**
- Returning explicit structured objects or promises of specific types.

## Module Design

**Exports:** 
- Named exports are highly preferred (`export function`, `export type`, `export class`). Default exports are avoided.

**Barrel Files:** 
- Uses `index.js` or `index.ts` heavily to re-export modules (e.g., `../control-plane/index.js`).
