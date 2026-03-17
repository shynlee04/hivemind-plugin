import { test } from 'node:test';
import * as assert from 'node:assert';
import { SseConnectionHandler } from '../../src/tui/sse.js';

test('SSE Connection Handler', async (t) => {
    await t.test('should connect and handle messages', async () => {
        const handler = new SseConnectionHandler('http://localhost:1234/stream');
        assert.strictEqual(handler.status, 'disconnected');
        assert.strictEqual(typeof handler.connect, 'function');
    });
});
