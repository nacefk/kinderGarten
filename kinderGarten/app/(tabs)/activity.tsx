import { router, useFocusEffect } from "expo-router";
import { Bell, ChevronDown, ChevronLeft } from "lucide-react-native";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import colors from "../../config/colors";
import Card from "../../components/Card";
import TimelineItem from "../../components/TimelineItem";
import LiveView from "@/components/LiveView";
import { getMyChild } from "@/api/children";
import { getPlans, getEvents } from "@/api/planning";
import { getReports } from "@/api/report";
import { useAppStore } from "@/store/useAppStore";

export default function Activity() {
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<"today" | "week" | "upcoming">("today");
  const [selectedDay, setSelectedDay] = useState<string>("Lundi");
  const [showDayDropdown, setShowDayDropdown] = useState<boolean>(false);

  const [timelineByDay, setTimelineByDay] = useState<Record<string, any[]>>({});
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [weekDays, setWeekDays] = useState<string[]>(["Lundi"]);

  // Store gallery items in app store so story-viewer can access them
  const { setData } = useAppStore((state) => state.actions);

  /** 📅 Get current day in French */
  const getCurrentDay = useCallback(() => {
    const today = new Date().toLocaleDateString("fr-FR", { weekday: "long" });
    return today.charAt(0).toUpperCase() + today.slice(1);
  }, []);

  /** 🎬 Navigate to story viewer */
  const handleStoryPress = useCallback(
    (index: number) => {
      router.push({
        pathname: "/story-viewer",
        params: { index: index.toString() },
      });
    },
    [router]
  );

  /** 📅 Toggle day dropdown */
  const handleDayDropdownToggle = useCallback(() => {
    setShowDayDropdown((prev) => !prev);
  }, []);

  /** 📅 Select day from dropdown */
  const handleSelectDay = useCallback((day: string) => {
    setSelectedDay(day);
    setShowDayDropdown(false);
  }, []);

  /** 📦 Load activity data (plans, events, reports) */
  const loadActivityData = useCallback(async () => {
    try {
      setLoading(true);

      // 1️⃣ Fetch logged-in parent's child
      const child = await getMyChild();
      if (!child || !child.id) {
        throw new Error("Child data not found");
      }
      const classId = child.classroom?.id || child.classroom;
      const childId = child.id;
      // 2️⃣ Fetch plans, events, and reports concurrently with error boundaries
      let plansData = [];
      let eventsData = [];
      let reportsData = [];

      try {
        [plansData, eventsData, reportsData] = await Promise.all([
          getPlans({ classroom: classId }).catch((err) => {
            console.warn("⚠️ Error loading plans:", err.message);
            return [];
          }),
          getEvents({ classroom: classId }).catch((err) => {
            console.warn("⚠️ Error loading events:", err.message);
            return [];
          }),
          getReports(childId).catch((err) => {
            console.warn("⚠️ Error loading reports:", err.message);
            return [];
          }),
        ]);
      } catch (err) {
        console.error("❌ Error fetching activity data:", err);
      }

      // 3️⃣ Group class plans by day with safety checks
      const grouped: Record<string, any[]> = {};
      if (Array.isArray(plansData)) {
        plansData.forEach((plan: any) => {
          if (plan && plan.day) {
            const day = plan.day || "Lundi";
            if (!grouped[day]) grouped[day] = [];
            grouped[day].push({
              time: plan.time || "N/A",
              title: plan.title || "Untitled",
              detail: plan.description || "",
              icon: "🧩",
            });
          }
        });
      }

      setTimelineByDay(grouped);
      setWeekDays(Object.keys(grouped).length ? Object.keys(grouped) : ["Lundi"]);

      // 4️⃣ Format media galleries from reports with safety checks
      const formattedStories = (Array.isArray(reportsData) ? reportsData : [])
        .filter((report) => report && report.media_files)
        .flatMap((report: any) =>
          (report.media_files || [])
            .filter((media) => media && media.file)
            .map((media: any) => ({
              id: `${report.id}_${media.id}`,
              type: media.file.toLowerCase().endsWith(".mp4") ? "video" : "image",
              uri: media.file,
              description: report.notes || "",
              date: media.uploaded_at,
            }))
        );

      setGalleryItems(formattedStories);
      // Store gallery items in app store for story-viewer
      setData("galleryItems", formattedStories);

      // 5️⃣ Upcoming Events with safety checks
      const formattedEvents = (Array.isArray(eventsData) ? eventsData : [])
        .filter((e: any) => e && e.date && new Date(e.date) > new Date())
        .map((e: any) => ({
          icon: "🎉",
          title: e.title || "Event",
          detail: e.description || "",
          date: e.date,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setEvents(formattedEvents);
    } catch (error: any) {
      console.error("❌ Error loading activity data:", error.message);
      Alert.alert("Erreur", "Impossible de charger les activités. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }, [setData]);

  /** 📦 Load data on mount */
  useEffect(() => {
    loadActivityData();
  }, [loadActivityData]);

  /** 📦 Refresh data when screen comes into focus */
  useFocusEffect(
    useCallback(() => {
      console.log("📱 Activity screen focused - refreshing data");
      loadActivityData();
    }, [loadActivityData])
  );

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.textLight, marginTop: 8 }}>Chargement des activités...</Text>
      </View>
    );
  }

  const todayName = getCurrentDay();
  const todayTimeline = timelineByDay?.[todayName] || [];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar barStyle={"dark-content"} />

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5 pt-16 pb-6"
        style={{ backgroundColor: colors.accentLight }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.push("/(tabs)/home"))}
            className="mr-3"
          >
            <ChevronLeft color={colors.textDark} size={28} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Bell color={colors.textDark} size={28} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View
        className="flex-row justify-around mx-5 rounded-2xl shadow-sm mt-4 py-2 mb-5"
        style={{ backgroundColor: colors.cardBackground }}
      >
        {[
          { key: "today", label: "Aujourd’hui" },
          { key: "week", label: "Cette semaine" },
          { key: "upcoming", label: "À venir" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setSelectedFilter(tab.key as any)}
            className="px-4 py-2 rounded-xl"
            style={{
              backgroundColor: selectedFilter === tab.key ? colors.accent : "transparent",
            }}
          >
            <Text
              className="font-medium"
              style={{
                color: selectedFilter === tab.key ? "#FFF" : colors.textDark,
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
        {/* 📅 AUJOURD’HUI */}
        {selectedFilter === "today" && (
          <>
            <LiveView />
            <Card title="Programme du jour">
              {todayTimeline.length > 0 ? (
                todayTimeline.map((item, index) => <TimelineItem key={index} item={item} />)
              ) : (
                <Text className="text-center py-4" style={{ color: colors.textLight }}>
                  Aucune activité enregistrée aujourd’hui.
                </Text>
              )}
            </Card>

            <Card title="Photos & vidéos du jour">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {galleryItems?.length > 0 ? (
                  galleryItems.map((item, index) => (
                    <View key={item.id} className="mr-3 items-center">
                      <TouchableOpacity onPress={() => handleStoryPress(index)}>
                        {item.type === "image" ? (
                          <Image source={{ uri: item.uri }} className="w-24 h-24 rounded-xl" />
                        ) : (
                          <View
                            className="w-24 h-24 rounded-xl items-center justify-center"
                            style={{ backgroundColor: colors.textDark }}
                          >
                            <Text className="text-xs" style={{ color: "#FFF" }}>
                              🎬 Vidéo
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                      {item.description ? (
                        <Text
                          numberOfLines={1}
                          style={{
                            color: colors.textLight,
                            fontSize: 12,
                            maxWidth: 100,
                            textAlign: "center",
                            marginTop: 4,
                          }}
                        >
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                  ))
                ) : (
                  <Text style={{ color: colors.textLight }}>Aucun média disponible.</Text>
                )}
              </ScrollView>
            </Card>
          </>
        )}

        {/* 📆 CETTE SEMAINE */}
        {selectedFilter === "week" && (
          <View className="mt-6">
            <TouchableOpacity
              onPress={handleDayDropdownToggle}
              className="flex-row justify-between items-center rounded-2xl p-4 shadow-sm"
              style={{ backgroundColor: colors.cardBackground }}
            >
              <Text className="font-semibold text-base" style={{ color: colors.textDark }}>
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
                    onPress={() => handleSelectDay(day)}
                    className="py-2 rounded-xl"
                    style={{
                      backgroundColor: selectedDay === day ? colors.accentLight : "transparent",
                    }}
                  >
                    <Text
                      className="text-base"
                      style={{
                        color: selectedDay === day ? colors.accent : colors.textDark,
                        fontWeight: selectedDay === day ? "600" : "400",
                      }}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Card title={`Programme du ${selectedDay}`}>
              {timelineByDay?.[selectedDay]?.length > 0 ? (
                timelineByDay[selectedDay].map((item, index) => (
                  <TimelineItem key={index} item={item} />
                ))
              ) : (
                <Text className="text-center py-4" style={{ color: colors.textLight }}>
                  Aucune activité enregistrée pour {selectedDay}.
                </Text>
              )}
            </Card>
          </View>
        )}

        {/* 🔮 À VENIR — ÉVÉNEMENTS UNIQUEMENT */}
        {selectedFilter === "upcoming" && (
          <Card title="Événements à venir">
            {events.length > 0 ? (
              events.map((event, index) => {
                const eventDate = new Date(event.date);
                const formattedDate = eventDate.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <View key={index} className="flex-row items-center mb-4">
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: colors.accentLight }}
                    >
                      <Text className="text-lg">🎉</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium" style={{ color: colors.textDark }}>
                        {event.title || "Événement"}
                      </Text>
                      <Text style={{ color: colors.text }}>
                        {event.detail || event.description || "Aucune description"}
                      </Text>
                      <Text className="text-sm mt-1" style={{ color: colors.textLight }}>
                        {formattedDate}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <Text className="text-center py-4" style={{ color: colors.textLight }}>
                Aucun événement à venir.
              </Text>
            )}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}
