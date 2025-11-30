import Constants from "expo-constants";

// Centralized API configuration
const ENV = __DEV__ ? "development" : "production";

const API_CONFIGS = {
  development: {
    baseURL: "http://localhost:8000/api/",
    timeout: 10000,
  },
  production: {
    baseURL: Constants.expoConfig?.extra?.apiUrl || "https://api.yourdomain.com/api/",
    timeout: 15000,
  },
};

export const API_CONFIG = API_CONFIGS[ENV];

export const API_ENDPOINTS = {
  CHILDREN: "children/",
  CHILDREN_ME: "children/me/",
  CHILDREN_CLASSES: "children/classes/",
  CHILDREN_CLUBS: "children/clubs/",
  CHAT_CONVERSATIONS: "chat/conversations/",
  CHAT_MESSAGES: "chat/messages/",
  CLASS_LIST: "children/classes/",
  ATTENDANCE: "attendance/",
  ATTENDANCE_SUMMARY: "attendance/summary/",
  ATTENDANCE_EXTRA: "attendance/extra/",
  ATTENDANCE_UPDATE: "attendance/update/",
  ATTENDANCE_REALTIME: "attendance/realtime/",
  PLANNING_EVENTS: "planning/events/",
  PLANNING_PLANS: "planning/plans/",
  REPORTS: "reports/",
  AUTH_LOGIN: "accounts/login/",
  AUTH_REFRESH: "accounts/refresh/",
};

// Validate HTTPS in production
if (!__DEV__ && !API_CONFIG.baseURL.startsWith("https")) {
  console.warn("⚠️ WARNING: API_URL should use HTTPS in production");
}
