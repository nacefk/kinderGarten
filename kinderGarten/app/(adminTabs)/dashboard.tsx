import React, { useState, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image, FlatList, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/config/colors";
import { useRouter } from "expo-router";
import { useAppStore } from "@/store/useAppStore";
import { ChevronLeft, LogOut } from "lucide-react-native";

type PresenceStatus = "present" | "absent";

export default function DashboardScreen() {
  const router = useRouter();

  const classes = useAppStore((state) => state.data.classes || []);
  const children = useAppStore((state) => state.data.childrenList || []);

  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [presenceMap, setPresenceMap] = useState<Record<string, PresenceStatus>>({});

  // ✅ Default presence: all present
  useEffect(() => {
    const initial = children.reduce((acc: Record<string, PresenceStatus>, c: any) => {
      acc[c.id] = "present";
      return acc;
    }, {});
    setPresenceMap(initial);
  }, [children]);

  // ✅ Toggle individual presence
  const togglePresence = (id: string) => {
    setPresenceMap((prev) => ({
      ...prev,
      [id]: prev[id] === "present" ? "absent" : "present",
    }));
  };

  // ✅ Mark all present
  const markAllPresent = () => {
    const updated = Object.keys(presenceMap).reduce((acc, id) => ({ ...acc, [id]: "present" }), {});
    setPresenceMap(updated);
  };

  // ✅ Filtered children by class
  const filteredChildren = useMemo(() => {
    if (selectedClass === "all") return children;
    return children.filter((c: any) => c.className === selectedClass);
  }, [children, selectedClass]);

  // ✅ Extra hours
  const extraHourRequests = [
    { id: "1", name: "Sophie Dupont", hours: "17h00 → 18h30" },
    { id: "2", name: "Alex Martin", hours: "16h30 → 17h30" },
  ];

  const renderChild = ({ item }: { item: any }) => {
    const status = presenceMap[item.id] || "present";
    const isPresent = status === "present";

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => togglePresence(item.id)}
        className="flex-row items-center mb-3 p-3 rounded-2xl"
        style={{
          backgroundColor: colors.cardBackground,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
        }}
      >
        <Image source={{ uri: item.avatar }} className="w-12 h-12 rounded-full mr-3" />
        <View className="flex-1">
          <Text className="text-base font-medium" style={{ color: colors.textDark }}>
            {item.name}
          </Text>
          <Text className="text-xs" style={{ color: colors.textLight }}>
            {item.className} · {item.age} ans
          </Text>
        </View>

        <View className="flex-row items-center">
          <Ionicons
            name={isPresent ? "checkmark-circle" : "close-circle"}
            size={22}
            color={isPresent ? "#4CAF50" : "#E53935"}
          />
          <Text
            className="ml-2 font-medium"
            style={{
              color: isPresent ? "#4CAF50" : "#E53935",
            }}
          >
            {isPresent ? "Présent" : "Absent"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      className="flex-1 "
      style={{ backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle={"dark-content"} />

      {/* En-tête */}
      <View
        className="flex-row items-center justify-between px-5 pt-16 pb-6"
        style={{ backgroundColor: colors.accentLight }}
      >
        <View className="flex-row items-center"></View>
        {/* add logout button  */}
        <View className="flex-1" />
        <TouchableOpacity
          onPress={() => router.replace("/login")} // 👈 Navigate to login
          className="p-1"
        >
          <LogOut color={colors.textDark} size={28} />
        </TouchableOpacity>
        <View></View>
      </View>

      {/* --- Presence Summary Bloc --- */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push("/presence")}
        className="rounded-2xl p-5 mb-6 mx-5 mt-5"
        style={{
          backgroundColor: colors.cardBackground,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-lg font-semibold" style={{ color: colors.textDark }}>
            Présence du Jour
          </Text>
          <Ionicons name="people-outline" size={22} color={colors.accent} />
        </View>

        <Text className="text-sm mb-3" style={{ color: colors.text }}>
          Gérez la présence quotidienne des enfants.
        </Text>

        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-3xl font-bold" style={{ color: colors.accent }}>
              18
            </Text>
            <Text style={{ color: colors.textLight }}>Présents</Text>
          </View>
          <View>
            <Text className="text-3xl font-bold" style={{ color: "#E53935" }}>
              2
            </Text>
            <Text style={{ color: colors.textLight }}>Absents</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Extra Hours Section */}
      <View
        className="rounded-2xl p-5 mb-10 mx-5"
        style={{
          backgroundColor: colors.cardBackground,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-lg font-semibold" style={{ color: colors.textDark }}>
            Heures Supplémentaires
          </Text>
          <Ionicons name="time-outline" size={22} color={colors.accent} />
        </View>

        {extraHourRequests.map((req) => (
          <View
            key={req.id}
            className="flex-row items-center justify-between mb-3 border-b pb-2"
            style={{ borderColor: "#eee" }}
          >
            <View>
              <Text className="font-medium" style={{ color: colors.textDark }}>
                {req.name}
              </Text>
              <Text className="text-sm" style={{ color: colors.textLight }}>
                {req.hours}
              </Text>
            </View>
            <View className="flex-row">
              <TouchableOpacity
                className="mr-2 px-3 py-1 rounded-lg"
                style={{ backgroundColor: "#4CAF50" }}
              >
                <Text className="text-white text-sm">✔</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-3 py-1 rounded-lg"
                style={{ backgroundColor: "#E53935" }}
              >
                <Text className="text-white text-sm">✖</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
