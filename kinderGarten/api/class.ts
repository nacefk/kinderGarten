import { api } from "./api";
import { API_ENDPOINTS } from "@/config/api";

export async function getClasses() {
  const res = await api.get(API_ENDPOINTS.CLASS_LIST);
  return res.data;
}

export async function createClass(name: string) {
  const res = await api.post(API_ENDPOINTS.CLASS_LIST, { name });
  return res.data;
}
