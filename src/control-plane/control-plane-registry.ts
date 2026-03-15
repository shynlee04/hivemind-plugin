import type { PurposeClass, StartWorkInput } from '../hooks/start-work/start-work-types.js'
import { getRuntimePressureContract } from '../shared/pressure-contract.js'
import type {
  ControlPlaneCliCommand,
  ControlPlaneGateDecision,
  ControlPlanePrimitive,
  ControlPlanePrimitiveId,
} from './control-plane-types.js'

const HIGH_CONTROL_PURPOSES = new Set<PurposeClass>([
  'planning',
  'implementation',
  'gatekeeping',
  'tdd',
  'course-correction',
])

const EXPLICIT_KEYWORDS: Record<ControlPlanePrimitiveId, string[]> = {
  'hm-init': ['hm-init', '/hm-init', 'initialize hivemind', 'bootstrap hivemind', 'bootstrap control plane'],
  'hm-doctor': ['hm-doctor', '/hm-doctor', 'repair hivemind', 'repair control plane', 'doctor the control plane'],
  'hm-harness': ['hm-harness', '/hm-harness', 'run harness', 'validate readiness', 'check readiness'],
  'hm-settings': [
    'hm-settings',
    '/hm-settings',
    'update settings',
    'change settings',
    'reconfigure settings',
    'governance mode',
    'automation level',
    'artifact language',
    'chat language',
    'output style',
    'preferred user name',
    'preferred name',
    'expertise level',
  ],
}

function hasExplicitKeyword(userMessage: string, primitiveId: ControlPlanePrimitiveId): boolean {
  const normalized = userMessage.toLowerCase()
  return EXPLICIT_KEYWORDS[primitiveId].some((keyword) => normalized.includes(keyword))
}

function detectInit(input: StartWorkInput): ControlPlaneGateDecision | null {
  if (input.hasRuntimeAttachment === false || input.profileComplete === false) {
    return {
      primitiveId: 'hm-init',
      blocking: true,
      reason: 'The bootstrap profile intake is incomplete and must be collected first.',
    }
  }

  if (input.hasHivemind === false) {
    return {
      primitiveId: 'hm-init',
      blocking: true,
      reason: 'No .hivemind bootstrap state is available.',
    }
  }

  if (hasExplicitKeyword(input.userMessage, 'hm-init')) {
    return {
      primitiveId: 'hm-init',
      blocking: false,
      reason: 'The user explicitly requested control-plane bootstrap.',
    }
  }

  return null
}

function detectDoctor(input: StartWorkInput): ControlPlaneGateDecision | null {
  if (input.hivemindHealthy === false) {
    return {
      primitiveId: 'hm-doctor',
      blocking: true,
      reason: 'The .hivemind control plane is unhealthy and must be repaired first.',
    }
  }

  if (hasExplicitKeyword(input.userMessage, 'hm-doctor')) {
    return {
      primitiveId: 'hm-doctor',
      blocking: false,
      reason: 'The user explicitly requested control-plane repair or diagnosis.',
    }
  }

  return null
}

function detectHarness(input: StartWorkInput, purposeClass: PurposeClass): ControlPlaneGateDecision | null {
  if (input.hasWorkflow === false && HIGH_CONTROL_PURPOSES.has(purposeClass)) {
    return {
      primitiveId: 'hm-harness',
      blocking: false,
      reason: 'High-control work needs workflow readiness and harness validation.',
    }
  }

  if (hasExplicitKeyword(input.userMessage, 'hm-harness')) {
    return {
      primitiveId: 'hm-harness',
      blocking: false,
      reason: 'The user explicitly requested readiness validation.',
    }
  }

  return null
}

function detectSettings(input: StartWorkInput): ControlPlaneGateDecision | null {
  if (hasExplicitKeyword(input.userMessage, 'hm-settings')) {
    return {
      primitiveId: 'hm-settings',
      blocking: false,
      reason: 'The user explicitly requested control-plane profile or governance reconfiguration.',
    }
  }

  return null
}

const controlPlanePrimitives: ControlPlanePrimitive[] = [
  {
    id: 'hm-init',
    title: 'Bootstrap control plane',
    adapterCommandId: 'hm-init',
    cliCommand: 'init',
    binaryAliases: ['hm-init', 'hivemind', 'hivemind-context-governance'],
    workflowPhase: 'bootstrap-profile',
    hostEvent: 'slash-command.requested',
    purposeClasses: ['planning', 'implementation'],
    stateAuthority: 'plugin-control-plane',
    pressureContract: getRuntimePressureContract('fresh-bootstrap'),
    initiationMode: 'programmatic-required',
    manualStateWritesForbidden: true,
    requiredRuntimeTool: 'hivemind_runtime_command',
    evidenceArtifacts: ['readiness-gate', 'checkpoint', 'planning-projection'],
    requiresQuestionIntake: true,
    questionnaireId: 'bootstrap-profile-v1',
    nonInteractiveMode: 'flags-or-preset-required',
    recommendedPresetId: 'guided-onboarding',
    detect(input) {
      return detectInit(input)
    },
  },
  {
    id: 'hm-doctor',
    title: 'Repair control plane',
    adapterCommandId: 'hm-doctor',
    cliCommand: 'doctor',
    binaryAliases: ['hm-doctor'],
    workflowPhase: 'recovery-checkpoint',
    hostEvent: 'slash-command.requested',
    purposeClasses: ['course-correction', 'gatekeeping'],
    stateAuthority: 'recovery',
    pressureContract: getRuntimePressureContract('control-plane-repair'),
    initiationMode: 'programmatic-required',
    manualStateWritesForbidden: true,
    requiredRuntimeTool: 'hivemind_runtime_command',
    evidenceArtifacts: ['repair-report', 'checkpoint', 'planning-projection'],
    requiresQuestionIntake: false,
    nonInteractiveMode: 'allow-explicit-values',
    detect(input) {
      return detectDoctor(input)
    },
  },
  {
    id: 'hm-harness',
    title: 'Validate workflow readiness',
    adapterCommandId: 'hm-harness',
    cliCommand: 'harness',
    binaryAliases: ['hm-harness'],
    workflowPhase: 'workflow-readiness',
    hostEvent: 'slash-command.requested',
    purposeClasses: ['planning', 'implementation', 'gatekeeping', 'tdd'],
    stateAuthority: 'workflow',
    pressureContract: getRuntimePressureContract('workflow-readiness'),
    initiationMode: 'programmatic-required',
    manualStateWritesForbidden: true,
    requiredRuntimeTool: 'hivemind_runtime_command',
    evidenceArtifacts: ['readiness-verdict', 'checkpoint', 'planning-projection'],
    requiresQuestionIntake: false,
    nonInteractiveMode: 'allow-explicit-values',
    detect(input, purposeClass) {
      return detectHarness(input, purposeClass)
    },
  },
  {
    id: 'hm-settings',
    title: 'Reconfigure control plane settings',
    adapterCommandId: 'hm-settings',
    cliCommand: 'settings',
    binaryAliases: ['hm-settings'],
    workflowPhase: 'control-plane-reconfiguration',
    hostEvent: 'slash-command.requested',
    purposeClasses: ['planning'],
    stateAuthority: 'plugin-control-plane',
    pressureContract: getRuntimePressureContract('steady-state'),
    initiationMode: 'programmatic-required',
    manualStateWritesForbidden: true,
    requiredRuntimeTool: 'hivemind_runtime_command',
    evidenceArtifacts: ['settings-delta', 'runtime-profile'],
    requiresQuestionIntake: true,
    questionnaireId: 'settings-profile-v1',
    nonInteractiveMode: 'flags-or-preset-required',
    recommendedPresetId: 'guided-onboarding',
    detect(input) {
      return detectSettings(input)
    },
  },
]

export const CONTROL_PLANE_CLI_COMMANDS = controlPlanePrimitives.map((primitive) => primitive.cliCommand) as readonly ControlPlaneCliCommand[]

export function discoverControlPlanePrimitives(): ControlPlanePrimitive[] {
  return controlPlanePrimitives
}

export function findControlPlanePrimitive(id: ControlPlanePrimitiveId | undefined): ControlPlanePrimitive | undefined {
  if (!id) {
    return undefined
  }

  return controlPlanePrimitives.find((primitive) => primitive.id === id)
}

export function findControlPlanePrimitiveByCliCommand(command: ControlPlaneCliCommand | undefined): ControlPlanePrimitive | undefined {
  if (!command) {
    return undefined
  }

  return controlPlanePrimitives.find((primitive) => primitive.cliCommand === command)
}

export function resolveControlPlaneGate(
  input: StartWorkInput,
  purposeClass: PurposeClass,
): ControlPlaneGateDecision | null {
  for (const primitive of controlPlanePrimitives) {
    const detected = primitive.detect(input, purposeClass)
    if (detected) {
      return detected
    }
  }

  return null
}

export function isControlPlanePrimitiveId(value: string | undefined): value is ControlPlanePrimitiveId {
  return !!value && controlPlanePrimitives.some((primitive) => primitive.id === value)
}
