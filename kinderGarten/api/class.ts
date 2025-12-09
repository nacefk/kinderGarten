import { api } from "./api";
import { API_ENDPOINTS } from "@/config/api";

export async function getClasses() {
  try {
const res = await api.get(API_ENDPOINTS.CLASS_LIST);
    // ✅ Extract results array from paginated response
    return res.data?.results || res.data || [];
  } catch (err: any) {
    console.error("❌ [API] Error fetching classes:", err.message);
    console.error("❌ [API] Error response:", err.response?.data);
    throw err;
  }
}

export async function createClass(name: string) {
  try {
const res = await api.post(API_ENDPOINTS.CLASS_LIST, { name });
return res.data;
  } catch (err: any) {
    console.error("❌ [API] Error creating class:", err.message);
    throw err;
  }
}
