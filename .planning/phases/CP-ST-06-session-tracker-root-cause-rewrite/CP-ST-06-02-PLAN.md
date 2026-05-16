---
phase: CP-ST-06-session-tracker-root-cause-rewrite
plan: 02
type: execute
wave: 2
depends_on:
  - CP-ST-06-01
files_modified:
  - src/features/session-tracker/index.ts
  - src/features/session-tracker/session-router.ts
  - src/features/session-tracker/child-recorder.ts
  - src/features/session-tracker/initialization.ts
  - src/features/session-tracker/classification.ts
  - tests/features/session-tracker/integration/default-sub.test.ts
  - tests/features/session-tracker/index.test.ts
  - tests/features/session-tracker/session-tracker.test.ts
autonomous: true
requirements:
  - RC-3
  - RC-6
  - GA-3
  - GA-4
must_haves:
  truths:
    - "Only an explicit real root/main user turn may create a main session directory."
    - "Unknown classification defaults to child/default-sub, not main."
    - "index.ts is reduced to <=500 LOC without changing public exports."
  artifacts:
    - path: "src/features/session-tracker/session-router.ts"
      provides: "Classify-before-I/O routing for chat/tool paths"
      exports: ["SessionRouter"]
    - path: "src/features/session-tracker/child-recorder.ts"
      provides: "Child route and child delegation recording service"
      exports: ["ChildRecorder"]
    - path: "src/features/session-tracker/initialization.ts"
      provides: "SessionTracker lifecycle assembly helpers"
      exports: ["SessionTrackerRuntime"]
    - path: "src/features/session-tracker/index.ts"
      provides: "Backward-compatible public facade/barrel"
      max_lines: 500
  key_links:
    - from: "src/features/session-tracker/session-router.ts"
      to: "src/features/session-tracker/classification.ts"
      via: "explicit classification kind, not undefined parentID"
      pattern: "kind.*root|kind.*child|kind.*unknownSub"
    - from: "src/features/session-tracker/index.ts"
      to: "session-router.ts"
      via: "delegated handleChatMessage/handleToolExecuteAfter"
      pattern: "new SessionRouter|SessionRouter"
---

<objective>
Extract the SessionTracker monolith into explicit routing/recording/lifecycle modules and fix unknown/default-sub routing.

Purpose: CP-ST-06 must be a root-cause rewrite, not another caller-local patch. This plan creates the central classify-before-I/O boundary and fulfills GA-4 by reducing `index.ts` to <=500 LOC.

Output: `session-router.ts`, `child-recorder.ts`, `initialization.ts`, updated `classification.ts`, and a thin backward-compatible `index.ts` facade.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-CONTEXT.md
@.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/SPEC.md
@.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-RESEARCH.md
@.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-PATTERNS.md
@src/features/session-tracker/AGENTS.md
@src/features/session-tracker/index.ts
@src/features/session-tracker/classification.ts
@src/features/session-tracker/bootstrap.ts
@tests/features/session-tracker/integration/default-sub.test.ts
@tests/features/session-tracker/index.test.ts
@tests/features/session-tracker/session-tracker.test.ts

<interfaces>
From PATTERNS.md extraction boundary:
- `session-router.ts` owns chat/tool route decisions and classification interpretation.
- `child-recorder.ts` owns child route hydration, child tool journey, and child task delegation recording.
- `initialization.ts` owns construction/start/shutdown/cleanup helpers.
- `index.ts` remains public facade and barrel; public API must not shrink.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Make classification result impossible to misroute</name>
  <files>src/features/session-tracker/classification.ts, tests/features/session-tracker/integration/default-sub.test.ts</files>
  <read_first>
    - .planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-CONTEXT.md
    - .planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/SPEC.md
    - src/features/session-tracker/classification.ts
    - src/features/session-tracker/index.ts
    - tests/features/session-tracker/integration/default-sub.test.ts
  </read_first>
  <behavior>
    - RC-3: `gate:"none"` is represented as child/default-sub or equivalent, never as root/main.
    - Exactly one root authority path exists: explicit SDK/root user turn or existing known root, not missing parentID.
  </behavior>
  <action>Change the classification contract so `parentID: undefined` cannot mean both root and unknown. Acceptable target state: discriminated result such as `{ kind: "root" }`, `{ kind: "child", parentID }`, `{ kind: "unknownSub" }`, or an equivalent explicit shape. Update router-facing tests to assert unknown/default-sub never creates `{sessionID}/{sessionID}.md`.</action>
  <acceptance_criteria>
    - `grep -n 'gate: "none"' src/features/session-tracker/classification.ts` still may exist only if it maps to default-sub handling, not root handling.
    - `grep -n 'kind:' src/features/session-tracker/classification.ts` or equivalent explicit discriminator exists.
    - `npx vitest run tests/features/session-tracker/integration/default-sub.test.ts` passes after implementation.
  </acceptance_criteria>
  <verify>
    <automated>npx vitest run tests/features/session-tracker/integration/default-sub.test.ts</automated>
  </verify>
  <done>Unknown classification can no longer create rogue main directories.</done>
</task>

<task type="auto">
  <name>Task 2: Extract router and child recorder from index.ts</name>
  <files>src/features/session-tracker/index.ts, src/features/session-tracker/session-router.ts, src/features/session-tracker/child-recorder.ts, tests/features/session-tracker/index.test.ts, tests/features/session-tracker/session-tracker.test.ts</files>
  <read_first>
    - .planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-PATTERNS.md
    - src/features/session-tracker/index.ts
    - src/features/session-tracker/bootstrap.ts
    - src/features/session-tracker/classification.ts
    - src/features/session-tracker/persistence/child-writer.ts
    - src/features/session-tracker/persistence/session-index-writer.ts
    - src/features/session-tracker/persistence/project-index-writer.ts
    - src/features/session-tracker/persistence/hierarchy-index.ts
  </read_first>
  <action>Create `SessionRouter` and `ChildRecorder` modules using constructor dependency injection like `SessionBootstrap`. Move chat/tool routing and child route/delegation recording out of `index.ts` without changing externally imported names from `src/features/session-tracker/index.ts`. Preserve `.js` import extensions and `import type` for type-only imports.</action>
  <acceptance_criteria>
    - `test -f src/features/session-tracker/session-router.ts` and `test -f src/features/session-tracker/child-recorder.ts` pass.
    - `grep -n 'export class SessionRouter' src/features/session-tracker/session-router.ts` returns one class export.
    - `grep -n 'export class ChildRecorder' src/features/session-tracker/child-recorder.ts` returns one class export.
    - `npm run typecheck` passes.
  </acceptance_criteria>
  <verify>
    <automated>npm run typecheck</automated>
  </verify>
  <done>Routing and child recording logic are extracted behind explicit modules; index.ts delegates to them.</done>
</task>

<task type="auto">
  <name>Task 3: Extract initialization lifecycle and enforce index.ts LOC gate</name>
  <files>src/features/session-tracker/index.ts, src/features/session-tracker/initialization.ts</files>
  <read_first>
    - .planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-CONTEXT.md
    - .planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-PATTERNS.md
    - src/features/session-tracker/index.ts
    - src/features/session-tracker/bootstrap.ts
  </read_first>
  <action>Create `initialization.ts` for construction/start/shutdown/cleanup helpers currently in `index.ts`. Keep `index.ts` as public facade/barrel and ensure public exports remain available. Add JSDoc for new exported classes/functions. Do not edit `src/plugin.ts` or `.opencode/**`.</action>
  <acceptance_criteria>
    - `test -f src/features/session-tracker/initialization.ts` passes.
    - `wc -l src/features/session-tracker/index.ts | awk '{exit !($1 <= 500)}'` passes.
    - `wc -l src/features/session-tracker/session-router.ts src/features/session-tracker/child-recorder.ts src/features/session-tracker/initialization.ts | grep -v total | awk '{if ($1 > 500) exit 1}'` passes.
    - `npm run typecheck` passes.
  </acceptance_criteria>
  <verify>
    <automated>npm run typecheck && wc -l src/features/session-tracker/index.ts src/features/session-tracker/session-router.ts src/features/session-tracker/child-recorder.ts src/features/session-tracker/initialization.ts</automated>
  </verify>
  <done>`index.ts` and all new extraction modules are <=500 LOC and typecheck-clean.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| OpenCode SDK classification signals → persistence routing | Missing/late parentID must not grant root authority. |
| public module imports → extracted modules | Extraction must not break existing consumers of `index.ts`. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-CP-ST-06-03 | Tampering | classification.ts/session-router.ts | mitigate | Use explicit result kind so unknown cannot create main state. |
| T-CP-ST-06-04 | Denial of service | index.ts extraction | mitigate | Keep public facade exports and run typecheck after extraction. |
</threat_model>

<verification>
Primary: `npm run typecheck`, `npx vitest run tests/features/session-tracker/integration/default-sub.test.ts`, LOC checks for `index.ts` and new modules.
</verification>

<success_criteria>
- RC-3 default-sub behavior passes integration tests.
- GA-4 index.ts <=500 LOC is proven.
- Public API through `src/features/session-tracker/index.ts` remains typecheck-clean.
</success_criteria>

<source_audit>
GOAL: covers real-user-turn authority and default-to-sub root cause plus rewrite cleanliness.
REQ: RC-3, RC-6, GA-3, GA-4 covered.
RESEARCH: recommended `session-router.ts`, `child-recorder.ts`, `initialization.ts` extraction covered.
CONTEXT: GA-4 implemented exactly; deferred plugin composition changes excluded.
</source_audit>

<output>
After completion, create `.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-02-SUMMARY.md`.
</output>
