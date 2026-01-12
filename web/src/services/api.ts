const API_URL = 'http://localhost:8000';

const handleResponse = async (response: Response, defaultError: string) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 422 && Array.isArray(error.detail)) {
            const messages = error.detail.map((err: any) => {
                const field = err.loc[err.loc.length - 1];
                return `${String(field).replace('_', ' ')}: ${err.msg}`;
            });
            throw new Error(messages.join(', '));
        }
        throw new Error(error.detail || defaultError);
    }
    return response.json();
};

export const api = {
    auth: {
        login: async (username: string, password: string) => {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                body: formData,
            });
            return handleResponse(response, 'Login failed');
        },

        signup: async (data: any) => {
            const response = await fetch(`${API_URL}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return handleResponse(response, 'Signup failed');
        }
    },
    astrologers: {
        list: async (skip = 0, limit = 20) => {
            const response = await fetch(`${API_URL}/astrologers/?skip=${skip}&limit=${limit}`);
            return handleResponse(response, 'Failed to fetch astrologers');
        },
        getOne: async (id: number | string) => {
            const response = await fetch(`${API_URL}/astrologers/${id}`);
            return handleResponse(response, 'Failed to fetch astrologer details');
        },
        getProfile: async () => {
            const response = await fetch(`${API_URL}/astrologers/profile`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            return handleResponse(response, 'Failed to fetch profile');
        },
        updateProfile: async (data: any) => {
            const response = await fetch(`${API_URL}/astrologers/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });
            return handleResponse(response, 'Failed to update profile');
        }
    },

    seekers: {
        getOne: async (userId: number | string) => {
            const response = await fetch(`${API_URL}/users/${userId}/profile`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            return handleResponse(response, 'Failed to fetch seeker profile');
        },
        getProfile: async () => {
            const response = await fetch(`${API_URL}/seekers/profile`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            return handleResponse(response, 'Failed to fetch seeker profile');
        },
        updateProfile: async (data: any) => {
            const response = await fetch(`${API_URL}/seekers/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });
            return handleResponse(response, 'Failed to update seeker profile');
        }
    },

    wallet: {
        getBalance: async () => {
            const response = await fetch(`${API_URL}/wallet/balance`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            return handleResponse(response, 'Failed to fetch balance');
        },
        addMoney: async (amount: number) => {
            const response = await fetch(`${API_URL}/wallet/add-money`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ amount, transaction_type: 'DEPOSIT', description: 'Recharge' })
            });
            return handleResponse(response, 'Failed to add money');
        }
    },

    consultations: {
        getOne: async (id: number | string) => {
            const response = await fetch(`${API_URL}/consultations/${id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            return handleResponse(response, 'Failed to fetch consultation details');
        },
        create: async (data: { astrologer_id: number, consultation_type: string }) => {
            const response = await fetch(`${API_URL}/consultations/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });
            return handleResponse(response, 'Failed to create consultation');
        },
        getHistory: async () => {
            const response = await fetch(`${API_URL}/consultations/history`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            return handleResponse(response, 'Failed to fetch history');
        },
        submitReview: async (consultation_id: number, rating: number, comment?: string) => {
            const response = await fetch(`${API_URL}/consultations/review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ consultation_id, rating, comment })
            });
            return handleResponse(response, 'Failed to submit review');
        }
    }
};
