/**
 * Minimal Ink type declarations for dashboard TUI.
 * These stubs allow tsc to compile src/dashboard/server.ts
 * without requiring ink in node_modules (which conflicts with OpenCode's own Ink).
 * When users install ink for the TUI, real types take precedence.
 */
declare module "ink" {
  import type { ReactElement } from "react";

  export function render(element: ReactElement): { waitUntilExit(): Promise<void> };
  export function useApp(): { exit(): void };
  export function useInput(handler: (input: string, key: any) => void): void;

  export const Box: any;
  export const Text: any;
}
