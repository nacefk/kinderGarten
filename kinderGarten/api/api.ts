import axios, { AxiosError, AxiosInstance } from "axios";
import { secureStorage } from "@/utils/secureStorage";
import { API_CONFIG, API_ENDPOINTS } from "@/config/api";

/**
 * ✅ Centralized axios instance with auto token management
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
});

/**
 * ✅ Setup auth interceptors for token refresh
 */
export const setupAxiosInterceptors = () => {
  // Request interceptor: attach token
  api.interceptors.request.use(
    async (config) => {
      const token = await secureStorage.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor: handle 401 and token refresh
  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as any;

      // If 401 and not already retrying
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = await secureStorage.getRefreshToken();
          if (!refreshToken) {
            // No refresh token, redirect to login
            throw new Error("No refresh token available");
          }

          // Attempt to refresh
          const response = await axios.post(
            `${API_CONFIG.baseURL}${API_ENDPOINTS.AUTH_REFRESH}`,
            { refresh: refreshToken },
            { timeout: API_CONFIG.timeout }
          );

          const { access } = response.data;

          // Save new token
          await secureStorage.setAccessToken(access);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          console.error("❌ Token refresh failed:", refreshError);

          // Clear tokens and redirect to login
          await secureStorage.clearAll();

          // Signal app to redirect to login (handled by auth store)
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
};

/**
 * ✅ Manually set auth token (for initial login)
 */
export const setAuthToken = async (token: string) => {
  try {
    await secureStorage.setAccessToken(token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } catch (error) {
    console.error("❌ Failed to set auth token:", error);
    throw error;
  }
};

/**
 * ✅ Clear auth token (for logout)
 */
export const clearAuthToken = async () => {
  try {
    await secureStorage.clearAll();
    delete api.defaults.headers.common["Authorization"];
  } catch (error) {
    console.error("❌ Failed to clear auth token:", error);
  }
};
