/**
 * OpenCode Asset Sync Tests
 *
 * Verifies:
 * - project/global/both sync targets
 * - idempotent no-clobber default behavior
 * - overwrite behavior
 * - init + re-init integration
 */

import { mkdtemp, mkdir, readFile, rm, unlink, writeFile } from "node:fs/promises"
import { existsSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { initProject } from "../src/cli/init.js"
import { syncOpencodeAssets } from "../src/cli/sync-assets.js"

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

async function withTmpDir(prefix: string, fn: (dir: string) => Promise<void>) {
  const dir = await mkdtemp(join(tmpdir(), prefix))
  try {
    await fn(dir)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

async function test_project_sync_default() {
  process.stderr.write("\n--- sync-assets: project target (default) ---\n")
  await withTmpDir("hm-sync-project-", async (dir) => {
    const result = await syncOpencodeAssets(dir, {
      silent: true,
    })

    const commandPath = join(dir, ".opencode", "commands", "hivemind-scan.md")
    const skillPath = join(dir, ".opencode", "skills", "hivemind-governance", "SKILL.md")

    assert(result.targets.length === 1, "one target synced by default")
    assert(existsSync(commandPath), "commands synced to project .opencode")
    assert(existsSync(skillPath), "skills synced to project .opencode")
  })
}

async function test_no_clobber_default() {
  process.stderr.write("\n--- sync-assets: idempotent no-clobber default ---\n")
  await withTmpDir("hm-sync-noclobber-", async (dir) => {
    await syncOpencodeAssets(dir, { silent: true })

    const commandPath = join(dir, ".opencode", "commands", "hivemind-scan.md")
    writeFileSync(commandPath, "# user-customized\n", "utf-8")

    await syncOpencodeAssets(dir, { silent: true })

    const content = await readFile(commandPath, "utf-8")
    assert(content === "# user-customized\n", "existing file preserved when overwrite=false")
  })
}

async function test_overwrite_enabled() {
  process.stderr.write("\n--- sync-assets: overwrite existing files ---\n")
  await withTmpDir("hm-sync-overwrite-", async (dir) => {
    await syncOpencodeAssets(dir, { silent: true })

    const commandPath = join(dir, ".opencode", "commands", "hivemind-scan.md")
    writeFileSync(commandPath, "# user-customized\n", "utf-8")

    await syncOpencodeAssets(dir, { silent: true, overwrite: true })

    const content = await readFile(commandPath, "utf-8")
    assert(content !== "# user-customized\n", "existing file replaced when overwrite=true")
  })
}

async function test_global_target() {
  process.stderr.write("\n--- sync-assets: global target ---\n")
  await withTmpDir("hm-sync-global-", async (dir) => {
    const globalDir = join(dir, "mock-global-opencode")
    const result = await syncOpencodeAssets(dir, {
      target: "global",
      globalBaseDir: globalDir,
      silent: true,
    })

    const commandPath = join(globalDir, "commands", "hivemind-scan.md")
    const skillPath = join(globalDir, "skills", "hivemind-governance", "SKILL.md")
    const projectCommandPath = join(dir, ".opencode", "commands", "hivemind-scan.md")

    assert(result.targets.length === 1, "global-only sync has one target")
    assert(existsSync(commandPath), "commands synced to global target")
    assert(existsSync(skillPath), "skills synced to global target")
    assert(!existsSync(projectCommandPath), "project .opencode not written for global-only target")
  })
}

async function test_both_targets() {
  process.stderr.write("\n--- sync-assets: both targets ---\n")
  await withTmpDir("hm-sync-both-", async (dir) => {
    const globalDir = join(dir, "mock-global-opencode")
    const result = await syncOpencodeAssets(dir, {
      target: "both",
      globalBaseDir: globalDir,
      silent: true,
    })

    const projectCommandPath = join(dir, ".opencode", "commands", "hivemind-scan.md")
    const globalCommandPath = join(globalDir, "commands", "hivemind-scan.md")

    assert(result.targets.length === 2, "both target sync writes two targets")
    assert(existsSync(projectCommandPath), "project target written")
    assert(existsSync(globalCommandPath), "global target written")
  })
}

async function test_init_and_reinit_sync() {
  process.stderr.write("\n--- sync-assets: init + re-init integration ---\n")
  await withTmpDir("hm-sync-init-", async (dir) => {
    await initProject(dir, { silent: true })

    const commandPath = join(dir, ".opencode", "commands", "hivemind-scan.md")
    assert(existsSync(commandPath), "init syncs opencode assets")

    await unlink(commandPath)
    assert(!existsSync(commandPath), "fixture removed command file")

    await initProject(dir, { silent: true })
    assert(existsSync(commandPath), "re-init restores missing opencode asset")
  })
}

async function test_validation_skips_invalid_assets() {
  process.stderr.write("\n--- sync-assets: validation skips invalid assets ---\n")
  await withTmpDir("hm-sync-validate-", async (dir) => {
    const sourceRoot = join(dir, "mock-source")
    await mkdir(join(sourceRoot, "commands"), { recursive: true })
    await mkdir(join(sourceRoot, "skills", "valid-skill"), { recursive: true })
    await mkdir(join(sourceRoot, "skills", "invalid-skill"), { recursive: true })

    await writeFile(
      join(sourceRoot, "commands", "good.md"),
      "---\ndescription: good\n---\n# Good Command\n",
      "utf-8"
    )
    await writeFile(
      join(sourceRoot, "commands", "bad.txt"),
      "bad-extension",
      "utf-8"
    )
    await writeFile(
      join(sourceRoot, "skills", "valid-skill", "SKILL.md"),
      "# Valid Skill\n",
      "utf-8"
    )
    await writeFile(
      join(sourceRoot, "skills", "invalid-skill", "README.md"),
      "# Missing SKILL marker file\n",
      "utf-8"
    )

    const result = await syncOpencodeAssets(dir, {
      sourceRootDir: sourceRoot,
      groups: ["commands", "skills"],
      silent: true,
    })

    const targetCommandGood = join(dir, ".opencode", "commands", "good.md")
    const targetCommandBad = join(dir, ".opencode", "commands", "bad.txt")
    const targetValidSkill = join(dir, ".opencode", "skills", "valid-skill", "SKILL.md")
    const targetInvalidSkill = join(dir, ".opencode", "skills", "invalid-skill", "README.md")

    assert(existsSync(targetCommandGood), "valid command copied")
    assert(!existsSync(targetCommandBad), "invalid command skipped")
    assert(existsSync(targetValidSkill), "valid skill copied")
    assert(!existsSync(targetInvalidSkill), "invalid skill skipped")
    assert(result.totalInvalid > 0, "invalid assets counted in report")
  })
}

async function test_optional_groups_sync_when_present() {
  process.stderr.write("\n--- sync-assets: optional ecosystem groups sync when present ---\n")
  await withTmpDir("hm-sync-optional-groups-", async (dir) => {
    const sourceRoot = join(dir, "mock-source")
    await mkdir(join(sourceRoot, "agents"), { recursive: true })
    await mkdir(join(sourceRoot, "workflows"), { recursive: true })
    await mkdir(join(sourceRoot, "templates"), { recursive: true })
    await mkdir(join(sourceRoot, "prompts"), { recursive: true })
    await mkdir(join(sourceRoot, "references"), { recursive: true })

    await writeFile(
      join(sourceRoot, "agents", "scanner.md"),
      [
        "---",
        "name: scanner",
        "description: scan specialist",
        "---",
        "",
        "# scanner",
      ].join("\n"),
      "utf-8"
    )
    await writeFile(
      join(sourceRoot, "workflows", "main.yaml"),
      [
        "name: main",
        "steps:",
        "  - name: analyze",
        "    tool: scan_hierarchy",
      ].join("\n"),
      "utf-8"
    )
    await writeFile(join(sourceRoot, "templates", "session.md"), "# session\n", "utf-8")
    await writeFile(join(sourceRoot, "prompts", "audit.md"), "# audit\n", "utf-8")
    await writeFile(join(sourceRoot, "references", "README.md"), "# refs\n", "utf-8")

    await syncOpencodeAssets(dir, {
      sourceRootDir: sourceRoot,
      groups: ["agents", "workflows", "templates", "prompts", "references"],
      silent: true,
    })

    assert(existsSync(join(dir, ".opencode", "agents", "scanner.md")), "agents synced")
    assert(existsSync(join(dir, ".opencode", "workflows", "main.yaml")), "workflows synced")
    assert(existsSync(join(dir, ".opencode", "templates", "session.md")), "templates synced")
    assert(existsSync(join(dir, ".opencode", "prompts", "audit.md")), "prompts synced")
    assert(existsSync(join(dir, ".opencode", "references", "README.md")), "references synced")
  })
}

async function test_validation_skips_invalid_agent_and_workflow_schema() {
  process.stderr.write("\n--- sync-assets: validation skips invalid agent/workflow schema ---\n")
  await withTmpDir("hm-sync-invalid-schema-", async (dir) => {
    const sourceRoot = join(dir, "mock-source")
    await mkdir(join(sourceRoot, "agents"), { recursive: true })
    await mkdir(join(sourceRoot, "workflows"), { recursive: true })

    await writeFile(
      join(sourceRoot, "agents", "invalid-agent.md"),
      "# missing frontmatter\n",
      "utf-8"
    )
    await writeFile(
      join(sourceRoot, "workflows", "invalid-workflow.yaml"),
      [
        "name: invalid-workflow",
        "steps:",
        "  - name: missing_tool",
      ].join("\n"),
      "utf-8"
    )

    const result = await syncOpencodeAssets(dir, {
      sourceRootDir: sourceRoot,
      groups: ["agents", "workflows"],
      silent: true,
    })

    assert(
      !existsSync(join(dir, ".opencode", "agents", "invalid-agent.md")),
      "invalid agent skipped"
    )
    assert(
      !existsSync(join(dir, ".opencode", "workflows", "invalid-workflow.yaml")),
      "invalid workflow skipped"
    )
    assert(result.totalInvalid === 2, "invalid schema counted")
  })
}

async function test_packaged_optional_groups_sync_by_default() {
  process.stderr.write("\n--- sync-assets: packaged optional groups sync by default ---\n")
  await withTmpDir("hm-sync-packaged-optional-", async (dir) => {
    await syncOpencodeAssets(dir, { silent: true })

    assert(
      existsSync(join(dir, ".opencode", "agents", "hivemind-brownfield-orchestrator.md")),
      "packaged agent asset synced"
    )
    assert(
      existsSync(join(dir, ".opencode", "workflows", "hivemind-brownfield-bootstrap.yaml")),
      "packaged workflow asset synced"
    )
    assert(
      existsSync(join(dir, ".opencode", "templates", "hivemind-brownfield-session.md")),
      "packaged template asset synced"
    )
    assert(
      existsSync(join(dir, ".opencode", "prompts", "hivemind-brownfield-remediation.md")),
      "packaged prompt asset synced"
    )
    assert(
      existsSync(join(dir, ".opencode", "references", "hivemind-brownfield-checklist.md")),
      "packaged reference asset synced"
    )
  })
}

async function main() {
  process.stderr.write("=== Sync Assets Tests ===\n")

  await test_project_sync_default()
  await test_no_clobber_default()
  await test_overwrite_enabled()
  await test_global_target()
  await test_both_targets()
  await test_init_and_reinit_sync()
  await test_validation_skips_invalid_assets()
  await test_optional_groups_sync_when_present()
  await test_validation_skips_invalid_agent_and_workflow_schema()
  await test_packaged_optional_groups_sync_by_default()

  process.stderr.write(`\n=== Sync Assets: ${passed} passed, ${failed_} failed ===\n`)
  if (failed_ > 0) process.exit(1)
}

main()
