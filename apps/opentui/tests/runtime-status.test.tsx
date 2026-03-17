import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'bun:test'

import { parseRuntimeStatus } from '../src/adapters/runtime-client.js'

const testDirectory = fileURLToPath(new URL('.', import.meta.url))
const repoRoot = resolve(testDirectory, '..', '..', '..')
const appPackagePath = resolve(repoRoot, 'apps/opentui/package.json')
const rootPackagePath = resolve(repoRoot, 'package.json')

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T
}

describe('opentui workspace boundary', () => {
  test('root package declares an apps workspace for opentui', () => {
    const packageJson = readJson<{ workspaces?: string[] }>(rootPackagePath)

    expect(packageJson.workspaces).toBeDefined()
    expect(packageJson.workspaces).toEqual(
      expect.arrayContaining(['apps/*']),
    )
  })

  test('bun app package exposes dev, test, and typecheck scripts', () => {
    expect(existsSync(appPackagePath)).toBe(true)

    const packageJson = readJson<{
      scripts?: Record<string, string>
      dependencies?: Record<string, string>
    }>(appPackagePath)

    expect(packageJson.dependencies).toMatchObject({
      '@opentui/core': expect.any(String),
      '@opentui/react': expect.any(String),
    })
    expect(packageJson.scripts).toMatchObject({
      dev: expect.any(String),
      test: expect.any(String),
      typecheck: expect.any(String),
    })
  })

  test('the runtime status lane is authored with bun:test', () => {
    const source = readFileSync(fileURLToPath(import.meta.url), 'utf8')

    expect(source).toContain("from 'bun:test'")
  })

  test('runtime client parses the backend-owned status contract', () => {
    const status = parseRuntimeStatus({
      runtimeAuthority: 'managed-sdk',
      runtimeInstanceId: 'runtime-123',
      serverBaseUrl: 'http://127.0.0.1:4096',
      entryState: 'ready',
      interactiveBootstrapRequired: false,
      recommendedNext: 'none',
      qaState: 'pending',
      releaseState: 'blocked',
      supervisorStatus: 'healthy',
      trajectoryId: 'traj-1',
      workflowId: 'wf-1',
      taskIds: ['task-1'],
      subtaskIds: ['subtask-1'],
      checkpointId: 'checkpoint-1',
    })

    expect(status.runtimeAuthority).toBe('managed-sdk')
    expect(status.serverBaseUrl).toBe('http://127.0.0.1:4096')
    expect(status.workflowId).toBe('wf-1')
  })
})
