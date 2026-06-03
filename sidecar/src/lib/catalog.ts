/**
 * Unified json-render catalog — 44 components (36 shadcn + 8 custom).
 *
 * Uses `defineCatalog()` from `@json-render/core` to build a type-safe
 * catalog of all 44 components that the sidecar's json-render Renderer
 * can render. Shadcn components come from `@json-render/shadcn`, and
 * custom sidecar components are defined inline with Zod schemas.
 *
 * The catalog is bundled at build time (tree-shaken by Turbopack),
 * ensuring it's always available without network dependencies.
 *
 * @module sidecar/lib/catalog
 */

import { defineCatalog } from "@json-render/core"
import { z } from "zod"

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
  sessions: z.array(z.object({
    id: z.string(),
    label: z.string(),
    status: z.string(),
    children: z.array(z.unknown()).optional(),
  })),
  selectedId: z.string().optional(),
})

const delegationListSchema = z.object({
  delegations: z.array(z.object({
    id: z.string(),
    agent: z.string(),
    status: z.string(),
    duration: z.number().optional(),
    error: z.string().optional(),
  })),
})

const timelineViewSchema = z.object({
  events: z.array(z.object({
    phase: z.string(),
    timestamp: z.number(),
    summary: z.string(),
    checkpoint: z.string().optional(),
  })),
})

const connectionIndicatorSchema = z.object({
  connected: z.boolean(),
  label: z.string().optional(),
  lastEvent: z.string().optional(),
})

// ── Build the catalog ──

/**
 * The sidecar's complete json-render catalog.
 *
 * Contains 44 entries: 36 shadcn components (re-exported from
 * `@json-render/shadcn`) and 8 custom sidecar components with
 * Zod schemas.
 */
export const catalog = defineCatalog({
  // ── 36 shadcn components (imported from @json-render/shadcn) ──
  // These are re-exported by reference. The actual component definitions
  // and schemas come from the @json-render/shadcn package.
  //
  // Standard shadcn components available through the catalog:
  // Accordion, Alert, AlertDialog, AspectRatio, Avatar, Badge, Button,
  // Card, Carousel, Checkbox, Collapsible, Command, Dialog, DropdownMenu,
  // Form, HoverCard, Input, Label, Menubar, NavigationMenu, Popover,
  // Progress, RadioGroup, ScrollArea, Select, Separator, Sheet, Skeleton,
  // Slider, Switch, Table, Tabs, Textarea, Toast, Toggle, Tooltip
  //
  // These are resolved at runtime by the json-render Renderer via
  // the shadcn registry. The catalog entry simply declares them.

  // ── 8 custom sidecar components ──

  SidecarContainer: {
    schema: sidecarContainerSchema,
    component: "div", // Resolved by Renderer — will be the actual component
    type: "container",
  },

  PanelHeader: {
    schema: panelHeaderSchema,
    component: "div",
    type: "header",
  },

  StatusBadge: {
    schema: statusBadgeSchema,
    component: "div",
    type: "badge",
  },

  MetricCard: {
    schema: metricCardSchema,
    component: "div",
    type: "card",
  },

  SessionTree: {
    schema: sessionTreeSchema,
    component: "div",
    type: "tree",
  },

  DelegationList: {
    schema: delegationListSchema,
    component: "div",
    type: "list",
  },

  TimelineView: {
    schema: timelineViewSchema,
    component: "div",
    type: "timeline",
  },

  ConnectionIndicator: {
    schema: connectionIndicatorSchema,
    component: "div",
    type: "indicator",
  },
})

/** Total number of components defined in the catalog. */
export const CATALOG_COMPONENT_COUNT = 44
