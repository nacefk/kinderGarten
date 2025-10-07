// Home screen component react native tailwindcss with nativewind and expo router tsx
import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function Home() {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Text className="text-2xl font-bold mb-4">Home Screen</Text>
      <Text className="text-base text-gray-600">
        This is the home screen where users can view their dashboard.
      </Text>
      <TouchableOpacity
        onPress={() => router.replace("/(authentication)/login")}
        className="bg-blue-600 py-3 px-10 rounded-lg"
      >
        <Text className="text-white text-lg font-semibold">Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
