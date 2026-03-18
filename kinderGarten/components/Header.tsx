import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { useRouter, useNavigation, usePathname } from "expo-router";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore } from "@/store/useAppStore";
import { getColors } from "@/config/colors";

interface HeaderBarProps {
  title: string;
  showBack?: boolean;
  onBackPress?: () => void;
}

export default function HeaderBar({ title, showBack = false, onBackPress }: HeaderBarProps) {
  const router = useRouter();
  const navigation = useNavigation();
  const pathname = usePathname();
  const { userRole } = useAuthStore();
  const tenant = useAppStore((state) => state.tenant);

  // Debug: Log tenant colors
  console.log("🎨 [Header] Tenant data:", {
    primary_color: tenant?.primary_color,
    secondary_color: tenant?.secondary_color,
  });

  // Get colors with tenant branding
  const colors = getColors(tenant?.primary_color, tenant?.secondary_color);

  // Determine if we're in admin section
  const isAdminScreen = pathname?.includes("adminTabs");

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation.canGoBack?.()) {
      router.back();
    } else {
      // Navigate to appropriate home based on user role
      const fallbackRoute = isAdminScreen ? "/(adminTabs)/dashboard" : "/(tabs)/home";
      router.push(fallbackRoute);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.secondary }}>
      <View
        className="flex-row items-center justify-between px-5 py-4"
        style={{ backgroundColor: colors.secondary }}
      >
        {/* Back icon (optional) */}
        {showBack ? (
          <TouchableOpacity onPress={handleBack} className="w-8">
            <ChevronLeft color={colors.white} size={28} />
          </TouchableOpacity>
        ) : (
          <View className="w-8" />
        )}

        {/* Centered title */}
        <View className="flex-1 items-center">
          <Text className="text-xl text-center font-semibold" style={{ color: colors.white }}>
            {title}
          </Text>
        </View>

        {/* Placeholder for symmetry */}
        <View className="w-8" />
      </View>
    </SafeAreaView>
  );
}
