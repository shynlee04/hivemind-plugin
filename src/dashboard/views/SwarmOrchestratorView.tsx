import React from "react";
import { Box, Text } from "ink";
import { DashboardStrings } from "../i18n.js";
import { COLORS } from "../design-tokens.js";

interface SwarmOrchestratorViewProps {
  strings: DashboardStrings;
}

export function SwarmOrchestratorView({ strings }: SwarmOrchestratorViewProps) {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor={COLORS.neonPurple} paddingX={1} flexGrow={1}>
      <Text bold color={COLORS.neonPurple}>{strings.swarm_orchestrator}</Text>
      <Box height={1} />
      <Text color={COLORS.dim}>TODO [US-045]: Implement agent topology grid and communication bus.</Text>
      <Text color={COLORS.dim}>Requires session state integration for active swarms.</Text>
    </Box>
  );
}
