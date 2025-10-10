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
import { useAppStore } from "../../store/useAppStore"; // ✅ Zustand import

export default function Activity() {
  const {
    todayTimeline,
    timelineByDay,
    galleryItems,
    upcomingActivities,
  } = useAppStore();

  // Local UI states
  const [selectedFilter, setSelectedFilter] = useState<"today" | "week" | "upcoming">("today");
  const [selectedDay, setSelectedDay] = useState<string>("Monday");
  const [showDayDropdown, setShowDayDropdown] = useState<boolean>(false);

  const weekDays = Object.keys(timelineByDay || {});

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
        {/* 📅 TODAY */}
        {selectedFilter === "today" && (
          <>
            <Card title="Today’s Timeline">
              {todayTimeline?.length > 0 ? (
                todayTimeline.map((item, index) => (
                  <TimelineItem key={index} item={item} />
                ))
              ) : (
                <Text className="text-gray-500 text-center py-4">
                  No activities recorded today.
                </Text>
              )}
            </Card>

            <Card title="Today’s Photos & Videos">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {galleryItems?.length > 0 ? (
                  galleryItems.map((item, index) => (
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
                  ))
                ) : (
                  <Text className="text-gray-500">No media available.</Text>
                )}
              </ScrollView>
            </Card>
          </>
        )}

        {/* 📆 THIS WEEK */}
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

            <Card title={`${selectedDay} Timeline`}>
              {timelineByDay?.[selectedDay]?.length > 0 ? (
                timelineByDay[selectedDay].map((item, index) => (
                  <TimelineItem key={index} item={item} />
                ))
              ) : (
                <Text className="text-gray-500 text-center py-4">
                  No activities recorded for {selectedDay}.
                </Text>
              )}
            </Card>
          </View>
        )}

        {/* 🔮 UPCOMING */}
        {selectedFilter === "upcoming" && (
          <Card title="Upcoming Events">
            {upcomingActivities?.length > 0 ? (
              upcomingActivities.map((item, index) => (
                <View key={index} className="flex-row items-center mb-4">
                  <View className="w-12 h-12 bg-[#EAF1FB] rounded-full items-center justify-center mr-3">
                    <Text className="text-lg">{item.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-gray-800">
                      {item.title}
                    </Text>
                    <Text className="text-gray-600">{item.detail}</Text>
                    <Text className="text-sm text-gray-500 mt-1">
                      {item.date}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text className="text-gray-500 text-center py-4">
                No upcoming events.
              </Text>
            )}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

/* 🔧 Reusable Components */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="bg-white rounded-2xl shadow-sm p-5 mt-6">
      <Text className="text-lg font-semibold text-gray-800 mb-3">{title}</Text>
      {children}
    </View>
  );
}

function TimelineItem({ item }: { item: any }) {
  return (
    <View className="flex-row mb-4">
      <View className="w-14 items-center">
        <Text className="text-sm text-gray-500">{item.time}</Text>
        <Text className="text-lg">{item.icon}</Text>
      </View>
      <View className="flex-1 bg-[#FAF8F5] rounded-xl px-4 py-3">
        <Text className="font-medium text-gray-800">{item.title}</Text>
        <Text className="text-gray-600">{item.detail}</Text>
      </View>
    </View>
  );
}
