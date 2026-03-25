# Session Inspection Export

- ses_id: `ses_2df29adc6ffeKrCjkW2CUUMefz`
- prepared_at: `2026-03-24T17:17:54.524Z`

## Assistant Output

## Codebase Investigation Report

**Scope:** `/Users/apple/hivemind-plugin/.worktrees/product-detox/src`
**Total TypeScript Files:** 281
**Total Test Files:** 41
**Pass ID:** pass_1774372436

---

### Directory Tree Structure

```
src/
├── index.ts                    # Main barrel export
├── cli.ts                      # CLI entry point
├── archive/                    # Archived/deprecated modules
│   └── schema-kernel/
├── cli/                        # CLI implementations (init, doctor, harness, settings, sync)
├── commands/                   # Slash command registry
│   └── slash-command/
├── context/                    # Context management
│   └── prompt-packet/
├── control-plane/              # CLI command gate & intake (4 primitives)
├── core/                       # State management authority
│   ├── trajectory/             # Trajectory ledger, events, checkpoints
│   └── workflow-management/    # Workflow authority, task lifecycle
├── delegation/                 # Handoff context packaging
├── features/                   # Domain-specific features
│   ├── agent-work-contract/    # Work contract engine, schema, hooks, tools
│   ├── doc-intelligence/
│   ├── event-tracker/         # Classification, parsing, writing
│   ├── handoff/
│   ├── runtime-entry/          # Init, doctor, harness, attachment
│   ├── runtime-observability/
│   ├── session-entry/          # Purpose classification, intake, readiness
│   ├── trajectory/
│   └── workflow/
├── governance/                  # Governance rules
├── hooks/                       # OpenCode plugin hooks (read-side)
│   ├── auto-slash-command/
│   ├── runtime-loader/
│   ├── start-work/             # Session lifecycle (authority)
│   └── workflow-integration/
├── intelligence/                 # Document intelligence
│   └── doc/
├── plugin/                      # OpenCode plugin assembly (22 files)
├── recovery/                    # Recovery spine
├── schema-kernel/               # Schema authority
├── sdk-supervisor/              # Phase 1 orchestration control
├── shared/                      # Utilities (21 files)
│   └── contracts/
└── tools/                       # 8 agent-callable tools (write-side CQRS)
    ├── doc/
    ├── handoff/
    ├── runtime/
    ├── task/
    └── trajectory/
```

---

### Key Files and Their Purposes

| File | Purpose |
|------|---------|
| `src/index.ts` | Main barrel export - all core modules + HiveMindPlugin |
| `src/cli.ts` | CLI entry point routing to 5 commands |
| `src/plugin/opencode-plugin.ts` | **Assembly-only plugin** - wires 17 hooks + 8 tools, NO business logic |

---

### Tools Inventory (8 Tools)

| Tool | Directory | Purpose |
|------|-----------|---------|
| `hivemind_doc` | `tools/doc` | Read-only markdown doc intelligence |
| `hivemind_task` | `tools/task` | Workflow task management |
| `hivemind_trajectory` | `tools/trajectory` | Trajectory control |
| `hivemind_handoff` | `tools/handoff` | Delegation handoff records |
| `hivemind_runtime_status` | `tools/runtime` | Runtime inspection |
| `hivemind_runtime_command` | `tools/runtime` | Runtime command execution |
| `hivemind_agent_work_create_contract` | `features/agent-work-contract/tools` | Create work contract |
| `hivemind_agent_work_export_contract` | `features/agent-work-contract/tools` | Export work contract |

---

### Layer Architecture

| Layer | Directory | Rule |
|-------|-----------|------|
| **Tools** | `src/tools/` | Write-side CQRS, LLM-facing, Zod schemas required |
| **Hooks** | `src/hooks/` | Read-side, in-band interception, NO durable writes |
| **Plugin** | `src/plugin/` | Assembly only, NO business logic |
| **SDK-Supervisor** | `src/sdk-supervisor/` | Phase 1 orchestration control |
| **Schema-Kernel** | `src/schema-kernel/` | Phase 1 contract authority |
| **Core** | `src/core/` | Trajectory + workflow-management state |
| **Shared** | `src/shared/` | Transitional utilities |

---

### Test Coverage

- **41 test files** across the codebase
- `src/features/event-tracker/` - 28 test files (integration, classifier, parser tests)
- `src/features/agent-work-contract/` - 8 test files (engine, tools, hooks)
- `src/hooks/`, `src/plugin/`, `src/sdk-supervisor/` - unit tests

---

### Package.json Dependencies

```json
{
  "name": "hivemind-context-governance",
  "version": "2.9.5",
  "key_deps": [
    "@opencode-ai/plugin (>=1.1.0)",
    "@opencode-ai/sdk (^1.2.27)",
    "zod (^4.3.6)",
    "typescript (^5.3.0)",
    "yaml (^2.8.2)",
    "remark (^15.0.1)",
    "web-tree-sitter (^0.26.5)"
  ]
}
```

---

### Gaps and Anomalies

| Issue | Description |
|-------|-------------|
| `features/index.ts` missing | `src/features/` has no barrel export |
| `dashboard-v2/` empty | Directory exists but contains no files |
| `archive/schema-kernel/` | Archived files separate from active `src/schema-kernel/` |
| `start-work-router.ts` | ~467 tokens compressed - potential hotspot |
| `SlashCommandBundle` | 18 fields creates high coupling |
| `core/session/` REMOVED | L1 cutover moved session lifecycle to `hooks/start-work/` |

---

### Barrel Exports (42 index.ts files)

Most directories have `index.ts` barrel exports except `features/` which exports individually per feature.

---

**Report saved to:** `.hivemind/activity/codescan/pass_1774372436/investigation-report.json`