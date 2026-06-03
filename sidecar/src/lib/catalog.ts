/**
 * Unified json-render catalog — 44 component definitions.
 *
 * Combines 36 shadcn components from `@json-render/shadcn` with 8
 * custom sidecar components. The catalog is used to create the
 * component registry for the json-render Renderer.
 *
 * @module sidecar/lib/catalog
 */

import { z } from "zod"
import { shadcnComponentDefinitions } from "@json-render/shadcn"

// ── Custom component schemas ──

const sidecarContainerSchema = z.object({
  children: z.array(z.unknown()).optional(),
  className: z.string().optional(),
  title: z.string().optional(),
})

const panelHeaderSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  icon: z.string().optional(),
  actions: z.array(z.unknown()).optional(),
})

const statusBadgeSchema = z.object({
  status: z.enum(["running", "completed", "failed", "pending", "idle", "error"]),
  label: z.string().optional(),
  size: z.enum(["sm", "md", "lg"]).optional(),
})

const metricCardSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number()]),
  trend: z.enum(["up", "down", "neutral"]).optional(),
  description: z.string().optional(),
})

const sessionTreeSchema = z.object({
  sessions: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      status: z.string(),
      children: z.array(z.unknown()).optional(),
    }),
  ),
  selectedId: z.string().optional(),
})

const delegationListSchema = z.object({
  delegations: z.array(
    z.object({
      id: z.string(),
      agent: z.string(),
      status: z.string(),
      duration: z.number().optional(),
      error: z.string().optional(),
    }),
  ),
})

const timelineViewSchema = z.object({
  events: z.array(
    z.object({
      phase: z.string(),
      timestamp: z.number(),
      summary: z.string(),
      checkpoint: z.string().optional(),
    }),
  ),
})

const connectionIndicatorSchema = z.object({
  connected: z.boolean(),
  label: z.string().optional(),
  lastEvent: z.string().optional(),
})

// ── Custom component definitions ──

export const customComponentDefinitions = {
  SidecarContainer: {
    props: sidecarContainerSchema,
    slots: ["default"],
    description: "A container wrapper with optional title and className",
    example: { title: "Panel Container" },
  },
  PanelHeader: {
    props: panelHeaderSchema,
    slots: ["default"],
    description: "Panel header with title, subtitle, icon, and action slots",
    example: { title: "Session Explorer", subtitle: "Browse sessions" },
  },
  StatusBadge: {
    props: statusBadgeSchema,
    slots: [],
    description: "Status indicator badge with color-coded states",
    example: { status: "running", label: "Active" },
  },
  MetricCard: {
    props: metricCardSchema,
    slots: [],
    description: "Metric display card with value, label, and trend indicator",
    example: { label: "Delegations", value: 42, trend: "up" },
  },
  SessionTree: {
    props: sessionTreeSchema,
    slots: [],
    description: "Hierarchical session tree with expandable children",
    example: { sessions: [{ id: "ses_1", label: "Main", status: "active" }] },
  },
  DelegationList: {
    props: delegationListSchema,
    slots: [],
    description: "Delegation list with agent, status, and timing",
    example: { delegations: [{ id: "del_1", agent: "hm-test", status: "running" }] },
  },
  TimelineView: {
    props: timelineViewSchema,
    slots: [],
    description: "Event timeline with phase, timestamp, and summary",
    example: { events: [{ phase: "P25", timestamp: Date.now(), summary: "Update" }] },
  },
  ConnectionIndicator: {
    props: connectionIndicatorSchema,
    slots: [],
    description: "Connection status indicator dot with label",
    example: { connected: true, label: "Plugin Server" },
  },
}

/**
 * Complete component catalog merging shadcn + custom definitions.
 * Total: 36 shadcn + 8 custom = 44 components.
 */
export const catalogComponents = {
  ...shadcnComponentDefinitions,
  ...customComponentDefinitions,
} as const

/** Count of shadcn components. */
export const SHADCN_COMPONENT_COUNT = Object.keys(shadcnComponentDefinitions).length

/** Count of custom sidecar components. */
export const CUSTOM_COMPONENT_COUNT = Object.keys(customComponentDefinitions).length

/** Total component count (44). */
export const CATALOG_COMPONENT_COUNT =
  SHADCN_COMPONENT_COUNT + CUSTOM_COMPONENT_COUNT
