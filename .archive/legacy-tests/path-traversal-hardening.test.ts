/**
 * Path Traversal Hardening Tests
 *
 * Verifies session file resolution cannot escape intended .hivemind directories
 * through manifest `entry.file` or raw `stamp` values.
 */

import { mkdtemp, mkdir, readFile, rm, writeFile } from "fs/promises"
import { existsSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import {
  initializePlanningDirectory,
  readActiveMd,
  readSessionFile,
  writeManifest,
  writeSessionFile,
} from "../src/lib/planning-fs.js"
import { getHivemindPaths, getActiveSessionPath } from "../src/lib/paths.js"

let passed = 0
let failed_ = 0

function assert(cond: boolean, name: string) {
  if (cond) {
    passed++
    process.stderr.write(`  PASS: ${name}\n`)
  } else {
    failed_++
    process.stderr.write(`  FAIL: ${name}\n`)
  }
}

async function testGetActiveSessionPathRejectsTraversalFile(): Promise<void> {
  process.stderr.write("\n--- path-hardening: getActiveSessionPath traversal ---\n")
  const dir = await mkdtemp(join(tmpdir(), "hm-path-hardening-"))
  try {
    const paths = getHivemindPaths(dir)
    await mkdir(paths.sessionsDir, { recursive: true })
    await writeFile(
      paths.sessionsManifest,
      JSON.stringify(
        {
          sessions: [
            { stamp: "evil-1", file: "../../../outside.md", status: "active" },
          ],
          active_stamp: "evil-1",
        },
        null,
        2,
      ),
    )

    const activePath = await getActiveSessionPath(dir)
    assert(activePath === null, "malicious entry.file is rejected with null active path")
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

async function testReadSessionFileRejectsStampTraversal(): Promise<void> {
  process.stderr.write("\n--- path-hardening: readSessionFile stamp traversal ---\n")
  const dir = await mkdtemp(join(tmpdir(), "hm-path-hardening-"))
  try {
    await initializePlanningDirectory(dir)
    const outsidePath = join(dir, "outside.md")
    await writeFile(outsidePath, "# PWNED\n")

    const content = await readSessionFile(dir, "../../../outside")
    assert(!content.body.includes("PWNED"), "stamp traversal cannot read project root files")
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

async function testReadActiveMdRejectsManifestTraversal(): Promise<void> {
  process.stderr.write("\n--- path-hardening: readActiveMd manifest traversal ---\n")
  const dir = await mkdtemp(join(tmpdir(), "hm-path-hardening-"))
  try {
    await initializePlanningDirectory(dir)
    const outsidePath = join(dir, "outside-active.md")
    await writeFile(outsidePath, "---\nfoo: bar\n---\n# PWNED\n")

    await writeManifest(dir, {
      sessions: [
        {
          stamp: "evil-2",
          file: "../../../outside-active.md",
          status: "active",
          created: Date.now(),
          linked_plans: [],
        },
      ],
      active_stamp: "evil-2",
    })

    const content = await readActiveMd(dir)
    assert(!content.body.includes("PWNED"), "manifest entry.file cannot escape to project root")
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

async function testWriteSessionFileRejectsStampTraversal(): Promise<void> {
  process.stderr.write("\n--- path-hardening: writeSessionFile stamp traversal ---\n")
  const dir = await mkdtemp(join(tmpdir(), "hm-path-hardening-"))
  try {
    await initializePlanningDirectory(dir)
    const outsidePath = join(dir, "outside-write.md")
    const sentinel = "ORIGINAL\n"
    await writeFile(outsidePath, sentinel)

    await writeSessionFile(dir, "../../../outside-write", {
      frontmatter: { session_id: "evil" },
      body: "MALICIOUS OVERWRITE",
    })

    const outsideContent = await readFile(outsidePath, "utf-8")
    assert(outsideContent === sentinel, "stamp traversal cannot overwrite project root files")
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

async function testSafeWriteStillCreatesValidSessionFile(): Promise<void> {
  process.stderr.write("\n--- path-hardening: safe write path still works ---\n")
  const dir = await mkdtemp(join(tmpdir(), "hm-path-hardening-"))
  try {
    await initializePlanningDirectory(dir)
    await writeSessionFile(dir, "safe-stamp", {
      frontmatter: { session_id: "safe-stamp" },
      body: "Safe Body",
    })

    const paths = getHivemindPaths(dir)
    const candidate = join(paths.activeDir, "safe-stamp.md")
    assert(existsSync(candidate), "safe stamp writes under sessions/active")

    const content = await readFile(candidate, "utf-8")
    assert(content.includes("Safe Body"), "safe stamp file content persisted")
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

process.stderr.write("=== path-traversal-hardening.test.ts ===\n")
await testGetActiveSessionPathRejectsTraversalFile()
await testReadSessionFileRejectsStampTraversal()
await testReadActiveMdRejectsManifestTraversal()
await testWriteSessionFileRejectsStampTraversal()
await testSafeWriteStillCreatesValidSessionFile()

process.stderr.write(`\n--- Results: ${passed} passed, ${failed_} failed ---\n`)
if (failed_ > 0) process.exit(1)
