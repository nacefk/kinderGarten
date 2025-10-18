import React, { useState, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LogOut } from "lucide-react-native";
import colors from "@/config/colors";
import { useRouter } from "expo-router";
import { useAppStore } from "@/store/useAppStore";

type PresenceStatus = "present" | "absent";
type ExtraHourStatus = "pending" | "approved" | "rejected";

export default function DashboardScreen() {
  const router = useRouter();
  const classes = useAppStore((state) => state.data.classes || []);
  const children = useAppStore((state) => state.data.childrenList || []);

  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [presenceMap, setPresenceMap] = useState<Record<string, PresenceStatus>>({});
  const [extraHourRequests, setExtraHourRequests] = useState<
    { id: string; name: string; hours: string; status: ExtraHourStatus }[]
  >([
    { id: "1", name: "Sophie Dupont", hours: "17h00 → 18h30", status: "pending" },
    { id: "2", name: "Alex Martin", hours: "16h30 → 17h30", status: "pending" },
  ]);

  // ✅ Initialize presence
  useEffect(() => {
    const initial = children.reduce((acc: Record<string, PresenceStatus>, c: any) => {
      acc[c.id] = "present";
      return acc;
    }, {});
    setPresenceMap(initial);
  }, [children]);

  // ✅ Toggle presence
  const togglePresence = (id: string) => {
    setPresenceMap((prev) => ({
      ...prev,
      [id]: prev[id] === "present" ? "absent" : "present",
    }));
  };

  // ✅ Approve or reject extra hour request
  const handleApprove = (id: string) => {
    setExtraHourRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r))
    );
  };

  const handleReject = (id: string) => {
    setExtraHourRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r))
    );
  };

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar barStyle={"dark-content"} />

      {/* En-tête */}
      <View
        className="flex-row items-center justify-between px-5 pt-16 pb-6"
        style={{ backgroundColor: colors.accentLight }}
      >
        <View className="flex-row items-center" />
        <View className="flex-1" />
        <TouchableOpacity onPress={() => router.replace("/login")} className="p-1">
          <LogOut color={colors.textDark} size={28} />
        </TouchableOpacity>
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

      {/* 🕒 Heures Supplémentaires */}
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

            {/* Status or actions */}
            {req.status === "pending" ? (
              <View className="flex-row">
                <TouchableOpacity
                  onPress={() => handleApprove(req.id)}
                  className="mr-2 px-3 py-1 rounded-lg"
                  style={{ backgroundColor: "#4CAF50" }}
                >
                  <Text className="text-white text-sm">✔</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleReject(req.id)}
                  className="px-3 py-1 rounded-lg"
                  style={{ backgroundColor: "#E53935" }}
                >
                  <Text className="text-white text-sm">✖</Text>
                </TouchableOpacity>
              </View>
            ) : req.status === "approved" ? (
              <Text style={{ color: "#4CAF50", fontWeight: "600" }}>Approuvé ✅</Text>
            ) : (
              <Text style={{ color: "#E53935", fontWeight: "600" }}>Refusé ❌</Text>
            )}
          </View>
        ))}

        {extraHourRequests.length === 0 && (
          <Text style={{ color: colors.textLight, textAlign: "center", marginTop: 10 }}>
            Aucune demande pour le moment.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
