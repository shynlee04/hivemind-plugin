import { defineCatalog } from '@json-render/core'
import { schema } from '@json-render/react/schema'
import { shadcnComponentDefinitions } from '@json-render/shadcn/catalog'

export const catalog = defineCatalog(schema, {
  components: {
    Stack: shadcnComponentDefinitions.Stack,
    Heading: shadcnComponentDefinitions.Heading,
    Card: shadcnComponentDefinitions.Card,
    Badge: shadcnComponentDefinitions.Badge,
    Text: shadcnComponentDefinitions.Text,
  },
  actions: {},
})
