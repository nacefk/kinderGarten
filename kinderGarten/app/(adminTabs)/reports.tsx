import React, { useEffect, useMemo, useState, useRef } from "react";
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
import { useRouter } from "expo-router";
import colors from "@/config/colors";
import { useAppStore } from "@/store/useAppStore";
import HeaderBar from "@/components/Header";
import { createDailyReport, updateDailyReport, getReportById, getReports, deleteMediaFile } from "@/api/report";
import * as ImagePicker from "expo-image-picker";
import { getChildren } from "@/api/children";
import { useLanguageStore } from "@/store/useLanguageStore";
import { getTranslation } from "@/config/translations";

export default function ReportsScreen() {
  const { language } = useLanguageStore();
  const t = (key: string) => getTranslation(language, key);
  const {
    classList: classes,
    childrenList: children,
    clubList: clubs,
  } = useAppStore((state) => state.data);
  const { fetchClasses, fetchChildren, fetchClubs } = useAppStore((state) => state.actions);

  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [selectedChildren, setSelectedChildren] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [groupMode, setGroupMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingReports, setExistingReports] = useState<{ [childId: number]: boolean }>({});
  const [reportsMap, setReportsMap] = useState<{ [childId: number]: number }>({});
  const [media, setMedia] = useState<any | null>(null);
  const [meal, setMeal] = useState("");
  const [nap, setNap] = useState("");
  const [behavior, setBehavior] = useState<string[]>([]);
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
      const data = await getChildren({ classroom: cls.id });
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
      const data = await getChildren({ club: club.id });
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

  // ✅ When classes are loaded, find first class with students and fetch its children
  useEffect(() => {
    (async () => {
      if (isInitialized && Array.isArray(classes) && classes.length > 0) {
        let classToSelect = null;
        let childrenData = [];

        // Try each class to find one with students
        for (const cls of classes) {
          try {
            const data = await getChildren({ classroom: cls.id });

            if (Array.isArray(data) && data.length > 0) {
              classToSelect = cls;
              childrenData = data;

              break;
            }
          } catch (err: any) {
            console.error("❌ Error checking class:", cls.name, err.message);
          }
        }

        // If no class has students, use the first class anyway
        if (!classToSelect) {
          classToSelect = classes[0];
          console.log(
            "📚 [Reports] No class with students found, using first class:",
            classToSelect.name
          );
        }

        if (!selectedClass || selectedClass.id !== classToSelect.id) {
          console.log("📚 [Reports] Setting selected class to:", classToSelect.name);
          setSelectedClass(classToSelect);
          setFilterType("class");
          setShowClassDropdown(false);

          try {
            setLoading(true);
            // Only fetch if we haven't already
            if (!childrenData.length) {
              console.log("📚 [Reports] Fetching children for classroom ID:", classToSelect.id);
              childrenData = await getChildren({ classroom: classToSelect.id });
            }

            console.log(
              "📚 [Reports] Setting childrenList with",
              Array.isArray(childrenData) ? childrenData.length : 0,
              "children"
            );
            setChildrenList(Array.isArray(childrenData) ? childrenData : []);
          } catch (err: any) {
            console.error("❌ Error loading children:", err.message);
            setChildrenList([]);
          } finally {
            setLoading(false);
          }
        }
      }
    })();
  }, [isInitialized, classes]);

  useEffect(() => {
    if (selectedClass) loadReportsForClass(selectedClass.id);
  }, [selectedClass, children]);

  const pickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"], // ✅ NEW and correct format
        allowsMultipleSelection: true, // ✅ optional
        selectionLimit: 10, // optional
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        // Add new media to existing media (for editing reports)
        setMediaList((prev) => [...prev, ...result.assets]);
      }
    } catch (err) {
      console.error("❌ Error selecting media:", err);
    }
  };

  const loadReportsForClass = async (classId: number) => {
    try {
      const data = await getReports();
      const existingMap: Record<number, boolean> = {};
      const idMap: Record<number, number> = {};

      console.log("📋 [loadReportsForClass] Reports from API:", data);
      console.log(
        "📋 [loadReportsForClass] Looking for reports matching childrenList ids:",
        childrenList.map((c) => c.id)
      );

      if (Array.isArray(data)) {
        data.forEach((r: any) => {
          // Check if this report's child is in our current childrenList
          const childExists = childrenList.some((c) => c.id === r.child);

          if (childExists) {
            existingMap[r.child] = true;
            idMap[r.child] = r.id;
            console.log(
              `📋 [loadReportsForClass] Found report for child ${r.child}: reportId=${r.id}`
            );
          }
        });
      }

      console.log("📋 [loadReportsForClass] Final maps:", { existingMap, idMap });
      setExistingReports(existingMap);
      setReportsMap(idMap);
    } catch (error: any) {
      console.error("❌ Error loading reports:", error.response?.data || error.message);
    }
  };

  const filteredChildren = useMemo(() => {
    console.log(
      "🔍 [filteredChildren] childrenList:",
      childrenList?.length || 0,
      "filterType:",
      filterType
    );

    if (filterType === "club") {
      return childrenList.filter((c) => {
        const matchClub =
          selectedClub && Array.isArray(c.clubs) ? c.clubs.includes(selectedClub.id) : true;
        return matchClub;
      });
    }

    // For class filter, children are already fetched for the selected classroom
    // So we can return them as-is
    return childrenList;
  }, [selectedClub, childrenList, filterType]);

  const resetForm = () => {
    setMeal("");
    setNap("");
    setBehavior([]);
    setNotes("");
  };

  // Store cached report data to avoid stale data when reopening modal
  const reportCacheRef = useRef<Record<number, any>>({});

  // ------------------------------------------------------------------------
  const handleSubmit = async () => {
    if (behavior.length === 0 || meal.trim() === "") {
      Alert.alert(t("reports.missing_fields"), t("reports.fill_required_fields"));
      return;
    }

    try {
      const newReports: Record<number, number> = {};

      for (const child of selectedChildren) {
        const reportId = reportsMap[child.id];

        if (reportId) {
          // Update existing report
          console.log("📝 [handleSubmit] Updating existing report for child:", {
            reportId,
            childId: child.id,
            childName: child.name,
          });

          await updateDailyReport(reportId, {
            meal,
            nap,
            behavior: behavior.join(", "),
            notes,
            mediaFiles: mediaList,
          });

          // Clear cached report data so next open will fetch fresh data
          delete reportCacheRef.current[reportId];

          newReports[child.id] = reportId;
        } else {
          // Create new report
          console.log("📝 [handleSubmit] Creating new report for child:", {
            childId: child.id,
            childName: child.name,
            meal: meal || "EMPTY",
            nap: nap || "EMPTY",
            behavior: behavior.length > 0 ? behavior.join(", ") : "EMPTY",
            notes: notes || "EMPTY",
            mediaCount: mediaList.length,
          });

          const created = await createDailyReport({
            child: child.id,
            meal,
            nap,
            behavior: behavior.join(", "),
            notes,
            mediaFiles: mediaList,
          });

          newReports[child.id] = created.id;
        }
      }

      // ✅ Update local state after saving
      setReportsMap((prev) => ({ ...prev, ...newReports }));
      await loadReportsForClass(selectedClass.id);

      Alert.alert(t("reports.report_saved"));
      setShowModal(false);
      setSelectedChildren([]);
      setGroupMode(false);
      setMediaList([]);
      resetForm();
    } catch (error: any) {
      console.error("❌ [handleSubmit] Error creating report:", error);
      console.error("❌ [handleSubmit] Error status:", error.response?.status);
      console.error("❌ [handleSubmit] Error data:", error.response?.data);
      console.error("❌ [handleSubmit] Error message:", error.message);
      Alert.alert(t("common.error"), t("reports.error_saving"));
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

    console.log("👤 [handleChildSelect] Selected child:", child.id);
    console.log("📋 [handleChildSelect] reportsMap:", reportsMap);
    console.log("📋 [handleChildSelect] reportId found:", reportId);

    if (reportId) {
      setLoading(true);
      try {
        // Check cache first - if not found, fetch fresh data
        let report = reportCacheRef.current[reportId];
        if (!report) {
          report = await getReportById(reportId);
          // Cache the fresh data
          reportCacheRef.current[reportId] = report;
        }
        
        console.log("📋 [handleChildSelect] Loaded report:", report);
        setMeal(report.meal || "");
        setNap(report.nap || "");
        setBehavior(report.behavior ? report.behavior.split(", ").filter((b: string) => b) : []);
        setNotes(report.notes || "");
        // Load existing media files
        setMediaList(Array.isArray(report.media_files) ? report.media_files : []);
      } catch (err: any) {
        console.error("❌ Error loading report:", err.response?.data || err.message);
        resetForm();
      } finally {
        setLoading(false);
        setShowModal(true);
      }
    } else {
      // Don't reset form - preserve user's previous input
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
      <HeaderBar title={t("reports.title")} showBack={true} />

      {/* Step 1: Class selection */}
      {/* 🧩 Filter by Class OR Club */}
      <View className="rounded-2xl p-5 mb-5" style={{ backgroundColor: colors.cardBackground }}>
        <Text className="text-lg font-semibold mb-3" style={{ color: colors.textDark }}>
          {t("reports.filter_by")}
        </Text>
        {/* Filter Type Selector */}
        <View className="flex-row justify-center mb-5">
          {[
            { key: "class", label: t("reports.class"), icon: "school-outline" },
            { key: "club", label: t("reports.club"), icon: "musical-notes-outline" },
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
                    const data = await getChildren({ classroom: firstClass.id });
                    setChildrenList(Array.isArray(data) ? data : []);
                  } else if (btn.key === "club" && Array.isArray(clubs) && clubs.length > 0) {
                    const firstClub = clubs[0];
                    setSelectedClub(firstClub);
                    const data = await getChildren({ club: firstClub.id });
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
          <>
            {Array.isArray(classes) && classes.length > 0 ? (
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
                    {selectedClass ? selectedClass.name : t("reports.select_class")}
                  </Text>
                  <Ionicons
                    name={showClassDropdown ? "chevron-up-outline" : "chevron-down-outline"}
                    size={18}
                    color={colors.textDark}
                  />
                </TouchableOpacity>

                {showClassDropdown && (
                  <ScrollView style={{ marginTop: 6, maxHeight: 160 }}>
                    {classes.map((cls: any) => (
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
                    ))}
                  </ScrollView>
                )}
              </View>
            ) : (
              <View
                style={{
                  backgroundColor: "#FEF3C7",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#FBBF24",
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    color: "#D97706",
                    fontWeight: "500",
                    fontSize: 14,
                  }}
                >
                  {t("reports.no_class_available")}
                </Text>
              </View>
            )}
          </>
        )}

        {/* 🎨 CLUB DROPDOWN */}
        {filterType === "club" && (
          <>
            {Array.isArray(clubs) && clubs.length > 0 ? (
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
                    {selectedClub ? selectedClub.name : t("reports.select_club")}
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
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled={true}
                  >
                    {clubs.map((club: any) => (
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
                    ))}
                  </ScrollView>
                )}
              </View>
            ) : (
              <View
                style={{
                  backgroundColor: "#FEF3C7",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#FBBF24",
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#D97706",
                    fontWeight: "500",
                    fontSize: 14,
                  }}
                >
                  {t("reports.no_club_available")}
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Step 2: Children list */}
      {loading ? (
        <ActivityIndicator color={colors.accent} size="large" />
      ) : selectedClass || selectedClub ? (
        <View className="rounded-2xl p-5 mb-5" style={{ backgroundColor: colors.cardBackground }}>
          {filteredChildren.length === 0 ? (
            <Text style={{ color: colors.textLight }}>{t("reports.no_children_found")}</Text>
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
                  {groupMode ? t("reports.group_mode_active") : t("reports.create_group_report")}
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
                    {selectedChildren.length === 1
                      ? `${t("reports.meal")} ${selectedChildren.length} ${t("common.child").toLowerCase()}`
                      : `${t("reports.meal")} ${selectedChildren.length} ${t("common.child").toLowerCase()}s`}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      ) : null}

      {/* Modal */}
      <Modal visible={showModal} animationType="slide" onRequestClose={() => setShowModal(false)}>
        <ScrollView className="flex-1 px-5 pt-20" style={{ backgroundColor: colors.background }}>
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
              label: t("reports.meal"),
              value: meal,
              setter: setMeal,
              placeholder: t("reports.meal_placeholder"),
            },
            {
              label: t("reports.nap"),
              value: nap,
              setter: setNap,
              placeholder: t("reports.nap_placeholder"),
            },
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
              {t("reports.behavior")}
            </Text>
            <View className="flex-row flex-wrap">
              {behaviorOptions.map((option) => {
                const isSelected = behavior.includes(option);
                return (
                  <TouchableOpacity
                    key={option}
                    onPress={() => {
                      if (isSelected) {
                        setBehavior(behavior.filter((b) => b !== option));
                      } else {
                        setBehavior([...behavior, option]);
                      }
                    }}
                    style={{
                      backgroundColor: isSelected ? colors.accent : "#F3F4F6",
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 10,
                      marginRight: 8,
                      marginBottom: 8,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color="#fff"
                        style={{ marginRight: 4 }}
                      />
                    )}
                    <Text style={{ color: isSelected ? "#fff" : colors.textDark }}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Notes */}
          <View className="rounded-2xl p-5 mb-8" style={{ backgroundColor: colors.cardBackground }}>
            <Text className="text-lg font-semibold mb-3" style={{ color: colors.textDark }}>
              {t("reports.notes")}
            </Text>
            <TextInput
              multiline
              numberOfLines={4}
              placeholder={t("reports.notes_placeholder")}
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
              {mediaList.length > 0 ? t("reports.change_media") : t("reports.add_media")}
            </Text>
          </TouchableOpacity>

          {mediaList.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginVertical: 10 }}>
              {mediaList.map((item, index) => (
                <View key={index} style={{ position: "relative", marginRight: 8, marginBottom: 8 }}>
                  <Image
                    source={{ uri: item.uri || item.file }}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 10,
                    }}
                  />
                  <TouchableOpacity
                    onPress={async () => {
                      // If it's an existing media file (has .id), delete from backend first
                      if (item.id) {
                        try {
                          await deleteMediaFile(item.id);
                          console.log("✅ Media deleted from backend:", item.id);
                        } catch (err) {
                          console.error("❌ Error deleting media from backend:", err);
                          Alert.alert(t("common.error"), t("reports.error_deleting_media"));
                          return;
                        }
                      }
                      // Remove from local list (both new and existing)
                      setMediaList((prev) => prev.filter((_, i) => i !== index));
                    }}
                    style={{
                      position: "absolute",
                      top: -8,
                      right: -8,
                      backgroundColor: "red",
                      borderRadius: 12,
                      width: 24,
                      height: 24,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>×</Text>
                  </TouchableOpacity>
                </View>
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
              <Text className="text-white text-base ml-2 font-medium">
                {t("reports.save_report")}
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}
