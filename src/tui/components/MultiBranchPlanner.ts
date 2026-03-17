export class MultiBranchPlanner {
    branches: string[];
    activeBranch: string;

    constructor(branches: string[]) {
        if (branches.length === 0) {
            throw new Error('At least one branch must be provided');
        }
        this.branches = branches;
        this.activeBranch = branches[0];
    }

    switchBranch(branch: string): void {
        if (this.branches.includes(branch)) {
            this.activeBranch = branch;
        }
    }
}
