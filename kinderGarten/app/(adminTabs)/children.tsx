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
import { createClub, deleteChild, getChildren, uploadAvatar } from "@/api/children";
import { createClass, getClasses } from "@/api/class";
import { createChild } from "@/api/children";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppStore } from "@/store/useAppStore";

export default function ChildrenScreen() {
  const router = useRouter();

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

  const { data, actions } = useAppStore();
  const { clubList: clubs, classList: classes, childrenList } = data;
  const { fetchChildren, fetchClasses, fetchClubs } = actions;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await Promise.all([fetchChildren(), fetchClasses(), fetchClubs()]);
      } catch (e) {
        console.error("❌ Error initializing data:", e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
    setChildParent("");
    setChildBirthdate(null);
    setChildImage(null);
    setHasMobileApp(false);
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

    if (!result.canceled && result.assets?.length > 0) {
      setChildImage(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "Veuillez autoriser l’accès à la galerie.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
      selectionLimit: 1,
    });

    if (!result.canceled && result.assets?.length > 0) {
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
            setChildren((prev) => prev.filter((c: any) => c.id !== id));
            Alert.alert("Succès", "L'enfant a été supprimé !");
          } catch (e: any) {
            console.error("❌ Error deleting child:", e.response?.data || e.message);
            Alert.alert("Erreur", "Impossible de supprimer cet enfant.");
          }
        },
      },
    ]);
  };

  const handleAddClass = async () => {
    if (!newClassName.trim())
      return Alert.alert("Nom manquant", "Veuillez entrer un nom de classe.");
    setLoading(true);
    try {
      await createClass(newClassName.trim());
      const refreshedClasses = await getClasses();
      setClasses(refreshedClasses);
      setNewClassName("");
      setShowAddClass(false);
      Alert.alert("Succès", "Classe ajoutée !");
    } catch (e: any) {
      console.error("❌ Error creating class:", e.message);
      Alert.alert("Erreur", "Impossible d’ajouter la classe.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddClub = async () => {
    if (!newClubName.trim()) return Alert.alert("Nom manquant", "Veuillez entrer un nom de club.");
    setLoading(true);
    try {
      const created = await createClub(newClubName.trim());
      setClubs((prev) => [...prev, created]);
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

  // 🔍 Filter logic
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (selectedClass) {
          const cls = classes.find((c) => c.name === selectedClass);
          if (cls) params.classroom = cls.id;
        }
        if (selectedClub) {
          const club = clubs.find((c) => c.name === selectedClub);
          if (club) params.club = club.id;
        }

        const data = await getChildren(Object.keys(params).length ? params : undefined);
        setChildren(data);
      } catch (e: any) {
        console.error("❌ Error filtering children:", e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedClass, selectedClub]);

  const filteredChildren = useMemo(() => {
    return children.filter((child: any) =>
      child.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [children, searchQuery]);

  if (loading)
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );

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

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <HeaderBar title="Gestion des Enfants" showBack={true} />

      {/* 🔍 Search bar */}
      <View className="px-5 mt-3">
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
            placeholder="Rechercher un enfant..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ color: colors.textDark }}
          />
        </View>

        {/* Filter by Class */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <TouchableOpacity
            onPress={() => {
              setSelectedClass(null);
              setSelectedClub(null);
            }}
            activeOpacity={0.8}
            style={{
              backgroundColor:
                !selectedClass && !selectedClub ? colors.accent : colors.cardBackground,
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
                color: !selectedClass && !selectedClub ? "#fff" : colors.textDark,
                fontWeight: "500",
              }}
            >
              Tous les enfants
            </Text>
          </TouchableOpacity>

          {classes.map((cls: any) => (
            <TouchableOpacity
              key={cls.id}
              onPress={() => setSelectedClass((prev) => (prev === cls.name ? null : cls.name))}
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

        {/* Filter by Club */}
        {clubs.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {clubs.map((club: any) => (
              <TouchableOpacity
                key={club.id}
                onPress={() => setSelectedClub((prev) => (prev === club.name ? null : club.name))}
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
        )}
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
              Aucun enfant trouvé.
            </Text>
          }
        />
      </View>

      {/* Floating Buttons */}
      <View className="absolute bottom-8 right-8 items-end">
        <TouchableOpacity
          onPress={() => setShowAddClub(true)}
          className="w-14 h-14 rounded-full items-center justify-center mb-3"
          style={{
            backgroundColor: colors.accentLight,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            elevation: 5,
          }}
        >
          <Ionicons name="musical-notes-outline" size={26} color={colors.textDark} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowAddClass(true)}
          className="w-14 h-14 rounded-full items-center justify-center mb-3"
          style={{
            backgroundColor: colors.accentLight,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            elevation: 5,
          }}
        >
          <Ionicons name="add-outline" size={26} color={colors.textDark} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setShowAddChild(true);
            resetChildForm();
          }}
          className="w-14 h-14 rounded-full items-center justify-center"
          style={{
            backgroundColor: colors.accent,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            elevation: 5,
          }}
        >
          <Ionicons name="person-add-outline" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Add Club Modal */}
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
              Nouveau Club
            </Text>
            <TextInput
              placeholder="Nom du club"
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
                <Text style={{ color: colors.textDark }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddClub}
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
