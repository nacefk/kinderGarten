// app/(authentication)/login.tsx
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function Login() {
  const router = useRouter();

  const handleLogin = () => {
    // later you'll validate credentials here
    console.log("User logged in");
    router.replace("/(tabs)/home"); // ✅ navigate to Home inside Tabs
  };

  return (
    <View className="flex-1 justify-center items-center bg-white px-6">
      <Text className="text-2xl font-bold mb-4">Login Screen</Text>
      <Text className="text-base text-gray-600 mb-8 text-center">
        Please enter your email and password to continue.
      </Text>

      <TouchableOpacity
        onPress={handleLogin}
        className="bg-blue-600 py-3 px-10 rounded-lg"
      >
        <Text className="text-white text-lg font-semibold">Login</Text>
      </TouchableOpacity>
    </View>
  );
}
