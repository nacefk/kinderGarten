import { api } from "./api";

export async function getTodayAbsences() {
  try {
    const response = await api.get("attendance/absence/today/");
    if (Array.isArray(response.data)) return response.data;
    if (response.data && Array.isArray(response.data.results)) return response.data.results;
    return [];
  } catch (e: any) {
    if (e?.response?.status === 401) {
      return { error: "unauthorized" };
    }
    return [];
  }
}
