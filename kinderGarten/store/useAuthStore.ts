import { create } from "zustand";
import { secureStorage } from "@/utils/secureStorage";

interface AuthState {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: "admin" | "parent" | "teacher" | null;
  error: string | null;

  // Actions
  checkAuth: () => Promise<void>;
  setIsAuthenticated: (value: boolean) => void;
  setUserRole: (role: string) => void;
  logout: () => Promise<void>;
  clearError: () => void;
}

/**
 * ✅ Global auth store using Zustand
 */
export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  isAuthenticated: false,
  isLoading: true,
  userRole: null,
  error: null,

  // Check if user is authenticated by looking for valid token
  checkAuth: async () => {
    try {
      set({ isLoading: true, error: null });
      const token = await secureStorage.getAccessToken();
      const role = await secureStorage.getUserRole();

      if (token) {
        set({
          isAuthenticated: true,
          userRole: (role as any) || null,
        });
      } else {
        set({
          isAuthenticated: false,
          userRole: null,
        });
      }
    } catch (error) {
      console.error("❌ Auth check failed:", error);
      set({
        isAuthenticated: false,
        userRole: null,
        error: "Failed to check authentication",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  // Set authentication status
  setIsAuthenticated: (value: boolean) => {
    set({ isAuthenticated: value });
  },

  // Set user role
  setUserRole: (role: string) => {
    set({ userRole: (role as any) || null });
  },

  // Logout and clear all data
  logout: async () => {
    try {
      await secureStorage.clearAll();
      set({
        isAuthenticated: false,
        userRole: null,
        error: null,
      });
    } catch (error) {
      console.error("❌ Logout failed:", error);
      set({ error: "Failed to logout" });
    }
  },

  // Clear error message
  clearError: () => set({ error: null }),
}));
