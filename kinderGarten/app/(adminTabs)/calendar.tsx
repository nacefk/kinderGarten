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

// -------- Interfaces --------
interface EventItem {
  id: string;
  title: string;
  date: Date;
  description?: string;
}

interface PlanItem {
  id: string;
  day: string; // e.g. "Lundi"
  time: string; // e.g. "08:00"
  title: string;
  className: string;
}

export default function CalendarScreen() {
  // ----- EVENTS -----
  const [events, setEvents] = useState<EventItem[]>([
    {
      id: "1",
      title: "Sortie au parc",
      date: new Date(2025, 9, 15, 10, 0),
      description: "Activité extérieure avec les enfants de la classe 2.",
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDate, setNewDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  // ----- PLANNING -----
  const [activeTab, setActiveTab] = useState<"events" | "plan">("events");
  const [selectedClass, setSelectedClass] = useState("Petite Section");

  const [plan, setPlan] = useState<PlanItem[]>([
    {
      id: "1",
      day: "Lundi",
      time: "08:00",
      title: "Arrivée et jeux libres",
      className: "Petite Section",
    },
    {
      id: "2",
      day: "Lundi",
      time: "10:00",
      title: "Atelier dessin",
      className: "Petite Section",
    },
    {
      id: "3",
      day: "Mardi",
      time: "09:00",
      title: "Lecture d'histoires",
      className: "Moyenne Section",
    },
  ]);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [newPlanDay, setNewPlanDay] = useState("Lundi");
  const [newPlanTime, setNewPlanTime] = useState("08:00");
  const [newPlanTitle, setNewPlanTitle] = useState("");

  const classes = ["Petite Section", "Moyenne Section", "Crèche 2"];
  const daysOfWeek = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

  // -------- FUNCTIONS --------

  const handleAddEvent = () => {
    if (!newTitle.trim()) {
      Alert.alert("Titre manquant", "Veuillez saisir un titre pour l'événement.");
      return;
    }

    const newEvent: EventItem = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      date: newDate,
      description: newDescription.trim(),
    };

    setEvents([...events, newEvent]);
    setShowModal(false);
    setNewTitle("");
    setNewDescription("");
    setNewDate(new Date());
  };

  const handleAddPlan = () => {
    if (!newPlanTitle.trim()) {
      Alert.alert("Activité manquante", "Veuillez saisir le titre de l'activité.");
      return;
    }

    const newActivity: PlanItem = {
      id: Date.now().toString(),
      day: newPlanDay,
      time: newPlanTime,
      title: newPlanTitle.trim(),
      className: selectedClass,
    };

    setPlan([...plan, newActivity]);
    setShowPlanModal(false);
    setNewPlanTitle("");
    Alert.alert("Ajouté ✅", "L'activité a été ajoutée avec succès.");
  };

  // ----------- UI -----------
  const renderEvent = ({ item }: { item: EventItem }) => (
    <View
      className="rounded-2xl p-5 mb-4"
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
        <Ionicons name="calendar-outline" size={20} color={colors.accent} />
      </View>
      <Text className="text-sm mb-1" style={{ color: colors.text }}>
        📅 {item.date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
      </Text>
      <Text className="text-sm mb-2" style={{ color: colors.textLight }}>
        🕐 {item.date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
      </Text>
      {item.description ? (
        <Text className="text-sm" style={{ color: colors.text }}>
          {item.description}
        </Text>
      ) : null}
    </View>
  );

  const renderDayPlan = (day: string) => {
    const dailyItems = plan
      .filter((p) => p.className === selectedClass && p.day === day)
      .sort((a, b) => a.time.localeCompare(b.time));

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
          <TouchableOpacity onPress={() => {
            setNewPlanDay(day);
            setShowPlanModal(true);
          }}>
            <Ionicons name="add-circle-outline" size={22} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {dailyItems.length > 0 ? (
          dailyItems.map((item) => (
            <View key={item.id} className="flex-row items-center mb-2">
              <Ionicons name="time-outline" size={16} color={colors.accent} />
              <Text
                className="ml-2 text-sm"
                style={{ color: colors.textDark }}
              >
                {item.time} — {item.title}
              </Text>
            </View>
          ))
        ) : (
          <Text className="text-sm" style={{ color: colors.textLight }}>
            Aucune activité prévue.
          </Text>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 px-5 pt-4" style={{ backgroundColor: colors.background }}>
      {/* Tabs Header */}
      <View className="flex-row mb-6 bg-white rounded-2xl p-1 shadow-sm">
        <TouchableOpacity
          className={`flex-1 py-3 rounded-2xl items-center ${
            activeTab === "events" ? "bg-[#C6A57B]" : ""
          }`}
          onPress={() => setActiveTab("events")}
        >
          <Text
            className="text-base font-semibold"
            style={{ color: activeTab === "events" ? "#fff" : colors.textDark }}
          >
            Événements
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-3 rounded-2xl items-center ${
            activeTab === "plan" ? "bg-[#C6A57B]" : ""
          }`}
          onPress={() => setActiveTab("plan")}
        >
          <Text
            className="text-base font-semibold"
            style={{ color: activeTab === "plan" ? "#fff" : colors.textDark }}
          >
            Planning Hebdomadaire
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "events" ? (
        <>
          {/* ---------- EVENTS ---------- */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-semibold" style={{ color: colors.textDark }}>
              Liste des Événements
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowModal(true)}
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
            data={events.sort((a, b) => a.date.getTime() - b.date.getTime())}
            renderItem={renderEvent}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : (
        <>
          {/* ---------- PLANNING ---------- */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-semibold" style={{ color: colors.textDark }}>
              Planning — {selectedClass}
            </Text>

            <TouchableOpacity
              onPress={() => {
                const index = classes.indexOf(selectedClass);
                const next = classes[(index + 1) % classes.length];
                setSelectedClass(next);
              }}
              style={{
                backgroundColor: colors.accent,
                borderRadius: 14,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text className="text-white text-sm font-medium">
                Changer de classe
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {daysOfWeek.map((day) => renderDayPlan(day))}
          </ScrollView>
        </>
      )}

      {/* ---------- EVENT MODAL ---------- */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View className="flex-1 justify-center items-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View className="w-full rounded-2xl p-6" style={{ backgroundColor: colors.cardBackground }}>
            <Text className="text-xl font-bold mb-4 text-center" style={{ color: colors.textDark }}>
              Nouvel Événement
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

            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                className="rounded-xl py-3 px-5"
                style={{ backgroundColor: "#F3F4F6" }}
              >
                <Text style={{ color: colors.text }}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddEvent}
                className="rounded-xl py-3 px-5"
                style={{ backgroundColor: colors.accent }}
              >
                <Text className="text-white font-medium">Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ---------- PLAN MODAL ---------- */}
      <Modal visible={showPlanModal} animationType="fade" transparent>
        <View className="flex-1 justify-center items-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View className="w-full rounded-2xl p-6" style={{ backgroundColor: colors.cardBackground }}>
            <Text className="text-lg font-semibold mb-4" style={{ color: colors.textDark }}>
              Nouvelle Activité ({newPlanDay})
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

            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => setShowPlanModal(false)}
                className="rounded-xl py-3 px-5"
                style={{ backgroundColor: "#F3F4F6" }}
              >
                <Text style={{ color: colors.text }}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddPlan}
                className="rounded-xl py-3 px-5"
                style={{ backgroundColor: colors.accent }}
              >
                <Text className="text-white font-medium">Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
