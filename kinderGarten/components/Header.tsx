import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import colors from "@/config/colors";

interface HeaderBarProps {
  title: string;
  showBack?: boolean;
  onBackPress?: () => void;
}

export default function HeaderBar({ title, showBack = false, onBackPress }: HeaderBarProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBackPress) onBackPress();
    else router.back();
  };

  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.accentLight }}>
      <View
        className="flex-row items-center justify-between px-5 py-4"
        style={{ backgroundColor: colors.accentLight }}
      >
        {/* Back icon (optional) */}
        {showBack ? (
          <TouchableOpacity onPress={handleBack} className="w-8">
            <ChevronLeft color={colors.textDark} size={28} />
          </TouchableOpacity>
        ) : (
          <View className="w-8" />
        )}

        {/* Centered title */}
        <View className="flex-1 items-center">
          <Text className="text-xl text-center font-semibold" style={{ color: colors.textDark }}>
            {title}
          </Text>
        </View>

        {/* Placeholder for symmetry */}
        <View className="w-8" />
      </View>
    </SafeAreaView>
  );
}
