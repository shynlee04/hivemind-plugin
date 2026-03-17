import { test } from 'node:test';
import * as assert from 'node:assert';
import { initializeClient } from '../../src/tui/client.js';

test('OpenTUI client initialization', async (t) => {
    await t.test('should return an initialized client instance', async () => {
        const client = await initializeClient();
        assert.ok(client);
        assert.strictEqual(client.status, 'initialized');
        
        // Clean up the terminal alternate buffer after test
        client.destroy();
    });
});
