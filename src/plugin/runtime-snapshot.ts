import {
  loadRuntimeBindingsSnapshot,
  type RuntimeBindingsSnapshot,
} from '../shared/runtime-attachment.js'

export interface TurnSnapshotLoader {
  getSnapshot(): Promise<RuntimeBindingsSnapshot>
  resetTurnSnapshot(): void
}

type RuntimeSnapshotReader = (directory: string) => Promise<RuntimeBindingsSnapshot>

/**
 * Create a lazy runtime snapshot reader that reuses one snapshot per turn.
 *
 * @param directory Project root used to load runtime bindings.
 * @param loadSnapshot Optional loader override for tests.
 * @returns Cached snapshot accessors for the active turn.
 */
export function createTurnSnapshotLoader(
  directory: string,
  loadSnapshot: RuntimeSnapshotReader = loadRuntimeBindingsSnapshot,
): TurnSnapshotLoader {
  let cachedSnapshot: Promise<RuntimeBindingsSnapshot> | undefined

  return {
    async getSnapshot(): Promise<RuntimeBindingsSnapshot> {
      cachedSnapshot ??= loadSnapshot(directory)
      return cachedSnapshot
    },
    resetTurnSnapshot(): void {
      cachedSnapshot = undefined
    },
  }
}
