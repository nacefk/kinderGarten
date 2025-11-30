import { api } from "./api";
import { API_ENDPOINTS } from "@/config/api";

/**
 * 🔹 Create a daily report (supports multiple media uploads)
 */
export async function createDailyReport(data: any) {
  const formData = new FormData();

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

  try {
    const res = await api.post(API_ENDPOINTS.REPORTS, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
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
  const params: any = {};
  if (childId) params.child = childId;

  try {
    const res = await api.get(API_ENDPOINTS.REPORTS, { params });
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
  const res = await api.get(`${API_ENDPOINTS.REPORTS}${reportId}/`);
  return res.data;
}
