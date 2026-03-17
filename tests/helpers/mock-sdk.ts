/**
 * Mock SDK — Centralized SDK mock infrastructure for tests.
 *
 * Provides mock PluginInput, client, shell, and tool context factories.
 * All mocks are type-safe and reset-able between tests.
 */

import type { PluginInput } from '@opencode-ai/plugin'

export interface MockClientCalls {
  showToast: Array<{ message: string; variant: string }>
  appLog: Array<{ service: string; level: string; message: string }>
}

function createMockClient(calls: MockClientCalls) {
  return {
    tui: {
      showToast: async (opts: { body: { message: string; variant: string } }) => {
        calls.showToast.push(opts.body)
        return {}
      },
    },
    app: {
      log: async (opts: { body: { service: string; level: string; message: string } }) => {
        calls.appLog.push(opts.body)
        return {}
      },
    },
    session: {},
    message: {},
  } as unknown as PluginInput['client']
}

function createMockShell() {
  return {} as unknown as PluginInput['$']
}

function createMockProject(overrides?: Partial<PluginInput['project']>) {
  return {
    id: 'test-project',
    worktree: '/tmp/test-worktree',
    time: { created: Date.now() },
    ...overrides,
  } as PluginInput['project']
}

export interface MockPluginInputOptions {
  directory?: string
  worktree?: string
  serverUrl?: string
}

/**
 * Create a full mock PluginInput suitable for plugin initialization.
 * Returns the input and a `calls` object for asserting side effects.
 */
export function createMockPluginInput(opts: MockPluginInputOptions = {}) {
  const calls: MockClientCalls = {
    showToast: [],
    appLog: [],
  }

  const input: PluginInput = {
    client: createMockClient(calls),
    project: createMockProject(),
    directory: opts.directory ?? '/tmp/test-project',
    worktree: opts ?? '/tmp/test-worktree',
    serverUrl: new URL(opts.serverUrl ?? 'http://localhost:3000'),
    $: createMockShell(),
  }

  return { input, calls }
}

/**
 * Create a mock tool execution context.
 */
export function createMockToolContext(overrides?: Record<string, unknown>) {
  return {
    sessionID: 'ses-test',
    messageID: 'msg-test',
    agent: 'hivefiver',
    directory: '/tmp/test-project',
    worktree: '/tmp/test-worktree',
    abort: new AbortController().signal,
    metadata: () => {},
    ask: async () => {},
    ...overrides,
  } as const
}
