import { fileURLToPath } from 'node:url'

import {
  syncRuntimeSurface as syncRuntimeSurfaceWithOptions,
  type RuntimeSurfaceSyncOptions,
  type RuntimeSurfaceSyncResult,
} from '../features/runtime-observability/sync.js'

const LOCAL_PLUGIN_FILE = 'hivemind-context-governance.ts'
const PACKAGE_PLUGIN_NAME = 'hivemind-context-governance'
const PACKAGE_PLUGIN_ENTRY = 'hivemind-context-governance/plugin'

function resolveRuntimeSurfaceSyncOptions(): RuntimeSurfaceSyncOptions {
  return {
    packageRoot: fileURLToPath(new URL('../../', import.meta.url)),
    localPluginFile: LOCAL_PLUGIN_FILE,
    packagePluginName: PACKAGE_PLUGIN_NAME,
    packagePluginEntry: PACKAGE_PLUGIN_ENTRY,
  }
}

export type { RuntimeSurfaceSyncResult } from '../features/runtime-observability/sync.js'

export async function syncRuntimeSurface(directory: string): Promise<RuntimeSurfaceSyncResult> {
  return syncRuntimeSurfaceWithOptions(directory, resolveRuntimeSurfaceSyncOptions())
}
