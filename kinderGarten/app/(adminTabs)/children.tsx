import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Modal,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import colors from "@/config/colors";
import HeaderBar from "@/components/Header";
import {
  createClub,
  deleteChild,
  deleteClass,
  deleteClub,
  getChildren,
  uploadAvatar,
} from "@/api/children";
import { createClass, getClasses } from "@/api/class";
import { createChild } from "@/api/children";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppStore } from "@/store/useAppStore";
import { useLanguageStore } from "@/store/useLanguageStore";
import { getTranslation } from "@/config/translations";

export default function ChildrenScreen() {
  const router = useRouter();
  const { language } = useLanguageStore();
  const t = (key: string) => getTranslation(language, key);

  // ------------------- STATE -------------------
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddClub, setShowAddClub] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClubName, setNewClubName] = useState("");
  const [childName, setChildName] = useState("");
  const [childParent, setChildParent] = useState("");
  const [childClass, setChildClass] = useState<string>("");
  const [childBirthdate, setChildBirthdate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [childImage, setChildImage] = useState<string | null>(null);
  const [hasMobileApp, setHasMobileApp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<"class" | "club" | "none">("none");

  const { data, actions } = useAppStore();
  const { clubList: clubs, classList: classes, childrenList: storeChildren } = data;
  const { fetchChildren, fetchClasses, fetchClubs, removeClassFromStore, removeClubFromStore } =
    actions;

  // ✅ Debug: Log store data changes
  useEffect(() => {
    console.log("🎯 [COMPONENT] Store data updated:", {
      classesCount: Array.isArray(classes) ? classes.length : "NOT ARRAY",
      classes: classes,
      clubsCount: Array.isArray(clubs) ? clubs.length : "NOT ARRAY",
      childrenCount: Array.isArray(storeChildren) ? storeChildren.length : "NOT ARRAY",
    });
  }, [classes, clubs, storeChildren]);

  // ✅ Sync store children to local state
  useEffect(() => {
    if (Array.isArray(storeChildren) && storeChildren.length > 0) {
      setChildren(storeChildren);
    }
  }, [storeChildren]);

  // ------------------- INIT -------------------
  useEffect(() => {
    (async () => {
      console.log("🚀 [COMPONENT] Initializing children screen...");
      setLoading(true);
      try {
        console.log(
          "🚀 [COMPONENT] Calling Promise.all with fetchChildren, fetchClasses, fetchClubs"
        );
        await Promise.all([fetchChildren(), fetchClasses(), fetchClubs()]);
        console.log("✅ [COMPONENT] All initial fetches completed");
      } catch (e) {
        console.error("❌ [COMPONENT] Error initializing data:", e.message);
        // Set safe defaults to prevent crashes
        setChildren([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ------------------- ADD CLASS -------------------
  const handleAddClass = async () => {
    if (!newClassName.trim())
      return Alert.alert("Nom manquant", "Veuillez entrer un nom de classe.");
    setLoading(true);
    try {
      await createClass(newClassName.trim());
      // ✅ Fetch updated class list - filter effect will auto-update when classes changes
      await fetchClasses();
      setNewClassName("");
      setShowAddClass(false);
      Alert.alert("Succès", "Classe ajoutée !");
    } catch (e: any) {
      console.error("❌ Error creating class:", e.message);
      Alert.alert("Erreur", "Impossible d'ajouter la classe.");
    } finally {
      setLoading(false);
    }
  };
  // 🧹 Delete class - NOT YET SUPPORTED (backend missing detail endpoint)
  const handleDeleteClass = (cls: any) => {
    Alert.alert("Supprimer la classe", `Voulez-vous vraiment supprimer la classe "${cls.name}" ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            console.log("🧹 [COMPONENT] Starting delete for class:", cls);
            setLoading(true);
            await deleteClass(cls.id);
            console.log("✅ [COMPONENT] Delete successful, removing from store...");
            // ✅ Remove from store immediately
            removeClassFromStore(cls.id);
            console.log("✅ [COMPONENT] Store updated, refetching from backend...");
            // 🔄 Verify deletion by refetching
            await fetchClasses();
            console.log("✅ [COMPONENT] Backend verified, classes refreshed");
            Alert.alert("Supprimée ✅", "La classe a été supprimée.");
          } catch (e: any) {
            console.error("❌ [COMPONENT] Error deleting class:", e.message);
            console.error("❌ [COMPONENT] Full error:", e);
            Alert.alert("Erreur", `Impossible de supprimer la classe: ${e.message}`);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // 🧹 Delete club
  const handleDeleteClub = (club: any) => {
    Alert.alert("Supprimer le club", `Voulez-vous vraiment supprimer "${club.name}" ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            console.log("🧹 [COMPONENT] Starting delete for club:", club);
            setLoading(true);
            await deleteClub(club.id);
            console.log("✅ [COMPONENT] Delete successful, removing from store...");
            // ✅ Remove from store immediately
            removeClubFromStore(club.id);
            console.log("✅ [COMPONENT] Store updated, refetching from backend...");
            // 🔄 Verify deletion by refetching
            await fetchClubs();
            console.log("✅ [COMPONENT] Backend verified, clubs refreshed");
            Alert.alert("Supprimé ✅", "Le club a été supprimé.");
          } catch (e: any) {
            console.error("❌ Error deleting club:", e.message);
            Alert.alert("Erreur", "Impossible de supprimer le club.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // ------------------- ADD CLUB -------------------
  const handleAddClub = async () => {
    if (!newClubName.trim()) return Alert.alert("Nom manquant", "Veuillez entrer un nom de club.");
    setLoading(true);
    try {
      const created = await createClub(newClubName.trim());
      await fetchClubs();
      setNewClubName("");
      setShowAddClub(false);
      Alert.alert("Succès 🎉", "Club ajouté !");
    } catch (e: any) {
      console.error("❌ Error creating club:", e.response?.data || e.message);
      Alert.alert("Erreur", "Impossible d’ajouter le club.");
    } finally {
      setLoading(false);
    }
  };

  // ------------------- ADD CHILD -------------------
  const handleAddChild = async () => {
    if (!childName.trim() || !childBirthdate || !childParent.trim())
      return Alert.alert("Champs manquants", "Veuillez remplir tous les champs.");

    setLoading(true);
    try {
      const classObj = classes.find((c: any) => c.name === childClass);
      let avatarUrl = "https://cdn-icons-png.flaticon.com/512/1946/1946429.png";
      if (childImage && !childImage.startsWith("http")) avatarUrl = await uploadAvatar(childImage);

      const created = await createChild({
        name: childName.trim(),
        birthdate: childBirthdate.toISOString().split("T")[0],
        parent_name: childParent.trim(),
        classroom: classObj?.id,
        avatar: avatarUrl,
        hasMobileApp,
      });

      setChildren([...children, created]);
      setShowAddChild(false);

      let message = "L’enfant a été ajouté avec succès !";
      if (hasMobileApp)
        message += `\n\nIdentifiants de connexion :\n👤 ${created.username}\n🔑 ${created.password}`;
      Alert.alert("Succès 🎉", message);
    } catch (e: any) {
      console.error("❌ Error creating child:", e.response?.data || e.message);
      Alert.alert("Erreur", "Impossible d’ajouter l’enfant.");
    } finally {
      setLoading(false);
    }
  };

  // ------------------- IMAGE PICKER -------------------
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted")
      return Alert.alert("Permission refusée", "Veuillez autoriser la caméra.");

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled && result.assets?.length > 0) setChildImage(result.assets[0].uri);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted")
      return Alert.alert("Permission refusée", "Veuillez autoriser l’accès à la galerie.");

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled && result.assets?.length > 0) setChildImage(result.assets[0].uri);
  };

  // ------------------- FILTERS -------------------
  useEffect(() => {
    (async () => {
      console.log("🔄 [COMPONENT] Filter effect triggered with:", { selectedClass, selectedClub });
      setLoading(true);
      try {
        let params: any = {};
        if (selectedClass && !selectedClub) {
          const cls = classes.find((c) => c.name === selectedClass);
          console.log("🔄 [COMPONENT] Looking for class:", selectedClass, "Found:", cls);
          if (cls) params.classroom = cls.id;
        } else if (selectedClub && !selectedClass) {
          const club = clubs.find((c) => c.name === selectedClub);
          console.log("🔄 [COMPONENT] Looking for club:", selectedClub, "Found:", club);
          if (club) params.club = club.id;
        }
        console.log("🔄 [COMPONENT] Fetching children with params:", params);
        const data = await getChildren(Object.keys(params).length ? params : undefined);
        console.log(
          "✅ [COMPONENT] Children fetched:",
          Array.isArray(data) ? data.length : "NOT ARRAY"
        );
        // ✅ Defensive: ensure data is an array
        setChildren(Array.isArray(data) ? data : []);
      } catch (e: any) {
        console.error("❌ [COMPONENT] Error filtering children:", e.message);
        setChildren([]); // ✅ Set safe default on error
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedClass, selectedClub, classes, clubs]);

  // ✅ Defensive: ensure children is an array before filtering
  const filteredChildren = useMemo(() => {
    if (!Array.isArray(children)) return [];
    return children.filter(
      (child: any) =>
        child && child.name && child.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [children, searchQuery]);

  if (loading)
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );

  const handlePickDate = (event: any, selectedDate?: Date) => {
    if (event.type === "set" && selectedDate) {
      setChildBirthdate(selectedDate);
      Platform.OS === "android" && setShowDatePicker(false);
    }
    if (event.type === "dismissed") setShowDatePicker(false);
  };
  const handleDeleteChild = (id: number) => {
    Alert.alert("Supprimer l’enfant", "Voulez-vous vraiment supprimer cet enfant ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            await deleteChild(id);
            setChildren((prev) => prev.filter((child) => child.id !== id));
            Alert.alert("Succès", "L’enfant a été supprimé avec succès.");
          } catch (e: any) {
            console.error("❌ Error deleting child:", e.response?.data || e.message);
            Alert.alert("Erreur", "Impossible de supprimer l’enfant.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const resetChildForm = () => {
    setChildName("");
    setChildParent("");
    setChildBirthdate(null);
    setChildImage(null);
    setHasMobileApp(false);
    if (classes.length) setChildClass(classes[0]?.name || "");
  };

  // ------------------- RENDER -------------------
  const renderChild = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      className="flex-row items-center mb-3 p-3 rounded-2xl"
      style={{
        backgroundColor: colors.cardBackground,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 2,
      }}
      onPress={() => router.push(`/profile?id=${item.id}`)}
      onLongPress={() => handleDeleteChild(item.id)}
    >
      <Image source={{ uri: item.avatar }} className="w-12 h-12 rounded-full mr-3" />
      <View className="flex-1">
        <Text className="text-base font-medium" style={{ color: colors.textDark }}>
          {item.name}
        </Text>
        <Text className="text-xs font-medium" style={{ color: colors.textLight }}>
          {item.classroom_name || "Aucune classe"}
        </Text>
      </View>
      <Ionicons name="chevron-forward-outline" size={18} color={colors.textLight} />
    </TouchableOpacity>
  );

  // ------------------- UI -------------------
  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <HeaderBar title={t("children.title")} showBack={true} />

      {/* Search & Filters */}
      <View className="px-5 mt-3">
        {/* Search Bar */}
        <View
          className="flex-row items-center rounded-2xl px-3 mb-4"
          style={{
            backgroundColor: colors.cardBackground,
            minHeight: 44,
            borderWidth: 1,
            borderColor: colors.accent,
          }}
        >
          <Ionicons name="search-outline" size={20} color={colors.textLight} />
          <TextInput
            className="flex-1 ml-2 text-base p-0"
            placeholder={t("children.search_placeholder")}
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ color: colors.textDark }}
          />
        </View>

        {/* 🔍 Filter Controls */}
        <View className=" mb-3">
          {/* 🔘 Filter Type Toggle */}
          <View className="flex-row justify-center mb-4">
            {[
              { key: "none", label: t("children.filter_all"), icon: "people-outline" },
              { key: "class", label: t("children.filter_class"), icon: "school-outline" },
              { key: "club", label: t("children.filter_club"), icon: "musical-notes-outline" },
            ].map((btn) => (
              <TouchableOpacity
                key={btn.key}
                onPress={() => {
                  setFilterType(btn.key as any);
                  setSelectedClass(null);
                  setSelectedClub(null);
                }}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: filterType === btn.key ? colors.accent : colors.cardBackground,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  marginHorizontal: 4,
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

          {/* 🏫 Class Chips */}
          {filterType === "class" && (
            <>
              {Array.isArray(classes) && classes.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {classes.map((cls: any) => (
                    <TouchableOpacity
                      key={cls.id}
                      onPress={() => {
                        console.log("🎯 [INTERACTION] Class chip clicked:", cls.name);
                        console.log("🎯 [INTERACTION] Current selectedClass:", selectedClass);
                        console.log(
                          "🎯 [INTERACTION] Will toggle to:",
                          selectedClass === cls.name ? null : cls.name
                        );
                        setSelectedClass((prev) => {
                          const newValue = prev === cls.name ? null : cls.name;
                          console.log(
                            "🎯 [STATE UPDATE] selectedClass updated from",
                            prev,
                            "to",
                            newValue
                          );
                          return newValue;
                        });
                      }}
                      onLongPress={() => {
                        console.log("🗑️ [INTERACTION] Delete class long-pressed:", cls.name);
                        handleDeleteClass(cls);
                      }}
                      activeOpacity={0.8}
                      style={{
                        backgroundColor:
                          selectedClass === cls.name ? colors.accent : colors.cardBackground,
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderWidth: 1,
                        borderColor: colors.accent,
                        marginRight: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: selectedClass === cls.name ? "#fff" : colors.textDark,
                          fontWeight: "500",
                        }}
                      >
                        {cls.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View
                  style={{ paddingVertical: 40, alignItems: "center", justifyContent: "center" }}
                >
                  <Ionicons name="school-outline" size={48} color={colors.textLight} />
                  <Text
                    className="text-center mt-3 text-base font-medium"
                    style={{ color: colors.textLight }}
                  >
                    {t("children.no_class_available")}
                  </Text>
                  <Text className="text-center mt-1 text-sm" style={{ color: colors.textLight }}>
                    {t("children.create_class_to_start")}
                  </Text>
                </View>
              )}
            </>
          )}

          {/* 🎵 Club Chips */}
          {filterType === "club" && (
            <>
              {Array.isArray(clubs) && clubs.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {clubs.map((club: any) => (
                    <TouchableOpacity
                      key={club.id}
                      onPress={() =>
                        setSelectedClub((prev) => (prev === club.name ? null : club.name))
                      }
                      onLongPress={() => handleDeleteClub(club)}
                      activeOpacity={0.8}
                      style={{
                        backgroundColor:
                          selectedClub === club.name ? colors.accent : colors.cardBackground,
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderWidth: 1,
                        borderColor: colors.accent,
                        marginRight: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: selectedClub === club.name ? "#fff" : colors.textDark,
                          fontWeight: "500",
                        }}
                      >
                        {club.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View
                  style={{ paddingVertical: 40, alignItems: "center", justifyContent: "center" }}
                >
                  <Ionicons name="musical-notes-outline" size={48} color={colors.textLight} />
                  <Text
                    className="text-center mt-3 text-base font-medium"
                    style={{ color: colors.textLight }}
                  >
                    {t("children.no_club_available")}
                  </Text>
                  <Text className="text-center mt-1 text-sm" style={{ color: colors.textLight }}>
                    {t("children.create_club_to_start")}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </View>

      {/* Child List */}
      <View className="flex-1 px-5">
        <FlatList
          data={filteredChildren}
          renderItem={renderChild}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-center mt-10 text-base" style={{ color: colors.textLight }}>
              {t("children.no_child_found")}
            </Text>
          }
        />
      </View>

      {/* Floating Buttons - Rectangle with Circular Sides */}
      <View className="absolute bottom-8 right-8 gap-2">
        {/* Add Club Button */}
        <TouchableOpacity
          onPress={() => setShowAddClub(true)}
          style={{
            backgroundColor: colors.accent,
            borderRadius: 50,
            paddingHorizontal: 20,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            elevation: 5,
          }}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFF" />
          <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 14 }}>{t("common.club")}</Text>
        </TouchableOpacity>

        {/* Add Class Button */}
        <TouchableOpacity
          onPress={() => setShowAddClass(true)}
          style={{
            backgroundColor: "#3B82F6",
            borderRadius: 50,
            paddingHorizontal: 20,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            elevation: 5,
          }}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFF" />
          <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 14 }}>
            {t("common.class")}
          </Text>
        </TouchableOpacity>

        {/* Add Child Button */}
        <TouchableOpacity
          onPress={() => {
            setShowAddChild(true);
            resetChildForm();
          }}
          style={{
            backgroundColor: "#10B981",
            borderRadius: 50,
            paddingHorizontal: 20,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            elevation: 5,
          }}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFF" />
          <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 14 }}>
            {t("common.child")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ✅ Add Class Modal */}
      <Modal visible={showAddClass} animationType="slide" transparent>
        <View
          className="flex-1 justify-center items-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <View
            className="w-full rounded-2xl p-6"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <Text className="text-xl font-bold mb-4 text-center" style={{ color: colors.textDark }}>
              {t("children.new_class")}
            </Text>
            <TextInput
              placeholder={t("children.class_name_placeholder")}
              placeholderTextColor={colors.textLight}
              value={newClassName}
              onChangeText={setNewClassName}
              className="rounded-xl px-4 py-3 text-base mb-5"
              style={{
                backgroundColor: "#F8F8F8",
                color: colors.textDark,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            />
            <View className="flex-row justify-end">
              <TouchableOpacity
                onPress={() => setShowAddClass(false)}
                className="px-5 py-3 mr-2 rounded-xl"
                style={{ backgroundColor: "#E5E7EB" }}
              >
                <Text style={{ color: colors.textDark }}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddClass}
                className="px-5 py-3 rounded-xl"
                style={{ backgroundColor: colors.accent }}
              >
                <Text className="text-white font-semibold">{t("common.add")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ Add Club Modal */}
      <Modal visible={showAddClub} animationType="slide" transparent>
        <View
          className="flex-1 justify-center items-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <View
            className="w-full rounded-2xl p-6"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <Text className="text-xl font-bold mb-4 text-center" style={{ color: colors.textDark }}>
              {t("children.new_club")}
            </Text>
            <TextInput
              placeholder={t("children.club_name_placeholder")}
              placeholderTextColor={colors.textLight}
              value={newClubName}
              onChangeText={setNewClubName}
              className="rounded-xl px-4 py-3 text-base mb-5"
              style={{
                backgroundColor: "#F8F8F8",
                color: colors.textDark,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            />
            <View className="flex-row justify-end">
              <TouchableOpacity
                onPress={() => setShowAddClub(false)}
                className="px-5 py-3 mr-2 rounded-xl"
                style={{ backgroundColor: "#E5E7EB" }}
              >
                <Text style={{ color: colors.textDark }}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddClub}
                className="px-5 py-3 rounded-xl"
                style={{ backgroundColor: colors.accent }}
              >
                <Text className="text-white font-semibold">{t("common.add")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ Add Child Modal (restored) */}
      <Modal visible={showAddChild} animationType="slide" transparent>
        <View
          className="flex-1 justify-center items-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <View
            className="w-full rounded-2xl p-6"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <Text className="text-xl font-bold mb-4 text-center" style={{ color: colors.textDark }}>
              {t("children.new_child")}
            </Text>

            {/* Name */}
            <TextInput
              placeholder={t("children.child_name_placeholder")}
              placeholderTextColor={colors.textLight}
              value={childName}
              onChangeText={setChildName}
              className="rounded-xl px-4 py-3 text-base mb-3"
              style={{
                backgroundColor: "#F8F8F8",
                color: colors.textDark,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            />

            {/* Birthdate Picker */}
            <View
              className="flex-row items-center justify-between rounded-xl px-4 py-3 mb-3"
              style={{
                backgroundColor: "#F8F8F8",
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <Text style={{ color: colors.textDark }}>
                  {childBirthdate
                    ? childBirthdate.toLocaleDateString()
                    : t("children.birthdate_placeholder")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowDatePicker(!showDatePicker)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={showDatePicker ? "close" : "calendar-outline"}
                  size={20}
                  color={colors.textLight}
                />
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={childBirthdate || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "calendar"}
                onChange={handlePickDate}
                maximumDate={new Date()}
              />
            )}

            {/* Image Picker */}
            <View className="items-center mb-6">
              <TouchableOpacity
                onPress={() =>
                  Alert.alert("Photo de l'enfant", "Choisissez une option :", [
                    { text: "📷 Prendre une photo", onPress: takePhoto },
                    { text: "🖼️ Galerie", onPress: pickImage },
                    { text: "Annuler", style: "cancel" },
                  ])
                }
                activeOpacity={0.9}
              >
                <View
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: "#F9FAFB",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Image
                    source={{
                      uri: childImage || "https://cdn-icons-png.flaticon.com/512/1946/1946429.png",
                    }}
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                    }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      bottom: 8,
                      right: 8,
                      backgroundColor: "rgba(255,255,255,0.9)",
                      borderRadius: 20,
                      padding: 6,
                    }}
                  >
                    <Ionicons name="camera-outline" size={20} color="#6B7280" />
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Parent */}
            <TextInput
              placeholder={t("children.parent_name_placeholder")}
              placeholderTextColor={colors.textLight}
              value={childParent}
              onChangeText={setChildParent}
              className="rounded-xl px-4 py-3 text-base mb-5"
              style={{
                backgroundColor: "#F8F8F8",
                color: colors.textDark,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            />

            {/* Class Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
              {Array.isArray(classes)
                ? classes.map((cls: any) => (
                    <TouchableOpacity
                      key={cls.id}
                      onPress={() => setChildClass(cls.name)}
                      activeOpacity={0.8}
                      style={{
                        backgroundColor:
                          childClass === cls.name ? colors.accent : colors.cardBackground,
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderWidth: 1,
                        borderColor: colors.accent,
                        marginRight: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: childClass === cls.name ? "#fff" : colors.textDark,
                          fontWeight: "500",
                        }}
                      >
                        {cls.name}
                      </Text>
                    </TouchableOpacity>
                  ))
                : null}
            </ScrollView>

            {/* Mobile App Access */}
            <View
              className="flex-row justify-between items-center mb-5 px-4 py-2.5 rounded-xl"
              style={{
                backgroundColor: "#F8F8F8",
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <Text style={{ color: colors.textDark, fontWeight: "500", fontSize: 14.5 }}>
                {t("children.mobile_app_access")}
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setHasMobileApp(!hasMobileApp)}
                style={{
                  width: 46,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: hasMobileApp ? colors.accent : "#D1D5DB",
                  justifyContent: "center",
                  paddingHorizontal: 3,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: "#FFF",
                    transform: [{ translateX: hasMobileApp ? 20 : 0 }],
                    shadowColor: "#000",
                    shadowOpacity: 0.15,
                    shadowRadius: 2,
                    elevation: 3,
                  }}
                />
              </TouchableOpacity>
            </View>

            {/* Buttons */}
            <View className="flex-row justify-end">
              <TouchableOpacity
                onPress={() => setShowAddChild(false)}
                className="px-5 py-3 mr-2 rounded-xl"
                style={{ backgroundColor: "#E5E7EB" }}
              >
                <Text style={{ color: colors.textDark }}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddChild}
                className="px-5 py-3 rounded-xl"
                style={{ backgroundColor: colors.accent }}
              >
                <Text className="text-white font-semibold">{t("common.add")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
