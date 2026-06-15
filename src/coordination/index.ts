/**
 * Coordination layer barrel — explicit public exports.
 *
 * Re-exports all public surfaces from coordination submodules:
 * delegation, completion, spawner, notifier, timing, concurrency.
 *
 * Uses explicit named exports (no `export *`) per project conventions.
 *
 * @module coordination
 */

// ---------------------------------------------------------------------------
// Delegation
// ---------------------------------------------------------------------------

export { DelegationCoordinator } from "./delegation/coordinator.js"
export type {
  DispatchParams,
  ChainStep,
  DelegationCoordinatorDeps,
  ChildSessionStartParams,
  ChildSessionStartResult,
  ExecutionSignalInput,
} from "./delegation/coordinator.js"

export { DelegationManager } from "./delegation/manager.js"
export type { DelegationManagerOptions, DelegationControlRequest } from "./delegation/manager.js"

export { DelegationStateMachine } from "./delegation/state-machine.js"
export type { DelegationStateMachineOptions } from "./delegation/state-machine.js"
export {
  VALID_DELEGATION_TRANSITIONS,
  canTransitionDelegationStatus,
  deriveDelegationSurface,
  deriveRecoveryGuarantee,
  withContractDefaults,
  buildDelegationResult,
} from "./delegation/state-machine.js"

export { NotificationRouter } from "./delegation/notification-router.js"
export type { RouteResult, PendingNotificationRecord, NotificationRouterOptions } from "./delegation/notification-router.js"
export {
  formatDelegationNotification,
  formatCompactLine,
  formatToastLine,
  formatDuration,
  formatFailureNotification,
  formatFinalFailure,
  formatUrgentFailureNotification,
  typeToStatus,
  type NotificationFormatOptions,
  type FailureNotificationOptions,
} from "./delegation/notification-router.js"

export { PeriodicNotifier } from "./delegation/periodic-notifier.js"
export type { DelegationSnapshot, PeriodicNotifierConfig } from "./delegation/periodic-notifier.js"

export { DelegationMonitor } from "./delegation/monitor.js"
export type { MonitorOptions } from "./delegation/monitor.js"

export { DelegationLifecycle } from "./delegation/lifecycle.js"
export type { DelegationLifecycleStateMachine } from "./delegation/lifecycle.js"

export { DelegationDispatcher } from "./delegation/dispatcher.js"
export type { PreflightParams, PreflightResult } from "./delegation/dispatcher.js"

export { DelegationRetryHandler } from "./delegation/retry-handler.js"
export type { DelegationRetryHandlerOptions } from "./delegation/retry-handler.js"

export { SlotManager } from "./delegation/slot-manager.js"
export type { AcquireOpts, SlotHandle, SlotManagerOptions } from "./delegation/slot-manager.js"

export { AgentResolver } from "./delegation/agent-resolver.js"
export type { AgentResolverOptions } from "./delegation/agent-resolver.js"

export { FailureCheckpointTracker } from "./delegation/escalation-timer.js"

export {
  findStackableSessions,
  findResumableSessions,
  getRetryRecommendation,
  buildStackOnContext,
  buildStackingGuidanceBanner,
} from "./delegation/session-intelligence.js"
export type { StackableSession, RetryRecommendation } from "./delegation/session-intelligence.js"

export { resolveResumeStrategy, buildContinuationPrompt, buildStackOnPrompt } from "./delegation/resume-resolver.js"
export type { ResumeStrategy } from "./delegation/resume-resolver.js"

export { injectSurvivalManifest, parseSurvivalManifest, detectStaleKit } from "./delegation/survival-kit.js"
export type { DelegationSurvivalKit, StaleWarning } from "./delegation/survival-kit.js"

export { checkSemanticCompletion } from "./delegation/completion-detector.js"
export type { SemanticCompletionResult, SemanticCompletionOptions } from "./delegation/completion-detector.js"
export {
  getMessageRole,
  getMessageParts,
  findLastToolActivity,
  computeTotalToolActivityDuration,
  hasAssistantLastMessage,
  hasFileChangeIndicators,
} from "./delegation/completion-detector.js"

export { createSdkChildSessionStarter } from "./delegation/sdk-child-session-starter.js"

export { sanitizePreview, freezeDelegationPool } from "./delegation/pool-types.js"
export type { DelegationLifecycleStatus, DelegationPoolEntry, DelegationPool } from "./delegation/pool-types.js"

// ---------------------------------------------------------------------------
// Delegation types
// ---------------------------------------------------------------------------

export type {
  DelegationStatus,
  DelegationSurface,
  DelegationRecoveryGuarantee,
  DelegationTerminalKind,
  DelegationExecutionState,
  DelegationSignalSource,
  DelegationEvidenceLevel,
  Delegation,
  DelegationResult,
  DelegationNotificationType,
  FailureLevel,
  FailureCheckpointResult,
  DelegationCheckpointState,
  DelegationNotification,
  SlotInfo,
  CommandDelegationParams,
  DelegationError,
} from "./delegation/types.js"
export {
  POLLING_CADENCE,
  FAILURE_CHECKPOINTS,
  MAX_DELEGATION_DEPTH,
  DelegationErrorCode,
  createDelegationError,
} from "./delegation/types.js"

// ---------------------------------------------------------------------------
// Completion
// ---------------------------------------------------------------------------

export { CompletionDetector } from "./completion/detector.js"
export type { CompletionSignal, CompletionResult } from "./completion/detector.js"

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------

export { NotificationDeliverer, notificationDeliverer } from "./notifier.js"
export {
  notifyParentSession,
  notifyDelegationTerminal,
  reactivateSessionStream,
  replayPendingNotifications,
} from "./notifier.js"
export type { TaskNotification } from "./notifier.js"

// ---------------------------------------------------------------------------
// Command delegation
// ---------------------------------------------------------------------------

export { CommandDelegationHandler } from "./command-delegation/handler.js"
export type { HeadlessCommandState } from "./command-delegation/handler.js"

// ---------------------------------------------------------------------------
// SDK delegation
// ---------------------------------------------------------------------------

export { SdkDelegationHandler } from "./sdk-delegation/handler.js"

// ---------------------------------------------------------------------------
// Spawner
// ---------------------------------------------------------------------------

export { resolveParentWorkingDirectory } from "./spawner/parent-directory.js"
export { buildSdkSpawnRequest, resolveDelegationPermissionProfile } from "./spawner/spawn-request-builder.js"
export type { ValidatedAgent, DelegateParams } from "./spawner/spawn-request-builder.js"
export { enrichAgentFromPrimitives } from "./spawner/agent-primitive-policy.js"
export { spawnDelegatedSession } from "./spawner/session-creator.js"
export { runAutoLoop } from "./spawner/auto-loop.js"
export type { AutoLoopOptions, AutoLoopResult, AutoLoopVerification } from "./spawner/auto-loop.js"
export { runRalphLoop, escalationMessage } from "./spawner/ralph-loop.js"
export type { RalphValidation, RalphLoopOptions, RalphLoopResult } from "./spawner/ralph-loop.js"
export type { DelegationExecutionMode, DelegationPermissionProfile, DelegationSpawnRequest, DelegationSpawnResult } from "./spawner/spawner-types.js"

// ---------------------------------------------------------------------------
// Concurrency
// ---------------------------------------------------------------------------

export { DelegationConcurrencyQueue, buildDelegationQueueKey, reserveSubagentSpawn, DEFAULT_CONCURRENCY_LIMIT } from "./concurrency/queue.js"
export type { QueuePriority, QueuedTask, SpawnReservation } from "./concurrency/queue.js"

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------

export {
  POLL_INTERVAL_ACTIVE_MS,
  POLL_INTERVAL_BASE_MS,
  POLL_INTERVAL_IDLE_MS,
  POLL_INTERVAL_DEEP_IDLE_MS,
  COMMAND_POLL_INTERVAL_MS,
  MIN_IDLE_TIME_MS,
  DEFAULT_STALE_TIMEOUT_MS,
  DEFAULT_SAFETY_CEILING_MS,
  DEFAULT_TOOL_IDLE_MS,
  DEFAULT_STALE_THRESHOLD_MS,
  STABILITY_POLL_INTERVAL_MS,
  TASK_CLEANUP_DELAY_MS,
  MAX_DELEGATIONS_BEFORE_PRUNE,
  DEFAULT_PRUNE_MAX_AGE_MS,
  NOTIFICATION_RETRY_TTL_MS,
  NOTIFICATION_THROTTLE_INTERVAL_MS,
  PERIODIC_NOTIFIER_INTERVAL_MS,
  COMPLETION_STABILITY_TIMEOUT_MS,
  SDK_POLL_IDLE_LOW_MS,
  SDK_POLL_IDLE_HIGH_MS,
  SDK_RECOVERY_TIMEOUT_MS,
} from "./timing.js"
