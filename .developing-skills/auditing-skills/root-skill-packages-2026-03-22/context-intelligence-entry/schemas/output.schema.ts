/**
 * Context Intelligence Output Schema
 * 
 * Zod schema for structured context state output.
 * Agents can include this in context each iteration.
 * 
 * @version 1.0.0
 */

import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const SessionTypeEnum = z.enum([
  'NEW',
  'RESUMED',
  'DEGRADED',
  'DELEGATED',
  'INTERRUPTED'
]);

export const RotLevelEnum = z.enum([
  'CLEAN',
  'SUSPECT',
  'DEGRADED',
  'POLLUTED',
  'POISONED'
]);

export const TrustLevelEnum = z.enum([
  'HIGH',
  'MEDIUM',
  'LOW',
  'CRITICAL'
]);

export const SignalTypeEnum = z.enum([
  'LIVE_SDK',
  'USER_CONFIRM',
  'GIT_VERIFIED',
  'TYPE_CHECKED',
  'LOCAL_FILE',
  'DOCUMENTATION',
  'INHERITED',
  'UNVERIFIED',
  'CONTRADICTORY'
]);

export const PriorityEnum = z.enum([
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW'
]);

// ============================================================================
// Signal Schema
// ============================================================================

export const SignalSchema = z.object({
  type: SignalTypeEnum,
  applicable: z.boolean(),
  score: z.number().min(0).max(1),
  weight: z.number().min(0).max(1).optional(),
  contribution: z.number().min(0).max(1).optional(),
  source: z.string().optional()
});

// ============================================================================
// Rot Points Schema
// ============================================================================

export const RotPointsSchema = z.object({
  governance: z.number().int().min(0),
  temporal: z.number().int().min(0),
  delegation: z.number().int().min(0),
  workflow: z.number().int().min(0),
  platform: z.number().int().min(0),
  flood: z.number().int().min(0)
});

// ============================================================================
// Dimension Check Schemas
// ============================================================================

export const GovernanceChecksSchema = z.object({
  agents_md_exists: z.boolean(),
  governance_dirs_exist: z.boolean(),
  formatters_configured: z.boolean(),
  tests_exist: z.boolean(),
  project_config_exists: z.boolean()
});

export const TemporalChecksSchema = z.object({
  is_git_repo: z.boolean(),
  has_uncommitted_changes: z.boolean().optional(),
  last_commit_days_ago: z.number().int().optional(),
  stale_commits: z.boolean().optional(),
  has_future_dated_files: z.boolean().optional(),
  git_error: z.boolean().optional(),
  future_date_check_error: z.boolean().optional()
});

export const DelegationChecksSchema = z.object({
  has_session_state: z.boolean(),
  has_delegation_marker: z.boolean(),
  has_interrupted_marker: z.boolean(),
  multiple_context_dirs: z.number().int().min(0),
  delegation_has_scope: z.boolean().optional(),
  delegation_has_task: z.boolean().optional(),
  delegation_has_boundaries: z.boolean().optional(),
  delegation_parse_error: z.boolean().optional()
});

export const WorkflowChecksSchema = z.object({
  plan_files_count: z.number().int().min(0).optional(),
  orphaned_plan_files: z.number().int().min(0).optional(),
  plan_check_error: z.boolean().optional(),
  tests_exist: z.boolean(),
  todo_fixme_count: z.number().int().min(0).optional(),
  todo_check_error: z.boolean().optional(),
  merge_conflict_markers: z.number().int().min(0),
  merge_check_error: z.boolean().optional()
});

export const PlatformChecksSchema = z.object({
  platform_dirs_found: z.array(z.string()),
  platform_dirs_count: z.number().int().min(0),
  context_bloat: z.boolean().optional(),
  skill_counts_by_platform: z.record(z.string(), z.number()).optional(),
  has_root_skills: z.boolean(),
  broken_symlinks: z.number().int().min(0).optional(),
  symlink_check_error: z.boolean().optional()
});

// ============================================================================
// Dimension Detail Schemas
// ============================================================================

export const GovernanceIntegritySchema = z.object({
  checks: GovernanceChecksSchema,
  rot_points: z.number().int().min(0)
});

export const TemporalConsistencySchema = z.object({
  checks: TemporalChecksSchema,
  rot_points: z.number().int().min(0)
});

export const DelegationScopeSchema = z.object({
  checks: DelegationChecksSchema,
  rot_points: z.number().int().min(0)
});

export const WorkflowIntegritySchema = z.object({
  checks: WorkflowChecksSchema,
  rot_points: z.number().int().min(0)
});

export const PlatformSurfaceSchema = z.object({
  checks: PlatformChecksSchema,
  rot_points: z.number().int().min(0)
});

// ============================================================================
// Context Flood Schema
// ============================================================================

export const ContextFloodMetricsSchema = z.object({
  docs_count: z.number().int().min(0),
  plan_count: z.number().int().min(0),
  dated_docs: z.number().int().min(0),
  max_depth: z.number().int().min(0),
  draft_dirs_count: z.number().int().min(0)
});

export const ContextFloodSchema = z.object({
  has_flood: z.boolean(),
  flood_score: z.number().int().min(0),
  issues: z.array(z.string()),
  metrics: ContextFloodMetricsSchema
});

// ============================================================================
// Trust Schema
// ============================================================================

export const TrustSchema = z.object({
  score: z.number().min(0).max(1),
  level: TrustLevelEnum,
  signals: z.array(SignalSchema),
  breakdown: z.record(z.string(), z.number())
});

// ============================================================================
// Action Gate Schema
// ============================================================================

export const ActionGateSchema = z.object({
  read_files: z.boolean(),
  write_files: z.boolean(),
  delete_files: z.boolean(),
  execute_commands: z.boolean(),
  delegate: z.boolean(),
  claim_completion: z.boolean()
});

// ============================================================================
// Recommendation Schema
// ============================================================================

export const RecommendationSchema = z.object({
  priority: PriorityEnum,
  action: z.string(),
  reason: z.string()
});

// ============================================================================
// Main Output Schema
// ============================================================================

export const ContextIntelligenceOutputSchema = z.object({
  // Metadata
  timestamp: z.string().datetime(),
  version: z.string(),
  duration_ms: z.number().int().min(0),
  
  // Session classification
  session_type: SessionTypeEnum,
  
  // Rot assessment
  rot_level: RotLevelEnum,
  rot_score: z.number().int().min(0),
  rot_points: RotPointsSchema,
  
  // Trust scoring
  trust: TrustSchema,
  
  // Dimension details
  dimensions: z.object({
    governance_integrity: GovernanceIntegritySchema,
    temporal_consistency: TemporalConsistencySchema,
    delegation_scope: DelegationScopeSchema,
    workflow_integrity: WorkflowIntegritySchema,
    platform_surface: PlatformSurfaceSchema
  }),
  
  // Context flood special check
  context_flood: ContextFloodSchema,
  
  // Action gates
  action_gate: ActionGateSchema,
  
  // Recommendations
  recommendations: z.array(RecommendationSchema)
});

// ============================================================================
// Exports
// ============================================================================

export type SessionType = z.infer<typeof SessionTypeEnum>;
export type RotLevel = z.infer<typeof RotLevelEnum>;
export type TrustLevel = z.infer<typeof TrustLevelEnum>;
export type SignalType = z.infer<typeof SignalTypeEnum>;
export type Priority = z.infer<typeof PriorityEnum>;

export type Signal = z.infer<typeof SignalSchema>;
export type RotPoints = z.infer<typeof RotPointsSchema>;
export type GovernanceChecks = z.infer<typeof GovernanceChecksSchema>;
export type TemporalChecks = z.infer<typeof TemporalChecksSchema>;
export type DelegationChecks = z.infer<typeof DelegationChecksSchema>;
export type WorkflowChecks = z.infer<typeof WorkflowChecksSchema>;
export type PlatformChecks = z.infer<typeof PlatformChecksSchema>;

export type GovernanceIntegrity = z.infer<typeof GovernanceIntegritySchema>;
export type TemporalConsistency = z.infer<typeof TemporalConsistencySchema>;
export type DelegationScope = z.infer<typeof DelegationScopeSchema>;
export type WorkflowIntegrity = z.infer<typeof WorkflowIntegritySchema>;
export type PlatformSurface = z.infer<typeof PlatformSurfaceSchema>;

export type ContextFloodMetrics = z.infer<typeof ContextFloodMetricsSchema>;
export type ContextFlood = z.infer<typeof ContextFloodSchema>;
export type Trust = z.infer<typeof TrustSchema>;
export type ActionGate = z.infer<typeof ActionGateSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;

export type ContextIntelligenceOutput = z.infer<typeof ContextIntelligenceOutputSchema>;

// Default export
export default ContextIntelligenceOutputSchema;