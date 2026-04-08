/**
 * Runtime policy module — single seam for Phase 02 runtime configuration.
 *
 * Provides:
 *  - DEFAULT_RUNTIME_POLICY: hardcoded defaults matching current production
 *  - loadRuntimePolicy: validate and merge workspace-level policy
 *  - getRuntimePolicyForSession: resolve per-session overrides
 *
 * RESEARCH D-16 (built-in-first):
 * OpenCode already provides hook/session surfaces for tool budgets, loop
 * detection, and retry resolution. This policy layer ONLY supplements the
 * missing per-key concurrency and per-session threshold behavior. It does
 * NOT replace or duplicate OpenCode-native enforcement.
 */
import type {
  BudgetPolicy,
  ConcurrencyPolicy,
  ResolvedBudgetPolicy,
  RuntimePolicy,
  SessionPolicyOverride,
} from "./types.js"

// ---------------------------------------------------------------------------
// Default policy — mirrors current production constants
// ---------------------------------------------------------------------------

export const DEFAULT_RUNTIME_POLICY: RuntimePolicy = {
  concurrency: {
    globalLimit: 3,
  },
  budget: {
    maxToolCallsPerSession: 400,
    repeatedSignatureThreshold: 16,
    warningCap: 25,
    resetOnCompact: true,
  },
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function validateConcurrencyPolicy(policy: ConcurrencyPolicy): void {
  if (policy.globalLimit <= 0) {
    throw new Error(
      `[Harness] Invalid concurrency policy: globalLimit must be positive, got ${policy.globalLimit}.`,
    )
  }
  if (policy.perKey) {
    for (const [key, perKey] of Object.entries(policy.perKey)) {
      if (perKey.limit <= 0) {
        throw new Error(
          `[Harness] Invalid concurrency policy: per-key limit for "${key}" must be positive, got ${perKey.limit}.`,
        )
      }
      if (perKey.acquireTimeoutMs !== undefined && perKey.acquireTimeoutMs < 0) {
        throw new Error(
          `[Harness] Invalid concurrency policy: per-key acquireTimeoutMs for "${key}" must be non-negative, got ${perKey.acquireTimeoutMs}.`,
        )
      }
    }
  }
}

function validateBudgetPolicy(policy: BudgetPolicy): void {
  if (policy.maxToolCallsPerSession <= 0) {
    throw new Error(
      `[Harness] Invalid budget policy: maxToolCallsPerSession must be positive, got ${policy.maxToolCallsPerSession}.`,
    )
  }
  if (policy.repeatedSignatureThreshold <= 0) {
    throw new Error(
      `[Harness] Invalid budget policy: repeatedSignatureThreshold must be positive, got ${policy.repeatedSignatureThreshold}.`,
    )
  }
  if (policy.warningCap <= 0) {
    throw new Error(
      `[Harness] Invalid budget policy: warningCap must be positive, got ${policy.warningCap}.`,
    )
  }
}

// ---------------------------------------------------------------------------
// Policy loaders
// ---------------------------------------------------------------------------

/**
 * Load and validate a workspace-level runtime policy.
 *
 * @param workspacePolicy - Optional workspace-level policy. When omitted or
 *   empty, returns DEFAULT_RUNTIME_POLICY.
 * @returns A fully-resolved RuntimePolicy with all fields populated.
 * @throws [Harness]-prefixed Error when limits are out of valid range.
 */
export function loadRuntimePolicy(
  workspacePolicy?: Partial<RuntimePolicy>,
): RuntimePolicy {
  const concurrency: ConcurrencyPolicy = {
    globalLimit:
      workspacePolicy?.concurrency?.globalLimit ??
      DEFAULT_RUNTIME_POLICY.concurrency.globalLimit,
    perKey: workspacePolicy?.concurrency?.perKey,
  }

  const budget: BudgetPolicy = {
    maxToolCallsPerSession:
      workspacePolicy?.budget?.maxToolCallsPerSession ??
      DEFAULT_RUNTIME_POLICY.budget.maxToolCallsPerSession,
    repeatedSignatureThreshold:
      workspacePolicy?.budget?.repeatedSignatureThreshold ??
      DEFAULT_RUNTIME_POLICY.budget.repeatedSignatureThreshold,
    warningCap:
      workspacePolicy?.budget?.warningCap ??
      DEFAULT_RUNTIME_POLICY.budget.warningCap,
    resetOnCompact:
      workspacePolicy?.budget?.resetOnCompact ??
      DEFAULT_RUNTIME_POLICY.budget.resetOnCompact,
  }

  validateConcurrencyPolicy(concurrency)
  validateBudgetPolicy(budget)

  return { concurrency, budget }
}

/**
 * Resolve the effective runtime policy for a specific session.
 *
 * Per-session overrides take precedence over workspace-level defaults.
 * Both the workspace policy and the session override are validated before
 * being applied — out-of-range values throw [Harness] errors.
 *
 * RESEARCH D-16: Session overrides come from trusted continuity/delegation
 * metadata only (not arbitrary tool args). This prevents silent limit
 * escalation from untrusted sources (threat T-02-03).
 *
 * @param workspacePolicy - Workspace-level policy (already validated or default).
 * @param sessionOverride - Optional per-session overrides from delegation metadata.
 * @returns Fully-resolved policy for this session.
 * @throws [Harness]-prefixed Error when session override values are invalid.
 */
export function getRuntimePolicyForSession(
  workspacePolicy: RuntimePolicy,
  sessionOverride?: SessionPolicyOverride,
): RuntimePolicy {
  if (!sessionOverride) {
    return workspacePolicy
  }

  // Merge concurrency overrides
  const concurrency: ConcurrencyPolicy = {
    globalLimit:
      sessionOverride.concurrency?.globalLimit ??
      workspacePolicy.concurrency.globalLimit,
    perKey:
      sessionOverride.concurrency?.perKey ??
      workspacePolicy.concurrency.perKey,
  }

  // Merge budget overrides (partial override wins per-field)
  const budget: BudgetPolicy = {
    maxToolCallsPerSession:
      sessionOverride.budget?.maxToolCallsPerSession ??
      workspacePolicy.budget.maxToolCallsPerSession,
    repeatedSignatureThreshold:
      sessionOverride.budget?.repeatedSignatureThreshold ??
      workspacePolicy.budget.repeatedSignatureThreshold,
    warningCap:
      sessionOverride.budget?.warningCap ??
      workspacePolicy.budget.warningCap,
    resetOnCompact:
      sessionOverride.budget?.resetOnCompact ??
      workspacePolicy.budget.resetOnCompact,
  }

  // Validate the merged result
  validateConcurrencyPolicy(concurrency)
  validateBudgetPolicy(budget)

  return { concurrency, budget }
}

// ---------------------------------------------------------------------------
// Convenience resolvers for hook consumers
// ---------------------------------------------------------------------------

/**
 * Resolve the effective per-key concurrency policy for a given lane key.
 *
 * Falls back to the global limit when no per-key override exists.
 */
export function resolveConcurrencyForKey(
  policy: RuntimePolicy,
  key: string,
): { limit: number; acquireTimeoutMs?: number } {
  const perKey = policy.concurrency.perKey?.[key]
  return {
    limit: perKey?.limit ?? policy.concurrency.globalLimit,
    acquireTimeoutMs: perKey?.acquireTimeoutMs,
  }
}

/**
 * Resolve the effective budget policy for a session.
 *
 * This is the budget analogue of resolveConcurrencyForKey — it returns
 * the full budget policy for use by the tool guard hooks.
 */
export function resolveBudgetForSession(
  policy: RuntimePolicy,
): ResolvedBudgetPolicy {
  return { ...policy.budget }
}
