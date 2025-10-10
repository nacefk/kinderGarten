import { Bell } from "lucide-react-native";
import { ScrollView, StatusBar, Text, TouchableOpacity, View, Image } from "react-native";
import { useAppStore } from "../../store/useAppStore"; // ✅ import Zustand store
import React, { useState } from "react";

export default function Home() {
  // 🧠 Load data from Zustand
  const {
    profile,
    dailySummary,
    timeline,
    upcomingEvents,
    extraHours,
    setData,
  } = useAppStore();

  // ✅ Local state for UI only
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleRequestExtraHours = () => {
    if (!selectedOption) return;
    setData("extraHours", { ...extraHours, status: "pending" });
    setTimeout(() => {
      setData("extraHours", { ...extraHours, status: "approved" });
    }, 3000);
  };

  // ✅ Helper function for new end time
  const calculateNewEndTime = () => {
    if (!selectedOption) return extraHours?.baseEndTime || "17:00";
    const [hour, minute] = (extraHours?.baseEndTime || "17:00").split(":").map(Number);
    const totalMinutes = hour * 60 + minute + selectedOption;
    const newHour = Math.floor(totalMinutes / 60)
      .toString()
      .padStart(2, "0");
    const newMinute = (totalMinutes % 60).toString().padStart(2, "0");
    return `${newHour}:${newMinute}`;
  };

  return (
    <View className="flex-1 bg-[#FAF8F5]">
      <StatusBar barStyle={"dark-content"} />

      {/* 🧭 Header */}
      <View className="flex-row items-center justify-between px-7 pt-16 pb-6 bg-[#EAF1FB]">
        <View className="flex-row items-center">
          <Image
            source={{ uri: profile?.avatar }}
            className="w-16 h-16 rounded-full mr-5"
          />
          <View>
            <Text className="text-2xl font-bold text-gray-800">
              {profile?.name ?? "Loading..."}
            </Text>
            <Text
              className={`font-semibold text-base ${
                profile?.present ? "text-green-600" : "text-red-600"
              }`}
            >
              ● {profile?.present ? "Checked in" : "Checked out"}
            </Text>
          </View>
        </View>
        <TouchableOpacity>
          <Bell color="#374151" size={32} />
        </TouchableOpacity>
      </View>

      {/* 📜 Scroll content */}
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* 📅 Today at a Glance */}
        <View className="bg-white rounded-2xl shadow-sm p-5 mt-5">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Today at a Glance
          </Text>

          {dailySummary ? (
            <>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600">🍽 Lunch</Text>
                <Text className="text-gray-800 font-medium">
                  {dailySummary.lunch}
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600">😴 Nap</Text>
                <Text className="text-gray-800 font-medium">
                  {dailySummary.napDuration}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">🎨 Activity</Text>
                <Text className="text-gray-800 font-medium">
                  {dailySummary.activityMood}
                </Text>
              </View>
            </>
          ) : (
            <Text className="text-gray-500">Loading summary...</Text>
          )}

          <TouchableOpacity className="bg-[#C6A57B] mt-4 py-2 rounded-xl">
            <Text className="text-center text-white font-semibold">
              View full report
            </Text>
          </TouchableOpacity>
        </View>

        {/* 🕒 Timeline */}
        <View className="bg-white rounded-2xl shadow-sm p-5 mt-5">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Timeline
          </Text>
          {timeline?.length > 0 ? (
            timeline.map((item, index) => (
              <View key={index} className="flex-row items-center mb-3">
                <Image
                  source={{ uri: item.image }}
                  className="w-12 h-12 rounded-lg mr-3"
                />
                <View>
                  <Text className="text-gray-800 font-medium">{item.title}</Text>
                  <Text className="text-gray-600">{item.description}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text className="text-gray-500">No timeline yet.</Text>
          )}
        </View>

        {/* 📆 Upcoming */}
        <View className="bg-white rounded-2xl shadow-sm p-5 mt-5">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Upcoming
          </Text>
          {upcomingEvents?.length > 0 ? (
            upcomingEvents.map((event, index) => (
              <View key={index} className="flex-row items-center mb-3">
                <Image
                  source={{ uri: event.image }}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <View>
                  <Text className="text-gray-800 font-medium">{event.title}</Text>
                  <Text className="text-gray-600">
                    {new Date(event.datetime).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text className="text-gray-500">No upcoming events.</Text>
          )}
        </View>

        {/* ⏰ Extra Hours */}
        <View className="bg-white rounded-2xl shadow-sm p-5 mt-5 mb-5">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Extra Hours
          </Text>

          {extraHours?.status === "none" && (
            <>
              <Text className="text-gray-600 mb-3">
                Request additional care time
              </Text>
              <View className="flex-row justify-between mb-4">
                {[15, 30, 60].map((option) => (
                  <TouchableOpacity
                    key={option}
                    onPress={() => setSelectedOption(option)}
                    className={`flex-1 mx-1 py-3 rounded-xl border ${
                      selectedOption === option
                        ? "bg-[#C6A57B] border-[#C6A57B]"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <Text
                      className={`text-center font-medium ${
                        selectedOption === option
                          ? "text-white"
                          : "text-gray-700"
                      }`}
                    >
                      +{option === 60 ? "1h" : `${option} min`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-700">🕕 Original End:</Text>
                <Text className="font-medium text-gray-800">
                  {extraHours?.baseEndTime || "17:00"}
                </Text>
              </View>

              <View className="flex-row justify-between mb-4">
                <Text className="text-gray-700">🕒 New End:</Text>
                <Text className="font-medium text-gray-800">
                  {calculateNewEndTime()}
                </Text>
              </View>

              <TouchableOpacity
                disabled={!selectedOption}
                onPress={handleRequestExtraHours}
                className={`py-3 rounded-xl ${
                  selectedOption ? "bg-[#C6A57B]" : "bg-gray-300"
                }`}
              >
                <Text className="text-center text-white font-semibold">
                  Request Extra Hours
                </Text>
              </TouchableOpacity>
            </>
          )}

          {extraHours?.status === "pending" && (
            <Text className="text-yellow-600 font-medium text-center">
              Pending approval ⏳
            </Text>
          )}

          {extraHours?.status === "approved" && (
            <Text className="text-green-600 font-medium text-center">
              Approved ✅
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
