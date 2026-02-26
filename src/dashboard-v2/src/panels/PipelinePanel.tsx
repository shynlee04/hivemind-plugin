/** @jsxImportSource @opentui/react */
import React from "react";
import { COLORS } from "../constants.js";

interface PipelinePanelProps {
  snapshot: any;
}

export function PipelinePanel(props: PipelinePanelProps): React.ReactNode {
  const { snapshot } = props;
  const pl = snapshot.pipeline;

  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      {/* Task Stats Bar */}
      <box marginBottom={1}>
        <text fg={COLORS.neonAmber}><strong>:: TASK_DISTRIBUTION</strong></text>
      </box>

      {/* Progress visualization */}
      <box flexDirection="row" marginBottom={1} paddingLeft={1}>
        <text fg={COLORS.neonGreen}>ACTIVE: {pl.inProgress}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.neonAmber}>PENDING: {pl.pending}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.error}>BLOCKED: {pl.blocked}</text>
        <text fg="gray"> | </text>
        <text fg={COLORS.dimText}>DONE: {pl.complete}</text>
      </box>

      {/* Delegation Lanes */}
      <box marginBottom={1}>
        <text fg={COLORS.neonBlue}><strong>:: DELEGATION_LANES</strong></text>
      </box>
      <box paddingLeft={1} marginBottom={1}>
        <text fg={COLORS.text}>
          {pl.delegationLanes.length > 0 ? pl.delegationLanes.join(", ") : "none"}
        </text>
      </box>

      {/* Active Tasks */}
      <box>
        <text fg={COLORS.neonBlue}><strong>:: ACTIVE_TRAJECTORY_TASKS</strong></text>
      </box>
      {pl.activeTasks.length === 0 ? (
        <box paddingLeft={1}>
          <text fg={COLORS.dimText}>[no active_task_ids in trajectory.json]</text>
        </box>
      ) : (
        <box flexDirection="column" paddingLeft={1}>
          {pl.activeTasks.map((task: any, i: number) => (
            <box key={i} marginTop={1}>
              <text fg={task.status === "in_progress" ? COLORS.neonGreen : COLORS.dimText}>
                ▶ {task.status}
              </text>
              <text fg={COLORS.text}> | {task.title}</text>
            </box>
          ))}
        </box>
      )}
    </box>
  );
}
