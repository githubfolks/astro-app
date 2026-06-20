import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { api } from './api';
import { server, API } from '../test/server';

describe('api.auth.login + handleResponse', () => {
    it('surfaces a wrong-credentials 401 as a thrown error (not swallowed)', async () => {
        // Regression: a 401 with no stored token must throw the backend detail so the
        // login page can render it, rather than triggering the expired-session redirect.
        server.use(
            http.post(`${API}/login`, () =>
                HttpResponse.json({ detail: 'Incorrect username or password' }, { status: 401 }),
            ),
        );

        await expect(api.auth.login('nobody@example.com', 'wrong')).rejects.toThrow(
            'Incorrect username or password',
        );
    });

    it('returns the parsed body (incl. full_name) on success', async () => {
        server.use(
            http.post(`${API}/login`, () =>
                HttpResponse.json({
                    access_token: 'tok',
                    token_type: 'bearer',
                    user_id: 1,
                    role: 'SEEKER',
                    full_name: 'Asha Rao',
                }),
            ),
        );

        const data = await api.auth.login('asha@example.com', 'right');
        expect(data.access_token).toBe('tok');
        expect(data.full_name).toBe('Asha Rao');
    });

    it('formats FastAPI validation-error arrays into a readable message', async () => {
        server.use(
            http.post(`${API}/signup`, () =>
                HttpResponse.json(
                    { detail: [{ loc: ['body', 'password'], msg: 'too weak' }] },
                    { status: 422 },
                ),
            ),
        );

        await expect(api.auth.signup({ email: 'a@b.com' })).rejects.toThrow(/password: too weak/);
    });
});
