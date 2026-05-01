/**
 * `help` — built-in CLI command (Phase 40 / PH40-01 substrate exemplar).
 *
 * Lists every registered command with its summary. This command is a
 * worked example of the `CliCommand` contract — future commands follow
 * the same shape (name + summary + handler + optional aliases).
 *
 * The handler closes over the full registered command set so it always
 * reflects the live router registry — no separate manifest to keep in
 * sync.
 */

import type { CliCommand } from "../router.js"
import { renderHelp } from "../renderer.js"

/**
 * Build the canonical `help` command. The returned command lists every
 * command in `getCommands()` with its summary; the `getCommands()`
 * indirection lets the router pass its own registry without circular
 * imports.
 */
export function createHelpCommand(
  getCommands: () => readonly CliCommand[],
): CliCommand {
  return {
    name: "help",
    summary: "List every registered CLI command and its summary.",
    aliases: ["--help", "-h"],
    handler: async () => ({
      exitCode: 0,
      output: renderHelp(getCommands()),
    }),
  }
}
