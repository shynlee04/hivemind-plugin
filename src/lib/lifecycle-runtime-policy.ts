/**
 * Lifecycle runtime-policy helper.
 *
 * Extracts policy-resolution and acquire-preparation logic from
 * lifecycle-manager.ts to keep it under the AGENTS.md 500 LOC cap.
 *
 * Provides:
 *  - resolveLifecycleConcurrency: resolve per-key queue settings with audit
 */
import { resolveConcurrencyForKey } from "./runtime-policy.js"
import type { RuntimePolicy } from "./types.js"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConcurrencyAuditMeta = {
  /** The queue key that was resolved. */
  key: string
  /** Where the resolved limit came from: "perKey" or "globalLimit". */
  source: "perKey" | "globalLimit"
  /** The resolved concurrency limit. */
  resolvedLimit: number
  /** The resolved acquire timeout (undefined when not set). */
  resolvedTimeoutMs: number | undefined
}

export type ResolvedLifecycleConcurrency = {
  /** Maximum concurrent sessions for this key. */
  limit: number
  /** Optional acquire timeout in milliseconds. */
  acquireTimeoutMs: number | undefined
  /** Audit metadata recording what policy was resolved and from where. */
  audit: ConcurrencyAuditMeta
}

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

/**
 * Resolve the effective concurrency policy for a lifecycle queue key.
 *
 * Wraps `resolveConcurrencyForKey` and adds audit metadata so the delegation
 * path records which policy inputs were used — sufficient for later
 * audit/recovery without creating a second persistence source.
 *
 * @param policy - The workspace-level runtime policy.
 * @param key    - The delegation queue key (e.g., "model:gpt-5").
 * @returns Resolved concurrency settings with audit metadata.
 */
export function resolveLifecycleConcurrency(
  policy: RuntimePolicy,
  key: string,
): ResolvedLifecycleConcurrency {
  const resolved = resolveConcurrencyForKey(policy, key)
  const hasPerKey = policy.concurrency.perKey?.[key] !== undefined

  return {
    limit: resolved.limit,
    acquireTimeoutMs: resolved.acquireTimeoutMs,
    audit: {
      key,
      source: hasPerKey ? "perKey" : "globalLimit",
      resolvedLimit: resolved.limit,
      resolvedTimeoutMs: resolved.acquireTimeoutMs,
    },
  }
}
