Design and implement a comprehensive development framework and harness engine that orchestrates multi-agent workflows within the OpenCode SDK ecosystem. The system must achieve deterministic pipeline execution through a layered architecture composed of actors, contributors, and consumers managing workflow lifecycles. Agents operate within configurable loops controlling workflow decisions and tool selection, while programmatic engines handle auto-extraction, export operations, schematic parsing, and context-integrity maintenance for agent-retrievable artifacts. Implement a lightweight but efficient data-layer supporting intelligence growth and cross-session adaptiveness using a local-sized vector database enabling cross-project selectable excerpts and hierarchical knowledge management with metadata tagging. Incorporate quick-search scanning and skimming capabilities through native tools such as repomix, grep, glob, and regex for JSON schema and XML file operations, functioning as a time-machine mechanism when agents launch for inspection or investigation tasks. The system must include specialized features and tools as both utilities and engine-paired instruments. All components must be orchestrated into a cohesive ecosystem featuring visual dashboards and interactive panes supporting collaborative development through hive intelligence and collective mind-sharing paradigms. The framework shall include the following primary modules: agent-work-contract with engine components for anchor-recording, chain execution, contract management, intent classification, and response-mode resolution; doc-intelligence for document processing; event-tracker with classifier integration, consolidated writers supporting both v3 and legacy formats, markdown writers, and session structure parsers; handoff for agent transitions; runtime-entry handling attachments, commands, initialization, inspection, invocation, and workflow continuity; runtime-observability for status tracking and synchronization; session-entry managing intake processes, language resolution, lineage routing, profile resolution, and purpose classification; session-journal for error logging, hierarchy writing, and session resolution; trajectory for assessment and storage operations; and workflow-management for task lifecycles, workflow authority, and routing. Additionally, implement hooks including auto-slash-command handling, chat-message processing, compaction management, event handling, runtime loading with tool governance, SDK context management, soft governance, start-work routing, text-complete handling, tool-execution handling, transformation handling, and workflow integration. The tools subsystem must provide doc operations, handoff tools, hivefiver-doctor diagnostics, hivefiver-init initialization, hivefiver-setting management with dashboard and i18n support, runtime tools, task management tools, and trajectory tools. The plugin layer must expose context-rendering with multiple renderer types, evidence reporting, injection stores, input helpers, message transformation, opencode plugin integration, route hints, runtime prompts, runtime snapshots, skill exposure mapping, synthetic parts generation, and system transformation capabilities. Ensure all components maintain interface compatibility with OpenCode SDK without direct mutation of SDK interfaces, preserving extensibility and future SDK evolution compatibility.

Though this framework + harness engine does not directly mutate the OpenCode SDK interfaces, the “harness” which composites of various “actors”, “contributors” and “consumers” from delivering the deterministic workflow pipelines and lifecycles’ harness by agents’ decisions on workflows, agent and tool loops, tools uses; to how programatic engines with auto extract, exported, schematic parser, writer to deliver the “context-integrity” for agent’s retrievable artifacts; to the very light-weight but efficient “data-layer” for intelligence growth and adaptiveness across sessions (utilizing local-size vector database for cross-sessions and cross-project selectable excerpt and hierarchical knowledge, selectable meta data + the quick search scanning and skimming innate tools like repomix, grep, glob, regex etc for json schema and xml files that work as time-machine when agents are launched to work as inspector or investigation works); to the very specialized features and tools (tools as utilities and tools paired with engines); all are orchestrated and weaved into an ecosystem of interactive (visual dashboard and interactive panes) of dev-together of hive and mind:

### Some peaks into what I am intend to bring over

/Users/apple/hivemind-plugin/.worktrees/product-detox/src/features

```markdown
 apple@MacBook-Pro-cua-Apple features % tree
.
├── agent-work-contract
│   ├── engine
│   │   ├── anchor-recorder.test.ts
│   │   ├── anchor-recorder.ts
│   │   ├── chain-executor.test.ts
│   │   ├── chain-executor.ts
│   │   ├── command-session-contract.ts
│   │   ├── contract-store.archive.ts
│   │   ├── contract-store.base.ts
│   │   ├── contract-store.crud.ts
│   │   ├── contract-store.test.ts
│   │   ├── contract-store.ts
│   │   ├── contract-store.types.ts
│   │   ├── index.ts
│   │   ├── intent-classifier.test.ts
│   │   ├── intent-classifier.ts
│   │   ├── response-mode-resolver.test.ts
│   │   └── response-mode-resolver.ts
│   ├── hooks
│   │   ├── agent-work-event-handler.test.ts
│   │   ├── agent-work-event-handler.ts
│   │   ├── compaction-preservation.test.ts
│   │   ├── compaction-preservation.ts
│   │   └── index.ts
│   ├── index.ts
│   ├── schema
│   │   ├── contract.ts
│   │   ├── delegation.ts
│   │   ├── index.ts
│   │   └── intent.ts
│   ├── tools
│   │   ├── classify-intent-tool.test.ts
│   │   ├── classify-intent-tool.ts
│   │   ├── create-contract-tool.helpers.ts
│   │   ├── create-contract-tool.normalizers.ts
│   │   ├── create-contract-tool.operations.ts
│   │   ├── create-contract-tool.schema.ts
│   │   ├── create-contract-tool.test.ts
│   │   ├── create-contract-tool.ts
│   │   ├── export-contract-tool.test.ts
│   │   ├── export-contract-tool.ts
│   │   └── index.ts
│   └── types.ts
├── doc-intelligence
│   ├── doc.ts
│   └── index.ts
├── event-tracker
│   ├── classifier
│   │   ├── classifier-integration.test.ts
│   │   ├── delegation-returned-evidence.test.ts
│   │   ├── delegation-returned-evidence.ts
│   │   ├── event-classifier.test.ts
│   │   ├── event-classifier.ts
│   │   ├── event-id.test.ts
│   │   ├── event-id.ts
│   │   ├── writer-adapter.test.ts
│   │   └── writer-adapter.ts
│   ├── consolidated-writer-v3.test.ts
│   ├── consolidated-writer.test.ts
│   ├── consolidated-writer.ts
│   ├── markdown-writer.test.ts
│   ├── markdown-writer.ts
│   ├── parser
│   │   ├── counter.test.ts
│   │   ├── counter.ts
│   │   ├── delegation-extractor.test.ts
│   │   ├── delegation-extractor.ts
│   │   ├── header-parser.test.ts
│   │   ├── header-parser.ts
│   │   ├── meta-parser.test.ts
│   │   ├── meta-parser.ts
│   │   ├── splitter.test.ts
│   │   ├── splitter.ts
│   │   ├── turn-parser.test.ts
│   │   ├── turn-parser.ts
│   │   ├── types.test.ts
│   │   └── types.ts
│   ├── paths.test.ts
│   ├── paths.ts
│   ├── session-structure.test.ts
│   ├── session-structure.ts
│   ├── session-v3-types.test.ts
│   ├── types.test.ts
│   ├── types.ts
│   └── writers
│       ├── formatter.test.ts
│       ├── formatter.ts
│       ├── index-writer.test.ts
│       ├── index-writer.ts
│       ├── synthesizer.test.ts
│       └── synthesizer.ts
├── handoff
│   ├── handoff.ts
│   └── index.ts
├── runtime-entry
│   ├── attachment.builder.ts
│   ├── attachment.defaults.ts
│   ├── attachment.persistence.ts
│   ├── attachment.ts
│   ├── attachment.types.ts
│   ├── command.ts
│   ├── doctor.ts
│   ├── handler-shared.ts
│   ├── harness.ts
│   ├── index.ts
│   ├── init-project.ts
│   ├── init.handler.ts
│   ├── init.helpers.ts
│   ├── init.ts
│   ├── init.types.ts
│   ├── inspection-command-handler.ts
│   ├── instruction-loader.ts
│   ├── invocation.ts
│   ├── nl-first-dispatch.ts
│   ├── runtime-command-handlers.ts
│   ├── settings.ts
│   ├── snapshot-loader.ts
│   ├── turn-output.ts
│   ├── workflow-command-handler.ts
│   └── workflow-continuity.ts
├── runtime-observability
│   ├── index.ts
│   ├── status.ts
│   └── sync.ts
├── session-entry
│   ├── index.ts
│   ├── intake.constants.ts
│   ├── intake.gates.ts
│   ├── intake.ts
│   ├── intake.types.ts
│   ├── language-resolution.ts
│   ├── lineage-router.ts
│   ├── profile-resolution.ts
│   ├── purpose-classifier.ts
│   ├── readiness-gates.ts
│   ├── session-state.ts
│   ├── settings-delta.ts
│   └── start-work-types.ts
├── session-journal
│   ├── error-log-writer.test.ts
│   ├── error-log-writer.ts
│   ├── hierarchy-writer.ts
│   └── session-resolver.ts
├── trajectory
│   ├── index.ts
│   └── trajectory.ts
└── workflow
    ├── index.ts
    └── task.ts
    
```

## The management (task) side

```markdown
apple@MacBook-Pro-cua-Apple core % tree
.
├── index.ts
├── trajectory
│   ├── index.ts
│   ├── trajectory-assessment.ts
│   ├── trajectory-store.ledger.ts
│   ├── trajectory-store.operations.ts
│   ├── trajectory-store.ts
│   ├── trajectory-store.types.ts
│   └── trajectory-types.ts
└── workflow-management
    ├── continuity.ts
    ├── index.ts
    ├── task-lifecycle.ts
    ├── workflow-authority.ts
    ├── workflow-router.ts
    └── workflow-types.ts

```

### The hooks part /Users/apple/hivemind-plugin/.worktrees/product-detox/src/hooks

```markdown
5 directories, 22 files
apple@MacBook-Pro-cua-Apple hooks % tree
.
├── auto-slash-command
│   ├── auto-slash-command-types.ts
│   ├── auto-slash-command.ts
│   └── index.ts
├── chat-message-handler.ts
├── compaction-handler.ts
├── event-handler.test.ts
├── event-handler.ts
├── index.ts
├── runtime-loader
│   ├── index.ts
│   ├── runtime-stage.ts
│   └── tool-governance.ts
├── sdk-context.ts
├── soft-governance.ts
├── start-work
│   ├── index.ts
│   ├── start-work-router-helpers.ts
│   ├── start-work-router.test.ts
│   └── start-work-router.ts
├── text-complete-handler.ts
├── tool-execution-handler.ts
├── transform-handler.ts
└── workflow-integration
    ├── index.ts
    └── workflow-continuity.ts

5 directories, 22 files
apple@MacBook-Pro-cua-Apple hooks % 
```

### The tools side

@/Users/apple/hivemind-plugin/.worktrees/product-detox/src/intelligence 

```markdown
intelligence % tree

.
├── doc
│   ├── doc-surface-router.ts
│   ├── formats
│   │   └── md.ts
│   ├── index.ts
│   ├── read-ops.ts
│   ├── safety.ts
│   └── types.ts
└── index.ts

18 directories, 132 files
apple@MacBook-Pro-cua-Apple features % 
```

### The plugin @/Users/apple/hivemind-plugin/.worktrees/product-detox/src/plugin 

```markdown
apple@MacBook-Pro-cua-Apple plugin % tree
.
├── compaction-adapter.ts
├── context-renderer.builder.ts
├── context-renderer.compaction-renderers.ts
├── context-renderer.constants.ts
├── context-renderer.renderers.ts
├── context-renderer.test.ts
├── context-renderer.ts
├── context-renderer.types.ts
├── evidence-reporter.ts
├── index.ts
├── injection-store.ts
├── input-helpers.ts
├── messages-transform-adapter.ts
├── messages-transform.ts
├── opencode-plugin.ts
├── route-hint.ts
├── runtime-prompt.ts
├── runtime-snapshot.ts
├── skill-exposure-map.ts
├── skill-focus-renderer.ts
├── skill-injection-init.test.ts
├── synthetic-parts.ts
└── system-transform.ts
.
├── doc
│   ├── index.ts
│   ├── tools.ts
│   └── types.ts
├── handoff
│   ├── index.ts
│   ├── tools.ts
│   └── types.ts
├── hivefiver-doctor
│   ├── index.ts
│   ├── tools.ts
│   └── types.ts
├── hivefiver-init
│   ├── index.ts
│   ├── tools.ts
│   └── types.ts
├── hivefiver-setting
│   ├── dashboard.ts
│   ├── i18n
│   │   └── index.ts
│   ├── index.ts
│   ├── render.ts
│   ├── spec-builder.ts
│   ├── tools.ts
│   └── types.ts
├── hivefiver-tools.test.ts
├── hivemind-journal.test.ts
├── hivemind-journal.ts
├── index.ts
├── runtime
│   ├── index.ts
│   ├── tools.ts
│   └── types.ts
├── task
│   ├── index.ts
│   ├── tools.ts
│   └── types.ts
└── trajectory
    ├── index.ts
    ├── tools.ts
    └── types.ts

```