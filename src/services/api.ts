import axios from 'axios';

const getBaseURL = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://127.0.0.1:8000/api';
  }
  return 'https://vclean.web.id/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getStorageUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('data:image/')) return path;
  
  let relativePath = path;
  
  // Extract relative path if it contains /storage-file/ or /storage/
  if (path.includes('/storage-file/')) {
    const parts = path.split('/storage-file/');
    relativePath = parts[parts.length - 1];
  } else if (path.includes('/storage/')) {
    const parts = path.split('/storage/');
    relativePath = parts[parts.length - 1];
  } else if (path.startsWith('http://') || path.startsWith('https://')) {
    return path; // external URL
  }
  
  // Clean up any leading slashes
  if (relativePath.startsWith('/')) {
    relativePath = relativePath.substring(1);
  }
  
  const baseUrl = getBaseURL().replace(/\/api$/, '');
  return `${baseUrl}/storage-file/${relativePath}`;
};

export default api;

