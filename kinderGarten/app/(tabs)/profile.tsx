import { router } from "expo-router";
import { Check, ChevronLeft, Pencil, ChevronDown } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
  StatusBar,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppStore } from "../../store/useAppStore";
import colors from "../../config/colors";
import Card from "../../components/Card";
import Row from "../../components/Row";

export default function Profile({ childId = "child_014" }) {
  const { childrenList, classes, setData } = useAppStore();

  const [isEditing, setIsEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [localProfile, setLocalProfile] = useState<any>(null);

  /** 🧮 Calcul de l’âge */
  const getAge = (birthdate?: string) => {
    if (!birthdate) return "";
    const parsed = new Date(birthdate);
    if (isNaN(parsed.getTime())) return "";
    const today = new Date();
    let years = today.getFullYear() - parsed.getFullYear();
    let months = today.getMonth() - parsed.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    if (years < 1) return `${months} mois`;
    return `${years} an${years > 1 ? "s" : ""}${months > 0 ? ` ${months} mois` : ""}`;
  };

  /** 📦 Construction du profil enfant */
  useEffect(() => {
    if (!childrenList || !classes) return;

    const child = childrenList.find((c: any) => c.id === childId);
    if (!child) return;

    const classInfo = classes.find((cl: any) => cl.name === child.className);

    const fullProfile = {
      id: child.id,
      name: child.name,
      avatar: child.avatar,
      group: child.className || "Classe inconnue",
      birthdate: child.birthdate || "2020-01-01",
      age: child.age || getAge(child.birthdate || "2020-01-01"),
      weight: child.weight || "N/D",
      height: child.height || "N/D",
      gender: child.gender || "Fille",
      allergies: child.allergies || "Aucune",
      conditions: child.medicalNote || "Aucune",
      medication: "N/D",
      doctor: classInfo ? `${classInfo.teacher} — ${classInfo.room}` : "N/D",
      emergencyContact: child.emergencyContact || {
        name: "N/D",
        relation: "N/D",
        phone: "N/D",
      },
      authorizedPickups: child.authorizedPickups || [],
      classInfo: {
        teacherName: classInfo?.teacher || "Inconnu",
        teacherPhone: "",
        classroomName: classInfo?.room || "N/D",
        responsibleName: classInfo?.assistant || "N/D",
        responsiblePhone: "",
      },
    };

    setLocalProfile(fullProfile);
    setData("profile", fullProfile);
  }, [childId, childrenList, classes]);

  const updateField = (key: string, value: any) => {
    setLocalProfile((prev: any) => ({ ...prev, [key]: value }));
  };

  const saveProfile = () => {
    setData("profile", localProfile);
    setIsEditing(false);
  };

  const handlePhoneCall = (phone: string) => {
    if (!phone || phone === "N/D") return;
    const sanitized = phone.replace(/[^+\d]/g, "");
    const url = `tel:${sanitized}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) Linking.openURL(url);
        else Alert.alert("Erreur", "Impossible d’ouvrir le composeur téléphonique.");
      })
      .catch(() => Alert.alert("Erreur", "Une erreur est survenue lors de l’appel."));
  };

  if (!localProfile) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Text style={{ color: colors.textLight }}>Chargement du profil...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar barStyle={"dark-content"} />

      {/* En-tête */}
      <View
        className="flex-row items-center justify-between px-5 pt-16 pb-6"
        style={{ backgroundColor: colors.accentLight }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ChevronLeft color={colors.textDark} size={28} />
          </TouchableOpacity>

        </View>

        <TouchableOpacity
          onPress={() => {
            if (isEditing) saveProfile();
            else setIsEditing(true);
          }}
        >
          {isEditing ? (
            <Check color={colors.textDark} size={26} />
          ) : (
            <Pencil color={colors.textDark} size={24} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* 👶 Informations sur l’enfant */}
        <Card title="Informations de l’enfant">
          <View className="items-center">
            <Image
              source={{ uri: localProfile?.avatar }}
              className="w-28 h-28 rounded-full mb-3"
            />
            {isEditing ? (
              <>
                <TextInput
                  value={localProfile?.name}
                  onChangeText={(t) => updateField("name", t)}
                  className="text-center text-xl font-semibold border-b border-gray-300 w-48 mb-1"
                  style={{ color: colors.textDark }}
                />
                <TextInput
                  value={localProfile?.group}
                  onChangeText={(t) => updateField("group", t)}
                  className="text-center border-b border-gray-300 w-48"
                  style={{ color: colors.text }}
                />
              </>
            ) : (
              <>
                <Text className="text-xl font-semibold" style={{ color: colors.textDark }}>
                  {localProfile?.name}
                </Text>
                <Text style={{ color: colors.text, marginTop: 4 }}>
                  {getAge(localProfile?.birthdate)} • {localProfile?.group}
                </Text>
              </>
            )}
          </View>
        </Card>

        {/* 📏 Informations physiques */}
        <Card title="Informations physiques">
          {/* 🎂 Date de naissance */}
          <Row label="🎂 Date de naissance">
            {isEditing ? (
              <>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="border-b border-gray-300 w-40"
                >
                  <Text className="text-right font-medium py-1" style={{ color: colors.textDark }}>
                    {localProfile?.birthdate || "Sélectionner une date"}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={new Date(localProfile?.birthdate || "2020-01-01")}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        const formatted = selectedDate.toISOString().split("T")[0];
                        updateField("birthdate", formatted);
                        updateField("age", getAge(formatted));
                      }
                    }}
                  />
                )}
              </>
            ) : (
              <Text className="font-medium text-right" style={{ color: colors.textDark }}>
                {localProfile?.birthdate}
              </Text>
            )}
          </Row>

          {/* ⚖️ Poids */}
          {renderRow("⚖️ Poids", "weight", localProfile?.weight, isEditing, (v) => updateField("weight", v))}

          {/* 📏 Taille */}
          {renderRow("📏 Taille", "height", localProfile?.height, isEditing, (v) => updateField("height", v))}

          {/* 👧 Sexe */}
          <Row label="👧 Sexe">
            {isEditing ? (
              <TouchableOpacity
                onPress={() => setShowGenderDropdown(!showGenderDropdown)}
                className="flex-row justify-between items-center border-b border-gray-300 w-40"
              >
                <Text className="text-right font-medium py-1" style={{ color: colors.textDark }}>
                  {localProfile?.gender || "Sélectionner le sexe"}
                </Text>
                <ChevronDown color={colors.textDark} size={18} />
              </TouchableOpacity>
            ) : (
              <Text className="font-medium text-right" style={{ color: colors.textDark }}>
                {localProfile?.gender}
              </Text>
            )}
          </Row>

          {showGenderDropdown && isEditing && (
            <View
              className="rounded-xl shadow-sm p-3 mt-1"
              style={{ backgroundColor: colors.cardBackground }}
            >
              {["Fille", "Garçon"].map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => {
                    updateField("gender", option);
                    setShowGenderDropdown(false);
                  }}
                  className={`py-2 rounded-xl ${
                    localProfile?.gender === option ? "bg-gray-100" : ""
                  }`}
                >
                  <Text
                    className="text-right"
                    style={{
                      color: localProfile?.gender === option ? colors.accent : colors.textDark,
                      fontWeight: localProfile?.gender === option ? "600" : "400",
                    }}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Card>

        {/* 🚑 Santé & Allergies */}
        <Card title="Santé & allergies">
          {renderRow("Allergies", "allergies", localProfile?.allergies, isEditing, (v) => updateField("allergies", v))}
          {renderRow("Conditions", "conditions", localProfile?.conditions, isEditing, (v) => updateField("conditions", v))}
          {renderRow("Médication", "medication", localProfile?.medication, isEditing, (v) => updateField("medication", v))}
          {renderRow("Médecin", "doctor", localProfile?.doctor, isEditing, (v) => updateField("doctor", v))}
        </Card>

        {/* 🚨 Contact d’urgence */}
        <Card title="Contact d’urgence">
          {renderRow("Nom", "emergencyContact.name", localProfile?.emergencyContact?.name, isEditing, (v) =>
            updateField("emergencyContact", { ...localProfile?.emergencyContact, name: v })
          )}
          {renderRow("Relation", "emergencyContact.relation", localProfile?.emergencyContact?.relation, isEditing, (v) =>
            updateField("emergencyContact", { ...localProfile?.emergencyContact, relation: v })
          )}
          {renderRow("Téléphone", "emergencyContact.phone", localProfile?.emergencyContact?.phone, isEditing, (v) =>
            updateField("emergencyContact", { ...localProfile?.emergencyContact, phone: v })
          )}
        </Card>

        {/* 🎓 Informations sur la classe */}
        <Card title="Informations sur la classe">
          {renderRow("👩‍🏫 Enseignant(e)", "classInfo.teacherName", localProfile?.classInfo?.teacherName, isEditing, (v) =>
            updateField("classInfo", { ...localProfile?.classInfo, teacherName: v })
          )}
          {renderRow("🚪 Salle", "classInfo.classroomName", localProfile?.classInfo?.classroomName, isEditing, (v) =>
            updateField("classInfo", { ...localProfile?.classInfo, classroomName: v })
          )}
          {renderRow("🧑 Responsable", "classInfo.responsibleName", localProfile?.classInfo?.responsibleName, isEditing, (v) =>
            updateField("classInfo", { ...localProfile?.classInfo, responsibleName: v })
          )}
          {renderRow("📞 Téléphone du responsable", "classInfo.responsiblePhone", localProfile?.classInfo?.responsiblePhone, isEditing, (v) =>
            updateField("classInfo", { ...localProfile?.classInfo, responsiblePhone: v })
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

/* 🧱 Fonction de ligne réutilisable */
function renderRow(
  label: string,
  key: string,
  value: string,
  editable: boolean,
  onChange: (v: string) => void
) {
  return (
    <View className="flex-row justify-between items-center mb-3">
      <Text style={{ color: colors.text }}>{label}</Text>
      {editable ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          className="border-b border-gray-300 text-right w-40"
          style={{ color: colors.textDark }}
        />
      ) : (
        <Text className="font-medium text-right" style={{ color: colors.textDark }}>
          {value}
        </Text>
      )}
    </View>
  );
}
