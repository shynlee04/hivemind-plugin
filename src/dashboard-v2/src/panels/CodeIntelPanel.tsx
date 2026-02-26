/** @jsxImportSource @opentui/react */
import React from "react";
import { COLORS } from "../constants.js";

interface CodeIntelPanelProps {
  snapshot: any;
}

export function CodeIntelPanel(props: CodeIntelPanelProps): React.ReactNode {
  const { snapshot } = props;
  const ci = snapshot.codeIntel;

  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      <box marginBottom={1}>
        <text fg={COLORS.neonBlue}><strong>:: CODE_INTEL_ENGINE</strong></text>
      </box>

      {/* Source Info */}
      <box flexDirection="row" marginBottom={1}>
        <text fg={COLORS.dimText}>SOURCE: </text>
        <text fg={COLORS.neonGreen}>{ci.source}</text>
      </box>

      <box flexDirection="row" marginBottom={1}>
        <text fg={COLORS.dimText}>ENTITIES: </text>
        <text fg={COLORS.text}>{ci.indexedEntities}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.dimText}>FILES: </text>
        <text fg={COLORS.text}>{ci.fileCount}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.dimText}>TOKENS: </text>
        <text fg={COLORS.text}>{ci.totalTokens}</text>
      </box>

      <box>
        <text fg={COLORS.dimText}>COMPRESSION: </text>
        <text fg={COLORS.neonAmber}>{ci.compressionRatio}%</text>
      </box>

      {/* Modules */}
      <box marginTop={1}>
        <text fg={COLORS.neonBlue}><strong>:: DISCOVERED_MODULES</strong></text>
      </box>
      <box flexGrow={1} border borderStyle="single" borderColor={COLORS.border} padding={1}>
        {ci.codeIntelModules.slice(0, 8).map((mod: string, i: number) => (
          <text key={i} fg={COLORS.text}>  {mod}</text>
        ))}
      </box>
    </box>
  );
}
