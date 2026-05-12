import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Image, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@/store/useAuthStore";

const WALKTHROUGH_KEY = "kindergarten_walkthrough_seen";

export default function Index() {
  const { isAuthenticated, isLoading, userRole } = useAuthStore();
  const [showSplash, setShowSplash] = useState(true);
  const [progress, setProgress] = useState(0);
  const [walkthroughSeen, setWalkthroughSeen] = useState<boolean | null>(null);

  // Show splash for 3.5 seconds with progress animation
  useEffect(() => {
    const splashDuration = 3500;
    const startTime = Date.now();

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressPercent = Math.min((elapsed / splashDuration) * 100, 100);
      setProgress(progressPercent);

      if (elapsed >= splashDuration) {
        clearInterval(progressInterval);
        setShowSplash(false);
      }
    }, 50);

    return () => clearInterval(progressInterval);
  }, []);

  // Check if walkthrough has been seen
  useEffect(() => {
    AsyncStorage.getItem(WALKTHROUGH_KEY).then((value) => {
      setWalkthroughSeen(value === "true");
    });
  }, []);

  // Still loading
  if (isLoading || showSplash || walkthroughSeen === null) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-6">
        {/* Image */}
        <Image
          source={require("../assets/images/sghiri-splash.png")}
          resizeMode="contain"
          style={{ width: 450, height: (420 * 1024) / 1536, marginBottom: 40 }}
        />

        {/* Progress Bar Container */}
        <View style={{ width: "100%", maxWidth: 300 }}>
          {/* Background bar */}
          <View className="bg-gray-200 rounded-full overflow-hidden" style={{ height: 8 }}>
            {/* Progress fill */}
            <View
              className="bg-red-500 rounded-full"
              style={{
                height: 8,
                width: `${progress}%`,
              }}
            />
          </View>
        </View>
      </View>
    );
  }

  // Navigate based on login state and role
  if (isAuthenticated) {
    if (userRole === "admin") {
      return <Redirect href="/(adminTabs)/dashboard" />;
    }
    // Show walkthrough for parents on first login
    if (!walkthroughSeen) {
      return <Redirect href="/walkthrough" />;
    }
    return <Redirect href="/(tabs)/home" />;
  }

  // Not authenticated, go to login
  return <Redirect href="/(authentication)/login" />;
}
