import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { useEffect, useReducer } from "react";
import { loadDashboardSnapshot } from "./snapshot.js";

const TABS = [
  "Overview",
  "Pipeline",
  "Hierarchy",
  "Incidents",
  "Code-Intel",
  "Governance",
  "Settings",
];

interface AppState {
  activeTab: number;
  connected: boolean;
  loading: boolean;
  error: string | null;
  snapshot: any | null;
}

type AppAction =
  | { type: "TAB_NEXT" }
  | { type: "TAB_PREV" }
  | { type: "TAB_SET"; value: number }
  | { type: "CONNECTED"; value: boolean }
  | { type: "SNAPSHOT"; value: any }
  | { type: "ERROR"; value: string };

function createInitialState(): AppState {
  return {
    activeTab: 0,
    connected: false,
    loading: true,
    error: null,
    snapshot: null,
  };
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "TAB_NEXT":
      return { ...state, activeTab: (state.activeTab + 1) % TABS.length };
    case "TAB_PREV":
      return { ...state, activeTab: (state.activeTab - 1 + TABS.length) % TABS.length };
    case "TAB_SET":
      return { ...state, activeTab: action.value };
    case "CONNECTED":
      return { ...state, connected: action.value };
    case "SNAPSHOT":
      return { ...state, snapshot: action.value, loading: false, error: null };
    case "ERROR":
      return { ...state, loading: false, error: action.value };
    default:
      return state;
  }
}

function trimRows(rows: string[], limit = 18): string[] {
  return rows.slice(0, limit);
}

function renderOverview(snapshot: any) {
  const rows = [
    `Session ID: ${snapshot.overview.sessionId}`,
    `Mode: ${snapshot.overview.mode}`,
    `Governance: ${snapshot.overview.governanceStatus}`,
    `Drift: ${snapshot.overview.driftScore}`,
    `Turn Count: ${snapshot.overview.turnCount}`,
    `Files Touched: ${snapshot.overview.filesTouched}`,
    `Snapshot Time: ${snapshot.overview.updatedAt}`,
  ];
  return rows;
}

function renderPipeline(snapshot: any) {
  const rows = [
    `Task totals: ${snapshot.pipeline.total} | active=${snapshot.pipeline.inProgress} pending=${snapshot.pipeline.pending} blocked=${snapshot.pipeline.blocked} complete=${snapshot.pipeline.complete}`,
    `Delegation lanes: ${snapshot.pipeline.delegationLanes.join(", ") || "none"}`,
    "",
    "Active trajectory task bindings:",
  ];

  if (snapshot.pipeline.activeTasks.length === 0) {
    rows.push("- no active_task_ids linked in trajectory.json");
  } else {
    for (const task of snapshot.pipeline.activeTasks) {
      rows.push(
        `- ${task.status} | ${task.title} | lane=${task.lane ?? "n/a"} persona=${task.persona ?? "n/a"} action=${task.hivefiver_action ?? "n/a"}`,
      );
    }
  }

  return rows;
}

function renderHierarchy(snapshot: any) {
  return [
    `Nodes=${snapshot.hierarchy.totalNodes} Active=${snapshot.hierarchy.activeNodes} Depth=${snapshot.hierarchy.depth}`,
    "",
    ...snapshot.hierarchy.lines,
  ];
}

function renderIncidents(snapshot: any) {
  return [
    `Incident level: ${snapshot.incidents.level.toUpperCase()}`,
    "",
    ...snapshot.incidents.items.map((item: string) => `- ${item}`),
  ];
}

function renderCodeIntel(snapshot: any) {
  const rows = [
    `Source: ${snapshot.codeIntel.source}`,
    `Updated: ${snapshot.codeIntel.updatedAt}`,
    `Indexed entities: ${snapshot.codeIntel.indexedEntities}`,
    `Code-intel modules discovered: ${snapshot.codeIntel.codeIntelModules.length}`,
    `Files: ${snapshot.codeIntel.fileCount}`,
    `Tokens: ${snapshot.codeIntel.totalTokens}`,
    `Compression ratio: ${snapshot.codeIntel.compressionRatio}%`,
    "",
    "Code-intel module surface:",
    ...snapshot.codeIntel.codeIntelModules.map((name: string) => `- ${name}`),
  ];
  return rows;
}

function renderGovernance(snapshot: any) {
  const rows = ["Checks:"];
  for (const check of snapshot.governance.checks) {
    rows.push(`- [${check.status}] ${check.key}: ${check.detail}`);
  }

  rows.push("", "Anchors:");
  if (snapshot.governance.anchors.length === 0) {
    rows.push("- none");
  } else {
    for (const anchor of snapshot.governance.anchors.slice(0, 5)) {
      rows.push(`- ${anchor.key}: ${anchor.value.slice(0, 96)}`);
    }
  }

  rows.push("", "Memory shelves:");
  for (const item of snapshot.governance.memsByShelf.slice(0, 8)) {
    rows.push(`- ${item.shelf}: ${item.count}`);
  }

  rows.push("", "Recent session messages:");
  for (const message of snapshot.governance.recentMessages) {
    rows.push(`- ${message}`);
  }

  return rows;
}

function renderSettings(snapshot: any) {
  return [
    "Sidecar boundaries:",
    ...snapshot.settings.boundaries.map((entry: string) => `- ${entry}`),
  ];
}

function renderTabRows(activeTab: number, snapshot: any | null) {
  if (!snapshot) return ["Loading dashboard snapshot..."];
  if (activeTab === 0) return renderOverview(snapshot);
  if (activeTab === 1) return renderPipeline(snapshot);
  if (activeTab === 2) return renderHierarchy(snapshot);
  if (activeTab === 3) return renderIncidents(snapshot);
  if (activeTab === 4) return renderCodeIntel(snapshot);
  if (activeTab === 5) return renderGovernance(snapshot);
  return renderSettings(snapshot);
}

function MainPanel({ state }: { state: AppState }) {
  if (state.error) {
    return (
      <box flexDirection="column" flexGrow={1}>
        <text fg="red"><strong>Dashboard data load failed</strong></text>
        <text fg="red">{state.error}</text>
      </box>
    );
  }

  const rows = renderTabRows(state.activeTab, state.snapshot);

  return (
    <box flexDirection="column" flexGrow={1}>
      {trimRows(rows, 24).map((row, index) => (
        <box key={`row-${index}`}>
          {index === 0 ? (
            <text fg="cyan"><strong>{row}</strong></text>
          ) : (
            <text>{row}</text>
          )}
        </box>
      ))}
    </box>
  );
}

function App({ renderer }: { renderer: any }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  useEffect(() => {
    let mounted = true;
    dispatch({ type: "CONNECTED", value: true });

    const refresh = async () => {
      try {
        const snapshot = await loadDashboardSnapshot(process.cwd());
        if (!mounted) return;
        dispatch({ type: "SNAPSHOT", value: snapshot });
      } catch (error) {
        if (!mounted) return;
        dispatch({ type: "ERROR", value: error instanceof Error ? error.message : String(error) });
      }
    };

    void refresh();
    const poller = setInterval(() => {
      void refresh();
    }, 2200);

    const stdin = process.stdin;
    stdin.setEncoding("utf8");
    if (stdin.isTTY) stdin.setRawMode(true);
    stdin.resume();

    const onData = (chunk: string) => {
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
        return;
      }
      if (chunk >= "1" && chunk <= "7") {
        dispatch({ type: "TAB_SET", value: Number(chunk) - 1 });
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
    <box border borderStyle="rounded" borderColor="blue" paddingX={2} flexDirection="column" flexGrow={1}>
      {/* Header Panel */}
      <box flexDirection="row" width="100%" justifyContent="space-between">
        <text fg="cyan"><strong>HiveMind OpenTUI Sidecar</strong></text>
        <text fg="yellow">v2.0.0</text>
      </box>

      {/* Main Content Area */}
      <box flexDirection="row" flexGrow={1} height={20}>
        {/* Navigation Sidebar */}
        <box width={24} border borderStyle="single" borderColor="gray" flexDirection="column">
          <box>
            <text fg="magenta"><strong>MENU</strong></text>
          </box>
          {TABS.map((tab, index) => {
            const active = index === state.activeTab;
            return (
              <box key={tab}>
                <text fg={active ? "green" : "gray"}>
                  {active ? <strong>{"▶ " + (index + 1) + ". " + tab}</strong> : "  " + (index + 1) + ". " + tab}
                </text>
              </box>
            );
          })}
        </box>

        {/* Content Panel */}
        <box flexGrow={1} border borderStyle="single" borderColor="white" flexDirection="column" paddingX={1}>
          <box>
            <text fg="cyan"><strong>{TABS[state.activeTab]?.toUpperCase() ?? ""}</strong></text>
          </box>
          <MainPanel state={state} />
        </box>
      </box>

      {/* Footer Panel */}
      <box border borderStyle="rounded" borderColor={state.connected ? "green" : "red"}>
        <box flexDirection="row" width="100%" justifyContent="space-between">
          <box flexDirection="row">
            <text fg={state.connected ? "green" : "red"}>
              <strong>● {state.connected ? "CONNECTED" : "DISCONNECTED"}</strong>
            </text>
            <text fg="gray">
              {state.loading ? " (Syncing...)" : " (Idle)"}
            </text>
          </box>
          <box>
            <text fg="gray">
              [Tab/j/k] Navigate | [1-7] Jump | [r] Refresh | [q] Quit
            </text>
          </box>
        </box>
      </box>
    </box>
  );
}

const renderer = await createCliRenderer();
createRoot(renderer).render(<App renderer={renderer} />);
