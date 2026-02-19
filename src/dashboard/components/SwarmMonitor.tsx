import React from "react";
import { Box, Text } from "ink";
import { DashboardStrings } from "../i18n.js";
import { COLORS } from "../design-tokens.js";

interface SwarmMonitorProps {
  strings: DashboardStrings;
}

export function SwarmMonitor({ strings }: SwarmMonitorProps) {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor={COLORS.info} paddingX={1} marginBottom={1}>
      <Text bold color={COLORS.info}>{strings.swarm_monitor}</Text>
      <Text color={COLORS.dim}>TODO [US-040]: Implement swarm status tracking.</Text>
    </Box>
  );
}
