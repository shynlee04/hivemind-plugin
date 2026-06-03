/**
 * Session Explorer — pre-built json-render spec.
 *
 * Defines the json-render specification for the session tree view
 * panel. Renders a session list with children, context, and status
 * indicators using shadcn Card + Badge components and the custom
 * SessionTree component.
 *
 * @module sidecar/panels/session-explorer/specs
 */

import type { ComponentSpec } from "@json-render/core"

/**
 * Session Explorer json-render spec — session tree view.
 *
 * Features: session list with status badges, expandable children
 * trees, context view on selection.
 */
export const sessionExplorerSpec: ComponentSpec = {
  type: "container",
  children: [
    {
      type: "PanelHeader",
      title: "Session Explorer",
      subtitle: "Browse and inspect active sessions",
    },
    {
      type: "Card",
      children: [
        {
          type: "SessionTree",
          sessions: [
            { id: "ses_1", label: "Main session", status: "active" },
            { id: "ses_2", label: "Subtask: research", status: "running" },
            { id: "ses_3", label: "Subtask: planning", status: "pending" },
          ],
        },
      ],
    },
    {
      type: "Card",
      children: [
        {
          type: "StatusBadge",
          status: "running",
          label: "Live updates incoming via SSE",
        },
      ],
    },
  ],
}
