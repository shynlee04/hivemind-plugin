import React from "react";
import { Box, Text } from "ink";
import { DashboardSnapshot } from "../types.js";
import { DashboardStrings } from "../i18n.js";
import { TrajectoryPane } from "../components/TrajectoryPane.js";
import { TelemetryHeader } from "../components/TelemetryHeader.js";
import { AutonomicLog } from "../components/AutonomicLog.js";
import { InteractiveFooter } from "../components/InteractiveFooter.js";
import { SwarmMonitor } from "../components/SwarmMonitor.js";
import { COLORS } from "../design-tokens.js";

interface SwarmOrchestratorViewProps {
  snapshot: DashboardSnapshot;
  strings: DashboardStrings;
}

export function SwarmOrchestratorView({ snapshot, strings }: SwarmOrchestratorViewProps) {
  return (
    <Box flexDirection="column" paddingX={1} flexGrow={1}>
      <Text bold color={COLORS.primary}>{strings.title}</Text>

      <Box flexDirection="row" marginTop={1} flexGrow={1}>
        {/* Left Column: Trajectory (Session/Hierarchy) */}
        <Box flexDirection="column" width="45%" marginRight={1}>
          <TrajectoryPane session={snapshot.session} hierarchy={snapshot.hierarchy} strings={strings} />
          <SwarmMonitor strings={strings} />
        </Box>

        {/* Right Column: Metrics & Logs */}
        <Box flexDirection="column" flexGrow={1}>
          <TelemetryHeader metrics={snapshot.metrics} trace={snapshot.trace} strings={strings} />
          <AutonomicLog alerts={snapshot.alerts} strings={strings} />
        </Box>
      </Box>

      <InteractiveFooter strings={strings} />
    </Box>
  );
}
