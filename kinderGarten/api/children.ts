import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.0.37:8000/api/children/";

/**
 * Helper to get auth headers
 */
async function getAuthHeaders() {
  const token = await AsyncStorage.getItem("access_token");
  return { Authorization: `Bearer ${token}` };
}

/**
 * Fetch all children or filter by classroom ID.
 */
export async function getChildren(classroomId?: number | string) {
  const headers = await getAuthHeaders();

  try {
    const res = await axios.get(API_URL, {
      headers,
      params: classroomId ? { classroom: classroomId } : {},
    });
    return res.data;
  } catch (e: any) {
    console.error("❌ Error fetching children:", e.response?.data || e.message);
    throw e;
  }
}

/**
 * Fetch a single child by ID
 */
export async function getChildById(id: number | string) {
  const headers = await getAuthHeaders();
  const res = await axios.get(`${API_URL}${id}/`, { headers });
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
}: {
  name: string;
  birthdate: string;
  parent_name: string;
  classroom?: number;
  avatar?: string;
  hasMobileApp?: boolean;
}) {
  const headers = await getAuthHeaders();

  const res = await axios.post(
    API_URL,
    { name, birthdate, parent_name, classroom, avatar, hasMobileApp },
    { headers }
  );

  return res.data;
}

/**
 * Update an existing child (PATCH = partial update)
 */
export async function updateChild(
  id: number | string,
  payload: Record<string, any>
) {
  const headers = await getAuthHeaders();

  try {
    const res = await axios.patch(`${API_URL}${id}/`, payload, { headers });
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
  const token = await AsyncStorage.getItem("access_token");

  const res = await axios.get("http://192.168.0.37:8000/api/children/classes/", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data; // [{id: 1, name: "Petite Section"}, ...]
}
/**
 * Upload child avatar (multipart/form-data)
 */
export async function uploadAvatar(uri: string): Promise<string> {
  const headers = await getAuthHeaders();

  const formData = new FormData();
  formData.append("file", {
    uri,
    name: `avatar_${Date.now()}.jpg`,
    type: "image/jpeg",
  } as any);

  const res = await axios.post(`${API_URL}upload-avatar/`, formData, {
    headers: {
      ...headers,
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data.url; // Django should return { "url": "..." }
}

/**
 * Delete a child by ID
 */
export async function deleteChild(id: number) {
  const headers = await getAuthHeaders();
  const res = await axios.delete(`${API_URL}${id}/`, { headers });
  return res.data;
}
