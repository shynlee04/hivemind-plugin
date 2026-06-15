import { discoverCommandBundles } from "../../routing/command-engine/index.js"
import type { CommandBundle } from "../../routing/command-engine/types.js"
import { CommandNotFoundError } from "../../shared/errors/commands.js"

interface CachedDiscovery {
  commands: CommandBundle[]
  timestamp: number
  hits: number
  misses: number
}

const discoveryCache = new Map<string, CachedDiscovery>()
const CACHE_TTL_MS = 5000

/**
 * Log cache statistics to console.
 */
function logCacheStats(projectRoot: string): void {
  const cached = discoveryCache.get(projectRoot)
  if (!cached) return
  const total = cached.hits + cached.misses
  const hitRate = total > 0 ? (cached.hits / total) * 100 : 0
  console.log(
    `[Cache] Hits: ${cached.hits}, Misses: ${cached.misses}, Total: ${total}, Hit Rate: ${hitRate.toFixed(1)}%`
  )
}

/**
 * Gets the raw hits/misses statistics for testing/debugging.
 */
export function getCacheStats(projectRoot: string) {
  const cached = discoveryCache.get(projectRoot)
  if (!cached) return { hits: 0, misses: 0, total: 0 }
  return {
    hits: cached.hits,
    misses: cached.misses,
    total: cached.hits + cached.misses,
  }
}

/**
 * Reset discovery cache. Useful for testing.
 */
export function resetDiscoveryCache(): void {
  discoveryCache.clear()
}

const STOP_WORDS = new Set([
  "command", "the", "a", "an", "for", "to", "in", "on", "of", "with", "by", "at", "from"
])

/**
 * Maps natural language concepts to related command-matching keywords.
 * Enables semantic matching: "gatekeeping" → audit, review, verify, validate, check, quality.
 */
const CONCEPT_EXPANSIONS: Record<string, string[]> = {
  gatekeeping: ["gate", "audit", "review", "verify", "validate", "check", "quality"],
  quality: ["quality", "audit", "review", "verify", "validate", "check"],
  review: ["review", "audit", "inspect", "check"],
  audit: ["audit", "review", "verify", "check", "quality"],
  verify: ["verify", "validate", "check", "confirm"],
  validate: ["validate", "verify", "check", "audit"],
  check: ["check", "verify", "validate", "audit", "review", "inspect"],
  test: ["test", "verify", "validate", "check", "run"],
  debug: ["debug", "fix", "diagnose", "investigate"],
  plan: ["plan", "create", "design", "roadmap"],
  fix: ["fix", "repair", "correct", "resolve", "debug"],
  help: ["help", "guide", "info", "documentation"],
}

/**
 * Parses user input to extract command keywords, filtering out stop words.
 */
export function extractEntities(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9-]/g, ""))
    .filter((word) => word.length > 0 && !STOP_WORDS.has(word))
}

/**
 * Resolve command name or text against discovered command bundles.
 * Implements a 5s TTL cache and fuzzy/substring normalization matching.
 */
export async function resolveCommand(input: {
  text?: string
  commandName?: string
  projectRoot: string
  /** Bypass cache and force re-discovery of command primitives. */
  forceRefresh?: boolean
}): Promise<{
  success: boolean
  commandBundle?: CommandBundle
  suggestions?: string[]
}> {
  const { text, commandName, projectRoot, forceRefresh } = input
  if (!projectRoot) {
    return { success: false, suggestions: [] }
  }

  const now = Date.now()
  let cached = discoveryCache.get(projectRoot)

  if (forceRefresh) {
    // Force refresh: clear cache for this project root
    discoveryCache.delete(projectRoot)
    cached = undefined
  }

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    cached.hits++
    if (process.env.DEBUG) {
      logCacheStats(projectRoot)
    }
  } else {
    const discovery = await discoverCommandBundles({ projectRoot })
    const prevHits = cached?.hits ?? 0
    const prevMisses = cached?.misses ?? 0
    cached = {
      commands: discovery.commands,
      timestamp: now,
      hits: prevHits,
      misses: prevMisses + 1,
    }
    discoveryCache.set(projectRoot, cached)
  }

  const commands = cached.commands
  const target = (commandName || text || "").trim()
  if (!target) {
    return { success: false, suggestions: [] }
  }

  // Stage 1: Exact Match
  const exact = commands.find(
    (cmd) => cmd.name.toLowerCase() === target.toLowerCase()
  )
  if (exact) {
    return { success: true, commandBundle: exact }
  }

  // Stage 2: Case-insensitive, hyphen/underscore normalized comparison
  const normalizedSearch = target.toLowerCase().replace(/[-_]/g, "")
  const fuzzy = commands.find((cmd) => {
    const normalizedCandidate = cmd.name.toLowerCase().replace(/[-_]/g, "")
    return normalizedCandidate === normalizedSearch
  })
  if (fuzzy) {
    return { success: true, commandBundle: fuzzy }
  }

  // Stage 3: Substring prefix/suffix matching (name + description)
  const targetLower = target.toLowerCase()
  const substringMatches = commands.filter((cmd) => {
    const candidateName = cmd.name.toLowerCase()
    if (candidateName.includes(targetLower) || targetLower.includes(candidateName)) return true
    // Also search command descriptions for natural language matching
    if (cmd.description?.toLowerCase().includes(targetLower)) return true
    return false
  })

  if (substringMatches.length === 1) {
    return { success: true, commandBundle: substringMatches[0] }
  } else if (substringMatches.length > 1) {
    return {
      success: false,
      suggestions: substringMatches.slice(0, 5).map((cmd) => cmd.name),
    }
  }

  // Stage 4: Semantic matching — keyword + description scoring with concept expansion
  const keywords = extractEntities(target)
  // Expand keywords using concept map: "gatekeeping" adds audit, review, verify, etc.
  const expandedKeywords = new Set(keywords)
  keywords.forEach((kw) => {
    const expansion = CONCEPT_EXPANSIONS[kw]
    if (expansion) expansion.forEach((ek) => expandedKeywords.add(ek))
  })
  const keywordArray = [...expandedKeywords]
  const matchesWithScores = commands.map((cmd) => {
    let score = 0
    const cmdNameLower = cmd.name.toLowerCase()
    keywordArray.forEach((keyword) => {
      if (cmdNameLower.includes(keyword)) {
        score += 1.0
        if (cmdNameLower === keyword) score += 1.0
      }
    })
    if (cmd.description) {
      const descLower = cmd.description.toLowerCase()
      keywordArray.forEach((keyword) => {
        if (descLower.includes(keyword)) score += 0.5
      })
    }
    return { cmd, score }
  }).filter((match) => match.score > 0)

  // Sort by similarity score descending, then by name ascending
  matchesWithScores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.cmd.name.localeCompare(b.cmd.name)
  })

  // Auto-select if top match has a significant score gap (>2x) over the next
  if (matchesWithScores.length > 0) {
    const top = matchesWithScores[0]
    const second = matchesWithScores[1]
    if (!second || top.score >= second.score * 2) {
      return { success: true, commandBundle: top.cmd }
    }
  }

  if (matchesWithScores.length > 0) {
    const suggestions = matchesWithScores.slice(0, 5).map((match) => match.cmd.name)
    return { success: false, suggestions }
  }

  // Stage 5: No semantic match at all — return all available commands grouped by prefix
  // This helps the caller (agent) discover what commands are available when natural
  // language input doesn't match any command name or description.
  const grouped = commands.reduce<Record<string, string[]>>((acc, cmd) => {
    const prefix = cmd.name.includes("-") ? cmd.name.split("-")[0] : "other"
    if (!acc[prefix]) acc[prefix] = []
    acc[prefix].push(cmd.name)
    return acc
  }, {})

  throw new CommandNotFoundError(
    `Command not found: ${target}\nNo commands match "${target}". Available commands by category:\n${
      Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([prefix, cmds]) => `  ${prefix}-: ${cmds.slice(0, 8).join(", ")}${cmds.length > 8 ? ` (+${cmds.length - 8})` : ""}`)
        .join("\n")
    }`
  )
}
