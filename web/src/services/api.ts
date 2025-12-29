const API_URL = 'http://localhost:8000';

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

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Login failed');
            }

            return response.json();
        },

        signup: async (data: any) => {
            const response = await fetch(`${API_URL}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Signup failed');
            }

            return response.json();
        }
    },
    astrologers: {
        list: async () => {
            const response = await fetch(`${API_URL}/astrologers/`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error('Failed to fetch astrologers');
            return response.json();
        }
    },

    wallet: {
        getBalance: async () => {
            const response = await fetch(`${API_URL}/wallet/balance`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error('Failed to fetch balance');
            return response.json();
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
            if (!response.ok) throw new Error('Failed to add money');
            return response.json();
        }
    },

    consultations: {
        create: async (data: { astrologer_id: number, consultation_type: string }) => {
            const response = await fetch(`${API_URL}/consultations/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to create consultation');
            return response.json();
        },
        getHistory: async () => {
            const response = await fetch(`${API_URL}/consultations/history`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error('Failed to fetch history');
            return response.json();
        }
    }
};
