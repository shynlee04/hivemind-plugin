/**
 * Workspace runtime policy reader.
 *
 * Reads the optional project-local policy file used to tune harness runtime
 * limits without broadening OpenCode-native permission or tool behavior.
 */
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

import type { RuntimePolicy } from "./types.js"

const POLICY_FILE_NAME = "hivemind.runtime-policy.json"

/**
 * Resolve an optional workspace runtime policy from `.hivemind/state`.
 *
 * @param projectRoot - Active OpenCode project directory.
 * @returns Parsed partial runtime policy, or `undefined` when no policy exists.
 * @throws {Error} When the policy file exists but is invalid JSON or not an object.
 *
 * @example
 * ```typescript
 * const policy = resolveWorkspaceRuntimePolicy(process.cwd());
 * ```
 */
export function resolveWorkspaceRuntimePolicy(projectRoot: string): Partial<RuntimePolicy> | undefined {
  const policyPath = path.join(projectRoot, ".hivemind", "state", POLICY_FILE_NAME)
  if (!existsSync(policyPath)) {
    return undefined
  }

  const parsed = JSON.parse(readFileSync(policyPath, "utf-8")) as unknown
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`[Hivemind] Runtime policy file ${policyPath} must contain a JSON object.`)
  }

  return parsed as Partial<RuntimePolicy>
}
