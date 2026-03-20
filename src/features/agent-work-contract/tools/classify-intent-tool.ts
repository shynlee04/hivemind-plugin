import { tool, type ToolContext } from '@opencode-ai/plugin/tool'

import { classifyIntent } from '../engine/intent-classifier.js'
import { IntentClassificationSchema } from '../schema/index.js'
import { error, success } from '../../../shared/tool-response.js'
import { renderToolResult } from '../../../shared/tool-helpers.js'

export const HIVEMIND_AGENT_WORK_CLASSIFY_INTENT_TOOL_ID = 'hivemind_agent_work_classify_intent'

function createMetadata(title: string, context: ToolContext, purposeClass: string, responseMode: string) {
  return {
    title,
    metadata: {
      toolId: HIVEMIND_AGENT_WORK_CLASSIFY_INTENT_TOOL_ID,
      sessionID: context.sessionID,
      agent: context.agent,
      directory: context.directory,
      worktree: context.worktree,
      purposeClass,
      responseMode,
    },
  }
}

export function createAgentWorkClassifyIntentTool(_projectRoot: string): ReturnType<typeof tool> {
  return tool({
    description:
      'Classify raw user intent through the agent-work contract intent engine and return validated classification output.',
    args: {
      rawIntent: tool.schema.string().min(1).describe('Raw user intent text to classify.'),
    },
    async execute(args, context) {
      try {
        const classification = IntentClassificationSchema.parse(await classifyIntent(args.rawIntent))
        context.metadata(
          createMetadata(
            'Agent-work intent classified',
            context,
            classification.intent.purposeClass,
            classification.suggestedResponseMode,
          ),
        )
        return renderToolResult(success('Classified agent-work intent', { classification }))
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : 'Unknown classify-intent tool failure'
        return renderToolResult(error(message))
      }
    },
  })
}
