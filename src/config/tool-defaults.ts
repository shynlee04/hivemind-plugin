/**
 * Default tool-specific configurations for the Hivemind ecosystem.
 * Defines the tool registry with permissions for each tool.
 */
export const DEFAULT_TOOL_REGISTRY: Record<
  string,
  { name: string; description: string; permissions: string[] }
> = {
  "delegate-task": {
    name: "delegate-task",
    description: "Delegate work to a specialist agent via SDK child-session dispatch.",
    permissions: ["delegate", "session"],
  },
  "delegation-status": {
    name: "delegation-status",
    description: "Check delegation status, discover stackable sessions, and retrieve results.",
    permissions: ["read"],
  },
  "hivemind-agent-work-create": {
    name: "hivemind-agent-work-create",
    description: "Create a durable agent work contract without dispatching sessions.",
    permissions: ["write"],
  },
  "hivemind-agent-work-export": {
    name: "hivemind-agent-work-export",
    description: "Export an agent work contract as bounded JSON or Markdown handoff payload.",
    permissions: ["read"],
  },
  "hivemind-command-engine": {
    name: "hivemind-command-engine",
    description: "Discover command bundles, analyze contracts, render bounded context.",
    permissions: ["read"],
  },
  "hivemind-doc": {
    name: "hivemind-doc",
    description:
      "Multi-format CRUD document intelligence: skim, read, chunk, search, section-read, line-read, offset-read, create, write, upsert, append, insert, delete-section, delete-file, search-and-replace, batch-section-edits, batch-multi-file, metadata-read, metadata-write, metadata-delete, toc, heading-tree, code-inspect, xref-validate, index, context-extract — 24 actions across md/json/yaml/xml.",
    permissions: ["read", "write"],
  },
  "hivemind-pressure": {
    name: "hivemind-pressure",
    description: "Classify runtime pressure, detect pure control-plane outcomes, inspect tool authority.",
    permissions: ["read"],
  },
  "hivemind-sdk-supervisor": {
    name: "hivemind-sdk-supervisor",
    description: "Inspect SDK wrapper health, heartbeat, bounded diagnostics, and readiness.",
    permissions: ["read"],
  },
  "hivemind-session-view": {
    name: "hivemind-session-view",
    description: "Query a unified session view across 3 Hivemind data roots.",
    permissions: ["read"],
  },
  "hivemind-trajectory": {
    name: "hivemind-trajectory",
    description: "Inspect and update the Hivemind trajectory ledger.",
    permissions: ["read", "write"],
  },
  "execute-slash-command": {
    name: "execute-slash-command",
    description: "Executes an OpenCode slash command.",
    permissions: ["execute"],
  },
  "session-context": {
    name: "session-context",
    description: "Cross-session synthesis and discovery.",
    permissions: ["read"],
  },
  "session-delegation-query": {
    name: "session-delegation-query",
    description: "Query delegation history with progressive disclosure.",
    permissions: ["read"],
  },
  "session-hierarchy": {
    name: "session-hierarchy",
    description: "Navigate session delegation hierarchy.",
    permissions: ["read"],
  },
  "session-journal-export": {
    name: "session-journal-export",
    description: "Export bounded Session Journal and Execution Lineage quick-read summaries.",
    permissions: ["read"],
  },
  "session-patch": {
    name: "session-patch",
    description: "Patch specific sections in session file with backup.",
    permissions: ["write"],
  },
  "session-tracker": {
    name: "session-tracker",
    description: "Query and export session tracker data.",
    permissions: ["read"],
  },
  "create-governance-session": {
    name: "create-governance-session",
    description: "Creates a named child session with 'hm-governance:' title prefix.",
    permissions: ["create", "session"],
  },
  "tmux-copilot": {
    name: "tmux-copilot",
    description: "Co-pilot affordance for the tmux visual orchestration layer.",
    permissions: ["execute"],
  },
  "tmux-state-query": {
    name: "tmux-state-query",
    description: "Read-only session metadata query for the tmux visual orchestration layer.",
    permissions: ["read"],
  },
  "validate-restart": {
    name: "validate-restart",
    description:
      "Validate that compiled OpenCode primitives are discoverable and free of runtime issues after a restart.",
    permissions: ["read"],
  },
  "run-background-command": {
    name: "run-background-command",
    description: "Run CLI commands in shared background PTY sessions with queue-governed dispatch.",
    permissions: ["execute"],
  },
  "skill": {
    name: "skill",
    description:
      "Load a specialized skill when the task at hand matches one of the skills listed in the system prompt.",
    permissions: ["read"],
  },
  "configure-primitive": {
    name: "configure-primitive",
    description:
      "Configure, read, list, or inspect OpenCode primitives (agent, command, skill).",
    permissions: ["read", "write"],
  },
  "prompt-analyze": {
    name: "prompt-analyze",
    description:
      "Analyze prompt content for contradictions, vagueness, missing scope, and clarity signals.",
    permissions: ["read"],
  },
  "prompt-skim": {
    name: "prompt-skim",
    description:
      "Fast scan of prompt content: count words/lines/tokens, extract URLs, verify file paths.",
    permissions: ["read"],
  },
  "todowrite": {
    name: "todowrite",
    description: "Create and maintain a structured task list for the current coding session.",
    permissions: ["write"],
  },
}
