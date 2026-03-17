import { test } from 'node:test';
import * as assert from 'node:assert';
import { MultiBranchPlanner } from '../../../src/tui/components/MultiBranchPlanner.js';

test('MultiBranchPlanner Component', async (t) => {
    await t.test('should manage multiple branches and active branch state', () => {
        const planner = new MultiBranchPlanner(['branch-a', 'branch-b']);
        assert.strictEqual(planner.activeBranch, 'branch-a');
        planner.switchBranch('branch-b');
        assert.strictEqual(planner.activeBranch, 'branch-b');
    });
});
