/**
 * Delegation Dashboard — json-render spec definition (placeholder).
 *
 * JSON spec for delegation list view. Will be consumed by
 * json-render Renderer in SC-05 full implementation.
 *
 * @module sidecar/panels/delegation-dashboard/specs
 */

/**
 * Delegation Dashboard json-render spec for delegation list view.
 * Features: delegation table with status badges, agent names, timing.
 */
export const delegationDashboardSpec = {
  type: "container",
  props: {
    children: [
      { type: "PanelHeader", props: { title: "Delegation Dashboard", subtitle: "Monitor delegation status" } },
      { type: "MetricCard", props: { label: "Active Delegations", value: 3, trend: "up" } },
      { type: "DelegationList", props: { delegations: [{ id: "del_1", agent: "hm-researcher", status: "running" }] } },
    ],
  },
}
