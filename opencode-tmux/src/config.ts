import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type TmuxLayout =
  | "main-vertical"
  | "main-horizontal"
  | "tiled"
  | "even-horizontal"
  | "even-vertical";

export interface TmuxPluginConfig {
  layout: TmuxLayout;
  mainPaneSize: number;   // 10..90
  autoClose: boolean;
  // Hivemind extension:
  copilot: boolean;              // false = child-only; true = also non-child sessions
  agentLabelFormat: string;      // "{agentType} — {delegationId}"
  opencodeBinaryPath?: string;   // Resolved full path to opencode binary
}

export const DEFAULT_CONFIG: TmuxPluginConfig = {
  layout: "main-vertical",
  mainPaneSize: 60,
  autoClose: true,
  copilot: false,
  agentLabelFormat: "{agentType} — {delegationId}",
};

const VALID_LAYOUTS: TmuxLayout[] = [
  "main-vertical", "main-horizontal", "tiled", "even-horizontal", "even-vertical",
];

function readJson(path: string): Record<string, unknown> {
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as Record<string, unknown>;
  } catch (err) {
    // Log malformed JSON (not ENOENT) when debug enabled
    if (
      process.env.OPENCODE_TMUX_DEBUG &&
      err instanceof Error &&
      !("code" in err && (err as NodeJS.ErrnoException).code === "ENOENT")
    ) {
      console.error(`[opencode-tmux:config] failed to read ${path}:`, err.message);
    }
    return {};
  }
}

export function loadConfig(directory: string): TmuxPluginConfig {
  const globalPath = join(homedir(), ".config", "opencode", "opencode-tmux.json");
  // Project-local: <dir>/opencode-tmux.json takes precedence over <dir>/.opencode/opencode-tmux.json
  const projectPath = join(directory, "opencode-tmux.json");
  const projectAltPath = join(directory, ".opencode", "opencode-tmux.json");

  const global = readJson(globalPath);
  // Prefer <dir>/opencode-tmux.json; fall back to <dir>/.opencode/opencode-tmux.json
  const projectDirect = readJson(projectPath);
  const projectAlt = readJson(projectAltPath);
  const project = Object.keys(projectDirect).length > 0 ? projectDirect : projectAlt;

  // Config files are flat — keys are at the top level, no "tmux" nesting
  // project overrides global
  const raw = { ...global, ...project };

  const layout = VALID_LAYOUTS.includes(raw.layout as TmuxLayout)
    ? (raw.layout as TmuxLayout)
    : DEFAULT_CONFIG.layout;

  const mainPaneSize =
    typeof raw.mainPaneSize === "number"
      ? Math.max(10, Math.min(90, raw.mainPaneSize))
      : DEFAULT_CONFIG.mainPaneSize;

  const autoClose =
    typeof raw.autoClose === "boolean" ? raw.autoClose : DEFAULT_CONFIG.autoClose;

  const copilot =
    typeof raw.copilot === "boolean" ? raw.copilot : DEFAULT_CONFIG.copilot;

  const agentLabelFormat =
    typeof raw.agentLabelFormat === "string"
      ? raw.agentLabelFormat
      : DEFAULT_CONFIG.agentLabelFormat;

  const opencodeBinaryPath =
    typeof raw.opencodeBinaryPath === "string" ? raw.opencodeBinaryPath : undefined;

  return { layout, mainPaneSize, autoClose, copilot, agentLabelFormat, opencodeBinaryPath };
}
