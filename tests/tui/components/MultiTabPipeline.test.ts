import { test } from 'node:test';
import * as assert from 'node:assert';
import { MultiTabPipeline } from '../../../src/tui/components/MultiTabPipeline.js';

test('MultiTabPipeline Component', async (t) => {
    await t.test('should handle tab switching and status updates', () => {
        const pipeline = new MultiTabPipeline(['tab1', 'tab2']);
        assert.strictEqual(pipeline.activeTab, 'tab1');
        
        pipeline.switchTab('tab2');
        assert.strictEqual(pipeline.activeTab, 'tab2');
        
        pipeline.updateStatus('tab1', 'completed');
        assert.strictEqual(pipeline.getStatus('tab1'), 'completed');
    });
});
