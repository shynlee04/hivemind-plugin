import {
  executeAutoCommit,
  extractModifiedFiles,
  generateCommitMessage,
  shouldAutoCommit,
} from "../src/lib/auto-commit.js"

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

function createMockShell(opts: { failCommit?: boolean } = {}) {
  const commands: string[] = []

  const shell = async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let command = strings[0] ?? ""
    for (let index = 0; index < values.length; index++) {
      command += String(values[index])
      command += strings[index + 1] ?? ""
    }
    const normalized = command.trim()
    commands.push(normalized)

    if (opts.failCommit && normalized.includes("git -C") && normalized.includes("commit -m")) {
      throw new Error("nothing to commit, working tree clean")
    }

    return { stdout: "", stderr: "" }
  }

  return {
    shell: shell as any,
    commands,
  }
}

function test_shouldAutoCommit() {
  process.stderr.write("\n--- auto-commit: shouldAutoCommit ---\n")
  assert(
    shouldAutoCommit({
      tool: "write",
      hasActiveTask: true,
      taskStatus: "in_progress",
      configEnabled: true,
    }),
    "auto-commits when active task in progress",
  )
  assert(
    !shouldAutoCommit({
      tool: "write",
      hasActiveTask: false,
      taskStatus: undefined,
      configEnabled: true,
    }),
    "does not auto-commit without active task",
  )
  assert(
    !shouldAutoCommit({
      tool: "write",
      hasActiveTask: true,
      taskStatus: "in_progress",
      configEnabled: false,
    }),
    "does not auto-commit when config disabled",
  )
  assert(
    !shouldAutoCommit({
      tool: "write",
      hasActiveTask: true,
      taskStatus: "complete",
      configEnabled: true,
    }),
    "does not auto-commit for completed tasks",
  )
  assert(
    shouldAutoCommit({
      tool: "bash",
      hasActiveTask: true,
      taskStatus: "active",
      configEnabled: true,
    }),
    "auto-commits bash with active task",
  )
}

function test_generateCommitMessage() {
  process.stderr.write("\n--- auto-commit: generateCommitMessage ---\n")
  const withFiles = generateCommitMessage({
    tool: "write",
    directory: "/tmp/project",
    files: ["src/a.ts", "src/b.ts"],
  })
  assert(withFiles.startsWith("chore(auto-commit):"), "commit message uses conventional prefix")
  assert(withFiles.includes("2 file changes"), "commit message includes file count")

  const withoutFiles = generateCommitMessage({
    tool: "edit",
    directory: "/tmp/project",
  })
  assert(withoutFiles.includes("after edit"), "commit message includes normalized tool name")
}

function test_extractModifiedFiles() {
  process.stderr.write("\n--- auto-commit: extractModifiedFiles ---\n")
  const metadata = {
    modifiedFiles: ["src/a.ts", { path: "src/b.ts" }],
    details: {
      changed_files: ["src/c.ts", { filePath: "src/d.ts" }],
    },
  }

  const files = extractModifiedFiles(metadata, ["[via write]", "src/e.ts"])
  assert(files.length === 5, "extracts and de-duplicates modified files")
  assert(files.includes("src/a.ts"), "extract includes direct file entry")
  assert(files.includes("src/d.ts"), "extract includes nested object entry")
  assert(!files.some((entry) => entry.startsWith("[via ")), "extract filters synthetic fallback markers")
}

async function test_executeAutoCommitSuccess() {
  process.stderr.write("\n--- auto-commit: execute success ---\n")
  const { shell, commands } = createMockShell()
  const result = await executeAutoCommit({
    tool: "write",
    directory: "/tmp/project",
    files: ["src/a.ts"],
    shell,
  })

  assert(result.success, "executeAutoCommit returns success when git commands succeed")
  assert(commands.length === 2, "executeAutoCommit runs add and commit")
  assert(commands[0] === "git -C /tmp/project add -A", "executeAutoCommit runs git add")
  assert(commands[1].includes("git -C /tmp/project commit -m"), "executeAutoCommit runs git commit")
}

async function test_executeAutoCommitFailure() {
  process.stderr.write("\n--- auto-commit: execute failure ---\n")
  const { shell } = createMockShell({ failCommit: true })
  const result = await executeAutoCommit({
    tool: "write",
    directory: "/tmp/project",
    shell,
  })

  assert(!result.success, "executeAutoCommit returns failure when commit fails")
  assert(result.message.includes("Auto-commit failed"), "failure includes auto-commit error message")
}

async function test_executeAutoCommitNoShell() {
  process.stderr.write("\n--- auto-commit: no shell fallback ---\n")
  const result = await executeAutoCommit({
    tool: "write",
    directory: "/tmp/project",
    shell: null,
  })
  assert(!result.success, "executeAutoCommit returns failure when shell is unavailable")
  assert(result.message.includes("shell unavailable"), "no shell failure message is clear")
}

async function main() {
  process.stderr.write("=== Auto-commit Tests ===\n")

  test_shouldAutoCommit()
  test_generateCommitMessage()
  test_extractModifiedFiles()
  await test_executeAutoCommitSuccess()
  await test_executeAutoCommitFailure()
  await test_executeAutoCommitNoShell()

  process.stderr.write(`\n=== Auto-commit: ${passed} passed, ${failed_} failed ===\n`)
  if (failed_ > 0) process.exit(1)
}

main()
