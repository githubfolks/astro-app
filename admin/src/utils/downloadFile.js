import api from '../services/api';

export async function downloadFile(url, params, fallbackName) {
    try {
        const res = await api.get(url, { params, responseType: 'blob' });
        const disposition = res.headers['content-disposition'] || '';
        const match = disposition.match(/filename=([^;]+)/);
        const filename = match ? match[1].trim() : fallbackName;
        const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
        return true;
    } catch {
        alert('Failed to generate the export file');
        return false;
    }
}
