import React, { useState, useEffect } from "react";
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
import HeaderBar from "@/components/Header";
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
} from "@/api/planning";
import { getClassrooms } from "@/api/children";

// ---------- TYPES ----------
interface ClassItem {
  id: number;
  name: string;
}

interface EventItem {
  id: string;
  title: string;
  date: string;
  description?: string;
  class_name: { id: number; name: string };
}

interface PlanActivity {
  id?: string;
  time: string;
  title: string;
  day: string;
  class_name: { id: number; name: string };
}

// ---------- COMPONENT ----------
export default function CalendarScreen() {
  const [activeTab, setActiveTab] = useState<"events" | "plan">("events");
  const [calendarEvents, setCalendarEvents] = useState<EventItem[]>([]);
  const [weeklyPlans, setWeeklyPlans] = useState<Record<string, any>>({});
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const daysOfWeek = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

  // ---------- INITIAL LOAD ----------
  useEffect(() => {
    (async () => {
      try {
        const classList = await getClassrooms();
        setClasses(classList);
        if (classList.length) {
          setSelectedClass(classList[0]);
          await fetchData(classList[0].id);
        }
      } catch (e) {
        console.error(e);
        Alert.alert("Erreur", "Impossible de charger les classes.");
      }
    })();
  }, []);
  // ---------- FETCH DATA ----------

  const fetchData = async (classId?: number) => {
    try {
      const [eventsData, plansData] = await Promise.all([
        getEvents(classId ? { class_name: classId } : undefined),
        getPlans(classId ? { class_name: classId } : undefined),
      ]);
      setCalendarEvents(eventsData);

      const groupedPlans = plansData.reduce((acc: any, plan: any) => {
        // use class_name_detail for display grouping
        const className = plan.class_name_detail?.name || plan.class_name?.name || "Inconnu";
        const { day, time, title, id } = plan;

        if (!acc[className]) acc[className] = {};
        if (!acc[className][day]) acc[className][day] = [];

        acc[className][day].push({ id, time, title, day, class_name: className });
        return acc;
      }, {});

      setWeeklyPlans(groupedPlans);
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Impossible de charger les données du planning.");
    }
  };

  // ---------- EVENT MODAL STATE ----------
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

  const handleSaveEvent = async () => {
    if (!newTitle.trim()) {
      Alert.alert("Titre manquant", "Veuillez saisir un titre pour l'événement.");
      return;
    }
    if (!selectedClass) {
      Alert.alert("Classe manquante", "Veuillez sélectionner une classe.");
      return;
    }

    const payload = {
      title: newTitle.trim(),
      date: newDate.toISOString(),
      description: newDescription.trim(),
      class_name: selectedClass.id,
    };

    try {
      if (editingEvent) await updateEvent(editingEvent.id, payload);
      else await createEvent(payload);

      Alert.alert("Succès ✅", "L'événement a été enregistré.");
      setShowEventModal(false);
      setEditingEvent(null);
      setNewTitle("");
      setNewDescription("");
      setNewDate(new Date());
      await fetchData(selectedClass.id);
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Impossible d'enregistrer l'événement.");
    }
  };

  const handleDeleteEvent = async () => {
    if (!editingEvent) return;
    Alert.alert("Supprimer l'événement", "Voulez-vous vraiment supprimer cet événement ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteEvent(editingEvent.id);
            setShowEventModal(false);
            setEditingEvent(null);
            await fetchData(selectedClass?.id);
            Alert.alert("Supprimé ✅", "L'événement a été supprimé.");
          } catch {
            Alert.alert("Erreur", "Impossible de supprimer l'événement.");
          }
        },
      },
    ]);
  };

  // ---------- PLAN MODAL ----------
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanActivity | null>(null);
  const [newPlanDay, setNewPlanDay] = useState("Lundi");
  const [newPlanTime, setNewPlanTime] = useState("08:00");
  const [newPlanTitle, setNewPlanTitle] = useState("");

  const openEditPlan = (plan: PlanActivity) => {
    setEditingPlan(plan);
    setNewPlanDay(plan.day);
    setNewPlanTime(plan.time);
    setNewPlanTitle(plan.title);
    setShowPlanModal(true);
  };

  const handleSavePlan = async () => {
    if (!newPlanTitle.trim()) {
      Alert.alert("Titre manquant", "Veuillez saisir le titre de l'activité.");
      return;
    }
    if (!selectedClass) {
      Alert.alert("Classe manquante", "Veuillez sélectionner une classe.");
      return;
    }

    const payload = {
      time: newPlanTime,
      title: newPlanTitle.trim(),
      day: newPlanDay,
      class_name: selectedClass.id,
    };

    console.log("📦 Payload sent to backend:", payload);

    try {
      let newItem;
      if (editingPlan?.id) {
        newItem = await updatePlan(editingPlan.id, payload);
      } else {
        newItem = await createPlan(payload);
      }

      // ✅ Update UI instantly
      setWeeklyPlans((prev: any) => {
        const updated = { ...prev };
        const className = selectedClass.name;
        if (!updated[className]) updated[className] = {};
        if (!updated[className][newPlanDay]) updated[className][newPlanDay] = [];

        // if editing, replace existing
        if (editingPlan?.id) {
          updated[className][newPlanDay] = updated[className][newPlanDay].map((p: any) =>
            p.id === editingPlan.id
              ? { ...p, ...newItem, title: newPlanTitle.trim(), time: newPlanTime }
              : p
          );
        } else {
          updated[className][newPlanDay].push({
            id: newItem.id,
            title: newPlanTitle.trim(),
            time: newPlanTime,
            day: newPlanDay,
          });
        }

        return updated;
      });

      Alert.alert("Succès ✅", "L'activité a été enregistrée.");
      setShowPlanModal(false);
      setEditingPlan(null);
      setNewPlanTitle("");
    } catch (e) {
      console.error("❌ Error saving plan:", e);
      Alert.alert("Erreur", "Impossible d'enregistrer l'activité.");
    }
  };

  const handleDeletePlan = async () => {
    if (!editingPlan?.id) return;

    Alert.alert("Supprimer l'activité", "Voulez-vous vraiment supprimer cette activité ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePlan(editingPlan.id!);
            setShowPlanModal(false);
            setEditingPlan(null);
            await fetchData();
            Alert.alert("Supprimé ✅", "L'activité a été supprimée.");
          } catch (e) {
            Alert.alert("Erreur", "Impossible de supprimer l'activité.");
          }
        },
      },
    ]);
  };

  // ---------- RENDER ----------
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

  const renderDayPlan = (day: string) => {
    const dailyItems = weeklyPlans[selectedClass?.name]?.[day] || [];
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
              onPress={() => openEditPlan(item)}
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
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <HeaderBar title="Calendrier" showBack={true} />

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
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : (
        <>
          <View className="flex-row justify-between items-center mb-4 flex-wrap px-5">
            <Text className="text-l font-semibold" style={{ color: colors.textDark }}>
              Planning — {selectedClass?.name}
            </Text>

            {classes.length > 1 && (
              <TouchableOpacity
                onPress={() => {
                  const index = classes.findIndex((c) => c.id === selectedClass?.id);
                  const next = classes[(index + 1) % classes.length];
                  setSelectedClass(next);
                  fetchData(next.id);
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
              placeholder="Titre de l'événement"
              value={newTitle}
              onChangeText={setNewTitle}
              className="rounded-xl px-4 py-3 text-base mb-3"
              placeholderTextColor={colors.textLight}
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
              style={{ backgroundColor: "#F8F8F8", borderWidth: 1, borderColor: "#E5E7EB" }}
            >
              <Text style={{ color: colors.text }}>
                {newDate.toLocaleDateString("fr-FR")} à{" "}
                {newDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </Text>
              <Ionicons name="time-outline" size={20} color={colors.textLight} />
            </TouchableOpacity>

            {showPicker && (
              <DateTimePicker
                value={newDate}
                mode="datetime"
                display="default"
                onChange={(event, selectedDate) => {
                  try {
                    if (!event || event.type === "dismissed") {
                      setShowPicker(false);
                      return;
                    }
                    if (selectedDate) {
                      setNewDate(selectedDate);
                    }
                  } catch (err) {
                    console.warn("⚠️ Date picker dismissed unexpectedly:", err);
                  } finally {
                    setShowPicker(false);
                  }
                }}
              />
            )}

            <TextInput
              placeholder="Description (facultative)"
              value={newDescription}
              onChangeText={setNewDescription}
              className="rounded-xl px-4 py-3 text-base mb-5"
              placeholderTextColor={colors.textLight}
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
              placeholder="Heure (ex: 08:00)"
              value={newPlanTime}
              onChangeText={setNewPlanTime}
              className="rounded-xl px-4 py-3 text-base mb-3"
              placeholderTextColor={colors.textLight}
              style={{
                backgroundColor: "#F8F8F8",
                color: colors.textDark,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            />

            <TextInput
              placeholder="Titre de l'activité"
              value={newPlanTitle}
              onChangeText={setNewPlanTitle}
              className="rounded-xl px-4 py-3 text-base mb-5"
              placeholderTextColor={colors.textLight}
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
