/** Event consumer registry for in-process event bus wiring. */

import { eventBus, type Unsubscribe } from "./event-bus.js";
import type { ArtifactEvent } from "../schemas/events.js";

export interface ConsumerRegistry {
  unsubscribers: Unsubscribe[];
  registered: boolean;
}

let activeRegistry: ConsumerRegistry | null = null;

/**
 * Register event consumers as informational bridges.
 *
 * These consumers listen for events on the in-process event bus
 * but do NOT queue state mutations directly. State changes for
 * these events are handled by their respective owners:
 *   - memory:classified → event-handler.ts handles classification
 *   - context:consolidated → context-purifier handles consolidation
 *   - context:purged → context-purifier handles purge accounting
 *   - pending_change:verified → tool-level verification owns state
 *
 * Future: These bridges can emit telemetry, trigger planning
 * materialization, or drive progressive disclosure — but ONLY
 * after the integration surface is fully mapped and authorized.
 */
export function registerEventConsumers(_directory: string): ConsumerRegistry {
  if (activeRegistry?.registered) return activeRegistry;
  const unsubscribers: Unsubscribe[] = [];

  unsubscribers.push(eventBus.subscribe("memory:classified", (_event: ArtifactEvent) => {
    // Informational bridge: memory classification event received.
    // State mutation ownership: event-handler.ts
    // TODO: Wire telemetry or planning materialization when integration surface is mapped.
  }));

  unsubscribers.push(eventBus.subscribe("context:consolidated", (_event: ArtifactEvent) => {
    // Informational bridge: context consolidation event received.
    // State mutation ownership: context-purifier
    // TODO: Wire telemetry or planning materialization when integration surface is mapped.
  }));

  unsubscribers.push(eventBus.subscribe("context:purged", (_event: ArtifactEvent) => {
    // Informational bridge: context purge event received.
    // State mutation ownership: context-purifier
    // TODO: Wire telemetry or planning materialization when integration surface is mapped.
  }));

  unsubscribers.push(eventBus.subscribe("pending_change:verified", (_event: ArtifactEvent) => {
    // Informational bridge: pending change verification event received.
    // State mutation ownership: tool-level verification
    // TODO: Wire telemetry or planning materialization when integration surface is mapped.
  }));

  activeRegistry = { unsubscribers, registered: true };
  return activeRegistry;
}

export function unregisterEventConsumers(registry: ConsumerRegistry): void {
  for (const unsub of registry.unsubscribers) {
    try {
      unsub();
    } catch {}
  }
  registry.registered = false;
  registry.unsubscribers = [];
  if (activeRegistry === registry) activeRegistry = null;
}
