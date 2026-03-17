import { useEffect, useState } from 'react'

import {
  loadRuntimeStatus,
  type LoadRuntimeStatusInput,
} from '../adapters/runtime-client.js'
import type { RuntimeStatus } from '../../../../src/shared/contracts/runtime-status.js'

export interface RuntimeStatusViewProps extends LoadRuntimeStatusInput {
  initialStatus?: RuntimeStatus
}

export function renderRuntimeStatusLines(status: RuntimeStatus): string[] {
  const workflowSummary = status.workflowSummary
    ? `${status.workflowSummary.workflowId} (${status.workflowSummary.gateState}) tasks=${status.workflowSummary.currentTaskIds.join(',') || 'none'}`
    : 'none'
  const recentEvents = status.recentEvents.length > 0
    ? status.recentEvents.map((event) => `${event.recordedAt} ${event.source}/${event.eventKind}: ${event.summary}`)
    : ['none']

  return [
    'HiveMind Runtime Status',
    `runtimeAuthority: ${status.runtimeAuthority}`,
    `serverBaseUrl: ${status.serverBaseUrl ?? 'not attached'}`,
    `entryState: ${status.entryState.state}`,
    `qaState: ${status.qaState.state}`,
    `workflowSummary: ${workflowSummary}`,
    'recentEvents:',
    ...recentEvents,
  ]
}

export function RuntimeStatusView(props: RuntimeStatusViewProps) {
  const [status, setStatus] = useState<RuntimeStatus | null>(props.initialStatus ?? null)
  const [loading, setLoading] = useState(props.initialStatus === undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (props.initialStatus) {
      return
    }

    let cancelled = false

    void loadRuntimeStatus(props)
      .then((nextStatus) => {
        if (cancelled) {
          return
        }

        setStatus(nextStatus)
        setLoading(false)
      })
      .catch((cause) => {
        if (cancelled) {
          return
        }

        const message = cause instanceof Error ? cause.message : 'Unknown runtime status error'
        setError(message)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [props])

  if (loading) {
    return <text>Loading runtime status...</text>
  }

  if (error) {
    return <text>Runtime status failed: {error}</text>
  }

  if (!status) {
    return <text>No runtime status available.</text>
  }

  return (
    <text>{renderRuntimeStatusLines(status).join('\n')}</text>
  )
}
