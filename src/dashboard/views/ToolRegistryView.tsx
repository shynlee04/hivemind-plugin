import React from "react";
import { Box, Text } from "ink";
import { DashboardStrings } from "../i18n.js";
import { COLORS } from "../design-tokens.js";

interface ToolRegistryViewProps {
  strings: DashboardStrings;
}

export function ToolRegistryView({ strings }: ToolRegistryViewProps) {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor={COLORS.secondary} paddingX={1} flexGrow={1}>
      <Text bold color={COLORS.secondary}>{strings.tool_registry}</Text>
      <Text dimColor>TODO: Implement tool availability and usage stats.</Text>
    </Box>
  );
}
