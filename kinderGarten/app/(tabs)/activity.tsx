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
import { useAppStore } from "../../store/useAppStore";
import colors from "../../config/colors";
import Card from "../../components/Card";
import TimelineItem from "../../components/TimelineItem";
import LiveView from "@/components/LiveView";

export default function Activity() {
  const { todayTimeline, timelineByDay, galleryItems, upcomingActivities } = useAppStore();

  const [selectedFilter, setSelectedFilter] = useState<"today" | "week" | "upcoming">("today");
  const [selectedDay, setSelectedDay] = useState<string>("Monday");
  const [showDayDropdown, setShowDayDropdown] = useState<boolean>(false);

  const weekDays = Object.keys(timelineByDay || {});

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar barStyle={"dark-content"} />

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5 pt-16 pb-6"
        style={{ backgroundColor: colors.accentLight }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ChevronLeft color={colors.textDark} size={28} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold" style={{ color: colors.textDark }}>
            Activities
          </Text>
        </View>
        <TouchableOpacity>
          <Bell color={colors.textDark} size={28} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View
        className="flex-row justify-around mx-5 rounded-2xl shadow-sm mt-4 py-2 mb-5"
        style={{ backgroundColor: colors.cardBackground }}
      >
        {[
          { key: "today", label: "Today" },
          { key: "week", label: "This Week" },
          { key: "upcoming", label: "Upcoming" },
        ].map((tab) => (
          <TouchableOpacity
        key={tab.key}
        onPress={() => setSelectedFilter(tab.key as any)}
        className="px-4 py-2 rounded-xl"
        style={{
          backgroundColor:
            selectedFilter === tab.key ? colors.accent : "transparent",
        }}
          >
        <Text
          className="font-medium"
          style={{
            color:
          selectedFilter === tab.key ? "#FFF" : colors.textDark,
          }}
        >
          {tab.label}
        </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* 📅 TODAY */}
        {selectedFilter === "today" && (
          <>
            <LiveView />
            <Card title="Today’s Timeline">
              {todayTimeline?.length > 0 ? (
                todayTimeline.map((item, index) => (
                  <TimelineItem key={index} item={item} />
                ))
              ) : (
                <Text
                  className="text-center py-4"
                  style={{ color: colors.textLight }}
                >
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
                        <View
                          className="w-24 h-24 rounded-xl mr-3 items-center justify-center"
                          style={{ backgroundColor: colors.textDark }}
                        >
                          <Text className="text-xs" style={{ color: "#FFF" }}>
                            🎬 Video
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={{ color: colors.textLight }}>
                    No media available.
                  </Text>
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
              className="flex-row justify-between items-center rounded-2xl p-4 shadow-sm"
              style={{ backgroundColor: colors.cardBackground }}
            >
              <Text
                className="font-semibold text-base"
                style={{ color: colors.textDark }}
              >
                {selectedDay}
              </Text>
              <ChevronDown color={colors.textDark} size={22} />
            </TouchableOpacity>

            {showDayDropdown && (
              <View
                className="mt-2 rounded-2xl shadow-sm p-3"
                style={{ backgroundColor: colors.cardBackground }}
              >
                {weekDays.map((day) => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => {
                      setSelectedDay(day);
                      setShowDayDropdown(false);
                    }}
                    className="py-2 rounded-xl"
                    style={{
                      backgroundColor:
                        selectedDay === day ? colors.accentLight : "transparent",
                    }}
                  >
                    <Text
                      className="text-base"
                      style={{
                        color:
                          selectedDay === day ? colors.accent : colors.textDark,
                        fontWeight: selectedDay === day ? "600" : "400",
                      }}
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
                <Text
                  className="text-center py-4"
                  style={{ color: colors.textLight }}
                >
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
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: colors.accentLight }}
                  >
                    <Text className="text-lg">{item.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text
                      className="font-medium"
                      style={{ color: colors.textDark }}
                    >
                      {item.title}
                    </Text>
                    <Text style={{ color: colors.text }}>{item.detail}</Text>
                    <Text
                      className="text-sm mt-1"
                      style={{ color: colors.textLight }}
                    >
                      {item.date}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text
                className="text-center py-4"
                style={{ color: colors.textLight }}
              >
                No upcoming events.
              </Text>
            )}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}
