export interface MultiBranchPlannerProps {
    branches: string[];
    activeBranch: string;
    onBranchSelect: (branch: string) => void;
}

export function MultiBranchPlanner({ branches, activeBranch, onBranchSelect }: MultiBranchPlannerProps) {
    return (
        <box border padding={1} flexDirection="column" gap={1}>
            <text><strong>Multi-Branch Planner</strong></text>
            <box flexDirection="column">
                {branches.map(branch => (
                    <box 
                        key={branch} 
                        paddingLeft={2}
                        onMouseDown={() => onBranchSelect(branch)}
                    >
                        <text>
                            {branch === activeBranch ? <span fg="green">➜ </span> : <span fg="gray">  </span>}
                            {branch}
                        </text>
                    </box>
                ))}
            </box>
        </box>
    );
}
