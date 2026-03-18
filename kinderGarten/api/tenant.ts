import { api } from "@/api/api";
import { secureStorage } from "@/utils/secureStorage";

export interface TenantResponse {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  is_active: boolean;
  logo: string | null;
  primary_color: string | null;
  secondary_color: string | null;
}

/**
 * Fetch current tenant information
 * Returns tenant data including logo and primary_color
 */
export async function getTenant(): Promise<TenantResponse | null> {
  try {
    console.log("🏢 [getTenant] Starting tenant fetch...");
    // Check if user is authenticated before fetching tenant
    const userToken = await secureStorage.getAccessToken();
    if (!userToken) {
     // console.log("ℹ️ [getTenant] User not authenticated - skipping tenant fetch");
      return null;
    }

   // console.log("🔐 [getTenant] User authenticated, fetching from API...");
    const response = await api.get<TenantResponse>("/tenant/");
  //  console.log("✅ Tenant fetched:", response.data);
  //  console.log("🎨 [getTenant] Full Response:", JSON.stringify(response.data, null, 2));
   // console.log("🎨 Tenant Branding - Primary (buttons/icons):", response.data.primary_color, "| Secondary (header):", response.data.secondary_color, "| Logo:", response.data.logo);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.log("ℹ️ [getTenant] Tenant endpoint not available (404)");
      return null;
    }
    console.error("❌ [getTenant] Failed to fetch tenant:", error.message);
    console.error("❌ [getTenant] Error details:", error.response?.data || error);
    return null;
  }
}
