import * as SecureStore from "expo-secure-store";

const STORAGE_KEYS = {
  ACCESS_TOKEN: "kindergarten_access_token",
  REFRESH_TOKEN: "kindergarten_refresh_token",
  TENANT_SLUG: "kindergarten_tenant",
  USER_ROLE: "kindergarten_user_role",
};

/**
 * ✅ Secure token storage using SecureStore (encrypted)
 */
export const secureStorage = {
  /**
   * Save access token
   */
  async setAccessToken(token: string) {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, token);
    } catch (error) {
      console.error("❌ Failed to save access token:", error);
      throw error;
    }
  },

  /**
   * Retrieve access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error("❌ Failed to retrieve access token:", error);
      return null;
    }
  },

  /**
   * Save refresh token
   */
  async setRefreshToken(token: string) {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, token);
    } catch (error) {
      console.error("❌ Failed to save refresh token:", error);
      throw error;
    }
  },

  /**
   * Retrieve refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error("❌ Failed to retrieve refresh token:", error);
      return null;
    }
  },

  /**
   * Save tenant slug
   */
  async setTenantSlug(slug: string) {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.TENANT_SLUG, slug);
    } catch (error) {
      console.error("❌ Failed to save tenant slug:", error);
    }
  },

  /**
   * Retrieve tenant slug
   */
  async getTenantSlug(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.TENANT_SLUG);
    } catch (error) {
      console.error("❌ Failed to retrieve tenant slug:", error);
      return null;
    }
  },

  /**
   * Save user role
   */
  async setUserRole(role: string) {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_ROLE, role);
    } catch (error) {
      console.error("❌ Failed to save user role:", error);
    }
  },

  /**
   * Retrieve user role
   */
  async getUserRole(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.USER_ROLE);
    } catch (error) {
      console.error("❌ Failed to retrieve user role:", error);
      return null;
    }
  },

  /**
   * Clear all tokens (logout)
   */
  async clearAll() {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN).catch(() => {}),
        SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN).catch(() => {}),
        SecureStore.deleteItemAsync(STORAGE_KEYS.TENANT_SLUG).catch(() => {}),
        SecureStore.deleteItemAsync(STORAGE_KEYS.USER_ROLE).catch(() => {}),
      ]);
    } catch (error) {
      console.error("❌ Failed to clear secure storage:", error);
    }
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  },
};
