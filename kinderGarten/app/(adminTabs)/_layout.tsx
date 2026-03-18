import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getColors } from "@/config/colors";
import { useAuthStore } from "@/store/useAuthStore";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useAppStore } from "@/store/useAppStore";
import { getTranslation } from "@/config/translations";

export default function AdminLayout() {
  const { isAuthenticated, userRole } = useAuthStore();
  const { language } = useLanguageStore();
  const tenant = useAppStore((state) => state.tenant);
  const colors = getColors(tenant?.primary_color, tenant?.secondary_color);
  const t = (key: string) => getTranslation(language, key);

  // ✅ Route protection: ensure user is authenticated and is admin
  if (!isAuthenticated || userRole !== "admin") {
    return <Redirect href="/(authentication)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.secondary,
      }}
    >
      {/* Dashboard Tab */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t("tabs.dashboard"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="speedometer-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Children Management Tab */}
      <Tabs.Screen
        name="children"
        options={{
          title: t("tabs.children"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Reports Tab */}
      <Tabs.Screen
        name="reports"
        options={{
          title: t("tabs.reports"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Calendar Tab */}
      <Tabs.Screen
        name="calendar"
        options={{
          title: t("tabs.calendar"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Chat Tab */}
      <Tabs.Screen
        name="chatList"
        options={{
          title: t("tabs.chat"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
