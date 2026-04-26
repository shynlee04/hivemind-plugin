import path from "node:path"

/**
 * Resolve the OpenCode project root from tool context rather than ambient CWD.
 *
 * @param context - OpenCode tool context containing directory/worktree data.
 * @returns Absolute project root used for project-scope primitive paths.
 */
export function resolveContextProjectRoot(context: unknown): string {
  const ctx = context as { directory?: string; worktree?: string }
  return path.resolve(ctx?.worktree || ctx?.directory || process.cwd())
}

/**
 * Resolve primitive configuration base path for project/global scopes.
 *
 * @param scope - OpenCode primitive scope.
 * @param projectRoot - Explicit project root from the tool context.
 * @returns Absolute project `.opencode` path or global OpenCode config path.
 */
export function resolveScopeBasePath(scope: "project" | "global", projectRoot: string): string {
  return scope === "global"
    ? (process.env.OPENCODE_CONFIG_DIR || `${process.env.HOME || "/tmp"}/.config/opencode`)
    : path.join(projectRoot, ".opencode")
}

/**
 * Resolve a primitive file path without relying on process CWD for project scope.
 *
 * @param primitive - Primitive kind to locate.
 * @param name - Validated primitive name.
 * @param scope - Project or global OpenCode config scope.
 * @param projectRoot - Explicit project root from the tool context.
 * @returns File path for the requested primitive.
 */
export function resolvePrimitiveFilePath(
  primitive: "agent" | "command" | "skill",
  name: string,
  scope: "project" | "global",
  projectRoot: string,
): string {
  const base = resolveScopeBasePath(scope, projectRoot)
  if (primitive === "skill") return path.join(base, "skills", name, "SKILL.md")
  return path.join(base, `${primitive}s`, `${name}.md`)
}
