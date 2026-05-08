import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URI || 'http://localhost:4000',
});

// Add a request interceptor to include the token in headers
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
