import { createCliRenderer } from '@opentui/core';
import { createRoot } from '@opentui/react';
import React from 'react';
import { Dashboard } from './Dashboard.js';

export interface OpenTuiClient {
    status: 'initialized' | 'connected' | 'disconnected';
    render: () => void;
    destroy: () => void;
}

/**
 * Initializes the OpenTUI client
 * @returns {Promise<OpenTuiClient>} The initialized client instance
 */
export async function initializeClient(): Promise<OpenTuiClient> {
    const renderer = await createCliRenderer();
    const root = createRoot(renderer);
    
    return {
        status: 'initialized',
        render: () => {
            root.render(React.createElement(Dashboard));
        },
        destroy: () => {
            renderer.destroy();
        }
    };
}
