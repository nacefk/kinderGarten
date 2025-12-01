import { api } from "./api";
import { API_ENDPOINTS } from "@/config/api";

export async function getClasses() {
  try {
    console.log("🔄 [API] Fetching classes from:", API_ENDPOINTS.CLASS_LIST);
    const res = await api.get(API_ENDPOINTS.CLASS_LIST);
    console.log("✅ [API] Classes response status:", res.status);
    console.log("✅ [API] Classes data received:", res.data);
    console.log("✅ [API] Number of classes:", Array.isArray(res.data) ? res.data.length : "NOT AN ARRAY");
    return res.data;
  } catch (err: any) {
    console.error("❌ [API] Error fetching classes:", err.message);
    console.error("❌ [API] Error response:", err.response?.data);
    throw err;
  }
}

export async function createClass(name: string) {
  try {
    console.log("🔄 [API] Creating class with name:", name);
    const res = await api.post(API_ENDPOINTS.CLASS_LIST, { name });
    console.log("✅ [API] Class created:", res.data);
    return res.data;
  } catch (err: any) {
    console.error("❌ [API] Error creating class:", err.message);
    throw err;
  }
}
