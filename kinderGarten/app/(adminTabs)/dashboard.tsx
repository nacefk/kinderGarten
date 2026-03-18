import React, { useState, useEffect } from "react";
import { getTodayAbsences } from "@/api/absence";
// Absences Today State and Fetch

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LogOut } from "lucide-react-native";
import { getColors } from "@/config/colors";
import { useRouter } from "expo-router";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useAppStore } from "@/store/useAppStore";
import { getTranslation, Language } from "@/config/translations";
import {
  getAttendanceSummary,
  getTodayExtraHours,
  approveExtraHour,
  rejectExtraHour,
} from "@/api/attendance";

type ExtraHour = {
  id?: number;
  request_id?: number;
  child_name?: string;
  child?: { name: string } | string;
  date?: string;
  start?: string;
  end?: string;
  duration?: number;
  status?: "pending" | "approved" | "rejected";
};

export default function DashboardScreen() {
  const router = useRouter();
  const { language, setLanguage } = useLanguageStore();
  const tenant = useAppStore((state) => state.tenant);
  const colors = getColors(tenant?.primary_color, tenant?.secondary_color);
  
  // Debug: Log when colors update
  useEffect(() => {
    console.log("🎯 [Dashboard] Colors updated:", {
      primary: colors.primary,
      secondary: colors.secondary,
      tenant_primary: tenant?.primary_color,
      tenant_secondary: tenant?.secondary_color
    });
  }, [colors, tenant]);
  
  const t = (key: string) => getTranslation(language, key);
  const languages: Language[] = ["en", "fr", "ar"];
  const [presence, setPresence] = useState({ present: 0, absent: 0 });
  const [extraHours, setExtraHours] = useState<ExtraHour[]>([]);
  const [loadingPresence, setLoadingPresence] = useState(true);
  const [loadingExtra, setLoadingExtra] = useState(true);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  type AbsencesTodayType = any[] | { error: string };
  const [absencesToday, setAbsencesToday] = useState<AbsencesTodayType>([]);
  const [loadingAbsences, setLoadingAbsences] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        setLoadingAbsences(true);
        const data = await getTodayAbsences();
        setAbsencesToday(
          Array.isArray(data) ? data : data && Array.isArray(data.results) ? data.results : data
        );
      } catch (err: any) {
        if (err?.response?.status === 401) {
          setAbsencesToday({ error: "unauthorized" });
        } else {
          console.error("❌ Error loading today's absences:", err?.message || err);
          setAbsencesToday([]);
        }
      } finally {
        setLoadingAbsences(false);
      }
    })();
  }, []);
  const handleApprove = async (id: number) => {
    try {
      await approveExtraHour(id);
      setExtraHours((prev) =>
        prev.filter((item) => {
          const itemId = item.id !== undefined ? item.id : (item as any).request_id;
          return itemId !== id;
        })
      );
    } catch (e: any) {
      const apiMessage = e?.response?.data || e?.message || "";
      console.error("❌ Approve error:", apiMessage);
      let msg = "Unable to approve request.";
      if (typeof apiMessage === "string") {
        if (
          apiMessage.toLowerCase().includes("already approved") ||
          apiMessage.toLowerCase().includes("already rejected")
        ) {
          msg = "This request has already been processed.";
        } else if (apiMessage.toLowerCase().includes("does not exist")) {
          msg = "This request no longer exists.";
        } else if (
          apiMessage.toLowerCase().includes("not allowed") ||
          apiMessage.toLowerCase().includes("permission")
        ) {
          msg = "You do not have permission to approve this request.";
        }
      }
      alert(msg);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectExtraHour(id);
      setExtraHours((prev) =>
        prev.filter((item) => {
          const itemId = item.id !== undefined ? item.id : (item as any).request_id;
          return itemId !== id;
        })
      );
    } catch (e: any) {
      const apiMessage = e?.response?.data || e?.message || "";
      console.error("❌ Reject error:", apiMessage);
      let msg = "Unable to reject request.";
      if (typeof apiMessage === "string") {
        if (
          apiMessage.toLowerCase().includes("already approved") ||
          apiMessage.toLowerCase().includes("already rejected")
        ) {
          msg = "This request has already been processed.";
        } else if (apiMessage.toLowerCase().includes("does not exist")) {
          msg = "This request no longer exists.";
        } else if (
          apiMessage.toLowerCase().includes("not allowed") ||
          apiMessage.toLowerCase().includes("permission")
        ) {
          msg = "You do not have permission to reject this request.";
        }
      }
      alert(msg);
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
        const data = await getTodayExtraHours();
        // // console.log("[Dashboard] Received today extra hours data:", data);
        // Data should be an array directly from the API
        if (Array.isArray(data)) {
          // console.log("[Dashboard] Data is array:", data);
          setExtraHours(data);
        } else if (data && typeof data === "object") {
          // If API returns {results: [...]} (fallback)
          const results = (data as any).results || (data as any).data || [];
          // console.log("[Dashboard] Data is object, results:", results);
          setExtraHours(Array.isArray(results) ? results : []);
        } else {
          // console.log("[Dashboard] Data is neither array nor object");
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
        style={{ backgroundColor: colors.secondary }}
      >
        <View className="flex-row items-center" />
        <View className="flex-1" />
        <TouchableOpacity onPress={() => setShowLanguageModal(true)} className="p-1 mr-3">
          <Ionicons name="globe-outline" size={28} color={colors.textDark} />
        </TouchableOpacity>
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
            {t("dashboard.presence_today")}
          </Text>
          <Ionicons name="people-outline" size={22} color={colors.accent} />
        </View>

        <Text className="text-sm mb-3" style={{ color: colors.text }}>
          {t("dashboard.manage_presence")}
        </Text>

        {loadingPresence ? (
          <ActivityIndicator color={colors.accent} size="small" />
        ) : presence.present === 0 && presence.absent === 0 ? (
          <View
            style={{
              backgroundColor: colors.lightGray,
              borderRadius: 14,
              padding: 18,
              alignItems: "center",
              marginTop: 12,
              marginBottom: 8,
            }}
          >
            <Ionicons
              name="checkbox-outline"
              size={32}
              color={colors.accent}
              style={{ marginBottom: 6 }}
            />
            <Text
              style={{
                color: colors.textDark,
                fontWeight: "600",
                fontSize: 15,
                textAlign: "center",
                marginBottom: 6,
              }}
            >
              {t("dashboard.no_attendance_marked")}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/presence")}
              style={{
                backgroundColor: colors.accent,
                borderRadius: 8,
                paddingVertical: 8,
                paddingHorizontal: 20,
                marginTop: 2,
              }}
              activeOpacity={0.9}
            >
              <Text style={{ color: "#fff", fontWeight: "500", fontSize: 14 }}>
                {t("dashboard.mark_attendance_now")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-row justify-between items-center mt-3">
            <View>
              <Text className="text-3xl font-bold" style={{ color: colors.accent }}>
                {presence.present}
              </Text>
              <Text style={{ color: colors.textLight }}>{t("dashboard.present")}</Text>
            </View>
            <View>
              <Text className="text-3xl font-bold" style={{ color: colors.errorDark }}>
                {presence.absent}
              </Text>
              <Text style={{ color: colors.textLight }}>{t("dashboard.absent")}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* --- Absences Today Bloc (Modernized) --- */}
      <View
        className="rounded-2xl p-5 mb-6 mx-5"
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
            {t("dashboard.absence_reports")} {t("dashboard.today")}
          </Text>
          <Ionicons name="alert-circle-outline" size={22} color={colors.accent} />
        </View>
        {loadingAbsences ? (
          <ActivityIndicator color={colors.accent} size="small" />
        ) : absencesToday &&
          !Array.isArray(absencesToday) &&
          absencesToday.error === "unauthorized" ? (
          <Text style={{ color: colors.error, textAlign: "center", marginTop: 10 }}>
            {typeof t === "function"
              ? t("dashboard.absences_unauthorized")
              : "You are not authorized to view absences. Please log in as an admin."}
          </Text>
        ) : Array.isArray(absencesToday) && absencesToday?.length > 0 ? (
          <View style={{ marginTop: 8 }}>
            {absencesToday.map((abs, idx) => {
              const name = abs.child_name || abs.child || "Unknown";
              const initials = name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              return (
                <View
                  key={abs.id || idx}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.lightTan,
                    borderRadius: 16,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    marginBottom: 10,
                    shadowColor: colors.accent,
                    shadowOpacity: 0.08,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  {/* Avatar/Initials */}
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      backgroundColor: colors.accentLight,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Text style={{ color: colors.accent, fontWeight: "bold", fontSize: 16 }}>
                      {initials}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    {/* Name */}
                    <Text
                      numberOfLines={1}
                      style={{ color: colors.textDark, fontWeight: "700", fontSize: 15 }}
                    >
                      {name}
                    </Text>
                    {/* Reason Title */}
                    <Text
                      style={{ color: colors.text, fontWeight: "600", fontSize: 12, marginTop: 1 }}
                    >
                      {t("dashboard.reason_title")}
                    </Text>
                    {/* Reason */}
                    <Text
                      numberOfLines={2}
                      style={{ color: colors.textLight, fontSize: 12, marginTop: 1 }}
                    >
                      {abs.reason || t("dashboard.no_reason")}
                    </Text>
                    {/* Full Period */}
                    {abs.start_date && abs.end_date && (
                      <Text style={{ color: colors.warning, fontSize: 11, marginTop: 2 }}>
                        {t("dashboard.absence_period")}: {abs.start_date} → {abs.end_date}
                      </Text>
                    )}
                  </View>
                  {/* Status Icon */}
                  <Ionicons
                    name="remove-circle"
                    size={18}
                    color={colors.error}
                    style={{ marginLeft: 10, alignSelf: "flex-start", marginTop: 2 }}
                  />
                </View>
              );
            })}
          </View>
        ) : (
          <View style={{ alignItems: "center", marginTop: 16, marginBottom: 8 }}>
            <Ionicons
              name="happy-outline"
              size={36}
              color={colors.accent}
              style={{ marginBottom: 4 }}
            />
            <Text style={{ color: colors.textLight, textAlign: "center", fontSize: 15 }}>
              {typeof t === "function" ? t("dashboard.no_absences_today") : "No absences today."}
            </Text>
          </View>
        )}
      </View>

      {/* --- Extra Hours Bloc --- */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push("/(admin)/extra-hours")}
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
            {t("dashboard.extra_hours")}
          </Text>
          <Ionicons name="time-outline" size={22} color={colors.accent} />
        </View>

        {loadingExtra ? (
          <ActivityIndicator color={colors.accent} size="small" />
        ) : !Array.isArray(extraHours) || extraHours.length === 0 ? (
          <Text style={{ color: colors.textLight, textAlign: "center", marginTop: 10 }}>
            {t("dashboard.no_requests")}
          </Text>
        ) : (
          <View style={{ marginTop: 8 }}>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: colors.accent, fontWeight: "600", fontSize: 14 }}>
                {extraHours.length} {t(extraHours.length === 1 ? "common.request" : "common.requests")}
              </Text>
            </View>
            {extraHours.slice(0, 3).map((req) => (
              <View
                key={(req.request_id || req.id) ?? Math.random()}
                className="flex-row items-center justify-between mb-3 border-b pb-2"
                style={{ borderColor: "#eee" }}
              >
                <View>
                  <Text className="font-medium" style={{ color: colors.textDark }}>
                    {typeof req.child === "string"
                      ? req.child
                      : req.child?.name || req.child_name || "Unknown"}
                  </Text>
                  <Text className="text-sm" style={{ color: colors.textLight }}>
                    {t("dashboard.extra_hours_duration")}: {req.duration ?? 0} min
                  </Text>
                </View>
              </View>
            ))}
            {extraHours.length > 3 && (
              <View style={{ marginTop: 8 }}>
                <Text
                  style={{
                    color: colors.accent,
                    fontWeight: "600",
                    fontSize: 13,
                    textAlign: "center",
                  }}
                >
                  +{extraHours.length - 3} more
                </Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Language Selection Modal */}
      <Modal visible={showLanguageModal} animationType="fade" transparent>
        <View
          className="flex-1 justify-center items-center px-6"
          style={{ backgroundColor: colors.overlayDark }}
        >
          <View
            className="w-full rounded-2xl p-6"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <Text className="text-xl font-bold mb-6 text-center" style={{ color: colors.textDark }}>
              {t("common.language")}
            </Text>

            {languages.map((lang) => (
              <TouchableOpacity
                key={lang}
                onPress={() => {
                  setLanguage(lang);
                  setShowLanguageModal(false);
                }}
                className="flex-row items-center p-4 mb-2 rounded-xl"
                style={{
                  backgroundColor: language === lang ? colors.accent : colors.background,
                }}
              >
                <Ionicons
                  name="globe-outline"
                  size={20}
                  color={language === lang ? colors.white : colors.textDark}
                />
                <Text
                  style={{
                    marginLeft: 12,
                    fontWeight: "600",
                    fontSize: 16,
                    color: language === lang ? colors.cardBackground : colors.textDark,
                  }}
                >
                  {lang === "en" ? "English" : lang === "fr" ? "Français" : "العربية"}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => setShowLanguageModal(false)}
              className="rounded-xl py-3 px-5 mt-4"
              style={{ backgroundColor: colors.accent }}
            >
              <Text className="text-white font-medium text-center">{t("common.cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
