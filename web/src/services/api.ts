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
        }
    },
    payment: {
        createOrder: async (amount: number) => {
            const response = await fetch(`${API_URL}/payment/order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ amount })
            });
            return handleResponse(response, 'Failed to create payment order');
        },
        verifyPayment: async (data: { razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string }) => {
            const response = await fetch(`${API_URL}/payment/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });
            return handleResponse(response, 'Failed to verify payment');
        }
    },
    updateDeviceToken: async (token: string, platform = 'web') => {
        const response = await fetch(`${API_URL}/users/device-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ token, platform })
        });
        return handleResponse(response, 'Failed to update device token');
    }
};
