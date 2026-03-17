import { api } from "./api";

export async function getTodayAbsences() {
  const response = await api.get("attendance/absence/today/");
  try {
    const response = await api.get("attendance/absence/today/");
    if (Array.isArray(response.data)) return response.data;
    if (response.data && Array.isArray(response.data.results)) return response.data.results;
    return [];
  } catch (e: any) {
    if (e?.response?.status === 401) {
      return { error: "unauthorized" };
    }
    // If 404, backend route does not exist or is not implemented
    // Always return [] to avoid .length/.map errors
    return [];
  }
}
