import React, { useEffect, useState } from "react";
import { ScrollView, StatusBar, Text, TouchableOpacity, View, Image } from "react-native";
import { Bell } from "lucide-react-native";
import { useAppStore } from "../../store/useAppStore";
import colors from "../../config/colors";
import Card from "../../components/Card";

export default function Home({ childId = "child_014" }) {
  const { childrenList, dailyReports, weeklyPlans, calendarEvents } = useAppStore();

  const [profile, setProfile] = useState<any>(null);
  const [dailySummary, setDailySummary] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [extraHours, setExtraHours] = useState({
    baseEndTime: "17:00",
    status: "none",
    requestedMinutes: null,
  });
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  /** 📦 Build child-specific data */
  useEffect(() => {
    if (!childrenList || !dailyReports || !weeklyPlans) return;

    const child = childrenList.find((c: any) => c.id === childId);
    if (!child) return;

    setProfile({
      id: child.id,
      name: child.name,
      avatar: child.avatar,
      present: child.attendanceStatus === "present",
      className: child.className,
    });

    const report = dailyReports.find((r: any) => r.childId === child.id);
    if (report) {
      setDailySummary({
        lunch: report.meal,
        napDuration: report.nap,
        activityMood: report.activity,
      });
    }

    // 🕒 Build timeline & upcoming from weekly plan
    const today = new Date().toLocaleDateString("fr-FR", { weekday: "long" });
    const capitalizedDay = today.charAt(0).toUpperCase() + today.slice(1);
    const classPlan = weeklyPlans?.[child.className]?.[capitalizedDay] || [];

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    let lastActivity = null;
    let nextActivity = null;

    for (let i = 0; i < classPlan.length; i++) {
      const [h, m] = classPlan[i].time.split(":").map(Number);
      const activityTime = h * 60 + m;

      if (activityTime <= currentTime) lastActivity = classPlan[i];
      if (activityTime > currentTime) {
        nextActivity = classPlan[i];
        break;
      }
    }

    if (lastActivity)
      setTimeline([
        {
          title: lastActivity.title,
          description: `${child.className} — current activity`,
          image: "https://i.pravatar.cc/100?img=30",
        },
      ]);

    if (nextActivity)
      setUpcoming([
        {
          title: nextActivity.title,
          datetime: new Date(
            new Date().setHours(...nextActivity.time.split(":").map(Number))
          ),
          image: "https://i.pravatar.cc/100?img=12",
        },
      ]);
    else if (calendarEvents?.length) {
      // fallback: next class-related calendar event
      const nextEvent = calendarEvents
        .filter(
          (e: any) =>
            e.className === child.className || e.className === "Toutes les classes"
        )
        .map((e: any) => ({ ...e, dateObj: new Date(e.date) }))
        .filter((e: any) => e.dateObj > now)
        .sort((a: any, b: any) => a.dateObj - b.dateObj)[0];
      if (nextEvent)
        setUpcoming([
          {
            title: nextEvent.title,
            datetime: nextEvent.dateObj,
            image: "https://i.pravatar.cc/100?img=12",
          },
        ]);
    }
  }, [childId, childrenList, dailyReports, weeklyPlans, calendarEvents]);

  /** ⏰ Extra Hours Logic */
  const handleRequestExtraHours = () => {
    if (!selectedOption) return;
    setExtraHours((prev) => ({ ...prev, status: "pending", requestedMinutes: selectedOption }));
    setTimeout(() => {
      setExtraHours((prev) => ({ ...prev, status: "approved" }));
    }, 3000);
  };

  const calculateNewEndTime = () => {
    if (!selectedOption) return extraHours.baseEndTime || "17:00";
    const [hour, minute] = (extraHours.baseEndTime || "17:00").split(":").map(Number);
    const totalMinutes = hour * 60 + minute + selectedOption;
    const newHour = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
    const newMinute = (totalMinutes % 60).toString().padStart(2, "0");
    return `${newHour}:${newMinute}`;
  };

  /** 🧭 UI Rendering */
  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar barStyle={"dark-content"} />

      {/* 🧭 Header */}
      <View
        className="flex-row items-center justify-between px-7 pt-16 pb-6"
        style={{ backgroundColor: colors.accentLight }}
      >
        <View className="flex-row items-center">
          <Image
            source={{ uri: profile?.avatar }}
            className="w-16 h-16 rounded-full mr-5"
          />
          <View>
            <Text className="text-2xl font-bold" style={{ color: colors.textDark }}>
              {profile?.name ?? "Loading..."}
            </Text>
            <Text
              className="font-semibold text-base"
              style={{ color: profile?.present ? colors.success : colors.error }}
            >
              ● {profile?.present ? "Checked in" : "Checked out"}
            </Text>
          </View>
        </View>
        <TouchableOpacity>
          <Bell color={colors.textDark} size={32} />
        </TouchableOpacity>
      </View>

      {/* 📜 Scroll content */}
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* 📅 Today at a Glance */}
        <Card title="Today at a Glance">
          {dailySummary ? (
            <>
              <View className="flex-row justify-between mb-2">
                <Text style={{ color: colors.text }}>🍽 Lunch</Text>
                <Text style={{ color: colors.textDark, fontWeight: "500" }}>
                  {dailySummary.lunch}
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text style={{ color: colors.text }}>😴 Nap</Text>
                <Text style={{ color: colors.textDark, fontWeight: "500" }}>
                  {dailySummary.napDuration}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text style={{ color: colors.text }}>🎨 Activity</Text>
                <Text style={{ color: colors.textDark, fontWeight: "500" }}>
                  {dailySummary.activityMood}
                </Text>
              </View>
            </>
          ) : (
            <Text style={{ color: colors.textLight }}>Loading summary...</Text>
          )}

          <TouchableOpacity
            className="mt-4 py-2 rounded-xl"
            style={{ backgroundColor: colors.accent }}
          >
            <Text className="text-center text-white font-semibold">
              View full report
            </Text>
          </TouchableOpacity>
        </Card>

        {/* 🕒 Timeline */}
        <Card title="Timeline">
          {timeline?.length > 0 ? (
            timeline.map((item, index) => (
              <View key={index} className="flex-row items-center mb-3">
                <Image
                  source={{ uri: item.image }}
                  className="w-12 h-12 rounded-lg mr-3"
                />
                <View>
                  <Text style={{ color: colors.textDark, fontWeight: "500" }}>
                    {item.title}
                  </Text>
                  <Text style={{ color: colors.text }}>{item.description}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={{ color: colors.textLight }}>No timeline yet.</Text>
          )}
        </Card>

        {/* 📆 Upcoming */}
        <Card title="Upcoming">
          {upcoming?.length > 0 ? (
            upcoming.map((event, index) => (
              <View key={index} className="flex-row items-center mb-3">
                <Image
                  source={{ uri: event.image }}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <View>
                  <Text style={{ color: colors.textDark, fontWeight: "500" }}>
                    {event.title}
                  </Text>
                  <Text style={{ color: colors.text }}>
                    {new Date(event.datetime).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={{ color: colors.textLight }}>No upcoming events.</Text>
          )}
        </Card>

        {/* ⏰ Extra Hours */}
        <Card title="Extra Hours">
          {extraHours.status === "none" && (
            <>
              <Text style={{ color: colors.text, marginBottom: 12 }}>
                Request additional care time
              </Text>
              <View className="flex-row justify-between mb-4">
                {[15, 30, 60].map((option) => (
                  <TouchableOpacity
                    key={option}
                    onPress={() => setSelectedOption(option)}
                    className="flex-1 mx-1 py-3 rounded-xl border"
                    style={{
                      backgroundColor:
                        selectedOption === option ? colors.accent : colors.cardBackground,
                      borderColor:
                        selectedOption === option ? colors.accent : "#D1D5DB",
                    }}
                  >
                    <Text
                      className="text-center font-medium"
                      style={{
                        color: selectedOption === option ? "#FFF" : colors.text,
                      }}
                    >
                      +{option === 60 ? "1h" : `${option} min`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View className="flex-row justify-between mb-2">
                <Text style={{ color: colors.text }}>🕕 Original End:</Text>
                <Text style={{ color: colors.textDark, fontWeight: "500" }}>
                  {extraHours.baseEndTime || "17:00"}
                </Text>
              </View>

              <View className="flex-row justify-between mb-4">
                <Text style={{ color: colors.text }}>🕒 New End:</Text>
                <Text style={{ color: colors.textDark, fontWeight: "500" }}>
                  {calculateNewEndTime()}
                </Text>
              </View>

              <TouchableOpacity
                disabled={!selectedOption}
                onPress={handleRequestExtraHours}
                className="py-3 rounded-xl"
                style={{
                  backgroundColor: selectedOption ? colors.accent : colors.textLight,
                }}
              >
                <Text className="text-center text-white font-semibold">
                  Request Extra Hours
                </Text>
              </TouchableOpacity>
            </>
          )}

          {extraHours.status === "pending" && (
            <View className="items-center">
              <Text className="text-center font-medium mb-3" style={{ color: colors.warning }}>
                Pending approval ⏳
              </Text>
              <Text style={{ color: colors.text }}>
                You requested an additional{" "}
                <Text style={{ fontWeight: "600" }}>{selectedOption ?? extraHours.requestedMinutes} minutes</Text> of care time.
              </Text>
              <Text style={{ color: colors.text, marginTop: 4 }}>
                New end time:{" "}
                <Text style={{ fontWeight: "600" }}>{calculateNewEndTime()}</Text>
              </Text>
              <Text style={{ color: colors.textLight, marginTop: 6, textAlign: "center" }}>
                The staff has been notified and will approve shortly.
              </Text>
            </View>
          )}

          {extraHours.status === "approved" && (
            <View className="items-center">
              <Text className="text-center font-medium mb-3" style={{ color: colors.success }}>
                Approved ✅
              </Text>
              <Text style={{ color: colors.text }}>
                Your extra time request of{" "}
                <Text style={{ fontWeight: "600" }}>{selectedOption ?? extraHours.requestedMinutes} minutes</Text> has been approved.
              </Text>
              <Text style={{ color: colors.text, marginTop: 4 }}>
                New end time:{" "}
                <Text style={{ fontWeight: "600" }}>{calculateNewEndTime()}</Text>
              </Text>
              <Text style={{ color: colors.textLight, marginTop: 6, textAlign: "center" }}>
                Thank you! The schedule has been updated accordingly.
              </Text>
            </View>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}
