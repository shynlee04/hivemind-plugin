/** Event consumer registry for in-process event bus wiring. */

import { eventBus, type Unsubscribe } from "./event-bus.js";
import type { ArtifactEvent } from "../schemas/events.js";
import { queueStateMutation } from "./state-mutation-queue.js";

type MutationPayload = Parameters<typeof queueStateMutation>[0]["payload"];

export interface ConsumerRegistry {
  unsubscribers: Unsubscribe[];
  registered: boolean;
}

let activeRegistry: ConsumerRegistry | null = null;

function toNonNegativeInt(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0;
}

function queueInformationalMutation(payload: Record<string, unknown>, source: string): void {
  queueStateMutation({ type: "UPDATE_STATE", payload: payload as MutationPayload, source });
}

export function registerEventConsumers(_directory: string): ConsumerRegistry {
  if (activeRegistry?.registered) return activeRegistry;
  const unsubscribers: Unsubscribe[] = [];

  unsubscribers.push(eventBus.subscribe("memory:classified", (event: ArtifactEvent) => {
    try {
      queueInformationalMutation(
        { memory_governance_increment: { category: String(event.payload.category ?? "unknown") } },
        "event-consumers.memory:classified"
      );
    } catch {}
  }));

  unsubscribers.push(eventBus.subscribe("context:consolidated", (event: ArtifactEvent) => {
    try {
      queueInformationalMutation(
        {
          memory_governance: {
            temporary_exports_consolidated_increment: toNonNegativeInt(event.payload.consolidatedCount),
          },
        },
        "event-consumers.context:consolidated"
      );
    } catch {}
  }));

  unsubscribers.push(eventBus.subscribe("context:purged", (event: ArtifactEvent) => {
    try {
      queueInformationalMutation(
        {
          memory_governance: {
            temporary_exports_purged_increment: toNonNegativeInt(event.payload.purgedTemporaryCount),
          },
        },
        "event-consumers.context:purged"
      );
    } catch {}
  }));

  unsubscribers.push(eventBus.subscribe("pending_change:verified", (_event: ArtifactEvent) => {
    try {
      // Informational bridge only.
    } catch {}
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
