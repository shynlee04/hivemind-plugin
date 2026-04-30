/**
 * Ambient type declarations for the `bun-pty` optional dependency.
 *
 * `bun-pty` is declared in `package.json#optionalDependencies` so that
 * `npm install --omit=optional` (or installs on platforms where the
 * native module is not available) succeed without it. The harness
 * tolerates its absence at runtime via `pty-runtime.ts`, which
 * dynamically imports `pty-manager.ts` inside a `try/catch` and returns
 * `null` if the resolution fails. Phase 16.2.1 (R-PTY-01-AMENDED) made
 * this graceful path the canonical behaviour.
 *
 * However, when the package is omitted at install time, TypeScript can
 * no longer resolve `import { spawn } from "bun-pty"` in
 * `pty-manager.ts`. This file declares the surface the harness uses so
 * that `npm run typecheck` succeeds independently of whether the
 * optional dependency is present on disk. The full upstream types ship
 * with the package and override these when it is installed (because the
 * package's own `.d.ts` is a more specific match in the resolver).
 *
 * @see Phase 16.2.1 — PTY Subsystem Detox
 */
declare module "bun-pty" {
  export interface IDisposable {
    dispose(): void
  }

  export interface IExitEvent {
    exitCode: number
    signal?: number | string
  }

  export interface IPtyForkOptions {
    cwd?: string
    env?: Record<string, string>
    cols?: number
    rows?: number
    name?: string
    encoding?: string | null
  }

  export interface IPty {
    readonly pid: number
    write(data: string): void
    kill(signal?: string): void
    resize(cols: number, rows: number): void
    onData(listener: (data: string) => void): IDisposable
    onExit(listener: (event: IExitEvent) => void): IDisposable
  }

  export function spawn(
    command: string,
    args: string[] | string,
    options: IPtyForkOptions,
  ): IPty
}
