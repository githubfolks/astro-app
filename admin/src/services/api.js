import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/', // Adjust if backend runs on different port
    withCredentials: true,
});

const getCsrfToken = () => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; csrf_token=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Add CSRF token for state-changing methods
        if (['post', 'put', 'delete', 'patch'].includes(config.method.toLowerCase())) {
            const csrfToken = getCsrfToken();
            if (csrfToken) {
                config.headers['X-CSRF-Token'] = csrfToken;
            }
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
        if (error.response && error.response.status === 401 && localStorage.getItem('token')) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        
        // Extract detail from error response if it exists
        if (error.response && error.response.data && error.response.data.detail) {
            const detail = error.response.data.detail;
            if (typeof detail === 'string') {
                error.message = detail;
            } else if (Array.isArray(detail)) {
                // Handle FastAPI validation errors
                error.message = detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join(', ');
            }
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
        generateSocial: (data) => api.post('/cms/posts/generate-social', data),
        shareSocial: (id, data) => api.post(`/cms/posts/${id}/share-social`, data),
    },
    inquiries: {
        list: (params) => api.get('/cms/contact-inquiries', { params }),
        // Add update/delete if needed later
    },
    upload: (formData) => api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    astrologers: {
        listPending: () => api.get('/admin/astrologers/pending'),
        approve: (id, data) => api.post(`/admin/astrologers/${id}/approve`, data),
        reject: (id, data) => api.post(`/admin/astrologers/${id}/reject`, data),
        updateCommission: (id, data) => api.patch(`/admin/astrologers/${id}/commission`, data),
        onboarding: () => api.get('/admin/astrologers/onboarding'),
        advance: (id, data) => api.post(`/admin/astrologers/${id}/onboarding/advance`, data),
    },
    users: {
        getWalletHistory: (id) => api.get(`/admin/users/${id}/wallet-history`),
        adjustWallet: (id, data) => api.post(`/admin/users/${id}/wallet/credit`, data),
        editDetails: (id, data) => api.put(`/admin/users/${id}/edit`, data),
    }
};

export const payouts = {
    getPending: () => api.get('/admin/payouts/pending'),
    generate: (data) => api.post('/admin/payouts/generate', null, { params: data }), // generate expects query params too? No, let's check backend.
    // Backend generate: astrologer_id, amount, ... as arguments. FastAPI treats them as query params unless Pydantic model.
    // Better to fix Backend to accept Pydantic model for Generate. 
    // BUT for now, let's match existing backend:
    // generate_payout(astrologer_id: int, amount: float ...) -> Query Params.
    markPaid: (id, transactionRef, payoutDate, comments) => {
        let url = `/admin/payouts/${id}/mark-paid?transaction_reference=${encodeURIComponent(transactionRef)}`;
        if (payoutDate) url += `&payout_date=${encodeURIComponent(payoutDate)}`;
        if (comments) url += `&comments=${encodeURIComponent(comments)}`;
        return api.post(url);
    },
    getHistory: () => api.get('/admin/payouts/history')
};

export const edu = {
    getStats: (params) => api.get('/admin/edu/stats', { params })
};

export const disputes = {
    list: (params) => api.get('/disputes/', { params }),
    resolve: (id, data) => api.put(`/disputes/${id}`, data),
};

export const settings = {
    get: () => api.get('/admin/settings'),
    update: (data) => api.put('/admin/settings', data),
    getWhatsappStatus: () => api.get('/admin/whatsapp/status'),
    connectWhatsapp: (phone_number) => api.post('/admin/whatsapp/connect', { phone_number }),
    disconnectWhatsapp: () => api.post('/admin/whatsapp/disconnect'),
};

export const moderation = {
    list: (params) => api.get('/admin/moderation-flags', { params }),
    resolve: (id, status = 'REVIEWED') => api.post(`/admin/moderation-flags/${id}/resolve`, null, { params: { status } }),
};

export const contentStudio = {
    suggestTopic: () => api.post('/content-studio/suggest-topic'),
    generateScenes: (data) => api.post('/content-studio/jobs', data),
    updateScenes: (jobId, scenes) => api.put(`/content-studio/jobs/${jobId}/scenes`, { scenes }),
    generateSceneImage: (jobId, sceneIndex, imagePromptEn) =>
        api.post(`/content-studio/jobs/${jobId}/scenes/${sceneIndex}/generate-image`, { image_prompt_en: imagePromptEn }),
    renderVideo: (jobId) => api.post(`/content-studio/jobs/${jobId}/render`),
    getJob: (jobId) => api.get(`/content-studio/jobs/${jobId}`),
    listJobs: (params) => api.get('/content-studio/jobs', { params }),
    generateCaption: (jobId) => api.post(`/content-studio/jobs/${jobId}/generate-caption`),
    postFacebook: (jobId, caption) => api.post(`/content-studio/jobs/${jobId}/post/facebook`, { caption }),
    postInstagram: (jobId, caption) => api.post(`/content-studio/jobs/${jobId}/post/instagram`, { caption }),
    postYoutube: (jobId) => api.post(`/content-studio/jobs/${jobId}/post/youtube`),
};


export default api;
