/**
 * App initialization - Call this in your app's entry point (_layout.tsx)
 */

import { registerDeviceToken, setupNotificationListeners } from "@/utils/notifications";

export async function initializeNotifications() {
  try {
    console.log("🚀 Initializing notifications...");

    // Register device token
    const token = await registerDeviceToken();
    if (token) {
      console.log("✅ Device registered for push notifications");
    } else {
      console.log("⚠️ Device not registered (may not be a physical device)");
    }

    // Set up listeners for incoming notifications
    const unsubscribe = setupNotificationListeners();
    console.log("✅ Notification listeners set up");

    return unsubscribe;
  } catch (error) {
    console.error("❌ Failed to initialize notifications:", error);
  }
}
