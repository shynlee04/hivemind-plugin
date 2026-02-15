import React from "react";
import { Box, Text } from "ink";
import { DashboardStrings } from "../i18n.js";
import { COLORS } from "../design-tokens.js";

interface TimeTravelDebuggerViewProps {
  strings: DashboardStrings;
}

export function TimeTravelDebuggerView({ strings }: TimeTravelDebuggerViewProps) {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor={COLORS.trace} paddingX={1} flexGrow={1}>
      <Text bold color={COLORS.trace}>{strings.time_travel}</Text>
      <Text dimColor>TODO: Implement history replay and branching visualization.</Text>
    </Box>
  );
}
