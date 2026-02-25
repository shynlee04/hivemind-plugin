/**
 * State Mutation Queue
 *
 * CQRS-compliant state mutation mechanism for hooks.
 *
 * Problem: Hooks should be read-only (CQRS principle), but some hooks
 * need to update state (e.g., metrics, hierarchy). Direct stateManager.save()
 * calls from hooks violate CQRS.
 *
 * Solution: Hooks push mutations to this queue instead of writing directly.
 * Tools (write operations) flush the queue and apply mutations.
 *
 * Flow:
 * 1. Hook calls queueStateMutation() with partial state update
 * 2. Mutation is queued with timestamp and source
 * 3. Tool calls flushMutations() before/after write operations
 * 4. All pending mutations are merged and saved atomically
 *
 * @module lib/state-mutation-queue
 */

import type { BrainState } from "../schemas/brain-state.js";
import type { TaskManifest } from "../schemas/manifest.js";
import type { TaskNode } from "../schemas/graph-nodes.js";
import type { StateManager } from "./persistence.js";
import { createHash, randomUUID } from "node:crypto";
import { createLogger, noopLogger } from "./logging.js";
import { getEffectivePaths } from "./paths.js";
import { loadGraphTasks, saveGraphTasks } from "./graph-io.js";

// Initialize logger - use noop logger initially, replace with real logger on first use
let loggerPromise: Promise<{
  debug: (message: string) => Promise<void>;
  info: (message: string) => Promise<void>;
  warn: (message: string) => Promise<void>;
  error: (message: string) => Promise<void>;
}> | null = null;

function getLogger(): Promise<typeof noopLogger> {
  if (!loggerPromise) {
    try {
      // Get effective paths for the current project (assuming process.cwd() is project root)
      const paths = getEffectivePaths(process.cwd());
      loggerPromise = createLogger(paths.logsDir, "state-mutation-queue");
    } catch {
      // If logger initialization fails, use noop logger
      loggerPromise = Promise.resolve(noopLogger);
    }
  }
  return loggerPromise;
}

/**
 * Types of state mutations that can be queued.
 */
export type MutationType =
  | "UPDATE_STATE"
  | "UPDATE_HIERARCHY"
  | "UPDATE_METRICS"
  | "UPDATE_SESSION"
  | "UPDATE_FRAMEWORK_SELECTION";

/**
 * Represents a single pending state mutation.
 */
export interface StateMutation {
  /** Type of mutation for categorization */
  type: MutationType;
  /** Partial state to merge (deep merge for nested objects) */
  payload: Partial<BrainState>;
  /** ISO timestamp when mutation was queued */
  timestamp: string;
  /** Source identifier - which hook/function created this mutation */
  source: string;
  /** Optional priority for ordering (higher = applied first) */
  priority?: number;
}

export type TaskManifestMutationType = "UPSERT_TASKS_MANIFEST";

export type AuditMutationType = MutationType | TaskManifestMutationType;

export interface AuditEntry {
  id: string;
  type: AuditMutationType;
  source: string;
  timestamp: string;
  appliedAt: string;
  payloadKeys: string[];
  queueDepthAtApplication: number;
}

export interface TaskManifestMutation {
  type: TaskManifestMutationType;
  directory: string;
  payload: TaskManifest;
  timestamp: string;
  source: string;
  priority?: number;
}

/**
 * Global mutation queue (in-process, per-session).
 *
 * This is module-scoped (not exported) to ensure all access goes through
 * the provided API functions.
 */
const mutationQueue: StateMutation[] = [];
const taskManifestQueue: TaskManifestMutation[] = [];
const auditLog: AuditEntry[] = [];

/**
 * Maximum queue size before warning.
 * If exceeded, oldest mutations are dropped (FIFO).
 */
const MAX_QUEUE_SIZE = 100;
const MAX_AUDIT_LOG = 50;

function recordAuditEntry(entry: AuditEntry): void {
  if (auditLog.length >= MAX_AUDIT_LOG) {
    auditLog.shift();
  }
  auditLog.push(entry);
}

function getPayloadKeys(payload: unknown): string[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }
  return Object.keys(payload as Record<string, unknown>);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LEGACY_TASK_NAMESPACE = "hivemind:legacy-task-manifest";

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

function deterministicUuid(seed: string): string {
  const hash = createHash("sha1");
  hash.update(`${LEGACY_TASK_NAMESPACE}:${seed}`);
  const bytes = hash.digest();
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

function toUuidOrNull(value: unknown): string | null {
  if (!isUuid(value)) {
    return null;
  }
  return value;
}

function toIsoTimestamp(value: unknown, fallback: string): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }
  return fallback;
}

function mapLegacyTaskStatus(status: unknown): TaskNode["status"] {
  const normalized = String(status ?? "pending").toLowerCase();
  switch (normalized) {
    case "active":
      return "active";
    case "in_progress":
    case "in-progress":
      return "in_progress";
    case "complete":
    case "completed":
      return "complete";
    case "blocked":
      return "blocked";
    case "cancelled":
      return "cancelled";
    case "invalidated":
      return "invalidated";
    default:
      return "pending";
  }
}

function mapLegacyPriority(priority: unknown): TaskNode["priority"] {
  const normalized = String(priority ?? "").toLowerCase();
  if (normalized === "critical" || normalized === "high" || normalized === "medium" || normalized === "low") {
    return normalized;
  }
  return undefined;
}

function mapManifestTaskToGraphTask(
  manifest: TaskManifest,
  task: TaskManifest["tasks"][number],
  index: number,
  existingById: Map<string, TaskNode>,
  legacyIdToUuid: Map<string, string>,
  fallbackPhaseId: string,
  fallbackNowIso: string,
): TaskNode {
  const rawId = typeof task.id === "string" && task.id.trim().length > 0 ? task.id.trim() : `legacy-${index + 1}`;
  const taskId = legacyIdToUuid.get(rawId) ?? deterministicUuid(`${manifest.session_id}:task:${rawId}`);
  const existing = existingById.get(taskId);

  const related =
    task.related_entities && typeof task.related_entities === "object"
      ? (task.related_entities as Record<string, unknown>)
      : {};

  const titleCandidate = typeof task.text === "string" && task.text.trim().length > 0
    ? task.text.trim()
    : typeof (task as { title?: unknown }).title === "string"
      ? String((task as { title?: unknown }).title).trim()
      : "(untitled task)";
  const title = titleCandidate.length > 0 ? titleCandidate : `(untitled task ${index + 1})`;

  const acceptanceCriteria = Array.isArray(task.acceptance_criteria)
    ? task.acceptance_criteria.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : undefined;

  const dependencyCandidates = Array.isArray(task.dependencies)
    ? task.dependencies.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  const dependencies = dependencyCandidates
    .map((dependency) => {
      const normalized = dependency.trim();
      if (isUuid(normalized)) {
        return normalized;
      }
      return legacyIdToUuid.get(normalized) ?? deterministicUuid(`${manifest.session_id}:dependency:${normalized}`);
    })
    .filter((dependency, depIndex, arr) => dependency !== taskId && arr.indexOf(dependency) === depIndex);

  const descriptionSegments: string[] = [];
  if (typeof task.hivefiver_action === "string" && task.hivefiver_action.trim().length > 0) {
    descriptionSegments.push(`action: ${task.hivefiver_action.trim()}`);
  }
  if (typeof task.canonical_command === "string" && task.canonical_command.trim().length > 0) {
    descriptionSegments.push(`command: ${task.canonical_command.trim()}`);
  }
  if (Array.isArray(task.recommended_skills) && task.recommended_skills.length > 0) {
    const skills = task.recommended_skills.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    if (skills.length > 0) {
      descriptionSegments.push(`skills: ${skills.join(", ")}`);
    }
  }

  const description = descriptionSegments.length > 0 ? descriptionSegments.join(" | ") : existing?.description;
  const createdAt = toIsoTimestamp(task.created_at, existing?.created_at ?? fallbackNowIso);
  const updatedAt = toIsoTimestamp((task as { updated_at?: unknown }).updated_at ?? manifest.updated_at, fallbackNowIso);

  return {
    id: taskId,
    parent_phase_id: toUuidOrNull(related.phase_id) ?? existing?.parent_phase_id ?? fallbackPhaseId,
    title,
    status: mapLegacyTaskStatus(task.status),
    file_locks: existing?.file_locks ?? [],
    created_at: createdAt,
    updated_at: updatedAt,
    plan_id: toUuidOrNull(related.plan_id) ?? existing?.plan_id ?? null,
    milestone_id: toUuidOrNull(related.milestone_id) ?? existing?.milestone_id ?? null,
    project_id: toUuidOrNull(related.project_id) ?? existing?.project_id ?? null,
    description,
    acceptance_criteria: acceptanceCriteria,
    dependencies: dependencies.length > 0 ? dependencies : undefined,
    priority: mapLegacyPriority(task.priority),
  };
}

function mergeLegacyManifestIntoGraphTasks(
  manifest: TaskManifest,
  existingTasks: TaskNode[],
): TaskNode[] {
  const fallbackNowIso = new Date().toISOString();
  const fallbackPhaseId = deterministicUuid(`${manifest.session_id}:phase`);
  const existingById = new Map(existingTasks.map((task) => [task.id, task]));
  const legacyIdToUuid = new Map<string, string>();

  for (let index = 0; index < manifest.tasks.length; index += 1) {
    const task = manifest.tasks[index];
    const rawId = typeof task.id === "string" && task.id.trim().length > 0 ? task.id.trim() : `legacy-${index + 1}`;
    legacyIdToUuid.set(rawId, isUuid(rawId) ? rawId : deterministicUuid(`${manifest.session_id}:task:${rawId}`));
  }

  const merged = new Map(existingById);
  for (let index = 0; index < manifest.tasks.length; index += 1) {
    const task = manifest.tasks[index];
    const mapped = mapManifestTaskToGraphTask(
      manifest,
      task,
      index,
      existingById,
      legacyIdToUuid,
      fallbackPhaseId,
      fallbackNowIso,
    );
    merged.set(mapped.id, mapped);
  }

  return Array.from(merged.values());
}

/**
 * Queue a state mutation for later application.
 *
 * Hooks should call this instead of stateManager.save() directly.
 * Mutations are applied when tools call flushMutations().
 *
 * @param mutation - Mutation to queue (timestamp auto-generated)
 *
 * @example
 * ```typescript
 * // In a hook - queue a metrics update
 * queueStateMutation({
 *   type: "UPDATE_METRICS",
 *   payload: {
 *     metrics: {
 *       turn_count: currentTurn + 1
 *     }
 *   },
 *   source: "session-lifecycle-hook"
 * });
 * ```
 */
export function queueStateMutation(
  mutation: Omit<StateMutation, "timestamp">
): void {
  const fullMutation: StateMutation = {
    ...mutation,
    timestamp: new Date().toISOString(),
  };

  // Prevent unbounded queue growth
  if (mutationQueue.length >= MAX_QUEUE_SIZE) {
    // Capture dropped mutation BEFORE shift for accurate logging
    const dropped = mutationQueue[0];
    mutationQueue.shift();
    // Log asynchronously to avoid blocking
    getLogger().then(logger => 
      logger.warn(`Queue overflow, dropped mutation from: ${dropped?.source ?? "unknown"}`)
    ).catch(() => {
      // Ignore logging errors
    });
  }

  mutationQueue.push(fullMutation);
}

export function queueTaskManifestMutation(
  mutation: Omit<TaskManifestMutation, "timestamp">
): void {
  const fullMutation: TaskManifestMutation = {
    ...mutation,
    timestamp: new Date().toISOString(),
  };

  if (taskManifestQueue.length >= MAX_QUEUE_SIZE) {
    const dropped = taskManifestQueue[0];
    taskManifestQueue.shift();
    getLogger().then((logger) =>
      logger.warn(`Task queue overflow, dropped mutation from: ${dropped?.source ?? "unknown"}`)
    ).catch(() => {
      // Ignore logging errors
    });
  }

  taskManifestQueue.push(fullMutation);
}

/**
 * Flush all pending mutations and apply to state.
 *
 * Called by tools (write operations) to apply queued mutations.
 * Mutations are merged deeply into the current state.
 *
 * @param stateManager - State manager instance with load/save methods
 * @returns Number of mutations that were applied
 *
 * @example
 * ```typescript
 * // In a tool - flush mutations before write
 * const applied = await flushMutations(stateManager);
 * console.log(`Applied ${applied} pending mutations`);
 * ```
 */
export async function flushMutations(
  stateManager: StateManager
): Promise<number> {
  if (mutationQueue.length === 0) {
    return 0;
  }

  try {
    // Load current state
    const currentState = await stateManager.load();

    // If no state exists, we can't apply mutations - this is an error condition
    if (!currentState) {
      const logger = await getLogger();
      await logger.warn(
        "Cannot flush mutations: no state exists. " +
          "Mutations will remain queued until state is initialized."
      );
      return 0;
    }

    // Sort by priority (lower first), then by timestamp (older first)
    // This ensures higher priority mutations are applied LAST (they win in merge)
    const sortedMutations = [...mutationQueue].sort((a, b) => {
      const priorityDiff = (a.priority ?? 0) - (b.priority ?? 0);
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp.localeCompare(b.timestamp);
    });

    // Apply mutations sequentially (deep merge)
    let mergedState = currentState;
    let queueDepthAtApplication = sortedMutations.length;
    const pendingAuditEntries: AuditEntry[] = [];
    for (const mutation of sortedMutations) {
      mergedState = deepMerge(mergedState, mutation.payload);
      pendingAuditEntries.push({
        id: randomUUID(),
        type: mutation.type,
        source: mutation.source,
        timestamp: mutation.timestamp,
        appliedAt: new Date().toISOString(),
        payloadKeys: getPayloadKeys(mutation.payload),
        queueDepthAtApplication,
      });
      queueDepthAtApplication -= 1;
    }

    // Save merged state
    await stateManager.save(mergedState);

    for (const entry of pendingAuditEntries) {
      recordAuditEntry(entry);
    }

    // Clear queue after successful save
    const appliedCount = mutationQueue.length;
    mutationQueue.length = 0;

    return appliedCount;
  } catch (error) {
    const logger = await getLogger();
    await logger.error(`Flush failed: ${error instanceof Error ? error.message : String(error)}`);
    // Leave mutations in queue for retry
    throw error;
  }
}

export async function flushTaskManifestMutations(): Promise<number> {
  if (taskManifestQueue.length === 0) {
    return 0;
  }

  try {
    const sortedMutations = [...taskManifestQueue].sort((a, b) => {
      const priorityDiff = (a.priority ?? 0) - (b.priority ?? 0);
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp.localeCompare(b.timestamp);
    });

    let queueDepthAtApplication = sortedMutations.length;
    for (const mutation of sortedMutations) {
      const current = await loadGraphTasks(mutation.directory, { enabled: false });
      const nextTasks = mergeLegacyManifestIntoGraphTasks(mutation.payload, current.tasks);
      await saveGraphTasks(mutation.directory, {
        version: current.version,
        tasks: nextTasks,
      });
      recordAuditEntry({
        id: randomUUID(),
        type: mutation.type,
        source: mutation.source,
        timestamp: mutation.timestamp,
        appliedAt: new Date().toISOString(),
        payloadKeys: getPayloadKeys(mutation.payload),
        queueDepthAtApplication,
      });
      queueDepthAtApplication -= 1;
    }

    const appliedCount = taskManifestQueue.length;
    taskManifestQueue.length = 0;
    return appliedCount;
  } catch (error) {
    const logger = await getLogger();
    await logger.error(
      `Task manifest flush failed: ${error instanceof Error ? error.message : String(error)}`
    );
    throw error;
  }
}

/**
 * Get the count of pending mutations.
 *
 * Useful for debugging and monitoring queue health.
 *
 * @returns Number of mutations waiting to be applied
 */
export function getPendingMutationCount(): number {
  return mutationQueue.length;
}

export function getPendingTaskManifestMutationCount(): number {
  return taskManifestQueue.length;
}

export function getAuditLog(): AuditEntry[] {
  return [...auditLog];
}

export function getAuditLogBySource(source: string): AuditEntry[] {
  return auditLog.filter((entry) => entry.source === source);
}

export function clearAuditLog(): void {
  auditLog.length = 0;
}

export function getAuditLogSummary(): {
  totalApplied: number;
  sources: Record<string, number>;
  oldestEntry: string | null;
  newestEntry: string | null;
} {
  const sources = auditLog.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.source] = (acc[entry.source] ?? 0) + 1;
    return acc;
  }, {});

  return {
    totalApplied: auditLog.length,
    sources,
    oldestEntry: auditLog[0]?.id ?? null,
    newestEntry: auditLog[auditLog.length - 1]?.id ?? null,
  };
}

/**
 * Get a snapshot of pending mutations (for debugging).
 *
 * Returns copies to prevent external modification.
 *
 * @returns Array of pending mutation snapshots
 */
export function getPendingMutations(): StateMutation[] {
  return [...mutationQueue];
}

export function applyPendingStateMutations(baseState: BrainState): BrainState {
  if (mutationQueue.length === 0) {
    return baseState;
  }

  const sortedMutations = [...mutationQueue].sort((a, b) => {
    const priorityDiff = (a.priority ?? 0) - (b.priority ?? 0);
    if (priorityDiff !== 0) return priorityDiff;
    return a.timestamp.localeCompare(b.timestamp);
  });

  let projected = baseState;
  for (const mutation of sortedMutations) {
    projected = deepMerge(projected, mutation.payload);
  }
  return projected;
}

/**
 * Clear the mutation queue without applying.
 *
 * Use with caution - primarily for tests and error recovery.
 */
export function clearMutationQueue(): void {
  mutationQueue.length = 0;
  taskManifestQueue.length = 0;
  auditLog.length = 0;
}

/**
 * Deep merge helper for state mutations.
 *
 * Merges nested objects recursively, arrays are replaced (not concatenated).
 * Primitive values are overwritten.
 *
 * @param target - Base object to merge into
 * @param source - Partial object with updates
 * @returns New merged object (does not mutate inputs)
 */
function deepMerge<T>(target: T, source: Partial<T>): T {
  // Handle non-objects or null
  if (
    target === null ||
    target === undefined ||
    source === null ||
    source === undefined
  ) {
    return source !== undefined ? (source as T) : target;
  }

  if (typeof target !== "object" || typeof source !== "object") {
    return source as T;
  }

  const result = { ...target } as T;

  for (const key of Object.keys(source) as (keyof T)[]) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (
      sourceValue !== undefined &&
      sourceValue !== null &&
      typeof sourceValue === "object" &&
      !Array.isArray(sourceValue) &&
      targetValue !== undefined &&
      targetValue !== null &&
      typeof targetValue === "object" &&
      !Array.isArray(targetValue)
    ) {
      // Deep merge nested objects
      (result as Record<string, unknown>)[key as string] = deepMerge(
        targetValue,
        sourceValue
      );
    } else {
      // Replace primitives and arrays
      (result as Record<string, unknown>)[key as string] = sourceValue;
    }
  }

  return result;
}

/**
 * Check if there are pending mutations for a specific source.
 *
 * @param source - Source identifier to check
 * @returns True if mutations exist from this source
 */
export function hasPendingMutationsFrom(source: string): boolean {
  return mutationQueue.some((m) => m.source === source);
}

/**
 * Get mutations from a specific source (for debugging).
 *
 * @param source - Source identifier to filter by
 * @returns Array of mutations from the specified source
 */
export function getMutationsBySource(source: string): StateMutation[] {
  return mutationQueue.filter((m) => m.source === source);
}
