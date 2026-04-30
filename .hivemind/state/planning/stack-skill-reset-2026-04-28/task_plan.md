# Stack Skill Reset Plan — 2026-04-28

## Goal
Rewrite ALL stack-* skills as living knowledge bases containing BEYOND-THE-DOCS advanced implementation knowledge. Link them to gate-* skills and hm-* skills. Audit everything with skill-judge.

## Principles (non-negotiable)

1. **Knowledge Delta > 70% Expert** — every paragraph earns its tokens. No re-documentation of official docs.
2. **Universal playbooks** — no project-specific references. Write for ANY team using the technology.
3. **Progressive disclosure strict** — SKILL.md routes, references/ delivers depth, bundled/ is grep-only source.
4. **Cross-ecosystem routing** — stack-* skills link to gate-*, hm-*, and each other. No isolated islands.
5. **All departments served** — architect, developer, test-developer, production-manager, gatekeeper.
6. **Official doc references** — when knowledge exists in official docs, LINK to them, don't copy them.

## Phase 0: Ground Truth (DONE)

Current state:
| Stack | Files | Lines | Bundled | Depth Level |
|-------|-------|-------|---------|-------------|
| stack-opencode | 16 | 23,152 | 452K | Shallow |
| stack-vitest | 16 | 47,056 | 1.3M | Shallow |
| stack-zod | 16 | 2,552 | None | Shallow |
| stack-nextjs | 10 | 1,594 | None | Shallow |
| stack-json-render | 11 | 1,991 | None | Shallow |
| stack-bun-pty | 5 | 425 | None | Minimal |

Gate skills:
| Gate | Files | Lines | Stack Links |
|------|-------|-------|-------------|
| gate-evidence-truth | 10 | 1,016 | None |
| gate-lifecycle-integration | 11 | 1,533 | hm-tech-stack-ingest only |
| gate-spec-compliance | 10 | 1,151 | None |

Contamination: 12 role files nuked. harness-integration.md nuked. Clean slate.

## Phase 1: Audit Current State (NEXT)
- [ ] Audit stack-opencode SKILL.md with skill-judge (8 dimensions)
- [ ] Audit stack-vitest SKILL.md with skill-judge
- [ ] Audit stack-zod SKILL.md with skill-judge
- [ ] Audit stack-nextjs SKILL.md with skill-judge
- [ ] Audit stack-json-render SKILL.md with skill-judge
- [ ] Audit stack-bun-pty SKILL.md with skill-judge
- [ ] Audit gate-evidence-truth SKILL.md with skill-judge
- [ ] Audit gate-lifecycle-integration SKILL.md with skill-judge
- [ ] Audit gate-spec-compliance SKILL.md with skill-judge

Output: findings.md with scores and gap analysis per skill.

## Phase 2: Deep Knowledge Extraction
Read bundled sources and extract beyond-the-docs knowledge:

### stack-opencode (PRIORITY — 20K bundled source available)
Read from bundled/opencode-sdk-plugin.md:
- Hook composition internals (what happens when multiple plugins exist)
- tool() Zod schema validation at runtime
- Client-server protocol (HTTP shapes, SSE format, reconnection)
- Session lifecycle state machine (create → prompt → stream → compact → abort)
- Permission cascading resolution
- Structured output validation + retry internals
- Error propagation chains
- V2 client architecture differences

### stack-vitest (44K bundled source available)
Read from bundled/vitest-core.md:
- Test lifecycle state machine internals
- Mock resolution mechanics (vi.mock hoisting)
- Coverage instrumentation internals
- Assertion chain internals (expect().toBe())
- Test isolation and sandbox mechanics
- Custom matcher registration

### stack-zod (no bundle — use Context7 + deep-research)
- Schema compilation internals
- Type inference mechanics (how z.infer actually works)
- Error formatting pipeline
- Transform vs refine vs pipe runtime behavior
- v3→v4 breaking changes with exact migration paths
- Performance characteristics for large schemas

### stack-nextjs (no bundle — use Context7 + deep-research)
- App Router rendering pipeline (RSC → SSR → Client hydration)
- Server/client component boundary enforcement
- Route handler request/response lifecycle
- proxy.ts (Next.js 16) vs. middleware.ts internals
- Caching layer mechanics (fetch cache, full route cache, client cache)
- Streaming andSuspense internals

### stack-json-render (no bundle — use Context7)
- JSON schema → React component resolution pipeline
- Widget composition and nesting mechanics
- Dashboard layout engine internals
- Type safety between schema and components

### stack-bun-pty (minimal — use npm docs + deep-research)
- Native module loading via Bun FFI
- Process lifecycle (spawn → data → exit)
- Cross-platform behavior differences
- Graceful degradation patterns

## Phase 3: Rewrite Stack Skills
For each stack skill, rewrite ALL reference files with deep knowledge:
- api/*.md — Actual type signatures from source, NOT doc rehash
- patterns/*.md — Implementation patterns, gotchas, under-the-hood
- NEW: patterns/cross-stack-*.md — Interaction patterns between stacks
- TOC.md — Updated navigation with progressive disclosure triggers
- SKILL.md — Routing only, with explicit load/don't-load guidance

## Phase 4: Write Role Files (ONLY after deep knowledge exists)
For each stack, create references/roles/ with 4 roles:
- architect.md — System design playbook for this tech
- test-developer.md — Mock boundaries, coverage strategies, edge cases
- production-manager.md — Deployment, monitoring, failure modes
- gatekeeper.md — Quality gates, spec compliance, evidence hierarchy

All universal. No project-specific references.

## Phase 5: Upgrade Gate Skills
- Add cross-references to stack-* skills
- Add evidence validation patterns from stack knowledge
- Link lifecycle gate to stack-opencode plugin API patterns
- Link spec compliance gate to stack-zod schema patterns
- Link evidence truth gate to stack-vitest testing patterns

## Phase 6: Cross-Ecosystem Routing
- SKILL.md files reference each other where stacks interact
- TOC.md files have "Cross-Stack" sections
- gate-* SKILL.md files list which stack skills to load for evidence

## Phase 7: Final Audit
- Re-run skill-judge on all skills
- Target: Grade B or higher (80%+) on every skill
- Verify cross-references resolve (no broken links)
- Verify progressive disclosure (SKILL.md < 200 lines, references load on demand)

## Execution Order
1. Phase 1 → Phase 2 (opencode first) → Phase 3 (opencode first) → Phase 4 → Phase 5 → Phase 6 → Phase 7
2. Within each phase: opencode → vitest → zod → nextjs → json-render → bun-pty
3. Gate skills upgraded in Phase 5 after stack knowledge is deep

## Session Recovery
If disconnected, read this file first. Then check findings.md and progress.md for current state.
