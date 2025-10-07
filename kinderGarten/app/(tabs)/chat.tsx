// Chat screen component react native tailwindcss with nativewind and expo router tsx
import { Text, View } from "react-native";

export default function Chat() {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Text className="text-2xl font-bold mb-4">Chat Screen</Text>
      <Text className="text-base text-gray-600">
        This is the chat screen where users can send and receive messages.
      </Text>
    </View>
  );
}
