Creating OpenCode Plugins
Procedure Overview
Step	Action	Read
1	Verify SDK reference	Run extract script
2	Validate feasibility	This file
3	Design plugin	references/hooks.md, references/hook-patterns.md, references/CODING-TS.MD
4	Implement	references/tool-helper.md (if custom tools)
5	Add UI feedback	references/toast-notifications.md, references/ui-feedback.md (if needed)
6	Test	references/testing.md
7	Publish	references/publishing.md, references/update-notifications.md (if npm)
Step 1: Verify SDK Reference (REQUIRED)
Before creating any plugin, MUST regenerate the API reference to ensure accuracy:

bun run .opencode/skill/create-opencode-plugin/scripts/extract-plugin-api.ts
This generates:

references/hooks.md - All available hooks and signatures
references/events.md - All event types and properties
references/tool-helper.md - Tool creation patterns
Step 2: Validate Feasibility (REQUIRED)
MUST determine if the user's concept is achievable with available hooks.

Feasible as plugins:
Intercepting/blocking tool calls
Reacting to events (file edits, session completion, etc.)
Adding custom tools for the LLM
Modifying LLM parameters (temperature, etc.)
Custom auth flows for providers
Customizing session compaction
Displaying status messages (toasts, inline)
NOT feasible (inform user):
Modifying TUI rendering or layout
Adding new built-in tools (requires OC source)
Changing core agent behavior/prompts
Intercepting assistant responses mid-stream
Adding new keybinds or commands
Modifying internal file read/write
Adding new permission types
If not feasible, MUST inform user clearly. Suggest:

OC core changes: contribute to packages/opencode
MCP tools: use MCP server configuration
Simple automation: use shell scripts
Step 3: Design Plugin
READ: references/hooks.md for available hooks, references/hook-patterns.md for implementation patterns.

READ: references/CODING-TS.MD for code architecture principles. MUST follow these design guidelines:

Modular structure: Split complex plugins into multiple focused files (types, utilities, hooks, tools)
Single purpose: Each function does ONE thing well
DRY: Extract common patterns into shared utilities immediately
Small files: Keep individual files under 150 lines - split into smaller modules as needed
No monoliths: MUST NOT put all plugin code in a single index.ts file
Plugin Locations
Scope	Path	Use Case
Project	.opencode/plugin/<name>/index.ts	Team-shared, repo-specific
Global	~/.config/opencode/plugin/<name>/index.ts	Personal, all projects
Basic Structure
import type { Plugin } from "@opencode-ai/plugin"

export const MyPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  // Setup code runs once on load

  return {
    // Hook implementations - see references/hook-patterns.md
  }
}
Context Parameters
Parameter	Type	Description
project	Project	Current project info (id, worktree, name)
client	SDK Client	OpenCode API client
$	BunShell	Bun shell for commands
directory	string	Current working directory
worktree	string	Git worktree path
Step 4: Implement
READ: references/hook-patterns.md for hook implementation examples.

READ: references/tool-helper.md if adding custom tools (Zod schemas).

READ: references/events.md if using event hook (event types/properties).

READ: references/examples.md for complete plugin examples.

ALWAYS READ: references/CODING-TS.MD and follow modular design principles.

Plugin Structure (Non-Monolithic)
For complex plugins, MUST use a modular directory structure:

.opencode/plugin/my-plugin/
├── index.ts          # Entry point, exports Plugin
├── types.ts          # TypeScript types/interfaces
├── utils.ts          # Shared utilities
├── hooks/            # Hook implementations
│   ├── event.ts
│   └── tool-execute.ts
└── tools/            # Custom tool definitions
    └── my-tool.ts
Example modular index.ts:

import type { Plugin } from "@opencode-ai/plugin"
import { eventHooks } from "./hooks/event"
import { toolHooks } from "./hooks/tool-execute"
import { customTools } from "./tools"

export const MyPlugin: Plugin = async ({ project, client }) => {
  return {
    ...eventHooks({ client }),
    ...toolHooks({ client }),
    tool: customTools,
  }
}
Keep each file under 150 lines. Split as complexity grows.

Common Mistakes
Mistake	Fix
Using client.registerTool()	Use tool: { name: tool({...}) }
Wrong event property names	Check references/events.md
Sync event handler	MUST use async
Not throwing to block	throw new Error() in tool.execute.before
Forgetting TypeScript types	import type { Plugin } from "@opencode-ai/plugin"
Step 5: Add UI Feedback (Optional)
Only if plugin needs user-visible notifications:

READ: references/toast-notifications.md for transient alerts (brief popups)

READ: references/ui-feedback.md for persistent inline status messages

Choose based on:

Need	Use
Brief alerts, warnings	Toast
Detailed stats, multi-line	Inline message
Config validation errors	Toast
Session completion notice	Toast or inline
Step 6: Test
READ: references/testing.md for full testing procedure.

Quick Test Steps
Create test folder with opencode.json:

{
  "plugin": ["file:///path/to/your/plugin/index.ts"],
}
Verify plugin loads:

cd /path/to/test-folder
opencode run hi
Test interactively:

opencode
SHOULD recommend specific tests based on hook type used.

Step 7: Publish (Optional)
READ: references/publishing.md for npm publishing.

READ: references/update-notifications.md for version update toasts (for users with pinned versions).

<reference_summary>

Reference Files Summary
File	Purpose	When to Read
hooks.md	Hook signatures (auto-generated)	Step 3-4
events.md	Event types (auto-generated)	Step 4 (if using events)
tool-helper.md	Zod tool schemas (auto-generated)	Step 4 (if custom tools)
hook-patterns.md	Hook implementation examples	Step 3-4
CODING-TS.MD	Code architecture principles	Step 3 (Design)
examples.md	Complete plugin examples	Step 4
toast-notifications.md	Toast popup API	Step 5 (if toasts needed)
ui-feedback.md	Inline message API	Step 5 (if inline needed)
testing.md	Testing procedure	Step 6
publishing.md	npm publishing	Step 7
update-notifications.md	Version toast pattern	Step 7 (for npm plugins)