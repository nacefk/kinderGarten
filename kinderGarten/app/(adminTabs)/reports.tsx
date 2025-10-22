import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/config/colors";
import { useAppStore } from "@/store/useAppStore";
import HeaderBar from "@/components/Header";

export default function ReportsScreen() {
  const { classList: classes, childrenList: children } = useAppStore((state) => state.data);
  const { fetchClasses, fetchChildrenByClass } = useAppStore((state) => state.actions);

  // Fetch class list on mount
  useEffect(() => {
    if (classes.length === 0) fetchClasses();
  }, [classes.length]);

  // UI state
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [selectedChildren, setSelectedChildren] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [groupMode, setGroupMode] = useState(false);

  // Local reports (temporary client-side)
  const [reports, setReports] = useState<{ [childId: string]: any }>({});

  // Form fields
  const [meal, setMeal] = useState("");
  const [nap, setNap] = useState("");
  const [activity, setActivity] = useState("");
  const [behavior, setBehavior] = useState("");
  const [notes, setNotes] = useState("");

  const behaviorOptions = [
    "Calme",
    "Actif(ve)",
    "Fatigué(e)",
    "Agité(e)",
    "Malade",
    "Heureux(se)",
    "Triste",
    "Concentré(e)",
    "En colère",
    "Timide",
    "Sociable",
  ];

  // Fetch children for a selected class
  const handleSelectClass = async (cls: any) => {
    if (!cls?.id) return; // safety
    setSelectedClass(cls);
    setSelectedChildren([]);
    setGroupMode(false);

    try {
      console.log("Fetching children for class:", cls.id);
      await fetchChildrenByClass(cls.id);
    } catch (e) {
      console.error("❌ Failed to fetch children:", e);
      Alert.alert("Erreur", "Impossible de charger les enfants pour cette classe.");
    }
  };
  // When classes load, auto-select the first one and fetch its children
  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      const firstClass = classes[0];
      setSelectedClass(firstClass);
      fetchChildrenByClass(firstClass.id);
    }
  }, [classes, selectedClass]);

  // Filter (or directly show fetched)
  const filteredChildren = useMemo(() => {
    if (!selectedClass) return [];
    return children; // backend already filters by class
  }, [children, selectedClass]);

  const resetForm = () => {
    setMeal("");
    setNap("");
    setActivity("");
    setBehavior("");
    setNotes("");
  };

  const loadExistingReport = (child: any) => {
    const existing = reports[child.id];
    if (existing) {
      setMeal(existing.meal);
      setNap(existing.nap);
      setActivity(existing.activity);
      setBehavior(existing.behavior);
      setNotes(existing.notes);
    } else {
      resetForm();
    }
  };

  const handleSubmit = () => {
    if (!meal || !nap || !activity) {
      Alert.alert("Champs manquants", "Veuillez remplir tous les champs principaux.");
      return;
    }

    // Save reports locally
    setReports((prev) => {
      const updated = { ...prev };
      selectedChildren.forEach((child) => {
        updated[child.id] = { meal, nap, activity, behavior, notes };
      });
      return updated;
    });

    const names = selectedChildren.map((c) => c.name).join(", ");
    Alert.alert("Rapport enregistré ✅", `Rapport ajouté pour ${names}.`);

    setShowModal(false);
    setSelectedChildren([]);
    setGroupMode(false);
  };

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <HeaderBar title="Rapport par Enfant" showBack={true} />

      {/* Step 1: Class selection */}
      <View className="rounded-2xl p-5 mb-5" style={{ backgroundColor: colors.cardBackground }}>
        <Text className="text-lg font-semibold mb-3" style={{ color: colors.textDark }}>
          Sélection de la Classe 🏫
        </Text>

        {classes.length === 0 ? (
          <ActivityIndicator color={colors.accent} size="small" />
        ) : (
          classes.map((cls) => (
            <TouchableOpacity
              key={cls.id}
              activeOpacity={0.8}
              className="py-3 px-4 mb-2 rounded-xl"
              onPress={() => handleSelectClass(cls)}
              style={{
                backgroundColor: selectedClass?.id === cls.id ? colors.accent : "#F8F8F8",
                borderWidth: 1,
                borderColor: colors.accent,
              }}
            >
              <Text
                className="text-base font-medium"
                style={{
                  color: selectedClass?.id === cls.id ? "#fff" : colors.textDark,
                }}
              >
                {cls.name}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Step 2: Child selection */}
      {selectedClass && (
        <View className="rounded-2xl p-5 mb-5" style={{ backgroundColor: colors.cardBackground }}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setGroupMode(!groupMode);
              setSelectedChildren([]);
            }}
            style={{
              backgroundColor: groupMode ? colors.accent : "#F8F8F8",
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.accent,
              paddingVertical: 10,
              paddingHorizontal: 12,
              marginBottom: 12,
            }}
          >
            <Text className="font-medium" style={{ color: groupMode ? "#fff" : colors.textDark }}>
              {groupMode ? "Mode Groupe Activé ✅" : "Créer un rapport groupé 🧒🧒"}
            </Text>
          </TouchableOpacity>

          <Text className="text-lg font-semibold mb-3" style={{ color: colors.textDark }}>
            {groupMode ? "Sélectionnez les enfants :" : "Enfant 👧"}
          </Text>

          {filteredChildren.length === 0 ? (
            <Text style={{ color: colors.textLight }}>Aucun enfant trouvé pour cette classe.</Text>
          ) : (
            filteredChildren.map((child) => {
              const alreadyReported = Boolean(reports[child.id]);
              const isSelected = selectedChildren.some((c) => c.id === child.id);

              return (
                <TouchableOpacity
                  key={child.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (groupMode) {
                      setSelectedChildren((prev) =>
                        isSelected ? prev.filter((c) => c.id !== child.id) : [...prev, child]
                      );
                    } else {
                      setSelectedChildren([child]);
                      loadExistingReport(child);
                      setShowModal(true);
                    }
                  }}
                  className="py-3 px-4 mb-2 rounded-xl flex-row justify-between items-center"
                  style={{
                    backgroundColor: isSelected
                      ? colors.accentLight
                      : alreadyReported
                        ? "#E0F7E9"
                        : "#F8F8F8",
                    borderWidth: 1,
                    borderColor: isSelected
                      ? colors.accent
                      : alreadyReported
                        ? "#4CAF50"
                        : colors.accent,
                  }}
                >
                  <Text className="text-base font-medium" style={{ color: colors.textDark }}>
                    {child.name}
                  </Text>

                  {alreadyReported && (
                    <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              );
            })
          )}

          {groupMode && selectedChildren.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                resetForm();
                setShowModal(true);
              }}
              style={{
                backgroundColor: colors.accent,
                borderRadius: 10,
                paddingVertical: 12,
                marginTop: 12,
                alignItems: "center",
              }}
            >
              <Text className="text-white font-medium">
                Créer le rapport pour {selectedChildren.length} enfants
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 📝 Modal */}
      <Modal visible={showModal} animationType="slide" onRequestClose={() => setShowModal(false)}>
        <ScrollView
          className="flex-1 px-5 pt-4"
          style={{ backgroundColor: colors.background }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-2xl font-bold" style={{ color: colors.textDark }}>
              {selectedChildren.length > 1
                ? `Rapport de groupe (${selectedChildren.length} enfants)`
                : `Rapport de ${selectedChildren[0]?.name}`}
            </Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close-circle" size={28} color={colors.accent} />
            </TouchableOpacity>
          </View>

          {/* Form fields */}
          {renderInput("Repas 🍽️", meal, setMeal, "Pasta : Il a terminé son repas")}
          {renderInput("Sieste 💤", nap, setNap, "13h00 à 14h30, Bien dormi")}

          {/* Behavior */}
          <View className="rounded-2xl p-5 mb-5" style={{ backgroundColor: colors.cardBackground }}>
            <Text className="text-lg font-semibold mb-3" style={{ color: colors.textDark }}>
              Comportement / Santé 💬
            </Text>
            <View className="flex-row flex-wrap">
              {behaviorOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  activeOpacity={0.8}
                  onPress={() => setBehavior(option)}
                  className="px-3 py-2 rounded-xl mr-2 mb-2"
                  style={{
                    backgroundColor: behavior === option ? colors.accent : "#F3F4F6",
                  }}
                >
                  <Text
                    className="text-sm font-medium"
                    style={{
                      color: behavior === option ? "#fff" : colors.textDark,
                    }}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          {renderInput("Notes 📝", notes, setNotes, "Message pour les parents...", true)}

          {/* Save button */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              backgroundColor: colors.accent,
              borderRadius: 14,
              paddingVertical: 12,
              marginBottom: 30,
              alignItems: "center",
            }}
            onPress={handleSubmit}
          >
            <View className="flex-row items-center">
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text className="text-white text-base ml-2 font-medium">Enregistrer</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}

/* 🔧 Small helper to render inputs */
function renderInput(label, value, setter, placeholder, multiline = false) {
  return (
    <View className="rounded-2xl p-5 mb-5" style={{ backgroundColor: colors.cardBackground }}>
      <Text className="text-lg font-semibold mb-3" style={{ color: colors.textDark }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={setter}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        className="rounded-xl px-4 py-3 text-base"
        style={{
          backgroundColor: "#F8F8F8",
          color: colors.textDark,
          borderWidth: 1,
          borderColor: "#E5E7EB",
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}
