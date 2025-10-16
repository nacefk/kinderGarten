import React, { useState, useEffect } from "react";
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
import { useAppStore } from "@/store/useAppStore";
import { ChevronLeft } from "lucide-react-native";

export default function ChildrenScreen() {
  const router = useRouter();

  const classes = useAppStore((state) => state.data.classes || []);
  const children = useAppStore((state) => state.data.childrenList || []);
  const { setData } = useAppStore();

  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChildren = children.filter((child: any) =>
    child.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  // ✅ Payment status helper (random or real)
  const getPaymentStatus = () => {
    const statuses = [
      { label: "Régulier", color: "#16A34A" }, // 🟢
      { label: "Paiement proche", color: "#F59E0B" }, // 🟠
      { label: "En retard", color: "#DC2626" }, // 🔴
    ];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  // ✅ Render each child card
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5 pt-12 pb-6"
        style={{ backgroundColor: colors.accentLight }}
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ChevronLeft color={colors.textDark} size={28} />
        </TouchableOpacity>
        <Text className="text-xl text-center font-semibold" style={{ color: colors.textDark }}>
          Gestion des Enfants
        </Text>
      </View>

      {/* Main content */}
      <View className="flex-1 px-5 pt-4">
        <FlatList
          data={
            selectedClass === "all"
              ? filteredChildren
              : children.filter((c: any) => (selectedClass ? c.className === selectedClass : true))
          }
          renderItem={renderChild}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-center mt-10 text-base" style={{ color: colors.textLight }}>
              Aucun enfant trouvé.
            </Text>
          }
        />
      </View>
    </View>
  );
}
