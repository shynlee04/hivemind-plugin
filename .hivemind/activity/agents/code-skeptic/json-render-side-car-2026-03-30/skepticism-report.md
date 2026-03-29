# Code Skepticism Report

**Scope:** json-render side-car architecture claims for hm-settings / dashboard rendering
**Files:** `.hivemind/plans/2026-03-29-json-render-side-car-rendering-engine.md`, `src/tools/hivefiver-setting/{render.ts,dashboard.ts,types.ts,tools.ts}`, `src/features/runtime-entry/settings.ts`, `src/control-plane/sdk-runtime.ts`, `src/schema-kernel/index.ts`, `tests/{runtime-authority-live-sanity.test.ts,runtime-entry-hm-settings-dashboard.test.ts,tools/hivefiver-setting/hm-setting-{render,dashboard-tool}.test.ts}`, `.sdk-lib/{json-render/repomix-json-render.xml,opencode/repomix-opencode.xml}`
**Overall Risk:** high

## High-Risk Issues (Should Fix Before Merge)

1. **"Same spec renders to Ink and React" is only partially evidenced.**
   - React and Ink both use a flat `{ root, elements }` shape in their renderer schemas (`.sdk-lib/json-render/repomix-json-render.xml:109031-109047`, `.sdk-lib/json-render/repomix-json-render.xml:116946-116966`).
   - But json-render also explicitly says **each renderer defines its own schema** (`.sdk-lib/json-render/repomix-json-render.xml:10015-10016`, `.sdk-lib/json-render/repomix-json-render.xml:102765-102765`) and each renderer creates its own catalog from its own schema (`.sdk-lib/json-render/repomix-json-render.xml:4808-4810`, `.sdk-lib/json-render/repomix-json-render.xml:87672-87676`, `.sdk-lib/json-render/repomix-json-render.xml:87875-87876`).
   - The ADR claims target-specific registries already exist conceptually, but not in this repo (`.hivemind/plans/2026-03-29-json-render-side-car-rendering-engine.md:12-12`, `:37-45`, `:53-54`).
   - **Risk if wrong:** the team designs around one “identical JSON” and discovers too late that Ink and React only share a domain envelope, not a fully portable spec.

2. **The required 40/60 Ink split is not implemented, not tested, and not proven readable.**
   - Current Ink renderer is column-only (`src/tools/hivefiver-setting/render.ts:157-166`); current dashboard renderer is plain text (`src/tools/hivefiver-setting/render.ts:198-203`).
   - Current tests assert text payloads and `rendered` strings, not split-pane layout (`tests/tools/hivefiver-setting/hm-setting-render.test.ts:106-145`, `tests/tools/hivefiver-setting/hm-setting-dashboard-tool.test.ts:39-47`, `tests/runtime-entry-hm-settings-dashboard.test.ts:72-77`, `:127-133`).
   - Ink docs in the local SDK reference show Box/flex primitives and width props, but no repo-local proof of a 40/60 hm-settings dashboard (`.sdk-lib/json-render/repomix-json-render.xml:4561-4563`, `:106866-106889`).
   - The ADR itself treats “lock the 40/60 split contract and test it” as future work, not finished proof (`.hivemind/plans/2026-03-29-json-render-side-car-rendering-engine.md:300-305`).
   - **Risk if wrong:** the primary near-term target fails on narrow terminals and the architecture is blocked by layout reality, not schema design.

3. **OpenCode side-car connectivity is only proven at object-construction level, not behavior level.**
   - Local runtime attachment just calls `createOpencodeClient({ baseUrl, directory })` and returns the client without a health check, auth handshake, or event subscription (`src/control-plane/sdk-runtime.ts:76-90`).
   - The only repo test around attach asserts `attached.client` exists; it does not call the client or verify transport (`tests/runtime-authority-live-sanity.test.ts:30-37`).
   - The local OpenCode SDK reference shows examples creating a client with `baseUrl` only (`.sdk-lib/opencode/repomix-opencode.xml:12284-12294`), and SSE/event subscription is demonstrated separately with raw `fetch(${server.url}/event)` parsing (`.sdk-lib/opencode/repomix-opencode.xml:12547-12589`).
   - The ADR explicitly marks side-car attachment and SSE-driven mirroring as proposed, not implemented or proven (`.hivemind/plans/2026-03-29-json-render-side-car-rendering-engine.md:40-45`, `:193-207`, `:288-292`, `:346-346`).
   - Serve docs show the server may bind to `0.0.0.0:4096` and accept CORS origins, but they do not prove an auth model for the side-car surface (`.sdk-lib/opencode/repomix-opencode.xml:8975-8993`).
   - **Risk if wrong:** the dashboard becomes a brittle localhost toy, crashes when OpenCode is absent, or exposes an unauthenticated port surface.

4. **End-to-end `hm-settings -> spec -> TUI + GUI` is mostly rewrite, not simple reuse.**
   - `buildHmSettingDashboardProof()` currently injects a rendered string into the proof object (`src/tools/hivefiver-setting/dashboard.ts:24-54`).
   - `renderHmSettingDashboardTui()` is string formatting, not spec generation (`src/tools/hivefiver-setting/render.ts:198-203`).
   - `renderHmSettingTui()` builds the Ink spec inline inside the tool-local render file (`src/tools/hivefiver-setting/render.ts:156-195`).
   - The tool and runtime-entry tests lock current behavior to `rendered: string` and string matches (`tests/tools/hivefiver-setting/hm-setting-dashboard-tool.test.ts:46-47`, `tests/runtime-entry-hm-settings-dashboard.test.ts:77-77`, `:133-133`).
   - **Risk if wrong:** the team underestimates migration cost and ends up carrying duplicate output paths plus brittle compatibility shims.

5. **Schema-kernel ownership is aspirational; the migration scope is bigger than one type move.**
   - `HmSettingDashboardProof` is still tool-local (`src/tools/hivefiver-setting/types.ts:88-93`).
   - No dashboard envelope types exist in `src/schema-kernel` today (`src/schema-kernel/index.ts:10-18`; grep found no `DashboardRenderEnvelope` in `src/schema-kernel`).
   - The ADR defines `DashboardRenderEnvelope` only in plan text (`.hivemind/plans/2026-03-29-json-render-side-car-rendering-engine.md:122-139`).
   - `buildHmSettingDashboardProof()` depends on `RuntimeBindingsSnapshot` and `RuntimeStatusSnapshot` from non-schema-kernel sectors (`src/tools/hivefiver-setting/dashboard.ts:1-12`).
   - Callers are already coupled to the current proof shape (`src/features/runtime-entry/settings.ts:52-63`, `:93-107`, `:147-160`; `src/tools/hivefiver-setting/tools.ts:119-144`).
   - **Risk if wrong:** moving one interface without the full envelope/adapter plan creates a half-migrated contract mess.

6. **Clean Architecture does not currently hold for rendering, and the proposed flow can make it worse.**
   - The ADR says tools must not own framework-specific UI trees and adapters own spec conversion (`.hivemind/plans/2026-03-29-json-render-side-car-rendering-engine.md:84-87`, `:155-158`).
   - Current code already violates that boundary by constructing the Ink spec in `src/tools/hivefiver-setting/render.ts` (`:156-195`) and embedding rendered output into the proof object in `dashboard.ts` (`:53-53`).
   - If tools now emit json-render specs directly, they are still emitting component types/props/layout, which is presentation logic, not a target-agnostic domain contract.
   - **Risk if wrong:** “adapter layer” becomes theater while tool files keep accumulating UI concerns.

## Observations (Consider Addressing)

1. The ADR proposes `@json-render/shadcn` for the React side-car (`.hivemind/plans/2026-03-29-json-render-side-car-rendering-engine.md:42-42`), but the current package dependencies include only `@json-render/core`, `@json-render/ink`, and `@json-render/react` (`package.json:76-83`).
2. The reviewed ADR is untracked in git right now (`git status --short --branch` showed `?? .hivemind/plans/2026-03-29-json-render-side-car-rendering-engine.md`), so this is design review on a proposed document, not a ratified implementation.

## Assumptions Challenged

| # | Assumption | Risk if Wrong |
|---|---|---|
| 1 | One identical JSON spec can drive Ink and React | Ink/React divergence forces late adapter forks |
| 2 | Ink split-pane behavior is “just Box row + widths” | Terminal UX fails at the first narrow window |
| 3 | `createOpencodeClient` is enough proof of side-car transport | Runtime crashes, reconnect gaps, or security holes surface in production |
| 4 | Existing hm-settings renderers are mostly reusable | Migration cost is underestimated; compatibility debt grows |
| 5 | Moving contracts to schema-kernel is a simple refactor | Cross-sector type dependencies break callers and tests |
| 6 | Tool -> JSON spec is still a clean boundary | Presentation logic leaks back into tools |

## Evidence Collected

- `git status --short --branch`
  - `v2.9.5-detox-dev...origin/v2.9.5-detox-dev [ahead 1]`
  - untracked: `.hivemind/plans/2026-03-29-json-render-side-car-rendering-engine.md`
- `git diff --stat`
  - current working tree has unrelated edits; reviewed architecture evidence comes from current files plus the untracked ADR
- `npx tsc --noEmit && node -e "console.log('tsc ok')"`
  - `tsc ok`
- `npx tsx --test tests/tools/hivefiver-setting/hm-setting-render.test.ts tests/tools/hivefiver-setting/hm-setting-dashboard-tool.test.ts tests/runtime-entry-hm-settings-dashboard.test.ts`
  - `pass 9, fail 0`
- `node -e "const a='40 pane · runtime/session mirror'; const b='60 pane · Hivefiver settings'; console.log(JSON.stringify({pane40Title:a.length,pane60Title:b.length,width80Pane40:Math.floor(80*0.4),width80Pane60:Math.ceil(80*0.6)}))"`
  - `{"pane40Title":32,"pane60Title":28,"width80Pane40":32,"width80Pane60":48}`

## Verdict

**BLOCKED** as an implementation claim set. **PROCEED WITH CAUTION** only as a proof-plan.

The architecture direction is not insane. The evidence is. Too many core claims are still conditional, and the repo already admits that in the ADR. Treat this as a Phase 0 proof program, not a build-ready design. Minimum proof gates before implementation: (1) define a schema-kernel envelope that is not itself a renderer spec, (2) prove one hm-settings slice renders through separate Ink and React adapters, (3) verify OpenCode client attach + event flow with failure handling, and (4) snapshot-test fallback layouts at narrow terminal widths.
