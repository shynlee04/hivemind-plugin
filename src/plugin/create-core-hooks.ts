import type { HookDescriptor } from './plugin-types.js'

export function createCoreHooks(): HookDescriptor[] {
  return [
    {
      name: 'start-work',
      stage: 'start-work',
      description: 'Resolve session state, lineage, purpose, readiness, and command routing.',
    },
    {
      name: 'auto-slash-command',
      stage: 'routing',
      description: 'Translate start-work decisions into command bundle routing with risk gates.',
    },
    {
      name: 'messages-transform',
      stage: 'transform',
      description: 'Compile message-level lineage refresh packets for the active session scope.',
    },
    {
      name: 'system-transform',
      stage: 'transform',
      description: 'Compile system-level lineage packets for main and delegated sub-sessions.',
    },
  ]
}
