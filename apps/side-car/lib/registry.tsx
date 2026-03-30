'use client'

/**
 * @fileoverview Full json-render registry for the Hivemind side-car UI harness.
 *
 * Registers all 36 shadcn components from `@json-render/shadcn` and defines
 * custom actions for settings persistence and dashboard refresh. This file is
 * the single source of truth for the component-to-React mapping used by the
 * `<Renderer>` component throughout the side-car application.
 *
 * @see docs/plans/2026-03-30-sidecar-architecture-plan.md §4 Registry Design
 */

import { defineCatalog } from '@json-render/core'
import { schema } from '@json-render/react/schema'
import { defineRegistry } from '@json-render/react'
import { shadcnComponents } from '@json-render/shadcn'
import { shadcnComponentDefinitions } from '@json-render/shadcn/catalog'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Catalog — component + action schemas
// ---------------------------------------------------------------------------

/**
 * Full shadcn component catalog with all 36 registered components and
 * Phase 1 custom actions for settings persistence and dashboard data refresh.
 */
const catalog = defineCatalog(schema, {
  components: {
    // --- Layout ---
    Stack: shadcnComponentDefinitions.Stack,
    Grid: shadcnComponentDefinitions.Grid,
    Separator: shadcnComponentDefinitions.Separator,
    Card: shadcnComponentDefinitions.Card,

    // --- Typography ---
    Heading: shadcnComponentDefinitions.Heading,
    Text: shadcnComponentDefinitions.Text,

    // --- Data Display ---
    Table: shadcnComponentDefinitions.Table,
    Badge: shadcnComponentDefinitions.Badge,
    Alert: shadcnComponentDefinitions.Alert,
    Avatar: shadcnComponentDefinitions.Avatar,
    Image: shadcnComponentDefinitions.Image,

    // --- Form ---
    Button: shadcnComponentDefinitions.Button,
    Input: shadcnComponentDefinitions.Input,
    Textarea: shadcnComponentDefinitions.Textarea,
    Select: shadcnComponentDefinitions.Select,
    Checkbox: shadcnComponentDefinitions.Checkbox,
    Radio: shadcnComponentDefinitions.Radio,
    Switch: shadcnComponentDefinitions.Switch,
    Slider: shadcnComponentDefinitions.Slider,

    // --- Navigation ---
    Tabs: shadcnComponentDefinitions.Tabs,
    Link: shadcnComponentDefinitions.Link,

    // --- Feedback ---
    Progress: shadcnComponentDefinitions.Progress,
    Skeleton: shadcnComponentDefinitions.Skeleton,
    Spinner: shadcnComponentDefinitions.Spinner,

    // --- Overlay ---
    Dialog: shadcnComponentDefinitions.Dialog,
    Tooltip: shadcnComponentDefinitions.Tooltip,
    Popover: shadcnComponentDefinitions.Popover,
    Drawer: shadcnComponentDefinitions.Drawer,
    DropdownMenu: shadcnComponentDefinitions.DropdownMenu,

    // --- Interactive ---
    Accordion: shadcnComponentDefinitions.Accordion,
    Collapsible: shadcnComponentDefinitions.Collapsible,
    Carousel: shadcnComponentDefinitions.Carousel,
    Pagination: shadcnComponentDefinitions.Pagination,
    Toggle: shadcnComponentDefinitions.Toggle,
    ToggleGroup: shadcnComponentDefinitions.ToggleGroup,
    ButtonGroup: shadcnComponentDefinitions.ButtonGroup,
  },
  actions: {
    /** Persist a settings section to the server */
    saveSettings: {
      params: z.object({
        section: z.string(),
        settings: z.record(z.string(), z.unknown()),
      }),
      description: 'Persist a configuration section and its key-value settings to disk',
    },
    /** Reset settings to defaults */
    resetSettings: {
      params: z.object({
        section: z.string(),
        keys: z.array(z.string()).optional(),
      }),
      description: 'Reset a configuration section (or specific keys) to default values',
    },
    /** Fetch fresh dashboard data from the server */
    refreshDashboard: {
      params: z.object({}),
      description: 'Fetch the latest dashboard metrics and return the data object',
    },
  },
})

// ---------------------------------------------------------------------------
// Registry — React component map + action handler factory
// ---------------------------------------------------------------------------

/**
 * Wired registry connecting every shadcn component definition to its React
 * implementation and providing action handlers for settings + dashboard ops.
 *
 * Usage:
 * ```tsx
 * <Renderer spec={spec} registry={registry} />
 * ```
 */
const { registry, handlers, executeAction } = defineRegistry(catalog, {
  components: {
    // --- Layout ---
    Stack: shadcnComponents.Stack,
    Grid: shadcnComponents.Grid,
    Separator: shadcnComponents.Separator,
    Card: shadcnComponents.Card,

    // --- Typography ---
    Heading: shadcnComponents.Heading,
    Text: shadcnComponents.Text,

    // --- Data Display ---
    Table: shadcnComponents.Table,
    Badge: shadcnComponents.Badge,
    Alert: shadcnComponents.Alert,
    Avatar: shadcnComponents.Avatar,
    Image: shadcnComponents.Image,

    // --- Form ---
    Button: shadcnComponents.Button,
    Input: shadcnComponents.Input,
    Textarea: shadcnComponents.Textarea,
    Select: shadcnComponents.Select,
    Checkbox: shadcnComponents.Checkbox,
    Radio: shadcnComponents.Radio,
    Switch: shadcnComponents.Switch,
    Slider: shadcnComponents.Slider,

    // --- Navigation ---
    Tabs: shadcnComponents.Tabs,
    Link: shadcnComponents.Link,

    // --- Feedback ---
    Progress: shadcnComponents.Progress,
    Skeleton: shadcnComponents.Skeleton,
    Spinner: shadcnComponents.Spinner,

    // --- Overlay ---
    Dialog: shadcnComponents.Dialog,
    Tooltip: shadcnComponents.Tooltip,
    Popover: shadcnComponents.Popover,
    Drawer: shadcnComponents.Drawer,
    DropdownMenu: shadcnComponents.DropdownMenu,

    // --- Interactive ---
    Accordion: shadcnComponents.Accordion,
    Collapsible: shadcnComponents.Collapsible,
    Carousel: shadcnComponents.Carousel,
    Pagination: shadcnComponents.Pagination,
    Toggle: shadcnComponents.Toggle,
    ToggleGroup: shadcnComponents.ToggleGroup,
    ButtonGroup: shadcnComponents.ButtonGroup,
  },
  actions: {
    /** @action saveSettings — POST settings to the config API route */
    saveSettings: async (params, setState) => {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: params?.section ?? '',
          settings: params?.settings ?? {},
        }),
      })
      if (response.ok) {
        setState((prev) => ({ ...prev, lastSaveStatus: 'ok' }))
      } else {
        const text = await response.text()
        setState((prev) => ({ ...prev, lastSaveStatus: text || 'error' }))
      }
    },

    /** @action resetSettings — DELETE settings via the config API route */
    resetSettings: async (params, setState) => {
      const searchParams = new URLSearchParams({ section: params?.section ?? '' })
      if (params?.keys?.length) {
        searchParams.set('keys', params.keys.join(','))
      }
      const response = await fetch(`/api/settings?${searchParams.toString()}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setState((prev) => ({ ...prev, lastResetStatus: 'ok' }))
      } else {
        const text = await response.text()
        setState((prev) => ({ ...prev, lastResetStatus: text || 'error' }))
      }
    },

    /** @action refreshDashboard — GET latest dashboard data */
    refreshDashboard: async (_params, setState) => {
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const data = await response.json()
        setState((prev) => ({ ...prev, dashboardData: data }))
      }
    },
  },
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { catalog, registry, handlers, executeAction }
