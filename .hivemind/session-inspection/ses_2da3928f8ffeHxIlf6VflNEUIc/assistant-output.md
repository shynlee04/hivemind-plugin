# Session Inspection Export

- ses_id: `ses_2da3928f8ffeHxIlf6VflNEUIc`
- prepared_at: `2026-03-25T16:16:40.648Z`

## Assistant Output

I now have all the evidence needed. Here is the structured investigation report:

```json
{
  "investigation": {
    "scope": "HiveMind codebase at /Users/apple/hivemind-plugin/.worktrees/product-detox",
    "timestamp": "2026-03-25T23:14:41+07:00",
    "gitHead": "7183335",
    "gitMessage": "Generated numerous Hivemind session artifacts, error logs, and inspection reports"
  },

  "1_skillInjectionSystem": {
    "primaryFile": "src/plugin/skill-exposure-map.ts",
    "lines": 255,
    "exports": ["resolveSkillBundle", "resolveSessionRole", "renderSessionRoleDirective", "SkillEntry", "SessionRole"],
    "hardcodedSkillNames": {
      "SHARED_SKILLS": ["use-hivemind-delegation"],
      "AGENT_BUNDLES": {
        "hiveminder": ["hivemind-gatekeeping-delegation", "git-continuity-memory", "hivemind-atomic-commit"],
        "hivefiver": ["hivemind-gatekeeping-delegation", "git-continuity-memory", "hivemind-atomic-commit"],
        "hiveq": ["tdd-delegation", "verification-before-completion", "test-driven-development"],
        "hivemaker": ["tdd-delegation", "clean-code", "refactor", "test-driven-development"],
        "hiveplanner": ["writing-plans", "breakdown-plan", "spec-distillation"],
        "hivexplorer": ["research-delegation", "context-map", "hivemind-codemap", "hivemind-research"],
        "hiverd": ["research-delegation", "deep-research", "hivemind-research"],
        "hivehealer": ["course-correction-delegation", "systematic-debugging", "hivemind-system-debug"],
        "hitea": ["tdd-delegation", "qa-test-planner", "test-driven-development"]
      },
      "PURPOSE_CONDITIONAL": {
        "tdd": ["tdd-delegation", "test-driven-development"],
        "research": ["research-delegation", "deep-research"],
        "planning": ["writing-plans", "breakdown-plan"],
        "implementation": ["clean-code", "refactor"],
        "course-correction": ["course-correction-delegation", "systematic-debugging"],
        "gatekeeping": ["hivemind-gatekeeping-delegation", "verification-before-completion"]
      },
      "SUBSESSION_ADDITIONS": ["git-continuity-memory"],
      "MAX_SKILLS": 7,
      "defaultFallbackAgent": "hivefiver",
      "totalUniqueSkillNames": 20
    },
    "skillRegistryFile": "src/shared/opencode-skill-registry.ts",
    "skillRegistryLines": 137,
    "skillRegistryExports": ["createOpencodeSkillRegistry", "OpencodeSkillRegistryEntry", "SkillFrontmatter"],
    "skillRegistryBehavior": "Discovers skills from a `skills/` directory by reading SKILL.md files with YAML frontmatter. Parses name+description, builds runtime markdown. Does NOT resolve by hardcoded name — discovers by filesystem.",
    "injectionPipeline": {
      "entry": "src/plugin/messages-transform-adapter.ts (179 lines)",
      "callsResolveSkillBundle": "line 119",
      "callsResolveSessionRole": "line 124",
      "storeBridge": "src/plugin/injection-store.ts (35 lines)",
      "flow": "messages-transform → resolveSkillBundle() → renderSkillFocusBlock() → setInjectionPayload() → text.complete reads and logs"
    },
    "otherSkillInjectionCode": "None found outside skill-exposure-map.ts and messages-transform-adapter.ts. The context-renderer.compaction-renderers.ts has a single string check for 'refactor' at line 49 but is not skill-injection related."
  },

  "2_legacyCLI": {
    "files": [
      {
        "path": "src/cli.ts",
        "exists": true,
        "bytes": 7445,
        "lines": 194
      },
      {
        "path": "src/features/runtime-entry/init.handler.ts",
        "exists": true,
        "bytes": 10170,
        "lines": 275
      },
      {
        "path": "src/features/runtime-observability/sync.ts",
        "exists": true,
        "bytes": 2952,
        "lines": 108
      },
      {
        "path": "src/cli/runtime-assets.ts",
        "exists": true,
        "bytes": 974,
        "lines": 26
      },
      {
        "path": "src/control-plane/control-plane-registry.ts",
        "exists": true,
        "bytes": 8875,
        "lines": 268
      },
      {
        "path": "bin/hivemind-tools.cjs",
        "exists": true,
        "bytes": 51916,
        "lines": 1422
      },
      {
        "path": "scripts/sync-agent-registry.ts.deprecated",
        "exists": true,
        "bytes": 1018,
        "lines": 28
      },
      {
        "path": "scripts/check-agent-registry-parity.sh.deprecated",
        "exists": true,
        "bytes": 203,
        "lines": 8
      }
    ],
    "totalLines": 2329,
    "summary": "All 8 files exist. bin/hivemind-tools.cjs is the largest at 51KB/1422 lines (likely a bundled CJS). The two .deprecated files are small stubs (28 and 8 lines)."
  },

  "3_opencodeJson": {
    "path": "opencode.json",
    "lines": 24,
    "content": {
      "$schema": "https://opencode.ai/config.json",
      "model": "minimax-coding-plan/MiniMax-M2.7",
      "plugin": [".opencode/plugins/hivemind-context-governance.ts"],
      "provider": {
        "minimax": { "options": { "apiKey": "{env:MINIMAX_API_KEY}" } },
        "openai": { "models": { "gpt-5.4": { "limit": { "context": 200000, "output": 128000 } } } }
      }
    }
  },

  "4_pathsTs": {
    "path": "src/shared/paths.ts",
    "lines": 89,
    "exports": [
      "HIVEMIND_DIR", "STATE_DIR", "SESSIONS_DIR", "GRAPH_DIR", "CONFIG_DIR",
      "ARTIFACTS_DIR", "CHECKPOINTS_DIR", "STATE_FILES",
      "getHivemindPath", "getStatePath", "getSessionPath", "getSessionInspectionPath",
      "getErrorLogPath", "getConfigPath", "isHivemindPath", "isSessionFile",
      "getEffectivePaths"
    ],
    "deadCode": {
      "ARTIFACTS_DIR": {
        "definition": "line 14: export const ARTIFACTS_DIR = 'artifacts'",
        "usageCount": 0,
        "status": "DEAD — defined but never imported outside this file"
      },
      "CHECKPOINTS_DIR": {
        "definition": "line 15: export const CHECKPOINTS_DIR = 'checkpoints'",
        "usageCount": 0,
        "status": "DEAD — defined but never imported outside this file"
      },
      "STATE_FILES": {
        "definition": "lines 18-23: { hiveneuron, hivebrain, brain, anchors }",
        "usageCount": 0,
        "status": "DEAD — defined but never imported outside this file"
      },
      "handoffsDir": {
        "definition": "line 71: const handoffsDir = path.join(root, 'handoffs')",
        "usageCount": "returned from getEffectivePaths at line 82, but no consumer found in src/",
        "status": "SUSPECT — exported via getEffectivePaths return value but no evidence of consumption"
      }
    },
    "getEffectivePathsReturnKeys": [
      "root", "stateDir", "configDir", "graphDir", "sessionsDir",
      "sessionInspectionDir", "projectPlanningDir", "handoffsDir", "errorLogDir",
      "runtimeAttachmentSettings", "workflowTasksState", "workflowTasksGraph", "trajectoryLedger"
    ]
  },

  "5_pluginEntry": {
    "path": "src/plugin/opencode-plugin.ts",
    "lines": 234,
    "hooks": {
      "event": "line 72 → eventHandler",
      "experimental.chat.system.transform": "line 75 → transformHandler",
      "tool": "lines 78-88 → 9 tools registered",
      "chat.message": "line 89 → resetTurnSnapshot + degraded mode warning",
      "permission.ask": "line 102 → auto-allow HiveMind tools, governance toast on writes",
      "tool.execute.before": "line 120 → recordToolEvent for trajectory tracking",
      "shell.env": "line 126 → inject HIVEMIND_* env vars",
      "command.execute.before": "line 133 → slash command bundle lookup + synthetic context part",
      "tool.execute.after": "line 174 → recordToolEvent post-execution",
      "experimental.text.complete": "line 179 → session inspection export + diagnostic log + journal handler",
      "experimental.chat.messages.transform": "line 222 → messagesTransform adapter",
      "experimental.session.compacting": "line 223 → compactionHandler + compactionJournalHandler"
    },
    "registeredTools": [
      "hivemind_runtime_status", "hivemind_runtime_command",
      "hivemind_agent_work_create_contract", "hivemind_agent_work_export_contract",
      "hivemind_doc", "hivemind_task", "hivemind_trajectory",
      "hivemind_handoff", "hivemind_journal"
    ],
    "hardcodedDefaultAgent": "line 202: preferredUserName ?? 'hivefiver'",
    "imports": {
      "fromFeatures": ["createAgentWorkCreateContractTool", "createAgentWorkExportContractTool"],
      "fromTools": ["createHivemindDocTool", "createHivemindHandoffTool", "createHivemindRuntimeStatusTool", "createHivemindRuntimeCommandTool", "createTaskTool", "createTrajectoryTool", "createHivemindJournalTool"],
      "fromHooks": ["initSdkContext", "resetSdkContext", "createEventHandler", "showGovernanceToast", "isHivemindManagedTool", "recordToolEvent", "createTransformHandler", "createTextCompleteHandler", "createCompactionJournalHandler"],
      "fromSdkSupervisor": ["upsertSessionInspectionExport", "writeDiagnosticLog"]
    }
  },

  "6_schemaKernel": {
    "path": "src/schema-kernel/",
    "files": [
      { "name": "AGENTS.md", "lines": 27 },
      { "name": "index.ts", "lines": 17 }
    ],
    "indexTsExports": "Re-exports from src/archive/schema-kernel/: shared.js, lifecycle-records.js, orchestration-records.js, evidence-records.js",
    "canonicalContracts": "Actual schema definitions live in src/archive/schema-kernel/ (4 modules: shared, lifecycle-records, orchestration-records, evidence-records)",
    "status": "Thin re-export layer. The sector owns additive machine-authoritative Phase 1 record contracts. Does NOT own durable writes, hook logic, or supervisor orchestration.",
    "keyConsumer": "src/tools/runtime/tools.ts — emits validated lifecycle/supervisor records in hivemind_runtime_status"
  },

  "7_sdkSupervisor": {
    "path": "src/sdk-supervisor/",
    "files": [
      { "name": "index.ts", "lines": 5 },
      { "name": "instance-registry.ts", "lines": 49 },
      { "name": "health.ts", "lines": 75 },
      { "name": "runtime-status.ts", "lines": 300 },
      { "name": "session-inspection.ts", "lines": 106 },
      { "name": "session-inspection.test.ts", "lines": 80 },
      { "name": "diagnostic-log.ts", "lines": 107 }
    ],
    "exports": ["instance-registry", "health", "runtime-status", "session-inspection", "diagnostic-log"],
    "keyFunctions": [
      "createSupervisorInstanceRegistry",
      "registerSupervisorInstance",
      "summarizeSupervisorHealth",
      "createSupervisorStatusReport",
      "buildRuntimeStatusSnapshot",
      "upsertSessionInspectionExport",
      "createPreparedPurificationCommand",
      "writeDiagnosticLog"
    ],
    "deprecatedModules": ["diagnostic-log.ts — marked @deprecated, to be removed in Plan #11"],
    "schemaKernelDependency": "runtime-status.ts imports from schema-kernel/index.js (lifecycle records, orchestration records)"
  },

  "8_toolsDirectory": {
    "path": "src/tools/",
    "structure": {
      "AGENTS.md": 1,
      "index.ts": 107,
      "hivemind-journal.ts": 1,
      "hivemind-journal.test.ts": 1,
      "doc/": ["index.ts", "tools.ts", "types.ts"],
      "handoff/": ["index.ts", "tools.ts", "types.ts"],
      "runtime/": ["index.ts", "tools.ts", "types.ts", "runtime-command-validator.ts", "runtime-status-validator.ts"],
      "task/": ["index.ts", "tools.ts", "types.ts"],
      "trajectory/": ["index.ts", "tools.ts", "types.ts"]
    },
    "totalFiles": 20,
    "toolSubdirectories": ["doc", "handoff", "runtime", "task", "trajectory"],
    "catalogTools": [
      "hivemind_doc", "hivemind_task", "hivemind_trajectory",
      "hivemind_handoff", "hivemind_runtime_status", "hivemind_runtime_command",
      "hivemind_agent_work_create_contract", "hivemind_agent_work_export_contract",
      "hivemind_journal"
    ]
  },

  "9_opencodeCommands": {
    "path": ".opencode/commands/",
    "exists": true,
    "files": [
      "hm-course-correct.md", "hm-doctor.md", "hm-harness.md",
      "hm-implement.md", "hm-init.md", "hm-plan.md",
      "hm-research.md", "hm-settings.md", "hm-tdd.md", "hm-verify.md"
    ],
    "totalFiles": 10,
    "note": "These are the runtime command surfaces registered via findSlashCommandBundle in plugin entry"
  },

  "10_tests": {
    "totalFiles": 34,
    "files": [
      "tests/authority-contract.test.ts",
      "tests/cli-init-output.test.ts",
      "tests/command-parser-edge-cases.test.ts",
      "tests/delegation-schema-validation.test.ts",
      "tests/event-handler-unknown.test.ts",
      "tests/features/event-tracker/writers/base-writer.test.ts",
      "tests/features/event-tracker/writers/diagnostics-writer.test.ts",
      "tests/features/event-tracker/writers/events-writer.test.ts",
      "tests/hooks/compaction-handler.test.ts",
      "tests/hooks/session-idle-handler.test.ts",
      "tests/hooks/text-complete-handler.test.ts",
      "tests/hooks/transform-handler.test.ts",
      "tests/integration/chat-message-consolidated.test.ts",
      "tests/integration/compaction-consolidated.test.ts",
      "tests/integration/handler-bugs.test.ts",
      "tests/integration/multi-turn-accumulation.test.ts",
      "tests/integration/semantic-naming.test.ts",
      "tests/integration/text-complete-consolidated.test.ts",
      "tests/integration/tool-invocation.test.ts",
      "tests/nl-first-dispatch.test.ts",
      "tests/plugin-assembly-smoke.test.ts",
      "tests/plugin-context-detox.test.ts",
      "tests/plugin-runtime.test.ts",
      "tests/plugin/event-tracker-wiring.test.ts",
      "tests/runtime-authority-live-sanity.test.ts",
      "tests/runtime-entry-contract.test.ts",
      "tests/runtime-resilience.test.ts",
      "tests/runtime-surface-sync.test.ts",
      "tests/runtime-tools.test.ts",
      "tests/sync-dry-run.test.ts",
      "tests/task-lifecycle-corruption.test.ts",
      "tests/unit/context-renderer/tool-precedence.test.ts",
      "tests/unit/context-renderer/turn-hierarchy.test.ts",
      "tests/unit/context-renderer/workflow-style.test.ts",
      "src/sdk-supervisor/session-inspection.test.ts",
      "src/tools/hivemind-journal.test.ts"
    ],
    "testCategories": {
      "unit": ["context-renderer/* (3 files)"],
      "integration": ["chat-message-consolidated", "compaction-consolidated", "handler-bugs", "multi-turn-accumulation", "semantic-naming", "text-complete-consolidated", "tool-invocation"],
      "hooks": ["compaction-handler", "session-idle-handler", "text-complete-handler", "transform-handler"],
      "plugin": ["assembly-smoke", "context-detox", "runtime", "event-tracker-wiring"],
      "runtime": ["authority-live-sanity", "entry-contract", "resilience", "surface-sync", "tools"],
      "features": ["event-tracker/writers/* (3 files)"],
      "other": ["authority-contract", "cli-init-output", "command-parser-edge-cases", "delegation-schema-validation", "event-handler-unknown", "nl-first-dispatch", "sync-dry-run", "task-lifecycle-corruption"]
    }
  },

  "gaps": [
    "src/plugin/opencode-skill-registry.ts does NOT exist — the barrel at src/shared/index.ts re-exports from src/shared/opencode-skill-registry.ts instead",
    "ARTIFACTS_DIR, CHECKPOINTS_DIR, STATE_FILES in paths.ts are dead code (0 consumers outside paths.ts)",
    "handoffsDir in getEffectivePaths has no observable consumer in src/",
    "diagnostic-log.ts in sdk-supervisor is marked @deprecated but still wired in plugin entry at opencode-plugin.ts:202-215"
  ]
}
```

### Key Findings Summary

**Skill injection** is entirely centralized in `src/plugin/skill-exposure-map.ts` with 20 unique hardcoded skill names across 9 agent bundles, 6 purpose-conditional bundles, and 1 shared skill. The `opencode-skill-registry.ts` (at `src/shared/`, not `src/plugin/`) is a separate filesystem-based skill discovery system — it does NOT participate in the injection pipeline. The injection flow is: `messages-transform-adapter.ts` → `resolveSkillBundle()` → `injection-store.ts` → consumed by `text.complete` hook.

**Legacy CLI** — all 8 files exist totaling 2,329 lines. The `bin/hivemind-tools.cjs` is the largest artifact at 51KB (1,422 lines). The two `.deprecated` scripts are minimal stubs.

**Dead code in paths.ts** — `ARTIFACTS_DIR`, `CHECKPOINTS_DIR`, and `STATE_FILES` are exported constants with zero consumers. `handoffsDir` is returned from `getEffectivePaths()` but no file in `src/` destructures or uses it.

**Schema kernel** is a thin re-export layer (2 files, 44 lines) pointing to `src/archive/schema-kernel/`. **SDK supervisor** has 7 files (722 lines) with `diagnostic-log.ts` marked deprecated. The plugin entry wires 12 hooks and 9 tools, with `'hivefiver'` hardcoded as the default agent fallback in two locations (lines 156 and 202 of their respective files).