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
import { deleteChild, getChildren, uploadAvatar } from "@/api/children";
import { createClass, getClasses } from "@/api/class";
import { createChild } from "@/api/children";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppStore } from "@/store/useAppStore";

export default function ChildrenScreen() {
  const router = useRouter();

  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [childParent, setChildParent] = useState("");
  const [childClass, setChildClass] = useState<string>("");
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [childBirthdate, setChildBirthdate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [childImage, setChildImage] = useState<string | null>(null);
  const [hasMobileApp, setHasMobileApp] = useState(false);

  const { data, actions } = useAppStore();
  const { childrenList, classList } = data;
  const { fetchChildren, fetchClasses } = actions;

  useEffect(() => {
    (async () => {
      await Promise.all([fetchChildren(), fetchClasses()]);
    })();
  }, []);

  const handleAddClass = async () => {
    if (!newClassName.trim()) {
      Alert.alert("Nom manquant", "Veuillez entrer un nom de classe.");
      return;
    }

    setLoading(true);
    try {
      // 🔹 Create the new class
      await createClass(newClassName.trim());

      // 🔹 Refresh the list of classes from the backend
      const refreshedClasses = await getClasses();
      setClasses(refreshedClasses);

      // 🔹 Reset UI
      setNewClassName("");
      setShowAddClass(false);

      Alert.alert("Succès", "Classe ajoutée !");
    } catch (e: any) {
      console.error("❌ Error creating class:", e.response?.data || e.message);
      Alert.alert("Erreur", "Impossible d’ajouter la classe.");
    } finally {
      setLoading(false);
    }
  };

  // 📅 Pick birthdate
  const handlePickDate = (event: any, selectedDate?: Date) => {
    if (event.type === "set" && selectedDate) {
      setChildBirthdate(selectedDate);
      Platform.OS === "android" && setShowDatePicker(false);
    }
    if (event.type === "dismissed") {
      setShowDatePicker(false);
    }
  };
  const resetChildForm = () => {
    setChildName("");
    setChildBirthdate(null);
    setChildParent("");
    setChildImage(null);
    setHasMobileApp(false);
    setShowDatePicker(false);
    if (classes.length) setChildClass(classes[0]?.name || "");
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "Veuillez autoriser l’accès à la caméra.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setChildImage(result.assets[0].uri);
    }
  };

  // 🖼️ Pick or take image
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "Veuillez autoriser l’accès à la galerie.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images", // ✅ replaces MediaTypeOptions.Images
      allowsEditing: true, // enables cropping
      aspect: [1, 1],
      quality: 0.9,
      selectionLimit: 1, // new field
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setChildImage(result.assets[0].uri);
    }
  };
  const handleDeleteChild = (id: string) => {
    Alert.alert("Supprimer l'enfant", "Voulez-vous vraiment supprimer cet enfant ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteChild(Number(id));
            const updated = children.filter((c: any) => c.id !== id);
            setChildren(updated);
            Alert.alert("Succès", "L'enfant a été supprimé !");
          } catch (e: any) {
            console.error("❌ Error deleting child:", e.response?.data || e.message);
            Alert.alert("Erreur", "Impossible de supprimer cet enfant.");
          }
        },
      },
    ]);
  };

  const handleAddChild = async () => {
    if (!childName.trim() || !childBirthdate || !childParent.trim()) {
      Alert.alert("Champs manquants", "Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);
    try {
      const classObj = classes.find((c: any) => c.name === childClass);

      // ✅ Upload image first (if it's a local file)
      let avatarUrl = "https://cdn-icons-png.flaticon.com/512/1946/1946429.png";
      if (childImage && !childImage.startsWith("http")) {
        avatarUrl = await uploadAvatar(childImage);
      } else if (childImage) {
        avatarUrl = childImage;
      }

      // ✅ Then create the child with remote image URL
      const created = await createChild({
        name: childName.trim(),
        birthdate: childBirthdate.toISOString().split("T")[0],
        parent_name: childParent.trim(),
        classroom: classObj?.id,
        avatar: avatarUrl,
        hasMobileApp: hasMobileApp,
      });
      setChildren([...children, created]);
      setShowAddChild(false);

      let message = "L’enfant a été ajouté avec succès !";

      console.log("response", created);

      setChildren([...children, created]);
      setShowAddChild(false);
      if (hasMobileApp) {
        message += `\n\nIdentifiants de connexion :\n👤 ${created.username}\n🔑 ${created.password}`;
      }
      Alert.alert("Succès 🎉", message);
    } catch (e: any) {
      console.error("❌ Error creating child:", e.response?.data || e.message);
      console.log(
        "Erreur",
        e.response?.data
          ? JSON.stringify(e.response.data, null, 2)
          : "Impossible d’ajouter l’enfant."
      );
    } finally {
      setLoading(false);
    }
  };
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
        {childBirthdate ? childBirthdate.toLocaleDateString() : "Date de naissance"}
      </Text>
    </TouchableOpacity>

    <TouchableOpacity onPress={() => setShowDatePicker(!showDatePicker)} activeOpacity={0.8}>
      <Ionicons
        name={showDatePicker ? "close" : "calendar-outline"}
        size={20}
        color={colors.textLight}
      />
    </TouchableOpacity>
  </View>;

  useEffect(() => {
    if (classes.length && !childClass) {
      setChildClass(classes[0]?.name || "");
    }
  }, [classes]);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const classObj = classes.find((c: any) => c.name === selectedClass);
        const data = await getChildren(classObj ? classObj.id : undefined);
        setChildren(data);
        // console.log("children", data);
      } catch (e) {
        console.error("❌ Error fetching children:", e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedClass]);
  // Fetch classes and children when we open the screen
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const classData = await getClasses();
        setClasses(classData);
        const childData = await getChildren();
        setChildren(childData);
      } catch (e) {
        console.error("❌ Error fetching data:", e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ✅ Payment status helper (random)
  const getPaymentStatus = () => {
    const statuses = [
      { label: "Régulier", color: "#16A34A" },
      { label: "Paiement proche", color: "#F59E0B" },
      { label: "En retard", color: "#DC2626" },
    ];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  // ✅ Filtered children (by class + search)
  const filteredChildren = useMemo(() => {
    return children.filter((child: any) =>
      child.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [children, searchQuery]);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (selectedClass === "all") {
          // 🔹 fetch all children (no class filter)
          const all = await getChildren();
          setChildren(all);
        } else {
          // 🔹 fetch by class ID
          const classObj = classes.find((c: any) => c.name === selectedClass);
          if (classObj) {
            const filtered = await getChildren(classObj.id);
            setChildren(filtered);
          }
        }
      } catch (e: any) {
        console.error("❌ Error fetching children:", e.message);
        Alert.alert("Erreur", "Impossible de charger la liste des enfants.");
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedClass]);

  // ✅ Delete class
  const handleDeleteClass = (clsName: string) => {
    Alert.alert("Supprimer la classe", `Voulez-vous supprimer la classe "${clsName}" ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => {
          const updatedClasses = classes.filter((c: any) => c.name !== clsName);
          setClasses(updatedClasses);

          // Also remove children in that class
          const updatedChildren = children.filter((c: any) => c.className !== clsName);
          setChildren(updatedChildren);
        },
      },
    ]);
  };

  // ✅ Render child card
  const renderChild = ({ item }: { item: any }) => {
    const status = getPaymentStatus();
    return (
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
        onLongPress={() => handleDeleteChild(item.id)} // ✅ long press to delete
      >
        <Image source={{ uri: item.avatar }} className="w-12 h-12 rounded-full mr-3" />
        <View className="flex-1">
          <Text className="text-base font-medium" style={{ color: colors.textDark }}>
            {item.name}
          </Text>
          <Text className="text-xs font-medium">
            <Text style={{ color: colors.textLight }}>{item.className} · </Text>
            <Text style={{ color: status.color }}>{status.label}</Text>
          </Text>
        </View>
        <Ionicons name="chevron-forward-outline" size={18} color={colors.textLight} />
      </TouchableOpacity>
    );
  };
  if (loading)
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <HeaderBar title="Gestion des Enfants" showBack={true} />

      {/* ✅ Search & Filters */}
      <View className="px-5 mt-3">
        {/* Search Bar */}
        <View
          className="flex-row items-center rounded-2xl px-3 mb-4"
          style={{
            backgroundColor: colors.cardBackground,
            shadowColor: "#000",
            shadowOpacity: 0.04,
            shadowRadius: 2,
            elevation: 1,
            minHeight: 44,
          }}
        >
          <Ionicons name="search-outline" size={20} color={colors.textLight} />
          <TextInput
            className="flex-1 ml-2 text-base p-0"
            placeholder="Rechercher un enfant..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              color: colors.textDark,
              paddingVertical: 0,
              height: 40,
              lineHeight: 20,
              textAlignVertical: "center",
              includeFontPadding: false,
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>

        {/* Class Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <TouchableOpacity
            onPress={() => setSelectedClass("all")}
            activeOpacity={0.8}
            style={{
              backgroundColor: selectedClass === "all" ? colors.accent : colors.cardBackground,
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
                color: selectedClass === "all" ? "#fff" : colors.textDark,
                fontWeight: "500",
              }}
            >
              Tout
            </Text>
          </TouchableOpacity>

          {classes.map((cls: any) => (
            <TouchableOpacity
              key={cls.id}
              onPress={() => setSelectedClass(cls.name)}
              onLongPress={() => handleDeleteClass(cls.name)} // ✅ long press to delete class
              activeOpacity={0.8}
              style={{
                backgroundColor: selectedClass === cls.name ? colors.accent : colors.cardBackground,
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
      </View>

      {/* ✅ Main Content */}
      <View className="flex-1 px-5">
        <FlatList
          data={filteredChildren}
          renderItem={renderChild}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-center mt-10 text-base" style={{ color: colors.textLight }}>
              Aucun enfant trouvé.
            </Text>
          }
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      </View>

      {/* ✅ Floating Add Buttons */}
      <View className="absolute bottom-8 right-8">
        {/* Add Child */}
        <TouchableOpacity
          onPress={() => {
            setShowAddChild(true);
            resetChildForm();
          }} // ✅ clear fields
          className="w-14 h-14 rounded-full items-center justify-center mb-3"
          style={{
            backgroundColor: colors.accent,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            elevation: 5,
          }}
        >
          <Ionicons name="person-add-outline" size={26} color="#FFF" />
        </TouchableOpacity>

        {/* Add Class */}
        <TouchableOpacity
          onPress={() => setShowAddClass(true)}
          className="w-14 h-14 rounded-full items-center justify-center"
          style={{
            backgroundColor: colors.accentLight,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            elevation: 5,
          }}
        >
          <Ionicons name="add-outline" size={26} color={colors.textDark} />
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
              Nouvelle Classe
            </Text>
            <TextInput
              placeholder="Nom de la classe"
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
                <Text style={{ color: colors.textDark }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddClass}
                className="px-5 py-3 rounded-xl"
                style={{ backgroundColor: colors.accent }}
              >
                <Text className="text-white font-semibold">Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ Add Child Modal */}
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
              Nouvel Enfant
            </Text>

            <TextInput
              placeholder="Nom de l'enfant"
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

            {/* 📅 Birthdate picker */}
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
                  {childBirthdate ? childBirthdate.toLocaleDateString() : "Date de naissance"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowDatePicker(!showDatePicker)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={showDatePicker ? "chevron-up-outline" : "calendar-outline"}
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

            {/* 🖼️ Image picker */}
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
                style={{
                  shadowColor: "#000",
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 2,
                  borderRadius: 80,
                }}
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

                  {/* Overlay icon */}
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

              <Text
                style={{
                  marginTop: 8,
                  color: "#6B7280",
                  fontSize: 14,
                  fontWeight: "500",
                }}
              >
                {childImage ? "Modifier la photo" : "Ajouter une photo"}
              </Text>
            </View>

            <TextInput
              placeholder="Nom du parent"
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

            {/* Class Picker */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
              {classes.map((cls: any) => (
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
              ))}
            </ScrollView>
            {/* ✅ Option : Accès à l’application mobile */}
            <View
              className="flex-row justify-between items-center mb-5 px-4 py-2.5 rounded-xl"
              style={{
                backgroundColor: "#F8F8F8",
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <Text
                style={{
                  color: colors.textDark,
                  fontWeight: "500",
                  fontSize: 14.5, // ⬅️ Smaller, balanced with inputs
                }}
              >
                Accès à l’application mobile
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

            <View className="flex-row justify-end">
              <TouchableOpacity
                onPress={() => setShowAddChild(false)}
                className="px-5 py-3 mr-2 rounded-xl"
                style={{ backgroundColor: "#E5E7EB" }}
              >
                <Text style={{ color: colors.textDark }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddChild}
                className="px-5 py-3 rounded-xl"
                style={{ backgroundColor: colors.accent }}
              >
                <Text className="text-white font-semibold">Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
