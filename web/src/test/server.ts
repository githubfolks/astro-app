import { setupServer } from 'msw/node';

// Per-test handlers are registered with server.use(...). The base server starts
// with no handlers; setup.ts errors on any unhandled request so tests can't
// silently hit the network.
export const server = setupServer();

export const API = 'http://localhost:8000';
