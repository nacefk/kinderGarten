import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 👇 Update to your Django base URL (same as your children API)
const BASE_URL = "http://192.168.0.37:8000/api/planning/";

/**
 * Helper to get authenticated headers
 */
async function getAuthHeaders() {
  const token = await AsyncStorage.getItem("access_token");
  return {
    Authorization: `Bearer ${token}`,
  };
}

/* -------------------------------
   EVENTS ENDPOINTS
-------------------------------- */

/**
 * Fetch all events
 */
export async function getEvents(filter?: { class_name?: number }) {
  const headers = await getAuthHeaders();
  const res = await axios.get(`${BASE_URL}events/`, {
    headers,
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
  const headers = await getAuthHeaders();
  const res = await axios.post(
    `${BASE_URL}events/`,
    { title, date, description, class_name },
    { headers }
  );
  return res.data;
}

/**
 * Update an event
 */
export async function updateEvent(id: string, data: any) {
  const headers = await getAuthHeaders();
  const res = await axios.put(`${BASE_URL}events/${id}/`, data, { headers });
  return res.data;
}

/**
 * Delete an event
 */
export async function deleteEvent(id: string) {
  const headers = await getAuthHeaders();
  const res = await axios.delete(`${BASE_URL}events/${id}/`, { headers });
  return res.data;
}

/* -------------------------------
   WEEKLY PLANS ENDPOINTS
-------------------------------- */

/**
 * Fetch all weekly plans
 */
export async function getPlans(filter?: { class_name?: number }) {
  const headers = await getAuthHeaders();
  const res = await axios.get(`${BASE_URL}plans/`, {
    headers,
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
  const headers = await getAuthHeaders();
  const res = await axios.post(
    `${BASE_URL}plans/`,
    { time, title, day, class_name },
    { headers }
  );
  return res.data;
}

/**
 * Update a plan
 */
export async function updatePlan(id: string, data: any) {
  const headers = await getAuthHeaders();
  const res = await axios.put(`${BASE_URL}plans/${id}/`, data, { headers });
  return res.data;
}

/**
 * Delete a plan
 */
export async function deletePlan(id: string) {
  const headers = await getAuthHeaders();
  const res = await axios.delete(`${BASE_URL}plans/${id}/`, { headers });
  return res.data;
}
