// Notifications module temporarily disabled
// import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { api } from "@/api/api";
import { secureStorage } from "@/utils/secureStorage";
import { Platform } from "react-native";

/**
 * Register device token with backend using Expo Push Notifications
 * CURRENTLY DISABLED - Notifications module not available
 */
export async function registerDeviceToken() {
  console.log("⚠️ Device token registration disabled");
  return null;
}

/**
 * Set up notification listeners
 * CURRENTLY DISABLED - Notifications module not available
 */
export function setupNotificationListeners() {
  console.log("⚠️ Notification listeners disabled");
  return () => {};
}

/**
 * Send a test notification
 * CURRENTLY DISABLED - Notifications module not available
 */
export async function sendTestNotification() {
  console.log("⚠️ Test notification disabled");
}

/**
 * Request permission to send notifications
 * CURRENTLY DISABLED - Notifications module not available
 */
export async function requestNotificationPermission() {
  console.log("⚠️ Notification permission request disabled");
  return false;
}

/**
 * Initialize notifications on app startup
 * Orchestrates: permissions → device token registration → listener setup
 * CURRENTLY DISABLED - Notifications module not available
 */
export async function initializeNotifications() {
  console.log("⚠️ Notifications initialization disabled");
}
