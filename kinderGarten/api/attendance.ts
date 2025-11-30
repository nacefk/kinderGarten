import { api } from "./api";
import { API_ENDPOINTS } from "@/config/api";
import { withRetry } from "@/utils/apiRetry";

/** Summary */
export async function getAttendanceSummary() {
  return withRetry(() => api.get(API_ENDPOINTS.ATTENDANCE_SUMMARY));
}

/** Pending extra-hours (for admin) */
export async function getPendingExtraHours() {
  return withRetry(() => api.get(API_ENDPOINTS.ATTENDANCE_EXTRA));
}

/** Save attendance (presence screen) */
export async function saveAttendanceRecords(records: any[]) {
  return withRetry(() =>
    api.post(API_ENDPOINTS.ATTENDANCE_UPDATE, { records })
  );
}

/** Parent: request extra hours */
export async function requestExtraHour(payload: {
  child: number;
  start: string;
  end: string;
}) {
  return withRetry(() =>
    api.post(`${API_ENDPOINTS.ATTENDANCE_EXTRA}request/`, payload)
  );
}

/** Admin: approve / reject extra hour */
export async function handleExtraHourAction(id: number, action: "approve" | "reject") {
  return withRetry(() =>
    api.post(`${API_ENDPOINTS.ATTENDANCE_EXTRA}${id}/action/`, { action })
  );
}

// Optional helpers
export async function approveExtraHour(id: number) {
  return handleExtraHourAction(id, "approve");
}

export async function rejectExtraHour(id: number) {
  return handleExtraHourAction(id, "reject");
}
