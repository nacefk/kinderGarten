import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import colors from "@/config/colors";
import { useAppStore } from "@/store/useAppStore";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

interface EventItem {
  id: string;
  title: string;
  date: string;
  description?: string;
  className?: string;
}

interface PlanActivity {
  time: string;
  title: string;
}

export default function CalendarScreen() {
  const { setData } = useAppStore();
  const calendarEvents = useAppStore((state) => state.data.calendarEvents || []);
  const weeklyPlans = useAppStore((state) => state.data.weeklyPlans || {});
  const classes = useAppStore((state) => state.data.classes || []);

  const [activeTab, setActiveTab] = useState<"events" | "plan">("events");
  const [selectedClass, setSelectedClass] = useState(
    classes.length ? classes[0].name : "Petite Section"
  );

  const daysOfWeek = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

  // ---------- EVENTS ----------
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDate, setNewDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const openEditEvent = (event: EventItem) => {
    setEditingEvent(event);
    setNewTitle(event.title);
    setNewDescription(event.description || "");
    setNewDate(new Date(event.date));
    setShowEventModal(true);
  };

  const handleSaveEvent = () => {
    if (!newTitle.trim()) {
      Alert.alert("Titre manquant", "Veuillez saisir un titre pour l'événement.");
      return;
    }

    const updatedEvent: EventItem = {
      id: editingEvent ? editingEvent.id : Date.now().toString(),
      title: newTitle.trim(),
      date: newDate.toISOString(),
      description: newDescription.trim(),
      className: selectedClass,
    };

    const updatedEvents = editingEvent
      ? calendarEvents.map((e) => (e.id === editingEvent.id ? updatedEvent : e))
      : [...calendarEvents, updatedEvent];

    setData("calendarEvents", updatedEvents);
    setShowEventModal(false);
    setEditingEvent(null);
    setNewTitle("");
    setNewDescription("");
    setNewDate(new Date());
    Alert.alert("Succès ✅", "L'événement a été enregistré.");
  };

  const handleDeleteEvent = () => {
    if (!editingEvent) return;
    Alert.alert("Supprimer l'événement", "Voulez-vous vraiment supprimer cet événement ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => {
          const updated = calendarEvents.filter((e) => e.id !== editingEvent.id);
          setData("calendarEvents", updated);
          setShowEventModal(false);
          setEditingEvent(null);
          Alert.alert("Supprimé ✅", "L'événement a été supprimé.");
        },
      },
    ]);
  };

  const renderEvent = ({ item }: { item: EventItem }) => {
    const eventDate = new Date(item.date);
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => openEditEvent(item)}
        className="rounded-2xl p-5 mb-4 mx-5"
        style={{
          backgroundColor: colors.cardBackground,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-lg font-semibold" style={{ color: colors.textDark }}>
            {item.title}
          </Text>
          <Ionicons name="create-outline" size={20} color={colors.accent} />
        </View>
        <Text className="text-sm mb-1" style={{ color: colors.text }}>
          📅{" "}
          {eventDate.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </Text>
        <Text className="text-sm mb-2" style={{ color: colors.textLight }}>
          🕐{" "}
          {eventDate.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        {item.description ? (
          <Text className="text-sm" style={{ color: colors.text }}>
            {item.description}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  // ---------- PLANNING ----------
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<{
    day: string;
    index: number;
    activity: PlanActivity;
  } | null>(null);
  const [newPlanDay, setNewPlanDay] = useState("Lundi");
  const [newPlanTime, setNewPlanTime] = useState("08:00");
  const [newPlanTitle, setNewPlanTitle] = useState("");

  const openEditPlan = (day: string, index: number, activity: PlanActivity) => {
    setEditingPlan({ day, index, activity });
    setNewPlanDay(day);
    setNewPlanTime(activity.time);
    setNewPlanTitle(activity.title);
    setShowPlanModal(true);
  };

  const handleSavePlan = () => {
    if (!newPlanTitle.trim()) {
      Alert.alert("Titre manquant", "Veuillez saisir le titre de l'activité.");
      return;
    }

    const currentClassPlan = weeklyPlans[selectedClass] || {};
    const currentDayPlan = currentClassPlan[newPlanDay] || [];

    let updatedDayPlan;
    if (editingPlan) {
      updatedDayPlan = [...currentDayPlan];
      updatedDayPlan[editingPlan.index] = {
        time: newPlanTime,
        title: newPlanTitle.trim(),
      };
    } else {
      updatedDayPlan = [...currentDayPlan, { time: newPlanTime, title: newPlanTitle.trim() }].sort(
        (a, b) => a.time.localeCompare(b.time)
      );
    }

    const updatedClassPlan = {
      ...currentClassPlan,
      [newPlanDay]: updatedDayPlan,
    };

    const updatedPlans = {
      ...weeklyPlans,
      [selectedClass]: updatedClassPlan,
    };

    setData("weeklyPlans", updatedPlans);
    setShowPlanModal(false);
    setEditingPlan(null);
    setNewPlanTitle("");
    Alert.alert("Succès ✅", "L'activité a été enregistrée.");
  };

  const handleDeletePlan = () => {
    if (!editingPlan) return;
    const { day, index } = editingPlan;

    Alert.alert(
      "Supprimer l'activité",
      "Voulez-vous vraiment supprimer cette activité du planning ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            const currentClassPlan = weeklyPlans[selectedClass] || {};
            const currentDayPlan = currentClassPlan[day] || [];
            const updatedDayPlan = currentDayPlan.filter((_, i) => i !== index);

            const updatedClassPlan = {
              ...currentClassPlan,
              [day]: updatedDayPlan,
            };
            const updatedPlans = {
              ...weeklyPlans,
              [selectedClass]: updatedClassPlan,
            };

            setData("weeklyPlans", updatedPlans);
            setShowPlanModal(false);
            setEditingPlan(null);
            Alert.alert("Supprimé ✅", "L'activité a été supprimée.");
          },
        },
      ]
    );
  };

  const renderDayPlan = (day: string) => {
    const dailyItems =
      weeklyPlans[selectedClass]?.[day]?.sort((a: any, b: any) => a.time.localeCompare(b.time)) ||
      [];

    return (
      <View
        key={day}
        className="rounded-2xl p-4 mb-4"
        style={{ backgroundColor: colors.cardBackground }}
      >
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-lg font-semibold" style={{ color: colors.textDark }}>
            {day}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setEditingPlan(null);
              setNewPlanDay(day);
              setShowPlanModal(true);
            }}
          >
            <Ionicons name="add-circle-outline" size={22} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {dailyItems.length > 0 ? (
          dailyItems.map((item: PlanActivity, index: number) => (
            <TouchableOpacity
              key={`${day}-${index}`}
              activeOpacity={0.8}
              onPress={() => openEditPlan(day, index, item)}
              className="flex-row items-center mb-2"
            >
              <Ionicons name="time-outline" size={16} color={colors.accent} />
              <Text className="ml-2 text-sm" style={{ color: colors.textDark }}>
                {item.time} — {item.title}
              </Text>
              <Ionicons
                name="create-outline"
                size={16}
                color={colors.textLight}
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>
          ))
        ) : (
          <Text className="text-sm" style={{ color: colors.textLight }}>
            Aucune activité prévue.
          </Text>
        )}
      </View>
    );
  };

  // ---------- UI ----------
  return (
    <View className="flex-1 pt-4" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5 pt-12 pb-6"
        style={{ backgroundColor: colors.accentLight }}
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ChevronLeft color={colors.textDark} size={28} />
        </TouchableOpacity>
        <Text className="text-xl text-center font-semibold" style={{ color: colors.textDark }}>
          Calendrier
        </Text>
      </View>
      {/* Tabs */}
      <View className="flex-row mb-6 bg-white rounded-2xl p-1 shadow-sm mx-5 mt-4">
        {["events", "plan"].map((tab) => (
          <TouchableOpacity
            key={tab}
            className={`flex-1 py-3 rounded-2xl items-center ${
              activeTab === tab ? "bg-[#C6A57B]" : ""
            }`}
            onPress={() => setActiveTab(tab as "events" | "plan")}
          >
            <Text
              className="text-base font-semibold"
              style={{ color: activeTab === tab ? "#fff" : colors.textDark }}
            >
              {tab === "events" ? "Événements" : "Planning Hebdomadaire"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* EVENTS LIST */}
      {activeTab === "events" ? (
        <>
          <View className="flex-row items-center justify-between mb-4 px-5">
            <Text className="text-xl font-semibold" style={{ color: colors.textDark }}>
              Liste des Événements
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setEditingEvent(null);
                setShowEventModal(true);
              }}
              style={{
                backgroundColor: colors.accent,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 8,
              }}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={[...calendarEvents].sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            )}
            renderItem={renderEvent}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : (
        <>
          <View className="flex-row justify-between items-center mb-4 flex-wrap px-5">
            <Text className="text-l font-semibold" style={{ color: colors.textDark }}>
              Planning — {selectedClass}
            </Text>

            {classes.length > 1 && (
              <TouchableOpacity
                onPress={() => {
                  const index = classes.findIndex((c: any) => c.name === selectedClass);
                  const next = classes[(index + 1) % classes.length];
                  setSelectedClass(next.name);
                }}
                style={{
                  backgroundColor: colors.accent,
                  borderRadius: 14,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text className="text-white text-sm font-medium">Changer de classe</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {daysOfWeek.map((day) => renderDayPlan(day))}
          </ScrollView>
        </>
      )}

      {/* EVENT MODAL */}
      <Modal visible={showEventModal} animationType="slide" transparent>
        <View
          className="flex-1 justify-center items-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <View
            className="w-full rounded-2xl p-6"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <Text className="text-xl font-bold mb-4 text-center" style={{ color: colors.textDark }}>
              {editingEvent ? "Modifier l'Événement" : "Nouvel Événement"}
            </Text>

            <TextInput
              className="rounded-xl px-4 py-3 text-base mb-3"
              placeholder="Titre de l'événement"
              placeholderTextColor={colors.textLight}
              value={newTitle}
              onChangeText={setNewTitle}
              style={{
                backgroundColor: "#F8F8F8",
                color: colors.textDark,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            />

            <TouchableOpacity
              onPress={() => setShowPicker(true)}
              className="flex-row items-center justify-between rounded-xl px-4 py-3 mb-3"
              style={{
                backgroundColor: "#F8F8F8",
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <Text style={{ color: colors.text }}>
                {newDate.toLocaleDateString("fr-FR")} à{" "}
                {newDate.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              <Ionicons name="time-outline" size={20} color={colors.textLight} />
            </TouchableOpacity>

            {showPicker && (
              <DateTimePicker
                value={newDate}
                mode="datetime"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowPicker(false);
                  if (selectedDate) setNewDate(selectedDate);
                }}
              />
            )}

            <TextInput
              className="rounded-xl px-4 py-3 text-base mb-5"
              placeholder="Description (facultative)"
              placeholderTextColor={colors.textLight}
              value={newDescription}
              onChangeText={setNewDescription}
              style={{
                backgroundColor: "#F8F8F8",
                color: colors.textDark,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            />

            <View className="flex-row justify-between items-center">
              {editingEvent && (
                <TouchableOpacity
                  onPress={handleDeleteEvent}
                  className="rounded-xl py-3 px-5"
                  style={{ backgroundColor: "#FEE2E2" }}
                >
                  <Text style={{ color: "#B91C1C", fontWeight: "500" }}>Supprimer</Text>
                </TouchableOpacity>
              )}

              <View className="flex-row ml-auto">
                <TouchableOpacity
                  onPress={() => setShowEventModal(false)}
                  className="rounded-xl py-3 px-5 mr-2"
                  style={{ backgroundColor: "#F3F4F6" }}
                >
                  <Text style={{ color: colors.text }}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveEvent}
                  className="rounded-xl py-3 px-5"
                  style={{ backgroundColor: colors.accent }}
                >
                  <Text className="text-white font-medium">
                    {editingEvent ? "Modifier" : "Ajouter"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* PLAN MODAL */}
      <Modal visible={showPlanModal} animationType="fade" transparent>
        <View
          className="flex-1 justify-center items-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <View
            className="w-full rounded-2xl p-6"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <Text className="text-lg font-semibold mb-4" style={{ color: colors.textDark }}>
              {editingPlan ? "Modifier l'Activité" : `Nouvelle Activité (${newPlanDay})`}
            </Text>

            <TextInput
              className="rounded-xl px-4 py-3 text-base mb-3"
              placeholder="Heure (ex: 08:00)"
              placeholderTextColor={colors.textLight}
              value={newPlanTime}
              onChangeText={setNewPlanTime}
              style={{
                backgroundColor: "#F8F8F8",
                color: colors.textDark,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            />

            <TextInput
              className="rounded-xl px-4 py-3 text-base mb-5"
              placeholder="Titre de l'activité"
              placeholderTextColor={colors.textLight}
              value={newPlanTitle}
              onChangeText={setNewPlanTitle}
              style={{
                backgroundColor: "#F8F8F8",
                color: colors.textDark,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            />

            <View className="flex-row justify-between items-center">
              {editingPlan && (
                <TouchableOpacity
                  onPress={handleDeletePlan}
                  className="flex-1 rounded-xl py-3 mx-1"
                  style={{ backgroundColor: "#FEE2E2" }}
                >
                  <Text
                    style={{
                      color: "#BC1C1C",
                      fontWeight: "500",
                      textAlign: "center",
                    }}
                  >
                    Supprimer
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setShowPlanModal(false)}
                className="flex-1 rounded-xl py-3 mx-1"
                style={{ backgroundColor: "#F3F4F6" }}
              >
                <Text style={{ color: colors.text, textAlign: "center" }}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSavePlan}
                className="flex-1 rounded-xl py-3 mx-1"
                style={{ backgroundColor: colors.accent }}
              >
                <Text className="text-white font-medium text-center">
                  {editingPlan ? "Modifier" : "Ajouter"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
