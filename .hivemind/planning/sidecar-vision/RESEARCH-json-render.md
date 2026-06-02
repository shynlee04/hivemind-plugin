[LANGUAGE: Write this file in en per Language Governance.]
# RESEARCH: @json-render/* v0.19.0 Compatibility & API Assessment

> **Author:** Research subagent
> **Date:** 2026-06-02
> **Context:** Hivemind sidecar GUI — Next.js 16 + json-render read-only dashboard
> **Sources:** npm registry, GitHub releases, Context7 docs, DeepWiki, local `node_modules/` (v0.18.0)

---

## Executive Summary

**No breaking changes between 0.18.x and 0.19.0.** The v0.19.0 release is purely additive. Direct upgrade from 0.18.x is safe with zero migration effort.

---

## Version Compatibility Matrix

| Package | Installed (local) | Latest (npm) | Diff | Risk |
|---------|------------------|-------------|------|------|
| `@json-render/core` | 0.18.0 | 0.19.0 | Minor bump | None |
| `@json-render/react` | 0.18.0 | 0.19.0 | Minor bump | None |
| `@json-render/next` | 0.18.0 | 0.19.0 | Minor bump | None |
| `@json-render/shadcn` | Not installed | 0.19.0 | New dependency | None (additive) |
| `@json-render/directives` | Not installed | 0.19.0 | New package (v0.19.0 only) | None (additive) |
| `@json-render/ink` | 0.18.0 | 0.19.0 | Minor bump | None (not used by sidecar) |
| `@json-render/react-pdf` | 0.18.0 | 0.19.0 | Minor bump | None (not used by sidecar) |

---

## API-by-API Assessment

### 1. `defineCatalog(schema, config)` — ✅ Stable

**Status:** No change between 0.18 and 0.19.

```typescript
// v0.18 and v0.19 — identical signatures
import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";

const catalog = defineCatalog(schema, {
  components: { ... },
  actions: { ... },
});
```

### 2. `defineRegistry(catalog, options)` — ✅ Stable

**Status:** No change between 0.18 and 0.19.

```typescript
// v0.18 and v0.19 — identical signatures
const { registry, handlers, executeAction } = defineRegistry(catalog, {
  components: { ... },
  actions: { ... },
});
```

Types confirmed from local `dist/index.d.ts`:
- `DefineRegistryResult` has `{ registry, handlers, executeAction }`
- `handlers` is a function: `(getSetState, getState) => Record<string, ...>`
- `actions` field is **required** when catalog declares actions, optional otherwise (conditional type based on `CatalogHasActions`)

### 3. `Renderer` Component — ✅ Stable

**Status:** No change.

```typescript
interface RendererProps {
  spec: Spec | null;
  registry: ComponentRegistry;
  loading?: boolean;
  fallback?: ComponentRenderer;
}
```

### 4. `JSONUIProvider` — ✅ Stable

**Status:** No change between 0.18 and 0.19. The `actionHandlers` → `handlers` rename happened in v0.6.0 (already reflected in our v0.18.0).

```typescript
interface JSONUIProviderProps {
  registry: ComponentRegistry;
  store?: StateStore;               // controlled mode
  initialState?: Record<string, unknown>; // uncontrolled mode
  handlers?: Record<string, ...>;   // (NOT actionHandlers — that was 0.5.x)
  navigate?: (path: string) => void;
  validationFunctions?: Record<string, ...>;
  functions?: Record<string, ComputedFunction>;
  onStateChange?: (changes: Array<{ path, value }>) => void;
  children: ReactNode;
}
```

### 5. `useUIStream({ api, onComplete?, onError? })` — ✅ Stable

**Status:** No change between 0.18 and 0.19.

```typescript
interface UseUIStreamReturn {
  spec: Spec | null;
  isStreaming: boolean;
  error: Error | null;
  usage: TokenUsage | null;
  rawLines: string[];
  send: (prompt: string, context?: Record<string, unknown>) => Promise<void>;
  clear: () => void;
}
```

Also confirmed: `useChatUI` hook exists for chat + GenUI experiences (new in 0.18 — part of devtools ecosystem). Not needed for read-only sidecar.

### 6. `catalog.prompt({ mode })` — ✅ Stable (deprecated aliases removed soon)

**Status:** Mode naming settled in v0.15/0.16.

| Old Name (deprecated) | New Name | Behavior |
|-----------------------|----------|----------|
| `"generate"` | `"standalone"` | AI outputs only JSONL patches (no prose) |
| `"chat"` | `"inline"` | AI interleaves conversation text with JSONL patches |

```typescript
const prompt = catalog.prompt({ mode: "standalone" });
const inlinePrompt = catalog.prompt({ mode: "inline" });
```

The old names (`"generate"`, `"chat"`) are **deprecated aliases** and still work but may be removed. Use `"standalone"` / `"inline"`.

### 7. `catalog.toCode()` — ❌ Does NOT Exist

**Status:** No code export API in any version. The only serialization methods are:
- `catalog.prompt(opts)` → system prompt string
- `catalog.jsonSchema(opts)` → JSON Schema object
- `catalog.zodSchema()` → Zod schema
- `catalog.validate(spec)` → validation result

For the sidecar (read-only dashboard), neither code export nor code generation is needed.

### 8. `validateSpec`, `autoFixSpec`, `formatSpecIssues` — ✅ Stable

**Status:** All three confirmed present and unchanged in `@json-render/core` v0.18.0 and v0.19.0.

```typescript
import { validateSpec, autoFixSpec, formatSpecIssues } from "@json-render/core";

// Validate spec structural integrity
const issues = validateSpec(spec, { checkOrphans?: boolean });
// { valid: boolean, issues: SpecIssue[] }

// Auto-fix common AI-generation errors
const { spec: fixed, fixes } = autoFixSpec(spec);
// fixes = string[] describing what was fixed

// Format issues for feedback prompt
const message = formatSpecIssues(issues.issues);
```

### 9. SpecStream / JSON Patch (RFC 6902) Streaming API — ✅ Stable

**Status:** All streaming APIs confirmed present and unchanged.

Exported from `@json-render/core`:
- `compileSpecStream(spec)` — compile spec into stream commands
- `createSpecStreamCompiler()` — create a compiler instance
- `applySpecStreamPatch(spec, lines)` — apply JSONL patches to spec
- `parseSpecStreamLine(line)` — parse a single JSONL line
- `pipeJsonRender()` — pipe text/JSONL stream (chat mode)
- `createJsonRenderTransform()` — transform stream
- `createMixedStreamParser(callbacks)` — parse mixed text + JSONL
- `SpecStreamLine` / `SpecStreamCompiler` types
- `JsonPatch` type (from store-utils)
- `diffToPatches(oldObj, newObj)` — produce RFC 6902 patches from object diffs

JSONL format (confirmed unchanged):

```json
{"op":"add","path":"/root","value":"root"}
{"op":"add","path":"/elements/root","value":{"type":"Card","props":{"title":"Dashboard"},"children":["metric-1"]}}
```

---

## What's New in 0.19.0 (Additive Only)

### Custom Directives API (`@json-render/core`)

New `defineDirective` export lets users declare JSON shapes (like `$format`, `$math`) that resolve to computed values at render time. Directives compose inside-out.

```typescript
import { defineDirective } from "@json-render/core";
```

All four renderers (React, Vue, Svelte, Solid) have built-in directive resolution.

### `@json-render/directives` (New Package)

Seven ready-made directives:
| Directive | Purpose |
|-----------|---------|
| `$format` | Date, currency, number, percent via `Intl` |
| `$math` | add, subtract, multiply, divide, mod, min, max, round, floor, ceil, abs |
| `$concat` | String concatenation |
| `$count` | Array length |
| `$truncate` | String truncation |
| `$pluralize` | Simple pluralization |
| `$join` | Array join |

Also exports:
- `createI18nDirective` for `$t` translation keys with `{{param}}` interpolation
- `standardDirectives` for one-line registration of all directives

---

## `@json-render/shadcn` — 36 Pre-built Components

**Status:** Stable since v0.12+. Confirmed at 36 components in v0.18 and v0.19.

**Peer dependencies:**
| Package | Requirement |
|---------|-------------|
| `react` | `^19.0.0` |
| `react-dom` | `^19.0.0` |
| `tailwindcss` | `^4.0.0` |
| `zod` | `^4.0.0` |

**Runtime dependencies:**
`class-variance-authority`, `clsx`, `embla-carousel-react`, `lucide-react`, `radix-ui`, `tailwind-merge`, `vaul`

**Usage pattern:**
```typescript
import { shadcnComponentDefinitions } from "@json-render/shadcn/catalog";
import { shadcnComponents } from "@json-render/shadcn";

// Catalog
const catalog = defineCatalog(schema, {
  components: {
    Card: shadcnComponentDefinitions.Card,
    Stack: shadcnComponentDefinitions.Stack,
    // ... pick from 36 definitions
  },
  actions: {},
});

// Registry
const { registry } = defineRegistry(catalog, {
  components: {
    Card: shadcnComponents.Card,
    Stack: shadcnComponents.Stack,
    // ... matching implementations
  },
});
```

**Suitability for sidecar:** Excellent. The shadcn components are built on Radix UI + Tailwind CSS, matching the sidecar's Next.js 16 + Tailwind v4 stack. The `Card`, `Stack`, `Heading`, `Button`, `Input` components directly map to dashboard panel needs.

---

## Zod Peer Dependency Compatibility

| Package | Zod Version | Project's Zod |
|---------|------------|---------------|
| `@json-render/core` 0.19.0 | `^4.0.0` (peer), uses `^4.3.6` internally | `^4.4.3` ✅ |
| `@json-render/react` 0.19.0 | None (delegates to core) | `^4.4.3` ✅ |
| `@json-render/shadcn` 0.19.0 | `^4.0.0` (peer) | `^4.4.3` ✅ |
| `@json-render/directives` 0.19.0 | `^4.0.0` (peer) | `^4.4.3` ✅ |

**All compatible.** Project's zod `^4.4.3` satisfies all peer requirements.

---

## Breaking Changes History

### 0.18.x → 0.19.0: None ✅

### 0.6.0 (earlier, already absorbed):

The last significant breaking changes were in v0.6.0. Since the project is on v0.18.0, all of these are already handled:

| Change | Before (0.5.x) | After (0.6.x+) | Status |
|--------|----------------|----------------|--------|
| Catalog creation | `createCatalog()` | `defineCatalog(schema, config)` | ✅ Already on 0.18 |
| Registry creation | `createRendererFromCatalog()` | `defineRegistry(catalog, opts)` | ✅ Already on 0.18 |
| Action handlers prop | `actionHandlers` | `handlers` | ✅ Already on 0.18 |
| Expression syntax | `{ $path }` / `{ path }` | `{ $state }`, `{ $item }`, `{ $index }` | ✅ Already on 0.18 |
| DynamicValue type | `{ path: string }` | `{ $state: string }` | ✅ Already on 0.18 |
| Repeat path | `repeat.path` | `repeat.statePath` | ✅ Already on 0.18 |
| SetState param | `path` | `statePath` | ✅ Already on 0.18 |
| Traverse | `traverseTree` | `traverseSpec` | ✅ Already on 0.18 |
| Auth | `AuthState` type | Removed (model as state) | ✅ Already on 0.18 |
| Prompt mode names | `"generate"` / `"chat"` | Deprecated → `"standalone"` / `"inline"` | ⚠️ Use new names |

---

## Known Failure Modes & Risks

1. **`@json-render/shadcn` not yet installed** — The `shadcnComponents` and `shadcnComponentDefinitions` imports will not resolve until `npm install @json-render/shadcn@^0.19.0` is run. Tailwind v4 must have `@source` directives for the shadcn package path.

2. **`@json-render/next` version lock** — Currently at 0.18.0 in node_modules. Must be updated to 0.19.0 alongside core/react to keep all packages on the same major/minor.

3. **Deprecated prompt mode names** — If code still uses `catalog.prompt({ mode: "generate" })` or `catalog.prompt({ mode: "chat" })`, these are deprecated aliases. They work in 0.19.0 but should be migrated to `"standalone"` and `"inline"` respectively.

4. **No `catalog.toCode()`** — If any documentation or planning assumes a code export API, it must be corrected. Code generation is not a json-render feature.

---

## Recommendation

**Upgrade directly from 0.18.x to 0.19.0. No migration script or intermediate steps needed.**

### Upgrade action items:

| Action | Package | Command |
|--------|---------|---------|
| Bump | `@json-render/core` | `npm install @json-render/core@^0.19.0` |
| Bump | `@json-render/react` | `npm install @json-render/react@^0.19.0` |
| Bump | `@json-render/next` | `npm install @json-render/next@^0.19.0` |
| **Add** | `@json-render/shadcn` | `npm install @json-render/shadcn@^0.19.0` |
| **Add** | `@json-render/directives` | `npm install @json-render/directives@^0.19.0` (optional — only if dashboard needs computed values) |

### Optional post-upgrade:
- Check for uses of `catalog.prompt({ mode: "generate" })` or `{ mode: "chat" }` — rename to `"standalone"` / `"inline"`
- Verify Tailwind v4 `@source` directives include the shadcn package path (e.g. `@source "../../node_modules/@json-render/shadcn/src"`)
- Consider using the new `defineDirective` API for dashboard-specific computed values

---

## Sources

1. npm registry: `@json-render/core@0.19.0`, `@json-render/react@0.19.0`, `@json-render/shadcn@0.19.0`, `@json-render/directives@0.19.0`
2. GitHub releases: https://github.com/vercel-labs/json-render/releases (v0.19.0, v0.18.0, v0.6.0)
3. Context7 docs: `/vercel-labs/json-render` — 1300 code snippets, benchmark score 80.2
4. DeepWiki: `vercel-labs/json-render` — architecture overview + CHANGELOG analysis
5. Local `node_modules/@json-render/react/dist/index.d.ts` (753 lines) — confirmed all React API surfaces
6. Local `node_modules/@json-render/core/dist/index.d.ts` (813 lines) — confirmed all core API surfaces
7. Context7 migration docs: `apps/web/app/(main)/docs/migration/page.mdx` — confirmed mode name deprecation
8. Context7 shadcn docs: `packages/shadcn/README.md` — confirmed 36-component catalog
