import {
  DEFAULT_CONTEXT_BUDGET,
  MIN_SHARED_INJECTION_CAP,
} from "./budget.js"

export type InjectionChannel = "core-system" | "core-message" | "plugin-message"

export interface InjectionPresence {
  core_system: boolean
  core_message: boolean
  plugin_message: boolean
}

export interface TurnInjectionLedger {
  turn_key: string
  session_id: string
  turn_count: number
  context_window_chars: number
  cap_chars: number
  used_chars: number
  usage_by_channel: Record<InjectionChannel, number>
  baseline_by_channel: Record<InjectionChannel, number>
  created_at: number
  updated_at: number
}

interface InternalStore {
  ledgers: Map<string, TurnInjectionLedger>
}

const GLOBAL_LEDGER_KEY = "__hivemind_turn_injection_ledger_v1__"
const MAX_LEDGER_ENTRIES = 256
const LEDGER_TTL_MS = 15 * 60 * 1000

const CHANNEL_PRIORITY: InjectionChannel[] = [
  "core-system",
  "core-message",
  "plugin-message",
]

const CORE_SYSTEM_MARKERS = ["<hivemind>", "HIVE-MASTER governance active"]
const CORE_MESSAGE_MARKERS = ["[SYSTEM ANCHOR:", "<system-reminder>", "<hivemind-clarify>"]
const PLUGIN_MESSAGE_MARKERS = ["## GX-Pack Governance Context"]

function getStore(): InternalStore {
  const globalObj = globalThis as Record<string, unknown>
  const existing = globalObj[GLOBAL_LEDGER_KEY] as InternalStore | undefined
  if (existing?.ledgers instanceof Map) {
    return existing
  }

  const created: InternalStore = {
    ledgers: new Map<string, TurnInjectionLedger>(),
  }
  globalObj[GLOBAL_LEDGER_KEY] = created
  return created
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function normalizeChars(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.floor(value))
}

function normalizeContextWindowChars(value: number): number {
  const normalized = normalizeChars(value)
  if (normalized <= 0) return 16000
  return normalized
}

function normalizeCapCharsOverride(value: number): number | null {
  if (!Number.isFinite(value)) return null
  const normalized = Math.floor(value)
  if (normalized <= 0) return null
  return clamp(normalized, MIN_SHARED_INJECTION_CAP, DEFAULT_CONTEXT_BUDGET)
}

function extractMessageText(message: unknown): string {
  if (!message || typeof message !== "object") return ""
  const msg = message as Record<string, unknown>

  if (Array.isArray(msg.parts)) {
    return msg.parts
      .map((part) => {
        if (!part || typeof part !== "object") return ""
        const typedPart = part as Record<string, unknown>
        return typedPart.type === "text" && typeof typedPart.text === "string"
          ? typedPart.text
          : ""
      })
      .join(" ")
  }

  if (typeof msg.content === "string") return msg.content

  if (msg.info && typeof msg.info === "object") {
    const info = msg.info as Record<string, unknown>
    if (typeof info.content === "string") return info.content
  }

  if (Array.isArray(msg.content)) {
    return msg.content
      .map((part) => {
        if (!part || typeof part !== "object") return ""
        const typedPart = part as Record<string, unknown>
        return typedPart.type === "text" && typeof typedPart.text === "string"
          ? typedPart.text
          : ""
      })
      .join(" ")
  }

  return ""
}

/**
 * Detect existing injection channels in current prompt surfaces.
 *
 * @param input Prompt surfaces from hooks (`output.system` + `output.messages`).
 * @returns Presence flags for each injection channel.
 */
export function detectInjectionPresence(input: {
  system?: string[] | null
  messages?: unknown[] | null
}): InjectionPresence {
  const systemStrings = Array.isArray(input.system) ? input.system : []
  const messages = Array.isArray(input.messages) ? input.messages : []

  const core_system = systemStrings.some((line) =>
    CORE_SYSTEM_MARKERS.some((marker) => line.includes(marker))
  )

  const messageTexts = messages.map((message) => extractMessageText(message))
  const core_message = messageTexts.some((text) =>
    CORE_MESSAGE_MARKERS.some((marker) => text.includes(marker))
  )
  const plugin_message = messageTexts.some((text) =>
    PLUGIN_MESSAGE_MARKERS.some((marker) => text.includes(marker))
  )

  return {
    core_system,
    core_message,
    plugin_message,
  }
}

function buildBaselineByChannel(turnCount: number, capChars: number): Record<InjectionChannel, number> {
  const bootstrapTurn = turnCount <= 2
  const ratioByChannel: Record<InjectionChannel, number> = bootstrapTurn
    ? {
        "core-system": 0.55,
        "core-message": 0.35,
        "plugin-message": 0.1,
      }
    : {
        "core-system": 0.45,
        "core-message": 0.45,
        "plugin-message": 0.1,
      }

  const system = Math.floor(capChars * ratioByChannel["core-system"])
  const message = Math.floor(capChars * ratioByChannel["core-message"])
  const plugin = Math.max(0, capChars - system - message)

  return {
    "core-system": system,
    "core-message": message,
    "plugin-message": plugin,
  }
}

function pruneOldLedgers(store: InternalStore): void {
  const now = Date.now()
  for (const [key, ledger] of store.ledgers.entries()) {
    if (now - ledger.updated_at > LEDGER_TTL_MS) {
      store.ledgers.delete(key)
    }
  }

  if (store.ledgers.size <= MAX_LEDGER_ENTRIES) return

  const sorted = [...store.ledgers.entries()].sort((a, b) => a[1].updated_at - b[1].updated_at)
  const overflow = store.ledgers.size - MAX_LEDGER_ENTRIES
  for (let i = 0; i < overflow; i += 1) {
    store.ledgers.delete(sorted[i][0])
  }
}

export function createTurnInjectionKey(sessionId: string, turnCount: number): string {
  const safeSessionId = sessionId.trim().length > 0 ? sessionId.trim() : "unknown-session"
  return `${safeSessionId}:turn:${Math.max(0, Math.floor(turnCount))}`
}

/**
 * Create or refresh the shared per-turn injection ledger for a session turn.
 *
 * @param params Ledger creation parameters.
 * @param params.sessionId Session identifier used to partition the ledger.
 * @param params.turnCount Turn number within the session.
 * @param params.contextWindowChars Estimated model context window in characters.
 * @param params.capCharsOverride Optional explicit per-turn cap to use instead of the legacy formula.
 * @returns The created or refreshed ledger entry for the session turn.
 */
export function createTurnInjectionLedger(params: {
  sessionId: string
  turnCount: number
  contextWindowChars: number
  capCharsOverride?: number
}): TurnInjectionLedger {
  const store = getStore()
  pruneOldLedgers(store)

  const contextWindowChars = normalizeContextWindowChars(params.contextWindowChars)
  const turnCount = Math.max(0, Math.floor(params.turnCount))
  const turnKey = createTurnInjectionKey(params.sessionId, turnCount)
  const now = Date.now()
  const capCharsOverride = normalizeCapCharsOverride(params.capCharsOverride ?? Number.NaN)

  const existing = store.ledgers.get(turnKey)
  if (existing) {
    // Keep the latest context estimate while allowing callers to pin an explicit cap.
    const nextContextWindow = Math.max(existing.context_window_chars, contextWindowChars)
    const nextCap = capCharsOverride ?? Math.floor(nextContextWindow * 0.15)
    const nextBaseline = buildBaselineByChannel(turnCount, nextCap)

    existing.context_window_chars = nextContextWindow
    existing.cap_chars = nextCap
    existing.baseline_by_channel = nextBaseline
    existing.updated_at = now
    return existing
  }

  const capChars = capCharsOverride ?? Math.floor(contextWindowChars * 0.15)
  const baselineByChannel = buildBaselineByChannel(turnCount, capChars)

  const created: TurnInjectionLedger = {
    turn_key: turnKey,
    session_id: params.sessionId,
    turn_count: turnCount,
    context_window_chars: contextWindowChars,
    cap_chars: capChars,
    used_chars: 0,
    usage_by_channel: {
      "core-system": 0,
      "core-message": 0,
      "plugin-message": 0,
    },
    baseline_by_channel: baselineByChannel,
    created_at: now,
    updated_at: now,
  }

  store.ledgers.set(turnKey, created)
  return created
}

function getHigherPriorityChannels(channel: InjectionChannel): InjectionChannel[] {
  const channelIndex = CHANNEL_PRIORITY.indexOf(channel)
  if (channelIndex <= 0) return []
  return CHANNEL_PRIORITY.slice(0, channelIndex)
}

function getLedgerOrCreate(turnKey: string, fallbackContextWindowChars = 16000): TurnInjectionLedger {
  const store = getStore()
  const existing = store.ledgers.get(turnKey)
  if (existing) {
    return existing
  }

  const [sessionId, maybeTurnToken, maybeTurn] = turnKey.split(":")
  const parsedTurnCount = maybeTurnToken === "turn" ? Number.parseInt(maybeTurn ?? "0", 10) : 0
  return createTurnInjectionLedger({
    sessionId: sessionId ?? "unknown-session",
    turnCount: Number.isFinite(parsedTurnCount) ? parsedTurnCount : 0,
    contextWindowChars: fallbackContextWindowChars,
  })
}

export function reserveInjectionBudget(params: {
  turnKey: string
  channel: InjectionChannel
  requestedChars: number
}): number {
  const ledger = getLedgerOrCreate(params.turnKey)
  const requestedChars = normalizeChars(params.requestedChars)
  if (requestedChars <= 0) {
    return 0
  }

  const remainingGlobal = Math.max(0, ledger.cap_chars - ledger.used_chars)
  if (remainingGlobal <= 0) {
    return 0
  }

  const reservedForHigher = getHigherPriorityChannels(params.channel)
    .map((higherChannel) => {
      const baseline = ledger.baseline_by_channel[higherChannel]
      const used = ledger.usage_by_channel[higherChannel]
      return Math.max(0, baseline - used)
    })
    .reduce((sum, value) => sum + value, 0)

  const availableForChannel = Math.max(0, remainingGlobal - reservedForHigher)
  if (availableForChannel <= 0) {
    return 0
  }

  const granted = clamp(Math.min(requestedChars, availableForChannel), 0, availableForChannel)
  ledger.usage_by_channel[params.channel] += granted
  ledger.used_chars += granted
  ledger.updated_at = Date.now()
  return granted
}

export function getRemainingBudget(turnKey: string): number {
  const ledger = getLedgerOrCreate(turnKey)
  return Math.max(0, ledger.cap_chars - ledger.used_chars)
}

export function getTurnInjectionLedger(turnKey: string): TurnInjectionLedger | null {
  const store = getStore()
  const ledger = store.ledgers.get(turnKey)
  if (!ledger) {
    return null
  }
  return {
    ...ledger,
    usage_by_channel: { ...ledger.usage_by_channel },
    baseline_by_channel: { ...ledger.baseline_by_channel },
  }
}

export function clearTurnInjectionLedger(turnKey?: string): void {
  const store = getStore()
  if (turnKey) {
    store.ledgers.delete(turnKey)
    return
  }
  store.ledgers.clear()
}
