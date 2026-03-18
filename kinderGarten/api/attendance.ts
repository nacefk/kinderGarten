/** Parent: get all extra hour requests for their children */
export async function getMyExtraHourRequests() {
 // console.log('[getMyExtraHourRequests] Fetching parent requests...');
  try {
    const response = await withRetry(() =>
      api.get("attendance/my-requests/")
    );
   // console.log('[getMyExtraHourRequests] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[getMyExtraHourRequests] Error:', error.message);
    throw error;
  }
}
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
  duration: number;
}) {
  // Send only child and duration as per new API contract
  console.log('[requestExtraHour] Payload sent:', payload);
  const response = await withRetry(() =>
    api.post("attendance/extra-hours/", {
      child: payload.child,
      duration: payload.duration,
    })
  );
  return response.data;
}

/** Admin: approve / reject extra hour */
export async function handleExtraHourAction(id: number, action: "approve" | "reject") {
  // Map to backend expected values
  const backendAction = action === "approve" ? "approved" : "rejected";
  const response = await withRetry(() =>
    api.post(`${API_ENDPOINTS.ATTENDANCE_EXTRA}${id}/action/`, { action: backendAction })
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

/** Get all extra hours (for admin) - ordered by date/time, optionally filtered by search */
export async function getAllExtraHours(search?: string) {
  try {
    const params = search ? { search } : {};
    const response = await withRetry(() =>
      api.get(API_ENDPOINTS.ATTENDANCE_EXTRA_HOURS, { params })
    );
    console.log('[getAllExtraHours] Full response:', response.data);
    // Return the data as-is, sorting happens on client side
    return response.data;
  } catch (error: any) {
    // If 403 Forbidden, return empty array instead of crashing
    if (error.response?.status === 403) {
      console.warn("⚠️ Permission denied for attendance/extra-hours - returning empty array");
      return [];
    }
    // Re-throw other errors
    throw error;
  }
}

/** Get today's extra hour requests (for dashboard) */
export async function getTodayExtraHours() {
  try {
    const response = await withRetry(() =>
      api.get(API_ENDPOINTS.ATTENDANCE_EXTRA_HOURS)
    );

// console.log('[getTodayExtraHours] Full response:', response.data);

    // Get today's date in local timezone (YYYY-MM-DD format)
    const today = new Date();
    const todayFormatted = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');

    let items: any[] = [];

    if (Array.isArray(response.data)) {
      items = response.data;
    } else if (response.data && typeof response.data === "object") {
      const results = (response.data as any).results || (response.data as any).data || [];
      items = Array.isArray(results) ? results : [];
    }

   // console.log('[getTodayExtraHours] Parsed items:', items);
    // console.log('[getTodayExtraHours] Today date:', todayFormatted);

    // Filter by today's date - check multiple possible date fields
    const todayItems = items.filter(item => {
      // Try different possible date field names from the API
      let itemDate = item.created_at ||
                     item.date ||
                     item.request_date ||
                     item.createdAt ||
                     (item.timestamp ? item.timestamp.split('T')[0] : null);

      // Extract just the date part from ISO timestamp (YYYY-MM-DD)
      if (itemDate && typeof itemDate === 'string') {
        itemDate = itemDate.split('T')[0]; // Remove time and timezone
      }

      if (!itemDate) {
        // console.log('[getTodayExtraHours] Item has no date field:', item);
        return true; // Include items with no date as fallback
      }

      const dateStr = itemDate;
      const matches = dateStr === todayFormatted;
      // console.log('[getTodayExtraHours] Item date:', dateStr, 'matches today:', matches);
      return matches;
    });

    // console.log('[getTodayExtraHours] Filtered items count:', todayItems.length);

    // Return in same format as input
    if (Array.isArray(response.data)) {
      return todayItems;
    } else {
      return todayItems;
    }
  } catch (error: any) {
    // If 403 Forbidden, return empty array instead of crashing
    if (error.response?.status === 403) {
      console.warn("⚠️ Permission denied for attendance/extra-hours - returning empty array");
      return [];
    }
    // Re-throw other errors
    throw error;
  }
}
