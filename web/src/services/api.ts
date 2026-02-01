const API_URL = import.meta.env.VITE_API_URL;

const handleResponse = async (response: Response, defaultError: string) => {
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
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
        },
        forgotPassword: async (email: string) => {
            const response = await fetch(`${API_URL}/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            return handleResponse(response, 'Failed to send OTP');
        },
        verifyOtp: async (email: string, otp: string) => {
            const response = await fetch(`${API_URL}/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });
            return handleResponse(response, 'Failed to verify OTP');
        },
        resetPassword: async (token: string, new_password: string) => {
            const response = await fetch(`${API_URL}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, new_password }),
            });
            return handleResponse(response, 'Failed to reset password');
        }
    },
    astrologers: {
        list: async (skip = 0, limit = 20, sort_by?: string) => {
            const params = new URLSearchParams({
                skip: skip.toString(),
                limit: limit.toString()
            });
            if (sort_by) params.append('sort_by', sort_by);

            const response = await fetch(`${API_URL}/astrologers/?${params.toString()}`);
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
        },
        sendOtp: async (phone_number: string) => {
            const response = await fetch(`${API_URL}/astrologers/send-otp?phone_number=${phone_number}`, {
                method: 'POST'
            });
            return handleResponse(response, 'Failed to send OTP');
        },
        onboarding: async (data: any) => {
            const response = await fetch(`${API_URL}/astrologers/onboarding`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return handleResponse(response, 'Onboarding failed');
        },
        uploadFile: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            // Reusing admin upload endpoint if possible or generic one.
            // Let's assume there's a generic one or we used admin one which is public-ish but needs auth?
            // Actually I'll use a generic upload if I add one. For now using admin upload as a placeholder.
            const response = await fetch(`${API_URL}/admin/upload`, {
                method: 'POST',
                body: formData
            });
            return handleResponse(response, 'File upload failed');
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
    },

    cms: {
        getPosts: async (skip = 0, limit = 10, search = '') => {
            const params = new URLSearchParams({
                skip: skip.toString(),
                limit: limit.toString(),
                ...(search && { search })
            });
            const response = await fetch(`${API_URL}/public/posts?${params}`);
            return handleResponse(response, 'Failed to fetch posts');
        },
        getPostBySlug: async (slug: string) => {
            const response = await fetch(`${API_URL}/public/posts/${slug}`);
            return handleResponse(response, 'Failed to fetch post');
        },
        getPageBySlug: async (slug: string) => {
            const response = await fetch(`${API_URL}/public/pages/${slug}`);
            return handleResponse(response, 'Failed to fetch page');
        },
        getHoroscopes: async (sign?: string, period?: string, date?: string) => {
            const params = new URLSearchParams();
            if (sign) params.append('sign', sign);
            if (period) params.append('period', period);
            if (date) params.append('date', date);

            const response = await fetch(`${API_URL}/public/horoscopes?${params}`);
            return handleResponse(response, 'Failed to fetch horoscopes');
        },
        contact: async (data: { name: string, email: string, message: string }) => {
            const response = await fetch(`${API_URL}/public/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return handleResponse(response, 'Failed to submit inquiry');
        }
    }
};
