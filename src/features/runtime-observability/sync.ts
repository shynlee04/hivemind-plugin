export interface RuntimeSurfaceSyncOptions {
  packageRoot: string
  localPluginFile: string
  packagePluginName: string
  packagePluginEntry: string
}

export interface RuntimeSurfaceSyncResult {
  pluginFile: string
  mirroredCommandFiles: string[]
  mirroredAgentFiles: string[]
}

export async function syncRuntimeSurface(
  _directory: string,
  _options: RuntimeSurfaceSyncOptions,
): Promise<RuntimeSurfaceSyncResult> {
  return {
    pluginFile: '',
    mirroredCommandFiles: [],
    mirroredAgentFiles: [],
  }
}
