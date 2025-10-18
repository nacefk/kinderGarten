import React, { useState, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image, FlatList, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/config/colors";
import { useAppStore } from "@/store/useAppStore";
import { useRouter } from "expo-router";
import HeaderBar from "@/components/Header";

type PresenceStatus = "present" | "absent";

export default function PresenceScreen() {
  const router = useRouter();
  const { data, setData } = useAppStore();
  const classes = data.classes || [];
  const children = data.childrenList || [];

  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [presenceMap, setPresenceMap] = useState<Record<string, PresenceStatus>>({});

  // ✅ Initialize presence (default all present)
  useEffect(() => {
    const initial = children.reduce((acc: Record<string, PresenceStatus>, c: any) => {
      acc[c.id] = "present";
      return acc;
    }, {});
    setPresenceMap(initial);
  }, [children]);

  // ✅ Toggle individual presence
  const togglePresence = (id: string) =>
    setPresenceMap((prev) => ({
      ...prev,
      [id]: prev[id] === "present" ? "absent" : "present",
    }));

  // ✅ Mark all as present
  const markAllPresent = () => {
    const updated = Object.keys(presenceMap).reduce((acc, id) => ({ ...acc, [id]: "present" }), {});
    setPresenceMap(updated);
  };

  // ✅ Save presence modifications
  const handleSave = () => {
    const attendanceToday = children.map((child: any) => ({
      childId: child.id,
      name: child.name,
      className: child.className,
      status: presenceMap[child.id] || "present",
      time:
        presenceMap[child.id] === "present"
          ? new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
          : null,
    }));

    setData("attendanceToday", attendanceToday);
    Alert.alert("Succès ✅", "Les présences ont été mises à jour avec succès.");
  };

  // ✅ Filtered children
  const filteredChildren = useMemo(() => {
    if (selectedClass === "all") return children;
    return children.filter((c: any) => c.className === selectedClass);
  }, [children, selectedClass]);

  // ✅ Render child card
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
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* ✅ Custom Header */}
      <HeaderBar title="Gestion de la Présence" showBack={true} />

      {/* ✅ Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 120, // space for Save button
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

      {/* ✅ Save Button (fixed bottom) */}
      <View
        className="absolute bottom-0 left-0 right-0 p-5"
        style={{
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderColor: "#EEE",
        }}
      >
        <TouchableOpacity
          onPress={handleSave}
          className="py-4 rounded-2xl"
          style={{ backgroundColor: colors.accent }}
        >
          <Text className="text-center text-white text-lg font-semibold">
            Sauvegarder les modifications
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
