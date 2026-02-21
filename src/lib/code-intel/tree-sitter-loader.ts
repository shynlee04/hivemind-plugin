type LoadLanguage = (language: string) => Promise<unknown>

type TreeSitterInitFailure = {
  code: "TREE_SITTER_INIT_FAILED"
  message: string
  language: string
  cause: unknown
}

type TreeSitterLoader = {
  init: (language: string) => Promise<unknown>
}

const defaultLoadLanguage: LoadLanguage = async (language: string) => {
  throw new Error(`Tree-sitter language loader not configured for '${language}'`)
}

function toInitFailure(language: string, cause: unknown): TreeSitterInitFailure {
  return {
    code: "TREE_SITTER_INIT_FAILED",
    message: `Failed to initialize tree-sitter language '${language}'`,
    language,
    cause,
  }
}

export function createTreeSitterLoader(options: { loadLanguage?: LoadLanguage } = {}): TreeSitterLoader {
  const loadLanguage = options.loadLanguage ?? defaultLoadLanguage
  const initializedByLanguage = new Map<string, Promise<unknown>>()

  async function init(language: string): Promise<unknown> {
    const existing = initializedByLanguage.get(language)
    if (existing) {
      return existing
    }

    const initialization = loadLanguage(language).catch((cause: unknown) => {
      initializedByLanguage.delete(language)
      throw toInitFailure(language, cause)
    })

    initializedByLanguage.set(language, initialization)
    return initialization
  }

  return { init }
}
