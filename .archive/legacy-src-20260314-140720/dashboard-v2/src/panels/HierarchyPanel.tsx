/** @jsxImportSource @opentui/react */
import React from "react";
import { COLORS } from "../constants.js";

interface HierarchyPanelProps {
  snapshot: any;
}

export function HierarchyPanel(props: HierarchyPanelProps): React.ReactNode {
  const { snapshot } = props;
  const hi = snapshot.hierarchy;

  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      {/* Tree Stats */}
      <box marginBottom={1}>
        <text fg={COLORS.neonBlue}><strong>:: COGNITIVE_GRAPH</strong></text>
      </box>

      <box flexDirection="row" paddingLeft={1} marginBottom={1}>
        <text fg={COLORS.dimText}>NODES: </text>
        <text fg={COLORS.text}>{hi.totalNodes}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.dimText}>DEPTH: </text>
        <text fg={COLORS.text}>{hi.depth}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.dimText}>ACTIVE: </text>
        <text fg={COLORS.neonGreen}>{hi.activeNodes}</text>
      </box>

      {/* Tree Render */}
      <box flexGrow={1} border borderStyle="single" borderColor={COLORS.border} padding={1}>
        {hi.lines.slice(0, 15).map((line: string, i: number) => (
          <text key={i} fg={line.includes("[>>]") ? COLORS.neonGreen : line.includes("[OK]") ? COLORS.dimText : COLORS.text}>
            {line}
          </text>
        ))}
      </box>
    </box>
  );
}
