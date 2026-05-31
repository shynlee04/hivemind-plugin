---
phase: P41-C
plan: 01
status: planned
type: execute
wave: 1
depends_on: [P41-B]
files_modified:
  - src/task-management/continuity/continuity-reader.ts          # NEW
  - src/tools/delegation/delegation-status.ts                   # Flip merge order
  - src/tools/hivemind/hivemind-session-view.ts                  # Redirect delegation
  - src/plugin.ts                                                # Enrich replay
  - src/hooks/types.ts                                           # Add projectDirectory
  - src/hooks/lifecycle/session-hooks.ts                         # Enrich reads
  - src/hooks/guards/tool-guard-hooks.ts                         # Enrich reads
  - tests/lib/continuity/continuity-reader.test.ts               # NEW
autonomous: true
requirements: [REQ-P41C-01, REQ-P41C-02, REQ-P41C-03, REQ-P41C-04, REQ-P41C-05, REQ-P41C-06, REQ-P41C-07]
must_haves:
  truths:
    - "continuity-reader.ts exports both enrichment helpers"
    - "delegation-status.ts merge order: [persisted, trackerChildren, managerDelegations]"
    - "hivemind-session-view.ts tries tracker first, falls back to delegations.json"
    - "plugin.ts enriches replay with session-tracker pendingNotifications"
    - "session-hooks.ts + tool-guard-hooks.ts enrich continuity reads"
    - "npm run typecheck && npm run test pass"
  artifacts:
    - path: "src/task-management/continuity/continuity-reader.ts" provides: "Enrichment" exports: ["enrichContinuityWithTracker", "enrichContinuityListWithTracker"]
    - path: "tests/lib/continuity/continuity-reader.test.ts" provides: "Unit tests" min_lines: 40
  key_links:
    - from: "plugin.ts" to: "continuity-reader.ts" via: "import" pattern: "enrichContinuityListWithTracker"
    - from: "session-hooks.ts" to: "continuity-reader.ts" via: "import" pattern: "enrichContinuityWithTracker"
    - from: "tool-guard-hooks.ts" to: "continuity-reader.ts" via: "import" pattern: "enrichContinuityWithTracker"
---

<objective>
Flip 5 readers to prefer session-tracker data over old files. P41-B added dual-write; readers now prefer tracker with old-file fallback. P41-D handles deletion.

Output: New `continuity-reader.ts` + 6 modified source files + 1 new test file. All changes additive/order-flip — no deletion.
</objective>

<context>
@.planning/phases/P41-state-cluster-redesign/P41-C-SPEC.md
@.planning/phases/P41-state-cluster-redesign/P41-C-RESEARCH.md

P41-B delivered 7 gap fields on ChildSessionRecord + dual-write. Key constraints: do NOT modify getSessionContinuity/listSessionContinuity (sync, writers use them); do NOT import continuity/index.ts from continuity-reader.ts (circular dep); do NOT remove old read paths (P41-D); do NOT mutate originals; enrichment never throws.
</context>

<tasks>

<!-- ───── Task 1 ───── -->

<task type="auto" tdd="true">
  <name>Task 1 [Wave 1]: Create continuity-reader.ts + test scaffold</name>
  <files>src/task-management/continuity/continuity-reader.ts (NEW), tests/lib/continuity/continuity-reader.test.ts (NEW)</files>
  <behavior>
    - Returns original when projectRoot undefined
    - Returns original when resolveSessionFile returns null
    - Merges childRecord lifecycle over record.metadata.lifecycle
    - Merges childRecord pendingNotifications over record.metadata.pendingNotifications  
    - Merges childRecord compactionCheckpoint over record.metadata.compactionCheckpoint
    - Returns original when childRecord has none of the 3 enrichment fields
    - Never throws — catches errors, returns original
    - enrichContinuityListWithTracker runs all via Promise.all
    - Does NOT mutate the original record object
  </behavior>
  <action>
    Imports: `resolveSessionFile` from `"../../tools/session/session-resolver.js"`, `type ChildSessionRecord` from `"../../features/session-tracker/types.js"`, `type SessionContinuityRecord` from `"../../shared/types.js"`.

    `enrichContinuityWithTracker(record, projectRoot?)`:
    1. if `!projectRoot || !record.sessionID` → return record
    2. try: resolved = await resolveSessionFile(projectRoot, record.sessionID)
    3. if `!resolved || resolved.type !== "child" || !resolved.childRecord` → return record
    4. cr = resolved.childRecord; if none of lifecycle/pendingNotifications/compactionCheckpoint → return record
    5. return `{ ...record, metadata: { ...record.metadata, lifecycle: cr.lifecycle ?? record.metadata.lifecycle, pendingNotifications: cr.pendingNotifications ?? record.metadata.pendingNotifications, compactionCheckpoint: cr.compactionCheckpoint ?? record.metadata.compactionCheckpoint } }`
    6. catch: return record

    `enrichContinuityListWithTracker(records, projectRoot?)`: if no projectRoot or empty → return records; else `Promise.all(records.map(r => enrichContinuityWithTracker(r, projectRoot)))`.

    Boundaries: no continuity/index.ts import. No features/session-tracker/persistence/ import. No mutation. No `any`.

    Test: vitest globals. `vi.mock("../../../src/tools/session/session-resolver.js")`. Mock resolveSessionFile per case. Test all 9 behaviors.
  </action>
  <verify><automated>npx vitest run tests/lib/continuity/continuity-reader.test.ts -x</automated></verify>
  <done>9/9 test cases pass. grep confirms both exported functions. Typecheck clean.</done>
</task>

<!-- ───── Task 2 ───── -->

<task type="auto">
  <name>Task 2 [Wave 1]: Flip mergeAllDelegations() order in delegation-status.ts</name>
  <files>src/tools/delegation/delegation-status.ts</files>
  <action>
    L400: change `[...trackerChildren, ...persisted, ...managerDelegations]` to `[...persisted, ...trackerChildren, ...managerDelegations]`.

    byId.set() last-write-wins: [persisted → overwritten by tracker → overwritten by manager]. Session-tracker now beats old file. Manager (in-memory) still most current.

    No other changes. Merge logic L402-418, single-lookup L462-487, handleControl L606-619 all unchanged.
  </action>
  <verify><automated>npm run typecheck</automated></verify>
  <done>Array order flipped. Typecheck passes. No other changes.</done>
</task>

<!-- ───── Task 3 ───── -->

<task type="auto">
  <name>Task 3 [Wave 1]: Redirect readDelegationsForSession() to tracker first</name>
  <files>src/tools/hivemind/hivemind-session-view.ts</files>
  <action>
    Replace `readDelegationsForSession()` body (L69-79) with try-tracker-first-then-fallback:

    1. try: `const resolved = await resolveSessionFile(projectRoot, sessionId)`
       - If `resolved.type === "main"`: read `resolved.manifestPath`, parse JSON as `{ children?: Record<string, unknown> }`, filter entries where `childMeta.parentSessionID === sessionId`, map to `{ id, childSessionId: id, ...meta }`, slice(0, 20), return if non-empty.
       - If `resolved.type === "child"` && `resolved.childRecord`: return `[resolved.childRecord as unknown as Record<string, unknown>]`
       - catch: fall through (comment: `/* fall through to legacy */`)
    2. Fallback: existing code unchanged — read delegations.json, filter by childSessionId/id === sessionId, slice(0, 20)

    Dependencies: resolveSessionFile already imported at L16. readFile and resolve already imported.

    Do NOT change readSessionData(), readTrajectoryForSession(), or buildUnifiedView(). Do NOT remove old delegations.json fallback.
  </action>
  <verify><automated>npm run typecheck</automated></verify>
  <done>readDelegationsForSession tries session-tracker first. Old delegations.json fallback intact. Typecheck passes.</done>
</task>

<!-- ───── Task 4 ───── -->

<task type="auto">
  <name>Task 4 [Wave 1]: Enrich notification replay in plugin.ts</name>
  <files>src/plugin.ts</files>
  <action>
    1. Add import: `import { enrichContinuityListWithTracker } from "./task-management/continuity/continuity-reader.js"` (add after continuity imports at ~L79)
    2. Modify `replayPendingDelegationNotifications()` signature (L629): add optional `projectDirectory?: string` parameter
    3. Modify function body (L630-646): After `const allSessions = listSessionContinuity()`, add:
       ```
       const enrichedSessions = projectDirectory
         ? await enrichContinuityListWithTracker(Object.values(allSessions), projectDirectory)
         : Object.values(allSessions)
       ```
       Then iterate over `enrichedSessions` instead of `Object.values(allSessions)`.
    4. Update call site at L414: `void replayPendingDelegationNotifications(client)` → `void replayPendingDelegationNotifications(client, projectDirectory)`

    Do NOT change notification replay logic or patchSessionContinuity() calls. projectDirectory is available at L355.
  </action>
  <verify><automated>npm run typecheck</automated></verify>
  <done>replayPendingDelegationNotifications enriched. Call site updated. Typecheck passes.</done>
</task>

<!-- ───── Task 5 ───── -->

<task type="auto">
  <name>Task 5 [Wave 1]: Enrich continuity reads in session-hooks + tool-guard-hooks</name>
  <files>src/hooks/types.ts, src/hooks/lifecycle/session-hooks.ts, src/hooks/guards/tool-guard-hooks.ts</files>
  <action>
    **hooks/types.ts:**
    Add `projectDirectory?: string` to `HookDependencies` interface (after L60, before closing `}`).

    **session-hooks.ts:**
    1. Add import: `import { enrichContinuityWithTracker } from "../../task-management/continuity/continuity-reader.js"`
    2. **L151 (event hook):** Change from:
       ```
       const continuity = getSessionContinuity(sessionID)
       ```
       to:
       ```
       const rawContinuity = getSessionContinuity(sessionID)
       const continuity = rawContinuity
         ? await enrichContinuityWithTracker(rawContinuity, deps.projectDirectory)
         : undefined
       ```
    3. **L308 (compacting hook):** Change from:
       ```
       const continuity = getSessionContinuity(sessionID)
       ```
       to:
       ```
       const continuity = getSessionContinuity(sessionID)
         ? await enrichContinuityWithTracker(getSessionContinuity(sessionID)!, deps.projectDirectory)
         : undefined
       ```
       (Note: L308 continuity is used in a truthy check at L340, so `undefined` is fine.)

    **tool-guard-hooks.ts:**
    1. Add `projectRoot?: string` to `ToolGuardDependencies` interface (L28-33)
    2. Add import: `import { enrichContinuityWithTracker } from "../../task-management/continuity/continuity-reader.js"`
    3. **L193 (tool.execute.after):** Change from:
       ```
       const continuity = getSessionContinuity(sessionID)
       ```
       to:
       ```
       const rawContinuity = getSessionContinuity(sessionID)
       const continuity = rawContinuity
         ? await enrichContinuityWithTracker(rawContinuity, deps.projectRoot)
         : undefined
       ```
    4. **plugin.ts L501:** Update `createToolGuardHooks()` call to pass `projectRoot: projectDirectory`:
       ```
       const toolGuardHooks = createToolGuardHooks({ stateManager: taskState, lifecycleManager, runtimePolicy, hivemindConfig, projectRoot: projectDirectory })
       ```

    Do NOT change auto-loop decision logic or governance logic. Only enrich the continuity data used. Enrichment is fire-and-forget (never blocks — internal try-catch).
  </action>
  <verify><automated>npm run typecheck && npm run test</automated></verify>
  <done>Both hook files enrich getSessionContinuity() reads. Types extended. plugin.ts L501 passes projectRoot. Typecheck + tests pass.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries
| Boundary | Description |
|----------|-------------|
| continuity-reader.ts → session-tracker files on disk | Reads child records via resolveSessionFile (safeSessionPath-protected) |

## STRIDE Threat Register
| Threat ID | Category | Component | Disposition | Mitigation |
|-----------|----------|-----------|-------------|------------|
| T-P41C-01 | Tampering | continuity-reader.ts | mitigate | Enrichment helper has internal try-catch; returns original record on any error |
| T-P41C-02 | Denial of Service | Plugin init replay | mitigate | enrichment is fire-and-forget; enrichContinuityListWithTracker runs Promise.all (no uncaught rejections) |
| T-P41C-SC | Tampering | npm/pip/cargo installs | accept | No new packages in this phase |
</threat_model>

<verification>
Phase gate: npm run typecheck && npm run test
Per-requirement:
- REQ-P41C-01: grep -q "enrichContinuityWithTracker" src/task-management/continuity/continuity-reader.ts
- REQ-P41C-02: grep -n "trackerChildren" src/tools/delegation/delegation-status.ts (verify persisted before tracker in array at ~L400)
- REQ-P41C-03: grep -q "resolveSessionFile" src/tools/hivemind/hivemind-session-view.ts && grep -q "delegations.json" src/tools/hivemind/hivemind-session-view.ts
- REQ-P41C-04: grep -q "enrichContinuityListWithTracker" src/plugin.ts
- REQ-P41C-05: grep -q "enrichContinuityWithTracker" src/hooks/lifecycle/session-hooks.ts
- REQ-P41C-06: grep -q "enrichContinuityWithTracker" src/hooks/guards/tool-guard-hooks.ts && grep -q "projectRoot" src/hooks/guards/tool-guard-hooks.ts
- REQ-P41C-07: npm run typecheck && npm run test
</verification>

<success_criteria>
- New continuity-reader.ts with both enrichment functions (grep-verify exports)
- All 5 readers updated to prefer session-tracker data
- Existing tests + new test all pass
- Typecheck clean (0 errors)
- Git commit with message: "feat(P41-C): update readers to prefer session-tracker — 5 reader modifications"
</success_criteria>

<output>
Create `.planning/phases/P41-state-cluster-redesign/P41-C-SUMMARY.md` when done.
</output>
