# Cycle 2: Session Domain + Lib Consolidation

Continue `P1-D.1c` consolidation: reduce `src/lib` and `src/tools` file count with safe merges and dead-code archival.

## Proposed Changes

### Batch A: Single-Consumer Absorptions

---

#### [MODIFY] [session-lifecycle.ts](file:///Users/apple/hivemind-plugin/src/hooks/session-lifecycle.ts) ← absorb `onboarding.ts`

`onboarding.ts` (118 lines, 1 consumer: `session-lifecycle.ts`) was explicitly extracted from `session-lifecycle.ts` (its own JSDoc says so). Re-absorb it.

- Move all exports from `onboarding.ts` into `session-lifecycle.ts`
- Remove the `import` from `onboarding.js`
- Archive `onboarding.ts` to `.archive/consolidated/2026-03-12/session-cluster/`

---

#### [MODIFY] [session-governance.ts](file:///Users/apple/hivemind-plugin/src/lib/session-governance.ts) ← absorb `long-session.ts` (30 lines, 4 consumers)

Actually: **SKIP** — 4 consumers across `soft-governance.ts`, `messages-transform.ts`, `session-governance.ts`, and a test. Not a single-consumer file.

---

### Batch B: Dead Code Archival

#### [ARCHIVE] [compaction-engine.ts](file:///Users/apple/hivemind-plugin/src/lib/compaction-engine.ts) (448 lines)

- **Zero runtime consumers** in `src/` — only consumed by 2 test files
- The actual compaction hook (`src/hooks/compaction.ts`) does NOT import from it
- Archive to `.archive/dead-code/2026-03-12/`
- Keep tests: they'll fail on import, but these are orphaned anyway (they test dead code)

> [!IMPORTANT]
> Need to verify that `compaction-engine.ts` truly has no runtime path. Will grep for any indirect/dynamic references before archiving.

---

### Batch C: Phantom Tools Barrel Cleanup

#### [MODIFY] [index.ts](file:///Users/apple/hivemind-plugin/src/tools/index.ts)

Remove the 5 unmounted tool exports from the tools barrel. These tools are exported but not registered in `src/index.ts`, and no other consumer imports from the barrel:

| Export | Tool File | Reason |
|--------|----------|--------|
| `createHivemindDeclareTool` | `hivemind-declare.ts` | Referenced in governance logic by string, not by import |
| `createHiveOpsGateTool` | `hiveops-gate.ts` | P1-C.1 compatibility debt |
| `createHiveOpsSotTool` | `hiveops-sot.ts` | P1-C.1 compatibility debt |
| `createHiveOpsExportTool` | `hiveops-export.ts` | P1-C.1 compatibility debt |
| `createHiveOpsTodoTool` | `hiveops-todo.ts` | P1-C.1 compatibility debt |

> [!NOTE]
> The underlying `.ts` files stay — no code is deleted. Only the barrel re-exports are removed. If the tools are mounted in future, they'll import directly (matching the existing pattern where `src/index.ts` imports them directly).

---

### Batch D: Tool-Layer Thinning

#### [MODIFY] [hivemind-session.ts](file:///Users/apple/hivemind-plugin/src/tools/hivemind-session.ts) ← absorb `hivemind-bootstrap.ts`

`hivemind-bootstrap.ts` (69 lines) is a trivial wrapper that calls `ensureSessionRuntimeBootstrap()` from `session-runtime.ts`. It's a standalone tool with 2 consumers (barrel + 1 test). Absorb it as a `bootstrap` action within `hivemind-session.ts` to reduce the tools surface.

- Add a `bootstrap` action to the `hivemind_session` tool
- Remove `hivemind_bootstrap` from `src/index.ts` tool registration
- Archive `hivemind-bootstrap.ts`
- Update the 1 test consumer

> [!WARNING]
> This changes the agent-facing tool surface: `hivemind_bootstrap` becomes `hivemind_session { action: "bootstrap" }`. Need to verify no runtime references use the old tool name.

---

## Verification Plan

### Automated Tests

```bash
# After each batch:
npx tsc --noEmit                               # Type check — must be clean
npm test 2>&1 | tail -5                        # Regression check — no new failures

# Specific test files that may be affected:
npx tsx --test tests/session-lifecycle-helpers.test.ts
npx tsx --test tests/hooks/session-lifecycle-constitution.test.ts
npx tsx --test tests/session-created-bootstrap.test.ts
npx tsx --test tests/compact-purification.test.ts
npx tsx --test tests/max-compaction-enforcement.test.ts
```

### Manual Verification
- Grep for stale import paths after each merge
- Confirm archived files are not referenced by any remaining `.ts` file
