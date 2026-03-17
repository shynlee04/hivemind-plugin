export interface MultiTabPipelineProps {
    tabs: string[];
    activeTab: string;
    statuses: Record<string, string>;
    onTabSelect: (tab: string) => void;
}

export function MultiTabPipeline({ tabs, activeTab, statuses, onTabSelect }: MultiTabPipelineProps) {
    return (
        <box border padding={1} flexDirection="column" gap={1}>
            <text><strong>Pipeline Status</strong></text>
            <box flexDirection="row" gap={2}>
                {tabs.map(tab => {
                    const isActive = tab === activeTab;
                    const status = statuses[tab] || 'pending';
                    const statusColor = status === 'completed' ? 'green' : status === 'running' ? 'yellow' : 'gray';

                    return (
                        <box 
                            key={tab}
                            onMouseDown={() => onTabSelect(tab)}
                            paddingX={1}
                            border={isActive}
                            borderColor={isActive ? 'cyan' : undefined}
                        >
                            <text>
                                {tab} [<span fg={statusColor}>{status}</span>]
                            </text>
                        </box>
                    );
                })}
            </box>
        </box>
    );
}
