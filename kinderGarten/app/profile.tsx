import { router, useLocalSearchParams } from "expo-router";
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
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import colors from "../config/colors";
import Card from "../components/Card";
import Row from "../components/Row";
import { getChildById, getClassrooms, updateChild } from "@/api/children";

export default function Profile() {
  const { id } = useLocalSearchParams();
  const childId = Array.isArray(id) ? id[0] : id;

  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [classrooms, setClassrooms] = useState<any[]>([]);

  const saveProfile = async () => {
    if (!childId || !profile) return;

    try {
      setLoading(true);

      const payload = {
        name: profile.name,
        birthdate: profile.birthdate,
        gender: profile.gender,
        className: profile.className,
        allergies: profile.allergies,
        conditions: profile.conditions,
        medication: profile.medication,
        doctor: profile.doctor,
        weight: profile.weight,
        height: profile.height,
        emergencyContact: profile.emergencyContact,
        classInfo: profile.classInfo,
      };

      const updated = await updateChild(childId, payload);
      setProfile(updated);
      setIsEditing(false);
      Alert.alert("✅ Succès", "Profil mis à jour sur le serveur.");
    } catch (error: any) {
      console.error("❌ Error updating child:", error.response?.data || error.message);
      Alert.alert("Erreur", "Impossible de mettre à jour le profil sur le serveur.");
    } finally {
      setLoading(false);
    }
  };
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
  useEffect(() => {
    (async () => {
      try {
        const data = await getClassrooms();
        setClassrooms(data);
      } catch (error) {
        console.error("❌ Error fetching classrooms:", error);
      }
    })();
  }, []);

  /** 📦 Chargement du profil depuis le backend */
  useEffect(() => {
    if (!childId) return;

    (async () => {
      setLoading(true);
      try {
        const data = await getChildById(childId);

        const filled = {
          id: data?.id || "",
          name: data?.name || "",
          avatar: data?.avatar || "https://cdn-icons-png.flaticon.com/512/1946/1946429.png",
          birthdate: data?.birthdate || "",
          gender: data?.gender || "",
          className: data?.classroom_name || "",
          parent_name: data?.parent_name || "",
          allergies: data?.allergies || "",
          conditions: data?.conditions || "",
          medication: data?.medication || "",
          doctor: data?.doctor || "",
          weight: data?.weight || "",
          height: data?.height || "",
          nextPaymentDate: data?.nextPaymentDate || "",
          emergencyContact: {
            name: data?.emergencyContact?.name || "",
            relation: data?.emergencyContact?.relation || "",
            phone: data?.emergencyContact?.phone || "",
          },
          classInfo: {
            teacherName: data?.classInfo?.teacherName || "",
            classroomName: data?.classroom_name || "",
            responsibleName: data?.classInfo?.responsibleName || "",
            responsiblePhone: data?.classInfo?.responsiblePhone || "",
          },
        };

        setProfile(filled);
      } catch (e: any) {
        console.error("❌ Error fetching child:", e.response?.data || e.message);
        Alert.alert("Erreur", "Impossible de charger les informations de l'enfant.");
      } finally {
        setLoading(false);
      }
    })();
  }, [childId]);

  const updateField = (key: string, value: any) => {
    setProfile((prev: any) => ({ ...prev, [key]: value }));
  };

  const handlePhoneCall = (phone: string) => {
    if (!phone || phone === "") return;
    const sanitized = phone.replace(/[^+\d]/g, "");
    const url = `tel:${sanitized}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) Linking.openURL(url);
        else Alert.alert("Erreur", "Impossible d’ouvrir le composeur téléphonique.");
      })
      .catch(() => Alert.alert("Erreur", "Une erreur est survenue lors de l’appel."));
  };

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.textLight, marginTop: 8 }}>Chargement du profil...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <Text style={{ color: colors.textLight }}>Aucune donnée trouvée.</Text>
      </View>
    );
  }

  /** 📆 Statut du paiement */
  const getPaymentStatus = (dateString: string) => {
    if (!dateString || dateString === "Non définie")
      return { label: "Non défini", color: colors.textLight };

    const today = new Date();
    const dueDate = new Date(dateString);
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: "En retard", color: "#DC2626" };
    } else if (diffDays <= 3) {
      return { label: "Paiement proche", color: "#F59E0B" };
    } else {
      return { label: "Régulier", color: "#16A34A" };
    }
  };

  const paymentStatus = getPaymentStatus(profile.nextPaymentDate);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar barStyle={"dark-content"} />

      {/* En-tête */}
      <View
        className="flex-row items-center justify-between px-5 pt-16 pb-6"
        style={{ backgroundColor: colors.accentLight }}
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ChevronLeft color={colors.textDark} size={28} />
        </TouchableOpacity>

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

      {/* 🧱 Scroll content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* 👶 Informations sur l’enfant */}
          <Card title="Informations de l’enfant">
            <View className="items-center">
              <Image source={{ uri: profile?.avatar }} className="w-28 h-28 rounded-full mb-3" />
              {isEditing ? (
                <>
                  <TextInput
                    value={profile?.name}
                    onChangeText={(t) => updateField("name", t)}
                    className="text-center text-xl font-semibold border-b border-gray-300 w-48 mb-1"
                    style={{ color: colors.textDark }}
                  />
                  {/* 🏫 Classe */}
                  {isEditing ? (
                    <View style={{ width: "100%", alignItems: "center", marginTop: 8 }}>
                      <Text style={{ color: colors.text, marginBottom: 4 }}>🏫 Classe</Text>
                      <TouchableOpacity
                        onPress={() => setShowClassDropdown(!showClassDropdown)}
                        className="flex-row justify-between items-center border-b border-gray-300 w-48 py-1"
                      >
                        <Text
                          className="text-right font-medium"
                          style={{
                            color: profile?.className ? colors.textDark : colors.textLight,
                          }}
                        >
                          {profile?.className || "Sélectionner une classe"}
                        </Text>
                        <ChevronDown color={colors.textDark} size={18} />
                      </TouchableOpacity>

                      {showClassDropdown && (
                        <View
                          className="rounded-xl shadow-sm p-3 mt-1 w-48"
                          style={{ backgroundColor: colors.cardBackground }}
                        >
                          {classrooms.map((c) => (
                            <TouchableOpacity
                              key={c.id}
                              onPress={() => {
                                updateField("className", c.name);
                                updateField("classroom_id", c.id);
                                setShowClassDropdown(false);
                              }}
                              className={`py-2 rounded-xl ${
                                profile?.className === c.name ? "bg-gray-100" : ""
                              }`}
                            >
                              <Text
                                style={{
                                  color:
                                    profile?.className === c.name ? colors.accent : colors.textDark,
                                  fontWeight: profile?.className === c.name ? "600" : "400",
                                  textAlign: "left",
                                }}
                              >
                                {c.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  ) : (
                    <Text style={{ color: colors.text, marginTop: 4 }}>
                      {profile?.className || "—"}
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <Text className="text-xl font-semibold" style={{ color: colors.textDark }}>
                    {profile?.name}
                  </Text>
                  <Text style={{ color: colors.text, marginTop: 4 }}>
                    {getAge(profile?.birthdate)} • {profile?.className}
                  </Text>
                </>
              )}
            </View>
          </Card>

          {/* 📏 Informations physiques */}
          <Card title="Informations physiques">
            {/* 🎂 Date de naissance */}
            <View className="mb-4">
              {isEditing ? (
                <View style={{ width: "100%" }}>
                  <Text style={{ color: colors.text, marginBottom: 4 }}>🎂 Date de naissance</Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    className="border-b border-gray-300 py-1"
                  >
                    <Text
                      style={{
                        color: profile?.birthdate ? colors.textDark : colors.textLight,
                      }}
                    >
                      {profile?.birthdate || "Sélectionner une date"}
                    </Text>
                  </TouchableOpacity>

                  {showDatePicker && (
                    <DateTimePicker
                      value={profile?.birthdate ? new Date(profile.birthdate) : new Date()}
                      mode="date"
                      display="default"
                      maximumDate={new Date()}
                      onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                          const formatted = selectedDate.toISOString().split("T")[0];
                          updateField("birthdate", formatted);
                        }
                      }}
                    />
                  )}
                </View>
              ) : (
                <View className="flex-row justify-between items-center">
                  <Text style={{ color: colors.text }}>🎂 Date de naissance</Text>
                  <Text style={{ color: colors.textDark }}>{profile?.birthdate || "—"}</Text>
                </View>
              )}
            </View>

            {renderRow("⚖️ Poids", "weight", profile?.weight, isEditing, (v) =>
              updateField("weight", v)
            )}
            {renderRow("📏 Taille", "height", profile?.height, isEditing, (v) =>
              updateField("height", v)
            )}
            {/* 👧 Sexe */}
            <View className="mb-4">
              {isEditing ? (
                <View style={{ width: "100%" }}>
                  <Text style={{ color: colors.text, marginBottom: 4 }}>👧 Sexe</Text>
                  <TouchableOpacity
                    onPress={() => setShowGenderDropdown(!showGenderDropdown)}
                    className="flex-row justify-between items-center border-b border-gray-300 py-1"
                  >
                    <Text
                      style={{
                        color: profile?.gender ? colors.textDark : colors.textLight,
                      }}
                    >
                      {profile?.gender || "Sélectionner le sexe"}
                    </Text>
                    <ChevronDown color={colors.textDark} size={18} />
                  </TouchableOpacity>

                  {showGenderDropdown && (
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
                          className={`py-2 rounded-xl ${profile?.gender === option ? "bg-gray-100" : ""}`}
                        >
                          <Text
                            style={{
                              color: profile?.gender === option ? colors.accent : colors.textDark,
                              fontWeight: profile?.gender === option ? "600" : "400",
                              textAlign: "left",
                            }}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <View className="flex-row justify-between items-center">
                  <Text style={{ color: colors.text }}>👧 Sexe</Text>
                  <Text style={{ color: colors.textDark }}>{profile?.gender || "—"}</Text>
                </View>
              )}
            </View>
          </Card>

          {/* 💳 Paiement */}
          <Card title="Paiement">
            <View className="flex-row justify-between mb-2">
              <Text style={{ color: colors.text }}>Date limite</Text>
              <Text style={{ color: colors.textDark }}>
                {profile.nextPaymentDate || "Non définie"}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text style={{ color: colors.text }}>Statut</Text>
              <Text style={{ color: paymentStatus.color, fontWeight: "600" }}>
                {paymentStatus.label}
              </Text>
            </View>
          </Card>

          {/* 🚑 Santé & Allergies */}
          <Card title="Santé & allergies">
            {renderRow("🤧 Allergies", "allergies", profile?.allergies, isEditing, (v) =>
              updateField("allergies", v)
            )}
            {renderRow("❤️ Conditions", "conditions", profile?.conditions, isEditing, (v) =>
              updateField("conditions", v)
            )}
            {renderRow("💊 Médication", "medication", profile?.medication, isEditing, (v) =>
              updateField("medication", v)
            )}
            {renderRow("👨‍⚕️ Médecin", "doctor", profile?.doctor, isEditing, (v) =>
              updateField("doctor", v)
            )}
          </Card>

          {/* 🚨 Contact d’urgence */}
          <Card title="Contact d’urgence">
            {renderRow(
              "👤 Nom",
              "emergencyContact.name",
              profile?.emergencyContact?.name,
              isEditing,
              (v) => updateField("emergencyContact", { ...profile?.emergencyContact, name: v })
            )}
            {renderRow(
              "👥 Relation",
              "emergencyContact.relation",
              profile?.emergencyContact?.relation,
              isEditing,
              (v) => updateField("emergencyContact", { ...profile?.emergencyContact, relation: v })
            )}
            {renderRow(
              "📞 Téléphone",
              "emergencyContact.phone",
              profile?.emergencyContact?.phone,
              isEditing,
              (v) => updateField("emergencyContact", { ...profile?.emergencyContact, phone: v }),
              handlePhoneCall
            )}
          </Card>

          {/* 🎓 Informations sur la classe */}
          <Card title="Informations sur la classe">
            {renderRow(
              "👩‍🏫 Enseignant(e)",
              "classInfo.teacherName",
              profile?.classInfo?.teacherName,
              isEditing,
              (v) => updateField("classInfo", { ...profile?.classInfo, teacherName: v })
            )}
            {renderRow(
              "🚪 Salle",
              "classInfo.classroomName",
              profile?.classInfo?.classroomName,
              isEditing,
              (v) => updateField("classInfo", { ...profile?.classInfo, classroomName: v })
            )}
            {renderRow(
              "🧑 Responsable",
              "classInfo.responsibleName",
              profile?.classInfo?.responsibleName,
              isEditing,
              (v) => updateField("classInfo", { ...profile?.classInfo, responsibleName: v })
            )}
            {renderRow(
              "📞 Téléphone",
              "classInfo.responsiblePhone",
              profile?.classInfo?.responsiblePhone,
              isEditing,
              (v) => updateField("classInfo", { ...profile?.classInfo, responsiblePhone: v }),
              handlePhoneCall
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* 🧱 Ligne réutilisable */
function renderRow(
  label: string,
  key: string,
  value: string | undefined | null,
  editable: boolean,
  onChange: (v: string) => void,
  onPressPhone?: (v: string) => void
) {
  const displayValue = value ? value : "";
  const isPhoneField = label.toLowerCase().includes("téléphone");
  const isWeightField = label.toLowerCase().includes("poids");
  const isHeightField = label.toLowerCase().includes("taille");

  // Keyboard type logic
  const keyboardType = isPhoneField || isWeightField || isHeightField ? "numeric" : "default";

  // Display unit (only for read-only)
  const unit = !editable ? (isWeightField ? " kg" : isHeightField ? " cm" : "") : "";

  // Generic placeholder for all fields
  const placeholder = isPhoneField
    ? "Entrer un numéro"
    : isWeightField
      ? "Entrer le poids en Kg"
      : isHeightField
        ? "Entrer la taille en cm"
        : "Entrer une valeur";

  return (
    <View className="mb-4">
      {editable ? (
        // 🧱 Vertical layout when editing
        <View style={{ width: "100%" }}>
          <Text style={{ color: colors.text, marginBottom: 4 }}>{label}</Text>
          <TextInput
            value={displayValue}
            onChangeText={onChange}
            keyboardType={keyboardType}
            placeholder={placeholder}
            placeholderTextColor={colors.textLight}
            className="border-b border-gray-300 text-right py-1"
            style={{ color: colors.textDark, textAlign: "left", minWidth: 120 }}
          />
        </View>
      ) : (
        // 🧱 Horizontal layout when not editing
        <View
          className="flex-row justify-between items-start"
          style={{ flexWrap: "wrap", alignItems: "center" }}
        >
          <View style={{ flexShrink: 1, flexBasis: "40%" }}>
            <Text numberOfLines={2} ellipsizeMode="tail" style={{ color: colors.text }}>
              {label}
            </Text>
          </View>

          <View
            style={{
              flexShrink: 1,
              flexBasis: "58%",
              alignItems: "flex-end",
              flexDirection: "row",
              justifyContent: "flex-end",
            }}
          >
            {isPhoneField && displayValue ? (
              <TouchableOpacity onPress={() => onPressPhone && onPressPhone(displayValue)}>
                <Text
                  style={{
                    color: colors.accent,
                    textAlign: "right",
                    textDecorationLine: "underline",
                  }}
                >
                  {displayValue}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text
                style={{
                  color: displayValue ? colors.textDark : colors.textLight,
                  textAlign: "right",
                  fontStyle: displayValue ? "normal" : "italic",
                }}
              >
                {displayValue || "—"}
                {displayValue ? unit : ""}
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
