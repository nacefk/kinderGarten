import React from "react";
import { View, Text } from "react-native";
import colors from "../config/colors";

export default function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View
      className="rounded-2xl shadow-sm p-5 mt-6"
      style={{ backgroundColor: colors.cardBackground }}
    >
      <Text className="text-lg font-semibold mb-3" style={{ color: colors.textDark }}>
        {title}
      </Text>
      {children}
    </View>
  );
}
