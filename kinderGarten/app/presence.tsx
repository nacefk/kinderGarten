import React, { useState, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/config/colors";
import { useAppStore } from "@/store/useAppStore";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import HeaderBar from "@/components/Header";

type PresenceStatus = "present" | "absent";

export default function PresenceScreen() {
  const router = useRouter();
  const classes = useAppStore((state) => state.data.classes || []);
  const children = useAppStore((state) => state.data.childrenList || []);

  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [presenceMap, setPresenceMap] = useState<Record<string, PresenceStatus>>({});

  // Default all present
  useEffect(() => {
    const initial = children.reduce((acc: Record<string, PresenceStatus>, c: any) => {
      acc[c.id] = "present";
      return acc;
    }, {});
    setPresenceMap(initial);
  }, [children]);

  const togglePresence = (id: string) =>
    setPresenceMap((prev) => ({
      ...prev,
      [id]: prev[id] === "present" ? "absent" : "present",
    }));

  const markAllPresent = () => {
    const updated = Object.keys(presenceMap).reduce((acc, id) => ({ ...acc, [id]: "present" }), {});
    setPresenceMap(updated);
  };

  const filteredChildren = useMemo(() => {
    if (selectedClass === "all") return children;
    return children.filter((c: any) => c.className === selectedClass);
  }, [children, selectedClass]);

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
          <Text className="ml-2 font-medium" style={{ color: isPresent ? "#4CAF50" : "#E53935" }}>
            {isPresent ? "Présent" : "Absent"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* ✅ Custom Header */}
      <HeaderBar title="Gestion de la Présence" showBack={true} />

      {/* ✅ Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20, // small horizontal padding
          paddingTop: 16,
          paddingBottom: 40, // extra bottom space
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Row */}
        <View className="mb-4 flex-row justify-between items-center">
          <Text className="text-2xl font-bold" style={{ color: colors.textDark }}>
            Gestion de la Présence
          </Text>
          <TouchableOpacity onPress={markAllPresent} className="flex-row items-center">
            <Ionicons name="refresh-outline" size={18} color={colors.accent} />
            <Text className="ml-1 text-sm font-medium" style={{ color: colors.accent }}>
              Tout présent
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <TouchableOpacity
            onPress={() => setSelectedClass("all")}
            activeOpacity={0.8}
            style={{
              backgroundColor: selectedClass === "all" ? colors.accent : colors.cardBackground,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderWidth: 1,
              borderColor: colors.accent,
              marginRight: 8,
            }}
          >
            <Text
              style={{
                color: selectedClass === "all" ? "#fff" : colors.textDark,
                fontWeight: "500",
              }}
            >
              Tout
            </Text>
          </TouchableOpacity>

          {classes.map((cls: any) => (
            <TouchableOpacity
              key={cls.id}
              onPress={() => setSelectedClass(cls.name)}
              activeOpacity={0.8}
              style={{
                backgroundColor: selectedClass === cls.name ? colors.accent : colors.cardBackground,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: colors.accent,
                marginRight: 8,
              }}
            >
              <Text
                style={{
                  color: selectedClass === cls.name ? "#fff" : colors.textDark,
                  fontWeight: "500",
                }}
              >
                {cls.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* List */}
        {filteredChildren.length > 0 ? (
          <FlatList
            data={filteredChildren}
            keyExtractor={(item) => item.id}
            renderItem={renderChild}
            scrollEnabled={false}
          />
        ) : (
          <Text className="text-center text-base mt-4" style={{ color: colors.textLight }}>
            Aucun enfant trouvé.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
