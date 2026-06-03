/**
 * Session Explorer — json-render spec definition (placeholder).
 *
 * JSON spec for session tree view panel. Will be consumed by
 * json-render Renderer in SC-04 full implementation.
 *
 * @module sidecar/panels/session-explorer/specs
 */

/**
 * Session Explorer json-render spec for session tree view.
 * Features: session list with status badges, expandable children trees.
 */
export const sessionExplorerSpec = {
  type: "container",
  props: {
    children: [
      { type: "PanelHeader", props: { title: "Session Explorer", subtitle: "Browse active sessions" } },
      { type: "Card", props: { title: "Sessions", description: "3 active sessions" } },
      { type: "StatusBadge", props: { status: "running", label: "Live updates via SSE" } },
    ],
  },
}
