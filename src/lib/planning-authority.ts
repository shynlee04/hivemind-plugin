import { existsSync, lstatSync } from "node:fs"
import {
  mkdir,
  readFile,
  readdir,
  readlink,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises"
import { basename, dirname, join, relative } from "node:path"

import { getEffectivePaths } from "./paths.js"

export const PLANNING_AUTHORITY_DATE = "2026-03-14"
export const ACTIVE_PHASE_INDEX_FILENAME = `active-phase-index-${PLANNING_AUTHORITY_DATE}.md`
export const GOVERNANCE_FILENAME = `project-governance-${PLANNING_AUTHORITY_DATE}.md`
export const MASTER_PLAN_FILENAME = `project-master-plan-${PLANNING_AUTHORITY_DATE}.md`
export const LEGACY_PLAN_ARCHIVE_DIRNAME = `legacy-${PLANNING_AUTHORITY_DATE}`

export type PlanArchiveClassification =
  | "reference"
  | "history"
  | "superseded"
  | "migration-evidence"

export interface PlanningAuthorityPaths {
  docsDir: string
  governanceDir: string
  governanceDoc: string
  plansDir: string
  masterPlanDoc: string
  activePhaseIndex: string
  stateAuthorityPass: string
  plansArchiveDir: string
  plansLegacyArchiveDir: string
  rootAgents: string
  rootPlan: string
  mirroredAgents: Array<{ path: string; target: string }>
}

export interface PlanningArchiveEntry {
  name: string
  classification: PlanArchiveClassification
  sourcePath: string
  archivePath: string
  kind: "file" | "directory" | "symlink"
}

export interface PlanningAuthorityStatus {
  paths: PlanningAuthorityPaths
  brokenSymlinks: Array<{
    path: string
    expectedTarget: string
    actualTarget: string | null
  }>
  missingDocs: string[]
  missingLedgerPaths: string[]
  backlogEntries: PlanningArchiveEntry[]
  archivedEntries: PlanningArchiveEntry[]
}

function renderDefaultGovernanceDoc(): string {
  return `# Project Governance — AGENTS Canonical

**Last Updated**: ${PLANNING_AUTHORITY_DATE}
**Version**: 3.4-long-haul-planning-refresh
**Consumed Via**: root \`AGENTS.md\`, \`.hivemind/AGENTS.md\`, \`.opencode/AGENTS.md\`, \`src/AGENTS.md\`

## Authority Model

This repository uses a fixed three-tier authority stack:

1. Root \`AGENTS.md\` is the operational governance entrypoint.
   It must remain a symlink to this dated canonical governance file.
2. Root \`PLAN.md\` is the execution entrypoint.
   It must remain a symlink to the dated canonical master plan under \`docs/plans/\`.
3. \`.hivemind/project/planning/\` is the generated operational ledger.
   It is not a competing human master plan; it is the runtime-facing navigation surface for phases, checkpoints, and continuity.

## Active Tranche

- Active cycle: Cycle 3A — planning authority normalization
- Current focus:
  - restore the generated planning ledger under \`.hivemind/project/planning/\`
  - collapse \`docs/plans/\` into active surfaces plus archived history
  - keep legacy session/export consumers untouched until the later import/quarantine cycle

## Required Rules

- Keep root authority files stable and symlinked.
- Keep \`.hivemind/project/planning/\` additive and compatibility-safe during this tranche.
- Keep \`STATE.md\` alive as a compatibility mirror until writer remap completes.
- Treat repo-root \`.archive/\` as strategic quarantine and \`.hivemind/archive/\` as runtime/import snapshot space.
`
}

function renderDefaultMasterPlan(): string {
  return `# Project Master Plan

**Date**: ${PLANNING_AUTHORITY_DATE}
**Status**: Active
**Role**: root \`PLAN.md\` must remain a stable symlink to this canonical file.

## Authority Stack

- \`AGENTS.md\` governs how framework work must be executed.
- \`PLAN.md\` governs the current execution tranche.
- \`.hivemind/project/planning/\` is the generated operational phase ledger and evidence-oriented runtime map.

## Current Tranche

Cycle 3A — planning authority normalization.

Objectives:

1. Restore \`.hivemind/project/planning/\` as a generated ledger.
2. Create \`docs/plans/${ACTIVE_PHASE_INDEX_FILENAME}\` as the human-facing phase map.
3. Collapse legacy plan backlog into \`docs/plans/archive/${LEGACY_PLAN_ARCHIVE_DIRNAME}/\`.
4. Extend \`hm-init\`, \`hm-doctor\`, and \`hm-harness\` to enforce or report the new authority surfaces.

## Strategic Anchor

- Upstream architecture synthesis:
  - \`docs/audits/hivemind-architecture-synthesis-strategic-redesing-14-Mar-2026.md\`
`
}

function classifyPlanEntry(name: string): PlanArchiveClassification {
  const normalized = name.toLowerCase()

  if (
    normalized.endsWith(".json")
    || normalized.endsWith(".yaml")
    || normalized.includes("packet")
    || normalized.includes("truth")
    || normalized.includes("matrix")
    || normalized.includes("audit")
    || normalized.includes("inventory")
    || normalized.includes("forensics")
    || normalized.includes("findings")
    || normalized.includes("evidence")
    || normalized.includes("reply")
    || normalized.includes("query")
    || normalized.includes("register")
  ) {
    return "migration-evidence"
  }

  if (
    normalized.includes("progress")
    || normalized.includes("status")
    || normalized.includes("closeout")
    || normalized.includes("rollout")
    || normalized.includes("execution-packet")
  ) {
    return "history"
  }

  if (
    normalized.includes("spec")
    || normalized.includes("prd")
    || normalized.includes("architecture")
    || normalized.includes("roadmap")
    || normalized.includes("master-plan")
    || normalized.includes("constitution")
    || normalized.includes("phase")
    || normalized.includes("control")
    || normalized.includes("refactor")
    || normalized.includes("plan")
  ) {
    return "superseded"
  }

  return "reference"
}

function planningWhitelist(paths: PlanningAuthorityPaths): Set<string> {
  return new Set([
    basename(paths.masterPlanDoc),
    basename(paths.activePhaseIndex),
    basename(paths.stateAuthorityPass),
    basename(paths.plansArchiveDir),
  ])
}

async function ensureTextFile(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  if (!existsSync(path)) {
    await writeFile(path, content, "utf-8")
  }
}

async function ensureSymlink(path: string, target: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true })

  try {
    const stat = await import("node:fs/promises").then(({ lstat }) => lstat(path))
    if (stat.isSymbolicLink()) {
      const actual = await readlink(path)
      if (actual === target) {
        return
      }
    }
    await rm(path, { recursive: true, force: true })
  } catch {
    // create below
  }

  await symlink(target, path)
}

async function seedCanonicalDocFromExistingFile(
  entryPath: string,
  targetPath: string,
  fallbackContent: string,
): Promise<void> {
  await mkdir(dirname(targetPath), { recursive: true })
  if (existsSync(targetPath)) {
    return
  }

  try {
    const stat = lstatSync(entryPath)
    if (stat.isFile()) {
      const raw = await readFile(entryPath, "utf-8")
      await writeFile(targetPath, raw, "utf-8")
      return
    }
  } catch {
    // fall through to default content
  }

  await writeFile(targetPath, fallbackContent, "utf-8")
}

function renderArchiveTable(entries: PlanningArchiveEntry[], projectRoot: string): string {
  if (entries.length === 0) {
    return "| Entry | Classification | Archive Path |\n|---|---|---|\n| (none) | reference | (none) |"
  }

  const rows = entries
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => {
      const archivePath = relative(projectRoot, entry.archivePath).replaceAll("\\", "/")
      return `| \`${entry.name}\` | ${entry.classification} | \`${archivePath}\` |`
    })

  return ["| Entry | Classification | Archive Path |", "|---|---|---|", ...rows].join("\n")
}

function renderActivePhaseIndex(projectRoot: string, entries: PlanningArchiveEntry[]): string {
  const ledgerIndex = ".hivemind/project/planning/INDEX.md"
  const controlPlanePlan = ".hivemind/project/planning/phases/00-control-plane/00-01-PLAN.md"
  const sessionKernelPlan = ".hivemind/project/planning/phases/01-session-kernel/01-01-PLAN.md"

  return `---
date: ${PLANNING_AUTHORITY_DATE}
current_phase: 00-control-plane
current_gate: Cycle 3A - Planning authority normalization
next_phase: 01-session-kernel
---

# Active Phase Index

This file is the human-facing navigation surface for the current long-haul tranche.

## Authority Stack

1. Root \`AGENTS.md\` -> \`docs/governance/${GOVERNANCE_FILENAME}\`
2. Root \`PLAN.md\` -> \`docs/plans/${MASTER_PLAN_FILENAME}\`
3. Generated ledger -> \`${ledgerIndex}\`

## Active Documents

- Master plan: \`docs/plans/${MASTER_PLAN_FILENAME}\`
- Governance: \`docs/governance/${GOVERNANCE_FILENAME}\`
- Runtime ledger index: \`${ledgerIndex}\`
- Control-plane packet: \`${controlPlanePlan}\`
- Next kernel packet: \`${sessionKernelPlan}\`
- State authority reference: \`docs/plans/2026-03-06-state-authority-rationalization-pass.md\`
- Strategic architecture anchor:
  - \`docs/audits/hivemind-architecture-synthesis-strategic-redesing-14-Mar-2026.md\`

## Current Gate

- Current phase: \`00-control-plane\`
- Current gate: \`Cycle 3A — Planning authority normalization\`
- Next phase when current gate closes: \`01-session-kernel\`

## Archived Backlog Inventory

${renderArchiveTable(entries, projectRoot)}
`
}

async function listArchiveEntries(paths: PlanningAuthorityPaths): Promise<PlanningArchiveEntry[]> {
  if (!existsSync(paths.plansLegacyArchiveDir)) {
    return []
  }

  const entries = await readdir(paths.plansLegacyArchiveDir, { withFileTypes: true })
  return entries.map((entry) => ({
    name: entry.name,
    classification: classifyPlanEntry(entry.name),
    sourcePath: join(paths.plansDir, entry.name),
    archivePath: join(paths.plansLegacyArchiveDir, entry.name),
    kind: entry.isDirectory() ? "directory" : (entry.isSymbolicLink() ? "symlink" : "file"),
  }))
}

/**
 * Resolve the long-haul planning authority surfaces at the project root.
 *
 * @param projectRoot Absolute project root.
 * @returns Root authority paths for governance, plan, archive, and mirrored symlinks.
 */
export function getPlanningAuthorityPaths(projectRoot: string): PlanningAuthorityPaths {
  const docsDir = join(projectRoot, "docs")
  const governanceDir = join(docsDir, "governance")
  const plansDir = join(docsDir, "plans")
  const plansArchiveDir = join(plansDir, "archive")

  return {
    docsDir,
    governanceDir,
    governanceDoc: join(governanceDir, GOVERNANCE_FILENAME),
    plansDir,
    masterPlanDoc: join(plansDir, MASTER_PLAN_FILENAME),
    activePhaseIndex: join(plansDir, ACTIVE_PHASE_INDEX_FILENAME),
    stateAuthorityPass: join(plansDir, "2026-03-06-state-authority-rationalization-pass.md"),
    plansArchiveDir,
    plansLegacyArchiveDir: join(plansArchiveDir, LEGACY_PLAN_ARCHIVE_DIRNAME),
    rootAgents: join(projectRoot, "AGENTS.md"),
    rootPlan: join(projectRoot, "PLAN.md"),
    mirroredAgents: [
      { path: join(projectRoot, ".hivemind", "AGENTS.md"), target: "../AGENTS.md" },
      { path: join(projectRoot, ".opencode", "AGENTS.md"), target: "../AGENTS.md" },
      { path: join(projectRoot, "src", "AGENTS.md"), target: "../AGENTS.md" },
    ],
  }
}

/**
 * Inspect the current planning authority state without mutating the workspace.
 *
 * @param projectRoot Absolute project root.
 * @returns Missing docs, broken symlinks, missing planning-ledger surfaces, and current backlog drift.
 */
export async function getPlanningAuthorityStatus(
  projectRoot: string,
): Promise<PlanningAuthorityStatus> {
  const paths = getPlanningAuthorityPaths(projectRoot)
  const effective = getEffectivePaths(projectRoot)
  const backlogWhitelist = planningWhitelist(paths)
  const brokenSymlinks: PlanningAuthorityStatus["brokenSymlinks"] = []

  const symlinkTargets = [
    { path: paths.rootAgents, target: "docs/governance/" + GOVERNANCE_FILENAME },
    { path: paths.rootPlan, target: "docs/plans/" + MASTER_PLAN_FILENAME },
    ...paths.mirroredAgents,
  ]

  for (const expected of symlinkTargets) {
    try {
      const stat = lstatSync(expected.path)
      if (!stat.isSymbolicLink()) {
        brokenSymlinks.push({
          path: expected.path,
          expectedTarget: expected.target,
          actualTarget: null,
        })
        continue
      }

      const actualTarget = await readlink(expected.path)
      if (actualTarget !== expected.target) {
        brokenSymlinks.push({
          path: expected.path,
          expectedTarget: expected.target,
          actualTarget,
        })
      }
    } catch {
      brokenSymlinks.push({
        path: expected.path,
        expectedTarget: expected.target,
        actualTarget: null,
      })
    }
  }

  const missingDocs = [
    paths.governanceDoc,
    paths.masterPlanDoc,
    paths.activePhaseIndex,
  ].filter((candidate) => !existsSync(candidate))

  const missingLedgerPaths = [
    effective.projectPlanningDir,
    effective.projectPlanningIndex,
    effective.projectPlanningProject,
    effective.projectPlanningRoadmap,
    effective.projectPlanningProjectState,
    effective.projectPlanningState,
    effective.projectPlanningControlPlaneDir,
    effective.projectPlanningControlPlanePlan,
    effective.projectPlanningSessionKernelDir,
    effective.projectPlanningSessionKernelPlan,
  ].filter((candidate) => !existsSync(candidate))

  const backlogEntries: PlanningArchiveEntry[] = []
  if (existsSync(paths.plansDir)) {
    const entries = await readdir(paths.plansDir, { withFileTypes: true })
    for (const entry of entries) {
      if (backlogWhitelist.has(entry.name)) continue
      backlogEntries.push({
        name: entry.name,
        classification: classifyPlanEntry(entry.name),
        sourcePath: join(paths.plansDir, entry.name),
        archivePath: join(paths.plansLegacyArchiveDir, entry.name),
        kind: entry.isDirectory() ? "directory" : (entry.isSymbolicLink() ? "symlink" : "file"),
      })
    }
  }

  return {
    paths,
    brokenSymlinks,
    missingDocs,
    missingLedgerPaths,
    backlogEntries,
    archivedEntries: await listArchiveEntries(paths),
  }
}

/**
 * Ensure the three-tier planning authority surfaces exist and archive non-active plan backlog.
 *
 * This does not create the runtime-facing planning ledger under `.hivemind/project/planning/`;
 * that remains owned by planning bootstrap helpers.
 *
 * @param projectRoot Absolute project root.
 * @returns Final authority status after symlink/doc/backlog normalization.
 */
export async function ensurePlanningAuthoritySurfaces(
  projectRoot: string,
): Promise<PlanningAuthorityStatus> {
  const paths = getPlanningAuthorityPaths(projectRoot)

  await mkdir(paths.governanceDir, { recursive: true })
  await mkdir(paths.plansLegacyArchiveDir, { recursive: true })

  await seedCanonicalDocFromExistingFile(
    paths.rootAgents,
    paths.governanceDoc,
    renderDefaultGovernanceDoc(),
  )
  await seedCanonicalDocFromExistingFile(
    paths.rootPlan,
    paths.masterPlanDoc,
    renderDefaultMasterPlan(),
  )
  await ensureTextFile(
    paths.stateAuthorityPass,
    "# State Authority Rationalization Pass\n\nThis retained document remains an active reference surface for the current tranche.\n",
  )

  await ensureSymlink(paths.rootAgents, "docs/governance/" + GOVERNANCE_FILENAME)
  await ensureSymlink(paths.rootPlan, "docs/plans/" + MASTER_PLAN_FILENAME)
  for (const mirror of paths.mirroredAgents) {
    await ensureSymlink(mirror.path, mirror.target)
  }

  const whitelist = planningWhitelist(paths)
  const movedEntries: PlanningArchiveEntry[] = []
  if (existsSync(paths.plansDir)) {
    const entries = await readdir(paths.plansDir, { withFileTypes: true })
    for (const entry of entries) {
      if (whitelist.has(entry.name)) continue

      const sourcePath = join(paths.plansDir, entry.name)
      const archivePath = join(paths.plansLegacyArchiveDir, entry.name)

      await mkdir(dirname(archivePath), { recursive: true })
      if (!existsSync(archivePath)) {
        await rename(sourcePath, archivePath)
      } else if (existsSync(sourcePath)) {
        const collisionPath = join(
          paths.plansLegacyArchiveDir,
          `${entry.name}.cycle-3a-duplicate`,
        )
        await rename(sourcePath, collisionPath)
      }

      movedEntries.push({
        name: entry.name,
        classification: classifyPlanEntry(entry.name),
        sourcePath,
        archivePath: existsSync(archivePath)
          ? archivePath
          : join(paths.plansLegacyArchiveDir, `${entry.name}.cycle-3a-duplicate`),
        kind: entry.isDirectory() ? "directory" : (entry.isSymbolicLink() ? "symlink" : "file"),
      })
    }
  }

  const archivedEntries = await listArchiveEntries(paths)
  await writeFile(
    paths.activePhaseIndex,
    renderActivePhaseIndex(projectRoot, archivedEntries.length > 0 ? archivedEntries : movedEntries),
    "utf-8",
  )

  return getPlanningAuthorityStatus(projectRoot)
}

/**
 * Read the current phase/gate signals from the active phase index.
 *
 * @param projectRoot Absolute project root.
 * @returns Current phase, current gate, and index path if available.
 */
export async function readActivePhaseSignals(projectRoot: string): Promise<{
  activePhaseIndexPath: string
  currentPhase: string | null
  currentGate: string | null
}> {
  const paths = getPlanningAuthorityPaths(projectRoot)

  if (!existsSync(paths.activePhaseIndex)) {
    return {
      activePhaseIndexPath: paths.activePhaseIndex,
      currentPhase: null,
      currentGate: null,
    }
  }

  const raw = await readFile(paths.activePhaseIndex, "utf-8")
  const currentPhase = raw.match(/^current_phase:\s*(.+)$/m)?.[1]?.trim() ?? null
  const currentGate = raw.match(/^current_gate:\s*(.+)$/m)?.[1]?.trim() ?? null

  return {
    activePhaseIndexPath: paths.activePhaseIndex,
    currentPhase,
    currentGate,
  }
}
