import { View, Text } from "react-native";

export default function Row({
  label,
  children,
  colors,
}: {
  label: string;
  children: React.ReactNode;
  colors: any;
}) {
  return (
    <View className="flex-row justify-between items-center mb-3">
      <Text style={{ color: colors.text }}>{label}</Text>
      {children}
    </View>
  );
}
