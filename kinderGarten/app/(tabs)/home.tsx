import React, { useEffect, useState } from "react";
import { ScrollView, StatusBar, Text, TouchableOpacity, View, Image } from "react-native";
import { Bell, LogOut } from "lucide-react-native";
import { useAppStore } from "../../store/useAppStore";
import colors from "../../config/colors";
import Card from "../../components/Card";
import { router } from "expo-router";

export default function Home({ childId = "child_014" }) {
  const { data } = useAppStore();
  const { childrenList, dailyReports, weeklyPlans, calendarEvents } = data || {};

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

  /** 📦 Construction des données spécifiques à l’enfant */
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

    // 🕒 Construire la timeline et les prochaines activités à partir du planning hebdomadaire
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
          description: `${child.className} — activité en cours`,
          image: "https://i.pravatar.cc/100?img=30",
        },
      ]);

    if (nextActivity)
      setUpcoming([
        {
          title: nextActivity.title,
          datetime: new Date(new Date().setHours(...nextActivity.time.split(":").map(Number))),
          image: "https://i.pravatar.cc/100?img=12",
        },
      ]);
    else if (calendarEvents?.length) {
      // fallback: prochain événement du calendrier
      const nextEvent = calendarEvents
        .filter((e: any) => e.className === child.className || e.className === "Toutes les classes")
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

  /** ⏰ Gestion des heures supplémentaires */
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
    const newHour = Math.floor(totalMinutes / 60)
      .toString()
      .padStart(2, "0");
    const newMinute = (totalMinutes % 60).toString().padStart(2, "0");
    return `${newHour}:${newMinute}`;
  };

  /** 🧭 Rendu de l’interface utilisateur */
  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar barStyle={"dark-content"} />

      {/* 🧭 En-tête */}
      <View
        className="flex-row items-center justify-between px-7 pt-16 pb-6"
        style={{ backgroundColor: colors.accentLight }}
      >
        <View className="flex-row items-center">
          <Image source={{ uri: profile?.avatar }} className="w-16 h-16 rounded-full mr-5" />
          <View>
            <Text className="text-2xl font-bold" style={{ color: colors.textDark }}>
              {profile?.name ?? "Chargement..."}
            </Text>
            <Text
              className="font-semibold text-base"
              style={{ color: profile?.present ? colors.success : colors.error }}
            >
              ● {profile?.present ? "Présent" : "Absent"}
            </Text>
          </View>
        </View>
        {/* 🔔 Notifications + 🔓 Déconnexion */}
        <View className="flex-row items-center">
          <TouchableOpacity className="mr-4">
            <Bell color={colors.textDark} size={28} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace("/login")} // 👈 Navigate to login
            className="p-1"
          >
            <LogOut color={colors.textDark} size={28} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 📜 Contenu défilant */}
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* 📅 Résumé du jour */}
        <Card title="Humeur & Déjeuner">
          {dailySummary ? (
            <>
              {/* Humeur */}
              <View className="flex-row justify-between mb-3">
                <Text style={{ color: colors.text }}>Humeur du jour</Text>
                <Text style={{ color: colors.textDark, fontWeight: "500" }}>
                  {dailySummary.mood === "happy"
                    ? "😄 Joyeux"
                    : dailySummary.mood === "tired"
                      ? "😴 Fatigué"
                      : dailySummary.mood === "calm"
                        ? "😊 Calme"
                        : "🙂 Tranquille"}
                </Text>
              </View>

              {/* Déjeuner */}
              <View className="flex-row justify-between mb-3">
                <Text style={{ color: colors.text }}>Déjeuner</Text>
                <Text style={{ color: colors.textDark, fontWeight: "500" }}>
                  {dailySummary.lunch === "completed"
                    ? "✅ A bien mangé"
                    : dailySummary.lunch === "partial"
                      ? "🍞 A peu mangé"
                      : "❌ N’a pas mangé"}
                </Text>
              </View>

              {/* Commentaire */}
              {!dailySummary.comment && (
                <View className="mt-2">
                  <Text
                    style={{
                      color: colors.textLight,
                      fontStyle: "italic",
                      textAlign: "center",
                    }}
                  >
                    “{dailySummary.comment}il est méchant”
                  </Text>
                </View>
              )}
            </>
          ) : (
            <Text style={{ color: colors.textLight }}>
              Aucune donnée disponible pour aujourd’hui.
            </Text>
          )}
        </Card>

        {/* 🕒 Chronologie */}
        <Card title="Chronologie">
          {timeline?.length > 0 ? (
            timeline.map((item, index) => (
              <View key={index} className="flex-row items-center mb-3">
                <Image source={{ uri: item.image }} className="w-12 h-12 rounded-lg mr-3" />
                <View>
                  <Text style={{ color: colors.textDark, fontWeight: "500" }}>{item.title}</Text>
                  <Text style={{ color: colors.text }}>{item.description}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={{ color: colors.textLight }}>Aucune activité pour le moment.</Text>
          )}
        </Card>

        {/* 📆 À venir */}
        <Card title="À venir">
          {upcoming?.length > 0 ? (
            upcoming.map((event, index) => (
              <View key={index} className="flex-row items-center mb-3">
                <Image source={{ uri: event.image }} className="w-10 h-10 rounded-full mr-3" />
                <View>
                  <Text style={{ color: colors.textDark, fontWeight: "500" }}>{event.title}</Text>
                  <Text style={{ color: colors.text }}>
                    {new Date(event.datetime).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={{ color: colors.textLight }}>Aucun événement à venir.</Text>
          )}
        </Card>

        {/* ⏰ Heures supplémentaires */}
        <Card title="Heures supplémentaires">
          {extraHours.status === "none" && (
            <>
              <Text style={{ color: colors.text, marginBottom: 12 }}>
                Demander du temps de garde supplémentaire
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
                      borderColor: selectedOption === option ? colors.accent : "#D1D5DB",
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
                <Text style={{ color: colors.text }}>🕕 Fin initiale :</Text>
                <Text style={{ color: colors.textDark, fontWeight: "500" }}>
                  {extraHours.baseEndTime || "17:00"}
                </Text>
              </View>

              <View className="flex-row justify-between mb-4">
                <Text style={{ color: colors.text }}>🕒 Nouvelle fin :</Text>
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
                  Demander des heures supplémentaires
                </Text>
              </TouchableOpacity>
            </>
          )}

          {extraHours.status === "pending" && (
            <View className="items-center">
              <Text className="text-center font-medium mb-3" style={{ color: colors.warning }}>
                En attente d’approbation ⏳
              </Text>
              <Text style={{ color: colors.text }}>
                Vous avez demandé{" "}
                <Text style={{ fontWeight: "600" }}>
                  {selectedOption ?? extraHours.requestedMinutes} minutes
                </Text>{" "}
                supplémentaires de garde.
              </Text>
              <Text style={{ color: colors.text, marginTop: 4 }}>
                Nouvelle heure de fin :{" "}
                <Text style={{ fontWeight: "600" }}>{calculateNewEndTime()}</Text>
              </Text>
              <Text style={{ color: colors.textLight, marginTop: 6, textAlign: "center" }}>
                Le personnel a été notifié et approuvera sous peu.
              </Text>
            </View>
          )}

          {extraHours.status === "approved" && (
            <View className="items-center">
              <Text className="text-center font-medium mb-3" style={{ color: colors.success }}>
                Approuvé ✅
              </Text>
              <Text style={{ color: colors.text }}>
                Votre demande de{" "}
                <Text style={{ fontWeight: "600" }}>
                  {selectedOption ?? extraHours.requestedMinutes} minutes
                </Text>{" "}
                supplémentaires a été approuvée.
              </Text>
              <Text style={{ color: colors.text, marginTop: 4 }}>
                Nouvelle heure de fin :{" "}
                <Text style={{ fontWeight: "600" }}>{calculateNewEndTime()}</Text>
              </Text>
              <Text style={{ color: colors.textLight, marginTop: 6, textAlign: "center" }}>
                Merci ! Le planning a été mis à jour en conséquence.
              </Text>
            </View>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}
