/**
 * MEMS Browser — pre-built json-render spec.
 *
 * Defines the json-render specification for the memory/document
 * browser panel. Renders a graph view, trajectory timeline, and
 * pressure gauge using shadcn Card + ScrollArea and the custom
 * TimelineView + MetricCard components.
 *
 * @module sidecar/panels/mems-browser/specs
 */

import type { ComponentSpec } from "@json-render/core"

/**
 * MEMS Browser json-render spec — graph view + trajectory.
 *
 * Features: memory graph visualization, trajectory event timeline,
 * pressure gauge metrics.
 */
export const memsBrowserSpec: ComponentSpec = {
  type: "container",
  children: [
    {
      type: "PanelHeader",
      title: "MEMS Browser",
      subtitle: "Explore memory documents and trajectory",
    },
    {
      type: "Card",
      children: [
        {
          type: "MetricCard",
          label: "Pressure Score",
          value: 3,
          trend: "neutral",
          description: "Tier 3 — moderate load",
        },
      ],
    },
    {
      type: "Card",
      children: [
        {
          type: "TimelineView",
          events: [
            { phase: "P25", timestamp: Date.now() - 3600000, summary: "Trajectory redesign" },
            { phase: "P26", timestamp: Date.now() - 1800000, summary: "Pressure notification" },
          ],
        },
      ],
    },
  ],
}
