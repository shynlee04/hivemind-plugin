type ResolveParentWorkingDirectoryArgs = {
  contextDirectory?: string
  worktree?: string
  parentSessionDirectory?: string
}

export function resolveParentWorkingDirectory(args: ResolveParentWorkingDirectoryArgs): string {
  return args.contextDirectory ?? args.worktree ?? args.parentSessionDirectory ?? process.cwd()
}
