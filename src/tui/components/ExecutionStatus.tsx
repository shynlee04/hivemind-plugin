import React from 'react';
import type { EventSubscribeResponses } from '@opencode-ai/sdk/dist/gen/core/serverSentEvents.gen.js';

export interface ExecutionStatusProps {
    status: 'disconnected' | 'connecting' | 'connected';
    events: EventSubscribeResponses[];
    onSteeringMessage?: (message: string) => void;
}

export function ExecutionStatus({ status, events, onSteeringMessage }: ExecutionStatusProps) {
    const statusColor = status === 'connected' ? 'green' : status === 'connecting' ? 'yellow' : 'red';
    
    return (
        <box border padding={1} flexDirection="column" gap={1}>
            <box>
                <text>
                    <strong>Execution Status: </strong>
                    <span fg={statusColor}>{status.toUpperCase()}</span>
                </text>
            </box>
            <box flexDirection="column" height={10}>
                <scrollbox>
                    {events.length === 0 ? (
                        <text dim>Waiting for events...</text>
                    ) : (
                        events.map((event, i) => (
                            <text key={i}>
                                <span dim>[{new Date().toLocaleTimeString()}]</span> {JSON.stringify(event.data)}
                            </text>
                        ))
                    )}
                </scrollbox>
            </box>
        </box>
    );
}
