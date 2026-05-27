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

/**
 * Parses user input to extract command keywords, filtering out stop words.
 */
export function extractEntities(text: string): string[] {
  const stopWords = new Set([
    "command", "the", "a", "an", "for", "to", "in", "on", "of", "with", "by", "at", "from"
  ])
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9-]/g, ""))
    .filter((word) => word.length > 0 && !stopWords.has(word))
}

/**
 * Resolve command name or text against discovered command bundles.
 * Implements a 5s TTL cache and fuzzy/substring normalization matching.
 */
export async function resolveCommand(input: {
  text?: string
  commandName?: string
  projectRoot: string
}): Promise<{
  success: boolean
  commandBundle?: CommandBundle
  suggestions?: string[]
}> {
  const { text, commandName, projectRoot } = input
  if (!projectRoot) {
    return { success: false, suggestions: [] }
  }

  const now = Date.now()
  let cached = discoveryCache.get(projectRoot)

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    cached.hits++
    logCacheStats(projectRoot)
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

  // Stage 3: Substring prefix/suffix matching
  const substringMatches = commands.filter((cmd) => {
    const candidate = cmd.name.toLowerCase()
    const search = target.toLowerCase()
    return candidate.includes(search) || search.includes(candidate)
  })

  if (substringMatches.length === 1) {
    return { success: true, commandBundle: substringMatches[0] }
  } else if (substringMatches.length > 1) {
    return {
      success: false,
      suggestions: substringMatches.slice(0, 5).map((cmd) => cmd.name),
    }
  }

  // Stage 4: Semantic suggestion generation when no match is found
  const keywords = extractEntities(target)
  const matchesWithScores = commands.map((cmd) => {
    let score = 0
    const cmdNameLower = cmd.name.toLowerCase()
    keywords.forEach((keyword) => {
      if (cmdNameLower.includes(keyword)) {
        score += 1.0
        if (cmdNameLower === keyword) score += 1.0
      }
    })
    if (cmd.description) {
      const descLower = cmd.description.toLowerCase()
      keywords.forEach((keyword) => {
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

  const suggestions = matchesWithScores.slice(0, 5).map((match) => match.cmd.name)

  if (suggestions.length === 0) {
    throw new CommandNotFoundError(`Command not found: ${target}`)
  }

  return {
    success: false,
    suggestions,
  }
}
