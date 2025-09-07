// apiClient.ts
import axios from 'axios';
import type { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { getTokenFromLocalStorage, saveAuthTokensAndUserId, clearTokens } from '../utils/index';
import API_ENDPOINTS, { API_BASE_URL } from "../api/apiConfig";

/** Client chính cho toàn app */
const apiClient = axios.create({
  baseURL: API_BASE_URL, // <-- là string
  headers: { 'Content-Type': 'application/json' },
});

/** Client riêng cho refresh: không interceptor, không gắn Bearer */
const refreshClient = axios.create();

declare module 'axios' {
  export interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

// Hàng đợi request chờ refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(p => (error ? p.reject(error) : p.resolve(token || '')));
  failedQueue = [];
};

// ---- Request Interceptor ----
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getTokenFromLocalStorage();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---- Response Interceptor ----
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig | undefined;

    // 1) Network/CORS error
    if (!error.response) {
      return Promise.reject(error);
    }

    const status = error.response.status;

    // 2) Không phải 401 hoặc không có original config -> ném ra
    if (status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // 3) Không retry cho endpoint refresh (tránh vòng lặp)
    // Tạo URL tuyệt đối để check pathname an toàn
    const reqUrl = (() => {
      try {
        const base = (originalRequest.baseURL as string) || API_BASE_URL || window.location.origin;
        return new URL(originalRequest.url!, base);
      } catch {
        // fallback đơn giản
        return { pathname: originalRequest.url || '' } as URL;
      }
    })();
    const isRefreshEndpoint = reqUrl.pathname.endsWith(API_ENDPOINTS.auth.refreshToken);
    if (isRefreshEndpoint) {
      clearTokens();
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject(error);
    }

    // 4) Tránh retry vô hạn
    if (originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    // 5) Nếu không có refreshToken -> logout
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      clearTokens();
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject(error);
    }

    // 6) Nếu đang refresh: xếp hàng đợi
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (newToken: string) => {
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    // 7) Tiến hành refresh 1 lần (dùng refreshClient để tránh interceptor)
    isRefreshing = true;
    try {
      const resp = await refreshClient.post(
        `${API_BASE_URL}${API_ENDPOINTS.auth.refreshToken}`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json', accept: '*/*' } }
      );

      const { accessToken, refreshToken: newRefreshToken } = (resp.data as any) || {};
      if (!accessToken || !newRefreshToken) {
        throw new Error('Invalid refresh response');
      }

      // Lưu token mới
      await saveAuthTokensAndUserId(
        accessToken,
        newRefreshToken,
        localStorage.getItem('username') || ''
      );

      // Cập nhật default header
      apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

      // Đánh thức hàng đợi
      processQueue(null, accessToken);

      // Retry request ban đầu
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearTokens();
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
