import { api } from "./api";
import { API_ENDPOINTS } from "@/config/api";

/**
 * 🔹 Create a daily report (supports multiple media uploads)
 * Maps frontend fields to backend API schema
 */
export async function createDailyReport(data: any) {
  const formData = new FormData();

  // Required fields
  const childId = String(Number(data.child));
  const date = data.date || new Date().toISOString().split('T')[0];

  // Get the values from either frontend or backend field names
  const meal = data.meal || data.eating || "";
  const nap = data.nap || data.sleeping || "";
  const behavior = data.behavior || data.mood || "";
  const activities = data.activities || "";
  const notes = data.notes || "";

  // Send using the backend's expected field names
  formData.append("child", childId);
  formData.append("date", date);
  formData.append("meal", meal);
  formData.append("nap", nap);
  formData.append("behavior", behavior);
  formData.append("activities", activities);
  formData.append("notes", notes);

  console.log("📤 [createDailyReport] FormData content:", {
    child: childId,
    date,
    meal,
    nap,
    behavior,
    activities,
    notes,
    mediaFilesCount: data.mediaFiles?.length || 0,
  });

  if (data.mediaFiles && data.mediaFiles.length > 0) {
    console.log("📤 [createDailyReport] Processing media files...");
    data.mediaFiles.forEach((file: any, index: number) => {
      console.log(`📤 [createDailyReport] File ${index}:`, {
        name: file.name,
        uri: file.uri,
        type: file.type,
      });
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
    console.log("📤 [createDailyReport] Posting to:", API_ENDPOINTS.REPORTS);
    const res = await api.post(API_ENDPOINTS.REPORTS, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("✅ [createDailyReport] Success:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("❌ [createDailyReport] Full error object:", error);
    console.error("❌ [createDailyReport] Error status:", error.response?.status);
    console.error("❌ [createDailyReport] Error data:", error.response?.data);
    console.error("❌ [createDailyReport] Error message:", error.message);
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
    // ✅ Extract results array from paginated response
    return res.data?.results || res.data || [];
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

/**
 * 🔹 Update an existing daily report + add new media files
 * PATCH /api/reports/{report_id}/ supports both text updates and media uploads
 */
export async function updateDailyReport(reportId: number, data: any) {
  const formData = new FormData();

  // Get the values
  const meal = data.meal || data.eating || "";
  const nap = data.nap || data.sleeping || "";
  const behavior = data.behavior || data.mood || "";
  const activities = data.activities || "";
  const notes = data.notes || "";

  // Send using the backend's expected field names
  formData.append("meal", meal);
  formData.append("nap", nap);
  formData.append("behavior", behavior);
  formData.append("activities", activities);
  formData.append("notes", notes);

  console.log("📤 [updateDailyReport] Updating report:", {
    reportId,
    meal,
    nap,
    behavior,
    activities,
    notes,
  });

  // Add new media files (those with .uri field)
  // Existing media files from API have .file field and should not be re-uploaded
  if (data.mediaFiles && data.mediaFiles.length > 0) {
    const newMediaFiles = data.mediaFiles.filter((file: any) => file.uri && !file.file);
    
    console.log("📤 [updateDailyReport] NEW media files to upload:", newMediaFiles.length);

    newMediaFiles.forEach((file: any, index: number) => {
      const type = file.type?.includes("video") ? "video/mp4" : "image/jpeg";
      formData.append("media_files", {
        uri: file.uri,
        name: file.name || `media_${index}.jpeg`,
        type,
      } as any);
    });
  }

  try {
    const res = await api.patch(`${API_ENDPOINTS.REPORTS}${reportId}/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    console.log("✅ [updateDailyReport] Report updated with media_files:", res.data.media_files?.length || 0);
    return res.data;
  } catch (error: any) {
    console.error("❌ Error updating report:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * 🔹 Delete a specific media file from a report
 * DELETE /api/reports/media/{media_id}/
 */
export async function deleteMediaFile(mediaId: number) {
  try {
    console.log("🗑️ [deleteMediaFile] Deleting media:", mediaId);
    const res = await api.delete(`${API_ENDPOINTS.REPORTS}media/${mediaId}/`);
    console.log("✅ [deleteMediaFile] Media deleted successfully");
    return res.data;
  } catch (error: any) {
    console.error("❌ [deleteMediaFile] Error deleting media:", error.response?.data || error.message);
    throw error;
  }
}
