import React from "react";
import { View, Text } from "react-native";
import { getColors } from "../config/colors";
import { useAppStore } from "@/store/useAppStore";

export default function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  const tenant = useAppStore((state) => state.tenant);
  const colors = getColors(tenant?.primary_color, tenant?.secondary_color);
  return (
    <View
      className="rounded-2xl shadow-sm p-5 mt-6"
      style={{ backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: "#e5e7eb" }}
    >
      {title ? (
        <Text className="text-lg font-semibold mb-3" style={{ color: colors.textDark }}>
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}
