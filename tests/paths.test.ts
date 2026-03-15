import assert from 'node:assert/strict'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import {
  HIVEMIND_DIR,
  getConfigPath,
  getEffectivePaths,
  getHivemindPath,
  getSessionPath,
  getStatePath,
  isHivemindPath,
  isSessionFile,
} from '../src/shared/paths.js'

describe('effective path authority', () => {
  it('derives canonical runtime paths from a single authority object', () => {
    const projectRoot = '/tmp/hivemind-paths'
    const paths = getEffectivePaths(projectRoot)

    assert.equal(HIVEMIND_DIR, '.hivemind')
    assert.equal(paths.root, join(projectRoot, '.hivemind'))
    assert.equal(paths.stateDir, join(projectRoot, '.hivemind', 'state'))
    assert.equal(paths.configDir, join(projectRoot, '.hivemind', 'config'))
    assert.equal(paths.graphDir, join(projectRoot, '.hivemind', 'graph'))
    assert.equal(paths.projectPlanningDir, join(projectRoot, '.hivemind', 'project', 'planning'))
    assert.equal(paths.runtimeAttachmentSettings, join(projectRoot, '.hivemind', 'config', 'runtime-attachment.json'))
    assert.equal(paths.workflowTasksState, join(projectRoot, '.hivemind', 'state', 'tasks.json'))
    assert.equal(paths.workflowTasksGraph, join(projectRoot, '.hivemind', 'graph', 'tasks.json'))
    assert.equal(paths.trajectoryLedger, join(projectRoot, '.hivemind', 'state', 'trajectory-ledger.json'))
    assert.equal(paths.handoffsDir, join(projectRoot, '.hivemind', 'handoffs'))
  })

  it('keeps wrapper helpers aligned to getEffectivePaths for legacy callers inside the cutover', () => {
    const projectRoot = '/tmp/hivemind-wrappers'
    const paths = getEffectivePaths(projectRoot)

    assert.equal(getHivemindPath(projectRoot), paths.root)
    assert.equal(getStatePath(projectRoot, 'tasks.json'), paths.workflowTasksState)
    assert.equal(getConfigPath(projectRoot, 'runtime-attachment.json'), paths.runtimeAttachmentSettings)
    assert.equal(getSessionPath(projectRoot, 'ses_123'), join(paths.sessionsDir, 'ses_123'))
    assert.equal(isHivemindPath(paths.trajectoryLedger), true)
    assert.equal(isSessionFile(join(paths.sessionsDir, 'ses_123', 'manifest.json')), true)
  })
})
