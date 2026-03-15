import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { execSync } from "node:child_process"

const codeIntelModuleHref = new URL("../../src/lib/code-intel/index.ts", import.meta.url).href

// ─── Type aliases ────────────────────────────────────────────────────────

type CompressedCodemap = {
  version: string
  createdAt: string
  projectRoot: string
  totalTokens: number
  originalTotalTokens: number
  compressionRatio: number
  files: Array<{
    path: string
    hash: string
    extension: string
    tokenCount: number
    originalTokenCount: number
    signatures: Array<{ type: string; name: string; signature: string; lineStart: number; lineEnd: number; exported: boolean }>
    imports: string[]
    exports: string[]
  }>
}

type KnowledgeCommitResult = {
  success: boolean
  message: string
  commitHash?: string
}

type KnowledgeCommitOptions = {
  message?: string
  skipCi?: boolean
}

type LastKnowledgeCommit = {
  hash: string
  date: string
  message: string
}

// ─── Helper ──────────────────────────────────────────────────────────────

function makeSampleCodemap(projectRoot: string): CompressedCodemap {
  return {
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    projectRoot,
    totalTokens: 500,
    originalTotalTokens: 2000,
    compressionRatio: 75,
    files: [
      {
        path: "src/index.ts",
        hash: "abc123",
        extension: ".ts",
        tokenCount: 500,
        originalTokenCount: 2000,
        signatures: [
          { type: "function", name: "main", signature: "function main(): void", lineStart: 1, lineEnd: 10, exported: true },
        ],
        imports: [],
        exports: ["main"],
      },
    ],
  }
}

async function createGitRepo(dir: string): Promise<void> {
  execSync("git init", { cwd: dir, stdio: "ignore" })
  execSync("git config user.email test@test.com", { cwd: dir, stdio: "ignore" })
  execSync("git config user.name Test", { cwd: dir, stdio: "ignore" })
  // Create initial commit so we have a valid HEAD
  await writeFile(join(dir, ".gitkeep"), "")
  execSync("git add -A && git commit -m 'init'", { cwd: dir, stdio: "ignore" })
}

// ─── Tests ───────────────────────────────────────────────────────────────

describe("Phase 3 — knowledge-commits", () => {
  it("commitKnowledgeState writes files and creates commit", async () => {
    const mod = await import(codeIntelModuleHref) as {
      commitKnowledgeState: (root: string, codemap: CompressedCodemap, opts?: KnowledgeCommitOptions) => Promise<KnowledgeCommitResult>
    }

    const tmpDir = await mkdtemp(join(tmpdir(), "knowledge-commit-"))
    try {
      await createGitRepo(tmpDir)
      const codemap = makeSampleCodemap(tmpDir)

      const result = await mod.commitKnowledgeState(tmpDir, codemap)

      assert.equal(result.success, true)
      assert.ok(result.commitHash, "Expected a commit hash")
      assert.ok(result.message.includes(result.commitHash!), "Message should contain hash")

      // Verify git log shows our commit
      const log = execSync("git log --oneline -1", { cwd: tmpDir, encoding: "utf-8" })
      assert.ok(log.includes("code intelligence"), `Git log should contain 'code intelligence': ${log}`)
    } finally {
      await rm(tmpDir, { recursive: true, force: true })
    }
  })

  it("commitKnowledgeState returns 'no changes' when called twice without modifications", async () => {
    const mod = await import(codeIntelModuleHref) as {
      commitKnowledgeState: (root: string, codemap: CompressedCodemap, opts?: KnowledgeCommitOptions) => Promise<KnowledgeCommitResult>
    }

    const tmpDir = await mkdtemp(join(tmpdir(), "knowledge-nochange-"))
    try {
      await createGitRepo(tmpDir)
      const codemap = makeSampleCodemap(tmpDir)

      // First commit
      const first = await mod.commitKnowledgeState(tmpDir, codemap)
      assert.equal(first.success, true)

      // Second commit — same codemap, no changes
      const second = await mod.commitKnowledgeState(tmpDir, codemap)
      assert.equal(second.success, true)
      assert.ok(second.message.includes("No knowledge changes"), `Expected 'no changes' message, got: ${second.message}`)
    } finally {
      await rm(tmpDir, { recursive: true, force: true })
    }
  })

  it("commitKnowledgeState accepts custom message", async () => {
    const mod = await import(codeIntelModuleHref) as {
      commitKnowledgeState: (root: string, codemap: CompressedCodemap, opts?: KnowledgeCommitOptions) => Promise<KnowledgeCommitResult>
    }

    const tmpDir = await mkdtemp(join(tmpdir(), "knowledge-custommsg-"))
    try {
      await createGitRepo(tmpDir)
      const codemap = makeSampleCodemap(tmpDir)

      const result = await mod.commitKnowledgeState(tmpDir, codemap, {
        message: "custom: knowledge snapshot",
      })

      assert.equal(result.success, true)
      const log = execSync("git log --oneline -1", { cwd: tmpDir, encoding: "utf-8" })
      assert.ok(log.includes("custom: knowledge snapshot"), `Expected custom message in log: ${log}`)
    } finally {
      await rm(tmpDir, { recursive: true, force: true })
    }
  })

  it("hasKnowledgeChanged detects uncommitted knowledge files", async () => {
    const mod = await import(codeIntelModuleHref) as {
      hasKnowledgeChanged: (root: string) => boolean
      commitKnowledgeState: (root: string, codemap: CompressedCodemap, opts?: KnowledgeCommitOptions) => Promise<KnowledgeCommitResult>
    }

    const tmpDir = await mkdtemp(join(tmpdir(), "knowledge-changed-"))
    try {
      await createGitRepo(tmpDir)

      // Before any writes — no changes
      assert.equal(mod.hasKnowledgeChanged(tmpDir), false)

      // Write knowledge files without committing
      const knowledgeDir = join(tmpDir, ".hivemind/codebase/code-intel")
      await mkdir(knowledgeDir, { recursive: true })
      await writeFile(join(knowledgeDir, "compressed-codemap.json"), "{}")

      // Now there should be changes
      // Note: git status tracks new untracked files too — stage first
      execSync("git add -A", { cwd: tmpDir, stdio: "ignore" })
      assert.equal(mod.hasKnowledgeChanged(tmpDir), true)

      // After commit — no changes
      const codemap = makeSampleCodemap(tmpDir)
      await mod.commitKnowledgeState(tmpDir, codemap)
      assert.equal(mod.hasKnowledgeChanged(tmpDir), false)
    } finally {
      await rm(tmpDir, { recursive: true, force: true })
    }
  })

  it("getLastKnowledgeCommit returns null when no knowledge commits exist", async () => {
    const mod = await import(codeIntelModuleHref) as {
      getLastKnowledgeCommit: (root: string) => LastKnowledgeCommit | null
    }

    const tmpDir = await mkdtemp(join(tmpdir(), "knowledge-nolast-"))
    try {
      await createGitRepo(tmpDir)
      const result = mod.getLastKnowledgeCommit(tmpDir)
      assert.equal(result, null)
    } finally {
      await rm(tmpDir, { recursive: true, force: true })
    }
  })

  it("getLastKnowledgeCommit returns info after a knowledge commit", async () => {
    const mod = await import(codeIntelModuleHref) as {
      commitKnowledgeState: (root: string, codemap: CompressedCodemap, opts?: KnowledgeCommitOptions) => Promise<KnowledgeCommitResult>
      getLastKnowledgeCommit: (root: string) => LastKnowledgeCommit | null
    }

    const tmpDir = await mkdtemp(join(tmpdir(), "knowledge-last-"))
    try {
      await createGitRepo(tmpDir)
      const codemap = makeSampleCodemap(tmpDir)

      await mod.commitKnowledgeState(tmpDir, codemap)
      const last = mod.getLastKnowledgeCommit(tmpDir)

      assert.ok(last !== null, "Expected non-null last commit")
      assert.ok(last!.hash.length > 0, "Expected non-empty hash")
      assert.ok(last!.date.length > 0, "Expected non-empty date")
      assert.ok(last!.message.includes("code intelligence"), "Expected message with 'code intelligence'")
    } finally {
      await rm(tmpDir, { recursive: true, force: true })
    }
  })

  it("commitKnowledgeState fails gracefully with invalid project root", async () => {
    const mod = await import(codeIntelModuleHref) as {
      commitKnowledgeState: (root: string, codemap: CompressedCodemap, opts?: KnowledgeCommitOptions) => Promise<KnowledgeCommitResult>
    }

    const codemap = makeSampleCodemap("/nonexistent/path")
    const result = await mod.commitKnowledgeState("/nonexistent/path", codemap)

    assert.equal(result.success, false)
    assert.ok(result.message.includes("failed"), `Expected failure message, got: ${result.message}`)
  })
})
