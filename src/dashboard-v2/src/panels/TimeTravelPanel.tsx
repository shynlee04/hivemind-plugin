/** @jsxImportSource @opentui/react */
import React from "react";
import { COLORS } from "../constants.js";

interface TimeTravelPanelProps {
  snapshot: any;
}

type TimelineEntry = {
  eventId: string;
  sessionId: string;
  actionId: string;
  eventType: string;
  status: string;
  timestamp: string;
};

export function TimeTravelPanel(props: TimeTravelPanelProps): React.ReactNode {
  const timeTravel = props.snapshot?.timetravel;
  const surfaceCorrelation = props.snapshot?.surfaces?.correlation;
  const surfaceFreshness = props.snapshot?.surfaces?.freshness?.timetravel;

  if (!timeTravel) {
    return (
      <box flexDirection="column" flexGrow={1} padding={1}>
        <box marginBottom={1}>
          <text fg={COLORS.neonBlue}><strong>:: TIME_TRAVEL_SURFACE</strong></text>
        </box>
        <box paddingLeft={1}>
          <text fg={COLORS.neonAmber}>[fallback] time-travel channels unavailable</text>
        </box>
      </box>
    );
  }

  const timeline = Array.isArray(timeTravel.timeline) ? timeTravel.timeline as TimelineEntry[] : [];
  const snapshotState = timeTravel.snapshot?.state ?? "missing";
  const compareState = timeTravel.compare?.state ?? "degraded";
  const warnings = Array.isArray(timeTravel.warnings) ? timeTravel.warnings as string[] : [];
  const staleColor = surfaceFreshness?.isStale ? COLORS.neonAmber : COLORS.neonGreen;

  const snapshotColor =
    snapshotState === "available"
      ? COLORS.neonGreen
      : snapshotState === "metadata_only"
        ? COLORS.neonAmber
        : COLORS.error;
  const compareColor =
    compareState === "ready"
      ? COLORS.neonGreen
      : compareState === "degraded"
        ? COLORS.neonAmber
        : COLORS.error;

  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      <box marginBottom={1}>
        <text fg={COLORS.neonBlue}><strong>:: TIME_TRAVEL_SURFACE</strong></text>
      </box>

      <box marginBottom={1}>
        <text fg={COLORS.neonBlue}><strong>:: TIMELINE</strong></text>
      </box>
      <box paddingLeft={1} marginBottom={1}>
        <text fg={COLORS.neonBlue}>RUN_KEY: {String(surfaceCorrelation?.canonicalRunKey ?? "n/a")}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.dimText}>SRC: {String(surfaceCorrelation?.source ?? "fallback")}</text>
        <text fg="gray"> | </text>
        <text fg={staleColor}>FRESHNESS: {surfaceFreshness?.isStale ? "STALE" : "FRESH"}</text>
      </box>
      {timeTravel.timelineState === "loading" ? (
        <box paddingLeft={1} marginBottom={1}>
          <text fg={COLORS.neonBlue}>[loading] building timeline window...</text>
        </box>
      ) : timeline.length === 0 ? (
        <box paddingLeft={1} marginBottom={1}>
          <text fg={COLORS.neonAmber}>[degraded] timeline source unavailable</text>
        </box>
      ) : (
        <box flexDirection="column" paddingLeft={1} marginBottom={1}>
          {timeline.slice(0, 5).map((entry, index) => (
            <box key={`${entry.eventId}-${index}`} marginTop={1}>
              <text fg={COLORS.neonGreen}>[{entry.status.toUpperCase()}]</text>
              <text fg={COLORS.neonBlue}> {entry.eventType}</text>
              <text fg={COLORS.dimText}> :: {entry.actionId} :: {entry.timestamp}</text>
            </box>
          ))}
        </box>
      )}

      <box marginBottom={1}>
        <text fg={COLORS.neonBlue}><strong>:: SNAPSHOT</strong></text>
      </box>
      <box paddingLeft={1} marginBottom={1}>
        <text fg={snapshotColor}>STATE: {String(snapshotState).toUpperCase()}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.text}>SESSION: {String(timeTravel.snapshot?.sessionId ?? "n/a")}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.dimText}>ID: {String(timeTravel.snapshot?.snapshotId ?? "n/a")}</text>
      </box>
      <box paddingLeft={1} marginBottom={1}>
        <text fg={COLORS.dimText}>{String(timeTravel.snapshot?.note ?? "snapshot metadata unavailable")}</text>
      </box>

      <box marginBottom={1}>
        <text fg={COLORS.neonBlue}><strong>:: COMPARE</strong></text>
      </box>
      <box paddingLeft={1}>
        <text fg={compareColor}>STATE: {String(compareState).toUpperCase()}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.text}>MODE: {String(timeTravel.compare?.mode ?? "none")}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.dimText}>CHANGES: {Number(timeTravel.compare?.changeCount ?? 0)}</text>
      </box>
      <box paddingLeft={1}>
        <text fg={COLORS.dimText}>{String(timeTravel.compare?.note ?? "diff summary unavailable")}</text>
      </box>

      {warnings.length > 0 && (
        <>
          <box marginTop={1}>
            <text fg={COLORS.neonBlue}><strong>:: DEGRADED_SIGNALS</strong></text>
          </box>
          <box flexDirection="column" paddingLeft={1}>
            {warnings.slice(0, 3).map((warning, index) => (
              <box key={`warning-${index}`} marginTop={1}>
                <text fg={COLORS.neonAmber}>[warn]</text>
                <text fg={COLORS.dimText}> {warning}</text>
              </box>
            ))}
          </box>
        </>
      )}
    </box>
  );
}
