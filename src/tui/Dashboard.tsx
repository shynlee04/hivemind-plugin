import { useState, useEffect } from 'react';
import { ExecutionStatus } from './components/ExecutionStatus.js';
import { MultiTabPipeline } from './components/MultiTabPipeline.js';
import { MultiBranchPlanner } from './components/MultiBranchPlanner.js';
import { HierarchyWiki } from './components/HierarchyWiki.js';
import { SseConnectionHandler } from './sse.js';

const MOCK_WIKI = {
    id: 'root',
    title: 'HiveMind Core',
    children: [
        {
            id: 'agents',
            title: 'Agents',
            children: [
                { id: 'hivefiver', title: 'HiveFiver (Builder)' },
                { id: 'hiveq', title: 'HiveQ (QA)' }
            ]
        },
        {
            id: 'tui',
            title: 'TUI Layer'
        }
    ]
};

export function Dashboard() {
    const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
    const [events, setEvents] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('Planning');
    const [activeBranch, setActiveBranch] = useState('main');
    const [activeWikiNode, setActiveWikiNode] = useState('root');

    useEffect(() => {
        let isMounted = true;
        
        async function connectSse() {
            try {
                setStatus('connecting');
                const handler = new SseConnectionHandler('http://127.0.0.1:4096');
                const result = await handler.connect() as { events: AsyncIterable<any> };
                
                if (isMounted) setStatus('connected');
                
                for await (const event of result.events) {
                    if (!isMounted) break;
                    setEvents(prev => [...prev.slice(-9), event]); // Keep last 10 events
                }
            } catch (error) {
                if (isMounted) setStatus('disconnected');
            }
        }
        
        connectSse();
        
        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <box flexDirection="column" width="100%" height="100%" gap={1} padding={1}>
            <text>
                <ascii-font font="block" text="HiveMind OpenTUI" />
            </text>
            
            <MultiTabPipeline 
                tabs={['Planning', 'Execution', 'Wiki']}
                activeTab={activeTab}
                statuses={{ 'Planning': 'completed', 'Execution': 'running', 'Wiki': 'pending' }}
                onTabSelect={setActiveTab}
            />

            <box flexDirection="row" gap={2} flexGrow={1}>
                {/* Left Sidebar */}
                <box width="30%" flexDirection="column" gap={1}>
                    {activeTab === 'Planning' && (
                        <MultiBranchPlanner 
                            branches={['main', 'feat/opentui', 'fix/sse-events']}
                            activeBranch={activeBranch}
                            onBranchSelect={setActiveBranch}
                        />
                    )}
                    {activeTab === 'Wiki' && (
                        <HierarchyWiki 
                            rootNode={MOCK_WIKI}
                            activeNodeId={activeWikiNode}
                            onNodeSelect={setActiveWikiNode}
                        />
                    )}
                </box>

                {/* Main Content Area */}
                <box width="70%" flexDirection="column">
                    <ExecutionStatus 
                        status={status}
                        events={events}
                        onSteeringMessage={(msg) => console.log('Steering:', msg)}
                    />
                </box>
            </box>
        </box>
    );
}
