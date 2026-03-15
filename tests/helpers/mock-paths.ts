/**
 * Mock Paths — Test-safe filesystem fixtures using getEffectivePaths().
 *
 * Creates temp directories with the full .hivemind structure
 * for test isolation. Provides setup and teardown helpers.
 */

import { mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { getEffectivePaths } from '../../src/shared/paths.js'

/**
 * Create a temporary project root with the full .hivemind directory structure.
 * Returns the paths object and a cleanup function.
 */
export async function createTestProjectRoot(prefix = 'hm-test-') {
  const projectRoot = join(tmpdir(), `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 6)}`)
  const paths = getEffectivePaths(projectRoot)

  // Create all required directories
  await mkdir(paths.stateDir, { recursive: true })
  await mkdir(paths.configDir, { recursive: true })
  await mkdir(paths.graphDir, { recursive: true })
  await mkdir(paths.projectPlanningDir, { recursive: true })
  await mkdir(paths.handoffsDir, { recursive: true })
  await mkdir(paths.sessionsDir, { recursive: true })

  return {
    projectRoot,
    paths,
    async cleanup() {
      await rm(projectRoot, { recursive: true, force: true })
    },
  }
}

export { getEffectivePaths }
