/**
 * Control Panel — json-render spec definition (placeholder).
 *
 * JSON spec for command console panel. Will be consumed by
 * json-render Renderer in SC-07 full implementation.
 *
 * @module sidecar/panels/control-panel/specs
 */

/**
 * Control Panel json-render spec for command console.
 * Features: tool invocation buttons, command input, connection status.
 */
export const controlPanelSpec = {
  type: "container",
  props: {
    children: [
      { type: "PanelHeader", props: { title: "Control Panel", subtitle: "Execute commands" } },
      { type: "ConnectionIndicator", props: { connected: true, label: "Plugin Server" } },
      { type: "StatusBadge", props: { status: "pending", label: "Tool buttons (SC-07)" } },
    ],
  },
}
