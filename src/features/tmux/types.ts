/**
 * Hivemind tmux feature — shared types.
 *
 * The TypeScript types previously scattered across `fork-bridge.ts` and
 * re-imported from there by the `tmux-copilot` tool now live here as the
 * authoritative in-tree contract. All three new class modules
 * (`tmux-multiplexer.ts`, `session-manager.ts`, `grid-planner.ts`) import
 * from this file, and the `tmux-copilot` tool imports from here directly.
 *
 * Migration history:
 * - P51-2026-06-02: Replaces fork-bridge.ts as the canonical type home.
 *   `ForkSessionManager`/`ForkSessionManagerAdapter` are renamed to
 *   `SessionManagerAdapter` (and an `EnrichedSessionEvent` alias is added)
 *   because the adapter is no longer a "fork" adapter — it is the real
 *   in-tree SessionManager + TmuxMultiplexer bundle.
 *
 * ORIGIN: opencode-tmux/src/grid-planner.ts:23-33 (PaneTreeNode /
 *   SplitDirection / SplitCommand) — PaneTreeNode, SplitDirection,
 *   SplitCommand carried forward as structural types (fork-bridge.ts:34-50).
 *   No code change vs. fork: the public surface of the planner is purely
 *   data shapes that serialize through the IPC boundary, so the in-tree
 *   definitions MUST be byte-identical to the fork for round-trip
 *   compatibility with any persisted snapshots.
 *
 * ORIGIN: opencode-tmux/src/tmux.ts:13-20 (PaneState) — Mirrored from fork;
 *   the field set is the on-the-wire contract for the `tmux list-panes`
 *   format string #{pane_id}\t#{pane_title}\t#{pane_active}\t#{pane_width}x#{pane_height}.
 */
import type { EnrichedSessionEvent } from "./observers.js"

// ---------------------------------------------------------------------------
// Pane tree primitives (carried forward from fork-bridge.ts:34-50)
// ---------------------------------------------------------------------------

/**
 * A node in a logical pane tree. Recursive — a node has an optional
 * `children` array of the same shape.
 *
 * ORIGIN: opencode-tmux/src/grid-planner.ts:23-26
 */
export interface PaneTreeNode {
  id: string;
  children?: PaneTreeNode[];
}

/**
 * Direction of a tmux `split-window` command.
 * - "h" → horizontal split (top/bottom layout, used for depth-1 children)
 * - "v" → vertical split (left/right layout, used for depth-2+ children)
 *
 * ORIGIN: opencode-tmux/src/grid-planner.ts:28
 */
export type SplitDirection = "h" | "v";

/**
 * One `split-window` instruction emitted by the planner. `parentPaneId`
 * is the tmux pane id that must exist BEFORE the split is executed
 * (parents must be created in DFS preorder before their children).
 *
 * ORIGIN: opencode-tmux/src/grid-planner.ts:30-33
 */
export interface SplitCommand {
  parentPaneId: string;
  direction: SplitDirection;
}

// ---------------------------------------------------------------------------
// Pane state (carried forward from fork-bridge.ts:55-62)
// ---------------------------------------------------------------------------

/**
 * Parsed pane state from one line of `tmux list-panes` output. The
 * `isMain` flag is computed client-side from a `mainPaneId` argument —
 * tmux itself does not flag the main pane.
 *
 * ORIGIN: opencode-tmux/src/tmux.ts:13-20
 */
export interface PaneState {
  paneId: string;
  title: string;
  isActive: boolean;
  width: number;
  height: number;
  isMain: boolean;
}

// ---------------------------------------------------------------------------
// Planner public contract
// ---------------------------------------------------------------------------

/**
 * Public consumer-facing surface of the planner. The only method the
 * `tmux-copilot` tool needs is `computeSplitSequence`. The `requestLayout`
 * (debounced) and `cancel` (debounce-clear) methods are part of the
 * in-tree class implementation but are intentionally NOT exposed on the
 * public adapter contract — they are not called from outside the planner
 * itself.
 *
 * ORIGIN: opencode-tmux/src/grid-planner.ts:35-113 (full class surface);
 *   this is the public narrow view.
 */
export interface PaneGridPlanner {
  computeSplitSequence: (root: PaneTreeNode) => SplitCommand[];
}

/**
 * Internal full surface of the planner. Exported for documentation and
 * for any future in-tree replacement class that needs to implement the
 * wider interface. Not returned by the adapter contract — see
 * {@link PaneGridPlanner} for the public consumer view.
 */
export interface PaneGridPlannerInternal extends PaneGridPlanner {
  requestLayout: (
    root: PaneTreeNode,
    onComputed: (commands: SplitCommand[]) => void,
  ) => void;
  cancel: () => void;
}

// ---------------------------------------------------------------------------
// Session manager adapter (replaces fork-bridge.ts:103-119)
// ---------------------------------------------------------------------------

/**
 * Aliased re-export of the enriched session.created event. Consumers
 * (e.g. `tmux-copilot` tool, the Hivemind event observer) import
 * `EnrichedSessionEvent` from this module instead of reaching into
 * `./observers.js` directly — keeps all tmux-feature types under one
 * namespace.
 */
export type { EnrichedSessionEvent };

/**
 * Adapter shape returned by `createTmuxIntegrationIfSupported` in the
 * rewritten `integration.ts`. Bundles the public method surface of the
 * in-tree `SessionManager` + `TmuxMultiplexer` + a planner factory, so
 * the `tmux-copilot` tool has a single injection point.
 *
 * Replaces the previous `ForkSessionManagerAdapter` from
 * `fork-bridge.ts:115-119`. The method set is identical (sendKeys,
 * listPanes, createPaneGridPlanner, respawnIfKnown, onSessionCreated,
 * getMainPaneId) — only the type name changes, because the source is
 * no longer a fork package; it is the real in-tree implementation.
 *
 * The signatures here are the authoritative contract — they MUST match
 * the in-tree class methods exactly:
 * - `SessionManager.onSessionCreated` / `respawnIfKnown` (session-manager.ts)
 * - `TmuxMultiplexer.getMainPaneId` / `sendKeys` / `listPanes` (tmux-multiplexer.ts)
 * - `new PaneGridPlanner(debounceMs?)` constructor
 *
 * P58.8 (S1, REQ-58-07) extension: `getLatestCapture` and `startPolling`
 * are added to the adapter so the `tmux-copilot peek` action (S2, user
 * tier) and any other future tool can read the most recent capture-pane
 * content without re-running the tmux CLI.
 */
export interface SessionManagerAdapter {
  // From SessionManager
  onSessionCreated: (event: EnrichedSessionEvent) => Promise<void>;
  respawnIfKnown: (sessionId: string) => Promise<{ paneId: string } | null>;
  /** P58.8 S1: read the most recent capture-pane record for a pane id. */
  getLatestCapture?: (paneId: string) => { content: string; capturedAt: number; byteLength: number } | null;
  /** P58.8 S1: ensure the 5s capture-pane polling loop is running. */
  startPolling?: (intervalMs?: number) => void;
  // From TmuxMultiplexer
  getMainPaneId: () => Promise<string | null>;
  sendKeys: (paneId: string, text: string, literal?: boolean) => Promise<void>;
  listPanes: (mainPaneId?: string) => Promise<PaneState[]>;
  // Planner factory (closes over nothing — the planner is stateless
  // per call, debounceMs is forwarded to the new PaneGridPlanner)
  createPaneGridPlanner: (debounceMs?: number) => PaneGridPlanner;
  // P58.9 REQ-58.9-01: forward pane-captured events from the SessionManager
  // polling tick to the PaneObserver interface. The SessionManager calls
  // this method (synchronously) inside the hash-change block. The plugin
  // composition root wires the real TmuxEventObserver to the SessionManager
  // via `sessionManager.setObserver(adapter)`. Errors thrown here are
  // swallowed by the SessionManager (D-04 silent-fallback).
  onPaneCaptured: (event: import("./observers.js").PaneCapturedEvent) => void;
}

// ---------------------------------------------------------------------------
// Module-level adapter bridge
// ---------------------------------------------------------------------------
//
// The `SessionManagerAdapter` is owned by the `TmuxIntegration` factory
// (`./integration.ts`). The factory constructs the multiplexer + session
// manager at plugin-init time, then publishes the resulting adapter to
// a module-level slot so the `tmux-copilot` tool (which is constructed
// at SDK-tool-registration time, before any plugin-init logic runs) can
// look it up at execute() time.
//
// This replaces the fork-bridge `setForkSessionManager` /
// `getForkSessionManager` pattern. The pattern is preserved (module-level
// mutable state) but the name and type changed to reflect the in-tree
// surface. Replace-only semantics: a second `setSessionManagerAdapter`
// call OVERWRITES the previous value (matches the fork-bridge HMR-safe
// behavior).

let currentAdapter: SessionManagerAdapter | null = null;

/**
 * Publish a `SessionManagerAdapter` so the `tmux-copilot` tool can
 * consume it. Called by `createTmuxIntegrationIfSupported` after the
 * multiplexer + session manager are constructed.
 *
 * @param adapter the adapter to publish, or `null` to clear
 */
export function setSessionManagerAdapter(adapter: SessionManagerAdapter | null): void {
  currentAdapter = adapter;
}

/**
 * Get the currently-published `SessionManagerAdapter`, or `null` if the
 * integration factory has not yet run (or the integration is not
 * available in this environment). Used by `tmux-copilot.ts:execute`
 * to dispatch actions.
 */
export function getSessionManagerAdapter(): SessionManagerAdapter | null {
  return currentAdapter;
}

// ---------------------------------------------------------------------------
// P59 A2: sessionId → paneId registry
// ---------------------------------------------------------------------------
//
// Maps child session IDs to their tmux pane IDs so that the peek-by-session
// action can resolve a sessionId to a paneId without requiring extra tool
// calls. Populated by the tmux integration when a child session is spawned
// (via `registerSessionToPaneId`). Read by tmux-copilot's peek-by-session
// action.

const sessionPaneRegistry = new Map<string, string>()

/**
 * Register a mapping from a session ID to a tmux pane ID.
 * Called by the tmux integration when a child session is spawned in a pane.
 */
export function registerSessionToPaneId(sessionId: string, paneId: string): void {
  sessionPaneRegistry.set(sessionId, paneId)
}

export function resolveSessionToPaneId(sessionId: string): string | undefined {
  return sessionPaneRegistry.get(sessionId)
}

// ---------------------------------------------------------------------------
// Prompt injection into child sessions (P59 R2). Wired by plugin.ts during
// integration factory so the tmux-copilot take-over action can inject
// structured prompts into running child sessions without importing the
// full SDK client.
// ---------------------------------------------------------------------------

export type SendPromptMode = { noReply: true } | { noReply: false }

let currentSendPrompt: ((sessionId: string, text: string, mode?: SendPromptMode) => Promise<void>) | null = null

export function setSendPrompt(fn: ((sessionId: string, text: string, mode?: SendPromptMode) => Promise<void>) | null): void {
  currentSendPrompt = fn
}

export function getSendPrompt(): ((sessionId: string, text: string, mode?: SendPromptMode) => Promise<void>) | null {
  return currentSendPrompt
}

// ---------------------------------------------------------------------------
// Session messages (P59 R4) — wired by plugin.ts so peek can return
// structured activity summaries (tool calls, assistant messages, file
// changes) instead of just raw pane content.
// ---------------------------------------------------------------------------

export type SessionMessage = {
  role: "user" | "assistant" | "system" | "tool"
  content: string
  toolName?: string
  toolArgs?: Record<string, unknown>
  timestamp?: number
}

export type SessionMessagesFetcher = (sessionId: string, limit?: number) => Promise<SessionMessage[]>

let currentGetMessages: SessionMessagesFetcher | null = null

export function setGetSessionMessages(fn: SessionMessagesFetcher | null): void {
  currentGetMessages = fn
}

export function getSessionMessagesFetcher(): SessionMessagesFetcher | null {
  return currentGetMessages
}

/**
 * Remove a session→paneId mapping when the session ends or the pane is closed.
 */
export function clearSessionToPaneId(sessionId: string): void {
  sessionPaneRegistry.delete(sessionId)
}

/**
 * Get the total number of registered session→paneId mappings (for diagnostics).
 */
export function getSessionPaneRegistrySize(): number {
  return sessionPaneRegistry.size
}

/**
 * P59 R4: return a snapshot of the session→paneId registry for callers that
 * need to do reverse lookups (e.g. peek needs paneId→sessionId).
 */
export function getSessionPaneRegistryEntries(): Array<[string, string]> {
  return Array.from(sessionPaneRegistry.entries())
}
