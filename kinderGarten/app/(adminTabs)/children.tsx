import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import colors from "@/config/colors";

interface Child {
  id: string;
  name: string;
  age: number;
  className: string;
  photo?: string;
  parents: string;
  attendance: string;
}

export default function ChildrenScreen() {
  const router = useRouter();

  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [children, setChildren] = useState<Child[]>([
    {
      id: "1",
      name: "Emma Dupont",
      age: 4,
      className: "Petite Section",
      photo: "https://i.pravatar.cc/150?img=12",
      parents: "Sophie Dupont",
      attendance: "Présente",
    },
    {
      id: "2",
      name: "Liam Martin",
      age: 5,
      className: "Moyenne Section",
      photo: "https://i.pravatar.cc/150?img=14",
      parents: "Paul Martin",
      attendance: "Présent",
    },
  ]);

  const [classes, setClasses] = useState<string[]>([
    "Petite Section",
    "Moyenne Section",
    "Crèche 2",
  ]);

  // --- Modals state ---
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);

  // --- Inputs for class ---
  const [newClassName, setNewClassName] = useState("");

  // --- Inputs for child ---
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [childParent, setChildParent] = useState("");
  const [childClass, setChildClass] = useState(classes[0]);

  // --- Filtered data ---
  const filteredChildren = children.filter((child) =>
    child.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Render one child (compact) ---
  const renderChild = ({ item }: { item: Child }) => (
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
      onPress={() => router.push(`/child/${item.id}` as never)}
    >
      <Image
        source={{ uri: item.photo }}
        className="w-12 h-12 rounded-full mr-3"
      />
      <View className="flex-1">
        <Text className="text-base font-medium" style={{ color: colors.textDark }}>
          {item.name}
        </Text>
        <Text className="text-xs" style={{ color: colors.textLight }}>
          {item.className} · {item.age} ans
        </Text>
      </View>
      <Ionicons name="chevron-forward-outline" size={18} color={colors.textLight} />
    </TouchableOpacity>
  );

  // --- Add class logic ---
  const handleAddClass = () => {
    if (!newClassName.trim()) {
      Alert.alert("Nom manquant", "Veuillez entrer un nom de classe.");
      return;
    }

    if (classes.includes(newClassName.trim())) {
      Alert.alert("Doublon", "Cette classe existe déjà.");
      return;
    }

    setClasses((prev) => [...prev, newClassName.trim()]);
    setNewClassName("");
    setShowAddClass(false);
    Alert.alert("Succès", "Classe ajoutée avec succès !");
  };

  // --- Add child logic ---
  const handleAddChild = () => {
    if (!childName.trim() || !childAge.trim() || !childParent.trim()) {
      Alert.alert("Champs manquants", "Veuillez remplir tous les champs.");
      return;
    }

    const newChild: Child = {
      id: Date.now().toString(),
      name: childName.trim(),
      age: parseInt(childAge),
      className: childClass,
      parents: childParent.trim(),
      attendance: "Présent",
      photo: "https://i.pravatar.cc/150?u=" + Date.now(),
    };

    setChildren((prev) => [...prev, newChild]);
    setChildName("");
    setChildAge("");
    setChildParent("");
    setShowAddChild(false);
    Alert.alert("Succès", "Enfant ajouté avec succès !");
  };

  return (
    <View className="flex-1 px-5 pt-4" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-2xl font-bold" style={{ color: colors.textDark }}>
          Gestion des Enfants
        </Text>

        <View className="flex-row items-center">
          {/* Add Class */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              backgroundColor: colors.cardBackground,
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginRight: 10,
              borderWidth: 1,
              borderColor: colors.accent,
            }}
            onPress={() => setShowAddClass(true)}
          >
            <View className="flex-row items-center">
              <Ionicons name="layers-outline" size={18} color={colors.accent} />
              <Text className="ml-1 text-base font-medium" style={{ color: colors.accent }}>
                Classe
              </Text>
            </View>
          </TouchableOpacity>

          {/* Add Child */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              backgroundColor: colors.accent,
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 8,
            }}
            onPress={() => setShowAddChild(true)}
          >
            <View className="flex-row items-center">
              <Ionicons name="add" size={20} color="#fff" />
              <Text className="text-white text-base ml-1 font-medium">Enfant</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* View All button */}
      <View className="flex-row items-center mb-4">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSelectedClass("all")}
          style={{
            backgroundColor:
              selectedClass === "all" ? colors.accent : colors.cardBackground,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderWidth: 1,
            borderColor: colors.accent,
          }}
        >
          <Text
            className="text-sm font-medium"
            style={{
              color: selectedClass === "all" ? "#fff" : colors.textDark,
            }}
          >
            Tout
          </Text>
        </TouchableOpacity>

        {selectedClass && (
          <TouchableOpacity
            onPress={() => setSelectedClass(null)}
            className="flex-row items-center ml-4"
          >
            <Ionicons name="arrow-back-outline" size={18} color={colors.textDark} />
            <Text className="ml-1 text-base" style={{ color: colors.textDark }}>
              Retour aux classes
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search bar (only for “All” mode) */}
      {selectedClass === "all" && (
        <View
          className="flex-row items-center rounded-xl px-4 py-2 mb-3"
          style={{
            backgroundColor: "#F8F8F8",
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          <Ionicons name="search-outline" size={20} color={colors.textLight} />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder="Rechercher un enfant..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ color: colors.textDark }}
          />
        </View>
      )}

      {/* Content */}
      {!selectedClass ? (
        // --- Show class list ---
        <FlatList
          data={classes}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              className="p-5 mb-4 rounded-2xl"
              style={{
                backgroundColor: colors.cardBackground,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
              onPress={() => setSelectedClass(item)}
            >
              <View className="flex-row justify-between items-center">
                <View>
                  <Text
                    className="text-lg font-semibold mb-1"
                    style={{ color: colors.textDark }}
                  >
                    {item}
                  </Text>
                  <Text className="text-sm" style={{ color: colors.text }}>
                    {children.filter((c) => c.className === item).length} enfants
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward-outline"
                  size={22}
                  color={colors.textLight}
                />
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        // --- Show children ---
        <FlatList
          data={
            selectedClass === "all"
              ? filteredChildren
              : children.filter((c) => c.className === selectedClass)
          }
          renderItem={renderChild}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text
              className="text-center mt-10 text-base"
              style={{ color: colors.textLight }}
            >
              Aucun enfant trouvé.
            </Text>
          }
        />
      )}

      {/* ---------------- ADD CLASS MODAL ---------------- */}
      <Modal visible={showAddClass} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View
            className="w-full rounded-2xl p-6"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <Text className="text-lg font-semibold mb-4" style={{ color: colors.textDark }}>
              Nouvelle Classe
            </Text>

            <TextInput
              className="rounded-xl px-4 py-3 text-base mb-4"
              placeholder="Nom de la classe"
              placeholderTextColor={colors.textLight}
              value={newClassName}
              onChangeText={setNewClassName}
              style={{
                backgroundColor: "#F8F8F8",
                color: colors.textDark,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            />

            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => setShowAddClass(false)}
                className="rounded-xl py-3 px-5"
                style={{ backgroundColor: "#F3F4F6" }}
              >
                <Text style={{ color: colors.text }}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddClass}
                className="rounded-xl py-3 px-5"
                style={{ backgroundColor: colors.accent }}
              >
                <Text className="text-white font-medium">Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ---------------- ADD CHILD MODAL ---------------- */}
      <Modal visible={showAddChild} transparent animationType="fade">
        <ScrollView className="flex-1 bg-black/50 px-6" contentContainerStyle={{ justifyContent: "center", flexGrow: 1 }}>
          <View
            className="w-full rounded-2xl p-6"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <Text className="text-lg font-semibold mb-4" style={{ color: colors.textDark }}>
              Nouvel Enfant
            </Text>

            <TextInput
              className="rounded-xl px-4 py-3 text-base mb-3"
              placeholder="Nom complet"
              placeholderTextColor={colors.textLight}
              value={childName}
              onChangeText={setChildName}
              style={{
                backgroundColor: "#F8F8F8",
                color: colors.textDark,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            />

            <TextInput
              className="rounded-xl px-4 py-3 text-base mb-3"
              placeholder="Âge (en années)"
              placeholderTextColor={colors.textLight}
              keyboardType="numeric"
              value={childAge}
              onChangeText={setChildAge}
              style={{
                backgroundColor: "#F8F8F8",
                color: colors.textDark,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            />

            <TextInput
              className="rounded-xl px-4 py-3 text-base mb-3"
              placeholder="Nom du parent"
              placeholderTextColor={colors.textLight}
              value={childParent}
              onChangeText={setChildParent}
              style={{
                backgroundColor: "#F8F8F8",
                color: colors.textDark,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            />

            {/* Select Class */}
            <View
              className="rounded-xl px-4 py-3 mb-5 flex-row justify-between items-center"
              style={{
                backgroundColor: "#F8F8F8",
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <Text style={{ color: colors.textDark }}>Classe :</Text>
              <Text style={{ color: colors.accent, fontWeight: "500" }}>
                {childClass}
              </Text>
            </View>

            {/* Simple inline picker */}
            <View className="mb-5">
              {classes.map((cls) => (
                <TouchableOpacity
                  key={cls}
                  onPress={() => setChildClass(cls)}
                  style={{
                    paddingVertical: 6,
                    borderBottomWidth: 1,
                    borderBottomColor: "#E5E7EB",
                  }}
                >
                  <Text
                    style={{
                      color: childClass === cls ? colors.accent : colors.textDark,
                      fontWeight: childClass === cls ? "600" : "400",
                    }}
                  >
                    {cls}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => setShowAddChild(false)}
                className="rounded-xl py-3 px-5"
                style={{ backgroundColor: "#F3F4F6" }}
              >
                <Text style={{ color: colors.text }}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddChild}
                className="rounded-xl py-3 px-5"
                style={{ backgroundColor: colors.accent }}
              >
                <Text className="text-white font-medium">Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}
