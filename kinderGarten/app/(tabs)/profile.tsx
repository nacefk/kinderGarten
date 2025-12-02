import { router } from "expo-router";
import { Check, ChevronLeft, Pencil, ChevronDown, LogOut } from "lucide-react-native";
import { useEffect, useState, useCallback } from "react";
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
import colors from "../../config/colors";
import Card from "../../components/Card";
import Row from "../../components/Row";
import * as ImagePicker from "expo-image-picker";
import { getMyChild, updateChild, uploadAvatar } from "@/api/children";
import { useAuthStore } from "@/store/useAuthStore";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuthStore();

  /** ✅ Logout handler */
  const handleLogout = useCallback(async () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      {
        text: "Annuler",
        onPress: () => {},
        style: "cancel",
      },
      {
        text: "Déconnecter",
        onPress: async () => {
          try {
            await logout();
            router.replace("/(authentication)/login");
          } catch (err: any) {
            Alert.alert("Erreur", "Impossible de se déconnecter.");
            console.error("Logout error:", err);
          }
        },
        style: "destructive",
      },
    ]);
  }, [logout]);

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

  /** 📦 Charger le profil depuis l’API */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getMyChild();
const fullProfile = {
          id: data?.id,
          name: data?.name || "N/D",
          avatar: data?.avatar || "https://cdn-icons-png.flaticon.com/512/1946/1946429.png",
          group: data?.classroom_name || "Classe inconnue",
          birthdate: data?.birthdate || "2020-01-01",
          age: getAge(data?.birthdate || "2020-01-01"),
          weight: data?.weight || "N/D",
          height: data?.height || "N/D",
          gender: data?.gender || "Fille",
          allergies: data?.allergies || "Aucune",
          conditions: data?.conditions || "Aucune",
          medication: data?.medication || "N/D",
          doctor: data?.doctor || "N/D",
          emergencyContact: {
            name: data?.emergency_contact_name || "N/D",
            relation: data?.emergency_contact_relation || "N/D",
            phone: data?.emergency_contact_phone || "N/D",
          },
          authorizedPickups: data?.authorized_pickups || [],
          classInfo: {
            teacherName: data?.teacher_name || "Inconnu",
            classroomName: data?.classroom_name || "N/D",
            responsibleName: data?.responsible_name || "N/D",
            responsiblePhone: data?.responsible_phone || "",
          },
        };

        setProfile(fullProfile);
      } catch (error: any) {
        console.error("❌ Erreur de chargement:", error.response?.data || error.message);
        Alert.alert("Erreur", "Impossible de charger le profil de l’enfant.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /** 🔁 Mise à jour d’un champ */
  const updateField = (key: string, value: any) => {
    setProfile((prev: any) => ({ ...prev, [key]: value }));
  };

  /** ☁️ Changer l’avatar */
  const handleChangeAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const uri = result.assets[0].uri;
        setLoading(true);
        const uploadedUrl = await uploadAvatar(uri);
        await updateChild(profile.id, { avatar: uploadedUrl });
        updateField("avatar", uploadedUrl);
        Alert.alert("✅ Succès", "Photo de profil mise à jour !");
      }
    } catch (error) {
      console.error("❌ Erreur de téléchargement:", error);
      Alert.alert("Erreur", "Impossible de mettre à jour la photo.");
    } finally {
      setLoading(false);
    }
  };

  /** 💾 Sauvegarder les modifications */
  const saveProfile = async () => {
    try {
      setLoading(true);
      const payload = {
        name: profile.name,
        birthdate: profile.birthdate,
        gender: profile.gender,
        allergies: profile.allergies,
        conditions: profile.conditions,
        medication: profile.medication,
        doctor: profile.doctor,
        weight: profile.weight,
        height: profile.height,
        emergency_contact_name: profile.emergencyContact?.name,
        emergency_contact_relation: profile.emergencyContact?.relation,
        emergency_contact_phone: profile.emergencyContact?.phone,
        authorized_pickups: profile.authorizedPickups || [],
      };
      await updateChild(profile.id, payload);
      Alert.alert("✅ Succès", "Profil mis à jour sur le serveur.");
      setIsEditing(false);
    } catch (error: any) {
      console.error("❌ Erreur de sauvegarde:", error.response?.data || error.message);
      Alert.alert("Erreur", "Impossible d’enregistrer les modifications.");
    } finally {
      setLoading(false);
    }
  };

  /** 📞 Appel téléphonique */
  const handlePhoneCall = useCallback((phone: string) => {
    if (!phone || phone === "N/D") return;
    const sanitized = phone.replace(/[^+\d]/g, "");
    const url = `tel:${sanitized}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) Linking.openURL(url);
        else Alert.alert("Erreur", "Impossible d'ouvrir le composeur téléphonique.");
      })
      .catch(() => Alert.alert("Erreur", "Une erreur est survenue lors de l'appel."));
  }, []);

  if (loading || !profile) {
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

        <View className="flex-row items-center gap-4">
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

          <TouchableOpacity onPress={handleLogout}>
            <LogOut color={colors.textDark} size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 🧱 Scroll content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
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
              <TouchableOpacity
                disabled={!isEditing}
                onPress={isEditing ? handleChangeAvatar : undefined}
              >
                <Image source={{ uri: profile?.avatar }} className="w-28 h-28 rounded-full mb-3" />
              </TouchableOpacity>
              {isEditing ? (
                <>
                  <TextInput
                    value={profile?.name}
                    onChangeText={(t) => updateField("name", t)}
                    className="text-center text-xl font-semibold border-b border-gray-300 w-48 mb-1"
                    style={{ color: colors.textDark }}
                  />
                  <TextInput
                    value={profile?.group}
                    editable={false}
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
                    {getAge(profile?.birthdate)} • {profile?.group}
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
                      value={new Date(profile?.birthdate || "2020-01-01")}
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

          {/* 🚗 Personnes autorisées */}
          <Card title="Personnes autorisées à récupérer l’enfant">
            {profile?.authorizedPickups?.length > 0 ? (
              profile.authorizedPickups.map((person: any, index: number) => (
                <View key={index} className="mb-3">
                  {renderRow(`👤 Nom ${index + 1}`, "", person.name, isEditing, (v) => {
                    const updated = [...profile.authorizedPickups];
                    updated[index] = { ...updated[index], name: v };
                    updateField("authorizedPickups", updated);
                  })}
                  {renderRow(
                    `📞 Téléphone ${index + 1}`,
                    "",
                    person.phone,
                    isEditing,
                    (v) => {
                      const updated = [...profile.authorizedPickups];
                      updated[index] = { ...updated[index], phone: v };
                      updateField("authorizedPickups", updated);
                    },
                    handlePhoneCall
                  )}
                  {renderRow(`👥 Relation ${index + 1}`, "", person.relation, isEditing, (v) => {
                    const updated = [...profile.authorizedPickups];
                    updated[index] = { ...updated[index], relation: v };
                    updateField("authorizedPickups", updated);
                  })}
                </View>
              ))
            ) : (
              <Text style={{ color: colors.text }}>Aucune personne autorisée</Text>
            )}

            {isEditing && (
              <TouchableOpacity
                onPress={() => {
                  const updated = [
                    ...(profile.authorizedPickups || []),
                    { name: "Nouveau", phone: "N/D", relation: "N/D" },
                  ];
                  updateField("authorizedPickups", updated);
                }}
                className="mt-3 self-end"
              >
                <Text style={{ color: colors.accent, fontWeight: "600" }}>+ Ajouter</Text>
              </TouchableOpacity>
            )}
          </Card>

          {/* 🚨 Contact d’urgence */}
          <Card title="Contact d’urgence">
            {renderRow("👤 Nom", "", profile?.emergencyContact?.name, isEditing, (v) =>
              updateField("emergencyContact", { ...profile?.emergencyContact, name: v })
            )}
            {renderRow("👥 Relation", "", profile?.emergencyContact?.relation, isEditing, (v) =>
              updateField("emergencyContact", { ...profile?.emergencyContact, relation: v })
            )}
            {renderRow(
              "📞 Téléphone",
              "",
              profile?.emergencyContact?.phone,
              isEditing,
              (v) => updateField("emergencyContact", { ...profile?.emergencyContact, phone: v }),
              handlePhoneCall
            )}
          </Card>

          {/* 🎓 Informations sur la classe */}
          <Card title="Informations sur la classe">
            {renderRow("👩‍🏫 Enseignant(e)", "", profile?.classInfo?.teacherName, isEditing, (v) =>
              updateField("classInfo", { ...profile?.classInfo, teacherName: v })
            )}
            {renderRow("🚪 Salle", "", profile?.classInfo?.classroomName, isEditing, (v) =>
              updateField("classInfo", { ...profile?.classInfo, classroomName: v })
            )}
            {renderRow("🧑 Responsable", "", profile?.classInfo?.responsibleName, isEditing, (v) =>
              updateField("classInfo", { ...profile?.classInfo, responsibleName: v })
            )}
            {renderRow(
              "📞 Téléphone",
              "",
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

/** 🧱 Ligne réutilisable */
function renderRow(
  label: string,
  key: string,
  value: string,
  editable: boolean,
  onChange: (v: string) => void,
  onPressPhone?: (v: string) => void
) {
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
            value={value}
            onChangeText={onChange}
            keyboardType={isPhoneField ? "phone-pad" : "default"}
            className="border-b border-gray-300 text-right"
            style={{ color: colors.textDark, minWidth: 100 }}
          />
        ) : isPhoneField && value && value !== "N/D" ? (
          <TouchableOpacity onPress={() => onPressPhone && onPressPhone(value)}>
            <Text
              style={{
                color: colors.accent,
                textAlign: "right",
                textDecorationLine: "underline",
              }}
            >
              {value}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text
            style={{
              color: colors.textDark,
              textAlign: "right",
              flexWrap: "wrap",
            }}
          >
            {value}
          </Text>
        )}
      </View>
    </View>
  );
}
