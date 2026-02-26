/** @jsxImportSource @opentui/react */
import React from "react";
import { COLORS } from "../constants.js";

interface ToolRegistryPanelProps {
  snapshot: any;
}

function formatList(items: string[], emptyMessage: string): string {
  return items.length > 0 ? items.join(", ") : emptyMessage;
}

export function ToolRegistryPanel(props: ToolRegistryPanelProps): React.ReactNode {
  const registry = props.snapshot?.toolRegistry;
  const surfaceCorrelation = props.snapshot?.surfaces?.correlation;
  const surfaceFreshness = props.snapshot?.surfaces?.freshness?.toolRegistry;

  if (!registry) {
    return (
      <box flexDirection="column" flexGrow={1} padding={1}>
        <box marginBottom={1}>
          <text fg={COLORS.neonBlue}><strong>:: TOOL_REGISTRY</strong></text>
        </box>
        <box paddingLeft={1}>
          <text fg={COLORS.neonAmber}>[fallback] tool registry snapshot unavailable</text>
        </box>
      </box>
    );
  }

  const catalogTools = Array.isArray(registry.catalog?.tools) ? registry.catalog.tools as string[] : [];
  const schemaFiles = Array.isArray(registry.schema?.schemas) ? registry.schema.schemas as string[] : [];
  const staleColor = surfaceFreshness?.isStale ? COLORS.neonAmber : COLORS.neonGreen;

  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      <box marginBottom={1}>
        <text fg={COLORS.neonBlue}><strong>:: TOOL_REGISTRY_SURFACE</strong></text>
      </box>

      <box marginBottom={1}>
        <text fg={COLORS.neonBlue}><strong>:: CATALOG</strong></text>
      </box>
      <box paddingLeft={1} marginBottom={1}>
        <text fg={COLORS.neonGreen}>TOOLS: {Number(registry.catalog?.totalTools ?? 0)}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.dimText}>SOURCE: {String(registry.catalog?.source ?? "unknown")}</text>
      </box>
      <box paddingLeft={1} marginBottom={1}>
        <text fg={catalogTools.length > 0 ? COLORS.text : COLORS.dimText}>
          {formatList(catalogTools.slice(0, 8), "[none: tool catalog files not discovered]")}
        </text>
      </box>

      <box marginBottom={1}>
        <text fg={COLORS.neonBlue}><strong>:: SCHEMA</strong></text>
      </box>
      <box paddingLeft={1} marginBottom={1}>
        <text fg={COLORS.neonGreen}>SCHEMAS: {Number(registry.schema?.totalSchemas ?? 0)}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.neonBlue}>CHECKS: {Number(registry.schema?.governanceCheckCount ?? 0)}</text>
        <text fg="gray"> | </text>
        <text fg={(Number(registry.schema?.pendingChanges ?? 0) === 0) ? COLORS.neonGreen : COLORS.neonAmber}>
          PENDING: {Number(registry.schema?.pendingChanges ?? 0)}
        </text>
      </box>
      <box paddingLeft={1} marginBottom={1}>
        <text fg={schemaFiles.length > 0 ? COLORS.text : COLORS.dimText}>
          {formatList(schemaFiles.slice(0, 8), "[none: schema files not discovered]")}
        </text>
      </box>

      <box marginBottom={1}>
        <text fg={COLORS.neonBlue}><strong>:: ACTIVITY</strong></text>
      </box>
      <box paddingLeft={1}>
        <text fg={COLORS.neonGreen}>ACTIVE_TASKS: {Number(registry.activity?.activeTasks ?? 0)}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.neonAmber}>IN_PROGRESS: {Number(registry.activity?.inProgressTasks ?? 0)}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.neonBlue}>LANES: {Number(registry.activity?.activeLanes ?? 0)}</text>
      </box>
      <box paddingLeft={1}>
        <text fg={COLORS.text}>AGENTS: {Number(registry.activity?.activeAgents ?? 0)}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.text}>SESSIONS: {Number(registry.activity?.sessions ?? 0)}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.dimText}>RECENT_MSG: {Number(registry.activity?.recentMessages ?? 0)}</text>
      </box>

      <box marginTop={1} paddingLeft={1}>
        <text fg={COLORS.neonBlue}>RUN_KEY: {String(surfaceCorrelation?.canonicalRunKey ?? "n/a")}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.dimText}>SRC: {String(surfaceCorrelation?.source ?? "fallback")}</text>
      </box>
      <box paddingLeft={1}>
        <text fg={staleColor}>FRESHNESS: {surfaceFreshness?.isStale ? "STALE" : "FRESH"}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.dimText}>AGE_MS: {Number(surfaceFreshness?.ageMs ?? 0)}</text>
      </box>
    </box>
  );
}
