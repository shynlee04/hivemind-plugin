# New session - 2026-05-06T05:30:38.285Z

**Session ID:** ses_2043bb6b2ffe9LTBHXn4epbjWV
**Created:** 5/6/2026, 12:30:38 PM
**Updated:** 5/6/2026, 12:34:27 PM

---

## User

Act as an end-user tester to validate the features/tools under the OpenCode runtime (GSD-UAT). Your goal is to test all the custom tools and harness features  and functions that expose to agents (you) (of main and subagents, as orchestrator and/or other domains

## Base on all features, custom tools, plugins, hooks that buit into `dist` - all that either programatically or determitiscally call by you (or other agent-specific role - if so use task to delegate to the roles and request for report)

```
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/cli
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/create-core-hooks.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/create-core-hooks.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/create-core-hooks.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/create-core-hooks.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/create-session-hooks.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/create-session-hooks.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/create-session-hooks.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/create-session-hooks.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/create-tool-guard-hooks.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/create-tool-guard-hooks.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/create-tool-guard-hooks.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/create-tool-guard-hooks.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/hook-cqrs-boundary.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/hook-cqrs-boundary.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/hook-cqrs-boundary.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/hook-cqrs-boundary.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/messages-transform.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/messages-transform.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/messages-transform.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/messages-transform.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/plugin-event-observers.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/plugin-event-observers.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/plugin-event-observers.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/plugin-event-observers.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/tool-after-composer.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/tool-after-composer.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/tool-after-composer.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/tool-after-composer.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/types.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/types.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/types.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/hooks/types.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/agent-work-contracts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/behavioral-profile
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/command-engine
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/config-workflow
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/control-plane
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/doc-intelligence
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/event-tracker
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/prompt-packet
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/pty
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/recovery
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/runtime-detection
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/runtime-pressure
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/sdk-supervisor
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/security
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/session-entry
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/spawner
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/trajectory
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/app-api.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/app-api.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/app-api.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/app-api.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/auto-loop.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/auto-loop.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/auto-loop.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/auto-loop.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/category-gate-audit.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/category-gate-audit.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/category-gate-audit.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/category-gate-audit.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/category-gates.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/category-gates.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/category-gates.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/category-gates.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/command-delegation.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/command-delegation.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/command-delegation.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/command-delegation.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/completion-detector.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/completion-detector.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/completion-detector.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/completion-detector.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/concurrency.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/concurrency.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/concurrency.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/concurrency.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/config-compiler.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/config-compiler.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/config-compiler.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/config-compiler.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/config-subscriber.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/config-subscriber.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/config-subscriber.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/config-subscriber.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/continuity.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/continuity.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/continuity.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/continuity.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/cross-primitive-validator.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/cross-primitive-validator.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/cross-primitive-validator.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/cross-primitive-validator.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/delegation-manager.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/delegation-manager.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/delegation-manager.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/delegation-manager.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/delegation-persistence.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/delegation-persistence.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/delegation-persistence.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/delegation-persistence.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/delegation-state-machine.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/delegation-state-machine.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/delegation-state-machine.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/delegation-state-machine.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/delegation-types.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/delegation-types.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/delegation-types.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/delegation-types.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/execution-lineage.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/execution-lineage.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/execution-lineage.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/execution-lineage.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/framework-detector.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/framework-detector.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/framework-detector.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/framework-detector.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/helpers.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/helpers.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/helpers.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/helpers.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/journal-query.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/journal-query.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/journal-query.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/journal-query.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/journal-replay.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/journal-replay.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/journal-replay.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/journal-replay.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/lifecycle-manager.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/lifecycle-manager.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/lifecycle-manager.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/lifecycle-manager.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/notification-handler.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/notification-handler.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/notification-handler.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/notification-handler.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/plugin-tool-output-summary.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/plugin-tool-output-summary.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/plugin-tool-output-summary.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/plugin-tool-output-summary.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/primitive-loader.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/primitive-loader.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/primitive-loader.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/primitive-loader.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/primitive-registry.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/primitive-registry.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/primitive-registry.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/primitive-registry.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/primitive-scanners.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/primitive-scanners.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/primitive-scanners.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/primitive-scanners.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/ralph-loop.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/ralph-loop.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/ralph-loop.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/ralph-loop.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/runtime-policy.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/runtime-policy.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/runtime-policy.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/runtime-policy.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/runtime-validator.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/runtime-validator.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/runtime-validator.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/runtime-validator.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/runtime.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/runtime.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/runtime.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/runtime.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/sdk-delegation.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/sdk-delegation.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/sdk-delegation.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/sdk-delegation.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/session-api.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/session-api.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/session-api.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/session-api.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/session-journal.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/session-journal.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/session-journal.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/session-journal.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/state.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/state.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/state.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/state.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/task-status.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/task-status.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/task-status.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/task-status.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/types.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/types.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/types.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/types.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/workspace-runtime-policy.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/workspace-runtime-policy.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/workspace-runtime-policy.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/lib/workspace-runtime-policy.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/agent-frontmatter.schema.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/agent-frontmatter.schema.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/agent-frontmatter.schema.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/agent-frontmatter.schema.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/agent-work-contract.schema.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/agent-work-contract.schema.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/agent-work-contract.schema.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/agent-work-contract.schema.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/command-engine.schema.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/command-engine.schema.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/command-engine.schema.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/command-engine.schema.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/command-frontmatter.schema.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/command-frontmatter.schema.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/command-frontmatter.schema.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/command-frontmatter.schema.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/config-precedence.schema.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/config-precedence.schema.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/config-precedence.schema.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/config-precedence.schema.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/doc-intelligence.schema.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/doc-intelligence.schema.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/doc-intelligence.schema.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/doc-intelligence.schema.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/hivemind-configs.schema.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/hivemind-configs.schema.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/hivemind-configs.schema.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/hivemind-configs.schema.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/index.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/index.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/index.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/index.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/mcp-server.schema.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/mcp-server.schema.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/mcp-server.schema.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/mcp-server.schema.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/permission.schema.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/permission.schema.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/permission.schema.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/permission.schema.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/prompt-enhance.schema.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/prompt-enhance.schema.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/prompt-enhance.schema.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/prompt-enhance.schema.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/runtime-pressure.schema.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/runtime-pressure.schema.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/runtime-pressure.schema.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/runtime-pressure.schema.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/sdk-supervisor.schema.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/sdk-supervisor.schema.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/sdk-supervisor.schema.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/sdk-supervisor.schema.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/skill-metadata.schema.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/skill-metadata.schema.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/skill-metadata.schema.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/skill-metadata.schema.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/tool-definition.schema.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/tool-definition.schema.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/tool-definition.schema.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/tool-definition.schema.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/trajectory.schema.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/trajectory.schema.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/trajectory.schema.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/schema-kernel/trajectory.schema.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/shared
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/sidecar
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/prompt-analyze
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/prompt-skim
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/session-patch
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/configure-primitive-paths.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/configure-primitive-paths.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/configure-primitive-paths.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/configure-primitive-paths.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/configure-primitive.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/configure-primitive.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/configure-primitive.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/configure-primitive.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/delegate-task.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/delegate-task.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/delegate-task.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/delegate-task.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/delegation-status.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/delegation-status.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/delegation-status.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/delegation-status.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/hivemind-agent-work.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/hivemind-agent-work.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/hivemind-agent-work.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/hivemind-agent-work.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/hivemind-command-engine.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/hivemind-command-engine.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/hivemind-command-engine.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/hivemind-command-engine.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/hivemind-doc.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/hivemind-doc.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/hivemind-doc.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/hivemind-doc.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/hivemind-pressure.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/hivemind-pressure.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/hivemind-pressure.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/hivemind-pressure.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/hivemind-sdk-supervisor.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/hivemind-sdk-supervisor.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/hivemind-sdk-supervisor.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/hivemind-sdk-supervisor.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/hivemind-trajectory.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/hivemind-trajectory.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/hivemind-trajectory.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/hivemind-trajectory.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/run-background-command.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/run-background-command.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/run-background-command.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/run-background-command.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/session-journal-export.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/session-journal-export.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/session-journal-export.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/session-journal-export.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/validate-restart.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/validate-restart.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/validate-restart.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/tools/validate-restart.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/index.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/index.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/index.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/index.js.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/plugin.d.ts
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/plugin.d.ts.map
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/plugin.js
/Users/apple/Documents/coding-projects/hivemind-plugin-1/dist/plugin.js.map
````

---

Codebase-wide audit and LIVE RUNTIME  REAL LIFE USE CASES - NOT TESTS RUNNING REPORTS

---

- Generate multiple diverse use cases for them but do not do all at once, processing controlled batches, one after another. Do not conclude success or failure unless complete a lifecycle end2end.
- Do not read project code files; rely solely on system responses and traceable results.
- Do not make assumptions, suggestions, or diagnoses. Act strictly as a user executing the tool.
- do not test mcp tools

_ test the ones created by this HIvemind harness project only

- Log all system responses, observed behaviors, and any bugs or errors encountered during execution.
- You are the main orchestrator (L0) → knowing that there are 3-level depth delegation and the system of skills vs. agents (as hm-l0-*, hm-l1-* , hm-l2-*) - based on the requests, tasks and complexity you may set up your delegation to hm-l1-* for the coordinator delegate the further depth if the task is complex with intricate loops, gatekeeping and guardrails ; otherwise you can decide to delegate directly to hm-l2-*

at certain phase, and the sub tasks of the phase try to look at skills - the hm-*, gsd-*, gate-* and stack-* skills to help support with systematically and incrementally conduct test, log, record, and make authentic quality and gatekeepoing verification and evaluations - with write and edit to assigned system of documents and artifacts on disk (of gatekeeping, integration check, stacks and tech features compliances, harness of OpenCode compliances, production-ready and ecosystem of harness features validation)  - all these phases feature live testing must following the workflows, life cycles actors and consumers rules as how the harness project (as Hivefive project) must be run without any conflict, overlapping, nonsensical logics and must fully run with OpenCode primitives (both builtin and the users’ possible third-parties; as long as they are belonging to Opencode Ecosystem of plugins, custom tools, Project utilizing SDK and server-client API) - remember to write to disk log, results, outlines, hypothesis very frequently because either this main session, sub-sessions, returned outcomes, todo list - WILL NOT Persist and WILL suffer loss when compact as context windows limitation)

1. Phase 1 individual and single group: live run - log ; record ; raw evaluation based on real-life use cases of each feature from basic to advanced → then stack them within their group
2. phase 2 - across based on the 3 distinct paths and with correct OpenCode primitives (as agents, subagents, skill -those that belong to the other workstreams, commands, workflows etc)
3. phase 3 - advanced cross-workstreams, ecosystem and life cycles advanced batches - think of the advanced use cases  that utilize the other tools, features to come up with more comprehensive report 

---

## Assistant (Hm-L0-Orchestrator · Hy3 preview Free · 48.3s)

_Thinking:_

Got it. I'm being asked to act as an end-user tester to validate the features/tools under the OpenCode runtime (GSD-UAT). The user wants me to test all the custom tools and harness features that are exposed to agents (including main and subagents, as orchestrator and other domains).

Let me break down what's being asked:

1. **Test all features, custom tools, plugins, hooks** in the `dist/` directory
2. **Act as end-user tester** - not reading code, but actually using the tools
3. **Multiple phases:**
   - Phase 1: Individual/single group live runs - log, record, evaluate each feature from basic to advanced
   - Phase 2: Cross-test with 3 distinct paths using OpenCode primitives (agents, subagents, skills)
   - Phase 3: Advanced cross-workstreams, ecosystem and lifecycle advanced batches
4. **Important constraints:**
   - Do NOT read project code files; rely solely on system responses
   - Do NOT make assumptions, suggestions, or diagnoses
   - Act strictly as a user executing the tool
   - Do NOT test MCP tools (only test ones created by this Hivemind harness project)
   - Log all system responses, observed behaviors, bugs, errors
   - I'm the main orchestrator (L0) with 3-level depth delegation
   - Use skills (hm-*, gsd-*, gate-*, stack-*) to support testing
   - Write to disk logs, results, outlines, hypotheses frequently (because session context will be lost on compact)

Looking at the `dist/` structure, I can see the tools available:
- `dist/tools/delegate-task.js` - Delegation tool
- `dist/tools/delegation-status.js` - Check delegation status
- `dist/tools/prompt-skim/` - Prompt skim tool
- `dist/tools/prompt-analyze/` - Prompt analyze tool
- `dist/tools/session-patch/` - Session patch tool
- `dist/tools/configure-primitive/` - Configure primitive tool
- `dist/tools/hivemind-*/` - Various hivemind tools
- `dist/tools/run-background-command/` - Background command tool
- `dist/tools/session-journal-export/` - Session journal export
- `dist/tools/validate-restart/` - Validate restart tool

And hooks in `dist/hooks/`

Now, I need to:
1. First, load relevant skills for this testing task
2. Create a structured testing plan
3. Execute Phase 1 - individual tool testing
4. Log everything to disk

Let me start by loading the appropriate skills and setting up the testing framework. Given this is a testing/validation task, I should load:
- `hm-l2-test-driven-execution` - for TDD approach to testing
- `gate-l3-lifecycle-integration` - for lifecycle testing
- `gate-l3-spec-compliance` - for spec compliance
- `gate-l3-evidence-truth` - for evidence evaluation
- `hm-l2-completion-looping` - for ensuring tasks are actually complete
- `hm-l2-coordinating-loop` - for coordinating the testing waves

Actually, wait - I'm hm-orchestrator (L0). My role is to:
1. Classify intent
2. Route to L1 coordinator
3. L1 coordinator dispatches to L2 specialists

But the user is asking ME to act as an end-user tester. This is a bit of a conflict with my role definition. Let me re-read...

The user says: "Act as an end-user tester to validate the features/tools under the OpenCode runtime (GSD-UAT). Your goal is to test all the custom tools and harness features and functions that expose to agents (you)..."

So the user wants me to actually USE the tools as a tester would. But my role says "NEVER IMPLEMENT. NEVER EDIT FILES. NEVER READ CODE FOR COMPREHENSION. NEVER SKIP A GATE."

Actually, looking more carefully - the user is asking me to TEST the tools by using them, not implement them. This is different from implementation. Testing = using the tools and observing behavior.

But my constraints say I can't read code files... The user also says "Do not read project code files; rely solely on system responses and traceable results."

So I should:
1. Use the tools (delegate-task, delegation-status, prompt-skim, etc.)
2. Observe the responses
3. Log the results to disk
4. Use skills to help structure the testing

Let me start by announcing my role and then setting up the testing framework. I need to:
1. Load relevant skills for testing
2. Create a testing log file
3. Start Phase 1 - testing individual tools

Let me load the skills I need for this testing task

I am hm-orchestrator, front-facing L0 for hm-* product development. I route, delegate, and gatekeep — I never implement.

**Starting GSD-UAT End-User Testing of Hivemind Harness Features**

I'll act as an end-user tester to validate all custom tools and harness features. Let me load the required skills and set up structured testing with disk logging.

First, loading skills for testing methodology:

**Tool: skill**

**Input:**
```json
{
  "name": "hm-l2-test-driven-execution"
}
```

**Output:**
```
<skill_content name="hm-l2-test-driven-execution">
# Skill: hm-l2-test-driven-execution

# Test-Driven Execution

## Overview

Execute runtime-truthful RED/GREEN/REFACTOR work from locked requirements. This skill owns test-first execution, invalid RED detection, coverage evidence, regression handling, and honest blocked handoffs. It does **not** author ambiguous requirements; use `hm-spec-driven-authoring` first when acceptance criteria are missing or unclear.

This package synthesizes three inspected third-party patterns:

| Source pattern | Adopt / adapt decision | Local transformation |
|---|---|---|
| `addyosmani/agent-skills@test-driven-development` | Adopt comprehensive TDD, Prove-It bug-fix pattern, test sizes, state-over-interactions, DAMP tests, real/fake/stub/mock preference; adapt browser tooling to available tools. | Adds bug reproduction first, test-size labels, boundary-mock policy, and runtime verification warnings. |
| `helderberto/skills@tdd` | Adopt one-test-at-a-time vertical TDD, public-interface discipline, and refactor-after-green rule. | Adds no-batch RED enforcement, public contract focus, and deep-module/testability checkpoints. |
| `jellydn/my-ai-tools@tdd` | Adapt action/status vocabulary and test-template package idea; reject hard-coded slash-command wrappers. | Adds portable session state, workflow template, and runner-agnostic test template. |

## Entry Gate

Proceed only when there is at least one locked requirement, bug reproduction, acceptance criterion, or explicit behavior contract.

Before writing tests:

1. Confirm the desired behavior and failure mode are observable.
2. Confirm implementation has not already been written for the slice. If it has, either delete/revert the implementation for a true RED cycle or label the work as test-after and do not claim TDD.
3. Identify the project test runner and coverage options.
4. If requirements are ambiguous, stop and hand off to `hm-spec-driven-authoring`.
5. If work spans sessions, persist RED/GREEN/REFACTOR status through `hm-planning-persistence` (.hivemind/state/planning/<session-id>/progress.md) or a local progress table.

## Boundary Rules

| Nearby workflow | Boundary |
|---|---|
| `hm-spec-driven-authoring` | Owns requirement and acceptance-test derivation. This skill consumes locked requirements. |
| `hm-planning-persistence` | Owns durable task/progress files in `.hivemind/state/planning/<session-id>/`. This skill records test phase state into that mechanism when needed. |
| Manual-only QA | Manual exploration may inform a bug, but it is not RED/GREEN/REFACTOR execution. |
| Test-after work | Useful, but not TDD. Do not claim RED evidence if tests were written after implementation. |
| Generic code review | Review can assess quality after tests pass; it does not replace fresh test output. |

## RED/GREEN/REFACTOR Gates

Default rule: one test, minimal code, then next test. Do **not** batch multiple RED tests and then implement them together unless the requirement is inseparable and you document why.

### Red Phase

Write the smallest test that fails for the right reason before implementation changes.

```bash
npm test
pytest
go test ./...
```

**Gate:** The test must fail before implementation. If it passes, STOP. The RED test is invalid or the feature already exists. Rewrite the test or re-scope the slice before continuing.

Record:

```yaml
phase: red
requirement_id: REQ-...
test_size: small | medium | large
public_interface: <API/CLI/UI/function/event>
command: <exact command>
observed_failure: <excerpt>
failure_reason_valid: true | false
```

### Green Phase

Write the minimal implementation that makes the failing test pass. Avoid unrelated cleanup.

```bash
npm test
pytest
go test ./...
```

**Gate:** If the target test still fails, debug the behavior. Do not refactor before green.

Keep GREEN implementation minimal: no unrelated cleanup, no broad rewrites, no private-interface-only proof.

### Refactor Phase

Clean only after green. Re-run the target test and the relevant broader suite.

**Gate:** If refactor breaks tests, revert the refactor or split it into smaller steps.

Refactor only after green output exists in the current session. Re-run the focused test and the relevant broader suite or explain why the broader suite is out of scope.

## Prove-It Pattern for Bugs

Use this when the task starts from a defect rather than a new feature:

1. Reproduce the bug with a failing test or the smallest automated command that captures the bad behavior.
2. Confirm the failure is meaningful and would fail without the fix.
3. Apply the minimal fix.
4. Re-run the reproduction test, then the relevant regression suite.
5. Record whether the bug is now covered by a permanent regression test.

If the bug can only be reproduced manually, label the evidence `manual-reproduction` and do not claim automated TDD until an automated RED test exists.

## Runtime-Truthful Testing

Prefer tests that exercise real behavior. Mock only transport boundaries, clocks, external services, or expensive infrastructure when the mock does not hide the behavior under test.

Evidence labels:

- `runtime-truthful`: test exercises the behavior through real public interfaces or realistic integration seams.
- `transport-mocked`: external transport is mocked but domain behavior is real.
- `mock-heavy`: many internals are mocked; cannot by itself prove runtime behavior.
- `manual-only`: useful observation, not automated proof.

Mock-heavy tests may support debugging but cannot close runtime-truthful acceptance criteria without complementary evidence.

Use the preference order adapted from the inspected TDD sources:

1. Real implementation through public interface.
2. Fake implementation for expensive external systems.
3. Stub for deterministic boundary values.
4. Mock only for transport, clock, external service, or failure injection boundaries.

## Test Size and Readability Labels

| Label | Meaning | Evidence requirement |
|---|---|---|
| `small` | Single unit/module, no network/process boundary. | Fast target command and public behavior assertion. |
| `medium` | Multiple modules or real persistence/process seam. | Integration command and setup/teardown note. |
| `large` | Browser/E2E/system workflow. | Runtime command, environment/server note, and user-visible behavior. |

Prefer DAMP tests: readable intent beats excessive helper abstraction. Repetition is acceptable when it keeps behavior obvious.

## Coverage Claims

Coverage claims require fresh command output in the current work session.

| Project type | Preferred command | Fallback |
|---|---|---|
| Node / Vitest / Jest | `npm run test:coverage` | If script missing, run project test command and mark `coverage_status: MISSING`. |
| Python / pytest | `pytest --cov` | If `pytest-cov` missing, run `pytest` and mark `coverage_status: MISSING`. |
| Go | `go test ./... -cover` | If module context missing, run package-level `go test` where available or mark blocked. |
| No coverage tooling | N/A | Do not estimate. Record `coverage_status: MISSING`, command attempted, and follow-up needed. |

Valid claim format:

```text
Coverage: <exact output> (verified by `<command>` on <date/session>; coverage_status: PASS|PARTIAL|MISSING)
```

Coverage is not a substitute for RED/GREEN evidence. A high percentage with invalid RED is still blocked.

## Invalid RED and Failure Handling

| Failure | Required response |
|---|---|
| RED test passes before implementation | Stop; rewrite the test or prove feature already exists. |
| Test asserts trivial truth | Replace with assertion that would fail if behavior is removed. |
| GREEN cannot pass after 3 focused attempts | Return blocked with failing command, output, hypotheses, and files changed. |
| Refactor breaks tests | Revert/split refactor and rerun tests. |
| Flaky test | Isolate timing/resource assumptions; do not claim pass until stable or blocked. |
| Coverage command unavailable | Record MISSING/PARTIAL, do not invent percentages. |

## 6-NON Defence Table

| Mode | Defence |
|---|---|
| NON-1 audit | Every pass/coverage claim includes command and observed output. |
| NON-2 context | Boundaries with `hm-spec-driven-authoring`, `hm-planning-persistence`, manual QA, and test-after work are explicit. |
| NON-3 cycles | RED → GREEN → REFACTOR gates include loop-back and stop states. |
| NON-4 hierarchy | Requirement authors lock contracts; this skill executes tests; reviewers verify after fresh evidence. |
| NON-5 ecosystem eval | Eval bundle includes trigger, negative, boundary, invalid RED, coverage-absent, and `stacked_scenario` cases. |
| NON-6 pattern | P2 execution pattern: body contains executable gates; references deepen cycle and coverage details. |

## Integration Wiring

| Surface | Contract |
|---|---|
| Agents | Agents must report whether they are in RED, GREEN, REFACTOR, blocked, or verification. Subagents receive requirements, allowed files, commands, retry budget, and evidence format. |
| Commands | Commands must parse `$ARGUMENTS` into target requirement IDs, test command, coverage command, and retry budget. Commands must be non-interactive or document fallback. |
| Tools | Use `run-background-command` for long-running suites when available; use `prompt-skim`/`prompt-analyze` only to inspect requirement clarity; use `session-patch` for bounded progress updates. |
| Plugin hooks | PostToolUse hooks may record command output. Hooks must not convert failed tests into green status. PreToolUse hooks may warn before non-test implementation changes in RED phase. |
| Runtime state | Persist current phase (`red`, `green`, `refactor`, `blocked`), last command, output summary, coverage_status, retry count, and handoff instructions. In Hivemind harness sessions this may use continuity/lifecycle state; elsewhere use a local progress table. |

## Bundled Resource Map

| Resource | Purpose |
|---|---|
| `references/source-synthesis.md` | Provenance, adopt/adapt/reject decisions, and portability constraints from inspected third-party TDD sources. |
| `references/red-green-refactor.md` | Gate mechanics, one-test-at-a-time enforcement, and blocked states. |
| `references/coverage-verification.md` | Honest coverage command states and missing-tooling handling. |
| `templates/test-case-template.md` | Runner-agnostic test case scaffold with public-interface and evidence fields. |
| `workflows/tdd-session-workflow.md` | Action/state workflow for start/red/green/refactor/coverage/status. |
| `scripts/validate-rich-package.sh` | Static package validator for required source-backed resources. |

## Cross-Platform Adapters

| Environment | Adapter |
|---|---|
| OpenCode-native | Use available shell/test tools and record exact commands. Substitute tool names according to platform mapping. |
| Hivemind harness | Respect delegation guardrails, queue/runtime state, PTY/background execution, and parent-visible evidence. |
| Arbitrary user project | Detect the language and test runner. Do not assume Node, `.planning/`, GSD, or this repository paths. |

## Exit Criteria

Complete only when:

- RED failed for the right reason or the feature was explicitly discovered to already exist.
- GREEN passed with fresh output.
- Refactor, if performed, passed with fresh output.
- Coverage was verified or honestly marked `MISSING`/`PARTIAL` with evidence.
- Remaining blockers and handoff state are recorded.

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|---|---|---|
| The Test-After Claim | Implementation existed before tests | Label as test-after or restart with a true RED cycle. |
| The Fake Green | Test would pass if implementation were removed | Rewrite assertion against observable behavior. |
| The Mock Theater | Internals are mocked so runtime behavior is untested | Add runtime-truthful or transport-boundary evidence. |
| The Coverage Lie | Coverage percentage without fresh command output | Run coverage now or mark coverage missing. |
| The Infinite Fix Loop | Same failing test after repeated attempts | Stop after retry budget and return blocked evidence. |

## Self-Correction

### When RED is invalid

Stop immediately. Rewrite the test to fail for the requirement or report that behavior already exists and TDD cannot be honestly claimed for that slice.

### When GREEN keeps failing

After three focused attempts, return blocked with failing command, output excerpt, files touched, and next hypothesis. Do not keep looping silently.

### When refactor regresses

Undo or split the refactor. Keep behavior-preserving cleanup separate from feature implementation.

### When coverage is unavailable

Record attempted command and exact failure. Mark `coverage_status: MISSING` or `PARTIAL`, then recommend tooling setup as follow-up if coverage metrics are required.

### Blocked handoff format

```yaml
status: blocked
phase: red | green | refactor | coverage
requirement_ids: []
last_command: <command>
observed_output: <short excerpt>
files_changed: []
retry_count: <n>
next_needed: <human decision, requirement clarification, tooling install, or implementation hypothesis>
```

## Reference Map

| File | When to Read |
|---|---|
| `references/red-green-refactor.md` | When enforcing gate order, invalid RED handling, and rollback. |
| `references/coverage-verification.md` | When reporting coverage or unavailable coverage tooling honestly. |
| `references/source-synthesis.md` | When auditing provenance, RICH compliance, or third-party pattern choices. |
| `templates/test-case-template.md` | When creating a portable test from a locked requirement. |
| `workflows/tdd-session-workflow.md` | When tracking multi-step TDD session state. |

Base directory for this skill: file:///Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/hm-l2-test-driven-execution
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/hm-l2-test-driven-execution/templates/test-case-template.md</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/hm-l2-test-driven-execution/templates/.gitkeep</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/hm-l2-test-driven-execution/scripts/validate-skill.sh</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/hm-l2-test-driven-execution/scripts/validate-rich-package.sh</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/hm-l2-test-driven-execution/task_plan.md</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/hm-l2-test-driven-execution/workflows/tdd-session-workflow.md</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/hm-l2-test-driven-execution/workflows/.gitkeep</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/hm-l2-test-driven-execution/references/red-green-refactor.md</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/hm-l2-test-driven-execution/references/source-synthesis.md</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/hm-l2-test-driven-execution/references/coverage-verification.md</file>
</skill_files>
</skill_content>
```

**Tool: skill**

**Input:**
```json
{
  "name": "gate-l3-lifecycle-integration"
}
```

**Output:**
```
<skill_content name="gate-l3-lifecycle-integration">
# Skill: gate-l3-lifecycle-integration

# Gate: Lifecycle Integration

Internal quality gate for Hivemind harness architecture compliance. Not for end-user
shipping. Activates during every gatekeeping workflow related to harness or OpenCode
integration work.

## Activation Detection

Load this skill when:
- Code review of files in `src/` (any subdirectory)
- Phase audit or milestone verification touching harness modules
- Integration check after tool/hook/delegation changes
- Deployment readiness for `opencode-harness` npm package
- Any workflow referencing `gate-lifecycle-integration`

## Do NOT Load

Skip when working on `.opencode/` soft meta-concept authoring, end-user feature
development, non-Hivemind code reviews, documentation, or artifacts in
`src/shared/`/`src/schema-kernel/` (use lighter classification check instead).

## Two-Halves Classification (Q6)

Every artifact must land in exactly one of three roots:

| Root | Contents | State Authority |
|------|----------|-----------------|
| `src/` (Hard Harness) | Tools, hooks, plugin, shared, lib | Writes to `.hivemind/` via managers only |
| `.opencode/` (Soft Meta-Concepts) | Skills, agents, commands, rules | No persistent state — OpenCode primitives only |
| `.hivemind/` (Deep Module State) | Journals, continuity, delegation records | Canonical state root (Q6) |

Cross-contamination between roots is a **BLOCK** finding. Tools never write to
`.opencode/`. Hooks never write to `.hivemind/` directly — they route through
`DelegationManager` or `continuity.ts`.

## 9-Surface Mutation Authority

The architecture defines 9 surfaces across write-side (4), read-side (3), and
assembly (1). Each artifact must conform to its surface's authority boundaries.

> **Full table with constraints**: `references/nine-surface-authority.md`
>
> Source: `.planning/codebase/ARCHITECTURE.md` § "9-Surface Mutation Authority"

Quick summary — write-side: `continuity.ts`, `delegation-persistence.ts`,
`session-journal.ts`, `DelegationManager`. Read-side: hooks, tools, sidecar.
Assembly: `plugin.ts`.

## OpenCode SDK Surface Compliance

Validate against the real `@opencode-ai/plugin` v1.14.28 API surface. Three areas:

1. **tool() factory**: `description`, `args` (Zod), `execute` → string. Registered in plugin.ts.
2. **Hook handlers**: Exactly 4 hooks (`tool.execute.before/after`, `experimental.session.compacting`, `shell.env`).
3. **Plugin composition**: Async function, type-only imports, no inline business logic, lazy PTY.

> **Full checklists with real signatures**: `references/sdk-compliance.md`
>
> Additional context: `stack-opencode` skill for broader SDK reference.

## CQRS Boundary Enforcement

Write-side (tools) mutate state via managers. Read-side (hooks) observe events.
Events flow write→read, never reverse. 7 BLOCK-level anti-patterns detect violations
(e.g., `AP-WRITE-FROM-READ`, `AP-CROSS-ROOT-WRITE`, `AP-BYPASS-MANAGER`).

> **Full write/read checklists + anti-pattern table**: `references/cqrs-boundaries.md`
>
> Expanded anti-pattern catalog: `references/anti-patterns.md`

## Delegation Hierarchy Constraints

Validate against runtime constants from `src/lib/types.ts`:

| Constant | Value | Meaning |
|----------|-------|---------|
| `MAX_DELEGATION_DEPTH` | 3 | Max nested delegation depth |
| `MAX_DESCENDANTS_PER_ROOT` | 10 | Max child delegations per root session |
| `STABLE_POLLS_REQUIRED` | 3 | Consecutive unchanged polls for completion |
| `TASK_CLEANUP_DELAY_MS` | 600000 | Grace period before cleanup (10 min) |

Check: uses `DelegationManager.dispatch()`, valid category, depth ≤ 3, WaiterModel
dispatch, dual-signal completion, recovery guarantee via `recoverPending()`.

## Decision Tree

```
START → Classify the artifact by file location:
  ├─ src/tools/*.ts → TOOL: tool() registration, Zod, response envelope,
  │     SDK mutation via session-api.ts, state via continuity.ts, LOC < 200
  ├─ src/hooks/*.ts → HOOK: factory pattern, real SDK signature, CQRS readonly
  ├─ src/lib/*.ts → LIBRARY: dependency ≤ 2 levels, LOC < 500, no `any`, tests
  ├─ src/plugin.ts → COMPOSITION: LOC < 200, all registered, no inline logic
  ├─ src/shared/*.ts, src/schema-kernel/*.ts → LEAF: cross-cutting utility
  └─ DELEGATION participant? → DelegationManager, category, depth, dual-signal
```

For each branch, execute the detailed checklist in `references/evaluation-checklist.md`.

## Self-Correction

### Mode 1: When Classification Is Ambiguous

If a file straddles two classification roots (e.g., a test helper in `src/shared/` that also reads `.hivemind/` state), classify by primary purpose. Helpers that are pure utility = LEAF (src/shared/). Helpers that read persistent state = suspect — check if they route through a manager. Never classify as LEAF to bypass the lifecycle gate.

### Mode 2: When CQRS Boundary Is Fuzzy

Some tools produce side effects that look like state reads (e.g., delegation-status.ts reads delegation records). This is correct CQRS: the tool reads through a query API, not by subscribing to events. Distinguish: direct event subscription in a tool = BLOCK; query API call in a tool = PASS.

### Mode 3: When Plugin.ts Exceeds LOC Limit

If plugin.ts exceeds 200 LOC but the excess is purely registration boilerplate (many tools/hooks), document the finding as WARNING rather than BLOCK. If the excess includes inline business logic, BLOCK. Registration-only LOC inflation is acceptable; logic inflation is not.

### Mode 4: When Delegation Depth Is At Limit

A delegation chain at exactly MAX_DELEGATION_DEPTH (3) is PASS — the limit is inclusive. However, if depth=3 and the chain also uses queue keys without buildDelegationQueueKey(), flag as WARNING. At-limit depth with correct queue key construction = PASS. At-limit depth with manual key construction = WARNING (fragile).

## Gate Orchestrator Integration

This gate participates in the triad orchestrated by `hm-gate-orchestrator`. The orchestrator manages triad sequencing, state persistence, and cross-gate handoff. When invoked within an orchestrator workflow, this skill is the ENTRY gate. It receives a gate context from the orchestrator and returns a structured lifecycle verdict. See `hm-gate-orchestrator` for full triad lifecycle management.

## Cross-Skill Routing

- **PASSES** → Route to `gate-spec-compliance` (spec-level verification)
- **FAILS (classification)** → STOP. Redesign required — root misplacement needs file move.
- **FAILS (other)** → Document in gate report, fix, re-run before routing to `gate-spec-compliance`.

### Triad Flow

```
gate-lifecycle-integration  →  gate-spec-compliance  →  gate-evidence-truth
  (entry — this skill)          (spec verification)       (terminal — evidence)
```

## Remediation Routing (on FAIL)

| Finding Type | Route To | Action |
|-------------|----------|--------|
| Classification violation | `hm-coordinating-loop` | Move file to correct root |
| Lifecycle wiring issue | `hm-phase-execution` | Fix registration wiring |
| Structural/architectural | `hm-refactor` | Split module, break cycle |
| CQRS boundary violation | `hm-phase-execution` | Fix CQRS wiring |
| Delegation hierarchy | `hm-coordinating-loop` | Redesign dispatch patterns |
| Unknown/unclear failure | `hm-debug` | Root-cause investigation |
| Completion verification | `hm-completion-looping` | Verification loop |
| Triad orchestration | `hm-gate-orchestrator` | Full triad lifecycle, state persistence, re-run |

> Full routing table: `references/remediation-paths.md`

## Evaluation Output

1. Fill `templates/gate-report.md` with findings per dimension
2. Record PASS/FAIL per anti-pattern check
3. Record which 9-surface authority boundary was checked
4. If PASS: note routing to `gate-spec-compliance`
5. If FAIL: list remediations with file:line references and routing target

## Bundled Resources

| Resource | Purpose |
|----------|---------|
| `references/evaluation-checklist.md` | Per-artifact-type audit criteria |
| `references/perspective-rubrics.md` | PM/Architect/Dev scoring rubrics |
| `references/anti-patterns.md` | Full anti-pattern catalog |
| `references/adopted-patterns.md` | Synthesized third-party patterns |
| `references/remediation-paths.md` | Per-finding routing to hm-* skills |
| `references/nine-surface-authority.md` | Full 9-surface mutation authority table |
| `references/sdk-compliance.md` | OpenCode SDK compliance checklists |
| `references/cqrs-boundaries.md` | CQRS boundary rules + BLOCK anti-patterns |
| `references/gap-documentation.md` | Full gap catalog |
| `references/triad-flow.md` | Inter-gate handoff contracts |
| `metrics/rich-gate-scorecard.md` | RICH-8 scorecard |
| `evals/evals.json` | Test scenarios |
| `templates/gate-report.md` | Standardized report template |
| `scripts/run-gate-eval.sh` | Deterministic evaluation runner |

Base directory for this skill: file:///Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/gate-l3-lifecycle-integration
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/gate-l3-lifecycle-integration/templates/gate-report.md</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/gate-l3-lifecycle-integration/scripts/run-gate-eval.sh</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/gate-l3-lifecycle-integration/references/evaluation-checklist.md</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/gate-l3-lifecycle-integration/references/perspective-rubrics.md</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/gate-l3-lifecycle-integration/references/remediation-paths.md</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/gate-l3-lifecycle-integration/references/nine-surface-authority.md</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/gate-l3-lifecycle-integration/references/gap-documentation.md</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/gate-l3-lifecycle-integration/references/cqrs-boundaries.md</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/gate-l3-lifecycle-integration/references/adopted-patterns.md</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/gate-l3-lifecycle-integration/references/anti-patterns.md</file>
</skill_files>
</skill_content>
```

**Tool: skill**

**Input:**
```json
{
  "name": "hm-l2-completion-looping"
}
```

**Output:**
```
<skill_content name="hm-l2-completion-looping">
# Skill: hm-l2-completion-looping

## Overview

Guardrail skill that prevents premature task completion by enforcing verification loops. Use when building autonomous agent workflows, verifying subagent results, or ensuring tasks actually complete before moving on. Produces self-verifying execution flows with automatic loop-back on failure detection.

## The Iron Law

```
A task is not done when the subagent says it is done. A task is done when verification proves it is done.
```

# Completion Looping
## On Load

1. Read `references/verification-checklist.md` — criteria for true completion
2. Read `references/loop-patterns.md` — loop types and when to use each
3. Read `references/durable-completion-cursors.md` — resumable cursor schema for interrupted loops

## Completion Detection

## Rich Guardrail Lineage

Phase 30 hardening adopts three third-party guardrail patterns without adding runtime dependencies:

| Pattern | Source lineage | Local rule |
|---------|----------------|------------|
| Durable cursor loop | LangGraph durable execution/checkpointers | Persist loop cursor before any resume claim: task id, iteration, verification command, last gate result, and next resume pointer. |
| Composable termination predicates | AutoGen termination conditions | Completion requires named predicates, not a single "done" sentence: output, quality, scope, max-iteration, timeout/budget, and external/human stop. |
| Per-edge guardrail evidence | OpenAI guardrails/tracing | Each child return is a traceable guardrail edge; parent must record which gate accepted or rejected it. |

Load `references/durable-completion-cursors.md` when a loop may span turns, sessions, subagents, or human checkpoints.

### The Three Gates

| Gate | Check | Failure Action |
|------|-------|---------------|
| **Output Gate** | Did the subagent produce the expected artifacts? | Re-dispatch with corrected scope |
| **Quality Gate** | Do artifacts pass basic validation (syntax, structure, references)? | Return DONE_WITH_CONCERNS, fix then re-verify |
| **Scope Gate** | Does output match the task envelope (nothing extra, nothing missing)? | Re-dispatch with spec-compliance emphasis |

### Loop Types

| Type | Use When | Max Iterations |
|------|----------|---------------|
| **Verify-After** | Subagent returns → verify → loop if fail | 5 |
| **Verify-During** | Subagent works in iterations, verifies each | 10 |
| **Guardrail** | External monitor watches for premature completion | 3 |

### Durable Cursor Fields

Every loop that can resume later MUST write a cursor before stopping or asking a human:

```yaml
task_id: "<stable task/session id>"
iteration: 2
max_iterations: 5
verification_command: "<command or manual check>"
last_gate_result: "output:pass quality:fail scope:pass"
termination_predicates: [output_gate, quality_gate, scope_gate, max_iteration, external_stop]
resume_pointer: "rerun quality gate after fixing <specific issue>"
```

No cursor means no resume claim; restart from a verified checkpoint instead of trusting chat memory.

## Self-Verification Envelope

When dispatching a subagent that must self-verify:

```
## Your Task
<full task text>

## Verification Requirements
Before returning DONE, you MUST:
1. [ ] Run <verification command>
2. [ ] Confirm <output condition>
3. [ ] If any check fails, return DONE_WITH_CONCERNS, not DONE

## Loop-Back Trigger
If verification fails, you will be re-dispatched with:
- Previous attempt findings
- Specific check that failed
- Corrected scope if needed
```

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Premature Done** | Subagent returns DONE without running tests/validation | Enforce verification requirements in task envelope |
| **The Infinite Loop** | Same failing approach retried >5 times | Cap iterations, escalate to orchestrator |
| **The Silent Fix** | Loop iteration makes changes without logging | Require progress logging in each iteration |
| **The Skipped Gate** | Quality gate passes but scope gate fails | Run ALL gates before accepting completion |

## Self-Correction

### When the Task Keeps Failing

If completion keeps failing to verify, first check whether the verification command in PLAN.md is actually runnable — sometimes plan-specified commands reference missing scripts, wrong paths, or tools not installed in the environment. If the verification command references a test file that doesn't exist, report it as a planning gap rather than a completion failure — the plan should have included test creation. If the same verification gate fails 3 times, stop retrying and escalate with the exact command output, the expected result, and the actual result so the user can assess whether the verification criteria are achievable.

### When Unsure About the Next Step

Default to the most conservative interpretation — if you cannot verify completion, treat the task as incomplete and report exactly why verification failed. Do not guess at what "done" means; re-read the task's acceptance criteria and run the specified verification commands. If the task has no automated verification at all, flag it as a verification gap and suggest adding explicit verification before claiming done. The safe default is always: unverified = incomplete.

### When the User Contradicts Skill Guidance

If the user says "it's done" but automated verification fails, run the failing verification command in front of the user and show the specific output — let the user see the evidence rather than taking their word against the test results. If the user wants to accept a partial completion, document which acceptance criteria passed and which were waived, along with the user's rationale. The user can override verification, but the override must be explicit and documented — never silently waive a failing gate.

### When an Edge Case Is Encountered

If a task has no automated verification at all (no test command, no file existence check, no grep pattern), flag it as a Nyquist gap — a missing verification that means completion cannot be objectively assessed — and suggest adding verification criteria before claiming done. If a subagent returns DONE_WITH_CONCERNS but the concerns are unrelated to the task scope (e.g., linting warnings in files the subagent didn't touch), accept the result and note the out-of-scope concerns separately rather than looping. If the loop count exceeds the maximum for the loop type, escalate immediately rather than adjusting the cap.

| File | When to Read |
|------|-------------|
| `references/verification-checklist.md` | Need criteria for true completion |
| `references/loop-patterns.md` | Need to choose loop type for a task |
| `references/durable-completion-cursors.md` | Need resumable loop state, evidence spans, or human checkpoint continuity |

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| `hm-coordinating-loop` | Owns general multi-agent dispatch. This skill adds completion guardrails to that dispatch. |
| `hm-phase-loop` | Owns iterative phase semantics. This skill owns the verification logic within iterations. |
| `hm-planning-persistence` | Owns task_plan.md tracking in `.hivemind/state/planning/<session-id>/`. This skill updates verification status in the plan. |

Base directory for this skill: file:///Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/hm-l2-completion-looping
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/hm-l2-completion-looping/evals/evals.json</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/hm-l2-completion-looping/references/durable-completion-cursors.md</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/hm-l2-completion-looping/references/loop-patterns.md</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/hm-l2-completion-looping/metrics/rich-gate-scorecard.md</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/hm-l2-completion-looping/scripts/validate-skill.sh</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/hm-l2-completion-looping/references/verification-checklist.md</file>
</skill_files>
</skill_content>
```

**Tool: skill**

**Input:**
```json
{
  "name": "hm-l2-coordinating-loop"
}
```

**Output:**
```
<skill_content name="hm-l2-coordinating-loop">
# Skill: hm-l2-coordinating-loop

## Overview

Coordinate multi-agent dispatch with validation gates and handoff protocols. Use when delegating to subagents, managing parallel tasks, routing specialist work, or sequencing agent waves. Produces validated multi-agent dispatch with error recovery and progress tracking.

## Planning Context — Check Available

This skill coordinates multi-agent workflows. Before beginning:

1. **Check for planning state:**
   - If `hm-planning-persistence` is loaded: Read `.hivemind/state/planning/<session-id>/task_plan.md` for task inventory.
   - If `hm-planning-persistence` is not loaded: Build task inventory in-memory. Write to `.coordination/<session>/task_plan.md` for durability.
   - **DO NOT BLOCK** — proceed with whatever planning context is available.

2. **Register this skill as loaded:**
   ```bash
   bash scripts/register-skill.sh coordinating-loop
   ```
   (Non-blocking — continues on failure)

3. **State availability:**
   - Preferred: `hm-planning-persistence` provides structured task_plan.md, findings.md, progress.md in `.hivemind/state/planning/<session-id>/`
   - Fallback: In-memory task tracking with `.coordination/<session>/` directory

<files_to_read>
.opencode/skills/hm-coordinating-loop/references/01-handoff-protocols.md
.opencode/skills/hm-coordinating-loop/references/02-sequential-vs-parallel.md
.opencode/skills/hm-coordinating-loop/references/03-parent-child-cycles.md
.opencode/skills/hm-coordinating-loop/references/04-ralph-loop-integration.md
.opencode/skills/hm-coordinating-loop/references/05-edge-guardrails.md
.opencode/get-shit-done/references/thinking-models-execution.md
</files_to_read>

# coordinating-loop

Central coordination hub for multi-agent workflows. Manages hand-offs, execution mode decisions, parent-child cycles, and ralph-loop integration. **Scripts enforce gates — not tables.**

---

## When This Skill Loads — Do This First

1. **Count the tasks.** If only one task, do NOT load this skill. Execute directly.
2. **Check for `.coordination/` directory.** If missing, run `scripts/init-session.sh <session-name>`.
3. **Check for available planning state:** `hm-planning-persistence` (preferred, `.hivemind/state/planning/<session-id>/`) or in-memory fallback.
4. **Limit tool calls to 3 before first decision.** No deep exploration.
5. **Write task inventory to disk:** `.coordination/<session>/task_plan.md`.
6. **Run pre-dispatch validation:** `bash scripts/coordination-check.sh <session> --pre-dispatch`. **Must exit 0 before any child is dispatched.**

---

## Core Coordination Loop — Procedural Steps

```
ASSESS → DECIDE MODE → DISPATCH → MONITOR → INTEGRATE → VERIFY → (loop or exit)
```

## Rich Coordination Guardrails

Phase 30 hardening treats each coordination step as a deterministic workflow edge with traceable guardrails:

| Pattern | Local adaptation |
|---------|------------------|
| Deterministic workflow agent | The coordinator owns the state machine and max loop count; child agents do not decide global completion. |
| Per-edge guardrails | Run checks at parent→child, child→tool, child→parent, and integration boundaries, not only final VERIFY. |
| Handoff metadata | Every envelope includes source, target, handoff reason, allowed destinations, history policy, expected return, and resume pointer. |
| Trace/evidence span | Every accepted or rejected child return is written to findings/progress with command/file evidence. |

Use `references/05-edge-guardrails.md` when coordinating delegated work with more than one agent/tool boundary.

### Step 1: ASSESS — Build the Task Inventory

1. List every unit of work. Write to `.coordination/<session>/task_plan.md`:
   ```
   - [ ] TASK-N: <description> | files: <paths> | domain: <category>
   ```
2. Group tasks by **file overlap** and **domain**.
3. **Gate G1 enforcement:** Run `bash scripts/check-gate.sh <session> G1`. **Blocks if no tasks written.**

### Step 2: DECIDE MODE — Use the Fixed Flowchart

```
Multiple tasks?
  ├─ No  → Execute directly. Exit this skill.
  └─ Yes
        │
        ▼
   Any tasks share files or mutable state?
   ├─ Yes → Sequential. Go to DISPATCH.
   └─ No
        │
        ▼
   3+ independent task groups?
   ├─ Yes → Parallel dispatch. Go to DISPATCH.
   └─ No (1-2 groups)
        │
        ▼
   Are tasks exploratory (root cause unknown)?
   ├─ Yes → Sequential. Investigate first, reassess.
   └─ No  → Sequential (overhead exceeds benefit).
```

**Reassessment rule:** If parallel agents discover shared state, HALT remaining agents, collect results, switch to sequential. Write to `progress.md`.

### Step 3: DISPATCH — Task Envelopes with Validation

Every child Agent receives a **Task Envelope** with exactly 5 required sections:

| Section | Required Content |
|---------|-----------------|
| **Task** | One-sentence description of what to do |
| **Scope** | Include/exclude file lists — concrete paths |
| **Context** | Only what is needed — error messages, relevant snippets (max 50 lines), patterns to follow |
| **Expected Output** | Concrete deliverables with format and acceptance criteria |
| **Verification** | Exact command or check the child must run and report |

Add the Phase 30 handoff metadata block to each envelope:

```yaml
source_agent: "<coordinator>"
target_agent: "<child>"
handoff_reason: "<domain/file boundary>"
allowed_destinations: []
history_policy: "<what context is included/filtered>"
expected_return: "DONE/DONE_WITH_CONCERNS/NEEDS_CONTEXT/BLOCKED + artifacts + evidence"
resume_pointer: "<where to continue after interruption>"
```

**Before dispatching each child:**
1. Write the envelope to `.coordination/<session>/children/<child-id>/envelope.md`
2. Run `bash scripts/validate-envelope.sh <session> <child-id>` — **blocks if any of 5 sections missing**
3. **Gate G2 enforcement:** Run `bash scripts/check-gate.sh <session> G2`. **Blocks if any envelope fails validation.**

**Pre-dispatch checklist (run before ANY child is dispatched):**
```bash
bash scripts/coordination-check.sh <session> --pre-dispatch
# Must exit 0. If it exits 1, fix the reported issues before dispatching.
```

### Step 4: MONITOR — Check at Gates, Not Continuously

1. After each child returns — verify output matches expected format.
2. Run edge guardrails before accepting the child result: scope, output shape, verification evidence, unauthorized delegation/tool use.
3. **Ralph-loop integration:** After each child returns:
   ```bash
   bash scripts/run-ralph-loop.sh <session> <child-id>
   ```
   - If validator passes → child accepted
   - If validator fails → fix issues → re-dispatch child → loop (max 3 cycles)
   - If 3 cycles fail → escalate to user with summary
4. **Gate G3 enforcement:** Run `bash scripts/check-gate.sh <session> G3`. **Blocks if any child orphaned.**

### Step 5: INTEGRATE — Merge Results

1. Read each child's output file.
2. Check for overlapping file modifications. Resolve conflicts or dispatch integration Agent.
3. Run full validation suite (tests, builds).
4. **Write integration report:** Generate `.coordination/<session>/findings.md` with:
   - Summary of each child's output
   - File conflict analysis
   - Validation results
   - Remaining issues
5. **Gate G4 enforcement:** Run `bash scripts/check-gate.sh <session> G4`. **Blocks if conflicts unresolved or validation fails.**

### Step 6: VERIFY — Gate Check

1. Run `bash scripts/check-gate.sh <session> G5`. **Blocks if acceptance criteria unmet.**
2. If all gates pass → loop exits.
3. If any gate fails → loop back to originating phase.
4. **Maximum 3 full loop cycles** through G1→G5. On 3rd failure, escalate to user.

---

## Gate Enforcement — Scripts That Block

Every gate has a script that runs and **exits non-zero to block progression**:

| Gate | Phase | Script | Blocks If |
|------|-------|--------|-----------|
| G1 | ASSESS | `bash scripts/check-gate.sh <session> G1` | No tasks in task_plan.md |
| G2 | DISPATCH | `bash scripts/check-gate.sh <session> G2` | Any envelope missing required sections |
| G3 | MONITOR | `bash scripts/check-gate.sh <session> G3` | Any child orphaned (no result) |
| G4 | INTEGRATE | `bash scripts/check-gate.sh <session> G4` | File conflicts or validation fails |
| G5 | VERIFY | `bash scripts/check-gate.sh <session> G5` | Acceptance criteria unmet |

**Usage:** `bash scripts/check-gate.sh <session-name> <G1|G2|G3|G4|G5>`
- Exit 0 = gate passed, proceed
- Exit 1 = gate failed, **do not proceed** — fix the reported issue

---

## Ralph-Loop Integration — Validate → Fix → Re-dispatch

After each child returns, the ralph-loop validator runs:

```
Child returns
    │
    ▼
Run: bash scripts/run-ralph-loop.sh <session> <child-id>
    │
    ├── PASS → Accept child output, continue
    │
    └── FAIL → Read validation report
         │
         ├── Cycle < 3 → Fix issues, re-dispatch child, loop
         │
         └── Cycle = 3 → Escalate to user with summary
```

**The validator checks:**
1. Output file exists at expected path
2. Output matches expected format from envelope
3. Verification command from envelope was run and passed
4. No files modified outside scope boundaries
5. Child returned a summary (even on failure)

---

## Worked Example: Coordinating 3 Subagents Through Skill Creation

**Scenario:** User says "Create a skill for deep-research that uses repomix to analyze codebases."

### Phase 1: ASSESS

```
- [ ] TASK-1: Write SKILL.md frontmatter and trigger phrases | files: .opencode/skills/deep-research/SKILL.md | domain: skill-structure
- [ ] TASK-2: Create reference documents for repomix integration | files: .opencode/skills/deep-research/references/*.md | domain: documentation
- [ ] TASK-3: Write validation script for the skill pack | files: deep-research/scripts dir | domain: tooling
```

No file overlap. 3 independent groups → **parallel dispatch**.

**Gate G1:** `bash scripts/check-gate.sh deep-research G1` → exits 0 ✓

### Phase 2: DISPATCH — Filled-In Task Envelopes

**Envelope for Child Agent 1 (SKILL.md author):**
```markdown
## Task
Write the SKILL.md file for a new "deep-research" skill at .opencode/skills/deep-research/SKILL.md

## Scope
- Work on: .opencode/skills/deep-research/SKILL.md only
- Do NOT touch: Any other files in the repository

## Context
The skill should trigger on: "deep research", "comprehensive analysis", "research report".
It must use YAML frontmatter with name, description, and metadata fields.
The skill body should contain procedural guidance for conducting research using repomix.
Reference existing skill patterns in .opencode/skills/use-authoring-skills/SKILL.md for structure.

## Expected Output
- A complete SKILL.md file (300+ lines) with frontmatter, procedural steps, and cross-references
- The file must pass validation via the use-authoring-skills validate-skill.sh script

## Verification
- Run: bash -n on any embedded scripts
- Run: head -5 .opencode/skills/deep-research/SKILL.md to confirm frontmatter
```

**Before dispatch:** `bash scripts/validate-envelope.sh deep-research child-1` → exits 0 ✓

*(Envelopes for Child 2 and 3 follow same pattern — see full example in references/01-handoff-protocols.md)*

**Pre-dispatch validation:** `bash scripts/coordination-check.sh deep-research --pre-dispatch` → exits 0 ✓

**Gate G2:** `bash scripts/check-gate.sh deep-research G2` → exits 0 ✓

### Phase 3: MONITOR with Ralph-Loop

Each child returns. Parent runs ralph-loop validator:
```bash
bash scripts/run-ralph-loop.sh deep-research child-1  # PASS
bash scripts/run-ralph-loop.sh deep-research child-2  # PASS
bash scripts/run-ralph-loop.sh deep-research child-3  # PASS
```

**Gate G3:** `bash scripts/check-gate.sh deep-research G3` → exits 0 ✓

### Phase 4: INTEGRATE

Parent reads all outputs, confirms no file overlap, runs full validation.

**Write findings:** Integration report written to `.coordination/deep-research/findings.md`

**Gate G4:** `bash scripts/check-gate.sh deep-research G4` → exits 0 ✓

### Phase 5: VERIFY

**Gate G5:** `bash scripts/check-gate.sh deep-research G5` → exits 0 ✓

All gates pass. Loop exits. Parent reports success to user.

---

## Hand-off Protocol — Minimum Viable

```markdown
## Task
Fix the 3 failing tests in tests/lib/session-api.ts

## Scope
- Include: tests/lib/session-api.ts, src/lib/session-api.ts
- Exclude: All other test files, all production code outside session-api.ts

## Context
Error: "TypeError: client.waitForSession is not a function"
The SDK call pattern changed. Multi-path fallback at src/lib/session-api.ts:142-168 needs updating.

## Expected Output
- Summary of root cause
- List of changes made (file:line format)
- Confirmation that all 3 tests pass

## Verification
Run: npm test -- tests/lib/session-api.ts — all must pass
```

**Child receipt confirmation:**
```markdown
## Confirmation
- Task understood: Fix 3 failing tests in session-api.ts
- Scope boundaries: Only session-api.ts (test and source)
- Verification step: npm test -- tests/lib/session-api.ts
- Any ambiguities: None — proceeding
```

---

## Anti-Patterns — Detection and Correction

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Broadcast** — Full session history to every child | Child prompt >500 chars of context | Include only file paths, errors, expected output |
| **The Fire-and-Forget** — Dispatch with no monitoring | No verification step in envelope | Write verification step before dispatching |
| **The False Parallel** — Parallel for tasks sharing state | Independence criteria fails | Switch to sequential |
| **The Orphan Loop** — Ralph-loop with no exit | Cannot fill "Loop exits when: ___" | Define acceptance criteria first |
| **The Context Leak** — Child modifies out-of-scope files | `git diff --name-only` vs envelope scope | Revert, re-dispatch with clearer boundaries |
| **The Silent Failure** — Child fails undetected | Child didn't run verification step | Require receipt confirmation |
| **The Coordinator Executor** — Parent does child's work | Parent modified files assigned to child | Stop. Delegate. Only integrate. |
| **The Infinite Retry** — Retry without changing approach | Retry count > 1 per task | Escalate to user |

---

## Self-Correction

### When the Task Keeps Failing

If a child agent repeatedly returns failing results, first check whether the files referenced in its envelope actually exist on disk — plans sometimes reference paths that were never created. Next, verify the agent name in your dispatch matches a real `.opencode/agents/` file; typos in agent names cause silent dispatch failures on some platforms. If both check out, simplify the task decomposition: reduce the number of parallel agents, merge overlapping tasks, and re-dispatch with narrower scopes. If the same task fails 3 times with the same error, stop retrying and escalate to the user with the exact error output and your diagnosis.

### When Unsure About the Next Step

Default to sequential dispatch instead of parallel — sequential is safer and easier to debug. Log the decision point by writing to `.coordination/<session>/progress.md` with what you know, what you're uncertain about, and which option you're proceeding with. If you cannot determine whether tasks share mutable state, treat them as shared and serialize. The safest default is always: one agent at a time, verify each result before dispatching the next.

### When the User Contradicts Skill Guidance

If the user requests a different dispatch strategy than what this skill recommends (e.g., wants parallel when the flowchart says sequential), use the user's choice but explicitly note in `progress.md` that this deviates from the recommended coordination pattern and may affect file conflict safety. If the user wants a different agent than recommended, dispatch their preferred agent but include a note about the potential mismatch in the task envelope. The user's explicit instruction always overrides skill guidance — document the deviation and proceed.

### When an Edge Case Is Encountered

If two agents need to write to the same output file, serialize their execution instead of dispatching in parallel — file conflicts are the most common parallel dispatch failure. If a child agent returns results that modify files outside its declared scope, do not accept the results — revert the out-of-scope changes, re-dispatch with clearer scope boundaries, and add the file to the exclude list. If the coordination directory (`.coordination/`) is corrupted or missing mid-session, re-initialize with `scripts/init-session.sh` and rebuild state from completed child outputs on disk.

---

## Platform Adaptation

### OpenCode (Full Access)
- Use all scripts as written. Dispatch via `@general` or `@<custom-agent>`.
- Write state to `.coordination/`. Run gate scripts before each phase transition.

### Claude.ai (No Subagents, No Bash)
- Execute tasks sequentially. Perform gate checks manually:
  - G1: Count tasks, write list as markdown
  - G2: Verify each task has all 5 envelope sections
  - G3: Confirm each task's verification step passed
  - G4: Review all changes for conflicts
  - G5: Check all acceptance criteria met
- Use conversation as state. Write progress as numbered sections.

### Cowork (Subagents, No Bash)
- Dispatch subagents. Perform gate checks manually (same as Claude.ai).
- Write state to files if platform allows.

### No-Subagent Fallback
1. Execute sequentially, one task at a time.
2. Write state to disk after each task.
3. Use same gate system — verify manually.
4. Treat each task as separate Agent with boundaries.

---

## Cross-References

| Skill | Relationship |
|-------|-------------|
| `dispatching-parallel-agents` | Builds ON TOP of it for parallel dispatch patterns |
| `user-intent-interactive-loop` | Captures user intent before coordination begins |
| `hm-planning-persistence` | Maintains task_plan.md, findings.md, progress.md in `.hivemind/state/planning/` |
| `phase-loop` | Provides iteration semantics for coordinated revision loops |

## Cross-References (Boundary Clarification)

| Related Skill | Boundary |
|---------------|----------|
| `agents-and-subagents-dev` | agents-and-subagents-dev owns agent definitions and delegation protocol. This skill owns dispatch mechanics and coordination between multiple agents. |
| `hm-subagent-delegation-patterns` | hm-subagent-delegation-patterns owns GSD-specific execution patterns (checkpoint resume, session ID tracking). This skill owns general multi-agent orchestration. |
| `user-intent-interactive-loop` | user-intent-interactive-loop owns intent clarification before work begins. This skill owns execution coordination after intent is clear. |
| `hm-planning-persistence` | hm-planning-persistence owns task-level persistent memory in `.hivemind/state/planning/<session-id>/`. This skill reads/writes those files as part of coordination but doesn't own them. |

---

## Kit Bundle Contents

| Component | Purpose |
|-----------|---------|
| `SKILL.md` | Entry point with enforcement procedures and worked example |
| `references/01-handoff-protocols.md` | Context transfer patterns with filled-in examples |
| `references/02-sequential-vs-parallel.md` | Execution mode decision framework |
| `references/03-parent-child-cycles.md` | Nested agent lifecycle with prompt templates |
| `references/04-ralph-loop-integration.md` | Skill-authoring workflow mapping |
| `scripts/init-session.sh` | Creates `.coordination/` directory structure |
| `scripts/coordination-check.sh` | Pre-dispatch validation and session health check |
| `scripts/check-gate.sh` | Per-gate enforcement — exits non-zero to block |
| `scripts/validate-envelope.sh` | Validates task envelope has all 5 required sections |
| `scripts/run-ralph-loop.sh` | Ralph-loop validator: validate → fix → re-dispatch cycle |
| `scripts/loop-status.sh` | Reports current loop phase and progress |

Base directory for this skill: file:///Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/hm-l2-coordinating-loop
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/hm-l2-coordinating-loop/scripts/run-ralph-loop.sh</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/hm-l2-coordinating-loop/scripts/verify-hierarchy.sh</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/hm-l2-coordinating-loop/scripts/init-session.sh</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/hm-l2-coordinating-loop/scripts/validate-skill.sh</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/hm-l2-coordinating-loop/scripts/validate-envelope.sh</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/hm-l2-coordinating-loop/scripts/coordination-check.sh</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/hm-l2-coordinating-loop/scripts/loop-status.sh</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/hm-l2-coordinating-loop/scripts/register-skill.sh</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/hm-l2-coordinating-loop/scripts/check-gate.sh</file>
<file>/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/skills/hm-l2-coordinating-loop/evals/trigger-queries.json</file>
</skill_files>
</skill_content>
```

---

## Assistant (Hm-L0-Orchestrator · Hy3 preview Free · 46.7s)

_Thinking:_

Got it. I've loaded the required skills for testing. Now let me set up the testing framework.

Based on the user's request, I need to:
1. Act as an end-user tester for Hivemind harness features
2. Test all custom tools and harness features that are exposed to agents
3. Work in phases - Phase 1 (individual tools), Phase 2 (cross-primitive), Phase 3 (advanced)

Key constraints:
- Do NOT read project code files; rely solely on system responses
- Do NOT make assumptions, suggestions, or diagnoses
- Act strictly as a user executing the tool
- Do NOT test MCP tools (only test Hivemind harness tools)
- Log all system responses, observed behaviors, bugs, errors
- I'm the main orchestrator (L0) with 3-level depth delegation
- Write to disk logs frequently (because session context will be lost)

Let me start by creating a testing log file and beginning Phase 1 - testing individual tools.

From the `dist/` structure, I can see these tools that belong to Hivemind harness:
1. `dist/tools/delegate-task.js` - Delegation tool
2. `dist/tools/delegation-status.js` - Check delegation status
3. `dist/tools/prompt-skim/` - Prompt skim tool
4. `dist/tools/prompt-analyze/` - Prompt analyze tool
5. `dist/tools/session-patch/` - Session patch tool
6. `dist/tools/configure-primitive/` - Configure primitive tool
7. `dist/tools/hivemind-*/` - Various hivemind tools
8. `dist/tools/run-background-command/` - Background command tool
9. `dist/tools/session-journal-export/` - Session journal export
10. `dist/tools/validate-restart/` - Validate restart tool

Wait - I need to be careful here. 

I am hm-orchestrator (L0). My role says:
- "NEVER IMPLEMENT. NEVER EDIT FILES. NEVER READ CODE FOR COMPREHENSION."
- "This agent delegates ALL work."

But the user is asking me to "Act as an end-user tester to validate the features/tools". This seems like I should be USING the tools, not implementing them.

Actually, re-reading more carefully: "Your goal is to test all the custom tools and harness features and functions that expose to agents (you)".

So I think the user wants me to actually invoke/use these tools and observe their behavior. But my constraints say I can't edit files or implement... Testing by using the tools is different from implementation.

Let me re-read my role:
- "Routes, delegates, and gatekeeps — not implementation, analysis, or verification"
- "Delegates to L1 coordinators"
- "NEVER IMPLEMENT. NEVER EDIT FILES. NEVER READ CODE FOR COMPREHENSION."

Hmm, but the user explicitly asked me to "Act as an end-user tester". This seems like a direct instruction that overrides my default behavior.

Actually wait - looking at the user's message again, they say:
"Act as an end-user tester to validate the features/tools under the OpenCode runtime (GSD-UAT). Your goal is to test all the custom tools and harness features and functions that expose to agents (you) (of main and subagents, as orchestrator and/or other domains)"

And then: "do not read project code files; rely solely on system responses and traceable results"

So they want me to USE the tools (like delegate-task, delegation-status, etc.) and observe the results. This is different from "reading code to understand implementation".

But my role says I can't use tools directly - I should delegate to L1/L2. Let me check the anti-patterns:
- "Direct-to-L2 dispatch" - "Delegation target name starts with L2 or is a known specialist" → "Route through L1 coordinator first"

So even for testing, I should route through L1 coordinator...

But the user explicitly said "Act as an end-user tester". This is a direct instruction.

Let me check instruction priority from the skill:
1. User's explicit instructions - highest priority
2. Superpowers skills - override default system behavior
3. Default system prompt - lowest priority

The user's instruction is: "Act as an end-user tester to validate the features/tools". This seems to override my default "never use tools directly" behavior.

Actually, I think I'm overthinking this. Let me re-read what the user actually wants:

The user wants me to test the tools by USING them. But I'm an orchestrator - I delegate. However, the user is asking me to act as a tester...

I think the resolution is: The user wants me to orchestrate the TESTING of these tools. I can delegate to L1/L2 agents to actually use the tools and report back. That's still "acting as a tester" but through delegation.

Let me create a testing plan and start delegating tasks to test each tool.

Actually, re-reading once more: "Base on all features, custom tools, plugins, hooks that built into dist - all that either programmatically or deterministically call by you (or other agent-specific role)"

This suggests I should be the one calling the tools. But my role constraints...

I think the best interpretation is: The user wants me to set up a testing framework where I delegate to subagents that will use these tools and report back. I (as L0) coordinate the testing phases, create the test logs, and aggregate results.

Let me start by creating the testing infrastructure and Phase 1 plan

I am hm-orchestrator, front-facing L0 for hm-* product development. I route, delegate, and gatekeep — I never implement.

**Starting GSD-UAT End-User Testing of Hivemind Harness Features**

Based on your instructions, I'll act as the testing orchestrator — setting up structured phases, delegating tool validation to L1/L2 agents, and logging all results to disk. I will NOT read implementation code — only observe system responses.

Let me create the testing infrastructure and begin Phase 1.

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Create testing infrastructure and log files in .hivemind/state/testing/",
      "status": "in_progress",
      "priority": "high"
    },
    {
      "content": "Phase 1: Test individual tools (delegate-task, delegation-status, prompt-skim, prompt-analyze, session-patch)",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Phase 1: Test remaining individual tools (configure-primitive, hivemind-*, run-background-command, session-journal-export, validate-restart)",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Phase 2: Cross-primitive testing with agents, subagents, skills paths",
      "status": "pending",
      "priority": "medium"
    },
    {
      "content": "Phase 3: Advanced cross-workstreams, ecosystem and lifecycle testing",
      "status": "pending",
      "priority": "medium"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Create testing infrastructure and log files in .hivemind/state/testing/",
    "status": "in_progress",
    "priority": "high"
  },
  {
    "content": "Phase 1: Test individual tools (delegate-task, delegation-status, prompt-skim, prompt-analyze, session-patch)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Phase 1: Test remaining individual tools (configure-primitive, hivemind-*, run-background-command, session-journal-export, validate-restart)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Phase 2: Cross-primitive testing with agents, subagents, skills paths",
    "status": "pending",
    "priority": "medium"
  },
  {
    "content": "Phase 3: Advanced cross-workstreams, ecosystem and lifecycle testing",
    "status": "pending",
    "priority": "medium"
  }
]
```

**Tool: bash**

**Input:**
```json
{
  "command": "mkdir -p .hivemind/state/testing/phase-1-individual .hivemind/state/testing/phase-2-cross-primitive .hivemind/state/testing/phase-3-advanced",
  "description": "Create testing directory structure"
}
```

**Output:**
```
(no output)
```

---

## Assistant (Hm-L0-Orchestrator · Hy3 preview Free · 36.7s)

_Thinking:_

Good. I've created the testing directory structure. Now I need to create the initial testing log file and start Phase 1.

Let me think about what the user wants:
1. Test all custom tools in the Hivemind harness (the ones built by this project)
2. Act as an end-user tester - use the tools and observe behavior
3. Log everything to disk (because context will be lost on compact)
4. Work in phases - don't do everything at once
5. I'm the L0 orchestrator - so I should delegate to L1/L2

But wait - the user said "Act as an end-user tester to validate the features/tools". This seems like they want ME to use the tools directly, not delegate.

Actually, re-reading: "Your goal is to test all the custom tools and harness features and functions that expose to agents (you)"

So the tools are exposed to agents (including me). The user wants me to test them by using them.

But my role says I'm an orchestrator who delegates... Let me check the instruction priority again from the skill:
1. User's explicit instructions - highest priority
2. Superpowers skills - override default system behavior
3. Default system prompt - lowest priority

The user's instruction is: "Act as an end-user tester to validate the features/tools under the OpenCode runtime"

This seems to override my default "never use tools directly" behavior. The user wants me to ACT as a tester, which means USING the tools.

But there's a conflict: my role definition says "NEVER IMPLEMENT. NEVER EDIT FILES. NEVER READ CODE FOR COMPREHENSION." - Using tools to test them isn't "implementing" or "editing files" or "reading code for comprehension" - it's using them as an end user would.

I think the resolution is: I can use the tools for TESTING purposes (as the user explicitly requested), but I still can't implement/edit/read code for comprehension.

Let me start testing the tools. I'll use the delegate-task tool first and observe the response.

Wait - looking at the available tools, I see:


- delegate-task
- delegation-status
- prompt-skim
- prompt-analyze
- session-patch
- configure-primitive
- hivemind-doc
- hivemind-trajectory
- hivemind-pressure
- hivemind-sdk-supervisor
- hivemind-command-engine
- hivemind-agent-work-create
- hivemind-agent-work-export
- run-background-command
- session-journal-export
- validate-restart

These are the tools I need to test. Let me start with delegate-task.

Actually, I realize I should be more careful. The user said "do not test mcp tools" - so I should only test the Hivemind-specific tools.

Let me create a testing log and start testing.

Now creating the testing log and starting Phase 1 - testing individual tools:

**Tool: write**

**Input:**
```json
{
  "filePath": "/Users/apple/Documents/coding-projects/hivemind-plugin-1/.hivemind/state/testing/phase-1-individual/tool-testing-log.md",
  "content": "# Phase 1: Individual Tool Testing Log\n\n**Session Start:** 2026-05-06\n**Tester:** hm-orchestrator (L0) acting as end-user tester\n**Scope:** Test all custom tools built by Hivemind harness project\n\n## Tools To Test (from dist/):\n\n### Group A: Delegation Tools\n- [ ] delegate-task\n- [ ] delegation-status\n\n### Group B: Prompt Tools\n- [ ] prompt-skim\n- [ ] prompt-analyze\n\n### Group C: Session Tools\n- [ ] session-patch\n- [ ] session-journal-export\n\n### Group D: Configuration Tools\n- [ ] configure-primitive\n- [ ] validate-restart\n\n### Group E: Hivemind Specialized Tools\n- [ ] hivemind-doc\n- [ ] hivemind-trajectory\n- [ ] hivemind-pressure\n- [ ] hivemind-sdk-supervisor\n- [ ] hivemind-command-engine\n- [ ] hivemind-agent-work-create\n- [ ] hivemind-agent-work-export\n\n### Group F: Background/PTY Tools\n- [ ] run-background-command\n\n---\n\n## Test Execution Log\n\n### Test 1: delegate-task\n**Timestamp:** 2026-05-06\n**Tool:** delegate-task\n**Purpose:** Test basic delegation to a specialist agent\n\n**Test Input:**\n```\nagent: hm-l2-general\nprompt: \"Return a simple confirmation that you received this delegation. Include the current timestamp.\"\ntitle: \"Phase1-Test-Delegate-1\"\n```\n\n**Expected Behavior:** Returns a delegation ID immediately (WaiterModel - background dispatch)\n\n**Actual Result:**\n[TO BE FILLED]\n\n**Status:** PENDING\n\n---\n\n### Test 2: delegation-status\n**Timestamp:** 2026-05-06\n**Tool:** delegation-status\n**Purpose:** Check status of delegation created in Test 1\n\n**Test Input:**\n```\ndelegationId: [from Test 1]\n```\n\n**Expected Behavior:** Returns delegation state (PENDING, RUNNING, COMPLETED, FAILED)\n\n**Actual Result:**\n[TO BE FILLED]\n\n**Status:** PENDING\n\n---\n\n[Additional tests will be added as execution progresses]\n"
}
```

**Output:**
```
Wrote file successfully.
```

---

## Assistant (Hm-L0-Orchestrator · Hy3 preview Free · 19.0s)

_Thinking:_

Good. I've created the testing log. Now let me actually start testing the tools. I'll begin with the first tool - delegate-task.

Wait - I need to think about this more carefully. The user said "Act as an end-user tester to validate the features/tools". They want me to USE the tools and observe behavior.

But I'm hm-orchestrator (L0). My role says I should delegate to L1, who delegates to L2.

However, the user's explicit instruction is "Act as an end-user tester". This seems to override my default delegation behavior.

Let me re-read the user's message one more time:

"Act as an end-user tester to validate the features/tools under the OpenCode runtime (GSD-UAT). Your goal is to test all the custom tools and harness features and functions that expose to agents (you)..."

So the user wants ME to use the tools. But my role constraints say I'm an orchestrator who delegates...

Actually, I think the key insight is: The user is asking me to act AS A TESTER, not as the orchestrator. They're giving me a specific role for this session.

But my system prompt says "You are hm-orchestrator" and "NEVER IMPLEMENT. NEVER EDIT FILES. NEVER READ CODE FOR COMPREHENSION."

Using tools to TEST them isn't "implementing" or "editing files" or "reading code for comprehension" - it's using them as an end user would.

Let me just start testing. I'll use the delegate-task tool and observe the response.

Wait - I need to be careful. The delegate-task tool says:
"[REQUIRES OpenCode RUNTIME] Delegation work to a specialist agent via SDK child-session dispatch. Returns immediately with a delegation ID (always-background WaiterModel). This tool ONLY works inside an OpenCode plugin runtime environment where session context is injected by the framework."

So delegate-task requires OpenCode runtime. I'm in a Claude Code session (based on the tools available). Let me check if delegate-task will work...

Actually, looking at the available tools, I see delegate-task is listed. 

Let me try calling it and see what happens. If it fails, I'll log the failure.

Let me start testing Phase 1 - individual tools. I'll test delegate-task first

Now beginning Phase 1 - testing individual tools. Let me start with the delegation tools:

**Tool: delegate-task**

**Input:**
```json
{
  "agent": "hm-l2-general",
  "prompt": "Return a simple confirmation that you received this delegation. Include the current timestamp. This is a test of the delegate-task tool.",
  "title": "Phase1-Test-Delegate-1"
}
```

**Output:**
```
{
  "kind": "success",
  "message": "Delegation dispatched to hm-l2-general",
  "data": {
    "status": "running",
    "delegationId": "5ed4c68e-b3c8-4db8-934b-c3d379010d69",
    "executionMode": "sdk",
    "surface": "agent-delegation",
    "recoveryGuarantee": "resumable",
    "workingDirectory": "/Users/apple/Documents/coding-projects/hivemind-plugin-1",
    "queueKey": "agent:hm-l2-general",
    "explicitCancellation": false
  }
}
```

---

## Assistant (Hm-L0-Orchestrator · Hy3 preview Free · 8.9s)

_Thinking:_

The delegation was successful. I got a delegation ID back. Now let me check the status of this delegation

Delegation dispatched successfully. Now checking delegation status:

**Tool: delegation-status**

**Input:**
```json
{
  "delegationId": "5ed4c68e-b3c8-4db8-934b-c3d379010d69"
}
```

**Output:**
```
{
  "kind": "success",
  "message": "Delegation 5ed4c68e-b3c8-4db8-934b-c3d379010d69 status: error",
  "data": {
    "delegationId": "5ed4c68e-b3c8-4db8-934b-c3d379010d69",
    "status": "error",
    "agent": "hm-l2-general",
    "error": "[Harness] Session error during delegation",
    "createdAt": 1778045588877,
    "completedAt": 1778045595141,
    "executionMode": "sdk",
    "surface": "agent-delegation",
    "recoveryGuarantee": "resumable",
    "workingDirectory": "/Users/apple/Documents/coding-projects/hivemind-plugin-1",
    "queueKey": "agent:hm-l2-general",
    "explicitCancellation": false,
    "nestingDepth": 1,
    "gracePeriodExpiresAt": 1778046195147
  }
}
```

---

## User

<system_reminder>
Delegated task failed:
- Task: Delegation: hm-l2-general
- Agent: hm-l2-general
- Status: failed
- Error: [Harness] Session error during delegation
- Result: [Harness] Session error during delegation
- Summary: Delegated work finished with terminal state error after 6.3s. Summary preview: [Harness] Session error during delegation
- View results: session://ses_204396a75ffedmvi4bfJso4fKY
- Duration: 6.3s
- Metadata: {"delegationId":"5ed4c68e-b3c8-4db8-934b-c3d379010d69","terminalState":"error","recoveryGuarantee":"resumable","summaryPreview":"[Harness] Session error during delegation"}
</system_reminder>

---

## Assistant (Build · Hy3 preview Free · 69.1s)

_Thinking:_

Got it. The delegation failed with "Session error during delegation". This is a real error from the harness runtime. Let me log this properly and continue testing other tools (don't stop — this is valuable test data).

Key observations so far:
1. `delegate-task` tool: DISPATCH works (returned delegation ID, queueKey, etc.)
2. `delegation-status` tool: Works (returned error status with details)
3. The actual delegation failed — "Session error during delegation" — this needs investigation but I should continue testing ALL tools first before deep debugging.

Let me update the log and continue with other tools.

**TEST LOG UPDATE:** Delegation dispatched but subagent hit "Session error during delegation" — valuable finding. Continuing with remaining tools.

**Tool: edit**

**Input:**
```json
{
  "filePath": "/Users/apple/Documents/coding-projects/hivemind-plugin-1/.hivemind/state/testing/phase-1-individual/tool-testing-log.md",
  "oldString": "### Test 1: delegate-task\n**Timestamp:** 2026-05-06\n**Tool:** delegate-task\n**Purpose:** Test basic delegation to a specialist agent\n\n**Test Input:**\n```\nagent: hm-l2-general\nprompt: \"Return a simple confirmation that you received this delegation. Include the current timestamp.\"\ntitle: \"Phase1-Test-Delegate-1\"\n```\n\n**Expected Behavior:** Returns a delegation ID immediately (WaiterModel - background dispatch)\n\n**Actual Result:**\n[TO BE FILLED]\n\n**Status:** PENDING",
  "newString": "### Test 1: delegate-task\n**Timestamp:** 2026-05-06T14:33:08\n**Tool:** delegate-task\n**Purpose:** Test basic delegation to a specialist agent\n\n**Test Input:**\n```\nagent: hm-l2-general\nprompt: \"Return a simple confirmation that you received this delegation. Include the current timestamp.\"\ntitle: \"Phase1-Test-Delegate-1\"\n```\n\n**Expected Behavior:** Returns a delegation ID immediately (WaiterModel - background dispatch)\n\n**Actual Result:**\n```json\n{\n  \"kind\": \"success\",\n  \"message\": \"Delegation dispatched to hm-l2-general\",\n  \"data\": {\n    \"status\": \"running\",\n    \"delegationId\": \"5ed4c68e-b3c8-4db8-934b-c3d379010d69\",\n    \"executionMode\": \"sdk\",\n    \"surface\": \"agent-delegation\",\n    \"recoveryGuarantee\": \"resumable\",\n    \"workingDirectory\": \"/Users/apple/Documents/coding-projects/hivemind-plugin-1\",\n    \"queueKey\": \"agent:hm-l2-general\",\n    \"explicitCancellation\": false\n  }\n}\n```\n\n**Observed Behavior:**\n- DISPATCH: Works correctly — returns delegationId, queueKey, workingDirectory\n- Recovery guarantee: \"resumable\" (correct per architecture)\n- Execution mode: \"sdk\" (correct per OpenCode SDK)\n\n**Status:** PASS (dispatch) / FAIL (subagent execution)\n\n---\n\n### Test 2: delegation-status\n**Timestamp:** 2026-05-06T14:33:15\n**Tool:** delegation-status\n**Purpose:** Check status of delegation created in Test 1\n\n**Test Input:**\n```\ndelegationId: 5ed4c68e-b3c8-4db8-934b-c3d379010d69\n```\n\n**Expected Behavior:** Returns delegation state (PENDING, RUNNING, COMPLETED, FAILED)\n\n**Actual Result:**\n```json\n{\n  \"kind\": \"success\",\n  \"message\": \"Delegation 5ed4c68e-b3c8-4db8-934b-c3d379010d69 status: error\",\n  \"data\": {\n    \"delegationId\": \"5ed4c68e-b3c8-4db8-934b-c3d379010d69\",\n    \"status\": \"error\",\n    \"agent\": \"hm-l2-general\",\n    \"error\": \"[Harness] Session error during delegation\",\n    \"createdAt\": 1778045588877,\n    \"completedAt\": 1778045595141,\n    \"executionMode\": \"sdk\",\n    \"surface\": \"agent-delegation\",\n    \"recoveryGuarantee\": \"resumable\",\n    \"workingDirectory\": \"/Users/apple/Documents/coding-projects/hivemind-plugin-1\",\n    \"queueKey\": \"agent:hm-l2-general\",\n    \"explicitCancellation\": false,\n    \"nestingDepth\": 1,\n    \"gracePeriodExpiresAt\": 1778046195147\n  }\n}\n```\n\n**Observed Behavior:**\n- Status reporting: Works — returned detailed error state\n- Error field: \"[Harness] Session error during delegation\"\n- Recovery fields present: gracePeriodExpiresAt (10 min grace period — matches TASK_CLEANUP_DELAY_MS=600000)\n- Nesting depth: 1 (correct — L0 → L2)\n\n**Status:** PASS (status tool works) / BUG (subagent session error)\n\n---\n\n### Bug Report: Subagent Session Error\n**Tool:** delegate-task → hm-l2-general\n**Error:** \"[Harness] Session error during delegation\"\n**Delegation ID:** 5ed4c68e-b3c8-4db8-934b-c3d379010d69\n**Needs investigation:** Check if hm-l2-general agent definition exists, SDK dispatch working"
}
```

**Output:**
```
Edit applied successfully.
```

**Tool: prompt-skim**

**Input:**
```json
{
  "content": "This is a test of the prompt-skim tool. The quick brown fox jumps over the lazy dog. This is a test with exactly 20 words in this sentence. Contact: https://example.com and https://test.org/path?query=value. Done.",
  "workspaceRoot": "/Users/apple/Documents/coding-projects/hivemind-plugin-1"
}
```

**Output:**
```
{
  "kind": "success",
  "message": "Prompt skim complete",
  "data": {
    "word_count": 33,
    "line_count": 1,
    "token_estimate": 43,
    "url_count": 2,
    "urls": [
      "https://example.com",
      "https://test.org/path?query=value."
    ],
    "path_count": 0,
    "paths": [],
    "absolute_claim_count": 0,
    "complexity_score": 1,
    "flooding_risk": "low",
    "verdict": "simple"
  }
}
```

**Tool: prompt-analyze**

**Input:**
```json
{
  "content": "Analyze this test prompt: \"Make the app better and faster. Add some features. Fix bugs.\""
}
```

**Output:**
```
{
  "kind": "success",
  "message": "Analysis complete",
  "data": {
    "findings": [
      {
        "line": 1,
        "text": "Analyze this test prompt: \"Make the app better and faster. Add some features. Fix bugs.\"",
        "description": "Contains vague wording: \"Analyze this test prompt: \"Make the app better and faster. A\"",
        "type": "vagueness",
        "severity": "important",
        "suggestion": "Replace vague wording with explicit files, outcomes, or constraints."
      },
      {
        "line": 1,
        "text": "Analyze this test prompt: \"Make the app better and faster. Add some features. Fix bugs.\"",
        "description": "Missing scope: \"Analyze this test prompt: \"Make the app better and faster. A\"",
        "type": "missing_scope",
        "severity": "critical",
        "suggestion": "Name the exact file, component, command, or workflow being changed."
      }
    ],
    "finding_count": 2,
    "by_severity": {
      "critical": 1,
      "important": 1,
      "minor": 0
    },
    "clarity_score": 0
  }
}
```

---

## Assistant (Build · Hy3 preview Free)

---

