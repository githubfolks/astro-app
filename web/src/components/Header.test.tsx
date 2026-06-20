import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from './Header';
import { AuthProvider } from '../context/AuthContext';

function renderHeaderWithUser(user: Record<string, unknown>) {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('user', JSON.stringify(user));
    return render(
        <MemoryRouter>
            <AuthProvider>
                <Header />
            </AuthProvider>
        </MemoryRouter>,
    );
}

describe('Header greeting', () => {
    it('greets the user by first name when full_name is present', async () => {
        renderHeaderWithUser({ id: 1, email: 'asha@example.com', role: 'SEEKER', full_name: 'Asha Rao' });
        // Regression for "Hi, User": with a name available it must greet "Hi, Asha".
        await waitFor(() => expect(screen.getAllByText('Hi, Asha').length).toBeGreaterThan(0));
        expect(screen.queryByText('Hi, User')).toBeNull();
    });

    it('falls back to the email prefix when full_name is missing', async () => {
        renderHeaderWithUser({ id: 2, email: 'asha@example.com', role: 'SEEKER' });
        await waitFor(() => expect(screen.getAllByText('Hi, asha').length).toBeGreaterThan(0));
    });

    it('shows a Login link when logged out', async () => {
        render(
            <MemoryRouter>
                <AuthProvider>
                    <Header />
                </AuthProvider>
            </MemoryRouter>,
        );
        // findByText waits for the async auth-rehydrate effect to settle.
        expect(await screen.findByText('Login')).toBeInTheDocument();
    });
});
