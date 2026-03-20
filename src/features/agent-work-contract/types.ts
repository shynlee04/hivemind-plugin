/**
 * Agent-Work Contract Feature Types
 *
 * TypeScript interfaces for store operations, classifiers, and executors.
 * These types define the contracts for engine implementations and tool integrations.
 *
 * @module agent-work-contract/types
 */

// Import schema-derived types for use in interface definitions
import type {
  AgentWorkContract,
  PurposeClass,
  ResponseMode,
  TaskStatus,
  UserIntent,
  WorkflowFrame,
  ChainActions,
  Briefing,
  AnchorPoint,
  IntentClassification,
  DelegationMode,
} from './schema/index.js'

// Re-export all schema-derived types for convenience
export type {
  AgentWorkContract,
  PurposeClass,
  DelegationMode,
  ResponseMode,
  TaskStatus,
  ChainActionTrigger,
  Task,
  UserIntent,
  WorkflowFrame,
  ChainActions,
  Briefing,
  AnchorPoint,
} from './schema/index.js'

export type { IntentSignal, IntentClassification } from './schema/intent.js'
export type {
  DelegationStatus,
  DelegationRecord,
  HandoffContext,
  HandoffPacket,
} from './schema/delegation.js'

/**
 * Contract store operations interface.
 * Defines CRUD operations for contract persistence.
 */
export interface ContractStoreOperations {
  /**
   * Create a new contract in the store.
   * @param contract - The contract to create
   */
  create(contract: AgentWorkContract): Promise<void>

  /**
   * Retrieve a contract by ID from the store.
   * @paramcontractId - The contract ID to retrieve
   @returns The contract or null if not found
   */
  get(contractId: string): Promise<AgentWorkContract | null>

  /**
   * Update an existing contract with partial updates.
   * @param contractId - The contract ID to update
   * @param updates - Partial contract fields to update
   */
  update(contractId: string, updates: Partial<AgentWorkContract>): Promise<void>

  /**
   * Delete a contract from the store.
   * @param contractId - The contract ID to delete
   */
  delete(contractId: string): Promise<void>

  /**
   * List all contracts for a given session.
   * @param sessionId - The session ID to list contracts for
   * @returns Array of contracts for the session
   */
  list(sessionId: string): Promise<AgentWorkContract[]>

  /**
   * Archive a contract (soft delete with retention).
   * @param contractId - The contract ID to archive
   */
  archive(contractId: string): Promise<void>
}

/**
 * Intent classifier result interface.
 * Output from intent classification operations.
 */
export interface IntentClassifierResult {
  /** The classified intent with confidence */
  intent: IntentClassification
  /** Overall confidence score */
  confidence: number
}

/**
 * Response mode resolver interface.
 * Determines the appropriate response mode for a purpose class.
 */
export interface ResponseModeResolver {
  /**
   * Resolve the response mode for a given purpose class.
   * @param purposeClass - The classified purpose
   * @returns The recommended response mode
   */
  resolve(purposeClass: PurposeClass): ResponseMode
}

/**
 * Anchor point type for recording workflow transitions.
 * Represents a significant shift in context or workflow state.
 */
export interface AnchorPointType {
  /** ISO timestamp when the anchor was recorded */
  timestamp: string
  /** Kind of anchor point */
  kind: 'workflow-shift' | 'planning-shift' | 'stage-shift' | 'user-redirect'
  /** Human-readable description of the transition */
  description: string
  /** Optional reference to a snapshot artifact */
  snapshotRef?: string
}

/**
 * Chain action event type for workflow automation.
 * Represents events that trigger chain actions.
 */
export type ChainActionEvent =
  | { trigger: 'onTaskComplete'; payload: { contractId: string; taskId: string } }
  | { trigger: 'onWorkflowEnd'; payload: { contractId: string } }
  | { trigger: 'onDelegation'; payload: { contractId: string; delegationId: string } }
  | { trigger: 'onCompaction80'; payload: { contractId: string } }

/**
 * Contract creation input interface.
 * Required fields for creating a new contract.
 */
export interface CreateContractInput {
  /** Unique contract identifier */
  contractId: string
  /** Session ID that owns this contract */
  sessionId: string
  /** Raw user input */
  rawIntent: string
  /** Optional delegation export session */
  delegationExportSessionId?: string
}

/**
 * Contract update input interface.
 * Partial fields for updating an existing contract.
 */
export interface UpdateContractInput {
  /** Updated user intent */
  userIntent?: Partial<UserIntent>
  /** Updated response mode */
  responseMode?: ResponseMode
  /** Updated workflow frame */
  workflow?: Partial<WorkflowFrame>
  /** Updated chain actions */
  chainActions?: Partial<ChainActions>
  /** Updated briefing */
  briefing?: Briefing
  /** Updated anchor points */
  anchors?: AnchorPoint[]
}

/**
 * Workflow task update interface.
 * Used when updating a specific task state within a workflow.
 */
export interface UpdateTaskInput {
  /** Task ID to update */
  taskId: string
  /** New status */
  status?: TaskStatus
  /** Delegation mode if applicable */
  delegationMode?: DelegationMode
  /** Delegation session ID if delegated */
  delegationSessionId?: string
  /** Evidence references */
  evidenceRefs?: string[]
}