// @ts-nocheck
import { createCliRenderer, TextAttributes } from "@opentui/core";
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

function createInitialState() {
  return {
    activeTab: 0,
    connected: false,
    loading: true,
    error: null,
    snapshot: null,
  };
}

function reducer(state, action) {
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

function trimRows(rows, limit = 18) {
  return rows.slice(0, limit);
}

function renderOverview(snapshot) {
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

function renderPipeline(snapshot) {
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

function renderHierarchy(snapshot) {
  return [
    `Nodes=${snapshot.hierarchy.totalNodes} Active=${snapshot.hierarchy.activeNodes} Depth=${snapshot.hierarchy.depth}`,
    "",
    ...snapshot.hierarchy.lines,
  ];
}

function renderIncidents(snapshot) {
  return [
    `Incident level: ${snapshot.incidents.level.toUpperCase()}`,
    "",
    ...snapshot.incidents.items.map((item) => `- ${item}`),
  ];
}

function renderCodeIntel(snapshot) {
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
    ...snapshot.codeIntel.codeIntelModules.map((name) => `- ${name}`),
  ];
  return rows;
}

function renderGovernance(snapshot) {
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

function renderSettings(snapshot) {
  return [
    "Sidecar boundaries:",
    ...snapshot.settings.boundaries.map((entry) => `- ${entry}`),
    "",
    "Keyboard:",
    "- Tab / Shift+Tab / j / k: change tabs",
    "- Number keys 1-7: jump tabs",
    "- r: refresh snapshot immediately",
    "- q or Ctrl+C: exit",
  ];
}

function renderTabRows(activeTab, snapshot) {
  if (!snapshot) return ["Loading dashboard snapshot..."];
  if (activeTab === 0) return renderOverview(snapshot);
  if (activeTab === 1) return renderPipeline(snapshot);
  if (activeTab === 2) return renderHierarchy(snapshot);
  if (activeTab === 3) return renderIncidents(snapshot);
  if (activeTab === 4) return renderCodeIntel(snapshot);
  if (activeTab === 5) return renderGovernance(snapshot);
  return renderSettings(snapshot);
}

function MainPanel({ state }) {
  if (state.error) {
    return (
      <box flexDirection="column" flexGrow={1}>
        <text attributes={TextAttributes.BOLD}>Dashboard data load failed</text>
        <text>{state.error}</text>
      </box>
    );
  }

  const rows = renderTabRows(state.activeTab, state.snapshot);

  return (
    <box flexDirection="column" flexGrow={1}>
      {trimRows(rows, 24).map((row, index) => (
        <text key={`row-${index}`} attributes={index === 0 ? TextAttributes.BOLD : undefined}>{row}</text>
      ))}
    </box>
  );
}

function App({ renderer }) {
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

    const onData = (chunk) => {
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
    <box flexDirection="column" flexGrow={1} padding={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text attributes={TextAttributes.BOLD}>HiveMind OpenTUI Sidecar v2</text>
        <text attributes={TextAttributes.DIM}>Overview | Pipeline | Hierarchy | Incidents | Code-Intel | Governance | Settings</text>
      </box>

      <box flexDirection="row" flexGrow={1} marginTop={1}>
        <box width={28} flexDirection="column">
          {TABS.map((tab, index) => {
            const active = index === state.activeTab;
            return (
              <text key={tab} attributes={active ? TextAttributes.BOLD : TextAttributes.DIM}>
                {active ? ">" : " "} {index + 1}. {tab}
              </text>
            );
          })}
        </box>
        <box flexGrow={1} flexDirection="column">
          <MainPanel state={state} />
        </box>
      </box>

      <box marginTop={1}>
        <text>
          status={state.connected ? "connected" : "disconnected"} loading={state.loading ? "yes" : "no"} tab={TABS[state.activeTab]}
        </text>
      </box>
    </box>
  );
}

const renderer = await createCliRenderer();
createRoot(renderer).render(<App renderer={renderer} />);
