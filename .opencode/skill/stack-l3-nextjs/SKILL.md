---
name: stack-l3-nextjs
version: "16.2.2"
description: "Next.js 16.x stack reference — App Router architecture, server/client components, route handlers, proxy, cache components, Turbopack"
category: stack
classification: how-to-implement
triggers:
  - "next.js"
  - "nextjs"
  - "app router"
  - "server component"
  - "client component"
  - "route handler"
  - "server action"
  - "middleware"
  - "proxy.ts"
  - "sidecar"
  - "dashboard"
  - "api route"
  - "next.config"
  - "turbopack"
  - "use cache"
  - "cache components"
metadata:
  layer: "3"
  role: "reference"
  lineage: "stack"
---

# Next.js 16.x Stack Reference

> Auto-generated stack skill for Next.js 16.2.2 (March 2026).
> Covers App Router, Cache Components, Turbopack defaults, proxy.ts migration,
> and the async request API breaking changes.

## When to Use This Skill

- Building or modifying Next.js 16 App Router pages, layouts, or APIs
- Creating server/client components and understanding rendering boundaries
- Writing route handlers or server actions
- Configuring next.config.ts for Turbopack, caching, or proxy
- Migrating from Next.js 15 → 16 (middleware → proxy, async params, etc.)
- Building sidecar dashboards that consume `.hivemind/` or `.planning/` state

## Quick Reference: What Changed in Next.js 16

| Area | Next.js 15 | Next.js 16 |
|------|-----------|-----------|
| Default bundler | Webpack | **Turbopack** (opt out with `--webpack`) |
| Middleware file | `middleware.ts` | **`proxy.ts`** (deprecated name) |
| `params` / `searchParams` | Synchronous | **Async** (must `await`) |
| `cookies()` / `headers()` / `draftMode()` | Sync | **Async** |
| Caching | `unstable_cache` | **`"use cache"` directive** + `cacheComponents` |
| PPR | `experimental.ppr` | **`cacheComponents: true`** |
| `serverRuntimeConfig` | Supported | **Removed** — use env vars |
| `next lint` | Built-in | **Removed** — use ESLint directly |
| React version | 19 | **React 19.2** (View Transitions, `useEffectEvent`) |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Browser / Client                     │
│          Client Components ('use client')                │
│     ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│     │  RSC Payload │  │  Hydration │  │  Client Interactivity│   │
│     └──────┬───────┘  └──────┬─────┘  └────────┬─────────┘   │
└────────────┼─────────────────┼─────────────────┼─────────────┘
             │                 │                 │
             ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────┐
│                      Next.js Server                      │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────┐ │
│  │ Server      │  │ Route       │  │ Server Actions    │ │
│  │ Components  │  │ Handlers    │  │ ('use server')    │ │
│  │ (default)   │  │ (route.ts)  │  │  (mutations)      │ │
│  └──────┬──────┘  └──────┬──────┘  └────────┬─────────┘ │
│         │                │                   │            │
│         ▼                ▼                   ▼            │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Cache Layer ("use cache")            │   │
│  │   cacheLife profiles · cacheTag · updateTag       │   │
│  └──────────────────────────────────────────────────┘   │
│         │                                                │
│         ▼                                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │              proxy.ts (network boundary)           │   │
│  │   Routing · Redirects · Headers · Auth checks     │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
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

## File Conventions Quick Reference

| File | Purpose | Rendering |
|------|---------|-----------|
| `page.tsx` | Public route endpoint | Server Component |
| `layout.tsx` | Shared UI wrapper (preserves state) | Server Component |
| `template.tsx` | Layout that re-renders on navigation | Server Component |
| `loading.tsx` | Loading skeleton (Suspense) | Server Component |
| `error.tsx` | Error boundary | **Client Component** |
| `route.ts` | API endpoint (GET, POST, etc.) | Server-only |
| `default.tsx` | Fallback for parallel routes | Server Component |
| `not-found.tsx` | 404 UI | Server Component |
| `proxy.ts` | Network boundary (replaces middleware) | Edge/Node |

## Table of Contents

See [TOC.md](./TOC.md) for full navigation.

### API References
- [App Router — file routing, layouts, pages](./references/api/app-router.md)
- [Route Handlers — API routes, server actions](./references/api/route-handlers.md)
- [Components — server/client boundaries](./references/api/components.md)
- [Configuration — next.config.ts, Turbopack, cache](./references/api/configuration.md)

### Patterns
- [Dashboard development patterns](./references/patterns/dev.md)
- [API design for sidecar applications](./references/patterns/api-design.md)
- [Cross-stack integration examples](./references/patterns/cross-stack.md)

### Pitfalls
- [Anti-patterns and common mistakes](./references/anti-patterns.md)

## Decision Trees

### Route Handler vs Server Action

```
Need to handle an HTTP request?
├── Is it a mutation from a <form>?         → Server Action ('use server')
├── Is it called from a button with formAction? → Server Action
├── Does it need to return JSON to fetch()?  → Route Handler (route.ts)
├── Does it need custom status codes?        → Route Handler
├── Does it need CORS headers?               → Route Handler
├── Is it a webhook receiver?                → Route Handler
└── Is it a simple form submission?          → Server Action
```

### Caching Strategy

```
Need to cache data?
├── Is it fetched in a Server Component?     → "use cache" directive + cacheLife()
├── Is it per-request deduplication?         → React cache() (no directive)
├── Does it need tag-based invalidation?     → "use cache" + cacheTag() + revalidateTag()
├── Is it client-side data?                  → fetch with Next.js cache options
└── Is it static at build time?              → Fetch at build, no "use cache" needed
```

### Rendering Strategy

```
How should this page render?
├── Data changes every request?              → Dynamic (no cache, reads cookies/headers)
├── Data changes periodically?               → ISR via "use cache" + cacheLife('minutes')
├── Data is static?                          → Static (default for Server Components)
├── Page has both static and dynamic parts?  → cacheComponents: true (PPR)
└── Page streams slow data?                  → Suspense boundary + async Server Component
```

## Critical Rules for Next.js 16

1. **Always `await` request APIs**: `cookies()`, `headers()`, `draftMode()`, `params`, `searchParams`
2. **Use `proxy.ts` not `middleware.ts`**: The old filename is deprecated
3. **Turbopack is default**: Only use `--webpack` if a plugin requires it
4. **Explicit caching with `"use cache"`**: No more implicit route caching
5. **`cacheComponents: true`** enables PPR in next.config.ts
6. **React 19.2**: View Transitions, `useEffectEvent`, Activity available

## Ecosystem Routing

| When working on... | Also load... | Because... |
|---------------------|--------------|------------|
| Route handler validation | `stack-zod` | Input/output schema validation for API routes |
| Testing Next.js components | `stack-vitest` | Server component mocking, route handler testing |
| Deployment readiness | `gate-evidence-truth` | L1-L5 evidence for deployment gates |
| Sidecar reads OpenCode state | `stack-opencode` | SSE events, SDK client for .hivemind/ reads |

---

*Stack skill generated: 2026-04-28 · Next.js 16.2.2 · React 19.2*

## Self-Correction

> Reference documents provide facts, not workflows. When facts conflict with reality, this section guides resolution.

### When Information Is Outdated
1. **Check the version in frontmatter** (currently: 16.2.2) — Next.js releases monthly; the reference may lag.
2. **Verify against official docs:** `npx --yes ctx7 library next.js "Migration Guide"` or visit https://nextjs.org/docs.
3. **Check installed version:** Run `npx next --version` or check `package.json` for the project's Next.js version.
4. **Migration table is the most version-sensitive content:** If upgrading from a version not in the 15→16 range, the table may not apply. Check `references/api/configuration.md` for general config guidance.

### When Unsure About API Accuracy
1. **Corroborate with source:** Read `node_modules/next/dist/**/*.d.ts` for TypeScript signatures, or use Next.js's own `next typecheck`.
2. **Check bundled references** (`references/api/app-router.md`, `references/api/route-handlers.md`, etc.) — extracted from 16.2.2 behavior.
3. **Critical rules (lines 158-166) are behavioral, not API:** If the behavior contradicts official docs, the official docs win for the installed version.

### When the User Contradicts Reference Content
1. **Cite the source:** "This stack-nextjs reference (v16.2.2) documents [specific behavior]. Your project uses Next.js [X.Y.Z] — the behavior may have changed."
2. **Offer verification:** Check the Next.js changelog at https://github.com/vercel/next.js/releases for version-specific changes.
3. **Do not override:** The user's project configuration and version take precedence over reference content.

### When an Edge Case Is Encountered
1. **Document the gap:** Missing coverage includes Next.js 16.0→16.2 incremental changes, App Router parallel routes with Suspense, server action form validation patterns, proxy.ts auth middleware patterns, and Turbopack webpack loader compatibility workarounds.
2. **Search bundled references** (`references/`) — anti-patterns and pattern docs may cover specific edge cases.
3. **Check GitHub issues:** `vercel/next.js` for known issues with your version.
4. **Escalate to skill maintainer:** File an update request with the specific version, scenario, and observed vs expected behavior.
