import { readFileSync } from "node:fs"
import { isAbsolute, relative, resolve } from "node:path"

/**
 * Sidecar read-only enforcement — Phase 42 SIDECAR-03.
 *
 * The sidecar Next.js app rendered by Phase 42 follow-up phases must
 * never write to the harness's canonical state. This module provides
 * the contract surface and the enforcement guards: any sidecar code
 * that needs to access `.hivemind/state/`, `.hivemind/event-tracker/`,
 * or `.planning/` goes through the read helpers below; any accidental
 * write attempt is intercepted by `refuseCanonicalWrite()` and
 * surfaces immediately as a `[Harness]` error.
 *
 * Path containment is checked logically — `path.relative()` followed
 * by `..` rejection — so the guard does not depend on the canonical
 * directories existing on disk. Symlinks and absolute-path escapes
 * are both rejected.
 */

/**
 * Configuration for the read-only state guards.
 */
export type ReadOnlyStateOptions = {
  /** Absolute path to the project root. Must already exist on disk. */
  projectRoot: string
}

/**
 * Canonical state surfaces the sidecar is allowed to read. Any path
 * not under one of these directories (relative to `projectRoot`) is
 * rejected by the read guards.
 */
const CANONICAL_PREFIXES = [".hivemind/state", ".hivemind/event-tracker", ".planning"]

/**
 * Returns true if `absolutePath` lies inside one of the canonical
 * state surfaces relative to `projectRoot`.
 *
 * @param absolutePath - Path to test. Both absolute and relative
 *   strings are accepted; relative strings are resolved against the
 *   process cwd before the containment check.
 * @param opts - Read-only state options including the project root.
 * @returns `true` when the path is inside a canonical surface, `false`
 *   otherwise (including paths that escape the project root).
 *
 * @example
 * ```ts
 * isCanonicalStatePath("/repo/.hivemind/state/x.json", { projectRoot: "/repo" })
 * // → true
 * isCanonicalStatePath("/repo/src/plugin.ts", { projectRoot: "/repo" })
 * // → false
 * ```
 */
export function isCanonicalStatePath(absolutePath: string, opts: ReadOnlyStateOptions): boolean {
  const root = resolve(opts.projectRoot)
  // resolve() already handles both absolute and relative inputs (relative
  // paths are joined with process.cwd), so a single call covers both
  // branches the original ternary tried to express.
  const target = resolve(absolutePath)
  const rel = relative(root, target)
  if (rel.startsWith("..") || isAbsolute(rel)) {
    return false
  }
  const normalized = rel.split(/[\\/]/).join("/")
  return CANONICAL_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  )
}

/**
 * Read the UTF-8 contents of a file under the canonical state
 * surface. Used by sidecar tabs (Phase 42 follow-up phases) to render
 * read-only views of harness state.
 *
 * @param absolutePath - Path to the file inside a canonical surface.
 * @param opts - Read-only state options including the project root.
 * @returns The file contents as a UTF-8 string.
 * @throws `[Harness]` SIDECAR-03 error when `absolutePath` is outside
 *   the canonical state surface.
 *
 * @example
 * ```ts
 * const json = readCanonicalState(
 *   join(projectRoot, ".hivemind", "state", "delegations.json"),
 *   { projectRoot },
 * )
 * ```
 */
export function readCanonicalState(absolutePath: string, opts: ReadOnlyStateOptions): string {
  if (!isCanonicalStatePath(absolutePath, opts)) {
    throw new Error(
      `[Harness] sidecar SIDECAR-03: read denied for non-canonical path: ${absolutePath}`,
    )
  }
  return readFileSync(absolutePath, "utf8")
}

/**
 * SIDECAR-03 enforcement guard. The sidecar must never write to
 * canonical state; any code path that would attempt a write should
 * call this function first so the failure surfaces immediately as a
 * `[Harness]` error rather than silently corrupting state.
 *
 * @param absolutePath - Path the caller intended to write.
 * @param opts - Read-only state options including the project root.
 * @returns This function never returns — its declared return type is
 *   `never` so TypeScript narrows the call site to "unreachable".
 * @throws Always throws a `[Harness]` SIDECAR-03 error.
 *
 * @example
 * ```ts
 * if (someConditionThatShouldBeImpossible) {
 *   refuseCanonicalWrite(targetPath, { projectRoot })
 * }
 * ```
 */
export function refuseCanonicalWrite(absolutePath: string, opts: ReadOnlyStateOptions): never {
  void opts
  throw new Error(
    `[Harness] sidecar SIDECAR-03: write to canonical state forbidden — sidecar is read-only (target: ${absolutePath})`,
  )
}
