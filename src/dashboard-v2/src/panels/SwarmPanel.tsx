/** @jsxImportSource @opentui/react */
import React from "react";
import { COLORS } from "../constants.js";

interface SwarmPanelProps {
  snapshot: any;
}

export function SwarmPanel(props: SwarmPanelProps): React.ReactNode {
  const swarm = props.snapshot?.swarm;
  const surfaceCorrelation = props.snapshot?.surfaces?.correlation;
  const surfaceFreshness = props.snapshot?.surfaces?.freshness?.swarm;

  if (!swarm) {
    return (
      <box flexDirection="column" flexGrow={1} padding={1}>
        <box marginBottom={1}>
          <text fg={COLORS.neonBlue}><strong>:: SWARM_SURFACE</strong></text>
        </box>
        <box paddingLeft={1}>
          <text fg={COLORS.neonAmber}>[fallback] swarm telemetry unavailable</text>
        </box>
      </box>
    );
  }

  const noSignals = swarm.signals.length === 0;
  const staleColor = surfaceFreshness?.isStale ? COLORS.neonAmber : COLORS.neonGreen;

  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      <box marginBottom={1}>
        <text fg={COLORS.neonBlue}><strong>:: SWARM_SURFACE</strong></text>
      </box>

      <box flexDirection="row" marginBottom={1} paddingLeft={1}>
        <text fg={COLORS.neonGreen}>ORCHESTRATIONS: {swarm.activeOrchestrations}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.neonBlue}>LANES: {swarm.activeLanes.length}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.neonAmber}>SESSIONS: {swarm.connectedSessions}</text>
        <text fg="gray"> | </text>
        <text fg={swarm.activeAgents > 0 ? COLORS.neonGreen : COLORS.neonAmber}>AGENTS: {swarm.activeAgents}</text>
      </box>

      <box flexDirection="row" marginBottom={1} paddingLeft={1}>
        <text fg={COLORS.neonBlue}>RUN_KEY: {String(surfaceCorrelation?.canonicalRunKey ?? "n/a")}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.dimText}>SRC: {String(surfaceCorrelation?.source ?? "fallback")}</text>
        <text fg="gray"> | </text>
        <text fg={staleColor}>FRESHNESS: {surfaceFreshness?.isStale ? "STALE" : "FRESH"}</text>
      </box>

      <box marginBottom={1}>
        <text fg={COLORS.neonBlue}><strong>:: ACTIVE_LANES</strong></text>
      </box>
      <box paddingLeft={1} marginBottom={1}>
        <text fg={swarm.activeLanes.length > 0 ? COLORS.text : COLORS.dimText}>
          {swarm.activeLanes.length > 0 ? swarm.activeLanes.join(", ") : "[none: no delegation lanes detected]"}
        </text>
      </box>

      <box marginBottom={1}>
        <text fg={COLORS.neonBlue}><strong>:: AGENT_TOPOLOGY</strong></text>
      </box>
      <box paddingLeft={1} marginBottom={1}>
        <text fg={swarm.topAgents.length > 0 ? COLORS.text : COLORS.dimText}>
          {swarm.topAgents.length > 0 ? swarm.topAgents.join(", ") : "[none: server agent inventory unavailable]"}
        </text>
      </box>

      <box>
        <text fg={COLORS.neonBlue}><strong>:: ORCHESTRATION_SIGNALS</strong></text>
      </box>
      {noSignals ? (
        <box paddingLeft={1} marginTop={1}>
          <text fg={COLORS.dimText}>[idle] no active swarm signal entries</text>
        </box>
      ) : (
        <box flexDirection="column" paddingLeft={1}>
          {swarm.signals.map((signal: any, index: number) => (
            <box key={`${signal.kind}-${index}`} marginTop={1}>
              <text fg={COLORS.neonGreen}>[{signal.kind.toUpperCase()}]</text>
              <text fg={COLORS.neonBlue}> {signal.label}</text>
              <text fg={COLORS.dimText}> :: {signal.detail}</text>
            </box>
          ))}
        </box>
      )}
    </box>
  );
}
