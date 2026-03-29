'use client'

import { defineCatalog } from '@json-render/core'
import { schema } from '@json-render/react/schema'
import { defineRegistry } from '@json-render/react'
import { shadcnComponents } from '@json-render/shadcn'
import { shadcnComponentDefinitions } from '@json-render/shadcn/catalog'

const catalog = defineCatalog(schema, {
  components: {
    Stack: shadcnComponentDefinitions.Stack,
    Heading: shadcnComponentDefinitions.Heading,
    Card: shadcnComponentDefinitions.Card,
    Badge: shadcnComponentDefinitions.Badge,
    Text: shadcnComponentDefinitions.Text,
    Alert: shadcnComponentDefinitions.Alert,
    Separator: shadcnComponentDefinitions.Separator,
  },
  actions: {},
})

export const { registry } = defineRegistry(catalog, {
  components: {
    Stack: shadcnComponents.Stack,
    Heading: shadcnComponents.Heading,
    Card: shadcnComponents.Card,
    Badge: shadcnComponents.Badge,
    Text: shadcnComponents.Text,
    Alert: shadcnComponents.Alert,
    Separator: shadcnComponents.Separator,
  },
})
