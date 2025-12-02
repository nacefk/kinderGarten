import { api } from "./api";
import { API_ENDPOINTS } from "@/config/api";
import { withRetry } from "@/utils/apiRetry";

/** Summary */
export async function getAttendanceSummary() {
  const response = await withRetry(() => api.get(API_ENDPOINTS.ATTENDANCE_SUMMARY));
  return response.data;
}

/** Pending extra-hours (for admin) */
export async function getPendingExtraHours() {
  try {
    const response = await withRetry(() => api.get(API_ENDPOINTS.ATTENDANCE_EXTRA));
    return response.data;
  } catch (error: any) {
    // If 403 Forbidden, return empty array instead of crashing
    if (error.response?.status === 403) {
      console.warn("⚠️ Permission denied for attendance/extra - returning empty array");
      return { results: [] };
    }
    // Re-throw other errors
    throw error;
  }
}

/** Save attendance (presence screen) */
export async function saveAttendanceRecords(records: any[]) {
  const response = await withRetry(() =>
    api.post(API_ENDPOINTS.ATTENDANCE_UPDATE, { records })
  );
  return response.data;
}

/** Parent: request extra hours */
export async function requestExtraHour(payload: {
  child: number;
  start?: string;
  end?: string;
  date?: string;
  hours?: number;
}) {
  // Convert ISO datetime strings to date and hours
  let date = payload.date;
  let hours = payload.hours;

  if (!date && payload.start) {
    try {
      // Extract date from ISO datetime string (e.g., "2024-01-15T09:00:00")
      date = payload.start.split('T')[0];
    } catch (e) {
      throw new Error("Invalid start datetime format. Expected ISO format (YYYY-MM-DDTHH:mm:ss)");
    }
  }

  if (!hours && payload.start && payload.end) {
    try {
      // Parse ISO datetimes and calculate duration in hours
      const startTime = new Date(payload.start);
      const endTime = new Date(payload.end);

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        throw new Error("Invalid datetime format");
      }

      const durationMs = endTime.getTime() - startTime.getTime();
      if (durationMs <= 0) {
        throw new Error("End time must be after start time");
      }

      hours = Math.round((durationMs / (1000 * 60 * 60)) * 10) / 10; // Round to 0.1 hours
    } catch (e) {
      throw new Error(`Failed to calculate hours: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }

  if (!date || hours === undefined || hours <= 0) {
    throw new Error("date and positive hours are required (or start/end datetime strings)");
  }

  const response = await withRetry(() =>
    api.post(`${API_ENDPOINTS.ATTENDANCE_EXTRA}request/`, {
      child: payload.child,
      date,
      hours,
    })
  );
  return response.data;
}

/** Admin: approve / reject extra hour */
export async function handleExtraHourAction(id: number, action: "approve" | "reject") {
  const response = await withRetry(() =>
    api.post(`${API_ENDPOINTS.ATTENDANCE_EXTRA}${id}/action/`, { action })
  );
  return response.data;
}

// Optional helpers
export async function approveExtraHour(id: number) {
  return handleExtraHourAction(id, "approve");
}

export async function rejectExtraHour(id: number) {
  return handleExtraHourAction(id, "reject");
}
