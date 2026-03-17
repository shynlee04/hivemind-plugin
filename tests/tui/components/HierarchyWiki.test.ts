import { test } from 'node:test';
import * as assert from 'node:assert';
import { HierarchyWiki } from '../../../src/tui/components/HierarchyWiki.js';

test('HierarchyWiki Component', async (t) => {
    await t.test('should parse and render hierarchy data', () => {
        const wiki = new HierarchyWiki({
            id: 'root',
            title: 'Root',
            children: [{ id: 'child1', title: 'Child 1' }]
        });
        
        assert.strictEqual(wiki.currentNode.id, 'root');
        assert.strictEqual(wiki.currentNode.children?.length, 1);
        
        wiki.navigate('child1');
        assert.strictEqual(wiki.currentNode.id, 'child1');
    });
});
