import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';

const seeker = {
    id: 1,
    email: 'asha@example.com',
    phone_number: '9000000001',
    role: 'SEEKER' as const,
    full_name: 'Asha Rao',
};

function Harness() {
    const { user, isAuthenticated, login, logout } = useAuth();
    return (
        <div>
            <span data-testid="name">{user?.full_name ?? 'none'}</span>
            <span data-testid="authed">{String(isAuthenticated)}</span>
            <button onClick={() => login('tok', seeker)}>login</button>
            <button onClick={() => logout()}>logout</button>
        </div>
    );
}

const renderHarness = () =>
    render(
        <AuthProvider>
            <Harness />
        </AuthProvider>,
    );

describe('AuthContext', () => {
    it('stores the full user (incl. full_name) and persists it on login', async () => {
        renderHarness();
        await userEvent.click(screen.getByText('login'));

        await waitFor(() => expect(screen.getByTestId('name')).toHaveTextContent('Asha Rao'));
        expect(screen.getByTestId('authed')).toHaveTextContent('true');
        expect(localStorage.getItem('token')).toBe('tok');
        expect(JSON.parse(localStorage.getItem('user')!).full_name).toBe('Asha Rao');
    });

    it('clears user and storage on logout', async () => {
        renderHarness();
        await userEvent.click(screen.getByText('login'));
        await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('true'));

        await userEvent.click(screen.getByText('logout'));
        await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('false'));
        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
    });

    it('rehydrates an existing session from storage', async () => {
        localStorage.setItem('token', 'tok');
        localStorage.setItem('user', JSON.stringify(seeker));

        renderHarness();
        await waitFor(() => expect(screen.getByTestId('name')).toHaveTextContent('Asha Rao'));
    });
});
