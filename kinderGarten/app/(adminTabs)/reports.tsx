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
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/config/colors";
import { useAppStore } from "@/store/useAppStore";
import HeaderBar from "@/components/Header";
import { createDailyReport, getReportById, getReports } from "@/api/report";
import * as ImagePicker from "expo-image-picker";
import { getChildren } from "@/api/children";

export default function ReportsScreen() {
  const {
    classList: classes,
    childrenList: children,
    clubList: clubs,
  } = useAppStore((state) => state.data);
  const { fetchClasses, fetchChildren, fetchClubs } = useAppStore((state) => state.actions);

  const [selectedClass, setSelectedClass] = useState<any | null>(
    Array.isArray(classes) && classes.length > 0 ? classes[0] : null
  );
  const [selectedChildren, setSelectedChildren] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [groupMode, setGroupMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingReports, setExistingReports] = useState<{ [childId: number]: boolean }>({});
  const [reportsMap, setReportsMap] = useState<{ [childId: number]: number }>({});
  const [media, setMedia] = useState<any | null>(null);
  const [meal, setMeal] = useState("");
  const [nap, setNap] = useState("");
  const [behavior, setBehavior] = useState("");
  const [notes, setNotes] = useState("");
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [selectedClub, setSelectedClub] = useState<any | null>(null);
  const [filterType, setFilterType] = useState<"class" | "club">("class");
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showClubDropdown, setShowClubDropdown] = useState(false);
  const [childrenList, setChildrenList] = useState<any[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const handleSelectClass = async (cls: any) => {
    setSelectedClass(cls);
    setSelectedClub(null);
    setSelectedChildren([]);
    setGroupMode(false);
    setLoading(true);
    try {
      const response = await getChildren({ classroom: cls.id });
      const data = response?.results || response || [];
      setChildrenList(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("❌ Error loading class children:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClub = async (club: any) => {
    setSelectedClub(club);
    setSelectedClass(null);
    setSelectedChildren([]);
    setGroupMode(false);
    setLoading(true);
    try {
      const response = await getChildren({ club: club.id });
      const data = response?.results || response || [];
      setChildrenList(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("❌ Error loading club children:", err.message);
    } finally {
      setLoading(false);
    }
  };

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

  // ------------------------------------------------------------------------
  // ✅ Initial load - fetch all required data once
  useEffect(() => {
    (async () => {
      try {
        await Promise.all([fetchClasses(), fetchClubs(), fetchChildren()]);
        setIsInitialized(true);
      } catch (e) {
        console.error("❌ Error loading initial data:", e.message);
      }
    })();
  }, []);

  // ✅ When classes are loaded, auto-select first class and fetch its children (only once)
  useEffect(() => {
    (async () => {
      if (isInitialized && Array.isArray(classes) && classes.length > 0) {
        const firstClass = classes[0];
        setSelectedClass(firstClass);
        setFilterType("class");
        setShowClassDropdown(false);

        try {
          setLoading(true);
          const data = await getChildren({ classroom: firstClass.id });
          setChildrenList(Array.isArray(data) ? data : []);
          console.log("✅ Auto-selected class:", firstClass.name);
        } catch (err: any) {
          console.error("❌ Error loading class children:", err.message);
          setChildrenList([]);
        } finally {
          setLoading(false);
        }
      }
    })();
  }, [isInitialized]);

  useEffect(() => {
    if (selectedClass) loadReportsForClass(selectedClass.id);
  }, [selectedClass]);

  const pickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"], // ✅ NEW and correct format
        allowsMultipleSelection: true, // ✅ optional
        selectionLimit: 10, // optional
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setMediaList(result.assets);
      }
    } catch (err) {
      console.error("❌ Error selecting media:", err);
    }
  };

  const loadReportsForClass = async (classId: number) => {
    try {
      const response = await getReports();
      const data = response?.results || response || [];
      const existingMap: Record<number, boolean> = {};
      const idMap: Record<number, number> = {};

      if (Array.isArray(data)) {
        data.forEach((r: any) => {
          const child = children.find((c) => c.id === r.child);
          if (child && child.classroom === classId) {
            existingMap[r.child] = true;
            idMap[r.child] = r.id;
          }
        });
      }

      setExistingReports(existingMap);
      setReportsMap(idMap);
    } catch (error: any) {
      console.error("❌ Error loading reports:", error.response?.data || error.message);
    }
  };

  const filteredChildren = useMemo(() => {
    return childrenList.filter((c) => {
      const matchClass = selectedClass ? c.classroom === selectedClass.id : true;
      const matchClub =
        selectedClub && Array.isArray(c.clubs) ? c.clubs.includes(selectedClub.id) : true;

      if (filterType === "class") return matchClass;
      if (filterType === "club") return matchClub;
      return true;
    });
  }, [selectedClass, selectedClub, childrenList, filterType]);

  const resetForm = () => {
    setMeal("");
    setNap("");
    setBehavior("");
    setNotes("");
  };

  // ------------------------------------------------------------------------
  const handleSubmit = async () => {
    if (behavior.trim() === "" || meal.trim() === "") {
      Alert.alert("Champs manquants", "Veuillez remplir tous les champs principaux.");
      return;
    }

    try {
      const newReports: Record<number, number> = {};

      for (const child of selectedChildren) {
        console.log("👶 Child ID sent:", child.id);

        const created = await createDailyReport({
          child: child.id, // ✅ Pass numeric ID, not FormData
          meal,
          nap,
          behavior,
          notes,
          mediaFiles: mediaList, // ✅ Send plain array of files
        });

        newReports[child.id] = created.id;
      }

      // ✅ Update local state after saving
      setReportsMap((prev) => ({ ...prev, ...newReports }));
      await loadReportsForClass(selectedClass.id);

      Alert.alert("Rapport enregistré ✅");
      setShowModal(false);
      setSelectedChildren([]);
      setGroupMode(false);
      setMediaList([]);
      resetForm();
    } catch (error: any) {
      console.error("❌ Error creating report:", error.response?.data || error.message);
      Alert.alert("Erreur", "Impossible d'enregistrer le rapport.");
    }
  };

  // ------------------------------------------------------------------------
  // ✅ NEW: handle single or multiple child selection
  const handleChildSelect = async (child: any) => {
    if (groupMode) {
      // ✅ Group mode: only toggle selection, no modal
      setSelectedChildren((prev) => {
        const exists = prev.some((c) => c.id === child.id);
        return exists ? prev.filter((c) => c.id !== child.id) : [...prev, child];
      });
      return; // ✅ Prevent modal from showing
    }

    // ✅ Single mode logic
    const reportId = reportsMap[child.id];
    setSelectedChildren([child]);

    if (reportId) {
      setLoading(true);
      try {
        const report = await getReportById(reportId);
        setMeal(report.meal || "");
        setNap(report.nap || "");
        setBehavior(report.behavior || "");
        setNotes(report.notes || "");
      } catch (err: any) {
        console.error("❌ Error loading report:", err.response?.data || err.message);
        resetForm();
      } finally {
        setLoading(false);
        setShowModal(true);
      }
    } else {
      resetForm();
      setShowModal(true);
    }
  };

  // ------------------------------------------------------------------------
  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
    >
      <HeaderBar title="Rapport par Enfant" showBack={true} />

      {/* Step 1: Class selection */}
      {/* 🧩 Filter by Class OR Club */}
      <View className="rounded-2xl p-5 mb-5" style={{ backgroundColor: colors.cardBackground }}>
        <Text className="text-lg font-semibold mb-3" style={{ color: colors.textDark }}>
          Filtrer par 🧠
        </Text>
        {/* Filter Type Selector */}
        <View className="flex-row justify-center mb-5">
          {[
            { key: "class", label: "Classe 🏫", icon: "school-outline" },
            { key: "club", label: "Club 🎨", icon: "musical-notes-outline" },
          ].map((btn) => (
            <TouchableOpacity
              key={btn.key}
              activeOpacity={0.8}
              onPress={async () => {
                // Reset both selections first
                setSelectedClass(null);
                setSelectedClub(null);
                setSelectedChildren([]);
                setGroupMode(false);
                setFilterType(btn.key as "class" | "club");
                setChildrenList([]); // clear old children

                // Fetch default list based on selection
                try {
                  setLoading(true);
                  if (btn.key === "class" && Array.isArray(classes) && classes.length > 0) {
                    const firstClass = classes[0];
                    setSelectedClass(firstClass);
                    const response = await getChildren({ classroom: firstClass.id });
                    const data = response?.results || response || [];
                    setChildrenList(Array.isArray(data) ? data : []);
                  } else if (btn.key === "club" && Array.isArray(clubs) && clubs.length > 0) {
                    const firstClub = clubs[0];
                    setSelectedClub(firstClub);
                    const response = await getChildren({ club: firstClub.id });
                    const data = response?.results || response || [];
                    setChildrenList(Array.isArray(data) ? data : []);
                  }
                } catch (e: any) {
                  console.error("❌ Error fetching children by filter:", e.message);
                } finally {
                  setLoading(false);
                }
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: filterType === btn.key ? colors.accent : colors.cardBackground,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 8,
                marginHorizontal: 6,
                borderWidth: 1,
                borderColor: colors.accent,
              }}
            >
              <Ionicons
                name={btn.icon as any}
                size={18}
                color={filterType === btn.key ? "#fff" : colors.textDark}
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  color: filterType === btn.key ? "#fff" : colors.textDark,
                  fontWeight: "500",
                }}
              >
                {btn.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 🏫 CLASS DROPDOWN */}
        {filterType === "class" && (
          <View
            style={{
              backgroundColor: "#F8F8F8",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.accent,
              paddingHorizontal: 12,
              paddingVertical: 10,
              marginBottom: 10,
            }}
          >
            <TouchableOpacity
              onPress={() => setShowClassDropdown((prev) => !prev)}
              className="flex-row justify-between items-center"
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: selectedClass ? colors.textDark : colors.textLight,
                  fontWeight: "500",
                }}
              >
                {selectedClass ? selectedClass.name : "Sélectionner une classe"}
              </Text>
              <Ionicons
                name={showClassDropdown ? "chevron-up-outline" : "chevron-down-outline"}
                size={18}
                color={colors.textDark}
              />
            </TouchableOpacity>

            {showClassDropdown && (
              <ScrollView style={{ marginTop: 6, maxHeight: 160 }}>
                {Array.isArray(classes)
                  ? classes.map((cls: any) => (
                      <TouchableOpacity
                        key={cls.id}
                        activeOpacity={0.8}
                        onPress={() => {
                          handleSelectClass(cls);
                          setShowClassDropdown(false);
                        }}
                        style={{
                          paddingVertical: 8,
                          borderBottomWidth: 0.5,
                          borderColor: "#E5E7EB",
                        }}
                      >
                        <Text
                          style={{
                            color: selectedClass?.id === cls.id ? colors.accent : colors.textDark,
                            fontWeight: selectedClass?.id === cls.id ? "600" : "400",
                          }}
                        >
                          {cls.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  : null}
              </ScrollView>
            )}
          </View>
        )}

        {/* 🎨 CLUB DROPDOWN */}
        {filterType === "club" && (
          <View
            style={{
              backgroundColor: "#F8F8F8",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.accent,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <TouchableOpacity
              onPress={() => setShowClubDropdown((prev) => !prev)}
              className="flex-row justify-between items-center"
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: selectedClub ? colors.textDark : colors.textLight,
                  fontWeight: "500",
                }}
              >
                {selectedClub ? selectedClub.name : "Sélectionner un club"}
              </Text>
              <Ionicons
                name={showClubDropdown ? "chevron-up-outline" : "chevron-down-outline"}
                size={18}
                color={colors.textDark}
              />
            </TouchableOpacity>

            {showClubDropdown && (
              <ScrollView
                style={{ marginTop: 6, maxHeight: 160 }}
                keyboardShouldPersistTaps="handled" // ✅ let taps pass through
                nestedScrollEnabled={true}
              >
                {Array.isArray(clubs)
                  ? clubs.map((club: any) => (
                      <TouchableOpacity
                        key={club.id}
                        activeOpacity={0.8}
                        onPress={() => {
                          handleSelectClub(club);
                          setShowClubDropdown(false);
                        }}
                        style={{
                          paddingVertical: 8,
                          borderBottomWidth: 0.5,
                          borderColor: "#E5E7EB",
                        }}
                      >
                        <Text
                          style={{
                            color: selectedClub?.id === club.id ? colors.accent : colors.textDark,
                            fontWeight: selectedClub?.id === club.id ? "600" : "400",
                          }}
                        >
                          {club.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  : null}
              </ScrollView>
            )}
          </View>
        )}
      </View>

      {/* Step 2: Children list */}
      {loading ? (
        <ActivityIndicator color={colors.accent} size="large" />
      ) : selectedClass || selectedClub ? (
        <View className="rounded-2xl p-5 mb-5" style={{ backgroundColor: colors.cardBackground }}>
          {filteredChildren.length === 0 ? (
            <Text style={{ color: colors.textLight }}>Aucun enfant trouvé pour cette classe.</Text>
          ) : (
            <>
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
                <Text
                  className="font-medium"
                  style={{ color: groupMode ? "#fff" : colors.textDark, textAlign: "center" }}
                >
                  {groupMode ? "Mode Groupe Activé ✅" : "Créer un rapport groupé 🧒🧒"}
                </Text>
              </TouchableOpacity>

              {filteredChildren.map((child) => {
                const isSelected = selectedChildren.some((c) => c.id === child.id);
                const hasReport = existingReports[child.id];

                return (
                  <TouchableOpacity
                    key={child.id}
                    onPress={() => handleChildSelect(child)} // ✅ unified handler
                    style={{
                      backgroundColor: isSelected
                        ? colors.accentLight
                        : hasReport
                          ? "#E0F7E9"
                          : "#F8F8F8",
                      borderWidth: 1,
                      borderColor: isSelected
                        ? colors.accent
                        : hasReport
                          ? "#4CAF50"
                          : colors.accent,
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 8,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: colors.textDark, fontWeight: "500" }}>{child.name}</Text>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
                    ) : hasReport ? (
                      <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
                    ) : null}
                  </TouchableOpacity>
                );
              })}

              {/* ✅ Show button only in group mode when at least 1 selected */}
              {groupMode && selectedChildren.length > 0 && (
                <TouchableOpacity
                  onPress={() => setShowModal(true)}
                  style={{
                    backgroundColor: colors.accent,
                    borderRadius: 10,
                    paddingVertical: 12,
                    marginTop: 12,
                    alignItems: "center",
                  }}
                >
                  <Text className="text-white font-medium">
                    Créer le rapport pour {selectedChildren.length} enfant
                    {selectedChildren.length > 1 ? "s" : ""}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      ) : null}

      {/* Modal */}
      <Modal visible={showModal} animationType="slide" onRequestClose={() => setShowModal(false)}>
        <ScrollView className="flex-1 px-5 pt-4" style={{ backgroundColor: colors.background }}>
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
          {[
            {
              label: "Repas 🍽️",
              value: meal,
              setter: setMeal,
              placeholder: "Pâtes : a bien mangé",
            },
            { label: "Sieste 💤", value: nap, setter: setNap, placeholder: "13h00 - 14h30" },
          ].map((field, i) => (
            <View
              key={i}
              className="rounded-2xl p-5 mb-5"
              style={{ backgroundColor: colors.cardBackground }}
            >
              <Text className="text-lg font-semibold mb-3" style={{ color: colors.textDark }}>
                {field.label}
              </Text>
              <TextInput
                placeholder={field.placeholder}
                placeholderTextColor={colors.textLight}
                className="rounded-xl px-4 py-3 text-base"
                style={{
                  backgroundColor: "#F8F8F8",
                  color: colors.textDark,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}
                value={field.value}
                onChangeText={field.setter}
              />
            </View>
          ))}

          {/* Behavior */}
          <View className="rounded-2xl p-5 mb-5" style={{ backgroundColor: colors.cardBackground }}>
            <Text className="text-lg font-semibold mb-3" style={{ color: colors.textDark }}>
              Comportement / Santé 💬
            </Text>
            <View className="flex-row flex-wrap">
              {behaviorOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => setBehavior(option)}
                  style={{
                    backgroundColor: behavior === option ? colors.accent : "#F3F4F6",
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 10,
                    marginRight: 8,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: behavior === option ? "#fff" : colors.textDark }}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View className="rounded-2xl p-5 mb-8" style={{ backgroundColor: colors.cardBackground }}>
            <Text className="text-lg font-semibold mb-3" style={{ color: colors.textDark }}>
              Notes 📝
            </Text>
            <TextInput
              multiline
              numberOfLines={4}
              placeholder="Message pour les parents..."
              placeholderTextColor={colors.textLight}
              className="rounded-xl px-4 py-3 text-base"
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
          <TouchableOpacity
            onPress={pickMedia}
            style={{
              backgroundColor: "#F3F4F6",
              borderRadius: 10,
              padding: 10,
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <Ionicons name="image-outline" size={22} color={colors.accent} />
            <Text style={{ color: colors.textDark, marginTop: 4 }}>
              {media ? "Changer le média" : "Ajouter une photo / vidéo 📸"}
            </Text>
          </TouchableOpacity>

          {mediaList.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginVertical: 10 }}>
              {mediaList.map((item, index) => (
                <Image
                  key={index}
                  source={{ uri: item.uri }}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 10,
                    marginRight: 8,
                    marginBottom: 8,
                  }}
                />
              ))}
            </View>
          )}

          {/* Save */}
          <TouchableOpacity
            onPress={handleSubmit}
            style={{
              backgroundColor: colors.accent,
              borderRadius: 14,
              paddingVertical: 12,
              marginBottom: 30,
              alignItems: "center",
            }}
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
