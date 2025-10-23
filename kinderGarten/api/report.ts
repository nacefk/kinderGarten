import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.0.37:8000/api/reports/";

/**
 * Create a daily report (supports media upload)
 */
export async function createDailyReport(reportData: any) {
  const token = await AsyncStorage.getItem("access_token");
  const isFormData = reportData instanceof FormData;

  try {
    const res = await axios.post("http://192.168.0.37:8000/api/reports/", reportData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": isFormData ? "multipart/form-data" : "application/json",
      },
    });
    return res.data;
  } catch (error: any) {
    console.error("❌ Error creating report:", error.response?.data || error.message);
    throw error;
  }
}


/**
 * Get all reports or by child
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
 * Get single report by ID
 */
export async function getReportById(reportId: number) {
  const token = await AsyncStorage.getItem("access_token");
  const res = await axios.get(`${API_URL}${reportId}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
