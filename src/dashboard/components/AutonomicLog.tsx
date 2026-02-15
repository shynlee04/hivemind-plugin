import React from "react";
import { Box, Text } from "ink";
import { AlertView } from "../types.js";
import { DashboardStrings } from "../i18n.js";
import { COLORS } from "../design-tokens.js";

interface AutonomicLogProps {
  alerts: AlertView[];
  strings: DashboardStrings;
}

export function AutonomicLog({ alerts, strings }: AutonomicLogProps) {
  const tierColor = (tier: AlertView["tier"]) => {
    switch (tier) {
      case "INFO": return "green";
      case "WARN": return "yellow";
      case "CRITICAL": return "red";
      case "DEGRADED": return "magenta";
      default: return "magenta";
    }
  };

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={COLORS.error} paddingX={1} marginBottom={1}>
      <Text bold color={COLORS.error}>{strings.alerts}</Text>
      {alerts.length > 0 ? (
        alerts.map((alert, i) => (
          <Box flexDirection="column" key={i} marginBottom={1}>
            <Text color={tierColor(alert.tier)}>[{alert.tier}] {alert.message}</Text>
            <Text dimColor>  evidence: {alert.evidence}</Text>
            {alert.suggestion && <Text dimColor>  suggestion: {alert.suggestion}</Text>}
          </Box>
        ))
      ) : (
        <Text dimColor>No active escalations.</Text>
      )}
    </Box>
  );
}
