import React from "react";
import { Box, Text } from "ink";
import { DashboardStrings } from "../i18n.js";
import { COLORS } from "../design-tokens.js";

interface InteractiveFooterProps {
  strings: DashboardStrings;
}

export function InteractiveFooter({ strings }: InteractiveFooterProps) {
  return (
    <Box flexDirection="row" borderStyle="single" borderColor={COLORS.dim} paddingX={1} marginTop={1} justifyContent="space-between">
      <Text color={COLORS.dim}>{strings.controls}</Text>
      <Text color={COLORS.dim}>v3.0.0-beta</Text>
    </Box>
  );
}
