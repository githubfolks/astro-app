import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './server';

// Start the MSW request-mocking server for the whole test run.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
    server.resetHandlers();
    cleanup();
    localStorage.clear();
});

afterAll(() => server.close());
