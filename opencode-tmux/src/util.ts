import type { PluginInput } from "@opencode-ai/plugin";

type LogLevel = "debug" | "info" | "warn" | "error";

export interface Logger {
  debug(msg: string, data?: unknown): void;
  info(msg: string, data?: unknown): void;
  warn(msg: string, data?: unknown): void;
  error(msg: string, data?: unknown): void;
}

export function createLogger(client: PluginInput["client"], service: string): Logger {
  function log(level: LogLevel, msg: string, data?: unknown): void {
    const extra: Record<string, unknown> = {};
    if (data !== undefined) extra["data"] = data;
    client.app
      .log({ body: { service, level, message: msg, extra } })
      .catch(() => {
        // ignore logging errors
      });
  }
  return {
    debug: (msg, data) => log("debug", msg, data),
    info: (msg, data) => log("info", msg, data),
    warn: (msg, data) => log("warn", msg, data),
    error: (msg, data) => log("error", msg, data),
  };
}
