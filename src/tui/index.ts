import { initializeClient } from './client.js';

async function main() {
    try {
        const client = await initializeClient();
        client.render();
        
        // Handle process exit to clean up alternate buffer
        const cleanup = () => {
            client.destroy();
            process.exit(0);
        };
        
        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);
    } catch (e) {
        console.error('Failed to initialize OpenTUI:', e);
        process.exit(1);
    }
}

// Only run automatically if this is the main module
if (process.argv[1] === new URL(import.meta.url).pathname) {
    main();
}

export { main };