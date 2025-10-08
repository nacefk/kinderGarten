import { router } from "expo-router";
import { Bell, ChevronDown, ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import {
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Activity() {
  const [selectedFilter, setSelectedFilter] = useState<"today" | "week" | "upcoming">("today");
  const [selectedDay, setSelectedDay] = useState<string>("Monday");
  const [showDayDropdown, setShowDayDropdown] = useState<boolean>(false);

  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // ✅ Today’s timeline
  const todayTimeline = [
    { time: "8:45 AM", icon: "✅", title: "Checked in", detail: "Arrived at daycare." },
    { time: "9:30 AM", icon: "🧩", title: "Playtime", detail: "Building with blocks." },
    { time: "10:15 AM", icon: "🍎", title: "Snack", detail: "Apple slices and milk." },
    { time: "12:00 PM", icon: "🍝", title: "Lunch", detail: "Pasta with veggies." },
    { time: "1:10 PM", icon: "😴", title: "Nap", detail: "Slept for 1h 20min." },
    { time: "3:00 PM", icon: "🎨", title: "Drawing", detail: "Painting session with colors." },
  ];

  // ✅ Weekly timeline data (used by dropdown)
  const timelineByDay: Record<string, any[]> = {
    Monday: [
      { time: "8:40 AM", icon: "✅", title: "Checked in", detail: "Arrived with a smile." },
      { time: "9:15 AM", icon: "🎵", title: "Music time", detail: "Sang songs with friends." },
      { time: "10:30 AM", icon: "🍎", title: "Snack", detail: "Apples and milk." },
    ],
    Tuesday: [
      { time: "8:45 AM", icon: "✅", title: "Checked in", detail: "Arrived at daycare." },
      { time: "9:30 AM", icon: "🎨", title: "Art Class", detail: "Painting session." },
      { time: "12:00 PM", icon: "🍝", title: "Lunch", detail: "Pasta with veggies." },
    ],
    Wednesday: [
      { time: "9:00 AM", icon: "📚", title: "Storytime", detail: "Read 'The Very Hungry Caterpillar'." },
      { time: "10:15 AM", icon: "🍎", title: "Snack", detail: "Apple slices and juice." },
      { time: "1:00 PM", icon: "😴", title: "Nap", detail: "1h 10min rest." },
    ],
    Thursday: [
      { time: "8:45 AM", icon: "✅", title: "Checked in", detail: "Arrived early and happy." },
      { time: "9:30 AM", icon: "🏃", title: "Outdoor play", detail: "Played on the slide." },
      { time: "11:45 AM", icon: "🍛", title: "Lunch", detail: "Rice and vegetables." },
    ],
    Friday: [
      { time: "9:15 AM", icon: "🎂", title: "Birthday", detail: "Celebrated Adam’s birthday!" },
      { time: "11:00 AM", icon: "🎨", title: "Drawing", detail: "Made colorful drawings." },
    ],
    Saturday: [],
    Sunday: [],
  };

  // ✅ Mixed media gallery (images + videos)
  const galleryItems = [
    { id: "1", type: "image", uri: "https://i.pravatar.cc/400?img=20" },
    { id: "2", type: "video", uri: "https://www.w3schools.com/html/mov_bbb.mp4" },
    { id: "3", type: "image", uri: "https://i.pravatar.cc/400?img=25" },
  ];

  const upcomingData = [
    { date: "Tomorrow", icon: "🎂", title: "Birthday Party", detail: "Celebrating Adam’s birthday." },
    { date: "Friday", icon: "👩‍🏫", title: "Parent Meeting", detail: "5:00 PM – Meet the educator." },
  ];


  return (
    <View className="flex-1 bg-[#FAF8F5]">
      <StatusBar barStyle={"dark-content"} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-16 pb-6 bg-[#EAF1FB]">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ChevronLeft color="#374151" size={28} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800">Activities</Text>
        </View>
        <TouchableOpacity>
          <Bell color="#374151" size={28} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View className="flex-row justify-around bg-white mx-5 rounded-2xl shadow-sm mt-4 py-2">
        {[
          { key: "today", label: "Today" },
          { key: "week", label: "This Week" },
          { key: "upcoming", label: "Upcoming" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setSelectedFilter(tab.key as any)}
            className={`px-4 py-2 rounded-xl ${
              selectedFilter === tab.key ? "bg-[#C6A57B]" : "bg-transparent"
            }`}
          >
            <Text
              className={`font-medium ${
                selectedFilter === tab.key ? "text-white" : "text-gray-700"
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* TODAY TIMELINE */}
        {selectedFilter === "today" && (
          <>
            <View className="bg-white rounded-2xl shadow-sm p-5 mt-6">
              <Text className="text-lg font-semibold text-gray-800 mb-3">
                Today’s Timeline
              </Text>
              {todayTimeline.map((item, index) => (
                <View key={index} className="flex-row mb-4">
                  <View className="w-14 items-center">
                    <Text className="text-sm text-gray-500">{item.time}</Text>
                    <Text className="text-lg">{item.icon}</Text>
                  </View>
                  <View className="flex-1 bg-[#FAF8F5] rounded-xl px-4 py-3">
                    <Text className="font-medium text-gray-800">{item.title}</Text>
                    <Text className="text-gray-600">{item.detail}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Today Gallery (Images & Videos) */}
            <View className="bg-white rounded-2xl shadow-sm p-5 mt-6">
              <Text className="text-lg font-semibold text-gray-800 mb-3">
                Today’s Photos & Videos
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {galleryItems.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() =>
                      router.push({
                        pathname: "/story-viewer",
                        params: { index: index.toString() },
                      })
                    }
                  >
                    {item.type === "image" ? (
                      <Image
                        source={{ uri: item.uri }}
                        className="w-24 h-24 rounded-xl mr-3"
                      />
                    ) : (
                      <View className="w-24 h-24 rounded-xl mr-3 bg-black items-center justify-center">
                        <Text className="text-white text-xs">🎬 Video</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        )}

        {/* THIS WEEK (unchanged) */}
        {selectedFilter === "week" && (
          <View className="mt-6">
            <TouchableOpacity
              onPress={() => setShowDayDropdown(!showDayDropdown)}
              className="flex-row justify-between items-center bg-white rounded-2xl p-4 shadow-sm"
            >
              <Text className="text-gray-800 font-semibold text-base">
                {selectedDay}
              </Text>
              <ChevronDown color="#374151" size={22} />
            </TouchableOpacity>

            {showDayDropdown && (
              <View className="bg-white mt-2 rounded-2xl shadow-sm p-3">
                {weekDays.map((day) => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => {
                      setSelectedDay(day);
                      setShowDayDropdown(false);
                    }}
                    className={`py-2 rounded-xl ${
                      selectedDay === day ? "bg-[#EAF1FB]" : ""
                    }`}
                  >
                    <Text
                      className={`text-base ${
                        selectedDay === day
                          ? "text-[#C6A57B] font-semibold"
                          : "text-gray-700"
                      }`}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Selected Day Timeline */}
            <View className="bg-white rounded-2xl shadow-sm p-5 mt-5">
              <Text className="text-lg font-semibold text-gray-800 mb-3">
                {selectedDay} Timeline
              </Text>

              {timelineByDay[selectedDay] &&
              timelineByDay[selectedDay].length > 0 ? (
                timelineByDay[selectedDay].map((item, index) => (
                  <View key={index} className="flex-row mb-4">
                    <View className="w-14 items-center">
                      <Text className="text-sm text-gray-500">{item.time}</Text>
                      <Text className="text-lg">{item.icon}</Text>
                    </View>
                    <View className="flex-1 bg-[#FAF8F5] rounded-xl px-4 py-3">
                      <Text className="font-medium text-gray-800">{item.title}</Text>
                      <Text className="text-gray-600">{item.detail}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text className="text-gray-500 text-center py-4">
                  No activities recorded for {selectedDay}.
                </Text>
              )}
            </View>
          </View>
        )}

        {/* UPCOMING (unchanged) */}
        {selectedFilter === "upcoming" && (
          <View className="bg-white rounded-2xl shadow-sm p-5 mt-6">
            <Text className="text-lg font-semibold text-gray-800 mb-3">
              Upcoming Events
            </Text>
            {upcomingData.map((item, index) => (
              <View key={index} className="flex-row items-center mb-4">
                <View className="w-12 h-12 bg-[#EAF1FB] rounded-full items-center justify-center mr-3">
                  <Text className="text-lg">{item.icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-gray-800">{item.title}</Text>
                  <Text className="text-gray-600">{item.detail}</Text>
                  <Text className="text-sm text-gray-500 mt-1">{item.date}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
