import { dirname } from 'node:path'
import { appendFile, mkdir } from 'node:fs/promises'

/**
 * Appends the exact caller-provided UTF-8 string to a file.
 * Ensures the parent directory exists before writing (CQRS: writers own mkdir).
 * @param filePath Absolute or workspace-relative file path to append to.
 * @param content Exact UTF-8 string content to append.
 * @returns Resolves when the append completes.
 */
export async function appendExactUtf8Content(filePath: string, content: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
  await appendFile(filePath, content, 'utf8')
}
