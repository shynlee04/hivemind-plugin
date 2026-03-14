export interface Reference {
  filePath: string
  line: number
  column: number
  text: string
}

export interface Location {
  filePath: string
  line: number
  column: number
}

type LSPRequest = {
  filePath: string
  line: number
  column: number
}

function toStringOrFallback(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback
}

function toNumberOrFallback(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function toLocation(raw: unknown): Location | null {
  if (!raw || typeof raw !== "object") return null
  const value = raw as Record<string, unknown>
  return {
    filePath: toStringOrFallback(value.filePath ?? value.path ?? value.uri, ""),
    line: toNumberOrFallback(value.line),
    column: toNumberOrFallback(value.column),
  }
}

function toReference(raw: unknown): Reference | null {
  if (!raw || typeof raw !== "object") return null
  const value = raw as Record<string, unknown>
  return {
    filePath: toStringOrFallback(value.filePath ?? value.path ?? value.uri, ""),
    line: toNumberOrFallback(value.line),
    column: toNumberOrFallback(value.column),
    text: toStringOrFallback(value.text, ""),
  }
}

export class LSPBridge {
  private available: boolean

  constructor(private lspClient: unknown | null) {
    this.available = lspClient !== null
  }

  isAvailable(): boolean {
    return this.available
  }

  private getMethod(name: string): ((request: LSPRequest) => Promise<unknown>) | null {
    if (!this.lspClient || typeof this.lspClient !== "object") return null
    const method = (this.lspClient as Record<string, unknown>)[name]
    return typeof method === "function" ? method as (request: LSPRequest) => Promise<unknown> : null
  }

  async getBlastRadius(filePath: string, line: number, col: number): Promise<Reference[]> {
    if (!this.available) return []

    try {
      const request = { filePath, line, column: col }
      const method = this.getMethod("findReferences") ?? this.getMethod("references") ?? this.getMethod("getReferences")
      if (!method) return []

      const response = await method(request)
      if (!Array.isArray(response)) return []

      return response
        .map((entry) => toReference(entry))
        .filter((entry): entry is Reference => entry !== null && entry.filePath.length > 0)
    } catch {
      return []
    }
  }

  async getDefinition(filePath: string, line: number, col: number): Promise<Location | null> {
    if (!this.available) return null

    try {
      const request = { filePath, line, column: col }
      const method = this.getMethod("getDefinition") ?? this.getMethod("definition") ?? this.getMethod("findDefinition")
      if (!method) return null

      const response = await method(request)
      if (Array.isArray(response)) {
        return toLocation(response[0])
      }

      return toLocation(response)
    } catch {
      return null
    }
  }
}
