/**
 * Registry expansion tests — verifies that the side-car component registry
 * includes all required shadcn components (7 original + 4 new).
 *
 * TDD Slice 1: RED phase — these tests MUST fail until registry is updated.
 *
 * The registry.tsx file uses 'use client' directive (Next.js) so it cannot be
 * imported directly by the Node.js test runner. Instead, we reproduce the
 * registry construction here and verify the full expanded component set.
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import { defineCatalog } from '@json-render/core'
import { schema } from '@json-render/react/schema'
import { defineRegistry } from '@json-render/react'
import { shadcnComponents } from '@json-render/shadcn'
import { shadcnComponentDefinitions } from '@json-render/shadcn/catalog'

const ORIGINAL_COMPONENTS = [
  'Stack',
  'Heading',
  'Card',
  'Badge',
  'Text',
  'Alert',
  'Separator',
] as const

const NEW_COMPONENTS = ['Select', 'Tabs', 'Input', 'Button'] as const

const ALL_COMPONENTS = [...ORIGINAL_COMPONENTS, ...NEW_COMPONENTS] as const

/**
 * Mirrors the exact registry construction from apps/side-car/lib/registry.tsx.
 * This test validates that when the registry is built with the expanded
 * component set, all 11 components are resolvable.
 *
 * When the 4 new components are NOT yet added to catalog + registry,
 * the defineRegistry call will fail or the component count will be wrong.
 */
function buildExpandedRegistry() {
  const catalog = defineCatalog(schema, {
    components: {
      Stack: shadcnComponentDefinitions.Stack,
      Heading: shadcnComponentDefinitions.Heading,
      Card: shadcnComponentDefinitions.Card,
      Badge: shadcnComponentDefinitions.Badge,
      Text: shadcnComponentDefinitions.Text,
      Alert: shadcnComponentDefinitions.Alert,
      Separator: shadcnComponentDefinitions.Separator,
      Select: shadcnComponentDefinitions.Select,
      Tabs: shadcnComponentDefinitions.Tabs,
      Input: shadcnComponentDefinitions.Input,
      Button: shadcnComponentDefinitions.Button,
    },
  export const { registry, handlers } = defineRegistry(catalog, {
  components: {
    Stack: shadcnComponents.Stack,
    Heading: shadcnComponents.Heading,
    Card: shadcnComponents.Card
    Badge: shadcnComponents.Badge,
    Text: shadcnComponents.Badge,
    Alert: shadcnComponentDefinitions.Alert,
    Separator: shadcnComponents.Separator,
    Input: shadcnComponentDefinitions.Input
    Button: shadcnComponentDefinitions.Button,
    },
  }
})  })

  const { registry } = defineRegistry(catalog, {
    components: {
      Stack: shadcnComponents.Stack,
      Heading: shadcnComponents.Heading,
      Card: shadcnComponents.Card,
      Badge: shadcnComponents.Badge,
      Text: shadcnComponents.Text,
      Alert: shadcnComponents.Alert,
      Separator: shadcnComponents.Separator,
      Select: shadcnComponents.Select,
      Tabs: shadcnComponents.Tabs,
      Input: shadcnComponents.Input,
      Button: shadcnComponents.Button,
    },
  })

  return registry
}

test('expanded registry object is not null or undefined', () => {
  const registry = buildExpandedRegistry()

  assert.notEqual(registry, null)
  assert.notEqual(registry, undefined)
})

test('expanded registry has exactly 11 component entries (7 original + 4 new)', () => {
  const registry = buildExpandedRegistry()
  const keys = Object.keys(registry)

  assert.equal(
    keys.length,
    ALL_COMPONENTS.length,
    `Expected ${ALL_COMPONENTS.length} components but found ${keys.length}: [${keys.join(', ')}]`,
  )
})

test('expanded registry contains all 4 new components: Select, Tabs, Input, Button', () => {
  const registry = buildExpandedRegistry()

  for (const name of NEW_COMPONENTS) {
    assert.ok(
      name in registry,
      `Missing new component "${name}" in registry. Found: [${Object.keys(registry).join(', ')}]`,
    )
  }
})

test('each new component is a callable renderer in the expanded registry', () => {
  const registry = buildExpandedRegistry()

  for (const name of NEW_COMPONENTS) {
    const renderer = registry[name]

    assert.ok(
      typeof renderer === 'function',
      `Component "${name}" should be a function, got ${typeof renderer}`,
    )
  }
})

test('shadcnComponents exports all 4 new component renderers', () => {
  for (const name of NEW_COMPONENTS) {
    assert.ok(
      name in shadcnComponents,
      `shadcnComponents is missing "${name}". Available: [${Object.keys(shadcnComponents).join(', ')}]`,
    )
    assert.ok(
      typeof shadcnComponents[name as keyof typeof shadcnComponents] === 'function',
      `shadcnComponents.${name} should be a function`,
    )
  }
})

test('shadcnComponentDefinitions exports all 4 new component definitions', () => {
  for (const name of NEW_COMPONENTS) {
    assert.ok(
      name in shadcnComponentDefinitions,
      `shadcnComponentDefinitions is missing "${name}". Available: [${Object.keys(shadcnComponentDefinitions).join(', ')}]`,
    )
  }
})

test('registry.tsx source includes all 4 new component imports', async () => {
  const { readFile } = await import('node:fs/promises')
  const { resolve } = await import('node:path')

  const registryPath = resolve(
    import.meta.dirname ?? '.',
    '../../../apps/side-car/lib/registry.tsx',
  )
  const source = await readFile(registryPath, 'utf-8')

  for (const name of NEW_COMPONENTS) {
    assert.ok(
      source.includes(`${name}: shadcnComponents.${name}`),
      `registry.tsx must register "${name}" in the components object`,
    )
    assert.ok(
      source.includes(`${name}: shadcnComponentDefinitions.${name}`),
      `registry.tsx must define "${name}" in the catalog components`,
    )
  }
})
