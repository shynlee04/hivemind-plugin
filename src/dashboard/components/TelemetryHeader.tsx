import React from "react";
import { Box, Text } from "ink";
import { MetricsView, SessionView } from "../types.js";
import { DashboardStrings } from "../i18n.js";
import { COLORS } from "../design-tokens.js";

interface TelemetryHeaderProps {
  metrics: MetricsView;
  session: SessionView;
  strings: DashboardStrings;
  currentView: string;
}

export function TelemetryHeader({ metrics, session, strings, currentView }: TelemetryHeaderProps) {
  // Drift Score Color Coding
  const driftColor = metrics.driftScore < 20 ? COLORS.neonGreen : metrics.driftScore < 50 ? COLORS.neonAmber : COLORS.neonRed;

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={COLORS.neonBlue} paddingX={1} marginBottom={1}>
      {/* Top Row: Title & Session Info */}
      <Box flexDirection="row" justifyContent="space-between">
        <Text bold color={COLORS.neonBlue}>{strings.title}</Text>
        <Text color={COLORS.dim}>[{currentView}]</Text>
      </Box>

      <Box height={1} />

      {/* Metric Grid */}
      <Box flexDirection="row" justifyContent="space-between">
         <Box flexDirection="column" width="25%">
            <Text color={COLORS.dim}>{strings.session}</Text>
            <Text color={COLORS.neonPurple}>{session.id.slice(0, 8)}...</Text>
         </Box>
         <Box flexDirection="column" width="25%">
            <Text color={COLORS.dim}>{strings.mode}</Text>
            <Text color={COLORS.info}>{session.mode}</Text>
         </Box>
         <Box flexDirection="column" width="25%">
            <Text color={COLORS.dim}>{strings.drift_score}</Text>
            <Text bold color={driftColor}>{metrics.driftScore}/100</Text>
         </Box>
         <Box flexDirection="column" width="25%">
            <Text color={COLORS.dim}>{strings.health}</Text>
            <Text color={COLORS.neonGreen}>{metrics.healthScore}%</Text>
         </Box>
      </Box>

      {/* Secondary Metrics */}
      <Box flexDirection="row" marginTop={1} justifyContent="space-between">
        <Text>
          <Text color={COLORS.dim}>{strings.turns}: </Text>
          <Text color={COLORS.neutral}>{metrics.turnCount}</Text>
        </Text>
        <Text>
          <Text color={COLORS.dim}>{strings.files}: </Text>
          <Text color={COLORS.neutral}>{metrics.filesTouched}</Text>
        </Text>
        <Text>
           <Text color={COLORS.dim}>{strings.violations}: </Text>
           <Text color={COLORS.neonRed}>{metrics.violations}</Text>
        </Text>
      </Box>
    </Box>
  );
}
