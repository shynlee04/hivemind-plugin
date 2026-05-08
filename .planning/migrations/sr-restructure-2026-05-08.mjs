#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs"
import path from "node:path"

const root = process.cwd()
const sourceDirs = ["src", "tests", "eval"]
const rootSectors = new Set(["shared", "schema-kernel", "task-management", "coordination", "features", "config", "routing", "hooks", "tools"])

const priorAliases = [
  ["src/lib/types.ts", "src/shared/types.ts"],
  ["src/lib/helpers.ts", "src/shared/helpers.ts"],
  ["src/lib/state.ts", "src/shared/state.ts"],
  ["src/lib/task-status.ts", "src/shared/task-status.ts"],
  ["src/lib/runtime.ts", "src/shared/runtime.ts"],
  ["src/lib/runtime-policy.ts", "src/shared/runtime-policy.ts"],
  ["src/lib/workspace-runtime-policy.ts", "src/shared/workspace-runtime-policy.ts"],
  ["src/lib/app-api.ts", "src/shared/app-api.ts"],
  ["src/lib/session-api.ts", "src/shared/session-api.ts"],
  ["src/lib/plugin-tool-output-summary.ts", "src/shared/plugin-tool-output-summary.ts"],
  ["src/lib/security/path-scope.ts", "src/shared/security/path-scope.ts"],
  ["src/lib/security/redaction.ts", "src/shared/security/redaction.ts"],
  ["src/lib/continuity.ts", "src/task-management/continuity/index.ts"],
  ["src/lib/delegation-persistence.ts", "src/task-management/continuity/delegation-persistence.ts"],
  ["src/lib/session-journal.ts", "src/task-management/journal/index.ts"],
  ["src/lib/journal-query.ts", "src/task-management/journal/query.ts"],
  ["src/lib/journal-replay.ts", "src/task-management/journal/replay.ts"],
  ["src/lib/execution-lineage.ts", "src/task-management/journal/execution-lineage.ts"],
  ["src/lib/lifecycle-manager.ts", "src/task-management/lifecycle/index.ts"],
  ["src/lib/delegation-manager.ts", "src/coordination/delegation/manager.ts"],
  ["src/lib/delegation-state-machine.ts", "src/coordination/delegation/state-machine.ts"],
  ["src/lib/delegation-types.ts", "src/coordination/delegation/types.ts"],
  ["src/lib/category-gates.ts", "src/coordination/delegation/category-gates.ts"],
  ["src/lib/category-gate-audit.ts", "src/coordination/delegation/category-gate-audit.ts"],
  ["src/lib/sdk-delegation.ts", "src/coordination/sdk-delegation/handler.ts"],
  ["src/lib/command-delegation.ts", "src/coordination/command-delegation/handler.ts"],
  ["src/lib/concurrency.ts", "src/coordination/concurrency/queue.ts"],
  ["src/lib/completion-detector.ts", "src/coordination/completion/detector.ts"],
  ["src/lib/notification-handler.ts", "src/coordination/completion/notification-handler.ts"],
  ["src/lib/auto-loop.ts", "src/coordination/spawner/auto-loop.ts"],
  ["src/lib/ralph-loop.ts", "src/coordination/spawner/ralph-loop.ts"],
  ["src/lib/spawner-types.ts", "src/coordination/spawner/spawner-types.ts"],
]

const directoryAliases = [
  ["src/lib/event-tracker", "src/task-management/journal/event-tracker"],
  ["src/lib/trajectory", "src/task-management/trajectory"],
  ["src/lib/recovery", "src/task-management/recovery"],
  ["src/lib/spawner", "src/coordination/spawner"],
]

const moves = [
  ["src/lib/pty", "src/features/background-command/pty"],
  ["src/lib/doc-intelligence", "src/features/doc-intelligence"],
  ["src/lib/runtime-pressure", "src/features/runtime-pressure"],
  ["src/lib/agent-work-contracts", "src/features/agent-work-contracts"],
  ["src/lib/sdk-supervisor", "src/features/sdk-supervisor"],
  ["src/lib/prompt-packet", "src/features/prompt-packet"],
  ["src/lib/runtime-detection", "src/features/bootstrap/runtime-detection"],
  ["src/lib/control-plane", "src/features/bootstrap/control-plane"],
  ["src/lib/framework-detector.ts", "src/features/bootstrap/framework-detector.ts"],
  ["src/lib/primitive-loader.ts", "src/features/bootstrap/primitive-loader.ts"],
  ["src/lib/primitive-registry.ts", "src/features/bootstrap/primitive-registry.ts"],
  ["src/lib/primitive-scanners.ts", "src/features/bootstrap/primitive-scanners.ts"],
  ["src/lib/cross-primitive-validator.ts", "src/features/bootstrap/cross-primitive-validator.ts"],
  ["src/lib/runtime-validator.ts", "src/features/bootstrap/runtime-validator.ts"],
  ["src/lib/bootstrap-structure.ts", "src/features/bootstrap/structure.ts"],
  ["src/lib/config-subscriber.ts", "src/config/subscriber.ts"],
  ["src/lib/config-compiler.ts", "src/config/compiler.ts"],
  ["src/lib/config-workflow", "src/config/workflow"],
  ["src/lib/session-entry", "src/routing/session-entry"],
  ["src/lib/command-engine", "src/routing/command-engine"],
  ["src/lib/behavioral-profile", "src/routing/behavioral-profile"],
  ["src/hooks/create-core-hooks.ts", "src/hooks/lifecycle/core-hooks.ts"],
  ["src/hooks/create-session-hooks.ts", "src/hooks/lifecycle/session-hooks.ts"],
  ["src/hooks/create-tool-guard-hooks.ts", "src/hooks/guards/tool-guard-hooks.ts"],
  ["src/hooks/governance-block.ts", "src/hooks/guards/governance-block.ts"],
  ["src/hooks/plugin-event-observers.ts", "src/hooks/observers/event-observers.ts"],
  ["src/hooks/toggle-gates.ts", "src/hooks/transforms/toggle-gates.ts"],
  ["src/hooks/tool-after-composer.ts", "src/hooks/transforms/tool-after-composer.ts"],
  ["src/hooks/hook-cqrs-boundary.ts", "src/hooks/composition/cqrs-boundary.ts"],
  ["src/tools/delegate-task.ts", "src/tools/delegation/delegate-task.ts"],
  ["src/tools/delegation-status.ts", "src/tools/delegation/delegation-status.ts"],
  ["src/tools/session-journal-export.ts", "src/tools/session/session-journal-export.ts"],
  ["src/tools/session-patch", "src/tools/session/session-patch"],
  ["src/tools/configure-primitive.ts", "src/tools/config/configure-primitive.ts"],
  ["src/tools/configure-primitive-paths.ts", "src/tools/config/configure-primitive-paths.ts"],
  ["src/tools/validate-restart.ts", "src/tools/config/validate-restart.ts"],
  ["src/tools/bootstrap-init.ts", "src/tools/config/bootstrap-init.ts"],
  ["src/tools/bootstrap-recover.ts", "src/tools/config/bootstrap-recover.ts"],
  ["src/tools/hivemind-doc.ts", "src/tools/hivemind/hivemind-doc.ts"],
  ["src/tools/hivemind-trajectory.ts", "src/tools/hivemind/hivemind-trajectory.ts"],
  ["src/tools/hivemind-pressure.ts", "src/tools/hivemind/hivemind-pressure.ts"],
  ["src/tools/hivemind-agent-work.ts", "src/tools/hivemind/hivemind-agent-work.ts"],
  ["src/tools/hivemind-sdk-supervisor.ts", "src/tools/hivemind/hivemind-sdk-supervisor.ts"],
  ["src/tools/hivemind-command-engine.ts", "src/tools/hivemind/hivemind-command-engine.ts"],
  ["src/tools/run-background-command.ts", "src/tools/hivemind/run-background-command.ts"],
  ["src/tools/prompt-skim", "src/tools/prompt/prompt-skim"],
  ["src/tools/prompt-analyze", "src/tools/prompt/prompt-analyze"],
]

const moduleGuides = new Map([
  ["src/features/AGENTS.md", "# Features Sector Guidance\n\n`src/features/` owns standalone runtime feature modules that are neither routing, config, coordination, task-management, nor shared leaf utilities. Keep feature code behind typed public exports and do not write runtime state outside `.hivemind/`.\n"],
  ["src/features/background-command/AGENTS.md", "# Background Command Feature Guidance\n\nOwns PTY/headless command execution support. Preserve Bun-optional behavior and keep process lifecycle evidence observable through tools and coordination modules.\n"],
  ["src/features/bootstrap/AGENTS.md", "# Bootstrap Feature Guidance\n\nOwns bootstrap structure, primitive loading, framework/runtime detection, and validation helpers consumed by CLI and config tools. Do not store runtime state in `.opencode/`.\n"],
  ["src/config/AGENTS.md", "# Config Sector Guidance\n\n`src/config/` owns config compilation, subscription, and configuration workflow state machines. Keep schema contracts in `src/schema-kernel/` and expose config behavior through typed modules.\n"],
  ["src/routing/AGENTS.md", "# Routing Sector Guidance\n\n`src/routing/` owns session entry, behavioral profile resolution, command interpretation, and workflow route selection. Routing may classify and dispatch; it must not perform durable writes.\n"],
  ["src/hooks/lifecycle/AGENTS.md", "# Hook Lifecycle Guidance\n\nLifecycle hooks compose read-side OpenCode event behavior. They must preserve CQRS and avoid durable writes.\n"],
  ["src/hooks/guards/AGENTS.md", "# Hook Guard Guidance\n\nGuard hooks enforce policy and governance decisions around tool execution. They may block or shape responses but must not own durable state.\n"],
  ["src/hooks/observers/AGENTS.md", "# Hook Observer Guidance\n\nObservers translate runtime events into append-only evidence through authorized task-management writers.\n"],
  ["src/hooks/transforms/AGENTS.md", "# Hook Transform Guidance\n\nTransforms shape system/messages/tool-after payloads. Keep transformations deterministic and side-effect free.\n"],
  ["src/hooks/composition/AGENTS.md", "# Hook Composition Guidance\n\nComposition utilities wire hook factories and CQRS boundaries. Keep this layer dependency-light.\n"],
  ["src/tools/delegation/AGENTS.md", "# Delegation Tools Guidance\n\nDelegation tools are write-side OpenCode tool entrypoints for session/task delegation. Keep validation at the boundary and orchestration in coordination modules.\n"],
  ["src/tools/session/AGENTS.md", "# Session Tools Guidance\n\nSession tools expose bounded session patching and journal export surfaces. Preserve state-root separation and response envelopes.\n"],
  ["src/tools/config/AGENTS.md", "# Config Tools Guidance\n\nConfig tools mutate or validate OpenCode primitives and bootstrap layout through explicit schemas. Do not bypass config module contracts.\n"],
  ["src/tools/hivemind/AGENTS.md", "# Hivemind Tools Guidance\n\nHivemind tools expose runtime control-plane and evidence-query surfaces. Tool entrypoints validate inputs and delegate behavior to feature or task-management modules.\n"],
  ["src/tools/prompt/AGENTS.md", "# Prompt Tools Guidance\n\nPrompt tools perform bounded prompt skimming and analysis through schema-kernel contracts. Keep outputs compact and deterministic.\n"],
])

const pathMap = new Map()

function rel(file) {
  return path.relative(root, file).split(path.sep).join("/")
}

function abs(file) {
  return path.resolve(root, file)
}

function isSourceFile(file) {
  return file.endsWith(".ts") || file.endsWith(".d.ts")
}

function walk(dir) {
  if (!existsSync(dir)) return []
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    const stats = statSync(full)
    if (stats.isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

function registerAlias(fromRel, toRel) {
  pathMap.set(abs(fromRel), abs(toRel))
}

for (const [fromRel, toRel] of priorAliases) registerAlias(fromRel, toRel)
for (const [fromDir, toDir] of directoryAliases) {
  for (const file of walk(abs(toDir)).filter(isSourceFile)) {
    const suffix = rel(file).slice(toDir.length)
    registerAlias(`${fromDir}${suffix}`, rel(file))
  }
}

function registerMove(fromRel, toRel) {
  const fromAbs = abs(fromRel)
  const toAbs = abs(toRel)
  if (!existsSync(fromAbs)) {
    if (existsSync(toAbs)) {
      const stats = statSync(toAbs)
      if (stats.isDirectory()) {
        for (const file of walk(toAbs).filter(isSourceFile)) {
          const suffix = rel(file).slice(toRel.length)
          pathMap.set(abs(`${fromRel}${suffix}`), file)
        }
      } else if (isSourceFile(toRel)) {
        pathMap.set(fromAbs, toAbs)
      }
    }
    return false
  }
  const stats = statSync(fromAbs)
  if (stats.isDirectory()) {
    for (const file of walk(fromAbs).filter(isSourceFile)) {
      const suffix = rel(file).slice(fromRel.length)
      pathMap.set(file, abs(`${toRel}${suffix}`))
    }
  } else if (isSourceFile(fromRel)) {
    pathMap.set(fromAbs, toAbs)
  }
  return true
}

for (const [fromRel, toRel] of moves) registerMove(fromRel, toRel)

const moved = []
for (const [fromRel, toRel] of moves) {
  const fromAbs = abs(fromRel)
  const toAbs = abs(toRel)
  if (!existsSync(fromAbs)) continue
  if (existsSync(toAbs)) throw new Error(`Refusing to overwrite ${toRel}`)
  mkdirSync(path.dirname(toAbs), { recursive: true })
  renameSync(fromAbs, toAbs)
  moved.push(`${fromRel} -> ${toRel}`)
}

for (const [fileRel, content] of moduleGuides) {
  const fileAbs = abs(fileRel)
  if (existsSync(fileAbs)) continue
  mkdirSync(path.dirname(fileAbs), { recursive: true })
  writeFileSync(fileAbs, content)
}

function resolveImport(fileAbs, specifier) {
  if (!specifier.startsWith(".")) return undefined
  const base = path.resolve(path.dirname(fileAbs), specifier)
  const candidates = []
  if (specifier.endsWith(".js")) candidates.push(base.slice(0, -3) + ".ts")
  if (specifier.endsWith(".d.ts")) candidates.push(base)
  candidates.push(`${base}.ts`, `${base}.d.ts`, path.join(base, "index.ts"))
  const mapped = candidates.find((candidate) => pathMap.has(candidate))
  if (mapped) return mapped

  const siblingBase = path.resolve(path.dirname(fileAbs), "..", specifier)
  const siblingCandidates = []
  if (specifier.endsWith(".js")) siblingCandidates.push(siblingBase.slice(0, -3) + ".ts")
  siblingCandidates.push(`${siblingBase}.ts`, `${siblingBase}.d.ts`, path.join(siblingBase, "index.ts"))
  const siblingMapped = siblingCandidates.find((candidate) => pathMap.has(candidate))
  if (siblingMapped) return siblingMapped

  const parts = specifier.split("/").filter((part) => part !== "." && part !== "..")
  const sectorIndex = parts.findIndex((part) => part === "lib" || rootSectors.has(part))
  if (sectorIndex < 0) return undefined

  const sector = parts[sectorIndex]
  const rest = parts.slice(sectorIndex + 1).join("/")
  if (sector === "lib") {
    const oldRoot = path.resolve(root, "src", "lib", rest)
    const oldCandidates = []
    if (specifier.endsWith(".js")) oldCandidates.push(oldRoot.slice(0, -3) + ".ts")
    oldCandidates.push(`${oldRoot}.ts`, `${oldRoot}.d.ts`, path.join(oldRoot, "index.ts"))
    return oldCandidates.find((candidate) => pathMap.has(candidate))
  }

  const sectorRoot = path.resolve(root, "src", sector, rest)
  const sectorCandidates = []
  if (specifier.endsWith(".js")) sectorCandidates.push(sectorRoot.slice(0, -3) + ".ts")
  sectorCandidates.push(`${sectorRoot}.ts`, `${sectorRoot}.d.ts`, path.join(sectorRoot, "index.ts"))
  return sectorCandidates.find((candidate) => existsSync(candidate))
}

function toSpecifier(fromFileAbs, targetAbs, oldSpecifier) {
  let relative = path.relative(path.dirname(fromFileAbs), targetAbs).split(path.sep).join("/")
  if (!relative.startsWith(".")) relative = `./${relative}`
  if (relative.endsWith(".d.ts")) return relative
  if (oldSpecifier.endsWith(".js") || oldSpecifier.includes(".js")) return relative.replace(/\.ts$/, ".js")
  return relative.replace(/\.ts$/, "")
}

const importLiteral = /(["'])(\.\.?\/[^"']+)\1/g
const rewritten = []
for (const sourceDir of sourceDirs) {
  for (const file of walk(abs(sourceDir)).filter(isSourceFile)) {
    const before = readFileSync(file, "utf8")
    const after = before.replace(importLiteral, (match, quote, specifier) => {
      const resolved = resolveImport(file, specifier)
      if (!resolved) return match
      const target = pathMap.get(resolved) ?? resolved
      return `${quote}${toSpecifier(file, target, specifier)}${quote}`
    })
    if (after !== before) {
      writeFileSync(file, after)
      rewritten.push(rel(file))
    }
  }
}

const stale = []
for (const sourceDir of sourceDirs) {
  for (const file of walk(abs(sourceDir)).filter(isSourceFile)) {
    const body = readFileSync(file, "utf8")
    if (body.includes("/src/lib/") || body.includes("../lib/") || body.includes("../../lib/") || body.includes("../../../lib/")) stale.push(rel(file))
  }
}

console.log(JSON.stringify({ moved, rewritten, stale }, null, 2))
if (stale.length > 0) process.exitCode = 1
