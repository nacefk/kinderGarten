import axios from "axios";
import { secureStorage } from "@/utils/secureStorage";
import { setAuthToken, clearAuthToken } from "./api";
import { getChildren } from "./children";
import { API_CONFIG, API_ENDPOINTS } from "@/config/api";

export async function login(username: string, password: string, tenant: string) {
  try {
    console.log("🔐 Login attempt:", {
      username,
      tenant,
      timestamp: new Date().toISOString(),
    });

    // ✅ Call login endpoint
    const res = await axios.post(
      `${API_CONFIG.baseURL}${API_ENDPOINTS.AUTH_LOGIN}`,
      { username, password, tenant },
      { timeout: API_CONFIG.timeout }
    );

    console.log("✅ Login successful");

const { access, refresh, role } = res.data;

    if (!access || !refresh) {
      throw new Error("Missing tokens in login response");
    }

    // ✅ Save tokens securely (NOT logged)
    await Promise.all([
      secureStorage.setAccessToken(access),
      secureStorage.setRefreshToken(refresh),
      secureStorage.setTenantSlug(tenant),
      secureStorage.setUserRole(role),
    ]);

    // ✅ Set token for API
    await setAuthToken(access);

    // ✅ Fetch the parent's child right after login (if parent role)
    let child = null;
    if (role === "parent") {
      try {
        const children = await getChildren();
        child = children?.[0] || null;
        if (child) {
          console.log("✅ Child profile loaded:", child.name);
} else {
          console.warn("⚠️ No child linked to this account yet.");
        }
      } catch (e: any) {
        console.error(
          "❌ Failed to fetch child data:",
          e.response?.data?.detail || e.message
        );
      }
    }

    return { role, child };
  } catch (error: any) {
    console.error("❌ Login error:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      details: error.response?.data,
      code: error.code,
    });
    throw error;
  }
}

export async function logout() {
  try {
    await clearAuthToken();
  } catch (error) {
    console.error("❌ Logout failed:", error);
  }
}
