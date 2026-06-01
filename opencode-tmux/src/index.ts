import type { Plugin, PluginInput } from "@opencode-ai/plugin";
import type { Event } from "@opencode-ai/sdk";
import { loadConfig } from "./config";
import { SessionManager } from "./session-manager";
import { TmuxMultiplexer } from "./tmux";
import { createLogger } from "./util";

const OpencodeTmux: Plugin = async (input: PluginInput) => {
  const config = loadConfig(input.directory);
  const log = createLogger(input.client, "opencode-tmux");
  const tmux = new TmuxMultiplexer(config.layout, config.mainPaneSize, log);

  if (!tmux.isInsideSession()) {
    // Not inside tmux — load silently, do nothing
    return {};
  }

  const available = await tmux.isAvailable();
  if (!available) {
    log.error("tmux binary not found in PATH — plugin disabled");
    return {};
  }

  const mgr = new SessionManager(input, config, tmux);

  return {
    event: async (hookInput: { event: Event }) => {
      const event = hookInput.event;
      // Discriminated union narrows correctly — no casts needed
      if (event.type === "session.created") {
        await mgr.onSessionCreated(event);
      } else if (event.type === "session.status") {
        await mgr.onSessionStatus(event);
      } else if (event.type === "session.deleted") {
        await mgr.onSessionDeleted(event);
      }
    },
  };
};

export default OpencodeTmux;
