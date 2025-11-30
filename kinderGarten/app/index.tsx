import { Redirect } from "expo-router";
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { useAuthStore } from "@/store/useAuthStore";

export default function Index() {
  const { isAuthenticated, isLoading, userRole } = useAuthStore();
  const [showSplash, setShowSplash] = useState(true);
  const animationRef = useRef(null);

  // Show splash for 3.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  // Still loading
  if (isLoading || showSplash) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <LottieView
          ref={animationRef}
          source={require("../assets/animations/splash.json")}
          autoPlay
          loop={true}
          resizeMode="contain"
          style={{ width: "90%", height: "40%" }}
        />
        <Text className="text-2xl font-bold mt-10">Welcome to the App</Text>
      </View>
    );
  }

  // ✅ Navigate based on login state and role
  if (isAuthenticated) {
    if (userRole === "admin") {
      return <Redirect href="/(adminTabs)/dashboard" />;
    }
    return <Redirect href="/(tabs)/home" />;
  }

  // Not authenticated, go to login
  return <Redirect href="/(authentication)/login" />;
}
