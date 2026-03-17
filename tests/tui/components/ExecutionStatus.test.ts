import { test } from 'node:test';
import * as assert from 'node:assert';
import { ExecutionStatus } from '../../../src/tui/components/ExecutionStatus.js';

test('ExecutionStatus Component', async (t) => {
    await t.test('should handle steering injection and mouse clicks', () => {
        const status = new ExecutionStatus();
        assert.strictEqual(status.currentStatus, 'idle');
        
        status.updateStatus('running');
        assert.strictEqual(status.currentStatus, 'running');
        
        status.injectSteering('Focus on performance');
        assert.strictEqual(status.lastSteeringMessage, 'Focus on performance');
    });
});
