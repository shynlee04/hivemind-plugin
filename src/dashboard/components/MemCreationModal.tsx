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
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor={COLORS.neonAmber}
      paddingX={2}
      paddingY={1}
      position="absolute"
      alignSelf="center"
      width="50%"
      height="50%"
    >
      <Text bold color={COLORS.neonAmber}>{strings.mem_creation}</Text>
      <Box height={1} />
      <Text color={COLORS.dim}>TODO [US-048]: Implement form fields for Shelf, Content, Tags.</Text>
      <Text color={COLORS.dim}>Use input components for data entry.</Text>
    </Box>
  );
}
