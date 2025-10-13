import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL, // ex.: seu ngrok
  timeout: 15000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // log útil para depurar
    console.log('[API ERROR]', {
      baseURL: err?.config?.baseURL,
      url: err?.config?.url,
      method: err?.config?.method,
      status: err?.response?.status,
      data: err?.response?.data,
      message: err?.message,
    });
    return Promise.reject(err);
  }
);
