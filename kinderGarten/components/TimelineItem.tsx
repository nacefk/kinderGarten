import { View, Text } from "react-native";
import colors from "../config/colors";

export default function TimelineItem({ item }: { item: any }) {
  return (
    <View className="flex-row mb-4 items-center">
      <View className="w-16 items-center">
      <Text className="text-sm" style={{ color: colors.textLight }}>
        {item.time}
      </Text>
      </View>
      <View className="flex-1 rounded-xl px-4 py-3" style={{ backgroundColor: colors.background }}>
      <Text className="font-medium" style={{ color: colors.textDark }}>
        {item.title}
      </Text>
      <Text style={{ color: colors.text }}>{item.detail}</Text>
      </View>
    </View>
  );
}
