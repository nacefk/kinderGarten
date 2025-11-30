import { api } from "./api";
import { API_ENDPOINTS } from "@/config/api";

/* Events Endpoints */

/**
 * Fetch all events
 */
export async function getEvents(filter?: { class_name?: number }) {
  const res = await api.get(API_ENDPOINTS.PLANNING_EVENTS, {
    params: filter || {},
  });
  return res.data;
}

/**
 * Create a new event
 */
export async function createEvent({
  title,
  date,
  description,
  class_name,
}: {
  title: string;
  date: string;
  description?: string;
  class_name: string;
}) {
  const res = await api.post(API_ENDPOINTS.PLANNING_EVENTS, {
    title,
    date,
    description,
    class_name,
  });
  return res.data;
}

/**
 * Update an event
 */
export async function updateEvent(id: string, data: any) {
  const res = await api.put(`${API_ENDPOINTS.PLANNING_EVENTS}${id}/`, data);
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
 */
export async function getPlans(filter?: { class_name?: number }) {
  const res = await api.get(API_ENDPOINTS.PLANNING_PLANS, {
    params: filter || {},
  });
  return res.data;
}

/**
 * Create a weekly plan
 */
export async function createPlan({
  time,
  title,
  day,
  class_name,
}: {
  time: string;
  title: string;
  day: string;
  class_name: string;
}) {
  const res = await api.post(API_ENDPOINTS.PLANNING_PLANS, {
    time,
    title,
    day,
    class_name,
  });
  return res.data;
}

/**
 * Update a plan
 */
export async function updatePlan(id: string, data: any) {
  const res = await api.put(`${API_ENDPOINTS.PLANNING_PLANS}${id}/`, data);
  return res.data;
}

/**
 * Delete a plan
 */
export async function deletePlan(id: string) {
  const res = await api.delete(`${API_ENDPOINTS.PLANNING_PLANS}${id}/`);
  return res.data;
}
