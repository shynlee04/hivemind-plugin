/**
 * Control Panel — pre-built json-render spec.
 *
 * Defines the json-render specification for the command console.
 * Renders tool invocation buttons and a command input placeholder
 * using shadcn Button + Input and the custom StatusBadge +
 * ConnectionIndicator components.
 *
 * @module sidecar/panels/control-panel/specs
 */

import type { ComponentSpec } from "@json-render/core"

/**
 * Control Panel json-render spec — command console.
 *
 * Features: tool invocation buttons, command input, status
 * indicators for runtime connection and tool execution.
 */
export const controlPanelSpec: ComponentSpec = {
  type: "container",
  children: [
    {
      type: "PanelHeader",
      title: "Control Panel",
      subtitle: "Execute commands and configure runtime",
    },
    {
      type: "Card",
      children: [
        {
          type: "ConnectionIndicator",
          connected: true,
          label: "Plugin Server",
        },
      ],
    },
    {
      type: "Card",
      children: [
        {
          type: "StatusBadge",
          status: "pending",
          label: "Tool invocation buttons (SC-07)",
        },
      ],
    },
  ],
}
