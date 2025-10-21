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
import { getChildById } from "@/api/children";

export default function Profile() {
  const { id } = useLocalSearchParams();
  const childId = Array.isArray(id) ? id[0] : id;

  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);

  /** 🧮 Calcul de l’âge */
  const getAge = (birthdate?: string) => {
    if (!birthdate) return "N/D";
    const parsed = new Date(birthdate);
    if (isNaN(parsed.getTime())) return "N/D";
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

  /** 📦 Chargement du profil depuis le backend */
  useEffect(() => {
    if (!childId) return;

    (async () => {
      setLoading(true);
      try {
        const data = await getChildById(childId);

        const filled = {
          id: data?.id ?? "N/D",
          name: data?.name ?? "N/D",
          avatar: data?.avatar ?? "https://cdn-icons-png.flaticon.com/512/1946/1946429.png",
          birthdate: data?.birthdate ?? "N/D",
          gender: data?.gender ?? "N/D",
          className: data?.classroom_name ?? "N/D",
          parent_name: data?.parent_name ?? "N/D",
          allergies: data?.allergies ?? "N/D",
          conditions: data?.conditions ?? "N/D",
          medication: data?.medication ?? "N/D",
          doctor: data?.doctor ?? "N/D",
          weight: data?.weight ?? "N/D",
          height: data?.height ?? "N/D",
          nextPaymentDate: data?.nextPaymentDate ?? "Non définie",
          emergencyContact: {
            name: data?.emergencyContact?.name ?? "N/D",
            relation: data?.emergencyContact?.relation ?? "N/D",
            phone: data?.emergencyContact?.phone ?? "N/D",
          },
          classInfo: {
            teacherName: data?.classInfo?.teacherName ?? "N/D",
            classroomName: data?.classroom_name ?? "N/D",
            responsibleName: data?.classInfo?.responsibleName ?? "N/D",
            responsiblePhone: data?.classInfo?.responsiblePhone ?? "N/D",
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

  const saveProfile = () => {
    setIsEditing(false);
    Alert.alert("Succès", "Profil mis à jour localement (non sauvegardé sur le serveur).");
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
                  <TextInput
                    value={profile?.className}
                    onChangeText={(t) => updateField("className", t)}
                    className="text-center border-b border-gray-300 w-48"
                    style={{ color: colors.text }}
                  />
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
            <Row label="🎂 Date de naissance">
              {isEditing ? (
                <>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    className="border-b border-gray-300 w-40"
                  >
                    <Text
                      className="text-right font-medium py-1"
                      style={{ color: colors.textDark }}
                    >
                      {profile?.birthdate || "Sélectionner une date"}
                    </Text>
                  </TouchableOpacity>

                  {showDatePicker && (
                    <DateTimePicker
                      value={
                        profile?.birthdate && profile.birthdate !== "N/D"
                          ? new Date(profile.birthdate)
                          : new Date()
                      }
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
                </>
              ) : (
                <Text className="font-medium text-right" style={{ color: colors.textDark }}>
                  {profile?.birthdate}
                </Text>
              )}
            </Row>

            {renderRow("⚖️ Poids", "weight", profile?.weight, isEditing, (v) =>
              updateField("weight", v)
            )}
            {renderRow("📏 Taille", "height", profile?.height, isEditing, (v) =>
              updateField("height", v)
            )}
            <Row label="👧 Sexe">
              {isEditing ? (
                <TouchableOpacity
                  onPress={() => setShowGenderDropdown(!showGenderDropdown)}
                  className="flex-row justify-between items-center border-b border-gray-300 w-40"
                >
                  <Text className="text-right font-medium py-1" style={{ color: colors.textDark }}>
                    {profile?.gender || "Sélectionner le sexe"}
                  </Text>
                  <ChevronDown color={colors.textDark} size={18} />
                </TouchableOpacity>
              ) : (
                <Text className="font-medium text-right" style={{ color: colors.textDark }}>
                  {profile?.gender}
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
                    className={`py-2 rounded-xl ${profile?.gender === option ? "bg-gray-100" : ""}`}
                  >
                    <Text
                      className="text-right"
                      style={{
                        color: profile?.gender === option ? colors.accent : colors.textDark,
                        fontWeight: profile?.gender === option ? "600" : "400",
                      }}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
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
  value: string,
  editable: boolean,
  onChange: (v: string) => void,
  onPressPhone?: (v: string) => void
) {
  const safeValue = value ?? "N/D";
  const isPhoneField = label.toLowerCase().includes("téléphone");

  return (
    <View className="flex-row justify-between items-start mb-3" style={{ flexWrap: "wrap" }}>
      <View style={{ flexShrink: 1, flexBasis: "40%" }}>
        <Text numberOfLines={2} ellipsizeMode="tail" style={{ color: colors.text }}>
          {label}
        </Text>
      </View>

      <View style={{ flexShrink: 1, flexBasis: "58%", alignItems: "flex-end" }}>
        {editable ? (
          <TextInput
            value={safeValue}
            onChangeText={onChange}
            keyboardType={isPhoneField ? "phone-pad" : "default"}
            className="border-b border-gray-300 text-right"
            style={{ color: colors.textDark, minWidth: 100 }}
          />
        ) : isPhoneField && safeValue && safeValue !== "N/D" ? (
          <TouchableOpacity onPress={() => onPressPhone && onPressPhone(safeValue)}>
            <Text
              style={{
                color: colors.accent,
                textAlign: "right",
                textDecorationLine: "underline",
              }}
            >
              {safeValue}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={{ color: colors.textDark, textAlign: "right" }}>{safeValue}</Text>
        )}
      </View>
    </View>
  );
}
