import React, { useState } from "react";
import { ScrollView, StatusBar, Text, TouchableOpacity, View, Image } from "react-native";
import { Bell } from "lucide-react-native";
import { useAppStore } from "../../store/useAppStore";
import colors from "../../config/colors";
import Card from "../../components/Card";

export default function Home() {
  const { profile, dailySummary, timeline, upcomingEvents, extraHours, setData } = useAppStore();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleRequestExtraHours = () => {
    if (!selectedOption) return;
    setData("extraHours", { ...extraHours, status: "pending" });
    setTimeout(() => {
      setData("extraHours", { ...extraHours, status: "approved" });
    }, 3000);
  };

  const calculateNewEndTime = () => {
    if (!selectedOption) return extraHours?.baseEndTime || "17:00";
    const [hour, minute] = (extraHours?.baseEndTime || "17:00").split(":").map(Number);
    const totalMinutes = hour * 60 + minute + selectedOption;
    const newHour = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
    const newMinute = (totalMinutes % 60).toString().padStart(2, "0");
    return `${newHour}:${newMinute}`;
  };

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
          {upcomingEvents?.length > 0 ? (
            upcomingEvents.map((event, index) => (
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
          {extraHours?.status === "none" && (
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
                  {extraHours?.baseEndTime || "17:00"}
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
                  backgroundColor: selectedOption
                    ? colors.accent
                    : colors.textLight,
                }}
              >
                <Text className="text-center text-white font-semibold">
                  Request Extra Hours
                </Text>
              </TouchableOpacity>
            </>
          )}

          {extraHours?.status === "pending" && (
            <Text
              className="text-center font-medium"
              style={{ color: colors.warning }}
            >
              Pending approval ⏳
            </Text>
          )}

          {extraHours?.status === "approved" && (
            <Text
              className="text-center font-medium"
              style={{ color: colors.success }}
            >
              Approved ✅
            </Text>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}
