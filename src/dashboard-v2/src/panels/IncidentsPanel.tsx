/** @jsxImportSource @opentui/react */
import React from "react";
import { COLORS } from "../constants.js";

interface IncidentsPanelProps {
  snapshot: any;
}

export function IncidentsPanel(props: IncidentsPanelProps): React.ReactNode {
  const { snapshot } = props;
  const inc = snapshot.incidents;
  const levelColor = inc.level === "critical" ? COLORS.error : inc.level === "warn" ? COLORS.neonAmber : COLORS.neonGreen;

  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      <box marginBottom={1}>
        <text fg={COLORS.neonBlue}><strong>:: INCIDENT_LEVEL</strong></text>
      </box>

      <box paddingLeft={1} marginBottom={1}>
        <text fg={levelColor}><strong>{inc.level.toUpperCase()}</strong></text>
      </box>

      <box>
        <text fg={COLORS.neonBlue}><strong>:: SIGNALS</strong></text>
      </box>

      {inc.items.map((item: string, i: number) => (
        <box key={i} paddingLeft={1} marginTop={1}>
          <text fg={item.includes("pressure") ? COLORS.neonAmber : COLORS.dimText}>
            • {item}
          </text>
        </box>
      ))}
    </box>
  );
}
