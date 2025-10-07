// Profile screen component react native tailwindcss with nativewind and expo router tsx
import { Text, View } from "react-native";

export default function Profile() {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Text className="text-2xl font-bold mb-4">Profile Screen</Text>
      <Text className="text-base text-gray-600">
        This is the profile screen where users can view and edit their profile information.
      </Text>
    </View>
  );
}
