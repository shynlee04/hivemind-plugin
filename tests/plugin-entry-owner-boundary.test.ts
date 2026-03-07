import assert from "node:assert/strict"
import { access, mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { describe, it } from "node:test"

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function writeScript(worktree: string, relativePath: string, body: string): Promise<void> {
  const absolutePath = join(worktree, relativePath)
  await mkdir(dirname(absolutePath), { recursive: true })
  await writeFile(absolutePath, body, "utf-8")
}

async function setupPluginBoundaryDir(withCoreEntryOwner: boolean): Promise<{
  dir: string
  detectMarker: string
  autoInitMarker: string
  gxEntryMarker: string
  gxRefreshMarker: string
}> {
  const dir = await mkdtemp(join(tmpdir(), "hm-plugin-entry-boundary-"))
  const markersDir = join(dir, ".markers")
  await mkdir(markersDir, { recursive: true })

  if (withCoreEntryOwner) {
    await mkdir(join(dir, "src", "hooks"), { recursive: true })
    await writeFile(join(dir, "src", "hooks", "event-handler.ts"), "// canonical src event owner marker\n", "utf-8")
  }

  const detectMarker = join(markersDir, "detect-entry-ran")
  const autoInitMarker = join(markersDir, "auto-init-ran")
  const gxEntryMarker = join(markersDir, "gx-entry-ran")
  const gxRefreshMarker = join(markersDir, "gx-refresh-ran")

  await writeScript(
    dir,
    "scripts/detect-entry.sh",
    `#!/usr/bin/env bash
set -eu
touch "$1/.markers/detect-entry-ran"
echo '{"state_exists":true,"lineage":"unresolved","hierarchy_status":"present","trajectory_status":"unknown","entry_condition":"classify_required"}'
`,
  )
  await writeScript(
    dir,
    "scripts/auto-init.sh",
    `#!/usr/bin/env bash
set -eu
touch "$1/.markers/auto-init-ran"
echo '{"ok":true}'
`,
  )
  await writeScript(
    dir,
    ".opencode/skills/gx-context-engine/scripts/gx-entry-guard.sh",
    `#!/usr/bin/env bash
set -eu
touch "$1/.markers/gx-entry-ran"
echo '{}'
`,
  )
  await writeScript(
    dir,
    ".opencode/skills/gx-context-engine/scripts/gx-first-turn-refresh.sh",
    `#!/usr/bin/env bash
set -eu
touch "$1/.markers/gx-refresh-ran"
echo '{}'
`,
  )

  return {
    dir,
    detectMarker,
    autoInitMarker,
    gxEntryMarker,
    gxRefreshMarker,
  }
}

function createState(worktree: string) {
  const savedStates: unknown[] = []
  const state = {
    current: {
      sessionId: "unknown",
      agent: "unresolved",
      delegationChain: [],
      gatesPassed: [],
      scopeViolations: [],
      turnCount: 0,
      lastCheckpoint: 0,
      classificationPending: false,
      classificationDone: false,
    },
    save: (next: unknown) => {
      savedStates.push(next)
      state.current = next as typeof state.current
    },
    worktree,
  }

  return { state, savedStates }
}

describe("plugin entry-owner boundary", () => {
  it("keeps plugin session-start hooks silent when canonical src event ownership is present", async () => {
    const { dir, detectMarker, autoInitMarker, gxEntryMarker, gxRefreshMarker } =
      await setupPluginBoundaryDir(true)
    const { state, savedStates } = createState(dir)

    try {
      const entryModule = await import("../.opencode/plugins/hiveops-governance/hooks/entry-guard.ts")
      const eventsModule = await import("../.opencode/plugins/hiveops-governance/hooks/events.ts")
      const entryHookBuilder = entryModule.buildEntryGuardHook as ((state: any) => (input: any) => Promise<void>) | undefined
      const eventHookBuilder = eventsModule.buildEventHook as ((state: any) => (input: any) => Promise<void>) | undefined
      assert.equal(typeof entryHookBuilder, "function")
      assert.equal(typeof eventHookBuilder, "function")

      const entryHook = entryHookBuilder(state as any)
      const eventHook = eventHookBuilder(state as any)

      await entryHook({ event: { type: "session.created", properties: { sessionID: "ses_entry_owner" } } })
      await eventHook({ event: { type: "session.created", properties: { sessionID: "ses_entry_owner" } } })

      assert.equal(savedStates.length, 0)
      assert.equal(await pathExists(detectMarker), false)
      assert.equal(await pathExists(autoInitMarker), false)
      assert.equal(await pathExists(gxEntryMarker), false)
      assert.equal(await pathExists(gxRefreshMarker), false)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("retains fallback session-start behavior when canonical src event ownership is absent", async () => {
    const { dir, detectMarker, autoInitMarker, gxEntryMarker, gxRefreshMarker } =
      await setupPluginBoundaryDir(false)
    const { state, savedStates } = createState(dir)

    try {
      const entryModule = await import("../.opencode/plugins/hiveops-governance/hooks/entry-guard.ts")
      const eventsModule = await import("../.opencode/plugins/hiveops-governance/hooks/events.ts")
      const entryHookBuilder = entryModule.buildEntryGuardHook as ((state: any) => (input: any) => Promise<void>) | undefined
      const eventHookBuilder = eventsModule.buildEventHook as ((state: any) => (input: any) => Promise<void>) | undefined
      assert.equal(typeof entryHookBuilder, "function")
      assert.equal(typeof eventHookBuilder, "function")

      const entryHook = entryHookBuilder(state as any)
      const eventHook = eventHookBuilder(state as any)

      await entryHook({ event: { type: "session.created", properties: { sessionID: "ses_entry_owner" } } })
      await eventHook({ event: { type: "session.created", properties: { sessionID: "ses_entry_owner" } } })

      assert(savedStates.length >= 2)
      assert.equal(await pathExists(detectMarker), true)
      assert.equal(await pathExists(autoInitMarker), false)
      assert.equal(await pathExists(gxEntryMarker), true)
      assert.equal(await pathExists(gxRefreshMarker), true)
      assert.equal(state.current.entryDetection?.entry_condition, "classify_required")
      assert.equal(state.current.classificationPending, true)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
