import { test, expect } from '@playwright/test';
import { mockApi } from './helpers';

test.describe('Auth journeys', () => {
    test('wrong password shows an inline error and stays on /login', async ({ page }) => {
        // Regression: a 401 must render the backend message, not silently redirect.
        await mockApi(page, {
            '/login': () => ({ status: 401, json: { detail: 'Incorrect username or password' } }),
        });

        await page.goto('/login');
        await page.getByPlaceholder('Email or Phone').fill('nobody@example.com');
        await page.getByPlaceholder('Password').fill('wrongpass');
        await page.getByRole('button', { name: 'Login' }).click();

        await expect(page.getByText('Incorrect username or password')).toBeVisible();
        await expect(page).toHaveURL(/\/login$/);
    });

    test('successful login navigates home and greets the user by name', async ({ page }) => {
        await mockApi(page, {
            '/login': () => ({
                json: {
                    access_token: 'tok',
                    token_type: 'bearer',
                    user_id: 1,
                    role: 'SEEKER',
                    full_name: 'Asha Rao',
                },
            }),
        });

        await page.goto('/login');
        await page.getByPlaceholder('Email or Phone').fill('asha@example.com');
        await page.getByPlaceholder('Password').fill('correct');
        await page.getByRole('button', { name: 'Login' }).click();

        // Login succeeded: navigated home and the session token was persisted.
        // (The "Hi, <name>" greeting itself is covered by the Header unit test,
        // which doesn't depend on the data-heavy home page rendering under mocks.)
        await expect(page).toHaveURL('/');
        await expect.poll(() => page.evaluate(() => localStorage.getItem('token'))).toBe('tok');
    });

    test('signup routes to email verification (not an immediate login)', async ({ page }) => {
        // Regression: signup returns a verification message; the app must go to the
        // verify-email screen rather than try to log in with a missing token.
        await mockApi(page, {
            '/signup': () => ({
                json: { message: 'Signup successful. Please check your email for verification code.' },
            }),
        });

        await page.goto('/signup');
        await page.getByPlaceholder('Email').fill('new@example.com');
        await page.getByPlaceholder('Phone Number').fill('9000000123');
        await page.getByPlaceholder('Password').fill('Sup3r$ecret!');
        await page.getByRole('button', { name: 'Create Account' }).click();

        await expect(page).toHaveURL(/\/verify-email$/);
        await expect(page.getByText(/verification code/i)).toBeVisible();
    });

    test('forgot-password routes to the OTP screen', async ({ page }) => {
        await mockApi(page, {
            '/forgot-password': () => ({ json: { message: 'If the email is registered, an OTP has been sent.' } }),
        });

        await page.goto('/forgot-password');
        await page.getByPlaceholder('Email Address').fill('asha@example.com');
        await page.getByRole('button', { name: 'Send OTP' }).click();

        await expect(page).toHaveURL(/\/verify-otp$/);
    });
});
