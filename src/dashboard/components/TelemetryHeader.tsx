import React from "react";
import { Box, Text } from "ink";
import { MetricsView, TraceView } from "../types.js";
import { DashboardStrings } from "../i18n.js";
import { COLORS } from "../design-tokens.js";

interface TelemetryHeaderProps {
  metrics: MetricsView;
  trace: TraceView;
  strings: DashboardStrings;
}

export function TelemetryHeader({ metrics, trace, strings }: TelemetryHeaderProps) {
  const lines = [
    `turns=${metrics.turnCount} drift=${metrics.driftScore}/100`,
    `files=${metrics.filesTouched} updates=${metrics.contextUpdates}`,
    `violations=${metrics.violations} health=${metrics.healthScore}%`,
    `write_without_read=${metrics.writeWithoutReadCount}`,
  ];

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={COLORS.warning} paddingX={1} marginBottom={1}>
      <Text bold color={COLORS.warning}>{strings.metrics}</Text>
      {lines.map((line, i) => (
        <Text key={i}>{line}</Text>
      ))}
      <Text dimColor>---</Text>
      <Text color="magenta">Trace: {trace.gitHash}</Text>
      <Text dimColor>{trace.nowIso}</Text>
    </Box>
  );
}
