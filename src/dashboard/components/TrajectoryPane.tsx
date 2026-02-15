import React from "react";
import { Box, Text } from "ink";
import { SessionView, HierarchyView } from "../types.js";
import { DashboardStrings } from "../i18n.js";
import { COLORS } from "../design-tokens.js";

interface TrajectoryPaneProps {
  session: SessionView;
  hierarchy: HierarchyView;
  strings: DashboardStrings;
}

export function TrajectoryPane({ session, hierarchy, strings }: TrajectoryPaneProps) {
  // Session lines
  const sessionLines = [
    `${strings.active}: ${session.id}`,
    `${strings.mode}: ${session.mode}`,
    `${strings.governance}: ${session.governanceMode} (${session.status})`,
    `${strings.automation}: ${session.automationLevel}`,
    session.coachProfile ? strings.coach_profile : "",
  ].filter(Boolean);

  // Hierarchy lines
  const hierarchyLines = [
    ...hierarchy.lines,
    `nodes=${hierarchy.totalNodes} depth=${hierarchy.depth} active=${hierarchy.activeNodes}`,
  ];

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={COLORS.primary} paddingX={1} flexGrow={1} marginRight={1}>
      <Text bold color={COLORS.primary}>{strings.session}</Text>
      {sessionLines.map((line, i) => (
        <Text key={i}>{line}</Text>
      ))}
      <Box height={1} />
      <Text bold color={COLORS.secondary}>{strings.hierarchy}</Text>
      {hierarchyLines.length > 0 ? (
        hierarchyLines.map((line, i) => (
          <Text key={`h-${i}`}>{line}</Text>
        ))
      ) : (
        <Text dimColor>{strings.no_hierarchy}</Text>
      )}
    </Box>
  );
}
