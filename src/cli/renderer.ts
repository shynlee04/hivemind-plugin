/**
 * CLI context renderer (Phase 40 / PH40-03).
 *
 * Pure formatting helpers used by every CLI command's handler to produce
 * deterministic, terminal-safe output. No I/O — handlers decide whether
 * to write to stdout, stderr, or buffer the result.
 *
 * Four primitives:
 *   - {@link renderError} — apply the `[Harness]` prefix policy
 *   - {@link renderJson}  — deterministic indented JSON
 *   - {@link renderTable} — fixed-width column table for human-readable
 *                           output, with empty-data marker
 *   - {@link renderHelp}  — `help` listing for a registered command set
 *
 * Output is intentionally ASCII-only (no boxing characters) so it stays
 * readable in CI logs, redirected files, and terminals without
 * Unicode-aware fonts.
 */

import type { CliCommand } from "./router.js"

const HARNESS_PREFIX = "[Harness]"

/**
 * Apply the `[Harness]` prefix policy to an error message.
 *
 * If the message already starts with `[Harness]` (case-sensitive,
 * matching how thrown errors are constructed throughout the codebase) it
 * is returned untouched — otherwise the prefix is prepended with a single
 * space separator.
 */
export function renderError(message: string): string {
  if (message.startsWith(HARNESS_PREFIX)) {
    return message
  }
  return `${HARNESS_PREFIX} ${message}`
}

/**
 * Render a value as deterministic, indented JSON with a trailing newline
 * trimmed off. Object key order is determined by `JSON.stringify`'s
 * default (insertion order); callers wanting stable order across runs
 * should pre-sort.
 */
export function renderJson(value: unknown): string {
  return JSON.stringify(value, undefined, 2)
}

/**
 * Render a fixed-width text table. Every row must have exactly the same
 * arity as the header; otherwise a `[Harness]`-prefixed error is thrown
 * (catches programming bugs early).
 *
 * Columns are right-padded to the max width of any value in that column,
 * separated by two spaces. Output is the header row followed directly
 * by data rows joined with `\n` (no separator line — kept minimal so
 * downstream `grep` / `awk` pipelines stay simple). When `rows` is
 * empty, a `(no rows)` marker is returned instead of an empty string
 * so callers don't print blank output.
 */
export function renderTable(
  header: readonly string[],
  rows: readonly (readonly string[])[],
): string {
  if (rows.length === 0) {
    return `${header.join("  ")}\n(no rows)`
  }

  for (const row of rows) {
    if (row.length !== header.length) {
      throw new Error(
        `[Harness] CLI table row has ${row.length} columns; expected ${header.length}`,
      )
    }
  }

  const widths = header.map((cell, index) => {
    let max = cell.length
    for (const row of rows) {
      const value = row[index] ?? ""
      if (value.length > max) max = value.length
    }
    return max
  })

  const formatRow = (row: readonly string[]): string =>
    row.map((cell, index) => cell.padEnd(widths[index] ?? 0, " ")).join("  ")

  const lines = [formatRow(header), ...rows.map(formatRow)]
  return lines.join("\n")
}

/**
 * Render a human-readable command listing for the `help` command. Each
 * command line shows the command name (with alias hint when present) and
 * its summary, padded into two columns. Returns a placeholder when no
 * commands are registered so callers don't print blank output.
 */
export function renderHelp(commands: readonly CliCommand[]): string {
  if (commands.length === 0) {
    return "(no commands registered)"
  }

  const formatNameCell = (command: CliCommand): string => {
    const aliases = command.aliases ?? []
    if (aliases.length === 0) return command.name
    return `${command.name} (${aliases.join(", ")})`
  }

  const nameCells = commands.map(formatNameCell)
  const nameWidth = Math.max(...nameCells.map((cell) => cell.length))
  const lines = ["Available commands:", ""]
  for (let index = 0; index < commands.length; index += 1) {
    const command = commands[index]
    const cell = nameCells[index]
    if (command === undefined || cell === undefined) continue
    lines.push(`  ${cell.padEnd(nameWidth, " ")}  ${command.summary}`)
  }
  return lines.join("\n")
}

export type { CliCommand }
