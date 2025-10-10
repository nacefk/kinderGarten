import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter, useSegments } from "expo-router";

const tabConfig = [
  { name: "home", title: "Home", icon: "home" },
  { name: "chat", title: "Chat", icon: "chatbubble" },
  { name: "profile", title: "Profile", icon: "person" },
  { name: "activity", title: "Activity", icon: "pulse" },
];

function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const tab = tabConfig.find(t => t.name === route.name);

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={() => navigation.navigate(route.name)}
            style={[
              styles.tabItem,
              isFocused && styles.tabItemActive,
            ]}
          >
            <Ionicons
              name={tab?.icon as any}
              size={24}
              color={isFocused ? "#007aff" : "#888"}
            />
            <Text style={{ color: isFocused ? "#007aff" : "#888", fontSize: 12 }}>
              {tab?.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 1)", // 👈 semi-transparent white
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.3)",
    backdropFilter: "blur(10px)", // 👈 works on web, ignored on native
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 8,
  },
  tabItemActive: {
    backgroundColor: "#e6f0ff", // 👈 translucent highlight
  },
});


export default function TabsLayout() {
  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {tabConfig.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={tab.icon as any} color={color} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
