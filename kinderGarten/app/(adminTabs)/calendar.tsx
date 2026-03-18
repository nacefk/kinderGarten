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
import { useFocusEffect } from "@react-navigation/native";
import { getColors } from "@/config/colors";
import { useAppStore } from "@/store/useAppStore";
import HeaderBar from "@/components/Header";
import { useLanguageStore } from "@/store/useLanguageStore";
import { getTranslation } from "@/config/translations";
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
import { getClassrooms, getMyChild } from "@/api/children";
import { useAuthStore } from "@/store/useAuthStore";

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
  endTime?: string;
  title: string;
  day: string;
  class_name: { id: number; name: string };
}

// ---------- COMPONENT ----------
export default function CalendarScreen() {
  const { language } = useLanguageStore();
  const { userRole } = useAuthStore();
  const tenant = useAppStore((state) => state.tenant);
  const colors = getColors(tenant?.primary_color, tenant?.secondary_color);
  const t = (key: string) => getTranslation(language, key);
  const [activeTab, setActiveTab] = useState<"events" | "plan">("events");
  const [calendarEvents, setCalendarEvents] = useState<EventItem[]>([]);
  const [weeklyPlans, setWeeklyPlans] = useState<Record<string, any>>({});
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [isParent, setIsParent] = useState(userRole === "parent");

  // Days of week translations
  const daysOfWeek =
    language === "en"
      ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
      : language === "ar"
        ? ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"]
        : ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

  // ---------- INITIAL LOAD ----------
  useEffect(() => {
    (async () => {
      try {
        if (isParent) {
          // Parent: Fetch their child and get the classroom
          const child = await getMyChild();
          if (child && child.classroom) {
            const classroom: ClassItem = {
              id: child.classroom.id || child.classroom,
              name: child.classroom.name || `Class ${child.classroom.id}`,
            };
            setClasses([classroom]);
            setSelectedClass(classroom);
            await fetchData(classroom.id);
          }
        } else {
          // Admin: Load all classrooms
          const classList = await getClassrooms();
          setClasses(classList);
          if (classList.length) {
            setSelectedClass(classList[0]);
            await fetchData(classList[0].id);
          }
        }
      } catch (e) {
        console.error("❌ Error loading calendar:", e);
        Alert.alert("Erreur", "Impossible de charger les classes.");
      }
    })();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        try {
          if (!isParent && selectedClass) {
            // Admin: refresh all classes and data
            const classList = await getClassrooms();
            setClasses(classList);
            const classExists = classList.find((c: any) => c.id === selectedClass.id);
            if (!classExists) {
              // If deleted, select the first available class
              setSelectedClass(classList[0]);
              await fetchData(classList[0].id);
            } else {
              // Refresh current class data
              await fetchData(selectedClass.id);
            }
          } else if (isParent && selectedClass) {
            // Parent: just refresh the data for their child's class
            await fetchData(selectedClass.id);
          }
        } catch (e) {
          console.error("❌ Focus effect error:", e);
        }
      })();
    }, [selectedClass, isParent])
  );
  // ---------- FETCH DATA ----------

  const fetchData = async (classId?: number) => {
    try {
      // // console.log("📡 Fetching events for classroom:", classId);
      const [eventsData, plansData] = await Promise.all([
        getEvents(classId ? { classroom: classId } : undefined),
        getPlans(classId ? { classroom: classId } : undefined),
      ]);
      // // console.log("✅ Events fetched:", eventsData.length, "events");
      // // console.log("✅ Plans fetched:", plansData.length, "plans");
      // // console.log("📋 Raw plans data:", plansData);
      setCalendarEvents(eventsData);

      const ALL_DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

      const groupedPlans = plansData.reduce((acc: any, plan: any) => {
        const className =
          plan.classroom_detail?.name ||
          plan.class_name_detail?.name ||
          plan.class_name?.name ||
          "Inconnu";
        // console.log("🔍 Processing plan ID:", plan.id, "| Class:", className, "| Has starts_at?", !!plan.starts_at, "| Starts_at:", plan.starts_at);

        // 🔥 First time we encounter a class → pre-fill all 7 days
        if (!acc[className]) {
          acc[className] = {};
          ALL_DAYS.forEach((d) => {
            acc[className][d] = [];
          });
        }

        // 🔥 Handle new format: flat plan with starts_at/ends_at (backend returns single plan as activity)
        if (plan.starts_at && plan.ends_at && plan.title) {
          // console.log("📦 Processing plan with ISO times:", plan.id, plan.starts_at);

          // Convert ISO datetime to day and time
          const startDate = new Date(plan.starts_at);
          const endDate = new Date(plan.ends_at);
          // console.log("⏰ ISO datetime:", plan.starts_at, "→ Parsed date:", startDate, "→ Day:", startDate.toLocaleDateString("en-US", { weekday: "long" }));

          const day = startDate.toLocaleDateString("en-US", { weekday: "long" });
          // Map English day names to French
          const dayMap: Record<string, string> = {
            Monday: "Lundi",
            Tuesday: "Mardi",
            Wednesday: "Mercredi",
            Thursday: "Jeudi",
            Friday: "Vendredi",
            Saturday: "Samedi",
            Sunday: "Dimanche",
          };
          const frenchDay = dayMap[day] || day;

          const time = `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}`;
          const endTime = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`;

          const activityItem = {
            id: plan.id,
            time,
            endTime,
            title: plan.title,
            day: frenchDay,
            class_name: className,
          };
          // console.log("✅ Adding plan to", className, frenchDay, ":", activityItem);
          acc[className][frenchDay].push(activityItem);
        }
        // 🔥 Handle activities array format (if backend returns it)
        else if (Array.isArray(plan.activities) && plan.activities.length > 0) {
          // console.log("📦 Processing activities array for plan:", plan.id, plan.activities);
          plan.activities.forEach((activity: any) => {
            if (!activity.starts_at || !activity.ends_at) return;

            const startDate = new Date(activity.starts_at);
            const endDate = new Date(activity.ends_at);
            const day = startDate.toLocaleDateString("en-US", { weekday: "long" });
            const dayMap: Record<string, string> = {
              Monday: "Lundi",
              Tuesday: "Mardi",
              Wednesday: "Mercredi",
              Thursday: "Jeudi",
              Friday: "Vendredi",
              Saturday: "Samedi",
              Sunday: "Dimanche",
            };
            const frenchDay = dayMap[day] || day;
            const time = `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}`;
            const endTime = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`;

            acc[className][frenchDay].push({
              id: plan.id,
              time,
              endTime,
              title: activity.title,
              day: frenchDay,
              class_name: className,
            });
          });
        }
        // 🔥 Handle old format with flat fields (day/time from old backend)
        else if (plan.day && plan.time && plan.title) {
          // console.log("📦 Processing flat plan with day/time:", plan.id);
          acc[className][plan.day].push({
            id: plan.id,
            time: plan.time,
            title: plan.title,
            day: plan.day,
            class_name: className,
          });
        } else {
          // console.log("⚠️ Plan has no valid time data:", plan.id, plan.title);
        }

        return acc;
      }, {});

      // 🔥 Make sure selected class still has all days
      if (selectedClass) {
        const cls = selectedClass.name;
        // console.log("🔍 Looking for selected class:", cls, "| Available classes in groupedPlans:", Object.keys(groupedPlans));
        if (groupedPlans[cls]) {
          ALL_DAYS.forEach((d) => {
            if (!groupedPlans[cls][d]) groupedPlans[cls][d] = [];
          });
          // console.log("✅ Found class", cls, "with activities:", groupedPlans[cls]);
        } else {
          // console.log("❌ Selected class", cls, "not found in grouped plans");
        }
      } else {
        // console.log("❌ No selected class");
      }

      // console.log("📊 Final grouped plans for display:", groupedPlans);
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
  const [showPicker, setShowPicker] = useState<"date" | "time" | false>(false);

  const openEditEvent = (event: EventItem) => {
    setEditingEvent(event);
    setNewTitle(event.title);
    setNewDescription(event.description || "");
    setNewDate(new Date(event.date));

    // Try to find and set the event's class
    let eventClass: ClassItem | null = null;

    // Case 1: event has classroom_detail property (from API)
    if ((event as any).classroom_detail) {
      const detail = (event as any).classroom_detail;
      eventClass = classes.find((c) => c.id === detail.id) || (detail as ClassItem);
    }
    // Case 2: class_name is an object with id and name
    else if (
      event.class_name &&
      typeof event.class_name === "object" &&
      "id" in event.class_name &&
      "name" in event.class_name
    ) {
      eventClass = event.class_name as ClassItem;
    }
    // Case 3: class_name is an object with name property, search by name
    else if (
      event.class_name &&
      typeof event.class_name === "object" &&
      "name" in event.class_name
    ) {
      const className = (event.class_name as any).name;
      eventClass = classes.find((c) => c.name === className) || null;
    }
    // Case 4: class_name might be an object with just id, find by id
    else if (event.class_name && typeof event.class_name === "object" && "id" in event.class_name) {
      const classId = (event.class_name as any).id;
      eventClass = classes.find((c) => c.id === classId) || null;
    }
    // Case 5: event might have a classroom_id property directly
    else if ((event as any).classroom_id) {
      eventClass = classes.find((c) => c.id === (event as any).classroom_id) || null;
    }

    if (eventClass) {
      setSelectedEventClass(eventClass);
    }
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

    if (!selectedEventClass) {
      Alert.alert("Classe manquante", "Veuillez sélectionner une classe ou 'Tous'.");
      return;
    }

    const payload: any = {
      title: newTitle.trim(),
      date: newDate.toISOString(),
      description: newDescription.trim(),
    };

    // Only send classroom_id if not editing and not "all classes"
    if (!editingEvent && selectedEventClass.id !== -1) {
      payload.classroom_id = selectedEventClass.id;
    }

    try {
      if (editingEvent) await updateEvent(editingEvent.id, payload);
      else await createEvent(payload);

      Alert.alert("Succès ✅", "L'événement a été enregistré.");
      setShowEventModal(false);
      setEditingEvent(null);
      setNewTitle("");
      setNewDescription("");
      setNewDate(new Date());
      setSelectedEventClass(null);
      setShowClassPicker(false);
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
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [selectedEventClass, setSelectedEventClass] = useState<ClassItem | null>(null);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanActivity | null>(null);
  const [newPlanDay, setNewPlanDay] = useState("Lundi");
  const [newPlanStartTime, setNewPlanStartTime] = useState("08:00");
  const [newPlanEndTime, setNewPlanEndTime] = useState("09:00");
  const [newPlanTitle, setNewPlanTitle] = useState("");

  const openEditPlan = (plan: PlanActivity) => {
    setEditingPlan(plan);
    setNewPlanDay(plan.day);
    setNewPlanStartTime(plan.time);
    setNewPlanEndTime(plan.endTime || plan.time); // Use endTime if available, else fallback to start time
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
      title: newPlanTitle.trim(),
      day: newPlanDay,
      time: newPlanStartTime, // Keep for backward compatibility in API
      class_name: selectedClass.id,
      activities: [
        {
          title: newPlanTitle.trim(),
          day: newPlanDay,
          time: newPlanStartTime,
          endTime: newPlanEndTime, // Pass end time
          // starts_at and ends_at will be calculated by the API
        },
      ],
    };
    // console.log("📋 Payload being sent to createPlan/updatePlan:", payload);
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
              ? {
                  ...p,
                  ...newItem,
                  title: newPlanTitle.trim(),
                  time: newPlanStartTime,
                  endTime: newPlanEndTime,
                }
              : p
          );
        } else {
          updated[className][newPlanDay].push({
            id: newItem.id,
            title: newPlanTitle.trim(),
            time: newPlanStartTime,
            endTime: newPlanEndTime,
            day: newPlanDay,
          });
        }

        return updated;
      });

      // Refresh data from backend
      await fetchData(selectedClass?.id);

      Alert.alert("Succès ✅", "L'activité a été enregistrée.");
      setShowPlanModal(false);
      setEditingPlan(null);
      setNewPlanTitle("");
      setNewPlanStartTime("08:00");
      setNewPlanEndTime("09:00");
    } catch (e: any) {
      console.error("❌ Error saving plan:", e);
      // Show detailed error message
      let errorMessage = "Impossible d'enregistrer l'activité.";
      if (e.message) {
        errorMessage = e.message;
      } else if (e.response?.data?.detail) {
        errorMessage = e.response.data.detail;
      } else if (e.response?.data?.activities) {
        errorMessage = Array.isArray(e.response.data.activities)
          ? e.response.data.activities[0]
          : e.response.data.activities;
      } else if (e.response?.data?.non_field_errors) {
        errorMessage = e.response.data.non_field_errors[0];
      }
      Alert.alert("Erreur", errorMessage);
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
                {item.time}
                {item.endTime ? ` - ${item.endTime}` : ""} — {item.title}
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
            {t("calendar.no_activities")}
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
      <View
        className="flex-row mb-6 bg-white rounded-2xl p-1 mx-5 mt-4"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        {["events", "plan"].map((tab) => (
          <TouchableOpacity
            key={tab}
            className="flex-1 py-3 rounded-2xl items-center"
            style={{
              backgroundColor: activeTab === tab ? colors.primary : colors.background,
            }}
            onPress={() => setActiveTab(tab as "events" | "plan")}
          >
            <Text
              className="text-base font-semibold"
              style={{ color: activeTab === tab ? colors.white : colors.textDark }}
            >
              {tab === "events" ? t("calendar.events") : t("calendar.weekly_plan")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "events" ? (
        <>
          <View className="flex-row items-center justify-between mb-4 px-5">
            <Text className="text-xl font-semibold" style={{ color: colors.textDark }}>
              {t("calendar.event_list")}
            </Text>
            {!isParent && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setEditingEvent(null);
                  setSelectedEventClass(null);
                  setShowClassPicker(false);
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
            )}
          </View>

          {calendarEvents.length > 0 ? (
            <FlatList
              data={[...calendarEvents].sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
              )}
              renderItem={renderEvent}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View className="flex-1 items-center justify-center px-5">
              <Text className="text-center text-lg" style={{ color: colors.textLight }}>
                {t("calendar.no_activities")}
              </Text>
            </View>
          )}
        </>
      ) : (
        <>
          <View className="flex-row justify-between items-center mb-4 flex-wrap px-5">
            <Text className="text-l font-semibold" style={{ color: colors.textDark }}>
              {t("calendar.planning")} — {selectedClass?.name}
            </Text>

            {!isParent && classes.length > 1 && (
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
                <Text className="text-white text-sm font-medium">{t("calendar.change_class")}</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {daysOfWeek.map((day) => renderDayPlan(day))}
          </ScrollView>
        </>
      )}

      {/* EVENT MODAL */}
      {/* EVENT MODAL */}
      <Modal visible={showEventModal} animationType="slide" transparent>
        <View
          className="flex-1 justify-center items-center px-6"
          style={{ backgroundColor: colors.overlayDark }}
        >
          <View
            className="w-full rounded-2xl p-6"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <Text className="text-xl font-bold mb-4 text-center" style={{ color: colors.textDark }}>
              {editingEvent ? t("calendar.edit_event") : t("calendar.new_event")}
            </Text>

            {/* 🏷️ Title */}
            <TextInput
              placeholder="Titre de l'événement"
              value={newTitle}
              onChangeText={setNewTitle}
              className="rounded-xl px-4 py-3 text-base mb-3"
              placeholderTextColor={colors.textLight}
              style={{
                backgroundColor: colors.cardBackground,
                color: colors.textDark,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />

            {/* 🏫 CLASS PICKER */}
            {!isParent && (
              <>
                <TouchableOpacity
                  onPress={() => setShowClassPicker(!showClassPicker)}
                  className="rounded-xl px-4 py-3 mb-3 flex-row items-center justify-between"
                  style={{
                    backgroundColor: colors.cardBackground,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ color: colors.text }}>
                    {selectedEventClass?.name || "Sélectionner une classe"}
                  </Text>
                  <Ionicons
                    name={showClassPicker ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={colors.textLight}
                  />
                </TouchableOpacity>

                {showClassPicker && (
                  <View
                    className="mb-3 rounded-xl"
                    style={{
                      backgroundColor: colors.cardBackground,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedEventClass(null);
                        setShowClassPicker(false);
                      }}
                      className="px-4 py-3 border-b"
                      style={{ borderBottomColor: colors.border }}
                    >
                      <Text
                        style={{
                          color: colors.text,
                          fontWeight: !selectedEventClass ? "600" : "400",
                        }}
                      >
                        Sélectionner une classe
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedEventClass({ id: -1, name: "Tous" });
                        setShowClassPicker(false);
                      }}
                      className="px-4 py-3 border-b"
                      style={{ borderBottomColor: colors.border }}
                    >
                      <Text
                        style={{
                          color: colors.text,
                          fontWeight: selectedEventClass?.id === -1 ? "600" : "400",
                        }}
                      >
                        Tous
                      </Text>
                    </TouchableOpacity>
                    {classes.map((cls) => (
                      <TouchableOpacity
                        key={cls.id}
                        onPress={() => {
                          setSelectedEventClass(cls);
                          setShowClassPicker(false);
                        }}
                        className="px-4 py-3 border-b"
                        style={{ borderBottomColor: colors.border }}
                      >
                        <Text
                          style={{
                            color: colors.text,
                            fontWeight: selectedEventClass?.id === cls.id ? "600" : "400",
                          }}
                        >
                          {cls.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}
            {isParent && (
              <View
                className="rounded-xl px-4 py-3 mb-3"
                style={{
                  backgroundColor: colors.cardBackground,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.text }}>{selectedClass?.name}</Text>
              </View>
            )}

            {/* 📅 DATE PICKER */}
            <TouchableOpacity
              onPress={() => setShowPicker("date")}
              className="flex-row items-center justify-between rounded-xl px-4 py-3 mb-3"
              style={{
                backgroundColor: colors.cardBackground,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.text }}>{newDate.toLocaleDateString("fr-FR")}</Text>
              <Ionicons name="calendar-outline" size={20} color={colors.textLight} />
            </TouchableOpacity>

            {/* 🕒 TIME PICKER */}
            <TouchableOpacity
              onPress={() => setShowPicker("time")}
              className="flex-row items-center justify-between rounded-xl px-4 py-3 mb-3"
              style={{
                backgroundColor: colors.cardBackground,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.text }}>
                {newDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </Text>
              <Ionicons name="time-outline" size={20} color={colors.textLight} />
            </TouchableOpacity>

            {/* 🧩 Conditional date/time picker */}
            {showPicker && (
              <DateTimePicker
                value={newDate}
                mode={showPicker}
                display="default"
                onChange={(event, selectedDate) => {
                  if (event.type === "dismissed") return setShowPicker(false);
                  if (selectedDate) setNewDate(selectedDate);
                  setShowPicker(false);
                }}
              />
            )}

            {/* 📝 Description */}
            <TextInput
              placeholder="Description (facultative)"
              value={newDescription}
              onChangeText={setNewDescription}
              className="rounded-xl px-4 py-3 text-base mb-5"
              placeholderTextColor={colors.textLight}
              style={{
                backgroundColor: colors.cardBackground,
                color: colors.textDark,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />

            {/* ⚙️ ACTION BUTTONS */}
            <View className="flex-row justify-between items-center">
              {editingEvent && (
                <TouchableOpacity
                  onPress={handleDeleteEvent}
                  className="rounded-xl py-3 px-5"
                  style={{ backgroundColor: colors.redLight }}
                >
                  <Text style={{ color: colors.redDark, fontWeight: "500" }}>
                    {t("common.delete")}
                  </Text>
                </TouchableOpacity>
              )}

              <View className="flex-row ml-auto">
                <TouchableOpacity
                  onPress={() => {
                    setShowEventModal(false);
                    setSelectedEventClass(null);
                    setShowClassPicker(false);
                  }}
                  className="rounded-xl py-3 px-5 mr-2"
                  style={{ backgroundColor: colors.lightGrayBg }}
                >
                  <Text style={{ color: colors.text }}>{t("common.cancel")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveEvent}
                  className="rounded-xl py-3 px-5"
                  style={{ backgroundColor: colors.accent }}
                >
                  <Text className="text-white font-medium">
                    {editingEvent ? t("common.edit") : t("common.add")}
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
          style={{ backgroundColor: colors.overlayDark }}
        >
          <View
            className="w-full rounded-2xl p-6"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <Text className="text-lg font-semibold mb-4" style={{ color: colors.textDark }}>
              {editingPlan
                ? t("calendar.edit_activity")
                : `${t("calendar.new_activity")} (${newPlanDay})`}
            </Text>

            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-xs font-semibold mb-1" style={{ color: colors.textLight }}>
                  Début
                </Text>
                <TextInput
                  placeholder="08:00"
                  value={newPlanStartTime}
                  onChangeText={setNewPlanStartTime}
                  className="rounded-xl px-4 py-3 text-base"
                  placeholderTextColor={colors.textLight}
                  style={{
                    backgroundColor: colors.cardBackground,
                    color: colors.textDark,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-semibold mb-1" style={{ color: colors.textLight }}>
                  Fin
                </Text>
                <TextInput
                  placeholder="09:00"
                  value={newPlanEndTime}
                  onChangeText={setNewPlanEndTime}
                  className="rounded-xl px-4 py-3 text-base"
                  placeholderTextColor={colors.textLight}
                  style={{
                    backgroundColor: colors.cardBackground,
                    color: colors.textDark,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                />
              </View>
            </View>

            <TextInput
              placeholder="Titre de l'activité"
              value={newPlanTitle}
              onChangeText={setNewPlanTitle}
              className="rounded-xl px-4 py-3 text-base mb-5"
              placeholderTextColor={colors.textLight}
              style={{
                backgroundColor: colors.cardBackground,
                color: colors.textDark,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />

            <View className="flex-row justify-between items-center">
              {editingPlan && (
                <TouchableOpacity
                  onPress={handleDeletePlan}
                  className="flex-1 rounded-xl py-3 mx-1"
                  style={{ backgroundColor: colors.redLight }}
                >
                  <Text
                    style={{
                      color: colors.redDark,
                      fontWeight: "500",
                      textAlign: "center",
                    }}
                  >
                    {t("common.delete")}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setShowPlanModal(false)}
                className="flex-1 rounded-xl py-3 mx-1"
                style={{ backgroundColor: colors.lightGrayBg }}
              >
                <Text style={{ color: colors.text, textAlign: "center" }}>
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSavePlan}
                className="flex-1 rounded-xl py-3 mx-1"
                style={{ backgroundColor: colors.accent }}
              >
                <Text className="text-white font-medium text-center">
                  {editingPlan ? t("common.edit") : t("common.add")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
