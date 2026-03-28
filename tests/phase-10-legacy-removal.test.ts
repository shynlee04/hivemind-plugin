import assert from 'node:assert/strict'
import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import { readFile } from 'node:fs/promises'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))

/**
 * Phase 10 Legacy Removal — RED tests
 *
 * These tests define the post-removal state. They MUST FAIL before removal
 * and PASS after removal. Each test targets a specific legacy asset.
 */
describe('phase-10 legacy removal', () => {
  describe('sync command surface removed', () => {
    it('runtime-assets.ts should not exist', async () => {
      const runtimeAssetsPath = join(repoRoot, 'src/cli/runtime-assets.ts')
      await assert.rejects(
        () => access(runtimeAssetsPath),
        /ENOENT/,
        'src/cli/runtime-assets.ts should have been deleted',
      )
    })

    it('cli.ts should not import syncRuntimeSurface', async () => {
      const cliPath = join(repoRoot, 'src/cli.ts')
      const content = await readFile(cliPath, 'utf8')
      assert.ok(
        !content.includes("syncRuntimeSurface"),
        'cli.ts should not import or reference syncRuntimeSurface',
      )
      assert.ok(
        !content.includes("runtime-assets"),
        'cli.ts should not import from runtime-assets',
      )
    })

    it('cli.ts should not have sync case in command dispatch', async () => {
      const cliPath = join(repoRoot, 'src/cli.ts')
      const content = await readFile(cliPath, 'utf8')
      assert.ok(
        !content.match(/case 'sync'/),
        "cli.ts should not have case 'sync' in switch",
      )
    })

    it('command-routing.ts should not reference hm-sync', async () => {
      const routingPath = join(repoRoot, 'src/cli/command-routing.ts')
      const content = await readFile(routingPath, 'utf8')
      assert.ok(
        !content.includes('hm-sync'),
        'command-routing.ts should not reference hm-sync',
      )
      assert.ok(
        !content.match(/'sync'/),
        "command-routing.ts should not include 'sync' command",
      )
    })

    it('init.handler.ts should not import syncRuntimeSurface', async () => {
      const initPath = join(repoRoot, 'src/features/runtime-entry/init.handler.ts')
      const content = await readFile(initPath, 'utf8')
      assert.ok(
        !content.includes('syncRuntimeSurface'),
        'init.handler.ts should not import syncRuntimeSurface',
      )
      assert.ok(
        !content.includes('runtime-assets'),
        'init.handler.ts should not import from runtime-assets',
      )
    })

    it('doctor.ts should not import syncRuntimeSurface', async () => {
      const doctorPath = join(repoRoot, 'src/features/runtime-entry/doctor.ts')
      const content = await readFile(doctorPath, 'utf8')
      assert.ok(
        !content.includes('syncRuntimeSurface'),
        'doctor.ts should not import syncRuntimeSurface',
      )
      assert.ok(
        !content.includes('runtime-assets'),
        'doctor.ts should not import from runtime-assets',
      )
    })

    it('package.json should not have hm-sync bin entry', async () => {
      const pkgPath = join(repoRoot, 'package.json')
      const content = await readFile(pkgPath, 'utf8')
      const pkg = JSON.parse(content)
      assert.ok(
        !pkg.bin?.['hm-sync'],
        'package.json should not have hm-sync in bin section',
      )
    })

    it('help text in cli.ts should not mention sync or hm-sync', async () => {
      const cliPath = join(repoRoot, 'src/cli.ts')
      const content = await readFile(cliPath, 'utf8')
      assert.ok(
        !content.includes('hm-sync'),
        'cli.ts help text should not mention hm-sync',
      )
      assert.ok(
        !content.match(/sync\s+Sync plugin surface/),
        'cli.ts help text should not list sync command',
      )
    })
  })

  describe('legacy CJS deprecated', () => {
    it('hivemind-tools.cjs should be renamed to .deprecated', async () => {
      const cjsPath = join(repoRoot, 'bin/hivemind-tools.cjs')
      await assert.rejects(
        () => access(cjsPath),
        /ENOENT/,
        'bin/hivemind-tools.cjs should have been renamed to .deprecated',
      )
    })

    it('hivemind-tools.cjs.deprecated should exist', async () => {
      const deprecatedPath = join(repoRoot, 'bin/hivemind-tools.cjs.deprecated')
      await access(deprecatedPath)
    })
  })

  describe('dead scripts removed', () => {
    it('sync-agent-registry.ts.deprecated should not exist', async () => {
      const scriptPath = join(repoRoot, 'scripts/sync-agent-registry.ts.deprecated')
      await assert.rejects(
        () => access(scriptPath),
        /ENOENT/,
        'scripts/sync-agent-registry.ts.deprecated should have been deleted',
      )
    })

    it('check-agent-registry-parity.sh.deprecated should not exist', async () => {
      const scriptPath = join(repoRoot, 'scripts/check-agent-registry-parity.sh.deprecated')
      await assert.rejects(
        () => access(scriptPath),
        /ENOENT/,
        'scripts/check-agent-registry-parity.sh.deprecated should have been deleted',
      )
    })
  })
})
