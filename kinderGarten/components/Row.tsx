import { View, Text } from "react-native";
import colors from "../config/colors";

export default function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="flex-row justify-between items-center mb-3">
      <Text style={{ color: colors.text }}>{label}</Text>
      {children}
    </View>
  );
}
