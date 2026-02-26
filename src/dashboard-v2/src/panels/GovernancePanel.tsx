/** @jsxImportSource @opentui/react */
import React from "react";
import { COLORS } from "../constants.js";

interface GovernancePanelProps {
  snapshot: any;
}

export function GovernancePanel(props: GovernancePanelProps): React.ReactNode {
  const { snapshot } = props;
  const gov = snapshot.governance;

  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      {/* Health Checks */}
      <box marginBottom={1}>
        <text fg={COLORS.neonBlue}><strong>:: GOVERNANCE_CHECKS</strong></text>
      </box>

      {gov.checks.map((check: any, i: number) => (
        <box key={i} paddingLeft={1}>
          <text fg={check.status === "pass" ? COLORS.neonGreen : check.status === "warn" ? COLORS.neonAmber : COLORS.error}>
            [{check.status.toUpperCase()}]
          </text>
          <text fg={COLORS.dimText}> {check.key}</text>
          <text fg={COLORS.text}>: {check.detail}</text>
        </box>
      ))}

      {/* Anchors */}
      <box marginTop={1}>
        <text fg={COLORS.neonBlue}><strong>:: ANCHORS</strong></text>
      </box>
      {gov.anchors.length === 0 ? (
        <text paddingLeft={1} fg={COLORS.dimText}>[none]</text>
      ) : (
        gov.anchors.slice(0, 3).map((anchor: any, i: number) => (
          <box key={i} paddingLeft={1}>
            <text fg={COLORS.neonAmber}>{anchor.key}</text>
            <text fg={COLORS.dimText}>: {anchor.value.slice(0, 60)}...</text>
          </box>
        ))
      )}

      {/* Memory Shelves */}
      <box marginTop={1}>
        <text fg={COLORS.neonBlue}><strong>:: MEMORY_SHELVES</strong></text>
      </box>
      <box flexDirection="row" paddingLeft={1} flexWrap="wrap">
        {gov.memsByShelf.slice(0, 6).map((shelf: any, i: number) => (
          <box key={i} marginRight={2}>
            <text fg={COLORS.text}>{shelf.shelf}</text>
            <text fg={COLORS.dimText}>:</text>
            <text fg={COLORS.neonGreen}>{shelf.count}</text>
          </box>
        ))}
      </box>
    </box>
  );
}
