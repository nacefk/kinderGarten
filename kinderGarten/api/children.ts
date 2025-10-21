import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.0.37:8000/api/children/";

/**
 * Fetch all children or filter by classroom ID.
 */
export async function getChildren(classroomId?: number | string) {
  const token = await AsyncStorage.getItem("access_token");

  try {
    const res = await axios.get(API_URL, {
      headers: { Authorization: `Bearer ${token}` },
      // ✅ your Django view supports both `classroom` and `classroom_id`
      params: classroomId ? { classroom: classroomId } : {},
    });
    return res.data;
  } catch (e: any) {
    console.error("❌ Error fetching children:", e.response?.data || e.message);
    throw e;
  }
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
  const token = await AsyncStorage.getItem("access_token");

  const res = await axios.post(
    API_URL,
    { name, birthdate, parent_name, classroom, avatar, hasMobileApp },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return res.data;
}

/**
 * Upload child avatar to Django (multipart/form-data)
 */
export async function uploadAvatar(uri: string): Promise<string> {
  const token = await AsyncStorage.getItem("access_token");

  const formData = new FormData();
  formData.append("file", {
    uri,
    name: `avatar_${Date.now()}.jpg`,
    type: "image/jpeg",
  } as any);

  const res = await axios.post(`${API_URL}upload-avatar/`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data.url; // Django should return { "url": "..." }
}

/**
 * Delete a child by ID
 */
export async function deleteChild(id: number) {
  const token = await AsyncStorage.getItem("access_token");

  const res = await axios.delete(`${API_URL}${id}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data;
}
export async function getChildById(id: number | string) {
  const token = await AsyncStorage.getItem("access_token");
  const res = await axios.get(`http://192.168.0.37:8000/api/children/${id}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
