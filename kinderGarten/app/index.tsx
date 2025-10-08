import { Redirect } from "expo-router";
import LottieView from 'lottie-react-native';
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";

export default function Index() {

let isLoggedIn = false; // Replace with real authentication logic
const [isLoading, setIsLoading] = useState(true);
  const animationRef = useRef(null);

// loading takes 3 seconds to simulate an async auth check
useEffect(() => {
  const timer = setTimeout(() => {
    setIsLoading(false);
  }, 3500);
  return () => clearTimeout(timer);
}, []);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <LottieView
          ref={animationRef}
          source={require('../assets/animations/splash.json')}
          autoPlay
          loop={true}
          resizeMode="contain"
          style={{ width: '90%', height: '40%' }}
        />
        <Text className="text-2xl font-bold mt-10">Welcome to the App</Text>
      </View>
    );
  }

  // ✅ Navigate based on login state
  if (isLoggedIn) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/(authentication)/login" />;
}
