import { Ionicons } from "@expo/vector-icons";
import { Tabs, Redirect } from "expo-router";
import { useAuthStore } from "@/store/useAuthStore";

export default function TabsLayout() {
  const { isAuthenticated } = useAuthStore();

  // ✅ Route protection
  if (!isAuthenticated) {
    return <Redirect href="/(authentication)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#007aff",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: "Activity",
          tabBarIcon: ({ color, size }) => <Ionicons name="pulse" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
