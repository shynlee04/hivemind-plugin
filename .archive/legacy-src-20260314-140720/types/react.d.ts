/**
 * Minimal React type declarations for dashboard TUI.
 * These stubs allow tsc to compile src/dashboard/server.ts
 * without requiring react in node_modules (which conflicts with OpenCode's own React).
 * When users install react for the TUI, real types take precedence.
 */
declare module "react" {
  export function useState<T>(initial: T | (() => T)): [T, (v: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: unknown[]): T;
  export function createElement(type: any, props?: any, ...children: any[]): ReactElement;
  export interface ReactElement {
    type: any;
    props: any;
    key: string | null;
  }
  export default React;
}

declare namespace React {
  type ReactElement = import("react").ReactElement;
  function createElement(type: any, props?: any, ...children: any[]): ReactElement;
}
