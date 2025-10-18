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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import colors from "@/config/colors";
import { useAppStore } from "@/store/useAppStore";
import HeaderBar from "@/components/Header";

export default function ChildrenScreen() {
  const router = useRouter();
  const classes = useAppStore((state) => state.data.classes || []);
  const children = useAppStore((state) => state.data.childrenList || []);
  const { setData } = useAppStore();

  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [childParent, setChildParent] = useState("");
  const [childClass, setChildClass] = useState<string>("");

  useEffect(() => {
    if (classes.length && !childClass) {
      setChildClass(classes[0]?.name || "");
    }
  }, [classes]);

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
    const byClass =
      selectedClass === "all"
        ? children
        : children.filter((c: any) => c.className === selectedClass);
    return byClass.filter((child: any) =>
      child.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [children, searchQuery, selectedClass]);

  // ✅ Add class
  const handleAddClass = () => {
    if (!newClassName.trim()) {
      Alert.alert("Nom manquant", "Veuillez entrer un nom de classe.");
      return;
    }
    const trimmed = newClassName.trim();
    if (classes.find((cls: any) => cls.name === trimmed)) {
      Alert.alert("Doublon", "Cette classe existe déjà.");
      return;
    }
    const updated = [
      ...classes,
      {
        id: Date.now().toString(),
        name: trimmed,
        teacher: "",
        assistant: "",
        studentsCount: 0,
        ageRange: "",
        room: "",
      },
    ];
    setData("classes", updated);
    setNewClassName("");
    setShowAddClass(false);
    Alert.alert("Succès", "Classe ajoutée avec succès !");
  };

  // ✅ Add child
  const handleAddChild = () => {
    if (!childName.trim() || !childAge.trim() || !childParent.trim()) {
      Alert.alert("Champs manquants", "Veuillez remplir tous les champs.");
      return;
    }
    const newChild = {
      id: Date.now().toString(),
      name: childName.trim(),
      age: parseInt(childAge),
      className: childClass,
      parents: childParent.trim(),
      avatar: `https://i.pravatar.cc/150?u=${Date.now()}`,
      attendanceStatus: "present",
    };
    const updated = [...children, newChild];
    setData("childrenList", updated);
    setChildName("");
    setChildAge("");
    setChildParent("");
    setShowAddChild(false);
    Alert.alert("Succès", "Enfant ajouté avec succès !");
  };

  // ✅ Delete child
  const handleDeleteChild = (id: string) => {
    Alert.alert("Supprimer l'enfant", "Voulez-vous vraiment supprimer cet enfant ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => {
          const updated = children.filter((c: any) => c.id !== id);
          setData("childrenList", updated);
        },
      },
    ]);
  };

  // ✅ Delete class
  const handleDeleteClass = (clsName: string) => {
    Alert.alert("Supprimer la classe", `Voulez-vous supprimer la classe "${clsName}" ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => {
          const updatedClasses = classes.filter((c: any) => c.name !== clsName);
          setData("classes", updatedClasses);

          // Also remove children in that class
          const updatedChildren = children.filter((c: any) => c.className !== clsName);
          setData("childrenList", updatedChildren);
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
          onPress={() => setShowAddChild(true)}
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

            <TextInput
              placeholder="Âge"
              keyboardType="numeric"
              placeholderTextColor={colors.textLight}
              value={childAge}
              onChangeText={setChildAge}
              className="rounded-xl px-4 py-3 text-base mb-3"
              style={{
                backgroundColor: "#F8F8F8",
                color: colors.textDark,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            />

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
