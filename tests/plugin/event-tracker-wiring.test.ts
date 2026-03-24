/**
 * RED phase tests for Plan #10 — Plugin Wiring.
 *
 * These tests define expected wiring that does NOT exist yet.
 * Each test MUST fail until hivemaker implements the corresponding changes.
 *
 * Suites:
 *  1. Barrel exports — hooks/index.ts re-exports 3 handler modules
 *  2. Plugin registration — opencode-plugin.ts registers system.transform + composes handlers
 *  3. Deprecation annotation — diagnostic-log.ts has @deprecated marker
 *  4. Legacy preservation — existing inline handlers fire alongside new handlers
 */

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

const PROJECT_ROOT = join(import.meta.dirname, '..', '..')

async function readSource(relativePath: string): Promise<string> {
  return readFile(join(PROJECT_ROOT, relativePath), 'utf8')
}

// ============================================================================
// Suite 1: Barrel exports — hooks/index.ts re-exports 3 handler modules
// ============================================================================
// These tests verify that src/hooks/index.ts exports the three handler modules
// from Plan #9. Currently the barrel file does NOT include these re-exports.

test('barrel: hooks/index.ts re-exports transform-handler', async () => {
  const barrel = await readSource('src/hooks/index.ts')

  assert.ok(
    barrel.includes('transform-handler'),
    'hooks/index.ts must re-export transform-handler.js',
  )
})

test('barrel: hooks/index.ts re-exports text-complete-handler', async () => {
  const barrel = await readSource('src/hooks/index.ts')

  assert.ok(
    barrel.includes('text-complete-handler'),
    'hooks/index.ts must re-export text-complete-handler.js',
  )
})

test('barrel: hooks/index.ts re-exports compaction-handler', async () => {
  const barrel = await readSource('src/hooks/index.ts')

  assert.ok(
    barrel.includes('compaction-handler'),
    'hooks/index.ts must re-export compaction-handler.js',
  )
})

test('barrel: all 3 handler re-exports use ESM .js suffix', async () => {
  const barrel = await readSource('src/hooks/index.ts')

  // The barrel file should use .js suffixes for ESM resolution
  assert.match(
    barrel,
    /from\s+['"]\.\/transform-handler\.js['"]/,
    'transform-handler re-export must use .js suffix',
  )
  assert.match(
    barrel,
    /from\s+['"]\.\/text-complete-handler\.js['"]/,
    'text-complete-handler re-export must use .js suffix',
  )
  assert.match(
    barrel,
    /from\s+['"]\.\/compaction-handler\.js['"]/,
    'compaction-handler re-export must use .js suffix',
  )
})

// ============================================================================
// Suite 2: Plugin registration — opencode-plugin.ts wiring
// ============================================================================
// These tests verify that opencode-plugin.ts:
//  - Registers system.transform hook with createTransformHandler
//  - Composes createTextCompleteHandler alongside existing inline handler
//  - Composes createCompactionJournalHandler alongside existing compaction adapter
// Currently NONE of these registrations exist.

test('plugin: opencode-plugin.ts imports createTransformHandler', async () => {
  const pluginSource = await readSource('src/plugin/opencode-plugin.ts')

  assert.ok(
    pluginSource.includes('createTransformHandler'),
    'opencode-plugin.ts must import createTransformHandler',
  )
})

test('plugin: opencode-plugin.ts registers system.transform hook', async () => {
  const pluginSource = await readSource('src/plugin/opencode-plugin.ts')

  assert.match(
    pluginSource,
    /['"]system\.transform['"]/,
    'opencode-plugin.ts must register system.transform hook',
  )
})

test('plugin: system.transform hook uses createTransformHandler factory', async () => {
  const pluginSource = await readSource('src/plugin/opencode-plugin.ts')

  // The hook body should call createTransformHandler({ directory })
  assert.match(
    pluginSource,
    /createTransformHandler\(\s*\{\s*directory\s*\}\s*\)/,
    'system.transform handler must be created via createTransformHandler({ directory })',
  )
})

test('plugin: opencode-plugin.ts imports createTextCompleteHandler', async () => {
  const pluginSource = await readSource('src/plugin/opencode-plugin.ts')

  assert.ok(
    pluginSource.includes('createTextCompleteHandler'),
    'opencode-plugin.ts must import createTextCompleteHandler',
  )
})

test('plugin: experimental.text.complete composes journal handler after legacy', async () => {
  const pluginSource = await readSource('src/plugin/opencode-plugin.ts')

  // The existing inline handler calls upsertSessionInspectionExport.
  // The new handler must be composed AFTER this call (not replacing it).
  const textCompleteBlock = extractHookBlock(pluginSource, 'experimental.text.complete')

  assert.ok(
    textCompleteBlock.includes('upsertSessionInspectionExport'),
    'Legacy upsertSessionInspectionExport call must be preserved',
  )

  assert.ok(
    textCompleteBlock.includes('createTextCompleteHandler') || textCompleteBlock.includes('TextComplete'),
    'Journal handler must be composed alongside legacy handler',
  )
})

test('plugin: experimental.text.complete legacy call appears before journal call', async () => {
  const pluginSource = await readSource('src/plugin/opencode-plugin.ts')

  const textCompleteBlock = extractHookBlock(pluginSource, 'experimental.text.complete')
  const legacyIndex = textCompleteBlock.indexOf('upsertSessionInspectionExport')
  const journalIndex = textCompleteBlock.search(/createTextCompleteHandler|TextComplete/)

  // Legacy must fire BEFORE journal handler (safe migration: compose, don't replace)
  assert.ok(
    legacyIndex < journalIndex,
    'Legacy handler must fire BEFORE journal handler (legacy-first order)',
  )
})

test('plugin: experimental.text.complete journal handler call has .catch(() => undefined)', async () => {
  const pluginSource = await readSource('src/plugin/opencode-plugin.ts')

  const textCompleteBlock = extractHookBlock(pluginSource, 'experimental.text.complete')

  // The journal handler (createTextCompleteHandler) must be called AND wrapped in .catch(() => undefined).
  // Verify the call chain: createTextCompleteHandler(...)(input, output).catch(() => undefined)
  const journalCallPattern = /createTextCompleteHandler\([^)]*\)\([^)]*\)\s*\.catch\(\s*\(\s*\)\s*=>\s*undefined\s*\)/

  assert.match(
    textCompleteBlock,
    journalCallPattern,
    'Journal handler invocation must be wrapped in .catch(() => undefined) resilience',
  )
})

test('plugin: opencode-plugin.ts imports createCompactionJournalHandler', async () => {
  const pluginSource = await readSource('src/plugin/opencode-plugin.ts')

  assert.ok(
    pluginSource.includes('createCompactionJournalHandler'),
    'opencode-plugin.ts must import createCompactionJournalHandler',
  )
})

test('plugin: experimental.session.compacting composes journal handler', async () => {
  const pluginSource = await readSource('src/plugin/opencode-plugin.ts')

  // The existing compaction adapter (createCompactionHandler) must remain.
  // The new journal handler must be composed alongside it.
  assert.ok(
    pluginSource.includes('createCompactionHandler'),
    'Existing compaction adapter must be preserved',
  )

  assert.ok(
    pluginSource.includes('createCompactionJournalHandler'),
    'Journal handler must be composed alongside existing compaction adapter',
  )
})

test('plugin: experimental.session.compacting journal handler has .catch(() => undefined)', async () => {
  const pluginSource = await readSource('src/plugin/opencode-plugin.ts')

  // Find the compaction section — the journal handler must be resilient
  const compactionSection = extractHookBlock(pluginSource, 'experimental.session.compacting')

  assert.match(
    compactionSection,
    /\.catch\(\s*\(\s*\)\s*=>\s*undefined\s*\)/,
    'Compaction journal handler call must have .catch(() => undefined) resilience',
  )
})

// ============================================================================
// Suite 3: Deprecation annotation — diagnostic-log.ts has @deprecated marker
// ============================================================================
// diagnostic-log.ts must be marked @deprecated but NOT removed yet.

test('deprecation: diagnostic-log.ts has @deprecated JSDoc tag', async () => {
  const source = await readSource('src/sdk-supervisor/diagnostic-log.ts')

  assert.match(
    source,
    /@deprecated/,
    'diagnostic-log.ts must have a @deprecated JSDoc annotation',
  )
})

test('deprecation: diagnostic-log.ts writeDiagnosticLog export still exists', async () => {
  // Even deprecated, the export must remain functional until Plan #11 removal
  const source = await readSource('src/sdk-supervisor/diagnostic-log.ts')

  assert.ok(
    source.includes('export') && source.includes('writeDiagnosticLog'),
    'writeDiagnosticLog export must still exist (deprecation, not removal)',
  )
})

test('deprecation: opencode-plugin.ts annotates writeDiagnosticLog import as deprecated', async () => {
  const pluginSource = await readSource('src/plugin/opencode-plugin.ts')

  // The import line for writeDiagnosticLog should have a @deprecated comment nearby
  const importLines = pluginSource.split('\n')
  const diagnosticImportIndex = importLines.findIndex(
    (line) => line.includes('writeDiagnosticLog') && line.includes('import'),
  )

  assert.ok(
    diagnosticImportIndex !== -1,
    'writeDiagnosticLog must still be imported (deprecated but functional)',
  )

  // Check for @deprecated in the surrounding context (±3 lines)
  const contextWindow = importLines
    .slice(Math.max(0, diagnosticImportIndex - 3), diagnosticImportIndex + 4)
    .join('\n')

  assert.match(
    contextWindow,
    /@deprecated|deprecated/i,
    'writeDiagnosticLog import must be annotated as deprecated',
  )
})

// ============================================================================
// Suite 4: Legacy preservation — existing inline handlers still fire
// ============================================================================
// These tests verify that the existing inline handler logic is preserved
// alongside the new journal handlers. The compose-don't-replace strategy
// means both the legacy code AND new code must coexist.

test('legacy: experimental.text.complete retains writeDiagnosticLog call', async () => {
  const pluginSource = await readSource('src/plugin/opencode-plugin.ts')

  const textCompleteBlock = extractHookBlock(pluginSource, 'experimental.text.complete')

  assert.ok(
    textCompleteBlock.includes('writeDiagnosticLog'),
    'Legacy writeDiagnosticLog call must be preserved in text.complete handler',
  )
})

test('legacy: experimental.text.complete retains upsertSessionInspectionExport call', async () => {
  const pluginSource = await readSource('src/plugin/opencode-plugin.ts')

  const textCompleteBlock = extractHookBlock(pluginSource, 'experimental.text.complete')

  assert.ok(
    textCompleteBlock.includes('upsertSessionInspectionExport'),
    'Legacy upsertSessionInspectionExport call must be preserved in text.complete handler',
  )
})

test('legacy: experimental.text.complete retains getAndClearInjectionPayload call', async () => {
  const pluginSource = await readSource('src/plugin/opencode-plugin.ts')

  const textCompleteBlock = extractHookBlock(pluginSource, 'experimental.text.complete')

  assert.ok(
    textCompleteBlock.includes('getAndClearInjectionPayload'),
    'Legacy injection payload retrieval must be preserved',
  )
})

test('legacy: experimental.session.compacting retains existing compaction adapter', async () => {
  const pluginSource = await readSource('src/plugin/opencode-plugin.ts')

  assert.ok(
    pluginSource.includes('createCompactionHandler'),
    'Existing createCompactionHandler import must be preserved',
  )
  assert.ok(
    pluginSource.includes('./compaction-adapter'),
    'Existing compaction-adapter import path must be preserved',
  )
})

test('legacy: experimental.session.compacting handler preserves context injection', async () => {
  const pluginSource = await readSource('src/plugin/opencode-plugin.ts')

  const compactionBlock = extractHookBlock(pluginSource, 'experimental.session.compacting')

  // The existing adapter injects context into output.context array
  assert.ok(
    compactionBlock.includes('context') || compactionBlock.includes('compactionHandler'),
    'Compaction adapter context injection behavior must be preserved',
  )
})

// ============================================================================
// Helpers
// ============================================================================

/**
 * Extracts the hook implementation block for a given hook name.
 * Looks for 'hookName': ... up to the next top-level hook or closing brace.
 */
function extractHookBlock(source: string, hookName: string): string {
  // Match from the hook key to a reasonable end boundary.
  // For hooks like 'experimental.text.complete': ...,
  // we capture until the next hook key or the closing brace.
  const escapedName = hookName.replace(/\./g, '\\.')
  const startRegex = new RegExp(`['"]${escapedName}['"]\\s*:\\s*`)
  const match = source.match(startRegex)

  if (!match || match.index === undefined) {
    return ''
  }

  const startIdx = match.index
  const afterHook = source.slice(startIdx)

  // Find the end: next top-level hook key (',\n    ' pattern) or closing brace
  // Hook entries are indented with 4 spaces at the top level
  const nextHookMatch = afterHook.match(
    /\n {4}'[^']+'\s*:/,
  )

  if (nextHookMatch && nextHookMatch.index !== undefined) {
    return afterHook.slice(0, nextHookMatch.index)
  }

  // Fallback: capture to the closing brace of the return object
  const closingBraceIdx = afterHook.lastIndexOf('}')
  if (closingBraceIdx !== -1) {
    return afterHook.slice(0, closingBraceIdx)
  }

  return afterHook
}
