import { test } from 'node:test';
import * as assert from 'node:assert';
import { initializeClient } from '../../src/tui/client.js';

test('OpenTUI client initialization', async (t) => {
    await t.test('should return an initialized client instance', () => {
        const client = initializeClient();
        assert.ok(client);
        assert.strictEqual(client.status, 'initialized');
    });
});
