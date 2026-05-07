import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { api } from "@/api/api";
import { Platform } from "react-native";
import { router } from "expo-router";

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request permission to send notifications
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn("⚠️ Push notifications only work on physical devices");
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("⚠️ Notification permission not granted");
    return false;
  }

  // Android needs a notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });

    await Notifications.setNotificationChannelAsync("messages", {
      name: "Messages",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });

    await Notifications.setNotificationChannelAsync("events", {
      name: "Events",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  return true;
}

/**
 * Get the native FCM token (Android) or APNs token (iOS)
 * This token is sent directly via Firebase Cloud Messaging
 */
export async function getDeviceToken(): Promise<string | null> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return null;

    // getDevicePushTokenAsync returns the native FCM/APNs token
    const { data: token } = await Notifications.getDevicePushTokenAsync();

    console.log(
      `📱 Device Push Token (${Platform.OS === "android" ? "FCM" : "APNs"}):`,
      token
    );

    return token;
  } catch (error) {
    console.error("❌ Failed to get device token:", error);
    return null;
  }
}

/**
 * Register device token with backend for Firebase Cloud Messaging
 */
export async function registerDeviceToken(): Promise<string | null> {
  try {
    const token = await getDeviceToken();
    if (!token) return null;

    // Send token to backend — backend uses this to send FCM notifications
    await api.post("notifications/register-device/", {
      token,
      platform: Platform.OS,
      token_type: Platform.OS === "android" ? "fcm" : "apns",
    });

    console.log("✅ Device token registered with backend");
    return token;
  } catch (error: any) {
    // 404 means the endpoint isn't deployed yet — not an error
    if (error?.response?.status === 404) {
      console.warn("⚠️ /api/notifications/register-device/ not available yet (backend Phase 2 pending)");
    } else {
      console.error("❌ Failed to register device token:", error);
    }
    return null;
  }
}

/**
 * Set up notification listeners
 * Returns a cleanup function to remove listeners
 */
export function setupNotificationListeners() {
  // When a notification is received while app is foregrounded
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      const { title, body, data } = notification.request.content;
      console.log("📩 Notification received:", { title, body, data });
    }
  );

  // When user taps on a notification
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log("👆 Notification tapped, data:", data);

      // Navigate based on notification type
      if (data?.type === "message" && data?.conversation_id) {
        router.push(`/(chat)/${data.conversation_id}` as any);
      } else if (data?.type === "event") {
        router.push("/(adminTabs)/calendar" as any);
      } else if (data?.type === "request") {
        router.push("/(adminTabs)/dashboard" as any);
      } else if (data?.screen) {
        router.push(data.screen as any);
      }
    });

  // Listen for token refresh (FCM can rotate tokens)
  const tokenSubscription = Notifications.addPushTokenListener((newToken) => {
    console.log("🔄 Push token refreshed:", newToken.data);
    // Re-register with backend
    api
      .post("notifications/register-device/", {
        token: newToken.data,
        platform: Platform.OS,
        token_type: Platform.OS === "android" ? "fcm" : "apns",
      })
      .catch((err) => console.error("❌ Failed to update token:", err));
  });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
    tokenSubscription.remove();
  };
}

/**
 * Send a local test notification (for debugging)
 */
export async function sendTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Test Notification 🎉",
      body: "Notifications are working!",
      data: { screen: "/home" },
    },
    trigger: null, // Send immediately
  });
}

/**
 * Initialize notifications on app startup
 */
export async function initializeNotifications() {
  const token = await registerDeviceToken();
  if (token) {
    setupNotificationListeners();
    console.log("✅ Notifications initialized");
  }
}
