import { api } from "@/api/api";
import { API_ENDPOINTS } from "@/config/api";
import { secureStorage } from "@/utils/secureStorage";

export async function getAttendanceForChild(childId: number) {
  const token = await secureStorage.getAccessToken();
  if (!token) throw new Error("No access token");
  const res = await api.get(API_ENDPOINTS.ATTENDANCE, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const attendanceArray = Array.isArray(res.data)
    ? res.data
    : Array.isArray(res.data.results)
    ? res.data.results
    : [];
  return attendanceArray.find((record: any) => record.child === childId) || null;
}
