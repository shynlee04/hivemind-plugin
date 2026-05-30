/**
 * Governance Engine — feature module for creating named child sessions
 * with `hm-governance:` title prefix for governance workflows.
 *
 * Provides the `createGovernanceSessionTool` factory that accepts an
 * OpenCode SDK client (via closure injection) and returns a custom tool
 * for creating governance sessions, injecting governance context via
 * system prompt, committing state via git, and notifying via TUI toast.
 *
 * @module governance-engine
 */

export { createGovernanceSessionTool } from "./create-governance-session.js"
