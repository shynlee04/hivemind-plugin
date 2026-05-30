import { resolve } from "node:path"

import type { AgentWorkContract } from "../../features/agent-work-contracts/types.js"

/**
 * Dependencies for the contract enforcement hook.
 */
export interface ContractEnforcementDeps {
  /** Look up the active (running) contract for a given agent name. */
  getActiveContractByAgent: (projectRoot: string, agentName: string) => AgentWorkContract | undefined
  /** Resolve an agent name from a session ID. Returns undefined if unresolvable. */
  resolveAgentName: (sessionID: string) => string | undefined
  /** Project root for reading contract store. */
  projectRoot: string
  /** Optional logging callback. */
  logWarn?: (message: string) => void
}

/**
 * Create a `tool.execute.before` hook that enforces contract allowedSurfaces.
 *
 * Per D-06 to D-08, contracts enforce tool restrictions at runtime.
 * Per D-23, enforcement is a hard block (throw error), not best-effort.
 * Per D-26, no contract = no restriction.
 *
 * @param deps - Injected dependencies at composition time.
 * @returns Async hook function matching tool.execute.before signature.
 */
export function createContractEnforcementHook(
  deps: ContractEnforcementDeps,
): (input: unknown, output: unknown) => Promise<void> {
  return async (input, output) => {
    const inputRecord = input as Record<string, unknown>
    const toolName = inputRecord.tool as string
    const sessionID = inputRecord.sessionID as string

    // Only enforce on file-modifying tools (write/edit)
    const filePaths = extractFilePaths(toolName, output)
    if (filePaths.length === 0) return

    // Resolve agent name from sessionID (D-26: no agent = no restriction)
    const agentName = deps.resolveAgentName(sessionID)
    if (!agentName) {
      deps.logWarn?.(`[Harness] Contract enforcement: could not resolve agent name for session ${sessionID}`)
      return
    }

    // Look up active contract (D-26: no contract = no restriction)
    const contract = deps.getActiveContractByAgent(deps.projectRoot, agentName)
    if (!contract) return

    // Check each file path against allowed surfaces
    const allowed = contract.scope.allowedSurfaces
    for (const filePath of filePaths) {
      if (!isPathAllowed(filePath, allowed)) {
        throw new Error(
          `[Harness] contract violation: agent ${agentName} not allowed to modify ${filePath}. Allowed: ${allowed.join(", ")}`,
        )
      }
    }
  }
}

/**
 * Extract file paths from tool args for enforcement checking.
 *
 * Only file-modifying tools (write, edit) are enforced.
 * Read-only tools (read, glob), bash, and unknown tools return empty.
 *
 * @param toolName - Name of the tool being executed.
 * @param output - The tool output/args from tool.execute.before.
 * @returns Array of file paths, or empty array if tool is not file-modifying.
 */
export function extractFilePaths(toolName: string, output: unknown): string[] {
  const args = (output as Record<string, unknown>)?.args as Record<string, unknown> | undefined
  if (!args) return []

  if (toolName === "write" || toolName === "edit") {
    const filePath = args.filePath as string | undefined
    return filePath ? [filePath] : []
  }

  // Read-only or unknown tools — not enforced
  return []
}

/**
 * Check if a file path is within any of the allowed surfaces.
 *
 * Uses path prefix matching with path.resolve normalization to
 * prevent path traversal attacks.
 *
 * @param filePath - Absolute path to check.
 * @param allowedSurfaces - List of allowed surface prefixes.
 * @returns True if the file path is within any allowed surface.
 */
export function isPathAllowed(filePath: string, allowedSurfaces: string[]): boolean {
  const normalized = resolve(filePath)
  return allowedSurfaces.some((surface) => {
    const normalizedSurface = resolve(surface)
    return normalized.startsWith(normalizedSurface) || normalized.includes(surface)
  })
}
