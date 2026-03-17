import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'bun:test'

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
})
