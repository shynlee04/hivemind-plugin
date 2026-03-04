typescript-expert

$ npx skills add https://github.com/oimiragieo/agent-studio --skill typescript-expert
SKILL.md
Typescript Expert
javascript code style and structure
When reviewing or writing code, apply these guidelines:

Code Style and Structure
Naming Conventions
JavaScript Usage
javascript documentation with jsdoc
When reviewing or writing code, apply these guidelines:

JSDoc Comments: Use JSDoc comments for JavaScript and modern ES6 syntax.
javascript typescript code style
When reviewing or writing code, apply these guidelines:

Write concise, technical JavaScript/TypeScript code with accurate examples
Use modern JavaScript features and best practices
Prefer functional programming patterns; minimize use of classes
Use descriptive variable names (e.g., isExtensionEnabled, hasPermission)
javascript typescript coding standards
When reviewing or writing code, apply these guidelines:

Always use WordPress coding standards when writing JavaScript and TypeScript.
Prefer writing TypeScript over JavaScript.
javascript typescript coding style
When reviewing or writing code, apply these guidelines:

Use "function" keyword for pure functions. Omit semicolons.
Use TypeScript for all code. Prefer interfaces over types. Avoid enums, use maps.
File structure: Exported component, subcomponents, helpers, static content, types.
Avoid unnecessary curly braces in conditional statements.
For single-line statements in conditionals, omit curly braces.
Use concise, one-line syntax for simple conditional statements (e.g., if (condition) doSomething()).
typescript code generation rules
When reviewing or writing code, apply these guidelines:

Always use TypeScript for type safety. Provide appropriate type definitions and interfaces.
Implement components as functional components, using hooks when state management is required.
Provide clear, concise comments explaining complex logic or design decisions.
Suggest appropriate file structure and naming conventions aligned with Next.js 14 best practices.
Use the 'use client' directive only w
TypeScript 5.5–5.8 features (2025–2026)
Apply these modern features when writing or reviewing TypeScript code:

Inferred Type Predicates (TS 5.5)
TypeScript now infers type predicates from function bodies. No need to manually annotate x is T for simple filters.

// Before 5.5 — manual predicate required
const strings = values.filter((v): v is string => v !== null && typeof v === 'string');

// TS 5.5+ — predicate is inferred automatically
const strings = values.filter(v => v !== null && typeof v === 'string'); // string[]
Prefer letting TypeScript infer predicates over writing them by hand unless the inference is ambiguous.

Isolated Declarations (TS 5.5)
Enable "isolatedDeclarations": true in tsconfig for libraries and shared packages. This enforces that every exported symbol has an explicit type annotation, enabling parallel .d.ts generation by third-party tools (esbuild, oxc) without running tsc.

// Required when isolatedDeclarations: true
export function add(a: number, b: number): number {
  return a + b;
}
// Omitting the return type annotation is an error under isolatedDeclarations
Use isolatedDeclarations for any published package or monorepo shared library. It also improves incremental build performance.

Never-Initialized Variable Checks (TS 5.7)
TS 5.7 catches variables that are declared but never assigned in any code path, even when accessed via inner functions.

// TS 5.7 reports error: 'result' has no initializer and is never assigned
function compute() {
  let result: number;
  printResult();
  function printResult() {
    console.log(result);
  } // error
}
Enable this by keeping strict: true. No extra flag needed.

--erasableSyntaxOnly (TS 5.8)
Add "erasableSyntaxOnly": true to tsconfig for Node.js projects that use native TypeScript stripping (Node 22.6+ with --experimental-strip-types, or Node 23+). This flag turns enums, namespaces, and constructor parameter properties into compile errors.

// All three are errors under erasableSyntaxOnly: true
enum Status {
  Active,
  Inactive,
} // error — use const object instead
namespace Utils {
  export const x = 1;
} // error — use a module instead
class Foo {
  constructor(private x: string) {}
} // error — assign manually
Preferred replacements:

// Enum → const object + typeof
const Status = { Active: 'active', Inactive: 'inactive' } as const;
type Status = (typeof Status)[keyof typeof Status];

// Parameter property → explicit assignment
class Foo {
  private x: string;
  constructor(x: string) {
    this.x = x;
  }
}
satisfies Operator
Use satisfies to validate an object against a type while keeping the narrowest literal type inference.

type Config = { env: 'dev' | 'prod'; retries: number };

// Plain annotation widens env to 'dev' | 'prod'
const cfg1: Config = { env: 'dev', retries: 3 };
// typeof cfg1.env → 'dev' | 'prod'

// satisfies keeps literal but still validates the shape
const cfg2 = { env: 'dev', retries: 3 } satisfies Config;
// typeof cfg2.env → 'dev'  (narrower — use for keyof, typeof lookups)
Key use cases: configuration objects, i18n maps, event handler registries, route definitions.

const Type Parameters (TS 5.0+)
Annotate a generic with const to request literal-type inference from call sites without requiring as const at every call.

// Without const — T infers as string[]
function identity<T>(value: T): T {
  return value;
}
identity(['a', 'b']); // T = string[]

// With const — T infers as readonly ['a', 'b']
function identity<const T>(value: T): T {
  return value;
}
identity(['a', 'b']); // T = readonly ['a', 'b']
Useful for tuple factories, typed route builders, and fluent API chains.

NoInfer Utility Type (TS 5.4+)
Use NoInfer<T> to prevent a parameter from being used as an inference site, forcing TypeScript to resolve T from other arguments first.

// Without NoInfer — TypeScript widens initial to string (wrong)
function createFSM<T extends string>(states: T[], initial: T): void {}
createFSM(['idle', 'running'], 'typo'); // no error — 'typo' widens T

// With NoInfer — initial must match inferred T from states
function createFSM<T extends string>(states: T[], initial: NoInfer<T>): void {}
createFSM(['idle', 'running'], 'typo'); // error — 'typo' not in T
tsconfig recommendations for Node 22+
Use these settings for Node.js 22+ projects (native ESM or CJS):

{
  "compilerOptions": {
    // Target Node 22 supports ES2023 natively
    "target": "ES2023",
    "lib": ["ES2023"],

    // Native Node ESM (files use .ts extension, output .js/.mjs)
    "module": "NodeNext",
    "moduleResolution": "NodeNext",

    // Strict + extras
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,

    // TS 5.5+ — enforce explicit exports for parallel d.ts gen (libraries)
    // "isolatedDeclarations": true,

    // TS 5.8 — disallow enums/namespaces/param-props (Node strip-types compat)
    // "erasableSyntaxOnly": true,

    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
  },
}
For bundled apps (Vite, webpack, esbuild) use "module": "ESNext" and "moduleResolution": "bundler" instead.

ESM / CJS interop guidance
Follow these rules to avoid module-system errors in Node 22+ projects:

type field drives defaults. "type": "module" in package.json makes .js files ESM. Omit type or set "commonjs" for CJS defaults.
Extensions always win. .mjs → ESM, .cjs → CJS, regardless of type.
moduleResolution: NodeNext requires explicit extensions in relative imports:
import { foo } from './foo.js'; // correct — .js even for .ts source
import { bar } from './bar.cjs'; // correct for CJS output
ESM cannot require() CJS synchronously. ESM → CJS: use createRequire. CJS → ESM: use dynamic import().
Dual-publishing (CJS + ESM): Use the exports field in package.json with "import" and "require" conditions. Build with tsc -p tsconfig.esm.json and tsc -p tsconfig.cjs.json.
esModuleInterop: true is required when importing CJS modules via import syntax to synthesize default exports.
For bundled apps, use "moduleResolution": "bundler" — it permits extension-less imports and lets the bundler handle resolution. Do not set "type": "module" in bundled projects (TypeScript cannot fully analyze the bundler's CJS/ESM interop in that mode).
Anti-Patterns (do not use)
Enums — Use const objects with typeof instead. Enums generate runtime code, break tree-shaking, and are banned by erasableSyntaxOnly.
namespace declarations — Use ES modules. Namespaces are non-erasable and a legacy pattern.
any — Use unknown with type guards, or model the type properly.
Type assertions (as T) — Prefer satisfies, type guards, or proper generics.
! non-null assertions — Handle null/undefined explicitly.
Class parameter properties — Assign fields explicitly; banned by erasableSyntaxOnly.
Consolidated Skills
This expert skill consolidates 1 individual skills:

typescript-expert
Related Skills
nodejs-expert - Node.js backend patterns (Express, NestJS) that use TypeScript
Iron Laws
ALWAYS prefer interfaces over type aliases and use strict TypeScript compiler settings for all new code
NEVER use any types — use proper type annotations, unknown, or generics instead
ALWAYS use type guards for runtime type narrowing rather than casting with as
NEVER use enums — use const maps or literal union types for better tree-shaking and clarity
ALWAYS apply functional patterns with immutable data; avoid class-based patterns when functions suffice
Anti-Patterns
Anti-Pattern	Why It Fails	Correct Approach
any types everywhere	Defeats type safety, hides bugs at compile time	Use unknown, generics, or proper interfaces
TypeScript enums	Poor tree-shaking, runtime overhead, confusing emit	Use const maps or literal union types
Type casting with as	Bypasses type checking, creates false confidence	Use type guards (typeof, instanceof, discriminants)
Mutable shared state in classes	Unpredictable behavior, hard to test	Use functional patterns with immutable data
Loose tsconfig without strict mode	Misses entire categories of type errors	Enable "strict": true in all TypeScript configs
Memory Protocol (MANDATORY)
Before starting:

cat .claude/context/memory/learnings.md
After completing: Record any new patterns or exceptions discovered.

ASSUME INTERRUPTION: Your context may reset. If it's not in memory, it didn't happen.