import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LogOut } from "lucide-react-native";
import colors from "@/config/colors";
import { useRouter } from "expo-router";
import {
  getAttendanceSummary,
  getPendingExtraHours,
  approveExtraHour,
  rejectExtraHour,
} from "@/api/attendance";

type ExtraHour = {
  id: number;
  child_name: string;
  start: string;
  end: string;
  status: "pending" | "approved" | "rejected";
};

export default function DashboardScreen() {
  const router = useRouter();
  const [presence, setPresence] = useState({ present: 0, absent: 0 });
  const [extraHours, setExtraHours] = useState<ExtraHour[]>([]);
  const [loadingPresence, setLoadingPresence] = useState(true);
  const [loadingExtra, setLoadingExtra] = useState(true);

  const handleApprove = async (id: number) => {
    try {
      await approveExtraHour(id);
      setExtraHours((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      console.error("❌ Approve error:", e);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectExtraHour(id);
      setExtraHours((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      console.error("❌ Reject error:", e);
    }
  };

  // ✅ Fetch today's presence summary
  useEffect(() => {
    (async () => {
      try {
        setLoadingPresence(true);
        const data = await getAttendanceSummary();
        // Ensure data has required fields
        if (data && typeof data === "object") {
          setPresence({
            present: data.present || 0,
            absent: data.absent || 0,
          });
        } else {
          setPresence({ present: 0, absent: 0 });
        }
      } catch (err: any) {
        console.error("❌ Error loading attendance summary:", err.message);
        setPresence({ present: 0, absent: 0 }); // Set defaults on error
      } finally {
        setLoadingPresence(false);
      }
    })();
  }, []);

  // ✅ Fetch pending extra-hour requests
  useEffect(() => {
    (async () => {
      try {
        setLoadingExtra(true);
        const data = await getPendingExtraHours();
        // Ensure data is an array (handle cases where API returns object)
        if (Array.isArray(data)) {
          setExtraHours(data);
        } else if (data && typeof data === "object") {
          // If API returns {results: [...]} or similar
          const results = (data as any).results || (data as any).data || [];
          setExtraHours(Array.isArray(results) ? results : []);
        } else {
          setExtraHours([]);
        }
      } catch (err: any) {
        console.error("❌ Error loading extra-hour requests:", err.message);
        setExtraHours([]); // Set to empty array on error
      } finally {
        setLoadingExtra(false);
      }
    })();
  }, []);

  // ✅ Optional: format hours nicely
  const formatTime = (time: string) => time.slice(0, 5); // "17:00"

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar barStyle={"dark-content"} />

      {/* Header */}
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

        {loadingPresence ? (
          <ActivityIndicator color={colors.accent} size="small" />
        ) : (
          <View className="flex-row justify-between items-center mt-3">
            <View>
              <Text className="text-3xl font-bold" style={{ color: colors.accent }}>
                {presence.present}
              </Text>
              <Text style={{ color: colors.textLight }}>Présents</Text>
            </View>
            <View>
              <Text className="text-3xl font-bold" style={{ color: "#E53935" }}>
                {presence.absent}
              </Text>
              <Text style={{ color: colors.textLight }}>Absents</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* --- Extra Hours Bloc --- */}
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

        {loadingExtra ? (
          <ActivityIndicator color={colors.accent} size="small" />
        ) : !Array.isArray(extraHours) || extraHours.length === 0 ? (
          <Text style={{ color: colors.textLight, textAlign: "center", marginTop: 10 }}>
            Aucune demande pour le moment.
          </Text>
        ) : (
          extraHours.map((req) => (
            <View
              key={req.id}
              className="flex-row items-center justify-between mb-3 border-b pb-2"
              style={{ borderColor: "#eee" }}
            >
              <View>
                <Text className="font-medium" style={{ color: colors.textDark }}>
                  {req.child_name}
                </Text>
                <Text className="text-sm" style={{ color: colors.textLight }}>
                  {formatTime(req.start)} → {formatTime(req.end)}
                </Text>
              </View>

              {/* ACTION BUTTONS */}
              <View className="flex-row">
                {/* APPROVE */}
                <TouchableOpacity
                  onPress={() => handleApprove(req.id)}
                  className="mr-2 p-2 rounded-lg"
                  style={{ backgroundColor: "#4CAF50" }}
                >
                  <Ionicons name="checkmark" size={20} color="#fff" />
                </TouchableOpacity>

                {/* REJECT */}
                <TouchableOpacity
                  onPress={() => handleReject(req.id)}
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: "#E53935" }}
                >
                  <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
