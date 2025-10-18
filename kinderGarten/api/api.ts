import axios from "axios";

// ✅ Replace with your LAN IP (from ifconfig)
const API_URL = "http://192.168.0.37:8000/api/";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// ✅ Optional: helper to attach token later
export const setAuthToken = (token?: string) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};
