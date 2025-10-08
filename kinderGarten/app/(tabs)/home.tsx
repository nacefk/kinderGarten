import { Bell } from "lucide-react-native";
import { useState } from "react";
import { Image, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";

export default function Home() {
    const [extraStatus, setExtraStatus] = useState<"none" | "pending" | "approved">("none");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState("2025-10-09");
  const [baseEndTime] = useState("17:00");

  const handleRequestExtraHours = () => {
    if (!selectedOption) return;
    setExtraStatus("pending");
    // In real app: send request to backend
    setTimeout(() => setExtraStatus("approved"), 5000);
  };

  const calculateNewEndTime = () => {
    if (!selectedOption) return baseEndTime;
    const [hour, minute] = baseEndTime.split(":").map(Number);
    const totalMinutes = hour * 60 + minute + selectedOption;
    const newHour = Math.floor(totalMinutes / 60)
      .toString()
      .padStart(2, "0");
    const newMinute = (totalMinutes % 60).toString().padStart(2, "0");
    return `${newHour}:${newMinute}`;
  };

const present = true; // Replace with real attendance logic
  return (
    <View className="flex-1 bg-[#FAF8F5]">
      <StatusBar barStyle={'dark-content'} />
      {/* Header */}
      <View className="flex-row items-center justify-between px-7 pt-16 pb-6 bg-[#EAF1FB]">
        <View className="flex-row items-center">
          <Image
        source={{ uri: "https://i.pravatar.cc/100?img=46" }}
        className="w-16 h-16 rounded-full mr-5"
          />
          <View>
        <Text className="text-2xl font-bold text-gray-800">Joud</Text>
        <Text
          className={`font-semibold text-base ${present ? "text-green-600" : "text-red-600"}`}
        >
          ● {present ? "Checked in" : "Checked out"}
        </Text>
          </View>
        </View>
        <TouchableOpacity>
          <Bell color="#374151" size={32} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Today at a Glance */}
        <View className="bg-white rounded-2xl shadow-sm p-5 mt-5">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Today at a Glance
          </Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">🍽 Lunch</Text>
            <Text className="text-gray-800 font-medium">Pasta</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">😴 Nap</Text>
            <Text className="text-gray-800 font-medium">1h 20min</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-600">🎨 Activity</Text>
            <Text className="text-gray-800 font-medium">Happy & active</Text>
          </View>

          <TouchableOpacity className="bg-[#C6A57B] mt-4 py-2 rounded-xl">
            <Text className="text-center text-white font-semibold">
              View full report
            </Text>
          </TouchableOpacity>
        </View>

        {/* Timeline */}
        <View className="bg-white rounded-2xl shadow-sm p-5 mt-5">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Timeline
          </Text>
          <View className="flex-row items-center">
            <Image
              source={{ uri: "https://i.pravatar.cc/100?img=30" }}
              className="w-12 h-12 rounded-lg mr-3"
            />
            <View>
              <Text className="text-gray-800 font-medium">
                10:15 AM – Snack time
              </Text>
              <Text className="text-gray-600">Daisy had a great morning!</Text>
            </View>
          </View>
        </View>

        {/* Upcoming */}
        <View className="bg-white rounded-2xl shadow-sm p-5 mt-5">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Upcoming
          </Text>
          <View className="flex-row items-center">
            <Image
              source={{ uri: "https://i.pravatar.cc/100?img=12" }}
              className="w-10 h-10 rounded-full mr-3"
            />
            <View>
              <Text className="text-gray-800 font-medium">Parent Meeting</Text>
              <Text className="text-gray-600">Thu 5:00 PM</Text>
            </View>
          </View>
        </View>
  {/* Extra Hours */}
        <View className="bg-white rounded-2xl shadow-sm p-5 mt-5 mb-5">
          <Text className="text-lg font-semibold text-gray-800 mb-3">Extra Hours</Text>

          {extraStatus === "none" && (
            <>
              <Text className="text-gray-600 mb-3">Request additional care time</Text>

              {/* Duration Options */}
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
                        selectedOption === option ? "text-white" : "text-gray-700"
                      }`}
                    >
                      +{option === 60 ? "1h" : `${option} min`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Summary */}
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-700">📅 Date:</Text>
                <Text className="font-medium text-gray-800">{selectedDate}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-700">🕕 Original End:</Text>
                <Text className="font-medium text-gray-800">{baseEndTime}</Text>
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

          {extraStatus === "pending" && (
            <View className="items-center">
              <Text className="text-yellow-600 font-medium mb-2">Pending Approval ⏳</Text>
              <Text className="text-gray-600 text-center">
                Your request for {selectedDate} ({baseEndTime}–
                {calculateNewEndTime()}) is under review.
              </Text>
            </View>
          )}

          {extraStatus === "approved" && (
            <View className="items-center">
              <Text className="text-green-600 font-semibold mb-2">Approved ✅</Text>
              <Text className="text-gray-600 text-center">
                Extra hours confirmed for {selectedDate} ({baseEndTime}–
                {calculateNewEndTime()}).
              </Text>
            </View>
          )}
        </View>
      </ScrollView>


    </View>
  );
}
