import React from "react";
import { Box, Text } from "ink";
import { DashboardStrings } from "../i18n.js";
import { COLORS } from "../design-tokens.js";

interface MemCreationModalProps {
  strings: DashboardStrings;
  visible: boolean;
}

export function MemCreationModal({ strings, visible }: MemCreationModalProps) {
  if (!visible) return null;

  return (
    <Box flexDirection="column" borderStyle="double" borderColor={COLORS.primary} paddingX={1} position="absolute" alignSelf="center">
      <Text bold color={COLORS.primary}>{strings.mem_creation}</Text>
      <Text dimColor>TODO: Implement memory creation dialog.</Text>
    </Box>
  );
}
