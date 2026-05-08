import type { PtyManager } from "./pty-manager.js"

/**
 * Creates a PTY manager only when the host runtime supports the PTY backend.
 *
 * @returns A supported PTY manager, or `null` when PTY support is unavailable.
 *
 * @example
 * ```typescript
 * const ptyManager = await createPtyManagerIfSupported()
 * ```
 */
export async function createPtyManagerIfSupported(): Promise<PtyManager | null> {
  try {
    const ptyModule = await import("./pty-manager.js")
    const candidate = new ptyModule.PtyManager()
    return candidate.isSupported() ? candidate : null
  } catch {
    return null
  }
}
