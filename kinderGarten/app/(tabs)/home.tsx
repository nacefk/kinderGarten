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
} from "react-native";
import { Bell, LogOut } from "lucide-react-native";
import colors from "@/config/colors";
import Card from "@/components/Card";
import { router } from "expo-router";
import { api } from "@/api/api";
import { getMyChild } from "@/api/children";
import { getReports } from "@/api/report";
import { getPlans } from "@/api/planning";
import { getPendingExtraHours, requestExtraHour } from "@/api/attendance";
import { API_ENDPOINTS } from "@/config/api";
import { useAuthStore } from "@/store/useAuthStore";

export default function Home() {
  const { logout } = useAuthStore();

  const [profile, setProfile] = useState<any>(null);
  const [dailySummary, setDailySummary] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [extraHours, setExtraHours] = useState<any>({ status: "none", baseEndTime: "17:00" });
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Load all home data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // 1️⃣ Get authenticated child profile
        const child = await getMyChild();
        const className = child.classroom;
        const childId = child.id;

        // 2️⃣ Fetch parallel data
        const [reports, plans, pendingExtra] = await Promise.all([
          getReports(childId),
          getPlans({ class_name: className }),
          getPendingExtraHours(),
        ]);

        // 3️⃣ Fetch calendar events
        const eventsRes = await api.get(API_ENDPOINTS.PLANNING_EVENTS);

        // 4️⃣ Set local state
        setProfile({
          id: childId,
          name: child.name,
          avatar: child.avatar,
          present: child.attendanceStatus === "present" || child.present === true,
          className,
        });

        setDailySummary(reports.length ? reports[0] : null);
        setExtraHours(
          Array.isArray(pendingExtra) && pendingExtra.length > 0
            ? pendingExtra[0]
            : { status: "none" }
        );

        buildTimeline(plans, eventsRes.data, className);
      } catch (err: any) {
        console.error("❌ Error fetching home data:", err.response?.data || err.message);
        Alert.alert("Error", "Unable to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 🔹 Build today's timeline & upcoming activity
  const buildTimeline = useCallback((plans: any, events: any[], className: string) => {
    try {
      if (!className || typeof className !== "string") {
        throw new Error("Invalid className");
      }

      const today = new Date().toLocaleDateString("fr-FR", { weekday: "long" });
      const dayKey = today.charAt(0).toUpperCase() + today.slice(1);

      // Safe data access
      const classPlan = Array.isArray(plans?.[className]?.[dayKey])
        ? plans[className][dayKey]
        : Array.isArray(plans)
          ? plans.filter((p: any) => p.day === dayKey)
          : [];

      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();
      let lastActivity = null;
      let nextActivity = null;

      for (const plan of classPlan) {
        if (!plan.time || typeof plan.time !== "string") continue;

        const timeParts = plan.time.split(":");
        if (timeParts.length !== 2) continue;

        const [h, m] = timeParts.map(Number);
        if (isNaN(h) || isNaN(m)) continue;

        const mins = h * 60 + m;
        if (mins <= nowMins) lastActivity = plan;
        if (!nextActivity && mins > nowMins) nextActivity = plan;
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

      await requestExtraHour({
        child: child.id,
        start: baseEnd,
        end: endTime,
      });

      setExtraHours({
        ...extraHours,
        status: "pending",
        requestedMinutes: selectedOption,
      });

      Alert.alert("Request Sent", "Your request is pending approval.");
    } catch (err: any) {
      console.error("❌ Error:", err.response?.data || err.message);
      Alert.alert("Error", "Unable to send request.");
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

  // ✅ Polling for attendance status updates
  useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const startPolling = async () => {
      try {
        pollInterval = setInterval(async () => {
          try {
            const response = await getPendingExtraHours();
            const pendingExtra = response.data || response || [];
            if (Array.isArray(pendingExtra) && pendingExtra.length > 0) {
              const current = pendingExtra[0];
              if (current.status === "approved") {
                setExtraHours({ status: "approved" });
              } else if (current.status === "pending") {
                setExtraHours({ status: "pending" });
              }
            }
          } catch (error) {
            console.warn("⚠️ Polling error:", error);
          }
        }, 30000); // Poll every 30 seconds
      } catch (error) {
        console.error("❌ Polling setup failed:", error);
      }
    };

    startPolling();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  // ✅ Logout handler
  const handleLogout = useCallback(async () => {
    await logout();
    router.replace("/(authentication)/login");
  }, [logout]);

  if (loading)
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={{ color: colors.textLight, marginTop: 10 }}>Loading...</Text>
      </View>
    );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar barStyle={"dark-content"} />

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-7 pt-16 pb-6"
        style={{ backgroundColor: colors.accentLight }}
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
              ● {profile?.present ? "Present" : "Absent"}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center">
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
      >
        {/* Daily Summary */}
        <Card title="Mood & Meals">
          {dailySummary ? (
            <>
              <Text style={{ color: colors.text }}>
                Mood : <Text style={{ fontWeight: "600" }}>{dailySummary.behavior || "—"}</Text>
              </Text>
              <Text style={{ color: colors.text }}>
                Meal : <Text style={{ fontWeight: "600" }}>{dailySummary.meal || "—"}</Text>
              </Text>
              {dailySummary.notes && (
                <Text
                  style={{
                    color: colors.textLight,
                    marginTop: 4,
                    fontStyle: "italic",
                  }}
                >
                  &quot;{dailySummary.notes}&quot;
                </Text>
              )}
            </>
          ) : (
            <Text style={{ color: colors.textLight }}>No data for today.</Text>
          )}
        </Card>

        {/* Timeline */}
        <Card title="Timeline">
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
            <Text style={{ color: colors.textLight }}>No activities now.</Text>
          )}
        </Card>

        {/* Upcoming */}
        <Card title="Upcoming">
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
            <Text style={{ color: colors.textLight }}>No upcoming events.</Text>
          )}
        </Card>

        {/* Extra Hours */}
        <Card title="Extra Hours">
          {extraHours?.status === "none" && (
            <>
              <Text style={{ color: colors.text, marginBottom: 12 }}>
                Request additional supervision time
              </Text>
              <View className="flex-row justify-between mb-4">
                {[15, 30, 60].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setSelectedOption(opt)}
                    className="flex-1 mx-1 py-3 rounded-xl border"
                    style={{
                      backgroundColor:
                        selectedOption === opt ? colors.accent : colors.cardBackground,
                      borderColor: selectedOption === opt ? colors.accent : "#D1D5DB",
                    }}
                  >
                    <Text
                      className="text-center font-medium"
                      style={{ color: selectedOption === opt ? "#FFF" : colors.text }}
                    >
                      +{opt === 60 ? "1h" : `${opt} min`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                disabled={!selectedOption}
                onPress={handleRequestExtraHours}
                className="py-3 rounded-xl"
                style={{ backgroundColor: selectedOption ? colors.accent : colors.textLight }}
              >
                <Text className="text-center text-white font-semibold">Request Extra Hours</Text>
              </TouchableOpacity>
            </>
          )}
          {extraHours?.status === "pending" && (
            <Text style={{ color: colors.warning, textAlign: "center" }}>Pending approval ⏳</Text>
          )}
          {extraHours?.status === "approved" && (
            <Text style={{ color: colors.success, textAlign: "center" }}>Approved ✅</Text>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}
