import { join, dirname } from "node:path"
import { readFile } from "node:fs/promises"

// ─── Types ──────────────────────────────────────────────────────────────

export interface TreeSitterInstance {
  /** Parse source code and return the root AST node */
  parse(content: string, language: string): TreeSitterNode | null
  /** Get list of currently loaded language names */
  getLanguages(): string[]
  /** Check if a file extension has a supported language */
  isLanguageSupported(extension: string): boolean
  /** Release all resources (parsers, languages) */
  dispose(): void
}

export interface TreeSitterNode {
  type: string
  text: string
  startIndex: number
  endIndex: number
  startPosition: { row: number; column: number }
  endPosition: { row: number; column: number }
  children: TreeSitterNode[]
  /** Whether this is a named node (vs anonymous/punctuation) */
  isNamed: boolean
  /** Get child by field name (e.g. "name", "parameters", "return_type") */
  childForFieldName(fieldName: string): TreeSitterNode | null
  /** Get all children with a given field name */
  childrenForFieldName(fieldName: string): TreeSitterNode[]
}

export type TreeSitterInitFailure = {
  code: "TREE_SITTER_INIT_FAILED"
  message: string
  language?: string
  cause: unknown
}

// ─── Extension → Language mapping ───────────────────────────────────────

const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ".ts": "typescript",
  ".tsx": "tsx",
  ".js": "javascript",
  ".jsx": "javascript",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".json": "json",
  ".py": "python",
  ".go": "go",
  ".rs": "rust",
}

// Language → npm package that ships the .wasm file
const LANGUAGE_TO_PACKAGE: Record<string, string> = {
  typescript: "tree-sitter-typescript",
  tsx: "tree-sitter-typescript",
  javascript: "tree-sitter-javascript",
  json: "tree-sitter-json",
  python: "tree-sitter-python",
  go: "tree-sitter-go",
  rust: "tree-sitter-rust",
}

// Within the npm package, the subpath to the .wasm file
const LANGUAGE_WASM_SUBPATH: Record<string, string> = {
  typescript: "tree-sitter-typescript.wasm",
  tsx: "tree-sitter-tsx.wasm",
  javascript: "tree-sitter-javascript.wasm",
  json: "tree-sitter-json.wasm",
  python: "tree-sitter-python.wasm",
  go: "tree-sitter-go.wasm",
  rust: "tree-sitter-rust.wasm",
}

// ─── Helpers ────────────────────────────────────────────────────────────

function toInitFailure(message: string, cause: unknown, language?: string): TreeSitterInitFailure {
  return {
    code: "TREE_SITTER_INIT_FAILED",
    message,
    language,
    cause,
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Convert a web-tree-sitter Node into our simplified TreeSitterNode interface.
 * Recursive adapter that avoids exposing WASM internals.
 */
function adaptNode(node: any): TreeSitterNode {
  return {
    type: node.type,
    text: node.text,
    startIndex: node.startIndex,
    endIndex: node.endIndex,
    startPosition: { row: node.startPosition.row, column: node.startPosition.column },
    endPosition: { row: node.endPosition.row, column: node.endPosition.column },
    isNamed: node.isNamed,
    get children(): TreeSitterNode[] {
      return (node.children as any[]).map(adaptNode)
    },
    childForFieldName(fieldName: string): TreeSitterNode | null {
      const child = node.childForFieldName(fieldName)
      return child ? adaptNode(child) : null
    },
    childrenForFieldName(fieldName: string): TreeSitterNode[] {
      return (node.childrenForFieldName(fieldName) as any[]).map(adaptNode)
    },
  }
}

/**
 * Try to resolve a language .wasm file from node_modules.
 * Returns the file path if found, null otherwise.
 */
async function resolveLanguageWasm(language: string): Promise<string | null> {
  const packageName = LANGUAGE_TO_PACKAGE[language]
  const wasmSubpath = LANGUAGE_WASM_SUBPATH[language]
  if (!packageName || !wasmSubpath) return null

  // Strategy 1: resolve via createRequire (reliable in ESM)
  try {
    const packageJsonPath = await findPackageRoot(packageName)
    if (packageJsonPath) {
      return join(dirname(packageJsonPath), wasmSubpath)
    }
  } catch {
    // Fall through
  }

  // Strategy 2: look relative to web-tree-sitter (sibling in node_modules)
  try {
    const treeSitterPkg = await findPackageRoot("web-tree-sitter")
    if (treeSitterPkg) {
      const nodeModules = dirname(dirname(treeSitterPkg))
      return join(nodeModules, packageName, wasmSubpath)
    }
  } catch {
    // Fall through
  }

  return null
}

/**
 * Find the package.json path for a given npm package.
 */
async function findPackageRoot(packageName: string): Promise<string | null> {
  try {
    const { createRequire } = await import("node:module")
    const require = createRequire(import.meta.url)
    return require.resolve(`${packageName}/package.json`)
  } catch {
    return null
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── Factory (recommended API) ──────────────────────────────────────────

/** Whether Parser.init() has been called globally */
let parserInitialized = false

export interface TreeSitterFactory {
  /** Get or create the singleton TreeSitterInstance */
  getInstance(): Promise<TreeSitterInstance>
  /** Pre-load a language by name (e.g. "typescript", "javascript") */
  preloadLanguage(language: string): Promise<boolean>
  /** Pre-load a language by file extension (e.g. ".ts", ".jsx") */
  preloadLanguageForExtension(extension: string): Promise<boolean>
  /** Map a file extension to a language name */
  extensionToLanguage(extension: string): string | null
  /** Release all resources */
  dispose(): void
}

/**
 * Create a TreeSitterFactory — the recommended entry point.
 *
 * Usage:
 * ```ts
 * const factory = createTreeSitterFactory()
 * await factory.preloadLanguage("typescript")
 * const instance = await factory.getInstance()
 * const ast = instance.parse(sourceCode, "typescript")
 * ```
 *
 * Graceful degradation: if web-tree-sitter or a language .wasm is not
 * available, getInstance() throws (catch and fall back to regex mode)
 * and preloadLanguage() returns false.
 */
export function createTreeSitterFactory(): TreeSitterFactory {
  let instancePromise: Promise<TreeSitterInstance> | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let loadLanguageFn: ((lang: string) => Promise<any>) | null = null

  async function createInternalInstance(): Promise<TreeSitterInstance> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let Parser: any

    try {
      const mod = await import("web-tree-sitter")
      Parser = mod.default ?? mod
    } catch (cause) {
      throw toInitFailure("Failed to import web-tree-sitter module", cause)
    }

    if (!parserInitialized) {
      try {
        await Parser.init()
        parserInitialized = true
      } catch (cause) {
        throw toInitFailure("Failed to initialize tree-sitter WASM runtime", cause)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const languageCache = new Map<string, any>()
    const failedLanguages = new Set<string>()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parser: any
    try {
      parser = new Parser()
    } catch (cause) {
      throw toInitFailure("Failed to create tree-sitter Parser instance", cause)
    }

    // Expose the internal loadLanguage via closure
    loadLanguageFn = async (language: string) => {
      if (languageCache.has(language)) return languageCache.get(language)
      if (failedLanguages.has(language)) return null

      const wasmPath = await resolveLanguageWasm(language)
      if (!wasmPath) {
        failedLanguages.add(language)
        return null
      }

      try {
        const wasmBytes = await readFile(wasmPath)
        const lang = await Parser.Language.load(wasmBytes)
        languageCache.set(language, lang)
        return lang
      } catch {
        failedLanguages.add(language)
        return null
      }
    }

    return {
      parse(content: string, language: string): TreeSitterNode | null {
        const lang = languageCache.get(language)
        if (!lang) return null

        try {
          parser.setLanguage(lang)
          const tree = parser.parse(content)
          if (!tree) return null
          const rootNode = tree.rootNode
          const adapted = adaptNode(rootNode)
          tree.delete()
          return adapted
        } catch {
          return null
        }
      },

      getLanguages(): string[] {
        return Array.from(languageCache.keys())
      },

      isLanguageSupported(extension: string): boolean {
        const ext = extension.startsWith(".") ? extension : `.${extension}`
        return ext in EXTENSION_TO_LANGUAGE
      },

      dispose(): void {
        try {
          parser?.delete()
        } catch {
          // Ignore cleanup errors
        }
        languageCache.clear()
        failedLanguages.clear()
        loadLanguageFn = null
      },
    }
  }

  return {
    async getInstance(): Promise<TreeSitterInstance> {
      if (!instancePromise) {
        instancePromise = createInternalInstance()
      }
      return instancePromise
    },

    async preloadLanguage(language: string): Promise<boolean> {
      await this.getInstance()
      if (!loadLanguageFn) return false
      const result = await loadLanguageFn(language)
      return result !== null
    },

    async preloadLanguageForExtension(extension: string): Promise<boolean> {
      const ext = extension.startsWith(".") ? extension : `.${extension}`
      const language = EXTENSION_TO_LANGUAGE[ext]
      if (!language) return false
      return this.preloadLanguage(language)
    },

    extensionToLanguage(extension: string): string | null {
      const ext = extension.startsWith(".") ? extension : `.${extension}`
      return EXTENSION_TO_LANGUAGE[ext] ?? null
    },

    dispose(): void {
      if (instancePromise) {
        instancePromise.then((inst) => inst.dispose()).catch(() => {})
        instancePromise = null
      }
      loadLanguageFn = null
    },
  }
}

// ─── Convenience exports ────────────────────────────────────────────────

/**
 * Get the language name for a file extension.
 * Returns null if the extension is not supported.
 */
export function extensionToLanguage(extension: string): string | null {
  const ext = extension.startsWith(".") ? extension : `.${extension}`
  return EXTENSION_TO_LANGUAGE[ext] ?? null
}

/**
 * Get all supported file extensions.
 */
export function getSupportedExtensions(): string[] {
  return Object.keys(EXTENSION_TO_LANGUAGE)
}

// ─── Legacy compat (re-export for backward compatibility) ───────────────

/** @deprecated Use createTreeSitterFactory() instead */
export function createTreeSitterLoader(options: { loadLanguage?: (language: string) => Promise<unknown> } = {}) {
  const loadLanguage = options.loadLanguage ?? (async (language: string) => {
    throw new Error(`Tree-sitter language loader not configured for '${language}'`)
  })
  const initializedByLanguage = new Map<string, Promise<unknown>>()

  return {
    init: async (language: string): Promise<unknown> => {
      const existing = initializedByLanguage.get(language)
      if (existing) return existing

      const initialization = loadLanguage(language).catch((cause: unknown) => {
        initializedByLanguage.delete(language)
        throw toInitFailure(`Failed to initialize tree-sitter language '${language}'`, cause, language)
      })

      initializedByLanguage.set(language, initialization)
      return initialization
    },
  }
}
