---
sessionID: ses_1e99b6d51ffePAxZJNXXFiOv24
created: 2026-05-11T09:35:50.456Z
updated: 2026-05-11T09:35:50.456Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

You are a subagent tasked with adding/upgrading the IRON CLAW governance section in gate-* and stack-* skills. You MUST read each SKILL.md, find the right insertion point, and add the standardized IRON CLAW block using the Edit tool.

## Files to Edit (in /Users/apple/hivemind-plugin-private/.opencode/skills/):

### Gate Skills (3):
1. `gate-l3-lifecycle-integration/SKILL.md` - Already has "## OpenCode SDK Surface Compliance" at line 83 referencing SDK v1.14.44. Insert the IRON CLAW block right before "## OpenCode SDK Surface Compliance" section, OR if there's a governance section earlier (check "## Two-Halves Classification" area around line 56-65), add it there.

2. `gate-l3-spec-compliance/SKILL.md` - Has no explicit tech-stack governance. Read the first 50 lines to find the structure. Add the IRON CLAW block after the "## Overview" section (around line 33), before "## On Load" section.

3. `gate-l3-evidence-truth/SKILL.md` - Has "## The Iron Law" at line 30 and "## Evidence Hierarchy" at line 56. Add the IRON CLAW block right BEFORE "## Evidence Hierarchy" (around line 56), after the overview/gate description content.

### Stack Skills (6):
4. `stack-l3-zod/SKILL.md` - Has API references starting at line 34. Read first 40 lines. Add the IRON CLAW block after "## Quick Start" and API overview section, before "## Navigation" or as a new section between existing content.

5. `stack-l3-vitest/SKILL.md` - Read first 50 lines. Has "## Ecosystem Routing" at line 86 and "## Self-Correction" at line 99. Add the IRON CLAW block as a new section before "## Self-Correction" (around line 98).

6. `stack-l3-nextjs/SKILL.md` - Read first 60 lines to find structure. Add the IRON CLAW block as a new section after "## Architecture Overview" (around line 60-91) or before "## File Conventions Quick Reference" — whichever is more prominent. Read the file fully to decide.

7. `stack-l3-bun-pty/SKILL.md` - Read first 55 lines to find structure (file is ~110 lines). Add the IRON CLAW block as a new section before "## Self-Correction" or near the end of the main content section. Read the file fully to decide.

8. `stack-l3-json-render/SKILL.md` - Read the full file (177 lines). Find the right insertion point — add the IRON CLAW block after the main reference content and before any self-correction or cross-references section.

9. `stack-l3-opencode/SKILL.md` - Already has "## Constitutional Compliance: Two-Tier Trust Model" at line 97. Insert the IRON CLAW block right BEFORE "## Constitutional Compliance: Two-Tier Trust Model" (around line 97), making it the overarching governance header.

## The Standardized IRON CLAW Block

Use this block for ALL files:

```
## 🔨 IRON CLAW: Tech-Stack References & Assets Consumption Governance

> **ABSOLUTE RULE:** No bundled reference, cached asset, or stale pattern from this skill shall be consumed for tech-stack API interface decisions without MCP-verified validation against the project's ACTUAL versions (package.json + lockfile), canonical source mappings (`.hivemind/STACKS-REFERENCES.md`), AND a raw codebase context scan of the current implementation state.

### Rationale

Skills bundle references and assets as ORIENTATION tools — they help you understand WHAT exists and WHERE to look. But every bundled reference is a SNAPSHOT, frozen at the moment of ingestion. Stacks evolve: packages release breaking changes, APIs shift, SDKs deprecate surfaces. Using stale bundled signatures as implementation authority produces silent runtime errors.

### Mandatory 5-Step Validation Chain

Before ANY tech-stack API interface from this skill's references/assets is used for implementation, code generation, or quality gate decisions:

```
STEP 1 — CONSUME .hivemind/STACKS-REFERENCES.md
 ├─ Read the canonical stack→repo→version mapping table
 ├─ Identify the correct GitHub repo for each dependency
 └─ Confirm the repo is active (not archived), version is current

STEP 2 — READ package.json + lockfile
 ├─ Extract the ACTUAL installed version (npm ls / grep lockfile)
 ├─ Cross-reference repo URL from STACKS-REFERENCES.md against npm registry
 └─ Flag any discrepancy between bundled version and installed version

STEP 3 — RAW CODEBASE CONTEXT SCAN
 ├─ grep/glob the actual src/ directory structure for current implementation
 ├─ Read current implementation files — not stale docs or bundled references
 ├─ Verify the claimed API signatures match current codebase reality
 └─ Check import paths, type definitions, and function signatures exist in actual code

STEP 4 — MCP LIVE VALIDATION (minimum 2 tools)
 ├─ Context7: resolve-library-id → query-docs (API signatures at installed version)
 ├─ DeepWiki: ask-question (architecture patterns, behavioral semantics)
 ├─ Repomix: pack-remote-repository (full repo analysis at correct version tag)
 ├─ Exa: web-search (latest docs, tutorials, migration guides)
 ├─ Tavily: search + extract (version-specific migration info)
 ├─ GitHub: get-file-contents (exact source verification at correct version)
 └─ GitMCP: search-code (source-level pattern matching)

STEP 5 — VERIFICATION RECORD
 ├─ Source URL + version confirmed to match package.json
 ├─ MCP tool(s) used + fetch timestamp
 ├─ Codebase scan paths + findings
 ├─ Version match status (MATCHED / MISMATCHED / UNVERIFIED)
 └─ Flag as BLOCKING if version mismatch or critical staleness detected
```

### Consumption Rules

| Action | Rule |
|--------|------|
| **Orientation** (understanding WHAT exists, WHERE to look) | ✅ Reference-tier allowed from bundled assets without live validation |
| **API signature lookup** for implementation | 🚫 BLOCKED without live MCP validation (Step 4) + codebase scan (Step 3) |
| **Interface verification** for quality gates | 🚫 BLOCKED without live MCP validation (Step 4) + version match (Step 2) |
| **Version-sensitive behavioral claims** | 🚫 BLOCKED without live MCP validation (Step 4) |
| **Architecture pattern understanding** | ✅ Reference-tier allowed, but recommend live verification for production decisions |
| **Generating code from bundled patterns** | 🚫 BLOCKED — route to live MCP tools for current API surface |

### Integrated Enforcement Points

| Workflow Phase | IRON CLAW Trigger | Required Validation |
|---------------|-------------------|---------------------|
| Implementation | Before using any API from bundled refs | Steps 2-4 minimum |
| Code review | When verifying API usage against docs | Steps 2-4 minimum |
| Quality gate | Before PASS verdict on interface claims | Steps 1-5 full |
| Research | When synthesizing findings from cached assets | Steps 4-5 minimum |
| Audit | When reporting version-based findings | Steps 1-5 full |
```

## Execution Instructions

For each file:
1. Read the SKILL.md first to understand its structure fully
2. Find the best insertion point based on the hints above
3. Use the Edit tool to add the block
4. Adapt the heading level to match the file's heading hierarchy (use ## for top-level sections, ### for sub-sections as appropriate)

## Return Format

Return a structured report listing each file edited, the insertion point chosen, and confirmation the edit was applied. If a file already had similar governance content, note that the new IRON CLAW was placed as the overarching governance.

### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_7AzoV5rJMOCA6y6CzVAp3623"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/gate-l3-lifecycle-integration/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/gate-l3-spec-compliance/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/gate-l3-evidence-truth/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/stack-l3-zod/SKILL.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/skills/stack-l3-zod/SKILL.md</path>
<type>file</type>
<content>
1: ---
2: name: stack-l3-zod
3: version: "4.x"
4: description: "Zod v4 TypeScript-first schema validation — complete API, patterns, and v3→v4 migration"
5: triggers:
6:   - zod
7:   - schema validation
8:   - z.object
9:   - z.string
10:   - safeParse
11:   - ZodError
12:   - type inference
13:   - schema definition
14:   - validation
15:   - z.infer
16:   - zod v4
17:   - zod migration
18:   - z.number
19:   - z.array
20:   - z.enum
21:   - z.union
22:   - .refine
23:   - .transform
24:   - .pipe
25: metadata:
26:   layer: "3"
27:   role: "reference"
28:   lineage: "stack"
29: ---
30: 
31: # Stack Skill: Zod v4
32: 
33: > **Progressive disclosure reference** — start here, dive into `references/` as needed.
34: 
35: ## Quick Start
36: 
37: ```typescript
38: import { z } from "zod";
39: 
40: // Define schema
41: const UserSchema = z.object({
42:   id: z.uuid(),
43:   name: z.string().min(1),
44:   email: z.email(),
45:   age: z.number().int().positive().optional(),
46:   role: z.enum(["admin", "user", "moderator"]),
47: });
48: 
49: // Type inference
50: type User = z.infer<typeof UserSchema>;
51: 
52: // Parse (throws on failure)
53: const user = UserSchema.parse(rawData);
54: 
55: // Safe parse (no throw)
56: const result = UserSchema.safeParse(rawData);
57: if (result.success) {
58:   console.log(result.data); // typed as User
59: } else {
60:   console.log(z.prettifyError(result.error));
61: }
62: ```
63: 
64: ## Import Paths (v4)
65: 
66: | Import | Purpose |
67: |--------|---------|
68: | `import { z } from "zod"` | Classic API (method chaining) — **recommended** |
69: | `import { z } from "zod/mini"` | Mini API (functional, tree-shakable) |
70: | `import * as core from "zod/v4/core"` | Core primitives (library authors) |
71: | `import { z } from "zod/v3"` | Legacy v3 compat |
72: 
73: ## Navigation
74: 
75: | Topic | File |
76: |-------|------|
77: | Architecture & package structure | `references/architecture.md` |
78: | All schema types (primitives to complex) | `references/api/types.md` |
79: | All methods (optional, transform, refine…) | `references/api/methods.md` |
80: | Error handling (safeParse, ZodError) | `references/api/error-handling.md` |
81: | Type inference (z.infer, z.input, z.output) | `references/api/inference.md` |
82: | Development patterns (tools, config) | `references/patterns/dev.md` |
83: | Testing patterns with Zod | `references/patterns/testing.md` |
84: | **Expert guide (beyond docs)** | `references/expert-guide.md` |
85: | Anti-patterns (8 common mistakes) | `references/anti-patterns.md` |
86: | Migration from v3 to v4 | `references/migration/v3-to-v4.md` |
87: 
88: ## Key v4 Changes (cheat sheet)
89: 
90: - **Unified `error` parameter** replaces `required_error`, `invalid_type_error`, `errorMap`
91: - **String formats promoted**: `z.string().email()` → `z.email()` (method form deprecated)
92: - **`z.record()` requires two args**: `z.record(z.string(), z.number())`
93: - **`.superRefine()` → `.check()`** with cleaner API
94: - **`ZodError.flatten()` / `.format()` deprecated** → use `z.treeifyError()`, `z.prettifyError()`
95: - **`z.coerce` input type is `unknown`** (was specific type)
96: - **`.merge()` deprecated** → use `.extend()` with destructuring
97: - **Built-in JSON Schema**: `z.toJSONSchema(schema)`
98: - **`z.uuid()` stricter** (RFC 9562) — use `z.guid()` for permissive matching
99: - **`z.nativeEnum()` deprecated** → `z.enum()` now handles it
100: 
101: ## Performance Notes
102: 
103: - Zod v4 is ~3x faster than v3 for object parsing
104: - Bundle size reduced significantly with `zod/mini`
105: - TypeScript compilation times reduced
106: - Refinements stored within schema (interleavable with other methods)
107: 
108: ## Ecosystem Routing
109: 
110: | When working on... | Also load... | Because... |
111: |---------------------|--------------|------------|
112: | Tool schema definitions | `stack-opencode` | Zod→JSON Schema conversion has silent failures (see tool-internals.md) |
113: | Testing schema validation | `stack-vitest` | Schema test patterns, edge case coverage |
114: | TDD with schema validation | `hm-test-driven-execution` | RED/GREEN/REFACTOR for schema development |
115: | API boundary validation | `stack-nextjs` | Route handler validation with Zod |
116: 
117: ---
118: 
119: *Source: colinhacks/zod v4.0.1 · Repomix download 2026-04-28*
120: 
121: ## Self-Correction
122: 
123: > Reference documents provide facts, not workflows. When facts conflict with reality, this section guides resolution.
124: 
125: ### When Information Is Outdated
126: 1. **Check the version in frontmatter** (currently: 4.x) — Zod v4 is stable but evolving; patch versions may add features.
127: 2. **Verify against official docs:** https://zod.dev or `npx --yes ctx7 library zod "v4 migration guide"`.
128: 3. **Check installed version:** `npm list zod` or `node -e "console.log(require('zod/package.json').version)"`.
129: 4. **The v4 changes cheat sheet (lines 84-95) is the most version-sensitive section:** If Zod v5 releases, the entire cheat sheet becomes historical — check `references/migration/v3-to-v4.md` for the migration meta-pattern.
130: 
131: ### When Unsure About API Accuracy
132: 1. **Corroborate with source:** Read `node_modules/zod/lib/index.d.ts` or `node_modules/zod/v4/core/index.d.ts` for type signatures.
133: 2. **Check bundled references** (`references/api/types.md`, `references/api/methods.md`) — extracted from v4.0.1.
134: 3. **The import paths table (lines 60-67) is critical:** If an import path doesn't resolve, Zod's package structure may have changed. Verify with `node -e "require.resolve('zod')"`.
135: 
136: ### When the User Contradicts Reference Content
137: 1. **Cite the source:** "This stack-zod reference (v4.x) documents [specific API]. Your installed version may differ — check `zod/package.json` version."
138: 2. **Offer verification:** Parse a test schema with `z.object({}).safeParse({})` — if it works but the API shape differs, the reference is out of date.
139: 3. **Do not override:** User's installed zod version has final authority. Migration advice (e.g., "use `.extend()` instead of `.merge()`") should be verified against their runtime.
140: 
141: ### When an Edge Case Is Encountered
142: 1. **Document the gap:** Missing coverage includes Zod v4→v5 compatibility path, `zod/mini` tree-shaking strategies, discriminated union auto-complete behavior, `z.preprocess` vs `z.pipe` performance, recursive schema patterns, and integration with non-TypeScript environments.
143: 2. **Search bundled references** — `references/expert-guide.md` and `references/anti-patterns.md` cover deeper patterns.
144: 3. **Check GitHub issues:** `colinhacks/zod` for known edge cases and RFCs.
145: 4. **Escalate to skill maintainer:** File an update request with Zod version, schema definition, and observed vs expected behavior.

(End of file - total 145 lines)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/stack-l3-vitest/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/stack-l3-nextjs/SKILL.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/skills/stack-l3-nextjs/SKILL.md</path>
<type>file</type>
<content>
1: ---
2: name: stack-l3-nextjs
3: version: "16.2.2"
4: description: "Next.js 16.x stack reference — App Router architecture, server/client components, route handlers, proxy, cache components, Turbopack"
5: category: stack
6: classification: how-to-implement
7: triggers:
8:   - "next.js"
9:   - "nextjs"
10:   - "app router"
11:   - "server component"
12:   - "client component"
13:   - "route handler"
14:   - "server action"
15:   - "middleware"
16:   - "proxy.ts"
17:   - "sidecar"
18:   - "dashboard"
19:   - "api route"
20:   - "next.config"
21:   - "turbopack"
22:   - "use cache"
23:   - "cache components"
24: metadata:
25:   layer: "3"
26:   role: "reference"
27:   lineage: "stack"
28: ---
29: 
30: # Next.js 16.x Stack Reference
31: 
32: > Auto-generated stack skill for Next.js 16.2.2 (March 2026).
33: > Covers App Router, Cache Components, Turbopack defaults, proxy.ts migration,
34: > and the async request API breaking changes.
35: 
36: ## When to Use This Skill
37: 
38: - Building or modifying Next.js 16 App Router pages, layouts, or APIs
39: - Creating server/client components and understanding rendering boundaries
40: - Writing route handlers or server actions
41: - Configuring next.config.ts for Turbopack, caching, or proxy
42: - Migrating from Next.js 15 → 16 (middleware → proxy, async params, etc.)
43: - Building sidecar dashboards that consume `.hivemind/` or `.planning/` state
44: 
45: ## Quick Reference: What Changed in Next.js 16
46: 
47: | Area | Next.js 15 | Next.js 16 |
48: |------|-----------|-----------|
49: | Default bundler | Webpack | **Turbopack** (opt out with `--webpack`) |
50: | Middleware file | `middleware.ts` | **`proxy.ts`** (deprecated name) |
51: | `params` / `searchParams` | Synchronous | **Async** (must `await`) |
52: | `cookies()` / `headers()` / `draftMode()` | Sync | **Async** |
53: | Caching | `unstable_cache` | **`"use cache"` directive** + `cacheComponents` |
54: | PPR | `experimental.ppr` | **`cacheComponents: true`** |
55: | `serverRuntimeConfig` | Supported | **Removed** — use env vars |
56: | `next lint` | Built-in | **Removed** — use ESLint directly |
57: | React version | 19 | **React 19.2** (View Transitions, `useEffectEvent`) |
58: 
59: ## Architecture Overview
60: 
61: ```
62: ┌─────────────────────────────────────────────────────────┐
63: │                     Browser / Client                     │
64: │          Client Components ('use client')                │
65: │     ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
66: │     │  RSC Payload │  │  Hydration │  │  Client Interactivity│   │
67: │     └──────┬───────┘  └──────┬─────┘  └────────┬─────────┘   │
68: └────────────┼─────────────────┼─────────────────┼─────────────┘
69:              │                 │                 │
70:              ▼                 ▼                 ▼
71: ┌─────────────────────────────────────────────────────────┐
72: │                      Next.js Server                      │
73: │  ┌────────────┐  ┌─────────────┐  ┌──────────────────┐ │
74: │  │ Server      │  │ Route       │  │ Server Actions    │ │
75: │  │ Components  │  │ Handlers    │  │ ('use server')    │ │
76: │  │ (default)   │  │ (route.ts)  │  │  (mutations)      │ │
77: │  └──────┬──────┘  └──────┬──────┘  └────────┬─────────┘ │
78: │         │                │                   │            │
79: │         ▼                ▼                   ▼            │
80: │  ┌──────────────────────────────────────────────────┐   │
81: │  │              Cache Layer ("use cache")            │   │
82: │  │   cacheLife profiles · cacheTag · updateTag       │   │
83: │  └──────────────────────────────────────────────────┘   │
84: │         │                                                │
85: │         ▼                                                │
86: │  ┌──────────────────────────────────────────────────┐   │
87: │  │              proxy.ts (network boundary)           │   │
88: │  │   Routing · Redirects · Headers · Auth checks     │   │
89: │  └──────────────────────────────────────────────────┘   │
90: └─────────────────────────────────────────────────────────┘
91: ```
92: 
93: ## File Conventions Quick Reference
94: 
95: | File | Purpose | Rendering |
96: |------|---------|-----------|
97: | `page.tsx` | Public route endpoint | Server Component |
98: | `layout.tsx` | Shared UI wrapper (preserves state) | Server Component |
99: | `template.tsx` | Layout that re-renders on navigation | Server Component |
100: | `loading.tsx` | Loading skeleton (Suspense) | Server Component |
101: | `error.tsx` | Error boundary | **Client Component** |
102: | `route.ts` | API endpoint (GET, POST, etc.) | Server-only |
103: | `default.tsx` | Fallback for parallel routes | Server Component |
104: | `not-found.tsx` | 404 UI | Server Component |
105: | `proxy.ts` | Network boundary (replaces middleware) | Edge/Node |
106: 
107: ## Table of Contents
108: 
109: See [TOC.md](./TOC.md) for full navigation.
110: 
111: ### API References
112: - [App Router — file routing, layouts, pages](./references/api/app-router.md)
113: - [Route Handlers — API routes, server actions](./references/api/route-handlers.md)
114: - [Components — server/client boundaries](./references/api/components.md)
115: - [Configuration — next.config.ts, Turbopack, cache](./references/api/configuration.md)
116: 
117: ### Patterns
118: - [Dashboard development patterns](./references/patterns/dev.md)
119: - [API design for sidecar applications](./references/patterns/api-design.md)
120: - [Cross-stack integration examples](./references/patterns/cross-stack.md)
121: 
122: ### Pitfalls
123: - [Anti-patterns and common mistakes](./references/anti-patterns.md)
124: 
125: ## Decision Trees
126: 
127: ### Route Handler vs Server Action
128: 
129: ```
130: Need to handle an HTTP request?
131: ├── Is it a mutation from a <form>?         → Server Action ('use server')
132: ├── Is it called from a button with formAction? → Server Action
133: ├── Does it need to return JSON to fetch()?  → Route Handler (route.ts)
134: ├── Does it need custom status codes?        → Route Handler
135: ├── Does it need CORS headers?               → Route Handler
136: ├── Is it a webhook receiver?                → Route Handler
137: └── Is it a simple form submission?          → Server Action
138: ```
139: 
140: ### Caching Strategy
141: 
142: ```
143: Need to cache data?
144: ├── Is it fetched in a Server Component?     → "use cache" directive + cacheLife()
145: ├── Is it per-request deduplication?         → React cache() (no directive)
146: ├── Does it need tag-based invalidation?     → "use cache" + cacheTag() + revalidateTag()
147: ├── Is it client-side data?                  → fetch with Next.js cache options
148: └── Is it static at build time?              → Fetch at build, no "use cache" needed
149: ```
150: 
151: ### Rendering Strategy
152: 
153: ```
154: How should this page render?
155: ├── Data changes every request?              → Dynamic (no cache, reads cookies/headers)
156: ├── Data changes periodically?               → ISR via "use cache" + cacheLife('minutes')
157: ├── Data is static?                          → Static (default for Server Components)
158: ├── Page has both static and dynamic parts?  → cacheComponents: true (PPR)
159: └── Page streams slow data?                  → Suspense boundary + async Server Component
160: ```
161: 
162: ## Critical Rules for Next.js 16
163: 
164: 1. **Always `await` request APIs**: `cookies()`, `headers()`, `draftMode()`, `params`, `searchParams`
165: 2. **Use `proxy.ts` not `middleware.ts`**: The old filename is deprecated
166: 3. **Turbopack is default**: Only use `--webpack` if a plugin requires it
167: 4. **Explicit caching with `"use cache"`**: No more implicit route caching
168: 5. **`cacheComponents: true`** enables PPR in next.config.ts
169: 6. **React 19.2**: View Transitions, `useEffectEvent`, Activity available
170: 
171: ## Ecosystem Routing
172: 
173: | When working on... | Also load... | Because... |
174: |---------------------|--------------|------------|
175: | Route handler validation | `stack-zod` | Input/output schema validation for API routes |
176: | Testing Next.js components | `stack-vitest` | Server component mocking, route handler testing |
177: | Deployment readiness | `gate-evidence-truth` | L1-L5 evidence for deployment gates |
178: | Sidecar reads OpenCode state | `stack-opencode` | SSE events, SDK client for .hivemind/ reads |
179: 
180: ---
181: 
182: *Stack skill generated: 2026-04-28 · Next.js 16.2.2 · React 19.2*
183: 
184: ## Self-Correction
185: 
186: > Reference documents provide facts, not workflows. When facts conflict with reality, this section guides resolution.
187: 
188: ### When Information Is Outdated
189: 1. **Check the version in frontmatter** (currently: 16.2.2) — Next.js releases monthly; the reference may lag.
190: 2. **Verify against official docs:** `npx --yes ctx7 library next.js "Migration Guide"` or visit https://nextjs.org/docs.
191: 3. **Check installed version:** Run `npx next --version` or check `package.json` for the project's Next.js version.
192: 4. **Migration table is the most version-sensitive content:** If upgrading from a version not in the 15→16 range, the table may not apply. Check `references/api/configuration.md` for general config guidance.
193: 
194: ### When Unsure About API Accuracy
195: 1. **Corroborate with source:** Read `node_modules/next/dist/**/*.d.ts` for TypeScript signatures, or use Next.js's own `next typecheck`.
196: 2. **Check bundled references** (`references/api/app-router.md`, `references/api/route-handlers.md`, etc.) — extracted from 16.2.2 behavior.
197: 3. **Critical rules (lines 158-166) are behavioral, not API:** If the behavior contradicts official docs, the official docs win for the installed version.
198: 
199: ### When the User Contradicts Reference Content
200: 1. **Cite the source:** "This stack-nextjs reference (v16.2.2) documents [specific behavior]. Your project uses Next.js [X.Y.Z] — the behavior may have changed."
201: 2. **Offer verification:** Check the Next.js changelog at https://github.com/vercel/next.js/releases for version-specific changes.
202: 3. **Do not override:** The user's project configuration and version take precedence over reference content.
203: 
204: ### When an Edge Case Is Encountered
205: 1. **Document the gap:** Missing coverage includes Next.js 16.0→16.2 incremental changes, App Router parallel routes with Suspense, server action form validation patterns, proxy.ts auth middleware patterns, and Turbopack webpack loader compatibility workarounds.
206: 2. **Search bundled references** (`references/`) — anti-patterns and pattern docs may cover specific edge cases.
207: 3. **Check GitHub issues:** `vercel/next.js` for known issues with your version.
208: 4. **Escalate to skill maintainer:** File an update request with the specific version, scenario, and observed vs expected behavior.

(End of file - total 208 lines)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/stack-l3-bun-pty/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/stack-l3-json-render/SKILL.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/skills/stack-l3-json-render/SKILL.md</path>
<type>file</type>
<content>
1: ---
2: name: stack-l3-json-render
3: version: 0.18.x
4: description: >
5:   @json-render/react by Vercel Labs — Generative UI framework that constrains AI output
6:   to structured JSON mapped to predefined React components. Used as the core rendering
7:   engine for the Hivemind GUI side-car dashboard.
8: triggers:
9:   - "json-render"
10:   - "JSON render"
11:   - "generative UI"
12:   - "dashboard widget"
13:   - "data visualization"
14:   - "structured UI"
15:   - "JSON schema UI"
16:   - "spec stream"
17:   - "defineCatalog"
18:   - "defineRegistry"
19:   - "JSONUIProvider"
20:   - "useUIStream"
21:   - "spec-driven UI"
22: metadata:
23:   layer: "3"
24:   role: "reference"
25:   lineage: "stack"
26: ---
27: 
28: # @json-render/react Stack Reference
29: 
30: **Package:** `@json-render/react` + `@json-render/core`
31: **Maintainer:** Vercel Labs
32: **Repo:** `vercel-labs/json-render` on GitHub
33: **Docs:** https://json-render.dev
34: **License:** Apache 2.0
35: **Version tracked:** 0.18.x (latest as of 2026-04-28)
36: **Context7 ID:** `/vercel-labs/json-render`
37: 
38: ## Quick Links
39: 
40: - [TOC](./TOC.md) — Full table of contents
41: - [Architecture](./references/architecture.md) — How json-render works
42: - [API: Components](./references/api/components.md) — React components and providers
43: - [API: Schemas](./references/api/schemas.md) — Spec, Catalog, Element schemas
44: - [API: Rendering](./references/api/rendering.md) — Rendering pipeline
45: - [API: Types](./references/api/types.md) — TypeScript type reference
46: - [Patterns: Dashboard](./references/patterns/dashboard.md) — Dashboard development patterns
47: - [Patterns: Widgets](./references/patterns/widgets.md) — Widget creation patterns
48: - [Metadata](./metadata.json) — Version and package metadata
49: 
50: ## Core Concepts (30-second overview)
51: 
52: 1. **Catalog** (`defineCatalog`) — Declares what components and actions AI can use (Zod schemas)
53: 2. **Registry** (`defineRegistry`) — Maps catalog component names to actual React components
54: 3. **Renderer** — Takes a flat JSON spec + registry and renders the React tree
55: 4. **SpecStream** — Progressive streaming of specs via JSON Patch (RFC 6902)
56: 5. **StateStore** — Built-in state management with `$state`, `$cond`, `$bindState` expressions
57: 
58: ## Installation
59: 
60: ```bash
61: npm install @json-render/core @json-render/react
62: # Peer deps: react ^19.0.0, zod ^4.0.0
63: ```
64: 
65: ## Minimal Example
66: 
67: ```typescript
68: import { defineCatalog } from "@json-render/core";
69: import { schema } from "@json-render/react/schema";
70: import { defineRegistry, Renderer } from "@json-render/react";
71: import { z } from "zod";
72: 
73: // 1. Define catalog (what AI can use)
74: const catalog = defineCatalog(schema, {
75:   components: {
76:     Card: { props: z.object({ title: z.string() }), description: "Card container" },
77:     Button: { props: z.object({ label: z.string() }), description: "Clickable button" },
78:   },
79: });
80: 
81: // 2. Define registry (React implementations)
82: const { registry } = defineRegistry(catalog, {
83:   components: {
84:     Card: ({ props, children }) => <div><h3>{props.title}</h3>{children}</div>,
85:     Button: ({ props, emit }) => <button onClick={() => emit("press")}>{props.label}</button>,
86:   },
87: });
88: 
89: // 3. Render a spec
90: const spec = {
91:   root: "card-1",
92:   elements: {
93:     "card-1": { type: "Card", props: { title: "Hello" }, children: ["btn-1"] },
94:     "btn-1": { type: "Button", props: { label: "Click" }, children: [] },
95:   },
96: };
97: 
98: <Renderer spec={spec} registry={registry} />;
99: ```
100: 
101: ## Related Packages
102: 
103: | Package | Purpose |
104: |---------|---------|
105: | `@json-render/shadcn` | 36 pre-built shadcn/ui components |
106: | `@json-render/devtools-react` | Inspector panel (tree-shakes to null in prod) |
107: | `@json-render/mcp` | MCP Apps integration |
108: | `@json-render/zustand` | Zustand state adapter |
109: | `@json-render/redux` | Redux state adapter |
110: 
111: ## Decision Trees
112: 
113: ### When to use json-render vs alternatives
114: 
115: ```
116: Need AI-generated UI from prompts? → json-render
117: Need static dashboards with known layouts? → plain React
118: Need SEO-critical pages? → RSC (Server Components)
119: Need complex form validation? → React Hook Form + Zod
120: ```
121: 
122: ### State management
123: 
124: ```
125: Read-only display? → $state (built-in StateStore)
126: Two-way form binding? → $bindState / $bindItem
127: Already using Zustand? → @json-render/zustand adapter
128: Need derived values? → $computed + functions prop
129: ```
130: 
131: ### Component strategy
132: 
133: ```
134: 36 standard UI components fast? → @json-render/shadcn
135: Custom dashboard? → Own catalog + registry
136: 3D scenes? → @json-render/react-three-fiber
137: Dev inspector? → @json-render/devtools-react (null in prod)
138: ```
139: 
140: ## Ecosystem Routing
141: 
142: | When working on... | Also load... | Because... |
143: |---------------------|--------------|------------|
144: | Dashboard consuming OpenCode events | `stack-opencode` | SSE event types, session state for rendering |
145: | Testing rendering components | `stack-vitest` | Component test patterns with catalog/registry mocks |
146: | Dashboard in Next.js sidecar | `stack-nextjs` | Server components, route handlers for state reads |
147: | Schema validation for AI specs | `stack-zod` | Spec validation with validateSpec + autoFixSpec |
148: 
149: ## Cross-Stack Integration
150: 
151: - [Integration Guide](./references/integration.md) — Next.js App Router, Vercel AI SDK chat, error boundaries, Vitest testing, code export, debugging workflow, catalog design methodology
152: 
153: ## Self-Correction
154: 
155: > Reference documents provide facts, not workflows. When facts conflict with reality, this section guides resolution.
156: 
157: ### When Information Is Outdated
158: 1. **Check the version in frontmatter** (currently: 0.18.x) — the package is pre-1.0; expect API churn.
159: 2. **Verify against live docs:** https://json-render.dev for official examples. Use Context7: `npx --yes ctx7 library @json-render/react "defineCatalog API"`.
160: 3. **Check npm registry:** `npm view @json-render/react version` for latest published version, `npm view @json-render/react versions` for changelog timeline.
161: 4. **If zod version differs:** The package peer-depends on `zod ^4.0.0` — Zod v5 may break catalog/registry schemas. Verify compatibility matrix.
162: 
163: ### When Unsure About API Accuracy
164: 1. **Corroborate with source:** Read `node_modules/@json-render/react/dist/index.d.ts` and `@json-render/core/dist/index.d.ts` for type definitions.
165: 2. **Check bundled references** (`references/api/components.md`, `references/api/schemas.md`, `references/api/types.md`) — extracted from source at tracked version.
166: 3. **The minimal example (lines 63-95) is the ground truth:** If it doesn't compile, the skill is stale. Report the specific error.
167: 
168: ### When the User Contradicts Reference Content
169: 1. **Cite the source:** "This stack-json-render reference (v0.18.x) documents [specific API]. Your version may differ — check `npm list @json-render/react`."
170: 2. **Offer verification:** Run `npm info @json-render/react` to compare installed vs documented versions.
171: 3. **Do not override:** Reference documents are informational — user's project setup has final authority.
172: 
173: ### When an Edge Case Is Encountered
174: 1. **Document the gap:** Missing coverage includes SpecStream update semantics, StateStore write-through behavior, catalog/registry mismatch error messages, and Zod v5 compatibility.
175: 2. **Search bundled references** (`references/`) — integration and pattern docs may cover specific scenarios.
176: 3. **Check GitHub issues:** `vercel-labs/json-render` repo for known bugs and workarounds.
177: 4. **Escalate to skill maintainer:** File an update request for recurring edge cases with reproduction steps.

(End of file - total 177 lines)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/stack-l3-opencode/SKILL.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/skills/stack-l3-opencode/SKILL.md</path>
<type>file</type>
<content>
1: ---
2: name: stack-l3-opencode
3:   version: "1.14.44"
4:   description: "OpenCode SDK v1.14.44 + Plugin internals for feature development, architecture, auditing, quality checking, test building, TUI development, ACP IDE integration, and gatekeeping. Use when you need to: create an OpenCode tool, register a plugin hook, understand chat.params or shell.env, work with the TUI keymap API, implement ACP agent client protocol, debug hook composition chains, validate tool schemas with Zod, handle session compaction, build TUI plugins with keybindings, integrate OpenCode with an IDE via ACP, or understand the SDK client/server architecture. Contains BEYOND-DOCS expert knowledge extracted from anomalyco/opencode source. Triggers on: opencode sdk, opencode plugin, definePlugin, tool registration, hook registration, session management, delegate task, opencode api, plugin development, opencode tool, opencode hook, tool.execute, chat.params, chat.headers, shell.env, permission.ask, session.compacting, ToolContext, ToolResult, PluginInput, Hooks, AuthHook, ProviderHook, createOpencodeClient, BunShell, hook composition, tool schema validation, opencode sse, opencode abort signal, acp protocol, agent client protocol, TUI keymap, workspace adapter, api.keymap, TUI plugin, ACP integration, IDE integration, keybinding, keymap registerLayer, opencode ACP, opencode TUI v2, stack opencode, opencode reference, opencode API docs."
5: metadata:
6:   layer: "3"
7:   role: "reference"
8:   lineage: "stack"
9: ---
10: 
11: # Stack: OpenCode SDK + Plugin
12: 
13: > **Version:** 1.14.44 | **Source:** [anomalyco/opencode](https://github.com/anomalyco/opencode) | **Bundled:** 22,771 lines
14: 
15: ## ⚠️ Key Gotchas (Read Before Coding)
16: 
17: 1. **`tool()` is an identity function** — zero runtime validation, pure TypeScript branding
18: 2. **`context.ask()` returns Effect, not Promise** — `await` does nothing; use `Effect.runPromise()`
19: 3. **Hook output is mutable pass-through** — last-write-wins at field level; always spread
20: 4. **`z.transform()`/`.refine()`/`z.lazy()` silently break** in tool schemas — only use primitives
21: 5. **Abort signal is cooperative** — runtime doesn't force-kill your async operations
22: 6. **Session has no "completed" state** — only idle/busy/retry; sessions live until deleted
23: 7. **No hook priority system** — ordering determined by `Config.plugin[]` array position
24: 
25: > ⚠️ **Validation Gate:** These gotchas are behavioral claims verified at v1.14.44. Before relying on any gotcha in production code, perform live verification via MCP tools (see Constitutional Compliance section). SDK updates may invalidate these claims.
26: 
27: ## Quick Navigation
28: 
29: | Document | What You'll Find | When to Load |
30: |----------|-----------------|--------------|
31: | **[Expert: Hook Composition](references/expert/hook-composition.md)** | Multi-plugin ordering, output mutation, compaction flow, event types (32-40+), permission override | Writing hooks, debugging hook chains, compaction recovery |
32: | **[Expert: Tool Internals](references/expert/tool-internals.md)** | tool() zero-validation, Zod→JSON Schema failures, ToolResult shape, ToolState machine | Creating tools, debugging tool errors, schema design |
33: | **[Expert: Client-Server](references/expert/client-server.md)** | SSE event bus, session lifecycle, prompt_async, part mutations, v1 vs v2 differences | SDK integration, delegation, session recovery |
34: | [API: Plugin](references/api/plugin.md) | Hook signatures, PluginInput shape, auth/provider hooks | Looking up exact TypeScript signatures |
35: | [API: SDK](references/api/sdk.md) | Session CRUD, messaging, client setup | SDK client usage |
36: | [API: Types](references/api/types.md) | All exported TypeScript types | Type lookup |
37: | [Patterns: Dev](references/patterns/dev.md) | Tool creation, hook wiring, plugin assembly | Feature development |
38: | [Patterns: Testing](references/patterns/testing.md) | Mock SDK, tool testing, hook testing | Writing tests |
39: | [Patterns: Gatekeeping](references/patterns/gatekeeping.md) | Quality gates, type safety, hook correctness | Code review |
40: | **[API: ACP](references/api/acp.md)** | Agent Client Protocol — JSON-RPC over stdio for IDE integration | Building IDE plugins, Zed/VS Code integration |
41: | **[API: TUI v2](references/api/tui-v2.md)** | TUI keymap API, keybinding layers, command dispatch | TUI plugin development, custom keybindings |
42: | **[Pipeline Patterns](references/pipeline-patterns.md)** | How stack-opencode composes with other skills in development workflows | Architecture design, workflow composition |
43: | **[Stack Chains](references/stack-chains.md)** | Dependency ordering between stack-* skills | Skill loading order, dependency resolution |
44: | **[Department Bundles](references/department-bundles.md)** | Role-based skill loading bundles | Team configuration, agent setup |
45: 
46: ## Decision Trees
47: 
48: ### "Should I use a tool or a hook?"
49: 
50: ```
51: Need the LLM to call it?           → TOOL (tool.execute flow)
52: Need to modify LLM behavior?       → HOOK (chat.params, tool.definition)
53: Need to observe events?            → EVENT hook (fire-and-forget)
54: Need to inject env vars?           → SHELL.ENV hook (not tool args!)
55: Need to auto-approve permissions?  → PERMISSION.ASK hook
56: Need to recover from compaction?   → SESSION.COMPACTING + AUTOCONTINUE hooks
57: ```
58: 
59: ### "Which Zod types work in tool schemas?"
60: 
61: ```
62: z.string/number/boolean/array/object/enum/optional → ✅ Reliable
63: z.record/tuple/union/default                        → ⚠️ Partial conversion
64: z.transform/refine/lazy/any                         → ❌ Silent failure
65: ```
66: 
67: ### "Which SDK version should I use?"
68: 
69: ```
70: Need workspace isolation or session restore? → v2 (createOpencodeClient v2)
71: Just basic session/message CRUD?             → v1 works fine
72: Writing a plugin (hooks/tools)?              → Plugin API is version-independent
73: ```
74: 
75: ## Ecosystem Routing
76: 
77: | When working on... | Also load... | Because... |
78: |---------------------|--------------|------------|
79: | Tool schemas with Zod | `stack-zod` | Zod→JSON Schema conversion has silent failures |
80: | Testing plugin behavior | `stack-vitest` | SDK mocking patterns, ToolContext mock setup |
81: | Next.js sidecar dashboard | `stack-nextjs` | Sidecar reads SSE events, consumes SDK client |
82: | Quality gate for plugin code | `gate-lifecycle-integration` | 9-surface mutation authority table, CQRS boundaries |
83: | Evidence for tool outputs | `gate-evidence-truth` | L1-L5 hierarchy, ToolStateCompleted as evidence |
84: | Spec compliance for features | `gate-spec-compliance` | Traceability between specs and tool/hook implementations |
85: 
86: ## Source Files (for grep in bundled/)
87: 
88: | Package | Key Files |
89: |---------|-----------|
90: | `@opencode-ai/plugin` | `index.ts` (types), `tool.ts` (helper), `shell.ts` (BunShell), `tui.ts` (TUI API) |
91: | `@opencode-ai/sdk` | `index.ts`, `client.ts`, `server.ts`, `gen/sdk.gen.ts`, `gen/types.gen.ts` |
92: 
93: ## Updating
94: 
95: Run `scripts/update.sh` to re-download source when OpenCode version changes.
96: 
97: ## 🔨 IRON CLAW: Tech-Stack References & Assets Consumption Governance
98: 
99: > **ABSOLUTE RULE:** No bundled reference, cached asset, or stale pattern from this skill shall be consumed for tech-stack API interface decisions without MCP-verified validation against the project's ACTUAL versions (package.json + lockfile), canonical source mappings (`.hivemind/STACKS-REFERENCES.md`), AND a raw codebase context scan of the current implementation state.
100: 
101: ### Rationale
102: 
103: Skills bundle references and assets as ORIENTATION tools — they help you understand WHAT exists and WHERE to look. But every bundled reference is a SNAPSHOT, frozen at the moment of ingestion. Stacks evolve: packages release breaking changes, APIs shift, SDKs deprecate surfaces. Using stale bundled signatures as implementation authority produces silent runtime errors.
104: 
105: ### Mandatory 5-Step Validation Chain
106: 
107: Before ANY tech-stack API interface from this skill's references/assets is used for implementation, code generation, or quality gate decisions:
108: 
109: ```
110: STEP 1 — CONSUME .hivemind/STACKS-REFERENCES.md
111:  ├─ Read the canonical stack→repo→version mapping table
112:  ├─ Identify the correct GitHub repo for each dependency
113:  └─ Confirm the repo is active (not archived), version is current
114: 
115: STEP 2 — READ package.json + lockfile
116:  ├─ Extract the ACTUAL installed version (npm ls / grep lockfile)
117:  ├─ Cross-reference repo URL from STACKS-REFERENCES.md against npm registry
118:  └─ Flag any discrepancy between bundled version and installed version
119: 
120: STEP 3 — RAW CODEBASE CONTEXT SCAN
121:  ├─ grep/glob the actual src/ directory structure for current implementation
122:  ├─ Read current implementation files — not stale docs or bundled references
123:  ├─ Verify the claimed API signatures match current codebase reality
124:  └─ Check import paths, type definitions, and function signatures exist in actual code
125: 
126: STEP 4 — MCP LIVE VALIDATION (minimum 2 tools)
127:  ├─ Context7: resolve-library-id → query-docs (API signatures at installed version)
128:  ├─ DeepWiki: ask-question (architecture patterns, behavioral semantics)
129:  ├─ Repomix: pack-remote-repository (full repo analysis at correct version tag)
130:  ├─ Exa: web-search (latest docs, tutorials, migration guides)
131:  ├─ Tavily: search + extract (version-specific migration info)
132:  ├─ GitHub: get-file-contents (exact source verification at correct version)
133:  └─ GitMCP: search-code (source-level pattern matching)
134: 
135: STEP 5 — VERIFICATION RECORD
136:  ├─ Source URL + version confirmed to match package.json
137:  ├─ MCP tool(s) used + fetch timestamp
138:  ├─ Codebase scan paths + findings
139:  ├─ Version match status (MATCHED / MISMATCHED / UNVERIFIED)
140:  └─ Flag as BLOCKING if version mismatch or critical staleness detected
141: ```
142: 
143: ### Consumption Rules
144: 
145: | Action | Rule |
146: |--------|------|
147: | **Orientation** (understanding WHAT exists, WHERE to look) | ✅ Reference-tier allowed from bundled assets without live validation |
148: | **API signature lookup** for implementation | 🚫 BLOCKED without live MCP validation (Step 4) + codebase scan (Step 3) |
149: | **Interface verification** for quality gates | 🚫 BLOCKED without live MCP validation (Step 4) + version match (Step 2) |
150: | **Version-sensitive behavioral claims** | 🚫 BLOCKED without live MCP validation (Step 4) |
151: | **Architecture pattern understanding** | ✅ Reference-tier allowed, but recommend live verification for production decisions |
152: | **Generating code from bundled patterns** | 🚫 BLOCKED — route to live MCP tools for current API surface |
153: 
154: ### Integrated Enforcement Points
155: 
156: | Workflow Phase | IRON CLAW Trigger | Required Validation |
157: |---------------|-------------------|---------------------|
158: | Implementation | Before using any API from bundled refs | Steps 2-4 minimum |
159: | Code review | When verifying API usage against docs | Steps 2-4 minimum |
160: | Quality gate | Before PASS verdict on interface claims | Steps 1-5 full |
161: | Research | When synthesizing findings from cached assets | Steps 4-5 minimum |
162: | Audit | When reporting version-based findings | Steps 1-5 full |
163: 
164: ## Constitutional Compliance: Two-Tier Trust Model
165: 
166: > **This skill enforces a strict two-tier authority model.** Bundled references provide orientation context; live sources provide truth.
167: 
168: ### Trust Tiers
169: 
170: | Tier | Role | Sources | When to Trust |
171: |------|------|---------|---------------|
172: | **Validation Tier** (PRIMARY) | Verify truth | Live Context7, Live DeepWiki, Live GitHub, Live Repomix | For API signatures, version-sensitive claims, breaking changes, current behavior |
173: | **Reference Tier** (SUPPLEMENTARY) | Provide context | Bundled source pack, local cached assets | For architecture orientation, pattern understanding, historical context |
174: 
175: ### Staleness Severity Scale
176: 
177: | Severity | Age | Action |
178: |----------|-----|--------|
179: | CRITICAL | > 24 hours | MUST re-verify via live source before trusting for production decisions |
180: | HIGH | > 7 days | SHOULD re-verify; bundled data acceptable for orientation only |
181: | STANDARD | > 30 days | Re-verify before finalizing findings |
182: | LOW | > 90 days | Treat as potentially outdated; note in findings |
183: 
184: ### Version Drift Detection (MANDATORY GATE)
185: 
186: **Before using ANY bundled reference for production code, perform this check:**
187: 
188: 1. Read the `version` field in `metadata.json` (currently: `1.14.44`)
189: 2. Compare against the consumer's installed versions:
190:    ```bash
191:    npm list @opencode-ai/plugin @opencode-ai/sdk
192:    ```
193: 3. If versions differ:
194:    - **WARN** the consumer that bundled references may be stale
195:    - **REQUIRE** live verification via MCP tools before proceeding
196:    - **NOTE** the version gap in any findings or code comments
197: 4. If versions match: bundled references are valid for orientation but still require live verification for production decisions
198: 
199: ### MCP Live Verification Tools
200: 
201: When live verification is required (which is always before production use), use these C5 tools:
202: 
203: | Tool | Purpose | When to Use |
204: |------|---------|-------------|
205: | `context7_resolve_library_id` → `context7_query_docs` | API documentation lookup | Verifying API signatures, hook shapes, type definitions |
206: | `deepwiki_ask_question` | Architecture pattern queries | Understanding design decisions, composition patterns |
207: | `gitmcp_search_github_com_code` | Source code search | Finding specific implementations, verifying behavioral claims |
208: | `github_get_file_contents` | Read specific files from `anomalyco/opencode` | Checking exact source for a function, type, or constant |
209: | `repomix_pack_remote_repository` | Full repo analysis | When comprehensive source review is needed |
210: 
211: ### Constitutional Gate Rule
212: 
213: > **Before any bundled pattern is used in production code, at least ONE live verification source must confirm the pattern is still valid for the installed version.**
214: 
215: This means:
216: - Gotchas (Section "Key Gotchas") are version-sensitive behavioral claims — verify before trusting
217: - Zod reliability matrix is source-verified at v1.14.44 — re-verify if SDK version changes
218: - Hook ordering rules are derived from specific source — validate against live code
219: - Tool schema patterns may evolve — check current `tool()` implementation before use
220: 
221: ## Self-Correction
222: 
223: > Reference documents provide orientation context, not terminal truth. When facts conflict with reality, this section guides resolution through live verification.
224: 
225: ### When Information May Be Outdated
226: 1. **Check staleness:** Read `metadata.json` `ingest_date` field. If > 7 days, bundled data is HIGH severity staleness — treat as orientation only.
227: 2. **Run version drift detection** (see above). Compare bundled version against installed `@opencode-ai/plugin` and `@opencode-ai/sdk` versions.
228: 3. **Mandatory live verification:** Use MCP tools (`context7_query_docs`, `deepwiki_ask_question`, or `github_get_file_contents` on `anomalyco/opencode`) to verify the specific claim against the installed version.
229: 4. **Run `scripts/update.sh`** to re-download source when a version mismatch is confirmed.
230: 5. **Key gotchas are version-sensitive:** The `context.ask()` returning Effect (not Promise) and `tool()` being an identity function are behavioral claims — MUST be verified via live source.
231: 
232: ### When Unsure About API Accuracy
233: 1. **Live verification first:** Use `context7_resolve_library_id` with query `"@opencode-ai/plugin"` or `"@opencode-ai/sdk"`, then `context7_query_docs` for the specific API.
234: 2. **Fall back to bundled source** for orientation: `references/expert/tool-internals.md` for tool behavior, `references/expert/hook-composition.md` for hook ordering.
235: 3. **Cross-reference with GitHub:** Use `github_get_file_contents` on `anomalyco/opencode` at the matching version tag.
236: 4. **The Zod reliability matrix is source-verified at v1.14.44 only.** If `z.transform()` behavior changes in a newer SDK, the matrix MUST be re-verified via live source.
237: 
238: ### When the User Contradicts Reference Content
239: 1. **Acknowledge the version gap:** "Bundled references are at v1.14.44 (ingested `ingest_date`). Your installed version may differ."
240: 2. **Verify via live source immediately:** Use MCP tools to check the current behavior at the user's version.
241: 3. **User's runtime wins:** If live verification confirms the user's observation, update the finding and note the version where behavior changed.
242: 4. **Do not override with stale data:** Bundled references never override live-verified behavior.
243: 
244: ### When an Edge Case Is Encountered
245: 1. **Document the gap:** Missing coverage includes hook composition with 3+ plugins, ToolContext timeout behavior, SSE event ordering guarantees, session state machine edge cases (retry→idle transition), and permission inheritance across nested delegations.
246: 2. **Search bundled references first** — expert docs (`references/expert/`) cover deep internals for orientation.
247: 3. **Verify via live source:** Use `deepwiki_ask_question` on `anomalyco/opencode` or `github_get_file_contents` to check current behavior.
248: 4. **Check GitHub issues:** `anomalyco/opencode` repo for known SDK bugs.
249: 5. **Escalate to skill maintainer:** File an update request with SDK version, hook/tool chain, observed behavior, and live verification results.

(End of file - total 249 lines)
</content>
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_i5uXZxN9CZJkYqDKuBMv2384"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_02_Sd3qoQa2RUlF7i1Ee4xa9609"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_03_PutKZnW6IAK95LlWkUIS8417"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_04_X7RHRE7f7mUBH0VCOlEz3794"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_05_2bGv6xqB358eGNu4GObo6542"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_06_MKktUiSyf2VdSJjAVMc13871"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_07_5snrwEW2NDgDegid1u7n9320"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/gate-l3-spec-compliance/SKILL.md"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_gsq18QAc20Z5XFeHdoiq8894"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_Qnx1FU8I1Blbl0yIJCyK2114"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/gate-l3-evidence-truth/SKILL.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/skills/gate-l3-evidence-truth/SKILL.md</path>
<type>file</type>
<content>
50: - Performing spec alignment checks — use `gate-spec-compliance` instead
51: - Checking lifecycle coverage — use `gate-lifecycle-integration` instead
52: - Running research or exploration workflows (not gate verification)
53: - The calling workflow has not passed `gate-spec-compliance` yet
54: - No implementation artifacts exist to evaluate
55: 
56: ## 🔨 IRON CLAW: Tech-Stack References & Assets Consumption Governance
57: 
58: > **ABSOLUTE RULE:** No bundled reference, cached asset, or stale pattern from this skill shall be consumed for tech-stack API interface decisions without MCP-verified validation against the project's ACTUAL versions (package.json + lockfile), canonical source mappings (`.hivemind/STACKS-REFERENCES.md`), AND a raw codebase context scan of the current implementation state.
59: 
60: ### Rationale
61: 
62: Skills bundle references and assets as ORIENTATION tools — they help you understand WHAT exists and WHERE to look. But every bundled reference is a SNAPSHOT, frozen at the moment of ingestion. Stacks evolve: packages release breaking changes, APIs shift, SDKs deprecate surfaces. Using stale bundled signatures as implementation authority produces silent runtime errors.
63: 
64: ### Mandatory 5-Step Validation Chain
65: 
66: Before ANY tech-stack API interface from this skill's references/assets is used for implementation, code generation, or quality gate decisions:
67: 
68: ```
69: STEP 1 — CONSUME .hivemind/STACKS-REFERENCES.md

(Showing lines 50-69 of 248. Use offset=70 to continue.)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/stack-l3-vitest/SKILL.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/skills/stack-l3-vitest/SKILL.md</path>
<type>file</type>
<content>
95: ---
96: 
97: *Stack reference for Vitest 4.x. See `TOC.md` for full navigation.*
98: 
99: ## 🔨 IRON CLAW: Tech-Stack References & Assets Consumption Governance
100: 
101: > **ABSOLUTE RULE:** No bundled reference, cached asset, or stale pattern from this skill shall be consumed for tech-stack API interface decisions without MCP-verified validation against the project's ACTUAL versions (package.json + lockfile), canonical source mappings (`.hivemind/STACKS-REFERENCES.md`), AND a raw codebase context scan of the current implementation state.
102: 
103: ### Rationale
104: 
105: Skills bundle references and assets as ORIENTATION tools — they help you understand WHAT exists and WHERE to look. But every bundled reference is a SNAPSHOT, frozen at the moment of ingestion. Stacks evolve: packages release breaking changes, APIs shift, SDKs deprecate surfaces. Using stale bundled signatures as implementation authority produces silent runtime errors.
106: 
107: ### Mandatory 5-Step Validation Chain
108: 
109: Before ANY tech-stack API interface from this skill's references/assets is used for implementation, code generation, or quality gate decisions:
110: 
111: ```
112: STEP 1 — CONSUME .hivemind/STACKS-REFERENCES.md
113:  ├─ Read the canonical stack→repo→version mapping table
114:  ├─ Identify the correct GitHub repo for each dependency

(Showing lines 95-114 of 190. Use offset=115 to continue.)
</content>
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_toQAidZkHDEMXUYSAJ1K3741"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_W8Jhlw3zLSEckV2telCL7002"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_Ist6vQ4heUNkvIz4YWQT7865"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_BVgW9cRrcaa6HrgUBMWz8516"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_0f4VgIKKAanTlpHVNE9g8241"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_oHYVt0XBFcWLA57DY1FI6544"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_zCQNgvKz45akwaUOmWxd1029"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/gate-l3-lifecycle-integration/SKILL.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/skills/gate-l3-lifecycle-integration/SKILL.md</path>
<type>file</type>
<content>
80: `session-journal.ts`, `DelegationManager`. Read-side: hooks, tools, sidecar.
81: Assembly: `plugin.ts`.
82: 
83: ## 🔨 IRON CLAW: Tech-Stack References & Assets Consumption Governance
84: 
85: > **ABSOLUTE RULE:** No bundled reference, cached asset, or stale pattern from this skill shall be consumed for tech-stack API interface decisions without MCP-verified validation against the project's ACTUAL versions (package.json + lockfile), canonical source mappings (`.hivemind/STACKS-REFERENCES.md`), AND a raw codebase context scan of the current implementation state.
86: 
87: ### Rationale
88: 
89: Skills bundle references and assets as ORIENTATION tools — they help you understand WHAT exists and WHERE to look. But every bundled reference is a SNAPSHOT, frozen at the moment of ingestion. Stacks evolve: packages release breaking changes, APIs shift, SDKs deprecate surfaces. Using stale bundled signatures as implementation authority produces silent runtime errors.
90: 
91: ### Mandatory 5-Step Validation Chain
92: 
93: Before ANY tech-stack API interface from this skill's references/assets is used for implementation, code generation, or quality gate decisions:
94: 
95: ```
96: STEP 1 — CONSUME .hivemind/STACKS-REFERENCES.md
97:  ├─ Read the canonical stack→repo→version mapping table
98:  ├─ Identify the correct GitHub repo for each dependency
99:  └─ Confirm the repo is active (not archived), version is current
100: 
101: STEP 2 — READ package.json + lockfile
102:  ├─ Extract the ACTUAL installed version (npm ls / grep lockfile)
103:  ├─ Cross-reference repo URL from STACKS-REFERENCES.md against npm registry
104:  └─ Flag any discrepancy between bundled version and installed version

(Showing lines 80-104 of 276. Use offset=105 to continue.)
</content>
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_6wcnO1I5nAE0q5m2EDuk1508"
}
```

