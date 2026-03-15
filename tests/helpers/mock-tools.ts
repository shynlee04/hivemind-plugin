/**
 * Mock Tools — Factory functions for creating test tool instances.
 *
 * Wraps the real tool creators with mock context injection
 * for isolated testing of tool behavior.
 */

import { createHivemindTaskTool } from '../../src/tools/task/index.js'
import { createHivemindTrajectoryTool } from '../../src/tools/trajectory/index.js'
import { createHivemindHandoffTool } from '../../src/tools/handoff/index.js'
import { createHivemindRuntimeStatusTool, createHivemindRuntimeCommandTool } from '../../src/tools/runtime/index.js'
import { createMockToolContext } from './mock-sdk.js'

/**
 * Create all HiveMind tools bound to a test project root.
 * Returns the tool definitions and a shared mock context.
 */
export function createTestToolSuite(projectRoot: string) {
  const context = createMockToolContext({ directory: projectRoot })

  return {
    context,
    tools: {
      task: createHivemindTaskTool(projectRoot),
      trajectory: createHivemindTrajectoryTool(projectRoot),
      handoff: createHivemindHandoffTool(projectRoot),
      runtimeStatus: createHivemindRuntimeStatusTool(projectRoot),
      runtimeCommand: createHivemindRuntimeCommandTool(projectRoot),
    },
  }
}

/**
 * Execute a tool and parse the JSON result.
 */
export async function executeAndParse<T = Record<string, unknown>>(
  toolDef: ReturnType<typeof createHivemindTaskTool>,
  args: Record<string, unknown>,
  context?: ReturnType<typeof createMockToolContext>,
): Promise<T> {
  const ctx = context ?? createMockToolContext()
  const result = await toolDef.execute(args, ctx)
  return JSON.parse(String(result)) as T
}
