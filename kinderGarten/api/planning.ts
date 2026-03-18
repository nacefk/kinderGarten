import { api } from "./api";
import { API_ENDPOINTS } from "@/config/api";

/* Events Endpoints */

/**
 * Fetch all events
 * @param filter - Filter by classroom (classroom ID)
 */
export async function getEvents(filter?: { classroom?: number }) {
  const params: any = {};
  if (filter?.classroom) params.classroom = filter.classroom;

// console.log("🔍 getEvents called with params:", params);
  const res = await api.get(API_ENDPOINTS.PLANNING_EVENTS, {
    params: Object.keys(params).length ? params : {},
  });
// console.log("📊 getEvents response:", res.data);

  let results = res.data?.results || res.data || [];

  // Frontend filtering if backend doesn't support it
  if (filter?.classroom) {
    results = results.filter((event: any) => {
      const eventClassId = event.classroom_detail?.id || event.classroom_id;
      return eventClassId === filter.classroom;
    });
 // console.log("✅ Filtered events for classroom", filter.classroom, ":", results.length, "events");
  }

  // ✅ Extract results array from paginated response
  return results;
}

/**
 * Create a new event
 * If classroom_id is -1 (all classes), don't send classroom_id
 * Supports both classroom_id and class_name for backward compatibility
 */
export async function createEvent({
  title,
  date,
  description,
  classroom_id,
  class_name,
}: {
  title: string;
  date: string;
  description?: string;
  classroom_id?: number | null;
  class_name?: number | string;
}) {
  let final_classroom_id = classroom_id;
  if (final_classroom_id === undefined && class_name) {
    final_classroom_id = typeof class_name === 'string' ? parseInt(class_name) : class_name;
  }

  const payload: any = {
    title,
    date: date || new Date().toISOString().split('T')[0],
    description: description || "",
  };

  // Only send classroom_id if it's not -1 (all classes)
  if (final_classroom_id && final_classroom_id !== -1) {
    payload.classroom_id = final_classroom_id;
  }

  const res = await api.post(API_ENDPOINTS.PLANNING_EVENTS, payload);
  return res.data;
}

/**
 * Update an event
 * Send the classroom_id when updating
 * Maps class_name to classroom_id for backward compatibility
 */
export async function updateEvent(id: string, data: any) {
  let classroom_id_val = data.classroom_id;
  if (!classroom_id_val && data.class_name) {
    classroom_id_val = typeof data.class_name === 'string' ? parseInt(data.class_name) : data.class_name;
  }

  const updateData: any = {
    title: data.title,
    date: data.date,
    description: data.description || "",
  };

  // Send classroom_id only if it's not -1 (all classes)
  if (classroom_id_val && classroom_id_val !== -1) {
    updateData.classroom_id = classroom_id_val;
  }

  const res = await api.patch(`${API_ENDPOINTS.PLANNING_EVENTS}${id}/`, updateData);
  return res.data;
}

/**
 * Delete an event
 */
export async function deleteEvent(id: string) {
  const res = await api.delete(`${API_ENDPOINTS.PLANNING_EVENTS}${id}/`);
  return res.data;
}

/* Weekly Plans Endpoints */

/**
 * Convert French day name + start time + end time to ISO datetimes
 */
function dayAndTimeToISO(dayName: string, timeString: string, endTimeString?: string): { starts_at: string; ends_at: string } {
  // Map French day names to offsets (Monday = 0)
  const dayMap: Record<string, number> = {
    "Lundi": 0,
    "Mardi": 1,
    "Mercredi": 2,
    "Jeudi": 3,
    "Vendredi": 4,
    "Samedi": 5,
    "Dimanche": 6,
  };

  // Get this week's Monday
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));

  // Get the target day
  const dayOffset = dayMap[dayName] || 0;
  const targetDate = new Date(monday);
  targetDate.setDate(targetDate.getDate() + dayOffset);

  // Parse start time (HH:mm)
  const [hours, minutes] = timeString.split(":").map(Number);

  // Create start datetime
  const startDate = new Date(targetDate);
  startDate.setHours(hours, minutes, 0, 0);
  const starts_at = startDate.toISOString();

  // Parse end time (HH:mm) if provided, otherwise default to 1 hour after start
  let endDate: Date;
  if (endTimeString) {
    const [endHours, endMinutes] = endTimeString.split(":").map(Number);
    endDate = new Date(targetDate);
    endDate.setHours(endHours, endMinutes, 0, 0);
  } else {
    endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);
  }
  const ends_at = endDate.toISOString();

  return { starts_at, ends_at };
}

/**
 * Convert ISO datetime back to time string
 */
function isoToTime(isoString: string): string {
  const date = new Date(isoString);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Convert ISO datetime to French day name
 */
function isoToDay(isoString: string): string {
  const date = new Date(isoString);
  const dayNum = date.getDay();
  const dayMap = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  return dayMap[dayNum];
}

/**
 * Fetch all weekly plans
 * @param filter - Filter by classroom (classroom ID)
 */
export async function getPlans(filter?: { classroom?: number }) {
  const params: any = {};
  if (filter?.classroom) params.classroom = filter.classroom;

  const res = await api.get(API_ENDPOINTS.PLANNING_PLANS, {
    params: Object.keys(params).length ? params : {},
  });
  // ✅ Extract results array from paginated response
  return res.data?.results || res.data || [];
}

/**
 * Create a weekly plan
 * Backend expects activities with starts_at and ends_at ISO datetimes
 */
export async function createPlan({
  time,
  title,
  day,
  class_name,
  classroom_id,
  week_start,
  week_end,
  activities,
}: {
  time?: string;
  title?: string;
  day?: string;
  class_name?: number | string;
  classroom_id?: number;
  week_start?: string;
  week_end?: string;
  activities?: any[];
}) {
  console.log("🔍 createPlan received:", { time, title, day, class_name, classroom_id, week_start, week_end, activities });

  // Determine classroom ID
  let final_classroom_id = classroom_id;
  if (!final_classroom_id && class_name) {
    final_classroom_id = typeof class_name === 'string' ? parseInt(class_name) : class_name;
  }

  if (!final_classroom_id) {
    throw new Error("classroom_id or class_name is required");
  }

  // Initialize activities array
  let finalActivities: any[] = [];

  // If using old format (time/title/day), create single activity
  if (title?.trim() || time || day) {
    // Validate that we have at least a title
    if (!title?.trim()) {
      throw new Error("Activity title is required");
    }
    const activityDay = day || new Date().toLocaleDateString("en-US", { weekday: "long" });
    const activityTime = time || "09:00";
    // endTime might come from activities array or as a separate parameter
    const activityEndTime = activities?.[0]?.endTime;
    const { starts_at, ends_at } = dayAndTimeToISO(activityDay, activityTime, activityEndTime);

    const activity = {
      title: title.trim(),
      starts_at,
      ends_at,
    };
    finalActivities = [activity];
    console.log("📦 Created activity from old format:", activity);
  }
  // If new format with activities array provided
  else if (Array.isArray(activities) && activities.length > 0) {
    // Validate each activity has required fields
    finalActivities = activities.map((activity, index) => {
      if (!activity.title?.trim()) {
        throw new Error(`Activity ${index + 1}: title is required`);
      }
      // If activity has day/time (old format), convert to ISO
      if (activity.day && activity.time) {
        const { starts_at, ends_at } = dayAndTimeToISO(activity.day, activity.time, activity.endTime);
        return {
          title: activity.title.trim(),
          starts_at,
          ends_at,
        };
      }
      // If activity already has ISO dates, use them
      if (activity.starts_at && activity.ends_at) {
        if (!activity.starts_at) {
          throw new Error(`Activity ${index + 1}: starts_at is required`);
        }
        if (!activity.ends_at) {
          throw new Error(`Activity ${index + 1}: ends_at is required`);
        }
        return {
          title: activity.title.trim(),
          starts_at: activity.starts_at,
          ends_at: activity.ends_at,
        };
      }
      throw new Error(`Activity ${index + 1}: must have either (day + time) or (starts_at + ends_at)`);
    });
    console.log("📦 Validated activities from array:", finalActivities);
  }
  // If no activities provided at all, throw error
  else {
    throw new Error("At least one activity with title is required");
  }

  const requestPayload: any = {
    classroom_id: final_classroom_id,
    activities: finalActivities,
  };

  // Add title to payload if provided (backend might require it)
  if (title?.trim()) {
    requestPayload.title = title.trim();
  }

  console.log("🚀 Sending to backend:", JSON.stringify(requestPayload, null, 2));

  try {
    const res = await api.post(API_ENDPOINTS.PLANNING_PLANS, requestPayload);
    console.log("✅ Backend response:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("❌ API Error Details:", {
      status: error.response?.status,
      data: error.response?.data,
      payload: requestPayload,
    });
    throw error;
  }
}

/**
 * Update a plan
 * Maps old format to backend schema if needed
 */
export async function updatePlan(id: string, data: any) {
  // Prepare update data with proper field names
  const updateData: any = {};

  // Map classroom references
  if (data.classroom_id) updateData.classroom_id = data.classroom_id;
  if (data.class_name) {
    updateData.classroom_id = typeof data.class_name === 'string' ? parseInt(data.class_name) : data.class_name;
  }

  // Add title if provided
  if (data.title?.trim()) {
    updateData.title = data.title.trim();
  }

  // Map activities with validation
  let finalActivities: any[] = [];

  if (data.activities && Array.isArray(data.activities) && data.activities.length > 0) {
    // Validate each activity has required fields
    finalActivities = data.activities.map((activity: any, index: number) => {
      if (!activity.title?.trim()) {
        throw new Error(`Activity ${index + 1}: title is required`);
      }
      // If activity has day/time (old format), convert to ISO
      if (activity.day && activity.time) {
        const { starts_at, ends_at } = dayAndTimeToISO(activity.day, activity.time, activity.endTime);
        return {
          title: activity.title.trim(),
          starts_at,
          ends_at,
        };
      }
      // If activity already has ISO dates, use them
      if (activity.starts_at && activity.ends_at) {
        return {
          title: activity.title.trim(),
          starts_at: activity.starts_at,
          ends_at: activity.ends_at,
        };
      }
      throw new Error(`Activity ${index + 1}: must have either (day + time) or (starts_at + ends_at)`);
    });
    updateData.activities = finalActivities;
  } else if (data.title?.trim() || data.time || data.day) {
    // Convert old format to activities array
    if (!data.title?.trim()) {
      throw new Error("Activity title is required");
    }
    const activityDay = data.day || "Lundi";
    const activityTime = data.time || "09:00";
    const activityEndTime = data.endTime;
    const { starts_at, ends_at } = dayAndTimeToISO(activityDay, activityTime, activityEndTime);

    updateData.activities = [{
      title: data.title.trim(),
      starts_at,
      ends_at,
    }];
  } else {
    throw new Error("At least one activity with title is required");
  }

  console.log("🚀 Updating plan with:", JSON.stringify(updateData, null, 2));

  try {
    const res = await api.put(`${API_ENDPOINTS.PLANNING_PLANS}${id}/`, updateData);
    console.log("✅ Update response:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("❌ Update Error Details:", {
      status: error.response?.status,
      data: error.response?.data,
      payload: updateData,
    });
    throw error;
  }
}

/**
 * Delete a plan
 */
export async function deletePlan(id: string) {
  const res = await api.delete(`${API_ENDPOINTS.PLANNING_PLANS}${id}/`);
  return res.data;
}
