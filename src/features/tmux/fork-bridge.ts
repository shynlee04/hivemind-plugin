/**
 * Hivemind tmux fork-bridge — runtime injection boundary.
 *
 * Phase 43 architectural decision: Hivemind NEVER imports the fork package
 * (`@hivemind/opencode-tmux`) at compile time or runtime. The fork's
 * `SessionManager` instance is injected at plugin bootstrap via
 * {@link setForkSessionManager} and consumed by the `tmux-copilot` tool via
 * {@link getForkSessionManager}. The injected adapter is opaque to the rest
 * of Hivemind.
 *
 * Why structural types instead of an import:
 * - The fork is a sibling workspace package, not a published Hivemind dep.
 *   A `import type` from `@hivemind/opencode-tmux` would require registering
 *   a TS path mapping, which is an architectural change we are explicitly
 *   deferring.
 * - Structural types mean any compatible adapter (real fork, mock, future
 *   re-implementation) can be injected without recompilation.
 *
 * The 4-adapter method surface (sendKeys / listPanes / createPaneGridPlanner /
 * respawnIfKnown) is the contract the `tmux-copilot` tool depends on. The
 * plan (D-43-02, REQ-05) authorizes a thin visibility extension on the
 * fork's `SessionManager` if the methods are not already publicly reachable.
 */
import type { EnrichedSessionEvent } from "./observers.js"

// ---------------------------------------------------------------------------
// Structural types — mirror the fork's published signatures
// ---------------------------------------------------------------------------

/**
 * Mirror of fork's `PaneTreeNode` (opencode-tmux/src/grid-planner.ts).
 * Recursive — a node has an optional `children` array of the same shape.
 */
export interface PaneTreeNode {
  id: string
  children?: PaneTreeNode[]
}

/**
 * Mirror of fork's `SplitDirection`.
 */
export type SplitDirection = "h" | "v"

/**
 * Mirror of fork's `SplitCommand` (output of PaneGridPlanner.computeSplitSequence).
 */
export interface SplitCommand {
  parentPaneId: string
  direction: SplitDirection
}

/**
 * Mirror of fork's `PaneState` (opencode-tmux/src/tmux.ts).
 */
export interface PaneState {
  paneId: string
  title: string
  isActive: boolean
  width: number
  height: number
  isMain: boolean
}

/**
 * Mirror of fork's `PaneGridPlanner` (opencode-tmux/src/grid-planner.ts).
 * Exposes the public surface the tool needs: `computeSplitSequence`.
 */
export interface PaneGridPlanner {
  computeSplitSequence: (root: PaneTreeNode) => SplitCommand[]
  requestLayout: (root: PaneTreeNode, onComputed: (commands: SplitCommand[]) => void) => void
  cancel: () => void
}

// ---------------------------------------------------------------------------
// Adapter contract
// ---------------------------------------------------------------------------

/**
 * Minimum surface the fork's `SessionManager` must expose for the
 * `tmux-copilot` tool. `onSessionCreated` is reused from `./observers.js`
 * (the canonical P42 shape). The remaining three are added by the bridge
 * to give the tool a single injection point — without crossing the
 * package boundary at compile time.
 */
export interface ForkSessionManager {
  onSessionCreated: (event: EnrichedSessionEvent) => Promise<void>
  respawnIfKnown: (sessionId: string) => Promise<{ paneId: string } | null>
  getMainPaneId: () => string | undefined
}

/**
 * The full adapter shape — `ForkSessionManager` plus direct multiplexer
 * access for `sendKeys` / `listPanes` / `createPaneGridPlanner`. These live
 * on the fork's `TmuxMultiplexer`, not on `SessionManager` itself, so the
 * bridge bundles them under one struct for ergonomic injection.
 */
export interface ForkSessionManagerAdapter extends ForkSessionManager {
  sendKeys: (paneId: string, text: string, literal?: boolean) => Promise<void>
  listPanes: (mainPaneId?: string) => Promise<PaneState[]>
  createPaneGridPlanner: () => PaneGridPlanner
}

// ---------------------------------------------------------------------------
// Module-private singleton
// ---------------------------------------------------------------------------

/**
 * Process-local adapter singleton. Replaced (not mutated) by
 * {@link setForkSessionManager}. Never exposed directly — all access goes
 * through the getter so module-private state cannot leak via reference
 * capture.
 */
let adapter: ForkSessionManagerAdapter | null = null

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Replace the current adapter. Passing `null` clears the bridge (used
 * during plugin shutdown and HMR-style hot reloads). The new adapter
 * fully replaces any prior reference — partial mutation is not supported.
 *
 * Thread-safety: not thread-safe. Single-threaded JS event loop is
 * sufficient for the plugin's synchronous bootstrap path.
 */
export function setForkSessionManager(a: ForkSessionManagerAdapter | null): void {
  adapter = a
}

/**
 * Get the current adapter, or `null` if the bridge has not been wired.
 * The tool treats `null` as a graceful "fork-not-wired" condition rather
 * than an error.
 */
export function getForkSessionManager(): ForkSessionManagerAdapter | null {
  return adapter
}
