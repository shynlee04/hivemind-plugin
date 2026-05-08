import { existsSync, realpathSync } from "node:fs"
import { dirname, isAbsolute, relative, resolve, sep } from "node:path"

/**
 * Resolve a caller-provided path against a trusted root without allowing escapes.
 *
 * @param root - Trusted filesystem root for the boundary.
 * @param candidate - Relative or absolute candidate path to validate.
 * @returns The normalized absolute path when it stays inside `root`.
 *
 * @example
 * ```typescript
 * const path = resolveScopedPath('/repo', '.hivemind/state/session.json')
 * // path === '/repo/.hivemind/state/session.json'
 * ```
 */
export function resolveScopedPath(root: string, candidate: string): string {
  const absoluteRoot = resolve(root)
  const absoluteCandidate = isAbsolute(candidate)
    ? resolve(candidate)
    : resolve(absoluteRoot, candidate)

  assertRelativePathInsideRoot(absoluteRoot, absoluteCandidate, candidate)
  assertRealPathInsideRoot(absoluteRoot, absoluteCandidate, candidate)
  return absoluteCandidate
}

/**
 * Resolve and assert a path remains inside the trusted boundary root.
 *
 * @param root - Trusted filesystem root for the boundary.
 * @param candidate - Relative or absolute candidate path to validate.
 * @param boundaryName - Human-readable boundary name included in denial errors.
 * @returns The normalized absolute path when allowed.
 * @throws {Error} When the candidate traverses or resolves outside `root`.
 *
 * @example
 * ```typescript
 * const stateFile = assertPathWithinRoot('/repo/.hivemind/state', 'delegations.json', 'continuity')
 * ```
 */
export function assertPathWithinRoot(root: string, candidate: string, boundaryName: string): string {
  try {
    return resolveScopedPath(root, candidate)
  } catch {
    throw new Error(`[Harness] ${boundaryName} path escapes allowed root: ${candidate}`)
  }
}

/**
 * Check lexical path containment before any filesystem write occurs.
 *
 * @param root - Absolute trusted root.
 * @param candidate - Absolute candidate path.
 * @param originalCandidate - Original caller-provided path for error context.
 * @throws {Error} When the candidate is outside the root.
 */
function assertRelativePathInsideRoot(root: string, candidate: string, originalCandidate: string): void {
  const rel = relative(root, candidate)
  if (rel === ".." || rel.startsWith(`..${sep}`) || rel.split(/[\\/]/).includes("..")) {
    throw new Error(`[Harness] path escapes allowed root: ${originalCandidate}`)
  }
}

/**
 * Check realpath containment for existing files or the nearest existing parent.
 *
 * @param root - Absolute trusted root.
 * @param candidate - Absolute candidate path.
 * @param originalCandidate - Original caller-provided path for error context.
 * @throws {Error} When symlinks resolve outside the root.
 */
function assertRealPathInsideRoot(root: string, candidate: string, originalCandidate: string): void {
  if (!existsSync(root)) {
    return
  }
  const realRoot = realpathSync(root)
  const realCandidate = resolveExistingPath(candidate)
  if (!realCandidate) {
    return
  }

  const rel = relative(realRoot, realCandidate)
  if (rel === ".." || rel.startsWith(`..${sep}`) || rel.split(/[\\/]/).includes("..")) {
    throw new Error(`[Harness] path escapes allowed root: ${originalCandidate}`)
  }
}

/**
 * Resolve a candidate or nearest existing parent to catch symlink root escapes.
 *
 * @param candidate - Absolute candidate path.
 * @returns Realpath for the candidate or nearest existing parent, if any.
 */
function resolveExistingPath(candidate: string): string | null {
  let current = candidate
  while (!existsSync(current)) {
    const parent = dirname(current)
    if (parent === current) {
      return null
    }
    current = parent
  }
  return realpathSync(current)
}
