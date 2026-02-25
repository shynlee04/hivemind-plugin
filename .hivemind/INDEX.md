---
type: index
structure_version: "2.0.0"
generated: 2026-02-25T01:20:49.938Z
---
# .hivemind — Context Governance State

## Current State
- Mode: plan_driven | Governance: OPEN
- Trajectory: Trich xuat mau cau truc tu BMAD Method va BMAD Builder repomix XML cho Wave 2 synthesis
- Tactic: 
- Turns: 0 | Drift: 100/100
- Active: 200825022026

## Quick Navigation
- sessions/active/
- sessions/archive/
- state/
- memory/mems.json
- [agent1a-lib-scan-summary] Agent 1A completed 2026-02-25. 55 lib files scanned. TOP OFFENDERS: graph-io.ts(1349), planning-fs.ts(1107), hierarchy-tree.ts(1070), detection.ts(881), graph-migrate.ts(853). DUAL CONFLICTS: mems(mems.ts→memory/mems.json vs graph-io.ts→graph/mems.json), tasks(manifest.ts→state/tasks.json vs graph-io.ts→graph/tasks.json). 9 files over 550 LOC. paths.ts most-imported(18). No orphaned files. No circular deps. CQRS compliant in hooks layer.
- [agent1b-interface-scan-summary] Agent 1B completed 2026-02-25. 13 hooks, 7 tools, 9 schemas scanned. CQRS: ALL hooks compliant via queueStateMutation(). TOOL VIOLATIONS: hivemind-session.ts has syncTrajectoryToGraph() 90-line inline biz logic, hivemind-memory.ts has 40-line inline search. SCHEMA GAP: 60% Zod, 40% unsafe interfaces (BrainState, Config, HierarchyState, TaskManifest). HOOK COUPLING: soft-governance.ts 15 imports, messages-transform.ts 11 imports. LOC violations: soft-governance.ts(608), messages-transform.ts(560). No circular deps.
- [framework-constitution] HIVEMIND-FRAMEWORK.md is THE constitution. Key mandates: (1) .hivemind/planning/ is SOT for ALL planning artifacts — NOT .planning/ at root, (2) Agent roster: hiveminder/hivefiver/hivemaker(not build)/hivexplorer(not scanner/explore)/hivehealer(not debug)/hiveplanner, (3) Commands at .hivemind/commands/ grouped into settings/code-intel/context/governance/execution/framework, (4) Planning naming: ID+Name NO timestamps, (5) Atomic git commits for .hivemind content, (6) Pre-flight validation: .hivemind folder+manifests+configs → codewiki for brownfield → planning SOT → version control, (7) Framework modules: agents/commands/workflows/templates/prompts/skills/scripts at root with asset sync
