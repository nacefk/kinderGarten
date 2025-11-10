import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.0.37:8000/api/reports/";

/**
 * 🔹 Create a daily report (supports multiple media uploads)
 */
export async function createDailyReport(data: any) {
  const token = await AsyncStorage.getItem("access_token");

  const formData = new FormData();

  // ✅ Explicitly send numeric child ID as stringified number
  formData.append("child", String(Number(data.child)));
  formData.append("meal", data.meal || "");
  formData.append("nap", data.nap || "");
  formData.append("behavior", data.behavior || "");
  formData.append("notes", data.notes || "");

  if (data.mediaFiles && data.mediaFiles.length > 0) {
    data.mediaFiles.forEach((file: any, index: number) => {
      const type = file.type?.includes("video") ? "video/mp4" : "image/jpeg";
      const name = file.name || `media_${index}.${type.split("/")[1]}`;

      formData.append("media_files", {
        uri: file.uri,
        type,
        name,
      } as any);
    });
  }

  // 🧩 Debug log: show exactly what’s being sent
  for (const [key, value] of formData.entries()) {
    console.log("🧩", key, value);
  }

  try {
    const res = await axios.post(API_URL, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        // ⚠️ Do NOT set Content-Type manually — Axios handles the multipart boundary for FormData
      },
      transformRequest: (data) => data, // prevent axios from stringifying FormData
    });

    return res.data;
  } catch (error: any) {
    console.error("❌ Error creating report:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * 🔹 Get all reports or filter by child
 */
export async function getReports(childId?: number) {
  const token = await AsyncStorage.getItem("access_token");
  const params: any = {};
  if (childId) params.child = childId;

  try {
    const res = await axios.get(API_URL, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return res.data;
  } catch (error: any) {
    console.error("❌ Error fetching reports:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * 🔹 Get a single report by ID
 */
export async function getReportById(reportId: number) {
  const token = await AsyncStorage.getItem("access_token");
  const res = await axios.get(`${API_URL}${reportId}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
