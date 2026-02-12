import { storage } from '../utils/storage';
import { isNative } from '../utils/platform';
import { CapacitorHttp } from '@capacitor/core';

const API_URL = import.meta.env.VITE_API_URL;

/** Get auth token from cross-platform storage */
const getAuthToken = async (): Promise<string | null> => {
    return storage.getItem('token');
};

/** Auth headers factory */
const authHeaders = async (): Promise<Record<string, string>> => {
    const token = await getAuthToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/** Native-aware fetch wrapper to bypass CORS */
const customFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    if (!isNative()) {
        return fetch(url, options);
    }

    try {
        const { method = 'GET', headers = {}, body } = options;

        // Convert headers to simple object
        const capHeaders: Record<string, string> = {};
        if (headers instanceof Headers) {
            headers.forEach((v, k) => capHeaders[k] = v);
        } else if (Array.isArray(headers)) {
            headers.forEach(([k, v]) => capHeaders[k] = v);
        } else {
            Object.assign(capHeaders, headers);
        }

        const response = await CapacitorHttp.request({
            url,
            method,
            headers: capHeaders,
            data: body ? JSON.parse(body as string) : undefined, // CapacitorHttp expects object for JSON body
        });

        // Adapt Capacitor response to Fetch API Response
        return new Response(
            typeof response.data === 'object' ? JSON.stringify(response.data) : response.data,
            {
                status: response.status,
                headers: response.headers as any,
            }
        );
    } catch (error) {
        console.error('Native fetch error:', error);
        throw error;
    }
};

const handleResponse = async (response: Response, defaultError: string) => {
    if (!response.ok) {
        if (response.status === 401) {
            await storage.removeItem('token');
            await storage.removeItem('user');
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

            const response = await customFetch(`${API_URL}/login`, {
                method: 'POST',
                body: formData,
            });
            return handleResponse(response, 'Login failed');
        },

        signup: async (data: any) => {
            const response = await customFetch(`${API_URL}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return handleResponse(response, 'Signup failed');
        },
        forgotPassword: async (email: string) => {
            const response = await customFetch(`${API_URL}/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            return handleResponse(response, 'Failed to send OTP');
        },
        verifyOtp: async (email: string, otp: string) => {
            const response = await customFetch(`${API_URL}/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });
            return handleResponse(response, 'Failed to verify OTP');
        },
        resetPassword: async (token: string, new_password: string) => {
            const response = await customFetch(`${API_URL}/reset-password`, {
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

            const response = await customFetch(`${API_URL}/astrologers/?${params.toString()}`);
            return handleResponse(response, 'Failed to fetch astrologers');
        },
        getOne: async (id: number | string) => {
            const response = await customFetch(`${API_URL}/astrologers/${id}`);
            return handleResponse(response, 'Failed to fetch astrologer details');
        },
        getProfile: async () => {
            const response = await customFetch(`${API_URL}/astrologers/profile`, {
                headers: await authHeaders()
            });
            return handleResponse(response, 'Failed to fetch profile');
        },
        updateProfile: async (data: any) => {
            const response = await customFetch(`${API_URL}/astrologers/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(await authHeaders())
                },
                body: JSON.stringify(data)
            });
            return handleResponse(response, 'Failed to update profile');
        },
        sendOtp: async (phone_number: string) => {
            const response = await customFetch(`${API_URL}/astrologers/send-otp?phone_number=${phone_number}`, {
                method: 'POST'
            });
            return handleResponse(response, 'Failed to send OTP');
        },
        onboarding: async (data: any) => {
            const response = await customFetch(`${API_URL}/astrologers/onboarding`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return handleResponse(response, 'Onboarding failed');
        },
        uploadFile: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            const response = await customFetch(`${API_URL}/admin/upload`, {
                method: 'POST',
                body: formData
            });
            return handleResponse(response, 'File upload failed');
        }
    },

    seekers: {
        getOne: async (userId: number | string) => {
            const response = await customFetch(`${API_URL}/users/${userId}/profile`, {
                headers: await authHeaders()
            });
            return handleResponse(response, 'Failed to fetch seeker profile');
        },
        getProfile: async () => {
            const response = await customFetch(`${API_URL}/seekers/profile`, {
                headers: await authHeaders()
            });
            return handleResponse(response, 'Failed to fetch seeker profile');
        },
        updateProfile: async (data: any) => {
            const response = await customFetch(`${API_URL}/seekers/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(await authHeaders())
                },
                body: JSON.stringify(data)
            });
            return handleResponse(response, 'Failed to update seeker profile');
        }
    },

    wallet: {
        getBalance: async () => {
            const response = await customFetch(`${API_URL}/wallet/balance`, {
                headers: await authHeaders()
            });
            return handleResponse(response, 'Failed to fetch balance');
        },
        addMoney: async (amount: number) => {
            const response = await customFetch(`${API_URL}/wallet/add-money`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(await authHeaders())
                },
                body: JSON.stringify({ amount, transaction_type: 'DEPOSIT', description: 'Recharge' })
            });
            return handleResponse(response, 'Failed to add money');
        }
    },

    consultations: {
        getOne: async (id: number | string) => {
            const response = await customFetch(`${API_URL}/consultations/${id}`, {
                headers: await authHeaders()
            });
            return handleResponse(response, 'Failed to fetch consultation details');
        },
        create: async (data: { astrologer_id: number, consultation_type: string }) => {
            const response = await customFetch(`${API_URL}/consultations/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(await authHeaders())
                },
                body: JSON.stringify(data)
            });
            return handleResponse(response, 'Failed to create consultation');
        },
        getHistory: async () => {
            const response = await customFetch(`${API_URL}/consultations/history`, {
                headers: await authHeaders()
            });
            return handleResponse(response, 'Failed to fetch history');
        },
        submitReview: async (consultation_id: number, rating: number, comment?: string) => {
            const response = await customFetch(`${API_URL}/consultations/review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(await authHeaders())
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
            const response = await customFetch(`${API_URL}/public/posts?${params}`);
            return handleResponse(response, 'Failed to fetch posts');
        },
        getPostBySlug: async (slug: string) => {
            const response = await customFetch(`${API_URL}/public/posts/${slug}`);
            return handleResponse(response, 'Failed to fetch post');
        },
        getPageBySlug: async (slug: string) => {
            const response = await customFetch(`${API_URL}/public/pages/${slug}`);
            return handleResponse(response, 'Failed to fetch page');
        },
        getHoroscopes: async (sign?: string, period?: string, date?: string) => {
            const params = new URLSearchParams();
            if (sign) params.append('sign', sign);
            if (period) params.append('period', period);
            if (date) params.append('date', date);

            const response = await customFetch(`${API_URL}/public/horoscopes?${params}`);
            return handleResponse(response, 'Failed to fetch horoscopes');
        },
        contact: async (data: { name: string, email: string, message: string }) => {
            const response = await customFetch(`${API_URL}/public/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return handleResponse(response, 'Failed to submit inquiry');
        }
    },
    payment: {
        createOrder: async (amount: number) => {
            const response = await customFetch(`${API_URL}/payment/order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(await authHeaders())
                },
                body: JSON.stringify({ amount })
            });
            return handleResponse(response, 'Failed to create payment order');
        },
        verifyPayment: async (data: { razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string }) => {
            const response = await customFetch(`${API_URL}/payment/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(await authHeaders())
                },
                body: JSON.stringify(data)
            });
            return handleResponse(response, 'Failed to verify payment');
        }
    },
    updateDeviceToken: async (token: string, platform = 'web') => {
        const response = await customFetch(`${API_URL}/users/device-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(await authHeaders())
            },
            body: JSON.stringify({ token, platform })
        });
        return handleResponse(response, 'Failed to update device token');
    },

    kundli: {
        generate: async (data: { seeker_id?: number; full_name?: string; date_of_birth: string; time_of_birth: string; place_of_birth: string }) => {
            const response = await fetch(`${API_URL}/kundli/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(await authHeaders())
                },
                body: JSON.stringify(data)
            });
            return handleResponse(response, 'Failed to generate Kundli');
        },
        getReport: async (id: number) => {
            const response = await fetch(`${API_URL}/kundli/${id}`, {
                headers: await authHeaders()
            });
            return handleResponse(response, 'Failed to fetch Kundli report');
        },
        getSeekerReports: async (seekerId: number) => {
            const response = await fetch(`${API_URL}/kundli/seeker/${seekerId}`, {
                headers: await authHeaders()
            });
            return handleResponse(response, 'Failed to fetch seeker Kundli reports');
        },
        getHistory: async () => {
            const response = await fetch(`${API_URL}/kundli/history/all`, {
                headers: await authHeaders()
            });
            return handleResponse(response, 'Failed to fetch Kundli history');
        }
    }
};
