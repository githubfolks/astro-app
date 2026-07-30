import { test, expect, type Page } from '@playwright/test';
import { mockApi } from './helpers';

/**
 * Regression coverage for the bug where two astrologer dashboards open in
 * different tabs of the same browser would cross-contaminate: logging into
 * astrologer2 in tab B silently overwrote the auth token astrologer-1's tab A
 * also read from (both used the same `localStorage['token']`), so tab A's
 * "Requests Queue" ended up fetching and rendering astrologer2's data.
 *
 * Root-caused to web/src/utils/storage.ts using localStorage (shared across
 * tabs) for the auth token; fixed by switching token/user to sessionStorage
 * (isolated per tab). Two `page`s in the same `context` here reproduce real
 * browser tabs: sessionStorage is per-page, localStorage would be shared.
 */

type Astro = { id: number; token: string; name: string; seekerName: string };

const astro1: Astro = { id: 101, token: 'astro1-tok', name: 'Astro One', seekerName: 'Seeker One' };
const astro2: Astro = { id: 102, token: 'astro2-tok', name: 'Astro Two', seekerName: 'Seeker Two' };

function historyFor(astro: Astro) {
    return [
        {
            id: astro.id * 10,
            seeker_id: astro.id * 10,
            astrologer_id: astro.id,
            status: 'REQUESTED',
            consultation_type: 'CHAT',
            rate_per_min: '10.00',
            total_cost: '0.00',
            created_at: new Date().toISOString(),
            seeker_profile: { full_name: astro.seekerName },
        },
    ];
}

async function mockAstrologer(page: Page, astro: Astro, other: Astro) {
    await mockApi(page, {
        '/login': () => ({
            json: {
                access_token: astro.token,
                token_type: 'bearer',
                user_id: astro.id,
                role: 'ASTROLOGER',
                full_name: astro.name,
            },
        }),
        '/consultations/history': (req) => {
            const auth = req.headers()['authorization'] ?? '';
            // Mirror the real backend: history is scoped strictly by whichever
            // astrologer the bearer token belongs to.
            if (auth.includes(other.token)) return { json: historyFor(other) };
            return { json: historyFor(astro) };
        },
        '/astrologers/profile': () => ({
            json: { is_online: true, availability_hours: '', contract_signed_at: '2024-01-01', profile_picture_url: 'x', kyc_verified: true },
        }),
        '/astrologers/payouts/history': () => ({ json: [] }),
        '/astrologers/stats/performance': () => ({ json: null }),
    });
}

test('two astrologer dashboards in the same browser stay isolated', async ({ context }) => {
    const pageA = await context.newPage();
    const pageB = await context.newPage();

    await mockAstrologer(pageA, astro1, astro2);
    await mockAstrologer(pageB, astro2, astro1);

    // Tab A logs in as astrologer1.
    await pageA.goto('/login');
    await pageA.getByPlaceholder('Email or Phone').fill('astro1@example.com');
    await pageA.getByPlaceholder('Password').fill('correct');
    await pageA.getByRole('button', { name: 'Login' }).click();
    await expect(pageA).toHaveURL(/\/dashboard$/);
    await expect(pageA.getByText(astro1.seekerName)).toBeVisible();

    // Tab B (same browser) now logs in as astrologer2 — this is the moment
    // that used to clobber tab A's shared localStorage token.
    await pageB.goto('/login');
    await pageB.getByPlaceholder('Email or Phone').fill('astro2@example.com');
    await pageB.getByPlaceholder('Password').fill('correct');
    await pageB.getByRole('button', { name: 'Login' }).click();
    await expect(pageB).toHaveURL(/\/dashboard$/);
    await expect(pageB.getByText(astro2.seekerName)).toBeVisible();

    // Tab A must still be authenticated as astrologer1 and must not have
    // picked up astrologer2's token from shared storage.
    const tokenInTabA = await pageA.evaluate(() => sessionStorage.getItem('token'));
    const tokenInTabB = await pageB.evaluate(() => sessionStorage.getItem('token'));
    expect(tokenInTabA).toBe(astro1.token);
    expect(tokenInTabB).toBe(astro2.token);

    // Re-trigger tab A's queue fetch (as the realtime NEW_REQUEST/QUEUE_UPDATE
    // handler would) and confirm it still renders astrologer1's own queue —
    // not astrologer2's — and vice versa.
    await pageA.reload();
    await expect(pageA.getByText(astro1.seekerName)).toBeVisible();
    await expect(pageA.getByText(astro2.seekerName)).not.toBeVisible();

    await pageB.reload();
    await expect(pageB.getByText(astro2.seekerName)).toBeVisible();
    await expect(pageB.getByText(astro1.seekerName)).not.toBeVisible();
});
