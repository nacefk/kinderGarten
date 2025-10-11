import { router } from "expo-router";
import { Bell, ChevronDown, ChevronLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
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
  const {
    childrenList,
    weeklyPlans,
    calendarEvents,
    todayTimeline,
    timelineByDay,
    galleryItems,
    upcomingActivities,
    setData,
  } = useAppStore();

  const childId = "child_014";

  const [selectedFilter, setSelectedFilter] = useState<"today" | "week" | "upcoming">("today");
  const [selectedDay, setSelectedDay] = useState<string>("Lundi");
  const [showDayDropdown, setShowDayDropdown] = useState<boolean>(false);

  /** 🧩 Build activity data dynamically if missing */
  useEffect(() => {
    if (!childrenList || !weeklyPlans) return;

    const child = childrenList.find((c: any) => c.id === childId);
    if (!child) return;

    const classPlan = weeklyPlans?.[child.className] || {};
    const today = new Date().toLocaleDateString("fr-FR", { weekday: "long" });
    const capitalizedDay = today.charAt(0).toUpperCase() + today.slice(1);

    // ✅ AUJOURD’HUI timeline
    const computedTodayTimeline = todayTimeline?.length
      ? todayTimeline
      : classPlan?.[capitalizedDay] || [
          { time: "08:30", icon: "✅", title: "Arrivée", detail: "Début de la journée." },
          { time: "09:00", icon: "🧩", title: "Jeu libre", detail: "Construction avec des blocs." },
        ];

    // ✅ HEBDOMADAIRE
    const computedTimelineByDay = Object.keys(timelineByDay || {}).length
      ? timelineByDay
      : classPlan || {
          Lundi: [{ time: "09:00", icon: "🎨", title: "Dessin", detail: "Atelier artistique amusant !" }],
        };

    // ✅ GALERIE
    const computedGallery = galleryItems?.length
      ? galleryItems
      : [
          { id: "1", type: "image", uri: "https://i.pravatar.cc/300?img=30" },
          { id: "2", type: "video", uri: "https://www.w3schools.com/html/mov_bbb.mp4" },
          { id: "3", type: "image", uri: "https://i.pravatar.cc/300?img=45" },
        ];

    // ✅ ÉVÉNEMENTS À VENIR
    let computedUpcoming = [];
    const now = new Date();

    if (calendarEvents && calendarEvents.length > 0) {
      computedUpcoming = calendarEvents
        .filter((e: any) => {
          const matchesClass =
            e.className?.toLowerCase() === child.className?.toLowerCase() ||
            e.className?.toLowerCase() === "toutes les classes";

          const [year, month, day] = e.date.split("-").map(Number);
          const eventDate = new Date(year, month - 1, day);

          return matchesClass && eventDate >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
        })
        .sort((a: any, b: any) => new Date(a.date) - new Date(b.date))
        .map((e: any) => ({
          icon: "🎉",
          title: e.title || "Événement",
          detail: e.description || "Aucune description fournie",
          date: new Date(e.date).toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "short",
          }),
        }));
    }

    if (!computedUpcoming.length && calendarEvents?.length > 0) {
      computedUpcoming = calendarEvents.map((e: any) => ({
        icon: "🎉",
        title: e.title || "Événement",
        detail: e.description || "Aucune description",
        date: new Date(e.date).toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "short",
        }),
      }));
    }

    // ✅ Sync to store
    setData("upcomingActivities", computedUpcoming);
    setData("todayTimeline", computedTodayTimeline);
    setData("timelineByDay", computedTimelineByDay);
    setData("galleryItems", computedGallery);
  }, [childrenList, weeklyPlans, calendarEvents]);

  const weekDays = Object.keys(timelineByDay || { Lundi: [] });

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

        </View>
        <TouchableOpacity>
          <Bell color={colors.textDark} size={28} />
        </TouchableOpacity>
      </View>

      {/* Onglets de filtre */}
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
              backgroundColor:
                selectedFilter === tab.key ? colors.accent : "transparent",
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

      {/* Contenu */}
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
              {todayTimeline?.length > 0 ? (
                todayTimeline.map((item, index) => (
                  <TimelineItem key={index} item={item} />
                ))
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
                            🎬 Vidéo
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={{ color: colors.textLight }}>
                    Aucun média disponible.
                  </Text>
                )}
              </ScrollView>
            </Card>
          </>
        )}

        {/* 📆 CETTE SEMAINE */}
        {selectedFilter === "week" && (
          <View className="mt-6">
            <TouchableOpacity
              onPress={() => setShowDayDropdown(!showDayDropdown)}
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

        {/* 🔮 À VENIR */}
        {selectedFilter === "upcoming" && (
          <Card title="Événements à venir">
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
                    <Text className="font-medium" style={{ color: colors.textDark }}>
                      {item.title}
                    </Text>
                    <Text style={{ color: colors.text }}>
                      {item.detail || "Activité à venir"}
                    </Text>
                    <Text className="text-sm mt-1" style={{ color: colors.textLight }}>
                      {item.date || "À déterminer"}
                    </Text>
                  </View>
                </View>
              ))
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
