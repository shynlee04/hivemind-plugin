import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

/**
 * @module bootstrap-structure
 *
 * Shared bootstrap constants and path helpers for Hivemind directory resolution.
 *
 * Pure constants + path helpers. No runtime side effects.
 * Leaf module — no imports from other harness modules.
 *
 * @example
 * ```ts
 * import { HIVE_MIND_DIR, resolveHiveMindRoot } from "./bootstrap-structure.js"
 * const root = resolveHiveMindRoot("/my/project")
 * // root === "/my/project/.hivemind"
 * ```
 */

// ---------------------------------------------------------------------------
// Directory names
// ---------------------------------------------------------------------------

/**
 * Top-level `.hivemind/` directory name.
 * Canonical internal state root per Q6 decision.
 */
export const HIVE_MIND_DIR = ".hivemind" as const

/**
 * OpenCode primitives directory name.
 * Houses agents, skills, commands — no internal runtime state per Q6.
 */
export const OPEN_CODE_DIR = ".opencode" as const

/**
 * Meta-builder workspace directory name.
 * Contains skills-lab, symlink targets, and meta-concept tooling.
 */
export const META_BUILDER_DIR = ".hivefiver-meta-builder" as const

/**
 * Sentinel filename used to register empty directories with git.
 */
export const GITKEEP_FILE = ".gitkeep" as const

// ---------------------------------------------------------------------------
// Tier-1 subdirectories under `.hivemind/`
// ---------------------------------------------------------------------------

/**
 * First-level subdirectories created inside `.hivemind/` during bootstrap.
 *
 * Includes the canonical runtime, committed config/reference, and legacy
 * compatibility roots required by BOOT-03. Each directory receives a `.gitkeep`
 * during bootstrap so empty surfaces are explicit and recoverable.
 */
export const TIER_1_DIRECTORIES = [
  "state",
  "delegation",
  "journal",
  "lineage",
  "daily-notes",
  "hm-brain",
  "hf-brain",
  "delegation-managements",
  "task-managements",
  "runtime",
  "artifacts",
  "sidecar",
  "logs",
  "poor-prompts",
  "uat",
  "manifests",
  "registries",
  "onboarding",
] as const

// ---------------------------------------------------------------------------
// OpenCode primitive types
// ---------------------------------------------------------------------------

/**
 * Primitive types hosted under `.opencode/`.
 * Each maps to a subdirectory containing YAML/MD definitions.
 */
export const PRIMITIVE_TYPES = ["agents", "skills", "commands"] as const

// ---------------------------------------------------------------------------
// Doctor checks (P0 for BOOT-02)
// ---------------------------------------------------------------------------

/**
 * Diagnostic checks performed by the harness-doctor command.
 * Scoped to P0 checks only for the initial BOOT-02 implementation.
 *
 * - `structure` — validates `.hivemind/` directory tree exists
 * - `primitives` — verifies OpenCode primitive files presence and integrity
 * - `config` — checks config/schema presence and validation
 * - `sdk` — confirms `@opencode-ai/plugin` peer dependency is resolvable
 * - `typecheck` — runs the package typecheck script
 * - `tests` — runs the package test script
 * - `modules` — reports TypeScript source module count
 */
export const DOCTOR_CHECKS = ["structure", "primitives", "config", "sdk", "typecheck", "tests", "modules"] as const

// ---------------------------------------------------------------------------
// Default config content
// ---------------------------------------------------------------------------

/**
 * Minimal JSON written to `.hivemind/config.json` during first-time bootstrap.
 * Points to the config schema for IDE validation.
 */
export const DEFAULT_CONFIG_JSON = '{\n  "$schema": "./configs.schema.json"\n}\n' as const

// ---------------------------------------------------------------------------
// Path resolution helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the `.hivemind/` root directory for a given project.
 *
 * @param projectRoot - Absolute path to the project root
 * @returns Absolute path to the `.hivemind/` directory
 */
export function resolveHiveMindRoot(projectRoot: string): string {
  return `${projectRoot}/${HIVE_MIND_DIR}`
}

/**
 * Resolve the `.opencode/` primitives directory for a given project.
 *
 * @param projectRoot - Absolute path to the project root
 * @returns Absolute path to the `.opencode/` directory
 */
export function resolveOpenCodeRoot(projectRoot: string): string {
  return `${projectRoot}/${OPEN_CODE_DIR}`
}

/**
 * Resolve the `.hivefiver-meta-builder/` workspace directory for a given project.
 *
 * @param projectRoot - Absolute path to the project root
 * @returns Absolute path to the `.hivefiver-meta-builder/` directory
 */
export function resolveMetaBuilderRoot(projectRoot: string): string {
  return `${projectRoot}/${META_BUILDER_DIR}`
}

/**
 * Resolve the package's local `assets/` directory.
 *
 * @returns Absolute path to the package's `assets/` directory
 */
export function resolvePackageAssetsRoot(): string {
  const currentDir = dirname(fileURLToPath(import.meta.url))
  return join(currentDir, "../../../assets")
}
