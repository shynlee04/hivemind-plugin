import { buildContextInjectionPlan } from '../hooks/context-injection/index.js'
import { createAutoSlashCommandPlan } from '../hooks/auto-slash-command/index.js'
import { buildStartWorkEntryKernel, resolveStartWork } from '../hooks/start-work/index.js'
import { buildPluginContext } from '../plugin-handlers/index.js'
import { renderOpencodeKnowledgePacket } from '../shared/opencode-knowledge.js'
import { createRuntimeInvocation } from '../shared/runtime-invocation.js'
import { buildRuntimeAttachmentEntryKernel } from '../shared/runtime-attachment.js'
import { createTurnOutputProjection } from '../shared/turn-output.js'
import { success } from '../shared/tool-response.js'
import { previewSlashCommandBundle } from '../commands/slash-command/index.js'
import type {
  PluginRuntimeInput,
  PluginRuntimePlan,
  PluginRuntimeResponse,
  RuntimeEntryKernelContract,
} from './plugin-types.js'
import { createMessagesTransform } from './messages-transform.js'
import { createSystemTransform } from './system-transform.js'
import { createRuntimeSurfaceRegistry } from './surface-registry.js'
import { createCoreHooks } from './create-core-hooks.js'

export function buildRouteReminder(plan?: Pick<PluginRuntimePlan, 'entryKernel'>): string | null {
  const routing = plan?.entryKernel.routing
  const safety = plan?.entryKernel.safety
  if (!routing || !safety) {
    return null
  }

  const commandId = routing.requiredCommandId ?? routing.recommendedCommandId
  if (!commandId) {
    return null
  }

  return [
    '<hivemind-route-bridge>',
    `command=${commandId}`,
    `outcome=${routing.traversalOutcome}`,
    `route_disposition=${routing.routeDisposition ?? 'create'}`,
    `risk=${safety.riskLevel}`,
    `next_transition=${routing.nextTransition ?? 'none'}`,
    'execution_rule=use-hivemind-runtime-command-for-hm-bundles',
    'mutation_rule=never-bootstrap-hivemind-by-manual-file-writes',
    'intake_rule=if-bootstrap-profile-is-missing-run-the-question-tool-wizard-before-hm-init',
    'intake_rule=hm-settings-must-use-question-tool-group-selection-before-runtime-mutation',
    'question_rule=do-not-ask-free-text-permission-questions-when-a-control-plane-wizard-is-required',
    '</hivemind-route-bridge>',
  ].join('\n')
}

export async function createPluginRuntimePlan(input: PluginRuntimeInput): Promise<PluginRuntimeResponse> {
  const startWork = resolveStartWork(input.startWork)
  const startWorkKernel = buildStartWorkEntryKernel(startWork)
  const entryState = startWork.requiredControlPlaneId === 'hm-init'
    ? 'uninitialized'
    : startWork.requiredControlPlaneId === 'hm-doctor'
      ? 'repair-required'
      : 'ready'
  const qaState = entryState === 'ready' ? 'not-required' : 'pending'
  const attachmentKernel = buildRuntimeAttachmentEntryKernel({
    preferredUserName: input.promptState.preferredUserName,
    language: input.promptState.language,
    artifactLanguage: input.promptState.artifactLanguage,
    expertLevel: input.promptState.expertLevel,
    governanceMode: input.promptState.governanceMode,
    automationLevel: input.promptState.automationLevel,
    outputStyle: input.promptState.outputStyle,
    branchFocus: input.promptState.branchFocus,
    guardrails: input.promptState.guardrails,
    facilitators: input.promptState.facilitators,
    mcpReadiness: input.promptState.mcpReadiness,
    hivebrainDigest: input.promptState.hivebrainDigest,
    verificationContract: input.promptState.verificationContract,
    returnContract: input.promptState.returnContract,
    trajectoryId: input.promptState.trajectoryId,
    workflowId: input.promptState.workflowId,
    taskIds: input.promptState.taskIds,
    subtaskIds: input.promptState.subtaskIds,
    checkpointId: input.promptState.checkpointId,
    entryState,
    qaState,
    releaseState: entryState === 'ready' ? 'released' : 'blocked',
    hasRuntimeAttachment: input.startWork.hasRuntimeAttachment,
    hasHivemind: input.startWork.hasHivemind,
    hivemindHealthy: input.startWork.hivemindHealthy,
    hasWorkflow: input.startWork.hasWorkflow,
    profileComplete: input.startWork.profileComplete,
  })
  const entryKernel: RuntimeEntryKernelContract = {
    version: 'v1',
    fieldOwnership: {
      session: 'start-work',
      routing: 'start-work',
      safety: 'start-work',
      defaults: 'runtime-attachment',
      profile: 'runtime-attachment',
      bindings: 'runtime-attachment',
    },
    session: startWorkKernel.session,
    routing: startWorkKernel.routing,
    safety: startWorkKernel.safety,
    defaults: attachmentKernel.defaults,
    profile: attachmentKernel.profile,
    bindings: attachmentKernel.bindings,
  }
  const autoSlash = createAutoSlashCommandPlan(startWork)
  const pluginContext = buildPluginContext(startWork)
  const opencodeKnowledgePacket = renderOpencodeKnowledgePacket(startWork.opencodeKnowledge)
  const promptPacket = {
    sessionScope: input.promptState.sessionScope,
    systemPacket: createSystemTransform(input.promptState),
    messagePacket: createMessagesTransform(input.promptState),
  }
  const commandPreview = autoSlash.commandBinding.bundle
    ? await previewSlashCommandBundle(autoSlash.commandBinding.bundle)
    : undefined
  const runtimeInvocation = createRuntimeInvocation({
    sessionId: input.startWork.sessionId,
    parentSessionId: input.startWork.parentSessionId,
    sessionScope: input.startWork.sessionScope,
    activeAgent: input.startWork.activeAgent,
    lineage: startWork.lineage,
    trajectoryId: input.promptState.trajectoryId,
    workflowId: input.promptState.workflowId,
    taskIds: input.promptState.taskIds,
    subtaskIds: input.promptState.subtaskIds,
    gateState: entryState,
    requestReason: input.startWork.userMessage,
  })
  const turnOutputProjection = createTurnOutputProjection({
    sessionScope: input.startWork.sessionScope,
    qaState,
    parentSessionId: input.startWork.parentSessionId,
  })

  return success('Built plugin runtime orchestration plan', {
    startWork,
    entryKernel,
    autoSlash,
    pluginContext,
    opencodeKnowledge: startWork.opencodeKnowledge,
    opencodeKnowledgePacket,
    promptPacket,
    systemTransform: promptPacket.systemPacket,
    messageTransform: promptPacket.messagePacket,
    commandPreview,
    runtimeInvocation,
    turnOutputProjection,
    runtimeSurfaces: createRuntimeSurfaceRegistry(),
    hooks: createCoreHooks(),
  }, {
    injectionPlan: buildContextInjectionPlan(promptPacket),
  })
}
