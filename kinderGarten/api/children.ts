import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.0.37:8000/api/children/";

export async function getChildren(classroomId?: string) {
  const token = await AsyncStorage.getItem("access_token");
  const res = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
    params: classroomId ? { classroom_id: classroomId } : {},
  });
  return res.data;
}

export async function createChild({
  name,
  birthdate,
  parent_name,
  classroom,
  avatar,
}: {
  birthdate: string;
  name: string;
  parent_name: string;
  classroom?: number;
  avatar?: string;
}) {
  const token = await AsyncStorage.getItem("access_token");
  const res = await axios.post(
    API_URL,
    { name, birthdate, parent_name, classroom, avatar },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}
export async function uploadAvatar(uri: string): Promise<string> {
  const token = await AsyncStorage.getItem("access_token");

  // Prepare multipart form data for Django
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

  return res.data.url; // ✅ Django returns { "url": "https://..." }
}
export async function deleteChild(id: number) {
  const token = await AsyncStorage.getItem("access_token");
  const res = await axios.delete(`${API_URL}${id}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
