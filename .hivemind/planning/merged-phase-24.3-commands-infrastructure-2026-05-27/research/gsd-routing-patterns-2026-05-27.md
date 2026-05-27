[LANGUAGE: Write this file in en per Language Governance.]
# GSD Routing Architecture — Research Report

**Researched:** 2026-05-27
**Source:** `.hivemind/research/gsd-repo-packed.xml` (GSD-Redux repository analysis)
**Domain:** Command Routing, Namespace Routing, Workflow Execution, Size Budget Enforcement
**Commissioned by:** Phase 24.3+24.4 merger research

## 1. Routing Architecture

```
USER INPUT → Namespace Meta-Skills (6, ~120 tokens) → Command Files (concrete)
  → <execution_context> @-refs → Workflow Files → gsd-tools.cjs CLI Router
  → Family Routers (7 specialized) → CommandRoutingHub (dispatches)
```

## 2. Key Patterns

| Pattern | Description | File Reference |
|---------|-------------|----------------|
| Two-stage namespace routing | 6 ns-* skills with routing tables replacing ~86 flat skills | `.hivemind/research/gsd-repo-packed.xml:38062-38280` |
| `<execution_context>` @-refs | Commands delegate to workflow files via `@`-references | `gsd-repo-packed.xml:36320-37098` |
| CommandRoutingHub | Typed discriminated union result: `{ ok, kind, data }` | `gsd-repo-packed.xml:80114-80180` |
| CJS Router Adapter | ~40-line shared adapter for 7 routers | `gsd-repo-packed.xml:79030-79065` |
| Workflow size budget | XL≤1810, LARGE≤1500, DEFAULT≤1000 | `gsd-repo-packed.xml:300857-300960` |
| Progressive disclosure | `workflows/<name>/modes/` subdirectory | `discuss-phase/modes/default.md, advisor.md, power.md` |
| Compound init commands | `gsd-sdk query init.*` bundles context | `sdk/src/handlers/init/composer.ts` |

## 3. Relevance to Hivemind

- **HIGH**: Structured dispatch result (type discriminated union), CI size budget, compound init
- **MEDIUM**: `<execution_context>` @-refs, progressive disclosure, namespace meta-skills
- **LOW**: Multi-runtime support (Hivemind is OpenCode-only)

## 4. Gaps vs Hivemind

| Gap | GSD Has | Hivemind Status |
|-----|---------|-----------------|
| Structured dispatch result | `CommandRoutingHub` discriminated union | `{ output, metadata, error }` unstructured |
| Namespace meta-skills | 6 ns-* skills at ~120 tokens | Flat listing ~34 skills |
| CI size budget | CI-enforced line limits | No enforcement |
| Compound init | `gsd-sdk query init.*` | No equivalent |
| Dispatch tracing | `DispatchEvent` with `traceId` | No tracing |
