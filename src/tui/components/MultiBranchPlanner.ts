export class MultiBranchPlanner {
    public branches: string[];
    public activeBranch: string;

    constructor(branches: string[]) {
        if (branches.length === 0) {
            throw new Error('At least one branch must be provided');
        }
        this.branches = branches;
        this.activeBranch = branches[0];
    }

    public switchBranch(branch: string): void {
        if (this.branches.includes(branch)) {
            this.activeBranch = branch;
        }
    }
}
