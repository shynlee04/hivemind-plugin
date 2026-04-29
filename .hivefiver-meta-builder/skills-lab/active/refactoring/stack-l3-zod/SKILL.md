---
name: stack-l3-zod
version: "4.x"
description: "Zod v4 TypeScript-first schema validation — complete API, patterns, and v3→v4 migration"
triggers:
  - zod
  - schema validation
  - z.object
  - z.string
  - safeParse
  - ZodError
  - type inference
  - schema definition
  - validation
  - z.infer
  - zod v4
  - zod migration
  - z.number
  - z.array
  - z.enum
  - z.union
  - .refine
  - .transform
  - .pipe
---

# Stack Skill: Zod v4

> **Progressive disclosure reference** — start here, dive into `references/` as needed.

## Quick Start

```typescript
import { z } from "zod";

// Define schema
const UserSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  email: z.email(),
  age: z.number().int().positive().optional(),
  role: z.enum(["admin", "user", "moderator"]),
});

// Type inference
type User = z.infer<typeof UserSchema>;

// Parse (throws on failure)
const user = UserSchema.parse(rawData);

// Safe parse (no throw)
const result = UserSchema.safeParse(rawData);
if (result.success) {
  console.log(result.data); // typed as User
} else {
  console.log(z.prettifyError(result.error));
}
```

## Import Paths (v4)

| Import | Purpose |
|--------|---------|
| `import { z } from "zod"` | Classic API (method chaining) — **recommended** |
| `import { z } from "zod/mini"` | Mini API (functional, tree-shakable) |
| `import * as core from "zod/v4/core"` | Core primitives (library authors) |
| `import { z } from "zod/v3"` | Legacy v3 compat |

## Navigation

| Topic | File |
|-------|------|
| Architecture & package structure | `references/architecture.md` |
| All schema types (primitives to complex) | `references/api/types.md` |
| All methods (optional, transform, refine…) | `references/api/methods.md` |
| Error handling (safeParse, ZodError) | `references/api/error-handling.md` |
| Type inference (z.infer, z.input, z.output) | `references/api/inference.md` |
| Development patterns (tools, config) | `references/patterns/dev.md` |
| Testing patterns with Zod | `references/patterns/testing.md` |
| **Expert guide (beyond docs)** | `references/expert-guide.md` |
| Anti-patterns (8 common mistakes) | `references/anti-patterns.md` |
| Migration from v3 to v4 | `references/migration/v3-to-v4.md` |

## Key v4 Changes (cheat sheet)

- **Unified `error` parameter** replaces `required_error`, `invalid_type_error`, `errorMap`
- **String formats promoted**: `z.string().email()` → `z.email()` (method form deprecated)
- **`z.record()` requires two args**: `z.record(z.string(), z.number())`
- **`.superRefine()` → `.check()`** with cleaner API
- **`ZodError.flatten()` / `.format()` deprecated** → use `z.treeifyError()`, `z.prettifyError()`
- **`z.coerce` input type is `unknown`** (was specific type)
- **`.merge()` deprecated** → use `.extend()` with destructuring
- **Built-in JSON Schema**: `z.toJSONSchema(schema)`
- **`z.uuid()` stricter** (RFC 9562) — use `z.guid()` for permissive matching
- **`z.nativeEnum()` deprecated** → `z.enum()` now handles it

## Performance Notes

- Zod v4 is ~3x faster than v3 for object parsing
- Bundle size reduced significantly with `zod/mini`
- TypeScript compilation times reduced
- Refinements stored within schema (interleavable with other methods)

## Ecosystem Routing

| When working on... | Also load... | Because... |
|---------------------|--------------|------------|
| Tool schema definitions | `stack-opencode` | Zod→JSON Schema conversion has silent failures (see tool-internals.md) |
| Testing schema validation | `stack-vitest` | Schema test patterns, edge case coverage |
| TDD with schema validation | `hm-test-driven-execution` | RED/GREEN/REFACTOR for schema development |
| API boundary validation | `stack-nextjs` | Route handler validation with Zod |

---

*Source: colinhacks/zod v4.0.1 · Repomix download 2026-04-28*

## Self-Correction

> Reference documents provide facts, not workflows. When facts conflict with reality, this section guides resolution.

### When Information Is Outdated
1. **Check the version in frontmatter** (currently: 4.x) — Zod v4 is stable but evolving; patch versions may add features.
2. **Verify against official docs:** https://zod.dev or `npx --yes ctx7 library zod "v4 migration guide"`.
3. **Check installed version:** `npm list zod` or `node -e "console.log(require('zod/package.json').version)"`.
4. **The v4 changes cheat sheet (lines 84-95) is the most version-sensitive section:** If Zod v5 releases, the entire cheat sheet becomes historical — check `references/migration/v3-to-v4.md` for the migration meta-pattern.

### When Unsure About API Accuracy
1. **Corroborate with source:** Read `node_modules/zod/lib/index.d.ts` or `node_modules/zod/v4/core/index.d.ts` for type signatures.
2. **Check bundled references** (`references/api/types.md`, `references/api/methods.md`) — extracted from v4.0.1.
3. **The import paths table (lines 60-67) is critical:** If an import path doesn't resolve, Zod's package structure may have changed. Verify with `node -e "require.resolve('zod')"`.

### When the User Contradicts Reference Content
1. **Cite the source:** "This stack-zod reference (v4.x) documents [specific API]. Your installed version may differ — check `zod/package.json` version."
2. **Offer verification:** Parse a test schema with `z.object({}).safeParse({})` — if it works but the API shape differs, the reference is out of date.
3. **Do not override:** User's installed zod version has final authority. Migration advice (e.g., "use `.extend()` instead of `.merge()`") should be verified against their runtime.

### When an Edge Case Is Encountered
1. **Document the gap:** Missing coverage includes Zod v4→v5 compatibility path, `zod/mini` tree-shaking strategies, discriminated union auto-complete behavior, `z.preprocess` vs `z.pipe` performance, recursive schema patterns, and integration with non-TypeScript environments.
2. **Search bundled references** — `references/expert-guide.md` and `references/anti-patterns.md` cover deeper patterns.
3. **Check GitHub issues:** `colinhacks/zod` for known edge cases and RFCs.
4. **Escalate to skill maintainer:** File an update request with Zod version, schema definition, and observed vs expected behavior.
