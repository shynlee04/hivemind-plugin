# stack-l3-opencode Rebuild — Checkpoint

**Date:** 2026-05-10
**Agent:** hf-l2-skill-builder (subagent delegated by hf-l0-orchestrator)
**Action:** COMPLETE REBUILD (not audit patch)

## Research Evidence

| Source | Finding |
|--------|---------|
| npm view @opencode-ai/plugin | v1.14.44 ✅ |
| npm view @opencode-ai/sdk | v1.14.44 ✅ |
| GitHub: anomalyco/opencode/dev | 200 OK ✅ |
| GitHub: anomalyco/opencode/main | 404 ❌ (doesn't exist) |
| GitHub: sst/opencode (old URL) | 404 ❌ (dead repo) |
| Repomix dump | 24,714 lines, v1.14.44, verified all API signatures |
| ACP files: agent.ts, session.ts, types.ts | Confirmed at packages/opencode/src/acp/ (200 OK) |
| TUI: packages/plugin/src/tui.ts | Confirmed (200 OK) |

## Key Signatures Verified Against Repomix

| Claim | Verified? | Evidence |
|-------|-----------|----------|
| `ToolDefinition = ReturnType<typeof tool>` | ✅ | repomix line 2988 |
| `WorkspaceAdapter` (not Adaptor) | ✅ | repomix line 2520 |
| `ProviderHookContext` as named export | ✅ | repomix line 2682 |
| `AuthOAuthResult` (AuthOuathResult deprecated) | ✅ | repomix lines 2637, 2692 |
| `chat.params.model: Model` (required, not optional) | ✅ | repomix lines 2718-2723 |
| `EventCommandExecuted` type exists | ✅ | repomix line 7020 |
| `TuiKeymap = Keymap<Renderable, KeyEvent>` | ✅ | repomix line 3069 |
| `api.keymap.registerLayer` API | ✅ | repomix lines 3072-3103 (deprecated api.command) |
| ACP JSON-RPC over stdio | ✅ | repomix lines 113-300 |
| gen/types.gen.ts v1 = ~68KB, v2 = ~85KB+ | ✅ | repomix directory listing |

## Files Modified

| File | Action | Details |
|------|--------|---------|
| scripts/update.sh | **REWRITTEN** | 10 sst/opencode URLs → 13 anomalyco/opencode/dev URLs; added ACP download |
| references/api/sdk.md | **REWRITTEN** | v1.14.28→v1.14.44; added gen/ directory table; v2 gen growth documented |
| references/api/types.md | **REWRITTEN** | v1.14.28→v1.14.44; added TuiPluginApi, TuiKeymap, EventCommandExecuted types |
| references/expert/tool-internals.md | **VERSION FIX** | v1.14.28→v1.14.44 header |
| references/expert/hook-composition.md | **VERSION FIX** | v1.14.28→v1.14.44 header |
| references/expert/client-server.md | **VERSION FIX** | v1.14.28→v1.14.44 header |
| references/patterns/dev.md | **VERSION FIX** | v1.14.28→v1.14.44 header |
| references/patterns/testing.md | **VERSION FIX** | v1.14.28→v1.14.44 header |
| references/patterns/gatekeeping.md | **VERSION FIX** | v1.14.28→v1.14.44 header |
| SKILL.md | **UPDATED** | Description expanded with 50+ trigger phrases; TUI v2, ACP, IDE keywords |
| TOC.md | **UPDATED** | Added Cross-Cutting References and New API References sections |

## Files Created

| File | Size | Content |
|------|------|---------|
| references/api/acp.md | 6,862 bytes | Agent Client Protocol: JSON-RPC over stdio, session management, method reference |
| references/api/tui-v2.md | 5,223 bytes | TUI v2 keymap API: api.keymap.registerLayer, migration guide, binding examples |
| references/pipeline-patterns.md | 4,598 bytes | Skill composition in dev workflows with pipeline diagrams |
| references/stack-chains.md | 5,182 bytes | Dependency graph, loading order rules, version compatibility check |
| references/department-bundles.md | 5,712 bytes | 5 role-based bundles (A-E) with context cost analysis |

## Verification Results

| Check | Result |
|-------|--------|
| grep "sst/opencode" | **ZERO** ✅ |
| grep "anomalyco/opencode" | 28 matches (SKILL.md, update.sh, TOC.md, architecture.md, metadata.json) ✅ |
| grep "1.14.28" | 1 match (historical note: "Fixed spelling from v1.14.28") — ACCEPTABLE |
| grep "1.14.44" | 35+ matches across all files ✅ |
| update.sh anomalyco URLs | 13 curl commands ✅ |
| update.sh sst URLs | 0 ✅ |
| New files exist | 5/5 confirmed with real content (4-7KB each) ✅ |
| All 9 references have v1.14.44 headers | 9/9 confirmed ✅ |

## Remaining Content That Was Preserved (Not Stale)

The following had already been updated to v1.14.44 and required only version header fixes:
- references/api/plugin.md — was already v1.14.44
- references/architecture.md — was already v1.14.44  
- metadata.json — was already v1.14.44
