import React from "react";
import { Box, Text } from "ink";
import { DashboardStrings } from "../i18n.js";
import { COLORS } from "../design-tokens.js";

interface InteractiveFooterProps {
  strings: DashboardStrings;
}

export function InteractiveFooter({ strings }: InteractiveFooterProps) {
  return (
    <Box flexDirection="row" borderStyle="round" borderColor={COLORS.dim} paddingX={1} marginTop={1}>
      <Text dimColor>{strings.controls}</Text>
    </Box>
  );
}
