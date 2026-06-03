/**
 * Delegation Dashboard — pre-built json-render spec.
 *
 * Defines the json-render specification for the delegation list view.
 * Renders delegation records with status badges, agent names, timing,
 * and error states using shadcn Table + Badge and the custom
 * DelegationList component.
 *
 * @module sidecar/panels/delegation-dashboard/specs
 */

import type { ComponentSpec } from "@json-render/core"

/**
 * Delegation Dashboard json-render spec — delegation list view.
 *
 * Features: delegation table with status badges, timing, agent names,
 * and error indicators.
 */
export const delegationDashboardSpec: ComponentSpec = {
  type: "container",
  children: [
    {
      type: "PanelHeader",
      title: "Delegation Dashboard",
      subtitle: "Monitor delegation status and timing",
    },
    {
      type: "Card",
      children: [
        {
          type: "MetricCard",
          label: "Active Delegations",
          value: 3,
          trend: "up",
        },
      ],
    },
    {
      type: "Card",
      children: [
        {
          type: "DelegationList",
          delegations: [
            { id: "del_1", agent: "hm-researcher", status: "running" },
            { id: "del_2", agent: "hm-planner", status: "completed" },
            { id: "del_3", agent: "hm-executor", status: "pending" },
          ],
        },
      ],
    },
  ],
}
