import { defineConfig, devices } from '@playwright/test';

const PORT = 5179;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * E2E tests run against the real Vite app with the backend mocked at the network
 * layer (see e2e/*.spec.ts page.route handlers), so they're deterministic and need
 * no API/DB/email. To run against a real stack instead, point baseURL at it and
 * remove the route mocks.
 */
export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? 'list' : 'html',
    use: {
        baseURL: BASE_URL,
        trace: 'on-first-retry',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ],
    webServer: {
        command: `npm run dev -- --port ${PORT} --strictPort`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
            // Give the app a stable API origin so the route mocks can match it.
            VITE_API_URL: 'http://localhost:9000',
        },
    },
});
