import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function Index() {

let isLoggedIn = true; // Replace with real authentication logic
const [isLoading, setIsLoading] = useState(true);
// loading takes 3 seconds to simulate an async auth check
useEffect(() => {
  const timer = setTimeout(() => {
    setIsLoading(false);
  }, 3000);
  return () => clearTimeout(timer);
}, []);

  // 🕓 Show splash while loading
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#007aff" />
        <Text className="text-lg mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  // ✅ Navigate based on login state
  if (isLoggedIn) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/(authentication)/login" />;
}
