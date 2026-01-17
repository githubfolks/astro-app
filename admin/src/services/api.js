import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/', // Adjust if backend runs on different port
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);


export const cms = {
    posts: {
        list: (params) => api.get('/cms/posts', { params }),
        get: (id) => api.get(`/cms/posts/${id}`),
        create: (data) => api.post('/cms/posts', data),
        update: (id, data) => api.put(`/cms/posts/${id}`, data),
        delete: (id) => api.delete(`/cms/posts/${id}`),
    },
    pages: {
        list: (params) => api.get('/cms/pages', { params }),
        get: (id) => api.get(`/cms/pages/${id}`),
        create: (data) => api.post('/cms/pages', data),
        update: (id, data) => api.put(`/cms/pages/${id}`, data),
        delete: (id) => api.delete(`/cms/pages/${id}`),
    },
    horoscopes: {
        list: (params) => api.get('/cms/horoscopes', { params }),
        create: (data) => api.post('/cms/horoscopes', data),
        update: (id, data) => api.put(`/cms/horoscopes/${id}`, data),
        delete: (id) => api.delete(`/cms/horoscopes/${id}`),
    },
    upload: (formData) => api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
};

export const payouts = {
    getPending: () => api.get('/admin/payouts/pending'),
    generate: (data) => api.post('/admin/payouts/generate', null, { params: data }), // generate expects query params too? No, let's check backend.
    // Backend generate: astrologer_id, amount, ... as arguments. FastAPI treats them as query params unless Pydantic model.
    // Better to fix Backend to accept Pydantic model for Generate. 
    // BUT for now, let's match existing backend:
    // generate_payout(astrologer_id: int, amount: float ...) -> Query Params.
    markPaid: (id, transactionRef) => api.post(`/admin/payouts/${id}/mark-paid?transaction_reference=${encodeURIComponent(transactionRef)}`)
};


export default api;
