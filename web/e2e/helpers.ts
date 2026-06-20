import type { Page, Route, Request } from '@playwright/test';

const API_ORIGIN = 'http://localhost:9000';

type MockResponse = { status?: number; json?: unknown };
type Handler = (req: Request) => MockResponse;

/**
 * Intercepts all calls to the API origin. `handlers` is keyed by URL pathname;
 * anything unmatched gets a generic 200 `[]` so data-heavy pages (e.g. the home
 * page after login) still render. CORS headers are added because the app calls
 * the API cross-origin with credentials.
 */
export async function mockApi(page: Page, handlers: Record<string, Handler>) {
    await page.route(`${API_ORIGIN}/**`, async (route: Route) => {
        const req = route.request();
        const origin = req.headers()['origin'] ?? '*';
        const cors: Record<string, string> = {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
            'Access-Control-Allow-Headers':
                req.headers()['access-control-request-headers'] ??
                'authorization,content-type,x-csrf-token',
        };

        if (req.method() === 'OPTIONS') {
            return route.fulfill({ status: 204, headers: cors });
        }

        const pathname = new URL(req.url()).pathname;
        const handler = handlers[pathname];
        const result: MockResponse = handler ? handler(req) : { status: 200, json: [] };

        return route.fulfill({
            status: result.status ?? 200,
            headers: { ...cors, 'Content-Type': 'application/json' },
            body: JSON.stringify(result.json ?? {}),
        });
    });
}
