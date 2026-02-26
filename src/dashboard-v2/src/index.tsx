/** @jsxImportSource @opentui/react */
import * as OpenTUICore from "@opentui/core";
import * as OpenTUIReact from "@opentui/react";
import type {} from "@opentui/react/jsx-runtime";
import React from "react";
import { loadDashboardSnapshot, loadServerData } from "./snapshot.js";
import { apiClient } from "./api.js";
import {
  t,
  getPersistedLang,
  persistLang,
  toggleLang,
} from "./i18n.js";
import type { DashboardLanguage } from "./i18n.js";
import { InputModal } from "./components/InputModal.js";

// TAB keys for i18n
const TAB_KEYS = [
  "tab.overview",
  "tab.pipeline",
  "tab.hierarchy",
  "tab.incidents",
  "tab.codeintel",
  "tab.governance",
  "tab.settings",
] as const;

const openTUICoreCompat = OpenTUICore as unknown as {
  createCliRenderer: () => Promise<any>;
};

const openTUIReactCompat = OpenTUIReact as unknown as {
  createRoot: (renderer: any) => { render: (node: React.ReactNode) => void };
};

function getTabs(lang: DashboardLanguage): string[] {
  return TAB_KEYS.map((key) => t(key as any, lang));
}

// Color scheme - Cyberpunk/Terminal aesthetic
const COLORS = {
  bg: "#0d0d0d",
  panelBg: "#111111",
  border: "#333333",
  neonGreen: "#00ff41",
  neonAmber: "#ffb000",
  neonBlue: "#00f0ff",
  dimText: "#666666",
  text: "#cccccc",
  error: "#ff4444",
};

interface AppState {
  activeTab: number;
  connected: boolean;
  loading: boolean;
  error: string | null;
  snapshot: any | null;
  serverData: {
    connected: boolean;
    version: string | null;
    sessions: Array<{ id: string; title?: string }>;
    agents: Array<{ id: string; name: string }>;
  };
  lastAction: string | null;
  currentSessionId: string | null;
  modal: { type: string; payload?: any } | null;
  actionLoading: boolean;
  lang: DashboardLanguage;
  helpOverlay: boolean;
}

type AppAction =
  | { type: "TAB_NEXT" }
  | { type: "TAB_PREV" }
  | { type: "TAB_SET"; value: number }
  | { type: "CONNECTED"; value: boolean }
  | { type: "SNAPSHOT"; value: any }
  | { type: "SERVER_DATA"; value: any }
  | { type: "LAST_ACTION"; value: string }
  | { type: "ERROR"; value: string }
  | { type: "SET_SESSION"; value: string | null }
  | { type: "ACTION_LOADING"; value: boolean }
  | { type: "SET_LANG"; value: DashboardLanguage }
  | { type: "OPEN_MODAL"; value: { type: string; payload?: any } }
  | { type: "CLOSE_MODAL" }
  | { type: "TOGGLE_HELP_OVERLAY" }
  | { type: "CLOSE_HELP_OVERLAY" };

function createInitialState(): AppState {
  return {
    activeTab: 0,
    connected: false,
    loading: true,
    error: null,
    snapshot: null,
    serverData: {
      connected: false,
      version: null,
      sessions: [],
      agents: [],
    },
    lastAction: null,
    currentSessionId: null,
    actionLoading: false,
    lang: getPersistedLang(),
    modal: null,
    helpOverlay: false,
  };
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "TAB_NEXT":
      return { ...state, activeTab: (state.activeTab + 1) % TAB_KEYS.length };
    case "TAB_PREV":
      return { ...state, activeTab: (state.activeTab - 1 + TAB_KEYS.length) % TAB_KEYS.length };
    case "TAB_SET":
      return { ...state, activeTab: action.value };
    case "CONNECTED":
      return { ...state, connected: action.value };
    case "SNAPSHOT":
      return { ...state, snapshot: action.value, loading: false, error: null };
    case "SERVER_DATA":
      return { ...state, serverData: action.value, connected: action.value.connected };
    case "LAST_ACTION":
      return { ...state, lastAction: action.value };
    case "ERROR":
      return { ...state, loading: false, error: action.value };
    case "SET_SESSION":
      return { ...state, currentSessionId: action.value };
    case "ACTION_LOADING":
      return { ...state, actionLoading: action.value };
    case "SET_LANG":
      persistLang(action.value);
      return { ...state, lang: action.value };
    case "OPEN_MODAL":
      return { ...state, modal: action.value };
    case "CLOSE_MODAL":
      return { ...state, modal: null };
    case "TOGGLE_HELP_OVERLAY":
      return { ...state, helpOverlay: !state.helpOverlay };
    case "CLOSE_HELP_OVERLAY":
      return { ...state, helpOverlay: false };
    default:
      return state;
  }
}

// ============ RENDER FUNCTIONS FOR EACH TAB ============

function renderOverviewPanel(snapshot: any, serverData: any, lastAction: string | null) {
  const ov = snapshot.overview;
  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      {/* Session Info */}
      <box marginBottom={1}>
        <text fg={COLORS.neonBlue}><strong>:: SESSION_ID</strong></text>
      </box>
      <box marginBottom={1} paddingLeft={1}>
        <text fg={COLORS.neonGreen}>{ov.sessionId}</text>
      </box>
      
      {/* OpenCode Server Status */}
      <box marginBottom={1}>
        <text fg={COLORS.neonAmber}><strong>:: SERVER_STATUS</strong></text>
      </box>
      <box flexDirection="row" marginBottom={1} paddingLeft={1}>
        <text fg={COLORS.dimText}>CONNECTION: </text>
        <text fg={serverData?.connected ? COLORS.neonGreen : COLORS.error}>
          {serverData?.connected ? "ONLINE" : "OFFLINE"}
        </text>
        {serverData?.version && (
          <>
            <text fg="gray"> | </text>
            <text fg={COLORS.dimText}>VERSION: </text>
            <text fg={COLORS.text}>{serverData.version}</text>
          </>
        )}
      </box>
      {serverData?.sessions?.length > 0 && (
        <box paddingLeft={1} marginBottom={1}>
          <text fg={COLORS.dimText}>SESSIONS: </text>
          <text fg={COLORS.text}>{serverData.sessions.length}</text>
        </box>
      )}
      {serverData?.agents?.length > 0 && (
        <box paddingLeft={1} marginBottom={1}>
          <text fg={COLORS.dimText}>AGENTS: </text>
          <text fg={COLORS.text}>{serverData.agents.map((a: any) => a.name).join(", ")}</text>
        </box>
      )}

      {/* Last Action Feedback */}
      {lastAction && (
        <box marginBottom={1}>
          <text fg={COLORS.neonBlue}><strong>:: LAST_ACTION</strong></text>
        </box>
      )}
      {lastAction && (
        <box paddingLeft={1} marginBottom={1}>
          <text fg={COLORS.text}>{lastAction}</text>
        </box>
      )}
      
      {/* Stats Grid */}
      <box flexDirection="row" marginTop={1}>
        <box width={18} marginRight={2}>
          <text fg={COLORS.dimText}><strong>MODE</strong></text>
          <text fg={COLORS.text}>  {ov.mode}</text>
        </box>
        <box width={18}>
          <text fg={COLORS.dimText}><strong>GOVERNANCE</strong></text>
          <text fg={ov.governanceStatus === "OPEN" ? COLORS.neonGreen : COLORS.neonAmber}>  {ov.governanceStatus}</text>
        </box>
      </box>
      
      <box flexDirection="row" marginTop={1}>
        <box width={18} marginRight={2}>
          <text fg={COLORS.dimText}><strong>DRIFT</strong></text>
          <text fg={ov.driftScore >= 50 ? COLORS.neonGreen : COLORS.neonAmber}>  {ov.driftScore}/100</text>
        </box>
        <box width={18}>
          <text fg={COLORS.dimText}><strong>TURNS</strong></text>
          <text fg={COLORS.text}>  {ov.turnCount}</text>
        </box>
      </box>
      
      <box marginTop={1}>
        <text fg={COLORS.dimText}><strong>FILES_TOUCHED</strong></text>
        <text fg={COLORS.text}>  {ov.filesTouched}</text>
      </box>
      
      <box marginTop={1}>
        <text fg={COLORS.dimText}><strong>UPDATED</strong></text>
        <text fg={COLORS.text}>  {ov.updatedAt}</text>
      </box>
    </box>
  );
}

function renderPipelinePanel(snapshot: any) {
  const pl = snapshot.pipeline;
  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      {/* Task Stats Bar */}
      <box marginBottom={1}>
        <text fg={COLORS.neonAmber}><strong>:: TASK_DISTRIBUTION</strong></text>
      </box>
      
      {/* Progress visualization */}
      <box flexDirection="row" marginBottom={1} paddingLeft={1}>
        <text fg={COLORS.neonGreen}>ACTIVE: {pl.inProgress}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.neonAmber}>PENDING: {pl.pending}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.error}>BLOCKED: {pl.blocked}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.dimText}>DONE: {pl.complete}</text>
      </box>
      
      {/* Delegation Lanes */}
      <box marginBottom={1}>
        <text fg={COLORS.neonBlue}><strong>:: DELEGATION_LANES</strong></text>
      </box>
      <box paddingLeft={1} marginBottom={1}>
        <text fg={COLORS.text}>
          {pl.delegationLanes.length > 0 ? pl.delegationLanes.join(", ") : "none"}
        </text>
      </box>
      
      {/* Active Tasks */}
      <box>
        <text fg={COLORS.neonBlue}><strong>:: ACTIVE_TRAJECTORY_TASKS</strong></text>
      </box>
      {pl.activeTasks.length === 0 ? (
        <box paddingLeft={1}>
          <text fg={COLORS.dimText}>[no active_task_ids in trajectory.json]</text>
        </box>
      ) : (
        <box flexDirection="column" paddingLeft={1}>
          {pl.activeTasks.map((task: any, i: number) => (
            <box key={i} marginTop={1}>
              <text fg={task.status === "in_progress" ? COLORS.neonGreen : COLORS.dimText}>
                ▶ {task.status}
              </text>
              <text fg={COLORS.text}> | {task.title}</text>
            </box>
          ))}
        </box>
      )}
    </box>
  );
}

function renderHierarchyPanel(snapshot: any) {
  const hi = snapshot.hierarchy;
  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      {/* Tree Stats */}
      <box marginBottom={1}>
        <text fg={COLORS.neonBlue}><strong>:: COGNITIVE_GRAPH</strong></text>
      </box>
      
      <box flexDirection="row" paddingLeft={1} marginBottom={1}>
        <text fg={COLORS.dimText}>NODES: </text>
        <text fg={COLORS.text}>{hi.totalNodes}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.dimText}>DEPTH: </text>
        <text fg={COLORS.text}>{hi.depth}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.dimText}>ACTIVE: </text>
        <text fg={COLORS.neonGreen}>{hi.activeNodes}</text>
      </box>
      
      {/* Tree Render */}
      <box flexGrow={1} border borderStyle="single" borderColor={COLORS.border} padding={1}>
        {hi.lines.slice(0, 15).map((line: string, i: number) => (
          <text key={i} fg={line.includes("[>>]") ? COLORS.neonGreen : line.includes("[OK]") ? COLORS.dimText : COLORS.text}>
            {line}
          </text>
        ))}
      </box>
    </box>
  );
}

function renderIncidentsPanel(snapshot: any) {
  const inc = snapshot.incidents;
  const levelColor = inc.level === "critical" ? COLORS.error : inc.level === "warn" ? COLORS.neonAmber : COLORS.neonGreen;
  
  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      <box marginBottom={1}>
        <text fg={COLORS.neonBlue}><strong>:: INCIDENT_LEVEL</strong></text>
      </box>
      
      <box paddingLeft={1} marginBottom={1}>
        <text fg={levelColor}><strong>{inc.level.toUpperCase()}</strong></text>
      </box>
      
      <box>
        <text fg={COLORS.neonBlue}><strong>:: SIGNALS</strong></text>
      </box>
      
      {inc.items.map((item: string, i: number) => (
        <box key={i} paddingLeft={1} marginTop={1}>
          <text fg={item.includes("pressure") ? COLORS.neonAmber : COLORS.dimText}>
            • {item}
          </text>
        </box>
      ))}
    </box>
  );
}

function renderCodeIntelPanel(snapshot: any) {
  const ci = snapshot.codeIntel;
  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      <box marginBottom={1}>
        <text fg={COLORS.neonBlue}><strong>:: CODE_INTEL_ENGINE</strong></text>
      </box>
      
      {/* Source Info */}
      <box flexDirection="row" marginBottom={1}>
        <text fg={COLORS.dimText}>SOURCE: </text>
        <text fg={COLORS.neonGreen}>{ci.source}</text>
      </box>
      
      <box flexDirection="row" marginBottom={1}>
        <text fg={COLORS.dimText}>ENTITIES: </text>
        <text fg={COLORS.text}>{ci.indexedEntities}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.dimText}>FILES: </text>
        <text fg={COLORS.text}>{ci.fileCount}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.dimText}>TOKENS: </text>
        <text fg={COLORS.text}>{ci.totalTokens}</text>
      </box>
      
      <box>
        <text fg={COLORS.dimText}>COMPRESSION: </text>
        <text fg={COLORS.neonAmber}>{ci.compressionRatio}%</text>
      </box>
      
      {/* Modules */}
      <box marginTop={1}>
        <text fg={COLORS.neonBlue}><strong>:: DISCOVERED_MODULES</strong></text>
      </box>
      <box flexGrow={1} border borderStyle="single" borderColor={COLORS.border} padding={1}>
        {ci.codeIntelModules.slice(0, 8).map((mod: string, i: number) => (
          <text key={i} fg={COLORS.text}>  {mod}</text>
        ))}
      </box>
    </box>
  );
}

function renderGovernancePanel(snapshot: any) {
  const gov = snapshot.governance;
  
  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      {/* Health Checks */}
      <box marginBottom={1}>
        <text fg={COLORS.neonBlue}><strong>:: GOVERNANCE_CHECKS</strong></text>
      </box>
      
      {gov.checks.map((check: any, i: number) => (
        <box key={i} paddingLeft={1}>
          <text fg={check.status === "pass" ? COLORS.neonGreen : check.status === "warn" ? COLORS.neonAmber : COLORS.error}>
            [{check.status.toUpperCase()}]
          </text>
          <text fg={COLORS.dimText}> {check.key}</text>
          <text fg={COLORS.text}>: {check.detail}</text>
        </box>
      ))}
      
      {/* Anchors */}
      <box marginTop={1}>
        <text fg={COLORS.neonBlue}><strong>:: ANCHORS</strong></text>
      </box>
      {gov.anchors.length === 0 ? (
        <text paddingLeft={1} fg={COLORS.dimText}>[none]</text>
      ) : (
        gov.anchors.slice(0, 3).map((anchor: any, i: number) => (
          <box key={i} paddingLeft={1}>
            <text fg={COLORS.neonAmber}>{anchor.key}</text>
            <text fg={COLORS.dimText}>: {anchor.value.slice(0, 60)}...</text>
          </box>
        ))
      )}
      
      {/* Memory Shelves */}
      <box marginTop={1}>
        <text fg={COLORS.neonBlue}><strong>:: MEMORY_SHELVES</strong></text>
      </box>
      <box flexDirection="row" paddingLeft={1} flexWrap="wrap">
        {gov.memsByShelf.slice(0, 6).map((shelf: any, i: number) => (
          <box key={i} marginRight={2}>
            <text fg={COLORS.text}>{shelf.shelf}</text>
            <text fg={COLORS.dimText}>:</text>
            <text fg={COLORS.neonGreen}>{shelf.count}</text>
          </box>
        ))}
      </box>
    </box>
  );
}

function renderSettingsPanel(snapshot: any, lang: DashboardLanguage) {
  const set = snapshot.settings;
  
  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      <box marginBottom={1}>
        <text fg={COLORS.neonBlue}><strong>:: SIDECAR_BOUNDARIES</strong></text>
      </box>
      
      {set.boundaries.map((b: string, i: number) => (
        <box key={i} paddingLeft={1} marginTop={1}>
          <text fg={COLORS.neonGreen}>▸</text>
          <text fg={COLORS.text}> {b}</text>
        </box>
      ))}
      
      <box marginTop={2}>
        <text fg={COLORS.neonBlue}><strong>:: {t("settings.keyboard_controls", lang)}</strong></text>
      </box>
      <box paddingLeft={1} marginTop={1} flexDirection="column">
        <text fg={COLORS.dimText}>{t("settings.next_tab", lang)}</text>
        <text fg={COLORS.dimText}>{t("settings.prev_tab", lang)}</text>
        <text fg={COLORS.dimText}>{t("settings.jump_tab", lang)}</text>
        <text fg={COLORS.dimText}>{t("settings.refresh_snapshot", lang)}</text>
        <text fg={COLORS.dimText}>{t("settings.create_session", lang)}</text>
        <text fg={COLORS.dimText}>{t("settings.send_message", lang)}</text>
        <text fg={COLORS.dimText}>{t("settings.exec_command", lang)}</text>
        <text fg={COLORS.dimText}>{t("settings.show_todos", lang)}</text>
        <text fg={COLORS.dimText}>{t("settings.list_agents", lang)}</text>
        <text fg={COLORS.dimText}>{t("settings.toggle_lang", lang)}</text>
        <text fg={COLORS.dimText}>{t("settings.quit", lang)}</text>
      </box>
    </box>
  );
}

function MainPanel({ state }: { state: AppState }) {
  if (state.error) {
    return (
      <box flexGrow={1} border borderStyle="single" borderColor={COLORS.error} padding={1}>
        <text fg={COLORS.error}><strong>ERROR: Dashboard data load failed</strong></text>
        <text fg={COLORS.text}>{state.error}</text>
      </box>
    );
  }
  
  if (state.loading || !state.snapshot) {
    return (
      <box flexGrow={1} border borderStyle="single" borderColor={COLORS.border} padding={1}>
        <text fg={COLORS.neonBlue}><strong>LOADING_SNAPSHOT...</strong></text>
      </box>
    );
  }
  
  // Render active tab content
  let content;
  switch (state.activeTab) {
    case 0:
      content = renderOverviewPanel(state.snapshot, state.serverData, state.lastAction);
      break;
    case 1:
      content = renderPipelinePanel(state.snapshot);
      break;
    case 2:
      content = renderHierarchyPanel(state.snapshot);
      break;
    case 3:
      content = renderIncidentsPanel(state.snapshot);
      break;
    case 4:
      content = renderCodeIntelPanel(state.snapshot);
      break;
    case 5:
      content = renderGovernancePanel(state.snapshot);
      break;
    case 6:
      content = renderSettingsPanel(state.snapshot, state.lang);
      break;
    default:
      content = <text>Unknown tab</text>;
  }
  
  const tabs = getTabs(state.lang);

  return (
    <box flexGrow={1} border borderStyle="single" borderColor={COLORS.border} backgroundColor={COLORS.panelBg}>
      {/* Tab Title Bar */}
      <box border borderStyle="single" borderColor={COLORS.border} paddingX={1} paddingY={0}>
        <text fg={COLORS.neonBlue}><strong>:: {tabs[state.activeTab]?.toUpperCase() ?? "LOADING"}</strong></text>
      </box>
      {content}
    </box>
  );
}

function App({ renderer }: { renderer: any }) {
  const [state, dispatch] = React.useReducer(reducer, undefined, createInitialState);
  const stateRef = React.useRef(state);

  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);

  React.useEffect(() => {
    let mounted = true;
    dispatch({ type: "CONNECTED", value: true });

    const refresh = async () => {
      try {
        const snapshot = await loadDashboardSnapshot(process.cwd());
        const serverData = await loadServerData();
        if (!mounted) return;
        dispatch({ type: "SNAPSHOT", value: snapshot });
        dispatch({ type: "SERVER_DATA", value: serverData });
      } catch (error) {
        if (!mounted) return;
        dispatch({ type: "ERROR", value: error instanceof Error ? error.message : String(error) });
      }
    };

    void refresh();
    const poller = setInterval(() => {
      void refresh();
    }, 5000);

    const stdin = process.stdin;
    stdin.setEncoding("utf8");
    if (stdin.isTTY) stdin.setRawMode(true);
    stdin.resume();

    const onData = (chunk: string) => {
      const currentState = stateRef.current;

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
      // c - Create new session (open modal)
      if (chunk === "c") {
        if (!currentState.serverData.connected) {
          dispatch({ type: "LAST_ACTION", value: "[ERROR] Server offline - cannot create session" });
          return;
        }
        dispatch({ type: "OPEN_MODAL", value: { type: "session-create" } });
        return;
      }
      // m - Send message (open modal)
      if (chunk === "m") {
        if (!currentState.serverData.connected) {
          dispatch({ type: "LAST_ACTION", value: "[ERROR] Server offline - cannot send message" });
          return;
        }
        const sessionId = currentState.currentSessionId || (currentState.serverData.sessions[0]?.id);
        if (!sessionId) {
          dispatch({ type: "LAST_ACTION", value: "[ERROR] No session available - press 'c' to create one" });
          return;
        }
        dispatch({ type: "OPEN_MODAL", value: { type: "message", payload: { sessionId } } });
        return;
      }
      // x - Execute command (open modal)
      if (chunk === "x") {
        if (!currentState.serverData.connected) {
          dispatch({ type: "LAST_ACTION", value: "[ERROR] Server offline - cannot execute command" });
          return;
        }
        const sessionId = currentState.currentSessionId || (currentState.serverData.sessions[0]?.id);
        if (!sessionId) {
          dispatch({ type: "LAST_ACTION", value: "[ERROR] No session available - press 'c' to create one" });
          return;
        }
        dispatch({ type: "OPEN_MODAL", value: { type: "command", payload: { sessionId } } });
        return;
      }
      // t - Show todos
      if (chunk === "t") {
        if (!currentState.serverData.connected) {
          dispatch({ type: "LAST_ACTION", value: "[ERROR] Server offline - cannot fetch todos" });
          return;
        }
        const sessionId = currentState.currentSessionId || (currentState.serverData.sessions[0]?.id);
        if (!sessionId) {
          dispatch({ type: "LAST_ACTION", value: "[ERROR] No session available - press 'c' to create one" });
          return;
        }
        dispatch({ type: "ACTION_LOADING", value: true });
        apiClient.listTodos(sessionId).then((todos) => {
          if (todos.length > 0) {
            const summary = todos.slice(0, 3).map(t => t.content?.slice(0, 20) || t.id.slice(0, 8)).join(", ");
            dispatch({ type: "LAST_ACTION", value: `[OK] Todos (${todos.length}): ${summary}...` });
          } else {
            dispatch({ type: "LAST_ACTION", value: "[INFO] No todos in current session" });
          }
          dispatch({ type: "ACTION_LOADING", value: false });
        });
        return;
      }
      // a - List agents
      if (chunk === "a") {
        if (currentState.serverData.connected && currentState.serverData.agents.length > 0) {
          const agentList = currentState.serverData.agents.map((a) => a.name).join(", ");
          dispatch({ type: "LAST_ACTION", value: `Agents: ${agentList}` });
        } else {
          dispatch({ type: "LAST_ACTION", value: "No agents available - Server offline" });
        }
        return;
      }
      if (chunk >= "1" && chunk <= "7") {
        dispatch({ type: "TAB_SET", value: Number(chunk) - 1 });
        return;
      }
      if (chunk === "l") {
        const nextLang = toggleLang(currentState.lang);
        dispatch({ type: "SET_LANG", value: nextLang });
        dispatch({ type: "LAST_ACTION", value: `[OK] ${t("settings.toggle_lang", nextLang)}` });
        return;
      }
      if (chunk === "q" || chunk === "\u0003") {
        renderer.destroy();
      }
    };

    stdin.on("data", onData);

    return () => {
      mounted = false;
      clearInterval(poller);
      stdin.off("data", onData);
      if (stdin.isTTY) stdin.setRawMode(false);
      renderer.destroy();
    };
  }, [renderer]);

  return (
    <box backgroundColor={COLORS.bg} flexDirection="column" flexGrow={1} padding={1}>
      {/* HEADER */}
      <box 
        border 
        borderStyle="single" 
        borderColor={COLORS.neonGreen} 
        paddingX={2} 
        paddingY={1}
        marginBottom={1}
        flexDirection="row"
        justifyContent="space-between"
        backgroundColor={COLORS.panelBg}
      >
        <box flexDirection="row">
          <text fg={COLORS.neonGreen}><strong>HIVEMIND</strong></text>
          <text fg={COLORS.text}><strong>_v3.0</strong></text>
          <text fg={COLORS.dimText}><strong>::</strong></text>
          <text fg={COLORS.neonBlue}><strong>{t("header.subtitle", state.lang)}</strong></text>
        </box>
        <box flexDirection="row" gap={2}>
          <box flexDirection="row">
            <text fg={COLORS.dimText}>{t("header.session", state.lang)}: </text>
            <text fg={COLORS.neonBlue}>{state.snapshot?.overview?.sessionId?.slice(0, 12) || t("misc.na", state.lang)}</text>
          </box>
          <box flexDirection="row">
            <text fg={COLORS.dimText}>{t("header.server", state.lang)}: </text>
            <text fg={state.serverData?.connected ? COLORS.neonGreen : COLORS.neonAmber}>
              {state.serverData?.connected ? t("status.online", state.lang) : t("status.offline", state.lang)}
            </text>
          </box>
          <box flexDirection="row">
            <text fg={COLORS.dimText}>{t("header.status", state.lang)}: </text>
            <text fg={state.connected ? COLORS.neonGreen : COLORS.error}>{state.connected ? t("status.ok", state.lang) : t("status.err", state.lang)}</text>
          </box>
          <box flexDirection="row">
            <text fg={COLORS.dimText}>{t("misc.lang", state.lang)}: </text>
            <text fg={COLORS.neonBlue}>{state.lang.toUpperCase()}</text>
          </box>
        </box>
      </box>

      {/* MAIN LAYOUT - 2 Columns */}
      <box flexDirection="row" flexGrow={1} height={18}>
        {/* LEFT SIDEBAR - Navigation */}
        <box 
          width={22} 
          border 
          borderStyle="single" 
          borderColor={COLORS.border} 
          flexDirection="column" 
          backgroundColor={COLORS.panelBg}
          marginRight={1}
        >
          <box border borderStyle="single" borderColor={COLORS.border} paddingX={1}>
            <text fg={COLORS.neonBlue}><strong>{t("nav.title", state.lang)}</strong></text>
          </box>
          
          {getTabs(state.lang).map((tab: string, index: number) => {
            const active = index === state.activeTab;
            return (
              <box 
                key={tab} 
                paddingX={1} 
                paddingY={0}
                backgroundColor={active ? COLORS.border : undefined}
              >
                <text fg={active ? COLORS.neonGreen : COLORS.dimText}>
                  {active ? "▶" : " "} {index + 1}. {tab}
                </text>
              </box>
            );
          })}
          
          {/* Quick Stats in sidebar */}
          <box flexGrow={1} />
          <box border borderStyle="single" borderColor={COLORS.border} paddingX={1}>
            <box flexDirection="row">
              <text fg={COLORS.dimText}>DRIFT: </text>
              <text fg={(state.snapshot?.overview?.driftScore ?? 0) >= 50 ? COLORS.neonGreen : COLORS.neonAmber}>{state.snapshot?.overview?.driftScore ?? 0}</text>
            </box>
          </box>
        </box>

        {/* RIGHT - Main Content Area */}
        <box flexGrow={1} flexDirection="column">
          <MainPanel state={state} />
        </box>
      </box>

      {/* FOOTER */}
      <box 
        border 
        borderStyle="single" 
        borderColor={state.connected ? COLORS.neonGreen : COLORS.error} 
        paddingX={1} 
        paddingY={0}
        marginTop={1}
        flexDirection="row"
        justifyContent="space-between"
        backgroundColor={COLORS.panelBg}
      >
        <box flexDirection="row">
          <text fg={state.connected ? COLORS.neonGreen : COLORS.error}>
            <strong>● {state.connected ? t("status.connected", state.lang) : t("status.disconnected", state.lang)}</strong>
          </text>
          <text fg={COLORS.dimText}> {state.loading ? t("status.syncing", state.lang) : ""}</text>
          <text fg="gray"> | </text>
          <text fg={state.serverData?.connected ? COLORS.neonGreen : COLORS.neonAmber}>
            {state.serverData?.connected
              ? `${t("header.server", state.lang)}:${t("status.online", state.lang)}`
              : `${t("header.server", state.lang)}:${t("status.offline", state.lang)}`}
          </text>
        </box>
        <box flexDirection="row">
          <text fg={COLORS.dimText}>[Tab/j/k] {t("footer.navigate", state.lang)}</text>
          <text fg="gray"> | </text>
          <text fg={COLORS.dimText}>[1-7] {t("footer.jump", state.lang)}</text>
          <text fg="gray"> | </text>
          <text fg={COLORS.dimText}>[r] {t("footer.refresh", state.lang)}</text>
          <text fg="gray"> | </text>
          <text fg={COLORS.dimText}>[cmaxt] {t("footer.server", state.lang)}</text>
          <text fg="gray"> | </text>
          <text fg={COLORS.dimText}>[l] {t("action.toggle_lang", state.lang)}</text>
          <text fg="gray"> | </text>
          <text fg={COLORS.dimText}>[q] {t("action.quit", state.lang)}</text>
        </box>
      </box>

      {/* MODAL OVERLAY */}
      {state.modal && (
        <InputModal
          title={
            state.modal.type === "session-create" ? t("modal.title_session", state.lang) :
            state.modal.type === "message" ? t("modal.title_message", state.lang) :
            t("modal.title_command", state.lang)
          }
          placeholder={t("modal.placeholder", state.lang)}
          submitLabel={t("modal.submit", state.lang)}
          cancelLabel={t("modal.cancel", state.lang)}
          onSubmit={async (value: string) => {
            const currentModal = state.modal;
            if (!currentModal) {
              dispatch({ type: "CLOSE_MODAL" });
              return;
            }

            dispatch({ type: "ACTION_LOADING", value: true });
            try {
              if (currentModal.type === "session-create") {
                const session = await apiClient.createSession();
                if (session) {
                  dispatch({ type: "SET_SESSION", value: session.id });
                  dispatch({ type: "LAST_ACTION", value: `[OK] Session created: ${session.id.slice(0, 8)}...` });
                } else {
                  dispatch({ type: "LAST_ACTION", value: "[ERROR] Failed to create session" });
                }
              } else if (currentModal.type === "message" && currentModal.payload?.sessionId) {
                const result = await apiClient.sendMessage(currentModal.payload.sessionId, value);
                if (result.success) {
                  dispatch({ type: "LAST_ACTION", value: `[OK] Message sent` });
                } else {
                  dispatch({ type: "LAST_ACTION", value: `[ERROR] ${result.error || "Failed"}` });
                }
              } else if (currentModal.type === "command" && currentModal.payload?.sessionId) {
                const result = await apiClient.executeCommand(currentModal.payload.sessionId, value);
                if (result.success) {
                  dispatch({ type: "LAST_ACTION", value: `[OK] Command executed` });
                } else {
                  dispatch({ type: "LAST_ACTION", value: `[ERROR] ${result.error || "Failed"}` });
                }
              }
            } catch (error) {
              dispatch({ type: "LAST_ACTION", value: `[ERROR] ${error instanceof Error ? error.message : String(error)}` });
            } finally {
              dispatch({ type: "ACTION_LOADING", value: false });
              dispatch({ type: "CLOSE_MODAL" });
            }
          }}
          onCancel={() => {
            dispatch({ type: "CLOSE_MODAL" });
          }}
        />
      )}
    </box>
  );
}

const renderer = await openTUICoreCompat.createCliRenderer();
openTUIReactCompat.createRoot(renderer).render(<App renderer={renderer} />);
