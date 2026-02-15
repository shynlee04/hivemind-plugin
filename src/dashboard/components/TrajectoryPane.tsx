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

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={COLORS.neonGreen} paddingX={1} flexGrow={1} marginRight={1}>
      <Text bold color={COLORS.neonGreen}>{strings.hierarchy}</Text>

      {/* Session Summary at Top of Pane */}
      <Box flexDirection="column" marginBottom={1} borderStyle="single" borderColor={COLORS.dim}>
         {sessionLines.map((line, i) => (
           <Text key={i} color={COLORS.neutral}>{line}</Text>
         ))}
      </Box>

      {/* Tree View */}
      <Box flexDirection="column" flexGrow={1}>
        {hierarchy.lines.length > 0 ? (
          hierarchy.lines.map((line, i) => {
            // Simple heuristic coloring for tree nodes
            let color: string = COLORS.neutral;
            if (line.includes(">>")) color = COLORS.neonBlue; // Active focus
            if (line.includes("[x]")) color = COLORS.dim; // Completed
            if (line.includes("!!")) color = COLORS.neonRed; // Blocked

            return <Text key={`h-${i}`} color={color}>{line}</Text>;
          })
        ) : (
          <Text dimColor>{strings.no_hierarchy}</Text>
        )}
      </Box>

      {/* Footer Stats */}
      <Box marginTop={1} borderStyle="single" borderColor={COLORS.dim} paddingX={1}>
         <Text color={COLORS.dim}>
            Nodes: {hierarchy.totalNodes} | Depth: {hierarchy.depth} | Active: {hierarchy.activeNodes}
         </Text>
      </Box>
    </Box>
  );
}
