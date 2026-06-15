declare module "proper-lockfile" {
  export interface LockOptions {
    realpath?: boolean
    retries?: {
      retries?: number
      minTimeout?: number
      maxTimeout?: number
      randomize?: boolean
    }
    stale?: number
    fs?: unknown
    onCompromised?: (err: Error) => void
  }

  export function lockSync(file: string, options?: LockOptions): () => void
  export function unlockSync(file: string): void
  export function lock(file: string, options?: LockOptions): Promise<() => void>
  export function unlock(file: string): Promise<void>
  export function checkSync(file: string): boolean
  export function check(file: string): Promise<boolean>
}
