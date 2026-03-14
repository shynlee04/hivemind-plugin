import React from "react";
import { apiClient } from "../api.js";
import { t, toggleLang } from "../i18n.js";
import type { AppAction, AppState } from "../state.js";
import { TAB_KEYS } from "../state.js";

type UseKeyboardHandlerParams = {
  stateRef: React.MutableRefObject<AppState>;
  dispatch: React.Dispatch<AppAction>;
  renderer: any;
  refresh: () => Promise<void>;
};

export function useKeyboardHandler({ stateRef, dispatch, renderer, refresh }: UseKeyboardHandlerParams) {
  React.useEffect(() => {
    const stdin = process.stdin;
    stdin.setEncoding("utf8");
    if (stdin.isTTY) stdin.setRawMode(true);
    stdin.resume();

    const onData = (chunk: string) => {
      const currentState = stateRef.current;

      if (currentState.helpOverlay && !currentState.modal) {
        if (chunk === "?" || chunk === "\u001b" || chunk === "q") {
          dispatch({ type: "CLOSE_HELP_OVERLAY" });
        }
        return;
      }

      if (currentState.modal) {
        return;
      }

      if (chunk === "\t" || chunk === "j" || chunk === "\u001b[B") {
        dispatch({ type: "TAB_NEXT" });
        return;
      }
      if (chunk === "\u001b[Z" || chunk === "k" || chunk === "\u001b[A") {
        dispatch({ type: "TAB_PREV" });
        return;
      }
      if (chunk === "r") {
        void refresh();
        dispatch({ type: "LAST_ACTION", value: "Refreshed" });
        return;
      }
      if (chunk === "c") {
        if (!currentState.serverData.connected) {
          dispatch({ type: "LAST_ACTION", value: "[ERROR] Server offline - cannot create session" });
          return;
        }
        dispatch({ type: "OPEN_MODAL", value: { type: "session-create" } });
        return;
      }
      if (chunk === "m") {
        if (!currentState.serverData.connected) {
          dispatch({ type: "LAST_ACTION", value: "[ERROR] Server offline - cannot send message" });
          return;
        }
        const sessionId = currentState.currentSessionId || currentState.serverData.sessions[0]?.id;
        if (!sessionId) {
          dispatch({ type: "LAST_ACTION", value: "[ERROR] No session available - press 'c' to create one" });
          return;
        }
        dispatch({ type: "OPEN_MODAL", value: { type: "message", payload: { sessionId } } });
        return;
      }
      if (chunk === "x") {
        if (!currentState.serverData.connected) {
          dispatch({ type: "LAST_ACTION", value: "[ERROR] Server offline - cannot execute command" });
          return;
        }
        const sessionId = currentState.currentSessionId || currentState.serverData.sessions[0]?.id;
        if (!sessionId) {
          dispatch({ type: "LAST_ACTION", value: "[ERROR] No session available - press 'c' to create one" });
          return;
        }
        dispatch({ type: "OPEN_MODAL", value: { type: "command", payload: { sessionId } } });
        return;
      }
      if (chunk === "t") {
        if (!currentState.serverData.connected) {
          dispatch({ type: "LAST_ACTION", value: "[ERROR] Server offline - cannot fetch todos" });
          return;
        }
        const sessionId = currentState.currentSessionId || currentState.serverData.sessions[0]?.id;
        if (!sessionId) {
          dispatch({ type: "LAST_ACTION", value: "[ERROR] No session available - press 'c' to create one" });
          return;
        }
        dispatch({ type: "ACTION_LOADING", value: true });
        apiClient.listTodos(sessionId).then((todos) => {
          if (todos.length > 0) {
            const summary = todos
              .slice(0, 3)
              .map((todo) => todo.content?.slice(0, 20) || todo.id.slice(0, 8))
              .join(", ");
            dispatch({ type: "LAST_ACTION", value: `[OK] Todos (${todos.length}): ${summary}...` });
          } else {
            dispatch({ type: "LAST_ACTION", value: "[INFO] No todos in current session" });
          }
          dispatch({ type: "ACTION_LOADING", value: false });
        });
        return;
      }
      if (chunk === "a") {
        if (currentState.serverData.connected && currentState.serverData.agents.length > 0) {
          const agentList = currentState.serverData.agents.map((agent) => agent.name).join(", ");
          dispatch({ type: "LAST_ACTION", value: `Agents: ${agentList}` });
        } else {
          dispatch({ type: "LAST_ACTION", value: "No agents available - Server offline" });
        }
        return;
      }
      if (chunk >= "1" && chunk <= "9") {
        const index = Number(chunk) - 1;
        if (index < TAB_KEYS.length) {
          dispatch({ type: "TAB_SET", value: index });
        }
        return;
      }
      if (chunk === "0" && TAB_KEYS.length >= 10) {
        dispatch({ type: "TAB_SET", value: 9 });
        return;
      }
      if (chunk === "l") {
        const nextLang = toggleLang(currentState.lang);
        dispatch({ type: "SET_LANG", value: nextLang });
        dispatch({ type: "LAST_ACTION", value: `[OK] ${t("settings.toggle_lang", nextLang)}` });
        return;
      }
      if (chunk === "?") {
        dispatch({ type: "TOGGLE_HELP_OVERLAY" });
        return;
      }
      if (chunk === "q" || chunk === "\u0003") {
        renderer.destroy();
      }
    };

    stdin.on("data", onData);

    return () => {
      stdin.off("data", onData);
      if (stdin.isTTY) stdin.setRawMode(false);
      renderer.destroy();
    };
  }, [dispatch, refresh, renderer, stateRef]);
}
