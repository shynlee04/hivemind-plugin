import { createOpencodeClient } from '@opencode-ai/sdk';

export class SseConnectionHandler {
    private client;
    private _status: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

    constructor(baseUrl: string) {
        this.client = createOpencodeClient({ baseUrl });
    }

    get status() { return this._status; }

    async connect(): Promise<unknown> {
        this._status = 'connecting';
        try {
            const result = await this.client.event.subscribe();
            this._status = 'connected';
            return result;
        } catch (e) {
            this._status = 'disconnected';
            throw e;
        }
    }
}
