/** @jsxImportSource @opentui/react */
import React from "react";
import { COLORS } from "../constants.js";

interface OverviewPanelProps {
  snapshot: any;
  serverData: any;
  lastAction: string | null;
}

export function OverviewPanel(props: OverviewPanelProps): React.ReactNode {
  const { snapshot, serverData, lastAction } = props;
  const ov = snapshot.overview;

  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      {/* Session Info */}
      <box marginBottom={1}>
        <text fg={COLORS.neonBlue}><strong>:: SESSION_ID</strong></text>
      </box>
      <box marginBottom={1} paddingLeft={1}>
        <text fg={COLORS.neonGreen}>{ov.sessionId}</text>
      </box>

      {/* OpenCode Server Status */}
      <box marginBottom={1}>
        <text fg={COLORS.neonAmber}><strong>:: SERVER_STATUS</strong></text>
      </box>
      <box flexDirection="row" marginBottom={1} paddingLeft={1}>
        <text fg={COLORS.dimText}>CONNECTION: </text>
        <text fg={serverData?.connected ? COLORS.neonGreen : COLORS.error}>
          {serverData?.connected ? "ONLINE" : "OFFLINE"}
        </text>
        {serverData?.version && (
          <>
            <text fg="gray"> | </text>
            <text fg={COLORS.dimText}>VERSION: </text>
            <text fg={COLORS.text}>{serverData.version}</text>
          </>
        )}
      </box>
      {serverData?.sessions?.length > 0 && (
        <box paddingLeft={1} marginBottom={1}>
          <text fg={COLORS.dimText}>SESSIONS: </text>
          <text fg={COLORS.text}>{serverData.sessions.length}</text>
        </box>
      )}
      {serverData?.agents?.length > 0 && (
        <box paddingLeft={1} marginBottom={1}>
          <text fg={COLORS.dimText}>AGENTS: </text>
          <text fg={COLORS.text}>{serverData.agents.map((a: any) => a.name).join(", ")}</text>
        </box>
      )}

      {/* Last Action Feedback */}
      {lastAction && (
        <box marginBottom={1}>
          <text fg={COLORS.neonBlue}><strong>:: LAST_ACTION</strong></text>
        </box>
      )}
      {lastAction && (
        <box paddingLeft={1} marginBottom={1}>
          <text fg={COLORS.text}>{lastAction}</text>
        </box>
      )}

      {/* Stats Grid */}
      <box flexDirection="row" marginTop={1}>
        <box width={18} marginRight={2}>
          <text fg={COLORS.dimText}><strong>MODE</strong></text>
          <text fg={COLORS.text}>  {ov.mode}</text>
        </box>
        <box width={18}>
          <text fg={COLORS.dimText}><strong>GOVERNANCE</strong></text>
          <text fg={ov.governanceStatus === "OPEN" ? COLORS.neonGreen : COLORS.neonAmber}>  {ov.governanceStatus}</text>
        </box>
      </box>

      <box flexDirection="row" marginTop={1}>
        <box width={18} marginRight={2}>
          <text fg={COLORS.dimText}><strong>DRIFT</strong></text>
          <text fg={ov.driftScore >= 50 ? COLORS.neonGreen : COLORS.neonAmber}>  {ov.driftScore}/100</text>
        </box>
        <box width={18}>
          <text fg={COLORS.dimText}><strong>TURNS</strong></text>
          <text fg={COLORS.text}>  {ov.turnCount}</text>
        </box>
      </box>

      <box marginTop={1}>
        <text fg={COLORS.dimText}><strong>FILES_TOUCHED</strong></text>
        <text fg={COLORS.text}>  {ov.filesTouched}</text>
      </box>

      <box marginTop={1}>
        <text fg={COLORS.dimText}><strong>UPDATED</strong></text>
        <text fg={COLORS.text}>  {ov.updatedAt}</text>
      </box>
    </box>
  );
}
