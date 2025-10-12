import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/config/colors";
import { useAppStore } from "@/store/useAppStore";

export default function ReportsScreen() {
const childrenList = useAppStore((state) => state.data.childrenList || []);

  // 🏫 Build class list dynamically from childrenList
  const classes = useMemo(() => {
    if (!childrenList) return [];
    const unique = Array.from(new Set(childrenList.map((c) => c.className)));
    return unique.sort();
  }, [childrenList]);

  // 📚 Selected states
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  // 🧒 Filter children by class
  const filteredChildren = useMemo(() => {
    if (!selectedClass || !childrenList) return [];
    return childrenList.filter((c) => c.className === selectedClass);
  }, [selectedClass, childrenList]);

  // 🧾 Report form fields
  const [meal, setMeal] = useState("");
  const [nap, setNap] = useState("");
  const [activity, setActivity] = useState("");
  const [behavior, setBehavior] = useState("");
  const [notes, setNotes] = useState("");

  const behaviorOptions = ["Calme", "Actif(ve)", "Fatigué(e)", "Agité(e)", "Malade"];

  const handleSubmit = () => {
    if (!selectedChild || !selectedClass) {
      Alert.alert("Sélection requise", "Veuillez choisir une classe et un enfant.");
      return;
    }

    if (!meal || !nap || !activity) {
      Alert.alert(
        "Champs manquants",
        "Veuillez remplir tous les champs principaux."
      );
      return;
    }

    const childData = childrenList?.find((c) => c.id === selectedChild);

    Alert.alert(
      "Rapport enregistré ✅",
      `Rapport ajouté pour ${childData?.name || "Enfant inconnu"} (${selectedClass}).`
    );

    setMeal("");
    setNap("");
    setActivity("");
    setBehavior("");
    setNotes("");
  };

  return (
    <ScrollView
      className="flex-1 px-5 pt-4"
      style={{ backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-2xl font-bold" style={{ color: colors.textDark }}>
          Rapport par Enfant
        </Text>

        <TouchableOpacity
          activeOpacity={0.8}
          style={{
            backgroundColor: colors.accent,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 8,
          }}
          onPress={handleSubmit}
        >
          <View className="flex-row items-center">
            <Ionicons name="save-outline" size={20} color="#fff" />
            <Text className="text-white text-base ml-1 font-medium">
              Enregistrer
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Step 1: Select Class */}
      <View
        className="rounded-2xl p-5 mb-5"
        style={{ backgroundColor: colors.cardBackground }}
      >
        <Text className="text-lg font-semibold mb-3" style={{ color: colors.textDark }}>
          Sélection de la Classe 🏫
        </Text>
        {classes.map((cls) => (
          <TouchableOpacity
            key={cls}
            activeOpacity={0.8}
            className="py-3 px-4 mb-2 rounded-xl"
            onPress={() => {
              setSelectedClass(cls);
              setSelectedChild(null);
            }}
            style={{
              backgroundColor: selectedClass === cls ? colors.accent : "#F8F8F8",
              borderWidth: 1,
              borderColor: colors.accent,
            }}
          >
            <Text
              className="text-base font-medium"
              style={{
                color: selectedClass === cls ? "#fff" : colors.textDark,
              }}
            >
              {cls}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Step 2: Select Child */}
      {selectedClass && (
        <View
          className="rounded-2xl p-5 mb-5"
          style={{ backgroundColor: colors.cardBackground }}
        >
          <Text className="text-lg font-semibold mb-3" style={{ color: colors.textDark }}>
            Enfant 👧
          </Text>
          {filteredChildren.length > 0 ? (
            filteredChildren.map((child) => (
              <TouchableOpacity
                key={child.id}
                activeOpacity={0.8}
                className="py-3 px-4 mb-2 rounded-xl"
                onPress={() => setSelectedChild(child.id)}
                style={{
                  backgroundColor:
                    selectedChild === child.id ? colors.accent : "#F8F8F8",
                  borderWidth: 1,
                  borderColor: colors.accent,
                }}
              >
                <Text
                  className="text-base font-medium"
                  style={{
                    color: selectedChild === child.id ? "#fff" : colors.textDark,
                  }}
                >
                  {child.name}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={{ color: colors.textLight }}>Aucun enfant trouvé.</Text>
          )}
        </View>
      )}

      {/* Step 3: Report Form */}
      {selectedChild && (
        <>
          <View
            className="rounded-2xl p-5 mb-5"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <Text className="text-lg font-semibold mb-3" style={{ color: colors.textDark }}>
              Repas 🍽️
            </Text>
            <TextInput
              className="rounded-xl px-4 py-3 text-base"
              placeholder="Ex: Poulet, légumes, compote..."
              placeholderTextColor={colors.textLight}
              style={{
                backgroundColor: "#F8F8F8",
                color: colors.textDark,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
              value={meal}
              onChangeText={setMeal}
            />
          </View>

          <View
            className="rounded-2xl p-5 mb-5"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <Text className="text-lg font-semibold mb-3" style={{ color: colors.textDark }}>
              Sieste 💤
            </Text>
            <TextInput
              className="rounded-xl px-4 py-3 text-base"
              placeholder="Ex: 13h00 à 14h30"
              placeholderTextColor={colors.textLight}
              style={{
                backgroundColor: "#F8F8F8",
                color: colors.textDark,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
              value={nap}
              onChangeText={setNap}
            />
          </View>

          <View
            className="rounded-2xl p-5 mb-5"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <Text className="text-lg font-semibold mb-3" style={{ color: colors.textDark }}>
              Activités 🎨
            </Text>
            <TextInput
              className="rounded-xl px-4 py-3 text-base"
              placeholder="Ex: Peinture, jeu libre, lecture..."
              placeholderTextColor={colors.textLight}
              style={{
                backgroundColor: "#F8F8F8",
                color: colors.textDark,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
              value={activity}
              onChangeText={setActivity}
            />
          </View>

          {/* Behavior options */}
          <View
            className="rounded-2xl p-5 mb-5"
            style={{ backgroundColor: colors.cardBackground }}
          >
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
                    backgroundColor:
                      behavior === option ? colors.accent : "#F3F4F6",
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

          <View
            className="rounded-2xl p-5 mb-8"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <Text className="text-lg font-semibold mb-3" style={{ color: colors.textDark }}>
              Notes ou Leçons 📝
            </Text>
            <TextInput
              multiline
              numberOfLines={4}
              className="rounded-xl px-4 py-3 text-base"
              placeholder="Message pour les parents..."
              placeholderTextColor={colors.textLight}
              style={{
                backgroundColor: "#F8F8F8",
                color: colors.textDark,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                textAlignVertical: "top",
              }}
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}
