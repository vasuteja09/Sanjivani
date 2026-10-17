import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  timeout: 35000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected network error occurred.';
    if (error.response) {
      message = error.response.data?.detail || error.response.data?.message || `Error ${error.response.status}`;
    } else if (error.request) {
      message = 'Cannot connect to Sanjivani AI backend. Ensure backend is running at http://127.0.0.1:8000.';
    }
    return Promise.reject(new Error(message));
  }
);
