import { api } from "./api";
import { API_ENDPOINTS } from "@/config/api";

/**
 * Send notification to specific user(s)
 */
export async function sendNotification({
  recipients, // User IDs or "all"
  title,
  body,
  data = {},
}: {
  recipients: number[] | "all";
  title: string;
  body: string;
  data?: Record<string, any>;
}) {
  try {
    console.log("📤 Sending notification:", { recipients, title, body, data });

    const res = await api.post("/api/notifications/send/", {
      recipients: recipients === "all" ? "all" : recipients,
      title,
      body,
      data,
    });

    console.log("✅ Notification sent:", res.data);
    return res.data;
  } catch (error) {
    console.error("❌ Failed to send notification:", error);
    throw error;
  }
}

/**
 * Send notification to a classroom
 */
export async function sendClassroomNotification({
  classroom_id,
  title,
  body,
  data = {},
}: {
  classroom_id: number;
  title: string;
  body: string;
  data?: Record<string, any>;
}) {
  try {
    console.log("📤 Sending classroom notification:", { classroom_id, title, body });

    const res = await api.post("/api/notifications/send/", {
      recipients: "classroom",
      classroom_id,
      title,
      body,
      data,
    });

    console.log("✅ Classroom notification sent:", res.data);
    return res.data;
  } catch (error) {
    console.error("❌ Failed to send classroom notification:", error);
    throw error;
  }
}

/**
 * Send announcement to all parents
 */
export async function sendAnnouncementToParents({
  title,
  body,
  data = {},
}: {
  title: string;
  body: string;
  data?: Record<string, any>;
}) {
  try {
    console.log("📤 Sending announcement to parents:", { title, body });

    const res = await api.post("/api/notifications/send/", {
      recipients: "parents",
      title,
      body,
      data,
    });

    console.log("✅ Parent announcement sent:", res.data);
    return res.data;
  } catch (error) {
    console.error("❌ Failed to send parent announcement:", error);
    throw error;
  }
}

/**
 * Fetch user's notification history
 */
export async function getNotificationHistory(limit: number = 20) {
  try {
    const res = await api.get("/api/notifications/", {
      params: { limit },
    });

    console.log("✅ Notifications fetched:", res.data);
    return res.data?.results || res.data || [];
  } catch (error) {
    console.error("❌ Failed to fetch notifications:", error);
    throw error;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notification_id: string) {
  try {
    const res = await api.patch(`/api/notifications/${notification_id}/mark-read/`, {});
    console.log("✅ Notification marked as read:", res.data);
    return res.data;
  } catch (error) {
    console.error("❌ Failed to mark notification as read:", error);
    throw error;
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(notification_id: string) {
  try {
    const res = await api.delete(`/api/notifications/${notification_id}/`);
    console.log("✅ Notification deleted:", res.data);
    return res.data;
  } catch (error) {
    console.error("❌ Failed to delete notification:", error);
    throw error;
  }
}
