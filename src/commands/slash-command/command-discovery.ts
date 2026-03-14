import type { SlashCommandBundle } from './command-types.js'
import { slashCommandBundles } from './command-bundles.js'

export function discoverSlashCommandBundles(): SlashCommandBundle[] {
  return [...slashCommandBundles]
}

export function findSlashCommandBundle(id: string): SlashCommandBundle | undefined {
  return slashCommandBundles.find((bundle) => bundle.id === id)
}
