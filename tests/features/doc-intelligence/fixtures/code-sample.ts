/**
 * Process user input and return a formatted result.
 * @param input - The string to process
 * @returns A greeting message
 */
export function greet(input: string): string {
  return `Hello, ${input}!`
}

/**
 * Configuration interface for the application.
 */
export interface AppConfig {
  verbose: boolean
  timeout: number
}

// This is a single-line comment
export const DEFAULT_TIMEOUT = 5000

export class Service {
  private config: AppConfig

  constructor(config: AppConfig) {
    this.config = config
  }

  async run(input: string): Promise<string> {
    return greet(input)
  }
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: string }

export { greet as default }
