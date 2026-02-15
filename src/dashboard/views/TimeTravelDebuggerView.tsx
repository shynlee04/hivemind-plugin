import React from "react";
import { Box, Text } from "ink";
import { DashboardStrings } from "../i18n.js";
import { COLORS } from "../design-tokens.js";

interface TimeTravelDebuggerViewProps {
  strings: DashboardStrings;
}

export function TimeTravelDebuggerView({ strings }: TimeTravelDebuggerViewProps) {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor={COLORS.neonPink} paddingX={1} flexGrow={1}>
      <Text bold color={COLORS.neonPink}>{strings.time_travel}</Text>
      <Box height={1} />
      <Text color={COLORS.dim}>TODO [US-046]: Implement state history timeline and diff viewer.</Text>
      <Text color={COLORS.dim}>Needs access to git log and previous state snapshots.</Text>
    </Box>
  );
}
