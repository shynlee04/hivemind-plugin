/**
 * MEMS Browser — json-render spec definition (placeholder).
 *
 * JSON spec for memory/document browser panel. Will be consumed by
 * json-render Renderer in SC-06 full implementation.
 *
 * @module sidecar/panels/mems-browser/specs
 */

/**
 * MEMS Browser json-render spec for memory/document browser.
 * Features: graph view, trajectory timeline, pressure gauge.
 */
export const memsBrowserSpec = {
  type: "container",
  props: {
    children: [
      { type: "PanelHeader", props: { title: "MEMS Browser", subtitle: "Explore memory and trajectory" } },
      { type: "MetricCard", props: { label: "Pressure Score", value: 3, trend: "neutral" } },
      { type: "TimelineView", props: { events: [{ phase: "P25", timestamp: Date.now(), summary: "Trajectory redesign" }] } },
    ],
  },
}
