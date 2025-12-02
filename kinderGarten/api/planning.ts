import { api } from "./api";
import { API_ENDPOINTS } from "@/config/api";

/* Events Endpoints */

/**
 * Fetch all events
 * @param filter - Filter by classroom_id or class_name (for backward compatibility)
 */
export async function getEvents(filter?: { classroom_id?: number; class_name?: number | string }) {
  // Map class_name to classroom_id for backend
  const params: any = {};
  if (filter?.classroom_id) params.classroom_id = filter.classroom_id;
  if (filter?.class_name) params.classroom_id = typeof filter.class_name === 'string' ? parseInt(filter.class_name) : filter.class_name;

  const res = await api.get(API_ENDPOINTS.PLANNING_EVENTS, {
    params: Object.keys(params).length ? params : {},
  });
  // ✅ Extract results array from paginated response
  return res.data?.results || res.data || [];
}

/**
 * Create a new event
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
  classroom_id?: number;
  class_name?: number | string;
}) {
  // Use classroom_id if provided, otherwise convert class_name
  let final_classroom_id = classroom_id;
  if (!final_classroom_id && class_name) {
    final_classroom_id = typeof class_name === 'string' ? parseInt(class_name) : class_name;
  }

  if (!final_classroom_id) {
    throw new Error("classroom_id or class_name is required");
  }

  const res = await api.post(API_ENDPOINTS.PLANNING_EVENTS, {
    title,
    date: date || new Date().toISOString().split('T')[0],
    description: description || "",
    classroom_id: final_classroom_id,
  });
  return res.data;
}

/**
 * Update an event
 * Maps class_name to classroom_id for backward compatibility
 */
export async function updateEvent(id: string, data: any) {
  // Prepare update data with proper field names
  let classroom_id_val = data.classroom_id;
  if (!classroom_id_val && data.class_name) {
    classroom_id_val = typeof data.class_name === 'string' ? parseInt(data.class_name) : data.class_name;
  }

  const updateData: any = {
    title: data.title,
    date: data.date,
    description: data.description || "",
  };

  if (classroom_id_val) {
    updateData.classroom_id = classroom_id_val;
  }

  const res = await api.put(`${API_ENDPOINTS.PLANNING_EVENTS}${id}/`, updateData);
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
 * Fetch all weekly plans
 * @param filter - Filter by classroom_id or class_name (for backward compatibility)
 */
export async function getPlans(filter?: { classroom_id?: number; class_name?: number | string }) {
  // Map class_name to classroom_id for backend
  const params: any = {};
  if (filter?.classroom_id) params.classroom_id = filter.classroom_id;
  if (filter?.class_name) params.classroom_id = typeof filter.class_name === 'string' ? parseInt(filter.class_name) : filter.class_name;

  const res = await api.get(API_ENDPOINTS.PLANNING_PLANS, {
    params: Object.keys(params).length ? params : {},
  });
  // ✅ Extract results array from paginated response
  return res.data?.results || res.data || [];
}

/**
 * Create a weekly plan
 * Backend expects week_start, week_end, and activities array
 * This function maps frontend format to backend schema
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
  // Determine classroom ID
  let final_classroom_id = classroom_id;
  if (!final_classroom_id && class_name) {
    final_classroom_id = typeof class_name === 'string' ? parseInt(class_name) : class_name;
  }

  if (!final_classroom_id) {
    throw new Error("classroom_id or class_name is required");
  }

  // If using old format (time/title/day), create single activity
  if (title || time || day) {
    const activity = {
      title: title || "",
      day: day || new Date().toLocaleDateString("en-US", { weekday: "long" }),
      time: time || "09:00",
    };
    activities = [activity];
  }

  // Default to current week if not provided
  let finalWeekStart = week_start;
  let finalWeekEnd = week_end;

  if (!finalWeekStart) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    finalWeekStart = monday.toISOString().split('T')[0];

    const friday = new Date(monday);
    friday.setDate(friday.getDate() + 4);
    finalWeekEnd = friday.toISOString().split('T')[0];
  }

  const res = await api.post(API_ENDPOINTS.PLANNING_PLANS, {
    classroom_id: final_classroom_id,
    week_start: finalWeekStart,
    week_end: finalWeekEnd,
    activities: activities || [],
  });
  return res.data;
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

  // Map week dates
  if (data.week_start) updateData.week_start = data.week_start;
  if (data.week_end) updateData.week_end = data.week_end;

  // Map activities
  if (data.activities) updateData.activities = data.activities;
  else if (data.title || data.time || data.day) {
    // Convert old format to activities array
    updateData.activities = [{
      title: data.title || "",
      day: data.day || "Monday",
      time: data.time || "09:00",
    }];
  }

  const res = await api.put(`${API_ENDPOINTS.PLANNING_PLANS}${id}/`, updateData);
  return res.data;
}

/**
 * Delete a plan
 */
export async function deletePlan(id: string) {
  const res = await api.delete(`${API_ENDPOINTS.PLANNING_PLANS}${id}/`);
  return res.data;
}
