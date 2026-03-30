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
import { MessageCircle } from "lucide-react-native";
import { useRouter } from "expo-router";
import { getColors } from "@/config/colors";
import { useAppStore } from "@/store/useAppStore";
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
import { useLanguageStore } from "@/store/useLanguageStore";
import { secureStorage } from "@/utils/secureStorage";
import { getTranslation } from "@/config/translations";

export default function ChildrenScreen() {
  const router = useRouter();
  const { language } = useLanguageStore();
  const t = (key: string) => getTranslation(language, key);
  const adminId = useAppStore((state) => state.adminId);
  const tenant = useAppStore((state) => state.tenant);
  const colors = getColors(tenant?.primary_color, tenant?.secondary_color);

  // Debug: Check store state on mount
  useEffect(() => {
    // console.log("🎯 [Children] Component mounted, adminId =", adminId);

    // If adminId is null, try to restore from SecureStore
    if (!adminId) {
      secureStorage.getAdminId().then((storedAdminId) => {
        // console.log("🎯 [Children] Restored adminId from SecureStore:", storedAdminId);
        if (storedAdminId) {
          useAppStore.getState().actions.setAdminId(storedAdminId);
        }
      });
    }
  }, []);
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
  const [childGender, setChildGender] = useState<string>("male");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [childImage, setChildImage] = useState<string | null>(null);
  const [hasMobileApp, setHasMobileApp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<"class" | "club" | "none">("none");

  const data = useAppStore((state) => state.data);
  const actions = useAppStore((state) => state.actions);
  const { clubList: clubs, classList: classes, childrenList: storeChildren } = data;
  const { fetchChildren, fetchClasses, fetchClubs, removeClassFromStore, removeClubFromStore } =
    actions;

  // ✅ Sync store children to local state
  useEffect(() => {
    if (Array.isArray(storeChildren) && storeChildren.length > 0) {
      setChildren(storeChildren);
    }
  }, [storeChildren]);

  // ------------------- INIT -------------------
  useEffect(() => {
    (async () => {
      //  // console.log("🚀 [COMPONENT] Initializing children screen...");
      setLoading(true);
      try {
        // // console.log(
        //   "🚀 [COMPONENT] Calling Promise.all with fetchChildren, fetchClasses, fetchClubs"
        // );
        await Promise.all([fetchChildren(), fetchClasses(), fetchClubs()]);
        //  // console.log("✅ [COMPONENT] All initial fetches completed");
      } catch (e: any) {
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
            // console.log("🧹 [COMPONENT] Starting delete for class:", cls);
            setLoading(true);
            await deleteClass(cls.id);
            // // console.log("✅ [COMPONENT] Delete successful, removing from store...");
            // ✅ Remove from store immediately
            removeClassFromStore(cls.id);
            // // console.log("✅ [COMPONENT] Store updated, refetching from backend...");
            // 🔄 Verify deletion by refetching
            await fetchClasses();
            // // console.log("✅ [COMPONENT] Backend verified, classes refreshed");
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
            // console.log("🧹 [COMPONENT] Starting delete for club:", club);
            setLoading(true);
            await deleteClub(club.id);
            // // console.log("✅ [COMPONENT] Delete successful, removing from store...");
            // ✅ Remove from store immediately
            removeClubFromStore(club.id);
            // // console.log("✅ [COMPONENT] Store updated, refetching from backend...");
            // 🔄 Verify deletion by refetching
            await fetchClubs();
            //  // console.log("✅ [COMPONENT] Backend verified, clubs refreshed");
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
    // // console.log("🧪 [ADD CHILD] Form values:", {
    //   childName,
    //   childBirthdate,
    //   childGender,
    //   childParent,
    //   childClass,
    // });
    if (!childName.trim() || !childBirthdate || !childParent.trim() || !childGender)
      return Alert.alert("Champs manquants", "Veuillez remplir tous les champs obligatoires.");

    const classObj = classes.find((c: any) => c.name === childClass);
    if (!classObj || !classObj.id) {
      // // console.log("⚠️ [ADD CHILD] Invalid class selection:", {
      //   childClass,
      //   availableClasses: classes,
      // });
      Alert.alert("Classe invalide", "Veuillez sélectionner une classe valide pour l'enfant.");
      return;
    }

    setLoading(true);
    try {
      let avatarUrl = "https://cdn-icons-png.flaticon.com/512/1946/1946429.png";
      if (childImage && !childImage.startsWith("http")) avatarUrl = await uploadAvatar(childImage);

      const payload = {
        name: childName.trim(),
        birthdate: childBirthdate.toISOString().split("T")[0],
        gender: childGender,
        parent_name: childParent.trim(),
        classroom_id: classObj.id,
        avatar: avatarUrl,
        hasMobileApp,
      };
      // // console.log("📦 [ADD CHILD] Payload:", payload, "Class:", classObj);
      const created = await createChild(payload);

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
      // // console.log("🔄 [COMPONENT] Filter effect triggered with:", { selectedClass, selectedClub });
      // // console.log("🔄 [COMPONENT] Available classes:", classes);
      setLoading(true);
      try {
        let params: any = {};
        if (selectedClass && !selectedClub) {
          const cls = classes.find((c: any) => c.name === selectedClass);
          //  // console.log("🔄 [COMPONENT] Looking for class:", selectedClass);
          //  // console.log("🔄 [COMPONENT] Classes array:", classes);
          //  // console.log("🔄 [COMPONENT] Found class:", cls);
          if (cls) {
            params.classroom = cls.id;
            // // console.log("🔄 [COMPONENT] Using classroom ID:", cls.id);
          } else {
            console.warn("⚠️ [COMPONENT] Class not found, using no filter");
          }
        } else if (selectedClub && !selectedClass) {
          const club = clubs.find((c: any) => c.name === selectedClub);
          // // console.log("🔄 [COMPONENT] Looking for club:", selectedClub, "Found:", club);
          if (club) params.club = club.id;
        }
        const data = await getChildren(Object.keys(params).length ? params : undefined);

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
    setChildGender("male");
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
        borderWidth: 1,
        borderColor: "#e5e7eb",
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
      {/* Chat icon button */}
      <TouchableOpacity
        onPress={async () => {
          try {
            // Fetch full child details to get parent_user.id
            const childDetails = await import("@/api/children").then((mod) =>
              mod.getChildById(item.id)
            );
            const parentId = childDetails?.parent_user?.id;

            // console.log("[CHILDREN] Opening chat with:", { parentId, adminId });

            if (!parentId) {
              alert("Impossible de trouver l'identifiant du parent pour ce profil.");
              return;
            }

            if (!adminId) {
              alert("Admin ID not found. Please log in again.");
              return;
            }

            // console.log("[CHILDREN] Navigating to chat screen...");

            router.push({
              pathname: "/(chat)/[conversation]",
              params: {
                conversation: "new",
                parentId,
                adminId,
                name: item.parent_name || item.name,
                avatar: item.avatar,
              },
            });
          } catch (err: any) {
            console.error("❌ Error fetching child details for chat:", err?.message || err);
            alert("Erreur lors de la récupération des informations du parent.");
          }
        }}
        style={{ marginRight: 24 }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MessageCircle color={colors.accent} size={22} />
      </TouchableOpacity>
      <View style={{ width: 8 }} />
      <Ionicons name="chevron-forward-outline" size={18} color={colors.textLight} />
    </TouchableOpacity>
  );

  // ------------------- UI -------------------
  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <HeaderBar title={t("children.title")} showBack={true} />

      {/* Search & Filters */}
      <View className="px-5 mt-3">
        {/* Search Bar + Add Child */}
        <View className="flex-row items-center mb-4">
        <View
          className="flex-row items-center rounded-2xl px-3"
          style={{
            backgroundColor: colors.cardBackground,
            minHeight: 44,
            borderWidth: 1,
            borderColor: colors.accent,
            flex: 1,
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
        <TouchableOpacity
          onPress={() => {
            setShowAddChild(true);
            resetChildForm();
          }}
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: colors.accent,
            alignItems: "center",
            justifyContent: "center",
            marginLeft: 10,
          }}
        >
          <Ionicons name="person-add-outline" size={22} color="#fff" />
        </TouchableOpacity>
        </View>

        {/* 🔍 Filter Controls */}
        <View className=" mb-3">
          {/* 🔘 Filter Type Toggle */}
          <View className="flex-row justify-between mb-4">
            {/* All */}
            <TouchableOpacity
              onPress={() => {
                setFilterType("none");
                setSelectedClass(null);
                setSelectedClub(null);
              }}
              activeOpacity={0.8}
              style={{
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: filterType === "none" ? colors.accent : colors.cardBackground,
                borderRadius: 10,
                paddingVertical: 7,
                paddingHorizontal: 14,
                borderWidth: 1,
                borderColor: colors.accent,
              }}
            >
              <Text style={{ color: filterType === "none" ? "#fff" : colors.textDark, fontWeight: "500", fontSize: 13 }}>
                {t("children.filter_all")}
              </Text>
            </TouchableOpacity>

            {/* Class + Add */}
            <View className="flex-row" style={{ gap: 3 }}>
              <TouchableOpacity
                onPress={() => {
                  setFilterType("class");
                  setSelectedClass(null);
                  setSelectedClub(null);
                }}
                activeOpacity={0.8}
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: filterType === "class" ? colors.accent : colors.cardBackground,
                  borderRadius: 10,
                  paddingVertical: 7,
                  paddingHorizontal: 14,
                  borderWidth: 1,
                  borderColor: colors.accent,
                }}
              >
                <Text style={{ color: filterType === "class" ? "#fff" : colors.textDark, fontWeight: "500", fontSize: 13 }}>
                  {t("children.filter_class")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setNewClassName("");
                  setShowAddClass(true);
                }}
                style={{
                  width: 32,
                  borderRadius: 10,
                  backgroundColor: colors.accent,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="add" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Club + Add */}
            <View className="flex-row" style={{ gap: 3 }}>
              <TouchableOpacity
                onPress={() => {
                  setFilterType("club");
                  setSelectedClass(null);
                  setSelectedClub(null);
                }}
                activeOpacity={0.8}
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: filterType === "club" ? colors.accent : colors.cardBackground,
                  borderRadius: 10,
                  paddingVertical: 7,
                  paddingHorizontal: 14,
                  borderWidth: 1,
                  borderColor: colors.accent,
                }}
              >
                <Text style={{ color: filterType === "club" ? "#fff" : colors.textDark, fontWeight: "500", fontSize: 13 }}>
                  {t("children.filter_club")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setNewClubName("");
                  setShowAddClub(true);
                }}
                style={{
                  width: 32,
                  borderRadius: 10,
                  backgroundColor: colors.accent,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="add" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* 🏫 Class Chips */}
          {filterType === "class" && (
            <>
              {Array.isArray(classes) && classes.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                  {classes.map((cls: any) => (
                    <TouchableOpacity
                      key={cls.id}
                      onPress={() => {
                        // // console.log("🎯 [INTERACTION] Class chip clicked:", cls.name);
                        // // console.log("🎯 [INTERACTION] Current selectedClass:", selectedClass);
                        // // console.log(
                        //   "🎯 [INTERACTION] Will toggle to:",
                        //   selectedClass === cls.name ? null : cls.name
                        // );
                        setSelectedClass((prev) => {
                          const newValue = prev === cls.name ? null : cls.name;
                          // // console.log(
                          //   "🎯 [STATE UPDATE] selectedClass updated from",
                          //   prev,
                          //   "to",
                          //   newValue
                          // );
                          return newValue;
                        });
                      }}
                      onLongPress={() => {
                        // console.log("🗑️ [INTERACTION] Delete class long-pressed:", cls.name);
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
                  style={{ flex: 1, paddingVertical: 40, alignItems: "center", justifyContent: "center" }}
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
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
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
                  style={{ flex: 1, paddingVertical: 40, alignItems: "center", justifyContent: "center" }}
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
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text className="text-center mt-10 text-base" style={{ color: colors.textLight }}>
              {t("children.no_child_found")}
            </Text>
          }
        />
      </View>

      {/* ✅ Add Class Modal */}
      <Modal visible={showAddClass} animationType="slide" transparent>
        <View
          className="flex-1 justify-center items-center px-6"
          style={{ backgroundColor: colors.overlayDark }}
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
                backgroundColor: colors.cardBackground,
                color: colors.textDark,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
            <View className="flex-row justify-end">
              <TouchableOpacity
                onPress={() => setShowAddClass(false)}
                className="px-5 py-3 mr-2 rounded-xl"
                style={{ backgroundColor: colors.border }}
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
          style={{ backgroundColor: colors.overlayDark }}
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
                backgroundColor: colors.cardBackground,
                color: colors.textDark,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
            <View className="flex-row justify-end">
              <TouchableOpacity
                onPress={() => setShowAddClub(false)}
                className="px-5 py-3 mr-2 rounded-xl"
                style={{ backgroundColor: colors.border }}
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
          style={{ backgroundColor: colors.overlayDark }}
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
                backgroundColor: colors.cardBackground,
                color: colors.textDark,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />

            {/* Birthdate Picker */}
            <View
              className="flex-row items-center justify-between rounded-xl px-4 py-3 mb-3"
              style={{
                backgroundColor: colors.cardBackground,
                borderWidth: 1,
                borderColor: colors.border,
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
                    backgroundColor: colors.pureWhiteGray,
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
                    <Ionicons name="camera-outline" size={20} color={colors.mediumGray} />
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Gender Selector */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 20,
                gap: 24,
              }}
            >
              <TouchableOpacity
                onPress={() => setChildGender("male")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 120,
                  height: 40,
                  paddingVertical: 0,
                  borderRadius: 12,
                  backgroundColor: childGender === "male" ? colors.maleBlue : colors.cardBackground,
                  borderWidth: 2,
                  borderColor: colors.maleBlue,
                  marginRight: 12,
                }}
              >
                <Ionicons
                  name="male"
                  size={22}
                  color={childGender === "male" ? colors.white : colors.maleBlue}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    color: childGender === "male" ? colors.white : colors.maleBlue,
                    fontWeight: "600",
                    fontSize: 16,
                  }}
                >
                  {t("children.gender_male")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setChildGender("female")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 120,
                  height: 40,
                  paddingVertical: 0,
                  borderRadius: 12,
                  backgroundColor:
                    childGender === "female" ? colors.femalePink : colors.cardBackground,
                  borderWidth: 2,
                  borderColor: colors.femalePink,
                }}
              >
                <Ionicons
                  name="female"
                  size={22}
                  color={childGender === "female" ? colors.white : colors.femalePink}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    color: childGender === "female" ? colors.white : colors.femalePink,
                    fontWeight: "600",
                    fontSize: 16,
                  }}
                >
                  {t("children.gender_female")}
                </Text>
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
                backgroundColor: colors.cardBackground,
                color: colors.textDark,
                borderWidth: 1,
                borderColor: colors.border,
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
                backgroundColor: colors.cardBackground,
                borderWidth: 1,
                borderColor: colors.border,
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
                  backgroundColor: hasMobileApp ? colors.accent : colors.disabled,
                  justifyContent: "center",
                  paddingHorizontal: 3,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: colors.cardBackground,
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
                style={{ backgroundColor: colors.border }}
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
