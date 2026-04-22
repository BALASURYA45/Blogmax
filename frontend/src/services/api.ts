import axios from 'axios';

const envBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
const defaultProdBaseUrl = 'https://blogmax-k21q.onrender.com/api';
const baseURL =
  envBaseUrl ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : defaultProdBaseUrl);

const api = axios.create({
  baseURL
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
