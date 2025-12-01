import axios from "axios";
import { secureStorage } from "@/utils/secureStorage";
import { api } from "./api";
import { API_CONFIG, API_ENDPOINTS } from "@/config/api";

const API_URL = `${API_CONFIG.baseURL}${API_ENDPOINTS.CHILDREN}`;

/**
 * Helper to get auth headers
 */
async function getAuthHeaders() {
  const token = await secureStorage.getAccessToken();
  return { Authorization: `Bearer ${token}` };
}

/**
 * Fetch all children or filter by classroom or club
 */
export async function getChildren(filter: { classroom?: number; club?: number } = {}) {
  try {
    const params: any = {};

    if (filter.classroom) params.classroom = filter.classroom;
    else if (filter.club) params.club = filter.club;

    console.log("🔄 [API] getChildren called with filter:", filter);
    console.log("🔄 [API] Fetching from:", API_ENDPOINTS.CHILDREN, "with params:", params);
    const res = await api.get(API_ENDPOINTS.CHILDREN, { params });
    console.log("✅ [API] getChildren response status:", res.status);
    console.log("✅ [API] getChildren data:", res.data);
    console.log("✅ [API] getChildren count:", Array.isArray(res.data) ? res.data.length : "NOT ARRAY");
    return res.data;
  } catch (err: any) {
    console.error("❌ [API] Error fetching children:", err.message);
    console.error("❌ [API] Error response:", err.response?.data);
    throw err;
  }
}


/**
 * Fetch a single child by ID
 */
export async function getChildById(id: number | string) {
  const res = await api.get(`${API_ENDPOINTS.CHILDREN}${id}/`);
  return res.data;
}

/**
 * Create a new child
 */
export async function createChild({
  name,
  birthdate,
  parent_name,
  classroom,
  avatar,
  hasMobileApp,
  clubs = [],
}: {
  name: string;
  birthdate: string;
  parent_name: string;
  classroom?: number;
  avatar?: string;
  hasMobileApp?: boolean;
  clubs?: number[];
}) {
  const res = await api.post(API_ENDPOINTS.CHILDREN, {
    name,
    birthdate,
    parent_name,
    classroom,
    avatar,
    hasMobileApp,
    clubs,
  });

  return res.data;
}


/**
 * Update an existing child (PATCH = partial update)
 */
export async function updateChild(id: number | string, payload: Record<string, any>) {
  try {
    const res = await api.patch(`${API_ENDPOINTS.CHILDREN}${id}/`, payload);
    return res.data;
  } catch (e: any) {
    console.error("❌ Error updating child:", e.response?.data || e.message);
    throw e;
  }
}
/**
 * Fetch all classrooms (for dropdown)
 */
export async function getClassrooms() {
  const res = await api.get(API_ENDPOINTS.CHILDREN_CLASSES);
  return res.data;
}
/**
 * Upload child avatar (multipart/form-data)
 */
export async function uploadAvatar(uri: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", {
    uri,
    name: `avatar_${Date.now()}.jpg`,
    type: "image/jpeg",
  } as any);

  const res = await api.post(`${API_ENDPOINTS.CHILDREN}upload-avatar/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data.url;
}

/**
 * Delete a child by ID
 */
export async function deleteChild(id: number) {
  const res = await api.delete(`${API_ENDPOINTS.CHILDREN}${id}/`);
  return res.data;
}
/**
 * Fetch all clubs (for dropdown)
 */
export async function getClubs() {
  try {
    const res = await api.get(API_ENDPOINTS.CHILDREN_CLUBS);
    return res.data;
  } catch (e: any) {
    console.error("❌ Error fetching clubs:", e.response?.data || e.message);
    throw e;
  }
}
/**
 * Create a new club
 */
export async function createClub(name: string) {
  const res = await api.post(API_ENDPOINTS.CHILDREN_CLUBS, { name });
  return res.data;
}
/**
 * Delete a classroom by ID
 */
export async function deleteClass(id: number) {
  try {
    const res = await api.delete(`${API_ENDPOINTS.CHILDREN_CLASSES}${id}/`);
    return res.data;
  } catch (e: any) {
    console.error("❌ Error deleting class:", e.response?.data || e.message);
    throw e;
  }
}

/**
 * Delete a club by ID
 */
export async function deleteClub(id: number) {
  try {
    const res = await api.delete(`${API_ENDPOINTS.CHILDREN_CLUBS}${id}/`);
    return res.data;
  } catch (e: any) {
    console.error("❌ Error deleting club:", e.response?.data || e.message);
    throw e;
  }
}
/**
 * 🔹 Fetch the current parent's linked child (via /api/children/me/)
 */
export async function getMyChild() {
  try {
    const res = await api.get(API_ENDPOINTS.CHILDREN_ME);
    console.log("✅ /me/ response:", res.data);
    return res.data;
  } catch (err: any) {
    console.error("❌ getMyChild error:", err.response?.data || err.message);
    throw err;
  }
}
