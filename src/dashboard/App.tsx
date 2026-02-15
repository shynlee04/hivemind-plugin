import React, { useEffect, useMemo, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { DashboardSnapshot, DashboardLanguage } from "./types.js";
import { getDashboardStrings } from "./i18n.js";
import { loadDashboardSnapshot } from "./loader.js";
import { COLORS } from "./design-tokens.js";

// Views
import { TrajectoryPane } from "./components/TrajectoryPane.js";
import { TelemetryHeader } from "./components/TelemetryHeader.js";
import { AutonomicLog } from "./components/AutonomicLog.js";
import { SwarmMonitor } from "./components/SwarmMonitor.js";
import { SwarmOrchestratorView } from "./views/SwarmOrchestratorView.js";
import { TimeTravelDebuggerView } from "./views/TimeTravelDebuggerView.js";
import { ToolRegistryView } from "./views/ToolRegistryView.js";
import { InteractiveFooter } from "./components/InteractiveFooter.js";

interface AppProps {
  projectRoot: string;
  initialLanguage: DashboardLanguage;
  refreshMs: number;
}

type ViewId = "main" | "swarm" | "timetravel" | "tools" | "settings";

export function App({ projectRoot, initialLanguage, refreshMs }: AppProps) {
  const { exit } = useApp();
  const [language, setLanguage] = useState<DashboardLanguage>(initialLanguage);
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewId>("main");

  const strings = useMemo(() => getDashboardStrings(language), [language]);

  // View Metadata
  const views = [
    { id: "main", label: strings.view_main, key: "1" },
    { id: "swarm", label: strings.view_swarm, key: "2" },
    { id: "timetravel", label: strings.view_timetravel, key: "3" },
    { id: "tools", label: strings.view_tools, key: "4" },
    { id: "settings", label: strings.view_settings, key: "5" },
  ];

  // Data Loading Effect
  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      try {
        const next = await loadDashboardSnapshot(projectRoot);
        if (!mounted) return;
        setSnapshot(next);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setError(String(err));
      }
    };

    void refresh();
    const timer = setInterval(() => {
      void refresh();
    }, refreshMs);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [projectRoot, refreshMs]);

  // Input Handling [US-037, US-044, US-049]
  useInput((input, key) => {
    // Quit
    if (input === "q" || key.escape || (key.ctrl && input === "c")) {
      exit();
      return;
    }

    // Language Toggle [US-044]
    if (input === "l") {
      setLanguage((prev) => (prev === "en" ? "vi" : "en"));
      return;
    }

    // Refresh Manual
    if (input === "r") {
      void loadDashboardSnapshot(projectRoot)
        .then((next) => {
          setSnapshot(next);
          setError(null);
        })
        .catch((err) => {
          setError(String(err));
        });
    }

    // View Navigation [US-049]
    if (input === "1") setCurrentView("main");
    if (input === "2") setCurrentView("swarm");
    if (input === "3") setCurrentView("timetravel");
    if (input === "4") setCurrentView("tools");
    if (input === "5") setCurrentView("settings");

    // Tab cycling
    if (key.tab) {
       const currentIndex = views.findIndex(v => v.id === currentView);
       const nextIndex = (currentIndex + 1) % views.length;
       setCurrentView(views[nextIndex].id as ViewId);
    }
  });

  const renderContent = () => {
    if (!snapshot) return <Text>Loading snapshot...</Text>;

    switch (currentView) {
      case "main":
        return (
          <Box flexDirection="row" flexGrow={1}>
             {/* Left Column: Trajectory & Swarm Status */}
             <Box flexDirection="column" width="50%" marginRight={1}>
                <TrajectoryPane session={snapshot.session} hierarchy={snapshot.hierarchy} strings={strings} />
                <SwarmMonitor strings={strings} />
             </Box>

             {/* Right Column: Logs */}
             <Box flexDirection="column" flexGrow={1}>
                <AutonomicLog alerts={snapshot.alerts} strings={strings} />
             </Box>
          </Box>
        );
      case "swarm":
         return <SwarmOrchestratorView strings={strings} />;
      case "timetravel":
         return <TimeTravelDebuggerView strings={strings} />;
      case "tools":
         return <ToolRegistryView strings={strings} />;
      case "settings":
         return (
           <Box flexDirection="column" padding={1} borderStyle="round" borderColor={COLORS.dim}>
              <Text bold color={COLORS.neonBlue}>{strings.view_settings}</Text>
              <Box height={1} />
              <Text>Language: {language.toUpperCase()}</Text>
              <Text>Refresh Rate: {refreshMs}ms</Text>
              <Text>Version: HiveMind v3.0 (Ink Adaptation)</Text>
              <Box height={1} />
              <Text color={COLORS.warning}>NOTE: This is a Node.js/Ink adaptation of the OpenTUI spec.</Text>
           </Box>
         );
      default:
        return <Text color="red">Unknown View</Text>;
    }
  };

  if (error) {
    return (
      <Box flexDirection="column" paddingX={1} borderColor={COLORS.error} borderStyle="round">
        <Text color={COLORS.error} bold>Dashboard Error</Text>
        <Text>{error}</Text>
        <Text color={COLORS.dim} marginTop={1}>Press [Q] to quit</Text>
      </Box>
    );
  }

  if (!snapshot) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text bold color={COLORS.neonBlue}>{strings.title}</Text>
        <Text color={COLORS.dim}>Initializing connection to HiveMind kernel...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1} flexGrow={1} height="100%">
      {/* 1. Global Header (Telemetry) [US-033] */}
      <TelemetryHeader
        metrics={snapshot.metrics}
        session={snapshot.session}
        strings={strings}
        currentView={views.find(v => v.id === currentView)?.label ?? "Unknown"}
      />

      {/* 2. Navigation Tabs [US-049] */}
      <Box flexDirection="row" borderStyle="single" borderColor={COLORS.dim} marginBottom={1} paddingX={1}>
        {views.map((v) => {
           const isActive = v.id === currentView;
           const color = isActive ? COLORS.neonGreen : COLORS.dim;
           const label = isActive ? `[${v.label}]` : ` ${v.label} `;

           return (
             <Box key={v.id} marginRight={2}>
               <Text color={color} bold={isActive}>{label}</Text>
             </Box>
           );
        })}
      </Box>

      {/* 3. Main Content Area */}
      {renderContent()}

      {/* 4. Global Footer [US-037] */}
      <InteractiveFooter strings={strings} />
    </Box>
  );
}
