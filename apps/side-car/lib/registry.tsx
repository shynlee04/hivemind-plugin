'use client'

import { defineRegistry } from '@json-render/react'
import { shadcnComponents } from '@json-render/shadcn'
import { catalog } from './catalog'

export const { registry } = defineRegistry(catalog, {
  components: {
    Stack: shadcnComponents.Stack,
    Heading: shadcnComponents.Heading,
    Card: shadcnComponents.Card,
    Badge: shadcnComponents.Badge,
    Text: shadcnComponents.Text,
  },
})
