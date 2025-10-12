import { View, Text, TouchableOpacity } from "react-native";
import { ChevronLeft, Bell } from "lucide-react-native";
import { router } from "expo-router";
import colors from "../config/colors";

export default function Header({ title }: { title: string }) {
  return (
    <View
      className="flex-row items-center justify-between px-5 pt-16 pb-6"
      style={{ backgroundColor: colors.accentLight }}
    >
      <View className="flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ChevronLeft color={colors.textDark} size={28} />
        </TouchableOpacity>
        <Text className="text-2xl font-bold" style={{ color: colors.textDark }}>
          {title}
        </Text>
      </View>
      <TouchableOpacity>
        <Bell color={colors.textDark} size={28} />
      </TouchableOpacity>
    </View>
  );
}
