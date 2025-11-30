import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/config/colors";
import { useAuthStore } from "@/store/useAuthStore";

export default function AdminLayout() {
  const { isAuthenticated, userRole } = useAuthStore();

  // ✅ Route protection: ensure user is authenticated and is admin
  if (!isAuthenticated || userRole !== "admin") {
    return <Redirect href="/(authentication)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#007aff",
      }}
    >
      {/* Dashboard Tab */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="speedometer-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Children Management Tab */}
      <Tabs.Screen
        name="children"
        options={{
          title: "Children",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Reports Tab */}
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Calendar Tab */}
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Chat Tab */}
      <Tabs.Screen
        name="chatList"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
