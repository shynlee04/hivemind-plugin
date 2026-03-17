export interface ExecutionStatusProps {
    status: 'disconnected' | 'connecting' | 'connected';
    events: any[];
    onSteeringMessage?: (message: string) => void;
}

export function ExecutionStatus({ status, events, onSteeringMessage }: ExecutionStatusProps) {
    const statusColor = status === 'connected' ? 'green' : status === 'connecting' ? 'yellow' : 'red';
    
    return (
        <box border padding={1} flexDirection="column" gap={1} onMouseDown={() => onSteeringMessage?.('Clicked Execution Status')}>
            <box>
                <text>
                    <strong>Execution Status: </strong>
                    <span fg={statusColor}>{status.toUpperCase()}</span>
                </text>
            </box>
            <box flexDirection="column" height={10}>
                <scrollbox>
                    {events.length === 0 ? (
                        <text fg="gray">Waiting for events...</text>
                    ) : (
                        events.map((event, i) => (
                            <text key={i}>
                                <span fg="gray">[{new Date().toLocaleTimeString()}]</span> {JSON.stringify(event.data)}
                            </text>
                        ))
                    )}
                </scrollbox>
            </box>
        </box>
    );
}
