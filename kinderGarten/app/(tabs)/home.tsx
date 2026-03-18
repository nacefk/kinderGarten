import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  TextInput,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { Bell, LogOut, Smile, Utensils, Moon, MessageSquare } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import { getColors } from "@/config/colors";
import { useAppStore } from "@/store/useAppStore";
import Card from "@/components/Card";
import { router } from "expo-router";
import { api } from "@/api/api";
import { getMyChild } from "@/api/children";
import { getReports } from "@/api/report";
import { getPlans } from "@/api/planning";
import { getMyExtraHourRequests, requestExtraHour } from "@/api/attendance";
import { getAttendanceForChild } from "@/api/attendanceStatus";
import { API_ENDPOINTS } from "@/config/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useLanguageStore } from "@/store/useLanguageStore";
import { getTranslation } from "@/config/translations";

// Absence request API helper
async function requestPlannedAbsence({
  childId,
  start_date,
  end_date,
  reason,
}: {
  childId: number;
  start_date: string;
  end_date: string;
  reason: string;
}) {
  // You may want to move this to /api/absenceRequest.ts for better structure
  return api.post("attendance/absence/request/", {
    child: childId,
    start_date,
    end_date,
    reason,
  });
}

export default function Home() {
  const { logout } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();
  const tenant = useAppStore((state) => state.tenant);
  const colors = getColors(tenant?.primary_color, tenant?.secondary_color);
  const t = (key: string) => getTranslation(language, key);

  const [profile, setProfile] = useState<any>(null);
  const [dailySummary, setDailySummary] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [extraHours, setExtraHours] = useState<any>({ status: "none", baseEndTime: "17:00" });
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // Planned Absence State
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  // Multi-day absence state
  const [absenceStartDate, setAbsenceStartDate] = useState<Date>(new Date());
  const [absenceEndDate, setAbsenceEndDate] = useState<Date>(new Date());
  const [absenceReason, setAbsenceReason] = useState("");
  const [absenceSubmitting, setAbsenceSubmitting] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // 🔹 Function to load all home data
  const loadData = useCallback(async () => {
    try {
      // 1️⃣ Get authenticated child profile
      const child = await getMyChild();
      // // console.log("[Home] Child object:", child);
      const classroomId = child.classroom?.id || child.classroom;
      const classroomName = child.classroom?.name || `Classroom ${classroomId}`;
      const childId = child.id;

      // 1️⃣.b Fetch attendance status for this child
      let attendanceStatus = null;
      try {
        attendanceStatus = await getAttendanceForChild(childId);
        // // console.log("[Home] Attendance record for child:", attendanceStatus);
      } catch (e) {
        console.error("[Home] Error fetching attendance status:", e);
      }

      // 2️⃣ Fetch parallel data
      const [reports, plans, allExtraRequests] = await Promise.all([
        getReports(childId),
        getPlans({ classroom: classroomId }),
        getMyExtraHourRequests(),
      ]);

      // 3️⃣ Fetch calendar events
      const eventsRes = await api.get(API_ENDPOINTS.PLANNING_EVENTS, {
        params: { classroom: classroomId },
      });

      // 4️⃣ Set local state
      setProfile({
        id: childId,
        name: child.name,
        avatar: child.avatar,
        present: attendanceStatus?.status === "present",
        className: classroomName,
      });

      setDailySummary(reports.length ? reports[0] : null);

      // 📊 Log mood and meals data
      if (reports.length > 0) {
        const latestReport = reports[0];
        // // console.log("📊 [Home] Latest Report Data:", {
        //   reportId: latestReport.id,
        //   childName: latestReport.child_name || "Unknown",
        //   date: latestReport.date,
        //   mood: latestReport.mood || latestReport.behavior || "N/A",
        //   eating: latestReport.eating || latestReport.meal || "N/A",
        //   sleeping: latestReport.sleeping || latestReport.nap || "N/A",
        //   notes: latestReport.notes || "No notes",
        //   activities: latestReport.activities || "No activities",
        //   mediaCount: latestReport.media_files?.length || 0,
        // });
      } else {
        // // console.log("📊 [Home] No reports available for this child");
      }
      // Find the most recent request for this child (if any)
      const myChildRequest = Array.isArray(allExtraRequests)
        ? allExtraRequests.find((req) => req.child === childId && req.status === "pending")
        : null;
      setExtraHours(myChildRequest || { status: "none" });

      buildTimeline(plans, eventsRes.data?.results || eventsRes.data, classroomName);
    } catch (err: any) {
      console.error(`❌ Error fetching home data: ${err.response?.data || err.message}`);
      Alert.alert("Error", "Unable to load data. Please try again.");
    }
  }, []);

  // 🔹 Load all home data - runs when screen is focused
  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        await loadData();
        setLoading(false);
      })();
    }, [loadData])
  );

  // 🔹 Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // 🔹 Build today's timeline & upcoming activity
  const buildTimeline = useCallback((plans: any, events: any[], className: string) => {
    try {
      if (!className || typeof className !== "string") {
        throw new Error("Invalid className");
      }

      const today = new Date();
      const todayFrench = today.toLocaleDateString("fr-FR", { weekday: "long" });
      const dayKey = todayFrench.charAt(0).toUpperCase() + todayFrench.slice(1);

      // Extract today's activities from plans
      let todayActivities: any[] = [];

      if (Array.isArray(plans)) {
        plans.forEach((plan: any) => {
          // 🔥 Handle new format with activities array
          if (Array.isArray(plan.activities) && plan.activities.length > 0) {
            plan.activities.forEach((activity: any) => {
              if (!activity.starts_at) return;
              const actDate = new Date(activity.starts_at);
              // Check if activity is today
              if (
                actDate.getFullYear() === today.getFullYear() &&
                actDate.getMonth() === today.getMonth() &&
                actDate.getDate() === today.getDate()
              ) {
                const time = `${String(actDate.getHours()).padStart(2, "0")}:${String(actDate.getMinutes()).padStart(2, "0")}`;
                todayActivities.push({
                  title: activity.title || "Activity",
                  time,
                  starts_at: activity.starts_at,
                });
              }
            });
          }
          // 🔥 Handle old format with day/time fields
          else if (plan && plan.day === dayKey && plan.time && plan.title) {
            todayActivities.push({
              title: plan.title,
              time: plan.time,
            });
          }
        });
      }

      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();
      let lastActivity = null;
      let nextActivity = null;

      for (const activity of todayActivities) {
        if (!activity.time || typeof activity.time !== "string") continue;

        const timeParts = activity.time.split(":");
        if (timeParts.length !== 2) continue;

        const [h, m] = timeParts.map(Number);
        if (isNaN(h) || isNaN(m)) continue;

        const mins = h * 60 + m;
        if (mins <= nowMins) lastActivity = activity;
        if (!nextActivity && mins > nowMins) nextActivity = activity;
      }

      setTimeline(
        lastActivity
          ? [
              {
                title: lastActivity.title,
                description: `Class : ${className} — current activity`,
                image: "https://i.pravatar.cc/100?img=5",
              },
            ]
          : []
      );

      if (nextActivity) {
        const [h, m] = nextActivity.time.split(":").map(Number);
        setUpcoming([
          {
            title: nextActivity.title,
            datetime: new Date(new Date().setHours(h, m, 0, 0)),
            image: "https://i.pravatar.cc/100?img=12",
          },
        ]);
      } else if (Array.isArray(events)) {
        const nextEvent = events
          .map((e: any) => ({ ...e, dateObj: new Date(e.date) }))
          .filter((e: any) => e.dateObj > now)
          .sort((a: any, b: any) => a.dateObj - b.dateObj)[0];
        if (nextEvent) {
          setUpcoming([
            {
              title: nextEvent.title,
              datetime: nextEvent.dateObj,
              image: "https://i.pravatar.cc/100?img=12",
            },
          ]);
        }
      }
    } catch (e) {
      console.error("⚠️ Timeline build error:", e);
      setTimeline([]);
    }
  }, []);

  // ✅ Memoized extra hours request handler
  const handleRequestExtraHours = useCallback(async () => {
    if (!selectedOption) return;

    try {
      const child = await getMyChild();
      const baseEnd = extraHours.baseEndTime || "17:00";
      const [h, m] = baseEnd.split(":").map(Number);
      const baseMinutes = h * 60 + m;
      const total = baseMinutes + selectedOption;

      const newHour = Math.floor(total / 60)
        .toString()
        .padStart(2, "0");
      const newMinute = (total % 60).toString().padStart(2, "0");
      const endTime = `${newHour}:${newMinute}`;

      // Build valid ISO datetime strings for today using Date object
      const today = new Date();
      const [startHour, startMinute] = baseEnd.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);
      const startDateObj = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        startHour,
        startMinute,
        0,
        0
      );
      const endDateObj = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        endHour,
        endMinute,
        0,
        0
      );
      const startIso = startDateObj.toISOString();
      const endIso = endDateObj.toISOString();

      await requestExtraHour({
        child: child.id,
        duration: selectedOption,
      });

      // 1️⃣ Set UI to pending immediately (optimistic update)
      // console.log("[ExtraHour] Setting UI to pending...");
      setExtraHours({ status: "pending" });
      setSelectedOption(null);

      // 2️⃣ Fetch actual status from backend
      try {
        const allExtraRequests = await getMyExtraHourRequests();
        // Find the most recent request for this child
        const myChildRequests = Array.isArray(allExtraRequests)
          ? allExtraRequests.filter((req) => req.child === child.id)
          : [];
        if (myChildRequests.length > 0) {
          // Sort by created/updated date if available, fallback to first
          const sorted = myChildRequests.sort((a, b) => {
            if (a.updated && b.updated) {
              return new Date(b.updated).getTime() - new Date(a.updated).getTime();
            }
            if (a.created && b.created) {
              return new Date(b.created).getTime() - new Date(a.created).getTime();
            }
            return 0;
          });
          const latest = sorted[0];
          // console.log("[ExtraHour] Backend response status:", latest.status, latest);
          setExtraHours(latest);
        }
      } catch (fetchErr) {
        console.warn("⚠️ Error fetching extra hour requests after request:", fetchErr);
      }

      Alert.alert("Request Sent", "Your request is pending approval.");
    } catch (err: any) {
      const apiMessage = err?.response?.data || err?.message || "";
      console.error("❌ Error:", apiMessage);
      if (
        typeof apiMessage === "string" &&
        apiMessage.toLowerCase().includes("pending extra hour request")
      ) {
        Alert.alert(
          "Pending Request",
          "You already have a pending request for this child. Please wait for approval or rejection before submitting another."
        );
      } else {
        Alert.alert("Error", "Unable to send request.");
      }
    }
  }, [selectedOption, extraHours]);

  // ✅ Memoized end time calculation
  const calculateNewEndTime = useCallback(() => {
    if (!selectedOption) return extraHours?.baseEndTime || "17:00";
    const [hour, minute] = (extraHours?.baseEndTime || "17:00").split(":").map(Number);
    const total = hour * 60 + minute + selectedOption;
    const newHour = String(Math.floor(total / 60)).padStart(2, "0");
    const newMinute = String(total % 60).padStart(2, "0");
    return `${newHour}:${newMinute}`;
  }, [selectedOption, extraHours]);

  // ✅ Logout handler
  const handleLogout = useCallback(async () => {
    await logout();
    router.replace("/(authentication)/login");
  }, [logout]);

  // Planned Absence Submit Handler
  const handleSubmitAbsence = useCallback(async () => {
    if (!profile?.id || !absenceStartDate || !absenceEndDate || !absenceReason.trim()) {
      Alert.alert("Missing info", "Please select a start and end date and enter a reason.");
      return;
    }
    if (absenceEndDate < absenceStartDate) {
      Alert.alert("Invalid range", "End date cannot be before start date.");
      return;
    }
    setAbsenceSubmitting(true);
    try {
      await requestPlannedAbsence({
        childId: profile.id,
        start_date: absenceStartDate.toISOString().split("T")[0],
        end_date: absenceEndDate.toISOString().split("T")[0],
        reason: absenceReason.trim(),
      });
      setShowAbsenceModal(false);
      setAbsenceReason("");
      setAbsenceStartDate(new Date());
      setAbsenceEndDate(new Date());
      Alert.alert("Success", "Absence reported for selected days.");
    } catch (err: any) {
      console.error("❌ Absence request error:", err);
      const backendMsg = err.response?.data?.message || err.response?.data?.detail || err.message;
      Alert.alert("Error", backendMsg || "Failed to report absence. Please try again.");
    } finally {
      setAbsenceSubmitting(false);
    }
  }, [profile, absenceStartDate, absenceEndDate, absenceReason]);

  if (loading)
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={{ color: colors.textLight, marginTop: 10 }}>{t("common.loading")}</Text>
      </View>
    );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar barStyle={"dark-content"} />

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-7 pt-16 pb-6"
        style={{ backgroundColor: colors.secondary }}
      >
        <View className="flex-row items-center">
          <Image source={{ uri: profile?.avatar }} className="w-16 h-16 rounded-full mr-5" />
          <View>
            <Text className="text-2xl font-bold" style={{ color: colors.textDark }}>
              {profile?.name}
            </Text>
            <Text
              className="font-semibold text-base"
              style={{ color: profile?.present ? colors.success : colors.error }}
            >
              ● {profile?.present ? t("dashboard.present") : t("dashboard.absent")}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => setShowLanguageModal(true)} className="p-1 mr-3">
            <Ionicons name="globe-outline" size={28} color={colors.textDark} />
          </TouchableOpacity>
          <TouchableOpacity className="mr-4">
            <Bell color={colors.textDark} size={28} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} className="p-1">
            <LogOut color={colors.textDark} size={28} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Tenant Logo */}
        {tenant?.logo && (
          <View
            className="mt-6 mb-3  p-2 items-center"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <Image
              source={{ uri: tenant.logo }}
              style={{ width: 180, height: 90, resizeMode: "contain" }}
            />
          </View>
        )}

        {/* ...existing code... */}
        {/* Daily Summary */}
        <Card title={t("home.today_activity")}>
          {dailySummary ? (
            <View style={{ gap: 16 }}>
              {/* Mood */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  backgroundColor: colors.accentLight,
                  borderRadius: 10,
                }}
              >
                <Smile size={24} color={colors.accent} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textLight, fontSize: 11, marginBottom: 2 }}>
                    {t("reports.behavior")}
                  </Text>
                  <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16 }}>
                    {dailySummary.mood || dailySummary.behavior || "—"}
                  </Text>
                </View>
              </View>

              {/* Meal */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  backgroundColor: colors.warningLight,
                  borderRadius: 10,
                }}
              >
                <Utensils size={24} color={colors.warningAmber} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textLight, fontSize: 11, marginBottom: 2 }}>
                    {t("reports.meal")}
                  </Text>
                  <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16 }}>
                    {dailySummary.eating || dailySummary.meal || "—"}
                  </Text>
                </View>
              </View>

              {/* Sleep */}
              {(dailySummary.sleeping || dailySummary.nap) && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    backgroundColor: colors.indigoLight,
                    borderRadius: 10,
                  }}
                >
                  <Moon size={24} color={colors.indigoDark} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textLight, fontSize: 11, marginBottom: 2 }}>
                      {t("reports.nap")}
                    </Text>
                    <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16 }}>
                      {dailySummary.sleeping || dailySummary.nap}
                    </Text>
                  </View>
                </View>
              )}

              {/* Notes */}
              {dailySummary.notes && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    backgroundColor: colors.lightGrayBg,
                    borderRadius: 10,
                  }}
                >
                  <MessageSquare
                    size={24}
                    color={colors.textLight}
                    style={{ marginRight: 12, marginTop: 2 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textLight, fontSize: 11, marginBottom: 2 }}>
                      {t("reports.notes")}
                    </Text>
                    <Text style={{ color: colors.text, fontSize: 15, lineHeight: 20 }}>
                      {dailySummary.notes}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <Text style={{ color: colors.textLight, fontSize: 16 }}>
                {t("activity.no_activity")}
              </Text>
            </View>
          )}
        </Card>

        {/* Timeline */}
        <Card title={t("home.current_activity")}>
          {timeline.length ? (
            timeline.map((item, i) => (
              <View key={`timeline-${i}`} className="flex-row items-center mb-3">
                <Image source={{ uri: item.image }} className="w-12 h-12 rounded-lg mr-3" />
                <View>
                  <Text style={{ color: colors.textDark, fontWeight: "500" }}>{item.title}</Text>
                  <Text style={{ color: colors.text }}>{item.description}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={{ color: colors.textLight }}>{t("home.no_current_activity")}</Text>
          )}
        </Card>

        {/* Upcoming */}
        <Card title={t("home.upcoming")}>
          {upcoming.length ? (
            upcoming.map((e, i) => (
              <View key={`upcoming-${i}`} className="flex-row items-center mb-3">
                <Image source={{ uri: e.image }} className="w-10 h-10 rounded-full mr-3" />
                <View>
                  <Text style={{ color: colors.textDark, fontWeight: "500" }}>{e.title}</Text>
                  <Text style={{ color: colors.text }}>
                    {new Date(e.datetime).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={{ color: colors.textLight }}>{t("home.no_upcoming_activity")}</Text>
          )}
        </Card>

        {/* Extra Hours */}
        <Card title={t("home.extra_hours")}>
          {extraHours?.status === "none" && (
            <>
              <Text style={{ color: colors.text, marginBottom: 12, fontSize: 15 }}>
                {t("home.extra_hours_description")}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {[15, 30, 60].map((opt) => {
                  const isSelected = selectedOption === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => setSelectedOption(opt)}
                      style={{
                        backgroundColor: isSelected ? colors.accent : colors.lightGrayBg,
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 12,
                        flex: 1,
                        minWidth: "30%",
                        alignItems: "center",
                        borderWidth: 2,
                        borderColor: isSelected ? colors.accent : "transparent",
                      }}
                    >
                      <Text
                        style={{
                          color: isSelected ? "#fff" : colors.textDark,
                          fontWeight: isSelected ? "600" : "500",
                          fontSize: 15,
                        }}
                      >
                        +{opt === 60 ? "1h" : `${opt}m`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                disabled={!selectedOption}
                onPress={handleRequestExtraHours}
                style={{
                  backgroundColor: selectedOption ? colors.accent : colors.textLight,
                  paddingVertical: 12,
                  borderRadius: 12,
                  opacity: selectedOption ? 1 : 0.6,
                }}
              >
                <Text
                  style={{
                    color: colors.cardBackground,
                    textAlign: "center",
                    fontWeight: "600",
                    fontSize: 15,
                  }}
                >
                  {t("home.extra_hours")}
                </Text>
              </TouchableOpacity>
            </>
          )}
          {extraHours?.status === "pending" && (
            <View
              style={{
                backgroundColor: colors.warningLight,
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.warningDarkText, fontWeight: "600", fontSize: 15 }}>
                {t("home.extra_hours_pending")}
              </Text>
            </View>
          )}
          {extraHours?.status === "approved" && (
            <View
              style={{
                backgroundColor: colors.greenLight,
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.success, fontWeight: "600", fontSize: 15 }}>
                {t("home.extra_hours_approved")}
              </Text>
            </View>
          )}
        </Card>

        {/* Planned Absence Card - styled to match other views */}
        <Card title={t("home.report_planned_absence") || "Report Planned Absence"}>
          <TouchableOpacity
            onPress={() => setShowAbsenceModal(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.accent,
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 18,
              marginBottom: 8,
              shadowColor: colors.accent,
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Ionicons name="calendar-outline" size={22} color="#fff" style={{ marginRight: 10 }} />
            <Text
              style={{
                color: "#fff",
                fontWeight: "700",
                fontSize: 16,
              }}
            >
              {t("home.absence_button_pick_absence_dates") || "Pick absence dates"}
            </Text>
          </TouchableOpacity>
          <Text
            style={{
              color: colors.textLight,
              fontSize: 13,
              marginLeft: 2,
              marginBottom: 2,
            }}
          >
            {t("home.absence_section_hint") ||
              "Let us know if your child will be absent for one or more days."}
          </Text>
        </Card>
      </ScrollView>

      {/* Planned Absence Modal (multi-day, no Card, scrollable) */}
      <Modal visible={showAbsenceModal} animationType="fade" transparent>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.overlayMedium,
          }}
        >
          <View
            style={{
              backgroundColor: colors.cardBackground,
              borderRadius: 18,
              paddingHorizontal: 20,
              paddingTop: 24,
              paddingBottom: 28,
              width: "92%",
              maxWidth: 440,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
              elevation: 8,
              maxHeight: "90%",
            }}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: colors.textDark,
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                {t("home.report_planned_absence")}
              </Text>
              <Text
                style={{
                  color: colors.textLight,
                  fontSize: 14,
                  textAlign: "center",
                  marginBottom: 18,
                }}
              >
                {t("home.absence_modal_subtitle")}
              </Text>
              {/* Start Date Picker */}
              <TouchableOpacity
                onPress={() => setShowStartDatePicker(true)}
                style={{
                  backgroundColor: colors.accentLight,
                  borderRadius: 10,
                  padding: 14,
                  marginBottom: 10,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.textDark, fontWeight: "600", fontSize: 16 }}>
                  <Ionicons name="calendar-outline" size={18} color={colors.textDark} />{" "}
                  {absenceStartDate
                    ? `Start: ${absenceStartDate.toLocaleDateString()}`
                    : "Select Start Date"}
                </Text>
              </TouchableOpacity>
              {showStartDatePicker && (
                <DateTimePicker
                  value={absenceStartDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                    setShowStartDatePicker(false);
                    if (selectedDate) {
                      setAbsenceStartDate(selectedDate);
                      if (absenceEndDate < selectedDate) {
                        setAbsenceEndDate(selectedDate);
                      }
                    }
                  }}
                  minimumDate={new Date()}
                />
              )}
              {/* End Date Picker */}
              <TouchableOpacity
                onPress={() => setShowEndDatePicker(true)}
                style={{
                  backgroundColor: colors.accentLight,
                  borderRadius: 10,
                  padding: 14,
                  marginBottom: 18,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.textDark, fontWeight: "600", fontSize: 16 }}>
                  <Ionicons name="calendar-outline" size={18} color={colors.textDark} />{" "}
                  {absenceEndDate
                    ? `End: ${absenceEndDate.toLocaleDateString()}`
                    : "Select End Date"}
                </Text>
              </TouchableOpacity>
              {showEndDatePicker && (
                <DateTimePicker
                  value={absenceEndDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                    setShowEndDatePicker(false);
                    if (selectedDate) setAbsenceEndDate(selectedDate);
                  }}
                  minimumDate={absenceStartDate > new Date() ? absenceStartDate : new Date()}
                />
              )}
              {/* Reason Input */}
              <TextInput
                placeholder={t("home.absence_reason_placeholder")}
                value={absenceReason}
                onChangeText={setAbsenceReason}
                style={{
                  backgroundColor: colors.background,
                  borderRadius: 10,
                  padding: 14,
                  marginBottom: 18,
                  color: colors.textDark,
                  fontSize: 16,
                  minHeight: 48,
                  textAlignVertical: "top",
                }}
                multiline
                numberOfLines={3}
                editable={!absenceSubmitting}
                maxLength={200}
              />
              {/* Absence Days Counter */}
              <View style={{ alignItems: "center", marginBottom: 10 }}>
                <Text style={{ color: colors.textDark, fontWeight: "600", fontSize: 15 }}>
                  {t("home.absence_days_count") || "Selected days:"}{" "}
                  {Math.max(
                    1,
                    Math.round(
                      (absenceEndDate.getTime() - absenceStartDate.getTime()) /
                        (1000 * 60 * 60 * 24)
                    ) + 1
                  )}
                </Text>
              </View>
              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmitAbsence}
                disabled={absenceSubmitting || !absenceReason.trim()}
                style={{
                  backgroundColor:
                    absenceSubmitting || !absenceReason.trim() ? colors.textLight : colors.accent,
                  paddingVertical: 14,
                  borderRadius: 12,
                  opacity: absenceSubmitting || !absenceReason.trim() ? 0.6 : 1,
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    color: colors.cardBackground,
                    textAlign: "center",
                    fontWeight: "700",
                    fontSize: 16,
                  }}
                >
                  {absenceSubmitting ? t("common.loading") : t("home.submit_absence")}
                </Text>
              </TouchableOpacity>
              {/* Cancel Button */}
              <TouchableOpacity
                onPress={() => setShowAbsenceModal(false)}
                disabled={absenceSubmitting}
                style={{
                  backgroundColor: colors.error,
                  paddingVertical: 12,
                  borderRadius: 10,
                  opacity: absenceSubmitting ? 0.6 : 1,
                }}
              >
                <Text
                  style={{
                    color: colors.cardBackground,
                    textAlign: "center",
                    fontWeight: "600",
                    fontSize: 15,
                  }}
                >
                  {t("common.cancel") || "Cancel"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Language Modal */}
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

            {["en", "fr", "ar"].map((lang) => (
              <TouchableOpacity
                key={lang}
                onPress={() => {
                  setLanguage(lang as "en" | "fr" | "ar");
                }}
                className="flex-row items-center p-4 mb-2 rounded-xl"
                style={{
                  backgroundColor: language === lang ? colors.maleBlue : colors.background,
                }}
              >
                <Ionicons
                  name="globe-outline"
                  size={20}
                  color={language === lang ? colors.cardBackground : colors.textDark}
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
              <Text className="text-center text-white font-semibold">{t("common.save")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
