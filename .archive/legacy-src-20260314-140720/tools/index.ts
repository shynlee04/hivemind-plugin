/**
 * Tool barrel exports — HiveMind lifecycle verbs + V2.9 governance tools
 *
 * | Tool              | Actions                                        | Replaces                        |
 * | ----------------- | --------------------------------------------- | ------------------------------- |
 * | hivemind_session  | start, update, close, status, resume         | declare_intent, map_context, compact_session |
 * | hivemind_inspect  | scan, deep, drift                             | scan_hierarchy, think_back, check_drift     |
 * | hivemind_memory   | save, recall, list                            | save_mem, recall_mems, list_shelves        |
 * | hivemind_anchor   | save, list, get                               | save_anchor                              |
 * | hivemind_hierarchy| prune, migrate, status                        | hierarchy_manage                          |
 * | hivemind_cycle    | export, list, prune                           | export_cycle, self_rate                  |
 * | hivemind_context  | validate, purge, doctor, resume               | context governance lifecycle              |
 * | hivemind_session_memory | scratch, debug_log, research_cache, retro, todo_pending | session memory classification |
 * | hivemind_codemap   | scan, compress, status, search, inject, commit | code intelligence engine        |
 * | hivemind_ideate    | evaluate, validate_schema                      | Q.U.A.N.T. ideation matrix gate |
 * | hivemind_read_skeleton | extract code skeleton                        | ASTSurgeon.extractSkeleton      |
 * | hivemind_precision_patch | patch symbol by name                      | ASTSurgeon.patchSymbol          |
 * | hivemind_mesh_pull  | blast radius + skeleton aggregation           | LSPBridge + ASTSurgeon          |
 * | hivemind_doc        | skim, read, write, append, insert, delete, search, list, metadata, toc, create | DocWeaver + doc-intel |
 * | hivemind_declare    | declare role, mode, context, confidence       | Agent declaration runtime       |
 * | hivemind_plan       | create, status, update, validate, link         | Plan hierarchy management       |
 */

export { createHivemindSessionTool } from "./hivemind-session.js"
export { createHivemindInspectTool } from "./hivemind-inspect.js"
export { createHivemindMemoryTool } from "./hivemind-memory.js"
export { createHivemindAnchorTool } from "./hivemind-anchor.js"
export { createHivemindHierarchyTool } from "./hivemind-hierarchy.js"
export { createHivemindCycleTool } from "./hivemind-cycle.js"
export { createHivemindContextTool } from "./hivemind-context.js"
export { createHivemindSessionMemoryTool } from "./hivemind-session-memory.js"
export { createHivemindCodemapTool } from "./hivemind-codemap.js"
export { createHivemindIdeateTool } from "./hivemind-ideate.js"
export { createHivemindReadSkeletonTool } from "./hivemind-read-skeleton.js"
export { createHivemindPrecisionPatchTool } from "./hivemind-precision-patch.js"
export { createHivemindMeshPullTool } from "./hivemind-mesh-pull.js"
export { createHivemindDocTool } from "./hivemind-doc.js"
export { createHivemindPlanTool } from "./hivemind-plan.js"

// Unmounted tools — files exist in src/tools/ but are NOT registered in src/index.ts.
// Removed from barrel 2026-03-12. Import directly from the tool file if mounting later.
// - hivemind-declare.ts   (governance-only refs in soft-governance/tool-gate/detection)
// - hiveops-gate.ts       (P1-C.1 compatibility debt)
// - hiveops-sot.ts        (P1-C.1 compatibility debt)
// - hiveops-export.ts     (P1-C.1 compatibility debt)
// - hiveops-todo.ts       (P1-C.1 compatibility debt)
