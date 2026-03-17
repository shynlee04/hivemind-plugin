import React from 'react';

export interface WikiNode {
    id: string;
    title: string;
    children?: WikiNode[];
}

export interface HierarchyWikiProps {
    rootNode: WikiNode;
    activeNodeId: string;
    onNodeSelect: (nodeId: string) => void;
}

export function HierarchyWiki({ rootNode, activeNodeId, onNodeSelect }: HierarchyWikiProps) {
    const renderNode = (node: WikiNode, depth: number) => {
        const isActive = node.id === activeNodeId;
        const indent = ' '.repeat(depth * 2);
        
        return (
            <box key={node.id} flexDirection="column">
                <box onMouseDown={() => onNodeSelect(node.id)}>
                    <text>
                        {indent}
                        {node.children && node.children.length > 0 ? (isActive ? '📂 ' : '📁 ') : '📄 '}
                        <span fg={isActive ? 'cyan' : undefined}>{node.title}</span>
                    </text>
                </box>
                {node.children && node.children.length > 0 && (
                    <box flexDirection="column">
                        {node.children.map(child => renderNode(child, depth + 1))}
                    </box>
                )}
            </box>
        );
    };

    return (
        <box border padding={1} flexDirection="column" gap={1}>
            <text><strong>Hierarchy Wiki</strong></text>
            <scrollbox height={15}>
                {renderNode(rootNode, 0)}
            </scrollbox>
        </box>
    );
}
