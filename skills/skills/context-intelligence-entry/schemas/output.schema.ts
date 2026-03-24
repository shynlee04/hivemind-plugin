import { z } from 'zod';

const SessionTypeEnum = z.enum(['NEW', 'RESUMED', 'DEGRADED', 'DELEGATED', 'INTERRUPTED']);
const RotLevelEnum = z.enum(['CLEAN', 'SUSPECT', 'DEGRADED', 'POLLUTED', 'POISONED']);
const TrustLevelEnum = z.enum(['HIGH', 'MEDIUM', 'LOW']);
const SignalTypeEnum = z.enum(['GIT_VERIFIED', 'DOCUMENTATION', 'TYPE_CHECKED', 'LOCAL_FILE']);
const PriorityEnum = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);

const SignalSchema = z.object({
  type: SignalTypeEnum,
  applicable: z.boolean(),
  score: z.number().min(0).max(1),
  source: z.string(),
});

const ContributionSchema = z.object({
  weight: z.number().min(0).max(1),
  score: z.number().min(0).max(1),
  contribution: z.number().min(0),
});

const ActionGateSchema = z.object({
  read_files: z.boolean(),
  write_files: z.boolean(),
  delete_files: z.boolean(),
  execute_commands: z.boolean(),
  delegate: z.boolean(),
  claim_completion: z.boolean(),
});

// Advisory only. This package diagnoses context trust; it does not prove project readiness.

const QuickOutputSchema = z.object({
  timestamp: z.string(),
  version: z.string(),
  mode: z.literal('quick'),
  duration_ms: z.number().int().min(0),
  session_type: SessionTypeEnum,
  state: z.object({
    task_plan_exists: z.boolean(),
    agents_md_exists: z.boolean(),
    session_exists: z.boolean(),
    git_clean: z.boolean(),
    session_stale: z.boolean(),
  }),
  issues: z.array(z.string()),
  can_proceed: z.boolean(),
});

const RotFailureSchema = z.object({
  check: z.string(),
  reason: z.string(),
  fix: z.string(),
  details: z.array(z.string()).optional(),
});

const RotPassSchema = z.object({
  check: z.string(),
  reason: z.string(),
});

const RotOutputSchema = z.object({
  timestamp: z.string(),
  version: z.string(),
  mode: z.literal('rot'),
  duration_ms: z.number().int().min(0),
  result: z.enum(['PASS', 'FAIL']),
  passed: z.boolean(),
  checks: z.object({
    total: z.number().int().min(0),
    passed: z.number().int().min(0),
    failed: z.number().int().min(0),
  }),
  passes: z.array(RotPassSchema),
  failures: z.array(RotFailureSchema),
  action_gate: ActionGateSchema,
});

const FrameworkSchema = z.object({
  directory: z.string(),
  name: z.string(),
  score: z.number().min(0),
  findings: z.array(z.string()),
  skill_count: z.number().int().min(0),
});

const FullOutputSchema = z.object({
  timestamp: z.string(),
  version: z.string(),
  mode: z.literal('full'),
  duration_ms: z.number().int().min(0),
  session_type: SessionTypeEnum,
  rot_level: RotLevelEnum,
  rot_score: z.number().int().min(0),
  rot_points: z.object({
    governance: z.number().int().min(0),
    temporal: z.number().int().min(0),
    delegation: z.number().int().min(0),
    workflow: z.number().int().min(0),
    platform: z.number().int().min(0),
    flood: z.number().int().min(0),
  }),
  trust: z.object({
    score: z.number().min(0).max(1),
    level: TrustLevelEnum,
    signals: z.array(SignalSchema),
    breakdown: z.record(z.string(), ContributionSchema),
  }),
  dimensions: z.object({
    governance_integrity: z.object({
      checks: z.object({
        agents_md_exists: z.boolean(),
        governance_dirs_exist: z.boolean(),
        formatters_configured: z.boolean(),
        tests_exist: z.boolean(),
        project_config_exists: z.boolean(),
      }),
      rot_points: z.number().int().min(0),
    }),
    temporal_consistency: z.object({
      checks: z.object({
        is_git_repo: z.boolean(),
        has_uncommitted_changes: z.boolean(),
        merge_conflict_count: z.number().int().min(0),
        last_commit_days_ago: z.number().int().optional(),
        stale_commits: z.boolean().optional(),
      }),
      rot_points: z.number().int().min(0),
    }),
    delegation_scope: z.object({
      checks: z.object({
        has_session_state: z.boolean(),
        has_delegation_marker: z.boolean(),
        has_interrupted_marker: z.boolean(),
        multiple_context_dirs: z.number().int().min(0),
      }),
      rot_points: z.number().int().min(0),
    }),
    workflow_integrity: z.object({
      checks: z.object({
        plan_files_count: z.number().int().min(0),
        tests_exist: z.boolean(),
        merge_conflict_markers: z.number().int().min(0),
      }),
      rot_points: z.number().int().min(0),
    }),
    platform_surface: z.object({
      checks: z.object({
        primary_framework: z.string(),
        primary_framework_dir: z.string().nullable(),
        primary_framework_score: z.number().min(0),
        all_frameworks: z.array(FrameworkSchema),
        platform_dirs_found: z.array(z.string()),
        platform_dirs_count: z.number().int().min(0),
        has_root_skills: z.boolean(),
        root_skill_count: z.number().int().min(0),
      }),
      rot_points: z.number().int().min(0),
    }),
  }),
  context_flood: z.object({
    has_flood: z.boolean(),
    flood_score: z.number().int().min(0),
    issues: z.array(z.string()),
    metrics: z.object({
      activePlanningDocs: z.number().int().min(0),
      filesystemBloat: z.object({ note: z.string() }),
    }),
  }),
  action_gate: ActionGateSchema,
  recommendations: z.array(
    z.object({
      priority: PriorityEnum,
      action: z.string(),
      reason: z.string(),
    }),
  ),
});

export const ContextIntelligenceOutputSchema = z.union([
  QuickOutputSchema,
  RotOutputSchema,
  FullOutputSchema,
]);

export type ContextIntelligenceOutput = z.infer<typeof ContextIntelligenceOutputSchema>;
export type QuickOutput = z.infer<typeof QuickOutputSchema>;
export type RotOutput = z.infer<typeof RotOutputSchema>;
export type FullOutput = z.infer<typeof FullOutputSchema>;

export default ContextIntelligenceOutputSchema;
