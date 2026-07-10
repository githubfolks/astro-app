import { storage } from '../utils/storage';
import { isNative } from '../utils/platform';

const API_URL = import.meta.env.VITE_API_URL;

/** FastAPI request-validation error item (from response.detail array) */
interface ValidationError {
    loc?: (string | number)[];
    msg: string;
    type?: string;
}

/** Generic JSON-serializable request payload (any plain object). */
type JsonBody = object;

/** Get auth token from cross-platform storage */
const getAuthToken = async (): Promise<string | null> => {
    return storage.getItem('token');
};

/** Auth headers factory */
const authHeaders = async (): Promise<Record<string, string>> => {
    const token = await getAuthToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/** Get CSRF token from cookies */
const getCsrfToken = (): string | null => {
    const name = "csrf_token=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return null;
};

/** Native-aware fetch wrapper to bypass CORS */
const customFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const { method = 'GET', headers: originalHeaders = {} } = options;

    // Add CSRF token for state-changing methods
    const headers = new Headers(originalHeaders);
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
        const csrfToken = getCsrfToken();
        if (csrfToken) {
            headers.set('X-CSRF-Token', csrfToken);
        }
    }

    if (!isNative()) {
        return fetch(url, { ...options, headers, credentials: 'include' });
    }

    // On native, capacitor.config.ts enables CapacitorHttp, which patches the
    // global fetch to route through the native HTTP client (bypassing CORS)
    // while correctly handling FormData/JSON bodies. Calling CapacitorHttp.request
    // directly here used to double-handle bodies and broke on FormData (e.g. login,
    // file uploads), since it force-JSON.parsed whatever body was passed in.
    return fetch(url, { ...options, headers });
};

const handleResponse = async (response: Response, defaultError: string) => {
    if (!response.ok) {
        // Only treat a 401 as an expired session (clear auth + redirect) when we
        // actually had a token. A 401 on the login request itself just means the
        // credentials were wrong, and should surface as an inline error instead.
        if (response.status === 401 && (await getAuthToken())) {
            await storage.removeItem('token');
            await storage.removeItem('user');
            window.location.href = '/login';
        }
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.detail || defaultError;

        if (Array.isArray(errorData.detail)) {
            errorMessage = (errorData.detail as ValidationError[]).map((err) => {
                const field = err.loc ? err.loc[err.loc.length - 1] : 'error';
                return `${String(field).replace('_', ' ')}: ${err.msg}`;
            }).join(', ');
        }

        throw new Error(errorMessage);
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

        signup: async (data: JsonBody) => {
            const response = await customFetch(`${API_URL}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return handleResponse(response, 'Signup failed');
        },
        verifyEmail: async (email: string, otp: string) => {
            const response = await customFetch(`${API_URL}/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });
            return handleResponse(response, 'Failed to verify email');
        },
        resendVerification: async (email: string) => {
            const response = await customFetch(`${API_URL}/resend-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            return handleResponse(response, 'Failed to resend verification code');
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
        notifyWhenOnline: async (astrologerId: number | string) => {
            const response = await customFetch(`${API_URL}/astrologers/${astrologerId}/notify-when-online`, {
                method: 'POST',
                headers: await authHeaders()
            });
            return handleResponse(response, 'Failed to subscribe to availability alerts');
        },
        getProfile: async () => {
            const response = await customFetch(`${API_URL}/astrologers/profile`, {
                headers: await authHeaders()
            });
            return handleResponse(response, 'Failed to fetch profile');
        },
        updateProfile: async (data: JsonBody) => {
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
        onboarding: async (data: JsonBody) => {
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
        },
        getPayoutHistory: async () => {
            const response = await customFetch(`${API_URL}/astrologers/payouts/history`, {
                headers: await authHeaders()
            });
            return handleResponse(response, 'Failed to fetch payout history');
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
        updateProfile: async (data: JsonBody) => {
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

    aiAstrologer: {
        quota: async (name: string, dateOfBirth: string) => {
            const params = new URLSearchParams({ name, date_of_birth: dateOfBirth });
            const response = await customFetch(`${API_URL}/ai-astrologer/quota?${params}`, {
                headers: await authHeaders()
            });
            return handleResponse(response, 'Could not check your remaining free questions.');
        },
        chat: async (data: JsonBody) => {
            const response = await customFetch(`${API_URL}/ai-astrologer/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(await authHeaders())
                },
                body: JSON.stringify(data)
            });
            return handleResponse(response, 'The AI Astrologer could not read the stars right now. Please try again.');
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
        create: async (data: { astrologer_id: number, consultation_type: string, topic?: string, concern_note?: string }) => {
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
        queuePosition: async (consultationId: number | string) => {
            const response = await customFetch(`${API_URL}/consultations/${consultationId}/queue-position`, {
                headers: await authHeaders()
            });
            return handleResponse(response, 'Failed to fetch queue position');
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
        },
        getChatHistory: async (consultation_id: number | string) => {
            const response = await customFetch(`${API_URL}/chat/history/${consultation_id}`, {
                headers: await authHeaders()
            });
            return handleResponse(response, 'Failed to fetch chat history');
        },
        postMessage: async (consultation_id: number | string, content: string) => {
            const response = await customFetch(`${API_URL}/chat/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(await authHeaders())
                },
                body: JSON.stringify({ consultation_id, content })
            });
            return handleResponse(response, 'Failed to send message');
        },
        resumeConsultation: async (consultation_id: number | string) => {
            const response = await customFetch(`${API_URL}/consultations/${consultation_id}/resume`, {
                method: 'POST',
                headers: await authHeaders()
            });
            return handleResponse(response, 'Failed to resume consultation');
        },
        endActiveOnLogout: async () => {
            const response = await customFetch(`${API_URL}/consultations/end-active-on-logout`, {
                method: 'POST',
                headers: await authHeaders()
            });
            return handleResponse(response, 'Failed to end active consultation');
        }
    },

    chatTranslate: {
        translate: async (consultation_id: number | string, text: string, target_lang: 'hi' | 'en') => {
            const response = await customFetch(`${API_URL}/chat/translate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(await authHeaders())
                },
                body: JSON.stringify({ consultation_id, text, target_lang })
            });
            return handleResponse(response, 'Failed to translate message');
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
        getPanchangNow: async (lat: number, lon: number, place = '') => {
            const params = new URLSearchParams({
                lat: lat.toString(),
                lon: lon.toString(),
                ...(place && { place })
            });
            const response = await customFetch(`${API_URL}/public/panchang?${params}`);
            return handleResponse(response, 'Failed to fetch daily panchang');
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
                body: JSON.stringify(data),
                credentials: 'include'
            });
            return handleResponse(response, 'Failed to generate Kundli');
        },
        getReport: async (id: number) => {
            const response = await fetch(`${API_URL}/kundli/${id}`, {
                headers: await authHeaders(),
                credentials: 'include'
            });
            return handleResponse(response, 'Failed to fetch Kundli report');
        },
        getSeekerReports: async (seekerId: number) => {
            const response = await fetch(`${API_URL}/kundli/seeker/${seekerId}`, {
                headers: await authHeaders(),
                credentials: 'include'
            });
            return handleResponse(response, 'Failed to fetch seeker Kundli reports');
        },
        getHistory: async () => {
            const response = await fetch(`${API_URL}/kundli/history/all`, {
                headers: await authHeaders(),
                credentials: 'include'
            });
            return handleResponse(response, 'Failed to fetch Kundli history');
        }
    },
    edu: {
        getCourses: async () => {
            const response = await customFetch(`${API_URL}/edu/courses`);
            return handleResponse(response, 'Failed to fetch courses');
        },
        getMyCourses: async () => {
            const response = await customFetch(`${API_URL}/edu/my/courses`, {
                headers: await authHeaders(),
                credentials: 'include'
            });
            return handleResponse(response, 'Failed to fetch my courses');
        },
        getSessions: async () => {
            const response = await customFetch(`${API_URL}/edu/sessions`, {
                headers: await authHeaders(),
                credentials: 'include'
            });
            return handleResponse(response, 'Failed to fetch sessions');
        },
        createCourse: async (data: JsonBody) => {
            const response = await customFetch(`${API_URL}/edu/courses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(await authHeaders())
                },
                body: JSON.stringify(data)
            });
            return handleResponse(response, 'Failed to create course');
        },
        updateCourse: async (courseId: number, data: JsonBody) => {
            const response = await customFetch(`${API_URL}/edu/courses/${courseId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(await authHeaders())
                },
                body: JSON.stringify(data),
                credentials: 'include'
            });
            return handleResponse(response, 'Failed to update course');
        },
        createBatch: async (data: JsonBody) => {
            const response = await customFetch(`${API_URL}/edu/batches`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(await authHeaders())
                },
                body: JSON.stringify(data)
            });
            return handleResponse(response, 'Failed to create batch');
        },
        scheduleSession: async (data: JsonBody) => {
            const response = await customFetch(`${API_URL}/edu/sessions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(await authHeaders())
                },
                body: JSON.stringify(data)
            });
            return handleResponse(response, 'Failed to schedule session');
        },
        updateSession: async (sessionId: number, data: JsonBody) => {
            const response = await customFetch(`${API_URL}/edu/sessions/${sessionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(await authHeaders())
                },
                body: JSON.stringify(data)
            });
            return handleResponse(response, 'Failed to update session');
        },
        enroll: async (data: JsonBody) => {
            const response = await customFetch(`${API_URL}/edu/enroll`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(await authHeaders())
                },
                body: JSON.stringify(data)
            });
            return handleResponse(response, 'Failed to enroll');
        },
        joinSession: async (sessionId: number) => {
            const response = await customFetch(`${API_URL}/edu/sessions/${sessionId}/join`, {
                headers: await authHeaders()
            });
            return handleResponse(response, 'Failed to join session');
        },
        getCourseMaterials: async (courseId: number) => {
            const response = await customFetch(`${API_URL}/edu/courses/${courseId}/materials`, {
                headers: await authHeaders(),
                credentials: 'include'
            });
            return handleResponse(response, 'Failed to fetch course materials');
        },
        addCourseMaterial: async (courseId: number, data: JsonBody) => {
            const response = await customFetch(`${API_URL}/edu/courses/${courseId}/materials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(await authHeaders())
                },
                body: JSON.stringify(data),
                credentials: 'include'
            });
            return handleResponse(response, 'Failed to add course material');
        },
        deleteCourseMaterial: async (materialId: number) => {
            const response = await customFetch(`${API_URL}/edu/materials/${materialId}`, {
                method: 'DELETE',
                headers: await authHeaders(),
                credentials: 'include'
            });
            return handleResponse(response, 'Failed to delete course material');
        }
    }
};
