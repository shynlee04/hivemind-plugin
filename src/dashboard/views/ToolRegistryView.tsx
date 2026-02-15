import React from "react";
import { Box, Text } from "ink";
import { DashboardStrings } from "../i18n.js";
import { COLORS } from "../design-tokens.js";

interface ToolRegistryViewProps {
  strings: DashboardStrings;
}

export function ToolRegistryView({ strings }: ToolRegistryViewProps) {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor={COLORS.neonBlue} paddingX={1} flexGrow={1}>
      <Text bold color={COLORS.neonBlue}>{strings.tool_registry}</Text>
      <Box height={1} />
      <Text color={COLORS.dim}>TODO [US-047]: Implement tool catalog and schema viewer.</Text>
      <Text color={COLORS.dim}>List available tools from current context.</Text>
    </Box>
  );
}
