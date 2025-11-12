import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import colors from "@/config/colors";
import { useAppStore } from "@/store/useAppStore";
import { useRouter } from "expo-router";
import HeaderBar from "@/components/Header";

type PresenceStatus = "present" | "absent";

const API_BASE = "http://127.0.0.1:8000/api/attendance/"; // ✅ ensure trailing slash

export default function PresenceScreen() {
  const router = useRouter();
  const { data } = useAppStore();
  const classes = data.classes || [];
  const children = data.childrenList || [];

  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [presenceMap, setPresenceMap] = useState<Record<number, PresenceStatus>>({});
  const [loading, setLoading] = useState(false);

  // ✅ Load today's attendance from API
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      if (!token) return;

      const res = await axios.get(API_BASE, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("📥 Attendance loaded:", res.data);

      // Convert list into { childId: status }
      const map: Record<number, PresenceStatus> = {};
      res.data.forEach((record: any) => {
        map[record.child] = record.status as PresenceStatus;
      });

      // Initialize with present for others not yet recorded
      const fullMap = children.reduce((acc: Record<number, PresenceStatus>, c: any) => {
        acc[c.id] = map[c.id] || "present";
        return acc;
      }, {});

      setPresenceMap(fullMap);
    } catch (error: any) {
      console.error("❌ Error loading attendance:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (children.length > 0) fetchAttendance();
  }, [children]);

  // ✅ Toggle individual presence
  const togglePresence = (id: number) =>
    setPresenceMap((prev) => ({
      ...prev,
      [id]: prev[id] === "present" ? "absent" : "present",
    }));

  // ✅ Mark all as present
  const markAllPresent = () => {
    const updated = Object.keys(presenceMap).reduce((acc, id) => ({ ...acc, [id]: "present" }), {});
    setPresenceMap(updated as Record<number, PresenceStatus>);
  };

  // ✅ Save presence modifications to API
  const handleSave = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        Alert.alert("Erreur", "Aucun jeton d'authentification trouvé.");
        return;
      }

      const payload = {
        records: children.map((child: any) => ({
          child: child.id,
          status: presenceMap[child.id] || "present",
        })),
      };

      console.log("📤 Sending attendance payload:", JSON.stringify(payload, null, 2));

      const res = await axios.post(`${API_BASE}update/`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Response:", res.data);
      Alert.alert("Succès ✅", "Les présences ont été enregistrées avec succès.");
    } catch (error: any) {
      console.error("❌ Error saving attendance:", error.response?.data || error.message);
      Alert.alert(
        "Erreur",
        error.response?.data?.detail || "Impossible d'enregistrer les présences."
      );
    } finally {
      setLoading(false);
    }
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
      <HeaderBar title="Gestion de la Présence" showBack={true} />

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={{ color: colors.textLight, marginTop: 10 }}>Chargement...</Text>
        </View>
      ) : (
        <>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 120,
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
                    backgroundColor:
                      selectedClass === cls.name ? colors.accent : colors.cardBackground,
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
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderChild}
                scrollEnabled={false}
              />
            ) : (
              <Text className="text-center text-base mt-4" style={{ color: colors.textLight }}>
                Aucun enfant trouvé.
              </Text>
            )}
          </ScrollView>

          {/* ✅ Save Button */}
          <View
            className="absolute bottom-0 left-0 right-0 p-5"
            style={{
              backgroundColor: colors.background,
              borderTopWidth: 1,
              borderColor: "#EEE",
            }}
          >
            <TouchableOpacity
              disabled={loading}
              onPress={handleSave}
              className="py-4 rounded-2xl"
              style={{
                backgroundColor: loading ? "#ccc" : colors.accent,
              }}
            >
              <Text className="text-center text-white text-lg font-semibold">
                {loading ? "Enregistrement..." : "Sauvegarder les modifications"}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}
