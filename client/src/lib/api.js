import axios from 'axios';

// Uses the Vite dev proxy (/api -> :5050). Cookies carry the JWT.
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Surface the server's error message to callers/toasts.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message || err.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);
